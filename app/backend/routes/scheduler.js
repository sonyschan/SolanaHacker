const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

/**
 * @route GET /api/scheduler/status
 * @desc Get scheduler status
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
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/scheduler/trigger/:taskName
 * @desc Trigger a scheduled task
 */
router.post('/trigger/:taskName', async (req, res) => {
  try {
    const { taskName } = req.params;
    const { reason } = req.body;

    const validTasks = [
      'daily_cycle',
      'daily_memes',
      'ai_judge',
      'meme_review',
      'evolution_cycle'
    ];

    if (!validTasks.includes(taskName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task name',
        validTasks
      });
    }

    console.log(`🔧 Manual trigger requested for task: ${taskName}`);
    if (reason) console.log(`📝 Reason: ${reason}`);

    // Evolution cycle runs its own service
    if (taskName === 'evolution_cycle') {
      const { runEvolutionCycle } = require('../services/evolutionService');
      const result = await runEvolutionCycle();
      return res.json({
        success: result.success,
        data: result,
        message: result.summary,
        taskName,
        triggeredAt: new Date().toISOString(),
      });
    }

    const result = await schedulerService.triggerTask(taskName, { date: req.body.date });

    res.json({
      success: true,
      data: result,
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
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/scheduler/health
 * @desc Scheduler health check
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
      error: error.message
    });
  }
});

module.exports = router;
