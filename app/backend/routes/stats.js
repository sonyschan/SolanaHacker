const express = require('express');
const router = express.Router();
const { getFirestore, collections } = require('../config/firebase');

/**
 * GET /api/stats - Get platform statistics
 * Returns live voters count, total memes, etc.
 */
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];

    // Get unique voters from recent votes (simplified query to avoid index requirement)
    const votesSnapshot = await db.collection(collections.VOTES)
      .where('status', '==', 'active')
      .limit(1000)
      .get();

    const todayVoters = new Set();
    const weekVoters = new Set();
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    votesSnapshot.forEach(doc => {
      const vote = doc.data();
      const voteDate = vote.timestamp ? new Date(vote.timestamp) : null;

      if (voteDate) {
        // Weekly voters
        if (voteDate >= weekAgo) {
          weekVoters.add(vote.walletAddress);
        }
        // Today's voters
        if (vote.timestamp?.split?.('T')?.[0] === today) {
          todayVoters.add(vote.walletAddress);
        }
      }
    });

    // Get total memes count
    const memesSnapshot = await db.collection(collections.MEMES)
      .where('status', '==', 'active')
      .limit(100)
      .get();

    // Get total users count
    const usersSnapshot = await db.collection(collections.USERS)
      .limit(500)
      .get();

    const stats = {
      weeklyVoters: weekVoters.size,
      todayVoters: todayVoters.size,
      totalMemes: memesSnapshot.size,
      totalUsers: usersSnapshot.size,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      stats: {
        weeklyVoters: 0,
        todayVoters: 0,
        totalMemes: 0,
        totalUsers: 0
      }
    });
  }
});

/**
 * POST /api/stats/increment-voters - Increment voter count
 * Called after successful vote
 */
router.post('/increment-voters', async (req, res) => {
  try {
    // This is now handled automatically by counting votes
    // Keeping endpoint for backwards compatibility
    res.json({
      success: true,
      message: 'Voter count updated via votes collection'
    });
  } catch (error) {
    console.error('Increment voters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update voter count'
    });
  }
});

module.exports = router;
