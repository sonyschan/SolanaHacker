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