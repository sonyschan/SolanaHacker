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

const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { ExactEvmScheme } = require('@x402/evm/exact/server');
const { HTTPFacilitatorClient } = require('@x402/core/server');

// Memeya's Base wallet (Crossmint Smart Wallet)
const MEMEYA_BASE_WALLET = '0xba646262871d295DeAe3062dF5bbe31fcc5841b8';

// Base mainnet CAIP-2 identifier
const BASE_MAINNET = 'eip155:8453';

// CDP facilitator (recommended for mainnet + testnet)
const CDP_FACILITATOR_URL = 'https://api.cdp.coinbase.com/platform/v2/x402';

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
    });

    const server = new x402ResourceServer(facilitatorClient)
      .register(BASE_MAINNET, new ExactEvmScheme());

    // Route → pricing config
    const routeConfig = {
      'POST /api/memes/rate': {
        accepts: [{
          scheme: 'exact',
          price: '$0.005',
          network: BASE_MAINNET,
          payTo: MEMEYA_BASE_WALLET,
        }],
        description: 'Rate a meme image — AI quality scoring with grade and suggestions',
        mimeType: 'application/json',
      },
      'POST /api/memes/generate-custom': {
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

    _x402Middleware = paymentMiddleware(routeConfig, server);
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
    return next(); // admin access — skip paywall
  }

  // Track 2: x402 payment
  const middleware = getX402Middleware();
  if (middleware) {
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
