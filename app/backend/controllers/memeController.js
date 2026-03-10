const { v4: uuidv4 } = require('uuid');
const { getFirestore, collections, dbUtils } = require('../config/firebase');
const geminiService = require('../services/geminiService');
const grokImageService = require('../services/grokImageService');
const storageService = require('../services/storageService');
const newsService = require('../services/newsService');
const memeIdeaService = require('../services/memeIdeaService');
const memeStrategyService = require('../services/memeStrategyService');
const memeNarrativeService = require('../services/memeNarrativeService');
const { invalidate, invalidatePrefix } = require('../utils/cache');
const ogRoutes = require('../routes/og');

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
 * Returns last 14 days of daily memes (up to 42).
 */
async function getRecentMemeThemes() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const recentMemes = await dbUtils.queryWithOrderAndLimit(
      collections.MEMES,
      'generatedAt',
      'desc',
      42,
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
      archetype: m.metadata?.archetype || null,
      strategyId: m.metadata?.strategyId || null,
      narrativeId: m.metadata?.narrativeId || null,
      caption: m.metadata?.memeIdea?.caption || null,
      artStyleId: m.metadata?.artStyleId || null,
      generatedAt: m.generatedAt || null,
    }));

    console.log(`🔄 Loaded ${themes.length} recent meme themes for anti-repetition`);
    return themes;
  } catch (error) {
    console.error('⚠️ Error fetching recent meme themes:', error);
    return [];
  }
}

/**
 * Generate a single custom meme with optional overrides.
 * Reuses the full daily pipeline logic (idea → evaluate → retry → image → metadata).
 * @param {{ topic, newsTitle?, templateId?, strategyId?, narrativeId?, artStyleId?, mode? }} params
 * @returns {object} Saved meme document
 */
async function generateSingleMeme({ topic, newsTitle, templateId, strategyId, narrativeId, artStyleId, mode }) {
  console.log(`🧪 Lab: generating custom meme — topic="${topic}" mode=${mode || 'auto'}`);

  // 1. Build news event object
  const newsItem = { title: newsTitle || topic, category: null };

  // 2. Recent themes for anti-repetition
  const recentThemes = await getRecentMemeThemes();

  // 3. Determine mode
  const isOriginalMode = mode === 'original' || (mode !== 'template' && !templateId);

  // 4. Select art style (with optional override)
  const artStyle = memeIdeaService.selectArtStyle(recentThemes, artStyleId || null);
  console.log(`🧪 Lab: art style="${artStyle.name}" (${artStyle.id})`);

  // 5. Select template (Mode A only)
  let template = null;
  if (!isOriginalMode) {
    template = memeIdeaService.selectTemplate(newsItem, recentThemes, templateId || null);
    console.log(`🧪 Lab: template="${template.id}" (${template.name})`);
  }

  // 6. Select strategy + narrative (with optional overrides)
  const strategy = memeStrategyService.selectStrategy({
    newsEvent: newsItem, template, recentMemes: recentThemes, category: null,
    overrideStrategyId: strategyId || null
  });
  console.log(`🧪 Lab: strategy="${strategy.strategy_id}"`);

  const narrative = memeNarrativeService.selectNarrative({
    newsEvent: newsItem, template, recentMemes: recentThemes, category: null,
    overrideNarrativeId: narrativeId || null
  });
  console.log(`🧪 Lab: narrative="${narrative.narrative_id}"`);

  // 7. Generate meme idea
  let memeIdea;
  if (isOriginalMode) {
    memeIdea = await memeIdeaService.generateOriginalMemeIdea(newsItem, recentThemes, strategy, narrative);
  } else {
    memeIdea = await memeIdeaService.generateMemeIdea(newsItem, template, recentThemes, strategy, narrative);
  }

  // 8. Evaluate + retry loop (max 2 retries, same as daily pipeline)
  const recentCaptions = recentThemes.map(t => t.caption).filter(Boolean).slice(0, 15);
  let evaluation = { pass: true, score: 82, scores: {} };
  const MAX_RETRIES = 2;
  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      evaluation = await memeIdeaService.evaluateMemeIdea(memeIdea, recentCaptions, strategy);
      const validation = memeIdeaService.validateCaption(memeIdea, isOriginalMode ? null : template);
      if (!validation.valid) {
        evaluation.pass = false;
        evaluation.failure_reasons = evaluation.failure_reasons || [];
        evaluation.fix_suggestions = evaluation.fix_suggestions || [];
        for (const issue of validation.issues) {
          evaluation.failure_reasons.push(issue);
          evaluation.fix_suggestions.push(`Fix: ${issue}`);
        }
      }
      console.log(`🧪 Lab: quality ${evaluation.score}/100 ${evaluation.pass ? '✅' : '❌'}`);
      if (evaluation.pass || retry === MAX_RETRIES) break;
      if (isOriginalMode) {
        memeIdea = await memeIdeaService.retryOriginalMemeIdea(memeIdea, evaluation.fix_suggestions, strategy, narrative);
      } else {
        memeIdea = await memeIdeaService.retryMemeIdea(memeIdea, evaluation.fix_suggestions, template, strategy, narrative);
      }
    } catch (evalErr) {
      console.error('🧪 Lab: evaluation error:', evalErr.message);
      break;
    }
  }

  // 9. Build image prompt
  const imagePrompt = isOriginalMode
    ? memeIdeaService.buildOriginalImagePrompt(memeIdea, artStyle)
    : memeIdeaService.buildImagePrompt(memeIdea, artStyle);

  // 10. Generate image (random model)
  const generator = AI_IMAGE_MODELS[Math.floor(Math.random() * AI_IMAGE_MODELS.length)];
  const imageData = await generator.service.generateMemeImage(imagePrompt);

  // 11. Generate title, description, tags
  const title = await geminiService.generateMemeTitle(memeIdea);
  const description = await geminiService.generateMemeDescription(memeIdea, topic);
  const tags = await geminiService.generateMemeTags(memeIdea, topic);

  // 12. Build meme document
  const memeDoc = {
    id: `lab_${Date.now()}`,
    title,
    description,
    prompt: memeIdea.caption || imagePrompt,
    imageUrl: imageData.imageUrl || imageData.fallbackUrl,
    newsSource: newsTitle || topic,
    generatedAt: new Date().toISOString(),
    type: 'custom',
    status: 'active',
    style: artStyle.id,
    tags,
    votes: { selection: { yes: 0, no: 0 }, rarity: { common: 0, rare: 0, legendary: 0 } },
    metadata: {
      source: 'lab',
      originalNews: newsTitle || topic,
      aiModel: generator.modelName,
      styleMode: artStyle.id,
      artStyleId: artStyle.id,
      artStyleName: artStyle.name,
      generationMode: isOriginalMode ? 'original' : 'template',
      templateId: template?.id || null,
      templateName: template?.name || null,
      strategyId: strategy.strategy_id,
      strategyName: strategy.strategy_name,
      narrativeId: narrative.narrative_id,
      narrativeName: narrative.narrative_name,
      narrativePhrase: narrative.selectedPhrase,
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
      qualityScores: evaluation.scores || {},
      imageGenerated: imageData.success,
      fileSize: imageData.fileSize || 0,
    },
    rarity: 'unknown'
  };

  // 13. Save to Firestore
  await dbUtils.setDocument(collections.MEMES, memeDoc.id, memeDoc);
  console.log(`🧪 Lab: saved custom meme ${memeDoc.id}`);

  return memeDoc;
}

/**
 * Generate daily memes — template-based, caption-first pipeline
 */
async function generateDailyMemes(req, res) {
  try {
    console.log('📅 Starting daily meme generation (V3: template + original pipeline)...');

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

    // 2. Fetch recent themes (14-day window with generatedAt for date-aware cooldowns)
    const recentThemes = await getRecentMemeThemes();

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

    // 6. Generate each meme: random 1-3 art-first originals (creativity-first strategy)
    // At least 1 original guaranteed; can be all 3 originals
    const originalCount = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    const memeModes = Array(3).fill(false);
    // Assign original slots randomly
    const indices = [0, 1, 2].sort(() => Math.random() - 0.5);
    for (let j = 0; j < originalCount; j++) memeModes[indices[j]] = true;
    console.log(`🎲 Mode mix: ${memeModes.map((o, i) => `Meme ${i+1}=${o ? 'original' : 'template'}`).join(', ')} (${originalCount} originals)`);

    const savedMemes = [];
    for (let i = 0; i < 3; i++) {
      const isOriginalMode = memeModes[i];
      const newsItem = newsData[i] || newsData[0];
      const generator = imageGenerators[i];
      const tokenSymbol = (tokenSymbols[i] && tokenSymbols[i].symbol) || null;

      // Per-meme art style selection (fresh style, avoiding 7-day repeats)
      const artStyle = memeIdeaService.selectArtStyle(recentThemes);
      console.log(`🎨 Meme ${i+1}: art style="${artStyle.name}" (${artStyle.id})${isOriginalMode ? ' [Mode B: original]' : ''}`);

      let template = null;
      let strategy, narrative, memeIdea;

      if (isOriginalMode) {
        // ── Mode B: Art-first Original ──────────────────────────
        console.log(`🎭 Meme ${i+1}: mode=original (no template, free composition)`);

        strategy = memeStrategyService.selectStrategy({
          newsEvent: newsItem, template: null, recentMemes: recentThemes, category: newsItem.category
        });
        console.log(`🎯 Meme ${i+1}: strategy="${strategy.strategy_id}" (${strategy.strategy_name})`);

        narrative = memeNarrativeService.selectNarrative({
          newsEvent: newsItem, template: null, recentMemes: recentThemes, category: newsItem.category
        });
        console.log(`📖 Meme ${i+1}: narrative="${narrative.narrative_id}" (${narrative.narrative_name}) phrase="${narrative.selectedPhrase}"`);

        try {
          memeIdea = await memeIdeaService.generateOriginalMemeIdea(newsItem, recentThemes, strategy, narrative);
        } catch (err) {
          console.error(`⚠️ Meme ${i+1} original idea generation failed:`, err.message);
          memeIdea = { template_id: null, caption: newsItem.title || 'crypto moment', caption_slots: { top_text: '', bottom_text: '' }, visual_description: 'A crypto trader staring at charts', emotion: 'funny', twist: '', event_angle: '' };
        }
      } else {
        // ── Mode A: Template + Art Style ────────────────────────
        template = memeIdeaService.selectTemplate(newsItem, recentThemes);
        console.log(`🎭 Meme ${i+1}: template="${template.id}" (${template.name})`);

        strategy = memeStrategyService.selectStrategy({
          newsEvent: newsItem, template, recentMemes: recentThemes, category: newsItem.category
        });
        console.log(`🎯 Meme ${i+1}: strategy="${strategy.strategy_id}" (${strategy.strategy_name})`);

        narrative = memeNarrativeService.selectNarrative({
          newsEvent: newsItem, template, recentMemes: recentThemes, category: newsItem.category
        });
        console.log(`📖 Meme ${i+1}: narrative="${narrative.narrative_id}" (${narrative.narrative_name}) phrase="${narrative.selectedPhrase}"`);

        try {
          memeIdea = await memeIdeaService.generateMemeIdea(newsItem, template, recentThemes, strategy, narrative);
        } catch (err) {
          console.error(`⚠️ Meme ${i+1} idea generation failed:`, err.message);
          memeIdea = { template_id: template.id, caption: newsItem.title || 'crypto moment', caption_slots: {}, visual_description: '', emotion: 'funny', twist: '', event_angle: '' };
        }
      }

      // 6c. Evaluate + validate loop (max 2 retries)
      const recentCaptions = recentThemes
        .map(t => t.caption)
        .filter(Boolean)
        .slice(0, 15);
      let evaluation = { pass: true, score: 82, scores: {} };
      const MAX_RETRIES = 2;
      for (let retry = 0; retry <= MAX_RETRIES; retry++) {
        try {
          evaluation = await memeIdeaService.evaluateMemeIdea(memeIdea, recentCaptions, strategy);

          // Validate caption (code-level checks) — pass null template for Mode B
          const validation = memeIdeaService.validateCaption(memeIdea, isOriginalMode ? null : template);
          if (!validation.valid) {
            evaluation.pass = false;
            evaluation.failure_reasons = evaluation.failure_reasons || [];
            evaluation.fix_suggestions = evaluation.fix_suggestions || [];
            for (const issue of validation.issues) {
              evaluation.failure_reasons.push(issue);
              evaluation.fix_suggestions.push(`Fix: ${issue}`);
            }
          }

          console.log(`📊 Meme ${i+1}${retry > 0 ? ` retry #${retry}` : ''} quality: ${evaluation.score}/100 ${evaluation.pass ? '✅' : '❌'}${evaluation.scores?.originality_score ? ` orig=${evaluation.scores.originality_score}` : ''}`);

          if (evaluation.pass || retry === MAX_RETRIES) break;

          console.log(`🔄 Meme ${i+1} retry #${retry+1}: ${(evaluation.fix_suggestions || []).slice(0, 3).join('; ')}`);
          try {
            if (isOriginalMode) {
              memeIdea = await memeIdeaService.retryOriginalMemeIdea(memeIdea, evaluation.fix_suggestions, strategy, narrative);
            } else {
              memeIdea = await memeIdeaService.retryMemeIdea(memeIdea, evaluation.fix_suggestions, template, strategy, narrative);
            }
          } catch (retryErr) {
            console.error(`⚠️ Meme ${i+1} retry #${retry+1} failed:`, retryErr.message);
            break;
          }
        } catch (evalErr) {
          console.error(`⚠️ Meme ${i+1} evaluation failed:`, evalErr.message);
          break;
        }
      }

      // 6d. Build image prompt (Mode A vs Mode B)
      const imagePrompt = isOriginalMode
        ? memeIdeaService.buildOriginalImagePrompt(memeIdea, artStyle)
        : memeIdeaService.buildImagePrompt(memeIdea, artStyle);

      // 6e. Generate image
      let imageData;
      if (generator) {
        imageData = await generator.service.generateMemeImage(imagePrompt);
      } else {
        imageData = await geminiService.generateMemeImage(imagePrompt);
      }

      // 6f. Generate title, description, tags
      const newsSource = newsItem.title || 'Crypto News';
      const title = await geminiService.generateMemeTitle(memeIdea);
      const description = await geminiService.generateMemeDescription(memeIdea, newsSource);
      const tags = await geminiService.generateMemeTags(memeIdea, newsSource);

      if (tokenSymbol && !tags.includes('memecoin')) {
        tags.push('memecoin');
      }

      // 6g. Build meme document
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
        style: artStyle.id,
        tags,
        votes: {
          selection: { yes: 0, no: 0 },
          rarity: { common: 0, rare: 0, legendary: 0 }
        },
        metadata: {
          originalNews: newsItem.title || newsItem,
          aiModel: generator ? generator.modelName : 'gemini-3-pro-image-preview',
          styleMode: artStyle.id,
          artStyleId: artStyle.id,
          artStyleName: artStyle.name,
          generationMode: isOriginalMode ? 'original' : 'template',
          templateId: template?.id || null,
          templateName: template?.name || null,
          archetype: template?.archetype || null,
          strategyId: strategy.strategy_id,
          strategyName: strategy.strategy_name,
          narrativeId: narrative.narrative_id,
          narrativeName: narrative.narrative_name,
          narrativePhrase: narrative.selectedPhrase,
          narrativeEmotion: narrative.emotion,
          narrativeRole: narrative.trader_role,
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
          qualityScores: evaluation.scores || {},
          originalityScore: evaluation.scores?.originality_score || null,
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

      // 6h. Mint eligibility gate (Mode A only — Mode B originals always eligible)
      if (isOriginalMode) {
        memeDoc.mint_eligible = true;
        memeDoc.mint_ineligibility_reason = null;
        console.log(`🏷️ Meme ${i+1}: mint_eligible=true (original mode)`);
      } else {
        const { mintEligible, mintReason } = memeIdeaService.checkMintEligibility(
          template.id, template.archetype, recentThemes
        );
        memeDoc.mint_eligible = mintEligible;
        memeDoc.mint_ineligibility_reason = mintReason;
        console.log(`🏷️ Meme ${i+1}: mint_eligible=${mintEligible}${mintReason ? ` (${mintReason})` : ''}`);
      }

      // 6i. Save to Firestore
      await dbUtils.setDocument(collections.MEMES, memeDoc.id, memeDoc);
      savedMemes.push(memeDoc);

      // 6j. Push to recent themes for batch anti-repetition
      recentThemes.unshift({
        title: memeDoc.title,
        templateId: template?.id || null,
        archetype: template?.archetype || null,
        strategyId: strategy.strategy_id,
        narrativeId: narrative.narrative_id,
        caption: memeIdea.caption,
        artStyleId: artStyle.id,
        generatedAt: new Date().toISOString(),
      });

      // 6k. Rate limit delay
      if (i < 2) await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Generated ${savedMemes.length} daily memes (V3: 2× template + 1× original)`);

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

/**
 * Internal: regenerate image for a meme by ID.
 * Returns { success, imageUrl, model } or { success: false, error }.
 */
async function regenerateMemeImageInternal(memeId, model = 'gemini') {
  const meme = await dbUtils.getDocument(collections.MEMES, memeId);
  if (!meme) return { success: false, error: 'Meme not found' };
  if (!meme.metadata?.memeIdea) return { success: false, error: 'No stored metadata' };

  const artStyle = memeIdeaService.selectArtStyle([], meme.metadata.artStyleId);
  if (!artStyle) return { success: false, error: `Unknown art style: ${meme.metadata.artStyleId}` };

  const isOriginal = meme.metadata.generationMode === 'original';
  const imagePrompt = isOriginal
    ? memeIdeaService.buildOriginalImagePrompt(meme.metadata.memeIdea, artStyle)
    : memeIdeaService.buildImagePrompt(meme.metadata.memeIdea, artStyle);

  console.log(`🔄 Regenerating image for meme ${memeId} (${isOriginal ? 'original' : 'template'} mode, style: ${artStyle.id})`);

  const useGrok = model === 'grok';
  const service = useGrok ? grokImageService : geminiService;
  const modelName = useGrok ? 'grok-imagine-image-pro' : 'gemini-3-pro-image-preview';

  const imageData = await service.generateMemeImage(imagePrompt);
  if (!imageData.success) return { success: false, error: 'Image generation failed' };

  await dbUtils.updateDocument(collections.MEMES, memeId, {
    imageUrl: imageData.imageUrl,
    'metadata.imageGenerated': true,
    'metadata.imageRetriedAt': new Date().toISOString(),
    'metadata.imageRetryModel': modelName,
    'metadata.fileSize': imageData.fileSize || 0,
    'metadata.storageLocation': imageData.storageLocation || 'unknown',
  });

  // Invalidate caches so updated image shows immediately
  invalidate('memes:today');
  invalidate(`memes:${memeId}`);
  ogRoutes.purgeCache(memeId);

  console.log(`✅ Image regenerated for meme ${memeId}: ${imageData.imageUrl}`);
  return { success: true, imageUrl: imageData.imageUrl, model: modelName };
}

/**
 * Regenerate image for a single meme that failed image generation.
 * HTTP handler — delegates to regenerateMemeImageInternal.
 */
async function regenerateMemeImage(req, res) {
  try {
    const { id } = req.params;
    const result = await regenerateMemeImageInternal(id, req.query.model);

    if (!result.success) {
      const status = result.error === 'Meme not found' ? 404 : result.error === 'Image generation failed' ? 502 : 400;
      return res.status(status).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      memeId: id,
      imageUrl: result.imageUrl,
      model: result.model,
    });
  } catch (error) {
    console.error(`❌ Error regenerating image for meme ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to regenerate image', message: error.message });
  }
}

/**
 * Generate a collaborative meme celebrating a partnership/integration.
 * Reuses the existing pipeline with collab-specific modifications.
 *
 * @param {{ partner, user, collabType, headline, tone }} params
 * @returns {{ meme, suggestedTweet }}
 */
async function generateCollabMeme({ partner, user, collabType, headline, tone }) {
  console.log(`🤝 Collab: generating meme — "${headline}" (${collabType}/${tone})`);

  // 1. Build news event
  const newsItem = { title: headline, category: 'collab' };

  // 2. Anti-repetition context
  const recentThemes = await getRecentMemeThemes();

  // 3. Select art style
  const artStyle = memeIdeaService.selectArtStyle(recentThemes);
  console.log(`🤝 Collab: art style="${artStyle.name}"`);

  // 4. Skip strategy + narrative for collab memes — those layers are designed for
  //    crypto news loss-humor (self_roast, future_regret, betrayal, etc.) and inject
  //    negative punchline patterns that fight against partnership celebration tone.
  //    The collab prompt has its own tone directives and collab type context instead.

  // 5. Generate collab meme idea
  const collabContext = { partner, user, collabType, tone };
  let memeIdea = await memeIdeaService.generateCollabMemeIdea(newsItem, collabContext, recentThemes);

  // 6. Skip quality evaluator — criteria (template_familiarity, crypto_nativeness)
  //    are designed for crypto news memes and would unfairly penalize collab memes.
  //    Dual-project reference validation is done below instead.
  const evaluation = { pass: true, score: 0, scores: {} };

  // 6b. Validate both projects are referenced
  const ideaText = `${memeIdea.caption || ''} ${memeIdea.visual_description || ''} ${memeIdea.collab_reference || ''}`.toLowerCase();
  const partnerRef = (partner.name || '').toLowerCase();
  const userRef = (user.name || '').toLowerCase();
  const hasPartner = partnerRef && ideaText.includes(partnerRef);
  const hasUser = userRef && ideaText.includes(userRef);
  if (!hasPartner || !hasUser) {
    console.log(`🤝 Collab: dual-ref check failed (partner=${hasPartner}, user=${hasUser}), retrying...`);
    try {
      const missing = [];
      if (!hasPartner) missing.push(partner.name);
      if (!hasUser) missing.push(user.name);
      memeIdea = await memeIdeaService.retryOriginalMemeIdea(
        memeIdea,
        [`The meme MUST clearly reference both projects: ${missing.join(' and ')}. Include their names or unmistakable visual identity in the scene.`],
        null, null
      );
    } catch (retryErr) {
      console.error('🤝 Collab: dual-ref retry error:', retryErr.message);
      // proceed with original idea
    }
  }

  // 7. Build image prompt (using original mode since collab uses free composition)
  const imagePrompt = memeIdeaService.buildOriginalImagePrompt(memeIdea, artStyle);

  // 8. Fetch partner/user logos and generate image with Gemini (supports image references)
  const referenceImages = [];
  for (const project of [{ ...partner, label: partner.name }, { ...user, label: user.name }]) {
    if (!project.avatarUrl) continue;
    try {
      const r = await fetch(project.avatarUrl, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const mime = r.headers.get('content-type') || 'image/png';
        referenceImages.push({ data: buf.toString('base64'), mimeType: mime, label: project.label });
        console.log(`🤝 Collab: fetched logo for ${project.label} (${(buf.length / 1024).toFixed(0)}KB)`);
      }
    } catch (e) {
      console.warn(`🤝 Collab: failed to fetch logo for ${project.label}: ${e.message}`);
    }
  }

  // Use Gemini for collab (supports multimodal reference images); fall back to random if no refs
  let imageData;
  if (referenceImages.length > 0) {
    imageData = await geminiService.generateMemeImageWithReferences(imagePrompt, referenceImages);
  } else {
    const generator = AI_IMAGE_MODELS[Math.floor(Math.random() * AI_IMAGE_MODELS.length)];
    imageData = await generator.service.generateMemeImage(imagePrompt);
  }

  // 9. Generate title, description, tags
  const title = await geminiService.generateMemeTitle(memeIdea);
  const description = await geminiService.generateMemeDescription(memeIdea, headline);
  const tags = await geminiService.generateMemeTags(memeIdea, headline);

  // 10. Generate suggested tweet
  let suggestedTweet = '';
  try {
    const tweetPrompt = `Write a single tweet (max 280 chars) announcing this collaboration.

COLLAB: ${headline}
TYPE: ${collabType}
TONE: ${tone}
PARTNER: ${partner.name}${partner.handle ? ` (${partner.handle})` : ''}
US: ${user.name}${user.handle ? ` (${user.handle})` : ''}

Rules:
- Include @mentions if X handles are available (use X handle format like @username)
- If a project has no X handle, use their project name instead
- Use crypto-native language
- Match the tone: ${tone}
- End with a relevant emoji or two
- NO hashtags
- Keep it under 240 chars to leave room for image

Respond with ONLY the tweet text, no quotes or explanation.`;
    const tweetResult = await geminiService.textModel.generateContent(tweetPrompt);
    const tweetResponse = await tweetResult.response;
    suggestedTweet = tweetResponse.text().trim().replace(/^["']|["']$/g, '');
  } catch (tweetErr) {
    console.error('🤝 Collab: tweet generation error:', tweetErr.message);
    const partnerTag = partner.handle?.startsWith('@') ? partner.handle : partner.name;
    const userTag = user.handle?.startsWith('@') ? user.handle : user.name;
    suggestedTweet = `${headline} — ${partnerTag} x ${userTag}`;
  }

  // 11. Build meme document
  const memeDoc = {
    id: `collab_${Date.now()}_${uuidv4().slice(0, 8)}`,
    title,
    description,
    prompt: memeIdea.caption || imagePrompt,
    imageUrl: imageData.imageUrl || imageData.fallbackUrl,
    newsSource: headline,
    generatedAt: new Date().toISOString(),
    type: 'collab',
    status: 'active',
    style: artStyle.id,
    tags,
    votes: { selection: { yes: 0, no: 0 }, rarity: { common: 0, rare: 0, legendary: 0 } },
    metadata: {
      source: 'lab',
      originalNews: headline,
      aiModel: imageData.referenceCount ? 'gemini-3-pro-image-preview+refs' : 'gemini-3-pro-image-preview',
      styleMode: artStyle.id,
      artStyleId: artStyle.id,
      artStyleName: artStyle.name,
      generationMode: 'original',
      collabType,
      collabTone: tone,
      collabPartner: { name: partner.name, handle: partner.handle },
      collabUser: { name: user.name, handle: user.handle },
      memeIdea: Object.fromEntries(
        Object.entries({
          caption: memeIdea.caption,
          caption_slots: memeIdea.caption_slots,
          visual_description: memeIdea.visual_description,
          emotion: memeIdea.emotion,
          twist: memeIdea.twist,
          event_angle: memeIdea.event_angle,
          collab_reference: memeIdea.collab_reference,
        }).filter(([, v]) => v !== undefined)
      ),
      qualityScore: evaluation.score || 0,
      qualityPass: evaluation.pass !== false,
      qualityScores: evaluation.scores || {},
      imageGenerated: imageData.success,
      fileSize: imageData.fileSize || 0,
    },
    rarity: 'unknown'
  };

  // 12. Save to Firestore
  await dbUtils.setDocument(collections.MEMES, memeDoc.id, memeDoc);
  console.log(`🤝 Collab: saved meme ${memeDoc.id}`);

  return { meme: memeDoc, suggestedTweet };
}

/**
 * Generate a community meme for X announcements & feature updates.
 * Simpler pipeline than collab: LLM concept → Gemini image → tweet.
 */
async function generateCommunityMeme({ description, tone, style, account }) {
  console.log(`🌈 Community: generating meme — "${description.slice(0, 60)}..." (${tone}/${style})`);

  const toneGuide = {
    hype: 'celebratory, LFG energy, exciting and bold',
    wholesome: 'warm, community-positive, feel-good',
    funny: 'witty humor, clever wordplay, meme-worthy punchline',
    flex: 'confident, showing off achievements',
  };
  const styleGuide = {
    meme: 'classic internet meme with bold text overlay, reaction image format',
    announcement: 'polished announcement card with clean typography',
    comic: 'short comic strip panels with characters reacting',
    infographic: 'visual infographic with icons and key points',
  };

  // 1. Generate meme concept via Gemini text model
  let memeIdea;
  try {
    const conceptPrompt = `You are a meme concept designer for a crypto/web3 community on X (Twitter).
${account ? `Account: ${account.name} (${account.handle}) — ${account.bio || ''}` : ''}

ANNOUNCEMENT: ${description}
TONE: ${toneGuide[tone] || 'fun and engaging'}
VISUAL STYLE: ${styleGuide[style] || 'classic meme'}

Create a meme concept. Requirements:
- Positive and community-friendly
- Witty with a clever twist
- NOT cringy, NOT overly promotional
- NEVER fabricate specific numbers, dollar amounts, or stats

Respond with ONLY valid JSON:
{
  "caption": "Short meme text overlay (under 80 chars, punchy)",
  "visual_description": "Detailed scene description for AI image generation (characters, style, colors, mood, composition — 3-4 sentences)",
  "emotion": "Primary emotion (e.g. excitement, pride, humor)",
  "twist": "What makes this meme clever or unexpected"
}`;
    const conceptResult = await geminiService.textModel.generateContent(conceptPrompt);
    const conceptText = (await conceptResult.response).text();
    const jsonMatch = conceptText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      memeIdea = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn('🌈 Community: concept generation failed:', err.message);
  }
  if (!memeIdea) {
    memeIdea = { caption: description.slice(0, 80), visual_description: description, emotion: tone, twist: '' };
  }

  // 2. Select art style
  const recentThemes = await getRecentMemeThemes();
  const artStyle = memeIdeaService.selectArtStyle(recentThemes);

  // 3. Build image prompt
  const imagePrompt = [
    `Create a ${styleGuide[style] || 'meme'} image for a crypto community X post.`,
    `VISUAL: ${memeIdea.visual_description}`,
    memeIdea.caption ? `TEXT OVERLAY: "${memeIdea.caption}"` : '',
    `ART STYLE: ${artStyle.name}`,
    `The image should be vibrant, eye-catching, social-media-optimized. Professional but fun.`,
    account ? `BRAND: ${account.name}` : '',
  ].filter(Boolean).join('\n');

  // 4. Generate image (with account avatar as reference if available)
  let imageData;
  const referenceImages = [];
  if (account?.avatarUrl) {
    try {
      const r = await fetch(account.avatarUrl, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const mime = r.headers.get('content-type') || 'image/png';
        referenceImages.push({ data: buf.toString('base64'), mimeType: mime, label: account.name });
      }
    } catch { /* best-effort */ }
  }

  if (referenceImages.length > 0) {
    imageData = await geminiService.generateMemeImageWithReferences(imagePrompt, referenceImages);
  } else {
    imageData = await geminiService.generateMemeImage(imagePrompt);
  }

  // 5. Generate title, description, tags
  const title = await geminiService.generateMemeTitle(memeIdea);
  const memeDescription = await geminiService.generateMemeDescription(memeIdea, description);
  const tags = await geminiService.generateMemeTags(memeIdea, description);

  // 6. Generate suggested tweet
  let suggestedTweet = '';
  try {
    const tweetPrompt = `Write a single tweet (max 250 chars) for this community announcement.

ANNOUNCEMENT: ${description}
TONE: ${tone}
${account?.handle ? `ACCOUNT: ${account.handle}` : ''}

Rules:
- Match the tone: ${toneGuide[tone] || 'engaging'}
- Use 1-2 relevant emojis
- NO hashtag spam (max 1 hashtag if natural)
- Be genuine and community-friendly
- Keep under 250 chars to leave room for image

Respond with ONLY the tweet text.`;
    const tweetResult = await geminiService.textModel.generateContent(tweetPrompt);
    suggestedTweet = (await tweetResult.response).text().trim().replace(/^["']|["']$/g, '');
  } catch (tweetErr) {
    console.warn('🌈 Community: tweet generation failed:', tweetErr.message);
    suggestedTweet = description.slice(0, 240);
  }

  // 7. Build meme document
  const memeDoc = {
    id: `community_${Date.now()}_${uuidv4().slice(0, 8)}`,
    title,
    description: memeDescription,
    prompt: memeIdea.caption || imagePrompt,
    imageUrl: imageData.imageUrl || imageData.fallbackUrl,
    newsSource: description,
    generatedAt: new Date().toISOString(),
    type: 'community',
    status: 'active',
    style: artStyle.id,
    tags,
    votes: { selection: { yes: 0, no: 0 }, rarity: { common: 0, rare: 0, legendary: 0 } },
    metadata: {
      source: 'lab',
      aiModel: imageData.referenceCount ? 'gemini-3-pro-image-preview+refs' : 'gemini-3-pro-image-preview',
      artStyleId: artStyle.id,
      artStyleName: artStyle.name,
      communityTone: tone,
      communityStyle: style,
      account: account ? { name: account.name, handle: account.handle } : null,
      memeIdea: {
        caption: memeIdea.caption,
        visual_description: memeIdea.visual_description,
        emotion: memeIdea.emotion,
        twist: memeIdea.twist,
      },
      imageGenerated: imageData.success,
      fileSize: imageData.fileSize || 0,
    },
    rarity: 'unknown'
  };

  // 8. Save to Firestore
  await dbUtils.setDocument(collections.MEMES, memeDoc.id, memeDoc);
  console.log(`🌈 Community: saved meme ${memeDoc.id}`);

  return { meme: memeDoc, suggestedTweet };
}

module.exports = {
  generateMeme,
  generateDailyMemes,
  generateSingleMeme,
  generateCollabMeme,
  generateCommunityMeme,
  getMemes,
  getTodaysMemes,
  getMemeById,
  testConnections,
  regenerateMemeImage,
  regenerateMemeImageInternal
};