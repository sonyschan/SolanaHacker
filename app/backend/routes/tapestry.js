/**
 * Tapestry Social Routes — Comments API for frontend
 *
 * GET  /api/tapestry/comments/:memeId        → Get comments for a meme
 * POST /api/tapestry/comments                → Create comment
 * GET  /api/tapestry/comments/:memeId/count  → Get comment count (lightweight)
 */

const express = require('express');
const router = express.Router();
const tapestryService = require('../services/tapestryService');
const { getFirestore, collections } = require('../config/firebase');

/**
 * GET /comments/:memeId — Get comments for a meme
 */
router.get('/comments/:memeId', async (req, res) => {
  try {
    const { memeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    // Look up tapestryContentId from Firestore
    const db = getFirestore();
    const memeDoc = await db.collection(collections.MEMES).doc(memeId).get();

    if (!memeDoc.exists) {
      return res.json({ success: true, comments: [], total: 0 });
    }

    const contentId = memeDoc.data().tapestryContentId;
    if (!contentId) {
      return res.json({ success: true, comments: [], total: 0 });
    }

    const result = await tapestryService.getComments(contentId, page, pageSize);

    // Normalize Tapestry response: { comments: [{ comment: { id, text, created_at }, author: { id, username } }] }
    const comments = (result.comments || []).map(c => ({
      id: c.comment?.id,
      text: c.comment?.text,
      createdAt: c.comment?.created_at,
      author: {
        id: c.author?.id,
        username: c.author?.username || 'anon',
      },
    }));

    res.json({ success: true, comments, total: comments.length });
  } catch (error) {
    console.error('[tapestry] GET comments error:', error.message);
    res.json({ success: true, comments: [], total: 0 });
  }
});

/**
 * GET /comments/:memeId/count — Lightweight comment count
 */
router.get('/comments/:memeId/count', async (req, res) => {
  try {
    const { memeId } = req.params;

    const db = getFirestore();
    const memeDoc = await db.collection(collections.MEMES).doc(memeId).get();

    if (!memeDoc.exists || !memeDoc.data().tapestryContentId) {
      return res.json({ success: true, count: 0 });
    }

    const result = await tapestryService.getComments(memeDoc.data().tapestryContentId, 1, 100);
    const count = (result.comments || []).length;

    res.json({ success: true, count });
  } catch (error) {
    console.error('[tapestry] GET count error:', error.message);
    res.json({ success: true, count: 0 });
  }
});

/**
 * POST /comments — Create a comment on a meme
 * Body: { memeId, walletAddress, text }
 */
router.post('/comments', async (req, res) => {
  try {
    const { memeId, walletAddress, text } = req.body;

    if (!memeId || !walletAddress || !text) {
      return res.status(400).json({ success: false, error: 'memeId, walletAddress, and text are required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ success: false, error: 'Comment must be 500 characters or less' });
    }

    // 1. Get or create Tapestry profile for the user
    const profileId = await tapestryService.findOrCreateProfile(walletAddress);

    // 2. Get or create Tapestry content node for the meme
    const db = getFirestore();
    const memeDoc = await db.collection(collections.MEMES).doc(memeId).get();
    const memeTitle = memeDoc.exists ? memeDoc.data().title : `Meme ${memeId}`;
    const contentId = await tapestryService.findOrCreateMemeContent(memeId, memeTitle);

    // 3. Create comment
    const result = await tapestryService.createComment(profileId, contentId, text);

    const shortAddr = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

    res.json({
      success: true,
      comment: {
        id: result.comment?.id || result.id,
        text,
        createdAt: new Date().toISOString(),
        author: {
          id: profileId,
          username: shortAddr,
        },
      },
    });
  } catch (error) {
    console.error('[tapestry] POST comment error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to post comment' });
  }
});

module.exports = router;
