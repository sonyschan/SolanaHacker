/**
 * x402 Payment Client Setup
 *
 * Creates a fetch wrapper that auto-pays USDC when APIs return HTTP 402.
 * Supports Base (EVM) and Solana (SVM) chains.
 */

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

/**
 * Create a payment-enabled fetch function.
 * @param {object} config
 * @param {string} [config.privateKey] - Hex EVM private key (0x...) for Base USDC
 * @param {string} [config.secretKey] - Base58 Solana secret key for Solana USDC
 * @returns {Promise<Function>} fetch function that auto-pays x402
 */
export async function createPaymentFetch(config) {
  const { privateKey, secretKey } = config;

  if (!privateKey && !secretKey) {
    throw new Error(
      'No wallet configured. Set PRIVATE_KEY (Base/EVM hex) or SECRET_KEY (Solana base58).\n' +
      'Your wallet needs USDC to pay for meme services.'
    );
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
