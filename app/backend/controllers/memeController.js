const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const geminiService = require('../services/geminiService');
const storageService = require('../services/storageService');
const newsService = require('../services/newsService');

// Helper to convert relative imageUrl to absolute
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://memeforge-api-836651762884.asia-southeast1.run.app'
  : 'http://localhost:3001';

function fixImageUrl(meme) {
  if (meme.imageUrl && meme.imageUrl.startsWith('/generated/')) {
    return { ...meme, imageUrl: BASE_URL + meme.imageUrl };
  }
  return meme;
}

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

    // Check if memes already exist for today (prevent duplicates)
    const today = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");
    const existingSnapshot = await getFirestore().collection(collections.MEMES).where("type", "==", "daily")
      .where("generatedAt", ">=", startOfDay.toISOString())
      .where("generatedAt", "<=", endOfDay.toISOString())
      .get();
    if (!existingSnapshot.empty && existingSnapshot.size >= 3) {
      console.log("ℹ️ Daily memes already exist for today ("+existingSnapshot.size+" found), skipping generation");
      return res.json({ success: true, message: "Memes already generated for today", alreadyExists: true, count: existingSnapshot.size });
    }
    
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
    query = query.orderBy('generatedAt', 'desc').limit(3);
    
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
    // DEV_MODE: Return mock memes with improved short titles
    if (process.env.DEV_MODE === 'true') {
      console.log('⏭️ DEV_MODE: Using mock memes with improved titles');
      const mockMemes = [
        {
          id: 'dev-meme-1',
          title: 'AI Dreams Electric',  // ✅ 更簡潔的標題 (3 words)
          description: 'When AI tries to understand crypto volatility and charts confuse the algorithms',
          imageUrl: 'http://165.22.136.40:3001/generated/meme_gemini3_1770878205173.png',
          prompt: 'A confused robot looking at complex crypto charts with spinning eyes, text overlay saying "Does not compute"',
          newsSource: 'CoinDesk Tech Analysis',
          generatedAt: new Date().toISOString(),
          type: 'daily',
          status: 'active',
          votes: { selection: { yes: 89, no: 23 }, rarity: { common: 45, rare: 67, legendary: 123 } },
          metadata: { devMode: true, titleImproved: true }
        },
        {
          id: 'dev-meme-2',
          title: 'Diamond Hands Forever',  // ✅ 經典梗圖標題 (3 words)
          description: 'HODLers maintaining their positions even when the market crashes hard',
          imageUrl: 'http://165.22.136.40:3001/generated/meme_gemini3_1770878216765.png',
          prompt: 'Diamond hands meme with crypto portfolio down 90%, still holding strong with determination',
          newsSource: 'Crypto Market Update',
          generatedAt: new Date().toISOString(),
          type: 'daily',
          status: 'active',
          votes: { selection: { yes: 134, no: 45 }, rarity: { common: 67, rare: 89, legendary: 178 } },
          metadata: { devMode: true, titleImproved: true }
        },
        {
          id: 'dev-meme-3',
          title: 'Number Go Up',  // ✅ 經典加密貨幣 meme (3 words)
          description: 'The eternal cryptocurrency optimist mindset when portfolio pumps',
          imageUrl: 'http://165.22.136.40:3001/generated/meme_gemini3_1770878243373.png',
          prompt: 'Celebration meme showing rockets and green candles, classic crypto bull market vibes',
          newsSource: 'Bitcoin Price Analysis',
          generatedAt: new Date().toISOString(),
          type: 'daily',
          status: 'active',
          votes: { selection: { yes: 98, no: 67 }, rarity: { common: 56, rare: 78, legendary: 134 } },
          metadata: { devMode: true, titleImproved: true }
        }
      ];
      return res.json({ 
        success: true, 
        memes: mockMemes, 
        date: new Date().toISOString().split('T')[0], 
        count: mockMemes.length, 
        devMode: true,
        note: 'Using improved short titles (2-4 words max)'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');
    const db = getFirestore();
    const query = db.collection(collections.MEMES).where('type', '==', 'daily').where('status', 'in', ['active', 'voting_active', 'voting_completed']).where('generatedAt', '>=', startOfDay.toISOString()).where('generatedAt', '<=', endOfDay.toISOString()).orderBy('generatedAt', 'desc').limit(3);
    const snapshot = await query.get();
    const memes = [];
    snapshot.forEach(doc => { memes.push(fixImageUrl({ id: doc.id, ...doc.data() })); });
    res.json({ success: true, memes, date: today, count: memes.length });
  } catch (error) {
    console.error('❌ Error fetching today\'s memes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch today\'s memes', message: error.message });
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