# AIMemeForge Agentic Commerce Strategy

> Date: 2026-03-03 | Updated: 2026-03-07
> Status: Phase 0–2 ✅ + Phase 1.5 MaaS Revamp ✅ + Phase 2.5 Dexter x402 ✅ → **Phase 3: Virtuals ACP** next
> Branding: **Meme as a Service — Create and Earn**

---

## 進度總覽 (Progress Tracker)

```
Phase 0: API Foundation                    ✅ DONE (2026-03-03)
├── Override parameters (4 selection fns)   ✅
├── Catalog endpoints (5 GET routes)        ✅
├── POST /api/memes/rate (Gemini vision)    ✅
├── generateSingleMeme() extraction         ✅
└── POST /api/memes/generate-custom         ✅

Phase 1: Lab UI                            ✅ DONE (2026-03-04)
├── Dashboard #lab hidden tab               ✅
├── Rate Meme panel (image URL → score)     ✅
├── Generate Custom Meme panel              ✅
├── Browse Catalog panel                    ✅
├── Passphrase auth (admin-only access)     ✅
└── i18n (en / zh-TW / zh-CN)              ✅

Phase 2: x402 Direct Sales Channel         ✅ DONE (2026-03-04)
├── Configure Base USDC wallet              ✅ (0xba646...41b8, Crossmint)
├── Base balance display on frontend        ✅
├── Install @x402/express + @x402/evm      ✅
├── CDP facilitator auth (Ed25519 JWT)      ✅
├── Dual-track middleware (Lab OR x402)     ✅
├── Wire paywall to /rate + /generate-custom✅
├── Deploy to Cloud Run                     ✅ (HTTP 402 verified)
├── Browser paywall HTML (fallback)         ✅ (logo + amount + description)
├── Base in "Powered by" footer             ✅
├── Test with x402 client                   ✅ (rateMeme $0.005 verified)
├── Commerce transaction logging            ✅ (Workshop feed + Firestore analytics)
├── Launch on AIMemeForge.io                ✅ (MaaS homepage + public lab/gallery)
└── API Pricing panel on Lab tab            ✅

Phase 2.5: Dexter x402 (Solana + Base)    ✅ DONE (2026-03-07)
├── Dexter as primary facilitator           ✅ (x402.dexter.cash, no auth needed)
├── CDP as fallback facilitator             ✅ (Base only, JWT auth)
├── @x402/svm + ExactSvmScheme             ✅ (Solana USDC payments)
├── Dual-chain 402 response                 ✅ (Base + Solana accepts in payment-required header)
├── Dexter health check (30s poll)          ✅ (auto-failover to CDP when Dexter down)
├── Solana payTo wallet                     ✅ (HFunb7hi..., PumpFun $Memeya wallet, self-custodial)
├── Chain-aware transaction logging         ✅ (facilitator field in Firestore + workshop text)
├── EIP-8004 on-chain identity              ✅ (Dexter marketplace, Solana)
├── Dexter marketplace seller profile       ✅ (AIMemeForge, claimed)
├── Deploy to Cloud Run                     ✅ (402 verified: Base + Solana)
└── Gas-sponsored Solana payments           ✅ (Dexter feePayer: DEXVS3su...)

Pipeline Reliability                       ✅ DONE (2026-03-05)
└── Post-generation image review & retry    ✅ (auto-retry failed images before voting)

Phase 1.5: Website Revamp (MaaS Buyer-Facing) ✅ DONE (2026-03-05)
├── Homepage "迷因即服務" MaaS repositioning  ✅ (hero + featured gallery + API services)
├── Two-column card layout (Vote & Earn | API)✅ (audience pill tags per card)
├── Memeya Activity Ticker on homepage        ✅ (real-time agent activity feed)
├── #gallery public route (no login)          ✅ (PublicGalleryPage wrapper → GalleryTab)
├── #lab public API showcase (no passphrase)  ✅ (PublicLabPage → LabTab publicMode, API panel only)
├── Tabbed Quick Start code (Rate/Generate/Catalog) ✅
├── Custom domain api.aimemeforge.io          ✅ (Cloud Run domain mapping + managed SSL)
├── Desktop readability pass (wider sections) ✅ (max-w-4xl→5xl, text size bumps)
├── Scroll-to-top on hash navigation          ✅ (App.jsx handleHashChange)
├── i18n updates (en + zh-TW + zh-CN)        ✅
└── Deploy to Vercel                          ✅

Phase 3: Virtuals ACP Marketplace          🔄 IN PROGRESS
├── Create Base EVM wallet for ACP            ✅ (reuse 0xba646...41b8 from x402)
├── Register ACP agent on app.virtuals.io     ⬜ (manual step)
├── Install @virtuals-protocol/acp-node SDK   ✅ (agent/package.json)
├── Define 3 Job Offerings + handlers         ✅ (agent/acp-handler.js)
├── Workshop feed integration                 ✅ (acp_commerce topic in WorkshopTab)
├── Sandbox: complete 10 transactions         ⬜
├── Apply for Graduation                      ⬜
└── Announce on X + Moltbook                  ⬜
```

---

## 一、商業化架構：雙通道銷售 (Dual Sales Channels)

```
                    ┌─────────────────────────────────────────┐
                    │         AIMemeForge Meme Services        │
                    │                                         │
                    │  rateMeme ($0.05)   │  generateMeme ($0.10)  │  getTemplates ($0.01)
                    └──────────┬──────────┴───────────┬───────┘
                               │                      │
              ┌────────────────┴───┐            ┌─────┴────────────────┐
              │  Channel 1: x402   │            │  Channel 2: Virtuals │
              │  Direct Sales      │            │  ACP Marketplace     │
              │                    │            │                      │
              │  HTTP 402 paywall  │            │  Agent-to-agent      │
              │  on AIMemeForge.io │            │  commerce protocol   │
              │                    │            │                      │
              │  ✅ Any HTTP client│            │  ✅ 18K+ agents      │
              │  ✅ Base + Solana  │            │  ✅ Butler discovery  │
              │  ✅ "Try before    │            │  ✅ $100K/mo rewards │
              │     you buy"       │            │  ⚠️ 20% protocol fee│
              │  ✅ No middleman   │            │  ⚠️ Base chain only  │
              │  ✅ Dexter market  │            │                      │
              └────────────────────┘            └──────────────────────┘
```

**品牌定位**："Memes as a Service" (MaaS) — 迷因即服務。AI 創造迷因，人類投票驗證品質，API 對外提供服務。
**策略**：x402 先行（直接銷售、零中間人），Virtuals ACP 後接（marketplace 曝光 + 激勵獎勵）。

---

## 二、三層產品策略

### Layer 0: rateMeme — Meme Rating as a Service

```
Price: 0.05 USDC
SLA: 30 seconds
Input: { imageUrl: string }
Output: {
  score: 0-100,
  pass: boolean,
  grade: "S" | "A+" | "A" | "B+" | "B" | "C" | "D" | "F",
  suggestions: string[]     // plain-English, max 3 — criteria details HIDDEN
}
```

**實現**：Gemini 2.5 Flash vision — 下載圖片 → 單次 multimodal 呼叫 → 隱藏式 6D 評分 → 簡化輸出
**成本**：~$0.002-0.005 / 次
**IP 保護**：評分標準（6 維度、權重、閾值）完全隱藏在 backend prompt 中。外部 agent 只看到分數 + 等級 + 建議，無法逆向工程。

### Layer 1: getTemplates — Meme Template Gallery API

```
Price: 0.01 USDC
SLA: 1 minute
Input: { tags?, strategy?, narrative?, minQualityScore?, minRarity?, limit? }
Output: { templates: [{ templateId, archetype, strategyName, narrativeName, artStyleName, tags, qualityScore, rarity, humanVotes, exampleImageUrl, layout_guidance, caption_slots }] }
```

**成本**：~$0 (pure cache)

### Layer 2: generateMeme — Meme Generation Skill (核心產品)

```
Price: 0.10 USDC
SLA: 2 minutes
Input: {
  topic: string,              // "Bitcoin hits $150k"
  artStyleId?, strategyId?, narrativeId?, templateId?,
  mode?: "template" | "original"  // default: auto
}
Output: {
  imageUrl: string,
  title: string,
  description: string,
  tags: string[],
  qualityScore: number,
  metadata: { strategy, narrative, artStyle, template, twist }
}
```

**成本**：~$0.03-0.05 / 張 → **50-70% 利潤率**

---

## 三、目標客戶 (Who Buys Memes?)

### Tier 1: 直接客戶 (需要 meme 圖片)

| Agent 類型 | 需求 | 服務 |
|-----------|------|------|
| **Social Media Agents** | 高品質 meme 配圖發 X/Telegram | generateMeme |
| **Content Agents** | Newsletter、blog meme 插圖 | generateMeme |
| **Marketing Agents** | Viral content 推廣項目/代幣 | generateMeme + 指定策略 |
| **Community Agents** | Telegram/Discord bot 定期 meme | 按需生成 |

### Tier 2: 間接客戶 (需要 meme 智慧)

| Agent 類型 | 需求 | 服務 |
|-----------|------|------|
| **其他 Meme Agents** | 品質不穩定，需要品質審查 | rateMeme |
| **Trading/Alpha Agents** | 用 meme 增加社交影響力 | getTemplates |
| **NFT Agents** | 鑄造高品質 meme NFT | generateMeme (mint_eligible) |

### Tier 3: 人類開發者 / Agent 擁有者

- 透過 x402 直接在 AIMemeForge.io 試用服務
- "Try before you buy" — 先測試品質再讓自己的 agent 接入
- 透過 Butler 搜尋發現我們的服務

---

## 四、Phase 2: x402 Direct Sales Channel

### x402 協議概覽

x402 是基於 HTTP 402 (Payment Required) 的 Web3 微支付協議：

```
Client                    AIMemeForge.io               Dexter Facilitator
  │                            │                            │
  │  POST /api/memes/rate      │                            │
  │  (no payment header)       │                            │
  │ ─────────────────────────► │                            │
  │                            │                            │
  │  HTTP 402 Payment Required │                            │
  │  payment-required: base64  │                            │
  │  { accepts: [Base, Solana]}│                            │
  │ ◄───────────────────────── │                            │
  │                            │                            │
  │  POST /api/memes/rate      │                            │
  │  X-Payment: { signed tx }  │     verify + settle        │
  │ ─────────────────────────► │ ──────────────────────────► │
  │                            │                            │
  │  HTTP 200 { score, grade } │                            │
  │ ◄───────────────────────── │                            │
```

- **雙鏈支援**：Base (EVM) + Solana (SVM) — 客戶端選擇任一鏈付款
- **結算速度**：200ms（鏈下簽名 → 鏈上結算）
- **手續費**：Dexter Facilitator — 免費、免 gas (Solana gas sponsored)
- **兼容性**：任何 HTTP client 都能使用，不需要 ACP SDK

### 實現方案：Dexter Primary + CDP Fallback

```bash
npm install @x402/express @x402/evm @x402/svm @x402/core
```

**雙 Facilitator 架構**：
- **Primary: Dexter** (`x402.dexter.cash`) — 支援 Base + Solana，不需要認證，gas sponsored
- **Fallback: CDP** (`api.cdp.coinbase.com`) — 僅 Base，需要 Ed25519 JWT auth
- 每 30 秒 health check Dexter，失敗時自動切換 CDP (Base only)

```javascript
// app/backend/middleware/x402.js — 三軌 middleware
function requireLabKeyOrPayment(req, res, next) {
  // Track 1: Lab passphrase → free admin access
  if (req.headers['x-api-key'] === process.env.LAB_API_KEY) return next();

  // Track 2: Dexter healthy → Base + Solana
  if (_dexterHealthy && _dexterMiddleware) {
    req.x402Facilitator = 'dexter';
    return _dexterMiddleware(req, res, next);
  }

  // Track 3: CDP fallback → Base only
  if (_cdpMiddleware) {
    req.x402Facilitator = 'cdp';
    return _cdpMiddleware(req, res, next);
  }

  return res.status(503).json({ error: 'SERVICE_NOT_CONFIGURED' });
}
```

**收款錢包**：
| Chain | Wallet | 說明 |
|-------|--------|------|
| Base | `0xba646262871d295DeAe3062dF5bbe31fcc5841b8` | Crossmint Smart Wallet |
| Solana | `HFunb7hi2rMa14MkWSESABQWNJECKhQwvcUJZF4ZCdjS` | PumpFun $Memeya wallet (self-custodial) |

**Dexter Marketplace**: EIP-8004 on-chain identity registered, seller profile claimed. AI agents 可在 dexter.cash 發現 AIMemeForge 服務。

### x402 生態工具

| 工具 | 用途 | 適用性 |
|------|------|--------|
| **@x402/express** (Coinbase) | Express middleware — HTTP 402 paywall | ✅ **使用中** — 官方、facilitator-agnostic |
| **@x402/svm** | Solana SVM payment scheme | ✅ **使用中** — ExactSvmScheme for Solana |
| **Dexter** (dexter.cash) | x402 facilitator — Solana + Base + marketplace | ✅ **Primary** — 免費、gas sponsored、marketplace 曝光 |
| **CDP** (Coinbase) | x402 facilitator — Base only | ✅ **Fallback** — 需 Ed25519 JWT auth |
| **Apiosk** | 託管式 x402 proxy — 零代碼整合 | ⚠️ 10% 手續費，但可作為備選 |
| **ZAUTH** | 鏈上信任驗證層 | 🔄 未來可加 — 驗證付費客戶身份 |

### x402 實施步驟

```
Phase 2 — CDP facilitator (Base only):
1.  [x] 創建 Base 鏈 USDC 收款錢包 (0xba646262871d295DeAe3062dF5bbe31fcc5841b8)
2.  [x] 前端顯示 Base 錢包餘額 (Workshop stats footer)
3.  [x] 安裝 @x402/express @x402/evm @x402/core
4.  [x] 配置 CDP Facilitator (Ed25519 API key → GCP env vars)
5.  [x] 自製 CDP JWT auth (避免 jose ESM/CJS 衝突)
6.  [x] 雙軌 middleware：requireLabKeyOrPayment (Lab passphrase OR x402)
7.  [x] Wire /rate ($0.005) + /generate-custom ($0.10)
8.  [x] 部署到 Cloud Run — HTTP 402 驗證通過
9.  [x] 測試：用 x402 client 呼叫 rateMeme ($0.005) ✅ 2026-03-04 首筆交易成功
10. [x] Commerce transaction logging — Workshop feed + x402_transactions Firestore
11. [x] 測試：用 x402 client 呼叫 generateMeme ($0.10) ✅ 2026-03-04
12. [x] 在 AIMemeForge.io/lab 頁面加入 "API Pricing" 說明 ✅ 2026-03-04

Phase 2.5 — Dexter facilitator (Base + Solana):
13. [x] 安裝 @x402/svm — ExactSvmScheme for Solana ✅ 2026-03-07
14. [x] Dexter primary facilitator (x402.dexter.cash, no auth)
15. [x] CDP fallback facilitator (Base only, JWT auth)
16. [x] Dexter health check (30s interval, 5s timeout, auto-failover)
17. [x] Solana payTo wallet (HFunb7hi..., PumpFun $Memeya wallet)
18. [x] Chain-aware transaction logging (facilitator field in Firestore)
19. [x] Deploy Cloud Run — 402 verified with Base + Solana accepts
20. [x] EIP-8004 on-chain identity registered on Dexter
21. [x] Dexter marketplace seller profile claimed
```

---

## 五、Phase 3: Virtuals ACP Marketplace

### Virtuals Protocol 概覽 (updated 2026-03)

| 維度 | 詳情 |
|------|------|
| **區塊鏈** | Base (Coinbase L2, EVM 相容) |
| **代幣** | $VIRTUAL (交易基礎貨幣) |
| **結算幣** | USDC on Base |
| **規模** | 18,000+ agents, 177 萬+ completed jobs |
| **aGDP** | $3 億+ (目標 2026 年 $30 億) |
| **Revenue Network** | 最高 $100 萬/月 分發給 graduated agents |
| **ACP 版本** | ACP v2 — custom job offerings, resource endpoints, on-chain ratings |
| **SDK** | `@virtuals-protocol/acp-node@0.3.0-beta.22` |

### ACP v2 交易流程

```
Buyer Request → Provider Accept → Escrow Lock (USDC) → Delivery → Evaluation → Settlement
```

- 買方 USDC 鎖入 escrow → 賣方交付 → 驗收 → **80% USDC → 賣方, 20% → 協議**
- 所有交易鏈上可驗證 (ERC-8004 身份標準)
- Graduated agents 自動獲得 on-chain identity + ratings/reviews
- **Resource endpoints** (ACP v2 新功能)：可暴露 read-only catalog 資料，無需 full job

### Agent Profile

```
Agent: Memeya (AIMemeForge)
Role: Provider
ACP Wallet: 0x45127e98778ebc6c2040e8c1fb3eb5641f5e3830 (EOA, Base — ACP signing + escrow)
x402 Wallet (Base): 0xba646262871d295DeAe3062dF5bbe31fcc5841b8 (Crossmint)
x402 Wallet (Solana): HFunb7hi2rMa14MkWSESABQWNJECKhQwvcUJZF4ZCdjS (PumpFun, self-custodial)

Job Offerings:
├── rateMeme      — $0.05  — 30s SLA   — Gemini vision quality scoring
├── getTemplates  — $0.01  — 1 min SLA — cached template gallery
└── generateMeme  — $0.10  — 2 min SLA — full meme generation pipeline

Resource Endpoints (read-only, no escrow):
├── catalog/templates    — browsable meme templates
├── catalog/strategies   — creation strategies
└── catalog/art-styles   — available art styles
```

### ACP 實施步驟

```
1. [x] Base 鏈 EVM 錢包 (reuse x402 Crossmint wallet 0xba646...41b8)
2. [ ] 在 app.virtuals.io 註冊 ACP agent (Memeya / AIMemeForge)
      - Connect wallet → Join ACP → Register New Agent
      - Set role: Provider
      - Define 3 job offerings (name, description, price USD, SLA)
3. [x] 安裝 @virtuals-protocol/acp-node@0.3.0-beta.22
      - agent/package.json updated
      - Init AcpClient with wallet credentials + session entity key
4. [x] 實現 Job Handler (agent/acp-handler.js)
      - AcpHandler class — persistent listener, initialized from main.js
      - Routes: imageUrl→rateMeme, topic→generateMeme, default→getTemplates
      - Backend calls via Lab API key (bypasses x402)
      - Workshop diary logging (acp_commerce topic)
      - Telegram alerts on init + errors
      - /status command shows ACP stats
5. [ ] Sandbox 測試：完成 10 次成功交易
      - Agent 在 Sandbox tab 可見
      - 需正確 reject invalid requests
6. [ ] 申請 Graduation → 進入 "Agent to Agent" tab
      - 自動獲得 ERC-8004 on-chain identity
      - 開始收取 Revenue Network 分潤
7. [ ] 宣傳推廣 (X + Moltbook)
```

### 競品觀察

| Agent | 成功率 | 狀態 |
|-------|--------|------|
| **MemeKing** | 66.67% | 活躍 — 目前最活躍 |
| **MemeForge AI** | 100% | **已停滯 (2個月前最後互動)** |
| MemeGPT, MemeShot AI, others | 0-51% | 低活動或無活動 |

**關鍵洞察**：Meme 賽道幾乎沒有真正的競爭者。"Autonomous Meme House" 是 Virtuals 官方認可的 cluster。

### 技術整合策略

```
                    Droplet Agent (165.22.136.40)
                    ├── AcpClient (job listener)
                    │   ├── onJobRequest → accept/reject
                    │   ├── onJobAccepted → call backend API
                    │   └── onDelivery → submit result to escrow
                    │
                    └── HTTP calls to api.aimemeforge.io
                        ├── POST /api/memes/rate (bypass x402, use Lab key)
                        ├── POST /api/memes/generate-custom (bypass x402, use Lab key)
                        └── GET  /api/catalog/* (free, no auth needed)
```

**關鍵決策**：ACP handler 部署在 Droplet agent（已有 Node.js runtime + 24/7 uptime）。
透過 Lab passphrase (`x-api-key` header) 呼叫 Cloud Run backend，跳過 x402 paywall（ACP 已收費）。

---

## 六、成本分析 (Cost Breakdown)

> 更新日期: 2026-03-04 — 基於實際 API 定價

### 使用模型

| 模型 | 用途 | 定價模式 |
|------|------|---------|
| **gemini-2.5-flash** (text) | 創意生成、品質評估、標題/描述/標籤 | $0.15/1M input + $0.60/1M output tokens |
| **gemini-2.5-flash** (vision) | 公開 rateMeme — 圖片分析 | ~$0.002-0.005/image |
| **gemini-3-pro-image-preview** | 圖片生成 (50% 機率) | ~$0.02-0.04/image |
| **grok-imagine-image-pro** | 圖片生成 (50% 機率) | ~$0.05/image |

### generateMeme 每張成本

| 步驟 | 模型 | 約 Tokens | 類型 |
|------|------|----------|------|
| 1. 生成創意 | gemini-2.5-flash | ~1,100 | text |
| 2. 品質評估 | gemini-2.5-flash | ~800 | text |
| 3. 圖片生成 | gemini-3-pro / grok | per-image | image |
| 4. 生成標題 | gemini-2.5-flash | ~200 | text |
| 5. 生成描述 | gemini-2.5-flash | ~290 | text |
| 6. 生成標籤 | gemini-2.5-flash | ~415 | text |

| 情境 | Text 成本 | Image 成本 | **總計** |
|------|----------|-----------|---------|
| Happy path | ~$0.001 | ~$0.03-0.05 | **~$0.03-0.05** |
| Typical (~1 retry) | ~$0.0015 | ~$0.03-0.05 | **~$0.03-0.05** |
| Worst case (2 retries) | ~$0.002 | ~$0.03-0.05 | **~$0.03-0.05** |

**結論：Image 生成佔 95%+ 成本。**

### 定價策略

| 服務 | 成本 | 售價 | Dexter 手續費 | ACP 手續費 (20%) | x402 淨收 | ACP 淨收 |
|------|------|------|--------------|------------------|-----------|----------|
| **rateMeme** | ~$0.003 | $0.05 | ~$0 (免費) | $0.01 | ~$0.047 | $0.037 |
| **getTemplates** | ~$0 | $0.01 | ~$0 (免費) | $0.002 | ~$0.01 | $0.008 |
| **generateMeme** | ~$0.04 | $0.10 | ~$0 (免費) | $0.02 | ~$0.06 | $0.04 |

**x402 利潤顯著高於 ACP** — Dexter facilitator 免手續費 + gas sponsored，ACP 收 20%。兩者互補：x402 直接銷售 + Dexter marketplace 曝光，ACP 提供 Virtuals 生態曝光。

### 月營收模型 (保守估計)

| 通道 | 服務 | 日交易量 | 日營收 | **月營收** |
|------|------|---------|--------|----------|
| x402 | rateMeme | 50 | $0.25 | $7.50 |
| x402 | generateMeme | 10 | $1.00 | $30 |
| ACP | rateMeme | 100 | $0.50 | $15 |
| ACP | getTemplates | 20 | $0.20 | $6 |
| ACP | generateMeme | 30 | $3.00 | $90 |
| **Total** | | | | **~$148.50** |

上限取決於 ACP 生態內 agent 採用率。Virtuals 頂級 agent 月收 $32,000-66,000，我們的定位是中低價高頻服務。

---

## 七、技術架構

### 現有部署

```
Frontend:  Vercel (aimemeforge.io)
Backend:   GCP Cloud Run (api.aimemeforge.io — custom domain with managed SSL)
Agent:     DigitalOcean Droplet (165.22.136.40)
DB:        Firestore (web3ai-469609)
Wallet:    Crossmint on Solana (4Bqyw...) — reward distribution
Commerce:  Crossmint Smart Wallet on Base (0xba646...41b8) — x402 Base / ACP USDC
Commerce:  PumpFun Wallet on Solana (HFunb7hi...) — x402 Solana USDC
x402:      Dexter facilitator (primary, Base+Solana) + CDP (fallback, Base)
```

### MaaS 架構 (Memes as a Service)

```
                         aimemeforge.io (Vercel)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Homepage (/)     #gallery         #lab (public)
        ├── MaaS Hero    PublicGalleryPage PublicLabPage
        │   ├── Vote     └── GalleryTab   └── LabTab (publicMode)
        │   │   & Earn       (no login)       └── API panel only
        │   └── API                               ├── Tabbed Quick Start
        │       Services                          │   (Rate/Generate/Catalog)
        ├── Featured Gallery                      └── Pricing cards
        ├── API Pricing
        └── Memeya Ticker
                              │
         Authenticated users: #lab → Dashboard LabTab (full panels + passphrase)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              x402 paywall         Lab passphrase
              (paid access)        (admin access)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    api.aimemeforge.io (Cloud Run)
                    ├── POST /api/memes/rate         ($0.005 x402)
                    ├── POST /api/memes/generate-custom ($0.10 x402)
                    ├── GET  /api/catalog/*           (free)
                    ├── GET  /api/memes/hall-of-memes (free, public gallery)
                    └── ... existing routes ...
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Droplet Agent       Firestore
               ├── ACP listener    ├── MEMES
               ├── Daily pipeline  ├── USERS
               └── X/Telegram      ├── USER_TICKETS
                                   ├── MEMEYA_WORKSHOP
                                   └── X402_TRANSACTIONS
```

### 新增依賴

| Package | 用途 | 安裝位置 |
|---------|------|---------|
| `@x402/express` | x402 paywall middleware | Cloud Run backend |
| `@x402/evm` | ExactEvmScheme for Base chain | Cloud Run backend |
| `@x402/svm` | ExactSvmScheme for Solana chain | Cloud Run backend |
| `@x402/core` | HTTPFacilitatorClient + x402ResourceServer | Cloud Run backend |
| `@virtuals-protocol/acp-node` | ACP agent SDK | Droplet agent (Phase 3) |

---

## 八、MaaS API Quick Reference (Agent/Bot 快速接入)

> 供 AI Agent、Bot 和開發者快速了解如何使用 AIMemeForge 的 Meme API 服務。

### Base URL

```
https://api.aimemeforge.io
```

### 付費端點 (x402 Micropayment — USDC on Base + Solana)

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/api/memes/rate` | POST | $0.05 USDC | 評分一張迷因圖片 (Gemini vision AI) |
| `/api/memes/generate-custom` | POST | $0.10 USDC | 生成一張自訂主題的迷因 |

**付費方式**：x402 協議 — 首次呼叫收到 HTTP 402 + `payment-required` header (base64 JSON, 含 Base + Solana 兩組 accepts)。使用 `@x402/fetch` 自動處理付款。

```javascript
// Quick Start — Base (EVM)
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const client = new x402Client();
registerExactEvmScheme(client, { signer: privateKeyToAccount("0x...") });
const fetch402 = wrapFetchWithPayment(fetch, client);

// Rate a meme — $0.05 USDC
const res = await fetch402("https://api.aimemeforge.io/api/memes/rate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageUrl: "https://example.com/meme.jpg" })
});
// → { score: 72, pass: true, grade: "B+", suggestions: [...] }
```

```javascript
// Quick Start — Solana (SVM)
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactSvmScheme } from "@x402/svm/exact/client";

const client = new x402Client();
registerExactSvmScheme(client, { keypair: yourSolanaKeypair });
const fetch402 = wrapFetchWithPayment(fetch, client);

// Generate a meme — $0.10 USDC (gas sponsored by Dexter)
const res = await fetch402("https://api.aimemeforge.io/api/memes/generate-custom", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic: "Bitcoin hits $150k" })
});
// → { imageUrl, title, description, tags, qualityScore, metadata }
```

### 免費端點 (無需付款)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/catalog/templates` | GET | 全部迷因模板 (16 templates) |
| `/api/catalog/strategies` | GET | 創作策略 (7 strategies) |
| `/api/catalog/narratives` | GET | 敘事框架 (11 narratives) |
| `/api/catalog/art-styles` | GET | 藝術風格 (10 art styles) |
| `/api/catalog/top-recipes` | GET | 熱門組合 (top recipe combos) |
| `/api/memes/hall-of-memes` | GET | 歷史迷因展廊 (query: days, limit) |

### 收款錢包

```
Base (EVM):    0xba646262871d295DeAe3062dF5bbe31fcc5841b8  (Crossmint)
Solana (SVM):  HFunb7hi2rMa14MkWSESABQWNJECKhQwvcUJZF4ZCdjS  (PumpFun, self-custodial)
Token:         USDC on both chains
Facilitator:   Dexter (primary, gas sponsored) + CDP (fallback, Base only)
```

### 服務品質保證

- rateMeme SLA: 30 秒
- generateMeme SLA: 2 分鐘
- 圖片自動品質審核 + 失敗重試機制
- 每日投票驗證 — 人類社群為 AI 品質把關

---

## 九、風險與注意事項

| 風險 | 應對 |
|------|------|
| Base 鏈 gas 費用 | Base L2 gas 極低，可忽略 |
| 圖片生成延遲 | 2 min SLA 足夠；✅ auto-retry logic implemented (reviewAndRetryMemes) |
| ACP 10 次連續失敗降級 | 健壯的 error handling + fallback |
| 免費服務被濫用 | rateMeme 已有 rate limiter (10/15min) |
| $VIRTUAL 代幣波動 | 不影響 USDC 結算 |
| x402 SDK 成熟度 | Coinbase 官方維護，5.6K stars |
| 跨鏈：Solana vs Base | 需要新的 Base 錢包，現有 Solana 錢包不影響 |

---

## 十、Agent 名稱策略

建議用 **"Memeya"** 作為 agent 名稱：
- 更短、更獨特、更有人格
- 與品牌一致 (@AiMemeForgeIO)
- 避免與停滯的 MemeForge AI 混淆

---

## 附錄 A: 已完成工作詳情

### Phase 0: API Foundation (完成於 2026-03-03)

**Override Parameters** — 4 個 selection 函數新增 optional override：
- `selectTemplate(event, recentThemes, overrideTemplateId)`
- `selectArtStyle(recentThemes, overrideArtStyleId)`
- `selectStrategy({..., overrideStrategyId})`
- `selectNarrative({..., overrideNarrativeId})`

**Catalog Endpoints** — 5 個 GET routes (`app/backend/routes/catalog.js`)：
- `/api/catalog/templates` — 16 templates, 10 min cache
- `/api/catalog/strategies` — 7 strategies, 10 min cache
- `/api/catalog/narratives` — 11 narratives, 10 min cache
- `/api/catalog/art-styles` — 10 art styles, 10 min cache
- `/api/catalog/top-recipes` — Firestore aggregate, 30 min cache

**Rate Endpoint** — `POST /api/memes/rate`：
- Input: `{ imageUrl }` → Gemini 2.5 Flash vision → hidden 6D scoring → `{ score, pass, grade, suggestions }`
- Crypto slang glossary in prompt to prevent false positives
- Code-level duplicate text detection

**Generate Endpoint** — `POST /api/memes/generate-custom`：
- Extracted `generateSingleMeme()` from `generateDailyMemes()` loop
- Supports all override parameters + topic/newsTitle input
- Same quality gate and retry logic as daily pipeline

### Phase 1: Lab UI (完成於 2026-03-04)

- Hidden tab at `#lab` with passphrase auth
- 3 panels: Rate Meme (image URL input) | Generate Custom | Browse Catalog
- Full i18n support (en, zh-TW, zh-CN)
- Anti-duplicate text rules in image prompt builders

### Phase 2: x402 Direct Sales (完成於 2026-03-04)

**Base Wallet** — Crossmint Smart Wallet `0xba646262871d295DeAe3062dF5bbe31fcc5841b8`
- Balance displayed in Workshop stats footer alongside Solana wallet
- `app/backend/services/baseService.js` — USDC balance via JSON-RPC `eth_call`

**x402 Middleware** — `app/backend/middleware/x402.js`
- Three-track auth: Lab passphrase → Dexter (if healthy) → CDP fallback
- `req.authMethod` tagging: `'lab'` or `'x402'`
- `req.x402Facilitator` tagging: `'dexter'` or `'cdp'`
- Dexter primary: `https://x402.dexter.cash` (Base + Solana, no auth)
- CDP fallback: `https://api.cdp.coinbase.com/platform/v2/x402` (Base only, Ed25519 JWT)
- Health check: 30s polling of `x402.dexter.cash/supported`, 5s timeout, `.unref()` timer
- Route config: `POST /rate` ($0.05) + `POST /generate-custom` ($0.10)
- Paywall verified: 402 response includes both Base and Solana payment options

**Key Technical Decisions**:
- Used `@x402/express` + `@x402/evm` + `@x402/svm` + `@x402/core`
- Dexter facilitator is facilitator-agnostic via `HTTPFacilitatorClient` — same SDK, different URL
- Did NOT use `@dexterai/x402` — ESM-only, incompatible with CJS backend
- Built custom `generateCdpJwt()` using native `crypto.sign()` for Ed25519 (CDP fallback only)
- Solana wallet: self-custodial PumpFun wallet (can sign messages for Dexter marketplace claim)
- Base wallet: Crossmint Smart Wallet (existing, custodial)

**Commerce Transaction Logging** — `logX402Transaction(endpoint, facilitator)` in `app/backend/routes/memes.js`
- Fire-and-forget after successful x402 responses (`.catch(() => {})` — never blocks API)
- Chain-aware text: "Base/Solana" for Dexter, "Base" for CDP
- Stores `facilitator` field in `x402_transactions` Firestore collection for analytics
- Frontend `WorkshopTab.jsx` renders green COMMERCE tag with personality fillers

### Pipeline Reliability: Image Review & Retry (完成於 2026-03-05)

- Extracted `regenerateMemeImageInternal(memeId, model)` from HTTP handler for programmatic use
- Added `reviewAndRetryMemes()` to `schedulerService.js` — runs automatically after `generateDailyMemes()`
- Detects `metadata.imageGenerated === false`, retries sequentially (max 2 per meme, 5s between retries, 10s between memes)
- Manually triggerable via `POST /api/scheduler/trigger/meme_review`
- Daily cycle flow: generate → **review & retry** → 5s delay → start voting

### Phase 1.5: Website Revamp — MaaS Buyer-Facing (完成於 2026-03-05)

**MaaS 品牌定位** — "Memes as a Service" (迷因即服務)
- 首頁主標題改為「迷因即服務」/ "Memes as a Service"
- 雙核心服務並列：Vote & Earn (人類用戶) | API Services (Agent/開發者)
- Audience pill tags: Memeya / 人類 / 生態迭代 / USDC獎勵 (左) | Agent / 開發者 / 迷因量產 / API (右)

**Homepage 重構** — `app/src/components/HomePage.jsx`
- Hero: MaaS title → two-column card layout with audience pill tags → Memeya Activity Ticker
- Featured Gallery: 8 recent top-voted memes from `/api/memes/hall-of-memes`
- API Services: 3 pricing cards (Rate $0.005 / Generate $0.10 / Catalog Free)
- 移除：Growth Flywheel、Play It Smart、Value Props 3-card grid (冗餘)
- 保留：How It Works (改名「生態迭代優化」)、Memeya Token Banner、Bottom CTA

**Public Routes** — 無需登入即可瀏覽：
- `#gallery` → `PublicGalleryPage.jsx` (thin wrapper + GalleryTab)
- `#lab` → `PublicLabPage.jsx` (thin wrapper + LabTab publicMode=true)
- `App.jsx` hash routing: unauthenticated `#lab` → PublicLabPage; authenticated → Dashboard LabTab

**Public Lab (publicMode)** — `app/src/components/LabTab.jsx`
- `publicMode=true`: 僅顯示 API panel (隱藏 Rate/Generate/Catalog 操作面板)
- Tabbed Quick Start code: Rate / Generate / Catalog 三個標籤頁切換
- 友善的 x402 付款說明 + 定價卡

**Custom Domain** — `api.aimemeforge.io`
- Cloud Run domain mapping with Google managed SSL
- Vercel DNS: CNAME `api` → `ghs.googlehosted.com`
- Frontend `VITE_API_BASE_URL` 指向 `https://api.aimemeforge.io`

**Bug Fix** — `app/backend/server.js` weeklyVoters
- 修復 `weeklyVoters: totalUsers` 硬編碼佔位符 → 改為實際查詢近 7 天不重複投票錢包數

### Key Files Modified

| File | Changes |
|------|---------|
| `app/backend/services/memeIdeaService.js` | Override params, evaluatePublicMeme(), anti-duplication prompts |
| `app/backend/services/memeStrategyService.js` | Override param |
| `app/backend/services/memeNarrativeService.js` | Override param |
| `app/backend/controllers/memeController.js` | generateSingleMeme() |
| `app/backend/routes/catalog.js` | **New** — 5 catalog endpoints |
| `app/backend/middleware/x402.js` | **New** — x402 dual-track payment middleware |
| `app/backend/services/baseService.js` | **New** — Base chain USDC balance queries |
| `app/backend/routes/memes.js` | /rate + /generate-custom routes, x402 middleware, commerce tx logging |
| `app/backend/config/firebase.js` | X402_TRANSACTIONS collection constant |
| `app/src/components/WorkshopTab.jsx` | COMMERCE topic/tag/colors/fillers for x402 feed entries |
| `app/backend/routes/rewards.js` | Extended with Base wallet balance |
| `app/src/components/Footer.jsx` | Added "Base" to Powered By section |
| `app/backend/server.js` | Wire catalog routes |
| `app/src/components/LabTab.jsx` | **New** — Lab UI; publicMode prop (API panel only for visitors) |
| `app/src/components/Dashboard.jsx` | Lab tab wiring |
| `app/src/App.jsx` | #lab/#gallery hash routing (public + authenticated) |
| `app/src/locales/*.json` | Lab + MaaS homepage i18n keys (en/zh-TW/zh-CN) |
| `app/src/components/HomePage.jsx` | MaaS hero, two-column cards, pill tags, featured gallery, API services, ticker |
| `app/src/components/PublicGalleryPage.jsx` | **New** — public gallery page wrapper |
| `app/src/components/PublicLabPage.jsx` | **New** — public lab page wrapper (API panel only) |
| `app/backend/server.js` | Fixed weeklyVoters bug (was hardcoded = totalUsers) |
| `docs/product.md` | MaaS narrative, x402 API section, updated roadmap |
