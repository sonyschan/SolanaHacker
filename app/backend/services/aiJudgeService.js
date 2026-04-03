/**
 * AI Judge Service for MemeNews
 *
 * Three AI judges (Gemini, Grok, ChatGPT) score daily memes on:
 * 1. Visual Quality (視覺品質) — composition, clarity, aesthetics
 * 2. News Clarity (新聞傳達力) — can you understand the news from the meme alone
 * 3. Meme Impact (迷因感染力) — humor, satire, shareability
 *
 * Batch mode: each judge receives ALL memes in a single call (3 images + prompt).
 * 3 API calls total instead of 9.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai').default;

const JUDGE_TIMEOUT = 90_000; // 90s per judge (batch is heavier)

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ]);
}

// ─── Batch Scoring Prompt ───────────────────────────────────────────────────

function buildBatchScoringPrompt(memes) {
  const memeDescriptions = memes.map((meme, i) => (
    `MEME ${i + 1} (id: ${meme.id}):
- Title: ${meme.title || 'Untitled'}
- Description: ${meme.description || 'N/A'}
- News Source: ${meme.newsSource || meme.metadata?.newsSource || 'N/A'}
- Tags: ${(meme.tags || []).join(', ') || 'N/A'}`
  )).join('\n\n');

  return `You are an expert meme critic and news analyst. You will see ${memes.length} memes. Score EACH meme on exactly 3 dimensions.

${memeDescriptions}

The images are provided in the same order as the memes above (Image 1 = Meme 1, Image 2 = Meme 2, etc.).

SCORING DIMENSIONS (each 0-10, use decimals like 7.5):
1. visual_quality — Composition, clarity, aesthetics. Is it well-designed? Clear focal point? Readable at thumbnail size?
2. news_clarity — Can someone who hasn't read the news understand WHAT happened just from this meme? Does the image + text convey the news story?
3. meme_impact — Humor, satire, shareability. Would someone screenshot this and send it to a group chat? Is it genuinely funny or clever?

RULES:
- Be honest and critical. Not every meme deserves high scores.
- Score each dimension independently for each meme.
- Provide brief reasoning per meme (1 sentence max).
- NEVER fabricate numbers or external data.

Respond with ONLY a valid JSON array (no markdown, no code blocks). One object per meme, in order:
[
  {"meme_id": "${memes[0]?.id}", "visual_quality": 0.0, "news_clarity": 0.0, "meme_impact": 0.0, "reasoning": "..."},
  ${memes.length > 1 ? `{"meme_id": "${memes[1]?.id}", "visual_quality": 0.0, "news_clarity": 0.0, "meme_impact": 0.0, "reasoning": "..."},` : ''}
  ${memes.length > 2 ? `{"meme_id": "${memes[2]?.id}", "visual_quality": 0.0, "news_clarity": 0.0, "meme_impact": 0.0, "reasoning": "..."}` : ''}
]`;
}

// ─── Image Fetching ─────────────────────────────────────────────────────────

async function fetchImageAsBase64(imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = res.headers.get('content-type') || 'image/png';
  return { base64, contentType };
}

/**
 * Ensure imageUrl is a full public URL (not a relative /generated/ path).
 * In production, GCS URLs are already absolute. Local fallback needs Cloud Run prefix.
 */
function resolvePublicImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  // Relative path — prepend Cloud Run base URL
  const baseUrl = process.env.API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';
  return baseUrl + imageUrl;
}

// ─── Gemini Judge (batch) ───────────────────────────────────────────────────

async function batchJudgeWithGemini(memes) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Gemini uses base64 inline data
  const imageParts = [];
  for (const meme of memes) {
    const url = resolvePublicImageUrl(meme.imageUrl);
    const { base64, contentType } = await fetchImageAsBase64(url);
    imageParts.push({ inlineData: { mimeType: contentType, data: base64 } });
  }

  const result = await withTimeout(
    model.generateContent([
      { text: buildBatchScoringPrompt(memes) },
      ...imageParts
    ]),
    JUDGE_TIMEOUT
  );

  const text = result.response.text();
  return { scores: parseBatchScores(text, memes), model: 'gemini-2.5-flash' };
}

// ─── Grok Judge (batch, raw fetch) ──────────────────────────────────────────

async function batchJudgeWithGrok(memes) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('XAI_API_KEY not configured');

  const modelId = 'grok-4-1-fast-non-reasoning';

  // Grok uses OpenAI-format image_url (public URLs)
  const contentParts = [
    { type: 'text', text: buildBatchScoringPrompt(memes) },
    ...memes.map(meme => ({
      type: 'image_url',
      image_url: { url: resolvePublicImageUrl(meme.imageUrl) }
    }))
  ];

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: contentParts }],
      max_tokens: 1000,
      temperature: 0.3
    }),
    signal: AbortSignal.timeout(JUDGE_TIMEOUT)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return { scores: parseBatchScores(text, memes), model: modelId };
}

// ─── ChatGPT Judge (batch) ──────────────────────────────────────────────────

async function batchJudgeWithChatGPT(memes) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const client = new OpenAI({ apiKey });
  const modelId = 'gpt-4o';

  // ChatGPT uses OpenAI-format image_url (public URLs)
  const contentParts = [
    { type: 'text', text: buildBatchScoringPrompt(memes) },
    ...memes.map(meme => ({
      type: 'image_url',
      image_url: { url: resolvePublicImageUrl(meme.imageUrl) }
    }))
  ];

  const response = await withTimeout(
    client.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: contentParts }],
      max_tokens: 1000,
      temperature: 0.3
    }),
    JUDGE_TIMEOUT
  );

  const text = response.choices?.[0]?.message?.content || '';
  return { scores: parseBatchScores(text, memes), model: modelId };
}

// ─── Score Parsing & Validation ─────────────────────────────────────────────

function parseBatchScores(text, memes) {
  // Extract JSON array from response
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    // Fallback: try to parse as single object (if LLM returned one meme only)
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const single = parseSingleScore(objMatch[0]);
      return { [memes[0].id]: single };
    }
    throw new Error(`No JSON array found in response: ${text.slice(0, 300)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch (e) {
    throw new Error(`Malformed JSON from LLM: ${e.message} — raw: ${match[0].slice(0, 300)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array from LLM');
  }

  // Map scores by meme ID
  const result = {};
  for (let i = 0; i < memes.length; i++) {
    const memeId = memes[i].id;
    // Match by index or by meme_id field
    const score = parsed[i] || parsed.find(s => s.meme_id === memeId);
    if (score) {
      result[memeId] = {
        visual_quality: clampScore(score.visual_quality),
        news_clarity: clampScore(score.news_clarity),
        meme_impact: clampScore(score.meme_impact),
        reasoning: String(score.reasoning || '').slice(0, 500)
      };
      const s = result[memeId];
      s.total = Math.round((s.visual_quality + s.news_clarity + s.meme_impact) * 10) / 10;
    }
  }

  return result;
}

function parseSingleScore(jsonStr) {
  const parsed = JSON.parse(jsonStr);
  const vq = clampScore(parsed.visual_quality);
  const nc = clampScore(parsed.news_clarity);
  const mi = clampScore(parsed.meme_impact);
  return {
    visual_quality: vq,
    news_clarity: nc,
    meme_impact: mi,
    total: Math.round((vq + nc + mi) * 10) / 10,
    reasoning: String(parsed.reasoning || '').slice(0, 500)
  };
}

function clampScore(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return 0;
  return Math.round(Math.min(10, Math.max(0, n)) * 10) / 10;
}

// ─── Judge all daily memes (batch mode) ─────────────────────────────────────

async function judgeDailyMemes(memes) {
  if (!memes || memes.length === 0) {
    return { error: 'No memes to judge', results: [] };
  }

  // Filter memes that have images
  const validMemes = memes.filter(m => m.imageUrl);
  if (validMemes.length === 0) {
    return { error: 'No memes with images to judge', results: [] };
  }

  console.log(`[AIJudge] Batch judging ${validMemes.length} memes with 3 judges...`);

  // Call all 3 judges in parallel, each receives ALL memes at once
  const judges = {
    gemini: batchJudgeWithGemini,
    grok: batchJudgeWithGrok,
    chatgpt: batchJudgeWithChatGPT
  };

  const judgeResults = await Promise.allSettled(
    Object.entries(judges).map(async ([name, fn]) => {
      try {
        const result = await fn(validMemes);
        console.log(`[AIJudge] ${name} (${result.model}): scored ${Object.keys(result.scores).length} memes`);
        return { name, ...result, status: 'success' };
      } catch (err) {
        console.error(`[AIJudge] ${name} failed:`, err.message);
        return { name, status: 'error', error: err.message, scores: {} };
      }
    })
  );

  // Flatten into per-judge results
  const judgeData = {};
  for (const r of judgeResults) {
    const val = r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'error', error: r.reason?.message, scores: {} };
    judgeData[val.name] = val;
  }

  // Build per-meme results
  const results = validMemes.map(meme => {
    const memeJudges = {};
    let totalSum = 0;
    let judgeCount = 0;
    const dimSums = { visual_quality: 0, news_clarity: 0, meme_impact: 0 };

    for (const [judgeName, judge] of Object.entries(judgeData)) {
      if (judge.status === 'success' && judge.scores[meme.id]) {
        const s = judge.scores[meme.id];
        memeJudges[judgeName] = { ...s, model: judge.model, status: 'success' };
        totalSum += s.total;
        judgeCount++;
        dimSums.visual_quality += s.visual_quality;
        dimSums.news_clarity += s.news_clarity;
        dimSums.meme_impact += s.meme_impact;
      } else {
        memeJudges[judgeName] = {
          status: 'error',
          error: judge.error || 'No score returned for this meme'
        };
      }
    }

    const averageTotal = judgeCount > 0 ? Math.round((totalSum / judgeCount) * 10) / 10 : 0;
    const dimensionAverages = judgeCount > 0 ? {
      visual_quality: Math.round((dimSums.visual_quality / judgeCount) * 10) / 10,
      news_clarity: Math.round((dimSums.news_clarity / judgeCount) * 10) / 10,
      meme_impact: Math.round((dimSums.meme_impact / judgeCount) * 10) / 10
    } : { visual_quality: 0, news_clarity: 0, meme_impact: 0 };

    console.log(`[AIJudge] ${meme.id}: avg=${averageTotal} (${judgeCount}/3 judges)`);

    return {
      memeId: meme.id,
      judges: memeJudges,
      averageTotal,
      dimensionAverages,
      judgeCount,
      judgedAt: new Date().toISOString()
    };
  });

  // Pick winner: highest averageTotal, tiebreaker: highest meme_impact
  let winner = null;
  for (const r of results) {
    if (!winner ||
        r.averageTotal > winner.averageTotal ||
        (r.averageTotal === winner.averageTotal &&
         r.dimensionAverages.meme_impact > winner.dimensionAverages.meme_impact)) {
      winner = r;
    }
  }

  if (winner) {
    winner.isWinner = true;
    console.log(`[AIJudge] Winner: ${winner.memeId} with avg=${winner.averageTotal}`);
  }

  return { results, winnerId: winner?.memeId || null };
}

module.exports = { judgeDailyMemes, buildBatchScoringPrompt };
