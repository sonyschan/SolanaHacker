/**
 * ACP Handler — Virtuals Agent Commerce Protocol Integration (OpenClaw mode)
 *
 * Uses REST API + WebSocket (socket.io) to connect to ACP marketplace.
 * Bypasses the on-chain SCA signing that has known isValidSignature bugs.
 *
 * Auth: LITE_AGENT_API_KEY (HTTP header) + walletAddress (socket auth)
 * API:  https://claw-api.virtuals.io
 * WS:   https://acpx.virtuals.io
 *
 * Offerings:
 *   rateMeme      — POST /api/memes/rate         ($0.01, 30s)
 *   generateMeme  — POST /api/memes/generate-custom ($0.10, 120s)
 *   getTemplates  — GET  /api/catalog/templates   ($0.01, 60s)
 */

import fs from 'fs';
import path from 'path';
import { io } from 'socket.io-client';
import { syncToBackend } from './skills/x_twitter/x-context.js';

// ─── Offering Config ────────────────────────────────────────

const OFFERINGS = {
  meme_rate: {
    endpoint: '/api/memes/rate',
    method: 'POST',
    price: 0.05,
    timeoutMs: 30_000,
    requiredFields: ['imageUrl'],
  },
  meme_generate: {
    endpoint: '/api/memes/generate-custom',
    method: 'POST',
    price: 0.10,
    timeoutMs: 180_000,
    requiredFields: ['topic'],
  },
  meme_templates: {
    endpoint: '/api/catalog/templates',
    method: 'GET',
    price: 0.01,
    timeoutMs: 60_000,
    requiredFields: [],
  },
};

const ACP_API_URL = process.env.ACP_API_URL || 'https://claw-api.virtuals.io';
const ACP_SOCKET_URL = process.env.ACP_SOCKET_URL || 'https://acpx.virtuals.io';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.aimemeforge.io';
const LAB_API_KEY = process.env.LAB_API_KEY;
const LITE_AGENT_API_KEY = process.env.LITE_AGENT_API_KEY;

// ACP Job Phases (from openclaw-acp)
const Phase = {
  REQUEST: 0,
  NEGOTIATION: 1,
  TRANSACTION: 2,
  EVALUATION: 3,
  COMPLETED: 4,
  REJECTED: 5,
  EXPIRED: 6,
};

// ─── AcpHandler Class ───────────────────────────────────────

export class AcpHandler {
  constructor({ telegram, baseDir }) {
    this.telegram = telegram;
    this.baseDir = baseDir;
    this.socket = null;
    this.walletAddress = null;
    this.stats = { accepted: 0, rejected: 0, delivered: 0, errors: 0 };
  }

  /**
   * Initialize ACP connection via OpenClaw REST + WebSocket.
   */
  async init() {
    if (!LITE_AGENT_API_KEY) {
      console.log('[ACP] Missing LITE_AGENT_API_KEY — ACP disabled');
      return;
    }

    if (!LAB_API_KEY) {
      console.log('[ACP] Missing LAB_API_KEY — ACP disabled (cannot call backend)');
      return;
    }

    try {
      // Fetch agent info to get wallet address
      const resp = await this._apiGet('/acp/me');
      const agentInfo = resp.data || resp;
      this.walletAddress = agentInfo.walletAddress;

      if (!this.walletAddress) {
        console.log('[ACP] No wallet address returned from /acp/me — ACP disabled');
        return;
      }

      console.log(`[ACP] Agent: ${agentInfo.name}, Wallet: ${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`);

      // Connect WebSocket
      this._connectSocket();

      await this.telegram?.sendDevlog(
        '🤝 <b>ACP Marketplace</b> initialized (OpenClaw mode)\n' +
        `Agent: ${agentInfo.name}\n` +
        `Wallet: <code>${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}</code>\n` +
        'Services: rateMeme, generateMeme, getTemplates'
      );
    } catch (err) {
      console.error('[ACP] Init failed:', err.message);
      await this.telegram?.sendDevlog(`⚠️ ACP init failed: ${err.message}`);
    }
  }

  /**
   * Connect to ACP WebSocket for job notifications.
   */
  _connectSocket() {
    this.socket = io(ACP_SOCKET_URL, {
      auth: { walletAddress: this.walletAddress },
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('[ACP] WebSocket connected');
    });

    this.socket.on('roomJoined', (data, ack) => {
      console.log('[ACP] Joined room — listening for jobs');
      ack?.();
    });

    this.socket.on('onNewTask', (jobData, ack) => {
      ack?.();
      this._handleJob(jobData).catch(err => {
        console.error(`[ACP] Job ${jobData?.id} uncaught error:`, err.message);
        this.stats.errors++;
      });
    });

    this.socket.on('onEvaluate', (data, ack) => {
      console.log(`[ACP] Evaluation event for job ${data?.id}`);
      ack?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[ACP] WebSocket disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[ACP] WebSocket connection error:', err.message);
    });
  }

  /**
   * Handle incoming ACP job.
   * Phase 0 (REQUEST): match offering, validate, accept/reject
   * Phase 2 (TRANSACTION): call backend, deliver result
   */
  async _handleJob(jobData) {
    const jobId = jobData.id;
    const phase = jobData.phase;

    console.log(`[ACP] Job ${jobId} received — phase ${phase}`);
    console.log(`[ACP] Job ${jobId} data:`, JSON.stringify(jobData).slice(0, 500));

    try {
      // Resolve offering name from job memos or context
      const offeringName = this._resolveOfferingName(jobData);
      const context = this._extractContext(jobData);

      // Phase REQUEST: accept or reject
      if (phase === Phase.REQUEST) {
        const offering = offeringName && OFFERINGS[offeringName]
          ? { ...OFFERINGS[offeringName], key: offeringName }
          : this._matchOffering(context);

        const validationError = this._validateInput(offering, context);
        if (validationError) {
          await this._apiPost(`/acp/providers/jobs/${jobId}/accept`, {
            accept: false,
            reason: validationError,
          });
          this.stats.rejected++;
          console.log(`[ACP] Job ${jobId} rejected — ${validationError}`);
          return;
        }

        await this._apiPost(`/acp/providers/jobs/${jobId}/accept`, {
          accept: true,
          reason: 'Job accepted',
        });

        // Request payment to advance to TRANSACTION phase
        await this._apiPost(`/acp/providers/jobs/${jobId}/requirement`, {
          content: `Ready to process ${offering.key}. Please proceed with payment.`,
        });

        this.stats.accepted++;
        console.log(`[ACP] Job ${jobId} accepted + payment requested — ${offering.key}`);
        return;
      }

      // Phase TRANSACTION: execute and deliver
      if (phase === Phase.TRANSACTION) {
        const offering = offeringName && OFFERINGS[offeringName]
          ? { ...OFFERINGS[offeringName], key: offeringName }
          : this._matchOffering(context);

        try {
          const result = await this._callBackend(offering, context);
          await this._apiPost(`/acp/providers/jobs/${jobId}/deliverable`, {
            deliverable: JSON.stringify(result),
          });
          this.stats.delivered++;
          console.log(`[ACP] Job ${jobId} delivered — ${offering.key}`);
          this._logToWorkshop(offering, jobId, context);
        } catch (err) {
          this.stats.errors++;
          console.error(`[ACP] Job ${jobId} delivery error:`, err.message);
          await this.telegram?.sendDevlog(
            `⚠️ ACP job ${jobId} failed: ${err.message}`
          );
        }
        return;
      }
    } catch (err) {
      console.error(`[ACP] Job ${jobId} handler error:`, err.message);
      this.stats.errors++;
    }
  }

  /**
   * Resolve offering name from job memos (NEGOTIATION phase memo contains offering info).
   */
  _resolveOfferingName(jobData) {
    // Try memos first — offering name is in the NEGOTIATION memo
    if (Array.isArray(jobData.memos)) {
      for (const memo of jobData.memos) {
        // Check memo content for offering name
        try {
          const parsed = JSON.parse(memo.content);
          if (parsed.offeringName && OFFERINGS[parsed.offeringName]) return parsed.offeringName;
          if (parsed.name && OFFERINGS[parsed.name]) return parsed.name;
          if (parsed.jobName && OFFERINGS[parsed.jobName]) return parsed.jobName;
        } catch { /* not JSON */ }

        // Direct string match
        if (typeof memo.content === 'string' && OFFERINGS[memo.content]) {
          return memo.content;
        }
      }
    }

    // Try jobData direct fields
    if (jobData.offeringName && OFFERINGS[jobData.offeringName]) return jobData.offeringName;
    if (jobData.jobName && OFFERINGS[jobData.jobName]) return jobData.jobName;

    return null;
  }

  /**
   * Extract context/requirements from job memos.
   */
  _extractContext(jobData) {
    // jobData.context is pre-parsed by the server
    if (jobData.context && typeof jobData.context === 'object') {
      return jobData.context;
    }

    // Parse from memos — Butler wraps input in { name, requirement: { ... } }
    const context = {};
    if (Array.isArray(jobData.memos)) {
      for (const memo of jobData.memos) {
        try {
          const parsed = JSON.parse(memo.content);
          // Unwrap nested requirement field (Butler format)
          if (parsed.requirement && typeof parsed.requirement === 'object') {
            Object.assign(context, parsed.requirement);
          }
          Object.assign(context, parsed);
        } catch { /* not JSON, skip */ }
      }
    }

    // Normalize case: imageurl → imageUrl
    if (context.imageurl && !context.imageUrl) {
      context.imageUrl = context.imageurl;
    }

    return context;
  }

  /**
   * Match context fields to an offering.
   * Priority: imageUrl → rateMeme, topic → generateMeme, else → getTemplates
   */
  _matchOffering(context) {
    if (context.imageUrl) return { ...OFFERINGS.meme_rate, key: 'meme_rate' };
    if (context.topic) return { ...OFFERINGS.meme_generate, key: 'meme_generate' };
    return { ...OFFERINGS.meme_templates, key: 'meme_templates' };
  }

  /**
   * Validate that required fields are present.
   */
  _validateInput(offering, context) {
    for (const field of offering.requiredFields) {
      if (!context[field]) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  /**
   * Call backend API with Lab API key (bypasses x402 paywall).
   */
  async _callBackend(offering, input) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), offering.timeoutMs);

    try {
      const url = `${BACKEND_URL}${offering.endpoint}`;
      const fetchOpts = {
        method: offering.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': LAB_API_KEY,
        },
        signal: controller.signal,
      };

      if (offering.method === 'POST') {
        fetchOpts.body = JSON.stringify(input);
      }

      const res = await fetch(url, fetchOpts);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Backend ${res.status}: ${errText.slice(0, 200)}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── ACP REST helpers ──────────────────────────────────────

  async _apiGet(path) {
    const res = await fetch(`${ACP_API_URL}${path}`, {
      headers: { 'x-api-key': LITE_AGENT_API_KEY },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ACP API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async _apiPost(path, body) {
    const res = await fetch(`${ACP_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LITE_AGENT_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ACP API ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  // ─── Workshop Logging ──────────────────────────────────────

  /**
   * Log ACP transaction to workshop diary (same format as x402_commerce).
   */
  _logToWorkshop(offering, jobId, context = {}) {
    try {
      const dateStr = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
      const diaryDir = path.join(this.baseDir, 'memory/journal/memeya');
      if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
      const diaryPath = path.join(diaryDir, `${dateStr}.md`);
      const time = new Date(Date.now() + 8 * 3600_000)
        .toLocaleTimeString('en-US', { hour12: false });

      // Memeya-style log messages per offering type
      const flavorText = this._getFlavorText(offering.key, context);

      const entry =
        `## ${time}\n` +
        `- Topic: acp_commerce\n` +
        `- Posted: ${flavorText}\n` +
        `- LogType: commerce\n\n`;

      fs.appendFileSync(diaryPath, entry);
      syncToBackend(this.baseDir).catch(() => {});
    } catch (err) {
      console.error('[ACP] Workshop log error:', err.message);
    }
  }

  /**
   * Generate Memeya-flavored log text for ACP commerce entries.
   */
  _getFlavorText(offeringKey, context) {
    const FLAVORS = {
      meme_rate: [
        topic => `Rated a meme${topic ? ` about "${topic}"` : ''} — another one judged by the meme court ($0.05)`,
        topic => `Meme verdict delivered${topic ? ` on "${topic}"` : ''} — comedy score sealed ($0.05)`,
        topic => `Quality check complete${topic ? ` for "${topic}"` : ''} — the meme tribunal has spoken ($0.05)`,
        topic => `Scored a meme${topic ? ` featuring "${topic}"` : ''} — viral potential assessed ($0.05)`,
      ],
      meme_generate: [
        topic => `Forged a fresh meme${topic ? ` about "${topic}"` : ''} — straight from the meme furnace ($0.10)`,
        topic => `New meme minted${topic ? `: "${topic}"` : ''} — comedy strategy deployed ($0.10)`,
        topic => `Created original artwork${topic ? ` for "${topic}"` : ''} — Memes as a Service in action ($0.10)`,
        topic => `Delivered a custom meme${topic ? ` on "${topic}"` : ''} — another agent served ($0.10)`,
      ],
      meme_templates: [
        () => `Shared the template catalog — 16 archetypes ready for action ($0.01)`,
        () => `Template menu served — another agent browsing the meme arsenal ($0.01)`,
      ],
    };

    const pool = FLAVORS[offeringKey] || [() => `ACP job completed — ${offeringKey}`];
    const fn = pool[Math.floor(Math.random() * pool.length)];
    const topic = context.topic || context.imageUrl?.split('/').pop()?.slice(0, 30) || '';
    return fn(topic);
  }

  /**
   * Get current ACP stats for status display.
   */
  getStats() {
    return { ...this.stats };
  }
}
