const express = require('express');
const router = express.Router();
const {
  runDailyLottery,
  toggleLotteryOptIn,
  getCurrentLottery,
  getLotteryHistory,
  getLotteryStats,
  getNextDrawTime,
  getUserLotteryData,
  getRecentWinners
} = require('../controllers/lotteryController');
const { getFirestore, collections } = require('../config/firebase');
const { rateLimiter } = require('../middleware/auth');

/**
 * GET /api/lottery/recent-winners - Get recent completed draws with meme details
 */
router.get('/recent-winners', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await getRecentWinners(parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get recent winners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent winners', message: error.message });
  }
});

/**
 * GET /api/lottery/current - Get today's lottery status
 */
router.get('/current', async (req, res) => {
  try {
    const data = await getCurrentLottery();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get current lottery error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch current lottery', message: error.message });
  }
});

/**
 * GET /api/lottery/history - Get lottery draw history
 */
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await getLotteryHistory({ page: parseInt(page), limit: parseInt(limit) });
    res.json({ success: true, data, meta: { page: parseInt(page), limit: parseInt(limit), total: data.length } });
  } catch (error) {
    console.error('Get lottery history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lottery history', message: error.message });
  }
});

/**
 * POST /api/lottery/draw - Execute daily lottery draw (Cron/Admin only)
 */
router.post('/draw', rateLimiter, async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid cron token' });
    }

    const result = await runDailyLottery();
    res.json({ success: true, data: result, message: `Daily lottery draw: ${result.status || 'done'}` });
  } catch (error) {
    console.error('Execute lottery draw error:', error);
    res.status(500).json({ success: false, error: 'Failed to execute lottery draw', message: error.message });
  }
});

/**
 * GET /api/lottery/stats - Get lottery statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const data = await getLotteryStats();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get lottery stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lottery statistics', message: error.message });
  }
});

/**
 * GET /api/lottery/pool - Get current prize pool / participant info
 */
router.get('/pool', async (req, res) => {
  try {
    const data = await getLotteryStats();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get prize pool error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prize pool information', message: error.message });
  }
});

/**
 * GET /api/lottery/winners/:drawId - Get draw result by date (YYYY-MM-DD)
 */
router.get('/winners/:drawId', async (req, res) => {
  try {
    const { drawId } = req.params;
    const db = getFirestore();
    const doc = await db.collection(collections.LOTTERY_DRAWS).doc(drawId).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Get lottery winners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lottery winners', message: error.message });
  }
});

/**
 * GET /api/lottery/user/:wallet - Get user's lottery participation
 */
router.get('/user/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const data = await getUserLotteryData(wallet);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get user lottery data error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user lottery data', message: error.message });
  }
});

/**
 * GET /api/lottery/countdown - Countdown to next daily draw (23:56 UTC)
 */
router.get('/countdown', async (req, res) => {
  try {
    const nextDraw = new Date(getNextDrawTime());
    const now = new Date();
    const timeRemaining = nextDraw.getTime() - now.getTime();

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    res.json({
      success: true,
      data: {
        nextDrawDate: nextDraw.toISOString(),
        timeRemaining: { total: timeRemaining, hours, minutes, seconds },
        formatted: `${hours}h ${minutes}m ${seconds}s`
      }
    });
  } catch (error) {
    console.error('Get lottery countdown error:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate countdown', message: error.message });
  }
});

/**
 * POST /api/lottery/toggle-opt-in - Toggle lottery participation
 * Body: { walletAddress: string, optIn: boolean }
 */
router.post('/toggle-opt-in', async (req, res) => {
  try {
    const { walletAddress, optIn } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'walletAddress required' });
    }

    const result = await toggleLotteryOptIn(walletAddress, optIn);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Toggle lottery opt-in error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle lottery opt-in', message: error.message });
  }
});

module.exports = router;
