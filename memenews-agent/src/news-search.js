/**
 * News search — Grok web search for crypto news → backend API.
 * Feeds the daily meme generation pipeline via /api/news/collect.
 */

import { sendTg } from './telegram.js';
import { getState, putState, todayGMT8 } from './state.js';

// ─── Grok Web Search ────────────────────────────────────────────────────────

async function searchCryptoNews(env) {
  const today = todayGMT8();

  const res = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-non-reasoning',
      instructions: 'You are a crypto news researcher. Search for the latest Web3/Crypto/AI Agent news.',
      input: [{
        role: 'user',
        content: `Today is ${today}. Search for the latest Web3/Crypto/AI Agent news from the past 6 hours.

Find 2-3 news items with MEME POTENTIAL — events that could spark community reactions, satire, or drama.

For each item, respond with a JSON array:
[{
  "title": "English title (concise)",
  "summary": "English summary (1-2 sentences)",
  "trend_reason": "Why this matters to crypto community",
  "x_handle": "@handle or null",
  "category": "A"
}]

Categories: A=Token/Market, B=Macro/World/Tech, C=People/Culture
Respond with ONLY the JSON array, no other text.`
      }],
      tools: [{ type: 'web_search' }],
      max_output_tokens: 800,
      temperature: 0.5,
    }),
  });

  if (!res.ok) throw new Error(`Grok API ${res.status}: ${await res.text()}`);
  const data = await res.json();

  // Extract text from response
  const text = data.output?.find(o => o.type === 'message')?.content?.[0]?.text?.trim() || '';
  if (!text) return [];

  // Parse JSON array
  const match = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (!match) {
    console.log('[News] No JSON array in Grok response:', text.slice(0, 200));
    return [];
  }

  try {
    const items = JSON.parse(match[0]);
    return Array.isArray(items) ? items.filter(i => i.title && i.summary) : [];
  } catch (e) {
    console.error('[News] JSON parse error:', e.message);
    return [];
  }
}

// ─── Send to Backend ────────────────────────────────────────────────────────

async function collectToBackend(env, items) {
  const res = await fetch(`${env.BACKEND_URL}/api/news/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.LAB_API_KEY,
    },
    body: JSON.stringify({ items, source: 'search' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend news/collect ${res.status}: ${text}`);
  }

  return await res.json();
}

// ─── Main: Search News ──────────────────────────────────────────────────────

export async function searchNews(env) {
  if (!env.XAI_API_KEY) {
    return { success: false, reason: 'no_xai_key' };
  }

  console.log('[News] Searching crypto news via Grok web search...');

  // Search for news
  const items = await searchCryptoNews(env);

  if (items.length === 0) {
    console.log('[News] No significant news found');
    await putState(env, 'last-news-search.json', {
      timestamp: new Date().toISOString(),
      found: 0,
    });
    return { success: true, found: 0 };
  }

  console.log(`[News] Found ${items.length} news items`);

  // Send to backend
  let collected = 0;
  if (env.LAB_API_KEY) {
    try {
      const result = await collectToBackend(env, items);
      collected = result.count || items.length;
      console.log(`[News] Collected ${collected} items to backend`);
    } catch (e) {
      console.error('[News] Backend collect failed:', e.message);
    }
  }

  // Save state
  await putState(env, 'last-news-search.json', {
    timestamp: new Date().toISOString(),
    found: items.length,
    collected,
    titles: items.map(i => i.title),
  });

  // TG notification
  const titles = items.map(i => `• ${i.title}`).join('\n');
  await sendTg(env,
    `\u{1F4F0} <b>News Collected</b> (${items.length})\n\n${titles}`
  );

  return { success: true, found: items.length, collected };
}
