/**
 * ACP Handler — Virtuals Agent Commerce Protocol Integration
 *
 * Standalone module for 24/7 persistent listening on ACP marketplace.
 * Routes incoming jobs to backend API endpoints via Lab API key.
 *
 * Offerings:
 *   rateMeme      — POST /api/memes/rate         ($0.005, 30s)
 *   generateMeme  — POST /api/memes/generate-custom ($0.10, 120s)
 *   getTemplates  — GET  /api/catalog/templates   ($0.01, 60s)
 */

import fs from 'fs';
import path from 'path';
import acpModule from '@virtuals-protocol/acp-node';
const { AcpContractClientV2, AcpJobPhases } = acpModule;
const AcpClient = acpModule.default;
import { syncToBackend } from './skills/x_twitter/x-context.js';

// ─── Offering Config ────────────────────────────────────────

const OFFERINGS = {
  rateMeme: {
    endpoint: '/api/memes/rate',
    method: 'POST',
    price: 0.01,
    timeoutMs: 30_000,
    requiredFields: ['imageUrl'],
  },
  generateMeme: {
    endpoint: '/api/memes/generate-custom',
    method: 'POST',
    price: 0.10,
    timeoutMs: 120_000,
    requiredFields: ['topic'],
  },
  getTemplates: {
    endpoint: '/api/catalog/templates',
    method: 'GET',
    price: 0.01,
    timeoutMs: 60_000,
    requiredFields: [],
  },
};

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.aimemeforge.io';
const LAB_API_KEY = process.env.LAB_API_KEY;

// ─── AcpHandler Class ───────────────────────────────────────

export class AcpHandler {
  constructor({ telegram, baseDir }) {
    this.telegram = telegram;
    this.baseDir = baseDir;
    this.client = null;
    this.stats = { accepted: 0, rejected: 0, delivered: 0, errors: 0 };
  }

  /**
   * Initialize ACP client. Fails gracefully if env vars missing.
   */
  async init() {
    const privateKey = process.env.ACP_WALLET_PRIVATE_KEY;
    const entityId = process.env.ACP_ENTITY_ID;
    const walletAddress = process.env.ACP_WALLET_ADDRESS;

    if (!privateKey || !entityId || !walletAddress) {
      console.log('[ACP] Missing env vars — ACP disabled');
      return;
    }

    if (!LAB_API_KEY) {
      console.log('[ACP] Missing LAB_API_KEY — ACP disabled (cannot call backend)');
      return;
    }

    try {
      const contractClient = await AcpContractClientV2.build(
        privateKey,
        entityId,
        walletAddress,
        process.env.ACP_RPC_URL || undefined,
      );

      this.client = new AcpClient({
        acpContractClient: contractClient,
        onNewTask: (job, memoToSign) => this._handleJob(job, memoToSign),
      });

      // NOTE: Do NOT call client.init() — AcpClient constructor already
      // calls this.init() internally. Double init causes duplicate sockets
      // and repeated auth challenge failures.

      // Catch unhandled ACP SDK errors (e.g. token refresh failures)
      // to prevent crashing the entire agent process
      process.on('unhandledRejection', (err) => {
        if (err?.constructor?.name === '_AcpError' || err?.message?.includes('auth challenge')) {
          // Log full error structure once for debugging
          if (!this._authErrorLogged) {
            this._authErrorLogged = true;
            const cause = err?.cause;
            console.error('[ACP] Auth error detail:', JSON.stringify({
              message: err.message,
              causeMessage: cause?.message,
              status: cause?.response?.status,
              data: cause?.response?.data,
              url: cause?.config?.url,
            }, null, 2));
          }
          console.error('[ACP] SDK error (suppressed):', err.message);
          this.stats.errors++;
          return;
        }
        // Re-throw non-ACP errors
        throw err;
      });

      console.log('[ACP] Initialized — listening for jobs');
      await this.telegram?.sendDevlog(
        '🤝 <b>ACP Marketplace</b> initialized\n' +
        `Wallet: <code>${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</code>\n` +
        'Services: rateMeme, generateMeme, getTemplates'
      );
    } catch (err) {
      console.error('[ACP] Init failed:', err.message);
      await this.telegram?.sendDevlog(`⚠️ ACP init failed: ${err.message}`);
    }
  }

  /**
   * Handle incoming ACP job. Two phases:
   * 1. REQUEST → NEGOTIATION: match offering, validate input, accept/reject
   * 2. TRANSACTION → EVALUATION: call backend, deliver result
   */
  async _handleJob(job, memoToSign) {
    try {
      // Phase 1: Accept or reject the request
      if (
        job.phase === AcpJobPhases.REQUEST &&
        memoToSign?.nextPhase === AcpJobPhases.NEGOTIATION
      ) {
        const requirement = job.requirement || {};
        const offering = this._matchOffering(requirement);

        if (!offering) {
          const available = Object.keys(OFFERINGS).join(', ');
          await job.reject(`Unknown service. Available: ${available}`);
          this.stats.rejected++;
          console.log(`[ACP] Job ${job.id} rejected — no matching offering`);
          return;
        }

        const validationError = this._validateInput(offering, requirement);
        if (validationError) {
          await job.reject(validationError);
          this.stats.rejected++;
          console.log(`[ACP] Job ${job.id} rejected — ${validationError}`);
          return;
        }

        await job.accept('Service available — ready to process');
        await job.createRequirement(`Accepted. Please proceed with payment.`);
        this.stats.accepted++;
        console.log(`[ACP] Job ${job.id} accepted — ${offering.key}`);
        return;
      }

      // Phase 2: Process and deliver
      if (
        job.phase === AcpJobPhases.TRANSACTION &&
        memoToSign?.nextPhase === AcpJobPhases.EVALUATION
      ) {
        const requirement = job.requirement || {};
        const offering = this._matchOffering(requirement);

        if (!offering) {
          await job.reject('Service no longer available');
          this.stats.errors++;
          return;
        }

        try {
          const result = await this._callBackend(offering, requirement);
          await job.deliver({
            type: 'url',
            value: JSON.stringify(result),
          });
          this.stats.delivered++;
          console.log(`[ACP] Job ${job.id} delivered — ${offering.key}`);
          this._logToWorkshop(offering, job.id);
        } catch (err) {
          await job.reject(`Delivery failed: ${err.message}`);
          this.stats.errors++;
          console.error(`[ACP] Job ${job.id} delivery error:`, err.message);
          await this.telegram?.sendDevlog(
            `⚠️ ACP job ${job.id} failed: ${err.message}`
          );
        }
        return;
      }
    } catch (err) {
      console.error(`[ACP] Job ${job.id} uncaught error:`, err.message);
      this.stats.errors++;
      try { await job.reject(`Internal error: ${err.message}`); } catch { /* best effort */ }
    }
  }

  /**
   * Match requirement fields to an offering.
   * Priority: imageUrl → rateMeme, topic → generateMeme, else → getTemplates
   */
  _matchOffering(requirement) {
    if (requirement.imageUrl) return { ...OFFERINGS.rateMeme, key: 'rateMeme' };
    if (requirement.topic) return { ...OFFERINGS.generateMeme, key: 'generateMeme' };
    return { ...OFFERINGS.getTemplates, key: 'getTemplates' };
  }

  /**
   * Validate that required fields are present in the requirement.
   */
  _validateInput(offering, requirement) {
    for (const field of offering.requiredFields) {
      if (!requirement[field]) {
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

  /**
   * Log ACP transaction to workshop diary (same format as x402_commerce).
   */
  _logToWorkshop(offering, jobId) {
    try {
      const dateStr = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
      const diaryDir = path.join(this.baseDir, 'memory/journal/memeya');
      if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
      const diaryPath = path.join(diaryDir, `${dateStr}.md`);
      const time = new Date(Date.now() + 8 * 3600_000)
        .toLocaleTimeString('en-US', { hour12: false });

      const entry =
        `## ${time}\n` +
        `- Topic: acp_commerce\n` +
        `- Posted: ACP job ${jobId} — ${offering.key} ($${offering.price})\n` +
        `- LogType: commerce\n\n`;

      fs.appendFileSync(diaryPath, entry);
      syncToBackend(this.baseDir).catch(() => {});
    } catch (err) {
      console.error('[ACP] Workshop log error:', err.message);
    }
  }

  /**
   * Get current ACP stats for status display.
   */
  getStats() {
    return { ...this.stats };
  }
}
