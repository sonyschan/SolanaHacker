const express = require('express');
const router = express.Router();
const rewardService = require('../services/rewardService');
const crossmintService = require('../services/crossmintService');
const { cacheResponse, TTL } = require('../utils/cache');
const { collections, dbUtils } = require('../config/firebase');

/**
 * @route GET /api/rewards/balance
 * @desc Wallet USDC/SOL balance + config thresholds
 */
router.get('/balance', cacheResponse('rewards:balance', TTL.LONG), async (req, res) => {
  try {
    const balances = await crossmintService.getWalletBalances();
    const address = await crossmintService.getWalletAddress();

    res.json({
      success: true,
      data: {
        address,
        usdc: balances.usdc,
        sol: balances.sol,
        thresholds: {
          minDistribution: rewardService.config.MIN_BALANCE,
          lowBalanceAlert: rewardService.config.LOW_BALANCE_ALERT
        },
        rewards: {
          winner: rewardService.config.WINNER_REWARD,
          voter1: rewardService.config.VOTER_1_REWARD,
          voter2: rewardService.config.VOTER_2_REWARD,
          total: rewardService.config.TOTAL_PAYOUT
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

    const allowedFields = ['status', 'transfers', 'errors', 'randomVoters', 'winnerWallet', 'memeId'];
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
