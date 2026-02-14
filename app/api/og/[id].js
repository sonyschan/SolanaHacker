/**
 * Vercel Serverless Function for OG Image Generation
 * Route: /api/og/[id]
 * Returns branded 1200x630 PNG image for Twitter cards
 */

import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';

export default async function handler(req) {
  try {
    // Extract meme ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new Response('Missing meme ID', { status: 400 });
    }

    // Fetch meme data
    let meme = { title: 'AI MemeForge', imageUrl: null };
    try {
      const response = await fetch(`${API_BASE}/api/memes/${id}`);
      if (response.ok) {
        const data = await response.json();
        meme = data.meme || data;
      }
    } catch (e) {
      console.error('Failed to fetch meme:', e);
    }

    const title = meme.title || 'AI Generated Meme';
    const imageUrl = meme.imageUrl;
    const style = meme.style || '';
    const rarity = meme.rarity?.level || '';

    // Rarity colors
    const rarityColors = {
      'Common': '#9CA3AF',
      'Uncommon': '#10B981',
      'Rare': '#3B82F6',
      'Epic': '#8B5CF6',
      'Legendary': '#F59E0B'
    };
    const rarityColor = rarityColors[rarity] || '#6366F1';

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Left side - Meme Image */}
          <div
            style={{
              width: '500px',
              height: '500px',
              margin: '65px 40px',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '4px solid rgba(99, 102, 241, 0.5)',
              boxShadow: '0 0 60px rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1a1a3e',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                width={500}
                height={500}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div style={{ fontSize: '120px' }}>🤖</div>
            )}
          </div>

          {/* Right side - Info */}
          <div
            style={{
              flex: 1,
              padding: '60px 50px 60px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top - Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>🤖</div>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#06b6d4' }}>
                AI MemeForge
              </span>
              {rarity && (
                <div
                  style={{
                    marginLeft: 'auto',
                    background: `${rarityColor}22`,
                    border: `2px solid ${rarityColor}`,
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: rarityColor,
                  }}
                >
                  {rarity}
                </div>
              )}
            </div>

            {/* Middle - Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h1
                style={{
                  fontSize: title.length > 25 ? '42px' : '52px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </h1>
              {style && (
                <span
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '16px',
                    color: '#a78bfa',
                    alignSelf: 'flex-start',
                  }}
                >
                  {style}
                </span>
              )}
            </div>

            {/* Bottom - CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', color: '#06b6d4' }}>
                <span>🎫</span>
                <span>Vote & Earn Tickets</span>
              </div>
              <div style={{ fontSize: '18px', color: '#9ca3af' }}>
                AI Dreams. Humans Decide. • aimemeforge.io
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
