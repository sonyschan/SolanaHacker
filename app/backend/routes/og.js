/**
 * OG Image Route
 * GET /api/og/:memeId - Returns branded 1200x630 PNG for Twitter cards
 */

const express = require('express');
const router = express.Router();
const { getFirestore, collections } = require('../config/firebase');
const { generateOGImage, generateSimpleOGImage } = require('../services/ogImageService');

/**
 * GET /api/og/:memeId
 * Returns PNG image for OG/Twitter cards
 */
router.get('/:memeId', async (req, res) => {
  const { memeId } = req.params;

  try {
    // Fetch meme data
    const db = getFirestore();
    const memeDoc = await db.collection(collections.MEMES).doc(memeId).get();

    if (!memeDoc.exists) {
      // Return simple fallback image
      const png = await generateSimpleOGImage('Meme not found');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(Buffer.from(png));
    }

    const meme = { id: memeDoc.id, ...memeDoc.data() };

    // Generate OG image
    const png = await generateOGImage(meme);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(Buffer.from(png));

  } catch (error) {
    console.error('OG image error:', error);

    // Return simple fallback on error
    try {
      const png = await generateSimpleOGImage('AI MemeForge');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.send(Buffer.from(png));
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to generate OG image' });
    }
  }
});

module.exports = router;
