const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');

/**
 * Submit vote for a meme and handle ticket rewards
 */
async function submitVote({ memeId, userId, voteType, phase, choice, walletAddress, userWallet }) {
  try {
    const voteId = uuidv4();
    const timestamp = new Date().toISOString();
    const db = getFirestore();

    // Normalize voteType (frontend sends 'phase', backend used 'voteType')
    const normalizedVoteType = phase || voteType;
    // Normalize walletAddress (routes send 'userWallet', frontend sends 'walletAddress')
    const normalizedWallet = walletAddress || userWallet;
    // Normalize userId (use wallet as userId if not provided)
    const normalizedUserId = userId || normalizedWallet;

    // Check if user has already voted for this meme/type
    const existingVote = await db.collection(collections.VOTES)
      .where('memeId', '==', memeId)
      .where('walletAddress', '==', normalizedWallet)
      .where('voteType', '==', normalizedVoteType)
      .limit(1)
      .get();

    if (!existingVote.empty) {
      throw new Error('User has already voted for this meme');
    }

    const voteData = {
      id: voteId,
      memeId,
      userId: normalizedUserId,
      walletAddress: normalizedWallet,
      voteType: normalizedVoteType,
      choice,
      timestamp,
      status: 'active'
    };

    // Save vote to Firestore
    await dbUtils.setDocument(collections.VOTES, voteId, voteData);

    // Update meme vote counts
    await updateMemeVoteCount(memeId, normalizedVoteType, choice);

    console.log(`✅ Vote submitted: ${voteId} (${normalizedVoteType})`);

    // Award tickets for rarity votes only (as per MVP spec)
    let ticketsEarned = 0;
    let userData = null;

    if (normalizedVoteType === 'rarity') {
      // Award 8-15 random tickets for completing the voting flow
      ticketsEarned = Math.floor(Math.random() * 8) + 8;
      userData = await updateUserAfterVote(normalizedWallet, ticketsEarned);
      console.log(`🎫 Awarded ${ticketsEarned} tickets to ${normalizedWallet}`);
    }

    return {
      ...voteData,
      ticketsEarned,
      user: userData
    };

  } catch (error) {
    console.error('❌ Error submitting vote:', error);
    throw error;
  }
}

/**
 * Update user's tickets and streak after voting
 */
async function updateUserAfterVote(walletAddress, ticketsEarned) {
  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Find or create user document
    const usersRef = db.collection(collections.USERS);
    const userQuery = await usersRef
      .where('walletAddress', '==', walletAddress)
      .limit(1)
      .get();

    let userRef;
    let currentData;

    if (userQuery.empty) {
      // Create new user
      const userId = walletAddress; // Use wallet as doc ID for simplicity
      userRef = usersRef.doc(userId);
      currentData = {
        walletAddress,
        weeklyTickets: 0,
        streakDays: 0,
        lastVoteDate: null,
        totalVotes: 0,
        winCount: 0,
        createdAt: new Date().toISOString()
      };
      await userRef.set(currentData);
    } else {
      userRef = userQuery.docs[0].ref;
      currentData = userQuery.docs[0].data();
    }

    // Calculate new streak
    const lastVoteDate = currentData.lastVoteDate;
    let newStreak = currentData.streakDays || 0;

    if (lastVoteDate) {
      const lastDate = new Date(lastVoteDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, streak stays the same
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak += 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    } else {
      // First vote ever
      newStreak = 1;
    }

    // Update user document
    const newWeeklyTickets = (currentData.weeklyTickets || 0) + ticketsEarned;
    const newTotalVotes = (currentData.totalVotes || 0) + 1;

    await userRef.update({
      weeklyTickets: newWeeklyTickets,
      streakDays: newStreak,
      lastVoteDate: today,
      totalVotes: newTotalVotes,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ User updated: ${walletAddress} - Tickets: ${newWeeklyTickets}, Streak: ${newStreak}`);

    return {
      walletAddress,
      weeklyTickets: newWeeklyTickets,
      streakDays: newStreak,
      totalVotes: newTotalVotes
    };

  } catch (error) {
    console.error('❌ Error updating user after vote:', error);
    // Don't throw - voting should still succeed even if user update fails
    return {
      walletAddress,
      weeklyTickets: ticketsEarned,
      streakDays: 1,
      totalVotes: 1,
      error: 'Failed to update user stats'
    };
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
 * Get user's vote history
 */
async function getUserVotes(userId, options = {}) {
  try {
    const db = getFirestore();
    const { page = 1, limit = 20 } = options;

    // Query by walletAddress since that's what we use
    const snapshot = await db.collection(collections.VOTES)
      .where('walletAddress', '==', userId)
      
      .limit(limit)
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
    console.error('❌ Error fetching user votes:', error);
    throw new Error(`Failed to fetch user votes: ${error.message}`);
  }
}

/**
 * Update meme vote counts
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

    const db = getFirestore();
    // Simplified query to avoid composite index requirement
    const snapshot = await db.collection(collections.VOTES)
      .where('status', '==', 'active')
      
      .limit(500)
      .get();

    const stats = {
      totalVotes: 0,
      selectionVotes: 0,
      rarityVotes: 0,
      uniqueVoters: new Set(),
      votesByMeme: {}
    };

    snapshot.forEach(doc => {
      const vote = doc.data();

      // Filter by today's date
      const voteDate = vote.timestamp?.split?.('T')?.[0];
      if (voteDate !== today) return;

      stats.totalVotes++;

      if (vote.voteType === 'selection') {
        stats.selectionVotes++;
      } else if (vote.voteType === 'rarity') {
        stats.rarityVotes++;
      }

      stats.uniqueVoters.add(vote.walletAddress);

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
    const db = getFirestore();

    // Check if already voted for this meme/type
    const existingVote = await db.collection(collections.VOTES)
      .where('memeId', '==', memeId)
      .where('walletAddress', '==', userId)
      .where('voteType', '==', voteType)
      .limit(1)
      .get();

    if (!existingVote.empty) {
      return { canVote: false, eligible: false, reason: 'Already voted for this meme' };
    }

    // Daily limit check - simplified to avoid index requirement
    // For MVP, we skip complex daily limit checking
    // In production, create the required Firestore composite index
    try {
      const today = new Date().toISOString().split('T')[0];
      const userVotes = await db.collection(collections.VOTES)
        .where('walletAddress', '==', userId)
        .limit(100)
        .get();

      // Count today's votes manually to avoid compound index
      let todayCount = 0;
      userVotes.forEach(doc => {
        const voteDate = doc.data().timestamp?.split?.('T')?.[0];
        if (voteDate === today) todayCount++;
      });

      const dailyLimit = 20;
      if (todayCount >= dailyLimit) {
        return { canVote: false, eligible: false, reason: 'Daily vote limit reached' };
      }
    } catch (limitError) {
      // If limit check fails, still allow voting for MVP
      console.warn('Daily limit check skipped:', limitError.message);
    }

    return { canVote: true, eligible: true };
  } catch (error) {
    console.error('❌ Error checking vote eligibility:', error);
    // For MVP, allow voting if check fails
    return { canVote: true, eligible: true, warning: 'Eligibility check error' };
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
  getTodayVotingStats,
  canUserVote,
  updateUserAfterVote,
  // Aliases for routes
  getVotingResults,
  checkVotingEligibility
};
