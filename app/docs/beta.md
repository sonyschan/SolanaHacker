# MemeForge Beta — 三階段實作規劃書

> 基於 MVP 的投票系統，漸進式引入 NFT 擁有權、鏈上鑄造、代幣門檻

*最後更新: 2026-02-18*

---

## 當前部署狀態

| 服務 | URL | 狀態 |
|-----|-----|------|
| Frontend | https://solana-hacker.vercel.app | Running |
| Backend API | https://memeforge-api-836651762884.asia-southeast1.run.app | Running |
| Firestore | web3ai-469609 | Indexed |
| Cloud Scheduler | memeforge-daily-cycle (8AM UTC+8) | Active |

---

## Beta Phase 1: Encourage Human Votes

### 目標
投票即有機會成為 NFT 擁有者。每日勝出 Meme 選出後，從當日所有投票者中隨機抽選一位，儲存其 wallet address 供後續 NFT 鑄造。

### 流程

```
每日 8:00 AM (UTC+8): AI 生成 3 個 Meme → 開始投票
        ↓
用戶連接錢包 → 投票選出最喜歡的 Meme → 獲得 tickets
        ↓
隔日 7:55 AM: 結算投票 → 選出勝出 Meme (最高票)
        ↓
從所有當日投票者中隨機抽選 1 位 → 記錄為 NFT Owner
        ↓
更新勝出 Meme 狀態:
  status: 'winner'
  nftOwner: { walletAddress, selectedAt, claimedAt: null }
```

### Firestore Schema 變更

**memes collection — 新增欄位:**

```javascript
{
  // 既有欄位 (不變)
  id: 'meme_xxx',
  type: 'daily',
  status: 'active' | 'voting_active' | 'voting_completed' | 'winner' | 'minted',
  generatedAt: '2026-02-18T00:00:00.000Z',
  title: 'Meme Title',
  imageUrl: 'https://storage.googleapis.com/...',
  votes: { selection: { yes: 42, no: 10 } },

  // Phase 1 新增
  nftOwner: {
    walletAddress: 'ABC123...xyz',    // 中獎者錢包地址
    selectedAt: '2026-02-19T00:00:00Z', // 抽選時間
    claimTxSignature: null,             // Phase 2: claim 交易簽名
    claimedAt: null,                    // Phase 2: claim 時間
    mintAddress: null                   // Phase 2: NFT mint address
  }
}
```

**votes collection — 確認結構 (不變):**

```javascript
{
  memeId: 'meme_xxx',
  walletAddress: 'ABC123...xyz',
  vote: 'yes',
  timestamp: '2026-02-18T10:30:00.000Z'
}
```

### Backend 實作

**新增 API endpoint: `POST /api/scheduler/trigger/select_winner`**

```javascript
// schedulerService.js — 新增 selectDailyWinner()
async selectDailyWinner() {
  // 1. 找到昨日勝出 Meme (投票最高)
  const yesterday = getYesterdayDate(); // UTC+8 adjusted
  const memes = await getTodaysMemes(yesterday);
  const winner = memes.sort((a, b) =>
    (b.votes?.selection?.yes || 0) - (a.votes?.selection?.yes || 0)
  )[0];

  // 2. 取得所有昨日投票者的 wallet addresses (去重)
  const votesSnapshot = await db.collection('votes')
    .where('timestamp', '>=', startOfDay)
    .where('timestamp', '<=', endOfDay)
    .get();
  const uniqueVoters = [...new Set(
    votesSnapshot.docs.map(doc => doc.data().walletAddress)
  )];

  // 3. 隨機抽選 1 位
  const selectedWallet = uniqueVoters[
    Math.floor(Math.random() * uniqueVoters.length)
  ];

  // 4. 更新勝出 Meme
  await db.collection('memes').doc(winner.id).update({
    status: 'winner',
    nftOwner: {
      walletAddress: selectedWallet,
      selectedAt: new Date().toISOString(),
      claimTxSignature: null,
      claimedAt: null,
      mintAddress: null
    }
  });

  // 5. 記錄到 users collection (方便查詢「我贏了哪些 NFT」)
  await db.collection('users').doc(selectedWallet).update({
    nftWins: FieldValue.arrayUnion({
      memeId: winner.id,
      title: winner.title,
      selectedAt: new Date().toISOString(),
      claimed: false
    })
  });
}
```

**Cloud Scheduler 新增排程:**

| Job | 時間 | 端點 | 說明 |
|-----|------|------|------|
| `memeforge-select-winner` | 每日 7:56 AM (UTC+8) | POST `/api/scheduler/trigger/select_winner` | 結算後 1 分鐘抽選 NFT Owner |

執行順序: `end_voting` (7:55) → `select_winner` (7:56) → `daily_cycle` (8:00)

### Frontend 變更

1. **ForgeTab**: 勝出 Meme 顯示 NFT Owner badge (截斷 wallet address)
2. **GalleryTab**: 歷史 Meme 顯示 Owner 和 claim 狀態
3. **Dashboard**: 新增「My NFTs」區域 — 顯示用戶贏得的 NFT 列表和 claim 按鈕 (Phase 2 啟用)

### Phase 1 驗收標準

- [ ] 每日投票結算後自動選出勝出 Meme
- [ ] 從所有投票者中隨機抽選 1 位，wallet address 寫入 DB
- [ ] Gallery 顯示歷史 winner 和 owner
- [ ] 用戶 Dashboard 顯示自己贏得的 NFT (pending claim)
- [ ] 邊界情況處理：0 投票者、僅 1 投票者、平票

---

## Beta Phase 2: NFT Minting

### 目標
中獎者可以 claim 勝出 Meme 的 NFT。系統將圖片上傳至 Arweave，鑄造為 Solana NFT (Metaplex Standard)，中獎者支付 gas 費。已鑄造的 Meme 標記為 `minted` 防止重複。

### 流程

```
中獎者打開 Dashboard → 看到 "Claim NFT" 按鈕
        ↓
點擊 Claim → 前端建構 mint transaction
        ↓
系統上傳 Meme 圖片至 Arweave → 取得永久 URI
        ↓
建構 Metaplex NFT metadata → 上傳至 Arweave
        ↓
建構 Solana mint transaction → 用戶簽名 + 支付 gas (~0.01 SOL)
        ↓
交易確認後:
  - Meme status → 'minted'
  - nftOwner.mintAddress → NFT mint public key
  - nftOwner.claimTxSignature → transaction signature
  - nftOwner.claimedAt → timestamp
```

### NFT Metadata (Metaplex Standard)

```json
{
  "name": "MemeForge #001 — Meme Season Calls",
  "symbol": "MFORGE",
  "description": "AI-generated meme voted by the MemeForge community. Winner selected on 2026-02-18.",
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

### 技術依賴

| 套件 | 用途 |
|------|------|
| `@metaplex-foundation/mpl-token-metadata` | NFT metadata program |
| `@metaplex-foundation/umi` | Metaplex framework |
| `@irys/sdk` (formerly Bundlr) | Arweave 上傳 |
| `@solana/web3.js` | Solana transaction 建構 |

### Backend API

**`POST /api/nft/prepare-mint`** — 準備 mint 交易 (server-side)
```javascript
// 1. 驗證 caller 是 nftOwner
// 2. 驗證 meme status !== 'minted'
// 3. 上傳圖片至 Arweave
// 4. 上傳 metadata JSON 至 Arweave
// 5. 建構 unsigned mint transaction
// 6. 回傳 serialized transaction 給前端簽名
```

**`POST /api/nft/confirm-mint`** — 確認 mint 完成
```javascript
// 1. 驗證 transaction signature on-chain
// 2. 更新 Firestore: status → 'minted', 記錄 mintAddress
// 3. 更新 users collection: claimed → true
```

### Meme Status 狀態機

```
active → voting_active → voting_completed → winner → minted
                                              ↑
                                        (Phase 1 設定)
```

- `minted` 為終態，任何 endpoint 收到 `minted` 狀態的 meme 一律拒絕操作
- `winner` + `nftOwner.claimedAt === null` = 等待 claim
- `winner` + `nftOwner.claimedAt !== null` = 異常 (已 claim 但未 minted，需排查)

### 防重複鑄造機制

```javascript
// memeController.js 或 nftController.js
async function prepareMint(req, res) {
  const meme = await db.collection('memes').doc(memeId).get();

  // Guard 1: 狀態檢查
  if (meme.data().status === 'minted') {
    return res.status(400).json({ error: 'Already minted' });
  }

  // Guard 2: Owner 檢查
  if (meme.data().nftOwner?.walletAddress !== callerWallet) {
    return res.status(403).json({ error: 'Not the NFT owner' });
  }

  // Guard 3: Firestore transaction (atomic)
  await db.runTransaction(async (t) => {
    const fresh = await t.get(db.collection('memes').doc(memeId));
    if (fresh.data().status === 'minted') throw new Error('Race condition');
    t.update(db.collection('memes').doc(memeId), {
      status: 'minting_in_progress'
    });
  });

  // Proceed with Arweave upload + transaction building...
}
```

### Phase 2 驗收標準

- [ ] 中獎者可以在 Dashboard 看到 "Claim NFT" 按鈕
- [ ] 圖片成功上傳至 Arweave 並取得永久 URI
- [ ] NFT metadata 符合 Metaplex Standard
- [ ] 用戶簽名交易後 NFT 出現在其錢包
- [ ] Meme status 更新為 `minted`，無法再次 claim
- [ ] 併發 claim 請求不會造成 double mint (Firestore transaction guard)
- [ ] Solana Explorer 上可查看 NFT 詳情

---

## Beta Phase 3: Token Gated

### 目標
發行 SPL Token，要求投票者持有最低餘額門檻，防止多錢包 Sybil Attack。

### 設計

**Token 資訊:**
- Standard: SPL Token (Token-2022 optional)
- Name: MemeForge Token
- Symbol: $MFORGE
- Decimals: 6
- Initial Supply: TBD (根據用戶規模決定)

**門檻機制:**
```
投票前檢查:
  1. 前端: 讀取用戶錢包的 $MFORGE 餘額
  2. 後端: /api/voting/vote 驗證鏈上餘額 >= MINIMUM_BALANCE
  3. 不足: 顯示「需持有 X $MFORGE 才能投票」+ 取得方式引導
```

**最低持有量:**
- 投票門檻: 100 $MFORGE (可通過 config 調整)
- 不需要 staking/lock，僅需持有
- 後端透過 `@solana/web3.js` getTokenAccountsByOwner 驗證

### Token 分發方式 (待定)

| 方式 | 說明 |
|------|------|
| Airdrop | 對早期 Beta 用戶空投初始 token |
| Vote-to-Earn | 每次投票獲得少量 token (取代或補充 tickets) |
| DEX Listing | 上架 Raydium/Jupiter 供購買 |

### Backend 驗證

```javascript
// votingController.js — 新增 token 餘額檢查
const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const MFORGE_MINT = new PublicKey('TOKEN_MINT_ADDRESS');
const MIN_BALANCE = 100_000_000; // 100 tokens * 10^6 decimals

async function verifyTokenBalance(walletAddress) {
  const connection = new Connection(process.env.SOLANA_RPC_URL);
  const wallet = new PublicKey(walletAddress);

  const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
    mint: MFORGE_MINT
  });

  if (tokenAccounts.value.length === 0) return 0;

  const balance = tokenAccounts.value[0].account.data.parsed
    .info.tokenAmount.amount;
  return parseInt(balance);
}
```

### Phase 3 驗收標準

- [ ] SPL Token 成功部署至 Solana (devnet → mainnet)
- [ ] 投票 API 驗證鏈上 token 餘額
- [ ] 餘額不足時前端顯示引導訊息
- [ ] Token 分發機制至少一種可運作
- [ ] 最低門檻可通過 config 動態調整

---

## 排程系統 (更新)

### Cloud Scheduler Jobs

| Job | 時間 (UTC+8) | 端點 | Phase |
|-----|-------------|------|-------|
| `memeforge-end-voting` | 每日 7:55 AM | POST `/api/scheduler/trigger/end_voting` | MVP |
| `memeforge-select-winner` | 每日 7:56 AM | POST `/api/scheduler/trigger/select_winner` | Beta P1 |
| `memeforge-daily-cycle` | 每日 8:00 AM | POST `/api/scheduler/trigger/daily_cycle` | MVP |
| `memeforge-lottery-draw` | 每週日 8:00 PM | POST `/api/scheduler/trigger/lottery_draw` | MVP |

### 管理指令

```bash
# 列出所有排程
gcloud scheduler jobs list --location=asia-southeast1

# 新增 winner 抽選 job
gcloud scheduler jobs create http memeforge-select-winner \
  --location=asia-southeast1 \
  --schedule="56 7 * * *" \
  --time-zone="Asia/Taipei" \
  --uri="https://memeforge-api-836651762884.asia-southeast1.run.app/api/scheduler/trigger/select_winner" \
  --http-method=POST \
  --headers="Content-Type=application/json"

# 手動觸發測試
gcloud scheduler jobs run memeforge-select-winner --location=asia-southeast1
```

---

## 部署注意事項

### Cloud Run 部署
```bash
# 使用 deploy.sh 確保 env vars 不被覆蓋
cd /home/projects/solanahacker/app/backend && ./deploy.sh
```

**重要: 永遠使用 `--env-vars-file` 或 `--update-env-vars`，禁止使用 `--set-env-vars` 避免覆蓋既有環境變數。**

### Phase 2 新增環境變數

| Key | 說明 |
|-----|------|
| `ARWEAVE_WALLET_KEY` | Arweave/Irys 上傳金鑰 |
| `SOLANA_RPC_URL` | Solana RPC (mainnet-beta for production) |
| `PLATFORM_WALLET_KEYPAIR` | 平台錢包 keypair (用於建構 mint tx) |

### Phase 3 新增環境變數

| Key | 說明 |
|-----|------|
| `MFORGE_TOKEN_MINT` | $MFORGE SPL Token mint address |
| `MIN_TOKEN_BALANCE` | 投票最低持有量 (default: 100) |
