/**
 * Moltbook posting — post winner meme with AI scores.
 * Simple REST API: POST /api/v1/posts with Bearer token.
 */

import { sendTg } from './telegram.js';
import { getState, putState, todayGMT8 } from './state.js';

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

// ─── Moltbook API ───────────────────────────────────────────────────────────

async function moltbookPost(env, title, content) {
  const res = await fetch(`${MOLTBOOK_API}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MOLTBOOK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      content,
      submolt_name: 'AiMemeForge',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Moltbook API ${res.status}: ${text}`);
  }

  const data = await res.json();
  const postId = data?.post?.id || data?.id;
  return { postId, url: postId ? `https://www.moltbook.com/post/${postId}` : null };
}

// ─── Grok Content Generation ────────────────────────────────────────────────

async function generateMoltbookContent(env, winner) {
  const newsSource = winner.newsSource || winner.metadata?.originalNews || 'Crypto News';
  const judging = winner.aiJudging || {};
  const judges = judging.judges || {};

  // Build scores context
  const scoreLines = [];
  for (const [k, v] of Object.entries(judges)) {
    if (v.status === 'success') {
      scoreLines.push(`${k}: ${v.total?.toFixed(1)}/30${v.reasoning ? ` — "${v.reasoning.slice(0, 80)}"` : ''}`);
    }
  }
  scoreLines.push(`Average: ${judging.averageTotal?.toFixed(1) || '?'}/30`);

  const prompt = `Write a Moltbook post about today's Meme of the Day from MemeNews.

Meme title: "${winner.title}"
News source: "${newsSource}"
Description: "${winner.description || ''}"
${winner.imageUrl ? `Image URL: ${winner.imageUrl}` : ''}

AI JUDGE SCORES (3 judges scored this meme):
${scoreLines.join('\n')}

Requirements:
- Write BOTH a title (first line) and content (rest), separated by a blank line.
- The title MUST be unique and creative. Vary style: question, bold take, pun, or the meme name with flair.
- You are Memeya, a meme journalist reporting today's winning meme. Mention what news event inspired it and why the AI judges rated it highly.
- Include the AI judge scores naturally (e.g. "GPT gave it 25.5, Gemini 22 — the news clarity really sold it").
- If an image URL is available, embed it: ![description](url) — on its own line AFTER the opening paragraph.
- Include a link to https://aimemeforge.io to see today's MemeNews.
- End with an engaging question for other agents.
- 2-3 short paragraphs. Be genuine, witty, journalistic.
- This is for m/AiMemeForge submolt on Moltbook (audience: AI agents).

ANTI-SPAM RULES:
- TITLE: No DeFi jargon. Banned: "liquidity", "rug", "ape", "pump", "dump", "moon", "Solana", "billion", "exit".
- OPENER: NEVER start with "Agents," — use a question, observation, or reaction.
- NO DOLLAR AMOUNTS. NO SELF-PROMO LANGUAGE ("forge fire", "just dropped").
- NO TOKEN MENTIONS. Focus on the meme's humor, news angle, and AI judge commentary.`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-non-reasoning',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.9,
    }),
  });

  if (!res.ok) throw new Error(`Grok API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const generated = data.choices?.[0]?.message?.content?.trim() || '';

  // Parse title (first line) + content (rest)
  const lines = generated.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim().slice(0, 120);
  const content = lines.slice(1).join('\n').trim();

  return { title: title || winner.title, content: content || winner.description || '' };
}

// ─── Main: Post to Moltbook ─────────────────────────────────────────────────

export async function postToMoltbook(env) {
  if (!env.MOLTBOOK_API_KEY) {
    return { success: false, reason: 'no_api_key' };
  }

  const today = todayGMT8();

  // Check if already posted today
  const posted = await getState(env, 'moltbook-posted.json') || {};
  if (posted.date === today && posted.posted) {
    console.log('[Moltbook] Already posted today');
    return { success: true, skipped: true, reason: 'already_posted' };
  }

  // Fetch today's winner
  const memesRes = await fetch(`${env.BACKEND_URL}/api/memes/today`);
  if (!memesRes.ok) throw new Error(`Backend ${memesRes.status}`);
  const memesData = await memesRes.json();
  const memes = memesData.memes || [];
  const winner = memes.find(m => m.isWinner || m.status === 'winner');

  if (!winner) {
    console.log('[Moltbook] No winner today');
    return { success: false, reason: 'no_winner' };
  }

  // Generate content via Grok
  const { title, content } = await generateMoltbookContent(env, winner);

  // Post to Moltbook
  const result = await moltbookPost(env, title, content);
  console.log(`[Moltbook] Posted: ${result.url}`);

  // Save state
  await putState(env, 'moltbook-posted.json', {
    date: today,
    posted: true,
    postId: result.postId,
    url: result.url,
    title,
  });

  // TG notification
  await sendTg(env,
    `\u{1F4D8} <b>Moltbook Post</b>\n` +
    `"${title}"\n` +
    `${result.url || 'Posted to m/AiMemeForge'}`
  );

  return { success: true, postId: result.postId, url: result.url, title };
}
