/**
 * Vercel Serverless Function for Referral Link OG Preview
 * Route: /ref/[id] (rewritten from /api/ref/[id])
 *
 * Serves custom OG meta tags (invite-to-win.png) for social sharing,
 * then redirects real users to /?ref=[id] for the SPA to handle.
 */

const SITE_URL = 'https://aimemeforge.io';

export default function handler(req, res) {
  const { id } = req.query;

  if (!id || !/^[a-zA-Z0-9]{3,8}$/.test(id)) {
    res.writeHead(302, { Location: SITE_URL });
    return res.end();
  }

  const ogImage = `${SITE_URL}/images/invite-to-win.png`;
  const pageUrl = `${SITE_URL}/ref/${id}`;
  const referralUrl = `${SITE_URL}/?ref=${id}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Join AI MemeForge — Vote, Win NFTs & USDC Daily</title>
  <meta name="description" content="Your friend invited you to AI MemeForge! Vote on daily AI memes for free, earn lottery tickets, and win NFT ownership + USDC rewards every day." />

  <!-- Open Graph — no meta refresh so crawlers stay on this page -->
  <meta property="og:title" content="You're invited to AI MemeForge!" />
  <meta property="og:description" content="Vote on daily AI memes for free. Win NFT ownership + USDC rewards every day. Join now!" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="AI MemeForge" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@AiMemeForgeIO" />
  <meta name="twitter:title" content="You're invited to AI MemeForge!" />
  <meta name="twitter:description" content="Vote on daily AI memes for free. Win NFT ownership + USDC rewards every day." />
  <meta name="twitter:image" content="${ogImage}" />

  <link rel="canonical" href="${pageUrl}" />
</head>
<body style="margin:0;padding:2rem;font-family:sans-serif;background:#1e3a8a;color:white;text-align:center;">
  <p>Redirecting to <a href="${referralUrl}" style="color:#06b6d4;">AI MemeForge</a>...</p>
  <script>window.location.replace("${referralUrl}");</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(html);
}
