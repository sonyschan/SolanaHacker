const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Use Gemini 3 series models with retry mechanism as requested by H2Crypto
const geminiService = require('./services/geminiService-v3-retry');

// Initialize Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://165.22.136.40:5173',
    'https://solana-hacker.vercel.app',
    'https://solanahacker.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Serve generated images
app.use('/generated', express.static(path.join(__dirname, 'public/generated')));

// Test health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Server with Gemini 3 series image generation + retry mechanism',
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    retryMechanism: {
      enabled: true,
      maxRetries: 3,
      delayMs: 60000
    },
    version: '3.1 - Gemini 3 Pro Image Generation with Retry!'
  });
});

// Test Gemini 3 connection with retry
app.get('/api/test/gemini', async (req, res) => {
  try {
    const result = await geminiService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate memes with Gemini 3 Pro Image + Retry
app.post('/api/memes/generate-daily', async (req, res) => {
  try {
    console.log('🚀 使用 Gemini 3 Pro Image + 重試機制 開始每日梗圖生成...');
    
    // 熱門加密貨幣新聞
    const trendingNews = [
      'Bitcoin ETF 創下單日 20 億美元流入新紀錄',
      'Solana 迷因幣在病毒式 TikTok 趨勢中暴漲 1000%',
      '以太坊 Gas 費降至 0.01 美元，主要擴容升級後'
    ];
    
    const startTime = Date.now();
    const memes = await geminiService.generateDailyMemes(trendingNews, 3);
    const generationTime = Date.now() - startTime;
    
    const realImages = memes.filter(m => m.metadata.imageGenerated).length;
    const retrySuccesses = memes.filter(m => m.metadata.retrySucceeded).length;
    const retryFailures = memes.filter(m => m.metadata.retriesFailed).length;
    
    console.log(`✅ 使用 Gemini 3 + 重試在 ${generationTime}ms 內生成了 ${memes.length} 個梗圖`);
    console.log(`📊 成功: ${realImages}, 重試成功: ${retrySuccesses}, 重試失敗: ${retryFailures}`);
    
    res.json({
      success: true,
      message: `使用 Gemini 3 Pro Image + 重試生成了 ${memes.length} 個加密梗圖`,
      memes,
      generationTime,
      stats: {
        realImagesCount: realImages,
        retrySuccesses,
        retryFailures,
        totalMemes: memes.length
      },
      retryMechanism: {
        enabled: true,
        maxRetries: 3,
        delayMs: 60000
      },
      gemini3: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Gemini 3 + 重試生成失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get today's memes with Gemini 3 + Retry
app.get('/api/memes/today', async (req, res) => {
  try {
    console.log('📸 使用 Gemini 3 Pro Image + 重試機制 獲取今日梗圖...');
    
    // 熱門加密新聞
    const hotNews = [
      'Dogecoin 在馬斯克推文火箭表情符號後飆升 300%',
      'DeFi 協議在複雜的閃電貸攻擊中被駭 5000 萬美元',
      'NFT 市場推出AI驅動的稀有度驗證系統'
    ];
    
    const memes = await geminiService.generateDailyMemes(hotNews, 3);
    
    const realImages = memes.filter(m => m.metadata.imageGenerated).length;
    const retrySuccesses = memes.filter(m => m.metadata.retrySucceeded).length;
    
    return res.json({
      success: true,
      memes,
      freshlyGenerated: true,
      stats: {
        realImagesGenerated: realImages,
        retrySuccesses,
        totalMemes: memes.length
      },
      retryMechanism: {
        enabled: true,
        working: true
      },
      gemini3: true,
      timestamp: new Date().toISOString(),
      message: `使用 Gemini 3 + 重試生成的新鮮AI梗圖準備好了！ (${realImages}/${memes.length} 真實圖像, ${retrySuccesses} 重試成功)`
    });
  } catch (error) {
    console.error('獲取今日梗圖錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mock voting endpoint for testing
app.post('/api/vote', (req, res) => {
  const { memeId, voteType, choice } = req.body;
  
  console.log(`📝 收到投票: ${voteType} = ${choice} for meme ${memeId}`);
  
  res.json({
    success: true,
    message: '投票記錄成功',
    ticketsAwarded: Math.floor(Math.random() * 8) + 8, // 8-15 tickets
    voteData: { memeId, voteType, choice }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('服務器錯誤:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 使用 Gemini 3 Pro Image + 重試機制的測試服務器運行在端口 ${PORT}`);
  console.log(`🌍 CORS 已為 Vercel (https://solana-hacker.vercel.app) 和本地開發啟用`);
  console.log(`🎨 Gemini 3 API: ${process.env.GEMINI_API_KEY ? '已配置 ✅' : '缺失 ❌'}`);
  console.log(`🖼️ Gemini 3 Pro Image 真實AI圖像生成: 已啟用`);
  console.log(`🔄 重試機制: 最多3次，間隔1分鐘`);
  console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
});

module.exports = app;