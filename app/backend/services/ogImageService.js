/**
 * OG Image Generation Service for AI MemeForge
 * Generates branded 1200x630 images for Twitter/X sharing
 */

const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const { readFileSync } = require('fs');
const { join } = require('path');

// Load fonts at startup
let fontBold = null;
let fontRegular = null;
let fontsLoaded = false;

async function loadFonts() {
  if (fontsLoaded) return;

  try {
    // Try to load local fonts first (using static woff files, not variable ttf)
    fontBold = readFileSync(join(__dirname, '../assets/fonts/Inter-Bold.woff'));
    fontRegular = readFileSync(join(__dirname, '../assets/fonts/Inter-Regular.woff'));
    fontsLoaded = true;
    console.log('[OG] Local fonts loaded successfully');
  } catch (e) {
    console.warn('[OG] Local fonts not found, fetching from CDN...');
    try {
      // Fetch fonts using native fetch (Node 18+)
      const fetchFont = async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        return Buffer.from(await response.arrayBuffer());
      };

      // Use jsDelivr CDN hosting @fontsource/inter TTF files
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
 * Fetch image and convert to data URL for satori embedding
 */
async function fetchImageAsDataUrl(url) {
  if (!url) {
    console.log('[OG] No image URL provided');
    return null;
  }
  try {
    console.log('[OG] Fetching image:', url);
    const response = await fetch(url);
    console.log('[OG] Image fetch status:', response.status);
    if (!response.ok) {
      console.warn('[OG] Image fetch failed with status:', response.status);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    console.log('[OG] Image size:', arrayBuffer.byteLength);
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
    console.log('[OG] Image converted to data URL, length:', dataUrl.length);
    return dataUrl;
  } catch (e) {
    console.error('[OG] Failed to fetch image:', e.message, e.stack);
    return null;
  }
}

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
 * @param {Object} meme - Meme data with title, imageUrl, style, rarity, etc.
 * @returns {Buffer} PNG image buffer
 */
async function generateOGImage(meme) {
  // Ensure fonts are loaded
  await loadFonts();

  // If fonts still aren't loaded, use simple SVG fallback
  if (!fontBold || !fontRegular) {
    console.warn('[OG] Using SVG fallback due to font loading failure');
    return generateSimpleOGImage(meme.title || 'AI Generated Meme');
  }

  const title = meme.title || 'AI Generated Meme';
  const style = meme.style || '';
  const rarityLevel = meme.rarity?.level || '';
  const totalVotes = (meme.votes?.selection?.yes || 0) + (meme.votes?.selection?.no || 0);

  // Try to use image URL directly (satori can fetch images)
  // If that fails, we'll fall back to pre-fetching
  let imageDataUrl = meme.imageUrl;

  // Test if the image URL is accessible
  if (meme.imageUrl) {
    try {
      const testFetch = await fetch(meme.imageUrl, { method: 'HEAD' });
      if (!testFetch.ok) {
        console.log('[OG] Image URL not accessible, trying data URL');
        imageDataUrl = await fetchImageAsDataUrl(meme.imageUrl);
      } else {
        console.log('[OG] Using direct image URL');
      }
    } catch (e) {
      console.log('[OG] URL test failed, trying data URL');
      imageDataUrl = await fetchImageAsDataUrl(meme.imageUrl);
    }
  }

  const colors = RARITY_COLORS[rarityLevel] || RARITY_COLORS['Common'];

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
          // Left side - Meme Image
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
              children: imageDataUrl ? [
                {
                  type: 'img',
                  props: {
                    src: imageDataUrl,
                    width: 500,
                    height: 500,
                    style: { objectFit: 'cover' },
                  },
                },
              ] : [
                {
                  type: 'span',
                  props: {
                    style: { fontSize: '120px' },
                    children: 'AI',
                  },
                },
              ],
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
                      // Logo
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', alignItems: 'center', gap: '12px' },
                          children: [
                            {
                              type: 'span',
                              props: {
                                style: { fontSize: '36px' },
                                children: 'AI',
                              },
                            },
                            {
                              type: 'span',
                              props: {
                                style: {
                                  fontSize: '28px',
                                  fontWeight: 700,
                                  color: '#06b6d4',
                                },
                                children: 'AI MemeForge',
                              },
                            },
                          ],
                        },
                      },
                      // Rarity badge
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
                          children: [
                            rarityLevel === 'Legendary' ? {
                              type: 'span',
                              props: {
                                style: { fontSize: '20px' },
                                children: '*',
                              },
                            } : null,
                            {
                              type: 'span',
                              props: {
                                style: {
                                  fontSize: '20px',
                                  fontWeight: 700,
                                  color: colors.primary,
                                },
                                children: rarityLevel,
                              },
                            },
                          ].filter(Boolean),
                        },
                      } : null,
                    ].filter(Boolean),
                  },
                },

                // Middle - Title & Style
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: title.length > 25 ? '40px' : '48px',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.2,
                          },
                          children: title,
                        },
                      },
                      style ? {
                        type: 'div',
                        props: {
                          style: { display: 'flex', gap: '10px' },
                          children: [
                            {
                              type: 'span',
                              props: {
                                style: {
                                  background: 'rgba(139, 92, 246, 0.25)',
                                  border: '2px solid rgba(139, 92, 246, 0.5)',
                                  borderRadius: '10px',
                                  padding: '8px 16px',
                                  fontSize: '18px',
                                  color: '#a78bfa',
                                },
                                children: style,
                              },
                            },
                          ],
                        },
                      } : null,
                    ].filter(Boolean),
                  },
                },

                // Bottom - CTA & Stats
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    },
                    children: [
                      // Vote stats
                      totalVotes > 0 ? {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '20px',
                            color: '#a78bfa',
                          },
                          children: [
                            {
                              type: 'span',
                              props: { children: 'VOTES:' },
                            },
                            {
                              type: 'span',
                              props: {
                                style: { fontWeight: 600 },
                                children: `${totalVotes} votes`,
                              },
                            },
                          ],
                        },
                      } : null,
                      // CTA
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '22px',
                            color: '#06b6d4',
                            fontWeight: 600,
                          },
                          children: [
                            {
                              type: 'span',
                              props: { children: '>' },
                            },
                            {
                              type: 'span',
                              props: { children: 'Vote & Earn Tickets' },
                            },
                          ],
                        },
                      },
                      // Tagline
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: '18px',
                            color: '#9ca3af',
                          },
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
      fonts: fontBold && fontRegular ? [
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      ] : [],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
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
      <text x="600" y="280" font-size="72" fill="#06b6d4" font-family="sans-serif" font-weight="bold" text-anchor="middle">🤖 AI MemeForge</text>
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
