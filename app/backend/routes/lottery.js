const express = require('express');
const router = express.Router();
const { getCurrentLottery, getLotteryHistory, drawLottery, getLotteryStats } = require('../controllers/lotteryController');
const { authenticateUser, rateLimiter } = require('../middleware/auth');

/**
 * GET /api/lottery/current - Get current week's lottery information
 */
router.get('/current', async (req, res) => {
  try {
    const currentLottery = await getCurrentLottery();
    
    res.json({
      success: true,
      data: currentLottery
    });
  } catch (error) {
    console.error('Get current lottery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current lottery',
      message: error.message
    });
  }
});

/**
 * GET /api/lottery/history - Get lottery draw history
 */
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const history = await getLotteryHistory({
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: history,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length
      }
    });
  } catch (error) {
    console.error('Get lottery history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lottery history',
      message: error.message
    });
  }
});

/**
 * POST /api/lottery/draw - Execute weekly lottery draw (Admin/Cron only)
 */
router.post('/draw', rateLimiter, async (req, res) => {
  try {
    // Verify this is a legitimate draw request (from Cloud Scheduler)
    const { authorization } = req.headers;
    const { drawDate, forceExecute = false } = req.body;
    
    if (!authorization || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid cron token'
      });
    }
    
    // Execute lottery draw
    const drawResult = await drawLottery({
      drawDate: drawDate || new Date().toISOString(),
      forceExecute
    });
    
    res.json({
      success: true,
      data: drawResult,
      message: `Weekly lottery draw completed! 🎊 ${drawResult.winnersCount} winners selected.`
    });
  } catch (error) {
    console.error('Execute lottery draw error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute lottery draw',
      message: error.message
    });
  }
});

/**
 * GET /api/lottery/stats - Get lottery statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { timeframe = '90d' } = req.query; // 30d, 90d, 6m, 1y, all
    
    const stats = await getLotteryStats(timeframe);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get lottery stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lottery statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/lottery/pool - Get current prize pool information
 */
router.get('/pool', async (req, res) => {
  try {
    const poolInfo = await getPrizePoolInfo();
    
    res.json({
      success: true,
      data: poolInfo
    });
  } catch (error) {
    console.error('Get prize pool error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prize pool information',
      message: error.message
    });
  }
});

/**
 * GET /api/lottery/winners/:drawId - Get winners for specific draw
 */
router.get('/winners/:drawId', async (req, res) => {
  try {
    const { drawId } = req.params;
    
    const winners = await getLotteryWinners(drawId);
    
    if (!winners) {
      return res.status(404).json({
        success: false,
        error: 'Draw not found'
      });
    }
    
    res.json({
      success: true,
      data: winners
    });
  } catch (error) {
    console.error('Get lottery winners error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lottery winners',
      message: error.message
    });
  }
});

/**
 * GET /api/lottery/user/:wallet - Get user's lottery participation
 */
router.get('/user/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const userLottery = await getUserLotteryData(wallet, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: userLottery,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: userLottery.participations?.length || 0
      }
    });
  } catch (error) {
    console.error('Get user lottery data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user lottery data',
      message: error.message
    });
  }
});

/**
 * GET /api/lottery/countdown - Get countdown to next draw
 */
router.get('/countdown', async (req, res) => {
  try {
    const now = new Date();
    const nextSunday = new Date(now);
    
    // Calculate next Sunday at 23:59 UTC
    const daysUntilSunday = (7 - now.getUTCDay()) % 7;
    nextSunday.setUTCDate(now.getUTCDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    nextSunday.setUTCHours(23, 59, 59, 999);
    
    const timeRemaining = nextSunday.getTime() - now.getTime();
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    res.json({
      success: true,
      data: {
        nextDrawDate: nextSunday.toISOString(),
        timeRemaining: {
          total: timeRemaining,
          days,
          hours,
          minutes,
          seconds
        },
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
      }
    });
  } catch (error) {
    console.error('Get lottery countdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate countdown',
      message: error.message
    });
  }
});

module.exports = router;