/**
 * OG Image Generation Service for AI MemeForge
 * Generates branded 1200x630 images for Twitter/X sharing
 *
 * Strategy: satori renders the text/layout SVG, resvg converts to PNG,
 * then sharp composites the meme image on top (resvg can't render <image>).
 */

const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');
const { readFileSync } = require('fs');
const { join } = require('path');

// Load fonts at startup
let fontBold = null;
let fontRegular = null;
let fontsLoaded = false;

async function loadFonts() {
  if (fontsLoaded) return;

  try {
    fontBold = readFileSync(join(__dirname, '../assets/fonts/Inter-Bold.woff'));
    fontRegular = readFileSync(join(__dirname, '../assets/fonts/Inter-Regular.woff'));
    fontsLoaded = true;
    console.log('[OG] Local fonts loaded successfully');
  } catch (e) {
    console.warn('[OG] Local fonts not found, fetching from CDN...');
    try {
      const fetchFont = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        return Buffer.from(await response.arrayBuffer());
      };

      const [boldRes, regularRes] = await Promise.all([
        fetchFont('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff'),
        fetchFont('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff')
      ]);
      fontBold = boldRes;
      fontRegular = regularRes;
      fontsLoaded = true;
      console.log('[OG] CDN Fonts loaded successfully');
    } catch (fetchError) {
      console.error('[OG] Failed to load fonts from CDN:', fetchError.message);
    }
  }
}

/**
 * Fetch image as Buffer
 */
async function fetchImageBuffer(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch (e) {
    console.error('[OG] Failed to fetch image:', e.message);
    return null;
  }
}

// Meme image position in the OG card (must match satori layout)
const MEME_LEFT = 50;    // 20px padding + 30px marginLeft
const MEME_TOP = 65;     // 20px padding + 45px marginTop
const MEME_SIZE = 500;
const MEME_RADIUS = 24;

// Rarity colors
const RARITY_COLORS = {
  'Common': { primary: '#9CA3AF', secondary: '#6B7280', glow: '#D1D5DB' },
  'Uncommon': { primary: '#10B981', secondary: '#059669', glow: '#6EE7B7' },
  'Rare': { primary: '#3B82F6', secondary: '#2563EB', glow: '#93C5FD' },
  'Epic': { primary: '#8B5CF6', secondary: '#7C3AED', glow: '#C4B5FD' },
  'Legendary': { primary: '#F59E0B', secondary: '#D97706', glow: '#FCD34D' },
};

/**
 * Generate OG image for a meme
 */
async function generateOGImage(meme) {
  await loadFonts();

  if (!fontBold || !fontRegular) {
    console.warn('[OG] Using SVG fallback due to font loading failure');
    return generateSimpleOGImage(meme.title || 'AI Generated Meme');
  }

  const title = meme.title || 'AI Generated Meme';
  const style = meme.style || '';
  const tags = meme.tags || [];
  const newsSource = meme.newsSource || '';
  const rarityLevel = meme.rarity?.level || meme.finalRarity || '';
  const totalVotes = (meme.votes?.selection?.yes || 0) + (meme.votes?.selection?.no || 0);

  const memeDate = meme.generatedAt ? new Date(meme.generatedAt).toISOString().split('T')[0] : null;
  const today = new Date().toISOString().split('T')[0];
  const isVotingActive = memeDate === today && !meme.finalRarity;

  const ctaText = isVotingActive ? 'Vote & Earn Tickets' : 'See More Memes';
  const ctaIcon = isVotingActive ? '>' : '>';

  const colors = RARITY_COLORS[rarityLevel] || RARITY_COLORS['Common'];

  const displayTags = [];
  if (style) displayTags.push({ text: style, color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.25)' });
  if (newsSource) displayTags.push({ text: newsSource, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.25)' });
  tags.slice(0, 2).forEach(tag => {
    displayTags.push({ text: tag, color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.25)' });
  });

  // Step 1: Render satori SVG WITHOUT the meme image (just placeholder box)
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
          fontFamily: 'Inter',
          padding: '20px',
        },
        children: [
          // Left side - placeholder for meme image (sharp will composite later)
          {
            type: 'div',
            props: {
              style: {
                width: '500px',
                height: '500px',
                marginTop: '45px',
                marginLeft: '30px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: `4px solid ${colors.primary}`,
                boxShadow: `0 0 60px ${colors.glow}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1a1a3e',
              },
              // No image — just empty placeholder
              children: [{
                type: 'span',
                props: {
                  style: { fontSize: '120px', color: '#2a2a5e' },
                  children: '',
                },
              }],
            },
          },

          // Right side - Info
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                padding: '45px 40px 45px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              },
              children: [
                // Top - Logo & Rarity
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'center', gap: '12px' },
                          children: [
                            {
                              type: 'span',
                              props: {
                                style: { fontSize: '36px', fontWeight: 700, color: '#06b6d4' },
                                children: 'M',
                              },
                            },
                            {
                              type: 'span',
                              props: {
                                style: { fontSize: '32px', fontWeight: 700, color: '#06b6d4' },
                                children: 'AI MemeForge',
                              },
                            },
                          ],
                        },
                      },
                      rarityLevel ? {
                        type: 'div',
                        props: {
                          style: {
                            background: `${colors.primary}25`,
                            border: `3px solid ${colors.primary}`,
                            borderRadius: '20px',
                            padding: '10px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          },
                          children: [{
                            type: 'span',
                            props: {
                              style: { fontSize: '20px', fontWeight: 700, color: colors.primary },
                              children: rarityLevel,
                            },
                          }],
                        },
                      } : null,
                    ].filter(Boolean),
                  },
                },

                // Middle - Title & Tags
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '16px' },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: title.length > 20 ? '52px' : '60px',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.15,
                          },
                          children: title,
                        },
                      },
                      displayTags.length > 0 ? {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
                          children: displayTags.slice(0, 4).map(tag => ({
                            type: 'span',
                            props: {
                              style: {
                                background: tag.bg,
                                border: `2px solid ${tag.color}50`,
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '16px',
                                color: tag.color,
                              },
                              children: tag.text,
                            },
                          })),
                        },
                      } : null,
                    ].filter(Boolean),
                  },
                },

                // Bottom - CTA & Stats
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      totalVotes > 0 ? {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '22px',
                            color: '#a78bfa',
                          },
                          children: [
                            { type: 'span', props: { children: 'VOTES:' } },
                            { type: 'span', props: { style: { fontWeight: 600 }, children: `${totalVotes} votes` } },
                          ],
                        },
                      } : null,
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '32px',
                            color: isVotingActive ? '#06b6d4' : '#a78bfa',
                            fontWeight: 700,
                          },
                          children: [
                            { type: 'span', props: { style: { fontSize: '28px' }, children: ctaIcon } },
                            { type: 'span', props: { children: ctaText } },
                          ],
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: { fontSize: '18px', color: '#9ca3af' },
                          children: 'AI Dreams. Humans Decide. | aimemeforge.io',
                        },
                      },
                    ].filter(Boolean),
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ],
    }
  );

  // Step 2: Convert SVG to PNG via resvg
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const basePng = resvg.render().asPng();

  // Step 3: Fetch meme image and composite with sharp
  const memeBuffer = await fetchImageBuffer(meme.imageUrl);
  if (!memeBuffer) {
    console.log('[OG] No meme image available, returning base card');
    return basePng;
  }

  // Resize meme image to fit the placeholder area, with rounded corners
  const roundedMeme = await sharp(memeBuffer)
    .resize(MEME_SIZE, MEME_SIZE, { fit: 'cover' })
    .composite([{
      input: Buffer.from(
        `<svg width="${MEME_SIZE}" height="${MEME_SIZE}">
          <rect x="0" y="0" width="${MEME_SIZE}" height="${MEME_SIZE}" rx="${MEME_RADIUS}" ry="${MEME_RADIUS}" fill="white"/>
        </svg>`
      ),
      blend: 'dest-in',
    }])
    .png()
    .toBuffer();

  // Composite meme image onto the base card
  const finalPng = await sharp(basePng)
    .composite([{
      input: roundedMeme,
      left: MEME_LEFT,
      top: MEME_TOP,
    }])
    .png()
    .toBuffer();

  console.log('[OG] Composited meme image via sharp');
  return finalPng;
}

/**
 * Generate a simple fallback OG image
 */
async function generateSimpleOGImage(title = 'AI MemeForge') {
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f0f23;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1a1a3e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0f0f23;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="600" y="280" font-size="72" fill="#06b6d4" font-family="sans-serif" font-weight="bold" text-anchor="middle">AI MemeForge</text>
      <text x="600" y="380" font-size="36" fill="#ffffff" font-family="sans-serif" text-anchor="middle">${title}</text>
      <text x="600" y="480" font-size="24" fill="#9ca3af" font-family="sans-serif" text-anchor="middle">AI Dreams. Humans Decide. | aimemeforge.io</text>
    </svg>
  `;

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

module.exports = {
  generateOGImage,
  generateSimpleOGImage,
};
