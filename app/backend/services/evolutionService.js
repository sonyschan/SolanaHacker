/**
 * Meme Evolution Service
 *
 * Weekly cycle: analyze meme quality with Vision AI → generate prompt patches → write to Firestore.
 * Triggered by Cloud Scheduler or manual endpoint.
 */

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Run the full evolution cycle.
 * 1. Fetch last 7 days of memes with quality scores
 * 2. Send top 5 + bottom 5 images to Gemini Vision
 * 3. Parse structured suggestions
 * 4. Write new patch to Firestore config/prompt_patches
 * @returns {{ success: boolean, summary: string, patchId?: string }}
 */
async function runEvolutionCycle() {
  const db = getFirestore();
  console.log('[Evolution] Starting weekly evolution cycle...');

  // ── Step 1: Collect meme data ──────────────────────────────
  const snap = await db.collection('memes')
    .orderBy('generatedAt', 'desc')
    .limit(150)
    .get();

  const memes = [];
  snap.forEach(doc => {
    const d = doc.data();
    if (d.type !== 'daily' || !d.imageUrl || !d.metadata?.qualityScore) return;
    memes.push({
      id: doc.id,
      title: d.title,
      score: d.metadata.qualityScore,
      strategy: d.metadata.strategyId,
      artStyle: d.metadata.artStyleId || d.metadata.artStyleName,
      caption: d.metadata?.memeIdea?.caption || d.prompt,
      imageUrl: d.imageUrl,
    });
  });

  memes.sort((a, b) => b.score - a.score);
  const top5 = memes.slice(0, 5);
  const bottom5 = memes.slice(-5);
  const avgScore = memes.length > 0 ? (memes.reduce((s, m) => s + m.score, 0) / memes.length).toFixed(1) : 0;

  console.log(`[Evolution] Analyzed ${memes.length} memes (avg: ${avgScore})`);

  if (memes.length < 10) {
    return { success: false, summary: `Not enough memes to analyze (${memes.length}, need 10+)` };
  }

  // ── Step 2: Fetch images and send to Gemini Vision ─────────
  const parts = [];
  parts.push({ text: `You are a meme quality evolution system. Analyze these AI-generated crypto memes and output ONLY a JSON object with specific prompt improvement rules.

Context: ${memes.length} memes, average score ${avgScore}/100.

I'll show TOP 5 (best) and BOTTOM 5 (worst) with their actual images.

After analysis, respond with ONLY valid JSON (no markdown, no explanation):
{
  "avgScore": ${avgScore},
  "topPatterns": ["what works well (2-3 items)"],
  "bottomPatterns": ["what fails (2-3 items)"],
  "newRules": ["specific prompt rules to add (3-5 rules, each a single actionable sentence)"],
  "deprecated": ["rules that should be removed or are no longer needed (0-2 items)"]
}

Rules must be specific and image-generation focused. Not generic advice.` });

  parts.push({ text: '\n\nTOP 5:' });
  for (const m of top5) {
    const img = await fetchImageBase64(m.imageUrl);
    if (img) {
      parts.push({ text: `"${m.title}" score:${m.score} style:${m.artStyle} strategy:${m.strategy}` });
      parts.push({ inlineData: img });
    }
  }

  parts.push({ text: '\n\nBOTTOM 5:' });
  for (const m of bottom5) {
    const img = await fetchImageBase64(m.imageUrl);
    if (img) {
      parts.push({ text: `"${m.title}" score:${m.score} style:${m.artStyle} strategy:${m.strategy}` });
      parts.push({ inlineData: img });
    }
  }

  console.log('[Evolution] Sending to Gemini Vision for analysis...');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(parts);
  const responseText = result.response.text();

  // ── Step 3: Parse response ─────────────────────────────────
  let analysis;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    analysis = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[Evolution] Failed to parse Gemini response:', err.message);
    console.error('[Evolution] Raw response:', responseText.slice(0, 500));
    return { success: false, summary: `Vision AI response parsing failed: ${err.message}` };
  }

  const newRules = analysis.newRules || [];
  if (newRules.length === 0) {
    return { success: true, summary: 'No new rules suggested — current prompt is performing well.' };
  }

  // ── Step 4: Write patch to Firestore ───────────────────────
  const now = new Date();
  const patchId = `auto-${now.toISOString().slice(0, 10)}`;
  const newPatch = {
    id: patchId,
    version: 'auto',
    date: now.toISOString().slice(0, 10),
    enabled: true,
    source: `gemini-2.5-flash evolution cycle (${memes.length} memes, avg ${avgScore})`,
    rules: newRules,
    analysis: {
      topPatterns: analysis.topPatterns || [],
      bottomPatterns: analysis.bottomPatterns || [],
      deprecated: analysis.deprecated || [],
    },
  };

  // Read current patches, add new one, keep only last 5 auto-patches
  const configRef = db.collection('config').doc('prompt_patches');
  const configDoc = await configRef.get();
  const existing = configDoc.exists ? (configDoc.data().patches || []) : [];

  // Remove old auto-patches beyond 5 (keep manual ones)
  const manualPatches = existing.filter(p => !p.id.startsWith('auto-'));
  const autoPatches = existing.filter(p => p.id.startsWith('auto-'));
  if (autoPatches.length >= 5) {
    autoPatches.shift(); // remove oldest
  }

  const allPatches = [...manualPatches, ...autoPatches, newPatch];

  await configRef.set({
    version: patchId,
    updatedAt: now.toISOString(),
    updatedBy: 'evolution_cycle',
    patches: allPatches,
  });

  const summary = `Evolution cycle complete. Added patch "${patchId}" with ${newRules.length} rules. Avg score: ${avgScore}. Total patches: ${allPatches.length}.`;
  console.log(`[Evolution] ${summary}`);

  return { success: true, summary, patchId, rules: newRules, analysis };
}

async function fetchImageBase64(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const mime = r.headers.get('content-type') || 'image/jpeg';
    return { data: buf.toString('base64'), mimeType: mime };
  } catch { return null; }
}

module.exports = { runEvolutionCycle };
