const express = require('express');
const router = express.Router();
const { getFirestore, collections } = require('../config/firebase');
const { rateLimitByWallet } = require('../middleware/auth');
const Joi = require('joi');

const rateLimiter = rateLimitByWallet(10, 15 * 60 * 1000);

// Validation schemas
const profileUpdateSchema = Joi.object({
  displayName: Joi.string().min(1).max(50).optional(),
  bio: Joi.string().max(200).optional(),
  avatar: Joi.string().uri().optional(),
  preferences: Joi.object({
    notifications: Joi.boolean().optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional(),
    language: Joi.string().valid('en', 'zh-TW', 'zh-CN').optional()
  }).optional()
});

/**
 * GET /api/users/:wallet - Get user profile
 */
router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    // Validate wallet format (basic check)
    if (!wallet || wallet.length < 32) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    const db = getFirestore();

    // Try to find existing user
    const userQuery = await db.collection(collections.USERS)
      .where('walletAddress', '==', wallet)
      .limit(1)
      .get();

    if (userQuery.empty) {
      // Return default profile for new user
      return res.json({
        success: true,
        user: {
          wallet,
          displayName: `User_${wallet.slice(0, 6)}`,
          joinDate: new Date().toISOString(),
          weeklyTickets: 0,
          streakDays: 0,
          totalVotes: 0,
          winCount: 0,
          level: 'Rookie',
          isNewUser: true
        }
      });
    }

    const userData = userQuery.docs[0].data();

    res.json({
      success: true,
      user: {
        wallet: userData.walletAddress,
        displayName: userData.displayName || `User_${wallet.slice(0, 6)}`,
        joinDate: userData.createdAt,
        weeklyTickets: userData.weeklyTickets || 0,
        streakDays: userData.streakDays || 0,
        totalVotes: userData.totalVotes || 0,
        winCount: userData.winCount || 0,
        level: calculateLevel(userData.totalVotes || 0),
        isNewUser: false
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
});

/**
 * Calculate user level based on total votes
 */
function calculateLevel(totalVotes) {
  if (totalVotes >= 100) return 'Legend';
  if (totalVotes >= 50) return 'Veteran';
  if (totalVotes >= 20) return 'Regular';
  if (totalVotes >= 5) return 'Member';
  return 'Rookie';
}

/**
 * PUT /api/users/:wallet - Update user profile
 */
router.put('/:wallet', rateLimiter, async (req, res) => {
  try {
    const { wallet } = req.params;

    // Validate request body
    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile data',
        details: error.details[0].message
      });
    }

    const db = getFirestore();

    // Find user
    const userQuery = await db.collection(collections.USERS)
      .where('walletAddress', '==', wallet)
      .limit(1)
      .get();

    if (userQuery.empty) {
      // Create new user with profile data
      const userRef = db.collection(collections.USERS).doc(wallet);
      await userRef.set({
        walletAddress: wallet,
        ...value,
        weeklyTickets: 0,
        streakDays: 0,
        totalVotes: 0,
        winCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing user
      await userQuery.docs[0].ref.update({
        ...value,
        updatedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:wallet/tickets - Get user's tickets
 */
router.get('/:wallet/tickets', async (req, res) => {
  try {
    const { wallet } = req.params;

    const db = getFirestore();
    const userQuery = await db.collection(collections.USERS)
      .where('walletAddress', '==', wallet)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.json({
        success: true,
        data: {
          weeklyTickets: 0,
          totalTickets: 0,
          tickets: []
        }
      });
    }

    const userData = userQuery.docs[0].data();

    res.json({
      success: true,
      data: {
        weeklyTickets: userData.weeklyTickets || 0,
        totalTickets: userData.totalTickets || userData.weeklyTickets || 0,
        streakDays: userData.streakDays || 0
      }
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tickets',
      message: error.message
    });
  }
});

/**
 * GET /api/users/:wallet/stats - Get comprehensive user statistics
 */
router.get('/:wallet/stats', async (req, res) => {
  try {
    const { wallet } = req.params;

    const db = getFirestore();
    const userQuery = await db.collection(collections.USERS)
      .where('walletAddress', '==', wallet)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.json({
        success: true,
        data: {
          totalVotes: 0,
          weeklyTickets: 0,
          streakDays: 0,
          winCount: 0,
          level: 'Rookie'
        }
      });
    }

    const userData = userQuery.docs[0].data();

    res.json({
      success: true,
      data: {
        totalVotes: userData.totalVotes || 0,
        weeklyTickets: userData.weeklyTickets || 0,
        streakDays: userData.streakDays || 0,
        winCount: userData.winCount || 0,
        level: calculateLevel(userData.totalVotes || 0),
        lastVoteDate: userData.lastVoteDate || null
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/users/leaderboard - Get user leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'votes', limit = 50 } = req.query;

    const db = getFirestore();
    let orderField = 'totalVotes';

    if (type === 'tickets') orderField = 'weeklyTickets';
    if (type === 'streak') orderField = 'streakDays';

    const snapshot = await db.collection(collections.USERS)
      .orderBy(orderField, 'desc')
      .limit(parseInt(limit))
      .get();

    const leaderboard = [];
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      leaderboard.push({
        rank: index + 1,
        wallet: data.walletAddress,
        displayName: data.displayName || `User_${data.walletAddress?.slice(0, 6)}`,
        value: data[orderField] || 0,
        level: calculateLevel(data.totalVotes || 0)
      });
    });

    res.json({
      success: true,
      data: leaderboard,
      meta: {
        type,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

module.exports = router;
