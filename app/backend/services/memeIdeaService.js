const { GoogleGenerativeAI } = require('@google/generative-ai');
const templates = require('../data/meme-templates.json');

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
  meme_native: 'Classic internet meme style. Simple, bold, instantly readable. White Impact font text with black outline. No artistic flourishes — looks like it was made in 2 minutes on imgflip.',
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
async function generateMemeIdea(event, template, recentThemes = []) {
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

MEME GRAMMAR RULES (MANDATORY):
1. First-person POV required — use me/my/I/we (e.g., "me buying the dip", "my portfolio after")
2. Use phrases crypto traders actually say on Twitter. Avoid formal or explanatory language.
3. Caption should feel like immediate emotional reaction, not description.
4. Setup + twist structure — the joke needs a punchline or ironic reversal
5. DO NOT explain the joke. No "when you realize" or "that moment when" — just the caption.
6. The caption must work WITH the template visual — don't describe the image in the caption.

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
async function retryMemeIdea(previousIdea, fixSuggestions, template) {
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

RULES: First-person POV. Use phrases crypto traders actually say on Twitter — no formal language. Caption = immediate emotional reaction, not description. Setup + twist, no joke explanation.

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
 * Scores 0-100 (4 criteria × 1-5, normalized). Pass ≥ 80.
 * Returns { pass, score, scores, failure_reasons[], fix_suggestions[] }
 */
async function evaluateMemeIdea(memeIdea) {
  const prompt = `Rate this crypto meme idea on 4 criteria (1-5 each).

TEMPLATE: ${memeIdea.template_id}
CAPTION: "${memeIdea.caption}"
CAPTION SLOTS: ${JSON.stringify(memeIdea.caption_slots)}
EMOTION: ${memeIdea.emotion}
TWIST: ${memeIdea.twist}

SCORING CRITERIA (1-5 each):
1. template_familiarity: Does the caption fit how this meme template is actually used on the internet? (culturally correct, not just technically correct)
2. caption_punchiness: Each slot MUST be <= 6 words. Score 1 if any slot exceeds 6 words. Is it a short punchy phrase (like "Buying the dip") or a wordy sentence? Immediate emotional reaction > description.
3. crypto_nativeness: Does it sound like phrases crypto traders actually say on Twitter? Not formal or corporate language?
4. immediacy: Does it connect to a real, current event in a specific (not generic) way?

Respond with ONLY this JSON:
{
  "scores": {
    "template_familiarity": 0,
    "caption_punchiness": 0,
    "crypto_nativeness": 0,
    "immediacy": 0
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
  // Normalize raw_total (4-20) to 0-100 scale
  const rawTotal = evaluation.raw_total || Object.values(evaluation.scores || {}).reduce((a, b) => a + b, 0);
  evaluation.score = Math.round((rawTotal / 20) * 100);
  evaluation.pass = evaluation.score >= 80;
  evaluation.failure_reasons = evaluation.failure_reasons || [];
  evaluation.fix_suggestions = evaluation.fix_suggestions || [];
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

  // Crypto-native term check (≥1)
  const hasCryptoTerm = CRYPTO_TERMS.some(t => {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    return regex.test(allText);
  });
  if (!hasCryptoTerm) {
    issues.push('No crypto-native terms found');
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
