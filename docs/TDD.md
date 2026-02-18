# MemeForge — Technical Design Document

> 系統架構、API 規格、資料模型、部署配置、實作規劃與開發進度追蹤

*最後更新: 2026-02-18*

---

## 1. 系統總覽

MemeForge 的完整技術系統支撐以下產品循環（詳見 product.md）：

```
AI 生成梗圖 → 社群投票 → 選出每日贏家 → 每日抽獎選出擁有者 → Claim 鑄造 NFT
```

**每日排程 (UTC):**
| 時間 | Job | 動作 |
|------|-----|------|
| 23:55 | end_voting | 結算投票、選出贏家梗圖、計算稀有度 |
| 23:56 | lottery_draw | 加權隨機抽選擁有者、參與者 tickets 歸零 |
| 00:00 | daily_cycle | AI 生成 3 張新梗圖、開始新投票期 |

---

## 2. 系統架構

### 2.1 架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                           │
│                https://solana-hacker.vercel.app                 │
│                                                                 │
│  React + Vite + Tailwind CSS + Solana Web3.js                   │
│                                                                 │
│  READ: Firebase SDK 直連 (即時同步 onSnapshot)                   │
│  WRITE: Cloud Run API (驗證 + 防刷)                              │
└─────────────────────────────────────────────────────────────────┘
                │ READ                    │ WRITE
                ▼                         ▼
┌──────────────────────┐    ┌──────────────────────────────────────┐
│     Firestore        │◄──►│         Cloud Run API (GCP)          │
│  (即時資料庫)         │    │  memeforge-api-836651762884          │
│                      │    │  asia-southeast1                     │
│ users/{wallet}       │    ├──────────────────────────────────────┤
│ memes/{id}           │    │ /api/memes/today          GET        │
│ votes/{id}           │    │ /api/memes/generate-daily POST       │
│ voting_periods/{id}  │    │ /api/voting/vote          POST       │
│ voting_progress/{id} │    │ /api/stats                GET        │
│ platform_stats/      │    │ /api/users/{wallet}       GET        │
│ scheduler_logs/{id}  │    │ /api/scheduler/trigger/*  POST       │
│ hall_of_memes/{id}   │    │ /api/og/:memeId           GET        │
└──────────────────────┘    └──────────────────────────────────────┘
                                       │
                       ┌───────────────┼───────────────┐
                       ▼               ▼               ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │  GCS Bucket  │ │  Gemini AI   │ │   Grok API   │
              │  memeforge-  │ │  梗圖生成     │ │  新聞分析     │
              │  images-web3ai│ │              │ │  趨勢監測     │
              └──────────────┘ └──────────────┘ └──────────────┘
```

### 2.2 讀寫分離設計

| 操作類型 | 通道 | 原因 |
|---------|------|------|
| 讀取梗圖 | Firebase SDK 直連 | 即時同步 `onSnapshot`、低延遲 |
| 讀取投票統計 | Firebase SDK 直連 | 多用戶即時看到變化 |
| 提交投票 | Cloud Run API | 驗證錢包簽名、防重複/刷票 |
| 生成梗圖 | Cloud Run API | API Key 不暴露給前端 |
| 排程任務 | Cloud Scheduler → Cloud Run | 外部觸發，可靠執行 |

### 2.3 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| Frontend | React + Vite | SPA，Vercel 部署 |
| Styling | Tailwind CSS | 響應式設計 |
| Wallet | Solana Web3.js | Phantom, Solflare 等 |
| Backend | Node.js + Express | API 服務，Cloud Run 部署 |
| Database | Firebase/Firestore | 即時資料庫 |
| Storage | Google Cloud Storage | 梗圖圖片 (Uniform Bucket-Level Access) |
| AI | Gemini 3 Pro Image | 梗圖生成 |
| AI | Grok API (xAI) | 新聞分析 |
| Scheduler | GCP Cloud Scheduler | 外部 cron 排程 |
| CDN | Vercel Edge | 前端快速分發 |

---

## 3. 專案結構

```
/home/projects/solanahacker/
├── agent/                    # Agent 程式碼
│   └── .env                  # Agent 環境變數 (Grok, Gemini)
├── app/
│   ├── src/                  # Frontend (React + Vite)
│   │   ├── components/       # UI 組件
│   │   ├── hooks/            # React Hooks
│   │   └── services/         # Firebase + API 服務層
│   ├── backend/              # Backend (Express + Firebase Admin)
│   │   ├── server.js         # 主入口
│   │   ├── routes/           # API 路由
│   │   ├── services/         # 業務邏輯
│   │   ├── controllers/      # 控制器
│   │   └── .env              # Backend 環境變數
│   ├── public/               # 靜態資源
│   └── index.html            # OG meta tags
├── docs/
│   ├── product.md            # 產品文件
│   ├── TDD.md                # 本文件 (技術設計)
│   └── _transient/           # 過渡性文件
└── memory/                   # Agent 記憶
```

### 關鍵 Frontend 檔案

| 檔案 | 用途 |
|------|------|
| `src/services/firebase.js` | Firebase Client SDK + 即時監聽 |
| `src/services/memeService.js` | API 服務層 (Cloud Run 呼叫) |
| `src/hooks/useFirebase.js` | useTodayMemes, useVoteStats 等 Hooks |
| `src/components/ForgeTab.jsx` | 主投票頁面 |
| `src/components/GalleryTab.jsx` | Hall of Memes 歷史展示 |
| `src/components/MemeModal.jsx` | 梗圖大圖 + 投票 + 分享按鈕 |
| `src/components/ModalOverlay.jsx` | Modal 基礎組件 (React Portal) |

### 關鍵 Backend 檔案

| 檔案 | 用途 |
|------|------|
| `backend/server.js` | Express 主入口、路由註冊 |
| `backend/services/schedulerService.js` | 排程任務核心邏輯 (end_voting, daily_cycle, lottery) |
| `backend/controllers/memeController.js` | 梗圖 CRUD (getTodaysMemes, generateDailyMemes) |
| `backend/routes/scheduler.js` | 排程 API 路由 (/api/scheduler/trigger/*) |
| `backend/routes/og.js` | OG Card 動態圖片生成 |
| `backend/routes/voting.js` | 投票 API 路由 |
| `backend/routes/users.js` | 用戶資料 API |

---

## 4. API 規格

### 4.1 梗圖 API

**`GET /api/memes/today`** — 取得今日梗圖
```javascript
// Response
{
  success: true,
  memes: [{
    id: 'meme_1739836800000_0',
    title: 'When Solana Hits $200',
    imageUrl: 'https://storage.googleapis.com/memeforge-images-web3ai/memes/xxx.png',
    generatedAt: '2026-02-18T00:00:00.000Z',
    status: 'voting_active',
    votes: { selection: { yes: 42, no: 10 } },
    sentiment: 'Bullish',
    tags: ['solana', 'price'],
    style: 'Classic Oil Painting'
  }],
  count: 3
}
```

**`POST /api/memes/generate-daily`** — 生成每日梗圖 (Scheduler 觸發)

### 4.2 投票 API

**`POST /api/voting/vote`** — 提交投票
```javascript
// Request
{
  memeId: 'meme_xxx',
  vote: 'yes',
  walletAddress: 'ABC123...xyz',
  signature: '...'  // 錢包簽名
}

// Response
{
  success: true,
  ticketsAwarded: 12,
  streakDays: 5,
  message: 'Vote recorded! +12 tickets'
}
```

### 4.3 用戶 API

**`GET /api/users/{wallet}`** — 取得或建立用戶
```javascript
// Response
{
  walletAddress: 'ABC123...xyz',
  weeklyTickets: 42,
  totalTicketsAllTime: 350,
  streakDays: 5,
  lastVoteDate: '2026-02-18',
  lotteryOptIn: true
}
```

**`GET /api/users/list/leaderboard`** — Ticket 排行榜

### 4.4 排程 API

**`POST /api/scheduler/trigger/{task}`** — Cloud Scheduler 觸發端點

| Task | 說明 |
|------|------|
| `end_voting` | 結算投票、選出贏家 |
| `daily_cycle` | AI 生成新梗圖 + 開始投票 |
| `lottery_draw` | 每日抽獎選出擁有者 |

**`GET /api/scheduler/logs`** — 排程執行日誌

### 4.5 其他 API

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/stats` | GET | 平台統計 |
| `/api/stats/increment-voters` | POST | 增加投票者計數 |
| `/api/og/:memeId` | GET | 動態 OG Card 圖片 |
| `/health` | GET | 健康檢查 |

---

## 5. Firestore Schema

### 5.1 Collections 概覽

| Collection | Document ID | 用途 |
|------------|-------------|------|
| `users` | `{walletAddress}` | 用戶資料、tickets、streak |
| `memes` | `{memeId}` | 梗圖資料、投票數、擁有者 |
| `votes` | `{voteId}` | 投票記錄 |
| `voting_periods` | `{periodId}` | 投票期間追蹤 |
| `voting_progress` | `{walletAddress}` | 用戶投票進度 |
| `platform_stats` | `current` | 平台統計 |
| `scheduler_logs` | `{logId}` | 排程執行日誌 |
| `hall_of_memes` | `{date}` | 歷史贏家 |

### 5.2 Document Schemas

**users/{walletAddress}**
```javascript
{
  walletAddress: 'ABC123...xyz',
  weeklyTickets: 42,           // 當前持有 tickets (抽獎後歸零)
  totalTicketsAllTime: 350,    // 歷史總 tickets
  streakDays: 5,               // 連續投票天數
  lastVoteDate: '2026-02-18',  // 最後投票日 (YYYY-MM-DD)
  lotteryOptIn: true,          // 預設 true，用戶可 toggle
  nftWins: [                   // 中獎記錄
    { memeId: 'meme_xxx', title: '...', selectedAt: '...', claimed: false }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**memes/{memeId}**
```javascript
{
  id: 'meme_1739836800000_0',
  type: 'daily',
  status: 'active' | 'voting_active' | 'voting_completed' | 'winner' | 'minted',
  generatedAt: '2026-02-18T00:00:00.000Z',
  title: 'When Solana Hits $200',
  description: 'AI-generated from CoinDesk news',
  imageUrl: 'https://storage.googleapis.com/memeforge-images-web3ai/memes/xxx.png',
  newsSource: 'CoinDesk',
  sentiment: 'Bullish',
  tags: ['solana', 'price', 'moon'],
  style: 'Classic Oil Painting',
  votes: { selection: { yes: 42, no: 10 } },
  metadata: { imageGenerated: true, model: 'gemini-3-pro' },
  nftOwner: {                  // lottery_draw 設定
    walletAddress: 'ABC123...xyz',
    selectedAt: '2026-02-19T00:00:00Z',
    claimTxSignature: null,    // Phase 2: Claim 後填入
    claimedAt: null,           // Phase 2: Claim 後填入
    mintAddress: null           // Phase 2: NFT mint address
  }
}
```

**votes/{voteId}**
```javascript
{
  memeId: 'meme_xxx',
  walletAddress: 'ABC123...xyz',
  vote: 'yes',
  timestamp: '2026-02-18T10:30:00.000Z'
}
```

**platform_stats/current**
```javascript
{
  weeklyVoters: 0,
  totalVotersAllTime: 0,
  lastUpdated: Timestamp
}
```

### 5.3 Firestore 索引

| Collection | Fields | 排序 | 用途 |
|-----------|--------|------|------|
| `memes` | status, type, generatedAt | ↑, ↑, ↓ | 查詢今日活躍梗圖 |

Index 建立: [Firebase Console](https://console.firebase.google.com/project/web3ai-469609/firestore/indexes)

### 5.4 Meme 狀態機

```
active → voting_active → voting_completed → winner → minted
                                              ↑           ↑
                                        lottery_draw   NFT claim
```

- `active`: 剛生成，等待投票開始
- `voting_active`: 投票進行中
- `voting_completed`: 投票結算完成
- `winner`: 抽獎贏家已選出，等待 Claim
- `minted`: NFT 已鑄造 (終態，拒絕後續操作)

---

## 6. Cloud Scheduler

### 6.1 Jobs

| Job | Cron (UTC+8) | UTC | 端點 |
|-----|-------------|-----|------|
| `memeforge-end-voting` | 每日 7:55 AM | 23:55 | POST `/api/scheduler/trigger/end_voting` |
| `memeforge-lottery-draw` | 每日 7:56 AM | 23:56 | POST `/api/scheduler/trigger/lottery_draw` |
| `memeforge-daily-cycle` | 每日 8:00 AM | 00:00 | POST `/api/scheduler/trigger/daily_cycle` |

**執行順序**: end_voting → lottery_draw → daily_cycle (1 分鐘間隔)

### 6.2 管理指令

```bash
# 列出排程
gcloud scheduler jobs list --location=asia-southeast1

# 手動觸發
gcloud scheduler jobs run memeforge-end-voting --location=asia-southeast1

# 查看日誌
curl https://memeforge-api-836651762884.asia-southeast1.run.app/api/scheduler/logs

# 新增 job
gcloud scheduler jobs create http memeforge-lottery-draw \
  --location=asia-southeast1 \
  --schedule="56 7 * * *" \
  --time-zone="Asia/Taipei" \
  --uri="https://memeforge-api-836651762884.asia-southeast1.run.app/api/scheduler/trigger/lottery_draw" \
  --http-method=POST \
  --headers="Content-Type=application/json"
```

---

## 7. 認證與安全

### 7.1 錢包簽名驗證

```javascript
// Frontend: 錢包簽名
const authenticateWallet = async (wallet) => {
  const nonce = Date.now().toString() + Math.random().toString(36);
  const message = `MemeForge Login\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await wallet.signMessage(encodedMessage);
  // 發送 walletAddress + message + signature 到後端驗證
};

// Backend: 驗證簽名
const verifyWalletSignature = async (walletAddress, message, signature) => {
  const { PublicKey } = require('@solana/web3.js');
  const nacl = require('tweetnacl');
  const publicKey = new PublicKey(walletAddress);
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = new Uint8Array(signature);
  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
};
```

### 7.2 防刷機制

```javascript
app.post('/api/vote', async (req, res) => {
  const { memeId, vote, walletAddress, signature } = req.body;

  // 1. 驗證錢包簽名
  if (!verifyWalletSignature(walletAddress, signature))
    return res.status(401).json({ error: 'Invalid signature' });

  // 2. 防重複投票 (每錢包每梗圖一次)
  const existing = await db.collection('votes')
    .where('memeId', '==', memeId)
    .where('walletAddress', '==', walletAddress).get();
  if (!existing.empty)
    return res.status(400).json({ error: 'Already voted' });

  // 3. 頻率限制 (每錢包每分鐘最多 5 票)
  const recentVotes = await getRecentVotesCount(walletAddress, 60);
  if (recentVotes >= 5)
    return res.status(429).json({ error: 'Rate limited' });

  // 4. 寫入 Firestore
  await db.collection('votes').add({ memeId, vote, walletAddress, timestamp: new Date() });
  res.json({ success: true });
});
```

### 7.3 CORS 設定

```javascript
const corsOptions = {
  origin: [
    'https://solana-hacker.vercel.app',
    'https://solana-hacker-git-*.vercel.app', // Preview
    'http://localhost:5173'                    // Dev
  ],
  credentials: true
};
```

### 7.4 投票獎勵機制

```
投票完成 → 隨機 8-15 tickets → 更新 weeklyTickets + totalTicketsAllTime
                             → 計算 streakDays (連續+1 或重置為1)
                             → 記錄 lastVoteDate
```

---

## 8. 部署配置

### 8.1 環境分離

| 環境 | Frontend | Backend | Database |
|-----|----------|---------|----------|
| Development | http://165.22.136.40:5173 | localhost:3001 (DEV_MODE) | Mock Data |
| Production | https://solana-hacker.vercel.app | Cloud Run | Firestore |

### 8.2 環境變數

**Backend (Cloud Run)**
```bash
NODE_ENV=production
GEMINI_API_KEY=<gemini-api-key>
XAI_API_KEY=<xai-api-key>
FIREBASE_PROJECT_ID=web3ai-469609
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@web3ai-469609.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<firebase-private-key-pem-format>
```

**Frontend (Vercel)**
```bash
VITE_API_BASE_URL=https://memeforge-api-836651762884.asia-southeast1.run.app
VITE_FIREBASE_API_KEY=<firebase-web-api-key>
VITE_FIREBASE_PROJECT_ID=web3ai-469609
VITE_FIREBASE_AUTH_DOMAIN=web3ai-469609.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=web3ai-469609.firebasestorage.app
```

**環境變數檔案位置:**

| 用途 | 路徑 |
|------|------|
| Backend | `app/backend/.env` + Cloud Run env vars |
| Frontend | `app/.env.local` + Vercel env vars |
| Agent | `agent/.env` |

### 8.3 GCS 儲存

- **Bucket**: `memeforge-images-web3ai`
- **路徑**: `memes/{filename}.png`
- **存取**: Uniform Bucket-Level Access (IAM public read)
- **URL**: `https://storage.googleapis.com/memeforge-images-web3ai/memes/xxx.png`

> 注意: 上傳時使用 `resumable: false`，不設定 `public: true` (與 Uniform Access 衝突)

### 8.4 部署流程

**Frontend (自動):**
```
git push origin main → Vercel 自動部署
```

**Backend (手動):**
```bash
ssh root@165.22.136.40
cd /home/projects/solanahacker/app/backend
gcloud run deploy memeforge-api --source . --region asia-southeast1 --allow-unauthenticated
gcloud run services update-traffic memeforge-api --region asia-southeast1 --to-latest
```

> 重要: 使用 `--update-env-vars` 而非 `--set-env-vars`，避免覆蓋既有環境變數。

**同步流程 (Local → GitHub):**
```bash
# 1. SCP 到 droplet
scp <local-file> root@165.22.136.40:/home/projects/solanahacker/<path>

# 2. SSH commit + push
ssh root@165.22.136.40 "cd /home/projects/solanahacker && git add -A && git commit -m 'message' && git push origin main"
```

### 8.5 健康檢查

```bash
curl https://memeforge-api-836651762884.asia-southeast1.run.app/health
# {"status":"healthy"}

curl https://memeforge-api-836651762884.asia-southeast1.run.app/api/memes/today
# {"success":true,"memes":[...],"count":3}
```

---

## 9. 實作規劃

### Phase 1: 每日抽獎 (Daily Lottery)

**目標**: 投票結算後，從所有「參與」的錢包中根據 tickets 加權隨機抽選 1 位贏家。

**Backend 核心邏輯:**
```javascript
async runDailyLottery() {
  // 1. 找到今日贏家梗圖 (最高票)
  const winnerMeme = todaysMemes.sort((a, b) =>
    (b.votes?.selection?.yes || 0) - (a.votes?.selection?.yes || 0)
  )[0];
  if (!winnerMeme || (winnerMeme.votes?.selection?.yes || 0) === 0) return;

  // 2. 查詢 lotteryOptIn=true 且 tickets > 0 的用戶
  // 3. 建立加權池 (每張 ticket = 1 個 entry)
  // 4. 隨機抽選 1 位
  // 5. 更新 meme.nftOwner + user.nftWins
  // 6. 所有參與者 weeklyTickets 歸零
}
```

**Frontend 變更:**
- ForgeTab: lottery opt-in/opt-out toggle
- Dashboard: 「My NFTs」區域
- MemeModal / Gallery: 贏家 Owner badge

### Phase 2: NFT Claim & 鑄造

**目標**: 贏家 Claim → Arweave 上傳 → Metaplex pNFT 鑄造 (5% royalty 強制執行) → 用戶簽名。

**NFT 規格:**
- **Standard**: Metaplex Programmable NFT (pNFT)
- **Royalty**: 5% (強制執行，無法被交易所跳過)
- **Royalty 收款**: 平台錢包 (PLATFORM_WALLET)
- **Creator share**: Platform 5% royalty, Winner 100% ownership

**API:**
- `POST /api/nft/prepare-mint` — 準備 mint transaction (server-side)
- `POST /api/nft/confirm-mint` — 確認 mint 完成

**NFT Metadata (Metaplex pNFT):**
```json
{
  "name": "MemeForge #001 — When Solana Hits $200",
  "symbol": "MFORGE",
  "image": "https://arweave.net/xxx",
  "seller_fee_basis_points": 500,
  "attributes": [
    { "trait_type": "Rarity", "value": "Legendary" },
    { "trait_type": "Vote Count", "value": 42 },
    { "trait_type": "Generation Date", "value": "2026-02-18" }
  ],
  "properties": {
    "category": "image",
    "creators": [
      { "address": "PLATFORM_WALLET", "share": 100 }
    ]
  }
}
```

> `seller_fee_basis_points: 500` = 5% royalty。pNFT 的 RuleSet 確保所有交易所 (Magic Eden, Tensor 等) 強制執行此 royalty。

**防重複鑄造**: Firestore transaction guard，`minting_in_progress` 中間態。

**新增依賴:**
| 套件 | 用途 |
|------|------|
| `@metaplex-foundation/mpl-token-metadata` | pNFT metadata + RuleSet |
| `@metaplex-foundation/umi` | Metaplex framework |
| `@metaplex-foundation/mpl-token-auth-rules` | pNFT royalty enforcement |
| `@irys/sdk` | Arweave 上傳 |

**新增環境變數:** `ARWEAVE_WALLET_KEY`, `SOLANA_RPC_URL`, `PLATFORM_WALLET_KEYPAIR`

### Phase 3: SPL Token 門檻

**目標**: 發行 $MFORGE SPL Token，投票需持有 ≥ 100 tokens。防 Sybil Attack。

**驗證流程:**
```
投票前 → getTokenAccountsByOwner(wallet, MFORGE_MINT) → 餘額 ≥ MIN_BALANCE → 允許投票
```

**新增環境變數:** `MFORGE_TOKEN_MINT`, `MIN_TOKEN_BALANCE`

---

## 10. 開發進度 Roadmap

### 基礎設施

- [x] GCP 專案建立 (web3ai-469609)
- [x] Firestore 資料庫設定
- [x] Firestore Composite Index (memes: status, type, generatedAt)
- [x] GCS Bucket 建立 (memeforge-images-web3ai, Uniform Access)
- [x] Cloud Run 部署 (memeforge-api, asia-southeast1)
- [x] Vercel Frontend 部署
- [x] Cloud Scheduler 設定 (end_voting, daily_cycle)
- [x] DigitalOcean Droplet (165.22.136.40) 開發環境
- [x] GitHub Repo 同步流程
- [x] 環境變數管理 (.env 分離: backend, frontend, agent)
- [x] .gitignore 防止 secrets 洩漏

### AI 梗圖生成

- [x] Gemini 3 Pro Image 整合
- [x] Grok API 新聞分析
- [x] 每日自動生成 3 張梗圖
- [x] GCS 圖片上傳 (修復 Uniform Access 衝突)
- [x] 梗圖品質篩選 (幽默度、病毒潛力)
- [x] 內容來源: Twitter/X, CoinDesk, Reddit
- [x] 生成失敗重試/錯誤處理

### 投票系統

- [x] 投票 API (POST /api/voting/vote)
- [x] 防重複投票 (Firestore 查詢)
- [x] 頻率限制 (Rate Limiting)
- [x] Ticket 獎勵 (8-15 隨機)
- [x] 連勝追蹤 (streakDays)
- [x] 投票統計即時更新
- [x] 投票結算邏輯 (end_voting)
- [x] 每日贏家選出 (最高票)
- [x] 稀有度計算 (Common/Rare/Legendary)

### 前端 UI

- [x] 錢包連接 (Phantom, Solflare)
- [x] 每日梗圖展示 (ForgeTab)
- [x] 投票界面 + 即時統計
- [x] 梗圖大圖 Modal (MemeModal)
- [x] Modal 內投票功能
- [x] Hall of Memes (GalleryTab)
- [x] 用戶 Dashboard (tickets, streak)
- [x] 響應式設計 (Mobile compatible)
- [x] Share to X (Twitter) 按鈕
- [x] Copy Link 按鈕
- [x] OG Card 動態預覽圖

### 排程與自動化

- [x] Cloud Scheduler end_voting job
- [x] Cloud Scheduler daily_cycle job
- [x] Scheduler 查詢對齊 (與前端 query 一致)
- [x] Missing document 容錯處理
- [x] Generation 錯誤偵測 (statusCode >= 400)
- [x] 排程日誌 (scheduler_logs collection)
- [ ] Cloud Scheduler lottery_draw job (每日 23:56 UTC)

### Phase 1: 每日抽獎

- [ ] `lotteryOptIn` 欄位加入 users collection
- [ ] `runDailyLottery()` 後端邏輯
- [ ] 加權隨機抽選演算法
- [ ] 參與者 tickets 歸零
- [ ] 不參與者 tickets 保留
- [ ] `nftOwner` 欄位更新 meme document
- [ ] `nftWins` 陣列更新 user document
- [ ] lottery_draw Cloud Scheduler job 建立
- [ ] Frontend: opt-in/opt-out toggle
- [ ] Frontend: 「My NFTs」Dashboard 區域
- [ ] Frontend: Gallery 贏家 Owner badge
- [ ] 邊界處理: 0 參與者、1 參與者、0 投票

### Phase 2: NFT Claim & 鑄造

- [ ] `POST /api/nft/prepare-mint` API
- [ ] `POST /api/nft/confirm-mint` API
- [ ] Arweave 圖片上傳 (Irys SDK)
- [ ] Metaplex NFT metadata 建構
- [ ] Solana mint transaction 建構
- [ ] Frontend: Claim NFT 按鈕
- [ ] Frontend: Claim 流程 UI (簽名、等待、完成)
- [ ] Firestore transaction guard (防 double mint)
- [ ] Meme status 'minted' 終態保護
- [ ] Solana Explorer 可查看 NFT

### Phase 3: SPL Token 門檻

- [ ] SPL Token 部署 ($MFORGE)
- [ ] 投票 API token 餘額驗證
- [ ] Frontend: 餘額不足引導
- [ ] Token 分發機制 (Airdrop / Vote-to-Earn / DEX)
- [ ] 門檻可動態調整 (MIN_TOKEN_BALANCE config)

---

*最後更新: 2026-02-18*
