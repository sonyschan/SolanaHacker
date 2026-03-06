const express = require('express');
const router = express.Router();
const { requireLabKey } = require('../middleware/auth');
const { getFirestore, collections } = require('../config/firebase');

/**
 * POST /api/news/collect
 * Receives structured news items from the agent's heartbeat news discovery.
 * Protected by LAB_API_KEY — only the agent can call this.
 */
router.post('/collect', requireLabKey, async (req, res) => {
  try {
    const { items, source } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 5) {
      return res.status(400).json({ error: 'items must be an array of 1-5 news items' });
    }

    const validSources = ['morning', 'search'];
    if (!validSources.includes(source)) {
      return res.status(400).json({ error: 'source must be "morning" or "search"' });
    }

    const db = getFirestore();
    const batch = db.batch();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    let count = 0;

    for (const item of items) {
      if (!item.title || !item.summary) continue;

      const docRef = db.collection(collections.COLLECTED_NEWS).doc();
      batch.set(docRef, {
        title: item.title,
        summary: item.summary,
        trend_reason: item.trend_reason || '',
        x_handle: item.x_handle || null,
        category: ['A', 'B', 'C'].includes(item.category) ? item.category : 'B',
        source,
        collectedAt: now.toISOString(),
        date: dateStr,
      });
      count++;
    }

    if (count === 0) {
      return res.status(400).json({ error: 'No valid items (each needs title + summary)' });
    }

    await batch.commit();
    console.log(`📰 Collected ${count} news items (source: ${source})`);
    res.json({ success: true, count });
  } catch (error) {
    console.error('News collect error:', error);
    res.status(500).json({ error: 'Failed to collect news' });
  }
});

module.exports = router;
