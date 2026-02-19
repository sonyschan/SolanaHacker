const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

/**
 * @route GET /api/scheduler/status
 * @desc Get scheduler status and active tasks
 * @access Public (for monitoring)
 */
router.get('/status', async (req, res) => {
  try {
    const status = await schedulerService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        serverTime: new Date().toISOString(),
        timezone: 'UTC'
      }
    });
  } catch (error) {
    console.error('❌ Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      message: error.message
    });
  }
});

/**
 * @route POST /api/scheduler/trigger/:taskName
 * @desc Manually trigger a scheduled task
 * @access Admin only (add auth middleware in production)
 */
router.post('/trigger/:taskName', async (req, res) => {
  try {
    const { taskName } = req.params;
    const { reason } = req.body;
    
    // Validate task name
    const validTasks = [
      'daily_cycle',
      'daily_memes',
      'start_voting', 
      'end_voting',
      'lottery_draw',
      'cleanup',
      'voting_progress'
    ];
    
    if (!validTasks.includes(taskName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task name',
        validTasks
      });
    }

    console.log(`🔧 Manual trigger requested for task: ${taskName}`);
    if (reason) {
      console.log(`📝 Reason: ${reason}`);
    }

    await schedulerService.triggerTask(taskName);
    
    res.json({
      success: true,
      message: `Task '${taskName}' triggered successfully`,
      taskName,
      triggeredAt: new Date().toISOString(),
      reason: reason || 'Manual trigger'
    });
    
  } catch (error) {
    console.error(`❌ Manual trigger failed for task ${req.params.taskName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger task',
      message: error.message,
      taskName: req.params.taskName
    });
  }
});

/**
 * @route GET /api/scheduler/logs
 * @desc Get recent scheduler task logs
 * @access Public
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const { dbUtils } = require('../config/firebase');
    
    const logs = await dbUtils.queryWithOrderAndLimit(
      'scheduler_logs',
      'timestamp',
      'desc',
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
        retrievedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching scheduler logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler logs',
      message: error.message
    });
  }
});

/**
 * @route GET /api/scheduler/voting-progress
 * @desc Get voting progress for current period
 * @access Public
 */
router.get('/voting-progress', async (req, res) => {
  try {
    const { dbUtils } = require('../config/firebase');
    const today = new Date().toISOString().split('T')[0];
    
    // Get current voting period
    const votingPeriods = await dbUtils.queryDocuments('voting_periods', [
      { field: 'date', operator: '==', value: today },
      { field: 'status', operator: '==', value: 'active' }
    ]);
    
    if (votingPeriods.length === 0) {
      return res.json({
        success: true,
        data: {
          hasActiveVoting: false,
          message: 'No active voting period today'
        }
      });
    }
    
    const currentPeriod = votingPeriods[0];
    
    // Get progress logs for this period
    const progressLogs = await dbUtils.queryWithOrderAndLimit(
      'voting_progress',
      'timestamp',
      'desc',
      10,
      [{ field: 'votingPeriodId', operator: '==', value: currentPeriod.id }]
    );
    
    res.json({
      success: true,
      data: {
        hasActiveVoting: true,
        votingPeriod: currentPeriod,
        progressLogs,
        lastUpdate: progressLogs[0]?.timestamp || null
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching voting progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voting progress',
      message: error.message
    });
  }
});

/**
 * @route GET /api/scheduler/health
 * @desc Detailed scheduler health check
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const status = await schedulerService.getStatus();

    res.status(200).json({
      success: true,
      health: 'healthy',
      mode: status.mode,
      serverTime: new Date().toISOString(),
      currentUTCHour: new Date().getUTCHours(),
      note: status.note
    });

  } catch (error) {
    console.error('❌ Scheduler health check failed:', error);
    res.status(503).json({
      success: false,
      health: 'unhealthy',
      error: error.message,
      recommendations: [
        'Check environment variables',
        'Verify Firebase configuration'
      ]
    });
  }
});

module.exports = router;