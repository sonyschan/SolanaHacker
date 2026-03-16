/**
 * x402 Payment Middleware for AIMemeForge Commerce
 *
 * Multi-facilitator architecture (single middleware, multiple clients):
 *   CDP (api.cdp.coinbase.com)    — Base (proven, primary for EVM)
 *   Dexter (x402.dexter.cash)     — Solana + extra EVM chains
 *
 * The x402ResourceServer routes payments to the correct facilitator based
 * on which one first claimed support for that version/network/scheme during
 * initialization. CDP is registered first → Base goes through CDP.
 * Dexter registered second → Solana (and any chains CDP doesn't cover) go
 * through Dexter.
 *
 * Dual-track auth: Lab passphrase (admin) OR x402 payment (commercial).
 * If request has valid x-api-key header → skip paywall (free lab access).
 * Otherwise → x402 paymentMiddleware (HTTP 402 → pay → proceed).
 */

const crypto = require('crypto');
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { ExactSvmScheme } = require('@x402/svm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');
const { bazaarResourceServerExtension, declareDiscoveryExtension } = require('@x402/extensions/bazaar');

// ── Wallets ──────────────────────────────────────────────────────────
const MEMEYA_BASE_WALLET = '0xba646262871d295DeAe3062dF5bbe31fcc5841b8';
const MEMEYA_SOLANA_WALLET = 'HFunb7hi2rMa14MkWSESABQWNJECKhQwvcUJZF4ZCdjS';

// ── Networks (CAIP-2) ────────────────────────────────────────────────
const BASE_MAINNET = 'eip155:8453';
const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'; // mainnet-beta

// ── Facilitators ─────────────────────────────────────────────────────
const DEXTER_FACILITATOR_URL = 'https://x402.dexter.cash';

const CDP_FACILITATOR_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';
const CDP_FACILITATOR_HOST = 'api.cdp.coinbase.com';
const CDP_FACILITATOR_PATH = '/platform/v2/x402';

// ── Route pricing + Bazaar discovery metadata ───────────────────────
const ROUTES = [
  {
    key: 'POST /rate',
    price: '$0.05',
    description: 'Rate a meme image — AI quality scoring with grade and suggestions',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: { imageUrl: 'https://example.com/meme.jpg' },
        inputSchema: {
          properties: { imageUrl: { type: 'string', description: 'Public URL of a meme image to rate' } },
          required: ['imageUrl'],
        },
        output: {
          example: { success: true, score: 72, pass: true, grade: 'B+', suggestions: ['Add a punchline that contrasts the setup'] },
          schema: {
            properties: {
              success: { type: 'boolean' },
              score: { type: 'number', description: '0-100 quality score' },
              pass: { type: 'boolean', description: 'Whether the meme passes quality threshold' },
              grade: { type: 'string', description: 'Letter grade: S, A+, A, B+, B, C, D, F' },
              suggestions: { type: 'array', items: { type: 'string' }, description: 'Up to 3 improvement suggestions' },
            },
          },
        },
        bodyType: 'json',
      }),
    },
  },
  {
    key: 'POST /generate-custom',
    price: '$0.10',
    description: 'Generate a custom AI meme with comedy architecture',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: { topic: 'Bitcoin hits $150k' },
        inputSchema: {
          properties: {
            topic: { type: 'string', description: 'Meme topic or news headline' },
            templateId: { type: 'string', description: 'Optional template ID from /api/catalog/templates' },
            strategyId: { type: 'string', description: 'Optional strategy ID from /api/catalog/strategies' },
            narrativeId: { type: 'string', description: 'Optional narrative ID from /api/catalog/narratives' },
            artStyleId: { type: 'string', description: 'Optional art style ID from /api/catalog/art-styles' },
          },
          required: ['topic'],
        },
        output: {
          example: {
            success: true,
            meme: {
              id: 'abc123',
              title: 'When Bitcoin Hits $150k',
              imageUrl: 'https://storage.googleapis.com/memeforge-images-web3ai/memes/abc123.png',
              description: 'A meme about Bitcoin reaching new all-time highs',
              tags: ['bitcoin', 'crypto', 'ath'],
              metadata: { qualityScore: 88, artStyle: 'Cyberpunk Neon', strategy: 'Ironic Reversal' },
            },
          },
        },
        bodyType: 'json',
      }),
    },
  },
  {
    key: 'POST /generate-community',
    price: '$0.15',
    description: 'Generate a community meme from a description with chosen tone and style',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: {
          description: 'Memeya token pumping to the moon',
          tone: 'hype',
          style: 'meme',
        },
        inputSchema: {
          properties: {
            description: { type: 'string', description: 'Meme description (max 500 chars)' },
            tone: { type: 'string', enum: ['hype', 'wholesome', 'funny', 'flex'], description: 'Meme tone' },
            style: { type: 'string', enum: ['meme', 'announcement', 'comic', 'infographic'], description: 'Visual style' },
          },
          required: ['description'],
        },
        output: {
          example: {
            success: true,
            meme: {
              id: 'community_123',
              title: 'Memeya To The Moon',
              imageUrl: 'https://storage.googleapis.com/memeforge-images-web3ai/memes/community_123.png',
              description: 'A hype meme about Memeya token',
              tags: ['memeya', 'pump', 'moon'],
              metadata: { qualityScore: 85, artStyle: 'Cyberpunk Neon', strategy: 'Hype Train' },
            },
            suggestedTweet: 'Memeya is pumping! 🚀',
          },
        },
        bodyType: 'json',
      }),
    },
  },
  {
    key: 'POST /generate-newspaper',
    price: '$0.15',
    description: 'Generate a newspaper-style banner image from news/announcement text',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: {
          description: 'BTC hits new ATH as institutional demand surges post-ETF approval',
          xProfileUrl: 'https://x.com/AiMemeForgeIO',
        },
        inputSchema: {
          properties: {
            description: { type: 'string', description: 'News or announcement text (max 500 chars)' },
            xProfileUrl: { type: 'string', description: 'X/Twitter profile URL for avatar (optional)' },
          },
          required: ['description'],
        },
        output: {
          example: {
            success: true,
            meme: {
              id: 'newspaper_123',
              title: 'BTC New ATH',
              imageUrl: 'https://storage.googleapis.com/memeforge-images-web3ai/memes/newspaper_123.jpg',
              description: 'BTC hits new ATH...',
              tags: ['bitcoin', 'ath', 'etf'],
            },
            suggestedTweet: 'Bitcoin just shattered records',
          },
        },
        bodyType: 'json',
      }),
    },
  },
];

// ── Cached middleware instance ────────────────────────────────────────
let _paymentMiddleware = null;
let _initialized = false;

// =====================================================================
//  CDP JWT Auth
// =====================================================================

function generateCdpJwt(apiKeyId, apiKeySecret, method, path) {
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');

  const header = { alg: 'EdDSA', kid: apiKeyId, typ: 'JWT', nonce };
  const payload = {
    sub: apiKeyId,
    iss: 'cdp',
    iat: now,
    nbf: now,
    exp: now + 120,
    uris: [`${method} ${CDP_FACILITATOR_HOST}${path}`],
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${b64Header}.${b64Payload}`;

  const decoded = Buffer.from(apiKeySecret, 'base64');
  const seed = decoded.subarray(0, 32);

  const pkcs8Prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  const keyObj = crypto.createPrivateKey({
    key: Buffer.concat([pkcs8Prefix, seed]),
    format: 'der',
    type: 'pkcs8',
  });

  const signature = crypto.sign(null, Buffer.from(signingInput), keyObj);
  return `${signingInput}.${Buffer.from(signature).toString('base64url')}`;
}

function createCdpAuthHeaders(apiKeyId, apiKeySecret) {
  return async () => {
    const verifyAuth = `Bearer ${generateCdpJwt(apiKeyId, apiKeySecret, 'POST', `${CDP_FACILITATOR_PATH}/verify`)}`;
    const settleAuth = `Bearer ${generateCdpJwt(apiKeyId, apiKeySecret, 'POST', `${CDP_FACILITATOR_PATH}/settle`)}`;
    const supportedAuth = `Bearer ${generateCdpJwt(apiKeyId, apiKeySecret, 'GET', `${CDP_FACILITATOR_PATH}/supported`)}`;
    return {
      verify: { Authorization: verifyAuth },
      settle: { Authorization: settleAuth },
      supported: { Authorization: supportedAuth },
    };
  };
}

// =====================================================================
//  Route config builder
// =====================================================================

/**
 * Build route pricing config for a given set of networks.
 * @param {string[]} networks - CAIP-2 network IDs to include
 */
function buildRouteConfig(networks) {
  const config = {};
  for (const route of ROUTES) {
    const accepts = [];
    for (const network of networks) {
      if (network === BASE_MAINNET) {
        accepts.push({
          scheme: 'exact',
          price: route.price,
          network: BASE_MAINNET,
          payTo: MEMEYA_BASE_WALLET,
        });
      } else if (network === SOLANA_MAINNET) {
        accepts.push({
          scheme: 'exact',
          price: route.price,
          network: SOLANA_MAINNET,
          payTo: MEMEYA_SOLANA_WALLET,
        });
      }
    }
    config[route.key] = {
      accepts,
      description: route.description,
      mimeType: route.mimeType,
      ...(route.extensions && { extensions: route.extensions }),
    };
  }
  return config;
}

// =====================================================================
//  Middleware builder — single middleware, multiple facilitators
// =====================================================================

/**
 * Build a single payment middleware with:
 *   - CDP client first → claims Base (eip155:8453)
 *   - Dexter client second → claims Solana (and any EVM chains CDP misses)
 *
 * During initialize(), x402ResourceServer iterates facilitator clients in
 * order. The first client to support a given version/network/scheme wins.
 * This ensures Base payments go through CDP (proven) while Solana payments
 * go through Dexter (new).
 */
function buildPaymentMiddleware(cdpKeyId, cdpKeySecret) {
  const facilitators = [];

  // CDP first — claims Base
  if (cdpKeyId && cdpKeySecret) {
    const cdpFacilitator = new HTTPFacilitatorClient({
      url: CDP_FACILITATOR_URL,
      createAuthHeaders: createCdpAuthHeaders(cdpKeyId, cdpKeySecret),
    });
    facilitators.push(cdpFacilitator);
    console.log('✅ x402: CDP client added (Base)');
  }

  // Dexter second — claims Solana (+ any chains CDP doesn't cover)
  const dexterFacilitator = new HTTPFacilitatorClient({
    url: DEXTER_FACILITATOR_URL,
  });
  facilitators.push(dexterFacilitator);
  console.log('✅ x402: Dexter client added (Solana + fallback EVM)');

  if (facilitators.length === 0) {
    throw new Error('No facilitator clients available');
  }

  // Single server with both EVM and SVM schemes
  const server = new x402ResourceServer(facilitators)
    .register(BASE_MAINNET, new ExactEvmScheme())
    .register(SOLANA_MAINNET, new ExactSvmScheme());
  server.registerExtension(bazaarResourceServerExtension);

  // Debug hooks — log verify/settle results
  server.onAfterVerify(({ paymentPayload, requirements, result }) => {
    console.log(`[x402] ✅ Verify OK — network: ${requirements.network}, valid: ${result.isValid}`);
  });
  server.onVerifyFailure(({ paymentPayload, requirements, error }) => {
    console.error(`[x402] ❌ Verify FAILED — network: ${requirements?.network}`, error?.message || error);
  });
  server.onAfterSettle(({ paymentPayload, requirements, result }) => {
    console.log(`[x402] ✅ Settle OK — network: ${requirements.network}, tx: ${result.transaction}, payer: ${result.payer}`);
  });
  server.onSettleFailure(({ paymentPayload, requirements, error }) => {
    console.error(`[x402] ❌ Settle FAILED — network: ${requirements?.network}`, error?.message || error);
  });

  // Route config includes both Base and Solana payment options
  const routeConfig = buildRouteConfig([BASE_MAINNET, SOLANA_MAINNET]);

  return paymentMiddleware(routeConfig, server, {
    appName: 'AIMemeForge',
    appLogo: 'https://aimemeforge.io/images/logo-192.png',
    testnet: false,
  });
}

// =====================================================================
//  Initialization
// =====================================================================

function initializeMiddleware() {
  if (_initialized) return;
  _initialized = true;

  const keyId = process.env.CDP_API_KEY_ID;
  const keySecret = process.env.CDP_API_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('⚠️ x402: CDP_API_KEY_ID or CDP_API_KEY_SECRET not set — Base payments via Dexter only');
  }

  try {
    _paymentMiddleware = buildPaymentMiddleware(keyId, keySecret);
    console.log('✅ x402: Payment middleware initialized (Base via CDP, Solana via Dexter)');
  } catch (err) {
    console.error('❌ x402: Middleware init failed:', err.message);
    _paymentMiddleware = null;
  }
}

// =====================================================================
//  Main middleware
// =====================================================================

/**
 * Dual-track middleware: Lab passphrase OR x402 payment.
 *
 * 1. Lab key match → next() (admin access)
 * 2. x402 payment middleware (Base via CDP, Solana via Dexter)
 * 3. Neither available → 503
 */
function requireLabKeyOrPayment(req, res, next) {
  // Lazy init on first request
  initializeMiddleware();

  // Track 1: Lab passphrase
  const labKey = req.headers['x-api-key'];
  const expectedLabKey = process.env.LAB_API_KEY;
  if (expectedLabKey && labKey === expectedLabKey) {
    req.authMethod = 'lab';
    return next();
  }

  // Track 2: x402 payment
  if (_paymentMiddleware) {
    req.authMethod = 'x402';
    return _paymentMiddleware(req, res, next);
  }

  // Nothing available
  if (!expectedLabKey) {
    return res.status(503).json({ error: 'SERVICE_NOT_CONFIGURED', message: 'Payment system not configured' });
  }
  return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid or missing API key' });
}

module.exports = {
  requireLabKeyOrPayment,
  initializeMiddleware,
  MEMEYA_BASE_WALLET,
  MEMEYA_SOLANA_WALLET,
};
