/**
 * Reward Distribution Service
 *
 * Distributes USDC rewards after daily lottery:
 * - $3 to meme winner
 * - $2 to lucky draw voter 1
 * - $1 to lucky draw voter 2
 * - Skip if balance < $6; alert TG dev group if < $10
 *
 * All distributions are idempotent (keyed by drawId) and recorded in Firestore.
 */

const crypto = require('crypto');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const crossmintService = require('./crossmintService');

const WINNER_REWARD = 3;      // Fixed $3 to meme winner
const VOTER_1_REWARD = 2;     // Fixed $2 to lucky draw voter 1
const VOTER_2_REWARD = 1;     // Fixed $1 to lucky draw voter 2
const TOTAL_PAYOUT = WINNER_REWARD + VOTER_1_REWARD + VOTER_2_REWARD; // $6
const MIN_BALANCE = TOTAL_PAYOUT;    // Skip distribution below this
const LOW_BALANCE_ALERT = 10; // TG alert threshold

// ==================== TG Alert ====================

/**
 * Send low-balance alert to TG dev group
 */
async function sendTgAlert(message) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_DEV_CHAT_ID;
  if (!token || !chatId) {
    console.warn('⚠️ TG alert skipped — TG_BOT_TOKEN or TG_DEV_CHAT_ID not set');
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
    });
  } catch (err) {
    console.error('Failed to send TG alert:', err.message);
  }
}

// ==================== Core ====================

/**
 * Distribute rewards for a completed lottery draw
 * @param {{ drawId: string, status: string, winner: string, memeId: string }} drawResult
 * @param {{ simulate?: boolean }} [options]
 */
async function distributeRewards(drawResult, options = {}) {
  const { simulate = false } = options;
  const { drawId, status, winner: winnerWallet, memeId } = drawResult;

  if (status !== 'completed' || !winnerWallet) {
    console.log(`⏭️ Reward skip — draw ${drawId} status: ${status}, winner: ${winnerWallet}`);
    return { drawId, status: 'skipped_no_winner' };
  }

  console.log(`💰 Distributing rewards for draw ${drawId}...`);

  // 1. Idempotency check — skip if completed OR partial (avoid double-paying)
  const existing = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, drawId);
  if (existing && (existing.status === 'completed' || existing.status === 'partial')) {
    console.log(`⏭️ Rewards already processed for ${drawId} (status: ${existing.status})`);
    return { drawId, status: 'already_distributed' };
  }

  // 2. Get wallet balance
  let balances;
  try {
    balances = await crossmintService.getWalletBalances();
  } catch (err) {
    console.error('❌ Failed to get wallet balance:', err.message);
    await recordDistribution(drawId, {
      status: 'failed_balance_check',
      error: err.message,
      winnerWallet,
      memeId
    });
    return { drawId, status: 'failed_balance_check' };
  }

  const usdcBalance = balances.usdc;
  console.log(`💳 Wallet USDC balance: $${usdcBalance}`);

  // 3. Low balance alert
  if (usdcBalance < LOW_BALANCE_ALERT) {
    await sendTgAlert(
      `⚠️ *Memeya Wallet Low Balance*\n` +
      `Balance: $${usdcBalance.toFixed(2)} USDC\n` +
      `Threshold: $${LOW_BALANCE_ALERT}\n` +
      `Please top up the wallet.`
    );
  }

  // 4. Skip if below minimum
  if (usdcBalance < MIN_BALANCE) {
    console.log(`⏭️ Balance $${usdcBalance} < $${MIN_BALANCE} — skipping rewards`);
    await recordDistribution(drawId, {
      status: 'skipped_low_balance',
      balance: usdcBalance,
      winnerWallet,
      memeId
    });
    return { drawId, status: 'skipped_low_balance', balance: usdcBalance };
  }

  // 5. Check winner $Memeya qualification (10K holding required for USDC)
  const MEMEYA_THRESHOLD = 10000;
  const winnerUser = await dbUtils.getDocument(collections.USERS, winnerWallet);
  const winnerQualified = winnerUser && (winnerUser.memeyaBalance || 0) >= MEMEYA_THRESHOLD;

  if (!winnerQualified) {
    console.log(`⚠️ Winner ${winnerWallet} not qualified — memeyaBalance: ${winnerUser?.memeyaBalance || 0} (need ${MEMEYA_THRESHOLD})`);
    await sendTgAlert(
      `⚠️ *Winner Skipped (Insufficient $Memeya)*\n` +
      `Draw: ${drawId}\n` +
      `Winner: \`${winnerWallet.slice(0, 4)}…${winnerWallet.slice(-4)}\`\n` +
      `Balance: ${(winnerUser?.memeyaBalance || 0).toLocaleString()} $Memeya (need ${MEMEYA_THRESHOLD.toLocaleString()})`
    );
  }

  const winnerAmount = WINNER_REWARD;
  let remaining = usdcBalance - (winnerQualified ? winnerAmount : 0);
  const voterAmounts = [VOTER_1_REWARD, VOTER_2_REWARD];

  // 6. Select 2 random voters
  const randomVoters = await selectRandomVoters(drawId, winnerWallet, 2);

  // 7. Simulation mode — calculate only, skip actual transfers
  if (simulate) {
    console.log(`🧪 SIMULATION mode — skipping actual transfers for draw ${drawId}`);
    const simTransfers = [];
    if (winnerQualified) {
      simTransfers.push({ type: 'winner', wallet: winnerWallet, amount: winnerAmount, txSignature: 'SIM' });
    } else {
      simTransfers.push({ type: 'winner', wallet: winnerWallet, amount: 0, txSignature: 'SIM', skipped: true, reason: 'insufficient_memeya_balance' });
    }
    for (let i = 0; i < randomVoters.length; i++) {
      simTransfers.push({ type: 'voter', wallet: randomVoters[i], amount: voterAmounts[i], txSignature: 'SIM' });
    }

    await recordDistribution(drawId, {
      status: 'simulated',
      balance: usdcBalance,
      winnerWallet,
      winnerQualified,
      ...(!winnerQualified && { winnerSkipped: true, winnerSkipReason: 'insufficient_memeya_balance' }),
      memeId,
      transfers: simTransfers,
      errors: [],
      randomVoters,
      calculatedAmounts: {
        winner: winnerQualified ? winnerAmount : 0,
        voter1: VOTER_1_REWARD,
        voter2: VOTER_2_REWARD,
        total: (winnerQualified ? winnerAmount : 0) + VOTER_1_REWARD + VOTER_2_REWARD
      }
    });

    // Send TG simulation report
    const voterLines = randomVoters.map((v, i) =>
      `  Voter ${i + 1}: \`${v.slice(0, 4)}…${v.slice(-4)}\` → $${voterAmounts[i].toFixed(2)}`
    ).join('\n');
    await sendTgAlert(
      `🧪 *Reward Simulation* (draw ${drawId})\n` +
      `Balance: $${usdcBalance.toFixed(2)} USDC\n` +
      `Winner: \`${winnerWallet.slice(0, 4)}…${winnerWallet.slice(-4)}\` → $${(winnerQualified ? winnerAmount : 0).toFixed(2)}${!winnerQualified ? ' (SKIPPED — <10K $Memeya)' : ''}\n` +
      voterLines +
      `\nTotal: $${((winnerQualified ? winnerAmount : 0) + VOTER_1_REWARD + VOTER_2_REWARD).toFixed(2)}\n` +
      `_No actual transfers made — simulation mode_`
    );

    console.log(`🧪 Simulation recorded for draw ${drawId}`);
    return { drawId, status: 'simulated', transfers: simTransfers.length, errors: 0 };
  }

  // 7b. Execute real transfers
  const transfers = [];
  const errors = [];

  // Winner transfer (skip if not qualified by $Memeya holding)
  if (winnerQualified) {
    try {
      const result = await crossmintService.sendUsdc(winnerWallet, winnerAmount);
      transfers.push({
        type: 'winner',
        wallet: winnerWallet,
        amount: winnerAmount,
        txSignature: result.txSignature
      });
      remaining -= winnerAmount;
      console.log(`✅ Winner reward: $${winnerAmount} → ${winnerWallet}`);
    } catch (err) {
      console.error(`❌ Winner transfer failed:`, err.message);
      errors.push({ type: 'winner', wallet: winnerWallet, error: err.message });
    }
  } else {
    console.log(`⏭️ Winner $3 skipped — ${winnerWallet} holds < ${MEMEYA_THRESHOLD} $Memeya`);
    transfers.push({
      type: 'winner',
      wallet: winnerWallet,
      amount: 0,
      skipped: true,
      reason: 'insufficient_memeya_balance'
    });
  }

  // Voter transfers — only if winner succeeded and balance remains
  for (let i = 0; i < randomVoters.length; i++) {
    const voter = randomVoters[i];
    const amt = voterAmounts[i];
    if (remaining < amt) {
      console.log(`⚠️ Insufficient remaining balance ($${remaining}) for voter ${i + 1}, skipping`);
      errors.push({ type: 'voter', wallet: voter, error: 'insufficient_balance' });
      continue;
    }

    try {
      const result = await crossmintService.sendUsdc(voter, amt);
      transfers.push({
        type: 'voter',
        wallet: voter,
        amount: amt,
        txSignature: result.txSignature
      });
      remaining -= amt;
      console.log(`✅ Voter ${i + 1} reward: $${amt} → ${voter}`);
    } catch (err) {
      console.error(`❌ Voter transfer failed for ${voter}:`, err.message);
      errors.push({ type: 'voter', wallet: voter, error: err.message });
    }
  }

  // 8. Record to Firestore
  const distStatus = errors.length === 0 ? 'completed' :
    transfers.length === 0 ? 'failed' : 'partial';

  await recordDistribution(drawId, {
    status: distStatus,
    balance: usdcBalance,
    winnerWallet,
    winnerQualified,
    ...(!winnerQualified && { winnerSkipped: true, winnerSkipReason: 'insufficient_memeya_balance' }),
    memeId,
    transfers,
    errors,
    randomVoters,
    calculatedAmounts: {
      winner: winnerQualified ? winnerAmount : 0,
      voter1: VOTER_1_REWARD,
      voter2: VOTER_2_REWARD,
      total: (winnerQualified ? winnerAmount : 0) + VOTER_1_REWARD + VOTER_2_REWARD
    }
  });

  console.log(`💰 Reward distribution ${distStatus} for draw ${drawId}: ${transfers.length} transfers, ${errors.length} errors`);

  return { drawId, status: distStatus, transfers: transfers.length, errors: errors.length };
}

// ==================== Helpers ====================

/**
 * Select N random voters from today's votes, excluding the winner.
 * Uses Fisher-Yates shuffle with crypto-safe randomness.
 */
async function selectRandomVoters(drawId, excludeWallet, count) {
  const db = getFirestore();
  const today = drawId; // drawId is YYYY-MM-DD

  const votesSnap = await db.collection(collections.VOTES)
    .where('date', '==', today)
    .get();

  // Collect unique voter wallets, excluding winner
  const voterSet = new Set();
  votesSnap.forEach(doc => {
    const data = doc.data();
    const wallet = data.walletAddress || data.wallet || doc.id.split('_')[0];
    if (wallet && wallet !== excludeWallet) {
      voterSet.add(wallet);
    }
  });

  // Filter by $Memeya holding (10K required for USDC rewards)
  const MEMEYA_THRESHOLD = 10000;
  const walletArray = Array.from(voterSet);
  const qualifiedVoters = [];
  if (walletArray.length > 0) {
    const userRefs = walletArray.map(w => db.collection(collections.USERS).doc(w));
    const userDocs = await db.getAll(...userRefs);
    userDocs.forEach((doc, idx) => {
      if (doc.exists && (doc.data().memeyaBalance || 0) >= MEMEYA_THRESHOLD) {
        qualifiedVoters.push(walletArray[idx]);
      }
    });
  }

  console.log(`🗳️ Voters: ${voterSet.size} total, ${qualifiedVoters.length} qualified (≥${MEMEYA_THRESHOLD} $Memeya)`);

  const voters = qualifiedVoters;

  if (voters.length === 0) {
    console.log('⚠️ No eligible voters found for random selection (none hold ≥10K $Memeya)');
    return [];
  }

  // Fisher-Yates shuffle with crypto-safe randomness
  for (let i = voters.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [voters[i], voters[j]] = [voters[j], voters[i]];
  }

  return voters.slice(0, count);
}

/**
 * Record distribution to Firestore
 */
async function recordDistribution(drawId, data) {
  await dbUtils.setDocument(collections.REWARD_DISTRIBUTIONS, drawId, {
    drawId,
    timestamp: new Date().toISOString(),
    ...data
  });
}

/**
 * Get recent reward distributions
 */
async function getHistory(limit = 20) {
  const db = getFirestore();
  const snap = await db.collection(collections.REWARD_DISTRIBUTIONS)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snap.docs
    .filter(doc => doc.id !== 'config')
    .map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a specific distribution by drawId
 */
async function getDistribution(drawId) {
  return dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, drawId);
}

module.exports = {
  distributeRewards,
  getHistory,
  getDistribution,
  config: { MIN_BALANCE, LOW_BALANCE_ALERT, WINNER_REWARD, VOTER_1_REWARD, VOTER_2_REWARD, TOTAL_PAYOUT }
};
