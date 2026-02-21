#!/usr/bin/env node
/**
 * Dashboard server — serves dashboard.html, memeya-dashboard.html,
 * plus regen/health/shutdown + Memeya API endpoints.
 *
 * Usage:
 *   node dashboard-server.js            # port 8090
 *   PORT=9090 node dashboard-server.js
 *
 * Systemd:
 *   systemctl start dashboard-server
 *   systemctl stop dashboard-server
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.DASHBOARD_PORT || '8090');
const DASHBOARD_PATH = path.join(__dirname, 'dashboard.html');
const MEMEYA_DASHBOARD_PATH = path.join(__dirname, 'memeya-dashboard.html');
const BASE_DIR = path.resolve(__dirname, '..');
const X_POST_FLAG = path.join(__dirname, '.memeya-x-enabled');
const startedAt = Date.now();

// ─── Memeya helpers ─────────────────────────────────────────────

function todayStr() {
  const d = new Date(Date.now() + 8 * 3600_000); // GMT+8
  return d.toISOString().slice(0, 10);
}

function recentDates(n) {
  const dates = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() + 8 * 3600_000 - i * 86400_000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function safeRead(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8'); } catch { return null; }
}

function jsonRes(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

function stampTimestamp() {
  const now = new Date();
  const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const timestamp = gmt8.toISOString().replace('T', ' ').slice(0, 19) + ' GMT+8';

  let html = fs.readFileSync(DASHBOARD_PATH, 'utf-8');
  html = html.replace(
    />__GENERATED__|>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} GMT\+8</,
    `>${timestamp}<`
  );
  fs.writeFileSync(DASHBOARD_PATH, html, 'utf-8');
  return timestamp;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    const uptimeMs = Date.now() - startedAt;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      uptime: `${h}h ${m}m ${s}s`,
      uptimeMs,
      startedAt: new Date(startedAt).toISOString(),
      pid: process.pid,
    }));
    return;
  }

  // Regen timestamp
  if (req.method === 'POST' && req.url === '/regen') {
    try {
      const ts = stampTimestamp();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, timestamp: ts }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Graceful shutdown
  if (req.method === 'POST' && req.url === '/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Shutting down...' }));
    setTimeout(() => process.exit(0), 500);
    return;
  }

  // Reboot — exit and let systemd Restart=always bring us back
  if (req.method === 'POST' && req.url === '/api/reboot') {
    console.log('[dashboard-server] Reboot requested — exiting for systemd restart');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Rebooting — systemd will restart in ~3s' }));
    setTimeout(() => process.exit(0), 300);
    return;
  }

  // ─── Memeya X Post Toggle ────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/x-post-status') {
    const enabled = fs.existsSync(X_POST_FLAG);
    jsonRes(res, { enabled });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/memeya/x-post-toggle') {
    try {
      const enabled = fs.existsSync(X_POST_FLAG);
      if (enabled) {
        fs.unlinkSync(X_POST_FLAG);
      } else {
        fs.writeFileSync(X_POST_FLAG, new Date().toISOString(), 'utf-8');
      }
      jsonRes(res, { enabled: !enabled });
    } catch (err) {
      jsonRes(res, { error: err.message }, 500);
    }
    return;
  }

  // Serve main dashboard
  if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard.html')) {
    try {
      const html = fs.readFileSync(DASHBOARD_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading dashboard.html');
    }
    return;
  }

  // Serve Memeya dashboard
  if (req.method === 'GET' && (req.url === '/memeya' || req.url === '/memeya-dashboard.html')) {
    try {
      const html = fs.readFileSync(MEMEYA_DASHBOARD_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading memeya-dashboard.html');
    }
    return;
  }

  // ─── Memeya API: System Prompt ──────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/prompt') {
    try {
      const skillSrc = safeRead(path.join(__dirname, 'skills/x_twitter/index.js')) || '';
      // Extract MEMEYA_PROMPT from backtick template literal
      const promptMatch = skillSrc.match(/const MEMEYA_PROMPT\s*=\s*`([\s\S]*?)`;/);
      const memeyaPrompt = promptMatch ? promptMatch[1] : '(could not extract MEMEYA_PROMPT)';

      const valuesSnippet = (safeRead(path.join(BASE_DIR, 'memory/knowledge/memeya_values.md')) || '').slice(0, 300);

      // Load Memeya journal (from memeya-specific directory, matching x-context.js)
      let journalSnippet = '';
      const memeyaJournalDir = path.join(BASE_DIR, 'memory/journal/memeya');
      try {
        const files = fs.readdirSync(memeyaJournalDir).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().slice(-2);
        let text = '';
        for (const f of files) {
          text += fs.readFileSync(path.join(memeyaJournalDir, f), 'utf-8') + '\n';
        }
        journalSnippet = text.slice(-500);
      } catch { /* ignore */ }

      // Load recent posts summary with topic (mirrors x-context.js:loadRecentPosts)
      let recentPostsSummary = '(no recent posts)';
      try {
        const diaryDir = path.join(BASE_DIR, 'memory/journal/memeya');
        const dFiles = fs.readdirSync(diaryDir).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().slice(-3);
        const posts = [];
        for (const f of dFiles.reverse()) {
          const c = fs.readFileSync(path.join(diaryDir, f), 'utf-8');
          const blocks = c.split(/^## /m).filter(Boolean);
          for (const b of blocks) {
            const postedMatch = b.match(/- Posted: (.+)/);
            const topicMatch = b.match(/- Topic: (.+)/);
            if (postedMatch) {
              const text = postedMatch[1].trim();
              const topic = topicMatch ? topicMatch[1].trim() : '';
              posts.push(topic ? `[${topic}] ${text}` : text);
              if (posts.length >= 15) break;
            }
          }
          if (posts.length >= 15) break;
        }
        if (posts.length) recentPostsSummary = posts.map((p, i) => `${i + 1}. ${p.slice(0, 120)}`).join('\n');
      } catch { /* ignore */ }

      const composedSystem = memeyaPrompt;
      const composedUser = [
        'Topic/Context: {context} ← replaced by chooseTopic() prompt in autonomous mode',
        '',
        `Recent Memeya journal: ${journalSnippet}`,
        `Memeya's values: ${valuesSnippet}`,
        '',
        'RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):',
        recentPostsSummary,
        '',
        'Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.',
      ].join('\n');

      jsonRes(res, { memeyaPrompt, valuesSnippet, journalSnippet, recentPostsSummary, composedSystem, composedUser });
    } catch (err) {
      jsonRes(res, { error: err.message }, 500);
    }
    return;
  }

  // ─── Memeya API: Recent Journals ────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/journals') {
    try {
      const memeyaJournalDir = path.join(BASE_DIR, 'memory/journal/memeya');
      const dates = recentDates(3);
      const journals = [];
      for (const date of dates) {
        const content = safeRead(path.join(memeyaJournalDir, `${date}.md`));
        if (content) journals.push({ date, content });
      }
      jsonRes(res, { journals });
    } catch (err) {
      jsonRes(res, { error: err.message }, 500);
    }
    return;
  }

  // ─── Memeya API: Values ─────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/values') {
    try {
      const content = safeRead(path.join(BASE_DIR, 'memory/knowledge/memeya_values.md'));
      jsonRes(res, { content: content || null });
    } catch (err) {
      jsonRes(res, { error: err.message }, 500);
    }
    return;
  }

  // ─── Memeya API: Today's Activity ───────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/activity') {
    try {
      const today = todayStr();
      const content = safeRead(path.join(BASE_DIR, 'memory/journal/memeya', `${today}.md`));
      const entries = [];
      if (content) {
        // Parse ## HH:MM:SS blocks
        const blocks = content.split(/^## /m).filter(Boolean);
        for (const block of blocks) {
          const lines = block.split('\n');
          const time = lines[0].trim();
          const desc = lines.slice(1).join('\n').trim();
          if (time) entries.push({ time, description: desc });
        }
      }
      jsonRes(res, { date: today, entries });
    } catch (err) {
      jsonRes(res, { error: err.message }, 500);
    }
    return;
  }

  // ─── Memeya API: Grok Analysis ──────────────────────────────
  if (req.method === 'POST' && req.url === '/api/memeya/analyze') {
    (async () => {
      try {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          jsonRes(res, { error: 'XAI_API_KEY not configured' }, 500);
          return;
        }

        // Gather context
        const memeyaJournalDir = path.join(BASE_DIR, 'memory/journal/memeya');
        const dates = recentDates(3);
        let journalContext = '';
        for (const date of dates) {
          const content = safeRead(path.join(memeyaJournalDir, `${date}.md`));
          if (content) journalContext += `\n--- ${date} ---\n${content}`;
        }

        const values = safeRead(path.join(BASE_DIR, 'memory/knowledge/memeya_values.md')) || '(none)';

        const todayContent = safeRead(path.join(memeyaJournalDir, `${todayStr()}.md`)) || '(no activity today)';

        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'grok-3-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a social media strategist for Memeya (@AiMemeForgeIO), a 13-year-old digital blacksmith character who runs AiMemeForge.io on Solana. Analyze the provided data and suggest an actionable X engagement strategy.',
              },
              {
                role: 'user',
                content: `Based on Memeya's recent activity, journals, and values, suggest the next X community engagement strategy.\n\n## Recent Journals (last 3 days)\n${journalContext}\n\n## Current Values\n${values}\n\n## Today's Activity\n${todayContent}\n\nProvide:\n1. Assessment of current engagement patterns\n2. 3 specific tweet ideas with timing suggestions\n3. Community interaction tactics\n4. Growth opportunities`,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (!grokRes.ok) {
          const errText = await grokRes.text();
          jsonRes(res, { error: `Grok API: ${grokRes.status} ${errText}` }, 502);
          return;
        }

        const data = await grokRes.json();
        const analysis = data.choices?.[0]?.message?.content?.trim() || '(empty response)';
        jsonRes(res, { analysis });
      } catch (err) {
        jsonRes(res, { error: err.message }, 500);
      }
    })();
    return;
  }

  // ─── Memeya API: Generate Post (with real context or manual purpose) ────
  if (req.method === 'POST' && req.url === '/api/memeya/test-generate') {
    (async () => {
      try {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          jsonRes(res, { error: 'XAI_API_KEY not configured' }, 500);
          return;
        }

        const body = JSON.parse(await readBody(req) || '{}');
        const purpose = (body.purpose || '').trim();

        // Dynamic import x-context and index
        const { gatherContext, chooseTopic } = await import('./skills/x_twitter/x-context.js');
        const { createExecutors } = await import('./skills/x_twitter/index.js');

        const executors = createExecutors({ workDir: path.join(BASE_DIR, 'agent') });

        let topicChoice;
        let context = null;

        if (purpose) {
          // Manual purpose mode — skip auto context/topic, no char limit
          topicChoice = {
            topic: 'manual_purpose',
            prompt: `PURPOSE: ${purpose}\n\nWrite a post as Memeya about this. Be in character — smart, witty, degen energy. Make it engaging and personal.`,
            ogUrl: null,
            meta: { pool: [], last3Topics: [], priorityForced: null, devUpdateToday: false, antiRepeatTriggered: false, fallbackFrom: null },
          };
        } else {
          // Normal autonomous pipeline
          context = await gatherContext(BASE_DIR, { grokApiKey: apiKey });
          topicChoice = chooseTopic(context);
        }

        let result = null;
        let error = null;

        try {
          result = await executors.generateTweet(topicChoice, { detailed: true, noCharLimit: !!purpose });
        } catch (err) {
          error = err.message;
        }

        jsonRes(res, {
          topic: topicChoice.topic,
          prompt: topicChoice.prompt,
          ogUrl: topicChoice.ogUrl || null,
          draft: result?.text || null,
          originalDraft: result?.originalDraft || null,
          verdict: result?.verdict || null,
          isBored: result?.isBored || false,
          noCharLimit: !!purpose,
          purpose: purpose || null,
          error,
          // Full pipeline flow for dashboard visualization
          flow: {
            context: context ? {
              todayMemes: context.todayMemes.length,
              hallMemes: context.randomPastMeme ? 'picked 1 random' : '0',
              randomPastMeme: context.randomPastMeme ? `"${context.randomPastMeme.topText || ''} ${context.randomPastMeme.bottomText || ''}"`.trim() : null,
              commits: context.commits.slice(0, 5),
              journalChars: context.journal.length,
              valuesChars: context.values.length,
              recentPosts: context.recentPosts.map(p => ({
                text: (p.text || p).slice(0, 80),
                topic: p.topic || null,
              })),
              comments: (context.comments || []).length,
              commentReplies: (context.comments || []).reduce((s, c) => s + c.replies.length, 0),
              productDocChars: (context.productDoc || '').length,
            } : { manual: true, purpose },
            topicSelection: topicChoice.meta || {},
            generation: result?.flow?.generation || {},
            qualityGate: result?.flow?.qualityGate || {},
          },
        });
      } catch (err) {
        jsonRes(res, { error: err.message }, 500);
      }
    })();
    return;
  }

  // ─── Memeya API: Send Post to X ─────────────────────────────
  if (req.method === 'POST' && req.url === '/api/memeya/send-post') {
    (async () => {
      try {
        const body = JSON.parse(await readBody(req));
        const text = (body.text || '').trim();
        const topic = (body.topic || 'manual').trim();

        if (!text) {
          jsonRes(res, { error: 'No tweet text provided' }, 400);
          return;
        }

        // Dynamic import twitter-api-v2
        let TwitterApi;
        try {
          const mod = await import('twitter-api-v2');
          TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
        } catch {
          jsonRes(res, { error: 'twitter-api-v2 not installed' }, 500);
          return;
        }

        const consumerKey = process.env.X_CONSUMER_KEY;
        const consumerSecret = process.env.X_CONSUMER_SECRET;
        const accessToken = process.env.X_ACCESS_TOKEN;
        const accessSecret = process.env.X_ACCESS_SECRET;

        if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
          jsonRes(res, { error: 'Missing X API credentials in agent/.env' }, 500);
          return;
        }

        const userClient = new TwitterApi({
          appKey: consumerKey,
          appSecret: consumerSecret,
          accessToken,
          accessSecret,
        });

        const { data } = await userClient.v2.tweet(text);
        const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;

        // Log to Memeya diary
        try {
          const { logPost } = await import('./skills/x_twitter/x-context.js');
          logPost(BASE_DIR, topic, text, url);
        } catch { /* best-effort */ }

        jsonRes(res, { success: true, url, tweetId: data.id });
      } catch (err) {
        jsonRes(res, { error: err.message }, 500);
      }
    })();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard server running on http://0.0.0.0:${PORT}/dashboard.html (PID: ${process.pid})`);
});
