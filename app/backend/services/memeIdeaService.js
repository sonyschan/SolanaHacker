const { GoogleGenerativeAI } = require('@google/generative-ai');
const templates = require('../data/meme-templates.json');
const strategyService = require('./memeStrategyService');

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

/**
 * Compute soft cooldown weight for an archetype based on recent usage.
 * Never fully blocks — just reduces probability.
 */
function getArchetypeCooldownWeight(archetype, recentTemplateIds) {
  if (!archetype || recentTemplateIds.length === 0) return 1.0;

  // Build archetype lookup from templates
  const templateArchetypeMap = {};
  for (const t of templates) {
    templateArchetypeMap[t.id] = t.archetype;
  }

  // Check recency of this archetype in recent template usage
  for (let i = 0; i < recentTemplateIds.length; i++) {
    const recentArchetype = templateArchetypeMap[recentTemplateIds[i]];
    if (recentArchetype === archetype) {
      if (i < 3) return 0.1;   // most recent 3 entries (~24h)
      if (i < 9) return 0.4;   // entries 4-9 (~72h)
      return 1.0;
    }
  }

  return 1.0;
}

/**
 * Select a template based on event content, category, and anti-repetition.
 * Pure function (deterministic scoring + small random tiebreaker).
 */
function selectTemplate(event, recentTemplateIds = []) {
  const eventText = (event.title || event).toLowerCase();
  const category = event.category || null;

  const usageCounts = {};
  for (const id of recentTemplateIds) {
    usageCounts[id] = (usageCounts[id] || 0) + 1;
  }

  const scored = templates.map(t => {
    if ((usageCounts[t.id] || 0) >= 2) return { template: t, score: -1 };

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
    // Archetype cooldown — soft penalty for recently-used archetypes
    const archetypeWeight = getArchetypeCooldownWeight(t.archetype, recentTemplateIds);
    score *= archetypeWeight;

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
async function generateMemeIdea(event, template, recentThemes = [], strategy = null) {
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
async function retryMemeIdea(previousIdea, fixSuggestions, template, strategy = null) {
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
function buildImagePrompt(memeIdea, styleMode = 'meme_native') {
  const template = templates.find(t => t.id === memeIdea.template_id);
  const layoutInstructions = template?.layout_instructions || template?.layout_guidance || '';
  const styleInstruction = STYLE_MODES[styleMode] || STYLE_MODES.meme_native;

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

VISUAL DETAILS: ${memeIdea.visual_description || ''}
EMOTION/MOOD: ${memeIdea.emotion || 'funny'}

ART STYLE: ${styleInstruction}

MANDATORY TEXT STYLING:
- All text must be BIG BOLD meme text with black outline (or black shadow)
- Text must be clearly legible against the background
- Use Impact font style or similarly bold, readable font

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

module.exports = {
  selectTemplate,
  generateMemeIdea,
  retryMemeIdea,
  evaluateMemeIdea,
  buildImagePrompt,
  validateCaption,
  STYLE_MODES,
  CRYPTO_TERMS
};
