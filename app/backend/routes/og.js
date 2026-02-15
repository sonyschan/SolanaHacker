/**
 * OG Image Route
 * GET /api/og/:memeId - Returns branded 1200x630 PNG for Twitter cards
 *
 * Includes in-memory caching to prevent rate limiting from repeated crawler requests
 */

const express = require('express');
const router = express.Router();
const { getFirestore, collections } = require('../config/firebase');
const { generateOGImage, generateSimpleOGImage } = require('../services/ogImageService');

// In-memory cache for OG images
// Key: memeId, Value: { buffer: Buffer, timestamp: number, votes: number }
const ogCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100; // Max number of cached images

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of ogCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      ogCache.delete(key);
    }
  }
  // If still over limit, remove oldest entries
  if (ogCache.size > MAX_CACHE_SIZE) {
    const entries = [...ogCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, ogCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => ogCache.delete(key));
  }
}

/**
 * GET /api/og/:memeId
 * Returns PNG image for OG/Twitter cards
 */
router.get('/:memeId', async (req, res) => {
  const { memeId } = req.params;

  try {
    // Check cache first
    const cached = ogCache.get(memeId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[OG] Cache HIT for ${memeId}`);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.buffer);
    }

    console.log(`[OG] Cache MISS for ${memeId}, generating...`);

    // Fetch meme data
    const db = getFirestore();
    const memeDoc = await db.collection(collections.MEMES).doc(memeId).get();

    if (!memeDoc.exists) {
      // Return simple fallback image (don't cache 404s long)
      const png = await generateSimpleOGImage('Meme not found');
      const buffer = Buffer.from(png);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Cache', 'MISS');
      return res.send(buffer);
    }

    const meme = { id: memeDoc.id, ...memeDoc.data() };

    // Generate OG image
    const png = await generateOGImage(meme);
    const buffer = Buffer.from(png);

    // Store in cache
    ogCache.set(memeId, {
      buffer,
      timestamp: Date.now(),
      votes: (meme.votes?.selection?.yes || 0) + (meme.votes?.selection?.no || 0)
    });

    // Cleanup old entries periodically
    if (ogCache.size > MAX_CACHE_SIZE * 0.9) {
      cleanupCache();
    }

    console.log(`[OG] Generated and cached for ${memeId}, cache size: ${ogCache.size}`);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('X-Cache', 'MISS');
    res.send(buffer);

  } catch (error) {
    console.error('OG image error:', error);

    // Return simple fallback on error
    try {
      const png = await generateSimpleOGImage('AI MemeForge');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('X-Cache', 'ERROR');
      res.send(Buffer.from(png));
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to generate OG image' });
    }
  }
});

module.exports = router;
