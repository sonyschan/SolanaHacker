const express = require('express');
const router = express.Router();
const rewardService = require('../services/rewardService');
const crossmintService = require('../services/crossmintService');
const baseService = require('../services/baseService');
const { cacheResponse, TTL } = require('../utils/cache');
const { collections, dbUtils, getFirestore } = require('../config/firebase');

/**
 * @route GET /api/rewards/latest-unannounced
 * @desc Most recent completed distribution not yet announced on X
 */
router.get('/latest-unannounced', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection(collections.REWARD_DISTRIBUTIONS)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    // Find first completed doc that hasn't been announced (client-side filter to avoid composite index)
    let dist = null;
    for (const doc of snap.docs) {
      if (doc.id === 'config') continue;
      const data = { id: doc.id, ...doc.data() };
      if (data.status === 'completed' && data.xAnnounced !== true) {
        dist = data;
        break;
      }
    }

    if (!dist) {
      return res.json({ success: true, data: null });
    }

    // Enrich with meme imageUrl and title
    let memeImageUrl = null;
    let memeTitle = null;
    if (dist.memeId) {
      const meme = await dbUtils.getDocument(collections.MEMES, dist.memeId);
      if (meme) {
        memeImageUrl = meme.imageUrl || null;
        memeTitle = meme.title || null;
      }
    }

    res.json({
      success: true,
      data: { ...dist, memeImageUrl, memeTitle }
    });
  } catch (error) {
    console.error('❌ Error fetching latest unannounced distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest unannounced distribution',
      message: error.message
    });
  }
});

/**
 * @route GET /api/rewards/balance
 * @desc Wallet USDC/SOL balance + config thresholds
 */
router.get('/balance', cacheResponse('rewards:balance', TTL.LONG), async (req, res) => {
  try {
    // Fetch Solana + Base balances in parallel
    const [solanaBalances, solanaAddress, baseUsdc] = await Promise.all([
      crossmintService.getWalletBalances(),
      crossmintService.getWalletAddress(),
      baseService.getUsdcBalance().catch(e => {
        console.warn('⚠️ Base balance fetch failed:', e.message);
        return null;
      })
    ]);

    res.json({
      success: true,
      data: {
        address: solanaAddress,
        usdc: solanaBalances.usdc,
        sol: solanaBalances.sol,
        base: {
          address: baseService.MEMEYA_BASE_WALLET,
          usdc: baseUsdc
        },
        thresholds: {
          minDistribution: rewardService.config.MIN_BALANCE,
          lowBalanceAlert: rewardService.config.LOW_BALANCE_ALERT
        },
        rewards: {
          winnerPct: rewardService.config.WINNER_REWARD_PCT,
          voter1Pct: rewardService.config.VOTER_1_REWARD_PCT,
          voter2Pct: rewardService.config.VOTER_2_REWARD_PCT,
          totalPct: rewardService.config.TOTAL_PAYOUT_PCT,
          projected: (() => {
            const w = +(solanaBalances.usdc * rewardService.config.WINNER_REWARD_PCT).toFixed(2);
            const v1 = +(solanaBalances.usdc * rewardService.config.VOTER_1_REWARD_PCT).toFixed(2);
            const v2 = +(solanaBalances.usdc * rewardService.config.VOTER_2_REWARD_PCT).toFixed(2);
            return { winner: w, voter1: v1, voter2: v2, total: +(w + v1 + v2).toFixed(2) };
          })()
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance',
      message: error.message
    });
  }
});

/**
 * @route GET /api/rewards/history
 * @desc Recent reward distributions
 */
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const history = await rewardService.getHistory(limit);

    res.json({
      success: true,
      data: {
        distributions: history,
        count: history.length,
        retrievedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reward history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reward history',
      message: error.message
    });
  }
});

/**
 * @route GET /api/rewards/config
 * @desc Get reward distribution enabled/disabled flag
 */
router.get('/config', async (req, res) => {
  try {
    const doc = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, 'config');
    const rewardEnabled = doc?.rewardEnabled !== false; // default true
    res.json({ success: true, data: { rewardEnabled } });
  } catch (error) {
    console.error('❌ Error fetching reward config:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reward config', message: error.message });
  }
});

/**
 * @route POST /api/rewards/config
 * @desc Toggle reward distribution on/off
 */
router.post('/config', async (req, res) => {
  try {
    const doc = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, 'config');
    const current = doc?.rewardEnabled !== false;
    const rewardEnabled = !current;
    await dbUtils.setDocument(collections.REWARD_DISTRIBUTIONS, 'config', {
      rewardEnabled,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, data: { rewardEnabled } });
  } catch (error) {
    console.error('❌ Error toggling reward config:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle reward config', message: error.message });
  }
});

/**
 * @route PATCH /api/rewards/:drawId
 * @desc Admin: manually fix a reward distribution record (e.g. add missing txSignature)
 */
router.patch('/:drawId', async (req, res) => {
  try {
    const { drawId } = req.params;
    const existing = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, drawId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Distribution not found' });
    }

    const allowedFields = ['status', 'transfers', 'errors', 'randomVoters', 'winnerWallet', 'memeId', 'xAnnounced'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: `No valid fields. Allowed: ${allowedFields.join(', ')}` });
    }

    updates.updatedAt = new Date().toISOString();
    await dbUtils.updateDocument(collections.REWARD_DISTRIBUTIONS, drawId, updates);
    const updated = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, drawId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(`❌ Reward distribution update failed for ${req.params.drawId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/rewards/:drawId
 * @desc Specific distribution details
 */
router.get('/:drawId', async (req, res) => {
  try {
    const { drawId } = req.params;
    const distribution = await rewardService.getDistribution(drawId);

    if (!distribution) {
      return res.status(404).json({
        success: false,
        error: 'Distribution not found',
        drawId
      });
    }

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('❌ Error fetching distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch distribution',
      message: error.message
    });
  }
});

module.exports = router;
