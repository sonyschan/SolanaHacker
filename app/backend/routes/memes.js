const express = require('express');
const router = express.Router();
const { 
  generateMeme, 
  generateDailyMemes,
  getMemes, 
  getTodaysMemes,
  getMemeById, 
  testConnections 
} = require('../controllers/memeController');
const { optionalAuth, rateLimitByWallet } = require('../middleware/auth');
const rateLimiter = rateLimitByWallet(10, 15 * 60 * 1000); // 10 requests per 15 minutes
const multer = require('multer');

// Configure multer for image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Routes
/**
 * GET /api/memes - Get all memes with pagination
 * Query params: page, limit, status (active/archived)
 */
router.get('/', getMemes);

/**
 * GET /api/memes/daily/today - Get today's daily memes
 */
router.get('/daily/today', getTodaysMemes);

/**
 * POST /api/memes/daily/generate - Generate daily memes (internal)
 */
router.post('/daily/generate', generateDailyMemes);

/**
 * GET /api/memes/test - Test API connections
 */
router.get('/test/connections', testConnections);

/**
 * GET /api/memes/:id - Get specific meme by ID
 */
router.get('/:id', getMemeById);

/**
 * POST /api/memes/generate - Generate new meme using AI
 * Body: { prompt, theme?, style? }
 */
router.post('/generate', rateLimiter, generateMeme);

/**
 * POST /api/memes/upload - Upload custom meme image
 */
router.post('/upload', upload.single('meme'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No meme image provided'
      });
    }
    
    const { title, description } = req.body;
    const uploadedMeme = await uploadMeme({
      file: req.file,
      title,
      description,
      uploadedBy: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: uploadedMeme,
      message: 'Meme uploaded successfully! 📤'
    });
  } catch (error) {
    console.error('Upload meme error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload meme',
      message: error.message
    });
  }
});

/**
 * GET /api/memes/daily/today - Get today's daily memes
 */
router.get('/daily/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyMemes = await getMemes({ 
      filter: { 
        type: 'daily',
        date: today,
        status: 'active'
      }
    });
    
    res.json({
      success: true,
      data: dailyMemes,
      meta: {
        date: today,
        count: dailyMemes.length,
        expected: 3 // Daily target: 3 memes
      }
    });
  } catch (error) {
    console.error('Get daily memes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily memes',
      message: error.message
    });
  }
});

module.exports = router;