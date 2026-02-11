const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

// Initialize Firestore
const firestore = new Firestore({
  projectId: 'web3ai-469609'
});

/**
 * Submit vote for a meme (Selection phase)
 */
async function submitVote({ memeId, userId, voteType, choice, walletAddress }) {
  try {
    const voteId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Check if user has already voted for this meme
    const existingVote = await firestore.collection('votes')
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
      choice, // For selection: 'yes'/'no', For rarity: 'common'/'uncommon'/'rare'/'legendary'
      timestamp,
      status: 'active'
    };
    
    // Save vote to Firestore
    await firestore.collection('votes').doc(voteId).set(voteData);
    
    // Update meme vote counts
    await updateMemeVoteCount(memeId, voteType, choice);
    
    console.log(`✅ Vote submitted: ${voteId}`);
    return voteData;
    
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
    const snapshot = await firestore.collection('votes')
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
async function getUserVotes(userId) {
  try {
    const snapshot = await firestore.collection('votes')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
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
    const memeRef = firestore.collection('memes').doc(memeId);
    
    await firestore.runTransaction(async (transaction) => {
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
    
    const snapshot = await firestore.collection('votes')
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
    const existingVote = await firestore.collection('votes')
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
    
    const todayVotes = await firestore.collection('votes')
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
  getTodayVotingStats,
  canUserVote,
  // Aliases for routes
  getVotingResults,
  checkVotingEligibility
};