const express = require("express");
const router = express.Router();
const {
  generateMeme,
  generateDailyMemes,
  getMemes,
  getTodaysMemes,
  getMemeById,
  testConnections,
  generateSingleMeme,
  regenerateMemeImage
} = require("../controllers/memeController");
const memeIdeaService = require("../services/memeIdeaService");
const { optionalAuth, rateLimitByWallet } = require("../middleware/auth");
const { requireLabKeyOrPayment } = require("../middleware/x402");
const { getFirestore, collections } = require("../config/firebase");
const { cacheResponse, TTL } = require("../utils/cache");
const admin = require('firebase-admin');
const rateLimiter = rateLimitByWallet(10, 15 * 60 * 1000);

/**
 * Log a successful x402 transaction to Workshop feed + analytics collection.
 * Fire-and-forget — errors are swallowed.
 */
const X402_TEMPLATES = {
  '/rate': {
    amount: 0.05,
    text_en: 'Earned $0.05 USDC — rated a meme for a client on Base',
    text_zh: '為客戶評分一張 meme，賺取 $0.05 USDC (Base)',
  },
  '/generate-custom': {
    amount: 0.10,
    text_en: 'Earned $0.10 USDC — forged a custom meme for a client on Base',
    text_zh: '為客戶打造一張自訂 meme，賺取 $0.10 USDC (Base)',
  },
};

async function logX402Transaction(endpoint) {
  const tpl = X402_TEMPLATES[endpoint];
  if (!tpl) return;

  const db = getFirestore();
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);

  // A. Append to today's memeya_workshop feed
  const workshopRef = db.collection(collections.MEMEYA_WORKSHOP).doc(date);
  await workshopRef.set({
    entries: admin.firestore.FieldValue.arrayUnion({
      time,
      topic: 'x402_commerce',
      text_en: tpl.text_en,
      text_zh: tpl.text_zh,
      ambient: false,
    }),
  }, { merge: true });

  // B. Store to x402_transactions for analytics
  await db.collection(collections.X402_TRANSACTIONS).add({
    endpoint,
    amount: tpl.amount,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    date,
  });
}
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
 * POST /api/memes/rate - Evaluate a meme image via Gemini vision
 * Input: { imageUrl } — public URL of a meme image
 * Output: { score, pass, grade, suggestions[] } — criteria details hidden
 */
router.post("/rate", requireLabKeyOrPayment, rateLimiter, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: "imageUrl is required" });
    }
    // Basic URL validation
    try {
      const parsed = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ success: false, error: "imageUrl must be http or https" });
      }
    } catch {
      return res.status(400).json({ success: false, error: "Invalid imageUrl" });
    }

    const evaluation = await memeIdeaService.evaluatePublicMeme(imageUrl);
    res.json({ success: true, ...evaluation });
    if (req.authMethod === 'x402') {
      logX402Transaction('/rate').catch(() => {});
    }
  } catch (error) {
    console.error("Rate meme error:", error);
    const message = error.message || "Failed to rate meme";
    const status = message.includes('Failed to fetch') || message.includes('does not point to an image') || message.includes('too large') ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * POST /api/memes/generate-custom - Generate a custom meme with optional overrides
 */
const customLimiter = rateLimitByWallet(3, 60 * 60 * 1000); // 3 per hour
router.post("/generate-custom", requireLabKeyOrPayment, customLimiter, async (req, res) => {
  try {
    const { topic, newsTitle, templateId, strategyId, narrativeId, artStyleId, mode } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, error: "topic is required" });
    }
    const meme = await generateSingleMeme({ topic, newsTitle, templateId, strategyId, narrativeId, artStyleId, mode });
    res.json({ success: true, meme });
    if (req.authMethod === 'x402') {
      logX402Transaction('/generate-custom').catch(() => {});
    }
  } catch (error) {
    console.error("Generate custom meme error:", error);
    res.status(500).json({ success: false, error: "Failed to generate custom meme", message: error.message });
  }
});

/**
 * POST /api/memes/:id/regenerate-image - Retry image generation for a failed meme
 * Query: ?model=grok (optional, defaults to gemini)
 */
router.post("/:id/regenerate-image", regenerateMemeImage);

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
