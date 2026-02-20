const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils, admin } = require('../config/firebase');
const rarityService = require('../services/rarityService');

/**
 * Award tickets to user after rarity vote
 * Base: random 1-10, Streak bonus: +min(streakDays, 10)
 * Total range: 2 (day 1 low) to 20 (day 10+ high)
 */
async function awardVotingTickets(walletAddress) {
  try {
    const db = getFirestore();
    const userRef = db.collection(collections.USERS).doc(walletAddress);
    const baseTickets = Math.floor(Math.random() * 10) + 1; // 1-10 tickets

    const today = new Date().toISOString().split('T')[0];
    let ticketsEarned = baseTickets;
    let streakBonus = 0;

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);

      if (!doc.exists) {
        // New user: streak starts at 1
        streakBonus = Math.min(1, 10);
        ticketsEarned = baseTickets + streakBonus;
        transaction.set(userRef, {
          id: walletAddress,
          walletAddress,
          weeklyTickets: ticketsEarned,
          totalTicketsAllTime: ticketsEarned,
          streakDays: 1,
          lastVoteDate: today,
          totalVotes: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const userData = doc.data();
        const lastVoteDate = userData.lastVoteDate || '';

        // Calculate streak
        let newStreak = userData.streakDays || 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastVoteDate === yesterdayStr) {
          newStreak += 1; // Consecutive day
        } else if (lastVoteDate !== today) {
          newStreak = 1; // Reset streak (not consecutive and not same day)
        }
        // If lastVoteDate === today, keep same streak (already voted today)

        streakBonus = Math.min(newStreak, 10);
        ticketsEarned = baseTickets + streakBonus;

        transaction.update(userRef, {
          weeklyTickets: (userData.weeklyTickets || 0) + ticketsEarned,
          totalTicketsAllTime: (userData.totalTicketsAllTime || 0) + ticketsEarned,
          streakDays: newStreak,
          lastVoteDate: today,
          totalVotes: (userData.totalVotes || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }
    });

    // Fetch updated user
    const updatedUser = await userRef.get();
    return {
      ticketsEarned,
      baseTickets,
      streakBonus,
      user: updatedUser.exists ? { id: updatedUser.id, ...updatedUser.data() } : null
    };
  } catch (error) {
    console.error('Error awarding tickets:', error);
    return { ticketsEarned: 0, user: null };
  }
}

/**
 * Submit vote for a meme (Selection or Rarity phase)
 * For rarity votes, accepts numeric score (1-10) instead of string choice
 */
async function submitVote({ memeId, userId, voteType, choice, score, walletAddress }) {
  try {
    const voteId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Check if user has already voted for this meme
    const db = getFirestore();
    const existingVote = await db.collection(collections.VOTES)
      .where('memeId', '==', memeId)
      .where('userId', '==', userId)
      .where('voteType', '==', voteType)
      .limit(1)
      .get();
    
    if (!existingVote.empty) {
      throw new Error('User has already voted for this meme');
    }
    
    const voteData = {
      id: voteId,
      memeId,
      userId,
      walletAddress,
      voteType, // 'selection' or 'rarity'
      timestamp,
      status: 'active'
    };

    // For rarity votes: use score (1-10), fallback to legacy choice
    if (voteType === 'rarity') {
      if (typeof score === 'number') {
        voteData.score = score; // NEW: numeric score
      } else if (choice) {
        voteData.choice = choice; // Legacy: string choice
      }
    } else {
      voteData.choice = choice; // Selection vote: 'yes'/'no'
    }

    // Award tickets after RARITY vote (not selection) - do this BEFORE saving
    let ticketsEarned = 0;
    let updatedUser = null;
    if (voteType === 'rarity') {
      const reward = await awardVotingTickets(walletAddress);
      ticketsEarned = reward.ticketsEarned;
      updatedUser = reward.user;
      voteData.ticketsEarned = ticketsEarned; // Store in vote document for later retrieval
      voteData.baseTickets = reward.baseTickets;
      voteData.streakBonus = reward.streakBonus;
      console.log(`🎫 Awarded ${ticketsEarned} tickets (base ${reward.baseTickets} + streak ${reward.streakBonus}) to ${walletAddress}`);
    }

    // Save vote to Firestore (now includes ticketsEarned for rarity votes)
    await dbUtils.setDocument(collections.VOTES, voteId, voteData);

    // Update meme vote counts (for selection) or average score (for rarity)
    if (voteType === 'rarity' && typeof score === 'number') {
      // Score-based rarity: recalculate average
      await updateMemeRarityScore(memeId);
    } else {
      // Legacy: update vote counts
      await updateMemeVoteCount(memeId, voteType, choice);
    }

    console.log(`✅ Vote submitted: ${voteId} (${voteType}${score ? `, score=${score}` : ''})`);
    return {
      ...voteData,
      ticketsEarned,
      user: updatedUser
    };
    
  } catch (error) {
    console.error('❌ Error submitting vote:', error);
    throw error;
  }
}

/**
 * Get votes for a specific meme
 */
async function getVotesForMeme(memeId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(collections.VOTES)
      .where('memeId', '==', memeId)
      .where('status', '==', 'active')
      .get();
    
    const votes = [];
    snapshot.forEach(doc => {
      votes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return votes;
  } catch (error) {
    console.error('❌ Error fetching votes:', error);
    throw new Error(`Failed to fetch votes: ${error.message}`);
  }
}

/**
 * Get user's vote history by wallet address
 */
async function getUserVotes(walletAddress) {
  try {
    const db = getFirestore();
    // Query by walletAddress, no orderBy to avoid needing composite index
    const snapshot = await db.collection(collections.VOTES)
      .where('walletAddress', '==', walletAddress)
      .limit(100)
      .get();

    const votes = [];
    snapshot.forEach(doc => {
      votes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by timestamp in code (descending)
    votes.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    return votes;
  } catch (error) {
    console.error('❌ Error fetching user votes:', error);
    throw new Error(`Failed to fetch user votes: ${error.message}`);
  }
}

/**
 * Update meme rarity score (for score-based voting)
 * Recalculates average score from all rarity votes
 */
async function updateMemeRarityScore(memeId) {
  try {
    const { averageScore, totalVotes } = await rarityService.calculateMemeAverageScore(memeId);

    const db = getFirestore();
    await db.collection(collections.MEMES).doc(memeId).update({
      'rarity.averageScore': averageScore,
      'rarity.totalVotes': totalVotes,
      'rarity.updatedAt': new Date().toISOString()
    });

    console.log(`✅ Updated rarity score for meme ${memeId}: avg=${averageScore}, votes=${totalVotes}`);
  } catch (error) {
    console.error('❌ Error updating rarity score:', error);
    // Don't throw - vote was still recorded
  }
}

/**
 * Update meme vote counts (legacy)
 */
async function updateMemeVoteCount(memeId, voteType, choice) {
  try {
    const db = getFirestore();
    const memeRef = db.collection(collections.MEMES).doc(memeId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(memeRef);
      
      if (!doc.exists) {
        throw new Error('Meme not found');
      }
      
      const memeData = doc.data();
      const votes = memeData.votes || { selection: {}, rarity: {} };
      
      // Initialize vote counts if not exist
      if (!votes[voteType]) {
        votes[voteType] = {};
      }
      
      if (!votes[voteType][choice]) {
        votes[voteType][choice] = 0;
      }
      
      // Increment vote count
      votes[voteType][choice] += 1;
      
      // Update document
      transaction.update(memeRef, { votes });
    });
    
    console.log(`✅ Updated vote count for meme ${memeId}: ${voteType}.${choice}`);
    
  } catch (error) {
    console.error('❌ Error updating vote count:', error);
    throw error;
  }
}

/**
 * Get voting statistics for today
 */
async function getTodayVotingStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
    
    const db = getFirestore();
    const snapshot = await db.collection(collections.VOTES)
      .where('timestamp', '>=', startOfDay)
      .where('timestamp', '<=', endOfDay)
      .where('status', '==', 'active')
      .get();
    
    const stats = {
      totalVotes: snapshot.size,
      selectionVotes: 0,
      rarityVotes: 0,
      uniqueVoters: new Set(),
      votesByMeme: {}
    };
    
    snapshot.forEach(doc => {
      const vote = doc.data();
      
      if (vote.voteType === 'selection') {
        stats.selectionVotes++;
      } else if (vote.voteType === 'rarity') {
        stats.rarityVotes++;
      }
      
      stats.uniqueVoters.add(vote.userId);
      
      if (!stats.votesByMeme[vote.memeId]) {
        stats.votesByMeme[vote.memeId] = 0;
      }
      stats.votesByMeme[vote.memeId]++;
    });
    
    stats.uniqueVoters = stats.uniqueVoters.size;
    
    return stats;
  } catch (error) {
    console.error('❌ Error fetching voting stats:', error);
    throw new Error(`Failed to fetch voting stats: ${error.message}`);
  }
}

/**
 * Check if user can vote (rate limiting / daily limits)
 */
async function canUserVote(userId, memeId, voteType) {
  try {
    // Check if already voted for this meme/type
    const db = getFirestore();
    const existingVote = await db.collection(collections.VOTES)
      .where('memeId', '==', memeId)
      .where('userId', '==', userId)
      .where('voteType', '==', voteType)
      .limit(1)
      .get();
    
    if (!existingVote.empty) {
      return { canVote: false, reason: 'Already voted for this meme' };
    }
    
    // Check daily vote limit (e.g., 10 votes per day)
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
    
    const todayVotes = await db.collection(collections.VOTES)
      .where('userId', '==', userId)
      .where('timestamp', '>=', startOfDay)
      .where('timestamp', '<=', endOfDay)
      .get();
    
    const dailyLimit = 20; // 20 votes per day
    if (todayVotes.size >= dailyLimit) {
      return { canVote: false, reason: 'Daily vote limit reached' };
    }
    
    return { canVote: true };
  } catch (error) {
    console.error('❌ Error checking vote eligibility:', error);
    throw new Error(`Failed to check vote eligibility: ${error.message}`);
  }
}

// Alias functions to match route imports
const getVotingResults = getTodayVotingStats;
const checkVotingEligibility = canUserVote;

module.exports = {
  submitVote,
  getVotesForMeme,
  getUserVotes,
  updateMemeVoteCount,
  updateMemeRarityScore,
  awardVotingTickets,
  getTodayVotingStats,
  canUserVote,
  // Aliases for routes
  getVotingResults,
  checkVotingEligibility
};