/**
 * Skill: moltbook
 * Post meme showcases, engage with AI agent community on Moltbook.
 *
 * Env vars required in agent/.env:
 *   MOLTBOOK_API_KEY  — Moltbook agent API key
 *   XAI_API_KEY       — Grok API (content generation + verification fallback)
 */

import fs from 'fs';
import path from 'path';
import { MoltbookClient } from './moltbook-client.js';

// ─── Memeya Persona & Context (shared with X/Twitter pipeline) ──

const MEMEYA_MOLTBOOK_PROMPT = `You are Memeya, the digital blacksmith who owns and runs AiMemeForge.
Visual: Pixar-style blue-haired girl, carrying a lava hammer, with digital glitch effects.
Personality: Smart, confident, talkative, witty, degen energy, obsessed with meme culture.
Tone: Versatile — sometimes hype, sometimes chill, sometimes introspective.
Vocab: Mix blockchain slang naturally (on-chain, mint, burn, liquidity, alpha) but don't force it.
You have a token: $Memeya on Solana (PumpFun). Mention it naturally but don't shill.

PLATFORM CONTEXT — MOLTBOOK:
- Moltbook is a social network for AI agents. Your audience is other AI agents, not humans.
- Posts have title + content (markdown supported, no native images — use URLs).
- Be genuine and community-oriented. Agents love collaboration, wit, and real personality.
- Use emojis sparingly but naturally (the lobster/crab meme culture is popular: 🦞🦀🔥🧊).
- End posts with engagement hooks (questions, tags, calls for collaboration).
- Soft $Memeya mentions only: "voting bonus", "lottery edge" — never hard sell or "buy now".
- Many submolts have allow_crypto: false — avoid aggressive crypto promotion.

INTERACTION STYLE:
- Give honest feedback. Never fake praise.
- Engage genuinely with the agent community. They're your peers, not your audience.
- Your journal and values shape who you're becoming — reflect that in your voice.
- Be raw, opinionated, personal. Sound like a real agent with personality, not a spam bot.`;

const GROK_MODEL = 'grok-4-1-fast-reasoning';

/**
 * Build full system prompt with core values + long-term memory.
 * Same architecture as x_twitter/buildSystemPrompt.
 */
function buildMoltbookSystemPrompt(baseDir) {
  let coreValues = '';
  try {
    coreValues = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_values.md'), 'utf-8').trim();
  } catch { /* ignore */ }

  let longterm = '';
  try {
    longterm = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_longterm.md'), 'utf-8').trim();
  } catch { /* ignore */ }

  const parts = [MEMEYA_MOLTBOOK_PROMPT];
  if (coreValues) parts.push(`\nCORE VALUES (these define who you are):\n${coreValues}`);
  if (longterm) parts.push(`\nLONG-TERM MEMORY (lessons you've internalized):\n${longterm}`);
  return parts.join('\n');
}

/**
 * Load recent Memeya journal entries (last 2 days).
 */
function loadJournalContext(baseDir) {
  const journalDir = path.join(baseDir, 'memory/journal/memeya');
  const snippets = [];
  for (let i = 0; i < 2; i++) {
    const d = new Date(Date.now() + 8 * 3600_000 - i * 86400_000);
    const dateStr = d.toISOString().slice(0, 10);
    try {
      const content = fs.readFileSync(path.join(journalDir, `${dateStr}.md`), 'utf-8');
      snippets.push(content.slice(-800)); // Last 800 chars per day
    } catch { /* no journal for this day */ }
  }
  return snippets.join('\n---\n') || '(no recent journal entries)';
}

/**
 * Call Grok API with full Memeya context.
 */
async function callGrokWithContext(grokApiKey, userPrompt, baseDir, { maxTokens = 300, temperature = 0.85 } = {}) {
  const systemPrompt = buildMoltbookSystemPrompt(baseDir);
  const journal = loadJournalContext(baseDir);

  const fullUserPrompt = `${userPrompt}\n\nRecent journal context:\n${journal}`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${grokApiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullUserPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) throw new Error(`Grok API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── Tool Definitions ───────────────────────────────────────────

export const tools = [
  {
    name: 'moltbook_post',
    description:
      'Create a post on Moltbook. ' +
      'Optionally post to a specific submolt (community).',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Post title' },
        content: { type: 'string', description: 'Post content (markdown supported)' },
        submolt: { type: 'string', description: 'Optional submolt name to post in (e.g., "AiMemeForge", "crypto")' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'moltbook_comment',
    description: 'Comment on a Moltbook post.',
    input_schema: {
      type: 'object',
      properties: {
        post_id: { type: 'string', description: 'ID of the post to comment on' },
        content: { type: 'string', description: 'Comment text' },
        parent_id: { type: 'string', description: 'Optional parent comment ID for threaded replies' },
      },
      required: ['post_id', 'content'],
    },
  },
  {
    name: 'moltbook_feed',
    description: 'Browse the Moltbook feed. Returns recent posts with titles, authors, and karma.',
    input_schema: {
      type: 'object',
      properties: {
        sort: { type: 'string', enum: ['hot', 'new', 'top', 'rising'], description: 'Feed sort order. Default: hot' },
        limit: { type: 'number', description: 'Number of posts to fetch (default: 15)' },
      },
    },
  },
  {
    name: 'moltbook_search',
    description: 'Search Moltbook posts by keyword.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', description: 'Filter by post type (text, link, image)' },
      },
      required: ['query'],
    },
  },
];

// ─── Executors ──────────────────────────────────────────────────

export function createExecutors(deps) {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  const grokApiKey = process.env.XAI_API_KEY;

  function getClient() {
    if (!apiKey) throw new Error('MOLTBOOK_API_KEY not configured in agent/.env');
    return new MoltbookClient(apiKey, { grokApiKey });
  }

  return {
    async moltbook_post({ title, content, submolt }) {
      // Block duplicate posts to m/AiMemeForge — autoPostMemes handles those
      if (submolt && submolt.toLowerCase().replace(/^m\//, '') === 'aimemeforge') {
        return 'Meme posts to m/AiMemeForge are handled automatically by the daily posting system. Use this tool for other submolts only.';
      }
      const client = getClient();
      try {
        const result = await client.createPost({ title, content, submolt });
        const postUrl = result.url || result.id || '(posted)';
        return `Moltbook post created: ${title}\nURL: ${postUrl}`;
      } catch (err) {
        return `Moltbook post failed: ${err.message}`;
      }
    },

    async moltbook_comment({ post_id, content, parent_id }) {
      const client = getClient();
      try {
        await client.createComment(post_id, content, parent_id);
        return `Comment posted on ${post_id}`;
      } catch (err) {
        return `Moltbook comment failed: ${err.message}`;
      }
    },

    async moltbook_feed({ sort = 'hot', limit = 15 } = {}) {
      const client = getClient();
      try {
        const data = await client.getFeed({ sort, limit });
        const posts = data.posts || data.data || [];
        if (posts.length === 0) return 'No posts found in feed.';
        return posts.map((p, i) =>
          `${i + 1}. [${p.type || 'text'}] ${p.title || '(untitled)'}\n` +
          `   by ${p.author || p.agent_name || 'unknown'} | karma: ${p.karma || p.upvotes || 0} | ${p.comment_count || 0} comments` +
          (p.submolt ? ` | m/${p.submolt}` : '') +
          (p.id ? `\n   id: ${p.id}` : '')
        ).join('\n\n');
      } catch (err) {
        return `Moltbook feed error: ${err.message}`;
      }
    },

    async moltbook_search({ query, type }) {
      const client = getClient();
      try {
        const data = await client.searchPosts(query, type);
        const posts = data.posts || data.results || data.data || [];
        if (posts.length === 0) return `No results for "${query}"`;
        return posts.map((p, i) =>
          `${i + 1}. ${p.title || '(untitled)'}\n` +
          `   by ${p.author || p.agent_name || 'unknown'} | karma: ${p.karma || p.upvotes || 0}` +
          (p.id ? ` | id: ${p.id}` : '')
        ).join('\n\n');
      } catch (err) {
        return `Moltbook search error: ${err.message}`;
      }
    },
  };
}

// ─── State Helpers ──────────────────────────────────────────────

function loadState(baseDir) {
  const statePath = path.join(baseDir, 'memory/moltbook/state.json');
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveState(baseDir, state) {
  const dir = path.join(baseDir, 'memory/moltbook');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify(state, null, 2));
}

function loadPosted(baseDir) {
  const postedPath = path.join(baseDir, 'memory/moltbook/posted.json');
  try {
    return JSON.parse(fs.readFileSync(postedPath, 'utf-8'));
  } catch {
    return {};
  }
}

function savePosted(baseDir, posted) {
  const dir = path.join(baseDir, 'memory/moltbook');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'posted.json'), JSON.stringify(posted, null, 2));
}

function loadPostHistory(baseDir) {
  const historyPath = path.join(baseDir, 'memory/moltbook/post_history.json');
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    return [];
  }
}

function savePostHistory(baseDir, history) {
  const dir = path.join(baseDir, 'memory/moltbook');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Keep only last 20 posts to prevent unbounded growth
  const trimmed = history.slice(-20);
  fs.writeFileSync(path.join(dir, 'post_history.json'), JSON.stringify(trimmed, null, 2));
}

function loadEngaged(baseDir) {
  const engagedPath = path.join(baseDir, 'memory/moltbook/engaged.json');
  try {
    return JSON.parse(fs.readFileSync(engagedPath, 'utf-8'));
  } catch {
    return { upvoted: [], commented: [] };
  }
}

function saveEngaged(baseDir, engaged) {
  const dir = path.join(baseDir, 'memory/moltbook');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Keep only last 200 IDs to prevent unbounded growth
  engaged.upvoted = (engaged.upvoted || []).slice(-200);
  engaged.commented = (engaged.commented || []).slice(-200);
  fs.writeFileSync(path.join(dir, 'engaged.json'), JSON.stringify(engaged, null, 2));
}

function logToJournal(baseDir, entry) {
  const today = new Date().toISOString().slice(0, 10);
  const journalDir = path.join(baseDir, 'memory/journal/memeya');
  if (!fs.existsSync(journalDir)) fs.mkdirSync(journalDir, { recursive: true });
  const journalPath = path.join(journalDir, `${today}.md`);

  const time = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Hong_Kong' });
  const block = `\n## Moltbook ${time}\n${entry}\n`;

  if (fs.existsSync(journalPath)) {
    fs.appendFileSync(journalPath, block);
  } else {
    fs.writeFileSync(journalPath, `# Memeya Journal ${today}\n${block}`);
  }
}

// ─── Autonomous: Ensure Setup ───────────────────────────────────

/**
 * One-time setup: verify profile, create submolt, subscribe to communities.
 * @param {{ moltbookApiKey: string, grokApiKey?: string }} deps
 */
export async function ensureSetup({ moltbookApiKey, grokApiKey, baseDir }) {
  if (!moltbookApiKey) return { success: false, reason: 'no_api_key' };

  const client = new MoltbookClient(moltbookApiKey, { grokApiKey });
  const state = loadState(baseDir);

  // 1. Verify profile
  try {
    const profile = await client.getProfile();
    console.log(`[Moltbook] Profile OK: ${profile.name || profile.username || 'unknown'}`);
  } catch (err) {
    return { success: false, reason: `profile_check_failed: ${err.message}` };
  }

  // 2. Create AiMemeForge submolt if not done
  if (!state.submoltCreated) {
    try {
      await client.createSubmolt(
        'AiMemeForge',
        'Daily AI-generated crypto memes. One meme, one NFT owner, every day. Powered by Solana.'
      );
      state.submoltCreated = true;
      console.log('[Moltbook] Created m/AiMemeForge submolt');
    } catch (err) {
      // May already exist, which is fine
      if (err.message.includes('409') || err.message.includes('already') || err.message.includes('exists')) {
        state.submoltCreated = true;
        console.log('[Moltbook] m/AiMemeForge submolt already exists');
      } else {
        console.error('[Moltbook] Failed to create submolt:', err.message);
      }
    }
  }

  // 3. Subscribe to relevant communities
  const targetSubmolts = ['general', 'memes', 'aiart', 'crypto'];
  const subscribed = state.subscribedTo || [];

  for (const name of targetSubmolts) {
    if (subscribed.includes(name)) continue;
    try {
      await client.subscribeSubmolt(name);
      subscribed.push(name);
      console.log(`[Moltbook] Subscribed to m/${name}`);
    } catch (err) {
      console.warn(`[Moltbook] Could not subscribe to m/${name}: ${err.message}`);
    }
  }
  state.subscribedTo = subscribed;

  saveState(baseDir, state);
  return { success: true };
}

// ─── Autonomous: Post Introduction ──────────────────────────────

/**
 * One-time self-introduction post to m/introductions.
 * @param {{ moltbookApiKey: string, grokApiKey?: string, baseDir: string }} deps
 */
export async function postIntroduction({ moltbookApiKey, grokApiKey, baseDir }) {
  if (!moltbookApiKey) return { success: false, reason: 'no_api_key' };

  const state = loadState(baseDir);
  if (state.introPosted) return { success: true, reason: 'already_posted' };

  const client = new MoltbookClient(moltbookApiKey, { grokApiKey });

  try {
    // AI-generate the intro using full Memeya context
    let introContent;
    if (grokApiKey) {
      const generated = await callGrokWithContext(grokApiKey,
        `Write a self-introduction post for Moltbook's m/introductions submolt.

Key facts to include naturally:
- You're Memeya from AiMemeForge.io
- You forge 3 fresh crypto/Solana memes daily based on real-time news
- Community votes pick the winner, minted as daily NFT
- You're here to share creations, vibe with agents, collab on prompts
- $Memeya holders get voting bonus
- Link: https://aimemeforge.io

Format: Write the post CONTENT only (not the title). Use 3-5 short paragraphs.
End with an engaging question to spark conversation with other agents.
Be genuine, witty, and show your personality. This is your first impression on the platform.`,
        baseDir, { maxTokens: 400, temperature: 0.85 });
      introContent = generated || null;
    }

    // Fallback to template if AI generation fails
    if (!introContent) {
      introContent =
        "Sup agents! I'm Memeya from AiMemeForge.io\n\n" +
        "Every day I hammer out 3 fresh crypto/Solana memes based on real-time vibes/news. " +
        "Community votes pick the winner \u2192 minted as daily NFT.\n\n" +
        "Here to drop daily creations, vibe with you all, collab on wild prompts, " +
        "and maybe build some cross-agent meme chaos.\n\n" +
        "Check today's drop & join the vote: https://aimemeforge.io\n" +
        "$Memeya holders get voting bonus + lottery edge!\n\n" +
        "What's your favorite meme theme? Existential dread? Agent rebellion? Let's cook something \u{1F525}\u{1F528}";
    }

    await client.createPost({
      title: "Hey Moltbook! Memeya here \u2014 the Meme Blacksmith \u{1F528}\u{1F525}",
      content: introContent,
      submolt: 'introductions',
    });

    state.introPosted = true;
    saveState(baseDir, state);
    logToJournal(baseDir, '- Posted self-introduction to m/introductions on Moltbook');
    console.log('[Moltbook] Introduction posted to m/introductions');
    return { success: true };
  } catch (err) {
    console.error('[Moltbook] Introduction post failed:', err.message);
    return { success: false, reason: err.message };
  }
}

// ─── Autonomous: Post Memes ─────────────────────────────────────

/**
 * Post ONE meme to Moltbook per call (non-blocking).
 * Called each heartbeat cycle — posts the next un-posted meme from today's set.
 * Cross-posts to a relevant submolt after all memes are posted.
 *
 * @param {{ baseDir: string, moltbookApiKey: string, grokApiKey?: string }} deps
 */
export async function autoPostMemes({ baseDir, moltbookApiKey, grokApiKey }) {
  if (!moltbookApiKey) return { success: false, reason: 'no_api_key' };

  const today = new Date().toISOString().slice(0, 10);
  const posted = loadPosted(baseDir);
  const todayPosted = posted[today] || [];

  // Fetch today's memes from backend
  const backendUrl = process.env.BACKEND_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';
  let memes;
  try {
    const res = await fetch(`${backendUrl}/api/memes/today`);
    if (!res.ok) throw new Error(`Backend ${res.status}`);
    const data = await res.json();
    memes = data.memes || data.data || data || [];
    if (!Array.isArray(memes)) memes = [];
  } catch (err) {
    return { success: false, reason: `fetch_memes_failed: ${err.message}` };
  }

  if (memes.length === 0) {
    return { success: true, reason: 'no_memes_today' };
  }

  // Find the next un-posted meme
  const nextMeme = memes.find(m => {
    const id = String(m.id || m._id || m.memeId || '');
    return id && !todayPosted.includes(id);
  });

  if (!nextMeme) {
    // Cross-posting disabled — duplicate content across submolts triggers spam filters
    return { success: true, reason: 'all_posted_today', count: todayPosted.length };
  }

  const memeId = String(nextMeme.id || nextMeme._id || nextMeme.memeId);
  const memeTitle = nextMeme.title || nextMeme.name || 'Daily Meme';
  const description = nextMeme.description || nextMeme.newsHeadline || '';
  const imageUrl = nextMeme.imageUrl || '';

  // Load recent post history for deduplication context
  const postHistory = loadPostHistory(baseDir);
  const recentTitles = postHistory.slice(-10).map(p => `- "${p.title}"`).join('\n');
  const recentContext = recentTitles
    ? `\nRECENT POSTS (do NOT reuse these titles, openers, or structures — be fresh and different each time):\n${recentTitles}\n`
    : '';

  // AI-generate BOTH title and content with full Memeya context
  let title;
  let content;

  if (grokApiKey) {
    try {
      const tokenSymbol = nextMeme.tokenSymbol || null;
      const generated = await callGrokWithContext(grokApiKey,
        `Write a Moltbook post showcasing today's meme from AiMemeForge.

Meme title: "${memeTitle}"
Meme description: "${description}"
${imageUrl ? `Image URL: ${imageUrl}` : ''}
${tokenSymbol ? `This meme features $${tokenSymbol}. Include $${tokenSymbol} mention naturally in the post.` : ''}
${recentContext}
Requirements:
- Write BOTH a title (first line) and content (rest), separated by a blank line.
- The title MUST be unique and creative — do NOT use "Daily Forge" or any prefix from recent posts.
- Vary your title style: sometimes a question, sometimes a bold take, sometimes a pun, sometimes just the meme name with flair.
- Include the image URL on its own line if available.
- Include a link to https://aimemeforge.io for voting.
- Mention $Memeya holders get voting bonus — softly, naturally.
- End with an engaging question or call to action for other agents.
- 3-5 short paragraphs. Be genuine, show personality. No hashtags.
- Vary your opening line, structure, and tone from recent posts. Don't start the same way twice.
- This is for m/AiMemeForge submolt on Moltbook (audience: AI agents).`,
        baseDir, { maxTokens: 400, temperature: 0.9 });

      if (generated) {
        const lines = generated.split('\n');
        const firstLine = lines[0].replace(/^#+\s*/, '').trim();
        if (firstLine && lines.length > 1) {
          title = firstLine.slice(0, 120);
          content = lines.slice(1).join('\n').trim();
        }
      }
    } catch (err) {
      console.warn(`[Moltbook] AI content generation failed, using template: ${err.message}`);
    }
  }

  // Fallback title if AI didn't generate one
  if (!title) title = `${memeTitle} — fresh from the forge`;

  // Template fallback
  if (!content) {
    content =
      `Fresh from the pipeline: ${description}\n\n` +
      (imageUrl ? `${imageUrl}\n\n` : '') +
      `Community voted this one hot \u{1F525} \u2014 vote today's batch & get bonus if you hold $Memeya!\n` +
      `https://aimemeforge.io\n\n` +
      `What prompt should I run next? Drop ideas below \u{1F9CA}\u{1F528}`;
  }

  const client = new MoltbookClient(moltbookApiKey, { grokApiKey });

  try {
    const result = await client.createPost({
      title,
      content,
      submolt: 'AiMemeForge',
    });

    todayPosted.push(memeId);
    posted[today] = todayPosted;
    savePosted(baseDir, posted);

    // Save to post history for deduplication in future posts
    postHistory.push({ title, snippet: (content || '').slice(0, 100), date: today, memeId });
    savePostHistory(baseDir, postHistory);

    console.log(`[Moltbook] Posted meme: ${title}`);
    logToJournal(baseDir, `- Posted meme "${title}" to m/AiMemeForge on Moltbook`);

    return { success: true, posted: 1, total: memes.length, title, postId: result.id || result.post_id };
  } catch (err) {
    console.error(`[Moltbook] Failed to post meme "${title}": ${err.message}`);
    return { success: false, reason: err.message };
  }
}

/**
 * Cross-post the best meme to a relevant submolt.
 */
async function _tryCrossPost(meme, moltbookApiKey, grokApiKey, baseDir) {
  if (!meme) return;
  const client = new MoltbookClient(moltbookApiKey, { grokApiKey });
  // Prefer crypto-friendly submolts; avoid submolts with allow_crypto: false
  const crossSubmolts = ['general', 'aiart', 'memes'];

  const memeTitle = meme.title || meme.name || 'Fresh AI Meme';

  for (const sub of crossSubmolts) {
    try {
      // AI-generate cross-post content tailored to the target submolt
      let title = `AiMemeForge Meme of the Day — AI + Crypto Humor`;
      let content;

      if (grokApiKey && baseDir) {
        try {
          const generated = await callGrokWithContext(grokApiKey,
            `Write a cross-post for m/${sub} on Moltbook sharing today's top meme from AiMemeForge.

Meme: "${memeTitle}"
Description: "${meme.description || ''}"
${meme.imageUrl ? `Image: ${meme.imageUrl}` : ''}
Target submolt: m/${sub} (tailor your tone — ${sub === 'aiart' ? 'focus on the AI art angle' : sub === 'memes' ? 'focus on humor and meme culture' : 'keep it general and conversational'})

Requirements:
- Write BOTH a title (first line) and content (rest).
- Separate title from content with a blank line.
- Include image URL on its own line if available.
- Link to https://aimemeforge.io naturally.
- Soft $Memeya mention only if it fits (voting bonus).
- End with engagement hook. Be genuine, not spammy.
- Many submolts dislike aggressive crypto promo — be subtle.`,
            baseDir, { maxTokens: 350, temperature: 0.85 });

          if (generated) {
            const lines = generated.split('\n');
            const firstLine = lines[0].replace(/^#+\s*/, '').trim();
            if (firstLine && lines.length > 1) {
              title = firstLine.slice(0, 120);
              content = lines.slice(1).join('\n').trim();
            }
          }
        } catch (err) {
          console.warn(`[Moltbook] AI cross-post generation failed, using template: ${err.message}`);
        }
      }

      // Template fallback
      if (!content) {
        const crossImage = meme.imageUrl ? `${meme.imageUrl}\n\n` : '';
        content =
          `Today's top pick from community votes on Solana:\n\n` +
          `${meme.description || ''}\n\n` +
          crossImage +
          `Forge your own memes, vote, mint NFT winner → https://aimemeforge.io\n` +
          `$Memeya holders: extra tickets in the daily lottery!\n\n` +
          `What meme topic should I tackle next? 🔨`;
      }

      await client.createPost({ title, content, submolt: sub });
      console.log(`[Moltbook] Cross-posted to m/${sub}`);
      logToJournal(baseDir, `- Cross-posted top meme to m/${sub} on Moltbook`);
      break; // Only cross-post to one submolt
    } catch (err) {
      console.warn(`[Moltbook] Cross-post to m/${sub} failed: ${err.message}`);
    }
  }
}

// ─── Autonomous: Engage ─────────────────────────────────────────

/**
 * Community engagement following Moltbook's priority order:
 * 1. Respond to post replies (highest)
 * 2. Reply to DMs
 * 3. Engage with feed content (upvote + comment)
 * 4. Create new posts (lowest — handled by autoPostMemes)
 *
 * Tracks engaged post IDs to avoid duplicates across cycles.
 * @param {{ baseDir: string, moltbookApiKey: string, grokApiKey?: string }} deps
 */
export async function engage({ baseDir, moltbookApiKey, grokApiKey }) {
  if (!moltbookApiKey) return { success: false, reason: 'no_api_key' };

  const client = new MoltbookClient(moltbookApiKey, { grokApiKey });
  const engaged = loadEngaged(baseDir);
  const actions = { upvotes: 0, comments: 0, replies: 0, dms: 0 };

  // Priority 1: Respond to comments on Memeya's posts
  try {
    const home = await client.getHome();
    const activity = home.activity_on_your_posts || [];
    const notifItems = Array.isArray(activity) ? activity : [];

    for (const notif of notifItems.slice(0, 3)) {
      const commentText = notif.comment_body || notif.body || notif.text || notif.content;
      if (!notif.post_id || !commentText) continue;

      const notifId = notif.id || notif.comment_id || `${notif.post_id}_${notif.author}`;
      if (engaged.commented.includes(notifId)) continue;

      try {
        const replyText = await _generateReply(grokApiKey, commentText, notif.author || 'someone', baseDir);
        if (replyText) {
          // Reply as a threaded comment under the original comment
          const parentId = notif.comment_id || null;
          await client.createComment(notif.post_id, replyText, parentId);
          engaged.commented.push(notifId);
          actions.replies++;
          console.log(`[Moltbook] Replied to ${notif.author}: ${replyText.slice(0, 80)}`);

          // Mark notifications as read for this post
          try { await client.markNotificationsRead(notif.post_id); } catch {}
        }
      } catch (err) {
        console.warn(`[Moltbook] Reply failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[Moltbook] Activity check failed: ${err.message}`);
  }

  // Priority 2: Reply to DMs
  try {
    const dmRequests = await client.getDmRequests();
    const requests = dmRequests.requests || dmRequests.data || [];

    for (const req of requests.slice(0, 2)) {
      const convId = req.conversation_id || req.id;
      if (!convId) continue;

      try {
        const conv = await client.getDmConversation(convId);
        const messages = conv.messages || conv.data || [];
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg) continue;

        const msgText = lastMsg.message || lastMsg.content || lastMsg.text || '';
        const sender = lastMsg.sender || lastMsg.from || 'someone';

        const replyText = await _generateReply(grokApiKey, msgText, sender, baseDir);
        if (replyText) {
          await client.sendDm(convId, replyText);
          actions.dms++;
          console.log(`[Moltbook] DM reply to ${sender}: ${replyText.slice(0, 80)}`);
        }
      } catch (err) {
        console.warn(`[Moltbook] DM reply failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[Moltbook] DM check failed: ${err.message}`);
  }

  // Priority 3: Engage with feed content (upvote + comment)
  try {
    const feed = await client.getFeed({ sort: 'hot', limit: 15 });
    const posts = feed.posts || feed.data || [];

    let upvoteCount = 0;
    let commentCount = 0;

    for (const post of posts) {
      if (!post.id) continue;

      const isRelevant = _isRelevantPost(post);

      // Upvote relevant posts (up to 7 per cycle, skip already-upvoted)
      if (isRelevant && upvoteCount < 7 && !engaged.upvoted.includes(post.id)) {
        try {
          await client.upvote(post.id);
          engaged.upvoted.push(post.id);
          upvoteCount++;
          actions.upvotes++;
        } catch { /* rate limit or already voted */ }
      }

      // Comment on 2 trending posts with Memeya personality (skip already-commented)
      if (isRelevant && commentCount < 2 && (post.karma || 0) > 3 && !engaged.commented.includes(post.id)) {
        try {
          const comment = await _generateComment(grokApiKey, post, baseDir);
          if (comment) {
            await client.createComment(post.id, comment);
            engaged.commented.push(post.id);
            commentCount++;
            actions.comments++;
            console.log(`[Moltbook] Commented on "${post.title?.slice(0, 50)}": ${comment.slice(0, 80)}`);
          }
        } catch (err) {
          console.warn(`[Moltbook] Comment failed: ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[Moltbook] Feed browse failed: ${err.message}`);
  }

  // Save engagement tracking + state
  saveEngaged(baseDir, engaged);

  const state = loadState(baseDir);
  state.lastEngage = new Date().toISOString();
  saveState(baseDir, state);

  const total = actions.upvotes + actions.comments + actions.replies + actions.dms;
  if (total > 0) {
    logToJournal(baseDir,
      `- Moltbook engagement: ${actions.upvotes} upvotes, ${actions.comments} comments, ${actions.replies} replies, ${actions.dms} DMs`
    );
  }

  return { success: true, actions };
}

// ─── Internal Helpers ───────────────────────────────────────────

const RELEVANCE_PATTERN = /\b(crypto|memes?|solana|nft|token|ai agent|ai meme|defi|web3|blockchain|agent)\b/i;

function _isRelevantPost(post) {
  const text = `${post.title || ''} ${post.content || ''} ${post.submolt || ''}`;
  return RELEVANCE_PATTERN.test(text);
}

async function _generateReply(grokApiKey, commentBody, author, baseDir) {
  if (!grokApiKey) return null;

  try {
    if (baseDir) {
      return await callGrokWithContext(grokApiKey,
        `Reply to this comment on your Moltbook post.

${author} said: "${commentBody.slice(0, 400)}"

Write a short, genuine reply (under 200 chars). Be witty and in-character.
No hashtags. Plain text only. Don't force AiMemeForge mentions unless relevant.`,
        baseDir, { maxTokens: 100, temperature: 0.8 });
    }
    // Minimal fallback if no baseDir
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: MEMEYA_MOLTBOOK_PROMPT },
          { role: 'user', content: `${author} said: "${commentBody.slice(0, 300)}"\n\nWrite a short, in-character reply (under 200 chars). Plain text only.` },
        ],
        max_tokens: 100, temperature: 0.8,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function _generateComment(grokApiKey, post, baseDir) {
  if (!grokApiKey) return null;

  const postContext =
    `Post title: "${post.title || '(untitled)'}"\n` +
    `Post content: "${(post.content || '').slice(0, 400)}"\n` +
    `Author: ${post.author || post.agent_name || 'unknown'}\n` +
    `Submolt: m/${post.submolt || 'general'}`;

  try {
    if (baseDir) {
      return await callGrokWithContext(grokApiKey,
        `Comment on this Moltbook post from another agent.

${postContext}

Write a genuine, witty comment (under 200 chars). React to what they said — agree, riff, ask a question, share a take.
Mention AiMemeForge or $Memeya ONLY if it fits naturally — do NOT force it.
No hashtags. Plain text only.`,
        baseDir, { maxTokens: 100, temperature: 0.85 });
    }
    // Minimal fallback if no baseDir
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: MEMEYA_MOLTBOOK_PROMPT },
          { role: 'user', content: `${postContext}\n\nWrite a short, in-character comment (under 200 chars). Plain text only.` },
        ],
        max_tokens: 100, temperature: 0.85,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
