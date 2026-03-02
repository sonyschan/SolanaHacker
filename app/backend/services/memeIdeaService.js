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

// Style modes replacing old 10 art styles
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

  // Count recent template usage
  const usageCounts = {};
  for (const id of recentTemplateIds) {
    usageCounts[id] = (usageCounts[id] || 0) + 1;
  }

  const scored = templates.map(t => {
    // Block templates used >=2 times in past 7 days
    if ((usageCounts[t.id] || 0) >= 2) return { template: t, score: -1 };

    let score = 0;

    // Suitability tag matching against event text
    for (const tag of t.suitability_tags) {
      if (eventText.includes(tag)) score += 2;
    }

    // Emotion tag matching
    for (const tag of t.emotion_tags) {
      if (eventText.includes(tag)) score += 1;
    }

    // Category bonus
    if (category && CATEGORY_BONUSES[category]) {
      if (CATEGORY_BONUSES[category].includes(t.id)) score += 3;
    }

    // Small random factor to break ties
    score += Math.random() * 0.5;

    return { template: t, score };
  });

  // Sort descending, filter out blocked
  scored.sort((a, b) => b.score - a.score);
  const best = scored.find(s => s.score >= 0);

  return best ? best.template : templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate a meme idea using LLM. Caption-first, meme grammar enforced.
 */
async function generateMemeIdea(event, template, recentThemes = [], corrective_hints = null) {
  const newsTitle = event.title || event;

  let recentContext = '';
  if (recentThemes.length > 0) {
    const themesList = recentThemes
      .slice(0, 10)
      .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
      .join('\n');
    recentContext = `\nAVOID these recent themes — make something FRESH:\n${themesList}\n`;
  }

  let hintsSection = '';
  if (corrective_hints) {
    hintsSection = `\nPREVIOUS ATTEMPT FAILED. Fix these issues:\n${corrective_hints}\n`;
  }

  const prompt = `You are a Crypto Twitter meme lord. Generate a meme idea for the "${template.name}" template.

NEWS EVENT: "${newsTitle}"
TEMPLATE: ${template.name}
TEMPLATE FORMAT: ${template.caption_format}
TEMPLATE LAYOUT: ${template.layout_guidance}
${recentContext}${hintsSection}
MEME GRAMMAR RULES (MANDATORY):
1. First-person POV required — use me/my/I/we (e.g., "me buying the dip", "my portfolio after")
2. Use crypto-native terms — ape, degen, ngmi, rekt, hodl, rug, pump, fomo, etc.
3. Setup + twist structure — the joke needs a punchline or ironic reversal
4. Maximum 15 words in the caption (total across all panels/slots)
5. DO NOT explain the joke. No "when you realize" or "that moment when" — just the caption.
6. The caption must work WITH the template visual — don't describe the image in the caption.

OUTPUT FORMAT — respond with ONLY this JSON, no markdown:
{
  "template_id": "${template.id}",
  "caption": "The main caption text (max 15 words)",
  "caption_slots": ${getCaptionSlotsExample(template)},
  "visual_description": "Brief description of what the image should show beyond the standard template layout",
  "emotion": "primary emotion (one word)",
  "twist": "What makes this funny — the ironic reversal or punchline",
  "event_angle": "How this connects to the news event"
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in meme idea response');
  }

  const memeIdea = JSON.parse(jsonMatch[0]);
  memeIdea.template_id = template.id; // Ensure correct template_id
  return memeIdea;
}

/**
 * Evaluate a meme idea using LLM quality gate.
 * Returns { pass, score, scores, corrective_hints? }
 */
async function evaluateMemeIdea(memeIdea) {
  const prompt = `Rate this crypto meme idea on 4 criteria (1-5 each, 20 max).

TEMPLATE: ${memeIdea.template_id}
CAPTION: "${memeIdea.caption}"
CAPTION SLOTS: ${JSON.stringify(memeIdea.caption_slots)}
EMOTION: ${memeIdea.emotion}
TWIST: ${memeIdea.twist}

SCORING CRITERIA:
1. template_familiarity: Does the caption fit how this meme template is actually used on the internet? (not just technically correct, but culturally correct)
2. caption_punchiness: Is it short, punchy, and immediately funny? No filler words?
3. crypto_nativeness: Does it sound like Crypto Twitter, not a corporate marketing team?
4. immediacy: Does it connect to a real, current event in a specific (not generic) way?

PASS THRESHOLD: Total >= 16/20

Respond with ONLY this JSON:
{
  "scores": {
    "template_familiarity": 0,
    "caption_punchiness": 0,
    "crypto_nativeness": 0,
    "immediacy": 0
  },
  "total": 0,
  "pass": true,
  "corrective_hints": "If fail, specific hints to improve. If pass, empty string."
}`;

  const result = await textModel.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { pass: true, score: 16, scores: {}, corrective_hints: '' };
  }

  const evaluation = JSON.parse(jsonMatch[0]);
  evaluation.pass = evaluation.total >= 16;
  return evaluation;
}

/**
 * Build image prompt from meme idea + style mode. Pure function.
 */
function buildImagePrompt(memeIdea, styleMode = 'meme_native') {
  const template = templates.find(t => t.id === memeIdea.template_id);
  const layoutGuidance = template ? template.layout_guidance : '';
  const styleInstruction = STYLE_MODES[styleMode] || STYLE_MODES.meme_native;

  const hasSlots = memeIdea.caption_slots && Object.keys(memeIdea.caption_slots).length > 0;
  const captionText = hasSlots
    ? Object.entries(memeIdea.caption_slots).map(([k, v]) => `${k}: "${v}"`).join(', ')
    : `"${memeIdea.caption}"`;

  return `Create a meme image using the "${memeIdea.template_id}" meme template format.

TEMPLATE LAYOUT: ${layoutGuidance}

CAPTION/TEXT ON IMAGE: ${captionText}

VISUAL DETAILS: ${memeIdea.visual_description || ''}
EMOTION/MOOD: ${memeIdea.emotion || 'funny'}

ART STYLE: ${styleInstruction}

Technical requirements:
- Square aspect ratio (1:1)
- Bold, readable text overlay — text must be clearly legible
- High contrast colors for visual impact
- 1024x1024 pixels resolution
- The meme template format must be immediately recognizable`;
}

/**
 * Validate caption against meme grammar rules. Pure function.
 */
function validateCaption(caption) {
  const words = caption.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerCaption = caption.toLowerCase();
  const issues = [];

  // Word count check
  if (wordCount > 15) {
    issues.push(`Caption is ${wordCount} words (max 15)`);
  }

  // First-person check
  const firstPersonTerms = ['me ', 'my ', 'i ', 'we ', 'our ', "i'm", "i've", "we're", 'myself'];
  const hasFirstPerson = firstPersonTerms.some(t => lowerCaption.includes(t));
  if (!hasFirstPerson) {
    issues.push('Missing first-person POV (me/my/I/we)');
  }

  // Crypto-native term check
  const hasCryptoTerm = CRYPTO_TERMS.some(t => {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    return regex.test(caption);
  });
  if (!hasCryptoTerm) {
    issues.push('No crypto-native terms found');
  }

  return {
    valid: issues.length === 0,
    issues,
    wordCount
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
  evaluateMemeIdea,
  buildImagePrompt,
  validateCaption,
  STYLE_MODES,
  CRYPTO_TERMS
};
