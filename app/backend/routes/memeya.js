const express = require('express');
const router = express.Router();
const { getFirestore, collections } = require('../config/firebase');
const { cacheResponse, TTL } = require('../utils/cache');

/**
 * Prune entries older than 24 hours from the activity log.
 * Reconstructs ISO timestamp from dateStr + entry.time (GMT+8) and filters.
 */
function pruneOldEntries(entries, dateStr) {
  if (!entries || entries.length === 0) return entries;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return entries.filter(entry => {
    if (!entry.time) return true; // Keep entries without time (shouldn't happen)
    try {
      // Reconstruct: dateStr is GMT+8 date, entry.time is HH:MM:SS in GMT+8
      const isoStr = `${dateStr}T${entry.time}+08:00`;
      const ts = new Date(isoStr).getTime();
      return ts > cutoff;
    } catch {
      return true; // Keep on parse error
    }
  });
}

/**
 * POST /api/memeya/sync — Agent pushes activity data (fire-and-forget)
 * Body: { date, entries, schedule, secret }
 */
router.post('/sync', async (req, res) => {
  try {
    const { date, entries, schedule } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Prune entries older than 24h before writing
    const prunedEntries = pruneOldEntries(entries || [], date);

    const db = getFirestore();
    await db.collection(collections.MEMEYA_WORKSHOP).doc(date).set({
      date,
      entries: prunedEntries,
      schedule: schedule || {},
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ success: true });
  } catch (error) {
    console.error('[memeya/sync] Error:', error.message);
    res.status(500).json({ error: 'Sync failed' });
  }
});

/**
 * GET /api/memeya/workshop — Frontend reads today's workshop data
 * Returns: { date, schedule, entries, stats }
 * Cached 30s
 */
router.get('/workshop', cacheResponse('memeya:workshop', 30 * 1000), async (req, res) => {
  try {
    // Today in GMT+8
    const now = new Date(Date.now() + 8 * 3600_000);
    const today = now.toISOString().slice(0, 10);

    const db = getFirestore();
    const doc = await db.collection(collections.MEMEYA_WORKSHOP).doc(today).get();

    if (!doc.exists) {
      return res.json({
        date: today,
        schedule: {},
        entries: [],
        stats: { postsToday: 0, nextSlot: null },
      });
    }

    const data = doc.data();
    const entries = pruneOldEntries(data.entries || [], today);
    const schedule = data.schedule || {};

    // Compute stats
    const postsToday = entries.filter(e => e.url).length;
    let nextSlot = null;
    if (schedule.slots) {
      for (const [id, slot] of Object.entries(schedule.slots)) {
        if (slot.status === 'pending') {
          nextSlot = { id, window: slot.window };
          break;
        }
      }
    }

    res.json({
      date: today,
      schedule,
      entries,
      stats: { postsToday, nextSlot },
    });
  } catch (error) {
    console.error('[memeya/workshop] Error:', error.message);
    res.status(500).json({ error: 'Failed to load workshop data' });
  }
});

module.exports = router;
