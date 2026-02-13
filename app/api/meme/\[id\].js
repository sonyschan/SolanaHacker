/**
 * Vercel Serverless Function for Meme OpenGraph
 * Route: /api/meme/[id]
 * Returns HTML with OG meta tags for social media previews
 */

const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const SITE_URL = 'https://solana-hacker.vercel.app';

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch meme data from our API
    const response = await fetch(`${API_BASE}/api/memes/${id}`);

    if (!response.ok) {
      // Fallback for invalid meme ID
      return res.redirect(302, SITE_URL);
    }

    const data = await response.json();
    const meme = data.meme || data;

    // Build OG meta tags
    const title = meme.title || 'MemeForge Meme';
    const description = meme.description || 'AI-generated meme from MemeForge - Vote for meme democracy!';
    const imageUrl = meme.imageUrl || `${SITE_URL}/og-default.png`;
    const pageUrl = `${SITE_URL}/meme/${id}`;

    // Return HTML with OG tags (for crawlers) that redirects to SPA (for users)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)} | MemeForge</title>
  <meta name="title" content="${escapeHtml(title)} | MemeForge">
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeHtml(title)} | MemeForge">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1024">
  <meta property="og:image:height" content="1024">
  <meta property="og:site_name" content="MemeForge - AI Meme Democracy">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)} | MemeForge">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Redirect to SPA for actual users (not crawlers) -->
  <meta http-equiv="refresh" content="0;url=${SITE_URL}?meme=${id}">
  <script>window.location.href = "${SITE_URL}?meme=${id}";</script>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <img src="${imageUrl}" alt="${escapeHtml(title)}" style="max-width: 100%;">
  <p><a href="${SITE_URL}">Vote on MemeForge</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('OG handler error:', error);
    res.redirect(302, SITE_URL);
  }
}
