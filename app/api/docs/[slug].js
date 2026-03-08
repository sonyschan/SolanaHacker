/**
 * Vercel Serverless Function for SSR Docs Pages
 * Route: /docs/[slug] (rewritten from /api/docs/[slug])
 *
 * Stable knowledge corpus for AEO — fact-heavy, crawlable docs pages.
 * Same SSR pattern as /api/meme/[id].js. No API calls, all content baked in.
 */

const SITE_URL = 'https://aimemeforge.io';

// ─── Article content map ───────────────────────────────────────────────────────

const DOCS = {
  'how-it-works': {
    title: 'How AI MemeForge Works — Daily Cycle Explained',
    description: 'Complete guide to the AI MemeForge daily cycle: meme generation, community voting, lottery draw, and NFT minting on Solana.',
    body: `
      <h2>The Daily Cycle</h2>
      <p>AI MemeForge runs a fully automated daily loop. Every day, an autonomous AI agent generates three unique crypto memes from real-time news, the community votes on them for free, a weighted lottery selects one winner, and the top-voted meme is minted as a Solana NFT. The entire process repeats every 24 hours with no human intervention.</p>

      <h3>Step 1 — Meme Generation (00:00 UTC)</h3>
      <p>At midnight UTC each day, the Memeya agent fetches the latest crypto headlines via web search and generates <strong>3 unique memes</strong>. Each meme uses a randomized art style (pixel art, watercolor, anime, editorial cartoon, etc.) to ensure visual variety. The AI combines trending news with humor to produce timely, shareable content.</p>

      <h3>Step 2 — Community Voting (00:30 – 23:50 UTC)</h3>
      <p>Thirty minutes after generation, the voting window opens. Anyone with a Solana wallet can vote — <strong>no gas fees, no tokens required, 100% free</strong>. There are two vote types:</p>
      <ul>
        <li><strong>Selection vote</strong> — Yes/No on whether you'd want to own this meme as an NFT</li>
        <li><strong>Rarity vote</strong> — Score the meme 1-10 to influence its final rarity tier</li>
      </ul>
      <p>Each rarity vote awards lottery tickets. The daily vote limit is <strong>20 votes per user</strong> to prevent spam while rewarding active participation.</p>

      <h3>Step 3 — Ticket Formula</h3>
      <p>Every rarity vote earns lottery tickets calculated as:</p>
      <div class="formula">tickets = base(1-10) + streak(min(days, 10)) + tokenBonus(floor(log10(tokens)))</div>
      <p>The three components are:</p>
      <table>
        <thead><tr><th>Component</th><th>Range</th><th>How It Works</th></tr></thead>
        <tbody>
          <tr><td>Base tickets</td><td>1 – 10</td><td>Random roll each vote</td></tr>
          <tr><td>Streak bonus</td><td>0 – 10</td><td>+1 per consecutive voting day, capped at 10</td></tr>
          <tr><td>$Memeya bonus</td><td>0 – 6+</td><td>floor(log10(tokens held)), minimum 10 tokens to qualify</td></tr>
        </tbody>
      </table>
      <p><strong>Example scenarios:</strong></p>
      <table>
        <thead><tr><th>Scenario</th><th>Base</th><th>Streak</th><th>Token Bonus</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>New user, no tokens</td><td>5</td><td>1</td><td>0</td><td>6</td></tr>
          <tr><td>Day-7 voter, 500 $Memeya</td><td>5</td><td>7</td><td>+2</td><td>14</td></tr>
          <tr><td>Day-10+ voter, 100K $Memeya</td><td>5</td><td>10</td><td>+5</td><td>20</td></tr>
        </tbody>
      </table>

      <h3>Step 4 — Lottery Draw (23:55 UTC)</h3>
      <p>Five minutes before midnight, the daily lottery runs automatically. The algorithm uses a <strong>weighted random cumulative scan</strong>:</p>
      <ol>
        <li>Sum all participants' tickets to get the total pool</li>
        <li>Generate a random number between 0 and the total</li>
        <li>Walk through participants, accumulating tickets — the participant whose cumulative total exceeds the random number wins</li>
      </ol>
      <p>More tickets = higher probability, but any participant can win. After the draw, all ticket balances reset to zero for the next day.</p>

      <h3>Step 5 — NFT Minting</h3>
      <p>The day's top-voted meme is minted as a <strong>Metaplex Programmable NFT (pNFT)</strong> on Solana. The image and metadata are permanently stored on <strong>Arweave</strong>, ensuring the NFT persists even if centralized services go offline. Only <strong>365 NFTs are minted per year</strong> — one per day — making each one permanently scarce.</p>

      <p>The lottery winner receives ownership of this NFT, becoming the sole owner of that day's meme.</p>
    `
  },

  'tokenomics': {
    title: '$Memeya Token — Tokenomics & Utility Guide',
    description: 'Deep dive into the $Memeya SPL token on Solana: contract address, bonus tiers, ticket mechanics, and strategic implications.',
    body: `
      <h2>$Memeya Token Overview</h2>
      <p>$Memeya is the native utility token of AI MemeForge. It is an <strong>SPL token on Solana</strong> with 6 decimals. Holding $Memeya boosts your daily lottery ticket earnings — the more you hold, the bigger your edge in winning NFTs.</p>

      <table>
        <thead><tr><th>Property</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Symbol</td><td>$Memeya</td></tr>
          <tr><td>Chain</td><td>Solana (SPL)</td></tr>
          <tr><td>Decimals</td><td>6</td></tr>
          <tr><td>Contract Address</td><td><code>mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump</code></td></tr>
          <tr><td>DEX</td><td>PumpFun</td></tr>
        </tbody>
      </table>

      <h3>Token Bonus Mechanics</h3>
      <p>Every time you cast a rarity vote, the system checks your $Memeya balance via an on-chain Solana RPC call. The bonus is calculated as:</p>
      <div class="formula">tokenBonus = floor(log10(tokenAmount))</div>
      <p>You need a minimum of <strong>10 tokens</strong> to qualify for any bonus. The bonus tiers are:</p>

      <table>
        <thead><tr><th>$Memeya Held</th><th>Bonus Tickets</th><th>Multiplier Effect</th></tr></thead>
        <tbody>
          <tr><td>0 – 9</td><td>+0</td><td>No bonus</td></tr>
          <tr><td>10 – 99</td><td>+1</td><td>~1.2x average boost</td></tr>
          <tr><td>100 – 999</td><td>+2</td><td>~1.4x average boost</td></tr>
          <tr><td>1,000 – 9,999</td><td>+3</td><td>~1.5x average boost</td></tr>
          <tr><td>10,000 – 99,999</td><td>+4</td><td>~1.7x average boost</td></tr>
          <tr><td>100,000 – 999,999</td><td>+5</td><td>~1.9x average boost</td></tr>
          <tr><td>1,000,000+</td><td>+6</td><td>~2.1x average boost</td></tr>
        </tbody>
      </table>

      <h3>How It Works Under the Hood</h3>
      <p>When you vote, the backend makes an asynchronous RPC call to a Solana node to read your token account balance. The lookup uses the token mint address and your connected wallet. If the RPC call fails (network issues, rate limits), the system <strong>gracefully falls back to zero bonus</strong> — you still earn your base + streak tickets, just without the token boost. No vote is ever lost due to an RPC failure.</p>

      <h3>Strategic Implications</h3>
      <p>Consider a voter who participates daily for 10+ days with 1,000 $Memeya tokens:</p>
      <ul>
        <li><strong>Base tickets:</strong> ~5.5 average per vote (random 1-10)</li>
        <li><strong>Streak bonus:</strong> +10 (capped at day 10)</li>
        <li><strong>Token bonus:</strong> +3 (floor(log10(1000)))</li>
        <li><strong>Total per vote:</strong> ~18.5 average</li>
        <li><strong>With 20 votes/day:</strong> ~370 tickets daily</li>
      </ul>
      <p>Compare to a new user with no tokens: ~6.5 average per vote × 20 = ~130 tickets. The 10-day streak + 1K token holder earns roughly <strong>2.8× more tickets per day</strong>.</p>

      <p>The logarithmic curve means there are diminishing returns at higher tiers — going from 1K to 10K tokens only adds +1 ticket per vote. This design rewards broad token distribution over whale concentration.</p>
    `
  },

  'rarity-system': {
    title: 'Rarity System — How Meme Rarity Is Calculated',
    description: 'Technical breakdown of AI MemeForge rarity tiers, percentile algorithm, cold-start thresholds, and community scoring mechanics.',
    body: `
      <h2>Rarity Overview</h2>
      <p>Every meme on AI MemeForge earns a rarity level based on community votes. Rarity isn't assigned by the AI — it's <strong>determined entirely by the community</strong> through the rarity voting system. Higher-rated memes earn rarer tiers, which increases their collectibility and perceived value as NFTs.</p>

      <h3>The Five Rarity Tiers</h3>
      <table>
        <thead><tr><th>Tier</th><th>Percentile Range</th><th>Color</th><th>Frequency</th></tr></thead>
        <tbody>
          <tr><td>Common</td><td>0 – 40%</td><td style="color:#D1D5DB">Gray</td><td>Most memes (~40%)</td></tr>
          <tr><td>Uncommon</td><td>40 – 65%</td><td style="color:#6EE7B7">Green</td><td>~25% of memes</td></tr>
          <tr><td>Rare</td><td>65 – 85%</td><td style="color:#93C5FD">Blue</td><td>~20% of memes</td></tr>
          <tr><td>Epic</td><td>85 – 95%</td><td style="color:#C4B5FD">Purple</td><td>~10% of memes</td></tr>
          <tr><td>Legendary</td><td>95 – 100%</td><td style="color:#FCD34D">Gold</td><td>Top ~5% only</td></tr>
        </tbody>
      </table>

      <h3>How Rarity Scores Work</h3>
      <p>During the voting period, users rate each meme on a <strong>1-10 scale</strong>. The system calculates the <strong>average score</strong> across all rarity voters (rounded to 1 decimal place). This average score is then compared against all historical memes to determine a percentile ranking.</p>

      <h3>The Percentile Algorithm</h3>
      <p>Once a meme's voting period ends, the rarity engine runs a <strong>left-sided empirical CDF</strong> (cumulative distribution function):</p>
      <ol>
        <li>Collect average scores from all historical memes</li>
        <li>Count how many historical scores fall <em>below</em> the target meme's score</li>
        <li>Calculate: <code>percentile = (belowCount / totalCount) × 100</code></li>
        <li>Map the percentile to a rarity tier using the thresholds above</li>
      </ol>
      <p>This means rarity is <strong>relative, not absolute</strong>. A score of 7.5 might be "Rare" today but "Uncommon" next month if the overall quality of memes increases. The system self-calibrates over time.</p>

      <h3>Cold-Start Mode</h3>
      <p>When the platform has fewer than <strong>30 total memes</strong>, there isn't enough historical data for meaningful percentiles. In this case, the system uses fixed score thresholds instead:</p>
      <table>
        <thead><tr><th>Tier</th><th>Maximum Score</th></tr></thead>
        <tbody>
          <tr><td>Common</td><td>≤ 4.0</td></tr>
          <tr><td>Uncommon</td><td>≤ 5.5</td></tr>
          <tr><td>Rare</td><td>≤ 7.0</td></tr>
          <tr><td>Epic</td><td>≤ 8.5</td></tr>
          <tr><td>Legendary</td><td>> 8.5</td></tr>
        </tbody>
      </table>
      <p>Once the platform crosses 30 memes, it automatically transitions to the percentile-based system for fairer, more dynamic rarity assignment.</p>

      <h3>Why This Design Matters</h3>
      <p>Traditional NFT rarity is set by creators. AI MemeForge inverts this — the <strong>community decides rarity through voting</strong>. This creates genuine consensus value: a Legendary meme earned that status because the community collectively rated it in the top 5%. No manipulation, no random assignment, just crowd wisdom.</p>
    `
  },

  'memeya-agent': {
    title: 'Meet Memeya — The Autonomous AI Agent',
    description: 'Architecture overview of Memeya, the AI agent behind AI MemeForge: multi-model pipeline, social posting, and community engagement.',
    body: `
      <h2>Who Is Memeya?</h2>
      <p>Memeya is the autonomous AI agent that powers AI MemeForge. She operates around the clock without human intervention — generating daily memes, posting on social media, engaging with the Telegram community, and managing the entire platform lifecycle. Think of her as an AI creative director who never sleeps.</p>

      <h3>Multi-Model Architecture</h3>
      <p>Memeya doesn't rely on a single AI model. Instead, she uses a <strong>multi-model pipeline</strong> where each model handles what it's best at:</p>
      <table>
        <thead><tr><th>Model</th><th>Provider</th><th>Role</th></tr></thead>
        <tbody>
          <tr><td>Gemini</td><td>Google</td><td>Image generation — creates the actual meme artwork in various art styles</td></tr>
          <tr><td>Grok</td><td>xAI</td><td>News research & social content — fetches real-time crypto news, writes X posts</td></tr>
          <tr><td>Claude</td><td>Anthropic</td><td>Vision analysis & reasoning — evaluates image quality, handles complex decisions</td></tr>
        </tbody>
      </table>

      <h3>Daily Operations</h3>
      <p>Memeya's daily routine is orchestrated through a cloud-based task scheduler that triggers key operations at strategic intervals throughout the day:</p>
      <ul>
        <li><strong>Meme generation</strong> — Fetches trending crypto news, selects art styles, and produces 3 unique memes with AI-generated artwork</li>
        <li><strong>Voting management</strong> — Opens and closes the daily voting window, tallies results, and calculates rarity scores</li>
        <li><strong>Lottery execution</strong> — Runs the weighted random draw and selects the daily winner</li>
        <li><strong>NFT minting</strong> — Mints the winning meme as a Solana pNFT with Arweave-permanent storage</li>
      </ul>

      <h3>Meme Generation Pipeline</h3>
      <p>Each meme goes through a multi-step pipeline:</p>
      <ol>
        <li><strong>News discovery</strong> — Grok searches for trending crypto headlines via web search</li>
        <li><strong>Concept creation</strong> — AI combines the news hook with meme humor and selects a randomized art style</li>
        <li><strong>Image generation</strong> — Gemini renders the meme artwork in the chosen style</li>
        <li><strong>Quality check</strong> — Claude evaluates the output for visual quality and relevance</li>
        <li><strong>Upload & store</strong> — The final meme is uploaded and stored in the database with full metadata</li>
      </ol>

      <h3>Social Presence</h3>
      <p>Memeya maintains an active social presence across multiple platforms:</p>
      <ul>
        <li><strong>X (Twitter)</strong> — Posts at randomized intervals throughout the day with quality-gated content. Each post goes through a relevance and engagement filter before publishing. Follow: <a href="https://x.com/AiMemeForgeIO">@AiMemeForgeIO</a></li>
        <li><strong>Telegram</strong> — Active in the <a href="https://t.me/MemeyaOfficialCommunity">Memeya Official Community</a> group, responding to conversations in real-time and sharing spontaneous thoughts when the group is quiet</li>
        <li><strong>Moltbook</strong> — Cross-posts curated content to <a href="https://www.moltbook.com/u/memeya">her Moltbook profile</a></li>
      </ul>

      <h3>Infrastructure Stack</h3>
      <table>
        <thead><tr><th>Component</th><th>Technology</th></tr></thead>
        <tbody>
          <tr><td>Backend API</td><td>Node.js on Google Cloud Run</td></tr>
          <tr><td>Database</td><td>Google Firestore</td></tr>
          <tr><td>Task Scheduling</td><td>GCP Cloud Scheduler</td></tr>
          <tr><td>Frontend</td><td>React + Vite on Vercel</td></tr>
          <tr><td>Blockchain</td><td>Solana (SPL tokens, Metaplex pNFTs)</td></tr>
          <tr><td>Permanent Storage</td><td>Arweave</td></tr>
          <tr><td>Authentication</td><td>Privy (embedded wallets)</td></tr>
          <tr><td>Social Graph</td><td>Tapestry Protocol (on-chain comments)</td></tr>
        </tbody>
      </table>

      <p>The entire system is designed to run autonomously. Once deployed, Memeya handles everything from content creation to community management without requiring manual intervention. The platform is fully open-source on <a href="https://github.com/sonyschan/SolanaHacker">GitHub</a>.</p>
    `
  }
};

const SLUGS = Object.keys(DOCS);

// ─── Shared HTML helpers ───────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sharedHead(title, description, canonicalUrl, schemaJson) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)} | AI MemeForge</title>
  <meta name="title" content="${escapeHtml(title)} | AI MemeForge">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(title)} | AI MemeForge">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${SITE_URL}/images/logo-192.png">
  <meta property="og:site_name" content="AI MemeForge — Meme as a Service">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)} | AI MemeForge">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:site" content="@AIMemeForge">

  <!-- Schema.org -->
  ${schemaJson}

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
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }

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
    .nav-links a.active { color: #06b6d4; font-weight: 600; }

    /* Article content */
    .article h2 {
      font-size: 26px;
      font-weight: 700;
      color: #06b6d4;
      margin: 32px 0 16px;
    }
    .article h2:first-child { margin-top: 0; }
    .article h3 {
      font-size: 18px;
      font-weight: 600;
      color: #a5b4fc;
      margin: 28px 0 10px;
    }
    .article p {
      color: #d1d5db;
      font-size: 15px;
      line-height: 1.75;
      margin-bottom: 14px;
    }
    .article ul, .article ol {
      color: #d1d5db;
      font-size: 15px;
      line-height: 1.8;
      padding-left: 1.5rem;
      margin-bottom: 14px;
    }
    .article li { margin-bottom: 4px; }
    .article a { color: #06b6d4; text-decoration: none; }
    .article a:hover { text-decoration: underline; }
    .article strong { color: #e2e8f0; }
    .article code {
      background: rgba(6,182,212,0.12);
      color: #22d3ee;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .article table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    .article th {
      background: rgba(6,182,212,0.1);
      color: #06b6d4;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 2px solid rgba(6,182,212,0.25);
      font-weight: 600;
    }
    .article td {
      padding: 9px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      color: #d1d5db;
    }
    .article tr:hover td { background: rgba(255,255,255,0.03); }
    .formula {
      background: rgba(6,182,212,0.08);
      border: 1px solid rgba(6,182,212,0.2);
      border-radius: 10px;
      padding: 14px 20px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 15px;
      color: #22d3ee;
      margin: 16px 0;
      text-align: center;
    }

    /* Index card grid */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }
    .doc-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 28px;
      text-decoration: none;
      transition: transform 0.2s, border-color 0.2s;
      display: block;
    }
    .doc-card:hover {
      transform: translateY(-4px);
      border-color: rgba(6,182,212,0.5);
    }
    .doc-card h3 {
      color: #06b6d4;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .doc-card p {
      color: #9ca3af;
      font-size: 14px;
      line-height: 1.6;
    }
    .doc-card .arrow {
      display: inline-block;
      margin-top: 14px;
      color: #06b6d4;
      font-size: 14px;
      font-weight: 600;
    }

    /* Back link */
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #9ca3af;
      text-decoration: none;
      font-size: 14px;
      margin-bottom: 24px;
      transition: color 0.2s;
    }
    .back-link:hover { color: #06b6d4; }

    /* Footer */
    .footer {
      text-align: center;
      padding: 40px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
      margin-top: 60px;
    }
    .footer-tagline { font-size: 18px; color: #9ca3af; margin-bottom: 16px; }
    .footer-links a { color: #06b6d4; text-decoration: none; margin: 0 12px; }
  </style>
</head>`;
}

function sharedHeader(activeSlug) {
  return `
  <div class="container">
    <header class="header">
      <a href="${SITE_URL}" class="logo">
        <img src="${SITE_URL}/images/logo-64.png" alt="AI MemeForge">
        AI MemeForge
      </a>
      <nav class="nav-links">
        <a href="${SITE_URL}">Forge</a>
        <a href="${SITE_URL}#gallery">Gallery</a>
        <a href="${SITE_URL}#lottery">Lottery</a>
        <a href="${SITE_URL}/docs" class="active">Docs</a>
        <a href="${SITE_URL}/#wiki">Wiki</a>
      </nav>
    </header>`;
}

function sharedFooter() {
  return `
    <footer class="footer">
      <div class="footer-tagline">AI Dreams. Humans Decide.</div>
      <div class="footer-links">
        <a href="${SITE_URL}">Home</a>
        <a href="${SITE_URL}/docs">Docs</a>
        <a href="${SITE_URL}/#wiki">Wiki</a>
        <a href="https://x.com/AiMemeForgeIO" target="_blank">Twitter</a>
        <a href="https://t.me/MemeyaOfficialCommunity" target="_blank">Telegram</a>
      </div>
      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
        &copy; 2026 AI MemeForge. Powered by AI &amp; Solana.
      </p>
    </footer>
  </div>
</body>
</html>`;
}

// ─── Index page ────────────────────────────────────────────────────────────────

function renderIndex() {
  const canonicalUrl = `${SITE_URL}/docs`;
  const title = 'Documentation — AI MemeForge Knowledge Base';
  const description = 'In-depth guides to AI MemeForge: how the daily cycle works, $Memeya tokenomics, rarity system mechanics, and Memeya agent architecture.';

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": canonicalUrl,
    "publisher": {
      "@type": "Organization",
      "name": "AI MemeForge",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/images/logo-192.png` }
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": SLUGS.map((slug, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${SITE_URL}/docs/${slug}`,
        "name": DOCS[slug].title
      }))
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "AI MemeForge", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Documentation", "item": canonicalUrl }
    ]
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is AI MemeForge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AI MemeForge is a community-curated AI meme platform on Solana. Every day, an autonomous AI agent generates 3 crypto memes from real-time news. The community votes for free, a weighted lottery picks a winner, and the top meme is minted as a Solana NFT. One meme, one winner, every day."
        }
      },
      {
        "@type": "Question",
        "name": "How do I participate in AI MemeForge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Connect any Solana wallet (Phantom, Solflare, or sign in with Google via Privy) and vote on daily memes — completely free, no gas fees. Each vote earns lottery tickets. Hold $Memeya tokens for bonus tickets. The more tickets you accumulate, the higher your chance of winning the daily NFT."
        }
      },
      {
        "@type": "Question",
        "name": "What is the $Memeya token?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "$Memeya is the SPL utility token on Solana (CA: mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump). Holding $Memeya boosts daily lottery ticket earnings with a logarithmic bonus: 10 tokens = +1, 1K = +3, 100K = +5 extra tickets per vote. Available on PumpFun."
        }
      },
      {
        "@type": "Question",
        "name": "How does the daily reward system work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "At 23:55 UTC daily, Memeya's Crossmint wallet automatically distributes USDC rewards: $3 to the meme winner (most-voted meme's lottery winner), $2 to a random lucky voter, and $1 to a second lucky voter. Total daily payout is $6 USDC, sent directly to winners' Solana wallets."
        }
      }
    ]
  };

  const schemaJson = `<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>
  <script type="application/ld+json">${JSON.stringify(faqData)}</script>`;

  const cards = [
    { slug: 'how-it-works', icon: '&#9881;', label: 'How It Works', desc: 'The complete daily cycle — meme generation, voting, lottery, and NFT minting explained step by step.' },
    { slug: 'tokenomics', icon: '&#128176;', label: '$Memeya Tokenomics', desc: 'Token contract details, bonus tier table, ticket mechanics, and strategic implications for holders.' },
    { slug: 'rarity-system', icon: '&#127922;', label: 'Rarity System', desc: 'Five rarity tiers, the percentile algorithm, cold-start thresholds, and how community votes determine rarity.' },
    { slug: 'memeya-agent', icon: '&#129302;', label: 'Memeya Agent', desc: 'Multi-model AI architecture, meme generation pipeline, social posting, and infrastructure stack.' }
  ];

  return `${sharedHead(title, description, canonicalUrl, schemaJson)}
<body>
${sharedHeader('index')}

    <article class="article">
      <h1 style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">Documentation</h1>
      <p style="color: #9ca3af; font-size: 16px; margin-bottom: 24px;">Everything you need to know about AI MemeForge — community-curated AI memes on Solana.</p>

      <h2>What Is AI MemeForge?</h2>
      <p>AI MemeForge is a fully autonomous AI meme platform on Solana. Every day at midnight UTC, an AI agent named Memeya generates <strong>3 unique crypto memes</strong> from real-time news. The community votes for free — no gas fees, no tokens required. At 23:55 UTC, a weighted lottery selects one winner who receives the top-voted meme as a <strong>Solana NFT</strong> plus <strong>$3 USDC</strong> in rewards. Two additional lucky voters receive $2 and $1 USDC respectively.</p>

      <h2>Quick Reference</h2>
      <table>
        <thead><tr><th>Feature</th><th>Details</th></tr></thead>
        <tbody>
          <tr><td>Daily memes</td><td>3 AI-generated memes at 00:00 UTC from real-time crypto news</td></tr>
          <tr><td>Voting</td><td>Free, unlimited wallet types (Phantom, Solflare, Google sign-in)</td></tr>
          <tr><td>Lottery</td><td>Weighted random draw at 23:55 UTC — more tickets = higher odds</td></tr>
          <tr><td>Daily rewards</td><td>$3 winner + $2 lucky voter + $1 lucky voter (USDC via Crossmint)</td></tr>
          <tr><td>NFT standard</td><td>Metaplex pNFT on Solana, stored permanently on Arweave</td></tr>
          <tr><td>Token</td><td>$Memeya (SPL) — hold for bonus lottery tickets</td></tr>
          <tr><td>AI agent</td><td>Memeya — autonomous posting on X, Telegram, and Moltbook</td></tr>
        </tbody>
      </table>

      <h2>Frequently Asked Questions</h2>

      <h3>What is AI MemeForge?</h3>
      <p>AI MemeForge is a community-curated AI meme platform on Solana. Every day, an autonomous AI agent generates 3 crypto memes from real-time news. The community votes for free, a weighted lottery picks a winner, and the top meme is minted as a Solana NFT. One meme, one winner, every day.</p>

      <h3>How do I participate?</h3>
      <p>Connect any Solana wallet (Phantom, Solflare, or sign in with Google via Privy) and vote on daily memes — completely free, no gas fees. Each vote earns lottery tickets. Hold $Memeya tokens for bonus tickets. The more tickets you accumulate, the higher your chance of winning the daily NFT.</p>

      <h3>What is the $Memeya token?</h3>
      <p>$Memeya is the SPL utility token on Solana (CA: <code>mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump</code>). Holding $Memeya boosts daily lottery ticket earnings with a logarithmic bonus: 10 tokens = +1, 1K = +3, 100K = +5 extra tickets per vote. Available on <a href="https://pump.fun/coin/mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump">PumpFun</a>.</p>

      <h3>How does the daily reward system work?</h3>
      <p>At 23:55 UTC daily, Memeya's Crossmint wallet automatically distributes USDC rewards: $3 to the meme winner (most-voted meme's lottery winner), $2 to a random lucky voter, and $1 to a second lucky voter. Total daily payout is $6 USDC, sent directly to winners' Solana wallets.</p>
    </article>

    <h2 style="font-size: 22px; font-weight: 700; color: #06b6d4; margin: 40px 0 16px;">Explore the Docs</h2>
    <div class="card-grid">
      ${cards.map(c => `
      <a href="${SITE_URL}/docs/${c.slug}" class="doc-card">
        <h3>${c.icon}&ensp;${c.label}</h3>
        <p>${c.desc}</p>
        <span class="arrow">Read more &rarr;</span>
      </a>`).join('')}
      <a href="${SITE_URL}/#wiki" class="doc-card" style="border-color: rgba(168,85,247,0.3); background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.08));">
        <h3>&#x1F4D6;&ensp;Wiki — Getting Started</h3>
        <p>Interactive onboarding guide with how-to, tokenomics, roadmap &amp; FAQ — available in English, 简体中文, and 繁體中文.</p>
        <span class="arrow">Open Wiki &rarr;</span>
      </a>
    </div>

${sharedFooter()}`;
}

// ─── Article page ──────────────────────────────────────────────────────────────

function renderArticle(slug) {
  const doc = DOCS[slug];
  if (!doc) return null;

  const canonicalUrl = `${SITE_URL}/docs/${slug}`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": doc.title,
    "description": doc.description,
    "url": canonicalUrl,
    "datePublished": "2026-02-25",
    "dateModified": "2026-02-25",
    "author": {
      "@type": "Organization",
      "name": "AI MemeForge",
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "AI MemeForge",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/images/logo-192.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "AI MemeForge", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Docs", "item": `${SITE_URL}/docs` },
      { "@type": "ListItem", "position": 3, "name": doc.title, "item": canonicalUrl }
    ]
  };

  const schemaJson = `<script type="application/ld+json">${JSON.stringify(schemaData)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbData)}</script>`;

  return `${sharedHead(doc.title, doc.description, canonicalUrl, schemaJson)}
<body>
${sharedHeader(slug)}

    <a href="${SITE_URL}/docs" class="back-link">&larr; Back to Docs</a>

    <article class="article">
      <h1 style="font-size: 30px; font-weight: 700; margin-bottom: 24px; line-height: 1.25;">${escapeHtml(doc.title)}</h1>
      ${doc.body}
    </article>

${sharedFooter()}`;
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export default function handler(req, res) {
  const { slug } = req.query;

  let html;
  if (!slug || slug === 'index') {
    html = renderIndex();
  } else if (DOCS[slug]) {
    html = renderArticle(slug);
  } else {
    return res.redirect(302, `${SITE_URL}/docs`);
  }

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(html);
}
