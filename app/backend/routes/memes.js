const express = require("express");
const router = express.Router();
const { 
  generateMeme, 
  generateDailyMemes,
  getMemes, 
  getTodaysMemes,
  getMemeById, 
  testConnections 
} = require("../controllers/memeController");
const { optionalAuth, rateLimitByWallet } = require("../middleware/auth");
const { getFirestore, collections } = require("../config/firebase");
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
 * GET /api/memes/today - Get today daily memes
 */
router.get("/today", getTodaysMemes);

/**
 * GET /api/memes/hall-of-memes - Get historical memes for gallery

/**
 * GET /api/memes/status - Get meme generation status
 * Returns whether today's memes are ready for voting
 */
router.get("/status", async (req, res) => {
  try {
    const schedulerService = require("../services/schedulerService");
    const status = await schedulerService.getMemeReadyStatus();

    res.json({
      success: true,
      data: {
        memeReady: status.memeReady,
        date: status.date,
        message: status.message || (status.memeReady ? "Memes are ready!" : "Generating memes..."),
        updatedAt: status.updatedAt
      }
    });
  } catch (error) {
    console.error("Get meme status error:", error);
    res.json({
      success: true,
      data: {
        memeReady: true, // Default to ready on error
        date: new Date().toISOString().split("T")[0],
        message: "Status check error, assuming ready",
        error: true
      }
    });
  }
});

router.get("/hall-of-memes", async (req, res) => {
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
 * GET /api/memes/test/connections - Test API connections
 */
router.get("/test/connections", testConnections);

/**
 * GET /api/memes/:id - Get specific meme by ID (MUST be after specific routes!)
 */
router.get("/:id", getMemeById);

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

/**
 * DELETE /api/memes/today - Delete all of today memes (admin only for reset)
 */
router.delete("/today", async (req, res) => {
  try {
    const { getFirestore, collections } = require("../config/firebase");
    const db = getFirestore();
    
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");
    
    // Find today memes
    const memesSnapshot = await db.collection(collections.MEMES)
      .where("type", "==", "daily")
      .where("generatedAt", ">=", startOfDay.toISOString())
      .where("generatedAt", "<=", endOfDay.toISOString())
      .get();
    
    const deletedMemes = [];
    const deletedVotes = [];
    
    for (const memeDoc of memesSnapshot.docs) {
      const memeId = memeDoc.id;
      
      // Delete associated votes
      const votesSnapshot = await db.collection(collections.VOTES)
        .where("memeId", "==", memeId)
        .get();
      
      for (const voteDoc of votesSnapshot.docs) {
        await voteDoc.ref.delete();
        deletedVotes.push(voteDoc.id);
      }
      
      // Delete meme
      await memeDoc.ref.delete();
      deletedMemes.push(memeId);
    }
    
    res.json({
      success: true,
      message: "Today memes deleted",
      deletedMemes,
      deletedVotes,
      count: { memes: deletedMemes.length, votes: deletedVotes.length }
    });
    
  } catch (error) {
    console.error("Delete today memes error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
