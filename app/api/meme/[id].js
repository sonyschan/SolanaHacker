/**
 * Vercel Serverless Function for Meme OpenGraph
 * Route: /api/meme/[id]
 * Returns HTML with OG meta tags for social media previews
 * Uses /api/og/[id] for branded 1200x630 OG image
 */

const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const SITE_URL = 'https://aimemeforge.io';
const VERCEL_URL = 'https://solana-hacker.vercel.app';

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
      return res.redirect(302, SITE_URL);
    }

    const data = await response.json();
    const meme = data.meme || data;

    const title = escapeHtml(meme.title || 'AI MemeForge Meme');
    const description = escapeHtml(meme.description || 'AI-generated meme from MemeForge - Vote for meme democracy!');
    // Use branded OG image instead of raw meme image
    const ogImageUrl = `${VERCEL_URL}/api/og/${id}`;
    const pageUrl = `${SITE_URL}?meme=${id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${title} | AI MemeForge</title>
  <meta name="title" content="${title} | AI MemeForge">
  <meta name="description" content="${description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title} | AI MemeForge">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="AI MemeForge - AI Meme Democracy">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl}">
  <meta name="twitter:title" content="${title} | AI MemeForge">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:site" content="@h2crypto_eth">

  <!-- Redirect to SPA for actual users -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
  <script>window.location.href = "${pageUrl}";</script>
</head>
<body style="background: #0f0f23; color: white; font-family: system-ui; padding: 40px; text-align: center;">
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${meme.imageUrl || ''}" alt="${title}" style="max-width: 400px; border-radius: 16px;">
  <p><a href="${SITE_URL}" style="color: #06b6d4;">Vote on AI MemeForge</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(html);

  } catch (error) {
    console.error('OG handler error:', error);
    res.redirect(302, SITE_URL);
  }
}
