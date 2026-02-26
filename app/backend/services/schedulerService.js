/**
 * Scheduler Service for MemeForge
 *
 * NOTE: Cron scheduling is handled by GCP Cloud Scheduler (external service)
 * This service only contains task execution methods called via API endpoints:
 * POST /api/scheduler/trigger/:taskName
 *
 * GCP Cloud Scheduler Jobs (all times in UTC, 8AM Taiwan = 0:00 UTC):
 * - daily_memes:    0:00 UTC (8AM UTC+8) - Generate daily memes
 * - start_voting:   0:30 UTC (8:30AM UTC+8) - Start voting period
 * - end_voting:     23:50 UTC daily - End voting & calculate rarity
 * - lottery_draw:   23:55 UTC daily - Daily lottery (5 min after end_voting)
 */

const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const memeController = require('../controllers/memeController');
const votingController = require('../controllers/votingController');
const lotteryController = require('../controllers/lotteryController');
const rewardService = require('./rewardService');

class SchedulerService {
  constructor() {
    // No internal scheduling — GCP Cloud Scheduler triggers tasks via API
  }

  /**
   * Generate daily memes
   */
  async generateDailyMemes() {
    console.log('🎨 Starting daily meme generation process...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if memes already generated for today
      const existingMemes = await this.getTodaysMemes();
      if (existingMemes.length >= 3) {
        console.log('ℹ️ Daily memes already generated for today');
        return { alreadyGenerated: true, count: existingMemes.length };
      }

      // Generate memes using the existing controller
      const req = { body: {} };
      let result = null;
      const res = {
        json: (data) => { result = data; return data; },
        status: (code) => ({ json: (data) => { result = data; return { ...data, statusCode: code }; } })
      };

      await memeController.generateDailyMemes(req, res);
      console.log('✅ Daily memes generated successfully:', result);

      // Log execution
      await this.logTaskExecution('daily_memes', 'success');

      return result;

    } catch (error) {
      console.error('❌ Error in daily meme generation:', error);
      await this.logTaskExecution('daily_memes', 'failed', error.message);
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
      const memes = await this.getTodaysMemes();

      if (memes.length === 0) {
        console.log('⚠️ No memes found for today, skipping voting period');
        return { skipped: true, reason: 'No memes found' };
      }

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
      console.log('✅ Voting period started for', memes.length, 'memes');

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
        console.log('⚠️ No active voting period found for today');
        return { skipped: true, reason: 'No active voting period' };
      }

      const results = await this.calculateVotingResults(activePeriod.memeIds);

      // Defensive: warn if all memes in the voting period were deleted/missing
      if (Object.keys(results).length === 0) {
        console.warn(`⚠️ All ${activePeriod.memeIds.length} memes in voting period are missing (deleted?). Meme IDs: ${activePeriod.memeIds.join(', ')}`);
      }

      const winningMeme = this.selectWinningMeme(results);

      if (winningMeme) {
        const rarity = this.calculateRarity(winningMeme.votes.rarity);

        await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
          status: 'voting_completed',
          finalRarity: rarity,
          isWinner: true,
          votingCompleted: new Date().toISOString()
        });

        for (const memeId of activePeriod.memeIds) {
          if (memeId !== winningMeme.id) {
            await dbUtils.updateDocument(collections.MEMES, memeId, {
              status: 'voting_completed',
              isWinner: false,
              votingCompleted: new Date().toISOString()
            });
          }
        }

        console.log(`✅ Voting completed. Winner: ${winningMeme.id} with rarity: ${rarity}`);
      } else {
        console.warn(`⚠️ No winning meme could be determined from voting results. Results keys: ${Object.keys(results).length}`);
      }

      await dbUtils.updateDocument(collections.VOTING_PERIODS, activePeriod.id, {
        status: 'completed',
        endTime: new Date().toISOString(),
        results: results
      });

      await this.logTaskExecution('end_voting', 'success');
      return { completed: true, winner: winningMeme?.id };

    } catch (error) {
      console.error('❌ Error ending voting period:', error);
      await this.logTaskExecution('end_voting', 'failed', error.message);
      throw error;
    }
  }

  /**
   * Run daily lottery (23:56 UTC)
   */
  async runDailyLottery() {
    console.log('🎰 Running daily lottery draw...');

    try {
      const result = await lotteryController.runDailyLottery();
      console.log('✅ Daily lottery completed:', result);

      // Chain reward distribution (non-fatal — lottery draw stands regardless)
      if (result.status === 'completed') {
        try {
          // Check reward config — simulate if disabled
          const configDoc = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, 'config');
          const rewardEnabled = configDoc?.rewardEnabled !== false;
          const rewardOpts = rewardEnabled ? {} : { simulate: true };
          if (!rewardEnabled) console.log('🧪 Reward distribution disabled — running in simulation mode');
          const rewardResult = await rewardService.distributeRewards(result, rewardOpts);
          console.log('💰 Reward distribution result:', rewardResult);
        } catch (rewardErr) {
          console.error('⚠️ Reward distribution failed (non-fatal):', rewardErr.message);
        }
      }

      await this.logTaskExecution('lottery_draw', 'success');
      return result;

    } catch (error) {
      console.error('❌ Daily lottery failed:', error);
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

      // Step 2: Start voting (after short delay)
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

  /**
   * Manual reward distribution for today's draw
   */
  async runRewardDistribution() {
    console.log('💰 Running manual reward distribution...');

    try {
      const today = new Date().toISOString().split('T')[0];
      const draw = await dbUtils.getDocument(collections.LOTTERY_DRAWS, today);

      if (!draw || draw.status !== 'completed') {
        console.log('⚠️ No completed lottery draw found for today');
        return { skipped: true, reason: 'No completed draw for today' };
      }

      const configDoc = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, 'config');
      const rewardEnabled = configDoc?.rewardEnabled !== false;
      const rewardOpts = rewardEnabled ? {} : { simulate: true };
      if (!rewardEnabled) console.log('🧪 Reward distribution disabled — running in simulation mode');

      const result = await rewardService.distributeRewards({
        drawId: draw.id || today,
        status: draw.status,
        winner: draw.winnerWallet,
        memeId: draw.winningMemeId
      }, rewardOpts);

      await this.logTaskExecution('reward_distribution', 'success');
      return result;

    } catch (error) {
      console.error('❌ Reward distribution failed:', error);
      await this.logTaskExecution('reward_distribution', 'failed', error.message);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  async getTodaysMemes() {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('generatedAt', '>=', startOfDay)
      .where('generatedAt', '<=', endOfDay)
      .get();

    const memes = [];
    snapshot.forEach(doc => {
      memes.push({ id: doc.id, ...doc.data() });
    });

    return memes;
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
        results[memeId] = {
          id: memeId,
          title: meme.title,
          votes: meme.votes || { selection: {}, rarity: {} },
          totalSelectionVotes: Object.values(meme.votes?.selection || {}).reduce((a, b) => a + b, 0),
          totalRarityVotes: Object.values(meme.votes?.rarity || {}).reduce((a, b) => a + b, 0)
        };
      }
    }

    return results;
  }

  selectWinningMeme(results) {
    let winner = null;
    let maxVotes = 0;

    for (const result of Object.values(results)) {
      if (result.totalSelectionVotes > maxVotes) {
        maxVotes = result.totalSelectionVotes;
        winner = result;
      }
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

    console.log(`📝 Task log: ${taskName} - ${status}`);

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
        return await this.runDailyLottery();
      case 'cleanup':
        return await this.weeklyCleanup();
      case 'voting_progress':
        return await this.checkVotingProgress();
      case 'reward_distribution':
        return await this.runRewardDistribution();
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    return {
      mode: 'cloud_scheduler',
      updatedAt: new Date().toISOString(),
      note: 'Task execution only — scheduling managed by GCP Cloud Scheduler'
    };
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;
