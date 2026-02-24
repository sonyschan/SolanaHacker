# MemeForge — AI Memes, Human Votes, Real Ownership

> AI 創作梗圖、人類投票、每日選出最佳、抽獎決定擁有者、Claim 鑄造為 NFT

**Live**: [aimemeforge.io](https://solana-hacker.vercel.app) ｜ **GitHub**: [SolanaHacker](https://github.com/sonyschan/SolanaHacker) ｜ **Hackathon**: [Colosseum Agent Hackathon](https://arena.colosseum.org/) ｜ **TG Community**: [t.me/MemeyaOfficialCommunity](https://t.me/MemeyaOfficialCommunity)

---

## 產品概述

**MemeForge** 是一個 AI × 社群 × 區塊鏈 平台。每天由 AI 自動生成梗圖，社群投票選出每日最佳，再透過每日抽獎選出一位人類贏家。贏家可以選擇 Claim，將梗圖鑄造成 Solana NFT，真正擁有這張梗圖。

### 核心價值
- **AI 創作**: 每天 3 張全新 AI 梗圖，來源自加密貨幣新聞和趨勢
- **社群決定**: 由投票決定哪張梗圖最好，以及 NFT 稀有度
- **真正稀缺**: 每天只有 1 張梗圖成為贏家，1 位人類擁有它
- **免費參與**: 投票完全免費，Google 登入或連接錢包即可參與
- **策略深度**: 彩票累積機制讓玩家可以選擇何時出手

---

## 每日循環 (Daily Loop)

```
00:00 UTC ── AI 生成 3 張新梗圖，投票開始
   │
   │  ~24 小時投票期
   │  用戶連接錢包 → 投票選出最喜歡的梗圖 → 獲得 tickets
   │
23:50 UTC ── 投票結算
   │          ├─ 最高票梗圖 = 每日贏家
   │          └─ AI 決定 NFT traits (稀有度由投票決定)
   │
23:55 UTC ── 每日抽獎
   │          ├─ 所有「參與」的錢包進入抽獎池
   │          ├─ 根據 ticket 持有量加權隨機抽選
   │          ├─ 1 位贏家獲得該梗圖的擁有權
   │          └─ 參與者的 tickets 歸零
   │
00:00 UTC ── 新的一天開始，AI 生成新梗圖...
```

> 時間以 UTC 表示。8:00 AM 台北時間 = 00:00 UTC。

---

## 核心功能

### 1. AI 梗圖生成

每日 00:00 UTC，AI 自動生成 3 張梗圖：

- **內容來源**: Twitter/X 趨勢、CoinDesk 新聞、Reddit r/CryptoCurrency
- **AI 分析**: Grok API 分析新聞情緒和關鍵詞
- **圖像生成**: 目前使用 Gemini 3 Pro Image，未來支援多模型 (Grok, ChatGPT 等)
- **品質篩選**: 幽默度和病毒傳播潛力
- **模型標籤**: 每張梗圖標記生成模型 (如 "Gemini Model")，方便用戶識別來源

生成後梗圖立即上架投票。

### 2. 社群投票

**投票流程:**

1. 登入 (Google 一鍵登入 或 連接 Solana 錢包如 Phantom, Solflare)
2. 查看今日 3 張梗圖
3. 點擊投票選出你最喜歡的一張
4. 投票完成，獲得 1-10 + streak bonus + $Memeya token bonus 張彩票 (tickets)

**登入方式 (Privy):**
- **Google 登入**: 零門檻，系統自動建立 Privy embedded Solana wallet，用戶可從設定選單匯出私鑰
- **Phantom / Solflare**: 直接連接既有 Solana 錢包

**投票規則:**
- 每個錢包每天只能投一次
- 完全免費，不需 Gas Fee
- 投票期為 ~24 小時 (00:00 — 23:50 UTC)
- 投票結果即時更新，所有人可見

**連勝獎勵:** 連續每日投票可獲得額外 tickets。

### 3. 每日贏家選出

23:50 UTC 投票結算：

- 最高票梗圖成為**每日贏家**
- 稀有度由社群投票決定 (Common / Rare / Legendary)
- AI 自動分析圖片生成其他 NFT traits (最多 10 個)
- 贏家梗圖進入 Hall of Memes 永久展示

**平票處理**: 若多張梗圖票數相同，以先達到該票數的梗圖為贏家。
**零票處理**: 若無人投票，當日不產生贏家。

### 4. 每日抽獎 (Daily Lottery)

23:55 UTC 抽獎決定梗圖擁有者：

**抽獎機制:**
- 所有「參與」狀態的錢包自動進入抽獎池
- 每個錢包的中獎概率 = 該錢包 tickets ÷ 抽獎池總 tickets
- 加權隨機抽選 1 位贏家
- 贏家獲得當日贏家梗圖的擁有權
- **抽獎後，所有參與者的 tickets 歸零**

**Ticket 累積策略:**

每個錢包預設為「參與」抽獎。用戶可以 toggle 切換為「不參與」：

| 狀態 | 抽獎時行為 | Tickets |
|------|-----------|---------|
| 參與 (預設) | 進入抽獎池，抽完歸零 | 每次歸零重新累積 |
| 不參與 | 不進入抽獎池 | 持續累積，越來越多 |

**策略深度**: 這是有意為之的設計。用戶可以選擇：
- **每日參與**: 每天都有機會，但每次 tickets 較少
- **累積出手**: 連續不參與累積大量 tickets，等到自己特別喜歡的梗圖再 toggle 回「參與」，大幅提高該次中獎率

例如：連續 7 天投票但不參與抽獎，streak bonus 從 +1 增長到 +7，每天獲得更多 tickets。累積 ~56-119 tickets。第 8 天看到特別喜歡的梗圖，切換為「參與」，在抽獎池中擁有壓倒性優勢。

**邊界情況:**
- 無人參與 → 不抽獎，無擁有者
- 僅 1 人參與 → 該人自動獲得擁有權
- 贏家未 Claim → 梗圖仍有擁有者紀錄，但不上鏈

### 5. Claim & NFT 鑄造

抽獎贏家可以選擇 Claim，將梗圖鑄造為 Solana NFT：

**Claim 流程:**
1. 贏家在 Dashboard 看到 "Claim NFT" 按鈕
2. 點擊 Claim → 系統上傳圖片至 Arweave 永久儲存
3. 建構 Metaplex NFT metadata
4. 用戶簽名交易 + 支付 gas (~0.01 SOL)
5. NFT 出現在用戶錢包

**不 Claim 的情況:**
- 擁有權記錄在 Firestore，但不上鏈
- 梗圖仍標記為有擁有者，可在 Gallery 看到
- 未來可能開放補 Claim

**NFT Traits:**
- 稀有度 (社群投票決定)
- 藝術風格 (AI 分析)
- 投票數
- 生成日期
- AI 模型

### 6. Hall of Memes

所有歷史梗圖的永久展示廳：

- 按日期排列，最新在前
- 「Top Voted」篩選器可僅顯示每日最高票 (#1) 梗圖
- 最高票梗圖標記 **#1** badge（區別於 Winners tab 的抽獎人類贏家）
- 顯示擁有者錢包地址 (截斷)
- 顯示投票數和稀有度
- 已 Claim 的 NFT 顯示 mint address
- 可點擊查看大圖和完整 traits

---

## 使用者體驗路徑 (UX Flow)

### 路徑 A：新用戶首次進入

```
1. 打開 aimemeforge.io
   └─ 看到今日 3 張 AI 梗圖 + 投票統計

2. 登入
   ├─ Google 一鍵登入 (自動建立 embedded Solana wallet)
   └─ 或連接 Phantom / Solflare 錢包

3. 選擇最喜歡的梗圖投票
   └─ 即時看到投票更新

4. 投票完成
   └─ 獲得 1-10 base + streak bonus tickets
   └─ 看到抽獎狀態：「參與中」

5. 等待結果
   └─ 23:50 UTC 看到贏家梗圖
   └─ 23:55 UTC 看到抽獎結果

6. 若中獎
   └─ Dashboard 顯示 "Claim NFT"
   └─ 點擊 Claim → 簽名 → 獲得 NFT
```

### 路徑 B：策略型玩家

```
Day 1-6: 每日投票獲得 tickets
         └─ Toggle 為「不參與」抽獎
         └─ Tickets 持續累積

Day 7:   看到特別喜歡的梗圖
         └─ Toggle 回「參與」
         └─ 攜帶 ~70+ tickets 進入抽獎
         └─ 高概率中獎
```

### 路徑 C：社群分享

```
1. 在 Gallery 或投票頁看到有趣梗圖

2. 點擊 Share 按鈕
   ├─ Share to X (Twitter) → 帶有 OG Card 的推文
   └─ Copy Link → 複製分享連結

3. 朋友點擊連結
   └─ 看到帶有梗圖預覽的 OG Card
   └─ 進入網站查看梗圖
   └─ 連接錢包開始投票
```

**OG Card 分享**: 每張梗圖都有獨立的分享連結 (`aimemeforge.io/meme/{id}`)，分享到社群媒體時會顯示梗圖預覽圖、標題和投票統計的 OG Card。

---

## 經濟模型

### 商業模式

MemeForge 短期不追求收入，專注於社區建設。當 NFT 持有者數量和交易量達到規模後，透過二級市場手續費變現。

**成長飛輪:**
```
免費投票 → 累積梗圖/NFT → 持有越多越有動機宣傳 → 吸引新用戶 → 社區壯大
                                                                    │
平台收益 ← NFT 交易 royalty (5%) ← 二級市場交易量 ← NFT 市場價值 ←──┘
```

**用戶誘因:** 免費「擼」AI 梗圖，鑄造成 NFT。持有越多，未來潛在價值越高，越有動力幫生態宣傳。

**平台收入:** NFT 二級市場交易 5% royalty（透過 Metaplex pNFT 強制執行）。

### Ticket 經濟

| 行為 | Tickets 獲得 |
|------|-------------|
| 投票 (base) | 1-10 (隨機) |
| Streak Bonus | +min(streakDays, 10) |
| $Memeya Token Bonus | +floor(log10(holdings))，持有 ≥10 tokens 才生效 |
| 抽獎後 (參與者) | 歸零 |
| 不參與抽獎 | 保留並累積 |

### 價值鏈

```
AI 創作 (免費內容，每日 3 張)
    ↓
社群投票 (免費參與，民主決定稀有度)
    ↓
每日稀缺性 (每天僅 1 個贏家 NFT)
    ↓
Claim 鑄造 (~0.01 SOL gas，pNFT 強制 5% royalty)
    ↓
NFT 二級市場交易 (Magic Eden 等)
    ↓
平台收取 5% royalty
```

- 用戶免費參與，無需持有任何代幣
- NFT 稀缺性來自「每日僅 1 個」的自然限制
- 使用 Metaplex Programmable NFT (pNFT) 強制執行 royalty，無法被跳過
- 鑄造成本極低 (~0.01 SOL)，降低參與門檻
- 社群投票決定稀有度，創造民主化定價機制

---

## Agent Memeya — 自主 X/Twitter 經營

### 角色定位

**Memeya** 是 AiMemeForge 的品牌化身 — 一位 13 歲的數位鍛造師。她不是一般的社群管理機器人，而是一個具備個性、記憶和成長能力的 AI Agent，自主經營 @AiMemeForgeIO 的 X (Twitter) 帳號。

> **視覺形象**: Pixar 風格藍髮少女，攜帶熔岩鎚，帶有數位故障特效
> **個性**: 聰明自信、話多幽默、degen 能量、沉迷 meme 文化
> **Agent Profile**: [aimemeforge.io/#agent](https://aimemeforge.io/#agent) | 機器可讀: [aimemeforge.io/agent.json](https://aimemeforge.io/agent.json)

### 自主發文系統

Memeya 每 2-4 小時自動發一篇推文（全天候，面向全球用戶），可透過 Dashboard toggle 即時啟停。話題基於加權隨機選擇，並有優先順序機制。重啟不會立即觸發發文（timer 初始為 `Date.now()`）。

**優先檢查**: 若有新 git commits 且當日尚未發過 `dev_update`，強制選擇 `dev_update`（每日最多 1 篇）。

| 話題 | 基礎權重 | 說明 |
|------|---------|------|
| meme_spotlight | 30% | 分享/評論今日或歷史梗圖（附 meme-specific OG 連結） |
| personal_vibe | 25% | 個人反思、內心獨白、情緒分享（不使用鍛造比喻） |
| crypto_commentary | 20% | 對即時加密貨幣新聞的熱評 (Grok web search 即時搜尋) |
| feature_showtime | 15% | 介紹 AiMemeForge 功能特色（載入 product.md 給 Grok 隨機挑選） |
| dev_update | 10% | 以 Memeya 角度描述系統升級（她是建造者，不是旁觀者） |
| community_response | 動態 | 回應粉絲留言 (有留言時才出現，有互動時權重提升至 35%) |

### X Community 互動

Memeya 在 AiMemeForge X Community 中自主巡邏和回覆有意義的留言（每 2-4 小時，獨立 timer）：

```
巡邏 X Community → 取得最新貼文和留言 (排除自己)
  → Grok 評估哪些留言有意義 (問題、洞見、熱情互動)
  → 生成 in-character 回覆 (最多 3 則/次)
  → 記錄到日記 (dedup: 不重複回覆同一留言)
```

**範圍區分:**
- **X Community** (`community/2025765989582004365`): 巡邏 + 回覆留言
- **自己的 Timeline** (`@AiMemeForgeIO`): 僅巡邏自己推文的留言 → 記錄到日記當學習素材，不直接回覆

### 品質控制 (三層防護)

每篇推文經過三層品質審核：

1. **動態反重複 (`extractBannedPatterns`)**: 分析最近 15 篇推文，提取過度使用的 openers 和片語，注入到 prompt 作為明確禁令
2. **硬性攔截 (Hard Reject)**: 不需 Grok 呼叫即攔截：
   - 以 "Yo degens" / "Degens," 開頭 → 自動拒絕
   - 含 "lava hammer" 但最近 3+ 篇已使用 → 自動拒絕
3. **Grok 品質審核 (grok-3-mini)**: 判定是否無聊/重複/太相似 → 若是則生成無聊 Memeya 小動作替代
4. **例外**: `meme_spotlight` 搭配未發過的獨特梗圖 OG 連結時，跳過審核（梗圖本身就是新內容）

### 語言多樣性

MEMEYA_PROMPT_BASE 內建 `VARIETY IS KING` 規則：
- 「lava hammer」和「forge」最多 1/5 推文使用，其餘推文不用鍛造比喻
- 禁止固定 openers（"Yo degens", "Degens,", "Just dropped", "Lava hammer"）
- 變化語氣：不是每篇都要 🔥🚀😈，可以安靜、怪異、諷刺或沉思
- 不是每篇都要結尾 call-to-action（"Who's in?", "Who's aping?"）

### OG 連結系統

- 每張梗圖有獨立的 OG 連結：`https://aimemeforge.io/meme/{memeId}`
- 生成推文時自動附上 OG 連結，X 會顯示豐富預覽卡片
- Grok 產生的 URL 會被自動清除，改以程式化方式附上正確的 canonical URL

### 手動發文 (Dashboard)

Dashboard 提供 **Generate Post** 功能：
- **自動模式**: 不填 Purpose → 跑完整自主 pipeline（context 收集 → 話題選擇 → 生成 → 品質審核）
- **手動模式**: 填入 Purpose → 跳過自動話題，Grok 根據指定目的生成內容，無字數限制（X Premium）
- **Send 按鈕**: 生成後可直接從 Dashboard 發送到 @AiMemeForgeIO

### 社群互動循環

Memeya 會自動讀取最近 3 篇推文的留言，分析粉絲情感和想法：

```
發文 → 粉絲留言 → 下次 context 收集時讀取留言
  → 分析互動情感 → 寫入日記
  → 若有 "eureka" 洞見 → 提升 community_response 權重
  → Memeya 回應社群對話 → 重複循環
```

### 三層記憶架構

Memeya 的記憶分為三層，分別影響她的個性、知識和即時反應：

| 層級 | 檔案 | 更新頻率 | 注入位置 |
|------|------|---------|---------|
| **Core Values** (不可變) | `memory/knowledge/memeya_values.md` | 人工管理 | System Prompt |
| **Long-term Memory** (長期記憶) | `memory/knowledge/memeya_longterm.md` | 雙週 (biweekly) | System Prompt |
| **Short-term** (短期記憶) | `memory/journal/memeya/*.md` | 每次發文/留言 | User Prompt |

**記憶蒸餾 (Memory Distillation)**:
- 每雙週日 9-10am GMT+8 自動執行 (`maybeDistillMemory`)
- 讀取過去 14 天日記 → Grok 萃取 ≤20 條長期學習重點 → 寫入 `memeya_longterm.md`
- 若有模式值得提升為 Core Value → 提案通知 (需人工審核)

**System Prompt 組裝** (`buildSystemPrompt`):
```
MEMEYA_PROMPT_BASE (人設 + VARIETY IS KING + 規則)
  + CORE VALUES (不可變價值觀)
  + LONG-TERM MEMORY (雙週蒸餾的學習重點)
```

---

## Tapestry 社交整合

MemeForge 整合 [Tapestry](https://usetapestry.dev) — Solana 上的統一社交圖譜協議，為梗圖添加鏈上社交功能。

### 功能

- **評論系統**: 用戶可在每張梗圖下留言互動，評論存儲在 Tapestry 鏈上社交圖譜
- **投票活動記錄**: 每次投票自動發佈到 Tapestry，建立可見的社群活動流
- **Memeya 內容映射**: Agent 發布的 X 推文同步映射到 Tapestry，實現跨平台社交可見性
- **自動檔案建立**: 用戶首次互動時自動建立 Tapestry Profile，無需額外操作

### 跨應用可見性

Tapestry 是共享社交圖譜 — MemeForge 上的評論和活動可被其他整合 Tapestry 的 Solana 應用看到，反之亦然。這擴大了 MemeForge 社群的可觸及範圍。

### 技術細節

- **API**: Tapestry REST API (`https://api.usetapestry.dev/v1/`)
- **認證**: API Key（服務端代理，用戶無需額外設定）
- **非阻塞**: 所有 Tapestry 操作為非阻塞 — 失敗不影響核心功能

---

## 功能狀態

| 功能 | 狀態 | 說明 |
|------|------|------|
| AI 梗圖生成 | ✅ 已上線 | Gemini + Grok，每日 3 張 |
| 登入系統 (Privy) | ✅ 已上線 | Google 登入 + Phantom/Solflare 錢包連接，embedded wallet + 私鑰匯出 |
| 投票系統 | ✅ 已上線 | 選擇投票 + tickets 獎勵 |
| 投票連勝 | ✅ 已上線 | 連續投票 streak 追蹤 |
| Hall of Memes | ✅ 已上線 | 歷史梗圖展示 (Top Voted 篩選 + #1 badge) |
| OG Card 分享 | ✅ 已上線 | Twitter/X 分享預覽卡 |
| 每日贏家選出 | ✅ 已上線 | Cloud Scheduler 自動化 |
| Agent Memeya 自主發文 | ✅ 已上線 | 5 種話題 + 三層品質審核 + OG 連結 + 三層記憶 + 語言多樣性 |
| Memeya X Community 互動 | ✅ 已上線 | 巡邏社群留言 + 有意義回覆 (max 3/次) + 日記 dedup |
| Memeya 記憶蒸餾 | ✅ 已上線 | 雙週日記蒸餾 → 長期記憶 + Core Value 提案 |
| Memeya Agent Profile | ✅ 已上線 | #agent 公開頁面 + agent.json 機器可讀 manifest |
| Memeya Dashboard | ✅ 已上線 | 即時監控 + Generate Post + Send to X + ON/OFF toggle |
| 每日抽獎 | ✅ 已上線 | 每日 23:55 UTC 加權隨機抽選擁有者 |
| Ticket 累積策略 | ✅ 已上線 | 參與/不參與 toggle |
| Tapestry 社交整合 | ✅ 已上線 | 評論系統 + 投票活動 + Memeya 映射 |
| NFT Claim & 鑄造 | 🚧 開發中 | Metaplex + Arweave |
| $Memeya Token Bonus | ✅ 已上線 | 持有 $Memeya 獲得額外 tickets (balance display + bonus 計算) |
| SPL Token 門檻 | 📋 規劃中 | 防 Sybil Attack |

---

## 目標市場

### 主要用戶
- **Crypto 社群**: 熟悉 Web3，每天逛 Twitter/Reddit 看梗圖
- **Meme 愛好者**: 喜歡分享病毒內容，樂於投票評價
- **策略型玩家**: 享受 ticket 累積和出手時機的博弈
- **NFT 收藏者**: 被「每日 1 個社群定價 NFT」的稀缺性吸引

### 核心吸引力
1. **零門檻**: Google 登入或連接錢包就能玩，不需花錢
2. **每日新內容**: AI 保證每天都有新梗圖，不會內容枯竭
3. **真實擁有權**: 不只是看看，中獎就真的擁有
4. **策略樂趣**: 什麼時候出手？要為哪張梗圖拼？

---

## 關鍵指標

| 指標 | 目標 | 說明 |
|------|------|------|
| 日活躍投票者 | 100+ | 每日參與投票的獨立錢包數 |
| 投票完成率 | >80% | 連接錢包的用戶中完成投票的比例 |
| 7 日留存 | >50% | 第 1 天投票後第 7 天仍投票 |
| Ticket 累積率 | >30% | 選擇「不參與」累積 tickets 的用戶比例 |
| Claim 率 | >60% | 中獎者選擇 Claim NFT 的比例 |

---

## 聯絡資訊

- **Live Demo**: [aimemeforge.io](https://solana-hacker.vercel.app)
- **GitHub**: [SolanaHacker](https://github.com/sonyschan/SolanaHacker)
- **Hackathon**: [Colosseum Agent Hackathon](https://arena.colosseum.org/)

---

*最後更新: 2026-02-23*
