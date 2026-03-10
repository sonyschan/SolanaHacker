const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserTickets, getUserStats } = require('../controllers/userController');
const { getMemeyaBalance, calculateTokenBonus } = require('../services/solanaService');
const { authenticateUser, rateLimiter } = require('../middleware/auth');
const { cacheResponse, TTL } = require('../utils/cache');
const { getFirestore, collections, dbUtils, admin } = require('../config/firebase');
const { createReferralIdForWallet } = require('../controllers/votingController');
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

    // Ticket/streak data lives in a wallet-keyed doc (written by awardVotingTickets)
    // while the profile may live in a UUID-keyed doc — merge them
    const ticketDoc = await dbUtils.getDocument(collections.USERS, wallet);

    if (!userProfile) {
      // Create default profile if user doesn't exist
      return res.json({
        success: true,
        user: {
          wallet,
          displayName: `User_${wallet.slice(0, 6)}`,
          joinDate: new Date().toISOString(),
          weeklyTickets: ticketDoc?.weeklyTickets || 0,
          streakDays: ticketDoc?.streakDays || 0,
          lotteryOptIn: ticketDoc?.lotteryOptIn !== false,
          nftWins: ticketDoc?.nftWins || [],
          totalVotes: ticketDoc?.totalVotes || 0,
          winCount: 0,
          level: 'Rookie',
          isNewUser: true,
          referredBy: null,
          referralCount: 0
        }
      });
    }

    res.json({
      success: true,
      user: {
        ...userProfile,
        // Overlay ticket/streak from wallet-keyed doc if profile doc lacks them
        weeklyTickets: userProfile.weeklyTickets ?? ticketDoc?.weeklyTickets ?? 0,
        streakDays: userProfile.streakDays ?? ticketDoc?.streakDays ?? 0,
        lotteryOptIn: userProfile.lotteryOptIn ?? (ticketDoc?.lotteryOptIn !== false),
        nftWins: userProfile.nftWins ?? ticketDoc?.nftWins ?? [],
        referredBy: userProfile.referredBy || null,
        referralCount: userProfile.referralCount || 0,
        referralId: userProfile.referralId || null
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
 * GET /api/users/leaderboard - Get user leaderboard (cached 30min)
 */
router.get('/leaderboard', cacheResponse(req => `users:leaderboard:${req.query.type || 'votes'}:${req.query.timeframe || '30d'}`, TTL.HALF_HOUR), async (req, res) => {
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

/**
 * GET /api/users/:wallet/memeya-balance - Get $Memeya token balance and bonus
 */
router.get('/:wallet/memeya-balance', async (req, res) => {
  try {
    const { wallet } = req.params;
    const balance = await getMemeyaBalance(wallet);
    const bonus = calculateTokenBonus(balance);

    res.json({
      success: true,
      data: { balance, bonus }
    });
  } catch (error) {
    console.error('Get $Memeya balance error:', error.message);
    res.json({ success: false, error: 'Balance check temporarily unavailable' });
  }
});

/**
 * POST /api/users/:wallet/refresh-memeya-balance
 * Fetch fresh $Memeya balance via RPC and cache it on the Firestore user doc.
 * Used when a previously-prompted user revisits after the 1-hour cooldown,
 * so their cached balance is up-to-date for the daily USDC draw.
 */
router.post('/:wallet/refresh-memeya-balance', rateLimiter, async (req, res) => {
  try {
    const { wallet } = req.params;
    const balance = await getMemeyaBalance(wallet);
    const bonus = calculateTokenBonus(balance);

    // Update Firestore user doc with fresh balance
    const { getFirestore, collections } = require('../config/firebase');
    const db = getFirestore();
    const userRef = db.collection(collections.USERS).doc(wallet);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      await userRef.update({
        memeyaBalance: balance,
        memeyaBalanceUpdatedAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: { balance, bonus }
    });
  } catch (error) {
    console.error('Refresh $Memeya balance error:', error.message);
    res.json({ success: false, error: 'Balance refresh temporarily unavailable' });
  }
});

// ==================== Referral ID Endpoints ====================

const REFERRAL_ID_BLOCKLIST = ['admin', 'test', 'null', 'undefined', 'api', 'app', 'www', 'help', 'root', 'user', 'mod'];

/**
 * POST /api/users/:wallet/set-referral-id - Set custom referral ID
 */
router.post('/:wallet/set-referral-id', rateLimiter, async (req, res) => {
  try {
    const { wallet } = req.params;
    const { referralId } = req.body;

    if (!referralId || typeof referralId !== 'string') {
      return res.status(400).json({ success: false, error: 'referralId is required' });
    }

    // Validate format: 3-8 alphanumeric chars
    if (!/^[a-zA-Z0-9]{3,8}$/.test(referralId)) {
      return res.status(400).json({ success: false, error: '3-8 alphanumeric characters required' });
    }

    // Check blocklist
    if (REFERRAL_ID_BLOCKLIST.includes(referralId.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'This ID is reserved' });
    }

    const db = getFirestore();

    await db.runTransaction(async (txn) => {
      // Check new ID doesn't already exist
      const newIdRef = db.collection(collections.REFERRAL_IDS).doc(referralId);
      const newIdDoc = await txn.get(newIdRef);
      if (newIdDoc.exists) {
        throw new Error('ID_TAKEN');
      }

      // Get user doc
      const userRef = db.collection(collections.USERS).doc(wallet);
      const userDoc = await txn.get(userRef);
      if (!userDoc.exists) {
        throw new Error('USER_NOT_FOUND');
      }

      const userData = userDoc.data();
      const oldId = userData.referralId;

      // Delete old referral ID mapping if exists
      if (oldId) {
        const oldIdRef = db.collection(collections.REFERRAL_IDS).doc(oldId);
        txn.delete(oldIdRef);
      }

      // Create new referral ID mapping
      txn.set(newIdRef, {
        wallet,
        createdAt: new Date().toISOString(),
        isCustom: true
      });

      // Update user doc
      txn.update(userRef, { referralId });
    });

    res.json({ success: true, referralId });
  } catch (error) {
    if (error.message === 'ID_TAKEN') {
      return res.status(409).json({ success: false, error: 'This ID is already taken' });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    console.error('Set referral ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to set referral ID' });
  }
});

// ==================== Referral Endpoints ====================

/**
 * POST /api/users/:wallet/set-referrer - Set referrer (one-time, locked)
 * Accepts referrerWallet as either a wallet address (32-44 chars base58) or a referral ID (3-8 chars alphanumeric)
 */
router.post('/:wallet/set-referrer', rateLimiter, async (req, res) => {
  try {
    const { wallet } = req.params;
    const { referrerWallet } = req.body;

    if (!referrerWallet || typeof referrerWallet !== 'string') {
      return res.status(400).json({ success: false, error: 'referrerWallet is required' });
    }

    const db = getFirestore();
    const input = referrerWallet.trim();
    let resolvedWallet;

    // Determine if input is a referral ID (3-8 alphanumeric) or wallet address (32-44 base58)
    if (/^[a-zA-Z0-9]{3,8}$/.test(input) && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
      // Looks like a referral ID — resolve it
      const idDoc = await db.collection(collections.REFERRAL_IDS).doc(input).get();
      if (!idDoc.exists) {
        return res.status(400).json({ success: false, error: 'Referrer not found' });
      }
      resolvedWallet = idDoc.data().wallet;
    } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
      resolvedWallet = input;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid referrer ID or wallet address' });
    }

    // Block self-referral
    if (resolvedWallet === wallet) {
      return res.status(400).json({ success: false, error: 'Cannot refer yourself' });
    }

    // Use transaction to prevent race condition (double-set referrer)
    await db.runTransaction(async (txn) => {
      const userRef = db.collection(collections.USERS).doc(wallet);
      const referrerRef = db.collection(collections.USERS).doc(resolvedWallet);
      const referralRef = db.collection(collections.REFERRALS).doc(wallet);

      const [userDoc, referrerDoc] = await Promise.all([
        txn.get(userRef),
        txn.get(referrerRef)
      ]);

      if (userDoc.exists && userDoc.data().referredBy) {
        throw new Error('Referrer already set');
      }
      if (!referrerDoc.exists) {
        throw new Error('Referrer wallet not found');
      }

      const now = new Date().toISOString();

      txn.set(userRef, {
        referredBy: resolvedWallet,
        referredBySetAt: now
      }, { merge: true });

      txn.set(referralRef, {
        referrerWallet: resolvedWallet,
        referredWallet: wallet,
        createdAt: now,
        totalReferrerEarnings: 0,
        totalReferredBonus: 0,
        lastRewardAt: null
      });

      txn.set(referrerRef, {
        referralCount: admin.firestore.FieldValue.increment(1)
      }, { merge: true });
    });

    res.json({ success: true, message: 'Referrer set successfully' });
  } catch (error) {
    console.error('Set referrer error:', error);
    // Surface transaction validation errors as 400s
    if (error.message === 'Referrer already set' || error.message === 'Referrer wallet not found') {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Failed to set referrer' });
  }
});

/**
 * GET /api/users/:wallet/referrals - List referred users + stats
 */
router.get('/:wallet/referrals', async (req, res) => {
  try {
    const { wallet } = req.params;
    const db = getFirestore();

    // Get all users referred by this wallet
    const snap = await db.collection(collections.REFERRALS)
      .where('referrerWallet', '==', wallet)
      .get();

    const referrals = snap.docs.map(doc => {
      const d = doc.data();
      return {
        wallet: d.referredWallet,
        joinedAt: d.createdAt,
        totalEarnings: d.totalReferrerEarnings || 0
      };
    });

    // Fetch memeyaBalance qualification for each referral (batch)
    const referredWallets = referrals.map(r => r.wallet);
    const userDocs = await Promise.all(
      referredWallets.map(w => db.collection(collections.USERS).doc(w).get())
    );
    const enriched = referrals.map((r, i) => {
      const userData = userDocs[i].exists ? userDocs[i].data() : {};
      return {
        ...r,
        usdcQualified: (userData.memeyaBalance || 0) >= 10000,
        maskedWallet: r.wallet.slice(0, 4) + '...' + r.wallet.slice(-4)
      };
    });

    res.json({
      success: true,
      data: {
        referrals: enriched,
        count: enriched.length,
        totalEarnings: referrals.reduce((sum, r) => sum + r.totalEarnings, 0)
      }
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referrals' });
  }
});

/**
 * GET /api/users/:wallet/referral-info - Lightweight referral status
 * Auto-generates referralId for existing users who don't have one yet
 */
router.get('/:wallet/referral-info', async (req, res) => {
  try {
    const { wallet } = req.params;
    const db = getFirestore();

    const userRef = db.collection(collections.USERS).doc(wallet);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Auto-generate referralId for existing users who don't have one
    let referralId = userData.referralId || null;
    if (userDoc.exists && !referralId) {
      try {
        referralId = await db.runTransaction(async (txn) => {
          const freshUser = await txn.get(userRef);
          if (freshUser.data()?.referralId) {
            return freshUser.data().referralId;
          }
          const newId = await createReferralIdForWallet(wallet, txn);
          txn.update(userRef, { referralId: newId });
          return newId;
        });
      } catch (e) {
        console.error('Auto-generate referral ID failed:', e.message);
      }
    }

    const referralDoc = await db.collection(collections.REFERRALS).doc(wallet).get();
    const referralData = referralDoc.exists ? referralDoc.data() : null;

    res.json({
      success: true,
      data: {
        referralId,
        referredBy: userData.referredBy || null,
        referralCount: userData.referralCount || 0,
        memeyaBalance: userData.memeyaBalance || 0,
        isElite: (userData.memeyaBalance || 0) >= 50000,
        referralBonus: referralData ? referralData.totalReferredBonus : 0
      }
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral info' });
  }
});

module.exports = router;