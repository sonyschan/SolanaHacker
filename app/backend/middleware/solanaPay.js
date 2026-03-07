/**
 * Solana on-chain payment verification for meme generation.
 * Verifies SOL or $Memeya SPL token transfers to the Memeya wallet.
 *
 * All transactions — successful or failed — are recorded in Firestore
 * `solana_orders` for auditing, dispute resolution, and analytics.
 */
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getFirestore } = require('../config/firebase');

const MEMEYA_WALLET = new PublicKey('4BqywEbjMf4APFBw1spPFr11q21Uu5A1fHpCRM2zSbMP');
const MEMEYA_MINT = new PublicKey('mPj8dgqLDciVX27vU5efHiodbQhsgK43gGhjQrBpump');
const MEMEYA_DECIMALS = 6;
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;
const ORDER_COLLECTION = 'solana_orders';

// 5% tolerance for price movement between quote and payment
const TOLERANCE = 0.05;

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

/**
 * Verify a Solana payment transaction.
 * @param {string} txSignature - The transaction signature
 * @param {'SOL'|'MEMEYA'|'USDC'} paymentToken - Expected token type
 * @param {number} minAmount - Minimum expected amount (in SOL or token units)
 * @param {object} context - Additional context to store with the order
 * @param {string} context.topic - Meme topic requested
 * @param {number} context.solUsdPrice - SOL/USD rate at time of request
 * @param {number|null} context.memeyaUsdPrice - MEMEYA/USD rate at time of request
 * @param {number} context.baseUsdPrice - Our listed USD price
 * @returns {{ sender: string, actualAmount: number }} - Sender wallet + actual amount transferred
 * @throws {Error} on verification failure
 */
async function verifySolanaPayment(txSignature, paymentToken, minAmount, context = {}) {
  const db = getFirestore();
  const orderRef = db.collection(ORDER_COLLECTION).doc(txSignature);

  // 1. Anti-replay: check if tx already used
  const txDoc = await orderRef.get();
  if (txDoc.exists) {
    const data = txDoc.data();
    // Allow retry if generation failed
    if (data.status !== 'generation_failed') {
      const err = new Error('Transaction already used');
      err.status = 409;
      throw err;
    }
  }

  // 2. Fetch transaction from chain (with retry for propagation delay)
  const solscanUrl = `https://solscan.io/tx/${txSignature}`;
  let tx = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (tx) break;
    // Wait 3s before retrying — tx may still be propagating
    if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
  }

  if (!tx) {
    // Record: we received a signature but can't find it on-chain
    await orderRef.set({
      txSignature,
      solscanUrl,
      paymentToken,
      expectedAmount: minAmount,
      status: 'tx_not_found',
      error: 'Transaction not found or not yet confirmed',
      ...context,
      createdAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});

    const err = new Error('Transaction not found or not yet confirmed');
    err.status = 202;
    throw err;
  }

  if (tx.meta?.err) {
    // Record: tx exists but failed on-chain
    await orderRef.set({
      txSignature,
      solscanUrl,
      paymentToken,
      expectedAmount: minAmount,
      status: 'tx_failed_onchain',
      error: `On-chain error: ${JSON.stringify(tx.meta.err)}`,
      ...context,
      createdAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});

    const err = new Error('Transaction failed on-chain');
    err.status = 400;
    throw err;
  }

  const instructions = tx.transaction.message.instructions;
  let sender = null;
  let verified = false;
  let actualAmount = 0;

  if (paymentToken === 'SOL') {
    // Look for SystemProgram.transfer to our wallet
    for (const ix of instructions) {
      if (ix.program === 'system' && ix.parsed?.type === 'transfer') {
        const info = ix.parsed.info;
        if (info.destination === MEMEYA_WALLET.toBase58()) {
          const lamports = info.lamports;
          const solAmount = lamports / LAMPORTS_PER_SOL;
          actualAmount = solAmount;
          if (solAmount >= minAmount * (1 - TOLERANCE)) {
            sender = info.source;
            verified = true;
            break;
          }
        }
      }
    }
  } else if (paymentToken === 'MEMEYA') {
    // Look for SPL token transfer of $Memeya to our wallet
    // $Memeya uses Token-2022 program, so check both 'spl-token' and 'spl-token-2022'
    const tokenPrograms = ['spl-token', 'spl-token-2022'];
    for (const ix of instructions) {
      if (tokenPrograms.includes(ix.program) && ix.parsed?.type === 'transferChecked') {
        const info = ix.parsed.info;
        if (info.mint === MEMEYA_MINT.toBase58()) {
          const amount = Number(info.tokenAmount?.uiAmount || 0);
          actualAmount = amount;
          if (amount >= minAmount * (1 - TOLERANCE)) {
            sender = info.authority;
            verified = true;
            break;
          }
        }
      }
      // Also handle regular 'transfer' instruction (no mint check in ix itself)
      if (tokenPrograms.includes(ix.program) && ix.parsed?.type === 'transfer') {
        const postBalances = tx.meta?.postTokenBalances || [];
        const preBalances = tx.meta?.preTokenBalances || [];
        for (const post of postBalances) {
          if (post.mint === MEMEYA_MINT.toBase58() && post.owner === MEMEYA_WALLET.toBase58()) {
            const pre = preBalances.find(
              b => b.accountIndex === post.accountIndex && b.mint === MEMEYA_MINT.toBase58()
            );
            const preAmount = Number(pre?.uiTokenAmount?.uiAmount || 0);
            const postAmount = Number(post.uiTokenAmount?.uiAmount || 0);
            const diff = postAmount - preAmount;
            actualAmount = diff;
            if (diff >= minAmount * (1 - TOLERANCE)) {
              sender = ix.parsed.info?.authority;
              verified = true;
              break;
            }
          }
        }
        if (verified) break;
      }
    }
  } else if (paymentToken === 'USDC') {
    // Look for USDC SPL token transfer (standard TOKEN_PROGRAM, not Token-2022)
    for (const ix of instructions) {
      if (ix.program === 'spl-token' && ix.parsed?.type === 'transferChecked') {
        const info = ix.parsed.info;
        if (info.mint === USDC_MINT.toBase58()) {
          const amount = Number(info.tokenAmount?.uiAmount || 0);
          actualAmount = amount;
          if (amount >= minAmount * (1 - TOLERANCE)) {
            sender = info.authority;
            verified = true;
            break;
          }
        }
      }
      // Fallback: regular 'transfer' instruction — check balance diff
      if (ix.program === 'spl-token' && ix.parsed?.type === 'transfer') {
        const postBalances = tx.meta?.postTokenBalances || [];
        const preBalances = tx.meta?.preTokenBalances || [];
        for (const post of postBalances) {
          if (post.mint === USDC_MINT.toBase58() && post.owner === MEMEYA_WALLET.toBase58()) {
            const pre = preBalances.find(
              b => b.accountIndex === post.accountIndex && b.mint === USDC_MINT.toBase58()
            );
            const preAmount = Number(pre?.uiTokenAmount?.uiAmount || 0);
            const postAmount = Number(post.uiTokenAmount?.uiAmount || 0);
            const diff = postAmount - preAmount;
            actualAmount = diff;
            if (diff >= minAmount * (1 - TOLERANCE)) {
              sender = ix.parsed.info?.authority;
              verified = true;
              break;
            }
          }
        }
        if (verified) break;
      }
    }
  } else {
    throw new Error('Invalid paymentToken — must be SOL, MEMEYA, or USDC');
  }

  if (!verified) {
    // Record: tx is valid but doesn't match our expectations
    await orderRef.set({
      txSignature,
      solscanUrl,
      paymentToken,
      expectedAmount: minAmount,
      actualAmount,
      sender: sender || instructions[0]?.parsed?.info?.source || null,
      status: 'verification_failed',
      error: `No valid ${paymentToken} transfer to Memeya wallet (expected >= ${(minAmount * (1 - TOLERANCE)).toFixed(6)}, found ${actualAmount})`,
      ...context,
      createdAt: new Date().toISOString(),
    }, { merge: true }).catch(() => {});

    const err = new Error(`Payment verification failed — could not find valid ${paymentToken} transfer to Memeya wallet`);
    err.status = 400;
    throw err;
  }

  // 3. Compute estimated USD value of the actual payment
  let estimatedUsdValue = null;
  if (paymentToken === 'SOL' && context.solUsdPrice) {
    estimatedUsdValue = actualAmount * context.solUsdPrice;
  } else if (paymentToken === 'MEMEYA' && context.memeyaUsdPrice) {
    estimatedUsdValue = actualAmount * context.memeyaUsdPrice;
  } else if (paymentToken === 'USDC') {
    estimatedUsdValue = actualAmount; // USDC ≈ $1
  }

  // 4. Store comprehensive order record
  await orderRef.set({
    txSignature,
    solscanUrl,
    sender,
    paymentToken,
    expectedAmount: minAmount,
    actualAmount,
    estimatedUsdValue,
    solUsdPrice: context.solUsdPrice || null,
    memeyaUsdPrice: context.memeyaUsdPrice || null,
    baseUsdPrice: context.baseUsdPrice || null,
    topic: context.topic || null,
    status: 'verified',
    verifiedAt: new Date().toISOString(),
    // Preserve createdAt from earlier attempt if retrying
    ...(!txDoc.exists ? { createdAt: new Date().toISOString() } : {}),
  }, { merge: true });

  return { sender, actualAmount };
}

/**
 * Mark a payment order as generation_failed so user can retry with same signature.
 * @param {string} txSignature
 * @param {string} error - Human-readable error description
 */
async function markPaymentFailed(txSignature, error = 'Generation failed') {
  const db = getFirestore();
  await db.collection(ORDER_COLLECTION).doc(txSignature).update({
    status: 'generation_failed',
    error,
    failedAt: new Date().toISOString(),
  });
}

/**
 * Mark a payment order as rate_limited. Payment can be retried later.
 * @param {string} txSignature
 */
async function markPaymentRateLimited(txSignature) {
  const db = getFirestore();
  await db.collection(ORDER_COLLECTION).doc(txSignature).update({
    status: 'generation_failed',
    error: 'Rate limit exceeded — 3 memes per hour',
    failedAt: new Date().toISOString(),
  });
}

/**
 * Mark a payment order as completed after successful generation.
 * @param {string} txSignature
 * @param {string} memeId - The generated meme document ID
 */
async function markPaymentCompleted(txSignature, memeId) {
  const db = getFirestore();
  await db.collection(ORDER_COLLECTION).doc(txSignature).update({
    status: 'completed',
    memeId,
    completedAt: new Date().toISOString(),
    error: null,
  });
}

module.exports = {
  verifySolanaPayment,
  markPaymentFailed,
  markPaymentRateLimited,
  markPaymentCompleted,
  MEMEYA_WALLET,
  MEMEYA_MINT,
  MEMEYA_DECIMALS,
  USDC_MINT,
  USDC_DECIMALS,
  ORDER_COLLECTION,
};
