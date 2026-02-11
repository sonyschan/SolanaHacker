const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const geminiService = require('../services/geminiService');
const storageService = require('../services/storageService');
const newsService = require('../services/newsService');

/**
 * Generate meme using Gemini API
 */
async function generateMeme(req, res) {
  try {
    const { prompt, theme, style = 'funny' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    console.log('🎨 Generating meme with Gemini API...');
    
    // Use the Gemini service
    const memePrompt = await geminiService.generateMemePrompt(prompt);
    const imageData = await geminiService.generateMemeImage(memePrompt);
    
    const memeId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const memeData = {
      id: memeId,
      title: `AI Meme ${memeId.slice(0, 8)}`,
      prompt: memePrompt,
      imageUrl: imageData.fallbackUrl, // Placeholder for now
      theme: theme || 'general',
      style,
      generatedAt: timestamp,
      type: 'generated',
      status: 'active',
      votes: {
        selection: { yes: 0, no: 0 },
        rarity: { common: 0, uncommon: 0, rare: 0, legendary: 0 }
      },
      metadata: {
        originalPrompt: prompt,
        aiModel: 'gemini-1.5-flash',
        generatedPrompt: memePrompt
      }
    };

    // Save to Firestore
    await dbUtils.setDocument(collections.MEMES, memeId, memeData);
    
    console.log(`✅ Meme generated and saved: ${memeId}`);
    
    res.json({
      success: true,
      meme: memeData
    });

  } catch (error) {
    console.error('❌ Error generating meme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate meme',
      message: error.message
    });
  }
}

/**
 * Generate daily memes
 */
async function generateDailyMemes(req, res) {
  try {
    console.log('📅 Starting daily meme generation...');
    
    // Get crypto news
    const newsData = await newsService.getCryptoNews();
    
    // Generate 3 memes based on news
    const dailyMemes = await geminiService.generateDailyMemes(newsData, 3);
    
    // Save each meme to Firestore
    const savedMemes = [];
    for (const meme of dailyMemes) {
      await dbUtils.setDocument(collections.MEMES, meme.id, {
        ...meme,
        type: 'daily',
        status: 'active'
      });
      savedMemes.push(meme);
    }
    
    console.log(`✅ Generated ${savedMemes.length} daily memes`);
    
    res.json({
      success: true,
      message: `Generated ${savedMemes.length} daily memes`,
      memes: savedMemes
    });

  } catch (error) {
    console.error('❌ Error generating daily memes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily memes',
      message: error.message
    });
  }
}

/**
 * Get all memes with filtering
 */
async function getMemes(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'active', 
      type,
      date 
    } = req.query;

    const db = getFirestore();
    let query = db.collection(collections.MEMES);
    
    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    // Order by creation date
    query = query.orderBy('generatedAt', 'desc');
    
    // Apply pagination
    const pageSize = parseInt(limit);
    const offset = (parseInt(page) - 1) * pageSize;
    
    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(pageSize);
    
    const snapshot = await query.get();
    const memes = [];
    
    snapshot.forEach(doc => {
      memes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      memes,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        count: memes.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching memes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memes',
      message: error.message
    });
  }
}

/**
 * Get today's daily memes
 */
async function getTodaysMemes(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');
    
    const db = getFirestore();
    const query = db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('status', '==', 'active')
      .where('generatedAt', '>=', startOfDay.toISOString())
      .where('generatedAt', '<=', endOfDay.toISOString())
      .orderBy('generatedAt', 'desc');
    
    const snapshot = await query.get();
    const memes = [];
    
    snapshot.forEach(doc => {
      memes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      memes,
      date: today,
      count: memes.length
    });

  } catch (error) {
    console.error('❌ Error fetching today\'s memes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s memes',
      message: error.message
    });
  }
}

/**
 * Get meme by ID
 */
async function getMemeById(req, res) {
  try {
    const { id } = req.params;
    
    const meme = await dbUtils.getDocument(collections.MEMES, id);
    
    if (!meme) {
      return res.status(404).json({
        success: false,
        error: 'Meme not found'
      });
    }
    
    res.json({
      success: true,
      meme
    });

  } catch (error) {
    console.error('❌ Error fetching meme by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meme',
      message: error.message
    });
  }
}

/**
 * Test API connections
 */
async function testConnections(req, res) {
  try {
    const tests = {
      gemini: await geminiService.testConnection(),
      storage: await storageService.testConnection(),
      news: await newsService.testConnection()
    };

    const allSuccessful = Object.values(tests).every(test => test.success);

    res.json({
      success: allSuccessful,
      connections: tests,
      message: allSuccessful ? 'All connections successful' : 'Some connections failed'
    });

  } catch (error) {
    console.error('❌ Error testing connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connections',
      message: error.message
    });
  }
}

module.exports = {
  generateMeme,
  generateDailyMemes,
  getMemes,
  getTodaysMemes,
  getMemeById,
  testConnections
};