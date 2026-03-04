/**
 * Base Chain Service
 *
 * Queries USDC balance on Base (Coinbase L2) for Memeya's commerce wallet.
 * Uses direct JSON-RPC calls — no SDK dependency.
 *
 * USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (6 decimals)
 */

const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

// Memeya's Base wallet (Crossmint Smart Wallet)
const MEMEYA_BASE_WALLET = '0xba646262871d295DeAe3062dF5bbe31fcc5841b8';

/**
 * Get USDC balance for an address on Base chain
 * @param {string} address - EVM address (defaults to Memeya's wallet)
 * @returns {Promise<number>} USDC balance (human-readable, e.g. 12.50)
 */
async function getUsdcBalance(address = MEMEYA_BASE_WALLET) {
  // balanceOf(address) selector = 0x70a08231 + 32-byte padded address
  const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
  const data = `0x70a08231${paddedAddress}`;

  const response = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: BASE_USDC_CONTRACT, data }, 'latest'],
      id: 1
    }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`Base RPC error: ${result.error.message}`);
  }

  const rawBalance = BigInt(result.result || '0x0');
  return Number(rawBalance) / Math.pow(10, USDC_DECIMALS);
}

/**
 * Get ETH balance on Base chain
 * @param {string} address - EVM address (defaults to Memeya's wallet)
 * @returns {Promise<number>} ETH balance (human-readable)
 */
async function getEthBalance(address = MEMEYA_BASE_WALLET) {
  const response = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    }),
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`Base RPC error: ${result.error.message}`);
  }

  const rawBalance = BigInt(result.result || '0x0');
  return Number(rawBalance) / 1e18;
}

module.exports = {
  getUsdcBalance,
  getEthBalance,
  MEMEYA_BASE_WALLET,
  BASE_USDC_CONTRACT,
};
