const express = require("express");
const router = express.Router();
const {
  generateMeme,
  generateDailyMemes,
  getMemes,
  getTodaysMemes,
  getMemeById,
  testConnections,
  generateSingleMeme
} = require("../controllers/memeController");
const memeIdeaService = require("../services/memeIdeaService");
const { optionalAuth, rateLimitByWallet, requireLabKey } = require("../middleware/auth");
const { getFirestore, collections } = require("../config/firebase");
const { cacheResponse, TTL } = require("../utils/cache");
const rateLimiter = rateLimitByWallet(10, 15 * 60 * 1000);
const multer = require("multer");

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Routes - ORDER MATTERS! Specific routes before /:id

/**
 * GET /api/memes - Get all memes with pagination
 */
router.get("/", getMemes);

/**
 * GET /api/memes/today - Get today daily memes (cached 5min)
 */
router.get("/today", cacheResponse("memes:today", TTL.MEDIUM), getTodaysMemes);

/**
 * GET /api/memes/hall-of-memes - Get historical memes for gallery
 */
router.get("/hall-of-memes", cacheResponse("memes:hall-of-memes", TTL.MEDIUM), async (req, res) => {
  try {
    const { days = 30, limit = 50 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get Firestore instance
    const db = getFirestore();
    
    // Simple query without composite index
    const snapshot = await db.collection(collections.MEMES)
      .orderBy("generatedAt", "desc")
      .limit(parseInt(limit) * 2)
      .get();
    
    const memes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const memeDate = data.generatedAt?.toDate ? data.generatedAt.toDate() : new Date(data.generatedAt);
      if (memeDate >= startDate && memeDate <= endDate) {
        memes.push({ id: doc.id, ...data });
      }
    });
    
    res.json({
      success: true,
      memes: memes.slice(0, parseInt(limit)),
      meta: {
        total: memes.length,
        days: parseInt(days),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error("Hall of memes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch hall of memes",
      message: error.message
    });
  }
});

/**
 * POST /api/memes/generate-daily - Generate daily memes
 */
router.post("/generate-daily", generateDailyMemes);

/**
 * POST /api/memes/rate - Evaluate a meme idea using quality gate
 */
router.post("/rate", requireLabKey, rateLimiter, async (req, res) => {
  try {
    const { caption, caption_slots, visual_description, emotion, twist, context, templateId } = req.body;
    if (!caption && !caption_slots) {
      return res.status(400).json({ success: false, error: "caption or caption_slots required" });
    }
    const memeIdea = {
      template_id: templateId || null,
      caption: caption || Object.values(caption_slots || {}).join(' | '),
      caption_slots: caption_slots || {},
      visual_description: visual_description || '',
      emotion: emotion || '',
      twist: twist || '',
      event_angle: context || '',
    };
    const evaluation = await memeIdeaService.evaluateMemeIdea(memeIdea, []);
    // Estimate rarity from score
    let rarity_estimate = 'common';
    if (evaluation.score >= 95) rarity_estimate = 'legendary';
    else if (evaluation.score >= 90) rarity_estimate = 'epic';
    else if (evaluation.score >= 85) rarity_estimate = 'rare';
    else if (evaluation.score >= 82) rarity_estimate = 'uncommon';
    res.json({
      success: true,
      score: evaluation.score,
      scores: evaluation.scores || {},
      pass: evaluation.pass,
      rarity_estimate,
      suggestions: evaluation.fix_suggestions || [],
      failure_reasons: evaluation.failure_reasons || [],
    });
  } catch (error) {
    console.error("Rate meme error:", error);
    res.status(500).json({ success: false, error: "Failed to rate meme", message: error.message });
  }
});

/**
 * POST /api/memes/generate-custom - Generate a custom meme with optional overrides
 */
const customLimiter = rateLimitByWallet(3, 60 * 60 * 1000); // 3 per hour
router.post("/generate-custom", requireLabKey, customLimiter, async (req, res) => {
  try {
    const { topic, newsTitle, templateId, strategyId, narrativeId, artStyleId, mode } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: "topic is required" });
    }
    const meme = await generateSingleMeme({ topic, newsTitle, templateId, strategyId, narrativeId, artStyleId, mode });
    res.json({ success: true, meme });
  } catch (error) {
    console.error("Generate custom meme error:", error);
    res.status(500).json({ success: false, error: "Failed to generate custom meme", message: error.message });
  }
});

/**
 * GET /api/memes/test/connections - Test API connections
 */
router.get("/test/connections", testConnections);

/**
 * GET /api/memes/:id - Get specific meme by ID (cached 1hr, MUST be after specific routes!)
 */
router.get("/:id", cacheResponse(req => `memes:${req.params.id}`, TTL.HOUR), getMemeById);

/**
 * POST /api/memes/generate - Generate new meme using AI
 */
router.post("/generate", rateLimiter, generateMeme);

/**
 * POST /api/memes/upload - Upload custom meme image
 */
router.post("/upload", upload.single("meme"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No meme image provided"
      });
    }
    
    const { title, description } = req.body;
    const uploadedMeme = await uploadMeme({
      file: req.file,
      title,
      description,
      uploadedBy: req.user?.id || "anonymous",
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: uploadedMeme,
      message: "Meme uploaded successfully! 📤"
    });
  } catch (error) {
    console.error("Upload meme error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload meme",
      message: error.message
    });
  }
});

module.exports = router;
