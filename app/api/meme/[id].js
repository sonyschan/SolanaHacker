/**
 * Vercel Serverless Function for SSR Meme Page
 * Route: /meme/[id] (rewritten from /api/meme/[id])
 *
 * Full Server-Side Rendered page with:
 * - Complete SEO meta tags
 * - Schema.org structured data
 * - Beautiful meme display with stats
 * - Social share buttons
 * - CTA to vote
 */

const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const SITE_URL = 'https://aimemeforge.io';

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getRarityColor(rarity) {
  const colors = {
    'Common': { bg: '#6B7280', text: '#D1D5DB' },
    'Uncommon': { bg: '#10B981', text: '#6EE7B7' },
    'Rare': { bg: '#3B82F6', text: '#93C5FD' },
    'Epic': { bg: '#8B5CF6', text: '#C4B5FD' },
    'Legendary': { bg: '#F59E0B', text: '#FCD34D' },
  };
  return colors[rarity] || colors['Common'];
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch meme data and related memes in parallel
    const [memeResponse, relatedResponse] = await Promise.all([
      fetch(`${API_BASE}/api/memes/${id}`),
      fetch(`${API_BASE}/api/memes/today`)
    ]);

    if (!memeResponse.ok) {
      return res.redirect(302, SITE_URL);
    }

    const data = await memeResponse.json();
    const meme = data.meme || data;

    // Get related memes (other memes from today, excluding current)
    let relatedMemes = [];
    if (relatedResponse.ok) {
      const relatedData = await relatedResponse.json();
      relatedMemes = (relatedData.memes || [])
        .filter(m => m.id !== id)
        .slice(0, 3);
    }

    const title = escapeHtml(meme.title || 'AI MemeForge Meme');
    const description = escapeHtml(meme.description || 'AI-generated meme from MemeForge - Vote for meme democracy!');
    const ogImageUrl = `${API_BASE}/api/og/${id}`;
    const canonicalUrl = `${SITE_URL}/meme/${id}`;
    const imageUrl = escapeHtml(meme.imageUrl || '');
    const rarity = meme.rarity?.level || meme.finalRarity || '';
    const rarityColors = getRarityColor(rarity);
    const totalVotes = (meme.votes?.selection?.yes || 0) + (meme.votes?.selection?.no || 0);
    const yesVotes = meme.votes?.selection?.yes || 0;
    const style = escapeHtml(meme.style || '');
    const newsSource = escapeHtml(meme.newsSource || '');
    const tags = (meme.tags || []).slice(0, 3).map(t => escapeHtml(t));
    const createdAt = meme.generatedAt || meme.createdAt || '';
    const isWinner = meme.isWinner || false;

    // Detect if voting is still active (meme is from today and no final rarity)
    const memeDate = createdAt ? new Date(createdAt).toISOString().split('T')[0] : null;
    const today = new Date().toISOString().split('T')[0];
    const isVotingActive = memeDate === today && !meme.finalRarity;

    // Schema.org structured data
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "name": meme.title || 'AI MemeForge Meme',
      "description": meme.description || 'AI-generated meme',
      "contentUrl": meme.imageUrl,
      "thumbnailUrl": ogImageUrl,
      "url": canonicalUrl,
      "dateCreated": createdAt,
      "creator": {
        "@type": "Organization",
        "name": "AI MemeForge",
        "url": SITE_URL
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/VoteAction",
        "userInteractionCount": totalVotes
      }
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${title} | AI MemeForge</title>
  <meta name="title" content="${title} | AI MemeForge">
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title} | AI MemeForge">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="AI MemeForge - AI Meme Democracy">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${title} | AI MemeForge">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:site" content="@AIMemeForge">

  <!-- Schema.org structured data -->
  <script type="application/ld+json">${JSON.stringify(schemaData)}</script>

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="${SITE_URL}/images/logo-64.png">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
      min-height: 100vh;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      margin-bottom: 32px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #06b6d4;
      font-size: 24px;
      font-weight: 700;
    }
    .logo img { width: 40px; height: 40px; border-radius: 8px; }
    .nav-links a {
      color: #9ca3af;
      text-decoration: none;
      margin-left: 24px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #06b6d4; }

    /* Main Content */
    .main-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 40px;
      margin-bottom: 60px;
    }
    @media (max-width: 900px) {
      .main-content { grid-template-columns: 1fr; }
    }

    /* Meme Display */
    .meme-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      overflow: hidden;
    }
    .meme-image-container {
      background: #1a1a3e;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
    .meme-image {
      max-width: 100%;
      max-height: 600px;
      object-fit: contain;
    }

    /* Info Panel */
    .info-panel {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 24px;
      height: fit-content;
    }
    .meme-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    .winner-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      font-size: 14px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    .rarity-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: ${rarityColors.bg}25;
      border: 2px solid ${rarityColors.bg};
      color: ${rarityColors.text};
      font-size: 14px;
      font-weight: 600;
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 16px;
      margin-left: 8px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .tag {
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #22d3ee;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 8px;
    }
    .tag.style { background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); color: #a78bfa; }
    .tag.news { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-box {
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 16px;
      text-align: center;
    }
    .stat-value { font-size: 28px; font-weight: 700; color: #06b6d4; }
    .stat-value.green { color: #10b981; }
    .stat-label { font-size: 13px; color: #9ca3af; margin-top: 4px; }

    .description {
      color: #d1d5db;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
      padding: 16px;
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
    }
    .meta-info {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 24px;
    }

    /* CTA Button */
    .cta-button {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      font-size: 18px;
      font-weight: 700;
      padding: 16px 32px;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      margin-bottom: 16px;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 40px rgba(6, 182, 212, 0.3);
    }

    /* Share Buttons */
    .share-section { margin-top: 24px; }
    .share-title { font-size: 14px; color: #9ca3af; margin-bottom: 12px; }
    .share-buttons { display: flex; gap: 12px; }
    .share-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .share-btn:hover { opacity: 0.85; }
    .share-btn.twitter { background: #1da1f2; color: white; }
    .share-btn.telegram { background: #0088cc; color: white; }
    .share-btn.copy { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }

    /* Related Memes */
    .related-section {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 40px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
      color: #06b6d4;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }
    .related-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
      text-decoration: none;
    }
    .related-card:hover {
      transform: translateY(-4px);
      border-color: rgba(6, 182, 212, 0.5);
    }
    .related-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      background: #1a1a3e;
    }
    .related-info { padding: 16px; }
    .related-title {
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin-bottom: 8px;
    }
    .related-votes { font-size: 13px; color: #9ca3af; }

    /* Footer */
    .footer {
      text-align: center;
      padding: 40px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
      margin-top: 60px;
    }
    .footer-tagline {
      font-size: 18px;
      color: #9ca3af;
      margin-bottom: 16px;
    }
    .footer-links a {
      color: #06b6d4;
      text-decoration: none;
      margin: 0 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <a href="${SITE_URL}" class="logo">
        <img src="${SITE_URL}/images/logo-64.png" alt="AI MemeForge">
        AI MemeForge
      </a>
      <nav class="nav-links">
        <a href="${SITE_URL}">Forge</a>
        <a href="${SITE_URL}#gallery">Gallery</a>
        <a href="${SITE_URL}#lottery">Lottery</a>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Meme Image -->
      <div class="meme-card">
        <div class="meme-image-container">
          <img src="${imageUrl}" alt="${title}" class="meme-image" onerror="this.src='${SITE_URL}/images/placeholder.png'">
        </div>
      </div>

      <!-- Info Panel -->
      <div class="info-panel">
        <h1 class="meme-title">${title}</h1>

        <div>
          ${isWinner ? '<span class="winner-badge">🏆 Daily Winner</span>' : ''}
          ${rarity ? `<span class="rarity-badge">${rarity === 'Legendary' ? '✨ ' : ''}${escapeHtml(rarity)}</span>` : ''}
        </div>

        <div class="tags">
          ${style ? `<span class="tag style">${style}</span>` : ''}
          ${newsSource ? `<span class="tag news">📰 ${newsSource}</span>` : ''}
          ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value green">${yesVotes}</div>
            <div class="stat-label">Selection Votes</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${totalVotes}</div>
            <div class="stat-label">Total Votes</div>
          </div>
        </div>

        ${description ? `<div class="description">${description}</div>` : ''}

        <div class="meta-info">
          ${createdAt ? `📅 Created: ${formatDate(createdAt)}` : ''}
        </div>

        <!-- CTA Button -->
        ${isVotingActive ? `
        <a href="${SITE_URL}?meme=${id}" class="cta-button">
          🗳️ Connect Wallet & Vote
        </a>
        <p style="text-align: center; font-size: 13px; color: #9ca3af;">
          Vote to earn lottery tickets & decide meme rarity!
        </p>
        ` : `
        <div style="background: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 16px;">
          <p style="color: #a78bfa; font-weight: 600; margin-bottom: 8px;">⏰ Voting Ended</p>
          <p style="color: #9ca3af; font-size: 13px;">This meme's voting period has concluded.</p>
        </div>
        <a href="${SITE_URL}" class="cta-button" style="background: linear-gradient(135deg, #8b5cf6, #a78bfa);">
          🎨 Vote on Today's Memes
        </a>
        <p style="text-align: center; font-size: 13px; color: #9ca3af;">
          New memes are generated daily - join the vote!
        </p>
        `}

        <!-- Share Section -->
        <div class="share-section">
          <div class="share-title">Share this meme</div>
          <div class="share-buttons">
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ' - Vote on AI MemeForge!')}&url=${encodeURIComponent(canonicalUrl)}" target="_blank" rel="noopener" class="share-btn twitter">
              𝕏 Tweet
            </a>
            <a href="https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(title)}" target="_blank" rel="noopener" class="share-btn telegram">
              ✈️ Telegram
            </a>
            <button onclick="navigator.clipboard.writeText('${canonicalUrl}');this.textContent='Copied!'" class="share-btn copy">
              📋 Copy Link
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Related Memes -->
    ${relatedMemes.length > 0 ? `
    <section class="related-section">
      <h2 class="section-title">🔥 More Memes to Vote On</h2>
      <div class="related-grid">
        ${relatedMemes.map(m => `
          <a href="${SITE_URL}/meme/${m.id}" class="related-card">
            <img src="${escapeHtml(m.imageUrl || '')}" alt="${escapeHtml(m.title || '')}" class="related-image">
            <div class="related-info">
              <div class="related-title">${escapeHtml(m.title || 'Untitled')}</div>
              <div class="related-votes">❤️ ${(m.votes?.selection?.yes || 0)} votes</div>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-tagline">AI Dreams. Humans Decide.</div>
      <div class="footer-links">
        <a href="${SITE_URL}">Home</a>
        <a href="https://twitter.com/AIMemeForge" target="_blank">Twitter</a>
        <a href="https://t.me/aimemeforge" target="_blank">Telegram</a>
      </div>
      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
        © 2024 AI MemeForge. Powered by AI & Solana.
      </p>
    </footer>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).send(html);

  } catch (error) {
    console.error('SSR meme page error:', error);
    res.redirect(302, SITE_URL);
  }
}
