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
const COMMUNITY_ID = '2025765989582004365';
const OWN_USERNAME = 'AiMemeForgeIO';
export const TRUSTED_OWNER_USERNAMES = ['h2crypto_eth'];


// ─── Data Gathering ─────────────────────────────────────────

/**
 * Gather all context sources for autonomous posting.
 * @param {string} baseDir - Project root (e.g. /home/projects/solanahacker)
 * @param {{ grokApiKey?: string }} opts
 */
export async function gatherContext(baseDir, opts = {}) {
  const [todayMemes, hallMemes, commits, journal, recentPosts, productDoc] = await Promise.all([
    fetchTodayMemes(),
    fetchHallOfMemes(),
    getRecentCommits(baseDir),
    loadMemeyaJournal(baseDir),
    loadRecentPosts(baseDir, 15),
    loadProductDoc(baseDir),
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

  return { todayMemes, randomPastMeme, commits, journal, recentPosts, comments, productDoc };
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
        const timeMatch = block.match(/^(\d{2}:\d{2}:\d{2})/);
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
  const { todayMemes, randomPastMeme, commits, recentPosts, comments } = context;

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
  const hasCommits = commits.length > 0;
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
    // Remove dev_update from pool if already posted today or no commits
    const pool = devUpdateToday || !hasCommits
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
  const { todayMemes, randomPastMeme, commits, comments, productDoc } = context;
  if (chosen === 'meme_spotlight' && todayMemes.length === 0 && !randomPastMeme) return 'personal_vibe';
  if (chosen === 'dev_update' && commits.length === 0) return 'personal_vibe';
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
      const commitList = commits.slice(0, 5).join('\n');
      return { prompt: [
        `TOPIC: Share what YOU just upgraded or crafted on AiMemeForge.`,
        `You are Memeya, the builder. These are changes YOU made (for context — DO NOT include GitHub links):`,
        commitList,
        `Write as if YOU personally upgraded the system. Talk about what it means for users, not the technical details.`,
        `FORMAT: Use a structured, listicle-style tweet. Use "．" or emoji bullets (🔧 🎨 ⚡ 🧠 etc.) to list 2-3 key updates.`,
        `Start with a short punchy intro line, then bullet points. Example format:`,
        `"been cooking today ngl\n⚡ faster voting flow\n🎨 new rarity badges\n🧠 smarter meme picks\nwho noticed?"`,
        `TONE: Professional but playful — like a dev who's proud of their work but keeps it chill. Slight flex energy.`,
        `Vary your framing — don't always say "just shipped". Try: "today's patch notes ↓", "small upgrades, big vibes", "changelog nobody asked for"`,
        `Never include GitHub links. Never say "commit" or "merge".`,
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

// ─── Community Engagement ────────────────────────────────────

/**
 * Fetch latest posts from our X community + their replies.
 * Returns posts with comments, excluding Memeya's own posts and replies.
 * @returns {Promise<Array<{ tweetId, authorUsername, text, replies: Array<{ tweetId, authorUsername, text, likes }> }>>}
 */
export async function fetchCommunityPosts() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return [];

  let TwitterApi;
  try {
    const mod = await import('twitter-api-v2');
    TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
  } catch { return []; }

  const appClient = new TwitterApi(bearerToken);

  try {
    // Get Memeya's user ID to filter self
    const me = await appClient.v2.userByUsername(OWN_USERNAME);
    const ownUserId = me.data?.id;

    // Search for recent posts in the community
    const result = await appClient.v2.search(`community_id:${COMMUNITY_ID}`, {
      max_results: 10,
      'tweet.fields': 'created_at,public_metrics,author_id,conversation_id',
      'user.fields': 'username,name',
      expansions: 'author_id',
      sort_order: 'recency',
    });

    if (!result.data?.data?.length) return [];

    // Build user lookup
    const users = {};
    for (const u of (result.data?.includes?.users || [])) {
      users[u.id] = { username: u.username, name: u.name };
    }

    // Filter out Memeya's own posts, take top 5
    const posts = result.data.data
      .filter(t => t.author_id !== ownUserId)
      .slice(0, 5);

    // For each post, fetch up to 5 latest replies
    const postsWithReplies = [];
    for (const post of posts) {
      const author = users[post.author_id] || { username: 'unknown', name: 'Unknown' };
      const entry = {
        tweetId: post.id,
        authorUsername: author.username,
        authorName: author.name,
        text: post.text,
        likes: post.public_metrics?.like_count || 0,
        replies: [],
      };

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const repliesRes = await fetch(
          `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${post.id}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username`,
          { headers: { Authorization: `Bearer ${bearerToken}` }, signal: controller.signal }
        );
        clearTimeout(timeout);

        if (repliesRes.ok) {
          const repliesData = await repliesRes.json();
          const replyUsers = {};
          for (const u of (repliesData?.includes?.users || [])) {
            replyUsers[u.id] = u.username;
          }

          entry.replies = (repliesData.data || [])
            // Exclude own replies and the original post itself
            .filter(r => {
              const username = replyUsers[r.author_id] || '';
              return r.id !== post.id && username.toLowerCase() !== OWN_USERNAME.toLowerCase();
            })
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 5)
            .map(r => ({
              tweetId: r.id,
              authorUsername: replyUsers[r.author_id] || 'unknown',
              text: r.text,
              likes: r.public_metrics?.like_count || 0,
            }));
        }
      } catch { /* graceful — skip replies for this post */ }

      postsWithReplies.push(entry);
    }

    return postsWithReplies;
  } catch (err) {
    console.error('[x-context] fetchCommunityPosts error:', err.message);
    return [];
  }
}

/**
 * Load IDs of tweets Memeya has already replied to (from journal).
 * Prevents duplicate replies across heartbeats.
 */
export function loadRepliedTweetIds(baseDir, daysBack = 3) {
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
      const matches = content.matchAll(/- Replied to tweet: (\d+)/g);
      for (const m of matches) ids.add(m[1]);
    }
  } catch { /* ignore */ }
  return ids;
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

    // Source 2: Community posts from trusted owner accounts (no @mention needed)
    const bearerToken = process.env.X_BEARER_TOKEN;
    if (bearerToken) {
      try {
        const appClient = new TwitterApi(bearerToken);
        const result = await appClient.v2.search(`community_id:${COMMUNITY_ID}`, {
          max_results: 20,
          'tweet.fields': 'created_at,conversation_id,author_id',
          'user.fields': 'username',
          expansions: 'author_id',
          sort_order: 'recency',
        });
        // parseTweets filters to trustedLower usernames; parentTweet will be null for community posts
        parseTweets(result.data?.data, result.data?.includes);
      } catch (err) {
        console.error('[x-context] fetchOwnerMentions community search error:', err.message);
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
  } catch (err) {
    console.error('[x-context] logPost error:', err.message);
  }
}
