const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');
const rarityService = require('../services/rarityService');

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
      'voting_progress',
      'reward_distribution'
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
 * @route POST /api/scheduler/recover/:date
 * @desc Recover a failed lottery draw for a specific date (YYYY-MM-DD)
 * @access Admin only
 */
router.post('/recover/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    console.log(`🔧 Recovery requested for date: ${date}`);

    const result = await schedulerService.recoverDraw(date);

    res.json({
      success: true,
      data: result,
      message: result.skipped ? 'Draw already completed' : `Recovery ${result.error ? 'failed' : 'completed'} for ${date}`
    });

  } catch (error) {
    console.error(`❌ Recovery failed for ${req.params.date}:`, error);
    res.status(500).json({
      success: false,
      error: 'Recovery failed',
      message: error.message
    });
  }
});

/**
 * @route PATCH /api/scheduler/draw/:date
 * @desc Update specific fields on a lottery draw record
 * @access Admin only
 */
router.patch('/draw/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const allowedFields = ['winnerTickets', 'totalTickets', 'totalParticipants'];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: `No valid fields. Allowed: ${allowedFields.join(', ')}`
      });
    }

    const { dbUtils, collections } = require('../config/firebase');
    const existing = await dbUtils.getDocument(collections.LOTTERY_DRAWS, date);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    await dbUtils.updateDocument(collections.LOTTERY_DRAWS, date, updates);
    const updated = await dbUtils.getDocument(collections.LOTTERY_DRAWS, date);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(`❌ Draw update failed for ${req.params.date}:`, error);
    res.status(500).json({ success: false, error: error.message });
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

/**
 * @route POST /api/scheduler/backfill-rarity
 * @desc Recalculate finalRarity for all memes using percentile-based system
 * @access Admin only
 */
router.post('/backfill-rarity', async (req, res) => {
  try {
    const dryRun = req.body.dryRun === true;
    const { getFirestore, collections } = require('../config/firebase');
    const db = getFirestore();

    console.log(`🔄 Backfilling meme rarity${dryRun ? ' (DRY RUN)' : ''}...`);

    const snapshot = await db.collection(collections.MEMES).get();
    let updated = 0, skipped = 0, noScore = 0;
    const changes = [];

    for (const doc of snapshot.docs) {
      const meme = doc.data();
      const avgScore = meme.rarity?.averageScore;

      if (typeof avgScore !== 'number' || avgScore <= 0) {
        noScore++;
        continue;
      }

      const result = await rarityService.calculateRarity(avgScore);
      const newRarity = result.rarity.toLowerCase();
      const oldRarity = (meme.finalRarity || '').toLowerCase();

      if (newRarity === oldRarity) {
        skipped++;
        continue;
      }

      changes.push({
        id: doc.id,
        title: (meme.title || '').slice(0, 40),
        avgScore,
        percentile: result.percentile,
        method: result.method,
        old: oldRarity || '(none)',
        new: newRarity,
      });

      if (!dryRun) {
        await db.collection(collections.MEMES).doc(doc.id).update({
          finalRarity: newRarity,
        });
      }
      updated++;
    }

    console.log(`✅ Backfill done: ${updated} updated, ${skipped} unchanged, ${noScore} no score`);

    res.json({
      success: true,
      dryRun,
      updated,
      skipped,
      noScore,
      total: snapshot.size,
      changes,
    });
  } catch (error) {
    console.error('❌ Backfill rarity failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;