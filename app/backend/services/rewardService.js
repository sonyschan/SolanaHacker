/**
 * Reward Distribution Service
 *
 * Distributes USDC rewards after daily lottery:
 * - 10% of wallet USDC to meme winner
 * - 7% to lucky draw voter 1
 * - 4% to lucky draw voter 2
 * - Skip if balance < $1; alert TG dev group if < $10
 *
 * All distributions are idempotent (keyed by drawId) and recorded in Firestore.
 */

const crypto = require('crypto');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const crossmintService = require('./crossmintService');
const { getMemeyaBalance } = require('./solanaService');

const WINNER_REWARD_PCT = 0.10;    // 10% of wallet USDC to meme winner
const VOTER_1_REWARD_PCT = 0.07;   // 7% to lucky draw voter 1
const VOTER_2_REWARD_PCT = 0.04;   // 4% to lucky draw voter 2
const TOTAL_PAYOUT_PCT = 0.21;   // 10% + 7% + 4%
const MIN_BALANCE = 1;             // Skip distribution if wallet < $1
const LOW_BALANCE_ALERT = 10; // TG alert threshold

// Referral program constants (single-level only)
const REFERRAL_BONUS_PCT = 0.20;          // 20% extra for referred winners
const REFERRER_REWARD_PCT = 0.10;         // 10% of base to referrer
const REFERRER_MEMEYA_THRESHOLD = 50000;  // 50K $Memeya "Elite User"

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

  const winnerAmount = +(usdcBalance * WINNER_REWARD_PCT).toFixed(2);
  const voterAmounts = [
    +(usdcBalance * VOTER_1_REWARD_PCT).toFixed(2),
    +(usdcBalance * VOTER_2_REWARD_PCT).toFixed(2)
  ];
  let remaining = usdcBalance - (winnerQualified ? winnerAmount : 0);

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

    const simTotal = (winnerQualified ? winnerAmount : 0) + voterAmounts[0] + voterAmounts[1];
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
        walletBalance: usdcBalance,
        winnerPct: WINNER_REWARD_PCT,
        voter1Pct: VOTER_1_REWARD_PCT,
        voter2Pct: VOTER_2_REWARD_PCT,
        winner: winnerQualified ? winnerAmount : 0,
        voter1: voterAmounts[0],
        voter2: voterAmounts[1],
        total: simTotal
      }
    });

    // Send TG simulation report
    const voterLines = randomVoters.map((v, i) =>
      `  Voter ${i + 1}: \`${v.slice(0, 4)}…${v.slice(-4)}\` → $${voterAmounts[i].toFixed(2)}`
    ).join('\n');
    await sendTgAlert(
      `🧪 *Reward Simulation* (draw ${drawId})\n` +
      `Balance: $${usdcBalance.toFixed(2)} USDC\n` +
      `Rates: ${(WINNER_REWARD_PCT * 100)}% / ${(VOTER_1_REWARD_PCT * 100)}% / ${(VOTER_2_REWARD_PCT * 100)}%\n` +
      `Winner: \`${winnerWallet.slice(0, 4)}…${winnerWallet.slice(-4)}\` → $${(winnerQualified ? winnerAmount : 0).toFixed(2)}${!winnerQualified ? ' (SKIPPED — <10K $Memeya)' : ''}\n` +
      voterLines +
      `\nTotal: $${simTotal.toFixed(2)}\n` +
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
    console.log(`⏭️ Winner $${winnerAmount} skipped — ${winnerWallet} holds < ${MEMEYA_THRESHOLD} $Memeya`);
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

  // 8. Process referral bonuses (best-effort — after base transfers)
  const referralPayouts = [];
  const referralErrors = [];
  let referralBonusTotal = 0;

  // Build list of recipients who actually received base payouts
  const paidRecipients = [];
  if (winnerQualified && transfers.find(t => t.type === 'winner' && !t.skipped)) {
    paidRecipients.push({ wallet: winnerWallet, baseAmount: winnerAmount });
  }
  for (let i = 0; i < randomVoters.length; i++) {
    if (transfers.find(t => t.type === 'voter' && t.wallet === randomVoters[i] && !t.skipped)) {
      paidRecipients.push({ wallet: randomVoters[i], baseAmount: voterAmounts[i] });
    }
  }

  for (const { wallet: recipWallet, baseAmount } of paidRecipients) {
    const refResult = await processReferralBonuses(recipWallet, baseAmount, remaining);
    remaining = refResult.remaining;

    // If recipient gets a bonus, send it
    if (refResult.recipientBonus > 0 && remaining >= refResult.recipientBonus) {
      try {
        const bonusResult = await crossmintService.sendUsdc(recipWallet, refResult.recipientBonus);
        referralPayouts.push({
          type: 'referred_bonus',
          wallet: recipWallet,
          amount: refResult.recipientBonus,
          txSignature: bonusResult.txSignature
        });
        remaining -= refResult.recipientBonus;
        referralBonusTotal += refResult.recipientBonus;
        console.log(`✅ Referred bonus: +$${refResult.recipientBonus} → ${recipWallet.slice(0, 4)}...${recipWallet.slice(-4)}`);
        // Update totalReferredBonus only after the recipient transfer succeeds
        try {
          await getFirestore().collection(collections.REFERRALS).doc(recipWallet).update({
            totalReferredBonus: require('firebase-admin').firestore.FieldValue.increment(refResult.recipientBonus)
          });
        } catch (e) {
          console.warn(`⚠️ Failed to update totalReferredBonus for ${recipWallet}:`, e.message);
        }
      } catch (err) {
        console.error(`❌ Referred bonus transfer failed for ${recipWallet}:`, err.message);
        referralErrors.push({ type: 'referred_bonus', wallet: recipWallet, error: err.message });
      }
    }

    referralPayouts.push(...refResult.referralTransfers);
    referralErrors.push(...refResult.referralErrors);
    referralBonusTotal += refResult.referralTransfers.reduce((s, t) => s + t.amount, 0);
  }

  // 9. Record to Firestore
  const allErrors = [...errors, ...referralErrors];
  const distStatus = allErrors.length === 0 ? 'completed' :
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
    referralPayouts,
    referralErrors,
    calculatedAmounts: {
      walletBalance: usdcBalance,
      winnerPct: WINNER_REWARD_PCT,
      voter1Pct: VOTER_1_REWARD_PCT,
      voter2Pct: VOTER_2_REWARD_PCT,
      winner: winnerQualified ? winnerAmount : 0,
      voter1: voterAmounts[0],
      voter2: voterAmounts[1],
      referralBonuses: referralBonusTotal,
      total: (winnerQualified ? winnerAmount : 0) + voterAmounts[0] + voterAmounts[1] + referralBonusTotal
    }
  });

  console.log(`💰 Reward distribution ${distStatus} for draw ${drawId}: ${transfers.length} base + ${referralPayouts.length} referral transfers, ${allErrors.length} errors`);

  // 10. TG alert with referral details
  if (referralPayouts.length > 0) {
    const refLines = referralPayouts.map(p =>
      `  ${p.type}: \`${p.wallet.slice(0, 4)}…${p.wallet.slice(-4)}\` → $${p.amount.toFixed(2)}`
    ).join('\n');
    await sendTgAlert(
      `🤝 *Referral Bonuses* (draw ${drawId})\n` +
      refLines +
      `\nTotal referral: $${referralBonusTotal.toFixed(2)}`
    );
  }

  return { drawId, status: distStatus, transfers: transfers.length + referralPayouts.length, errors: allErrors.length };
}

// ==================== Referral Logic ====================

/**
 * Look up direct referrer for a wallet.
 * Returns referrer wallet address or null.
 */
async function getReferrer(wallet) {
  const doc = await dbUtils.getDocument(collections.REFERRALS, wallet);
  return doc ? doc.referrerWallet : null;
}

/**
 * Process referral bonus for a single reward recipient (single-level).
 * Returns { recipientBonus, referralTransfers[], referralErrors[], remaining }
 */
async function processReferralBonuses(recipientWallet, baseAmount, remaining) {
  const referralTransfers = [];
  const referralErrors = [];
  let recipientBonus = 0;
  let localRemaining = remaining;

  try {
    const referrer = await getReferrer(recipientWallet);
    if (!referrer) return { recipientBonus: 0, referralTransfers: [], referralErrors: [], remaining: localRemaining };

    // Check referrer's $Memeya balance (fresh RPC)
    let refBalance = 0;
    try {
      refBalance = await getMemeyaBalance(referrer);
      await dbUtils.setDocument(collections.USERS, referrer, {
        memeyaBalance: refBalance,
        memeyaBalanceUpdatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn(`⚠️ RPC failed for referrer ${referrer.slice(0, 4)}...${referrer.slice(-4)}: ${err.message}`);
    }

    if (refBalance < REFERRER_MEMEYA_THRESHOLD) {
      console.log(`⏭️ Referrer ${referrer.slice(0, 4)}...${referrer.slice(-4)} holds ${refBalance.toLocaleString()} $Memeya (need ${REFERRER_MEMEYA_THRESHOLD}) — no referral bonuses`);
      return { recipientBonus: 0, referralTransfers: [], referralErrors: [], remaining: localRemaining };
    }

    // Referrer is Elite → recipient gets 20% bonus
    recipientBonus = +(baseAmount * REFERRAL_BONUS_PCT).toFixed(2);

    // Referrer gets 10% of base
    const refReward = +(baseAmount * REFERRER_REWARD_PCT).toFixed(2);
    if (refReward > 0 && localRemaining >= refReward) {
      try {
        const result = await crossmintService.sendUsdc(referrer, refReward);
        referralTransfers.push({
          type: 'referrer_bonus',
          wallet: referrer,
          amount: refReward,
          txSignature: result.txSignature,
          triggeredBy: recipientWallet
        });
        localRemaining -= refReward;
        console.log(`✅ Referrer bonus: $${refReward} → ${referrer.slice(0, 4)}...${referrer.slice(-4)} (from ${recipientWallet.slice(0, 4)}...${recipientWallet.slice(-4)})`);

        // Update referral doc earnings
        const db = getFirestore();
        await db.collection(collections.REFERRALS).doc(recipientWallet).update({
          totalReferrerEarnings: require('firebase-admin').firestore.FieldValue.increment(refReward),
          lastRewardAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`❌ Referrer transfer failed for ${referrer}:`, err.message);
        referralErrors.push({ type: 'referrer_bonus', wallet: referrer, error: err.message });
      }
    } else if (refReward > 0) {
      console.log(`⚠️ Insufficient balance ($${localRemaining}) for referrer bonus $${refReward} — skipping`);
    }
  } catch (err) {
    console.error(`❌ Referral bonus processing failed for ${recipientWallet}:`, err.message);
    referralErrors.push({ type: 'referral_processing', wallet: recipientWallet, error: err.message });
  }

  return { recipientBonus, referralTransfers, referralErrors, remaining: localRemaining };
}

// ==================== Helpers ====================

/**
 * Select N random voters from today's votes, excluding the winner.
 * Uses Fisher-Yates shuffle with crypto-safe randomness.
 */
async function selectRandomVoters(drawId, excludeWallet, count) {
  const db = getFirestore();
  const today = drawId; // drawId is YYYY-MM-DD

  // Votes store ISO timestamp, not date — use range query to match the day
  const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
  const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
  const votesSnap = await db.collection(collections.VOTES)
    .where('timestamp', '>=', startOfDay)
    .where('timestamp', '<=', endOfDay)
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
  // Always refresh on-chain at draw time — cached balances may be stale (user could have sold)
  const MEMEYA_THRESHOLD = 10000;
  const walletArray = Array.from(voterSet);
  const qualifiedVoters = [];
  for (const wallet of walletArray) {
    try {
      const balance = await getMemeyaBalance(wallet);
      // Cache the fresh balance
      await dbUtils.setDocument(collections.USERS, wallet, {
        memeyaBalance: balance,
        memeyaBalanceUpdatedAt: new Date().toISOString()
      });
      if (balance >= MEMEYA_THRESHOLD) {
        qualifiedVoters.push(wallet);
        console.log(`✅ Voter ${wallet.slice(0, 4)}...${wallet.slice(-4)}: ${balance.toLocaleString()} $Memeya — qualified`);
      } else {
        console.log(`❌ Voter ${wallet.slice(0, 4)}...${wallet.slice(-4)}: ${balance.toLocaleString()} $Memeya — below ${MEMEYA_THRESHOLD}`);
      }
    } catch (rpcErr) {
      console.warn(`⚠️ RPC failed for ${wallet.slice(0, 4)}...${wallet.slice(-4)}: ${rpcErr.message} — skipping`);
    }
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
  config: { MIN_BALANCE, LOW_BALANCE_ALERT, WINNER_REWARD_PCT, VOTER_1_REWARD_PCT, VOTER_2_REWARD_PCT, TOTAL_PAYOUT_PCT, REFERRAL_BONUS_PCT, REFERRER_REWARD_PCT, REFERRER_MEMEYA_THRESHOLD }
};
