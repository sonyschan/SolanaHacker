/**
 * Scheduler Service for MemeNews
 *
 * NOTE: Cron scheduling is handled by GCP Cloud Scheduler (external service)
 * This service only contains task execution methods called via API endpoints:
 * POST /api/scheduler/trigger/:taskName
 *
 * GCP Cloud Scheduler Jobs (all times in UTC, 8AM Taiwan = 0:00 UTC):
 * - daily_memes:    0:00 UTC (8AM UTC+8) - Generate daily memes
 * - ai_judge:       0:45 UTC (8:45AM UTC+8) - AI judges score memes & pick winner
 */

const { getFirestore, collections, dbUtils } = require('../config/firebase');
const memeController = require('../controllers/memeController');
const aiJudgeService = require('./aiJudgeService');

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
      // Check if memes already generated for today
      const existingMemes = await this.getTodaysMemes();
      if (existingMemes.length >= 3) {
        console.log('ℹ️ Daily memes already generated for today');
        return { alreadyGenerated: true, count: existingMemes.length };
      }

      // Generate memes using the existing controller
      const req = { body: {}, query: {} };
      let result = null;
      const res = {
        json: (data) => { result = data; return data; },
        status: (code) => ({ json: (data) => { result = data; return { ...data, statusCode: code }; } })
      };

      await memeController.generateDailyMemes(req, res);

      if (result && result.error) {
        console.error('❌ Daily meme generation returned error:', result.error);
        await this.logTaskExecution('daily_memes', 'failed', result.error);
        return result;
      }

      console.log('✅ Daily memes generated successfully:', result);
      await this.logTaskExecution('daily_memes', 'success');

      return result;

    } catch (error) {
      console.error('❌ Error in daily meme generation:', error);
      await this.logTaskExecution('daily_memes', 'failed', error.message);
      throw error;
    }
  }

  /**
   * AI Judging — score today's memes with Gemini, Grok, ChatGPT and pick winner
   */
  async runAiJudging() {
    console.log('🤖 Starting AI judging for daily memes...');

    try {
      const memes = await this.getTodaysMemes();

      if (memes.length === 0) {
        console.log('⚠️ No memes found for today, skipping AI judging');
        await this.logTaskExecution('ai_judge', 'skipped', 'No memes found');
        return { skipped: true, reason: 'No memes found' };
      }

      // Check if already judged (a winner was declared)
      const hasWinner = memes.some(m => m.status === 'winner');
      if (hasWinner) {
        console.log('ℹ️ Memes already judged today (winner exists)');
        return { alreadyJudged: true };
      }

      // Check all memes have images
      const withoutImages = memes.filter(m => !m.imageUrl);
      if (withoutImages.length > 0) {
        console.warn(`⚠️ ${withoutImages.length} meme(s) missing images, judging only those with images`);
      }

      // Run AI judging
      const { results, winnerId } = await aiJudgeService.judgeDailyMemes(memes);

      // Update Firestore with judging results
      for (const r of results) {
        const isWinner = r.memeId === winnerId;
        await dbUtils.updateDocument(collections.MEMES, r.memeId, {
          status: isWinner ? 'winner' : 'judged',
          isWinner,
          aiJudging: {
            judgedAt: r.judgedAt,
            judgeCount: r.judgeCount,
            judges: r.judges,
            averageTotal: r.averageTotal,
            dimensionAverages: r.dimensionAverages,
            isWinner
          }
        });
      }

      console.log(`✅ AI judging complete. Winner: ${winnerId}`);
      await this.logTaskExecution('ai_judge', 'success', `winner=${winnerId}`);

      return { completed: true, winnerId, judged: results.length };

    } catch (error) {
      console.error('❌ AI judging failed:', error);
      await this.logTaskExecution('ai_judge', 'failed', error.message);
      throw error;
    }
  }

  /**
   * Full daily cycle (generate memes + review)
   */
  async runDailyCycle() {
    console.log('🔄 Running full daily cycle...');

    try {
      // Step 1: Generate memes
      const generateResult = await this.generateDailyMemes();

      // Step 2: Review & retry any failed images
      const reviewResult = await this.reviewAndRetryMemes();

      await this.logTaskExecution('daily_cycle', 'success');
      return { generateResult, reviewResult };

    } catch (error) {
      console.error('❌ Daily cycle failed:', error);
      await this.logTaskExecution('daily_cycle', 'failed', error.message);
      throw error;
    }
  }

  /**
   * Review today's memes for image generation failures and retry sequentially.
   * Max 2 retries per meme, 5s between retries, 10s between different memes.
   */
  async reviewAndRetryMemes() {
    console.log('🔍 Reviewing daily memes for generation failures...');
    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 5000;
    const QUEUE_DELAY_MS = 10000;

    try {
      const today = new Date().toISOString().split('T')[0];
      const db = getFirestore();
      const snapshot = await db.collection('memes')
        .where('type', '==', 'daily')
        .where('generatedAt', '>=', today + 'T00:00:00.000Z')
        .where('generatedAt', '<=', today + 'T23:59:59.999Z')
        .get();

      const memes = [];
      snapshot.forEach(doc => memes.push({ id: doc.id, ...doc.data() }));

      const failed = memes.filter(m => m.metadata?.imageGenerated === false);

      if (failed.length === 0) {
        console.log('✅ All memes generated successfully — no retries needed');
        return { reviewed: memes.length, failures: 0, retried: 0, fixed: 0 };
      }

      console.log(`⚠️ Found ${failed.length} meme(s) with failed images — starting retry queue`);

      let retried = 0;
      let fixed = 0;
      for (let qi = 0; qi < failed.length; qi++) {
        const meme = failed[qi];
        let success = false;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          console.log(`🔄 Retry ${attempt}/${MAX_RETRIES} for meme ${meme.id}`);
          retried++;
          try {
            const result = await memeController.regenerateMemeImageInternal(meme.id);
            if (result.success) {
              console.log(`✅ Meme ${meme.id} image fixed (${result.model}): ${result.imageUrl}`);
              success = true;
              fixed++;
              break;
            }
            console.log(`❌ Retry ${attempt} failed for ${meme.id}: ${result.error}`);
          } catch (err) {
            console.log(`❌ Retry ${attempt} error for ${meme.id}: ${err.message}`);
          }

          if (attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          }
        }

        if (!success) {
          console.log(`⚠️ Meme ${meme.id} could not be fixed after ${MAX_RETRIES} retries`);
        }

        if (qi < failed.length - 1) {
          await new Promise(r => setTimeout(r, QUEUE_DELAY_MS));
        }
      }

      console.log(`📊 Review complete: ${memes.length} memes reviewed, ${failed.length} failures, ${fixed} fixed`);
      await this.logTaskExecution('meme_review', fixed === failed.length ? 'success' : 'partial',
        `${fixed}/${failed.length} failures fixed`);

      return { reviewed: memes.length, failures: failed.length, retried, fixed };

    } catch (error) {
      console.error('❌ Meme review failed:', error);
      await this.logTaskExecution('meme_review', 'failed', error.message);
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

  async getMemesForDate(dateStr) {
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z').toISOString();

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

  /**
   * Trigger a task by name (called by API endpoint)
   */
  async triggerTask(taskName, options = {}) {
    console.log(`🔧 Executing task: ${taskName}`);

    switch (taskName) {
      case 'daily_cycle':
        return await this.runDailyCycle();
      case 'daily_memes':
        return await this.generateDailyMemes();
      case 'ai_judge':
        return await this.runAiJudging();
      case 'meme_review':
        return await this.reviewAndRetryMemes();
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
