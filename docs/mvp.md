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

#### 6. 身份驗證流程
```javascript
// Wallet 驗證機制
const authenticateWallet = async (walletAddress, signature) => {
  // 1. Frontend 用錢包簽名隨機消息
  const message = `MemeForge Login: ${Date.now()}`;
  const signature = await wallet.signMessage(message);
  
  // 2. Backend 驗證簽名
  const isValid = verifySignature(walletAddress, message, signature);
  
  // 3. 返回 JWT Token
  if (isValid) {
    return jwt.sign({ walletAddress }, JWT_SECRET, { expiresIn: '24h' });
  }
};
```

---

## 🔧 技術實作方案

### 1. Cloud Run 後端服務
```javascript
// 新建: backend/server.js (部署到 Cloud Run)
const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const app = express();

// 投票 API
app.post('/api/vote', async (req, res) => {
  const { userId, memeId, voteType } = req.body;
  // 儲存到 Firestore
  // 即時更新投票統計
  // 發放彩票獎勵
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
    // 8-12 基礎 + 連續獎勵
    const base = Math.floor(Math.random() * 5) + 8; // 8-12
    const streakBonus = consecutiveDays >= 4 ? Math.floor(Math.random() * 3) + 1 : 0;
    const capBonus = consecutiveDays >= 8 ? 2 : 0;
    return Math.min(base + streakBonus + capBonus, 15);
  },
  
  // 週日開獎邏輯
  drawWinners: (allTickets, jackpotSOL) => {
    // 80% 分給中獎者，20% 營運
    const prizePool = jackpotSOL * 0.8;
    return drawRandomWinners(allTickets, prizePool);
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
    // 調用 Gemini API 生成 3 個梗圖
    // 上傳到 Cloud Storage
    // 更新 Firestore 當日梗圖記錄
    const memes = await generateMemesWithGemini();
    await saveTodayMemes(memes);
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

### Phase 1 (1-2 天)：Cloud Run 後端服務
1. 建立 Express.js 後端專案
2. 部署到 Cloud Run (自動擴展)
3. 實作投票 API 和彩票 API
4. 整合 Firestore 數據存儲

### Phase 2 (1-2 天)：AI 梗圖生成
5. 整合 Gemini API 生成梗圖
6. 設置 Cloud Storage 圖片存儲
7. 建立 Cloud Scheduler 每日任務
8. 實作梗圖管理 API

### Phase 3 (1-2 天)：前端整合
9. 修改前端呼叫 Cloud Run API
10. 實作 Firestore 即時同步
11. 優化用戶體驗和錯誤處理
12. 部署前端到 Firebase Hosting

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