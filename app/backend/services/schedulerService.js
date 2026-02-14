const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
const { getFirestore, collections, dbUtils } = require("../config/firebase");
const memeController = require("../controllers/memeController");
const geminiService = require("./geminiService");

/**
 * AI MemeForge Scheduler Service
 * 
 * Schedule (UTC times, display as UTC+8 for users):
 * - 0:00 UTC (8:00 AM UTC+8): Daily cycle starts
 *   1. Set meme-ready=false (users see "Preparing...")
 *   2. Determine previous day winner
 *   3. Generate new memes with Gemini
 *   4. Set meme-ready=true when all 3 memes ready
 */

class SchedulerService {
  constructor() {
    this.tasks = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log("⏰ Scheduler already initialized");
      return;
    }

    console.log("🔄 Initializing AI MemeForge Scheduler Service...");
    
    try {
      this.scheduleDaily();
      this.scheduleHourly();
      
      this.isInitialized = true;
      console.log("✅ Scheduler initialized - Daily cycle at 0:00 UTC (8:00 AM UTC+8)");
      
    } catch (error) {
      console.error("❌ Failed to initialize scheduler:", error);
      throw error;
    }
  }

  /**
   * Schedule daily tasks - Main cycle at 0:00 UTC (8:00 AM UTC+8)
   */
  scheduleDaily() {
    // Main daily cycle at 0:00 UTC = 8:00 AM UTC+8
    const dailyCycleTask = cron.schedule("0 0 * * *", async () => {
      console.log("🌅 Starting daily AI MemeForge cycle (0:00 UTC / 8:00 AM UTC+8)...");
      await this.runDailyCycle();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.tasks.set("daily_cycle", dailyCycleTask);
    console.log("📅 Daily cycle scheduled: 0:00 UTC (8:00 AM UTC+8)");
  }

  /**
   * Main daily cycle - runs at 0:00 UTC (8:00 AM UTC+8)
   */
  async runDailyCycle() {
    const db = getFirestore();
    const cycleId = `cycle_${Date.now()}`;
    
    console.log(`🔄 [${cycleId}] Daily cycle starting...`);

    try {
      // Step 1: Set meme-ready=false (users see loading state)
      await this.setMemeReadyStatus(false);
      console.log(`⏳ [${cycleId}] Set meme-ready=false - users will see preparing state`);

      // Step 2: Determine previous day winner
      const winner = await this.determinePreviousDayWinner();
      if (winner) {
        console.log(`🏆 [${cycleId}] Previous day winner: ${winner.id} - ${winner.title}`);
      } else {
        console.log(`ℹ️ [${cycleId}] No previous day memes to judge`);
      }

      // Step 3: Generate new memes (with retry logic)
      console.log(`🎨 [${cycleId}] Starting meme generation...`);
      const memes = await this.generateDailyMemesWithRetry();
      console.log(`✅ [${cycleId}] Generated ${memes.length} memes`);

      // Step 4: Set meme-ready=true (users can now vote)
      await this.setMemeReadyStatus(true);
      console.log(`🚀 [${cycleId}] Set meme-ready=true - new voting round begins!`);

      await this.logTaskExecution("daily_cycle", "success", {
        cycleId,
        winner: winner?.id,
        memesGenerated: memes.length
      });

    } catch (error) {
      console.error(`❌ [${cycleId}] Daily cycle failed:`, error);
      
      // Even on failure, set meme-ready=true to avoid permanent loading state
      // Frontend will handle showing old memes or error state
      await this.setMemeReadyStatus(true);
      
      await this.logTaskExecution("daily_cycle", "failed", {
        cycleId,
        error: error.message
      });
    }
  }

  /**
   * Set meme-ready status in Firestore
   */
  async setMemeReadyStatus(ready) {
    const db = getFirestore();
    const today = new Date().toISOString().split("T")[0];
    
    await db.collection(collections.SYSTEM_STATUS || "system_status").doc("meme_generation").set({
      memeReady: ready,
      date: today,
      updatedAt: new Date().toISOString(),
      message: ready ? "Today memes are ready for voting!" : "Generating today memes, please wait..."
    }, { merge: true });
  }

  /**
   * Get meme-ready status
   */
  async getMemeReadyStatus() {
    const db = getFirestore();
    const today = new Date().toISOString().split("T")[0];
    
    try {
      const doc = await db.collection(collections.SYSTEM_STATUS || "system_status").doc("meme_generation").get();
      
      if (!doc.exists) {
        return { memeReady: true, date: today }; // Default to ready if no status
      }
      
      const data = doc.data();
      
      // If status is from a different day, consider ready (stale status)
      if (data.date !== today) {
        return { memeReady: true, date: today, stale: true };
      }
      
      return data;
    } catch (error) {
      console.error("Error getting meme ready status:", error);
      return { memeReady: true, date: today, error: true }; // Default to ready on error
    }
  }

  /**
   * Determine the winner from previous day memes
   */
  async determinePreviousDayWinner() {
    const db = getFirestore();
    
    // Get yesterday date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    try {
      // Find memes from yesterday
      const snapshot = await db.collection(collections.MEMES)
        .orderBy("generatedAt", "desc")
        .limit(20)
        .get();
      
      const yesterdayMemes = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const memeDate = data.generatedAt?.split?.("T")?.[0] || "";
        if (memeDate === yesterdayStr && data.type === "daily") {
          yesterdayMemes.push({ id: doc.id, ...data });
        }
      });

      if (yesterdayMemes.length === 0) {
        return null;
      }

      // Find the meme with most YES votes
      let winner = null;
      let maxYesVotes = -1;

      for (const meme of yesterdayMemes) {
        const yesVotes = meme.votes?.selection?.yes || 0;
        if (yesVotes > maxYesVotes) {
          maxYesVotes = yesVotes;
          winner = meme;
        }
      }

      if (winner && maxYesVotes > 0) {
        // Calculate rarity based on votes
        const totalVotes = (winner.votes?.selection?.yes || 0) + (winner.votes?.selection?.no || 0);
        const rarity = this.calculateRarity(winner.votes?.rarity || {});

        // Update winner in Firestore
        await db.collection(collections.MEMES).doc(winner.id).update({
          isWinner: true,
          finalRarity: rarity,
          winnerDeterminedAt: new Date().toISOString()
        });

        // Mark other memes as not winners
        for (const meme of yesterdayMemes) {
          if (meme.id !== winner.id) {
            await db.collection(collections.MEMES).doc(meme.id).update({
              isWinner: false,
              votingCompleted: new Date().toISOString()
            });
          }
        }

        return winner;
      }

      return null;
    } catch (error) {
      console.error("Error determining winner:", error);
      return null;
    }
  }

  /**
   * Calculate rarity based on rarity votes
   */
  calculateRarity(rarityVotes) {
    const common = rarityVotes.common || 0;
    const rare = rarityVotes.rare || 0;
    const legendary = rarityVotes.legendary || 0;
    
    const total = common + rare + legendary;
    if (total === 0) return "common";
    
    // Winner is the most voted rarity
    if (legendary >= rare && legendary >= common) return "legendary";
    if (rare >= common) return "rare";
    return "common";
  }

  /**
   * Generate daily memes with Gemini retry logic
   * - 3 retries with Gemini 3 Pro Preview
   * - Fallback to Gemini 2.5 if all retries fail
   */
  async generateDailyMemesWithRetry() {
    const newsTopics = [
      "Solana Ecosystem Growth",
      "Bitcoin Price Action", 
      "Meme Coin Season"
    ];

    const memes = [];

    for (let i = 0; i < 3; i++) {
      const topic = newsTopics[i];
      let meme = null;
      
      // Try Gemini 3 Pro Preview with 3 retries
      for (let retry = 0; retry < 3; retry++) {
        try {
          console.log(`🎨 Generating meme ${i + 1}/3 with Gemini 3 (attempt ${retry + 1}/3)...`);
          meme = await geminiService.generateSingleMeme(topic, "gemini-3");
          if (meme && meme.imageUrl) {
            console.log(`✅ Meme ${i + 1} generated successfully with Gemini 3`);
            break;
          }
        } catch (error) {
          console.warn(`⚠️ Gemini 3 attempt ${retry + 1} failed:`, error.message);
          if (retry < 2) {
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
          }
        }
      }

      // Fallback to Gemini 2.5 if Gemini 3 failed
      if (!meme || !meme.imageUrl) {
        console.log(`🔄 Falling back to Gemini 2.5 for meme ${i + 1}...`);
        try {
          meme = await geminiService.generateSingleMeme(topic, "gemini-2.5");
          if (meme && meme.imageUrl) {
            console.log(`✅ Meme ${i + 1} generated with Gemini 2.5 fallback`);
          }
        } catch (error) {
          console.error(`❌ Gemini 2.5 fallback also failed:`, error.message);
          // Use placeholder
          meme = await this.createPlaceholderMeme(topic, i);
        }
      }

      if (meme) {
        memes.push(meme);
      }
    }

    return memes;
  }

  /**
   * Create placeholder meme when generation fails
   */
  async createPlaceholderMeme(topic, index) {
    const db = getFirestore();
    const memeId = `meme_${Date.now()}_${index}`;
    
    const meme = {
      id: memeId,
      title: `${topic} Meme`,
      description: "AI meme generation temporarily unavailable",
      imageUrl: `https://via.placeholder.com/512x512/1e40af/ffffff?text=${encodeURIComponent(topic)}`,
      type: "daily",
      status: "active",
      generatedAt: new Date().toISOString(),
      votes: { selection: { yes: 0, no: 0 }, rarity: { common: 0, rare: 0, legendary: 0 } },
      metadata: { placeholder: true, topic }
    };

    await db.collection(collections.MEMES).doc(memeId).set(meme);
    return meme;
  }

  /**
   * Schedule hourly tasks
   */
  scheduleHourly() {
    // Hourly voting progress update
    const votingProgressTask = cron.schedule("0 * * * *", async () => {
      console.log("📊 Updating voting progress...");
      // Could update stats, send notifications, etc.
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.tasks.set("voting_progress", votingProgressTask);
  }

  /**
   * Get scheduler status
   */
  async getStatus() {
    const memeStatus = await this.getMemeReadyStatus();
    
    return {
      initialized: this.isInitialized,
      activeTasks: Array.from(this.tasks.keys()),
      memeReady: memeStatus.memeReady,
      memeDate: memeStatus.date,
      schedule: {
        dailyCycle: "0:00 UTC (8:00 AM UTC+8)",
        description: "Generate memes + determine previous winner"
      }
    };
  }

  /**
   * Log task execution
   */
  async logTaskExecution(taskName, status, details = {}) {
    const db = getFirestore();
    
    await db.collection(collections.TASK_LOGS || "task_logs").add({
      taskName,
      status,
      details,
      executedAt: new Date().toISOString()
    });

    console.log(`📝 Task log: ${taskName} - ${status}`);
  }

  /**
   * Manual trigger for testing
   */
  async triggerTask(taskName, reason = "manual") {
    console.log(`🔧 Manual trigger: ${taskName} (${reason})`);
    
    if (taskName === "daily_cycle") {
      await this.runDailyCycle();
      return { success: true, message: "Daily cycle executed" };
    }
    
    return { success: false, message: `Unknown task: ${taskName}` };
  }

  /**
   * Stop all tasks
   */
  stopAll() {
    console.log("⏹️ Stopping all scheduled tasks...");
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`⏹️ Stopped task: ${name}`);
    }
    console.log("✅ All scheduled tasks stopped");
  }
}

module.exports = new SchedulerService();
