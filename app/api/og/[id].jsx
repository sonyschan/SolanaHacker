import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || req.url.split('/og/')[1]?.split('?')[0];

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
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

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
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '120px',
              }}
            >
              🤖
            </div>
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
          {/* Top - Logo & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  fontSize: '32px',
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                }}
              >
                🤖
              </div>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                AI MemeForge
              </span>
            </div>
            
            {rarity && (
              <div
                style={{
                  background: `${rarityColor}22`,
                  border: `2px solid ${rarityColor}`,
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: rarityColor,
                }}
              >
                {rarity === 'Legendary' ? '🏆 ' : ''}{rarity}
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
                textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </h1>
            
            {style && (
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '16px',
                    color: '#a78bfa',
                  }}
                >
                  {style}
                </span>
              </div>
            )}
          </div>

          {/* Bottom - CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '22px',
                color: '#06b6d4',
                fontWeight: '600',
              }}
            >
              <span>🎫</span>
              <span>Vote & Earn Tickets</span>
            </div>
            <div
              style={{
                fontSize: '18px',
                color: '#9ca3af',
              }}
            >
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
}
