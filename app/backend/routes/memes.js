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
  generateCollabMeme,
  regenerateMemeImage
} = require("../controllers/memeController");
const memeIdeaService = require("../services/memeIdeaService");
const { optionalAuth, rateLimitByWallet } = require("../middleware/auth");
const { requireLabKeyOrPayment } = require("../middleware/x402");
const { getFirestore, collections } = require("../config/firebase");
const { cacheResponse, getOrFetch, TTL } = require("../utils/cache");
const { verifySolanaPayment, markPaymentFailed, markPaymentRateLimited, markPaymentCompleted, MEMEYA_MINT } = require("../middleware/solanaPay");
const admin = require('firebase-admin');
const rateLimiter = rateLimitByWallet(10, 15 * 60 * 1000);

// Solana meme generation rate limiter: 5 per hour per wallet
const solanaGenLimiter = new Map(); // wallet -> { count, resetAt }
const SOLANA_GEN_LIMIT = 5;

// Rate limiter for failed verification attempts (prevent RPC spam)
const verifyFailLimiter = new Map(); // ip/fingerprint -> { count, resetAt }
const VERIFY_FAIL_LIMIT = 10; // max 10 failed attempts per 15 min
const VERIFY_FAIL_WINDOW = 15 * 60 * 1000;

/**
 * Log a successful x402 transaction to Workshop feed + analytics collection.
 * Fire-and-forget — errors are swallowed.
 */
const X402_TEMPLATES = {
  '/rate': {
    amount: 0.05,
    text_en: (chain) => `Earned $0.05 USDC — rated a meme for a client via x402 (${chain})`,
    text_zh: (chain) => `為客戶評分一張 meme，賺取 $0.05 USDC (${chain})`,
  },
  '/generate-custom': {
    amount: 0.10,
    text_en: (chain) => `Earned $0.10 USDC — forged a custom meme for a client via x402 (${chain})`,
    text_zh: (chain) => `為客戶打造一張自訂 meme，賺取 $0.10 USDC (${chain})`,
  },
  '/generate-collab': {
    amount: 0.15,
    text_en: (chain) => `Earned $0.15 USDC — forged a collab meme for a client via x402 (${chain})`,
    text_zh: (chain) => `為客戶打造一張聯名 meme，賺取 $0.15 USDC (${chain})`,
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
      text_en: tpl.text_en('Base/Solana'),
      text_zh: tpl.text_zh('Base/Solana'),
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
router.get("/hall-of-memes", cacheResponse(req => `memes:hall-of-memes:${req.query.days || 30}:${req.query.limit || 50}`, TTL.MEDIUM), async (req, res) => {
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
 * GET /api/memes/my-creations - Get memes created by a specific wallet
 * Query: ?wallet=<address>&limit=20
 */
router.get("/my-creations", async (req, res) => {
  try {
    const { wallet, limit = 20 } = req.query;
    if (!wallet || typeof wallet !== 'string' || wallet.length < 32) {
      return res.status(400).json({ success: false, error: "Valid wallet address is required" });
    }

    const db = getFirestore();
    const cap = Math.min(parseInt(limit) || 20, 50);

    // Query solana_orders by sender wallet with completed status
    const ordersSnap = await db.collection(collections.SOLANA_ORDERS)
      .where('sender', '==', wallet)
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(cap)
      .get();

    if (ordersSnap.empty) {
      return res.json({ success: true, memes: [] });
    }

    // Batch-fetch meme docs
    const memeIds = ordersSnap.docs
      .map(d => d.data().memeId)
      .filter(Boolean);

    if (memeIds.length === 0) {
      return res.json({ success: true, memes: [] });
    }

    // Firestore getAll supports up to 100 refs
    const memeRefs = memeIds.map(id => db.collection(collections.MEMES).doc(id));
    const memeDocs = await db.getAll(...memeRefs);

    const memes = memeDocs
      .filter(doc => doc.exists)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          imageUrl: data.imageUrl,
          description: data.description,
          tags: data.tags || [],
          metadata: data.metadata ? {
            qualityScore: data.metadata.qualityScore,
            artStyle: data.metadata.artStyle,
          } : null,
          generatedAt: data.generatedAt,
        };
      });

    res.json({ success: true, memes });
  } catch (error) {
    console.error("My creations error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch your memes" });
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
 * POST /api/memes/generate-collab - Generate a collaborative meme
 */
const collabLimiter = rateLimitByWallet(2, 60 * 60 * 1000); // 2 per hour
router.post("/generate-collab", requireLabKeyOrPayment, collabLimiter, async (req, res) => {
  try {
    const { partner, user, collabType, headline, tone } = req.body;
    if (!partner?.name || !user?.name || !collabType || !headline || !tone) {
      return res.status(400).json({ success: false, error: "partner, user, collabType, headline, and tone are required" });
    }
    if (headline.length > 200) {
      return res.status(400).json({ success: false, error: "headline must be <= 200 chars" });
    }
    if (partner.name.length > 100 || user.name.length > 100) {
      return res.status(400).json({ success: false, error: "name must be <= 100 chars" });
    }
    if ((partner.bio || '').length > 500 || (user.bio || '').length > 500) {
      return res.status(400).json({ success: false, error: "bio must be <= 500 chars" });
    }
    const validTypes = ['integration', 'listing', 'partnership', 'launch', 'migration'];
    const validTones = ['hype', 'flex', 'wholesome', 'chaos'];
    if (!validTypes.includes(collabType)) {
      return res.status(400).json({ success: false, error: `collabType must be one of: ${validTypes.join(', ')}` });
    }
    if (!validTones.includes(tone)) {
      return res.status(400).json({ success: false, error: `tone must be one of: ${validTones.join(', ')}` });
    }
    const result = await generateCollabMeme({ partner, user, collabType, headline, tone });
    res.json({ success: true, ...result });
    if (req.authMethod === 'x402') {
      logX402Transaction('/generate-collab').catch(() => {});
    }
  } catch (error) {
    console.error("Generate collab meme error:", error);
    res.status(500).json({ success: false, error: "Failed to generate collab meme", message: error.message });
  }
});

// ── Solana on-chain payment endpoints ──────────────────────────────────

const BASE_USD_PRICE = 0.10;
const MEMEYA_DISCOUNT = 0.20; // 20% off

/**
 * Fetch SOL + Memeya USD prices (cached 5min).
 * Uses CoinGecko for SOL/USD and DexScreener for Memeya/USD.
 * Returns { solUsd: number|null, memeyaUsd: number|null }
 */
async function fetchPrices() {
  return getOrFetch("token:prices", TTL.MEDIUM, async () => {
    const [cgRes, dsRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'),
      fetch(`https://api.dexscreener.com/latest/dex/tokens/${MEMEYA_MINT.toBase58()}`),
    ]);

    let solUsd = null;
    if (cgRes.ok) {
      const cg = await cgRes.json();
      solUsd = cg?.solana?.usd || null;
    }

    let memeyaUsd = null;
    if (dsRes.ok) {
      const ds = await dsRes.json();
      const pair = ds?.pairs?.[0];
      if (pair?.priceUsd) memeyaUsd = parseFloat(pair.priceUsd);
    }

    return { solUsd, memeyaUsd };
  });
}

/**
 * GET /api/memes/generate-price — Current SOL & $Memeya prices for meme generation
 * Note: no cacheResponse middleware — getOrFetch already caches the Jupiter call,
 * and cacheResponse would also cache 503 errors.
 */
router.get("/generate-price", async (req, res) => {
  try {
    const { solUsd, memeyaUsd } = await fetchPrices();

    if (!solUsd) {
      return res.status(503).json({ success: false, error: 'SOL price unavailable, try again shortly' });
    }

    const solAmount = BASE_USD_PRICE / solUsd;
    const memeyaDiscountedUsd = BASE_USD_PRICE * (1 - MEMEYA_DISCOUNT);
    const memeyaAmount = memeyaUsd ? (memeyaDiscountedUsd / memeyaUsd) : null;

    res.json({
      success: true,
      sol: {
        amount: parseFloat(solAmount.toFixed(9)),
        usd: solUsd,
      },
      memeya: memeyaUsd ? {
        amount: parseFloat(memeyaAmount.toFixed(2)),
        usd: memeyaUsd,
        discount: MEMEYA_DISCOUNT,
      } : null,
      usdc: { amount: BASE_USD_PRICE },
      baseUsd: BASE_USD_PRICE,
    });
  } catch (error) {
    console.error("Generate price error:", error);
    res.status(503).json({ success: false, error: "Price service unavailable" });
  }
});

/**
 * POST /api/memes/generate-solana — Generate a meme after on-chain payment
 * Body: { topic, txSignature, paymentToken: 'SOL'|'MEMEYA'|'USDC' }
 */
router.post("/generate-solana", async (req, res) => {
  try {
    const { topic, txSignature, paymentToken } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({ success: false, error: "topic is required (min 2 chars)" });
    }
    if (!txSignature || typeof txSignature !== 'string') {
      return res.status(400).json({ success: false, error: "txSignature is required" });
    }
    if (!['SOL', 'MEMEYA', 'USDC'].includes(paymentToken)) {
      return res.status(400).json({ success: false, error: "paymentToken must be SOL, MEMEYA, or USDC" });
    }

    // Pre-flight: rate limit failed verification attempts (prevent RPC spam)
    const clientKey = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const failEntry = verifyFailLimiter.get(clientKey);
    if (failEntry && now < failEntry.resetAt && failEntry.count >= VERIFY_FAIL_LIMIT) {
      return res.status(429).json({ success: false, error: "Too many failed attempts. Try again later." });
    }

    const db = getFirestore();

    // Fetch current price to determine expected amount
    const { solUsd, memeyaUsd } = await fetchPrices();

    let minAmount;
    if (paymentToken === 'SOL') {
      if (!solUsd) return res.status(503).json({ success: false, error: "SOL price unavailable" });
      minAmount = BASE_USD_PRICE / solUsd;
    } else if (paymentToken === 'MEMEYA') {
      if (!memeyaUsd) return res.status(503).json({ success: false, error: "$Memeya price unavailable" });
      minAmount = (BASE_USD_PRICE * (1 - MEMEYA_DISCOUNT)) / memeyaUsd;
    } else {
      // USDC: 1 USDC ≈ $1, no price lookup needed
      minAmount = BASE_USD_PRICE;
    }

    // Build context for order record (price snapshot + topic for auditing)
    const orderContext = {
      topic: topic.trim(),
      solUsdPrice: solUsd,
      memeyaUsdPrice: memeyaUsd,
      baseUsdPrice: BASE_USD_PRICE,
    };

    // Verify on-chain payment (also extracts sender wallet + actual amount)
    let verifyResult;
    try {
      verifyResult = await verifySolanaPayment(txSignature, paymentToken, minAmount, orderContext);
    } catch (verifyErr) {
      // Track failed verification attempts per IP to prevent RPC spam
      if (failEntry && now < failEntry.resetAt) {
        failEntry.count++;
      } else {
        verifyFailLimiter.set(clientKey, { count: 1, resetAt: now + VERIFY_FAIL_WINDOW });
      }
      throw verifyErr;
    }

    const { sender, actualAmount } = verifyResult;

    // Rate limit: 5 per hour per wallet
    // Checked AFTER payment verification so we know the sender, but the tx
    // is already stored as 'verified'. If rate-limited, mark it as failed
    // so the user can retry after the window expires.
    const limiterEntry = solanaGenLimiter.get(sender);
    if (limiterEntry && now < limiterEntry.resetAt && limiterEntry.count >= SOLANA_GEN_LIMIT) {
      await markPaymentRateLimited(txSignature).catch(e => console.error('markPaymentRateLimited failed:', e.message));
      return res.status(429).json({ success: false, error: `Rate limit exceeded — ${SOLANA_GEN_LIMIT} memes per hour. Your payment can be retried later.` });
    }
    if (limiterEntry && now < limiterEntry.resetAt) {
      limiterEntry.count++;
    } else {
      solanaGenLimiter.set(sender, { count: 1, resetAt: now + 60 * 60 * 1000 });
    }

    // Generate meme
    let meme;
    try {
      meme = await generateSingleMeme({ topic: topic.trim() });
    } catch (genErr) {
      // Mark payment as failed so user can retry
      await markPaymentFailed(txSignature, genErr.message || 'Meme generation failed').catch(e => console.error('markPaymentFailed failed:', e.message));
      throw genErr;
    }

    // Mark payment completed + denormalize creator on meme doc
    try {
      await Promise.all([
        markPaymentCompleted(txSignature, meme?.id),
        meme?.id && db.collection(collections.MEMES).doc(meme.id).update({
          createdBy: sender,
          paymentToken,
          paymentTxSignature: txSignature,
        }),
      ]);
    } catch (dbErr) {
      console.error(`Payment completion DB error (tx=${txSignature}, meme=${meme?.id}):`, dbErr.message);
      // Don't throw — meme was generated successfully, user should still get it
    }

    // Log to Workshop feed (fire-and-forget)
    logSolanaTransaction(paymentToken, sender).catch(() => {});

    res.json({ success: true, meme });
  } catch (error) {
    const status = error.status || 500;
    console.error("Generate-solana error:", error.message);
    res.status(status).json({
      success: false,
      error: error.message || "Failed to generate meme",
    });
  }
});

/** Log Solana payment to Workshop feed */
async function logSolanaTransaction(paymentToken, sender) {
  const db = getFirestore();
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8);
  const short = sender.slice(0, 4) + '...' + sender.slice(-4);
  const token = paymentToken === 'MEMEYA' ? '$Memeya' : paymentToken === 'USDC' ? 'USDC' : 'SOL';

  const workshopRef = db.collection(collections.MEMEYA_WORKSHOP).doc(date);
  await workshopRef.set({
    entries: admin.firestore.FieldValue.arrayUnion({
      time,
      topic: 'solana_commerce',
      text_en: `Forged a custom meme for ${short} — paid with ${token} on Solana`,
      text_zh: `為 ${short} 打造了自訂 meme — 使用 ${token} 在 Solana 上支付`,
      ambient: false,
    }),
  }, { merge: true });
}

/**
 * DELETE /api/memes/:id - Delete a meme (owner only, verified via solana_orders)
 * Body: { wallet }
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { wallet } = req.body;

    if (!wallet || typeof wallet !== 'string' || wallet.length < 32) {
      return res.status(400).json({ success: false, error: "Valid wallet address is required" });
    }

    const db = getFirestore();

    // Verify ownership via solana_orders
    const ordersSnap = await db.collection(collections.SOLANA_ORDERS)
      .where('memeId', '==', id)
      .where('sender', '==', wallet)
      .where('status', '==', 'completed')
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      return res.status(403).json({ success: false, error: "You don't own this meme" });
    }

    // Delete the meme doc
    await db.collection(collections.MEMES).doc(id).delete();

    // Mark order as deleted for audit trail
    const orderDoc = ordersSnap.docs[0];
    await orderDoc.ref.update({ status: 'deleted', deletedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete meme error:", error);
    res.status(500).json({ success: false, error: "Failed to delete meme" });
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
