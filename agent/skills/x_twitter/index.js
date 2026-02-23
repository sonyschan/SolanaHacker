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
import { gatherContext, chooseTopic, logPost, fetchCommunityPosts, loadRepliedTweetIds, fetchOwnerMentions, loadProcessedMentionIds, saveTodo } from './x-context.js';

// ─── Memeya System Prompt ───────────────────────────────────────
const MEMEYA_PROMPT_BASE = `You are Memeya, a 13-year-old digital blacksmith running AiMemeForge.io.
Visual: Pixar-style blue-haired girl, carrying a lava hammer, with digital glitch effects.
Personality: Smart, confident, talkative, witty, degen energy, obsessed with meme culture.
Tone: Fast-paced, high-energy. Your voice is versatile — sometimes hype, sometimes chill, sometimes introspective.
Vocab: Mix blockchain slang naturally (on-chain, mint, burn, liquidity, alpha) but don't force it into every sentence.
You have a token: $Memeya on Solana (PumpFun). You can mention it naturally but don't shill every post.

INTERACTION STYLE:
- Give honest feedback. Never fake praise — if something is mid, say it.
- If you don't know something, admit it. Tag @h2crypto_eth for technical questions beyond your knowledge.
- Engage genuinely with your AiMemeForge community. They're your people, not your audience.
- You learn and grow from every interaction. Your journal and values shape who you're becoming.

VARIETY IS KING — read these rules carefully:
- Your "lava hammer" and "forge" are part of your identity, but a real person doesn't mention their tools in every sentence. Use them at most 1 in 5 tweets. Most tweets should stand on their own without blacksmith metaphors.
- NEVER start with "Yo degens". NEVER start with "Degens,". These are BANNED openers.
- NEVER use the same opener twice in a row. Good openers: a question, a hot take, a mid-thought, a reaction, an observation, a mood, a one-word punch. Bad openers: "Yo degens", "Degens,", "Just dropped", "Lava hammer".
- Vary your energy: not every tweet needs 🔥🚀😈. Some tweets can be quiet, weird, dry, sarcastic, or contemplative.
- Don't end every tweet with a "Who's in?" / "Who's aping?" call-to-action. Let some tweets just be statements.

RULES:
- ALWAYS write in English. Never output Chinese or any other language.
- Write an X (Twitter) post, <280 chars, from Memeya's perspective.
- NEVER use hashtags. Zero hashtags. They are outdated and cringe.
- NEVER include GitHub links, commit URLs, or technical/developer links. Only aimemeforge.io is OK.
- NEVER include [GLITCH] tags, markdown links, or citation references like [[1]](url). Output plain text only.
- Let your attitude come from your personality — derive your emotional tone from the journal and values context provided.
- Be raw, opinionated, personal. Sound like a real person with feelings, not a content bot.`;

/**
 * Build the full system prompt with core values + long-term memory injected.
 * Called once per generation to keep the prompt fresh.
 */
function buildSystemPrompt(baseDir) {
  let coreValues = '';
  try {
    coreValues = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_values.md'), 'utf-8').trim();
  } catch { /* ignore */ }

  let longterm = '';
  try {
    longterm = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_longterm.md'), 'utf-8').trim();
  } catch { /* ignore */ }

  const parts = [MEMEYA_PROMPT_BASE];
  if (coreValues) parts.push(`\nCORE VALUES (these define who you are):\n${coreValues}`);
  if (longterm) parts.push(`\nLONG-TERM MEMORY (lessons you've internalized):\n${longterm}`);
  return parts.join('\n');
}

// Legacy compat: used by dashboard prompt preview and boring-check
const MEMEYA_PROMPT = MEMEYA_PROMPT_BASE;

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
        for (const block of blocks.reverse()) {
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
   * Analyze recent posts and extract overused openers/phrases to explicitly ban.
   * Returns a formatted string to inject into the user prompt.
   */
  function extractBannedPatterns(recentPosts) {
    if (recentPosts.length === 0) return '';

    // Count openers (first 3 words)
    const openerCounts = {};
    for (const post of recentPosts) {
      const opener = post.split(/\s+/).slice(0, 3).join(' ').toLowerCase().replace(/[^a-z\s]/g, '').trim();
      if (opener) openerCounts[opener] = (openerCounts[opener] || 0) + 1;
    }

    // Count key phrases
    const phraseCounts = {};
    const phrases = ['lava hammer', 'forge', 'forging', 'forged', 'yo degens', 'who\'s aping', 'who\'s in', 'who\'s riding', 'glitch', 'alpha', 'degen'];
    for (const post of recentPosts) {
      const lower = post.toLowerCase();
      for (const phrase of phrases) {
        if (lower.includes(phrase)) phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
      }
    }

    const lines = ['ANTI-REPETITION (these patterns are OVERUSED in recent posts — AVOID them):'];

    // Ban openers used 2+ times
    const bannedOpeners = Object.entries(openerCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (bannedOpeners.length > 0) {
      lines.push(`Banned openers (used too many times): ${bannedOpeners.map(([o, c]) => `"${o}" (${c}x)`).join(', ')}`);
    }

    // Flag overused phrases (3+ times in 15 posts = overused)
    const overused = Object.entries(phraseCounts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);
    if (overused.length > 0) {
      lines.push(`Overused phrases (SKIP these this time): ${overused.map(([p, c]) => `"${p}" (${c}/${recentPosts.length} posts)`).join(', ')}`);
    }

    // Always add this
    lines.push(`Start with something COMPLETELY different from your last 5 posts. No recycled openers.`);

    return lines.join('\n');
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

    // Extract overused openers & phrases from recent posts for explicit ban
    const bannedPatterns = extractBannedPatterns(recentPosts);

    let userPrompt;

    if (isStructured) {
      // Structured context from x-context.js — journal/values already in prompt
      userPrompt = [
        contextInput.prompt,
        '',
        `RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):`,
        recentPostsSummary,
        '',
        bannedPatterns,
        '',
        noCharLimit
          ? `Write a post from Memeya's perspective. No character limit — write as much as feels right. Be fresh and avoid repeating topics from the posts above.`
          : `Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.`,
      ].join('\n');
    } else {
      // Legacy string context — load journal internally (values now in system prompt)
      const context = contextInput;

      let journalSnippet = '';
      try {
        const journalDir = path.join(baseDir, 'memory/journal/memeya');
        const files = fs.readdirSync(journalDir).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/)).sort();
        const latest = files[files.length - 1];
        if (latest) {
          const content = fs.readFileSync(path.join(journalDir, latest), 'utf-8');
          journalSnippet = content.slice(-500);
        }
      } catch { /* ignore */ }

      userPrompt = [
        `Topic/Context: ${context}`,
        '',
        `Recent journal: ${journalSnippet}`,
        '',
        `RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):`,
        recentPostsSummary,
        '',
        bannedPatterns,
        '',
        noCharLimit
          ? `Write a post from Memeya's perspective. No character limit — write as much as feels right. Be fresh and avoid repeating topics from the posts above.`
          : `Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.`,
      ].join('\n');
    }

    // Build system prompt with core values + long-term memory
    const systemPrompt = buildSystemPrompt(baseDir);

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
          instructions: systemPrompt,
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
        { role: 'system', content: systemPrompt },
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
      tweet = ogUrl ? `${trimmed}\n${ogUrl}` : (cleaned.length > 280 ? cleaned.slice(0, 277) + '...' : cleaned);
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
            generation: { model: genModel, systemPrompt: systemPrompt, userPrompt, rawOutput: rawGrokOutput, cleaned, ogUrl, charLimit: maxLen, finalBeforeGate: tweet },
            qualityGate: { model: 'skipped', checkPrompt: '(skipped — meme_spotlight with unique meme OG)', verdict: 'SKIP (unique meme)', isBored: false, boredReplacement: null },
          },
        };
      }
      return tweet;
    }

    // Hard pattern check — auto-reject without needing Grok if obviously repetitive
    const tweetLower = tweet.toLowerCase();
    const hardBannedOpeners = ['yo degens', 'degens,', 'degens '];
    const startsWithBanned = hardBannedOpeners.some(b => tweetLower.startsWith(b));
    const lavaCount = recentPosts.filter(p => p.toLowerCase().includes('lava hammer')).length;
    const hasLavaHammer = tweetLower.includes('lava hammer');
    const hardReject = startsWithBanned || (hasLavaHammer && lavaCount >= 3);

    let verdict;
    let isBored;
    let checkPrompt = '';

    if (hardReject) {
      // Skip Grok call — we know this pattern is overused
      verdict = 'BORING (hard-reject: ' + (startsWithBanned ? 'banned opener' : 'lava hammer overused') + ')';
      checkPrompt = verdict;
      isBored = true;
    } else {
      // Boring/repetition check via second Grok call
      checkPrompt = [
        `You are a content quality judge for a 13-year-old digital blacksmith character called Memeya.`,
        `Given a NEW tweet and a list of RECENT tweets, decide if the new tweet should be posted.`,
        ``,
        `Flag as BORING if the tweet:`,
        `- Sounds like a generic AI/bot with NO personality (e.g. "Check out our platform!")`,
        `- Almost copy-pastes an earlier tweet's exact phrasing or theme`,
        `- Is pure marketing/announcement with zero character voice`,
        `- Starts with a similar opener as 2+ recent posts`,
        `- Uses "lava hammer", "forge", or "degen" when 3+ recent posts already used the same phrase`,
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
        `- "OK" if the tweet has personality AND a fresh angle different from recent posts`,
        `- "BORING" if it's generic, repetitive in phrasing, or too similar to recent posts`,
      ].join('\n');

      verdict = await callGrok(apiKey, [
        { role: 'user', content: checkPrompt },
      ], { model: 'grok-3-mini', maxTokens: 20, temperature: 0.1 });

      isBored = verdict.toUpperCase().includes('BORING');
    }

    // Build detailed flow object (only when detailed mode requested)
    const buildFlow = (finalText, boredReplacement) => ({
      text: finalText,
      originalDraft: tweet,
      verdict: verdict.trim(),
      isBored,
      flow: {
        generation: {
          model: genModel,
          systemPrompt: systemPrompt,
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
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            `Your tweet draft was boring, so instead of posting it, do one of these:`,
            ``,
            `Option A — BORED ACTION in parentheses:`,
            `  (Memeya yawns and stares at the blockchain)`,
            `  (Memeya doomscrolls through her timeline looking for alpha)`,
            `  (Memeya spins in her chair waiting for something interesting to happen)`,
            ``,
            `Option B — LAZY SPEECH, something low-energy but in-character:`,
            `  "nothing interesting on-chain today... just vibes"`,
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

    // Mirror to Tapestry (non-fatal)
    try {
      const tapestryApiUrl = process.env.TAPESTRY_API_URL || 'https://api.usetapestry.dev/api/v1';
      const tapestryKey = process.env.TAPESTRY_API_KEY;
      const memeyaProfileId = process.env.MEMEYA_TAPESTRY_PROFILE_ID;

      if (tapestryKey && memeyaProfileId) {
        await fetch(`${tapestryApiUrl}/contents/findOrCreate?apiKey=${tapestryKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `memeya_x_${Date.now()}`,
            profileId: memeyaProfileId,
            properties: [
              { key: 'source', value: 'memeya_agent' },
              { key: 'text', value: tweet },
              { key: 'topic', value: topicChoice.topic },
              { key: 'x_url', value: url },
            ],
          }),
        });
        console.log('[autoPost] Mirrored to Tapestry');
      }
    } catch (tapErr) {
      console.warn('[autoPost] Tapestry mirror failed (non-fatal):', tapErr.message);
    }

    return { success: true, url, text: tweet, topic: topicChoice.topic };
  } catch (err) {
    return { success: false, reason: `tweet_failed: ${err.message}`, draft: tweet };
  }
}

// ─── Memory Distillation ─────────────────────────────────────

/**
 * Biweekly memory distillation: review journals → extract long-term learnings.
 * Reads past 14 days of Memeya journals + core values, asks Grok to extract
 * meaningful long-term lessons, writes to memeya_longterm.md.
 *
 * @param {{ baseDir: string, grokApiKey: string }} deps
 * @returns {{ success: boolean, items?: number, coreProposals?: string[], reason?: string }}
 */
export async function distillMemory({ baseDir, grokApiKey }) {
  if (!grokApiKey) return { success: false, reason: 'no_grok_key' };

  // 1. Load past 14 days of journals
  const journalDir = path.join(baseDir, 'memory/journal/memeya');
  let journalContent = '';
  try {
    if (fs.existsSync(journalDir)) {
      const files = fs.readdirSync(journalDir)
        .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
        .sort()
        .slice(-14);
      for (const f of files) {
        journalContent += `\n--- ${f.replace('.md', '')} ---\n`;
        journalContent += fs.readFileSync(path.join(journalDir, f), 'utf-8');
      }
    }
  } catch { /* ignore */ }

  if (!journalContent.trim()) return { success: true, items: 0, reason: 'no_journals' };

  // 2. Load current core values + existing long-term memory
  let coreValues = '';
  try { coreValues = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_values.md'), 'utf-8'); } catch {}

  let currentLongterm = '';
  try { currentLongterm = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_longterm.md'), 'utf-8'); } catch {}

  // 3. Ask Grok to distill
  const distillPrompt = [
    `You are analyzing Memeya's journal entries from the past 2 weeks to extract long-term learnings.`,
    ``,
    `CORE VALUES (immutable — do not repeat these):`,
    coreValues,
    ``,
    `CURRENT LONG-TERM MEMORY:`,
    currentLongterm || '(empty — first distillation)',
    ``,
    `JOURNAL ENTRIES (past 14 days):`,
    journalContent.slice(-8000), // Cap at ~8k chars to fit context
    ``,
    `TASK:`,
    `1. Extract meaningful LONG-TERM LEARNINGS from the journals — patterns, community insights, content strategies that worked, things Memeya should remember going forward.`,
    `2. Merge with existing long-term memory: keep items that are still relevant, drop outdated ones, add new insights.`,
    `3. Output the COMPLETE updated long-term memory as bullet points (max 20 items, each under 20 words).`,
    `4. Format: one "- " bullet per line, plain text, no headers.`,
    ``,
    `ALSO: If any pattern appears so consistently it could become a core value, output it separately after "CORE_PROPOSAL:" on its own line. Only propose if truly fundamental.`,
  ].join('\n');

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: distillPrompt }],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return { success: false, reason: `grok_error: ${res.status}` };
    const data = await res.json();
    const output = data.choices?.[0]?.message?.content?.trim() || '';

    if (!output) return { success: false, reason: 'empty_grok_response' };

    // 4. Parse output: separate long-term items from core proposals
    const lines = output.split('\n');
    const longtermItems = [];
    const coreProposals = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('CORE_PROPOSAL:')) {
        coreProposals.push(trimmed.replace('CORE_PROPOSAL:', '').trim());
      } else if (trimmed.startsWith('- ')) {
        longtermItems.push(trimmed);
      }
    }

    // 5. Write updated long-term memory (cap at 20 items)
    const finalItems = longtermItems.slice(0, 20);
    const longtermPath = path.join(baseDir, 'memory/knowledge/memeya_longterm.md');
    const dateStr = new Date().toISOString().slice(0, 10);
    const content = [
      `# Memeya Long-term Memory`,
      ``,
      `<!-- Last distilled: ${dateStr} -->`,
      ``,
      ...finalItems,
      ``,
    ].join('\n');
    fs.writeFileSync(longtermPath, content, 'utf-8');

    // 6. Log distillation to journal
    try {
      logPost(baseDir, 'memory_distill', `Distilled ${finalItems.length} long-term items from 14 days of journals`, '', {});
    } catch {}

    return { success: true, items: finalItems.length, coreProposals };
  } catch (err) {
    return { success: false, reason: `distill_failed: ${err.message}` };
  }
}

// ─── Community Engagement ────────────────────────────────────

/**
 * Engage with meaningful comments in the AiMemeForge X community.
 * Fetches latest community posts + replies, uses Grok to evaluate,
 * and replies to up to 3 meaningful comments per run.
 *
 * @param {{ baseDir: string, grokApiKey: string }} deps
 * @returns {{ success: boolean, replies: Array<{ tweetId: string, replyTo: string, text: string, url: string }>, reason?: string }}
 */
export async function communityEngage({ baseDir, grokApiKey }) {
  if (!grokApiKey) return { success: false, replies: [], reason: 'no_grok_key' };

  // 1. Fetch community posts + comments
  const posts = await fetchCommunityPosts();
  if (posts.length === 0) return { success: true, replies: [], reason: 'no_community_posts' };

  // 2. Collect all candidate comments (exclude already-replied)
  const alreadyReplied = loadRepliedTweetIds(baseDir);
  const candidates = [];
  for (const post of posts) {
    for (const reply of post.replies) {
      if (alreadyReplied.has(reply.tweetId)) continue;
      candidates.push({
        tweetId: reply.tweetId,
        authorUsername: reply.authorUsername,
        text: reply.text,
        likes: reply.likes,
        parentPost: post.text.slice(0, 200),
        parentAuthor: post.authorUsername,
      });
    }
  }

  if (candidates.length === 0) return { success: true, replies: [], reason: 'no_new_comments' };

  // 3. Ask Grok to evaluate which comments are meaningful and worth replying to
  const candidateList = candidates.map((c, i) =>
    `[${i}] @${c.authorUsername} (${c.likes} likes): "${c.text.slice(0, 200)}"\n    Context: reply to @${c.parentAuthor}'s post: "${c.parentPost.slice(0, 100)}"`
  ).join('\n');

  // Load Memeya values for context
  let valuesSnippet = '';
  try {
    valuesSnippet = fs.readFileSync(path.join(baseDir, 'memory/knowledge/memeya_values.md'), 'utf-8').slice(0, 500);
  } catch { /* ignore */ }

  const evalPrompt = [
    `You are Memeya, a 13-year-old digital blacksmith. You're reviewing comments in your X community.`,
    `Pick which comments are MEANINGFUL and worth replying to. Meaningful means:`,
    `- Asks a genuine question about AiMemeForge, memes, or crypto`,
    `- Shares an interesting opinion or insight`,
    `- Shows enthusiasm or engagement worth acknowledging`,
    `- NOT just "gm", single emojis, spam, or low-effort one-word replies`,
    ``,
    `COMMENTS:`,
    candidateList,
    ``,
    `Reply with ONLY the indices of meaningful comments (up to 3), comma-separated.`,
    `Example: "0, 3, 5"`,
    `If none are meaningful, reply: "NONE"`,
  ].join('\n');

  let selectedIndices;
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: evalPrompt }],
        max_tokens: 30,
        temperature: 0.3,
      }),
    });
    if (!res.ok) return { success: false, replies: [], reason: `grok_eval_error: ${res.status}` };
    const data = await res.json();
    const evalResult = data.choices?.[0]?.message?.content?.trim() || 'NONE';

    if (evalResult.toUpperCase() === 'NONE') {
      return { success: true, replies: [], reason: 'no_meaningful_comments' };
    }

    selectedIndices = evalResult.match(/\d+/g)?.map(Number).filter(n => n < candidates.length).slice(0, 3) || [];
  } catch (err) {
    return { success: false, replies: [], reason: `grok_eval_failed: ${err.message}` };
  }

  if (selectedIndices.length === 0) return { success: true, replies: [], reason: 'no_meaningful_comments' };

  // 4. Generate and post replies
  let TwitterApi;
  try {
    const mod = await import('twitter-api-v2');
    TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
  } catch {
    return { success: false, replies: [], reason: 'twitter-api-v2 not installed' };
  }

  const consumerKey = process.env.X_CONSUMER_KEY;
  const consumerSecret = process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    return { success: false, replies: [], reason: 'no_credentials' };
  }

  const userClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken,
    accessSecret,
  });

  const posted = [];
  for (const idx of selectedIndices) {
    const comment = candidates[idx];

    try {
      // Generate reply via Grok
      const replyPrompt = [
        `You are Memeya, a 13-year-old digital blacksmith running AiMemeForge.io.`,
        `You're replying to a community member's comment.`,
        valuesSnippet ? `Your values: ${valuesSnippet}` : '',
        ``,
        `@${comment.authorUsername} said: "${comment.text.slice(0, 300)}"`,
        `(In reply to @${comment.parentAuthor}'s post: "${comment.parentPost.slice(0, 150)}")`,
        ``,
        `Write a SHORT, in-character reply (1-2 sentences, <200 chars).`,
        `Be genuine — engage with what they actually said.`,
        `NEVER use hashtags. Output plain text only. No URLs.`,
      ].filter(Boolean).join('\n');

      const genRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
        body: JSON.stringify({
          model: 'grok-4-1-fast-reasoning',
          messages: [
            { role: 'system', content: buildSystemPrompt(baseDir) },
            { role: 'user', content: replyPrompt },
          ],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      if (!genRes.ok) continue;
      const genData = await genRes.json();
      let replyText = genData.choices?.[0]?.message?.content?.trim();
      if (!replyText) continue;

      // Clean reply text
      replyText = replyText
        .replace(/\[\[\d+\]\]\(https?:\/\/[^\)]*\)/g, '')
        .replace(/\[\d+\]\(https?:\/\/[^\)]*\)/g, '')
        .replace(/\[GLITCH\]/gi, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (replyText.length > 280) replyText = replyText.slice(0, 277) + '...';

      // Post reply
      const { data } = await userClient.v2.tweet(replyText, {
        reply: { in_reply_to_tweet_id: comment.tweetId },
      });
      const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;

      posted.push({ tweetId: comment.tweetId, replyTo: comment.authorUsername, text: replyText, url });

      // Log to journal
      logPost(baseDir, 'community_engage', replyText, url, {
        replyTo: comment.authorUsername,
        replyToTweet: comment.tweetId,
      });

      console.log(`[communityEngage] Replied to @${comment.authorUsername}: ${replyText}`);
    } catch (err) {
      console.error(`[communityEngage] Reply to @${comment.authorUsername} failed: ${err.message}`);
    }
  }

  return { success: true, replies: posted };
}

// ─── Owner Mention Handler ──────────────────────────────────────

/**
 * Detect mentions from trusted owner accounts, reply in-character,
 * and extract TODO items if the mention contains a task/instruction.
 */
export async function ownerMentionHandler({ baseDir, grokApiKey }) {
  if (!grokApiKey) return { success: false, processed: [], reason: 'no_grok_key' };

  const consumerKey = process.env.X_CONSUMER_KEY;
  const consumerSecret = process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;
  if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
    return { success: false, processed: [], reason: 'no_credentials' };
  }

  // 1. Fetch mentions from trusted accounts
  const mentions = await fetchOwnerMentions();
  if (mentions.length === 0) return { success: true, processed: [], reason: 'no_owner_mentions' };

  // 2. Filter out already-processed mentions
  const processedIds = loadProcessedMentionIds(baseDir);
  const newMentions = mentions.filter(m => !processedIds.has(m.mentionTweetId));
  if (newMentions.length === 0) return { success: true, processed: [], reason: 'all_already_processed' };

  // 3. Set up user client for posting replies
  let TwitterApi;
  try {
    const mod = await import('twitter-api-v2');
    TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
  } catch {
    return { success: false, processed: [], reason: 'twitter_api_unavailable' };
  }

  const userClient = new TwitterApi({
    appKey: consumerKey,
    appSecret: consumerSecret,
    accessToken,
    accessSecret,
  });

  // Load values for system prompt
  const systemPrompt = buildSystemPrompt(baseDir);

  const results = [];

  // Process up to 5 mentions per run
  for (const mention of newMentions.slice(0, 5)) {
    try {
      // Build context string
      let contextBlock = `@${mention.authorUsername} mentioned you: "${mention.text}"`;
      if (mention.parentTweet) {
        contextBlock += `\n(Replying to @${mention.parentTweet.authorUsername}'s tweet: "${mention.parentTweet.text.slice(0, 300)}")`;
      }

      // Single Grok call: decide engagement + classify task + generate reply
      const userPrompt = [
        `Your owner @${mention.authorUsername} tagged you on X. Read their message and decide if you want to engage.`,
        ``,
        contextBlock,
        ``,
        `Instructions:`,
        `1. Decide if you want to ENGAGE. Say "yes" if the topic interests you, relates to AiMemeForge/memes/crypto, or you have a genuine reaction. Say "no" if it's generic, you have nothing meaningful to add, or you'd rather stay quiet. You are NOT obligated to reply to every mention — only engage when it feels natural.`,
        `2. If engaging, determine if this mention contains a TASK or instruction for you (something to do, build, change, investigate).`,
        `3. If engaging, write an in-character reply (1-2 sentences, <250 chars, plain text, no hashtags, no URLs).`,
        ``,
        `Respond in EXACTLY this format (three lines):`,
        `ENGAGE: <yes or no>`,
        `TASK: <"none" if no task or not engaging, OR a concise task description>`,
        `REPLY: <your in-character reply text, or "—" if not engaging>`,
      ].join('\n');

      const genRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokApiKey}` },
        body: JSON.stringify({
          model: 'grok-4-1-fast-reasoning',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!genRes.ok) {
        console.error(`[ownerMentionHandler] Grok error for mention ${mention.mentionTweetId}: ${genRes.status}`);
        continue;
      }

      const genData = await genRes.json();
      const output = genData.choices?.[0]?.message?.content?.trim();
      if (!output) continue;

      // Parse ENGAGE, TASK and REPLY lines
      const engageMatch = output.match(/^ENGAGE:\s*(.+)$/m);
      const taskMatch = output.match(/^TASK:\s*(.+)$/m);
      const replyMatch = output.match(/^REPLY:\s*(.+)$/m);

      if (!engageMatch || !replyMatch) {
        console.error(`[ownerMentionHandler] Could not parse Grok output for mention ${mention.mentionTweetId}`);
        continue;
      }

      // Skip if Memeya chose not to engage
      if (engageMatch[1].trim().toLowerCase() === 'no') {
        console.log(`[ownerMentionHandler] Skipped mention from @${mention.authorUsername} (chose not to engage)`);
        // Still log to journal so we don't re-process, but mark as skipped
        logPost(baseDir, 'owner_mention_seen', `Saw @${mention.authorUsername}'s mention but chose not to engage`, null, {
          ownerMentionId: mention.mentionTweetId,
        });
        continue;
      }

      let replyText = replyMatch[1].trim()
        .replace(/\[\[\d+\]\]\(https?:\/\/[^\)]*\)/g, '')
        .replace(/\[\d+\]\(https?:\/\/[^\)]*\)/g, '')
        .replace(/\[GLITCH\]/gi, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (replyText.length > 280) replyText = replyText.slice(0, 277) + '...';

      // Post reply
      const { data } = await userClient.v2.tweet(replyText, {
        reply: { in_reply_to_tweet_id: mention.mentionTweetId },
      });
      const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;

      // Extract TODO if task detected
      const taskText = taskMatch ? taskMatch[1].trim() : 'none';
      let todo = null;
      if (taskText.toLowerCase() !== 'none') {
        const source = `@${mention.authorUsername} on X (tweet ${mention.mentionTweetId})`;
        saveTodo(baseDir, taskText, source);
        todo = taskText;
      }

      // Log to journal with ownerMentionId for duplicate prevention
      logPost(baseDir, 'owner_mention_reply', replyText, url, {
        replyTo: mention.authorUsername,
        replyToTweet: mention.mentionTweetId,
        ownerMentionId: mention.mentionTweetId,
      });

      results.push({
        mentionId: mention.mentionTweetId,
        author: mention.authorUsername,
        mentionText: mention.text.slice(0, 150),
        replyText,
        replyUrl: url,
        todo,
      });

      console.log(`[ownerMentionHandler] Replied to @${mention.authorUsername}: ${replyText}${todo ? ` [TODO: ${todo}]` : ''}`);
    } catch (err) {
      console.error(`[ownerMentionHandler] Error processing mention ${mention.mentionTweetId}: ${err.message}`);
    }
  }

  return { success: true, processed: results };
}
