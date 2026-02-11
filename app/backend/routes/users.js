const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserTickets, getUserStats } = require('../controllers/userController');
const { authenticateUser, rateLimiter } = require('../middleware/auth');
const Joi = require('joi');

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
    
    const userProfile = await getUserProfile(wallet);
    
    if (!userProfile) {
      // Create default profile if user doesn't exist
      return res.json({
        success: true,
        data: {
          wallet,
          displayName: `User_${wallet.slice(0, 6)}`,
          joinDate: new Date().toISOString(),
          ticketCount: 0,
          totalVotes: 0,
          winCount: 0,
          level: 'Rookie',
          isNewUser: true
        }
      });
    }
    
    res.json({
      success: true,
      data: userProfile
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
    
    const updatedProfile = await updateUserProfile(wallet, value);
    
    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully! ✨'
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
    const { page = 1, limit = 20, status = 'active' } = req.query;
    
    const tickets = await getUserTickets(wallet, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    res.json({
      success: true,
      data: tickets,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: tickets.length
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
    const { timeframe = '30d' } = req.query; // 7d, 30d, 90d, all
    
    const stats = await getUserStats(wallet, timeframe);
    
    res.json({
      success: true,
      data: stats
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
 * POST /api/users/:wallet/tickets/claim - Claim lottery tickets for voting
 */
router.post('/:wallet/tickets/claim', rateLimiter, async (req, res) => {
  try {
    const { wallet } = req.params;
    const { voteId, memeId } = req.body;
    
    if (!voteId || !memeId) {
      return res.status(400).json({
        success: false,
        error: 'Vote ID and Meme ID are required'
      });
    }
    
    // Logic to award tickets based on voting participation
    // Number of tickets awarded: 8-15 per vote (randomized)
    const ticketCount = Math.floor(Math.random() * 8) + 8; // 8-15 tickets
    
    const claimedTickets = await claimTickets(wallet, {
      voteId,
      memeId,
      ticketCount,
      claimedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: claimedTickets,
      message: `Congratulations! You've received ${ticketCount} lottery tickets! 🎫`
    });
  } catch (error) {
    console.error('Claim tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim tickets',
      message: error.message
    });
  }
});

/**
 * GET /api/users/leaderboard - Get user leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'votes', limit = 50, timeframe = '30d' } = req.query;
    // type: votes, wins, tickets, earnings
    
    const leaderboard = await getUserLeaderboard({
      type,
      limit: parseInt(limit),
      timeframe
    });
    
    res.json({
      success: true,
      data: leaderboard,
      meta: {
        type,
        timeframe,
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

/**
 * GET /api/users/:wallet/achievements - Get user achievements
 */
router.get('/:wallet/achievements', async (req, res) => {
  try {
    const { wallet } = req.params;
    
    const achievements = await getUserAchievements(wallet);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
      message: error.message
    });
  }
});

module.exports = router;