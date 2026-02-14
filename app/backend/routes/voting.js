const express = require('express');
const router = express.Router();
const { submitVote, getVotingResults, getUserVotes, checkVotingEligibility } = require('../controllers/votingController');
const { authenticateUser, rateLimiter } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const voteSchema = Joi.object({
  memeId: Joi.string().required(),
  phase: Joi.string().valid('selection', 'rarity').required(),
  choice: Joi.alternatives().try(
    Joi.string().valid('yes', 'no'), // Phase 1: yes/no for selection
    Joi.string().valid('common', 'uncommon', 'rare', 'legendary') // Phase 2: rarity
  ).required(),
  userWallet: Joi.string().required(),
  timestamp: Joi.date().default(Date.now)
});

/**
 * GET /api/voting/status - Get current voting status
 */
router.get('/status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const status = await getVotingResults(today);
    
    res.json({
      success: true,
      data: {
        date: today,
        phase: status.currentPhase || 'selection',
        totalVotes: status.totalVotes || 0,
        participantCount: status.participantCount || 0,
        timeRemaining: status.timeRemaining,
        memes: status.memes || []
      }
    });
  } catch (error) {
    console.error('Get voting status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voting status',
      message: error.message
    });
  }
});

/**
 * POST /api/voting/submit - Submit a vote
 * Body: { memeId, phase, choice, userWallet }
 */
router.post('/submit', rateLimiter, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = voteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote data',
        details: error.details[0].message
      });
    }

    const { memeId, phase, choice, userWallet } = value;

    // Check voting eligibility
    const eligibility = await checkVotingEligibility(userWallet, memeId, phase);
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        error: 'Not eligible to vote',
        reason: eligibility.reason
      });
    }

    // Submit vote
    const voteResult = await submitVote({
      memeId,
      phase,
      choice,
      userWallet,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: voteResult,
      message: `${phase} vote submitted successfully! 🗳️`
    });
  } catch (error) {
    console.error('Submit vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit vote',
      message: error.message
    });
  }
});

/**
 * GET /api/voting/results/:date - Get voting results for specific date
 */
router.get('/results/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const results = await getVotingResults(date);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voting results',
      message: error.message
    });
  }
});

/**
 * GET /api/voting/user/:wallet - Get user's voting history
 */
router.get('/user/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const userVotes = await getUserVotes(wallet, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: userVotes,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: userVotes.length
      }
    });
  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user votes',
      message: error.message
    });
  }
});

/**
 * GET /api/voting/eligibility/:wallet/:memeId - Check if user can vote
 */
router.get('/eligibility/:wallet/:memeId', async (req, res) => {
  try {
    const { wallet, memeId } = req.params;
    const { phase = 'selection' } = req.query;
    
    const eligibility = await checkVotingEligibility(wallet, memeId, phase);
    
    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error('Check voting eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check voting eligibility',
      message: error.message
    });
  }
});

/**
 * GET /api/voting/analytics/today - Get today's voting analytics
 */
router.get('/analytics/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const analytics = await getVotingResults(today);
    
    // Calculate analytics
    const totalVotes = analytics.memes?.reduce((sum, meme) => sum + (meme.voteCount || 0), 0) || 0;
    const avgVotesPerMeme = analytics.memes?.length > 0 ? totalVotes / analytics.memes.length : 0;
    const topMeme = analytics.memes?.reduce((top, current) => 
      (current.voteCount || 0) > (top.voteCount || 0) ? current : top
    , analytics.memes[0]) || null;
    
    res.json({
      success: true,
      data: {
        date: today,
        totalVotes,
        participantCount: analytics.participantCount || 0,
        memesCount: analytics.memes?.length || 0,
        avgVotesPerMeme: Math.round(avgVotesPerMeme * 100) / 100,
        topMeme: topMeme ? {
          id: topMeme.id,
          title: topMeme.title,
          voteCount: topMeme.voteCount
        } : null,
        currentPhase: analytics.currentPhase || 'selection'
      }
    });
  } catch (error) {
    console.error('Get voting analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voting analytics',
      message: error.message
    });
  }
});

module.exports = router;