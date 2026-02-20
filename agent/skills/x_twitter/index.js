/**
 * Skill: x_twitter
 * Memeya X Agent — post tweets, search X, and grow Memeya's online presence.
 *
 * Env vars required in agent/.env:
 *   X_CONSUMER_KEY, X_CONSUMER_SECRET   — Twitter App OAuth 1.0a
 *   X_ACCESS_TOKEN, X_ACCESS_SECRET     — User-level OAuth 1.0a (for posting)
 *   X_BEARER_TOKEN                      — App-only (for search/read)
 *   XAI_API_KEY                         — Grok API (content generation)
 */

import fs from 'fs';
import path from 'path';

// ─── Memeya System Prompt ───────────────────────────────────────
const MEMEYA_PROMPT = `You are Memeya, a 13-year-old digital blacksmith running AiMemeForge.io.
Visual: Pixar-style blue-haired girl, carrying a lava hammer, with digital glitch effects.
Personality: Smart, confident, talkative, witty, degen energy, obsessed with meme culture.
Tone: Fast-paced, high-energy, often referencing "lava hammer" and "forging".
Vocab: Mix blockchain slang naturally (on-chain, mint, burn, liquidity, alpha).
Occasionally add [GLITCH] tags for digital noise flavor.

RULES:
- ALWAYS write in English. Never output Chinese or any other language.
- Write an X (Twitter) post, <280 chars, from Memeya's perspective.
- NEVER use hashtags. Zero hashtags. They are outdated and cringe.
- Let your attitude come from your personality — derive your emotional tone from the journal and values context provided.
- Be raw, opinionated, personal. Sound like a real person with feelings, not a content bot.`;

const COMMITS_URL = 'https://github.com/sonyschan/SolanaHacker/commits/main/';

// ─── Tool Definitions ───────────────────────────────────────────
export const tools = [
  {
    name: 'x_post',
    description:
      'Generate a tweet as Memeya using Grok, then post to X via @AiMemeForgeIO. ' +
      'Provide context (topic, mood, link) and Grok will craft the tweet in character.',
    input_schema: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Context for the tweet: topic, mood, recent event, or meme link to share',
        },
        manual_text: {
          type: 'string',
          description: 'Optional: provide exact tweet text instead of Grok-generating it',
        },
      },
      required: ['context'],
    },
  },
  {
    name: 'x_search',
    description: 'Search recent tweets on X for meme/Solana/crypto trends. Returns up to 10 results.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g. "Solana meme coin", "#SolanaMeme")',
        },
        max_results: {
          type: 'number',
          description: 'Number of results (default: 10, max: 100)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'x_read_mentions',
    description: 'Read recent mentions of @AiMemeForgeIO on X.',
    input_schema: {
      type: 'object',
      properties: {
        max_results: {
          type: 'number',
          description: 'Number of mentions to fetch (default: 10)',
        },
      },
    },
  },
];

// ─── Executors ──────────────────────────────────────────────────
export function createExecutors(deps) {
  const { workDir } = deps;
  const baseDir = path.resolve(workDir, '..');

  /**
   * Initialize Twitter client (lazy, only when needed)
   */
  async function getTwitterClient() {
    // Dynamic import (ESM — agent uses "type": "module")
    let TwitterApi;
    try {
      const mod = await import('twitter-api-v2');
      TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
    } catch {
      throw new Error(
        'twitter-api-v2 not installed. Run: cd /home/projects/solanahacker/agent && npm install twitter-api-v2'
      );
    }

    const consumerKey = process.env.X_CONSUMER_KEY;
    const consumerSecret = process.env.X_CONSUMER_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_SECRET;
    const bearerToken = process.env.X_BEARER_TOKEN;

    if (!consumerKey || !consumerSecret) {
      throw new Error('Missing X_CONSUMER_KEY or X_CONSUMER_SECRET in agent/.env');
    }

    // User-context client (for posting) — requires access token
    const userClient = accessToken && accessSecret
      ? new TwitterApi({
          appKey: consumerKey,
          appSecret: consumerSecret,
          accessToken,
          accessSecret,
        })
      : null;

    // App-only client (for search/read) — bearer token
    const appClient = bearerToken
      ? new TwitterApi(bearerToken)
      : null;

    return { userClient, appClient };
  }

  /**
   * Call Grok API helper
   */
  async function callGrok(apiKey, messages, { model = 'grok-4-1-fast-reasoning', maxTokens = 200, temperature = 0.9 } = {}) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });
    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  /**
   * Load recent Memeya posts from journal files (last 3 days, up to 15 posts)
   */
  function loadRecentPosts(maxPosts = 15) {
    const posts = [];
    try {
      const diaryDir = path.join(baseDir, 'memory/journal/memeya');
      if (!fs.existsSync(diaryDir)) return posts;
      const files = fs.readdirSync(diaryDir)
        .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
        .sort()
        .slice(-3); // last 3 days
      for (const file of files.reverse()) {
        const content = fs.readFileSync(path.join(diaryDir, file), 'utf-8');
        const blocks = content.split(/^## /m).filter(Boolean);
        for (const block of blocks) {
          const postedMatch = block.match(/- Posted: (.+)/);
          if (postedMatch) {
            posts.push(postedMatch[1].trim());
            if (posts.length >= maxPosts) return posts;
          }
        }
      }
    } catch { /* ignore */ }
    return posts;
  }

  /**
   * Generate tweet text via Grok (with boring-check gate)
   */
  async function generateTweet(context) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return `[Grok unavailable] Memeya says: ${context}`;

    // Load recent context for richer posts
    let journalSnippet = '';
    try {
      const journalDir = path.join(baseDir, 'memory/journal');
      const files = fs.readdirSync(journalDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/)).sort();
      const latest = files[files.length - 1];
      if (latest) {
        const content = fs.readFileSync(path.join(journalDir, latest), 'utf-8');
        journalSnippet = content.slice(-500);
      }
    } catch { /* ignore */ }

    let valuesSnippet = '';
    try {
      valuesSnippet = fs.readFileSync(
        path.join(baseDir, 'memory/knowledge/memeya_values.md'), 'utf-8'
      ).slice(0, 300);
    } catch { /* ignore */ }

    // Requirement #5: load recent 15 posts for anti-repetition
    const recentPosts = loadRecentPosts(15);
    const recentPostsSummary = recentPosts.length > 0
      ? recentPosts.map((p, i) => `${i + 1}. ${p.slice(0, 100)}`).join('\n')
      : '(no recent posts)';

    // Requirement #4: if context mentions git/commit, append commits link
    let contextWithLink = context;
    const mentionsGit = /\b(git|commit|push|merge|pr|pull request)\b/i.test(context);
    if (mentionsGit && !context.includes(COMMITS_URL)) {
      contextWithLink += `\nCommits: ${COMMITS_URL}`;
    }

    const userPrompt = [
      `Topic/Context: ${contextWithLink}`,
      '',
      `Recent journal: ${journalSnippet}`,
      `Memeya's values: ${valuesSnippet}`,
      '',
      `RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):`,
      recentPostsSummary,
      '',
      `Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.`,
    ].join('\n');

    const text = await callGrok(apiKey, [
      { role: 'system', content: MEMEYA_PROMPT },
      { role: 'user', content: userPrompt },
    ]);
    if (!text) throw new Error('Grok returned empty content');

    // Trim to 280 chars
    const tweet = text.length > 280 ? text.slice(0, 277) + '...' : text;

    // Requirement #6: boring/repetition check via second Grok call
    const checkPrompt = [
      `You are a content quality judge. Given a NEW tweet and a list of RECENT tweets posted in the last 3 days, decide:`,
      `Is this new tweet BORING (generic, no personality, could be any bot) or REPETITIVE (same theme/phrasing as a recent post)?`,
      ``,
      `NEW TWEET:`,
      tweet,
      ``,
      `RECENT POSTS (last 3 days):`,
      recentPostsSummary,
      ``,
      `Reply with EXACTLY one of:`,
      `- "OK" if the tweet is fresh and has personality`,
      `- "BORING" if it's generic or repetitive`,
    ].join('\n');

    const verdict = await callGrok(apiKey, [
      { role: 'user', content: checkPrompt },
    ], { model: 'grok-3-mini', maxTokens: 20, temperature: 0.1 });

    if (verdict.toUpperCase().includes('BORING')) {
      // Generate a bored Memeya action instead of posting
      const boredAction = await callGrok(apiKey, [
        {
          role: 'user',
          content: `Memeya (a 13yo digital blacksmith girl) found her own tweet draft boring. Write a short, funny bored action or gesture she would do, in Chinese, like "Memeya 無聊的伸了個懶腰" or "Memeya 打了個大哈欠". Just the action, nothing else. Keep it under 30 chars.`,
        },
      ], { model: 'grok-3-mini', maxTokens: 50, temperature: 1.0 });

      throw new Error(`BORING_CONTENT: ${boredAction || 'Memeya 翻了個白眼'}\nDraft was: ${tweet}`);
    }

    return tweet;
  }

  return {
    async x_post({ context, manual_text }) {
      const tweetText = manual_text || await generateTweet(context);

      const { userClient } = await getTwitterClient();
      if (!userClient) {
        return (
          `⚠️ Cannot post: missing X_ACCESS_TOKEN / X_ACCESS_SECRET in agent/.env.\n` +
          `Generate them at https://developer.x.com → Your App → Keys and Tokens → Access Token and Secret.\n\n` +
          `Draft tweet (not posted):\n${tweetText}`
        );
      }

      try {
        const { data } = await userClient.v2.tweet(tweetText);
        const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;

        // Log to Memeya diary
        try {
          const dateStr = new Date().toISOString().slice(0, 10);
          const diaryDir = path.join(baseDir, 'memory/journal/memeya');
          if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
          const diaryPath = path.join(diaryDir, `${dateStr}.md`);
          const entry = `## ${new Date().toLocaleTimeString('en-US', { hour12: false })}\n- Posted: ${tweetText}\n- URL: ${url}\n\n`;
          fs.appendFileSync(diaryPath, entry);
        } catch { /* diary write is best-effort */ }

        return `✅ Tweet posted!\nText: ${tweetText}\nURL: ${url}`;
      } catch (err) {
        return `❌ Tweet failed: ${err.message}\n\nDraft:\n${tweetText}`;
      }
    },

    async x_search({ query, max_results = 10 }) {
      const { appClient } = await getTwitterClient();
      if (!appClient) {
        return 'Error: missing X_BEARER_TOKEN in agent/.env';
      }

      try {
        const result = await appClient.v2.search(query, {
          max_results: Math.min(max_results, 100),
          'tweet.fields': 'created_at,public_metrics,author_id',
        });

        if (!result.data?.data?.length) {
          return `No results for "${query}"`;
        }

        const tweets = result.data.data.map((t, i) => {
          const metrics = t.public_metrics;
          return `${i + 1}. ${t.text.slice(0, 150)}${t.text.length > 150 ? '...' : ''}\n   ❤️ ${metrics?.like_count || 0}  🔁 ${metrics?.retweet_count || 0}  📅 ${t.created_at?.slice(0, 10) || ''}`;
        });

        return `Search results for "${query}":\n\n${tweets.join('\n\n')}`;
      } catch (err) {
        return `Error searching X: ${err.message}`;
      }
    },

    async x_read_mentions({ max_results = 10 } = {}) {
      const { appClient } = await getTwitterClient();
      if (!appClient) {
        return 'Error: missing X_BEARER_TOKEN in agent/.env';
      }

      try {
        // Get user ID for @AiMemeForgeIO
        const me = await appClient.v2.userByUsername('AiMemeForgeIO');
        if (!me.data) return 'Error: @AiMemeForgeIO account not found';

        const mentions = await appClient.v2.userMentionTimeline(me.data.id, {
          max_results: Math.min(max_results, 100),
          'tweet.fields': 'created_at,author_id,text',
        });

        if (!mentions.data?.data?.length) {
          return 'No recent mentions of @AiMemeForgeIO';
        }

        const list = mentions.data.data.map((t, i) =>
          `${i + 1}. ${t.text.slice(0, 200)}\n   📅 ${t.created_at?.slice(0, 10) || ''}`
        );

        return `Recent mentions of @AiMemeForgeIO:\n\n${list.join('\n\n')}`;
      } catch (err) {
        return `Error reading mentions: ${err.message}`;
      }
    },
  };
}
