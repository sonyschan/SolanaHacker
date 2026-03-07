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

import 'dotenv/config';
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
const BACKEND_URL = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
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

function readBody(req, maxBytes = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLen = 0;
    req.on('data', c => {
      totalLen += c.length;
      if (totalLen > maxBytes) {
        req.destroy();
        reject(new Error(`Request body too large (max ${maxBytes} bytes)`));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ─── Auth guard: POST endpoints + sensitive GET endpoints require Bearer token ───
  const guardedPostPaths = ['/api/memeya/', '/shutdown', '/api/reboot', '/regen'];
  const guardedGetPaths = ['/api/memeya/prompt', '/api/memeya/journals', '/api/memeya/values',
    '/api/memeya/todos', '/api/memeya/activity', '/api/memeya/wallet-status',
    '/api/memeya/wallet-history', '/api/memeya/reward-config'];
  const needsAuth = (req.method === 'POST' && guardedPostPaths.some(p => req.url.startsWith(p)))
    || (req.method === 'GET' && guardedGetPaths.some(p => req.url === p || req.url.startsWith(p + '?')));
  if (needsAuth) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const expected = (process.env.AGENT_NAME || '').trim();
    if (!expected || token !== expected) {
      jsonRes(res, { error: 'Unauthorized' }, 401);
      return;
    }
  }

  // ─── Auth endpoint ────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/api/auth') {
    (async () => {
      try {
        const body = JSON.parse(await readBody(req));
        const pw = (body.password || '').trim();
        const expected = (process.env.AGENT_NAME || '').trim();
        if (!expected) {
          jsonRes(res, { ok: false, error: 'AGENT_NAME not configured' }, 500);
          return;
        }
        if (pw === expected) {
          jsonRes(res, { ok: true });
        } else {
          jsonRes(res, { ok: false, error: 'Wrong password' }, 401);
        }
      } catch (err) {
        jsonRes(res, { ok: false, error: err.message }, 400);
      }
    })();
    return;
  }

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

  // ─── Memeya API: Timer State ────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/timers') {
    const timerPath = path.join(__dirname, '.timer-state.json');
    const raw = safeRead(timerPath);
    if (raw) {
      try {
        jsonRes(res, JSON.parse(raw));
      } catch {
        jsonRes(res, { error: 'Invalid timer state file' }, 500);
      }
    } else {
      jsonRes(res, { error: 'Timer state not yet written (agent heartbeat has not run)' }, 404);
    }
    return;
  }

  // ─── Memeya API: System Prompt ──────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/prompt') {
    try {
      const skillSrc = safeRead(path.join(__dirname, 'skills/x_twitter/index.js')) || '';
      // Extract MEMEYA_PROMPT from backtick template literal
      const promptMatch = skillSrc.match(/const MEMEYA_PROMPT_BASE\s*=\s*`([\s\S]*?)`;/);
      const memeyaPrompt = promptMatch ? promptMatch[1] : '(could not extract MEMEYA_PROMPT_BASE)';

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

      // Load recent posts summary with topic, ordered by publish time desc
      let recentPostsSummary = '(no recent posts)';
      try {
        const diaryDir = path.join(BASE_DIR, 'memory/journal/memeya');
        const dFiles = fs.readdirSync(diaryDir).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().slice(-3);
        const posts = [];
        for (const f of dFiles.reverse()) {
          const date = f.replace('.md', '');
          const c = fs.readFileSync(path.join(diaryDir, f), 'utf-8');
          const blocks = c.split(/^## /m).filter(Boolean);
          for (const b of blocks.reverse()) {
            const timeMatch = b.match(/^(\d{2}:\d{2}:\d{2})/);
            const postedMatch = b.match(/- Posted: (.+)/);
            const topicMatch = b.match(/- Topic: (.+)/);
            if (postedMatch) {
              const text = postedMatch[1].trim();
              const topic = topicMatch ? topicMatch[1].trim() : '';
              const ts = timeMatch ? `${date} ${timeMatch[1]}` : date;
              posts.push(topic ? `(${ts}) [${topic}] ${text}` : `(${ts}) ${text}`);
              if (posts.length >= 15) break;
            }
          }
          if (posts.length >= 15) break;
        }
        if (posts.length) recentPostsSummary = posts.map((p, i) => `${i + 1}. ${p.slice(0, 140)}`).join('\n');
      } catch { /* ignore */ }

      // System prompt = MEMEYA_PROMPT_BASE + core values + long-term memory (via buildSystemPrompt)
      const longtermSnippet = (safeRead(path.join(BASE_DIR, 'memory/knowledge/memeya_longterm.md')) || '').slice(0, 300);
      const composedSystem = [
        memeyaPrompt,
        '',
        valuesSnippet ? `CORE VALUES (these define who you are):\n${valuesSnippet}` : '',
        longtermSnippet ? `LONG-TERM MEMORY (lessons you\'ve internalized):\n${longtermSnippet}` : '',
      ].filter(Boolean).join('\n\n');

      // User prompt = topic prompt + journal + recent posts + anti-repetition (values NOT here)
      const composedUser = [
        'Topic/Context: {context} ← replaced by chooseTopic() prompt in autonomous mode',
        '',
        `Recent Memeya journal: ${journalSnippet}`,
        '',
        'ANTI-REPETITION: {dynamically extracted banned openers/phrases from recent posts}',
        '',
        'RECENT 15 POSTS (DO NOT repeat similar themes or phrasing):',
        recentPostsSummary,
        '',
        'Write a tweet (<280 chars). Be fresh — avoid repeating topics from the posts above.',
      ].join('\n');

      jsonRes(res, { memeyaPrompt, valuesSnippet, longtermSnippet, journalSnippet, recentPostsSummary, composedSystem, composedUser });
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

  // ─── Memeya API: Product Stats ──────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/product-stats') {
    try {
      const content = safeRead(path.join(BASE_DIR, 'docs/product.md'));
      const chars = content ? content.length : 0;
      let level = 'ok';
      if (chars > 10000) level = 'critical';
      else if (chars > 8000) level = 'serious';
      else if (chars > 5000) level = 'warning';
      jsonRes(res, { chars, level });
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

  // ─── Memeya API: TODOs ─────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/todos') {
    try {
      const content = safeRead(path.join(BASE_DIR, 'memory/TODO.md'));
      const items = [];
      if (content) {
        const lines = content.split('\n');
        for (const line of lines) {
          const checked = line.match(/^- \[x\] (.+)/i);
          const unchecked = line.match(/^- \[ \] (.+)/);
          if (checked) items.push({ text: checked[1], done: true });
          else if (unchecked) items.push({ text: unchecked[1], done: false });
        }
      }
      jsonRes(res, { items });
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
                content: 'You are a social media strategist for Memeya (@AiMemeForgeIO), the digital blacksmith who owns and runs AiMemeForge on Solana. Analyze the provided data and suggest an actionable X engagement strategy.',
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
        const formatPrefix = (body.formatPrefix || '').trim();

        // Dynamic import x-context and index
        const { gatherContext, chooseTopic } = await import('./skills/x_twitter/x-context.js');
        const { createExecutors } = await import('./skills/x_twitter/index.js');

        const executors = createExecutors({ workDir: path.join(BASE_DIR, 'agent') });

        let topicChoice;
        let context = null;

        if (purpose) {
          // Extract @handles, $tokens, and URLs that must appear in the output
          const mentions = purpose.match(/@\w+/g) || [];
          const tokens = purpose.match(/\$\w+/g) || [];
          const urls = purpose.match(/https?:\/\/[^\s)]+/g) || [];
          const mustInclude = [...mentions, ...tokens, ...urls];
          const mustIncludeRule = mustInclude.length > 0
            ? `\n\nMANDATORY — the following MUST appear exactly as-is in your output (do NOT omit or rephrase): ${mustInclude.join(', ')}`
            : '';

          // Manual purpose mode — skip auto context/topic, no char limit
          topicChoice = {
            topic: 'manual_purpose',
            prompt: `PURPOSE: ${purpose}${mustIncludeRule}\n\nWrite a post as Memeya about this. Be in character — smart, witty, degen energy. Make it engaging and personal.`,
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

        // Force-prepend format prefix if Grok didn't include it
        if (formatPrefix && result?.text) {
          const textTrimmed = result.text.trimStart();
          if (!textTrimmed.startsWith(formatPrefix)) {
            result.text = `${formatPrefix}\n\n${textTrimmed}`;
          }
        }

        // Reset X post timer — dashboard is actively composing
        try { fs.writeFileSync(path.join(__dirname, '.last-x-post-at'), String(Date.now()), 'utf-8'); } catch { /* best-effort */ }

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
              valuesChars: 0, // values now in buildSystemPrompt, not gatherContext
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

  // ─── Memeya API: Trigger meme_spotlight X post ──────────────
  if (req.method === 'POST' && req.url === '/api/memeya/trigger-spotlight') {
    (async () => {
      try {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) { jsonRes(res, { error: 'XAI_API_KEY not configured' }, 500); return; }

        const { gatherContext, chooseTopic } = await import('./skills/x_twitter/x-context.js');
        const { createExecutors } = await import('./skills/x_twitter/index.js');
        const { logPost } = await import('./skills/x_twitter/x-context.js');

        // Gather context then force meme_spotlight topic
        const context = await gatherContext(BASE_DIR, { grokApiKey: apiKey });
        const topicChoice = chooseTopic(context);
        // Override to meme_spotlight — rebuild prompt with spotlight context
        const spotlightCtx = { ...context };
        const { chooseTopic: _, ...ctxRest } = spotlightCtx; // unused
        // Re-import buildPrompt indirectly by calling chooseTopic with forced context
        // Simpler: just override the topic in the choice
        const forcedChoice = (() => {
          // Temporarily manipulate to get meme_spotlight prompt
          const saved = topicChoice;
          // Re-run chooseTopic but we need meme_spotlight — easiest is to directly call buildPrompt
          // Since buildPrompt is not exported, we use the gatherContext + force approach:
          // Set all weights to 0 except meme_spotlight
          return saved.topic === 'meme_spotlight' ? saved : null;
        })();

        // If chooseTopic didn't pick meme_spotlight, manually build it
        let finalChoice = forcedChoice;
        if (!finalChoice) {
          const todayMemes = context.todayMemes || [];
          if (todayMemes.length === 0) {
            jsonRes(res, { error: 'No memes available today for spotlight' }, 400);
            return;
          }

          // Filter out memes already posted (same OG URL dedup as x-context.js)
          const recentMemeOgUrls = new Set(
            (context.recentPosts || []).filter(p => p.ogUrl).map(p => p.ogUrl)
          );
          const unposted = todayMemes.filter(m => {
            const url = m.id ? `https://aimemeforge.io/meme/${m.id}` : null;
            return !url || !recentMemeOgUrls.has(url);
          });
          if (unposted.length === 0) {
            jsonRes(res, { error: 'All memes already posted today — no unposted memes left' }, 400);
            return;
          }
          const meme = unposted[Math.floor(Math.random() * unposted.length)];
          const memeTitle = meme.title || 'Untitled';
          const memeDesc = meme.description || '';
          let memeInfo = `Today's meme: "${memeTitle}". ${memeDesc}`;
          if (meme.newsSource) memeInfo += ` News angle: ${meme.newsSource}.`;
          if (meme.style) memeInfo += ` Art style: ${meme.style}.`;
          if (meme.imageUrl) memeInfo += ` Image: ${meme.imageUrl}`;
          const ogUrl = meme.id ? `https://aimemeforge.io/meme/${meme.id}` : 'https://aimemeforge.io';
          const tokenSymbol = meme.tokenSymbol || null;
          const xHandle = meme.xHandle || null;

          const promptParts = [
            `TOPIC: Share or react to a meme from AiMemeForge.`,
            memeInfo,
            tokenSymbol ? `Mention $${tokenSymbol} in your tweet to attract the token community.` : null,
            xHandle ? `Tag ${xHandle} in your tweet — they're relevant to this meme's news.` : null,
            `Write about this meme with personality — hype it, roast it, or share why it's fire.`,
            `Don't default to blacksmith metaphors. React to the MEME CONTENT itself.`,
            `Keep your text under 250 chars — a link will be appended automatically.`,
            `Do NOT include any URL yourself. Just write the tweet text.`,
          ].filter(Boolean).join('\n');

          finalChoice = { topic: 'meme_spotlight', prompt: promptParts, ogUrl };
        }

        // Generate tweet
        const executors = createExecutors({ workDir: path.join(BASE_DIR, 'agent') });
        const result = await executors.generateTweet(finalChoice, { detailed: true });

        if (!result || !result.text) {
          jsonRes(res, { error: 'Tweet generation returned empty', draft: result?.originalDraft || null });
          return;
        }

        // Post to X
        let TwitterApi;
        try {
          const mod = await import('twitter-api-v2');
          TwitterApi = mod.default?.TwitterApi || mod.TwitterApi;
        } catch {
          jsonRes(res, { error: 'twitter-api-v2 not installed', draft: result.text }, 500);
          return;
        }

        const ck = process.env.X_CONSUMER_KEY, cs = process.env.X_CONSUMER_SECRET;
        const at = process.env.X_ACCESS_TOKEN, as = process.env.X_ACCESS_SECRET;
        if (!ck || !cs || !at || !as) {
          jsonRes(res, { error: 'Missing X API credentials', draft: result.text }, 500);
          return;
        }

        const userClient = new TwitterApi({ appKey: ck, appSecret: cs, accessToken: at, accessSecret: as });
        console.log(`[Spotlight] Posting tweet (${result.text.length} chars): ${result.text.slice(0, 150)}...`);
        let data;
        try {
          ({ data } = await userClient.v2.tweet(result.text));
        } catch (tweetErr) {
          console.error(`[Spotlight] Tweet FAILED:`, tweetErr.message, tweetErr.data ? JSON.stringify(tweetErr.data) : '');
          jsonRes(res, { error: tweetErr.message, detail: tweetErr.data || null, draft: result.text }, 403);
          return;
        }
        const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;

        // Log to journal
        try { logPost(BASE_DIR, 'meme_spotlight', result.text, url); } catch {}

        // Share to TG community
        try {
          const tgToken = process.env.TELEGRAM_COMMUNITY_BOT_TOKEN;
          const tgChatId = process.env.TELEGRAM_COMMUNITY_CHAT_ID || '@MemeyaOfficialCommunity';
          if (tgToken && tgChatId) {
            const msg = `${result.text}\n\n${url}`;
            await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: tgChatId, text: msg, disable_web_page_preview: false }),
            });
          }
        } catch {}

        jsonRes(res, { success: true, text: result.text, url, topic: 'meme_spotlight', verdict: result.verdict, isBored: result.isBored });
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

        // Handle image attachments — supports both single (legacy) and multi-image
        const images = body.images || (body.imageBase64 ? [{ base64: body.imageBase64, mimeType: body.imageMimeType }] : []);
        let mediaIds = undefined;
        if (images.length > 0) {
          const allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          const uploaded = [];
          for (const img of images.slice(0, 4)) { // Twitter max 4 images
            try {
              const mimeType = allowedMime.includes(img.mimeType) ? img.mimeType : 'image/jpeg';
              const imgBuffer = Buffer.from(img.base64, 'base64');
              if (imgBuffer.length > 5 * 1024 * 1024) {
                console.warn('[Dashboard] Image too large, skipping');
                continue;
              }
              const mediaId = await userClient.v1.uploadMedia(imgBuffer, { mimeType });
              uploaded.push(mediaId);
            } catch (imgErr) {
              console.warn(`[Dashboard] Image upload failed (non-fatal): ${imgErr.message}`);
            }
          }
          if (uploaded.length > 0) mediaIds = uploaded;
        }

        const tweetPayload = { text };
        if (mediaIds) tweetPayload.media = { media_ids: mediaIds };
        const { data } = await userClient.v2.tweet(tweetPayload);
        const url = `https://x.com/AiMemeForgeIO/status/${data.id}`;

        // Log to Memeya diary
        try {
          const { logPost } = await import('./skills/x_twitter/x-context.js');
          logPost(BASE_DIR, topic, text, url);
        } catch { /* best-effort */ }

        // Reset agent's auto X post timer via shared file
        try {
          fs.writeFileSync(path.join(__dirname, '.last-x-post-at'), String(Date.now()), 'utf-8');
        } catch { /* best-effort */ }

        // Share to TG community groups (raw HTTP API — no polling bot needed)
        const tgGroups = [
          { token: process.env.TELEGRAM_COMMUNITY_BOT_TOKEN, chatId: process.env.TELEGRAM_COMMUNITY_CHAT_ID || '@MemeyaOfficialCommunity', lang: 'en' },
          { token: process.env.TELEGRAM_COMMUNITY_CN_BOT_TOKEN, chatId: process.env.TELEGRAM_COMMUNITY_CN_CHAT_ID || '@MemeyaCN', lang: 'zh' },
        ];
        for (const g of tgGroups) {
          if (!g.token) continue;
          try {
            const intro = g.lang === 'zh' ? '剛在 X 上發了這個 🔥' : 'just dropped this on X 🔥';
            const msg = `${intro}\n\n${text}\n\n${url}`;
            await fetch(`https://api.telegram.org/bot${g.token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: g.chatId, text: msg }),
            });
          } catch { /* TG share is best-effort */ }
        }

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
                id: `memeya_dash_${Date.now()}`,
                profileId: memeyaProfileId,
                properties: [
                  { key: 'source', value: 'memeya_agent' },
                  { key: 'text', value: text },
                  { key: 'topic', value: topic },
                  { key: 'x_url', value: url },
                ],
              }),
            });
          }
        } catch { /* Tapestry mirror is best-effort */ }

        jsonRes(res, { success: true, url, tweetId: data.id });
      } catch (err) {
        jsonRes(res, { error: err.message }, 500);
      }
    })();
    return;
  }

  // ─── Wallet Proxy: Balance ──────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/wallet-status') {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/rewards/balance`);
        const data = await r.json();
        jsonRes(res, data, r.status);
      } catch (err) {
        jsonRes(res, { error: 'Backend unreachable: ' + err.message }, 502);
      }
    })();
    return;
  }

  // ─── Wallet Proxy: History ─────────────────────────────────
  if (req.method === 'GET' && req.url.startsWith('/api/memeya/wallet-history')) {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/rewards/history?limit=10`);
        const data = await r.json();
        jsonRes(res, data, r.status);
      } catch (err) {
        jsonRes(res, { error: 'Backend unreachable: ' + err.message }, 502);
      }
    })();
    return;
  }

  // ─── Wallet Proxy: Reward Config ───────────────────────────
  if (req.method === 'GET' && req.url === '/api/memeya/reward-config') {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/rewards/config`);
        const data = await r.json();
        jsonRes(res, data, r.status);
      } catch (err) {
        jsonRes(res, { error: 'Backend unreachable: ' + err.message }, 502);
      }
    })();
    return;
  }

  // ─── Wallet Proxy: Toggle Reward ───────────────────────────
  if (req.method === 'POST' && req.url === '/api/memeya/reward-toggle') {
    (async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/rewards/config`, { method: 'POST' });
        const data = await r.json();
        jsonRes(res, data, r.status);
      } catch (err) {
        jsonRes(res, { error: 'Backend unreachable: ' + err.message }, 502);
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
