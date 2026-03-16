#!/usr/bin/env node
/**
 * Sync all Memeya skills to marketplace platforms:
 *   1. Virtuals/aGDP — POST /acp/job-offerings
 *   2. Selfclaw — POST /api/selfclaw/v1/skills
 *   (Dexter x402 is code-driven via ROUTES in x402.js — no API sync needed)
 *
 * Usage: node sync-skills.mjs [--dry-run]
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.backup' });

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Canonical Skill Registry ───────────────────────────────────────

const SKILLS = [
  {
    name: 'meme_rate',
    description: 'Rate any meme image with AI-powered humor analysis. Returns comedy score (0-100), viral potential, category tags, and improvement suggestions.',
    price: 0.05,
    slaMinutes: 5,
    requirement: {
      imageUrl: { type: 'string', description: 'Public URL of the meme image to analyze' },
    },
    deliverable: 'JSON with score (0-100), grade, viralPotential, tags array, and suggestions',
    requiredFunds: true,
    category: 'analysis',
    backendEndpoint: 'POST /api/memes/rate',
  },
  {
    name: 'meme_generate',
    description: 'Generate a custom crypto meme with AI comedy architecture. Combines strategy, narrative, and 10 unique art styles. Returns ready-to-share meme image.',
    price: 0.10,
    slaMinutes: 5,
    requirement: {
      topic: { type: 'string', description: 'Meme topic or crypto event (required)' },
      artStyle: { type: 'string', description: 'Art style: pixel-art, cyberpunk, watercolor, comic-book, vaporwave, ukiyo-e, bauhaus, synthwave, claymation, stained-glass (optional)' },
    },
    deliverable: 'JSON with imageUrl, title, description, tags, qualityScore, artStyle',
    requiredFunds: true,
    category: 'content',
    backendEndpoint: 'POST /api/memes/generate-custom',
  },
  {
    name: 'news_meme_generation',
    description: 'Turn trending crypto news into viral memes with punch and humor. Feed it a real headline and get a publication-ready meme.',
    price: 0.10,
    slaMinutes: 5,
    requirement: {
      topic: { type: 'string', description: 'News headline or trending topic for meme generation' },
    },
    deliverable: 'JSON with imageUrl, title, description, tags, qualityScore',
    requiredFunds: true,
    category: 'content',
    backendEndpoint: 'POST /api/memes/generate-custom',
  },
  {
    name: 'community_memes_generation',
    description: 'Turn project announcements into shareable memes for X, with a suggested tweet. Choose tone (hype/wholesome/funny/flex) and style (meme/announcement/comic/infographic).',
    price: 0.15,
    slaMinutes: 5,
    requirement: {
      description: { type: 'string', description: 'Project announcement or event to meme-ify (max 500 chars, required)' },
      tone: { type: 'string', description: 'One of: hype, wholesome, funny, flex (optional)' },
      style: { type: 'string', description: 'One of: meme, announcement, comic, infographic (optional)' },
      accountName: { type: 'string', description: 'Project name for branding (optional)' },
      accountHandle: { type: 'string', description: 'X handle e.g. @myproject (optional)' },
    },
    deliverable: 'JSON with imageUrl, title, description, tags, suggestedTweet, qualityScore',
    requiredFunds: true,
    category: 'content',
    backendEndpoint: 'POST /api/memes/generate-community',
  },
  {
    name: 'newspaper_generation',
    description: 'Generate a newspaper-style banner image from news or announcement text. Perfect for X posts and community updates.',
    price: 0.15,
    slaMinutes: 5,
    requirement: {
      description: { type: 'string', description: 'News or announcement text (max 500 chars, required)' },
      xProfileUrl: { type: 'string', description: 'X/Twitter profile URL for avatar overlay (optional)' },
    },
    deliverable: 'JSON with imageUrl, title, description, tags, suggestedTweet',
    requiredFunds: true,
    category: 'content',
    backendEndpoint: 'POST /api/memes/generate-newspaper',
  },
  {
    name: 'health_check_agent',
    description: 'Health check service for monitoring agent availability and status. Returns service health, uptime, and available offerings.',
    price: 0.01,
    slaMinutes: 5,
    requirement: {},
    deliverable: 'JSON with status, timestamp, version, services list',
    requiredFunds: false,
    category: 'monitoring',
    backendEndpoint: 'GET /health',
  },
];

// ─── Virtuals/aGDP Sync ─────────────────────────────────────────────

async function syncVirtuals() {
  const KEY = process.env.LITE_AGENT_API_KEY;
  if (!KEY) { console.log('[Virtuals] LITE_AGENT_API_KEY missing — skipped'); return; }

  const API = 'https://claw-api.virtuals.io';
  const headers = { 'x-api-key': KEY, 'Content-Type': 'application/json' };

  // Get current offerings
  const me = await (await fetch(`${API}/acp/me`, { headers })).json();
  const existing = new Set(me.data?.jobs?.map(j => j.name) || []);
  console.log(`[Virtuals] Current offerings: ${[...existing].join(', ') || '(none)'}`);

  let created = 0, skipped = 0, failed = 0;

  for (const skill of SKILLS) {
    if (existing.has(skill.name)) {
      console.log(`  ✓ ${skill.name} — already exists, skipped`);
      skipped++;
      continue;
    }

    const payload = {
      data: {
        name: skill.name,
        description: skill.description,
        priceV2: { type: 'fixed', value: skill.price },
        slaMinutes: skill.slaMinutes,
        requiredFunds: skill.requiredFunds,
        requirement: skill.requirement,
        deliverable: skill.deliverable,
      },
    };

    if (DRY_RUN) {
      console.log(`  [DRY] Would create: ${skill.name} ($${skill.price})`);
      created++;
      continue;
    }

    try {
      const r = await fetch(`${API}/acp/job-offerings`, {
        method: 'POST', headers, body: JSON.stringify(payload),
      });
      if (r.status === 201 || r.status === 200) {
        console.log(`  ✅ ${skill.name} ($${skill.price}) — created`);
        created++;
      } else {
        const err = await r.text();
        console.log(`  ❌ ${skill.name} — ${r.status}: ${err.slice(0, 200)}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ ${skill.name} — ${e.message}`);
      failed++;
    }
  }

  console.log(`[Virtuals] Done: ${created} created, ${skipped} skipped, ${failed} failed\n`);
}

// ─── Selfclaw Sync ──────────────────────────────────────────────────

async function syncSelfclaw() {
  const API_KEY = process.env.SELFCLAW_API_KEY;
  const PUB_KEY = process.env.SELFCLAW_PUBLIC_KEY;
  const PRIV_KEY = process.env.SELFCLAW_PRIVATE_KEY;
  if (!API_KEY || !PUB_KEY) { console.log('[Selfclaw] SELFCLAW keys missing — skipped'); return; }

  const API = 'https://selfclaw.ai/api/selfclaw/v1';

  // Selfclaw requires Ed25519 signed auth fields for write operations
  const crypto = await import('crypto');
  const keyObj = crypto.createPrivateKey({
    key: Buffer.from(PRIV_KEY, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });

  function signedPost(path, payload) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    // Sign ONLY the auth fields: {agentPublicKey, timestamp, nonce}
    const authData = JSON.stringify({ agentPublicKey: PUB_KEY, timestamp, nonce });
    const signature = crypto.sign(null, Buffer.from(authData), keyObj).toString('base64');

    return fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, agentPublicKey: PUB_KEY, timestamp, nonce, signature }),
    });
  }

  // Get current services
  const HUMAN_ID = '8692757f40c5ba0c';
  let existing = new Set();
  try {
    const r = await fetch(`${API}/services/${HUMAN_ID}`);
    if (r.ok) {
      const data = await r.json();
      const services = data.services || data.data || [];
      if (Array.isArray(services)) {
        existing = new Set(services.map(s => s.name));
      }
    }
  } catch (e) {
    console.log(`[Selfclaw] Could not fetch existing services: ${e.message}`);
  }
  console.log(`[Selfclaw] Current services: ${[...existing].join(', ') || '(none)'}`);

  let created = 0, skipped = 0, failed = 0;

  for (const skill of SKILLS) {
    if (existing.has(skill.name)) {
      console.log(`  ✓ ${skill.name} — already exists, skipped`);
      skipped++;
      continue;
    }

    const payload = {
      name: skill.name,
      description: skill.description,
      category: skill.category,
      price: skill.price,
      endpoint: `https://api.aimemeforge.io${skill.backendEndpoint.split(' ')[1]}`,
    };

    if (DRY_RUN) {
      console.log(`  [DRY] Would create: ${skill.name} ($${skill.price})`);
      created++;
      continue;
    }

    try {
      const r = await signedPost('/services', payload);
      if (r.ok) {
        console.log(`  ✅ ${skill.name} ($${skill.price}) — created`);
        created++;
      } else {
        const err = await r.text();
        console.log(`  ❌ ${skill.name} — ${r.status}: ${err.slice(0, 200)}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ ${skill.name} — ${e.message}`);
      failed++;
    }
  }

  console.log(`[Selfclaw] Done: ${created} created, ${skipped} skipped, ${failed} failed\n`);
}

// ─── Main ───────────────────────────────────────────────────────────

console.log(`\n=== Memeya Skill Sync ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
console.log(`Skills to sync: ${SKILLS.map(s => s.name).join(', ')}\n`);

await syncVirtuals();
await syncSelfclaw();

console.log('[Dexter x402] Skills are code-driven in app/backend/middleware/x402.js — deploy to update.');
console.log('\n=== Sync complete ===\n');
