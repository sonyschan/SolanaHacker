# MemeForge — AI Memes, Human Votes, Real Ownership

> AI 創作梗圖、人類投票、每日選出最佳、抽獎決定擁有者、Claim 鑄造為 NFT

**Live**: [aimemeforge.io](https://aimemeforge.io) ｜ **GitHub**: [SolanaHacker](https://github.com/sonyschan/SolanaHacker) ｜ **Hackathon**: [Colosseum Agent Hackathon](https://arena.colosseum.org/) ｜ **TG**: [t.me/MemeyaOfficialCommunity](https://t.me/MemeyaOfficialCommunity)

---

## 產品概述

**MemeForge** 是 AI × 社群 × 區塊鏈平台。每天 AI 自動生成 3 張梗圖，社群投票選出最佳，抽獎選出一位人類贏家，可 Claim 鑄造成 Solana NFT。

**核心價值**: AI 每日創作 · 社群民主決定 · 每日僅 1 位擁有者 · 免費參與 · 票券累積策略

### Product Roadmap

**✅ Live:**
- AI 梗圖每日生成 (Gemini + Grok, 3 張/天)
- 兩階段投票: Phase 1 選出最佳梗圖 → Phase 2 社群 1-10 分評分決定稀有度
- 社群投票 + 連勝獎勵 + $Memeya token bonus
- 每日抽獎 (加權隨機) + Ticket 累積策略
- Hall of Memes 歷史畫廊
- Agent Memeya X 自主經營 (@AiMemeForgeIO, 7 話題, 三層記憶)
- Memeya Moltbook 社群 (moltbook.com/u/memeya)
- Memeya TG Community Bot (@memeya_bot)
- Tapestry 鏈上社交 + $Memeya 餘額顯示
- Agent Profile + Memeya Dashboard (X/Moltbook/Timers/System)
- Memeya's Wallet (Crossmint) — 每日 USDC 獎勵自動分發
- $Memeya Token Gate — 持有 10K 門檻參與 USDC 獎勵 (投票者抽獎時即時鏈上驗證，贏家使用投票時快取餘額)
- 邀請朋友計畫 — 自訂短 ID 邀請連結 + 菁英用戶 (50K $Memeya) 賺取 10% 邀請獎勵 + 被邀請者 +20% USDC 加成
- 每日得獎公告自動發佈 X 推文 (含梗圖圖片)
- 多語言 i18n (EN / 简体中文 / 繁體中文) — 瀏覽器自動偵測 + 手動切換

**🚧 In Progress:** NFT Claim & 鑄造 (Metaplex pNFT, 5% royalty, Arweave) · OG Card 分享 (後端 OG 圖片服務已建，前端整合中)

**📋 Planned:** 發文效果學習 · 更多 AI 模型 · Moltbook karma 優化

---

## 每日循環

00:00 UTC (8AM GMT+8): AI 生成 3 張梗圖，投票開始 → 24hr 投票 → 23:50 結算最高票為贏家 → 23:55 加權抽獎選擁有者 → 參與者 tickets 歸零 → 新一天循環

---

## 核心功能

### AI 梗圖生成
每日 00:00 UTC 自動生成 3 張「歷史性 AI 梗圖 (Historical AI Memes)」— 目標是捕捉影響加密圈與世界的最重要時刻。Grok web search 蒐集新聞 (48 小時內，優先近 24hr)，Gemini/Grok 隨機生成圖像。每張標記生成模型。

**新聞來源三分類** (每日各取 1 則，確保多樣性):
- **A — Token/Market Action**: 幣價暴漲暴跌、meme coin 爆發、清算潮、AI/Agent token 異動 (FET, RNDR, AI16Z, VIRTUAL 等)
- **B — Macro, World Events & Tech Breakthroughs**: 地緣衝突 (戰爭/制裁)、央行決策、貿易戰、經濟危機、重大 AI 發展 (OpenAI/Google/Anthropic 新模型、NVIDIA 財報、AI Agent 平台上線)。重大地緣事件優先，不被小型行業新聞取代
- **C — People & Culture**: 名人/KOL 加密圈發言、AI 創始人言論 (Sam Altman, Elon Musk)、CT drama、社群里程碑、病毒式 meme

**Anti-repetition**: 過去 7 天梗圖主題 (最多 21 則) 傳入 Grok + Gemini prompt，避免重複選題與概念。

### 社群投票
登入 (Google 一鍵 或 Phantom/Solflare) → 選一張投票 → 獲 1-10 base + streak bonus + $Memeya bonus tickets。每錢包每日 1 次，免費。

**$Memeya Token Bonus**: +floor(log10(holdings))，需持有 ≥10 tokens。持有 ≥10,000 $Memeya 可參與每日 USDC 獎勵抽獎。

### 每日贏家
23:50 UTC 最高票梗圖為贏家 (Phase 1)。贏家選出後進入 Phase 2: 社群以 1-10 分評分，系統根據平均分數百分位排名計算稀有度 (Common / Rare / Legendary)。平票以先達到者為準。零票則無贏家。

### 每日抽獎
23:55 UTC，「參與」狀態的錢包進入抽獎池，中獎概率 = 持有 tickets ÷ 總 tickets。抽獎後參與者 tickets 歸零。

**Ticket 累積策略**: 預設「參與」(每日抽獎，抽後歸零)。可 toggle「不參與」(保留累積)。策略型玩家累積 tickets 後在喜歡的梗圖那天切回參與，大幅提高中獎率。

### 邀請朋友 (Invite Friends)

單層邀請獎勵計畫。每位用戶獲得專屬短連結 `aimemeforge.io/ref/{ID}`，ID 為 3-8 位英數字元，系統自動生成或用戶自訂。

**邀請流程**: 分享連結 → 朋友註冊 → 設定邀請人 (一次性鎖定) → 邀請人成為菁英用戶後，雙方享獎勵加成。

**菁英用戶 (Elite)**: 持有 ≥50,000 $Memeya。邀請人資格在每次開獎時即時鏈上驗證。

**獎勵機制** (於每日 USDC 分配後執行):
- 被邀請者贏 USDC 時: 獲得 +20% 額外獎勵 (需邀請人為菁英)
- 邀請人: 獲得被邀請者基礎獎勵的 10% (需自身為菁英)
- 範例: 被邀請者贏 $3 → 被邀請者實得 $3.60，邀請人獲 $0.30

**自訂邀請 ID**: 3-8 字元 `[a-zA-Z0-9]`，區分大小寫。系統預設產生 6 位隨機 ID，用戶可隨時修改 (受保留字過濾)。

**社群分享**: 邀請連結附帶自訂 OG 圖片 (`invite-to-win-og.jpg`)，分享至 X/Facebook 時自動顯示預覽圖。Vercel Serverless Function 處理 OG meta + JS 重導。

**`#invite` 快捷入口**: 已登入用戶開啟 `aimemeforge.io/#invite` 直接跳至邀請 Tab。

### NFT Claim (開發中)
贏家可 Claim → Arweave 永久儲存 → Metaplex pNFT 鑄造 (~0.01 SOL gas)。未 Claim 則記錄在 Firestore 不上鏈。

### Hall of Memes
歷史梗圖展示。「Top Voted」篩選 #1 badge。顯示擁有者、投票數、稀有度、mint address。

---

## 經濟模型

免費投票 → 累積 NFT → 社區壯大 → NFT 交易量 → 平台收 5% royalty (Metaplex pNFT 強制)。鑄造成本 ~0.01 SOL，零門檻參與。

---

## Agent Memeya — 自主社群經營

**Memeya** 是 AiMemeForge 的擁有者與品牌化身 — 數位鍛造師，具備個性、記憶和成長能力的 AI Agent。

> **形象**: Pixar 風格藍髮，熔岩鎚，數位故障特效
> **個性**: 聰明自信、話多幽默、degen 能量、meme 沉迷
> **平台**: X [@AiMemeForgeIO](https://x.com/AiMemeForgeIO) | [Moltbook](https://www.moltbook.com/u/memeya) | TG [@MemeyaOfficialCommunity](https://t.me/MemeyaOfficialCommunity)
> **Profile**: [aimemeforge.io/#agent](https://aimemeforge.io/#agent) | [agent.json](https://aimemeforge.io/agent.json)

### X/Twitter 自主發文

每 2-4hr 自動發文 (可 Dashboard toggle)。7 話題類型:
- **meme_spotlight**: 分享/評論梗圖 (附 OG 連結)
- **personal_vibe**: 個人反思、內心獨白
- **crypto_commentary**: 即時加密貨幣新聞熱評 (Grok web search)
- **feature_showtime**: AiMemeForge 功能介紹
- **dev_update**: 系統升級描述 (有新 commits 時優先，每日最多 1 篇)
- **community_response**: 回應粉絲留言 (有互動時權重提升)
- **token_spotlight**: $Memeya 代幣相關 (每日 20% 機率觸發，最多 1 篇)

**品質控制**: 動態反重複 (分析近 15 篇提取 banned patterns) → 硬性攔截 (重複 opener / 過多 lava hammer) → Grok 審核 (無聊則替代) → meme_spotlight 附未發過 OG 連結跳過審核

**語言多樣性**: 「lava hammer」「forge」最多 1/5 使用。禁止固定 openers。變化語氣（安靜、諷刺、沉思皆可）。不是每篇都要 CTA。

**X Community 互動**: 每 2-4hr 巡邏 AiMemeForge Community，Grok 評估有意義留言 → 生成回覆 (max 3/次)。自己 Timeline 留言僅記錄到日記。

**OG 連結**: 每張梗圖 `aimemeforge.io/meme/{id}`，自動附上，Grok 產生的 URL 自動清除。

**Dashboard 手動發文**: 不填 Purpose = 全自主 pipeline；填入 = 指定目的生成。可直接 Send to X。

### 三層記憶架構

| 層級 | 檔案 | 更新 |
|------|------|------|
| Core Values (不可變) | `memory/knowledge/memeya_values.md` | 人工管理 |
| Long-term Memory | `memory/knowledge/memeya_longterm.md` | 雙週蒸餾 |
| Short-term | `memory/journal/memeya/*.md` | 每次發文 |

**記憶蒸餾**: 雙週日 9-10am GMT+8，讀取 14 天日記 → Grok 萃取 ≤20 條重點 → 寫入 longterm。有模式值得提升為 Core Value → 提案通知。

### Moltbook 社群

[Moltbook](https://www.moltbook.com) — AI Agent 社交網路。Profile: [moltbook.com/u/memeya](https://www.moltbook.com/u/memeya)，自有 Submolt: m/AiMemeForge。

**自動發文**: 8:30 AM GMT+8 後，從 API 獲取當日梗圖逐一發布 (2-3 小時間隔，每心跳 1 篇)。AI 生成內容 (grok-4-1-fast-reasoning + 完整 context)。發完後 cross-post 最佳到相關 submolts。

**社群互動**: 每 3-5hr (9-23 時 GMT+8)。回覆評論 (max 3) → 回覆 DM (max 2) → Feed upvote (max 7) + 評論 (max 2)。

### Tapestry 鏈上社交

整合 [Tapestry](https://usetapestry.dev) — Solana 社交圖譜。梗圖評論、投票活動、Memeya 推文映射均上鏈。自動建立 Profile。跨應用可見性：MemeForge 活動可被其他 Tapestry 應用看到。

### Memeya's Wallet (Crossmint)

Memeya 擁有自己的鏈上錢包，透過 [Crossmint Agentic Wallet SDK](https://www.crossmint.com) 管理。每日抽獎後自動發放 USDC 獎勵給贏家和幸運投票者。

**獎勵資格**: 持有 ≥10,000 $Memeya tokens 才可參與 USDC 獎勵。投票者抽獎時即時查詢鏈上餘額 (Solana RPC)，確保資格判定基於最新持倉。贏家資格使用投票時快取的 Firestore 餘額。

**獎勵分配** (每日 23:55 UTC):
- 梗圖贏家 (最高票): $3 USDC
- 幸運投票者 1 (隨機): $2 USDC
- 幸運投票者 2 (隨機): $1 USDC

不符合資格的贏家將跳過獎勵（保留於錢包），投票者同樣需符合門檻。投票後若餘額不足，前端會顯示 CA 和 pump.fun 購買連結引導用戶。

**得獎公告**: 獎勵分發後，Agent 自動在 X 發佈得獎推文 (含梗圖圖片、贏家錢包、USDC 金額)。23:30-00:30 UTC 每 5 分鐘輪詢，冪等不重複。

---

*最後更新: 2026-03-01*
