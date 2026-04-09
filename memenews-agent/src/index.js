/**
 * MemeNews Agent — Cloudflare Worker
 *
 * Cron schedule:
 * - 0 2 * * *   (10AM GMT+8): Post MemeNews to X
 * - 0 3 * * *   (11AM GMT+8): Post winner to Moltbook
 * - every 6h:                  News search → Firestore
 */

import { postMemeNewsToX } from './x-posting.js';
import { postToMoltbook } from './moltbook.js';
import { searchNews } from './news-search.js';
import { sendTg } from './telegram.js';
import { getState, todayGMT8 } from './state.js';

export default {
  async scheduled(event, env, ctx) {
    console.log(`[Scheduled] Cron: ${event.cron}`);
    try {
      switch (event.cron) {
        case '0 2 * * *':
          ctx.waitUntil(postMemeNewsToX(env));
          break;
        case '0 3 * * *':
          ctx.waitUntil(postToMoltbook(env));
          break;
        case '0 */6 * * *':
          ctx.waitUntil(searchNews(env));
          break;
        default:
          console.log(`[Scheduled] Unknown cron: ${event.cron}`);
      }
    } catch (e) {
      console.error(`[Scheduled] Error on ${event.cron}:`, e.message);
      await sendTg(env, `\u274C <b>MemeNews Agent Error</b>\nCron: ${event.cron}\n${e.message}`);
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    // Auth check for trigger endpoints
    if (url.pathname.startsWith('/trigger/')) {
      const auth = request.headers.get('Authorization');
      if (env.TRIGGER_SECRET && auth !== `Bearer ${env.TRIGGER_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    switch (url.pathname) {
      case '/':
        return Response.json({
          name: 'memenews-agent',
          version: '1.0.0',
          crons: ['0 2 * * * (X post)', '0 3 * * * (Moltbook)', '0 */6 * * * (News)'],
        });

      case '/status': {
        const diary = await getState(env, 'diary.json');
        const moltbook = await getState(env, 'moltbook-posted.json');
        const news = await getState(env, 'last-news-search.json');
        return Response.json({
          today: todayGMT8(),
          x: diary,
          moltbook,
          news,
        });
      }

      case '/trigger/x':
        if (request.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
        return Response.json(await postMemeNewsToX(env));

      case '/trigger/moltbook':
        if (request.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
        return Response.json(await postToMoltbook(env));

      case '/trigger/news':
        if (request.method !== 'POST') return Response.json({ error: 'POST only' }, { status: 405 });
        return Response.json(await searchNews(env));

      default:
        return Response.json({ error: 'Not found' }, { status: 404 });
    }
  },
};
