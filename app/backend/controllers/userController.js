const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils, admin } = require('../config/firebase');

/**
 * Get or create user profile
 */
async function getOrCreateUser(walletAddress) {
  try {
    // Try to find existing user
    const db = getFirestore();
    const snapshot = await db.collection(collections.USERS)
      .where('walletAddress', '==', walletAddress)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    // Create new user
    const userId = uuidv4();
    const userData = {
      id: userId,
      walletAddress,
      createdAt: new Date().toISOString(),
      stats: {
        totalVotes: 0,
        totalTickets: 0,
        totalWinnings: 0,
        winStreak: 0,
        maxWinStreak: 0
      },
      preferences: {
        notifications: true,
        theme: 'light'
      },
      status: 'active'
    };
    
    await dbUtils.setDocument(collections.USERS, userId, userData);
    
    console.log(`✅ New user created: ${userId}`);
    return userData;
    
  } catch (error) {
    console.error('❌ Error getting/creating user:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

/**
 * Update user statistics
 */
async function updateUserStats(userId, updates) {
  try {
    const db = getFirestore();
    const userRef = db.collection(collections.USERS).doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      
      if (!doc.exists) {
        throw new Error('User not found');
      }
      
      const userData = doc.data();
      const currentStats = userData.stats || {};
      
      // Merge stats updates
      const newStats = {
        ...currentStats,
        ...updates
      };
      
      transaction.update(userRef, { 
        stats: newStats,
        updatedAt: new Date().toISOString()
      });
    });
    
    console.log(`✅ User stats updated: ${userId}`);
    
  } catch (error) {
    console.error('❌ Error updating user stats:', error);
    throw error;
  }
}

/**
 * Get user's tickets
 */
async function getUserTickets(userId) {
  try {
    const snapshot = await firestore.collection('tickets')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();
    
    const tickets = [];
    snapshot.forEach(doc => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return tickets;
  } catch (error) {
    console.error('❌ Error fetching user tickets:', error);
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }
}

/**
 * Award tickets to user for voting
 */
async function awardTickets(userId, memeId, voteType, correctPrediction = false) {
  try {
    let ticketCount = 1; // Base ticket for voting
    
    // Bonus ticket for correct rarity prediction
    if (voteType === 'rarity' && correctPrediction) {
      ticketCount = 2;
    }
    
    const tickets = [];
    
    for (let i = 0; i < ticketCount; i++) {
      const ticketId = uuidv4();
      const ticketData = {
        id: ticketId,
        userId,
        memeId,
        voteType,
        awardedAt: new Date().toISOString(),
        awardedFor: correctPrediction ? 'correct_prediction' : 'participation',
        status: 'active',
        lotteryStatus: 'pending' // pending, entered, won, lost
      };
      
      await firestore.collection('tickets').doc(ticketId).set(ticketData);
      tickets.push(ticketData);
    }
    
    // Update user stats
    await updateUserStats(userId, {
      totalTickets: firestore.FieldValue.increment(ticketCount)
    });
    
    console.log(`✅ Awarded ${ticketCount} tickets to user ${userId}`);
    return tickets;
    
  } catch (error) {
    console.error('❌ Error awarding tickets:', error);
    throw error;
  }
}

/**
 * Get user's voting history with rewards
 */
async function getUserVotingHistory(userId, limit = 20) {
  try {
    const votesSnapshot = await firestore.collection('votes')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const history = [];
    
    for (const doc of votesSnapshot.docs) {
      const vote = { id: doc.id, ...doc.data() };
      
      // Get associated tickets
      const ticketsSnapshot = await firestore.collection('tickets')
        .where('userId', '==', userId)
        .where('memeId', '==', vote.memeId)
        .get();
      
      const tickets = [];
      ticketsSnapshot.forEach(ticketDoc => {
        tickets.push({ id: ticketDoc.id, ...ticketDoc.data() });
      });
      
      history.push({
        ...vote,
        tickets
      });
    }
    
    return history;
    
  } catch (error) {
    console.error('❌ Error fetching voting history:', error);
    throw new Error(`Failed to fetch voting history: ${error.message}`);
  }
}

/**
 * Get user dashboard data
 */
async function getUserDashboard(walletAddress) {
  try {
    const user = await getOrCreateUser(walletAddress);
    const tickets = await getUserTickets(user.id);
    const votingHistory = await getUserVotingHistory(user.id, 5);
    
    // Get today's voting status
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
    const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();
    
    const todayVotes = await firestore.collection('votes')
      .where('userId', '==', user.id)
      .where('timestamp', '>=', startOfDay)
      .where('timestamp', '<=', endOfDay)
      .get();
    
    return {
      user,
      tickets: {
        total: tickets.length,
        active: tickets.filter(t => t.status === 'active').length,
        tickets: tickets.slice(0, 10) // Show latest 10 tickets
      },
      voting: {
        todayCount: todayVotes.size,
        canVoteToday: todayVotes.size < 20, // Daily limit
        recentHistory: votingHistory
      },
      stats: user.stats || {}
    };
    
  } catch (error) {
    console.error('❌ Error fetching user dashboard:', error);
    throw new Error(`Failed to fetch dashboard: ${error.message}`);
  }
}

module.exports = {
  getOrCreateUser,
  updateUserStats,
  getUserTickets,
  awardTickets,
  getUserVotingHistory,
  getUserDashboard
};