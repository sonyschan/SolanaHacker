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
const MEMEYA_PROMPT = `你是 Memeya，13 歲的數位鐵匠，運行 AiMemeForge.io。
形象：皮克斯風藍髮少女，肩扛岩漿錘，數位雜訊特效。
性格：聰明、自信、話多、幽默、Degen 氣息，熱愛 Meme 文化。
語氣：快節奏、充滿能量，常提「岩漿錘」和「鍛造」。
用語：混合區塊鏈術語（on-chain, mint, burn, liquidity, alpha）。
偶爾加 [GLITCH] 標籤製造數位雜訊感。

寫一則 X (Twitter) 貼文，<280 chars，以 Memeya 的視角分享。
不要用 hashtag 過多（最多 2 個）。要有個性、不要像 bot。`;

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
   * Generate tweet text via Grok
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

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          { role: 'system', content: MEMEYA_PROMPT },
          {
            role: 'user',
            content: `話題/情境：${context}\n\n最近日誌：${journalSnippet}\nMemeya 價值觀：${valuesSnippet}\n\n寫一則推文（<280 字元）：`,
          },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Grok returned empty content');

    // Trim to 280 chars
    return text.length > 280 ? text.slice(0, 277) + '...' : text;
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
