const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const memeController = require('../controllers/memeController');
const votingController = require('../controllers/votingController');
const lotteryController = require('../controllers/lotteryController');

class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize all scheduled tasks
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⏰ Scheduler already initialized');
      return;
    }

    console.log('🔄 Initializing MemeForge Scheduler Service...');
    
    try {
      // Daily tasks
      this.scheduleDaily();
      
      // Hourly tasks
      this.scheduleHourly();
      
      // Weekly tasks
      this.scheduleWeekly();
      
      this.isInitialized = true;
      console.log('✅ All scheduled tasks initialized successfully');
      
      // Log current status
      await this.logSchedulerStatus();
      
    } catch (error) {
      console.error('❌ Failed to initialize scheduler:', error);
      throw error;
    }
  }

  /**
   * Schedule daily tasks
   */
  scheduleDaily() {
    // Daily meme generation at 8:00 AM UTC
    const dailyMemeTask = cron.schedule('0 8 * * *', async () => {
      console.log('📅 Running daily meme generation...');
      try {
        await this.generateDailyMemes();
        await this.logTaskExecution('daily_memes', 'success');
      } catch (error) {
        console.error('❌ Daily meme generation failed:', error);
        await this.logTaskExecution('daily_memes', 'failed', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start voting period for generated memes at 8:30 AM UTC
    const startVotingTask = cron.schedule('30 8 * * *', async () => {
      console.log('🗳️ Starting daily voting period...');
      try {
        await this.startDailyVotingPeriod();
        await this.logTaskExecution('start_voting', 'success');
      } catch (error) {
        console.error('❌ Failed to start voting period:', error);
        await this.logTaskExecution('start_voting', 'failed', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // End voting period and calculate rarity at 8:00 PM UTC (12 hours later)
    const endVotingTask = cron.schedule('0 20 * * *', async () => {
      console.log('📊 Ending daily voting period and calculating rarity...');
      try {
        await this.endDailyVotingPeriod();
        await this.logTaskExecution('end_voting', 'success');
      } catch (error) {
        console.error('❌ Failed to end voting period:', error);
        await this.logTaskExecution('end_voting', 'failed', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.tasks.set('daily_memes', dailyMemeTask);
    this.tasks.set('start_voting', startVotingTask);
    this.tasks.set('end_voting', endVotingTask);

    // Start all daily tasks
    dailyMemeTask.start();
    startVotingTask.start();
    endVotingTask.start();

    console.log('✅ Daily tasks scheduled: Meme generation, Voting start/end');
  }

  /**
   * Schedule hourly tasks
   */
  scheduleHourly() {
    // Check voting progress every hour during voting period (9 AM - 7 PM UTC)
    const votingProgressTask = cron.schedule('0 9-19 * * *', async () => {
      console.log('📈 Checking voting progress...');
      try {
        await this.checkVotingProgress();
        await this.logTaskExecution('voting_progress', 'success');
      } catch (error) {
        console.error('❌ Voting progress check failed:', error);
        await this.logTaskExecution('voting_progress', 'failed', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.tasks.set('voting_progress', votingProgressTask);
    votingProgressTask.start();

    console.log('✅ Hourly tasks scheduled: Voting progress monitoring');
  }

  /**
   * Schedule weekly tasks
   */
  scheduleWeekly() {
    // Weekly lottery draw every Sunday at 8:00 PM UTC
    const lotteryDrawTask = cron.schedule('0 20 * * 0', async () => {
      console.log('🎰 Running weekly lottery draw...');
      try {
        await this.runWeeklyLottery();
        await this.logTaskExecution('lottery_draw', 'success');
      } catch (error) {
        console.error('❌ Weekly lottery draw failed:', error);
        await this.logTaskExecution('lottery_draw', 'failed', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Weekly cleanup - archive old data every Sunday at 2:00 AM UTC
    const cleanupTask = cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Running weekly data cleanup...');
      try {
        await this.weeklyCleanup();
        await this.logTaskExecution('weekly_cleanup', 'success');
      } catch (error) {
        console.error('❌ Weekly cleanup failed:', error);
        await this.logTaskExecution('weekly_cleanup', 'failed', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.tasks.set('lottery_draw', lotteryDrawTask);
    this.tasks.set('weekly_cleanup', cleanupTask);

    lotteryDrawTask.start();
    cleanupTask.start();

    console.log('✅ Weekly tasks scheduled: Lottery draw, Data cleanup');
  }

  /**
   * Generate daily memes
   */
  async generateDailyMemes() {
    console.log('🎨 Starting daily meme generation process...');
    
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Check if memes already generated for today
      const existingMemes = await this.getTodaysMemes();
      if (existingMemes.length >= 3) {
        console.log('ℹ️ Daily memes already generated for today');
        return;
      }

      // Generate memes using the existing controller
      const req = { body: {} };
      const res = {
        json: (data) => data,
        status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
      };

      const result = await memeController.generateDailyMemes(req, res);
      console.log('✅ Daily memes generated successfully:', result);

      // Update scheduler status
      await this.updateSchedulerStatus('daily_memes', {
        lastRun: new Date().toISOString(),
        status: 'completed',
        memesGenerated: result.memes?.length || 0
      });

    } catch (error) {
      console.error('❌ Error in daily meme generation:', error);
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
        return;
      }

      // Update memes status to voting_active
      for (const meme of memes) {
        await dbUtils.updateDocument(collections.MEMES, meme.id, {
          status: 'voting_active',
          votingStarted: new Date().toISOString(),
          votingEnds: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours later
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
        phase: 'selection' // First phase: select winning meme
      };

      await dbUtils.setDocument(collections.VOTING_PERIODS, votingPeriod.id, votingPeriod);
      console.log('✅ Voting period started for', memes.length, 'memes');

    } catch (error) {
      console.error('❌ Error starting voting period:', error);
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
      
      // Get active voting period
      const activePeriod = await this.getActiveDailyVotingPeriod(today);
      if (!activePeriod) {
        console.log('⚠️ No active voting period found for today');
        return;
      }

      // Calculate results for all memes in voting period
      const results = await this.calculateVotingResults(activePeriod.memeIds);
      
      // Determine winning meme (most votes in selection phase)
      const winningMeme = this.selectWinningMeme(results);
      
      if (winningMeme) {
        // Calculate rarity based on rarity votes
        const rarity = this.calculateRarity(winningMeme.votes.rarity);
        
        // Update winning meme with final rarity
        await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
          status: 'voting_completed',
          finalRarity: rarity,
          isWinner: true,
          votingCompleted: new Date().toISOString()
        });

        // Mark other memes as not winners
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
        
        // If rarity is rare or legendary, trigger NFT minting process
        if (rarity === 'rare' || rarity === 'legendary') {
          await this.triggerNFTMinting(winningMeme.id, rarity);
        }
      }

      // Close voting period
      await dbUtils.updateDocument(collections.VOTING_PERIODS, activePeriod.id, {
        status: 'completed',
        endTime: new Date().toISOString(),
        results: results
      });

    } catch (error) {
      console.error('❌ Error ending voting period:', error);
      throw error;
    }
  }

  /**
   * Check voting progress (hourly monitoring)
   */
  async checkVotingProgress() {
    const today = new Date().toISOString().split('T')[0];
    const activePeriod = await this.getActiveDailyVotingPeriod(today);
    
    if (!activePeriod) {
      return; // No active voting period
    }

    const stats = await votingController.getTodayVotingStats();
    console.log(`📊 Voting progress - Total votes: ${stats.totalVotes}, Unique voters: ${stats.uniqueVoters}`);
    
    // Log progress to database for analytics
    await this.logVotingProgress(activePeriod.id, stats);
  }

  /**
   * Run weekly lottery
   */
  async runWeeklyLottery() {
    console.log('🎰 Running weekly lottery draw...');
    
    try {
      // Use lottery controller to run the draw
      const req = { body: {} };
      const res = {
        json: (data) => data,
        status: (code) => ({ json: (data) => ({ ...data, statusCode: code }) })
      };

      const result = await lotteryController.drawLottery(req, res);
      console.log('✅ Weekly lottery completed:', result);

    } catch (error) {
      console.error('❌ Weekly lottery failed:', error);
      throw error;
    }
  }

  /**
   * Weekly data cleanup
   */
  async weeklyCleanup() {
    console.log('🧹 Starting weekly data cleanup...');
    
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const db = getFirestore();

      // Archive old votes (older than 1 week)
      const oldVotes = await db.collection(collections.VOTES)
        .where('timestamp', '<', oneWeekAgo.toISOString())
        .get();

      console.log(`🗃️ Archiving ${oldVotes.size} old votes...`);
      
      const batch = db.batch();
      oldVotes.forEach(doc => {
        // Move to archive collection
        batch.set(
          db.collection(collections.VOTES + '_archive').doc(doc.id),
          { ...doc.data(), archivedAt: new Date().toISOString() }
        );
        // Delete from active collection
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('✅ Weekly cleanup completed');

    } catch (error) {
      console.error('❌ Weekly cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Helper: Get today's memes
   */
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

  /**
   * Helper: Get active daily voting period
   */
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

  /**
   * Helper: Calculate voting results
   */
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

  /**
   * Helper: Select winning meme
   */
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

  /**
   * Helper: Calculate rarity based on votes
   */
  calculateRarity(rarityVotes) {
    if (!rarityVotes) return 'common';
    
    const totals = {
      common: rarityVotes.common || 0,
      uncommon: rarityVotes.uncommon || 0,
      rare: rarityVotes.rare || 0,
      legendary: rarityVotes.legendary || 0
    };
    
    // Find the rarity with the most votes
    const winner = Object.entries(totals).reduce((a, b) => totals[a[0]] > totals[b[0]] ? a : b);
    
    return winner[0];
  }

  /**
   * Helper: Trigger NFT minting
   */
  async triggerNFTMinting(memeId, rarity) {
    console.log(`🎨 Triggering NFT minting for meme ${memeId} with rarity ${rarity}`);
    
    // This would integrate with Solana NFT minting
    // For now, just log the action
    const mintData = {
      id: uuidv4(),
      memeId,
      rarity,
      status: 'pending_mint',
      createdAt: new Date().toISOString()
    };
    
    await dbUtils.setDocument(collections.NFTS, mintData.id, mintData);
    console.log('✅ NFT minting record created');
  }

  /**
   * Helper: Log task execution
   */
  async logTaskExecution(taskName, status, error = null) {
    const logEntry = {
      taskName,
      status,
      timestamp: new Date().toISOString(),
      error
    };
    
    console.log(`📝 Task log: ${taskName} - ${status}`);
    
    // Save to scheduler_logs collection
    await dbUtils.setDocument(
      'scheduler_logs',
      `${taskName}_${Date.now()}`,
      logEntry
    );
  }

  /**
   * Helper: Log voting progress
   */
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
   * Helper: Update scheduler status
   */
  async updateSchedulerStatus(taskName, data) {
    await dbUtils.setDocument('scheduler_status', taskName, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Helper: Log current scheduler status
   */
  async logSchedulerStatus() {
    const status = {
      initialized: this.isInitialized,
      activeTasks: Array.from(this.tasks.keys()),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Scheduler Status:', status);
    await dbUtils.setDocument('scheduler_status', 'main', status);
  }

  /**
   * Manually trigger a task (for testing)
   */
  async triggerTask(taskName) {
    console.log(`🔧 Manually triggering task: ${taskName}`);
    
    try {
      switch (taskName) {
        case 'daily_memes':
          await this.generateDailyMemes();
          break;
        case 'start_voting':
          await this.startDailyVotingPeriod();
          break;
        case 'end_voting':
          await this.endDailyVotingPeriod();
          break;
        case 'lottery_draw':
          await this.runWeeklyLottery();
          break;
        case 'cleanup':
          await this.weeklyCleanup();
          break;
        default:
          throw new Error(`Unknown task: ${taskName}`);
      }
      
      console.log(`✅ Task ${taskName} completed successfully`);
      await this.logTaskExecution(taskName, 'success');
      
    } catch (error) {
      console.error(`❌ Task ${taskName} failed:`, error);
      await this.logTaskExecution(taskName, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  async getStatus() {
    const status = await dbUtils.getDocument('scheduler_status', 'main');
    return {
      ...status,
      taskCount: this.tasks.size,
      running: this.isInitialized
    };
  }

  /**
   * Force regenerate memes (delete existing and create new)
   */
  async forceRegenerateMemes() {
    console.log('🔄 Force regenerating daily memes...');

    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

    // Find and delete today's existing memes
    const existingMemes = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('generatedAt', '>=', startOfDay)
      .where('generatedAt', '<=', endOfDay)
      .get();

    const deletedCount = existingMemes.size;
    console.log(`🗑️ Deleting ${deletedCount} existing memes from today...`);

    const batch = db.batch();
    existingMemes.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log('✅ Old memes deleted, generating fresh memes...');

    // Generate fresh memes - capture the response
    let generatedMemes = null;
    const req = { body: {} };
    const res = {
      json: (data) => { generatedMemes = data; return data; },
      status: (code) => ({ json: (data) => { generatedMemes = data; return { ...data, statusCode: code }; } })
    };

    await memeController.generateDailyMemes(req, res);

    return {
      deletedCount,
      newMemes: generatedMemes?.memes?.length || 0,
      memes: generatedMemes?.memes || []
    };
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    console.log('⏹️ Stopping all scheduled tasks...');
    
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`⏹️ Stopped task: ${name}`);
    }
    
    this.tasks.clear();
    this.isInitialized = false;
    console.log('✅ All scheduled tasks stopped');
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

module.exports = schedulerService;