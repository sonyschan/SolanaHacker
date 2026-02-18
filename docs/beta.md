# MemeForge Beta — 技術實作與架構文件

> 系統架構、Firestore schema、Cloud Run 部署、三階段實作規劃

*最後更新: 2026-02-18*

---

## 當前部署狀態

| 服務 | URL | 狀態 |
|-----|-----|------|
| Frontend | https://solana-hacker.vercel.app | Running |
| Backend API | https://memeforge-api-836651762884.asia-southeast1.run.app | Running |
| Firestore | web3ai-469609 | Indexed |
| Cloud Scheduler | memeforge-end-voting (23:55 UTC), memeforge-daily-cycle (00:00 UTC), memeforge-lottery-draw (daily 23:56 UTC) | Active |

---

## 系統架構

### 架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                           │
│                https://solana-hacker.vercel.app                 │
│                                                                 │
│  React + Vite + Tailwind CSS + Solana Web3.js                   │
│                                                                 │
│  READ: Firebase SDK 直連 (即時同步)                              │
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
              │  memeforge-  │ │  gemini-3-   │ │  新聞分析     │
              │  images-web3ai│ │  pro-image   │ │  趨勢監測     │
              └──────────────┘ └──────────────┘ └──────────────┘
```

### 讀寫分離設計

| 操作類型 | 通道 | 原因 |
|---------|------|------|
| 讀取梗圖 | Firebase SDK 直連 | 即時同步 `onSnapshot`、低延遲 |
| 讀取投票統計 | Firebase SDK 直連 | 多用戶即時看到變化 |
| 提交投票 | Cloud Run API | 驗證錢包簽名、防重複/刷票 |
| 生成梗圖 | Cloud Run API | API Key 不暴露給前端 |
| 排程任務 | Cloud Scheduler → Cloud Run | 外部觸發，可靠執行 |

### 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| Frontend | React + Vite | SPA，Vercel 部署 |
| Styling | Tailwind CSS | 響應式設計 |
| Wallet | Solana Web3.js | Phantom, Solflare 等 |
| Backend | Node.js + Express | API 服務，Cloud Run 部署 |
| Database | Firebase/Firestore | 即時資料庫 |
| Storage | Google Cloud Storage | 梗圖圖片 |
| AI | Gemini 3 Pro Image | 梗圖生成 |
| AI | Grok API (xAI) | 新聞分析 |
| Scheduler | GCP Cloud Scheduler | 外部 cron 排程 |
| CDN | Vercel Edge | 前端快速分發 |

---

## Cloud Scheduler 排程

### 當前 Jobs

| Job | Cron (UTC+8) | UTC | 端點 | 說明 |
|-----|-------------|-----|------|------|
| `memeforge-end-voting` | 每日 7:55 AM | 23:55 | POST `/api/scheduler/trigger/end_voting` | 結算投票、選出贏家 |
| `memeforge-lottery-draw` | 每日 7:56 AM | 23:56 | POST `/api/scheduler/trigger/lottery_draw` | 每日抽獎選出擁有者 |
| `memeforge-daily-cycle` | 每日 8:00 AM | 00:00 | POST `/api/scheduler/trigger/daily_cycle` | AI 生成新梗圖 + 開始投票 |

**執行順序**: end_voting (23:55) → lottery_draw (23:56) → daily_cycle (00:00)

1 分鐘間隔確保前一步驟完成再執行下一步。

### 管理指令

```bash
# 列出所有排程
gcloud scheduler jobs list --location=asia-southeast1

# 手動觸發 (測試用)
gcloud scheduler jobs run memeforge-end-voting --location=asia-southeast1

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

## Firestore Schema

### Collections

| Collection | Document ID | 用途 |
|------------|-------------|------|
| `users` | `{walletAddress}` | 用戶資料 |
| `memes` | `{memeId}` | 梗圖資料 |
| `votes` | `{voteId}` | 投票記錄 |
| `voting_periods` | `{periodId}` | 投票期間追蹤 |
| `voting_progress` | `{walletAddress}` | 用戶投票進度 |
| `platform_stats` | `current` | 平台統計 |
| `scheduler_logs` | `{logId}` | 排程執行日誌 |
| `hall_of_memes` | `{date}` | 歷史贏家 |

### Document Schemas

**users/{walletAddress}**
```javascript
{
  walletAddress: 'ABC123...xyz',
  weeklyTickets: 42,           // 當前持有 tickets
  totalTicketsAllTime: 350,    // 歷史總 tickets
  streakDays: 5,               // 連續投票天數
  lastVoteDate: '2026-02-18',  // 最後投票日
  lotteryOptIn: true,          // 預設 true，用戶可 toggle
  nftWins: [                   // 中獎記錄
    { memeId: 'meme_xxx', title: '...', selectedAt: '...', claimed: false }
  ]
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
  // 抽獎贏家 (lottery_draw 設定)
  nftOwner: {
    walletAddress: 'ABC123...xyz',
    selectedAt: '2026-02-19T00:00:00Z',
    claimTxSignature: null,    // Claim 後填入
    claimedAt: null,           // Claim 後填入
    mintAddress: null           // NFT mint address
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

### Firestore 索引

| Collection | Fields Indexed | 用途 |
|-----------|----------------|------|
| `memes` | status ↑, type ↑, generatedAt ↓ | 查詢今日活躍梗圖 |

---

## 部署環境

### 環境分離

| 環境 | Frontend | Backend | Database |
|-----|----------|---------|----------|
| Development | http://165.22.136.40:5173 | localhost:3001 (DEV_MODE) | Mock Data |
| Production | https://solana-hacker.vercel.app | Cloud Run | Firestore |

### 環境變數位置

| 用途 | 檔案路徑 |
|------|---------|
| Backend (Cloud Run) | `app/backend/.env` + Cloud Run env vars |
| Frontend (Vercel) | `app/.env.local` + Vercel env vars |
| Agent (DigitalOcean) | `agent/.env` |

### Cloud Run 部署

```bash
cd /home/projects/solanahacker/app/backend
gcloud run deploy memeforge-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated

# 確認流量路由到最新版本
gcloud run services update-traffic memeforge-api \
  --region asia-southeast1 --to-latest
```

**重要**: 使用 `--update-env-vars` 而非 `--set-env-vars`，避免覆蓋既有環境變數。

### 健康檢查

```bash
curl https://memeforge-api-836651762884.asia-southeast1.run.app/health
# 預期: {"status":"healthy"}

curl https://memeforge-api-836651762884.asia-southeast1.run.app/api/memes/today
# 預期: {"success":true,"memes":[...],"count":3}
```

### GCS 儲存

- **Bucket**: `memeforge-images-web3ai`
- **路徑**: `memes/{filename}.png`
- **存取**: Uniform Bucket-Level Access (IAM public read)

---

## 專案結構

```
/home/projects/solanahacker/
├── agent/                    # Agent 程式碼
│   └── .env                  # Agent 環境變數
├── app/
│   ├── src/                  # Frontend (React + Vite)
│   │   ├── components/       # UI 組件
│   │   ├── hooks/            # React Hooks
│   │   └── services/         # Firebase + API 服務層
│   ├── backend/              # Backend (Express + Firebase)
│   │   ├── server.js         # 主入口
│   │   ├── routes/           # API 路由
│   │   ├── services/         # 業務邏輯 (schedulerService.js)
│   │   ├── controllers/      # 控制器
│   │   └── .env              # Backend 環境變數
│   ├── public/               # 靜態資源
│   └── index.html            # OG meta tags
├── docs/
│   ├── product.md            # 產品文件
│   ├── beta.md               # 本文件 (技術 + 實作規劃)
│   ├── mvp.md                # MVP 技術細節
│   └── _transient/           # 過渡性文件
└── memory/                   # Agent 記憶
```

### 關鍵 Frontend 檔案

| 檔案 | 用途 |
|------|------|
| `src/services/firebase.js` | Firebase Client SDK + 即時監聽 |
| `src/services/memeService.js` | Firebase 優先 + Cloud Run fallback |
| `src/hooks/useFirebase.js` | useTodayMemes, useVoteStats 等 |
| `src/components/ForgeTab.jsx` | 主投票頁面 |
| `src/components/GalleryTab.jsx` | 歷史梗圖展示 |
| `src/components/MemeModal.jsx` | 梗圖大圖 + 投票 + 分享 |
| `src/components/ModalOverlay.jsx` | Modal 基礎組件 |

### 關鍵 Backend 檔案

| 檔案 | 用途 |
|------|------|
| `backend/services/schedulerService.js` | 排程任務邏輯 |
| `backend/controllers/memeController.js` | 梗圖 CRUD |
| `backend/routes/scheduler.js` | 排程 API 路由 |
| `backend/routes/og.js` | OG Card 圖片生成 |

---

## Phase 1: 每日抽獎 (Daily Lottery)

### 目標
實作每日抽獎機制。投票結算後，從所有「參與」狀態的錢包中根據 ticket 持有量加權隨機抽選 1 位贏家。

### 流程

```
23:55 UTC: end_voting → 選出每日贏家梗圖 (最高票)
    ↓
23:56 UTC: lottery_draw
    ├─ 查詢所有 lotteryOptIn=true 的用戶
    ├─ 計算每人 tickets 權重
    ├─ 加權隨機選出 1 位贏家
    ├─ 更新 meme.nftOwner = { walletAddress, selectedAt }
    ├─ 更新 user.nftWins[] (方便查「我的 NFTs」)
    └─ 所有參與者 weeklyTickets 歸零
    ↓
00:00 UTC: daily_cycle → AI 生成新梗圖 + 開始投票
```

### Backend 實作

```javascript
// schedulerService.js — lottery_draw
async runDailyLottery() {
  // 1. 找到今日贏家梗圖
  const todaysMemes = await this.getTodaysMemes();
  const winnerMeme = todaysMemes.sort((a, b) =>
    (b.votes?.selection?.yes || 0) - (a.votes?.selection?.yes || 0)
  )[0];
  if (!winnerMeme || (winnerMeme.votes?.selection?.yes || 0) === 0) {
    return; // 無投票 → 不抽獎
  }

  // 2. 查詢所有參與抽獎的用戶
  const participants = await db.collection('users')
    .where('lotteryOptIn', '==', true)
    .where('weeklyTickets', '>', 0)
    .get();
  if (participants.empty) return; // 無人參與

  // 3. 建立加權抽獎池
  const pool = [];
  participants.forEach(doc => {
    const user = doc.data();
    for (let i = 0; i < user.weeklyTickets; i++) {
      pool.push(doc.id); // walletAddress
    }
  });

  // 4. 隨機抽選
  const selectedWallet = pool[Math.floor(Math.random() * pool.length)];

  // 5. 更新 meme nftOwner
  await db.collection('memes').doc(winnerMeme.id).update({
    nftOwner: {
      walletAddress: selectedWallet,
      selectedAt: new Date().toISOString(),
      claimTxSignature: null,
      claimedAt: null,
      mintAddress: null
    }
  });

  // 6. 更新 user nftWins
  await db.collection('users').doc(selectedWallet).update({
    nftWins: FieldValue.arrayUnion({
      memeId: winnerMeme.id,
      title: winnerMeme.title,
      selectedAt: new Date().toISOString(),
      claimed: false
    })
  });

  // 7. 所有參與者 tickets 歸零
  const batch = db.batch();
  participants.forEach(doc => {
    batch.update(doc.ref, { weeklyTickets: 0 });
  });
  await batch.commit();
}
```

### Frontend 變更

1. **ForgeTab**: 新增 lottery opt-in/opt-out toggle
2. **Dashboard**: 新增「My NFTs」— 顯示贏得的梗圖和 Claim 按鈕
3. **MemeModal / Gallery**: 贏家梗圖顯示 Owner badge

### 驗收標準

- [ ] 每日 lottery_draw 自動執行
- [ ] 根據 tickets 加權隨機抽選
- [ ] 用戶可 toggle 參與/不參與
- [ ] 不參與者 tickets 不歸零，持續累積
- [ ] 參與者抽獎後 tickets 歸零
- [ ] 邊界: 0 參與者 → 無贏家; 1 參與者 → 自動中獎; 0 投票 → 不抽獎

---

## Phase 2: NFT Claim & 鑄造

### 目標
抽獎贏家可以 Claim 梗圖，鑄造為 Solana NFT。圖片上傳 Arweave 永久儲存，使用 Metaplex Standard。

### 流程

```
贏家打開 Dashboard → 看到 "Claim NFT" 按鈕
    ↓
點擊 Claim → 系統上傳圖片至 Arweave → 取得永久 URI
    ↓
建構 Metaplex NFT metadata → 上傳至 Arweave
    ↓
建構 Solana mint transaction → 用戶簽名 + 支付 gas (~0.01 SOL)
    ↓
交易確認:
  meme.status → 'minted'
  meme.nftOwner.mintAddress → NFT public key
  meme.nftOwner.claimTxSignature → tx signature
  meme.nftOwner.claimedAt → timestamp
```

### NFT Metadata (Metaplex Standard)

```json
{
  "name": "MemeForge #001 — When Solana Hits $200",
  "symbol": "MFORGE",
  "description": "AI-generated meme voted by the MemeForge community.",
  "image": "https://arweave.net/xxx",
  "external_url": "https://aimemeforge.io/meme/meme_xxx",
  "attributes": [
    { "trait_type": "Rarity", "value": "Legendary" },
    { "trait_type": "Art Style", "value": "Classic Oil Painting" },
    { "trait_type": "Vote Count", "value": 42 },
    { "trait_type": "Generation Date", "value": "2026-02-18" },
    { "trait_type": "AI Model", "value": "Gemini 3 Pro" }
  ],
  "properties": {
    "category": "image",
    "creators": [
      { "address": "PLATFORM_WALLET", "share": 0 },
      { "address": "WINNER_WALLET", "share": 100 }
    ]
  }
}
```

### Meme 狀態機

```
active → voting_active → voting_completed → winner → minted
                                              ↑
                                        lottery_draw 設定
```

- `minted` 為終態，拒絕任何後續操作
- `winner` + `claimedAt === null` = 等待 claim
- Firestore transaction guard 防止 double mint

### Backend API

**`POST /api/nft/prepare-mint`**
```javascript
// 1. 驗證 caller = nftOwner
// 2. 驗證 status !== 'minted'
// 3. Firestore transaction: status → 'minting_in_progress'
// 4. 上傳圖片至 Arweave
// 5. 上傳 metadata 至 Arweave
// 6. 建構 unsigned mint transaction
// 7. 回傳 serialized transaction
```

**`POST /api/nft/confirm-mint`**
```javascript
// 1. 驗證 tx signature on-chain
// 2. 更新 Firestore: status → 'minted'
// 3. 更新 users: claimed → true
```

### 技術依賴

| 套件 | 用途 |
|------|------|
| `@metaplex-foundation/mpl-token-metadata` | NFT metadata |
| `@metaplex-foundation/umi` | Metaplex framework |
| `@irys/sdk` | Arweave 上傳 |
| `@solana/web3.js` | Transaction 建構 |

### 新增環境變數

| Key | 說明 |
|-----|------|
| `ARWEAVE_WALLET_KEY` | Arweave/Irys 上傳金鑰 |
| `SOLANA_RPC_URL` | Solana RPC endpoint |
| `PLATFORM_WALLET_KEYPAIR` | 平台錢包 keypair |

### 驗收標準

- [ ] 贏家 Dashboard 顯示 "Claim NFT"
- [ ] 圖片上傳 Arweave 取得永久 URI
- [ ] NFT metadata 符合 Metaplex Standard
- [ ] 用戶簽名後 NFT 出現在錢包
- [ ] Meme status 更新為 'minted'
- [ ] 併發 claim 不會 double mint
- [ ] Solana Explorer 可查看 NFT

---

## Phase 3: SPL Token 門檻

### 目標
發行 SPL Token，投票需持有最低餘額。防止多錢包 Sybil Attack。

### Token 資訊
- Standard: SPL Token
- Name: MemeForge Token
- Symbol: $MFORGE
- Decimals: 6

### 門檻機制

```
投票前:
  1. 前端讀取錢包 $MFORGE 餘額
  2. 後端 /api/voting/vote 驗證鏈上餘額 >= 100 $MFORGE
  3. 不足 → 引導取得方式
```

### Token 分發

| 方式 | 說明 |
|------|------|
| Airdrop | 早期用戶空投 |
| Vote-to-Earn | 投票獲得少量 token |
| DEX | Raydium/Jupiter 上架 |

### 新增環境變數

| Key | 說明 |
|-----|------|
| `MFORGE_TOKEN_MINT` | Token mint address |
| `MIN_TOKEN_BALANCE` | 最低持有量 (default: 100) |

### 驗收標準

- [ ] Token 部署至 Solana
- [ ] 投票 API 驗證鏈上餘額
- [ ] 餘額不足顯示引導
- [ ] 至少一種分發機制可運作
- [ ] 門檻可動態調整

---

## 防刷機制

```javascript
// 投票 API
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

  // 4. 寫入
  await db.collection('votes').add({ memeId, vote, walletAddress, timestamp: new Date() });
  res.json({ success: true });
});
```

---

## 投票獎勵機制

```
投票 → 隨機 8-15 tickets → 更新 weeklyTickets + totalTicketsAllTime
                        → 計算 streakDays (連續+1 或重置)
                        → 記錄 lastVoteDate
```

---

## 同步與部署流程

### Local → GitHub

```bash
# 1. SCP 到 droplet
scp app/backend/services/schedulerService.js \
  root@165.22.136.40:/home/projects/solanahacker/app/backend/services/

# 2. SSH commit + push
ssh root@165.22.136.40 \
  "cd /home/projects/solanahacker && git add -A && git commit -m 'message' && git push origin main"

# 3. Vercel 自動部署 (frontend)
# 4. Cloud Run 手動部署 (backend)
```

### Cloud Run 部署

```bash
ssh root@165.22.136.40
cd /home/projects/solanahacker/app/backend
gcloud run deploy memeforge-api --source . --region asia-southeast1 --allow-unauthenticated
gcloud run services update-traffic memeforge-api --region asia-southeast1 --to-latest
```
