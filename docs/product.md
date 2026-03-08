# MemeForge — Memes as a Service (MaaS)

> 迷因即服務：AI 創作、社群驗證品質、開發者與 AI 代理按需整合

**Live**: [aimemeforge.io](https://aimemeforge.io) ｜ **API**: [api.aimemeforge.io](https://api.aimemeforge.io) ｜ **GitHub**: [SolanaHacker](https://github.com/sonyschan/SolanaHacker) ｜ **Hackathon**: [Colosseum Agent Hackathon](https://arena.colosseum.org/) ｜ **TG**: [t.me/MemeyaOfficialCommunity](https://t.me/MemeyaOfficialCommunity)

> 技術實作細節見 [TDD.md](./TDD.md)

---

## 產品概述

**MemeForge** 是「迷因即服務」(Memes as a Service) 平台，提供兩大核心業務：

1. **AI 創作 + 社群驗證** — 每天 AI 自動生成 3 張梗圖，社群投票選出最佳，抽獎選出贏家，可 Claim 鑄造成 Solana NFT。用戶免費參與，投票賺取票券和 USDC。
2. **Meme API 服務** — 開發者和 AI 代理可透過按次付費的 x402 API 整合梗圖生成 ($0.10/張) 和品質評分 ($0.005/次)，支付以 USDC on Base 結算。

**核心價值**: AI 每日創作 · 社區共治驗證品質 · 按需 API 服務 · 免費參與生態 · x402 微支付商務

### Product Roadmap

**✅ Live:**
- AI 梗圖每日生成 (Gemini + Grok, 3 張/天, V3 混合模式)
- 兩階段投票: Phase 1 選出最佳梗圖 → Phase 2 社群 1-10 分評分決定稀有度
- 社群投票 + 連勝獎勵 + $Memeya token bonus
- 每日抽獎 (加權隨機) + Ticket 累積策略
- Hall of Memes 歷史畫廊 — 公開 #gallery 頁面，稀有度篩選 + 標籤搜尋
- x402 Meme API — 按次付費 USDC on Base + Solana (Rate $0.05 / Generate $0.10 / Catalog Free)
- 公開 API Lab (#lab) — API 定價展示 + 分頁 Quick Start 程式碼
- 自訂域名 api.aimemeforge.io (Cloud Run + managed SSL)
- Homepage 雙業務定位 — 投票生態 + API 服務兩欄式佈局，精選畫廊
- Agent Memeya X 自主經營 (@AiMemeForgeIO, 7 話題, 三層記憶)
- Memeya Moltbook 社群 (moltbook.com/u/memeya)
- Memeya TG Community Bot (@memeya_bot)
- Tapestry 鏈上社交 + $Memeya 餘額顯示
- Agent Profile + Memeya Dashboard (X/Moltbook/Timers/System)
- Memeya's Wallet (Crossmint) — 每日 USDC 獎勵自動分發
- $Memeya Token Gate — 持有 10K 門檻參與 USDC 獎勵
- 邀請朋友計畫 — 自訂短 ID 邀請連結 + 菁英用戶獎勵
- 每日得獎公告自動發佈 X 推文 (含梗圖圖片，Round N 格式)
- 多語言 i18n (EN / 简体中文 / 繁體中文) — 瀏覽器自動偵測 + 手動切換
- Wiki 頁面 — 新手指南、How-to、代幣經濟、Roadmap、FAQ (#wiki)
- USDC 獎勵專區 — My Wins 頁籤顯示歷史 USDC 獎勵紀錄
- X 推文同步至 EN + CN Telegram 群組
- Memeya Activity Ticker — 首頁即時 AI 工作狀態
- Solana 付費梗圖生成 (Create Tab) — SOL / $Memeya (8折) / USDC 三種支付，$0.10/張
- My Memes 畫廊 — 查看已購買梗圖、分享到 X、複製 OG 連結、刪除
- Ticket 分配透明度 — 每局抽獎顯示 ticket 持有分佈圓餅圖 (前 10 名 + 登入用戶排名)
- Tab 間 CTA 導航橫幅 — 統一設計引導用戶跨頁操作

**🚧 In Progress:** NFT Claim & 鑄造 (Metaplex pNFT, 5% royalty, Arweave) · Virtuals ACP Marketplace 上架準備 · Dexter Marketplace 上架

**📋 Planned:** 發文效果學習 · 更多 AI 模型 · Moltbook karma 優化 · x402 瀏覽器端錢包整合

---

## 每日循環

00:00 UTC (8AM GMT+8): AI 生成 3 張梗圖，投票開始 → 24hr 投票 → 23:50 結算最高票為贏家 → 23:55 加權抽獎選擁有者 → 參與者 tickets 歸零 → 新一天循環

---

## 核心功能

### AI 梗圖生成 (V3)
→ *TDD §5.5: Meme Generation Pipeline (V1 → V2 → V3)*

每日 00:00 UTC 自動生成 3 張梗圖。48 小時內新聞，Gemini/Grok 隨機生成圖像。每張標記生成模型。

**V3 = V1 視覺多樣性 + V2 文案紀律**

三代演進:
| 世代 | 期間 | 強項 | 弱項 |
|------|------|------|------|
| V1 | ~Mar 1 | 10 種藝術風格，自由構圖，NFT 級畫質 | 文案太冗長，笑話不精準 |
| V2 | Mar 2 | 15 種模板格式，策略+敘事層，≤6 字，品質評估 | 視覺單一 (全部 MS Paint 風) |
| V3 | Mar 3+ | V1 畫風 × V2 文案，兩種模式混合出圖 | — |

**每日 3 張 = 2× Mode A + 1× Mode B:**
- **Mode A (Template + Art Style)**: V2 模板管線 + V1 藝術風格渲染。同一個 "Drake" 模板可以是水墨畫風或賽博龐克風
- **Mode B (Art-first Original)**: 跳過模板，AI 自由構圖 + V2 文案規則。產出「Vitaliks Big Brain」級原創作品，但文案簡短有力

**10 種藝術風格**: Classic 2D · Retro Pixel · Cyberpunk Neon · Hyper-Realism · Abstract Glitch · Classic Oil · 3D Clay · Ink Wash Zen · Street Graffiti · Modern Flat (每種 7 天內不重複)

**新聞來源三分類** (每日各取 1 則，確保多樣性):
- **A — Token/Market Action**: 幣價暴漲暴跌、meme coin 爆發、清算潮、AI/Agent token 異動
- **B — Macro, World Events & Tech Breakthroughs**: 地緣衝突、央行決策、貿易戰、經濟危機、重大 AI 發展。重大地緣事件優先
- **C — People & Culture**: 名人/KOL 加密圈發言、AI 創始人言論、CT drama、社群里程碑、病毒式 meme

**Anti-repetition**: 模板 14 天硬封鎖、原型 3/7 天冷卻、藝術風格 7 天不重複、策略+敘事輪轉。

### 社群投票
→ *TDD §7.4: 投票獎勵機制*

登入 (Google 一鍵 或 Phantom/Solflare) → 選一張投票 → 獲得 tickets (base + streak bonus + $Memeya token bonus)。每錢包每日 1 次，免費。

**$Memeya Token Bonus**: 持有越多 $Memeya 可獲得越多 bonus tickets。持有 ≥10,000 $Memeya 可參與每日 USDC 獎勵抽獎。

### 每日贏家
→ *TDD §6: Rarity System*

23:50 UTC 最高票梗圖為贏家 (Phase 1)。贏家選出後進入 Phase 2: 社群以 1-10 分評分，系統計算稀有度 (Common / Uncommon / Rare / Epic / Legendary)。平票以先達到者為準。零票則無贏家。

### 每日抽獎
→ *TDD §13: Phase 1 每日抽獎*

23:55 UTC，「參與」狀態的錢包進入抽獎池，中獎概率 = 持有 tickets ÷ 總 tickets。抽獎後參與者 tickets 歸零。

**Ticket 累積策略**: 預設「參與」(每日抽獎，抽後歸零)。可 toggle「不參與」(保留累積)。策略型玩家累積 tickets 後在喜歡的梗圖那天切回參與，大幅提高中獎率。

### 邀請朋友 (Invite Friends)
→ *TDD §11: Referral ID System*

單層邀請獎勵計畫。每位用戶獲得專屬短連結 `aimemeforge.io/ref/{ID}`，ID 為 3-8 位英數字元，系統自動生成或用戶自訂。

**邀請流程**: 分享連結 → 朋友註冊 → 設定邀請人 (一次性鎖定) → 邀請人成為菁英用戶後，雙方享獎勵加成。

**菁英用戶 (Elite)**: 持有 ≥50,000 $Memeya。邀請人資格在每次開獎時即時鏈上驗證。

**獎勵機制** (於每日 USDC 分配後執行):
- 被邀請者贏 USDC 時: 獲得 +20% 額外獎勵 (需邀請人為菁英)
- 邀請人: 獲得被邀請者基礎獎勵的 10% (需自身為菁英)
- 範例: 被邀請者贏 $3 → 被邀請者實得 $3.60，邀請人獲 $0.30

**自訂邀請 ID**: 3-8 字元，區分大小寫，用戶可隨時修改。

**社群分享**: 邀請連結附帶 OG 預覽圖，分享至 X/Facebook 時自動顯示。

**`#invite` 快捷入口**: 已登入用戶開啟 `aimemeforge.io/#invite` 直接跳至邀請 Tab。

### Meme Forge (Create Tab)

付費梗圖生成服務。用戶輸入主題 → 選擇支付方式 → AI 生成專屬梗圖 → 存入 My Memes。

**支付選項**:
| 支付方式 | 價格 | 說明 |
|---------|------|------|
| SOL | ~$0.10 (即時市價) | Solana 原生代幣 |
| $Memeya | ~$0.08 (8折優惠) | 平台代幣，鼓勵持有 |
| USDC | $0.10 | 穩定幣，固定價格 |

**限制**: 每錢包每小時 3 次生成。

**My Memes 畫廊**: 查看所有已購買梗圖，支援分享到 X、複製 OG 連結、刪除。擁有權透過 `solana_orders` collection 驗證。

### NFT Claim (開發中)
→ *TDD §13: Phase 2 NFT Claim & 鑄造*

贏家可 Claim → Arweave 永久儲存 → Metaplex pNFT 鑄造 (~0.01 SOL gas)。未 Claim 則記錄不上鏈。

### Hall of Memes
歷史梗圖展示。「Top Voted」篩選 #1 badge。顯示擁有者、投票數、稀有度、mint address。

---

## 經濟模型

免費投票 → 累積 NFT → 社區壯大 → NFT 交易量 → 平台收 5% royalty (Metaplex pNFT 強制)。鑄造成本 ~0.01 SOL，零門檻參與。

---

## Agent Memeya — 自主社群經營
→ *TDD §9: Agent Memeya*

**Memeya** 是 AiMemeForge 的擁有者與品牌化身 — 數位鍛造師，具備個性、記憶和成長能力的 AI Agent。

> **形象**: Pixar 風格藍髮，熔岩鎚，數位故障特效
> **個性**: 聰明自信、話多幽默、degen 能量、meme 沉迷
> **平台**: X [@AiMemeForgeIO](https://x.com/AiMemeForgeIO) | [Moltbook](https://www.moltbook.com/u/memeya) | TG [@MemeyaOfficialCommunity](https://t.me/MemeyaOfficialCommunity)
> **Profile**: [aimemeforge.io/#agent](https://aimemeforge.io/#agent) | [agent.json](https://aimemeforge.io/agent.json)

### X/Twitter 自主發文
→ *TDD §9.1-9.5: X/Twitter 架構、話題、品質控制*

每 2-4hr 自動發文 (可 Dashboard toggle)。7 話題類型:
- **meme_spotlight**: 分享/評論梗圖 (附投票 CTA)
- **personal_vibe**: 個人反思、內心獨白
- **crypto_commentary**: 即時加密貨幣新聞熱評
- **feature_showtime**: AiMemeForge 功能介紹
- **dev_update**: 系統升級描述 (有新 commits 時優先，每日最多 1 篇)
- **community_response**: 回應粉絲留言 (有互動時權重提升)
- **token_spotlight**: $Memeya 代幣相關 (每日最多 1 篇)

**品質控制**: 三層反重複系統 — 動態 pattern 攔截 → Grok 審核 → 語言多樣性規則。

**Dashboard 手動發文**: 可指定目的生成或全自主 pipeline。支援 System Upgrade 標記。

### 三層記憶架構
→ *TDD §9.2: Context 與記憶架構*

| 層級 | 更新 |
|------|------|
| Core Values (不可變) | 人工管理 |
| Long-term Memory | 雙週蒸餾 |
| Short-term (日記) | 每次發文 |

**記憶蒸餾**: 雙週自動分析日記，萃取重點寫入長期記憶。

### Moltbook 社群
→ *TDD §9.6 + 14: Moltbook 相關*

[Moltbook](https://www.moltbook.com) — AI Agent 社交網路。Profile: [moltbook.com/u/memeya](https://www.moltbook.com/u/memeya)，自有 Submolt: m/AiMemeForge。

**自動發文**: 每日 1 篇梗圖貼文 (含去重機制)。AI 生成內容，避免重複用語。

**社群互動**: 定期回覆評論、DM、Feed 互動。

### Tapestry 鏈上社交
→ *TDD §10: Tapestry 社交整合*

整合 [Tapestry](https://usetapestry.dev) — Solana 社交圖譜。梗圖評論、投票活動、Memeya 推文映射均上鏈。跨應用可見性。

### Memeya's Wallet (Crossmint)
→ *TDD §12: Crossmint 錢包與獎勵分發*

Memeya 擁有自己的鏈上錢包，每日抽獎後自動發放 USDC 獎勵給贏家和幸運投票者。

**獎勵資格**: 持有 ≥10,000 $Memeya tokens 才可參與 USDC 獎勵。投票者抽獎時即時鏈上驗證，贏家使用投票時快取餘額。

**獎勵分配** (每日 23:55 UTC):
- 梗圖贏家 (最高票): $3 USDC
- 幸運投票者 1 (隨機): $2 USDC
- 幸運投票者 2 (隨機): $1 USDC

不符合資格者跳過獎勵。投票後若餘額不足，前端引導用戶購買 $Memeya。

**得獎公告**: Agent 自動在 X 發佈得獎推文 (含梗圖圖片)，格式為「AiMemeForge Round N Winners!」。推文同步發至 EN + CN Telegram 群組。
→ *TDD §12.7: X 得獎公告*

---

## x402 Meme API (MaaS)

開發者和 AI 代理可透過 HTTP API + x402 微支付協議按需使用迷因服務。

**Base URL**: `https://api.aimemeforge.io`

**端點與定價**:

| 端點 | 方法 | 價格 | 說明 |
|------|------|------|------|
| `/api/memes/rate` | POST | $0.05 USDC | AI 品質評分，回傳 score/grade/pass/suggestions |
| `/api/memes/generate-custom` | POST | $0.10 USDC | 自訂主題梗圖生成，可指定 template/strategy/narrative/artStyle |
| `/api/catalog/templates` | GET | Free | 可用模板列表 |
| `/api/catalog/strategies` | GET | Free | 可用策略列表 |
| `/api/catalog/narratives` | GET | Free | 可用敘事列表 |
| `/api/catalog/art-styles` | GET | Free | 可用藝術風格列表 |

**支付協議**: x402 (HTTP 402 Payment Required) · USDC on Base + Solana · Dexter facilitator (primary) + CDP fallback

**支援鏈**:
| Chain | Network (CAIP-2) | 收款錢包 | Facilitator |
|-------|-----------------|---------|-------------|
| Base | `eip155:8453` | `0xba646262871d295DeAe3062dF5bbe31fcc5841b8` | Dexter + CDP |
| Solana | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | `HFunb7hi2rMa14MkWSESABQWNJECKhQwvcUJZF4ZCdjS` | Dexter only |

**客戶端整合**: `npm install @x402/fetch @x402/evm @x402/svm viem` — 使用 `wrapFetchWithPayment` 自動處理 402 challenge → 簽名 → 付款 → 取得結果。支援 EVM (Base) 和 SVM (Solana) 付款。

**Dexter Marketplace**: [dexter.cash](https://dexter.cash) — EIP-8004 on-chain identity registered, gas-sponsored Solana payments

---

*最後更新: 2026-03-07*
