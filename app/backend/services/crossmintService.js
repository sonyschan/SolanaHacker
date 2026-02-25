/**
 * Crossmint Agentic Wallet Service
 *
 * Singleton wrapper around @crossmint/wallets-sdk for Memeya's USDC wallet.
 * Env vars: CROSSMINT_API_KEY, MEMEYA_WALLET_LOCATOR
 *
 * SDK API (v0.19.x — server-side):
 *   createCrossmint({ apiKey }) → CrossmintWallets.from(crossmint)
 *   crossmintWallets.createWallet({ chain, signer }) → wallet  (one-time)
 *   crossmintWallets.getWallet(locator, { chain, signer }) → wallet  (server-side fetch)
 *   wallet.address — string property
 *   wallet.balances() → { nativeToken: { amount }, usdc: { amount } }
 *   wallet.send(to, token, amount) → { explorerLink }
 */

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

let walletInstance = null;
let sdkLoaded = null; // { CrossmintWallets, createCrossmint }

/**
 * Lazy-load the SDK (avoid import errors if not installed yet)
 */
function getSDK() {
  if (!sdkLoaded) {
    try {
      const sdk = require('@crossmint/wallets-sdk');
      sdkLoaded = {
        CrossmintWallets: sdk.CrossmintWallets,
        createCrossmint: sdk.createCrossmint
      };
    } catch (err) {
      throw new Error('Missing @crossmint/wallets-sdk — run: npm install @crossmint/wallets-sdk');
    }
  }
  return sdkLoaded;
}

/**
 * Get or create Memeya's Crossmint wallet (singleton)
 */
async function getMemeyaWallet() {
  if (walletInstance) return walletInstance;

  const apiKey = process.env.CROSSMINT_API_KEY;
  const locator = process.env.MEMEYA_WALLET_LOCATOR;

  if (!apiKey) throw new Error('CROSSMINT_API_KEY not set');
  if (!locator) throw new Error('MEMEYA_WALLET_LOCATOR not set');

  const { CrossmintWallets, createCrossmint } = getSDK();
  const crossmint = createCrossmint({ apiKey });
  const crossmintWallets = CrossmintWallets.from(crossmint);

  // getWallet is the server-side method (getOrCreateWallet is client-only)
  // locator = wallet address from setup script
  walletInstance = await crossmintWallets.getWallet(locator, {
    chain: 'solana',
    signer: { type: 'api-key' }
  });

  console.log('✅ Crossmint wallet loaded:', walletInstance.address);
  return walletInstance;
}

/**
 * Get wallet USDC and SOL balances
 * @returns {{ usdc: number, sol: number }}
 */
async function getWalletBalances() {
  const wallet = await getMemeyaWallet();
  const balances = await wallet.balances();

  return {
    usdc: parseFloat(balances.usdc?.amount) || 0,
    sol: parseFloat(balances.nativeToken?.amount) || 0
  };
}

/**
 * Send USDC to a recipient address
 * @param {string} recipientAddress - Solana wallet address
 * @param {number} amount - USDC amount (human-readable, e.g. 1.50)
 * @returns {{ txSignature: string }}
 */
async function sendUsdc(recipientAddress, amount) {
  if (!recipientAddress) throw new Error('recipientAddress required');
  if (!amount || amount <= 0) throw new Error('amount must be > 0');

  const wallet = await getMemeyaWallet();

  const result = await wallet.send(recipientAddress, 'usdc', String(amount));

  console.log(`💸 Sent ${amount} USDC to ${recipientAddress} — ${result.explorerLink}`);
  return { txSignature: result.explorerLink };
}

/**
 * Get wallet public address
 * @returns {string}
 */
async function getWalletAddress() {
  const wallet = await getMemeyaWallet();
  return wallet.address;
}

module.exports = {
  getMemeyaWallet,
  getWalletBalances,
  sendUsdc,
  getWalletAddress,
  USDC_MINT
};
