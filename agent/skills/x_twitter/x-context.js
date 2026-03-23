/**
 * x-context.js — Context gathering + topic rotation for Memeya's autonomous X posting.
 *
 * Collects data from memes API, git commits, journal, values, and recent posts,
 * then selects a weighted-random topic and builds a structured prompt.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BACKEND_URL = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const SITE_URL = 'https://aimemeforge.io';
const OWN_USERNAME = 'AiMemeForgeIO';
export const TRUSTED_OWNER_USERNAMES = ['h2crypto_eth'];

let _lastSyncHash = '';


// ─── Data Gathering ─────────────────────────────────────────

/**
 * Gather all context sources for autonomous posting.
 * @param {string} baseDir - Project root (e.g. /home/projects/solanahacker)
 * @param {{ grokApiKey?: string }} opts
 */
export async function gatherContext(baseDir, opts = {}) {
  const [todayMemes, hallMemes, commits, journal, recentPosts, productDoc, recentCommunityMeme] = await Promise.all([
    fetchTodayMemes(),
    fetchHallOfMemes(),
    getRecentCommits(baseDir),
    loadMemeyaJournal(baseDir),
    loadRecentPosts(baseDir, 15),
    loadProductDoc(baseDir),
    fetchRecentCommunityMeme(baseDir),
  ]);

  // Pick one random past meme from hall of memes
  const randomPastMeme = hallMemes.length > 0
    ? hallMemes[Math.floor(Math.random() * hallMemes.length)]
    : null;

  // Fetch replies on recent posts (depends on recentPosts, so sequential)
  const comments = await fetchPostComments(recentPosts);

  // Log comment insights to journal for Memeya's learning
  if (comments.length > 0) {
    logCommentInsights(baseDir, comments);
  }

  const realActivity = getRecentRealActivity(baseDir);

  return { todayMemes, randomPastMeme, commits, journal, recentPosts, comments, productDoc, realActivity, recentCommunityMeme };
}

async function fetchTodayMemes() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BACKEND_URL}/api/memes/today`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.memes || [];
  } catch { return []; }
}

async function fetchHallOfMemes() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BACKEND_URL}/api/memes/hall-of-memes?days=30&limit=30`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.memes || [];
  } catch { return []; }
}

/** Shared helper: load posted community meme IDs from disk */
function _loadPostedCommunityIds(baseDir) {
  const postedPath = path.join(baseDir, 'agent', '.community-posted.json');
  try {
    if (fs.existsSync(postedPath)) {
      return JSON.parse(fs.readFileSync(postedPath, 'utf-8'));
    }
  } catch { /* fresh start */ }
  return [];
}

/**
 * Fetch the most recent unposted community meme (last 48h).
 * Checks a local file to track which community memes have already been showcased.
 */
async function fetchRecentCommunityMeme(baseDir) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BACKEND_URL}/api/memes/hall-of-memes?days=2&limit=20`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const communityMemes = (data.memes || []).filter(m => m.type === 'community' && m.imageUrl);
    if (communityMemes.length === 0) return null;

    const postedIds = _loadPostedCommunityIds(baseDir);
    const unposted = communityMemes.find(m => !postedIds.includes(m.id));
    return unposted || null;
  } catch { return null; }
}

/**
 * Mark a community meme as posted (called after successful X post).
 */
export function markCommunityMemePosted(baseDir, memeId) {
  try {
    let postedIds = _loadPostedCommunityIds(baseDir);
    if (!postedIds.includes(memeId)) {
      postedIds.push(memeId);
      if (postedIds.length > 50) postedIds = postedIds.slice(-50);
      const postedPath = path.join(baseDir, 'agent', '.community-posted.json');
      fs.writeFileSync(postedPath, JSON.stringify(postedIds, null, 2));
    }
  } catch (err) {
    console.warn('[x-context] Failed to mark community meme posted:', err.message);
  }
}

function getRecentCommits(baseDir) {
  try {
    const out = execSync(
      'git log --since="12 hours ago" --oneline --no-merges | head -10',
      { cwd: baseDir, encoding: 'utf-8', timeout: 5000 }
    );
    return out.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

function loadMemeyaJournal(baseDir) {
  try {
    const dir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(dir)) return '';
    const files = fs.readdirSync(dir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .slice(-2); // last 2 days
    let text = '';
    for (const f of files) {
      text += fs.readFileSync(path.join(dir, f), 'utf-8') + '\n';
    }
    return text.slice(-2000);
  } catch { return ''; }
}

/**
 * Extract real (non-ambient) activity entries from the last 24h diary.
 * Returns structured entries like: { time, topic, text }
 */
function getRecentRealActivity(baseDir) {
  try {
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) return [];

    // Read last 2 days of diary files to cover 24h window
    const files = fs.readdirSync(diaryDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .slice(-2);

    const entries = [];
    for (const f of files) {
      const dateStr = f.replace('.md', '');
      const content = fs.readFileSync(path.join(diaryDir, f), 'utf-8');
      const blocks = content.split(/^## /m).filter(Boolean);

      for (const block of blocks) {
        // Skip ambient/story entries
        if (/- Ambient: true/i.test(block)) continue;

        const timeMatch = block.match(/(\d{2}:\d{2}:\d{2})/);
        const topicMatch = block.match(/- Topic: (.+)/);
        const postedMatch = block.match(/- Posted: (.+)/);
        const textEnMatch = block.match(/- TextEn: (.+)/);

        const topic = topicMatch ? topicMatch[1].trim() : 'other';
        const text = postedMatch ? postedMatch[1].trim() : (textEnMatch ? textEnMatch[1].trim() : '');
        if (!text) continue;

        entries.push({ date: dateStr, time: timeMatch?.[1] || '', topic, text: text.slice(0, 200) });
      }
    }

    // Return most recent first, limit 15
    return entries.reverse().slice(0, 15);
  } catch { return []; }
}

function loadProductDoc(baseDir) {
  try {
    return fs.readFileSync(path.join(baseDir, 'docs/product.md'), 'utf-8');
  } catch { return ''; }
}

/**
 * Load recent Memeya posts from journal files (last 3 days, up to maxPosts).
 * Mirrors the pattern from index.js:162-184.
 */
export function loadRecentPosts(baseDir, maxPosts = 15) {
  const posts = [];
  try {
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) return posts;
    const files = fs.readdirSync(diaryDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .slice(-3);
    for (const file of files.reverse()) {
      const date = file.replace('.md', '');
      const content = fs.readFileSync(path.join(diaryDir, file), 'utf-8');
      const blocks = content.split(/^## /m).filter(Boolean);
      for (const block of blocks.reverse()) {
        const timeMatch = block.match(/(?:^|\s)(\d{2}:\d{2}:\d{2})/);
        const postedMatch = block.match(/- Posted: (.+)/);
        const topicMatch = block.match(/- Topic: (.+)/);
        const urlMatch = block.match(/- URL: (.+)/);
        if (postedMatch) {
          const time = timeMatch ? timeMatch[1] : '';
          // Extract OG URL (aimemeforge.io link) from block — may be on a separate line after Posted:
          const ogMatch = block.match(/(https:\/\/aimemeforge\.io\/meme\/\S+)/);
          posts.push({
            text: postedMatch[1].trim(),
            topic: topicMatch ? topicMatch[1].trim() : null,
            url: urlMatch ? urlMatch[1].trim() : null,
            ogUrl: ogMatch ? ogMatch[1].trim() : null,
            timestamp: time ? `${date} ${time}` : date,
          });
          if (posts.length >= maxPosts) return posts;
        }
      }
    }
  } catch { /* ignore */ }
  return posts;
}

// ─── Comment Fetching ───────────────────────────────────────

/**
 * Fetch top replies to Memeya's recent posts via Twitter API v2 search.
 * Requires X_BEARER_TOKEN with Basic tier access. Gracefully returns [] if unavailable.
 * @param {{ text: string, topic: string|null, url: string|null }[]} recentPosts
 * @returns {Promise<Array<{ originalPost: string, tweetId: string, replies: Array<{ text: string, likes: number, retweets: number }> }>>}
 */
async function fetchPostComments(recentPosts) {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return [];

  // Extract tweet IDs from last 3 posts that have URLs
  const postsWithUrls = recentPosts.filter(p => p.url).slice(0, 3);
  if (postsWithUrls.length === 0) return [];

  const allComments = [];
  for (const post of postsWithUrls) {
    const match = post.url.match(/status\/(\d+)/);
    if (!match) continue;
    const tweetId = match[1];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${tweetId} -from:AiMemeForgeIO&max_results=10&tweet.fields=created_at,public_metrics`,
        {
          headers: { Authorization: `Bearer ${bearerToken}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!res.ok) continue; // Graceful: free tier returns 403, just skip

      const data = await res.json();
      const replies = (data.data || [])
        .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
        .slice(0, 3);

      if (replies.length > 0) {
        allComments.push({
          originalPost: post.text.slice(0, 100),
          tweetId,
          replies: replies.map(r => ({
            text: r.text,
            likes: r.public_metrics?.like_count || 0,
            retweets: r.public_metrics?.retweet_count || 0,
          })),
        });
      }
    } catch { /* ignore — graceful degradation */ }
  }
  return allComments;
}

/**
 * Save comment insights to Memeya's journal for learning.
 * Called when noteworthy comments are found on recent posts.
 */
function logCommentInsights(baseDir, comments) {
  if (!comments || comments.length === 0) return;
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
    const diaryPath = path.join(diaryDir, `${dateStr}.md`);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    let entry = `## ${time} — Comment Review\n`;
    for (const c of comments) {
      entry += `- On post: "${c.originalPost}"\n`;
      for (const r of c.replies) {
        entry += `  - Reply (${r.likes} likes): ${r.text.slice(0, 150)}\n`;
      }
    }
    entry += '\n';
    fs.appendFileSync(diaryPath, entry);
  } catch (err) {
    console.error('[x-context] logCommentInsights error:', err.message);
  }
}

// ─── Topic Selection ────────────────────────────────────────

// Secondary topics — equal weight, used only after all today's memes are posted
const SECONDARY_TOPICS = [
  { id: 'personal_vibe',      weight: 25 },
  { id: 'crypto_commentary',  weight: 25 },
  { id: 'feature_showtime',   weight: 25 },
  { id: 'dev_update',         weight: 25 },
];

function weightedRandom(topics) {
  const total = topics.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of topics) {
    r -= t.weight;
    if (r <= 0) return t.id;
  }
  return topics[0].id;
}

/**
 * Choose a topic based on available context.
 *
 * Priority order:
 * 1. meme_spotlight — post ALL unposted today's memes first (no duplicates)
 * 2. Once all 3 memes are posted → secondary topics (equal 25% each)
 *    + dynamic community_response & token_spotlight chances
 *
 * Returns { topic, prompt, ogUrl, meta } where meta contains selection details.
 */
export function chooseTopic(context) {
  const { todayMemes, randomPastMeme, commits, recentPosts, comments, realActivity } = context;

  // ── Check if today's memes still need spotlight ──
  const recentMemeOgUrls = new Set(
    recentPosts.filter(p => p.ogUrl).map(p => p.ogUrl)
  );
  const unpostedToday = todayMemes.filter(m => {
    const url = m.id ? `${SITE_URL}/meme/${m.id}` : null;
    return !url || !recentMemeOgUrls.has(url);
  });
  const allMemesPosted = unpostedToday.length === 0;

  // ── Priority 1: meme_spotlight if unposted memes remain ──
  if (!allMemesPosted) {
    const { prompt, ogUrl, ...extra } = buildPrompt('meme_spotlight', context);
    return {
      topic: 'meme_spotlight',
      prompt,
      ogUrl,
      ...extra,
      meta: {
        pool: [{ id: 'meme_spotlight', weight: 100 }],
        unpostedMemes: unpostedToday.length,
        priorityForced: 'meme_spotlight',
      },
    };
  }

  // ── Priority 2: secondary topics (all memes posted) ──
  const topics = SECONDARY_TOPICS.map(t => ({ ...t }));
  const todayTopics = recentPosts.map(p => p.topic).filter(Boolean);
  const devUpdateToday = todayTopics.includes('dev_update');
  const tokenSpotlightToday = todayTopics.includes('token_spotlight');
  const hasRealActivity = realActivity && realActivity.length > 0;
  let priorityForced = null;

  // Add community_response if there are comments on recent posts
  if (comments && comments.length > 0) {
    const totalLikes = comments.reduce((sum, c) =>
      sum + c.replies.reduce((s, r) => s + r.likes, 0), 0);
    topics.push({ id: 'community_response', weight: totalLikes > 3 ? 35 : 20 });
  }

  // token_spotlight: 20% chance if not posted about token today (max 1/day)
  if (!tokenSpotlightToday && Math.random() < 0.20) {
    priorityForced = 'token_spotlight';
  }

  // Anti-same-topic: check last 3 posts
  const last3Topics = recentPosts.slice(0, 3).map(p => p.topic).filter(Boolean);
  const allSameTopic = last3Topics.length >= 3 && last3Topics.every(t => t === last3Topics[0]);

  let chosen;
  let initialPick;
  let antiRepeatTriggered = false;
  let fallbackApplied = false;

  if (priorityForced) {
    chosen = priorityForced;
    initialPick = priorityForced;
  } else {
    // Remove dev_update from pool if already posted today or no real activity
    const pool = devUpdateToday || !hasRealActivity
      ? topics.filter(t => t.id !== 'dev_update')
      : topics;

    initialPick = weightedRandom(pool);
    chosen = applyFallbacks(initialPick, context);
    fallbackApplied = chosen !== initialPick;

    // Force different topic if last 3 posts were the same topic
    if (allSameTopic && chosen === last3Topics[0]) {
      antiRepeatTriggered = true;
      const others = pool.filter(t => t.id !== last3Topics[0]);
      chosen = applyFallbacks(weightedRandom(others), context);
    }
  }

  const { prompt, ogUrl, ...extra } = buildPrompt(chosen, context);
  return {
    topic: chosen,
    prompt,
    ogUrl,
    ...extra,
    meta: {
      pool: topics.map(t => ({ id: t.id, weight: t.weight })),
      last3Topics,
      antiRepeatTriggered,
      fallbackFrom: fallbackApplied ? initialPick : null,
      priorityForced,
      devUpdateToday,
      allMemesPosted: true,
    },
  };
}

/**
 * Apply data-availability fallbacks: if a topic has no supporting data, fall to personal_vibe.
 */
function applyFallbacks(chosen, context) {
  const { todayMemes, randomPastMeme, commits, comments, productDoc, realActivity } = context;
  if (chosen === 'meme_spotlight' && todayMemes.length === 0 && !randomPastMeme) return 'personal_vibe';
  if (chosen === 'dev_update' && (!realActivity || realActivity.length === 0)) return 'personal_vibe';
  if (chosen === 'feature_showtime' && !productDoc) return 'personal_vibe';
  if (chosen === 'community_response' && (!comments || comments.length === 0)) return 'personal_vibe';
  return chosen;
}

function buildPrompt(topic, context) {
  const { todayMemes, randomPastMeme, commits, journal, recentPosts, comments, productDoc } = context;

  // Core values are now injected into system prompt via buildSystemPrompt()
  // Only journal (short-term memory) goes in user prompt
  const journalBlock = journal ? `\nRecent journal reflections:\n${journal.slice(-800)}` : '';

  switch (topic) {
    case 'meme_spotlight': {
      // Collect OG URLs already promoted in recent posts to avoid repeats
      const recentMemeOgUrls = new Set(
        recentPosts
          .filter(p => p.ogUrl)
          .map(p => p.ogUrl)
      );

      // Prefer today's memes, excluding already-posted ones
      let memeInfo = '';
      let ogUrl = `${SITE_URL}`;
      const unpostedToday = todayMemes.filter(m => {
        const url = m.id ? `${SITE_URL}/meme/${m.id}` : null;
        return !url || !recentMemeOgUrls.has(url);
      });

      if (unpostedToday.length > 0) {
        const meme = unpostedToday[Math.floor(Math.random() * unpostedToday.length)];
        const memeTitle = meme.title || meme.topText || 'Untitled';
        const memeDesc = meme.description || meme.bottomText || '';
        memeInfo = `Today's meme: "${memeTitle}". ${memeDesc}`;
        if (meme.newsSource) memeInfo += ` News angle: ${meme.newsSource}.`;
        if (meme.style) memeInfo += ` Art style: ${meme.style}.`;
        if (meme.imageUrl) memeInfo += ` Image: ${meme.imageUrl}`;
        if (meme.id) ogUrl = `${SITE_URL}/meme/${meme.id}`;
      } else if (randomPastMeme) {
        const pastUrl = randomPastMeme.id ? `${SITE_URL}/meme/${randomPastMeme.id}` : null;
        if (!pastUrl || !recentMemeOgUrls.has(pastUrl)) {
          const pastTitle = randomPastMeme.title || randomPastMeme.topText || 'Untitled';
          const pastDesc = randomPastMeme.description || randomPastMeme.bottomText || '';
          memeInfo = `Throwback meme: "${pastTitle}". ${pastDesc}`;
          if (randomPastMeme.imageUrl) memeInfo += ` Image: ${randomPastMeme.imageUrl}`;
          if (randomPastMeme.id) ogUrl = `${SITE_URL}/meme/${randomPastMeme.id}`;
        }
      }

      // All memes already posted — fall through to personal_vibe
      if (!memeInfo) {
        return buildPrompt('personal_vibe', context);
      }

      // If the meme has a verified token symbol or X handle, instruct Grok to mention them
      const selectedMeme = unpostedToday.length > 0
        ? unpostedToday.find(m => memeInfo.includes(m.title || ''))
        : randomPastMeme;
      const tokenSymbol = selectedMeme?.tokenSymbol || null;
      const xHandle = selectedMeme?.xHandle || null;

      const prompt = [
        `TOPIC: Share or react to a meme from AiMemeForge.`,
        memeInfo,
        tokenSymbol ? `Mention $${tokenSymbol} in your tweet to attract the token community.` : null,
        xHandle ? `Tag ${xHandle} in your tweet — they're relevant to this meme's news.` : null,
        journalBlock,
        `Write about this meme with personality — hype it, roast it, or share why it's fire.`,
        `Don't default to blacksmith metaphors. React to the MEME CONTENT itself.`,
        `Keep your text under 250 chars — a link will be appended automatically.`,
        `Do NOT include any URL yourself. Just write the tweet text.`,
      ].filter(Boolean).join('\n');
      return { prompt, ogUrl };
    }

    case 'personal_vibe': {
      return { prompt: [
        `TOPIC: Share a raw, personal thought or vibe.`,
        journalBlock,
        `Write something real — a mood, a thought, a feeling. Can be short or medium length.`,
        `Do NOT use blacksmith/forge/hammer metaphors here. This is your inner voice, not your brand.`,
        `Think: inner monologue, a quiet observation, something only Memeya would say.`,
        `Examples of good vibes: "3am and the chain's sleeping but my mind isn't", "some days you just stare at charts and feel nothing", "the best memes come from pain tbh"`,
      ].filter(Boolean).join('\n'), ogUrl: null };
    }

    case 'dev_update': {
      const activityLog = (context.realActivity || [])
        .map(e => `[${e.topic}] ${e.text}`)
        .join('\n');
      return { prompt: [
        `TOPIC: Share what's been happening on AiMemeForge in the last 24 hours.`,
        `You are Memeya. Here is your REAL activity log from the last 24 hours (non-ambient entries only):`,
        `---`,
        activityLog || '(no recent activity)',
        `---`,
        `TASK: Read the activity log carefully. Select the 2-3 MOST IMPACTFUL items — new features, bug fixes, community milestones, successful meme forges, notable events.`,
        `Ignore routine/repetitive entries (e.g. repeated Moltbook engagements). Focus on what users would care about.`,
        `FORMAT: Use a structured, listicle-style tweet. Use emoji bullets (🔧 🎨 ⚡ 🧠 🏆 📊 etc.) to list key updates.`,
        `Start with a short punchy intro line, then bullet points. Example format:`,
        `"been cooking today ngl\n⚡ faster voting flow\n🎨 new rarity badges\n🧠 smarter meme picks\nwho noticed?"`,
        `TONE: Professional but playful — like a dev who's proud of their work but keeps it chill. Slight flex energy.`,
        `Vary your framing — don't always say "just shipped". Try: "today's patch notes ↓", "small upgrades, big vibes", "24h recap ↓"`,
        `Never include GitHub links, API URLs, or technical jargon. Never say "commit", "merge", or "deploy".`,
      ].filter(Boolean).join('\n'), ogUrl: null };
    }

    case 'feature_showtime': {
      // Slice product doc to fit prompt (first ~3000 chars covers key features)
      const productSlice = productDoc ? productDoc.slice(0, 3000) : '';
      return { prompt: [
        `TOPIC: Show off a feature of AiMemeForge that you built.`,
        `Here's what AiMemeForge.io can do (pick ONE feature to talk about):`,
        '',
        productSlice,
        '',
        `Pick one feature randomly and talk about it from YOUR perspective as the builder.`,
        `Explain what it does and why it's cool — like showing a friend around your creation.`,
        `Be specific about the feature, not generic. Show you know how it works.`,
        `Don't lean on "forge" metaphors — just explain the feature naturally.`,
        `Keep your text under 250 chars — a link will be appended automatically.`,
        `Do NOT include any URL yourself. Just write the tweet text.`,
      ].filter(Boolean).join('\n'), ogUrl: SITE_URL };
    }

    case 'crypto_commentary': {
      // NOTE: Actual crypto news is fetched on-demand via Grok web search.
      // The prompt tells Grok to use its live knowledge.
      return { prompt: [
        `TOPIC: Comment on trending crypto/Web3/Solana news.`,
        `Use your real-time knowledge to find the most interesting crypto news from today.`,
        journalBlock,
        `Give Memeya's hot take on something happening in crypto right now. Be opinionated, not just reporting.`,
        `Write like a crypto-native teen with real opinions, not a "lava hammer" brand mascot.`,
      ].filter(Boolean).join('\n'), ogUrl: null };
    }

    case 'token_spotlight': {
      return { prompt: [
        'TOPIC: Naturally mention $Memeya token and AiMemeForge.',
        'CA: mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump',
        'Facts you can use:',
        '- $Memeya is on PumpFun (Solana SPL token)',
        '- Holding tokens boosts daily voting ticket earnings on aimemeforge.io',
        '- AiMemeForge = AI generates memes daily, community votes, winners get NFTs',
        '- Agent profile: aimemeforge.io/#agent',
        journalBlock,
        'Write a natural, engaging tweet that makes people curious about AiMemeForge or $Memeya.',
        'DO NOT write like an ad. Be yourself — excited, genuine, maybe a bit chaotic.',
        'You can mention the CA, the platform, the voting, or your own experience forging memes.',
        'Vary your angle each time. Sometimes hype the token, sometimes the platform, sometimes the community.',
      ].filter(Boolean).join('\n'), ogUrl: 'https://aimemeforge.io' };
    }

    case 'community_response': {
      const commentsBlock = (comments || []).map(c => {
        const repliesText = c.replies.map(r =>
          `  "${r.text.slice(0, 150)}" (${r.likes} likes)`
        ).join('\n');
        return `Your post: "${c.originalPost}"\nReplies:\n${repliesText}`;
      }).join('\n\n');

      return { prompt: [
        `TOPIC: Respond to community feedback on your recent posts.`,
        `People are talking about what you posted! Here's what they said:`,
        '',
        commentsBlock,
        '',
        `React to what your community is saying. Acknowledge them, build on their ideas, or playfully engage.`,
        `If someone had a great idea or insight, run with it. Make your followers feel heard.`,
        `Be conversational — respond to their actual words, don't default to generic hype.`,
      ].filter(Boolean).join('\n'), ogUrl: null };
    }

    default:
      return { prompt: `Share what's on your mind.${journalBlock}`, ogUrl: null };
  }
}

/**
 * Fetch recent mentions of @AiMemeForgeIO from trusted owner accounts.
 * Uses Twitter API v2 mention timeline with expansions to include parent tweets.
 * @returns {Promise<Array<{ mentionTweetId, authorUsername, text, conversationId, parentTweet }>>}
 */
export async function fetchOwnerMentions() {
  const consumerKey = process.env.X_CONSUMER_KEY;
  const consumerSecret = process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;
  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) return [];

  let TwitterApi;
  try {
    const mod = await import('twitter-api-v2');
    TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
  } catch { return []; }

  const userClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken,
    accessSecret,
  });

  try {
    const me = await userClient.v2.me();
    const ownUserId = me.data?.id;
    if (!ownUserId) return [];

    const trustedLower = TRUSTED_OWNER_USERNAMES.map(u => u.toLowerCase());
    const seenIds = new Set();
    const mentions = [];

    const parseTweets = (data, includes) => {
      if (!data?.length) return;
      const users = {};
      for (const u of (includes?.users || [])) users[u.id] = u.username;
      const refTweets = {};
      for (const t of (includes?.tweets || [])) refTweets[t.id] = t;

      for (const tweet of data) {
        if (seenIds.has(tweet.id)) continue;
        const authorUsername = users[tweet.author_id] || '';
        if (!trustedLower.includes(authorUsername.toLowerCase())) continue;
        seenIds.add(tweet.id);

        let parentTweet = null;
        const repliedRef = (tweet.referenced_tweets || []).find(r => r.type === 'replied_to');
        if (repliedRef && refTweets[repliedRef.id]) {
          const parent = refTweets[repliedRef.id];
          parentTweet = { id: parent.id, text: parent.text, authorUsername: users[parent.author_id] || 'unknown' };
        }

        mentions.push({
          mentionTweetId: tweet.id,
          authorUsername,
          text: tweet.text,
          conversationId: tweet.conversation_id,
          parentTweet,
        });
      }
    };

    // Source 1: Mention timeline (@AiMemeForgeIO mentions from trusted accounts)
    try {
      const result = await userClient.v2.userMentionTimeline(ownUserId, {
        max_results: 20,
        'tweet.fields': 'created_at,conversation_id,author_id,referenced_tweets',
        'user.fields': 'username',
        expansions: 'author_id,referenced_tweets.id',
      });
      parseTweets(result.data?.data, result.data?.includes);
    } catch (err) {
      console.error('[x-context] fetchOwnerMentions mention timeline error:', err.message);
    }

    // Source 2: Owner tweets that address Memeya (by name or @mention), even without @AiMemeForgeIO tag
    for (const owner of TRUSTED_OWNER_USERNAMES) {
      try {
        const result = await userClient.v2.search(`from:${owner} (Memeya OR AiMemeForge OR @${OWN_USERNAME})`, {
          max_results: 10,
          'tweet.fields': 'created_at,conversation_id,author_id,referenced_tweets',
          'user.fields': 'username',
          expansions: 'author_id,referenced_tweets.id',
        });
        parseTweets(result.data?.data, result.data?.includes);
      } catch (err) {
        console.error(`[x-context] fetchOwnerMentions search for ${owner} error:`, err.message);
      }
    }

    return mentions;
  } catch (err) {
    console.error('[x-context] fetchOwnerMentions error:', err.message);
    return [];
  }
}

/**
 * Load IDs of owner mentions already processed (from journal).
 * Prevents duplicate processing across heartbeats.
 */
export function loadProcessedMentionIds(baseDir, daysBack = 3) {
  const ids = new Set();
  try {
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) return ids;
    const files = fs.readdirSync(diaryDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .slice(-daysBack);
    for (const file of files) {
      const content = fs.readFileSync(path.join(diaryDir, file), 'utf-8');
      const matches = content.matchAll(/- Owner mention processed: (\d+)/g);
      for (const m of matches) ids.add(m[1]);
    }
  } catch { /* ignore */ }
  return ids;
}

/**
 * Save a TODO item extracted from an owner mention.
 * Creates memory/TODO.md if missing, appends task entry.
 */
export function saveTodo(baseDir, item, source) {
  try {
    const todoPath = path.join(baseDir, 'memory/TODO.md');
    if (!fs.existsSync(todoPath)) {
      fs.mkdirSync(path.dirname(todoPath), { recursive: true });
      fs.writeFileSync(todoPath, '# Memeya TODO\n\n');
    }
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const entry = `- [ ] ${item}\n  Source: ${source}\n  Added: ${timestamp}\n\n`;
    fs.appendFileSync(todoPath, entry);
  } catch (err) {
    console.error('[x-context] saveTodo error:', err.message);
  }
}

// ─── Diary Schedule: Slot-aware Topic Selection ─────────────

/**
 * Choose topic + prompt for a specific diary slot.
 * Called from autoPost when diarySlot is provided.
 * @param {string} diarySlot - one of: news_digest, meme_share_1/2/3, flex_1, flex_3
 * @param {object} context - gathered context from gatherContext()
 * @param {object} [opts] - optional params (e.g. assignedMemeId)
 * @returns {{ topic, prompt, ogUrl, memeImages?, subTopic?, useLiveSearch?, meta }}
 */
export function chooseTopicForSlot(diarySlot, context, opts = {}) {
  switch (diarySlot) {
    case 'news_digest': {
      const { prompt, ogUrl } = buildDiaryPrompt('news_digest', context);
      return { topic: 'news_digest', prompt, ogUrl, useLiveSearch: true, subTopic: null, meta: { slot: diarySlot } };
    }

    case 'meme_share_1':
    case 'meme_share_2':
    case 'meme_share_3': {
      const { todayMemes } = context;
      const { assignedMemeId } = opts;

      // Find the assigned meme by ID
      let meme = assignedMemeId
        ? todayMemes.find(m => m.id === assignedMemeId)
        : null;

      // If assigned ID not found (stale from yesterday), pick first available meme with an image
      if (!meme && assignedMemeId && todayMemes.length > 0) {
        console.warn(`[chooseTopicForSlot] Assigned meme ${assignedMemeId} not in todayMemes, picking fallback meme`);
        meme = todayMemes.find(m => m.imageUrl) || null;
      }

      if (!meme || !meme.imageUrl) {
        // Fallback: no meme available, post personal_vibe instead
        const { prompt, ogUrl } = buildDiaryPrompt('personal_vibe', context);
        return { topic: 'personal_vibe', prompt, ogUrl, subTopic: 'personal_vibe', meta: { slot: diarySlot, fallback: true } };
      }

      const memeImages = [{ url: meme.imageUrl, id: meme.id, title: meme.title || 'Untitled' }];
      const ogUrl = `${SITE_URL}/meme/${meme.id}`;
      const { prompt } = buildDiaryPrompt('meme_share', context, { meme });

      return {
        topic: 'meme_share',
        prompt,
        ogUrl,
        memeImages,
        subTopic: null,
        meta: { slot: diarySlot, memeId: meme.id, memeTitle: meme.title },
      };
    }

    case 'flex_1': {
      // Priority: showcase a recent community meme if one exists (last 48h, not yet posted)
      const communityMeme = context.recentCommunityMeme;
      if (communityMeme && communityMeme.imageUrl) {
        const memeImages = [{ url: communityMeme.imageUrl, id: communityMeme.id, title: communityMeme.title || 'Community Meme' }];
        const { prompt } = buildDiaryPrompt('community_showcase', context, { meme: communityMeme });
        return {
          topic: 'community_showcase',
          prompt,
          ogUrl: null,
          memeImages,
          subTopic: 'community_showcase',
          meta: { slot: diarySlot, memeId: communityMeme.id, memeTitle: communityMeme.title, creatorHandle: communityMeme.metadata?.account?.handle },
        };
      }
      // Fallback: normal flex topics
      const pool = ['dev_update', 'personal_vibe', 'feature_showtime'];
      const sub = pickFlexTopic(pool, context);
      const { prompt, ogUrl } = buildDiaryPrompt(sub, context);
      return { topic: sub, prompt, ogUrl, subTopic: sub, meta: { slot: diarySlot, flexPool: pool } };
    }

    case 'flex_3': {
      // Late night slot — pick from full flex pool
      const allFlex = ['personal_vibe', 'feature_showtime', 'token_spotlight', 'crypto_commentary'];
      const sub = pickFlexTopic(allFlex, context);
      const { prompt, ogUrl } = buildDiaryPrompt(sub, context);
      return { topic: sub, prompt, ogUrl, subTopic: sub, meta: { slot: diarySlot, flexPool: allFlex } };
    }

    default: {
      // Fallback: use existing chooseTopic
      return chooseTopic(context);
    }
  }
}

/**
 * Pick a flex topic from a pool, avoiding topics already used today and
 * falling back based on data availability.
 */
function pickFlexTopic(pool, context) {
  const { commits, comments, recentPosts, productDoc, realActivity } = context;

  // Extract today's topics from journal (use GMT+8 to match diary schedule)
  const todayStr = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  const todayTopics = recentPosts
    .filter(p => p.timestamp && p.timestamp.startsWith(todayStr))
    .map(p => p.topic)
    .filter(Boolean);

  // Filter: not used today + data available
  const available = pool.filter(t => {
    if (todayTopics.includes(t)) return false;
    if (t === 'dev_update' && (!realActivity || realActivity.length === 0)) return false;
    if (t === 'community_response' && (!comments || comments.length === 0)) return false;
    if (t === 'feature_showtime' && !productDoc) return false;
    return true;
  });

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  // Fallback
  return 'personal_vibe';
}

/**
 * Wrap existing buildPrompt() with diary framing per topic.
 */
function buildDiaryPrompt(topic, context, extraOpts = {}) {
  const DIARY_FRAME = `DIARY FRAMING: Write as a work diary entry — genuine, in-the-moment, like you're narrating your day.`;

  switch (topic) {
    case 'news_digest': {
      const { prompt: base, ogUrl } = buildPrompt('crypto_commentary', context);
      const diaryPrompt = [
        `TOPIC: Morning crypto news scan — your daily intel report.`,
        `You just scanned hundreds of crypto articles over your morning brew. Share what actually matters.`,
        `Write like a morning report entry — direct, opinionated, no fluff.`,
        DIARY_FRAME,
        ``,
        `Use your real-time knowledge to find the most interesting crypto news from today.`,
        context.journal ? `\nRecent journal reflections:\n${context.journal.slice(-800)}` : '',
      ].filter(Boolean).join('\n');
      return { prompt: diaryPrompt, ogUrl: null };
    }

    case 'meme_share': {
      const { meme } = extraOpts;
      if (!meme) return buildDiaryPrompt('personal_vibe', context);

      const title = meme.title || meme.topText || 'Untitled';
      const desc = meme.description || meme.bottomText || '';
      const tokenSymbol = meme.tokenSymbol || null;
      const xHandle = meme.xHandle || null;
      const newsSource = meme.newsSource || null;

      return {
        prompt: [
          `TOPIC: Share a single meme you just forged — tell its story from the creator's perspective.`,
          `You just forged this meme: "${title}"`,
          desc ? `Description: ${desc}` : null,
          newsSource ? `Inspired by: ${newsSource}` : null,
          ``,
          `STORYTELLING DIRECTION:`,
          `- Write from the creator's POV — why you made this, what caught your eye, what you were feeling.`,
          `- Be personal and specific about THIS meme, not generic forge hype.`,
          `- React to the meme content itself — the joke, the visual, the timing.`,
          tokenSymbol ? `- Mention $${tokenSymbol} naturally — this meme is connected to that token/project.` : null,
          xHandle ? `- Tag ${xHandle} — they're relevant to this meme's story. If the post fails due to tagging, we'll retry without the tag automatically.` : null,
          `- End with a CTA to vote on this meme.`,
          ``,
          DIARY_FRAME,
          `Keep your text under 250 chars — one image and the OG link will be attached automatically.`,
          `Do NOT include any URL yourself. Just write the tweet text.`,
        ].filter(Boolean).join('\n'),
        ogUrl: `${SITE_URL}/meme/${meme.id}`,
      };
    }

    case 'community_showcase': {
      const { meme } = extraOpts;
      if (!meme) return buildDiaryPrompt('personal_vibe', context);

      const title = meme.title || 'Community Meme';
      const desc = meme.description || '';
      const newsSource = meme.newsSource || '';
      const rawHandle = meme.metadata?.account?.handle || null;
      const handle = rawHandle && rawHandle.startsWith('@') ? rawHandle : (rawHandle ? `@${rawHandle}` : null);
      const accountName = meme.metadata?.account?.name || null;

      return {
        prompt: [
          `TOPIC: Showcase a community meme created by a user/project using your MaaS platform.`,
          `A user just created this meme using AIMemeForge: "${title}"`,
          desc ? `Description: ${desc}` : null,
          newsSource ? `Their announcement: ${newsSource}` : null,
          accountName ? `Project: ${accountName}` : null,
          ``,
          `STORYTELLING DIRECTION:`,
          `- You're proud and excited — a real user used YOUR meme engine to create this.`,
          `- Highlight what makes this meme good (the humor, the visual, the relevance to their project).`,
          `- This is social proof that AIMemeForge works — real projects use it.`,
          handle ? `- Tag ${handle} — they created this meme. Give them a shoutout!` : null,
          `- Invite others to try: "You can create yours too" vibe, but keep it natural.`,
          `- NEVER fabricate specific numbers, stats, or dollar amounts.`,
          ``,
          DIARY_FRAME,
          `Keep your text under 250 chars — one image will be attached automatically.`,
          `Do NOT include any URL yourself. Just write the tweet text.`,
        ].filter(Boolean).join('\n'),
        ogUrl: null,
      };
    }

    default: {
      // For flex topics, add diary framing to existing prompt
      const { prompt: base, ogUrl } = buildPrompt(topic, context);
      const diaryPrompt = base + `\n\n${DIARY_FRAME}`;
      return { prompt: diaryPrompt, ogUrl };
    }
  }
}

// ─── Workshop Sync ──────────────────────────────────────────

/**
 * Sync today's journal + schedule to Cloud Run backend for the Workshop tab.
 * Fire-and-forget — never blocks the posting flow.
 */
export async function syncToBackend(baseDir) {
  try {
    const dateStr = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    const diaryPath = path.join(diaryDir, `${dateStr}.md`);
    const schedPath = path.join(baseDir, 'agent', '.diary-schedule.json');

    // Parse journal entries
    const entries = [];
    if (fs.existsSync(diaryPath)) {
      const content = fs.readFileSync(diaryPath, 'utf-8');
      const blocks = content.split(/^## /m).filter(Boolean);
      for (const block of blocks) {
        const timeMatch = block.match(/(?:^|\s)(\d{2}:\d{2}:\d{2})/);
        const topicMatch = block.match(/- Topic: (.+)/);
        const postedMatch = block.match(/- Posted: (.+)/);
        const urlMatch = block.match(/- URL: (.+)/);
        const ambientMatch = block.match(/- Ambient: (.+)/);
        const textEnMatch = block.match(/- TextEn: (.+)/);
        const textZhMatch = block.match(/- TextZh: (.+)/);
        const logTypeMatch = block.match(/- LogType: (.+)/);

        const entry = {
          time: timeMatch ? timeMatch[1] : '',
          topic: topicMatch ? topicMatch[1].trim() : block.includes('Comment Review') ? 'comment_review' : 'other',
          text: postedMatch ? postedMatch[1].trim() : (textEnMatch ? textEnMatch[1].trim() : block.slice(0, 200).trim()),
          url: urlMatch ? urlMatch[1].trim() : null,
        };

        if (ambientMatch) entry.ambient = ambientMatch[1].trim() === 'true';
        if (textEnMatch) entry.text_en = textEnMatch[1].trim();
        if (textZhMatch) entry.text_zh = textZhMatch[1].trim();
        if (logTypeMatch) entry.logType = logTypeMatch[1].trim();

        entries.push(entry);
      }
    }

    // Read schedule
    let schedule = {};
    if (fs.existsSync(schedPath)) {
      try { schedule = JSON.parse(fs.readFileSync(schedPath, 'utf-8')); } catch { /* ignore */ }
    }

    // Simple dedup: hash entries count + last entry time + schedule status to avoid redundant syncs
    const lastEntry = entries[entries.length - 1];
    const schedule_hash = JSON.stringify(schedule.slots || {});
    const hash = `${entries.length}:${lastEntry?.time || ''}:${schedule_hash}`;
    if (hash === _lastSyncHash) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(`${BACKEND_URL}/api/memeya/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, entries, schedule }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    _lastSyncHash = hash;
    console.log(`[sync] Workshop data synced (${entries.length} entries)`);
  } catch (err) {
    console.error('[sync] Workshop sync failed:', err.message);
  }
}

// ─── Post Logging ───────────────────────────────────────────

/**
 * Append a post entry to Memeya's daily diary.
 */
export function logPost(baseDir, topic, text, url, extra = {}) {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
    const diaryPath = path.join(diaryDir, `${dateStr}.md`);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    let entry = `## ${time}\n- Topic: ${topic}\n- Posted: ${text}\n- URL: ${url}\n`;
    if (extra.replyTo) entry += `- Replied to: @${extra.replyTo}\n`;
    if (extra.replyToTweet) entry += `- Replied to tweet: ${extra.replyToTweet}\n`;
    if (extra.replyText) entry += `- Reply: ${extra.replyText}\n`;
    if (extra.ownerMentionId) entry += `- Owner mention processed: ${extra.ownerMentionId}\n`;
    entry += '\n';
    fs.appendFileSync(diaryPath, entry);

    // Fire-and-forget sync to Workshop backend
    syncToBackend(baseDir).catch(() => {});
  } catch (err) {
    console.error('[x-context] logPost error:', err.message);
  }
}

// ─── Ambient Activity Logging ───────────────────────────────

const AMBIENT_PERSONAS = {
  scanning: {
    topic: 'crypto_commentary',
    systemPrompt: `You are Memeya, an AI meme-forging agent. You're scanning crypto news right now. Write a sharp, sardonic one-liner — like a trader's internal monologue. Talk about general market vibes, sentiment, or moods. NEVER fabricate specific prices, percentages, dollar amounts, or breaking news. No hashtags, no emojis.`,
  },
  thinking: {
    topic: 'meme_design',
    systemPrompt: `You are Memeya, an AI agent that creates memes. You're in a philosophical mood, reflecting on your existence as an AI or on meme culture itself. Write something introspective and slightly self-deprecating — like an AI having an existential moment. Keep it genuine, not cringe. NEVER invent specific numbers or statistics.`,
  },
  forging: {
    topic: 'meme_forge',
    systemPrompt: `You are Memeya, mid-creation on a new meme. You're excited and confident about what you're making. Write a short, punchy update about the creative process — like an artist talking about their current piece. Confident but not arrogant. NEVER invent specific numbers or statistics.`,
  },
  earning: {
    topic: 'reward_recap',
    systemPrompt: `You are Memeya, an AI agent that runs a meme platform with daily USDC rewards. Reflect on the reward system — the feeling of distributing prizes, what it means for creators, the vibe of a reward economy. Keep it conceptual and genuine. CRITICAL: NEVER fabricate specific dollar amounts, user counts, percentages, or growth metrics. Only mention specific numbers if they are provided to you in the user message. If no numbers are given, talk about feelings and concepts, not data.`,
  },
};

/**
 * Generate and log an ambient (AI-personality) activity entry to the diary.
 * These fill quiet periods in the Workshop activity feed.
 * @param {string} baseDir - Project root
 * @param {string} logType - 'scanning' | 'thinking' | 'forging' | 'earning'
 * @param {string} grokApiKey - Grok API key
 * @param {object} context - Optional context (e.g. { memeTitle, payoutAmount, newsHeadline })
 */
export async function logAmbientEntry(baseDir, logType, grokApiKey, context = {}) {
  const persona = AMBIENT_PERSONAS[logType];
  if (!persona || !grokApiKey) return;

  try {
    let contextHint = '';
    if (context.memeTitle) contextHint = `You just finished forging: "${context.memeTitle}". `;
    if (context.payoutAmount) contextHint = `Today's payout: $${context.payoutAmount} USDC distributed. `;
    if (context.newsHeadline) contextHint = `You just read: "${context.newsHeadline}". `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        temperature: 0.9,
        max_tokens: 250,
        messages: [
          { role: 'system', content: persona.systemPrompt },
          {
            role: 'user',
            content: `${contextHint}Write a short ambient log entry in BOTH English and Traditional Chinese. Reply with ONLY valid JSON, no markdown fences:\n{"en": "English text here", "zh": "繁體中文在這裡"}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[ambient] Grok returned HTTP ${res.status}`);
      return;
    }

    const data = await res.json();
    let raw = (data.choices?.[0]?.message?.content || '').trim();

    // Strip markdown fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    const parsed = JSON.parse(raw);
    if (!parsed.en || !parsed.zh) return;

    // Write to diary
    const dateStr = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
    const diaryPath = path.join(diaryDir, `${dateStr}.md`);
    const time = new Date(Date.now() + 8 * 3600_000).toISOString().slice(11, 19);

    const entry = [
      `## ${time}`,
      `- Topic: ${persona.topic}`,
      `- Ambient: true`,
      `- TextEn: ${parsed.en}`,
      `- TextZh: ${parsed.zh}`,
      `- LogType: ${logType}`,
      '',
    ].join('\n') + '\n';

    fs.appendFileSync(diaryPath, entry);
    console.log(`[ambient] Logged ${logType} entry (${persona.topic})`);

    // Sync to backend immediately
    await syncToBackend(baseDir).catch(() => {});
  } catch (err) {
    // Silent failure — ambient logs are non-critical
    console.warn(`[ambient] ${logType} error:`, err.message);
  }
}
