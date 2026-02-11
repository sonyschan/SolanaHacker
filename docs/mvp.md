# MemeForge MVP 技術實作計畫

## 💡 選項 1 - 完成投票核心邏輯

基於目前的程式碼分析，制定完整的技術實作策略。

### 🎯 現況評估

我們已經有很強的 **前端投票 UI**：
- ✅ `EnhancedVotingInterface.jsx` - 精美的投票界面
- ✅ `VotingInterface.jsx` - 投票邏輯組件
- ✅ 模擬數據和即時統計顯示
- ⚠️ **但缺少真實的後端邏輯和狀態管理**

---

## 🌐 前後端溝通機制

### Frontend (Vercel) ↔ Backend (Cloud Run) 整合

#### 1. API 通訊規格
```javascript
// Frontend 環境變數 (Vercel)
VITE_API_BASE_URL=https://memeforge-api-xxx.run.app
VITE_FIREBASE_CONFIG={...}

// Backend API 端點
const API_ENDPOINTS = {
  vote: 'POST /api/vote',
  getMemes: 'GET /api/memes/today',
  getStats: 'GET /api/stats/:memeId',
  getUserTickets: 'GET /api/user/:userId/tickets',
  getUserProfile: 'GET /api/user/:userId/profile'
};
```

#### 2. 詳細 API 介面
```typescript
// POST /api/vote
interface VoteRequest {
  userId: string;
  memeId: string;
  voteType: 'step1' | 'step2';
  choice: 'meme1' | 'meme2' | 'meme3' | 'common' | 'rare' | 'legendary';
  walletAddress: string;
}

interface VoteResponse {
  success: boolean;
  ticketsAwarded?: number;
  consecutiveDays: number;
  message: string;
  nextVoteAvailable?: string; // ISO timestamp
}

// GET /api/memes/today
interface MemesResponse {
  memes: Array<{
    id: string;
    imageUrl: string;
    prompt: string;
    generatedAt: string;
  }>;
  votingPhase: 'step1' | 'step2' | 'closed';
  timeRemaining: number; // seconds
}
```

#### 3. Firestore 即時同步
```javascript
// Frontend 即時監聽投票統計
import { onSnapshot, doc } from 'firebase/firestore';

const useVotingStats = (memeId) => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestore, 'voteStats', memeId),
      (snapshot) => setStats(snapshot.data())
    );
    return unsubscribe;
  }, [memeId]);
  
  return stats;
};

// 多用戶即時更新
const VotingInterface = () => {
  const stats = useVotingStats(currentMeme.id);
  // UI 自動同步其他用戶的投票
};
```

#### 4. 錯誤處理與重試機制
```javascript
// Frontend API 呼叫
const apiClient = {
  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      // 網路錯誤重試機制
      if (error.name === 'NetworkError') {
        return this.retryWithBackoff(endpoint, data);
      }
      throw error;
    }
  }
};
```

#### 5. CORS 與安全設定
```javascript
// Backend CORS 設定 (Cloud Run)
const corsOptions = {
  origin: [
    'https://memeforge.vercel.app',
    'https://memeforge-git-*.vercel.app', // Preview deployments
    'http://localhost:5173' // Development
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

#### 6. Solana 錢包完整驗證流程
```javascript
// Frontend: 錢包簽名流程
const authenticateWallet = async (wallet) => {
  try {
    // 1. 生成隨機 nonce 防重放攻擊
    const nonce = Date.now().toString() + Math.random().toString(36);
    const message = `MemeForge Login\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
    
    // 2. 用 Solana 錢包簽名訊息
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await wallet.signMessage(encodedMessage);
    
    // 3. 發送到後端驗證
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: wallet.publicKey.toString(),
        message,
        signature: Array.from(signature)
      })
    });
    
    const { jwt } = await response.json();
    
    // 4. 儲存 JWT Token
    localStorage.setItem('memeforge_auth_token', jwt);
    sessionStorage.setItem('wallet_address', wallet.publicKey.toString());
    
    return jwt;
  } catch (error) {
    console.error('Wallet authentication failed:', error);
    throw error;
  }
};

// Backend: 簽名驗證
const verifyWalletSignature = async (walletAddress, message, signature) => {
  const { PublicKey } = require('@solana/web3.js');
  const nacl = require('tweetnacl');
  
  try {
    // 1. 驗證 nonce 時效性 (5分鐘內有效)
    const timestamp = message.match(/Timestamp: (.+)/)[1];
    const messageTime = new Date(timestamp).getTime();
    const now = Date.now();
    if (now - messageTime > 5 * 60 * 1000) {
      throw new Error('Message expired');
    }
    
    // 2. 驗證 Solana 簽名
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = new Uint8Array(signature);
    
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // 3. 生成 JWT Token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        walletAddress,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      process.env.JWT_SECRET
    );
    
    return { success: true, token };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// JWT 中間件保護 API
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## 📦 數據存儲定位

### localStorage (瀏覽器本地，跨 session 保留)
| 數據 | 用途 | 過期策略 |
|-----|------|---------|
| memeforge_auth_token | JWT 認證 | 24 小時 |
| wallet_address | 錢包地址快取 | 永久 |
| today_voted | 今日投票狀態快取 | UTC 00:00 重置 |
| consecutive_days | 連續天數快取 | 每次投票後更新 |
| pending_votes | 離線暫存投票 | 同步後清除 |

### sessionStorage (瀏覽器本地，關閉即清)
| 數據 | 用途 |
|-----|------|
| current_meme_selection | 當前選擇的梗圖 index |

### Firestore (雲端，真相來源)
| Collection | 數據 | 即時同步 |
|-----------|------|---------|
| users/{walletAddress} | 用戶資料、連續天數 | ❌ |
| votes/{date}_{wallet} | 投票記錄 | ❌ |
| voteStats/{memeId} | 投票統計 | ✅ onSnapshot |
| tickets/{date}_{wallet} | 彩票記錄 | ❌ |
| memes/{date} | 當日梗圖 | ❌ |

### Cloud Storage
| 路徑 | 內容 |
|-----|------|
| memes/{date}/{id}.png | AI 生成的梗圖圖片 |

---

## 🔧 技術實作方案

### 1. Cloud Run 後端服務
```javascript
// 新建: backend/server.js (部署到 Cloud Run)
const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const app = express();

// 投票 API (含 Rate Limiting)
const rateLimit = require('express-rate-limit');

// 每用戶每日投票限制
const votingRateLimit = rateLimit({
  keyGenerator: (req) => req.user.walletAddress, // 基於錢包地址
  windowMs: 24 * 60 * 60 * 1000, // 24 小時
  max: 2, // 每日最多 2 次投票 (step1 + step2)
  message: { error: 'Daily voting limit reached' },
  standardHeaders: true,
  legacyHeaders: false,
});

// IP-based Rate Limiting (防止多錢包刷票)
const ipRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 小時  
  max: 10, // 每 IP 最多 10 次投票
  message: { error: 'Too many votes from this IP' }
});

app.post('/api/vote', authenticateJWT, votingRateLimit, ipRateLimit, async (req, res) => {
  const { memeId, voteType, choice } = req.body;
  const userId = req.user.walletAddress;
  
  try {
    // 防重複投票檢查
    const existingVote = await firestore
      .collection('votes')
      .where('userId', '==', userId)
      .where('memeId', '==', memeId)
      .where('voteType', '==', voteType)
      .get();
    
    if (!existingVote.empty) {
      return res.status(400).json({ error: 'Already voted for this step' });
    }
    
    // 儲存投票到 Firestore
    await firestore.collection('votes').add({
      userId,
      memeId,
      voteType,
      choice,
      timestamp: new Date(),
      ip: req.ip
    });
    
    // 即時更新投票統計
    await updateVoteStats(memeId, choice);
    
    // 發放彩票獎勵 (只在 step2 完成後)
    let ticketsAwarded = 0;
    if (voteType === 'step2') {
      const consecutiveDays = await getConsecutiveDays(userId);
      ticketsAwarded = LotterySystem.calculateTickets(consecutiveDays);
      
      await firestore.collection('tickets').add({
        userId,
        tickets: ticketsAwarded,
        date: new Date(),
        consecutiveDays
      });
    }
    
    res.json({
      success: true,
      ticketsAwarded,
      message: voteType === 'step2' ? `Awarded ${ticketsAwarded} tickets!` : 'Step 1 complete'
    });
    
  } catch (error) {
    console.error('Vote submission failed:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// 獲取當日梗圖
app.get('/api/memes/today', async (req, res) => {
  // 從 Cloud Storage 讀取 AI 生成的梗圖
});
```

### 2. Firestore 數據存儲
```javascript
// 新建: app/src/utils/cloudStorage.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const CloudStorage = {
  // Firestore 數據庫操作
  saveVote: async (userId, memeId, vote) => {
    await setDoc(doc(db, 'votes', voteId), {
      userId, memeId, vote, timestamp: new Date()
    });
  },
  
  // 即時投票統計
  getVoteStats: (memeId) => {
    return onSnapshot(doc(db, 'stats', memeId), callback);
  },
  
  // 用戶彩票記錄
  addTickets: async (userId, tickets) => {...},
}
```

### 3. 彩票系統邏輯
```javascript
// 新建: app/src/utils/lotterySystem.js
export const LotterySystem = {
  // 彩票分配 (完全基於產品規格)
  calculateTickets: (consecutiveDays) => {
    // 8-15 基礎隨機分配
    const base = Math.floor(Math.random() * 8) + 8; // 8-15
    const streakBonus = consecutiveDays >= 4 ? Math.floor(Math.random() * 3) + 1 : 0;
    const capBonus = consecutiveDays >= 8 ? 2 : 0;
    return Math.min(base + streakBonus + capBonus, 15);
  },
  
  // SOL 入池機制 (MVP: 免費參與，驗證概念)
  getJackpotPool: () => {
    // MVP 階段：模擬 SOL 池，無實際付費
    return {
      currentPool: 100, // 模擬 100 SOL 獎金池
      note: 'MVP 為免費參與，驗證遊戲機制',
      futureModel: '未來將加入參與費用 (0.01-0.05 SOL/次)'
    };
  },
  
  // 未來商業模式規劃
  futureSOLFlow: {
    participationFee: 0.01, // 0.01 SOL per vote
    prizeDistribution: {
      winners: 0.8,      // 80% 給中獎者
      operations: 0.15,  // 15% 營運成本
      development: 0.05  // 5% 開發基金
    },
    minimumJackpot: 10  // 最少 10 SOL 才開獎
  },
  
  // 週日開獎邏輯 (MVP: 只記錄中獎者)
  drawWinners: (allTickets, jackpotSOL) => {
    // MVP 階段：只記錄中獎者，不實際轉帳 SOL
    const prizePool = jackpotSOL * 0.8; // 80% 分給中獎者
    const winners = drawRandomWinners(allTickets);
    
    // 記錄中獎者到 Firestore
    return {
      winners,
      prizePool,
      note: 'MVP 階段暫不實際轉帳，Phase 2 將實作 on-chain 轉帳'
    };
  },
  
  // Phase 2: 實際 SOL 轉帳 (Future Implementation)
  distributePrizes: async (winners, prizePool) => {
    // TODO: 使用 Solana Web3.js 實作
    // 1. 建立交易指令
    // 2. 簽名並發送交易
    // 3. 確認交易成功
    throw new Error('On-chain prize distribution not implemented in MVP');
  },
}
```

### 4. Cloud Scheduler 自動化任務
```javascript
// 新建: backend/scheduledTasks.js
const { CloudSchedulerClient } = require('@google-cloud/scheduler');

export const ScheduledTasks = {
  // 每日 UTC 00:00 生成新梗圖
  dailyMemeGeneration: async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 3 種不同風格的 Prompt 策略
    const promptTemplates = [
      // 風格 1: 加密貨幣熱門話題
      {
        type: 'crypto_trend',
        prompt: `Create a humorous meme about recent cryptocurrency trends. Include popular crypto terminology but make it accessible to general audience. Style: internet meme format with bold text overlay.`
      },
      
      // 風格 2: AI 與科技幽默
      {
        type: 'ai_tech',
        prompt: `Generate a funny meme about AI and technology interactions in daily life. Focus on relatable situations where AI behaves unexpectedly. Style: modern meme template with contrasting scenarios.`
      },
      
      // 風格 3: 社群文化梗
      {
        type: 'community',
        prompt: `Create a meme about online community culture and social media behavior. Include current internet slang but keep it family-friendly. Style: reaction meme or comparison format.`
      }
    ];
    
    const memes = [];
    
    for (let i = 0; i < 3; i++) {
      try {
        const template = promptTemplates[i];
        
        // 添加隨機性確保差異化
        const randomSeed = Math.floor(Math.random() * 1000);
        const enhancedPrompt = `${template.prompt} Unique seed: ${randomSeed}. Make this completely different from other memes generated today.`;
        
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash-image",
          generationConfig: {
            temperature: 0.9, // 高創意度
            maxOutputTokens: 100
          }
        });
        
        const result = await model.generateContent(enhancedPrompt);
        const imageUrl = await uploadToCloudStorage(result, `meme_${Date.now()}_${i}`);
        
        memes.push({
          id: `meme_${Date.now()}_${i}`,
          imageUrl,
          prompt: template.prompt,
          type: template.type,
          generatedAt: new Date().toISOString()
        });
        
        // 間隔 2 秒避免 API Rate Limit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Failed to generate meme ${i}:`, error);
        // 失敗時使用備用梗圖
        memes.push(await getFallbackMeme(i));
      }
    }
    
    // 品質檢查：確保 3 個梗圖風格不同
    const uniqueTypes = new Set(memes.map(m => m.type));
    if (uniqueTypes.size < 3) {
      console.warn('Generated memes lack diversity, triggering regeneration');
      // 重新生成缺少的風格
    }
    
    await saveTodayMemes(memes);
    return memes;
  },
  
  // 每日重置投票狀態
  dailyReset: async () => {
    // 清理昨日投票數據
    // 重置用戶投票狀態
    // 準備新一輪投票
  },
  
  // 週日開獎邏輯
  weeklyLottery: async () => {
    // 計算本週所有彩票
    // 隨機選出中獎者
    // 發送獎勵通知
  }
}
```

### 5. 整合現有組件
```javascript
// 修改: app/src/components/EnhancedVotingInterface.jsx
import { useVoting } from '../contexts/VotingContext';

const EnhancedVotingInterface = () => {
  const {
    currentMemes,
    userVotes,
    votingStats,
    submitVote,
    userTickets
  } = useVoting();
  
  // 真實投票邏輯取代模擬數據
  const handleVoteClick = async (voteType) => {
    const result = await submitVote(currentMemes[selectedMeme].id, voteType);
    // 更新 UI 狀態
  };
  
  // 使用真實投票統計而非固定數字
  const currentVotes = votingStats[currentMemes[selectedMeme]?.id] || {
    common: 0, rare: 0, legendary: 0
  };
};
```

---

## ⚡ 基於 GCP 的實作順序

### Phase 1 (2-3 天)：Cloud Run 後端服務
1. **GCP 環境設置** (0.5 天)
   - 建立 GCP 專案和服務帳號
   - 設置 Firestore、Cloud Storage 權限
   - 配置環境變數和 API 金鑰

2. **Express.js 後端開發** (1.5-2 天)
   - 建立專案結構和依賴套件
   - 實作完整的錢包驗證流程
   - 開發投票 API (含 Rate Limiting)
   - 整合 Firestore 數據存儲

3. **部署和測試** (0.5 天)
   - 部署到 Cloud Run
   - 設置 CORS 和安全政策
   - API 端點功能驗證

### Phase 2 (2-3 天)：AI 梗圖生成系統
4. **Gemini API 整合** (1.5 天)
   - 實作 3 種不同 prompt 策略
   - 建立品質檢查和容錯機制
   - 設置圖片上傳 Cloud Storage

5. **自動化排程** (1 天)
   - 建立 Cloud Scheduler 每日任務
   - 實作梗圖生成和存儲邏輯
   - 測試自動化流程

6. **容錯與監控** (0.5 天)
   - 建立 fallback 機制
   - 設置錯誤通知
   - 效能監控

### Phase 3 (2-3 天)：前端整合與優化
7. **API 客戶端重構** (1 天)
   - 建立統一的 API 呼叫層
   - 實作錯誤處理和重試機制
   - 整合錢包驗證流程

8. **即時同步實作** (1 天)
   - Firestore 即時監聽器
   - 多用戶狀態同步
   - 離線/上線處理

9. **用戶體驗優化** (0.5-1 天)
   - 載入狀態和動畫
   - 錯誤狀態處理
   - 響應式設計調整

10. **部署和整合測試** (0.5 天)
    - 前端部署到 Vercel
    - 完整流程測試
    - 效能優化

### Phase 4 (1-2 天)：測試與部署準備
11. **功能驗證** (1 天)
    - 完整投票流程測試
    - 彩票分配邏輯驗證
    - 跨裝置兼容性測試

12. **安全和效能** (0.5-1 天)
    - 安全性檢查
    - API Rate Limiting 測試
    - 效能優化和監控設置

**總計：7-11 天 (含緩衝時間應對突發問題)**

---

## 🎮 MVP 功能驗證

完成後用戶可以：
- ✅ 每天看到 3 個新梗圖
- ✅ 對梗圖投票 (Common/Rare/Legendary)
- ✅ 即時看到社群投票統計
- ✅ 獲得 8-15 隨機彩票
- ✅ 連續投票獲得獎勵加成
- ✅ 投票狀態在重新整理後保持

---

## 🔮 GCP Serverless 架構優勢

這個 MVP 設計為 **雲端原生**：
- **零維護成本**: Cloud Run 自動擴展，按使用付費
- **高可用性**: GCP 99.9% SLA 保證
- **即時同步**: Firestore 支援多用戶即時數據同步  
- **自動化運營**: Cloud Scheduler 處理所有定時任務
- **無限擴展**: 可支援數千並發用戶
- **成本效益**: 小規模使用幾乎免費

---

## 📊 MVP 完成標準

### 核心功能
- [ ] 每日 3 個梗圖展示
- [ ] 兩階段投票系統 (最愛 → 稀有度)
- [ ] 8-15 彩票分配邏輯
- [ ] 連續投票獎勵計算
- [ ] 投票統計即時更新
- [ ] Local Storage 持久化

### 用戶體驗
- [ ] 流暢的投票流程
- [ ] 清晰的投票結果反饋
- [ ] 彩票獲得通知
- [ ] 連續投票進度顯示
- [ ] 每日重置提醒

### 技術品質
- [ ] 錯誤處理機制
- [ ] 投票防重複提交
- [ ] 時區處理 (UTC)
- [ ] 組件測試覆蓋
- [ ] 性能優化