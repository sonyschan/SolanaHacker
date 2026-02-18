/**
 * Scheduler Service for MemeForge
 *
 * NOTE: Cron scheduling is handled by GCP Cloud Scheduler (external service)
 * This service only contains task execution methods called via API endpoints:
 * POST /api/scheduler/trigger/:taskName
 *
 * GCP Cloud Scheduler Jobs (Asia/Taipei timezone, UTC+8):
 * - memeforge-end-voting:    7:55 AM (23:55 UTC prev day) - End voting & select winner
 * - memeforge-daily-cycle:   8:00 AM (00:00 UTC) - Generate memes + start voting
 * - memeforge-lottery-draw:  Sunday 8:00 PM (12:00 UTC) - Weekly lottery
 */

const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const memeController = require('../controllers/memeController');
const votingController = require('../controllers/votingController');
const lotteryController = require('../controllers/lotteryController');

class SchedulerService {
  constructor() {
    this.isInitialized = true; // Always ready for external triggers
  }

  /**
   * Generate daily memes
   */
  async generateDailyMemes() {
    console.log('🎨 Starting daily meme generation process...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if memes already generated for today (use unfiltered count)
      const existingCount = await this.countTodaysMemes();
      if (existingCount >= 3) {
        console.log(`ℹ️ Daily memes already generated for today (${existingCount} found)`);
        return { alreadyGenerated: true, count: existingCount };
      }

      // Generate memes using the existing controller
      const req = { body: {} };
      let result = null;
      let statusCode = 200;
      const res = {
        json: (data) => { result = data; return data; },
        status: (code) => {
          statusCode = code;
          return { json: (data) => { result = data; return data; } };
        }
      };

      await memeController.generateDailyMemes(req, res);

      // Check if the controller returned an error
      if (statusCode >= 400 || (result && result.success === false)) {
        const errorMsg = result?.message || result?.error || 'Unknown generation error';
        console.error('❌ Meme generation controller returned error:', errorMsg);
        await this.logTaskExecution('daily_memes', 'failed', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Daily memes generated successfully:', result?.message || `${result?.memes?.length || 0} memes`);

      // Log execution
      await this.logTaskExecution('daily_memes', 'success');

      return result;

    } catch (error) {
      console.error('❌ Error in daily meme generation:', error);
      // Only log if not already logged above
      if (!error.message?.includes('generation error')) {
        await this.logTaskExecution('daily_memes', 'failed', error.message);
      }
      throw error;
    }
  }

  /**
   * Start daily voting period
   */
  async startDailyVotingPeriod() {
    console.log('🗳️ Starting daily voting period...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check for existing active voting period to prevent duplicates
      const existingPeriod = await this.getActiveDailyVotingPeriod(today);
      if (existingPeriod) {
        console.log('ℹ️ Active voting period already exists for today, skipping');
        return { skipped: true, reason: 'Voting period already exists', existingPeriodId: existingPeriod.id };
      }

      // Use same query as frontend: orderBy desc, limit 3, status filter
      const memes = await this.getTodaysMemes();

      if (memes.length === 0) {
        console.log('⚠️ No memes found for today, skipping voting period');
        return { skipped: true, reason: 'No memes found' };
      }

      console.log(`📋 Found ${memes.length} memes for voting:`, memes.map(m => m.id));

      // Update memes status to voting_active
      for (const meme of memes) {
        await dbUtils.updateDocument(collections.MEMES, meme.id, {
          status: 'voting_active',
          votingStarted: new Date().toISOString(),
          votingEnds: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        });
      }

      // Create voting period record
      const votingPeriod = {
        id: uuidv4(),
        date: today,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        memeIds: memes.map(m => m.id),
        phase: 'selection'
      };

      await dbUtils.setDocument(collections.VOTING_PERIODS, votingPeriod.id, votingPeriod);
      console.log('✅ Voting period started for', memes.length, 'memes:', memes.map(m => m.id));

      await this.logTaskExecution('start_voting', 'success');
      return { started: true, memeCount: memes.length };

    } catch (error) {
      console.error('❌ Error starting voting period:', error);
      await this.logTaskExecution('start_voting', 'failed', error.message);
      throw error;
    }
  }

  /**
   * End daily voting period and calculate rarity
   */
  async endDailyVotingPeriod() {
    console.log('📊 Ending daily voting period and calculating rarity...');

    try {
      const today = new Date().toISOString().split('T')[0];

      const activePeriod = await this.getActiveDailyVotingPeriod(today);
      if (!activePeriod) {
        console.log('⚠️ No active voting period found for today:', today);
        return { skipped: true, reason: 'No active voting period' };
      }

      console.log(`📋 Found active voting period: ${activePeriod.id} with ${activePeriod.memeIds?.length || 0} memes`);

      // IMPORTANT: Query today's memes using the SAME query as frontend
      // (orderBy generatedAt desc, limit 3, with status filter)
      // This ensures we evaluate the memes users actually see and vote on,
      // not stale IDs from voting period that may reference different memes
      const todaysMemes = await this.getTodaysMemes();
      const memeIds = todaysMemes.length > 0
        ? todaysMemes.map(m => m.id)
        : activePeriod.memeIds;

      if (todaysMemes.length > 0) {
        const periodIds = new Set(activePeriod.memeIds || []);
        const actualIds = new Set(memeIds);
        const mismatch = memeIds.some(id => !periodIds.has(id));
        if (mismatch) {
          console.log('⚠️ Voting period memeIds differ from current today\'s memes!');
          console.log('  Period IDs:', activePeriod.memeIds);
          console.log('  Actual IDs:', memeIds);
        }
      }

      const results = await this.calculateVotingResults(memeIds);
      const winningMeme = this.selectWinningMeme(results);

      // Collect all meme IDs to update (union of period + actual)
      const allMemeIds = [...new Set([...memeIds, ...(activePeriod.memeIds || [])])];

      if (winningMeme) {
        // Winner found — mark winner and losers
        const rarity = this.calculateRarity(winningMeme.votes.rarity);

        await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
          status: 'voting_completed',
          finalRarity: rarity,
          isWinner: true,
          votingCompleted: new Date().toISOString()
        });

        for (const memeId of allMemeIds) {
          if (memeId !== winningMeme.id) {
            try {
              await dbUtils.updateDocument(collections.MEMES, memeId, {
                status: 'voting_completed',
                isWinner: false,
                votingCompleted: new Date().toISOString()
              });
            } catch (updateErr) {
              console.warn(`⚠️ Could not update meme ${memeId} (may not exist):`, updateErr.message);
            }
          }
        }

        console.log(`✅ Voting completed. Winner: ${winningMeme.id} with ${winningMeme.totalYesVotes} yes votes, rarity: ${rarity}`);
      } else {
        // No votes — still mark all memes as completed (no winner)
        console.log('⚠️ No votes cast — marking all memes as voting_completed with no winner');

        for (const memeId of allMemeIds) {
          try {
            await dbUtils.updateDocument(collections.MEMES, memeId, {
              status: 'voting_completed',
              isWinner: false,
              votingCompleted: new Date().toISOString()
            });
          } catch (updateErr) {
            console.warn(`⚠️ Could not update meme ${memeId} (may not exist):`, updateErr.message);
          }
        }
      }

      await dbUtils.updateDocument(collections.VOTING_PERIODS, activePeriod.id, {
        status: 'completed',
        endTime: new Date().toISOString(),
        results: results,
        winnerId: winningMeme?.id || null,
        evaluatedMemeIds: memeIds
      });

      await this.logTaskExecution('end_voting', 'success');
      return { completed: true, winner: winningMeme?.id || null, hadVotes: !!winningMeme };

    } catch (error) {
      console.error('❌ Error ending voting period:', error);
      await this.logTaskExecution('end_voting', 'failed', error.message);
      throw error;
    }
  }

  /**
   * Run weekly lottery
   */
  async runWeeklyLottery() {
    console.log('🎰 Running weekly lottery draw...');

    try {
      const req = { body: {} };
      let result = null;
      const res = {
        json: (data) => { result = data; return data; },
        status: (code) => ({ json: (data) => { result = data; return { ...data, statusCode: code }; } })
      };

      await lotteryController.drawLottery(req, res);
      console.log('✅ Weekly lottery completed:', result);

      await this.logTaskExecution('lottery_draw', 'success');
      return result;

    } catch (error) {
      console.error('❌ Weekly lottery failed:', error);
      await this.logTaskExecution('lottery_draw', 'failed', error.message);
      throw error;
    }
  }

  /**
   * Check voting progress
   */
  async checkVotingProgress() {
    const today = new Date().toISOString().split('T')[0];
    const activePeriod = await this.getActiveDailyVotingPeriod(today);

    if (!activePeriod) {
      return { hasActiveVoting: false };
    }

    const stats = await votingController.getTodayVotingStats();
    console.log(`📊 Voting progress - Total votes: ${stats.totalVotes}, Unique voters: ${stats.uniqueVoters}`);

    await this.logVotingProgress(activePeriod.id, stats);
    return { hasActiveVoting: true, stats };
  }

  /**
   * Weekly cleanup
   */
  async weeklyCleanup() {
    console.log('🧹 Starting weekly data cleanup...');

    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const db = getFirestore();

      const oldVotes = await db.collection(collections.VOTES)
        .where('timestamp', '<', oneWeekAgo.toISOString())
        .get();

      console.log(`🗃️ Archiving ${oldVotes.size} old votes...`);

      const batch = db.batch();
      oldVotes.forEach(doc => {
        batch.set(
          db.collection(collections.VOTES + '_archive').doc(doc.id),
          { ...doc.data(), archivedAt: new Date().toISOString() }
        );
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ Weekly cleanup completed');

      await this.logTaskExecution('weekly_cleanup', 'success');
      return { archived: oldVotes.size };

    } catch (error) {
      console.error('❌ Weekly cleanup failed:', error);
      await this.logTaskExecution('weekly_cleanup', 'failed', error.message);
      throw error;
    }
  }

  /**
   * Full daily cycle (generate memes + start voting)
   */
  async runDailyCycle() {
    console.log('🔄 Running full daily cycle...');

    try {
      // Step 1: Generate memes
      const generateResult = await this.generateDailyMemes();

      // Abort if generation failed (alreadyGenerated is OK)
      if (!generateResult) {
        throw new Error('Meme generation returned no result');
      }

      // Step 2: Start voting (after short delay to ensure Firestore consistency)
      await new Promise(resolve => setTimeout(resolve, 5000));
      const votingResult = await this.startDailyVotingPeriod();

      await this.logTaskExecution('daily_cycle', 'success');
      return { generateResult, votingResult };

    } catch (error) {
      console.error('❌ Daily cycle failed:', error);
      await this.logTaskExecution('daily_cycle', 'failed', error.message);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Get today's memes — MUST match frontend query exactly
   * (memeController.getTodaysMemes: orderBy desc, limit 3, status filter)
   * This ensures scheduler evaluates the same memes users see and vote on.
   */
  async getTodaysMemes() {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('status', 'in', ['active', 'voting_active', 'voting_completed'])
      .where('generatedAt', '>=', startOfDay)
      .where('generatedAt', '<=', endOfDay)
      .orderBy('generatedAt', 'desc')
      .limit(3)
      .get();

    const memes = [];
    snapshot.forEach(doc => {
      memes.push({ id: doc.id, ...doc.data() });
    });

    return memes;
  }

  /**
   * Count all daily memes for today (no filters/limits).
   * Used by generateDailyMemes to check if generation is needed.
   */
  async countTodaysMemes() {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('generatedAt', '>=', startOfDay)
      .where('generatedAt', '<=', endOfDay)
      .get();

    return snapshot.size;
  }

  async getActiveDailyVotingPeriod(date) {
    const db = getFirestore();
    const snapshot = await db.collection(collections.VOTING_PERIODS)
      .where('date', '==', date)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async calculateVotingResults(memeIds) {
    const results = {};

    for (const memeId of memeIds) {
      const meme = await dbUtils.getDocument(collections.MEMES, memeId);
      if (meme) {
        const yesVotes = meme.votes?.selection?.yes || 0;
        results[memeId] = {
          id: memeId,
          title: meme.title,
          votes: meme.votes || { selection: {}, rarity: {} },
          totalYesVotes: yesVotes,
          totalSelectionVotes: Object.values(meme.votes?.selection || {}).reduce((a, b) => a + b, 0),
          totalRarityVotes: Object.values(meme.votes?.rarity || {}).reduce((a, b) => a + b, 0)
        };
      } else {
        console.warn(`⚠️ Meme ${memeId} not found in Firestore`);
      }
    }

    return results;
  }

  selectWinningMeme(results) {
    let winner = null;
    let maxVotes = 0;

    for (const result of Object.values(results)) {
      // Use yes votes specifically (not yes + no combined)
      if (result.totalYesVotes > maxVotes) {
        maxVotes = result.totalYesVotes;
        winner = result;
      }
    }

    if (!winner) {
      console.log('📊 No memes received any yes votes — no winner selected');
    }

    return winner;
  }

  calculateRarity(rarityVotes) {
    if (!rarityVotes) return 'common';

    const totals = {
      common: rarityVotes.common || 0,
      uncommon: rarityVotes.uncommon || 0,
      rare: rarityVotes.rare || 0,
      legendary: rarityVotes.legendary || 0
    };

    const winner = Object.entries(totals).reduce((a, b) => totals[a[0]] > totals[b[0]] ? a : b);
    return winner[0];
  }

  async logTaskExecution(taskName, status, error = null) {
    const logEntry = {
      taskName,
      status,
      timestamp: new Date().toISOString(),
      source: 'cloud_scheduler',
      error
    };

    console.log(`📝 Task log: ${taskName} - ${status}${error ? ' - ' + error : ''}`);

    await dbUtils.setDocument(
      'scheduler_logs',
      `${taskName}_${Date.now()}`,
      logEntry
    );
  }

  async logVotingProgress(votingPeriodId, stats) {
    const progressLog = {
      votingPeriodId,
      timestamp: new Date().toISOString(),
      stats
    };

    await dbUtils.setDocument(
      'voting_progress',
      `${votingPeriodId}_${Date.now()}`,
      progressLog
    );
  }

  /**
   * Trigger a task by name (called by API endpoint)
   */
  async triggerTask(taskName) {
    console.log(`🔧 Executing task: ${taskName}`);

    switch (taskName) {
      case 'daily_cycle':
        return await this.runDailyCycle();
      case 'daily_memes':
        return await this.generateDailyMemes();
      case 'start_voting':
        return await this.startDailyVotingPeriod();
      case 'end_voting':
        return await this.endDailyVotingPeriod();
      case 'lottery_draw':
        return await this.runWeeklyLottery();
      case 'cleanup':
        return await this.weeklyCleanup();
      case 'voting_progress':
        return await this.checkVotingProgress();
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    return {
      running: true,
      taskCount: 7,
      mode: 'cloud_scheduler',
      updatedAt: new Date().toISOString(),
      note: 'Tasks triggered by GCP Cloud Scheduler'
    };
  }

  // Compatibility methods (no-op now)
  async initialize() {
    console.log('ℹ️ Scheduler uses GCP Cloud Scheduler - no initialization needed');
  }

  stopAll() {
    console.log('ℹ️ Scheduler uses GCP Cloud Scheduler - no tasks to stop');
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
