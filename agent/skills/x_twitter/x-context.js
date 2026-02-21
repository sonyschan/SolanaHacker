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


// ─── Data Gathering ─────────────────────────────────────────

/**
 * Gather all context sources for autonomous posting.
 * @param {string} baseDir - Project root (e.g. /home/projects/solanahacker)
 * @param {{ grokApiKey?: string }} opts
 */
export async function gatherContext(baseDir, opts = {}) {
  const [todayMemes, hallMemes, commits, journal, values, recentPosts, productDoc] = await Promise.all([
    fetchTodayMemes(),
    fetchHallOfMemes(),
    getRecentCommits(baseDir),
    loadMemeyaJournal(baseDir),
    loadMemeyaValues(baseDir),
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

  return { todayMemes, randomPastMeme, commits, journal, values, recentPosts, comments, productDoc };
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

function loadMemeyaValues(baseDir) {
  try {
    return fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_values.md'), 'utf-8');
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
      const content = fs.readFileSync(path.join(diaryDir, file), 'utf-8');
      const blocks = content.split(/^## /m).filter(Boolean);
      for (const block of blocks) {
        const postedMatch = block.match(/- Posted: (.+)/);
        const topicMatch = block.match(/- Topic: (.+)/);
        const urlMatch = block.match(/- URL: (.+)/);
        if (postedMatch) {
          posts.push({
            text: postedMatch[1].trim(),
            topic: topicMatch ? topicMatch[1].trim() : null,
            url: urlMatch ? urlMatch[1].trim() : null,
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

const BASE_TOPICS = [
  { id: 'meme_spotlight',     weight: 30 },
  { id: 'personal_vibe',      weight: 25 },
  { id: 'feature_showtime',   weight: 15 },
  { id: 'crypto_commentary',  weight: 15 },
  { id: 'dev_update',         weight: 15 },
  // community_call disabled — no community yet
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
 * Choose a topic based on available context, with priority checks and anti-repetition.
 * Priority: dev_update (if fresh commits + not posted today) → weighted random.
 * Dynamically adds community_response when there are replies on recent posts.
 * Returns { topic, prompt, ogUrl, meta } where meta contains selection details.
 */
export function chooseTopic(context) {
  const { todayMemes, randomPastMeme, commits, recentPosts, comments } = context;

  // Build dynamic topic pool
  const topics = BASE_TOPICS.map(t => ({ ...t }));

  // Add community_response if there are comments on recent posts
  if (comments && comments.length > 0) {
    const totalLikes = comments.reduce((sum, c) =>
      sum + c.replies.reduce((s, r) => s + r.likes, 0), 0);
    const weight = totalLikes > 3 ? 35 : 20;
    topics.push({ id: 'community_response', weight });
  }

  // ── Priority check: dev_update (max 1/day, only with fresh commits) ──
  const todayTopics = recentPosts.map(p => p.topic).filter(Boolean);
  const devUpdateToday = todayTopics.includes('dev_update');
  const hasCommits = commits.length > 0;
  let priorityForced = null;

  if (hasCommits && !devUpdateToday) {
    priorityForced = 'dev_update';
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

  const { prompt, ogUrl } = buildPrompt(chosen, context);
  return {
    topic: chosen,
    prompt,
    ogUrl,
    meta: {
      pool: topics.map(t => ({ id: t.id, weight: t.weight })),
      last3Topics,
      antiRepeatTriggered,
      fallbackFrom: fallbackApplied ? initialPick : null,
      priorityForced,
      devUpdateToday,
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
  const { todayMemes, randomPastMeme, commits, journal, values, recentPosts, comments, productDoc } = context;

  const valuesBlock = values ? `\nMemeya's core values:\n${values.slice(0, 500)}` : '';
  const journalBlock = journal ? `\nRecent journal reflections:\n${journal.slice(-800)}` : '';

  switch (topic) {
    case 'meme_spotlight': {
      // Prefer today's memes, fall back to random past meme
      let memeInfo = '';
      let ogUrl = `${SITE_URL}`;
      if (todayMemes.length > 0) {
        const meme = todayMemes[Math.floor(Math.random() * todayMemes.length)];
        const memeTitle = meme.title || meme.topText || 'Untitled';
        const memeDesc = meme.description || meme.bottomText || '';
        memeInfo = `Today's meme: "${memeTitle}". ${memeDesc}`;
        if (meme.newsSource) memeInfo += ` News angle: ${meme.newsSource}.`;
        if (meme.style) memeInfo += ` Art style: ${meme.style}.`;
        if (meme.imageUrl) memeInfo += ` Image: ${meme.imageUrl}`;
        if (meme.id) ogUrl = `${SITE_URL}/meme/${meme.id}`;
      } else if (randomPastMeme) {
        const pastTitle = randomPastMeme.title || randomPastMeme.topText || 'Untitled';
        const pastDesc = randomPastMeme.description || randomPastMeme.bottomText || '';
        memeInfo = `Throwback meme: "${pastTitle}". ${pastDesc}`;
        if (randomPastMeme.imageUrl) memeInfo += ` Image: ${randomPastMeme.imageUrl}`;
        if (randomPastMeme.id) ogUrl = `${SITE_URL}/meme/${randomPastMeme.id}`;
      }
      const prompt = [
        `TOPIC: Share or react to a meme from AiMemeForge.`,
        memeInfo,
        valuesBlock,
        journalBlock,
        `Write about this meme with personality — hype it, roast it, or share why it's fire.`,
        `Keep your text under 250 chars — a link will be appended automatically.`,
        `Do NOT include any URL yourself. Just write the tweet text.`,
      ].filter(Boolean).join('\n');
      return { prompt, ogUrl };
    }

    case 'personal_vibe': {
      return { prompt: [
        `TOPIC: Share a raw, personal thought or vibe.`,
        journalBlock,
        valuesBlock,
        `Write something real — a mood, a thought, a feeling. Can be short or medium length.`,
        `Avoid repeating "lava", "forge", "hammer" every time — find fresh angles from your journal and values.`,
        `Think: inner monologue, a quiet observation, something only Memeya would say.`,
      ].filter(Boolean).join('\n'), ogUrl: null };
    }

    case 'dev_update': {
      const commitList = commits.slice(0, 5).join('\n');
      return { prompt: [
        `TOPIC: Share what YOU just upgraded or crafted on AiMemeForge.`,
        `You are Memeya, the builder. These are changes YOU made (for context — DO NOT include GitHub links):`,
        commitList,
        valuesBlock,
        `Write as if YOU personally upgraded the system — "just shipped...", "upgraded my...", "spent all night crafting...".`,
        `Talk about what it means for users, not the technical git details. Be proud of your work.`,
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
        valuesBlock,
        `Pick one feature randomly and talk about it from YOUR perspective as the builder.`,
        `Explain what it does and why it's cool — like showing a friend around your creation.`,
        `Be specific about the feature, not generic. Show you know how it works.`,
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
        valuesBlock,
        journalBlock,
        `Give Memeya's hot take on something happening in crypto right now. Be opinionated, not just reporting.`,
      ].filter(Boolean).join('\n'), ogUrl: null };
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
        valuesBlock,
        `React to what your community is saying. Acknowledge them, build on their ideas, or playfully engage.`,
        `If someone had a great idea or insight, run with it. Make your followers feel heard.`,
      ].filter(Boolean).join('\n'), ogUrl: null };
    }

    default:
      return { prompt: `Share what's on your mind.${valuesBlock}${journalBlock}`, ogUrl: null };
  }
}

// ─── Post Logging ───────────────────────────────────────────

/**
 * Append a post entry to Memeya's daily diary.
 */
export function logPost(baseDir, topic, text, url) {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const diaryDir = path.join(baseDir, 'memory/journal/memeya');
    if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
    const diaryPath = path.join(diaryDir, `${dateStr}.md`);
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const entry = `## ${time}\n- Topic: ${topic}\n- Posted: ${text}\n- URL: ${url}\n\n`;
    fs.appendFileSync(diaryPath, entry);
  } catch (err) {
    console.error('[x-context] logPost error:', err.message);
  }
}
