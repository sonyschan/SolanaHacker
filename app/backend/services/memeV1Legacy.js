/**
 * Meme Generator V1 — Legacy Reference (active until 2026-03-01)
 *
 * V1 STRENGTHS (why we keep this):
 * - 10 diverse art styles → each meme is visually unique
 * - Free-form AI composition → not constrained by template layouts
 * - "NFT-quality artwork" framing → artistic, collectible-grade output
 * - Style as first-class parameter → passed to Gemini/Grok image generation
 *
 * V1 WEAKNESSES (why V2 replaced it):
 * - Captions too wordy, over-explained (no slot limits, no word count cap)
 * - No template recognition (can't "get the joke in seconds")
 * - No strategy/narrative layers (no comedy angle or emotional framing)
 * - No quality evaluation gate (no LLM scoring or retry loop)
 *
 * USAGE: Import this module to access V1's art styles and prompt generation.
 *
 * ```js
 * const v1 = require('./memeV1Legacy');
 * const styles = v1.pickRandomStyles(3);
 * const artPrompt = v1.buildArtStylePrompt(styles[0]);
 * const memePrompt = await v1.generateMemePrompt(newsTitle, recentThemes);
 * ```
 *
 * Extracted from: git commit e1076e9 (2026-03-01, last V1 state)
 * Source file: app/backend/services/geminiService.js (pre-V2 refactor)
 */

// ═══════════════════════════════════════════════════════════════
// V1 ART STYLES — 10 distinct visual identities
// ═══════════════════════════════════════════════════════════════

const V1_ART_STYLES = [
  {
    id: 'classic_2d',
    name: 'Classic 2D Illustration',
    prompt: 'Classic 2D Illustration style. Clean digital illustration with clear outlines, vibrant colors, and expressive characters.',
  },
  {
    id: 'retro_pixel',
    name: 'Retro Pixel Art',
    prompt: 'Retro Pixel Art style. 16-bit aesthetic with chunky pixels, limited color palette, and nostalgic gaming vibes.',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    prompt: 'Cyberpunk Neon style. Dark backgrounds with electric neon glow, holographic elements, glitch overlays, and dystopian futuristic atmosphere.',
  },
  {
    id: 'hyper_realism',
    name: 'Hyper-Realism',
    prompt: 'Hyper-Realistic photographic style. Dramatic lighting, cinematic composition, ultra-detailed textures, as if captured by a professional photographer.',
  },
  {
    id: 'abstract_glitch',
    name: 'Abstract Glitch Art',
    prompt: 'Abstract Glitch Art style with SUBTLE glitch effects ONLY in the background. Main subject and characters must remain CLEAR and undistorted. Use mild chromatic aberration and vaporwave colors as accents, NOT as the dominant visual. Keep the focal point sharp and readable.',
  },
  {
    id: 'classic_oil',
    name: 'Classic Oil Painting',
    prompt: 'Classic Oil Painting style. Rich brushstrokes visible, warm museum-gallery color palette, Renaissance-inspired composition, dramatic chiaroscuro lighting.',
  },
  {
    id: '3d_clay',
    name: '3D Clay Toy',
    prompt: '3D Clay Toy style. Cute claymation aesthetic, soft rounded shapes, playful proportions, colorful and touchable-looking characters.',
  },
  {
    id: 'ink_wash',
    name: 'Ink Wash Zen',
    prompt: 'Ink Wash Zen style. Traditional East Asian ink painting aesthetic, expressive brushwork, minimal color (mostly black/gray with occasional red accent), meditative composition.',
  },
  {
    id: 'street_graffiti',
    name: 'Street Graffiti',
    prompt: 'Street Graffiti style. Urban wall art aesthetic, spray paint textures, bold outlines, dripping paint, concrete/brick backgrounds. Do NOT add decorative graffiti text — only render the specified caption text.',
  },
  {
    id: 'modern_flat',
    name: 'Modern Flat Design',
    prompt: 'Modern Flat Design style. Minimalist geometric shapes, limited flat color palette, clean visual composition, tech-startup illustration aesthetic.',
  },
];

// Original V1 name-only array for backward compatibility
const MEME_STYLES = V1_ART_STYLES.map(s => s.name);

// ═══════════════════════════════════════════════════════════════
// V1 STYLE SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Pick N unique random styles. V1 used this for daily 3-meme batches.
 */
function pickRandomStyles(count = 3) {
  const shuffled = [...V1_ART_STYLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Pick a style that differs from recently used styles.
 * @param {string[]} recentStyleIds - style IDs used in recent memes
 * @param {number} cooldownDays - how many days to avoid repeating (default 3)
 */
// Quality weights learned from vision AI analysis (2026-03-23)
// Higher weight = more likely to be selected
const STYLE_QUALITY_WEIGHTS = {
  street_graffiti: 2.0,   // top performer — clear, dynamic, modern
  '3d_clay': 2.0,         // top performer — clean lines, expressive
  ink_wash: 1.8,           // top performer — crisp, uncluttered
  modern_flat: 1.8,        // top performer — bold, readable
  classic_2d: 1.5,         // solid performer
  cyberpunk_neon: 1.2,     // good but can be busy
  retro_pixel: 1.0,        // default — struggles with complex backgrounds
  classic_oil: 1.0,        // double-edged — can be too heavy
  hyper_realism: 0.8,      // below average
  abstract_glitch: 0.3,    // worst performer — visual noise, obscures subjects
};

function pickFreshStyle(recentStyleIds = []) {
  const available = V1_ART_STYLES.filter(s => !recentStyleIds.includes(s.id));
  const pool = available.length > 0 ? available : V1_ART_STYLES;

  // Weighted random selection based on quality scores
  const weights = pool.map(s => STYLE_QUALITY_WEIGHTS[s.id] || 1.0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// ═══════════════════════════════════════════════════════════════
// V1 PROMPT GENERATION — free-form creative meme concept
// ═══════════════════════════════════════════════════════════════

/**
 * Build the V1 image generation prompt with art style.
 * This was the prompt structure that produced "The BITCOIN Bounce",
 * "Vitaliks Big Brain", etc.
 */
function buildArtStylePrompt(memePrompt, style) {
  const styleName = typeof style === 'string' ? style : style.name;
  const stylePrompt = typeof style === 'string'
    ? style
    : style.prompt;

  return `Create a high-quality meme image: ${memePrompt}

**ART STYLE: ${styleName}**
- Render this meme in the "${styleName}" art style
- The style should be clearly recognizable and distinct

Technical requirements:
- Square aspect ratio (1:1)
- Bold, readable text overlay if text is needed
- High contrast colors for visual impact
- NFT-quality artwork suitable for collection
- 1024x1024 pixels resolution
- Clean composition with balanced visual elements`;
}

/**
 * V1 meme concept prompt — asks LLM for free-form creative meme.
 * Returns the prompt text (not the LLM response — caller must invoke LLM).
 */
function buildMemeConceptPrompt(newsContent, recentThemes = []) {
  let prompt = `Based on this crypto/tech news: "${newsContent}"

Create a funny, engaging meme concept that would appeal to crypto and tech enthusiasts.
Include:
1. A brief description of the visual scene
2. Any text that should appear on the meme
3. The emotional tone (funny, ironic, relatable, etc.)

Keep it appropriate and avoid controversial content.`;

  if (recentThemes.length > 0) {
    const themesList = recentThemes
      .map(t => `- "${t.title}" (${(t.tags || []).join(', ')})`)
      .join('\n');
    prompt += `\n\nIMPORTANT — AVOID REPETITION:
These meme themes were used in the past 7 days — create something DIFFERENT:
${themesList}

Your meme must have a FRESH angle, not rehash the topics above.`;
  }

  return prompt;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Art style data
  V1_ART_STYLES,
  MEME_STYLES,

  // Style selection
  pickRandomStyles,
  pickFreshStyle,

  // Prompt builders
  buildArtStylePrompt,
  buildMemeConceptPrompt,
};
