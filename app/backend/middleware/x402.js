/**
 * x402 Payment Middleware for AIMemeForge Commerce
 *
 * Dual-track auth: Lab passphrase (admin) OR x402 payment (commercial).
 * If request has valid x-api-key header → skip paywall (free lab access).
 * Otherwise → x402 paymentMiddleware (HTTP 402 → pay → proceed).
 *
 * Uses Coinbase CDP facilitator for Base mainnet.
 * Solana support can be added later via x402-solana package.
 */

const crypto = require('crypto');
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

// Memeya's Base wallet (Crossmint Smart Wallet)
const MEMEYA_BASE_WALLET = '0xba646262871d295DeAe3062dF5bbe31fcc5841b8';

// Base mainnet CAIP-2 identifier
const BASE_MAINNET = 'eip155:8453';

// CDP facilitator
const CDP_FACILITATOR_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';
const CDP_FACILITATOR_HOST = 'api.cdp.coinbase.com';
const CDP_FACILITATOR_PATH = '/platform/v2/x402';

/**
 * Generate a CDP JWT (Ed25519) for authenticating with the facilitator.
 * Replicates @coinbase/cdp-sdk JWT logic without the ESM-only `jose` dependency.
 */
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

  // Ed25519 key: 64 bytes base64 = 32-byte seed + 32-byte public key
  const decoded = Buffer.from(apiKeySecret, 'base64');
  const seed = decoded.subarray(0, 32);

  // Build PKCS8 DER for Ed25519 private key
  const pkcs8Prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  const keyObj = crypto.createPrivateKey({
    key: Buffer.concat([pkcs8Prefix, seed]),
    format: 'der',
    type: 'pkcs8',
  });

  const signature = crypto.sign(null, Buffer.from(signingInput), keyObj);
  return `${signingInput}.${Buffer.from(signature).toString('base64url')}`;
}

/**
 * Build createAuthHeaders function for CDP facilitator (matches @coinbase/x402 interface).
 */
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

let _x402Middleware = null;

/**
 * Lazily build and cache the x402 payment middleware.
 * Returns null if CDP credentials are missing (graceful degradation).
 */
function getX402Middleware() {
  if (_x402Middleware !== null) return _x402Middleware;

  const keyId = process.env.CDP_API_KEY_ID;
  const keySecret = process.env.CDP_API_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('⚠️ x402: CDP_API_KEY_ID or CDP_API_KEY_SECRET not set — x402 payments disabled');
    _x402Middleware = false; // false = not available
    return false;
  }

  try {
    const facilitatorClient = new HTTPFacilitatorClient({
      url: CDP_FACILITATOR_URL,
      createAuthHeaders: createCdpAuthHeaders(keyId, keySecret),
    });

    const server = new x402ResourceServer(facilitatorClient)
      .register(BASE_MAINNET, new ExactEvmScheme());

    // Route → pricing config
    // Keys use router-relative paths (req.path inside Express sub-router)
    const routeConfig = {
      'POST /rate': {
        accepts: [{
          scheme: 'exact',
          price: '$0.005',
          network: BASE_MAINNET,
          payTo: MEMEYA_BASE_WALLET,
        }],
        description: 'Rate a meme image — AI quality scoring with grade and suggestions',
        mimeType: 'application/json',
      },
      'POST /generate-custom': {
        accepts: [{
          scheme: 'exact',
          price: '$0.10',
          network: BASE_MAINNET,
          payTo: MEMEYA_BASE_WALLET,
        }],
        description: 'Generate a custom AI meme with comedy architecture',
        mimeType: 'application/json',
      },
    };

    const paywallConfig = {
      appName: 'AIMemeForge',
      appLogo: 'https://aimemeforge.io/images/logo-192.png',
      testnet: false,
    };

    _x402Middleware = paymentMiddleware(routeConfig, server, paywallConfig);
    console.log('✅ x402: payment middleware initialized (Base mainnet)');
    return _x402Middleware;
  } catch (err) {
    console.error('❌ x402: failed to initialize payment middleware:', err.message);
    _x402Middleware = false;
    return false;
  }
}

/**
 * Dual-track middleware: Lab passphrase OR x402 payment.
 *
 * 1. If x-api-key header matches LAB_API_KEY → proceed (admin access)
 * 2. If x402 is configured → run payment middleware
 * 3. If x402 is NOT configured → fall back to requireLabKey only
 */
function requireLabKeyOrPayment(req, res, next) {
  // Track 1: Lab passphrase
  const labKey = req.headers['x-api-key'];
  const expectedLabKey = process.env.LAB_API_KEY;
  if (expectedLabKey && labKey === expectedLabKey) {
    req.authMethod = 'lab';
    return next(); // admin access — skip paywall
  }

  // Track 2: x402 payment
  const middleware = getX402Middleware();
  if (middleware) {
    req.authMethod = 'x402';
    return middleware(req, res, next);
  }

  // Fallback: no x402, no lab key → reject
  if (!expectedLabKey) {
    return res.status(503).json({ error: 'SERVICE_NOT_CONFIGURED', message: 'Payment system not configured' });
  }
  return res.status(403).json({ error: 'FORBIDDEN', message: 'Invalid or missing API key' });
}

module.exports = {
  requireLabKeyOrPayment,
  getX402Middleware,
  MEMEYA_BASE_WALLET,
};
