# 🎯 MemeForge Beta 階段技術規劃書

基於 MVP 的技術基礎，以下是 **Beta 測試階段**的技術執行計畫：

---

---

## 📍 當前部署狀態 (2026-02-12)

### Production 環境

| 服務 | URL | 狀態 |
|-----|-----|------|
| Frontend | https://solana-hacker.vercel.app | ✅ 運行中 |
| Backend API | https://memeforge-api-836651762884.asia-southeast1.run.app | ✅ 運行中 |
| Firestore | web3ai-469609 | ✅ 已建立索引 |

### 已完成的基礎設施

- [x] Cloud Run 部署 (asia-southeast1)
- [x] Firebase Admin SDK 認證
- [x] Firestore Composite Index (memes collection)
- [x] CORS 設定 (Vercel + Droplet origins)
- [x] 讀寫分離架構 (Firebase direct + Cloud Run API)

### 下一步 Beta 準備

- [ ] WebSocket 即時通訊
- [ ] Redis 快取層
- [ ] 微服務拆分
- [ ] NFT 鑄造智能合約


## 🌐 前後端通訊升級 (Beta)

### Vercel Frontend ↔ GCP Microservices

#### 1. 微服務 API Gateway
```javascript
// Cloud Run 服務分割
const MICROSERVICES = {
  voting: 'https://voting-service-xxx.run.app',
  memes: 'https://meme-service-xxx.run.app',
  lottery: 'https://lottery-service-xxx.run.app',
  nft: 'https://nft-service-xxx.run.app',
  notifications: 'https://notification-service-xxx.run.app'
};

// Frontend 統一 API 客戶端
class MemeForgeAPI {
  async vote(data) {
    return this.post(`${MICROSERVICES.voting}/vote`, data);
  }
  
  async getMemes() {
    return this.get(`${MICROSERVICES.memes}/today`);
  }
  
  async mintNFT(memeId) {
    return this.post(`${MICROSERVICES.nft}/mint`, { memeId });
  }
}
```

#### 2. WebSocket 即時通訊
```javascript
// 即時投票更新 & 社群聊天
import { io } from 'socket.io-client';

const useRealtimeUpdates = () => {
  useEffect(() => {
    const socket = io(MICROSERVICES.voting);
    
    // 即時投票統計
    socket.on('voteUpdate', (data) => {
      updateVotingStats(data);
    });
    
    // 社群聊天消息
    socket.on('newMessage', (message) => {
      addChatMessage(message);
    });
    
    // NFT Mint 成功通知
    socket.on('nftMinted', (nft) => {
      showSuccessNotification(nft);
    });
    
    return () => socket.disconnect();
  }, []);
};
```

#### 3. 高級快取策略
```javascript
// Service Worker + Redis 混合快取
// Frontend: Service Worker
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/memes')) {
    event.respondWith(
      caches.open('memes-cache').then(cache => {
        return cache.match(event.request).then(response => {
          // Cache first, 24小時過期
          return response || fetch(event.request);
        });
      })
    );
  }
});

// Backend: Redis 快取
const redis = new Redis(process.env.REDIS_URL);

const getCachedMemes = async (date) => {
  const cacheKey = `memes:${date}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const memes = await generateDailyMemes();
  await redis.setex(cacheKey, 86400, JSON.stringify(memes)); // 24h
  return memes;
};
```

#### 4. GraphQL 數據查詢
```graphql
# 替代 REST API，減少網路請求
type Query {
  currentMemes: [Meme!]!
  userProfile(walletAddress: String!): UserProfile
  votingStats(memeId: String!): VotingStats
  leaderboard(period: TimePeriod!): [LeaderboardEntry!]!
}

type Mutation {
  vote(input: VoteInput!): VoteResult!
  sendMessage(input: MessageInput!): Message!
  mintNFT(memeId: String!): NFTResult!
}

type Subscription {
  votingUpdates(memeId: String!): VotingStats!
  chatMessages: Message!
  lotteryResults: LotteryResult!
}
```

#### 5. 離線支援機制
```javascript
// Progressive Web App 離線功能
const OfflineManager = {
  // 離線時暫存投票
  queueVote: (voteData) => {
    const pending = JSON.parse(localStorage.getItem('pendingVotes') || '[]');
    pending.push({ ...voteData, timestamp: Date.now() });
    localStorage.setItem('pendingVotes', JSON.stringify(pending));
  },
  
  // 重新上線時同步
  syncPendingActions: async () => {
    const pending = JSON.parse(localStorage.getItem('pendingVotes') || '[]');
    for (const vote of pending) {
      try {
        await api.vote(vote);
      } catch (error) {
        console.warn('Sync failed for vote:', vote);
      }
    }
    localStorage.removeItem('pendingVotes');
  }
};
```

#### 6. 企業級監控與錯誤追蹤
```javascript
// Sentry 錯誤追蹤
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});

// 自定義錯誤邊界
const APIErrorBoundary = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

// Performance 監控
const trackUserAction = (action, metadata) => {
  Sentry.addBreadcrumb({
    message: action,
    category: 'user-action',
    data: metadata,
    level: 'info',
  });
};
```

---

## 📊 現況分析

### MVP 已完成
- ✅ 前端投票 UI 與狀態管理
- ✅ Local Storage 數據持久化  
- ✅ 彩票分配邏輯
- ✅ 每日梗圖生成機制
- ✅ 連續投票獎勵系統

### Beta 階段目標
**支援多個外部用戶同時測試完整的 MemeForge 體驗**

---

## 🛠 技術架構升級

### 1. Cloud Run 微服務架構
**目標：從單體後端升級為微服務架構**

- **投票微服務 (Cloud Run)**
  - 投票邏輯和驗證
  - 彩票發放算法
  - 連續投票獎勵計算
  - 防止重複投票機制

- **梗圖微服務 (Cloud Run)**
  - Gemini API 梗圖生成
  - Cloud Storage 圖片管理
  - 圖片壓縮和 CDN 優化
  - 每日生成排程管理

- **用戶微服務 (Cloud Run)**
  - Firebase Auth 身份驗證
  - 用戶資料管理
  - 投票歷史和統計
  - 成就和排行榜系統

### 2. GCP 數據層設計
**目標：高性能多用戶數據管理**

- **Firestore Database**
  - 即時投票同步 (多用戶)
  - 用戶投票記錄
  - 彩票和獎勵數據
  - 成就和統計數據

- **Cloud Storage + CDN**
  - AI 生成梗圖存儲
  - 全球 CDN 加速
  - 自動圖片優化
  - 備份和版本控制

- **BigQuery 數據分析**
  - 用戶行為分析
  - 投票趨勢分析
  - 營運決策數據
  - 自動報表生成

### 3. AI 整合升級
**目標：真實的 AI 梗圖生成**

- **Gemini API 整合**
  - 每日自動生成 3 個梗圖
  - 基於時事熱點的梗圖內容
  - 圖片品質優化與存儲
  - 生成失敗的備用機制

- **排程系統**
  - UTC 時區的每日重置
  - 自動梗圖生成任務
  - 週日開獎排程
  - 數據清理任務

### 4. 用戶體驗優化
**目標：流暢的多用戶互動體驗**

- **即時反饋系統**
  - 投票動畫效果
  - 彩票獲得提醒
  - 投票統計更新動畫
  - 排行榜即時更新

- **社群功能**
  - 即時在線人數顯示
  - 週投票排行榜
  - 用戶投票歷史
  - 連續投票成就系統

### 5. GCP 原生部署與監控
**目標：企業級測試環境**

- **完全 Serverless 部署**
  - Frontend: Firebase Hosting (全球 CDN)
  - Backend: Cloud Run (自動擴展)
  - Database: Firestore (多區域複製)
  - Storage: Cloud Storage (高可用性)

- **GCP 原生監控**
  - Cloud Monitoring: 實時系統指標
  - Cloud Logging: 結構化日誌收集
  - Error Reporting: 自動錯誤追蹤
  - Cloud Trace: API 性能分析
  - Uptime Checks: 服務可用性監控

---

## ⏱ 開發時程規劃

### Week 1: GCP 微服務建設
- 投票微服務 (Cloud Run) 開發
- Firestore 數據模型設計
- Firebase Auth 身份驗證整合
- Cloud Storage 梗圖存儲設置

### Week 2: AI 與自動化整合
- 梗圖微服務 + Gemini API 整合
- Cloud Scheduler 定時任務設置
- BigQuery 數據分析管道建立
- Cloud Monitoring 監控設置

### Week 3: 前端與即時同步
- Firestore 即時數據同步
- Firebase Hosting 前端部署
- 用戶體驗優化 (PWA 支援)
- 錯誤處理與離線支援

### Week 4: 測試與優化
- Cloud Load Testing 負載測試
- 多地區部署和 CDN 優化
- 安全性測試和性能調優
- Beta 用戶邀請和反饋收集

---

## 🎮 Beta 測試功能清單

### 核心功能
- [ ] 多用戶同時投票
- [ ] 即時投票統計同步
- [ ] AI 生成每日梗圖
- [ ] 跨用戶彩票獎勵
- [ ] 週排行榜競賽

### 用戶體驗
- [ ] 流暢的註冊/登入流程
- [ ] 即時反饋與動畫
- [ ] 響應式移動端支持
- [ ] 錯誤提示與引導
- [ ] 投票歷史查看

### 技術品質
- [ ] 99% 服務可用性
- [ ] <500ms API 響應時間
- [ ] 支援 50+ 並發用戶
- [ ] 完整錯誤監控
- [ ] 自動化備份機制

---

## 🚀 成功指標

**用戶參與度**
- 每日活躍用戶 > 20 人
- 平均投票完成率 > 80%
- 用戶留存率 > 60% (3天)

**技術穩定性**  
- 系統可用性 > 99%
- API 錯誤率 < 1%
- 頁面載入時間 < 3 秒

**功能完整度**
- 所有核心功能正常運作
- 多用戶並發無衝突
- AI 梗圖生成成功率 > 95%