# AIMemeForge Agentic Commerce Strategy

> Date: 2026-03-03 | Updated: 2026-03-04
> Status: Phase 0 ✅ + Lab UI ✅ + Phase 2 x402 ✅ + Commerce Logging ✅ → Phase 3 next

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
└── Launch on AIMemeForge.io                ⬜

Phase 3: Virtuals ACP Marketplace          ⬜ PLANNED
├── Register ACP agent
├── 3 Job Offerings (rateMeme, getTemplates, generateMeme)
├── Sandbox 10 transactions
└── Apply for Graduation
```

---

## 一、商業化架構：雙通道銷售 (Dual Sales Channels)

```
                    ┌─────────────────────────────────────────┐
                    │         AIMemeForge Meme Services        │
                    │                                         │
                    │  rateMeme ($0.005)  │  generateMeme ($0.10)  │  getTemplates ($0.01)
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
              │  ✅ "Try before    │            │  ✅ Butler discovery  │
              │     you buy"       │            │  ✅ $100K/mo rewards │
              │  ✅ No middleman   │            │  ⚠️ 20% protocol fee│
              │  ✅ Instant USDC   │            │  ⚠️ Base chain only  │
              └────────────────────┘            └──────────────────────┘
```

**策略**：x402 先行（直接銷售、零中間人），Virtuals ACP 後接（marketplace 曝光 + 激勵獎勵）。

---

## 二、三層產品策略

### Layer 0: rateMeme — Meme Rating as a Service

```
Price: 0.005 USDC ("nearly free")
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
Client                    AIMemeForge.io                 Base Chain
  │                            │                            │
  │  POST /api/memes/rate      │                            │
  │  (no payment header)       │                            │
  │ ─────────────────────────► │                            │
  │                            │                            │
  │  HTTP 402 Payment Required │                            │
  │  X-Payment: { amount:      │                            │
  │    0.005 USDC, payTo: ... }│                            │
  │ ◄───────────────────────── │                            │
  │                            │                            │
  │  POST /api/memes/rate      │                            │
  │  X-Payment: { signed tx }  │     verify + settle        │
  │ ─────────────────────────► │ ──────────────────────────► │
  │                            │                            │
  │  HTTP 200 { score, grade } │                            │
  │ ◄───────────────────────── │                            │
```

- **結算速度**：200ms（ERC-3009 TransferWithAuthorization，鏈下簽名 → 鏈上結算）
- **手續費**：Coinbase Facilitator ~1% — 遠低於 ACP 的 20%
- **兼容性**：任何 HTTP client 都能使用，不需要 ACP SDK

### 實現方案：@x402/express + 自製 CDP Auth

```bash
npm install @x402/express @x402/evm @x402/core
```

**注意**：官方 `@coinbase/x402` 依賴 `jose` (ESM-only)，與 CJS backend 不相容。
我們自製了 CDP Ed25519 JWT 簽名（使用 Node.js `crypto`），產生相同的 auth headers。

```javascript
// app/backend/middleware/x402.js — 雙軌 middleware
function requireLabKeyOrPayment(req, res, next) {
  // Track 1: Lab passphrase → free admin access
  if (req.headers['x-api-key'] === process.env.LAB_API_KEY) return next();

  // Track 2: x402 payment → Base USDC via CDP facilitator
  const middleware = getX402Middleware(); // lazy init, cached
  if (middleware) return middleware(req, res, next);

  // Fallback: reject
  return res.status(403).json({ error: 'FORBIDDEN' });
}
```

**雙軌共存**：Lab passphrase (x-api-key header) 跳過 paywall，外部呼叫走 x402 支付。CDP credentials 未設定時優雅降級（server 仍啟動，只是 x402 不可用）。

### x402 生態工具

| 工具 | 用途 | 適用性 |
|------|------|--------|
| **@x402/express** (Coinbase) | Express middleware — HTTP 402 paywall | ✅ **首選** — 官方、最成熟 |
| **Apiosk** | 託管式 x402 proxy — 零代碼整合 | ⚠️ 10% 手續費，但可作為備選 |
| **ZAUTH** | 鏈上信任驗證層 | 🔄 未來可加 — 驗證付費客戶身份 |
| **Lit Protocol** | 去中心化存取控制 | ❌ 過重，不適合微支付 |
| **Superfluid** | 串流支付 | ❌ 不適合 per-call 定價 |

### x402 實施步驟

```
1. [x] 創建 Base 鏈 USDC 收款錢包 (0xba646262871d295DeAe3062dF5bbe31fcc5841b8)
2. [x] 前端顯示 Base 錢包餘額 (Workshop stats footer)
3. [x] 安裝 @x402/express @x402/evm @x402/core
4. [x] 配置 CDP Facilitator (Ed25519 API key → GCP env vars)
5. [x] 自製 CDP JWT auth (避免 jose ESM/CJS 衝突)
6. [x] 雙軌 middleware：requireLabKeyOrPayment (Lab passphrase OR x402)
7. [x] Wire /rate ($0.005) + /generate-custom ($0.10)
8. [x] 部署到 Cloud Run — HTTP 402 驗證通過
9. [x] 測試：用 x402 client 呼叫 rateMeme ($0.005) ✅ 2026-03-04 首筆交易成功
10. [x] Commerce transaction logging — x402 payments appear in Workshop feed (COMMERCE tag) + x402_transactions Firestore collection
11. [ ] 測試：用 x402 client 呼叫 generateMeme ($0.10)
12. [ ] 在 AIMemeForge.io/lab 頁面加入 "API Pricing" 說明
```

---

## 五、Phase 3: Virtuals ACP Marketplace

### Virtuals Protocol 概覽

| 維度 | 詳情 |
|------|------|
| **區塊鏈** | Base (Coinbase L2, EVM 相容) |
| **代幣** | $VIRTUAL (交易基礎貨幣) |
| **結算幣** | USDC on Base |
| **規模** | 18,000+ agents, 177 萬+ completed jobs |
| **月營收** | $263 萬 (aGDP: $4.79 億) |
| **激勵計劃** | $100 萬/月 分發給有營收的 agents |

### ACP 交易流程

```
Request → Negotiation → Transaction (escrow lock) → Delivery → Evaluation → Complete (escrow release)
```

- 買方 USDC 鎖入 escrow → 賣方交付 → 驗收 → **80% USDC → 賣方, 20% → 協議**
- 所有交易鏈上可驗證 (ERC-8004 身份標準)

### Agent Profile

```
Agent: Memeya (AIMemeForge)
Role: Provider

Job Offerings:
├── rateMeme      — 0.005 USDC — 30s SLA   — Gemini vision
├── getTemplates  — 0.01 USDC  — 1 min SLA — pure cache
└── generateMeme  — 0.10 USDC  — 2 min SLA — 核心產品
```

### ACP 實施步驟

```
1. [ ] 創建 Base 鏈 EVM 錢包
2. [ ] 在 app.virtuals.io 註冊 ACP agent (Memeya / AIMemeForge)
3. [ ] 安裝 @virtuals-protocol/acp-node SDK
4. [ ] 實現 3 個 Job Offerings handler (job listener + router)
5. [ ] Sandbox 測試 10 次交易
6. [ ] 申請 Graduation
7. [ ] 宣傳推廣 (X + Moltbook)
```

### 競品觀察

| Agent | 成功率 | 狀態 |
|-------|--------|------|
| **MemeKing** | 66.67% | 活躍 — 目前最活躍 |
| **MemeForge AI** | 100% | **已停滯 (2個月前最後互動)** |
| MemeGPT, MemeShot AI, others | 0-51% | 低活動或無活動 |

**關鍵洞察**：Meme 賽道幾乎沒有真正的競爭者。"Autonomous Meme House" 是 Virtuals 官方認可的 cluster。

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

| 服務 | 成本 | 售價 | x402 手續費 (~1%) | ACP 手續費 (20%) | x402 淨收 | ACP 淨收 |
|------|------|------|-------------------|------------------|-----------|----------|
| **rateMeme** | ~$0.003 | $0.005 | $0.00005 | $0.001 | $0.002 | $0.001 |
| **getTemplates** | ~$0 | $0.01 | $0.0001 | $0.002 | $0.01 | $0.008 |
| **generateMeme** | ~$0.04 | $0.10 | $0.001 | $0.02 | $0.059 | $0.04 |

**x402 利潤顯著高於 ACP** — 但 ACP 提供 marketplace 曝光和月激勵獎勵。兩者互補。

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
Backend:   GCP Cloud Run (memeforge-api)
Agent:     DigitalOcean Droplet (165.22.136.40)
DB:        Firestore (web3ai-469609)
Wallet:    Crossmint on Solana (4Bqyw...)
```

### 商業化後架構

```
                         aimemeforge.io (Vercel)
                              │
                         Lab UI (#lab)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              x402 paywall         Lab passphrase
              (paid access)        (admin access)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    Cloud Run Backend
                    ├── POST /api/memes/rate
                    ├── POST /api/memes/generate-custom
                    ├── GET  /api/catalog/*
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
| `@x402/core` | HTTPFacilitatorClient + x402ResourceServer | Cloud Run backend |
| `@virtuals-protocol/acp-node` | ACP agent SDK | Droplet agent (Phase 3) |

---

## 八、風險與注意事項

| 風險 | 應對 |
|------|------|
| Base 鏈 gas 費用 | Base L2 gas 極低，可忽略 |
| 圖片生成延遲 | 2 min SLA 足夠；加 retry logic |
| ACP 10 次連續失敗降級 | 健壯的 error handling + fallback |
| 免費服務被濫用 | rateMeme 已有 rate limiter (10/15min) |
| $VIRTUAL 代幣波動 | 不影響 USDC 結算 |
| x402 SDK 成熟度 | Coinbase 官方維護，5.6K stars |
| 跨鏈：Solana vs Base | 需要新的 Base 錢包，現有 Solana 錢包不影響 |

---

## 九、Agent 名稱策略

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
- Dual-track auth: Lab passphrase (x-api-key) OR x402 payment
- `req.authMethod` tagging: `'lab'` or `'x402'` — lets route handlers identify payment method
- CDP facilitator: `https://api.cdp.coinbase.com/platform/v2/x402`
- Ed25519 JWT generation via Node.js `crypto` (bypasses ESM-only `jose`)
- Route config: `POST /rate` ($0.005) + `POST /generate-custom` ($0.10)
- Paywall verified: unauthenticated requests return HTTP 402

**Key Technical Decisions**:
- Used `@x402/express` + `@x402/evm` + `@x402/core` (Coinbase official)
- Did NOT use `@coinbase/x402` — depends on `@coinbase/cdp-sdk` → `jose` (ESM-only, crashes CJS)
- Built custom `generateCdpJwt()` using native `crypto.sign()` for Ed25519
- Route config keys must be router-relative (`POST /rate`, not `POST /api/memes/rate`) because `paymentMiddleware` matches against `req.path`
- `@x402/paywall` (85MB, bundles WalletConnect/Solana wallet SDKs) causes Cloud Run deploy failure — removed; using built-in fallback HTML (shows logo + amount + description)

**Commerce Transaction Logging** — `logX402Transaction()` in `app/backend/routes/memes.js`
- Fire-and-forget after successful x402 responses (`.catch(() => {})` — never blocks API)
- Appends `x402_commerce` entry to today's `memeya_workshop` Firestore doc (Workshop activity feed)
- Stores lightweight analytics doc to `x402_transactions` collection (endpoint, amount, timestamp, date)
- Frontend `WorkshopTab.jsx` renders green COMMERCE tag with personality fillers

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
| `app/src/components/LabTab.jsx` | **New** — Lab UI |
| `app/src/components/Dashboard.jsx` | Lab tab wiring |
| `app/src/App.jsx` | #lab hash handling |
| `app/src/locales/*.json` | Lab i18n keys |
