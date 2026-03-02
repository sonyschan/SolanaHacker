const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const geminiService = require('../services/geminiService');
const grokImageService = require('../services/grokImageService');
const storageService = require('../services/storageService');
const newsService = require('../services/newsService');
const memeIdeaService = require('../services/memeIdeaService');

// Multi-model image generation pool
const AI_IMAGE_MODELS = [
  { service: geminiService, modelName: 'gemini-3-pro-image-preview' },
  { service: grokImageService, modelName: 'grok-imagine-image-pro' },
];

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
 * Generate meme using Gemini API (ad-hoc endpoint)
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

    console.log('🎨 Generating ad-hoc meme with Gemini API...');

    // Build a simple image prompt directly from user input
    const imagePrompt = `Create a meme image based on this concept: ${prompt}

Style: ${style}
Technical requirements:
- Square aspect ratio (1:1)
- Bold, readable text overlay if text is needed
- High contrast colors for visual impact
- 1024x1024 pixels resolution`;

    const imageData = await geminiService.generateMemeImage(imagePrompt);

    const memeId = uuidv4();
    const timestamp = new Date().toISOString();

    const memeData = {
      id: memeId,
      title: `AI Meme ${memeId.slice(0, 8)}`,
      prompt: prompt,
      imageUrl: imageData.imageUrl || imageData.fallbackUrl,
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
        aiModel: 'gemini-3-pro-image-preview',
        imageGenerated: imageData.success,
        fileSize: imageData.fileSize || 0,
        storageLocation: imageData.storageLocation || 'unknown'
      }
    };

    // Save to Firestore
    await dbUtils.setDocument(collections.MEMES, memeId, memeData);

    console.log(`✅ Ad-hoc meme generated and saved: ${memeId}`);

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
 * Fetch recent meme themes from Firestore for anti-repetition.
 * Returns last 7 days of daily memes (up to 21).
 */
async function getRecentMemeThemes() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const recentMemes = await dbUtils.queryWithOrderAndLimit(
      collections.MEMES,
      'generatedAt',
      'desc',
      21,
      [
        { field: 'type', operator: '==', value: 'daily' },
        { field: 'generatedAt', operator: '>=', value: cutoff.toISOString() },
      ]
    );

    const themes = recentMemes.map(m => ({
      title: m.title,
      tags: m.tags || [],
      newsSource: m.newsSource || '',
      templateId: m.metadata?.templateId || null,
    }));

    console.log(`🔄 Loaded ${themes.length} recent meme themes for anti-repetition`);
    return themes;
  } catch (error) {
    console.error('⚠️ Error fetching recent meme themes:', error);
    return [];
  }
}

/**
 * Generate daily memes — template-based, caption-first pipeline
 */
async function generateDailyMemes(req, res) {
  try {
    console.log('📅 Starting daily meme generation (template pipeline)...');

    // 1. Daily run lock (Firestore transaction to prevent race conditions)
    const today = new Date().toISOString().split("T")[0];
    const db = getFirestore();
    const runRef = db.collection('meme_runs').doc(today);

    const canProceed = await db.runTransaction(async (tx) => {
      const doc = await tx.get(runRef);
      if (doc.exists && doc.data().status === 'completed') {
        return false;
      }
      tx.set(runRef, { status: 'in_progress', startedAt: new Date().toISOString(), date: today });
      return true;
    });

    if (!canProceed) {
      console.log("ℹ️ Daily meme run already completed for today (lock)");
      return res.json({ success: true, message: "Memes already generated for today", alreadyExists: true });
    }

    // Secondary check: count existing memes (belt + suspenders)
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");
    const existingSnapshot = await db.collection(collections.MEMES).where("type", "==", "daily")
      .where("generatedAt", ">=", startOfDay.toISOString())
      .where("generatedAt", "<=", endOfDay.toISOString())
      .get();
    if (!existingSnapshot.empty && existingSnapshot.size >= 3) {
      console.log("ℹ️ Daily memes already exist for today ("+existingSnapshot.size+" found), skipping generation");
      await runRef.update({ status: 'completed', completedAt: new Date().toISOString(), note: 'memes already existed' });
      return res.json({ success: true, message: "Memes already generated for today", alreadyExists: true, count: existingSnapshot.size });
    }

    // 2. Fetch recent themes + extract recentTemplateIds
    const recentThemes = await getRecentMemeThemes();
    const recentTemplateIds = recentThemes
      .map(t => t.templateId)
      .filter(Boolean);

    // 3. Get crypto news (with anti-repetition context)
    const newsData = await newsService.getCryptoNews(recentThemes);
    const categoryLabels = { A: 'Token/Market', B: 'Macro/World', C: 'People/Culture' };
    console.log(`📰 News topics: ${newsData.map(n => `[${n.category || '?'}] ${n.title}`).join(' | ')}`);
    const cats = newsData.map(n => n.category).filter(Boolean);
    const uniqueCats = new Set(cats);
    if (uniqueCats.size < 3) {
      console.log(`⚠️ Category diversity: ${cats.join(',')} — only ${uniqueCats.size}/3 unique categories`);
    } else {
      console.log(`✅ Category diversity: ${cats.map(c => categoryLabels[c] || c).join(', ')}`);
    }

    // 4. Extract token symbols (parallel, unchanged)
    const tokenSymbols = await Promise.all(
      newsData.slice(0, 3).map(n => newsService.extractTokenSymbol(n.title))
    );
    const symbolLog = tokenSymbols.map((t) => t ? `$${t.symbol}` : '-').join(', ');
    console.log(`🪙 Token symbols: ${symbolLog}`);

    // 5. Random image model per meme (unchanged)
    const imageGenerators = Array.from({ length: 3 }, () =>
      AI_IMAGE_MODELS[Math.floor(Math.random() * AI_IMAGE_MODELS.length)]
    );
    console.log(`🤖 AI image models: ${imageGenerators.map(g => g.modelName).join(', ')}`);

    // 6. Style mode: default meme_native for all daily memes
    // Use explicit styleMode parameter for stylized variants (e.g. ad-hoc endpoint)
    const styleMode = 'meme_native';
    console.log(`🎨 Style mode: ${styleMode}`);

    // 7. Generate each meme through the new pipeline
    const savedMemes = [];
    for (let i = 0; i < 3; i++) {
      const newsItem = newsData[i] || newsData[0];
      const generator = imageGenerators[i];
      const tokenSymbol = (tokenSymbols[i] && tokenSymbols[i].symbol) || null;

      // 7a. Select template
      const template = memeIdeaService.selectTemplate(newsItem, recentTemplateIds);
      console.log(`🎭 Meme ${i+1}: template="${template.id}" (${template.name})`);

      // 7b. Generate meme idea
      let memeIdea;
      try {
        memeIdea = await memeIdeaService.generateMemeIdea(newsItem, template, recentThemes);
      } catch (err) {
        console.error(`⚠️ Meme ${i+1} idea generation failed:`, err.message);
        memeIdea = { template_id: template.id, caption: newsItem.title || 'crypto moment', caption_slots: {}, visual_description: '', emotion: 'funny', twist: '', event_angle: '' };
      }

      // 7c. Evaluate meme idea (quality gate, 0-100 scale)
      let evaluation = { pass: true, score: 80, scores: {} };
      try {
        evaluation = await memeIdeaService.evaluateMemeIdea(memeIdea);
        console.log(`📊 Meme ${i+1} quality: ${evaluation.score}/100 ${evaluation.pass ? '✅' : '❌'}`);

        // If fail, retry once — keep template, rewrite caption + twist only
        if (!evaluation.pass && evaluation.fix_suggestions?.length > 0) {
          console.log(`🔄 Meme ${i+1} retry: ${evaluation.fix_suggestions.join('; ')}`);
          try {
            memeIdea = await memeIdeaService.retryMemeIdea(memeIdea, evaluation.fix_suggestions, template);
            evaluation = await memeIdeaService.evaluateMemeIdea(memeIdea);
            console.log(`📊 Meme ${i+1} retry quality: ${evaluation.score}/100 ${evaluation.pass ? '✅' : '⚠️ force-pass'}`);
          } catch (retryErr) {
            console.error(`⚠️ Meme ${i+1} retry failed:`, retryErr.message);
          }
          // Force-pass after 1 retry
          evaluation.pass = true;
        }
      } catch (evalErr) {
        console.error(`⚠️ Meme ${i+1} evaluation failed:`, evalErr.message);
      }

      // 7d. Build image prompt
      const imagePrompt = memeIdeaService.buildImagePrompt(memeIdea, styleMode);

      // 7e. Generate image
      let imageData;
      if (generator) {
        imageData = await generator.service.generateMemeImage(imagePrompt);
      } else {
        imageData = await geminiService.generateMemeImage(imagePrompt);
      }

      // 7f. Generate title, description, tags
      const newsSource = newsItem.title || 'Crypto News';
      const title = await geminiService.generateMemeTitle(memeIdea);
      const description = await geminiService.generateMemeDescription(memeIdea, newsSource);
      const tags = await geminiService.generateMemeTags(memeIdea, newsSource);

      // Add "memecoin" tag if specific token
      if (tokenSymbol && !tags.includes('memecoin')) {
        tags.push('memecoin');
      }

      // 7g. Build meme document
      const memeDoc = {
        id: `meme_${Date.now()}_${i}`,
        title,
        description,
        prompt: memeIdea.caption || imagePrompt,
        imageUrl: imageData.imageUrl || imageData.fallbackUrl,
        newsSource,
        tokenSymbol,
        xHandle: newsItem.x_handle || null,
        generatedAt: new Date().toISOString(),
        type: 'daily',
        status: 'active',
        style: styleMode,
        tags,
        votes: {
          selection: { yes: 0, no: 0 },
          rarity: { common: 0, rare: 0, legendary: 0 }
        },
        metadata: {
          originalNews: newsItem.title || newsItem,
          aiModel: generator ? generator.modelName : 'gemini-3-pro-image-preview',
          styleMode,
          templateId: template.id,
          templateName: template.name,
          memeIdea: {
            caption: memeIdea.caption,
            caption_slots: memeIdea.caption_slots,
            visual_description: memeIdea.visual_description,
            emotion: memeIdea.emotion,
            twist: memeIdea.twist,
            event_angle: memeIdea.event_angle
          },
          qualityScore: evaluation.score || 0,
          qualityPass: evaluation.pass !== false,
          imageGenerated: imageData.success,
          fileSize: imageData.fileSize || 0,
          storageLocation: imageData.storageLocation || 'unknown',
          environment: imageData.environment || {},
          tagsCount: tags.length,
          tokenSymbol,
          xHandle: newsItem.x_handle || null
        },
        rarity: 'unknown'
      };

      // 7h. Save to Firestore
      await dbUtils.setDocument(collections.MEMES, memeDoc.id, memeDoc);
      savedMemes.push(memeDoc);

      // 7i. Push template to recentTemplateIds for batch anti-repetition
      recentTemplateIds.push(template.id);

      // 7j. Rate limit delay
      if (i < 2) await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Generated ${savedMemes.length} daily memes (template pipeline)`);

    // Mark daily run as completed
    await runRef.update({
      status: 'completed',
      completedAt: new Date().toISOString(),
      memeCount: savedMemes.length,
      memeIds: savedMemes.map(m => m.id)
    });

    res.json({
      success: true,
      message: `Generated ${savedMemes.length} daily memes`,
      memes: savedMemes
    });

  } catch (error) {
    console.error('❌ Error generating daily memes:', error);
    // Reset run lock on failure so retry is possible
    const failDate = new Date().toISOString().split("T")[0];
    await getFirestore().collection('meme_runs').doc(failDate)
      .update({ status: 'failed', error: error.message, failedAt: new Date().toISOString() })
      .catch(() => {});
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