const { GoogleGenerativeAI } = require('@google/generative-ai');
const templates = require('../data/meme-templates.json');
const strategyService = require('./memeStrategyService');
const narrativeService = require('./memeNarrativeService');
const v1Legacy = require('./memeV1Legacy');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Crypto-native terms for validation
const CRYPTO_TERMS = [
  'ape', 'aped', 'aping', 'degen', 'degens', 'ngmi', 'wagmi', 'rekt',
  'hodl', 'hodling', 'rug', 'rugged', 'pump', 'pumped', 'pumping',
  'dump', 'dumped', 'dumping', 'moon', 'mooning', 'fomo', 'fud',
  'gm', 'ser', 'anon', 'bags', 'bag', 'bagholding', 'chad', 'based',
  'cope', 'coping', 'copium', 'shill', 'shilling', 'alpha', 'beta',
  'whale', 'whales', 'diamond', 'paper', 'hands', 'floor', 'mint',
  'minting', 'gas', 'yield', 'farm', 'farming', 'stake', 'staking',
  'airdrop', 'memecoin', 'altcoin', 'btc', 'eth', 'sol', 'solana',
  'bitcoin', 'crypto', 'nft', 'dao', 'defi', 'web3', 'onchain',
  'bullish', 'bearish', 'bull', 'bear', 'liquidated', 'leverage',
  'long', 'short', 'portfolio', 'wallet', 'seed', 'phrase',
  'lambo', 'wen', 'probably', 'nothing', 'few', 'understand',
  'ngmi', 'gmi', 'lfg', 'iykyk', 'ct', 'frens'
];

// Style modes — meme_native is the default for daily memes
const STYLE_MODES = {
  meme_native: 'Classic internet meme style. Intentionally low resolution look. Slight compression artifacts. Flat colors. MS Paint aesthetic. Imperfect hand-drawn look. Uneven line art. Slightly awkward proportions. Low effort meme vibe. Mild JPEG artifacts. NOT cinematic. NOT realistic 3D. NOT polished illustration. White Impact font text with black outline.',
  stylized_illustration: 'Clean digital illustration style. Slightly polished but still meme-readable. Vibrant colors, clear composition. Think modern meme art — better than MS Paint but not trying to be gallery art.',
  stylized_pixel: 'Retro pixel art style, 16-bit aesthetic. Chunky pixels, limited color palette. Nostalgic gaming vibes. Text in pixel font or bold overlay.'
};

// Category → template affinity mapping
const CATEGORY_BONUSES = {
  A: ['wojak', 'this_is_fine', 'surprised_pikachu', 'drake', 'two_buttons', 'clown_makeup'],
  B: ['always_has_been', 'expanding_brain', 'bell_curve', 'astronaut_earth'],
  C: ['distracted_boyfriend', 'npc_chad', 'gigachad', 'spongebob_mocking']
};

const MS_PER_DAY = 86400000;

/**
 * Select a V1 art style not used in the last 7 days.
 * Returns { id, name, prompt }.
 */
function selectArtStyle(recentThemes = [], overrideArtStyleId = null) {
  if (overrideArtStyleId) {
    const found = v1Legacy.V1_ART_STYLES.find(s => s.id === overrideArtStyleId);
    if (found) return found;
  }
  const now = Date.now();
  const recentStyleIds = recentThemes
    .filter(t => t.artStyleId && t.generatedAt)
    .filter(t => (now - Date.parse(t.generatedAt)) < 7 * MS_PER_DAY)
    .map(t => t.artStyleId);
  return v1Legacy.pickFreshStyle(recentStyleIds);
}

/**
 * Compute soft cooldown weight for an archetype based on date-aware recency.
 * Uses actual generatedAt timestamps instead of array position.
 */
function getArchetypeCooldownWeight(archetype, recentThemes) {
  if (!archetype || !recentThemes || recentThemes.length === 0) return 1.0;

  const now = Date.now();
  let minDaysAgo = Infinity;

  for (const theme of recentThemes) {
    if (theme.archetype !== archetype) continue;
    if (!theme.generatedAt) continue;
    const daysAgo = (now - Date.parse(theme.generatedAt)) / MS_PER_DAY;
    if (daysAgo < minDaysAgo) minDaysAgo = daysAgo;
  }

  if (minDaysAgo < 3) return 0.05;  // near-block: 95% reduction
  if (minDaysAgo < 7) return 0.2;   // heavy: 80% reduction
  return 1.0;
}

/**
 * Hard block any template reused within 14 days.
 * Returns 0 (hard block) or 1.0 (no penalty).
 */
function getTemplateBlockWeight(templateId, recentThemes) {
  if (!templateId || !recentThemes || recentThemes.length === 0) return 1.0;

  const now = Date.now();
  for (const theme of recentThemes) {
    if (theme.templateId !== templateId) continue;
    if (!theme.generatedAt) continue;
    if ((now - Date.parse(theme.generatedAt)) / MS_PER_DAY < 14) return 0;  // hard block
  }

  return 1.0;
}

/**
 * Select a template based on event content, category, and anti-repetition.
 * Pure function (deterministic scoring + small random tiebreaker).
 */
function selectTemplate(event, recentThemes = [], overrideTemplateId = null) {
  if (overrideTemplateId) {
    const found = templates.find(t => t.id === overrideTemplateId);
    if (found) return found;
  }
  const eventText = (event.title || event).toLowerCase();
  const category = event.category || null;

  const scored = templates.map(t => {
    // Hard block: template used within 14 days
    if (getTemplateBlockWeight(t.id, recentThemes) === 0) {
      return { template: t, score: -1 };
    }

    let score = 0;
    for (const tag of t.suitability_tags) {
      if (eventText.includes(tag)) score += 2;
    }
    for (const tag of t.emotion_tags) {
      if (eventText.includes(tag)) score += 1;
    }
    if (category && CATEGORY_BONUSES[category]) {
      if (CATEGORY_BONUSES[category].includes(t.id)) score += 3;
    }
    // Archetype cooldown — date-aware soft penalty
    score *= getArchetypeCooldownWeight(t.archetype, recentThemes);

    score += Math.random() * 0.5;

    return { template: t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.find(s => s.score >= 0);
  return best ? best.template : templates[Math.floor(Math.random() * templates.length)];
}

// Format slot limits for LLM prompt
function formatSlotLimits(template) {
  if (!template.slot_limits) return '';
  return Object.entries(template.slot_limits)
    .map(([slot, maxChars]) => `  - ${slot}: max ${maxChars} characters`)
    .join('\n');
}

/**
 * Generate a meme idea using LLM. Caption-first, slot-based limits.
 */
async function generateMemeIdea(event, template, recentThemes = [], strategy = null, narrative = null) {
  const newsTitle = event.title || event;

  let recentContext = '';
  if (recentThemes.length > 0) {
    const themesList = recentThemes
      .slice(0, 10)
      .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
      .join('\n');
    recentContext = `\nAVOID these recent themes — make something FRESH:\n${themesList}\n`;
  }

  const slotLimitsText = formatSlotLimits(template);
  const maxLines = template.max_lines || 2;

  const prompt = `You are a Crypto Twitter meme lord. Generate a meme idea for the "${template.name}" template.

NEWS EVENT: "${newsTitle}"
TEMPLATE: ${template.name}
TEMPLATE FORMAT: ${template.caption_format}
TEMPLATE LAYOUT: ${template.layout_guidance}
${recentContext}
CAPTION SLOT LIMITS (MANDATORY — respect character limits per slot):
${slotLimitsText}
Overall: No more than ${maxLines} lines of main text${maxLines > 2 ? ' (multi-panel template)' : ''}.

CRITICAL RULE:
Each caption slot MUST be <= 6 words. Prefer short phrases, not full sentences.
Examples of GOOD captions: "Buying the dip", "Getting liquidated again", "My long position", "Still buying"
Examples of BAD captions: "My portfolio after degen dip buy", "Me when I see the market crash and buy more"

FORBIDDEN PATTERNS (HARD RULES — never use these):
- DO NOT use "My + verb-ing" (e.g., "My buying", "My holding", "My selling")
- Avoid "My portfolio after ..."
- Avoid explanatory words: "because", "therefore", "caused by", "from that?"
- Avoid full sentences. Use fragments.

GOOD caption examples:
"Buying the dip" / "Still holding" / "Exit liquidity" / "Added leverage" / "Rug pulled again"

BAD caption examples:
"My buying his bags" / "My portfolio after degen dip buy" / "Getting rekt because of leverage"

MEME GRAMMAR RULES (MANDATORY):
1. First-person POV required — use me/my/I/we (e.g., "me buying the dip", "my portfolio after")
2. Use phrases crypto traders actually say on Twitter. Avoid formal or explanatory language.
3. Caption should feel like immediate emotional reaction, not description.
4. Setup + twist structure — the joke needs a punchline or ironic reversal
5. DO NOT explain the joke. No "when you realize" or "that moment when" — just the caption.
6. The caption must work WITH the template visual — don't describe the image in the caption.
${strategy ? '\n' + strategyService.formatStrategyPrompt(strategy) + '\n' : ''}
${narrative ? '\n' + narrativeService.formatNarrativePrompt(narrative) + '\n' : ''}
${strategyService.formatPunchlineLibrary()}

OUTPUT FORMAT — respond with ONLY this JSON, no markdown:
{
  "template_id": "${template.id}",
  "caption": "The main caption text (summary across all slots)",
  "caption_slots": ${getCaptionSlotsExample(template)},
  "visual_description": "Brief description of what the image should show beyond the standard template layout",
  "emotion": "primary emotion (one word)",
  "twist": "What makes this funny — the ironic reversal or punchline",
  "event_angle": "How this connects to the news event"
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in meme idea response');
  }

  const memeIdea = JSON.parse(jsonMatch[0]);
  memeIdea.template_id = template.id;
  return memeIdea;
}

/**
 * Retry a meme idea — keep template_id, visual_description, event_angle.
 * Only rewrite caption, caption_slots, twist (editor pass).
 */
async function retryMemeIdea(previousIdea, fixSuggestions, template, strategy = null, narrative = null) {
  const suggestionsText = (fixSuggestions || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const slotLimitsText = formatSlotLimits(template);

  const prompt = `You are a Crypto Twitter meme lord. REWRITE this meme's caption and twist. Keep the same template and angle.

TEMPLATE: ${template.name} (${template.id})
ORIGINAL CAPTION: "${previousIdea.caption}"
ORIGINAL CAPTION SLOTS: ${JSON.stringify(previousIdea.caption_slots)}
ORIGINAL TWIST: "${previousIdea.twist}"
EVENT ANGLE (KEEP THIS): "${previousIdea.event_angle}"
VISUAL DESCRIPTION (KEEP THIS): "${previousIdea.visual_description}"

ISSUES TO FIX:
${suggestionsText}

CAPTION SLOT LIMITS:
${slotLimitsText}

CRITICAL RULE: Each caption slot MUST be <= 6 words. Short phrases, not sentences.
GOOD: "Buying the dip" / BAD: "My portfolio after degen dip buy"

FORBIDDEN PATTERNS:
- NO "My + verb-ing" (e.g., "My buying", "My holding")
- NO "My portfolio after ..."
- NO explanatory words: "because", "therefore", "caused by"
- Use fragments, not full sentences.

RULES: First-person POV. Use phrases crypto traders actually say on Twitter — no formal language. Caption = immediate emotional reaction, not description. Setup + twist, no joke explanation.
${strategy ? `\nSTRATEGY (KEEP THIS — do NOT change the comedy angle): ${strategy.strategy_name}\n${strategy.definition}\n` : ''}
${narrative ? `\nNARRATIVE (KEEP THIS — maintain the emotional tone): ${narrative.narrative_name}\nEMOTION: ${narrative.emotion} | ROLE: ${narrative.trader_role}\nINSPIRATION PHRASE (do NOT copy verbatim): "${narrative.selectedPhrase}"\n` : ''}
${strategyService.formatPunchlineLibrary()}

IMPORTANT: Make the rewritten caption MORE ORIGINAL than the previous attempt. Use a different punchline pattern or angle.

Respond with ONLY this JSON:
{
  "template_id": "${template.id}",
  "caption": "Rewritten caption",
  "caption_slots": ${getCaptionSlotsExample(template)},
  "visual_description": "${previousIdea.visual_description || ''}",
  "emotion": "primary emotion",
  "twist": "Rewritten twist",
  "event_angle": "${previousIdea.event_angle || ''}"
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in retry meme idea response');
  }

  const memeIdea = JSON.parse(jsonMatch[0]);
  memeIdea.template_id = template.id;
  // Preserve fields that should not change
  memeIdea.visual_description = memeIdea.visual_description || previousIdea.visual_description;
  memeIdea.event_angle = memeIdea.event_angle || previousIdea.event_angle;
  // Guard: if LLM echoed the placeholder, reconstruct caption from slots
  if (!memeIdea.caption || memeIdea.caption === 'Rewritten caption') {
    const slotValues = Object.values(memeIdea.caption_slots || {}).filter(Boolean);
    memeIdea.caption = slotValues.length > 0 ? slotValues.join(' | ') : previousIdea.caption;
  }
  return memeIdea;
}

/**
 * Evaluate a meme idea using LLM quality gate.
 * v3: 6 criteria, twist_strength+originality weighted double. Max 40, pass >= 82.
 * Returns { pass, score, scores, failure_reasons[], fix_suggestions[] }
 */
async function evaluateMemeIdea(memeIdea, recentCaptions = [], strategy = null) {
  // Build recent captions context for originality check
  let recentCaptionsText = '';
  if (recentCaptions.length > 0) {
    recentCaptionsText = `\nRECENT CAPTIONS (for originality check — new caption must be meaningfully different):\n${recentCaptions.slice(0, 15).map(c => `- "${c}"`).join('\n')}\n`;
  }

  let strategyText = '';
  if (strategy) {
    strategyText = `\nSTRATEGY USED: ${strategy.strategy_name} — ${strategy.definition}\n`;
  }

  const prompt = `Rate this crypto meme idea on 6 criteria (1-5 each).

TEMPLATE: ${memeIdea.template_id}
CAPTION: "${memeIdea.caption}"
CAPTION SLOTS: ${JSON.stringify(memeIdea.caption_slots)}
EMOTION: ${memeIdea.emotion}
TWIST: ${memeIdea.twist}
${strategyText}${recentCaptionsText}
SCORING CRITERIA (1-5 each):
1. template_familiarity: Does the caption fit how this meme template is actually used on the internet? (culturally correct, not just technically correct)
2. caption_punchiness: Each slot MUST be <= 6 words. Score 1 if any slot exceeds 6 words. Is it a short punchy phrase (like "Buying the dip") or a wordy sentence? Immediate emotional reaction > description.
3. crypto_nativeness: Does it sound like phrases crypto traders actually say on Twitter? Not formal or corporate language?
4. immediacy: Does it connect to a real, current event in a specific (not generic) way?
5. twist_strength: Does the caption contain irony, contradiction, or unexpected reaction? (1-5, WEIGHTED DOUBLE)
6. originality_score: Is this caption meaningfully different from RECENT CAPTIONS? If semantically too close to any recent caption, score <=2. If clearly different angle/punchline, score 4-5. (1-5, WEIGHTED DOUBLE)

Respond with ONLY this JSON:
{
  "scores": {
    "template_familiarity": 0,
    "caption_punchiness": 0,
    "crypto_nativeness": 0,
    "immediacy": 0,
    "twist_strength": 0,
    "originality_score": 0
  },
  "raw_total": 0,
  "failure_reasons": ["list specific problems if any criteria scored <= 2, otherwise empty array"],
  "fix_suggestions": ["actionable fixes for each failure_reason, otherwise empty array"]
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { pass: true, score: 80, scores: {}, failure_reasons: [], fix_suggestions: [] };
  }

  const evaluation = JSON.parse(jsonMatch[0]);
  // v3 weighting: 4 base×5 + twist×2 + originality×2 = 40 max
  const scores = evaluation.scores || {};
  const weightedTotal = (scores.template_familiarity || 0)
    + (scores.caption_punchiness || 0)
    + (scores.crypto_nativeness || 0)
    + (scores.immediacy || 0)
    + (scores.twist_strength || 0) * 2
    + (scores.originality_score || 0) * 2;
  const maxWeighted = 40;
  evaluation.score = Math.round((weightedTotal / maxWeighted) * 100);
  evaluation.pass = evaluation.score >= 82;
  evaluation.failure_reasons = evaluation.failure_reasons || [];
  evaluation.fix_suggestions = evaluation.fix_suggestions || [];

  // Hard fail: "My + verb-ing" pattern (code-level, not LLM-dependent)
  const slots = memeIdea.caption_slots || {};
  const myVerbingRegex = /^my\s+\w+ing\b/i;
  for (const [slot, text] of Object.entries(slots)) {
    if (myVerbingRegex.test(text)) {
      evaluation.pass = false;
      evaluation.failure_reasons.push('Invalid grammar pattern: My + verb-ing');
      evaluation.fix_suggestions.push(`Rewrite slot "${slot}": avoid "My + verb-ing" pattern`);
    }
  }

  // Hard fail: low originality (code-level)
  if ((scores.originality_score || 0) <= 2) {
    evaluation.pass = false;
    if (!evaluation.failure_reasons.includes('Low originality vs recent captions')) {
      evaluation.failure_reasons.push('Low originality vs recent captions');
      evaluation.fix_suggestions.push(`Change angle using strategy: ${strategy?.strategy_name || 'any'}`);
      evaluation.fix_suggestions.push('Use different punchline pattern');
    }
  }

  return evaluation;
}

/**
 * Build image prompt from meme idea + style mode. Pure function.
 * Uses layout_instructions for panel-by-panel positioning.
 */
function buildImagePrompt(memeIdea, artStyle = null) {
  const template = templates.find(t => t.id === memeIdea.template_id);
  const layoutInstructions = template?.layout_instructions || template?.layout_guidance || '';
  // Use V1 art style prompt if provided, otherwise fall back to meme_native
  const styleInstruction = artStyle?.prompt || STYLE_MODES.meme_native;

  const hasSlots = memeIdea.caption_slots && Object.keys(memeIdea.caption_slots).length > 0;

  // Build per-slot text placement from layout_instructions
  let captionPlacement;
  if (hasSlots) {
    // Replace {slot_name} placeholders in layout_instructions with actual text
    captionPlacement = layoutInstructions;
    for (const [slot, text] of Object.entries(memeIdea.caption_slots)) {
      captionPlacement = captionPlacement.replace(`{${slot}}`, text);
    }
  } else {
    captionPlacement = layoutInstructions.replace(/\{[^}]+\}/g, memeIdea.caption || '');
  }

  return `Create a meme image using the "${memeIdea.template_id}" meme template format.

LAYOUT AND TEXT PLACEMENT:
${captionPlacement}
Text style: BIG BOLD Impact font with black outline, clearly legible against background.

VISUAL DETAILS: ${memeIdea.visual_description || ''}
EMOTION/MOOD: ${memeIdea.emotion || 'funny'}

ART STYLE: ${styleInstruction}

CRITICAL — TEXT RULES:
- Each text element must appear EXACTLY ONCE in the image. NEVER render the same text twice.
- Only render the text specified in LAYOUT AND TEXT PLACEMENT above. Do NOT add extra text.
- If the layout specifies 2 text regions, the image must contain exactly 2 text regions — no more, no less.

Technical requirements:
- Square aspect ratio (1:1)
- High contrast colors for visual impact
- 1024x1024 pixels resolution
- The meme template format must be immediately recognizable`;
}

/**
 * Validate caption against slot limits and meme grammar. Pure function.
 * Checks per-slot character limits, first-person POV, and crypto terms.
 */
function validateCaption(memeIdea, template) {
  const issues = [];

  // Per-slot character limit check
  if (template?.slot_limits && memeIdea.caption_slots) {
    for (const [slot, maxChars] of Object.entries(template.slot_limits)) {
      const slotText = memeIdea.caption_slots[slot];
      if (!slotText) {
        issues.push(`Slot '${slot}' is empty (required by template)`);
      } else if (slotText.length > maxChars) {
        issues.push(`Slot '${slot}' is ${slotText.length} chars (max ${maxChars})`);
      }
    }
  }

  // Per-slot word count check (<= 6 words)
  if (memeIdea.caption_slots) {
    for (const [slot, text] of Object.entries(memeIdea.caption_slots)) {
      if (text && text.split(/\s+/).filter(Boolean).length > 6) {
        issues.push(`Slot '${slot}' exceeds 6 words`);
      }
    }
  }

  // Per-slot forbidden pattern check
  const myVerbingRegex = /^my\s+\w+ing\b/i;
  if (memeIdea.caption_slots) {
    for (const [slot, text] of Object.entries(memeIdea.caption_slots)) {
      if (text && myVerbingRegex.test(text)) {
        issues.push(`Slot '${slot}' uses forbidden "My + verb-ing" pattern`);
      }
    }
  }

  // First-person check (across all text)
  const allText = memeIdea.caption_slots
    ? Object.values(memeIdea.caption_slots).join(' ')
    : (memeIdea.caption || '');
  const lowerText = allText.toLowerCase();

  const firstPersonTerms = ['me ', 'my ', 'i ', 'we ', 'our ', "i'm", "i've", "we're", 'myself'];
  const hasFirstPerson = firstPersonTerms.some(t => lowerText.includes(t));
  if (!hasFirstPerson) {
    issues.push('Missing first-person POV (me/my/I/we)');
  }

  // Crypto-native term check (≥1 crypto term OR strategy punchline pattern)
  const hasCryptoTerm = CRYPTO_TERMS.some(t => {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    return regex.test(allText);
  });
  const hasPunchline = strategyService.PUNCHLINE_LIBRARY.some(p =>
    lowerText.includes(p.toLowerCase())
  );
  if (!hasCryptoTerm && !hasPunchline) {
    issues.push('No crypto-native terms or punchline patterns found');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// Helper: generate caption_slots example based on template format
function getCaptionSlotsExample(template) {
  switch (template.caption_format) {
    case 'two_panel':
      return '{"reject": "thing being rejected", "approve": "thing being approved"}';
    case 'three_label':
      return '{"boyfriend": "label", "other_person": "label", "girlfriend": "label"}';
    case 'multi_panel':
      return '{"panel_1": "...", "panel_2": "...", "panel_3": "...", "panel_4": "..."}';
    case 'single_caption':
      return '{"caption": "the single caption text"}';
    case 'two_section':
      return '{"i_receive": "...", "you_receive": "..."}';
    case 'two_speaker':
      return '{"speaker_1": "Wait, it\'s all...?", "speaker_2": "Always has been"}';
    case 'two_choice':
      return '{"button_1": "choice A", "button_2": "choice B"}';
    case 'three_tier':
      return '{"low_iq": "simple take", "midwit": "overthinking", "genius": "same simple take"}';
    case 'alternating_case':
      return '{"mocking_text": "tHe MoCkInG tExT"}';
    case 'setup_punchline':
      return '{"setup": "does X", "punchline": "shocked when Y happens"}';
    default:
      return '{"text": "caption text"}';
  }
}

/**
 * Check if a meme qualifies for NFT minting based on visual uniqueness rules.
 * Rule 1: template not reused within 14 days
 * Rule 2: archetype not reused within 7 days (unless all 4 archetypes exhausted)
 */
function checkMintEligibility(templateId, archetype, recentThemes) {
  const now = Date.now();

  // Rule 1: template not used in 14 days
  const templateUsedIn14d = recentThemes.some(t =>
    t.templateId === templateId &&
    t.generatedAt &&
    (now - Date.parse(t.generatedAt)) < 14 * MS_PER_DAY
  );
  if (templateUsedIn14d) {
    return { mintEligible: false, mintReason: 'visual_template_id repeated within 14 days' };
  }

  // Rule 2: archetype not used in 7 days
  const archetypeUsedIn7d = recentThemes.some(t =>
    t.archetype === archetype &&
    t.generatedAt &&
    (now - Date.parse(t.generatedAt)) < 7 * MS_PER_DAY
  );
  if (archetypeUsedIn7d) {
    // Fallback: if all 4 archetypes exhausted in 7-day window, allow
    const allArchetypes = [...new Set(templates.map(t => t.archetype).filter(Boolean))];
    const usedArchetypes7d = new Set(
      recentThemes
        .filter(t => t.archetype && t.generatedAt && (now - Date.parse(t.generatedAt)) < 7 * MS_PER_DAY)
        .map(t => t.archetype)
    );
    if (allArchetypes.every(a => usedArchetypes7d.has(a))) {
      return { mintEligible: true, mintReason: null };
    }
    return { mintEligible: false, mintReason: 'visual_archetype repeated within 7 days' };
  }

  return { mintEligible: true, mintReason: null };
}

/**
 * Generate an original meme idea (Mode B) — no template, free composition.
 * Uses V2 caption rules (≤6 words/slot, first-person, crypto-native)
 * but lets the AI compose the visual scene freely.
 */
async function generateOriginalMemeIdea(event, recentThemes = [], strategy = null, narrative = null) {
  const newsTitle = event.title || event;

  let recentContext = '';
  if (recentThemes.length > 0) {
    const themesList = recentThemes
      .slice(0, 10)
      .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
      .join('\n');
    recentContext = `\nAVOID these recent themes — make something FRESH:\n${themesList}\n`;
  }

  const prompt = `You are a Crypto Twitter meme lord AND a creative visual artist. Generate an ORIGINAL meme concept — no template, free composition.

NEWS EVENT: "${newsTitle}"
${recentContext}
CAPTION RULES (MANDATORY):
- Simple top_text + bottom_text layout (classic meme format)
- Each slot MUST be <= 6 words. Short punchy phrases, not sentences.
- First-person POV required — use me/my/I/we
- Use phrases crypto traders actually say on Twitter
- Setup + twist structure — the joke needs a punchline or ironic reversal
- DO NOT explain the joke

FORBIDDEN PATTERNS:
- NO "My + verb-ing" (e.g., "My buying", "My holding")
- NO "My portfolio after ..."
- NO explanatory words: "because", "therefore", "caused by"
- Use fragments, not full sentences.

VISUAL SCENE (THIS IS THE KEY — be creative):
- Describe a vivid, original visual scene that MAKES the joke work
- Think beyond standard meme templates — invent the composition
- The scene should be memorable, shareable, visually striking
- Include character poses, expressions, environment, key visual elements
- The visual_description should be detailed enough to generate a unique image
${strategy ? '\n' + strategyService.formatStrategyPrompt(strategy) + '\n' : ''}
${narrative ? '\n' + narrativeService.formatNarrativePrompt(narrative) + '\n' : ''}
${strategyService.formatPunchlineLibrary()}

OUTPUT FORMAT — respond with ONLY this JSON, no markdown:
{
  "caption": "Summary caption (top + bottom combined)",
  "caption_slots": {"top_text": "setup phrase", "bottom_text": "punchline phrase"},
  "visual_description": "Detailed creative scene description — characters, poses, environment, key visual elements. This directs the entire image composition.",
  "emotion": "primary emotion (one word)",
  "twist": "What makes this funny — the ironic reversal or punchline",
  "event_angle": "How this connects to the news event"
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in original meme idea response');
  }

  const memeIdea = JSON.parse(jsonMatch[0]);
  memeIdea.template_id = null; // Mode B: no template
  return memeIdea;
}

/**
 * Retry an original meme idea — keep visual_description + event_angle.
 * Rewrite caption, caption_slots, twist.
 */
async function retryOriginalMemeIdea(previousIdea, fixSuggestions, strategy = null, narrative = null) {
  const suggestionsText = (fixSuggestions || []).map((s, i) => `${i + 1}. ${s}`).join('\n');

  const prompt = `You are a Crypto Twitter meme lord. REWRITE this original meme's caption and twist. Keep the visual scene and angle.

ORIGINAL CAPTION: "${previousIdea.caption}"
ORIGINAL CAPTION SLOTS: ${JSON.stringify(previousIdea.caption_slots)}
ORIGINAL TWIST: "${previousIdea.twist}"
EVENT ANGLE (KEEP THIS): "${previousIdea.event_angle}"
VISUAL DESCRIPTION (KEEP THIS): "${previousIdea.visual_description}"

ISSUES TO FIX:
${suggestionsText}

CRITICAL RULE: Each caption slot MUST be <= 6 words. Short phrases, not sentences.
GOOD: "Buying the dip" / BAD: "My portfolio after degen dip buy"

FORBIDDEN PATTERNS:
- NO "My + verb-ing" (e.g., "My buying", "My holding")
- NO "My portfolio after ..."
- NO explanatory words: "because", "therefore", "caused by"
- Use fragments, not full sentences.

RULES: First-person POV. Crypto Twitter language. Immediate emotional reaction, not description. Setup + twist.
${strategy ? `\nSTRATEGY (KEEP THIS): ${strategy.strategy_name}\n${strategy.definition}\n` : ''}
${narrative ? `\nNARRATIVE (KEEP THIS): ${narrative.narrative_name}\nEMOTION: ${narrative.emotion} | ROLE: ${narrative.trader_role}\n` : ''}
${strategyService.formatPunchlineLibrary()}

IMPORTANT: Make the rewritten caption MORE ORIGINAL. Use a different punchline pattern.

Respond with ONLY this JSON:
{
  "caption": "Rewritten caption",
  "caption_slots": {"top_text": "rewritten setup", "bottom_text": "rewritten punchline"},
  "visual_description": "${(previousIdea.visual_description || '').replace(/"/g, '\\"')}",
  "emotion": "primary emotion",
  "twist": "Rewritten twist",
  "event_angle": "${(previousIdea.event_angle || '').replace(/"/g, '\\"')}"
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in retry original meme idea response');
  }

  const memeIdea = JSON.parse(jsonMatch[0]);
  memeIdea.template_id = null; // Mode B: no template
  memeIdea.visual_description = memeIdea.visual_description || previousIdea.visual_description;
  memeIdea.event_angle = memeIdea.event_angle || previousIdea.event_angle;
  if (!memeIdea.caption || memeIdea.caption === 'Rewritten caption') {
    const slotValues = Object.values(memeIdea.caption_slots || {}).filter(Boolean);
    memeIdea.caption = slotValues.length > 0 ? slotValues.join(' | ') : previousIdea.caption;
  }
  return memeIdea;
}

/**
 * Build image prompt for Mode B originals — V1-style free composition.
 * Uses visual_description as primary composition + V1 art style.
 */
function buildOriginalImagePrompt(memeIdea, artStyle) {
  const topText = memeIdea.caption_slots?.top_text || '';
  const bottomText = memeIdea.caption_slots?.bottom_text || '';
  const styleInstruction = artStyle?.prompt || STYLE_MODES.meme_native;

  return `Create an original meme image with a unique, creative composition.

VISUAL SCENE (primary — this defines the entire image):
${memeIdea.visual_description || 'A vivid crypto-themed scene'}

EMOTION/MOOD: ${memeIdea.emotion || 'funny'}

ART STYLE: ${styleInstruction}

TEXT OVERLAY (render each line EXACTLY ONCE — no duplicates):
${topText ? `- TOP: "${topText}" — BIG BOLD Impact font with black outline at the top` : ''}
${bottomText ? `- BOTTOM: "${bottomText}" — BIG BOLD Impact font with black outline at the bottom` : ''}

CRITICAL — TEXT RULES:
- Each text element must appear EXACTLY ONCE in the image. NEVER render the same text twice.
- Only render the text specified in TEXT OVERLAY above. Do NOT add extra text.
- The image must contain exactly ${[topText, bottomText].filter(Boolean).length} text region(s) — no more, no less.

Technical requirements:
- Square aspect ratio (1:1)
- High contrast colors for visual impact
- NFT-quality artwork suitable for collection
- 1024x1024 pixels resolution
- Clean composition with balanced visual elements`;
}

/**
 * Evaluate a meme image via Gemini vision. Public-facing wrapper.
 * Downloads image from URL, sends to Gemini 2.5 Flash with hidden 6D scoring prompt.
 * Returns simplified { score, pass, grade, suggestions[] } — criteria details hidden.
 *
 * @param {string} imageUrl - Public URL of the meme image
 * @returns {{ score: number, pass: boolean, grade: string, suggestions: string[] }}
 */
async function evaluatePublicMeme(imageUrl) {
  // 1. Download and validate image
  const response = await fetch(imageUrl, {
    headers: { 'Accept': 'image/*' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL does not point to an image (got ${contentType})`);
  }

  const buffer = await response.arrayBuffer();
  const sizeBytes = buffer.byteLength;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (sizeBytes > MAX_SIZE) {
    throw new Error(`Image too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max 10MB)`);
  }

  const base64 = Buffer.from(buffer).toString('base64');
  // Normalize content-type for Gemini (e.g. "image/jpeg; charset=utf-8" → "image/jpeg")
  const mimeType = contentType.split(';')[0].trim();

  // 2. Single Gemini vision call — full 6D criteria in prompt (hidden from caller)
  const prompt = `You are a STRICT meme quality evaluator for crypto/trading memes. You score HARSHLY and fairly. Your job is to find flaws, not to be encouraging.

CRYPTO SLANG GLOSSARY — these are COMMON crypto/trading terms, NOT literal meanings:
- "ape in" / "ape'd in" = invest recklessly/enthusiastically (NOT about actual apes/monkeys)
- "exit liquidity" = being the person who buys at the top so others can sell
- "rugged" / "rug pull" = project creators stealing funds
- "degen" = degenerate trader (used affectionately)
- "ngmi" / "wagmi" = not gonna make it / we're all gonna make it
- "diamond hands" / "paper hands" = holding vs panic selling
- "cope" / "copium" = denial about losses
- "ser" = sir (crypto twitter speak)
- "gm" = good morning (crypto greeting)
- "probably nothing" = definitely something (ironic)
When evaluating, interpret text through crypto culture — do NOT take terms literally.

CALIBRATION — use this scale consistently:
- 1/5 = Broken, unreadable, or completely off-target
- 2/5 = Below average, significant issues
- 3/5 = Average internet meme quality (this is where MOST memes land)
- 4/5 = Above average — notably good execution (uncommon)
- 5/5 = Exceptional, viral-tier quality (VERY RARE — reserve for top 5% of all memes you've seen)

A typical decent meme should score around 3/5 on most criteria. Scoring 4+ requires clear evidence. Scoring 5 requires you to explain why in suggestions.

ANALYZE THE IMAGE CAREFULLY:
1. Extract ALL visible text (captions, labels, watermarks, small text)
2. Check for CLEAR defects ONLY — you must be confident a defect exists before reporting it:
   - Duplicate text: the EXACT same phrase rendered in two separate locations (not similar phrases, not the same word used in different contexts)
   - Garbled/misspelled words: clearly wrong spelling (not stylistic choices like ALL CAPS or abbreviations)
   - DO NOT report "cut off text" unless letters are literally missing/truncated. Pixel art, low-res styles, or text near edges is NOT a defect if the words are still readable.
3. Identify the meme format/template (drake, wojak, bell curve, two buttons, etc. or 'original')
4. Assess the emotional tone and intended humor

SCORING CRITERIA (1-5 each, be strict):
1. format_recognition: Is this an instantly recognizable meme format? Would a Reddit/Twitter user identify the template within 1 second? Score 3 for original formats that still read as memes. Score 1-2 if it looks like a generic image with text slapped on.
2. caption_quality: Is text SHORT and PUNCHY? Each text region must be ≤6 words to score 4+. Wordy explanations = score 2. Generic phrases everyone uses = score 2-3. Clever wordplay or subversion = score 4-5.
3. cultural_relevance: Does it use ACTUAL crypto/trading slang authentically? Refer to the CRYPTO SLANG GLOSSARY above. Score 4-5 for authentic Crypto Twitter language. Score 2-3 for generic finance references.
4. visual_execution: Check for duplicate text (same phrase in 2 places = max score 2), garbled text, poor contrast, cluttered composition. Pixel art or stylized rendering is a valid artistic choice, NOT a defect. Clean layout with legible text = score 4.
5. humor_impact: Does it deliver genuine irony, contradiction, or unexpected reaction? Would someone actually laugh or share this? Generic observations = score 2-3. Clever twist that subverts expectations = score 4. Makes you actually laugh out loud = score 5. (WEIGHTED DOUBLE)
6. originality: Is the joke/angle something you haven't seen before? Rehashing common crypto jokes ("buy the dip", "to the moon") = score 2. Fresh angle on a common topic = score 3-4. Genuinely novel concept = score 5. (WEIGHTED DOUBLE)

Respond with ONLY this JSON:
{
  "scores": {
    "format_recognition": 0,
    "caption_quality": 0,
    "cultural_relevance": 0,
    "visual_execution": 0,
    "humor_impact": 0,
    "originality": 0
  },
  "detected_text": ["list ALL text found in the image, including duplicates"],
  "defects": ["ONLY list defects you are highly confident about — empty array if none. Do NOT guess or speculate."],
  "meme_format": "identified meme template or 'original'",
  "suggestions": ["3 SPECIFIC and ACTIONABLE improvement tips. Focus on humor, caption clarity, and composition — not pixel-level nitpicks."]
}`;

  const result = await textModel.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64 } },
  ]);
  const text = (await result.response).text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { score: 0, pass: false, grade: 'N/A', suggestions: ['Unable to evaluate image — try a different meme'] };
  }

  const evaluation = JSON.parse(jsonMatch[0]);
  const scores = evaluation.scores || {};
  const defects = [];

  // Code-level check: detect duplicate text in detected_text array (reliable)
  // Only flag exact duplicates, not similar phrases
  const detectedText = (evaluation.detected_text || []).map(t => t.toLowerCase().trim()).filter(Boolean);
  const seen = new Set();
  for (const t of detectedText) {
    if (seen.has(t)) {
      scores.visual_execution = Math.min(scores.visual_execution || 0, 2);
      if (!defects.includes('Duplicate text detected in image')) {
        defects.push('Duplicate text detected in image');
      }
      break;
    }
    seen.add(t);
  }

  // Same weighting as internal: 4 base + humor×2 + originality×2 = 40 max
  const weightedTotal = (scores.format_recognition || 0)
    + (scores.caption_quality || 0)
    + (scores.cultural_relevance || 0)
    + (scores.visual_execution || 0)
    + (scores.humor_impact || 0) * 2
    + (scores.originality || 0) * 2;
  const maxWeighted = 40;
  const score = Math.round((weightedTotal / maxWeighted) * 100);
  const pass = score >= 82;

  // Grade mapping
  let grade;
  if (score >= 95) grade = 'S';
  else if (score >= 90) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 82) grade = 'B+';
  else if (score >= 75) grade = 'B';
  else if (score >= 65) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';

  // Build suggestions — prepend defect warnings
  const suggestions = [];
  if (defects.length > 0) {
    suggestions.push(`Visual defects detected: ${defects.join('; ')}`);
  }
  suggestions.push(...(evaluation.suggestions || []).slice(0, 3));

  return {
    score,
    pass,
    grade,
    suggestions: suggestions.slice(0, 4),
  };
}

module.exports = {
  selectTemplate,
  selectArtStyle,
  generateMemeIdea,
  generateOriginalMemeIdea,
  retryMemeIdea,
  retryOriginalMemeIdea,
  evaluateMemeIdea,
  evaluatePublicMeme,
  buildImagePrompt,
  buildOriginalImagePrompt,
  validateCaption,
  checkMintEligibility,
  STYLE_MODES,
  CRYPTO_TERMS
};
