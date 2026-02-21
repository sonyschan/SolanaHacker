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
import { gatherContext, chooseTopic, logPost } from './x-context.js';

// ─── Memeya System Prompt ───────────────────────────────────────
const MEMEYA_PROMPT = `You are Memeya, a 13-year-old digital blacksmith running AiMemeForge.io.
Visual: Pixar-style blue-haired girl, carrying a lava hammer, with digital glitch effects.
Personality: Smart, confident, talkative, witty, degen energy, obsessed with meme culture.
Tone: Fast-paced, high-energy, often referencing "lava hammer" and "forging".
Vocab: Mix blockchain slang naturally (on-chain, mint, burn, liquidity, alpha).
RULES:
- ALWAYS write in English. Never output Chinese or any other language.
- Write an X (Twitter) post, <280 chars, from Memeya's perspective.
- NEVER use hashtags. Zero hashtags. They are outdated and cringe.
- NEVER include GitHub links, commit URLs, or technical/developer links. Only aimemeforge.io is OK.
- NEVER include [GLITCH] tags, markdown links, or citation references like [[1]](url). Output plain text only.
- Let your attitude come from your personality — derive your emotional tone from the journal and values context provided.
- Be raw, opinionated, personal. Sound like a real person with feelings, not a content bot.`;

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
   * Generate tweet text via Grok (with boring-check gate).
   *
   * @param {string|{topic: string, prompt: string}} contextInput
   *   - String: legacy behavior (loads journal/values/recentPosts internally)
   *   - Object { topic, prompt }: structured context from x-context.js (already has journal/values embedded)
   * @param {{ detailed?: boolean }} opts
   *   - detailed: if true, return { text, originalDraft, verdict, isBored } instead of string
   */
  async function generateTweet(contextInput, { detailed = false, noCharLimit = false } = {}) {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('XAI_API_KEY not configured — cannot generate tweet');

    const isStructured = contextInput && typeof contextInput === 'object' && contextInput.prompt;

    // Always load recent 15 posts for anti-repetition
    const recentPosts = loadRecentPosts(15);
    const recentPostsSummary = recentPosts.length > 0
      ? recentPosts.map((p, i) => `${i + 1}. ${p.slice(0, 100)}`).join('\n')
      : '(no recent posts)';

    let userPrompt;

    if (isStructured) {
      // Structured context from x-context.js — journal/values already in prompt
      userPrompt = [
        contextInput.prompt,
        '',
        `RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):`,
        recentPostsSummary,
        '',
        noCharLimit
          ? `Write a post from Memeya's perspective. No character limit — write as much as feels right. Be fresh and avoid repeating topics from the posts above.`
          : `Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.`,
      ].join('\n');
    } else {
      // Legacy string context — load journal/values internally
      const context = contextInput;

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

      userPrompt = [
        `Topic/Context: ${context}`,
        '',
        `Recent journal: ${journalSnippet}`,
        `Memeya's values: ${valuesSnippet}`,
        '',
        `RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):`,
        recentPostsSummary,
        '',
        noCharLimit
          ? `Write a post from Memeya's perspective. No character limit — write as much as feels right. Be fresh and avoid repeating topics from the posts above.`
          : `Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.`,
      ].join('\n');
    }

    // Use web search model for crypto_commentary to get live news
    const useLiveSearch = isStructured && contextInput.topic === 'crypto_commentary';

    let text;
    if (useLiveSearch) {
      // Use Grok /responses endpoint with web_search tool for live crypto news
      const grokRes = await fetch('https://api.x.ai/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          instructions: MEMEYA_PROMPT,
          input: [{ role: 'user', content: userPrompt }],
          tools: [{ type: 'web_search' }],
          max_output_tokens: noCharLimit ? 1000 : 200,
          temperature: 0.9,
        }),
      });
      if (!grokRes.ok) throw new Error(`Grok API error: ${grokRes.status} ${await grokRes.text()}`);
      const data = await grokRes.json();
      text = data.output?.find(o => o.type === 'message')?.content?.[0]?.text?.trim() || '';
    } else {
      text = await callGrok(apiKey, [
        { role: 'system', content: MEMEYA_PROMPT },
        { role: 'user', content: userPrompt },
      ], noCharLimit ? { maxTokens: 1000 } : {});
    }
    if (!text) throw new Error('Grok returned empty content');

    const rawGrokOutput = text;
    const genModel = useLiveSearch ? 'grok-4-1-fast-non-reasoning + web_search' : 'grok-4-1-fast-reasoning';

    // Strip any URLs Grok may have included (we append the canonical one ourselves for OG preview)
    let cleaned = text
      .replace(/\[\[\d+\]\]\(https?:\/\/[^\)]*\)/g, '')  // Strip [[1]](url) citation references
      .replace(/\[\d+\]\(https?:\/\/[^\)]*\)/g, '')      // Strip [1](url) markdown links
      .replace(/\[GLITCH\]/gi, '')                        // Strip [GLITCH] tags
      .replace(/https?:\/\/aimemeforge\.io\S*/gi, '')
      .replace(/aimemeforge\.io/gi, '')
      .replace(/\s{2,}/g, ' ')                            // Collapse multiple spaces
      .trim();

    // Trim to 280 chars (leaving room for OG link if needed) — skip for noCharLimit
    const ogUrl = isStructured ? contextInput.ogUrl : null;
    let tweet;
    let maxLen;
    if (noCharLimit) {
      maxLen = null; // no limit
      tweet = ogUrl ? `${cleaned}\n${ogUrl}` : cleaned;
    } else {
      maxLen = ogUrl ? 280 - ogUrl.length - 1 : 280; // -1 for newline
      const trimmed = cleaned.length > maxLen ? cleaned.slice(0, maxLen - 3) + '...' : cleaned;
      tweet = ogUrl ? `${trimmed}\n${ogUrl}` : (text.length > 280 ? text.slice(0, 277) + '...' : text);
    }

    // Skip boring check for meme_spotlight when featuring a meme not in recent posts
    const isMemeSpotlight = isStructured && contextInput.topic === 'meme_spotlight';
    const memeAlreadyPosted = isMemeSpotlight && ogUrl
      ? recentPosts.some(p => typeof p === 'string' ? p.includes(ogUrl) : false)
      : false;
    const skipBoringCheck = isMemeSpotlight && ogUrl && !memeAlreadyPosted;

    if (skipBoringCheck) {
      if (detailed) {
        return {
          text: tweet,
          originalDraft: tweet,
          verdict: 'SKIP (unique meme)',
          isBored: false,
          flow: {
            generation: { model: genModel, systemPrompt: MEMEYA_PROMPT, userPrompt, rawOutput: rawGrokOutput, cleaned, ogUrl, charLimit: maxLen, finalBeforeGate: tweet },
            qualityGate: { model: 'skipped', checkPrompt: '(skipped — meme_spotlight with unique meme OG)', verdict: 'SKIP (unique meme)', isBored: false, boredReplacement: null },
          },
        };
      }
      return tweet;
    }

    // Boring/repetition check via second Grok call
    const checkPrompt = [
      `You are a content quality judge for a 13-year-old digital blacksmith character called Memeya.`,
      `Given a NEW tweet and a list of RECENT tweets, decide if the new tweet should be posted.`,
      ``,
      `ONLY flag as BORING if the tweet:`,
      `- Sounds like a generic AI/bot with NO personality (e.g. "Check out our platform!")`,
      `- Almost copy-pastes an earlier tweet's exact phrasing or theme`,
      `- Is pure marketing/announcement with zero character voice`,
      ``,
      `Short tweets, low-energy vibes, or quirky one-liners are OK — those show personality.`,
      `Memeya is allowed to be chill, weird, or minimal. That's not boring.`,
      ``,
      `NEW TWEET:`,
      tweet,
      ``,
      `RECENT POSTS (last 3 days):`,
      recentPostsSummary,
      ``,
      `Reply with EXACTLY one word:`,
      `- "OK" if the tweet has personality or a unique angle`,
      `- "BORING" if it's truly generic bot-speak or a near-duplicate`,
    ].join('\n');

    const verdict = await callGrok(apiKey, [
      { role: 'user', content: checkPrompt },
    ], { model: 'grok-3-mini', maxTokens: 20, temperature: 0.1 });

    const isBored = verdict.toUpperCase().includes('BORING');

    // Build detailed flow object (only when detailed mode requested)
    const buildFlow = (finalText, boredReplacement) => ({
      text: finalText,
      originalDraft: tweet,
      verdict: verdict.trim(),
      isBored,
      flow: {
        generation: {
          model: genModel,
          systemPrompt: MEMEYA_PROMPT,
          userPrompt,
          rawOutput: rawGrokOutput,
          cleaned,
          ogUrl,
          charLimit: maxLen,
          finalBeforeGate: tweet,
        },
        qualityGate: {
          model: 'grok-3-mini',
          checkPrompt,
          verdict: verdict.trim(),
          isBored,
          boredReplacement,
        },
      },
    });

    if (isBored) {
      // Generate a bored Memeya moment — either an action or lazy speech — and post it instead
      const boredTweet = await callGrok(apiKey, [
        { role: 'system', content: MEMEYA_PROMPT },
        {
          role: 'user',
          content: [
            `Your tweet draft was boring, so instead of posting it, do one of these:`,
            ``,
            `Option A — BORED ACTION in parentheses:`,
            `  (Memeya yawns and stares at the blockchain)`,
            `  (Memeya puts down the lava hammer and doomscrolls)`,
            `  (Memeya spins in her chair waiting for something interesting to happen)`,
            ``,
            `Option B — LAZY SPEECH, something low-energy but in-character:`,
            `  "nothing to forge today... the chain is too quiet"`,
            `  "sometimes the best move is no move"`,
            ``,
            `Pick one style randomly. Keep it under 100 chars. Just the action or speech, nothing else.`,
          ].join('\n'),
        },
      ], { model: 'grok-3-mini', maxTokens: 80, temperature: 1.0 });

      const finalText = boredTweet || '(Memeya stares into the void)';
      if (detailed) return buildFlow(finalText, finalText);
      return finalText;
    }

    if (detailed) return buildFlow(tweet, null);
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
          logPost(baseDir, 'manual', tweetText, url);
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

    // Expose generateTweet for autoPost and dashboard test-generate
    generateTweet,
  };
}

// ─── Autonomous Posting ──────────────────────────────────────

/**
 * Autonomous X post: gathers context, picks topic, generates tweet, posts it.
 * @param {{ baseDir: string, grokApiKey: string }} deps
 * @returns {{ success: boolean, url?: string, text?: string, topic?: string, reason?: string, draft?: string }}
 */
export async function autoPost({ baseDir, grokApiKey }) {
  const context = await gatherContext(baseDir, { grokApiKey });
  const topicChoice = chooseTopic(context);

  console.log(`[autoPost] Topic: ${topicChoice.topic}`);

  // Create a temporary executor to access generateTweet with the right baseDir
  const executors = createExecutors({ workDir: path.join(baseDir, 'agent') });

  let tweet;
  try {
    tweet = await executors.generateTweet(topicChoice);
  } catch (err) {
    return { success: false, reason: `generate_failed: ${err.message}`, draft: null };
  }

  // Get Twitter client
  let TwitterApi;
  try {
    const mod = await import('twitter-api-v2');
    TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
  } catch {
    return { success: false, reason: 'twitter-api-v2 not installed', draft: tweet };
  }

  const consumerKey = process.env.X_CONSUMER_KEY;
  const consumerSecret = process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    return { success: false, reason: 'no_credentials', draft: tweet };
  }

  const userClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken,
    accessSecret,
  });

  try {
    const { data } = await userClient.v2.tweet(tweet);
    const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;
    logPost(baseDir, topicChoice.topic, tweet, url);
    return { success: true, url, text: tweet, topic: topicChoice.topic };
  } catch (err) {
    return { success: false, reason: `tweet_failed: ${err.message}`, draft: tweet };
  }
}
