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
router.get('/balance', cacheResponse('rewards:balance', TTL.SHORT), async (req, res) => {
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
          lowBalanceAlert: rewardService.config.LOW_BALANCE_ALERT,
          minWinnerReward: rewardService.config.MIN_WINNER_REWARD,
          minVoterReward: rewardService.config.MIN_VOTER_REWARD
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
