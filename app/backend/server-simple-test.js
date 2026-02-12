const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://165.22.136.40:5173',
    'https://solana-hacker.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Serve generated images
app.use('/generated', express.static(path.join(__dirname, 'public/generated')));

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simple test server for Vercel + GCP images',
    version: 'Simple v1.0'
  });
});

// Simple memes endpoint - use existing generated images
app.get('/api/memes/today', (req, res) => {
  try {
    console.log('📸 Returning pre-generated Gemini 3 Pro images');
    
    // Use the 3 images we already generated successfully
    const memes = [
      {
        id: 'meme_1770877884170',
        title: '抖音勝過K線',
        description: '當技術分析師輸給TikTok算法時的心情',
        imageUrl: '/generated/meme_gemini3_1770877884170.png',
        newsSource: 'Dogecoin 在馬斯克推文火箭表情符號後飆升 300%',
        type: 'daily',
        status: 'active',
        votes: {
          selection: { yes: 42, no: 18 },
          rarity: { common: 25, rare: 35, legendary: 40 }
        },
        metadata: {
          imageGenerated: true,
          realImage: true,
          aiModel: 'gemini-3-pro-image-preview',
          gemini3: true
        }
      },
      {
        id: 'meme_1770877928901',
        title: '技術分析破防',
        description: '專業分析師vs社群媒體趨勢的對決',
        imageUrl: '/generated/meme_gemini3_1770877928901.png',
        newsSource: 'DeFi 協議在複雜的閃電貸攻擊中被駭 5000 萬美元',
        type: 'daily',
        status: 'active',
        votes: {
          selection: { yes: 38, no: 22 },
          rarity: { common: 30, rare: 28, legendary: 42 }
        },
        metadata: {
          imageGenerated: true,
          realImage: true,
          aiModel: 'gemini-3-pro-image-preview',
          gemini3: true
        }
      },
      {
        id: 'meme_1770877975946',
        title: 'NFT新驗證系統',
        description: 'AI驅動的稀有度驗證改變遊戲規則',
        imageUrl: '/generated/meme_gemini3_1770877975946.png',
        newsSource: 'NFT 市場推出AI驅動的稀有度驗證系統',
        type: 'daily',
        status: 'active',
        votes: {
          selection: { yes: 45, no: 15 },
          rarity: { common: 20, rare: 40, legendary: 40 }
        },
        metadata: {
          imageGenerated: true,
          realImage: true,
          aiModel: 'gemini-3-pro-image-preview',
          gemini3: true
        }
      }
    ];

    res.json({
      success: true,
      memes,
      freshlyGenerated: false,
      fromGemini3: true,
      timestamp: new Date().toISOString(),
      message: '成功返回 Gemini 3 Pro Image 生成的真實AI梗圖!'
    });

  } catch (error) {
    console.error('Error serving memes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mock voting endpoint
app.post('/api/vote', (req, res) => {
  const { memeId, voteType, choice } = req.body;
  
  console.log(`📝 收到投票: ${voteType} = ${choice} for meme ${memeId}`);
  
  res.json({
    success: true,
    message: '投票記錄成功',
    ticketsAwarded: Math.floor(Math.random() * 8) + 8,
    voteData: { memeId, voteType, choice }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 簡化測試服務器運行在端口 ${PORT}`);
  console.log(`🎨 提供 Gemini 3 Pro Image 生成的真實梗圖`);
  console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
  console.log(`🖼️ 梗圖端點: http://localhost:${PORT}/api/memes/today`);
});

module.exports = app;