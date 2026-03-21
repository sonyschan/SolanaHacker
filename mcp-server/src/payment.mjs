/**
 * x402 Payment Client Setup
 *
 * Creates a fetch wrapper that auto-pays USDC when APIs return HTTP 402.
 * Supports Solana (SVM, recommended — gas sponsored) and Base (EVM).
 * Auto-loads saved wallet from ~/.aimemeforge/wallet.json.
 */

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const WALLET_FILE = join(homedir(), '.aimemeforge', 'wallet.json');

/**
 * Create a payment-enabled fetch function.
 * Priority: env vars → saved wallet file → free-only mode.
 * @param {object} config
 * @param {string} [config.privateKey] - Hex EVM private key (0x...) for Base USDC
 * @param {string} [config.secretKey] - Base58 Solana secret key for Solana USDC
 * @returns {Promise<Function|null>} fetch function that auto-pays x402, or null
 */
export async function createPaymentFetch(config) {
  let { privateKey, secretKey } = config;

  // Auto-load from saved wallet if no env var set
  if (!privateKey && !secretKey && existsSync(WALLET_FILE)) {
    try {
      const saved = JSON.parse(readFileSync(WALLET_FILE, 'utf-8'));
      if (saved.secretKey) {
        secretKey = saved.secretKey;
        console.error(`[aimemeforge] Loaded Solana wallet from ${WALLET_FILE}`);
      } else if (saved.privateKey) {
        privateKey = saved.privateKey;
        console.error(`[aimemeforge] Loaded Base wallet from ${WALLET_FILE}`);
      }
    } catch { /* ignore corrupt file */ }
  }

  if (!privateKey && !secretKey) {
    console.error('[aimemeforge] No wallet found — running in free-only mode');
    console.error('[aimemeforge] Run create_wallet to get started');
    return null;
  }

  const client = new x402Client();

  // Solana wallet (recommended — gas sponsored by Dexter)
  if (secretKey) {
    try {
      const { registerExactSvmScheme } = await import('@x402/svm/exact/client');
      const bs58 = await import('bs58');
      const { createKeyPairSignerFromBytes } = await import('@solana/signers');
      const keyBytes = bs58.default.decode(secretKey);
      const signer = await createKeyPairSignerFromBytes(keyBytes);
      registerExactSvmScheme(client, { signer });
      console.error(`[aimemeforge] Solana wallet: ${signer.address} (gas sponsored by Dexter)`);
    } catch (err) {
      console.error(`[aimemeforge] Solana setup failed: ${err.message}`);
    }
  }

  // EVM (Base) wallet
  if (privateKey) {
    try {
      const { registerExactEvmScheme } = await import('@x402/evm/exact/client');
      const { privateKeyToAccount } = await import('viem/accounts');
      const account = privateKeyToAccount(privateKey);
      registerExactEvmScheme(client, { signer: account });
      console.error(`[aimemeforge] Base wallet: ${account.address}`);
    } catch (err) {
      console.error(`[aimemeforge] Base setup failed: ${err.message}`);
    }
  }

  return wrapFetchWithPayment(fetch, client);
}
