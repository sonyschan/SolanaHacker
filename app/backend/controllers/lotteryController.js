const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

// Initialize Firestore
const firestore = new Firestore({
  projectId: 'web3ai-469609'
});

/**
 * Create lottery tickets for a user
 */
async function createTickets({ userId, walletAddress, ticketCount, reason }) {
  try {
    const batch = firestore.batch();
    const tickets = [];
    
    for (let i = 0; i < ticketCount; i++) {
      const ticketId = uuidv4();
      const ticketData = {
        id: ticketId,
        userId,
        walletAddress,
        createdAt: new Date().toISOString(),
        reason,
        status: 'active',
        drawDate: getNextDrawDate()
      };
      
      tickets.push(ticketData);
      batch.set(firestore.collection('lottery_tickets').doc(ticketId), ticketData);
    }
    
    await batch.commit();
    
    console.log(`✅ Created ${ticketCount} tickets for user ${userId}`);
    return tickets;
    
  } catch (error) {
    console.error('❌ Error creating tickets:', error);
    throw error;
  }
}

/**
 * Get user's active tickets
 */
async function getUserTickets(userId) {
  try {
    const snapshot = await firestore.collection('lottery_tickets')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
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
    throw error;
  }
}

/**
 * Get next Sunday draw date
 */
function getNextDrawDate() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
  nextSunday.setHours(20, 0, 0, 0); // 8 PM
  
  return nextSunday.toISOString();
}

/**
 * Conduct weekly lottery draw
 */
async function conductLotteryDraw() {
  try {
    console.log('🎰 Starting weekly lottery draw...');
    
    const drawDate = new Date().toISOString();
    const tickets = await getActiveTickets();
    
    if (tickets.length === 0) {
      console.log('No active tickets for draw');
      return null;
    }
    
    // Simple random selection (can be enhanced with verifiable randomness)
    const winnerIndex = Math.floor(Math.random() * tickets.length);
    const winner = tickets[winnerIndex];
    
    // Create draw record
    const drawData = {
      id: uuidv4(),
      date: drawDate,
      totalTickets: tickets.length,
      winnerId: winner.userId,
      winnerWallet: winner.walletAddress,
      winningTicket: winner.id,
      prizeAmount: await calculatePrizePool(),
      status: 'completed'
    };
    
    // Save draw result
    await firestore.collection('lottery_draws').doc(drawData.id).set(drawData);
    
    // Mark all tickets as drawn
    await markTicketsAsDrawn(tickets);
    
    console.log(`🎉 Lottery winner: ${winner.walletAddress}`);
    return drawData;
    
  } catch (error) {
    console.error('❌ Error conducting lottery draw:', error);
    throw error;
  }
}

/**
 * Get all active tickets for current draw
 */
async function getActiveTickets() {
  try {
    const snapshot = await firestore.collection('lottery_tickets')
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
    console.error('❌ Error fetching active tickets:', error);
    throw error;
  }
}

/**
 * Mark tickets as drawn
 */
async function markTicketsAsDrawn(tickets) {
  try {
    const batch = firestore.batch();
    
    tickets.forEach(ticket => {
      batch.update(firestore.collection('lottery_tickets').doc(ticket.id), {
        status: 'drawn',
        drawnAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    console.log(`✅ Marked ${tickets.length} tickets as drawn`);
    
  } catch (error) {
    console.error('❌ Error marking tickets as drawn:', error);
    throw error;
  }
}

/**
 * Calculate current prize pool
 */
async function calculatePrizePool() {
  // Mock implementation - in real app, calculate from NFT sales
  return 0.1; // 0.1 SOL for testing
}

/**
 * Get lottery statistics
 */
async function getLotteryStats() {
  try {
    const activeTicketsSnapshot = await firestore.collection('lottery_tickets')
      .where('status', '==', 'active')
      .get();
    
    const drawsSnapshot = await firestore.collection('lottery_draws')
      .orderBy('date', 'desc')
      .limit(10)
      .get();
    
    const draws = [];
    drawsSnapshot.forEach(doc => {
      draws.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      activeTickets: activeTicketsSnapshot.size,
      nextDrawDate: getNextDrawDate(),
      recentDraws: draws,
      currentPrizePool: await calculatePrizePool()
    };
    
  } catch (error) {
    console.error('❌ Error fetching lottery stats:', error);
    throw error;
  }
}

module.exports = {
  createTickets,
  getUserTickets,
  conductLotteryDraw,
  getActiveTickets,
  getLotteryStats,
  getNextDrawDate
};