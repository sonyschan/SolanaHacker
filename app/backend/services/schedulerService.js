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
const rarityService = require('./rarityService');

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
      const req = { body: {}, query: {} };
      let result = null;
      const res = {
        json: (data) => { result = data; return data; },
        status: (code) => ({ json: (data) => { result = data; return { ...data, statusCode: code }; } })
      };

      await memeController.generateDailyMemes(req, res);

      // Check if controller returned an error via the fake res
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

      let results = await this.calculateVotingResults(activePeriod.memeIds);

      // Fallback: if all original memes were deleted, try finding today's memes by date
      if (Object.keys(results).length === 0 && activePeriod.memeIds.length > 0) {
        console.warn(`⚠️ All ${activePeriod.memeIds.length} memes in voting period are missing (deleted?). Original IDs: ${activePeriod.memeIds.join(', ')}`);
        console.warn('🔄 Falling back to date-based meme query...');

        const fallbackMemes = await this.getMemesForDate(activePeriod.date);
        if (fallbackMemes.length > 0) {
          const fallbackIds = fallbackMemes.map(m => m.id);
          console.log(`✅ Found ${fallbackMemes.length} replacement memes for ${activePeriod.date}: ${fallbackIds.join(', ')}`);
          results = await this.calculateVotingResults(fallbackIds);

          // Update voting period with new memeIds, preserve originals for audit
          await dbUtils.updateDocument(collections.VOTING_PERIODS, activePeriod.id, {
            memeIds: fallbackIds,
            originalMemeIds: activePeriod.memeIds,
            memeIdsFallbackAt: new Date().toISOString()
          });
          activePeriod.memeIds = fallbackIds;
        } else {
          console.warn(`⚠️ No fallback memes found for ${activePeriod.date} either`);
        }
      }

      const winningMeme = this.selectWinningMeme(results);

      if (winningMeme) {
        // Use score-based percentile rarity from rarityService
        const avgScore = winningMeme.rarity?.averageScore;
        let finalRarity = 'common';
        if (typeof avgScore === 'number' && avgScore > 0) {
          const result = await rarityService.calculateRarity(avgScore);
          finalRarity = result.rarity.toLowerCase();
          console.log(`[Scheduler] Rarity for ${winningMeme.id}: avgScore=${avgScore}, percentile=${result.percentile}, method=${result.method} → ${finalRarity}`);
        } else {
          // Fallback: use legacy vote counts if no score data
          finalRarity = this.calculateRarity(winningMeme.votes.rarity);
          console.log(`[Scheduler] Rarity fallback (no score data) for ${winningMeme.id}: ${finalRarity}`);
        }

        await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
          status: 'voting_completed',
          finalRarity,
          isWinner: true,
          votingCompleted: new Date().toISOString()
        });

        for (const memeId of activePeriod.memeIds) {
          if (memeId !== winningMeme.id) {
            // Calculate rarity for losing memes too
            const loserResult = results[memeId];
            let loserRarity = 'common';
            const loserAvg = loserResult?.rarity?.averageScore;
            if (typeof loserAvg === 'number' && loserAvg > 0) {
              const lr = await rarityService.calculateRarity(loserAvg);
              loserRarity = lr.rarity.toLowerCase();
            }
            await dbUtils.updateDocument(collections.MEMES, memeId, {
              status: 'voting_completed',
              finalRarity: loserRarity,
              isWinner: false,
              votingCompleted: new Date().toISOString()
            });
          }
        }

        console.log(`✅ Voting completed. Winner: ${winningMeme.id} with rarity: ${finalRarity}`);
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

      // Clean up old ticket snapshots (older than 7 days)
      const cutoffDate = oneWeekAgo.toISOString().split('T')[0];
      const oldSnapshots = await db.collection(collections.USER_TICKETS)
        .where('date', '<', cutoffDate)
        .get();

      if (!oldSnapshots.empty) {
        const snapBatch = db.batch();
        oldSnapshots.forEach(doc => snapBatch.delete(doc.ref));
        await snapBatch.commit();
        console.log(`🗑️ Deleted ${oldSnapshots.size} old ticket snapshots`);
      }

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
  async runRewardDistribution(dateOverride) {
    console.log('💰 Running manual reward distribution...');

    try {
      const today = dateOverride || new Date().toISOString().split('T')[0];
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

  /**
   * Recover a failed lottery draw for a specific date
   * Finds memes for that date, determines winner, updates draw record
   */
  async recoverDraw(targetDate, { force = false } = {}) {
    console.log(`🔧 Recovering lottery draw for ${targetDate}${force ? ' (FORCE)' : ''}...`);

    // 1. Check existing draw
    const existingDraw = await dbUtils.getDocument(collections.LOTTERY_DRAWS, targetDate);
    if (existingDraw && existingDraw.status === 'completed' && !force) {
      return { skipped: true, reason: 'Draw already completed', draw: existingDraw };
    }

    // 2. Find memes generated on that date
    const db = getFirestore();
    const startOfDay = new Date(targetDate + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(targetDate + 'T23:59:59.999Z').toISOString();

    const memesSnap = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('generatedAt', '>=', startOfDay)
      .where('generatedAt', '<=', endOfDay)
      .get();

    const memes = [];
    memesSnap.forEach(doc => {
      memes.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📋 Found ${memes.length} memes for ${targetDate}`);
    if (memes.length === 0) {
      return { error: true, reason: 'No memes found for date' };
    }

    // 3. Calculate voting results
    const results = {};
    for (const meme of memes) {
      const totalYes = meme.votes?.selection?.yes || 0;
      const totalNo = meme.votes?.selection?.no || 0;
      const totalSelection = totalYes + totalNo;
      const totalRarity = Object.values(meme.votes?.rarity || {}).reduce((a, b) => a + b, 0);
      results[meme.id] = {
        id: meme.id,
        title: meme.title,
        votes: meme.votes || { selection: {}, rarity: {} },
        totalSelectionVotes: totalSelection,
        totalRarityVotes: totalRarity,
        yesVotes: totalYes
      };
      console.log(`  📊 ${meme.id}: "${meme.title}" — yes:${totalYes} no:${totalNo} total:${totalSelection}`);
    }

    // 4. Select winner (most yes votes, then total)
    const winningMeme = this.selectWinningMeme(results);
    if (!winningMeme) {
      return { error: true, reason: 'No winning meme could be determined', results };
    }

    const rarity = this.calculateRarity(winningMeme.votes.rarity);
    console.log(`🏆 Winner: ${winningMeme.id} "${winningMeme.title}" with ${winningMeme.totalSelectionVotes} votes, rarity: ${rarity}`);

    // 5. Update the winning meme
    await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
      status: 'voting_completed',
      finalRarity: rarity,
      isWinner: true,
      votingCompleted: targetDate + 'T23:50:00.000Z'
    });

    // Mark other memes as not winners
    for (const meme of memes) {
      if (meme.id !== winningMeme.id) {
        await dbUtils.updateDocument(collections.MEMES, meme.id, {
          status: 'voting_completed',
          isWinner: false,
          votingCompleted: targetDate + 'T23:50:00.000Z'
        });
      }
    }

    // 6. Get participants (users with weeklyTickets > 0 at draw time)
    // NOTE: tickets may have already been reset by today's draw, so we use a snapshot approach
    const usersSnap = await db.collection(collections.USERS).get();
    const allUsers = [];
    usersSnap.forEach(doc => {
      allUsers.push({ id: doc.id, ...doc.data() });
    });

    // Get voters who voted on the target date's memes
    const votesSnap = await db.collection(collections.VOTES)
      .where('timestamp', '>=', startOfDay)
      .where('timestamp', '<=', endOfDay)
      .get();

    const voterWallets = new Set();
    votesSnap.forEach(doc => {
      const data = doc.data();
      if (data.walletAddress) voterWallets.add(data.walletAddress);
    });

    console.log(`👥 Found ${voterWallets.size} voters on ${targetDate}`);

    // Pick lottery winner — 3-tier ticket lookup
    const voterArray = [...voterWallets].filter(w => {
      const user = allUsers.find(u => u.id === w);
      return user && user.lotteryOptIn !== false;
    });

    let lotteryWinner = null;
    let winnerTickets = 0;
    let totalTickets = 0;
    let ticketSource = 'none';

    if (voterArray.length > 0) {
      let voterTickets = [];

      // Tier 1: Try saved snapshot from the draw date
      const snapshot = await dbUtils.getDocument(collections.USER_TICKETS, targetDate);
      if (snapshot && snapshot.tickets && Object.keys(snapshot.tickets).length > 0) {
        ticketSource = 'snapshot';
        voterTickets = voterArray.map(wallet => ({
          wallet,
          tickets: snapshot.tickets[wallet] || 0
        }));
        console.log(`📸 Using ticket snapshot from ${targetDate} (${snapshot.participantCount} participants, ${snapshot.totalTickets} total)`);
      } else {
        // Tier 2: Use current weeklyTickets (works if recovery runs before next draw resets them)
        voterTickets = voterArray.map(wallet => {
          const user = allUsers.find(u => u.id === wallet);
          return { wallet, tickets: user?.weeklyTickets || 0 };
        });
      }

      totalTickets = voterTickets.reduce((sum, v) => sum + v.tickets, 0);

      if (totalTickets > 0) {
        // Weighted random selection
        if (ticketSource !== 'snapshot') ticketSource = 'weighted';
        const rand = Math.floor(Math.random() * totalTickets);
        let cumulative = 0;
        for (const v of voterTickets) {
          cumulative += v.tickets;
          if (rand < cumulative) {
            lotteryWinner = v.wallet;
            winnerTickets = v.tickets;
            break;
          }
        }
        // Safety fallback
        if (!lotteryWinner) {
          const last = voterTickets[voterTickets.length - 1];
          lotteryWinner = last.wallet;
          winnerTickets = last.tickets;
        }
      } else {
        // Tier 3: All tickets 0 — equal-weight random
        ticketSource = 'equal_weight';
        totalTickets = voterArray.length;
        winnerTickets = 1;
        const randIdx = Math.floor(Math.random() * voterArray.length);
        lotteryWinner = voterArray[randIdx];
      }

      console.log(`🎰 Selection: ${ticketSource}, winner=${lotteryWinner}, tickets=${winnerTickets}/${totalTickets}`);
    }

    // 7. Update lottery draw record
    const drawData = {
      id: targetDate,
      date: targetDate,
      drawTime: new Date().toISOString(),
      winnerWallet: lotteryWinner,
      winnerTickets,
      totalParticipants: voterArray.length,
      totalTickets,
      winningMemeId: winningMeme.id,
      status: lotteryWinner ? 'completed' : 'no_participants',
      recovered: true,
      recoveredAt: new Date().toISOString(),
      ticketSource
    };
    await dbUtils.setDocument(collections.LOTTERY_DRAWS, targetDate, drawData);

    // 8. Update meme nftOwner if we have a winner
    if (lotteryWinner) {
      await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
        nftOwner: {
          walletAddress: lotteryWinner,
          selectedAt: new Date().toISOString(),
          drawId: targetDate,
          claimTxSignature: null,
          mintAddress: null
        }
      });

      // Update winner user
      const admin = require('firebase-admin');
      const winnerRef = db.collection(collections.USERS).doc(lotteryWinner);
      const winnerDoc = await winnerRef.get();
      if (winnerDoc.exists) {
        await winnerRef.update({
          nftWins: admin.firestore.FieldValue.arrayUnion({
            memeId: winningMeme.id,
            drawId: targetDate,
            selectedAt: new Date().toISOString(),
            claimed: false
          })
        });
      }
    }

    console.log(`✅ Draw recovered for ${targetDate}. Winner: ${lotteryWinner || 'none'}, Meme: ${winningMeme.id}`);

    // 9. Chain reward distribution if draw completed (skip if force re-recovery already distributed)
    const alreadyRewarded = force && existingDraw?.rewardResult?.status === 'completed';
    if (drawData.status === 'completed' && !alreadyRewarded) {
      try {
        const configDoc = await dbUtils.getDocument(collections.REWARD_DISTRIBUTIONS, 'config');
        const rewardEnabled = configDoc?.rewardEnabled !== false;
        const rewardOpts = rewardEnabled ? {} : { simulate: true };
        if (!rewardEnabled) console.log('🧪 Reward distribution disabled — simulation mode');

        const rewardResult = await rewardService.distributeRewards({
          drawId: targetDate,
          status: 'completed',
          winner: lotteryWinner,
          memeId: winningMeme.id
        }, rewardOpts);
        console.log('💰 Reward distribution result:', rewardResult);
        drawData.rewardResult = rewardResult;
      } catch (rewardErr) {
        console.error('⚠️ Reward distribution failed (non-fatal):', rewardErr.message);
        drawData.rewardError = rewardErr.message;
      }
    } else if (alreadyRewarded) {
      console.log('💰 Skipping rewards — already distributed in previous recovery');
      drawData.rewardResult = existingDraw.rewardResult;
    }

    await this.logTaskExecution('recover_draw', 'success');
    return drawData;
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
          rarity: meme.rarity || {}, // score-based rarity data (averageScore, totalVotes)
          totalSelectionVotes: Object.values(meme.votes?.selection || {}).reduce((a, b) => a + b, 0),
          totalRarityVotes: Object.values(meme.votes?.rarity || {}).reduce((a, b) => a + b, 0)
        };
      }
    }

    return results;
  }

  selectWinningMeme(results) {
    const entries = Object.values(results);
    if (entries.length === 0) return null;

    // Sort by votes descending; tie-break by earliest meme ID (deterministic)
    entries.sort((a, b) => {
      if (b.totalSelectionVotes !== a.totalSelectionVotes) {
        return b.totalSelectionVotes - a.totalSelectionVotes;
      }
      return (a.id || '').localeCompare(b.id || '');
    });

    return entries[0]; // always returns a winner when memes exist (even with 0 votes)
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
  async triggerTask(taskName, options = {}) {
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
        return await this.runRewardDistribution(options.date);
      case 'recover_draw':
        throw new Error('recover_draw requires a date parameter — use POST /api/scheduler/recover/:date');
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
