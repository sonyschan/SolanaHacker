/**
 * x402 Payment Client Setup
 *
 * Creates a fetch wrapper that auto-pays USDC when APIs return HTTP 402.
 * Supports Base (EVM) and Solana (SVM) chains.
 * Returns null if no wallet configured (server starts in free-only mode).
 */

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

/**
 * Create a payment-enabled fetch function.
 * Returns null if no wallet is configured (free-only mode).
 * @param {object} config
 * @param {string} [config.privateKey] - Hex EVM private key (0x...) for Base USDC
 * @param {string} [config.secretKey] - Base58 Solana secret key for Solana USDC
 * @returns {Promise<Function|null>} fetch function that auto-pays x402, or null
 */
export async function createPaymentFetch(config) {
  const { privateKey, secretKey } = config;

  if (!privateKey && !secretKey) {
    console.error('[aimemeforge] No wallet configured — running in free-only mode');
    console.error('[aimemeforge] Use the setup_wallet tool to get started');
    return null;
  }

  const client = new x402Client();

  // EVM (Base) wallet
  if (privateKey) {
    const { privateKeyToAccount } = await import('viem/accounts');
    const account = privateKeyToAccount(privateKey);
    registerExactEvmScheme(client, { signer: account });
    console.error(`[aimemeforge] Base wallet: ${account.address}`);
  }

  // Solana wallet
  if (secretKey) {
    try {
      const { registerExactSvmScheme } = await import('@x402/svm/exact/client');
      const bs58 = await import('bs58');
      const { createKeyPairSignerFromBytes } = await import('@solana/signers');
      const keyBytes = bs58.default.decode(secretKey);
      const signer = await createKeyPairSignerFromBytes(keyBytes);
      registerExactSvmScheme(client, { signer });
      console.error(`[aimemeforge] Solana wallet: ${signer.address}`);
    } catch (err) {
      console.error(`[aimemeforge] Solana setup failed (Base-only mode): ${err.message}`);
    }
  }

  return wrapFetchWithPayment(fetch, client);
}
