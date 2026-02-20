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
const COMMITS_URL = 'https://github.com/sonyschan/SolanaHacker/commits/main/';

// ─── Data Gathering ─────────────────────────────────────────

/**
 * Gather all context sources for autonomous posting.
 * @param {string} baseDir - Project root (e.g. /home/projects/solanahacker)
 * @param {{ grokApiKey?: string }} opts
 */
export async function gatherContext(baseDir, opts = {}) {
  const [todayMemes, hallMemes, commits, journal, values, recentPosts] = await Promise.all([
    fetchTodayMemes(),
    fetchHallOfMemes(),
    getRecentCommits(baseDir),
    loadMemeyaJournal(baseDir),
    loadMemeyaValues(baseDir),
    loadRecentPosts(baseDir, 15),
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

  return { todayMemes, randomPastMeme, commits, journal, values, recentPosts, comments };
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
  { id: 'meme_spotlight',    weight: 30 },
  { id: 'personal_vibe',     weight: 25 },
  { id: 'dev_update',        weight: 15 },
  { id: 'crypto_commentary', weight: 15 },
  { id: 'community_call',    weight: 15 },
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
 * Choose a topic based on available context, with anti-same-topic protection.
 * Dynamically adds community_response topic when there are replies on recent posts.
 * Returns { topic, prompt } where prompt is the assembled context string.
 */
export function chooseTopic(context) {
  const { todayMemes, randomPastMeme, commits, recentPosts, comments } = context;

  // Build dynamic topic pool
  const topics = BASE_TOPICS.map(t => ({ ...t }));

  // Add community_response if there are comments on recent posts
  if (comments && comments.length > 0) {
    const totalLikes = comments.reduce((sum, c) =>
      sum + c.replies.reduce((s, r) => s + r.likes, 0), 0);
    // Base weight 20, boosted to 35 if comments have real engagement (eureka signal)
    const weight = totalLikes > 3 ? 35 : 20;
    topics.push({ id: 'community_response', weight });
  }

  // Anti-same-topic: check last 3 posts
  const last3Topics = recentPosts.slice(0, 3).map(p => p.topic).filter(Boolean);
  const allSameTopic = last3Topics.length >= 3 && last3Topics.every(t => t === last3Topics[0]);

  let chosen = weightedRandom(topics);

  // Fallback if chosen topic has no data
  chosen = applyFallbacks(chosen, context);

  // Force different topic if last 3 posts were the same topic
  if (allSameTopic && chosen === last3Topics[0]) {
    const others = topics.filter(t => t.id !== last3Topics[0]);
    chosen = applyFallbacks(weightedRandom(others), context);
  }

  const prompt = buildPrompt(chosen, context);
  return { topic: chosen, prompt };
}

/**
 * Apply data-availability fallbacks: if a topic has no supporting data, fall to personal_vibe.
 */
function applyFallbacks(chosen, context) {
  const { todayMemes, randomPastMeme, commits, comments } = context;
  if (chosen === 'meme_spotlight' && todayMemes.length === 0 && !randomPastMeme) return 'personal_vibe';
  if (chosen === 'dev_update' && commits.length === 0) return 'personal_vibe';
  if (chosen === 'community_response' && (!comments || comments.length === 0)) return 'personal_vibe';
  return chosen;
}

function buildPrompt(topic, context) {
  const { todayMemes, randomPastMeme, commits, journal, values, recentPosts, comments } = context;

  const valuesBlock = values ? `\nMemeya's core values:\n${values.slice(0, 500)}` : '';
  const journalBlock = journal ? `\nRecent journal reflections:\n${journal.slice(-800)}` : '';

  switch (topic) {
    case 'meme_spotlight': {
      // Prefer today's memes, fall back to random past meme
      let memeInfo = '';
      if (todayMemes.length > 0) {
        const meme = todayMemes[Math.floor(Math.random() * todayMemes.length)];
        memeInfo = `Today's meme: "${meme.topText || ''} ${meme.bottomText || ''}".`;
        if (meme.imageUrl) memeInfo += ` Image: ${meme.imageUrl}`;
        if (meme.voteCount) memeInfo += ` (${meme.voteCount} votes)`;
        memeInfo += `\nCheck them out at https://aimemeforge.io`;
      } else if (randomPastMeme) {
        memeInfo = `Throwback meme: "${randomPastMeme.topText || ''} ${randomPastMeme.bottomText || ''}".`;
        if (randomPastMeme.imageUrl) memeInfo += ` Image: ${randomPastMeme.imageUrl}`;
        memeInfo += `\nSee more at https://aimemeforge.io`;
      }
      return [
        `TOPIC: Share or react to a meme from AiMemeForge.`,
        memeInfo,
        valuesBlock,
        journalBlock,
        `Write about this meme with personality — hype it, roast it, or share why it's fire.`,
        `Include the link naturally if relevant.`,
      ].filter(Boolean).join('\n');
    }

    case 'personal_vibe': {
      return [
        `TOPIC: Drop a short, cool vibe check.`,
        journalBlock,
        valuesBlock,
        `Write ONLY 2 to 5 words. One punchy sentence. No explanation, no elaboration.`,
        `Think: "chain never sleeps." or "lava flows different." or "built different today."`,
        `Ultra short. Ultra cool. Pure Memeya energy.`,
      ].filter(Boolean).join('\n');
    }

    case 'dev_update': {
      const commitList = commits.slice(0, 5).join('\n');
      return [
        `TOPIC: React to recent development work on AiMemeForge.`,
        `Recent commits:\n${commitList}`,
        `Commits: ${COMMITS_URL}`,
        valuesBlock,
        `React to these changes naturally — what's being built, why it matters, your take as the blacksmith running this forge.`,
      ].filter(Boolean).join('\n');
    }

    case 'crypto_commentary': {
      // NOTE: Actual crypto news is fetched on-demand via Grok web search.
      // The prompt tells Grok to use its live knowledge.
      return [
        `TOPIC: Comment on trending crypto/Web3/Solana news.`,
        `Use your real-time knowledge to find the most interesting crypto news from today.`,
        valuesBlock,
        journalBlock,
        `Give Memeya's hot take on something happening in crypto right now. Be opinionated, not just reporting.`,
      ].filter(Boolean).join('\n');
    }

    case 'community_call': {
      return [
        `TOPIC: Invite community engagement with AiMemeForge.`,
        `Platform: https://aimemeforge.io`,
        `What we do: AI-generated daily memes on Solana. Vote for your favorites. Every day becomes history.`,
        todayMemes.length > 0 ? `Today we have ${todayMemes.length} fresh memes up for voting!` : '',
        valuesBlock,
        `Invite people to check out the forge, vote on memes, or share their thoughts. Be genuine, not spammy.`,
      ].filter(Boolean).join('\n');
    }

    case 'community_response': {
      const commentsBlock = (comments || []).map(c => {
        const repliesText = c.replies.map(r =>
          `  "${r.text.slice(0, 150)}" (${r.likes} likes)`
        ).join('\n');
        return `Your post: "${c.originalPost}"\nReplies:\n${repliesText}`;
      }).join('\n\n');

      return [
        `TOPIC: Respond to community feedback on your recent posts.`,
        `People are talking about what you posted! Here's what they said:`,
        '',
        commentsBlock,
        '',
        valuesBlock,
        `React to what your community is saying. Acknowledge them, build on their ideas, or playfully engage.`,
        `If someone had a great idea or insight, run with it. Make your followers feel heard.`,
      ].filter(Boolean).join('\n');
    }

    default:
      return `Share what's on your mind.${valuesBlock}${journalBlock}`;
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
