/**
 * MemeNews X Posting — CF Worker compatible
 *
 * OAuth 1.0a signing via Web Crypto API (no Node.js crypto needed).
 * Fixed-format tweet: winner title + news source + Grok narrative + AI scores.
 */

import { sendTg } from './telegram.js';
import { getState, putState, todayGMT8 } from './state.js';

// ─── OAuth 1.0a Signing (Web Crypto API) ────────────────────────────────────

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(36)).join('').slice(0, 32);
}

async function hmacSha1(key, data) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function buildOAuthHeader(method, url, params, env) {
  const oauthParams = {
    oauth_consumer_key: env.X_CONSUMER_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  // Merge all params for signature base
  const allParams = { ...oauthParams, ...params };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys.map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join('&');

  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(env.X_CONSUMER_SECRET)}&${percentEncode(env.X_ACCESS_SECRET)}`;
  const signature = await hmacSha1(signingKey, baseString);

  oauthParams.oauth_signature = signature;

  const header = 'OAuth ' + Object.entries(oauthParams)
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(', ');

  return header;
}

// ─── X API Calls ────────────────────────────────────────────────────────────

async function uploadMedia(env, imageBuffer, mimeType) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';

  // Base64 encode the image
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

  const params = {
    media_data: base64,
    media_category: 'tweet_image',
  };

  const authHeader = await buildOAuthHeader('POST', url, params, env);

  const formBody = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Media upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.media_id_string;
}

async function postTweet(env, text, mediaIds = []) {
  const url = 'https://api.twitter.com/2/tweets';

  const body = { text };
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds };
  }

  // OAuth for v2 — no extra params in signature for JSON body
  const authHeader = await buildOAuthHeader('POST', url, {}, env);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tweet failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    id: data.data?.id,
    url: `https://x.com/AiMemeForgeIO/status/${data.data?.id}`,
  };
}

// ─── Grok Narrative ─────────────────────────────────────────────────────────

async function generateNarrative(env, winner) {
  const newsSource = winner.newsSource || winner.metadata?.originalNews || 'Crypto News';

  const prompt = `You are Memeya, a sharp meme journalist. Write a 2-sentence narrative about this meme winning Meme of the Day.

WINNING MEME:
- Title: ${winner.title || 'Untitled'}
- News Source: ${newsSource}
${winner.description ? `- Description: ${winner.description}` : ''}
${(winner.tags || []).length > 0 ? `- Tags: ${winner.tags.join(', ')}` : ''}

RULES:
- Write EXACTLY 2 sentences, under 160 characters total
- Sentence 1: What real news event happened
- Sentence 2: Why this meme nailed it
- Sound like a meme reporter — sharp, witty, not corporate
- Do NOT include emojis, hashtags, URLs, or formatting
- Write ONLY the 2 sentences, nothing else`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-non-reasoning',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Grok API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let narrative = data.choices?.[0]?.message?.content?.trim() || '';

  // Clean up
  narrative = narrative
    .replace(/https?:\/\/\S+/g, '')
    .replace(/aimemeforge\.io/gi, '')
    .replace(/\n{2,}/g, ' ')
    .trim();
  if (narrative.length > 200) narrative = narrative.slice(0, 197) + '...';

  return narrative;
}

// ─── Main: Post MemeNews to X ───────────────────────────────────────────────

export async function postMemeNewsToX(env) {
  const today = todayGMT8();

  // Check if already posted today
  const diary = await getState(env, 'diary.json');
  if (diary?.date === today && diary?.xPosted) {
    console.log('[X] Already posted today');
    return { success: true, skipped: true, reason: 'already_posted' };
  }

  // Fetch today's memes from backend
  const backendUrl = env.BACKEND_URL;
  const memesRes = await fetch(`${backendUrl}/api/memes/today`);
  if (!memesRes.ok) throw new Error(`Backend ${memesRes.status}`);
  const memesData = await memesRes.json();
  const memes = memesData.memes || [];

  if (memes.length === 0) {
    console.log('[X] No memes today');
    return { success: false, reason: 'no_memes' };
  }

  // Find winner
  const winner = memes.find(m => m.isWinner || m.status === 'winner');
  if (!winner) {
    console.log('[X] No winner yet (AI judging may not have run)');
    return { success: false, reason: 'no_winner' };
  }

  // Build scores line
  const judging = winner.aiJudging || {};
  const judges = judging.judges || {};
  const scoreParts = [];
  if (judges.chatgpt?.status === 'success') scoreParts.push(`GPT: ${judges.chatgpt.total?.toFixed(1)}`);
  if (judges.gemini?.status === 'success') scoreParts.push(`Gemini: ${judges.gemini.total?.toFixed(1)}`);
  if (judges.grok?.status === 'success') scoreParts.push(`Grok: ${judges.grok.total?.toFixed(1)}`);
  const scoresLine = scoreParts.join(' | ') || 'Scored by 3 AI judges';

  const newsSource = winner.newsSource || winner.metadata?.originalNews || 'Crypto News';

  // Generate narrative via Grok
  let narrative;
  try {
    narrative = await generateNarrative(env, winner);
  } catch (e) {
    console.error('[X] Narrative failed:', e.message);
    narrative = winner.description?.slice(0, 160) || '';
  }

  // Assemble tweet
  const tweet = [
    '\u{1F4F0} Today\'s MemeNews',
    '',
    `\u{1F3C6} "${winner.title}"`,
    `\u{1F4CC} ${newsSource}`,
    '',
    narrative,
    '',
    scoresLine,
    '',
    '\u{1F517} aimemeforge.io',
  ].join('\n');

  console.log(`[X] Tweet assembled (${tweet.length} chars)`);

  // Upload winner image
  let mediaIds = [];
  if (winner.imageUrl) {
    try {
      const imgRes = await fetch(winner.imageUrl);
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        if (buf.byteLength < 5 * 1024 * 1024) {
          const mediaId = await uploadMedia(env, buf, imgRes.headers.get('content-type') || 'image/jpeg');
          mediaIds.push(mediaId);
          console.log(`[X] Image uploaded: ${mediaId}`);
        }
      }
    } catch (e) {
      console.warn('[X] Image upload failed:', e.message);
    }
  }

  // Post tweet
  const result = await postTweet(env, tweet, mediaIds);
  console.log(`[X] Posted: ${result.url}`);

  // Save state
  await putState(env, 'diary.json', {
    date: today,
    xPosted: true,
    tweetUrl: result.url,
    winnerId: winner.id,
    winnerTitle: winner.title,
  });

  // TG notification
  await sendTg(env,
    `\u{1F4F0} <b>MemeNews X Post</b>\n` +
    `Winner: ${winner.title}\n` +
    `${scoresLine}\n` +
    `<a href="${result.url}">View tweet</a>`
  );

  return { success: true, tweetUrl: result.url, winnerId: winner.id };
}
