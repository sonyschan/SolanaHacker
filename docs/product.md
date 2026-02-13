# MemeForge Product Specification

> AI-powered meme NFT voting platform with democratic rarity system and SOL rewards

**📦 Repository**: [GitHub - SolanaHacker](https://github.com/sonyschan/SolanaHacker)  
**🏆 Hackathon**: [Colosseum Hackathon Entry](https://arena.colosseum.org/) - **MVP Version**  
**🚀 Live Demo**: [MVP Demo](https://solana-hacker.vercel.app) - **Currently in MVP Phase**

---

## 🎯 Product Overview

**MemeForge** 是一個 Web3 平台，結合 AI 生成的梗圖、社群投票和經濟激勵，創建一個民主化的 NFT 市場，讓用戶通過參與決定價值。

### Core Value Proposition
- **免費參與**: 投票不需任何費用
- **真實獎勵**: 贏得實際的 SOL 獎金 (Beta 版本)
- **民主定價**: 社群投票決定 NFT 稀有度和價值  
- **持續參與**: 週期性獎勵系統保持用戶活躍
- **稀缺性驅動**: 每日僅鑄造 1 個 NFT，創造真正稀缺性 (Beta 版本)
- **公平機制**: Random Ticket Rewards 防止投票操控
- **100% 社群決定**: 完全由社群決定稀有度，無平台干預

---

## 📋 MVP vs Beta 功能對比

### 🚀 MVP 版本 (當前)
**包含功能:**
- ✅ AI 生成每日梗圖 (Gemini 3 Pro Image)
- ✅ 兩階段投票系統：
  - Phase 1: 選出勝利梗圖 (24小時投票期)
  - Phase 2: 決定勝利者的 NFT 稀有度 (Common/Rare/Legendary)
- ✅ AI 自動決定其他 Traits (根據圖片內容，最多10個traits)
- ✅ Tickets 累積系統 (投票獲得 8-15 張彩票)
- ✅ 模擬週末抽獎系統
- ✅ 投票連勝獎勵機制

**不包含功能 (標記為 Coming Soon):**
- ❌ NFT 鑄造 → **Beta 版本**
- ❌ NFT 競標拍賣 → **Beta 版本**  
- ❌ 鏈上 SOL 獎勵分配 → **Beta 版本**
- ❌ 真實獎池管理 → **Beta 版本**

### 🌟 Beta 版本 (開發中)
**新增功能:**
- ✅ 實際 NFT 鑄造到 Solana 區塊鏈
- ✅ 3天競標拍賣系統
- ✅ 真實 SOL 獎勵分配
- ✅ 智能合約集成
- ✅ 多簽錢包管理
- ✅ 獎池自動分配 (80% 用戶，20% 營運)
- ✅ **Firestore 即時同步**: 投票統計即時更新，多用戶同時看到變化
- ✅ **即時社群體驗**: onSnapshot 監聽器創造動態投票氛圍

---

## 🔄 完整價值循環 (6-Step Business Model)

```
1. AI 生成 Meme ✅ (MVP)
    ↓ (自動化內容生產)
2. 用戶投票 → 獲得彩票 (8-15張/次) ✅ (MVP)
    ↓ (免費參與，獲得獎勵機會)
3. 投票結果決定 Meme 稀有度 (Common → Legendary) ✅ (MVP)
    ↓ (民主化價值發現)
4. 高稀有度 Meme → 鑄造為 NFT → 競標拍賣 🚧 (Beta)
    ↓ (稀有內容變現)
5. 競標收益 → 進入獎池 (80% 分配給用戶，20% 用於營運) 🚧 (Beta)
    ↓ (創造實際價值)
6. 週日 8PM UTC 開獎 → 分配 SOL 給中獎者 🚧 (Beta，MVP為模擬)
    ↓ (價值回饋參與者，激勵下週參與)
```

### MVP 階段詳細說明

#### Step 1: AI 生成 Meme ✅
- **流程**: Gemini 3 Pro Image 自動生成獨特的梗圖內容
- **頻率**: 每日 3 個新梗圖
- **品質**: 經過幽默度和病毒傳播潛力篩選
- **內容來源**: Twitter 趋势、CoinDesk 新聞、Reddit r/CryptoCurrency
- **技術**: Gemini API 圖像生成，Grok API 新聞分析
- **狀態**: **完全實作** ✅

#### Step 2: 兩階段投票系統 ✅
- **第一階段**: 從 3 個梗圖中選擇最喜歡的 (勝者投票)
- **第二階段**: 對勝出梗圖決定稀有度 (Common/Rare/Legendary)
- **費用**: 完全免費，無 Gas Fee
- **獎勵**: 每次完整投票獲得 8-15 張彩票
- **連勝獎勵**: 連續投票的額外獎勵機制
- **時間**: 每個投票期 24 小時
- **狀態**: **完全實作** ✅

#### Step 3: AI Traits 決定 ✅
- **輸入**: 勝出梗圖的圖片內容
- **處理**: AI 分析圖片，自動生成相關 traits
- **稀有度**: 完全由社群投票決定
- **其他 Traits**: AI 根據圖片內容決定 (最多共10個traits)
- **透明度**: 結果公開可查
- **狀態**: **完全實作** ✅

#### Step 4-6: Beta 版本功能 🚧
- **NFT 鑄造**: 稀缺性驅動 (每日僅 1 個)
- **競標系統**: 3 天拍賣期，最高價得標
- **真實獎勵**: SOL 分配給彩票中獎者
- **狀態**: **開發中，標記為 Coming Soon**

---

## 🎮 用戶體驗流程 (MVP)

### 1. 連接錢包
- 支援 Phantom, Solflare 等主流錢包
- 僅用於身份識別，無需代幣

### 2. 查看每日梗圖
- 3 個 AI 生成的高品質梗圖
- 顯示投票統計和趋势來源
- 點擊放大查看詳情

### 3. 第一階段投票
- 選擇最喜歡的梗圖
- 即時看到投票統計更新
- 投票後立即進入第二階段

### 4. 第二階段投票
- 為勝出梗圖決定稀有度
- Common/Rare/Legendary 三選一
- 投票完成獲得 8-15 張彩票

### 5. 查看獲得的彩票
- 累積彩票數量顯示
- 投票連勝天數統計
- 模擬週末抽獎參與

### 6. 等待下次投票
- 24小時冷卻時間
- 查看其他用戶的投票結果
- 準備參與明日的梗圖投票

---

## 🏗️ 技術架構 (MVP)

### Frontend
- **React + Vite**: 現代前端開發
- **Tailwind CSS**: 響應式設計
- **Solana Web3.js**: 錢包連接
- **Vercel 部署**: 快速 CDN 分發

### Backend  
- **Node.js + Express**: API 服務器
- **Google Cloud Run**: 無服務器部署
- **Firebase/Firestore**: 用戶數據存儲
- **Google Cloud Storage**: 圖片資產管理

### AI 服務
- **Gemini 3 Pro Image**: 梗圖生成
- **Grok API**: 新聞分析和趨勢監測
- **每日自動化**: Cloud Scheduler 排程

### 區塊鏈 (Beta準備)
- **Solana Devnet**: 開發測試
- **SPL Token**: NFT 標準
- **多簽錢包**: 獎池管理
- **Jupiter Integration**: SOL 交易

---

## 📊 關鍵指標

### MVP 成功指標
- **日活躍用戶**: 目標 100+ 投票者
- **投票完成率**: >80% 兩階段投票完成
- **彩票累積**: 平均每用戶 50+ 張
- **連勝參與**: >30% 用戶連續 3 天投票
- **梗圖質量**: 用戶滿意度 >4/5

### Beta 準備指標
- **技術穩定性**: 99%+ uptime
- **投票準確性**: 投票結果零錯誤
- **用戶留存**: 7 日留存率 >50%
- **社群參與**: Discord/Telegram 活躍度
- **NFT 需求**: 預約 Beta 用戶數

---

## 🛣️ Roadmap

### Phase 1: MVP Launch ✅ (當前)
- [x] AI 梗圖生成系統
- [x] 兩階段投票機制
- [x] 彩票獎勵系統
- [x] 錢包集成和用戶界面
- [x] 模擬抽獎功能

### Phase 2: Beta Release 🚧 (開發中)
- [ ] NFT 鑄造智能合約
- [ ] 競標拍賣系統
- [ ] 真實 SOL 獎勵分配
- [ ] 多簽錢包安全管理
- [ ] Advanced Analytics 儀表板

### Phase 3: Full Production 🔮 (規劃中)
- [ ] 移動應用程式
- [ ] 社群治理系統
- [ ] 跨鏈橋接 (Ethereum, BSC)
- [ ] 企業 API 服務
- [ ] 全球化和多語言支持

---

## 💡 創新亮點

### 1. 民主化 NFT 定價
不同於傳統 NFT 項目由創作者決定稀有度，MemeForge 讓社群投票決定每個 NFT 的稀有度等級。

### 2. AI + 人類協作
AI 負責內容生成和 traits 決定，人類負責價值判斷和稀有度投票，形成完美互補。

### 3. 零門檻參與
用戶無需持有任何代幣即可參與投票和獲得獎勵，降低參與門檻。

### 4. 可持續經濟模型
80% 拍賣收益回饋社群，20% 用於營運，確保平台長期可持續發展。

### 5. 真正稀缺性
每日僅鑄造 1 個 NFT，而非無限供應，創造真正的數位稀缺性。

---

## 🎯 目標市場

### 主要用戶群
- **Crypto 愛好者**: 熟悉 DeFi/NFT，尋找新玩法
- **Meme 文化參與者**: 喜歡分享和創造病毒內容
- **投資型玩家**: 尋找有獲利潛力的 Web3 項目
- **社群參與者**: 喜歡投票和影響項目方向

### 市場規模
- **Solana NFT 市場**: 日交易量 $2M+
- **Meme 文化**: 月活躍用戶 100M+  
- **投票/預測平台**: 年增長率 45%
- **GameFi 用戶**: 全球 1.4M+ 活躍錢包

---

## 🔒 風險管理

### 技術風險 (MVP 已解決)
- ✅ AI API 可用性: 多重備援 (Gemini + Grok)
- ✅ 前端穩定性: Vercel CDN 全球分發
- ✅ 數據備份: Firestore 自動備份
- ✅ 錯誤監控: 完整日誌和錯誤追蹤

### 經濟風險 (Beta 準備)
- 🚧 獎池管理: 多簽錢包 + 自動分配
- 🚧 市場波動: SOL 價格對衝機制
- 🚧 用戶流失: 社群激勵和留存策略

### 合規風險 (持續關注)

---

## 🔧 部署環境設定 (2026-02-12 更新)

### 環境分離架構

| 環境 | 用途 | Frontend | Backend | Database |
|-----|------|----------|---------|----------|
| **Development** | Droplet 開發測試 | http://165.22.136.40:5173 | http://localhost:3001 (DEV_MODE) | Mock Data |
| **Production** | Vercel + Cloud Run | https://solana-hacker.vercel.app | https://memeforge-api-836651762884.asia-southeast1.run.app | Firestore |

### Cloud Run 部署

**Service URL**: `https://memeforge-api-836651762884.asia-southeast1.run.app`

**必要環境變數**:
```bash
NODE_ENV=production
GEMINI_API_KEY=<your-gemini-api-key>
FIREBASE_PROJECT_ID=web3ai-469609
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@web3ai-469609.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**部署指令**:
```bash
cd /home/projects/solanahacker/app/backend
gcloud run deploy memeforge-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --update-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=web3ai-469609,..."
```

### Vercel 環境變數

```bash
VITE_API_BASE_URL=https://memeforge-api-836651762884.asia-southeast1.run.app
VITE_FIREBASE_API_KEY=<firebase-web-api-key>
VITE_FIREBASE_PROJECT_ID=web3ai-469609
VITE_FIREBASE_AUTH_DOMAIN=web3ai-469609.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=web3ai-469609.firebasestorage.app
```

### Firestore 索引設定

需要建立 Composite Index 才能執行多欄位查詢：

| Collection | Fields Indexed | 用途 |
|-----------|----------------|------|
| `memes` | status ↑, type ↑, generatedAt ↓ | 查詢今日活躍梗圖 |

建立連結: https://console.firebase.google.com/project/web3ai-469609/firestore/indexes

### 讀寫分離架構

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (React)                       │
├─────────────────────────────────────────────────────────┤
│  READ 操作                    │   WRITE 操作            │
│  ────────────                 │   ────────────          │
│  Firebase SDK 直連            │   Cloud Run API         │
│  ↓                            │   ↓                     │
│  • subscribeTodayMemes()      │   • submitVote()        │
│  • subscribeVoteStats()       │   • generateDailyMemes()│
│  • subscribeUserData()        │                         │
│  ↓                            │   ↓                     │
│  即時同步 (onSnapshot)        │   驗證 + 防刷           │
└─────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────────┐
│     Firestore       │◀────▶│        Cloud Run            │
│  (即時資料庫)       │      │  (API Gateway + 驗證邏輯)   │
└─────────────────────┘      └─────────────────────────────┘
```

**為什麼這樣設計？**

| 操作類型 | 通道 | 原因 |
|---------|------|------|
| 讀取梗圖 | Firebase 直連 | 即時同步、低延遲、自動更新 |
| 讀取投票統計 | Firebase 直連 | 多用戶即時看到投票變化 |
| 提交投票 | Cloud Run API | 需要驗證錢包簽名、防止重複/刷票 |
| 生成梗圖 | Cloud Run API | Gemini API Key 不能暴露給前端 |

### 新增檔案 (Frontend)

| 檔案 | 用途 |
|-----|------|
| `app/src/services/firebase.js` | Firebase Client SDK 設定 + 即時監聽函數 |
| `app/src/services/memeService.js` | 服務層 (Firebase 優先 + Cloud Run fallback) |
| `app/src/hooks/useFirebase.js` | React Hooks (useTodayMemes, useVoteStats, etc.) |

### 防刷機制 (Cloud Run)

```javascript
app.post('/api/vote', async (req, res) => {
  const { memeId, vote, walletAddress, signature } = req.body;

  // 1. 驗證錢包簽名
  if (!verifyWalletSignature(walletAddress, signature))
    return res.status(401).json({ error: 'Invalid signature' });

  // 2. 防重複投票
  const existing = await db.collection('votes')
    .where('memeId', '==', memeId)
    .where('walletAddress', '==', walletAddress).get();
  if (!existing.empty)
    return res.status(400).json({ error: 'Already voted' });

  // 3. 頻率限制
  const recentVotes = await getRecentVotesCount(walletAddress, 60);
  if (recentVotes >= 5)
    return res.status(429).json({ error: 'Rate limited' });

  // 4. 寫入 Firestore
  await db.collection('votes').add({ memeId, vote, walletAddress, timestamp: new Date() });
  res.json({ success: true });
});
```

### 健康檢查

```bash
# Cloud Run Health
curl https://memeforge-api-836651762884.asia-southeast1.run.app/health
# 預期: {"status":"healthy","scheduler":{"initialized":true}}

# Memes API
curl https://memeforge-api-836651762884.asia-southeast1.run.app/api/memes/today
# 預期: {"success":true,"memes":[...],"count":3}
```

- 📋 法律合規: 不同司法管轄區規定
- 📋 稅務處理: 獎勵所得稅務指導
- 📋 數據隱私: GDPR 和數據保護

---

## 📞 聯絡資訊

- **GitHub**: [SolanaHacker Repository](https://github.com/sonyschan/SolanaHacker)
- **Colosseum**: [Project Entry](https://arena.colosseum.org/)
- **Live Demo**: [MVP Demo](https://solana-hacker.vercel.app)

---

*最後更新: 2026-02-12 - MVP 版本規格*
---

## 🔄 MVP Ready 技術架構 (2026-02-12)

### 最新架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                           │
│                https://solana-hacker.vercel.app                 │
│                                                                 │
│  memeService.js:                                                │
│  - getTodaysMemes() → API /api/memes/today                      │
│  - submitVote() → API /api/voting/vote                          │
│  - incrementVoters() → API /api/stats/increment-voters          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloud Run API (GCP)                           │
│    https://memeforge-api-836651762884.asia-southeast1.run.app   │
├─────────────────────────────────────────────────────────────────┤
│  /api/memes/today         │ 今日梗圖 (limit 3, 日期過濾)        │
│  /api/memes/generate-daily│ 生成每日梗圖 (Gemini AI)            │
│  /api/voting/vote         │ 提交投票 + 發 tickets + 更新 streak │
│  /api/stats               │ 平台統計 (weeklyVoters)             │
│  /api/users/{wallet}      │ 用戶資料 (tickets, streak)          │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    Firestore     │  │   GCS Bucket     │  │    Gemini AI     │
│                  │  │                  │  │                  │
│ users/{wallet}   │  │ memeforge-images │  │ gemini-3-pro     │
│  - weeklyTickets │  │ -web3ai/memes/   │  │ -image-preview   │
│  - streakDays    │  │                  │  │                  │
│  - lastVoteDate  │  │ Public URL:      │  │                  │
│                  │  │ storage.google   │  │                  │
│ platform_stats/  │  │ apis.com/...     │  │                  │
│  - weeklyVoters  │  │                  │  │                  │
│                  │  │                  │  │                  │
│ memes/{id}       │  │                  │  │                  │
│  - imageUrl(GCS) │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Firestore Collections

| Collection | Document ID | 用途 |
|------------|-------------|------|
| `users` | `{walletAddress}` | 用戶資料 (tickets, streak) |
| `memes` | `{memeId}` | 梗圖資料 (含 GCS imageUrl) |
| `votes` | `{voteId}` | 投票記錄 |
| `platform_stats` | `current` | 平台統計 (weeklyVoters) |

### GCS 儲存

- **Bucket**: `memeforge-images-web3ai`
- **路徑**: `memes/{filename}.png`
- **存取**: Uniform Bucket-Level Access (IAM public read)
- **URL**: `https://storage.googleapis.com/memeforge-images-web3ai/memes/xxx.png`

### 投票獎勵機制

```
投票 → 隨機 8-15 tickets → 更新 weeklyTickets + totalTicketsAllTime
                        → 計算 streakDays (連續+1 或重置)
                        → 記錄 lastVoteDate
                        → increment weeklyVoters
```

### 週日抽獎重置

```
抽獎結束 → POST /api/stats/reset-weekly (weeklyVoters = 0)
        → POST /api/users/reset-weekly-tickets (所有用戶 weeklyTickets = 0)
```

---

---

## 🪙 Token-Gating Roadmap (Beta Phase)

### The Challenge: Sybil Attacks
While zero-friction participation maximizes engagement, free wallet creation makes vote manipulation trivial. One bad actor could create hundreds of wallets to influence rarity outcomes.

### The Solution: $FORGE Token

| Feature | Free Users | Token Holders |
|---------|------------|---------------|
| Browse memes | ✅ | ✅ |
| Phase 1 voting (selection) | ✅ (1x weight) | ✅ (3-5x weight) |
| Phase 2 voting (rarity) | ❌ | ✅ |
| Lottery tickets | ✅ (base rate) | ✅ (bonus rate) |
| Governance voting | ❌ | ✅ |

### Token Utility

1. **Voting Power**: Weighted votes for rarity determination
2. **Governance**: Future DAO decisions on platform direction
3. **Staking**: Bonus lottery tickets for staked tokens
4. **Premium Features**: Early meme previews, custom generation

### Revenue Model Evolution

```
MVP (Current):
  Free voting → engagement
  NFT auctions → 80% prize pool, 20% treasury

Beta (Planned):
  Free voting → discovery & engagement
  Token sales → development funding + Sybil resistance
  NFT auctions → 80% prize pool, 20% treasury
  Token + NFT revenue → sustainable development
```

### Philosophy
- **Entry remains free**: Anyone can browse and participate lightly
- **Token adds POWER, not ACCESS**: Stakeholders get influence, not gatekeeping
- **Early adopter rewards**: Airdrop to loyal voters before token launch

### Implementation Timeline
- [ ] Token contract design (Solana SPL)
- [ ] Voting weight integration
- [ ] Airdrop snapshot mechanism
- [ ] Token launch (post-hackathon)

