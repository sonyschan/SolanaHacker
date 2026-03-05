const express = require('express');
const router = express.Router();
const { cacheResponse, TTL } = require('../utils/cache');
const { STRATEGY_POOL } = require('../services/memeStrategyService');
const { NARRATIVE_POOL } = require('../services/memeNarrativeService');
const { V1_ART_STYLES } = require('../services/memeV1Legacy');
const templates = require('../data/meme-templates.json');

/**
 * GET /api/catalog/templates — All meme templates (16 items)
 */
router.get('/templates', cacheResponse('catalog:templates', TTL.LONG), (req, res) => {
  const items = templates.map(t => ({
    id: t.id,
    name: t.name,
    archetype: t.archetype,
    caption_format: t.caption_format,
    max_lines: t.max_lines,
    suitability_tags: t.suitability_tags,
    emotion_tags: t.emotion_tags,
  }));
  res.json({ success: true, items, count: items.length });
});

/**
 * GET /api/catalog/strategies — All comedy strategies (7 items)
 */
router.get('/strategies', cacheResponse('catalog:strategies', TTL.LONG), (req, res) => {
  const items = STRATEGY_POOL.map(s => ({
    id: s.strategy_id,
    name: s.strategy_name,
    definition: s.definition,
    punchline_patterns: s.punchline_patterns,
    category_affinity: s.category_affinity,
  }));
  res.json({ success: true, items, count: items.length });
});

/**
 * GET /api/catalog/narratives — All narrative archetypes (11 items)
 */
router.get('/narratives', cacheResponse('catalog:narratives', TTL.LONG), (req, res) => {
  const items = NARRATIVE_POOL.map(n => ({
    id: n.narrative_id,
    name: n.narrative_name,
    psychology: n.psychology,
    emotion: n.emotion,
    trader_role: n.trader_role,
    category_affinity: n.category_affinity,
  }));
  res.json({ success: true, items, count: items.length });
});

/**
 * GET /api/catalog/art-styles — All V1 art styles (10 items)
 */
router.get('/art-styles', cacheResponse('catalog:art-styles', TTL.LONG), (req, res) => {
  const items = V1_ART_STYLES.map(s => ({
    id: s.id,
    name: s.name,
  }));
  res.json({ success: true, items, count: items.length });
});

/**
 * GET /api/catalog/top-recipes — Top-performing meme recipes from recent history
 */
router.get('/top-recipes', cacheResponse('catalog:top-recipes', TTL.HALF_HOUR), async (req, res) => {
  try {
    const { getFirestore, collections } = require('../config/firebase');
    const db = getFirestore();

    // No composite index needed — filter type client-side
    const snapshot = await db.collection(collections.MEMES)
      .orderBy('generatedAt', 'desc')
      .limit(120)
      .get();

    const recipes = [];
    snapshot.forEach(doc => {
      const m = doc.data();
      if (m.type !== 'daily') return;
      const meta = m.metadata || {};
      recipes.push({
        id: doc.id,
        title: m.title,
        votes: m.votes?.selection?.yes || 0,
        qualityScore: meta.qualityScore || 0,
        templateId: meta.templateId || null,
        strategyId: meta.strategyId || null,
        narrativeId: meta.narrativeId || null,
        artStyleId: meta.artStyleId || null,
        generationMode: meta.generationMode || 'template',
        generatedAt: m.generatedAt,
        isWinner: m.isWinner || false,
        finalRarity: m.finalRarity || null,
      });
    });

    // Sort by votes descending
    recipes.sort((a, b) => b.votes - a.votes);

    res.json({ success: true, items: recipes, count: recipes.length });
  } catch (error) {
    console.error('Catalog top-recipes error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top recipes' });
  }
});

module.exports = router;
