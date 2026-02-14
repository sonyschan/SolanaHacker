# AI MemeForge Product Documentation

## Overview

AI MemeForge (aimemeforge.io) 是一個 AI 驅動的迷因 NFT 民主投票平台，用戶透過投票決定迷因的稀有度，並有機會獲得 SOL 獎勵。

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                        │
│                  https://solana-hacker.vercel.app               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloud Run API (GCP)                         │
│      https://memeforge-api-836651762884.asia-southeast1.run.app │
│                                                                 │
│  Endpoints:                                                     │
│  - /api/memes/today          獲取今日梗圖 (limit 3)             │
│  - /api/memes/generate-daily 生成每日梗圖 (Gemini AI)           │
│  - /api/voting/vote          提交投票                           │
│  - /api/stats                獲取平台統計                       │
│  - /api/users/{wallet}       獲取/創建用戶                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    Firestore     │  │   GCS Bucket     │  │    Gemini AI     │
│   (Database)     │  │ (Image Storage)  │  │ (Meme Generator) │
│                  │  │                  │  │                  │
│ Collections:     │  │ memeforge-images │  │ gemini-3-pro     │
│ - memes          │  │ -web3ai/memes/   │  │ -image-preview   │
│ - users          │  │                  │  │                  │
│ - votes          │  │ Public URL:      │  │                  │
│ - platform_stats │  │ storage.google   │  │                  │
│                  │  │ apis.com/...     │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Core Features

### 1. Daily Meme Generation
- 每天 8:00 AM UTC 自動生成 3 個 AI 梗圖
- 使用 Gemini 3 Pro Image Preview 模型
- 圖片儲存在 GCS，URL 永久有效

### 2. Community Voting (Score-Based Rarity System v2)

**投票流程:**
1. **Phase 1 - Selection**: 從每日 3 張梗圖中選擇最喜歡的一張
2. **Phase 2 - Rating**: 使用滑桿 (1-10) 為選中的梗圖評分

**Rarity 計算:**
- 使用歷史 percentile 分佈決定稀有度
- 5 個等級: Common (40%) → Uncommon (25%) → Rare (20%) → Epic (10%) → Legendary (5%)
- 詳見 `docs/beta.md` 的完整設計

**獎勵機制:**
- 每次投票獲得 8-15 隨機 tickets
- 連續投票增加 streak days

### 3. Weekly Lottery
- 每週日進行抽獎
- 獎池來自 NFT 拍賣收益
- 抽獎後所有用戶 weeklyTickets 歸零

### 4. NFT Minting
- 投票最高的梗圖鑄造為 NFT
- 稀有度由投票決定
- 拍賣收益進入獎池

## Environment Variables

### Cloud Run
```
NODE_ENV=production
FIREBASE_PROJECT_ID=web3ai-469609
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@web3ai-469609.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=...
GEMINI_API_KEY=...
GCS_BUCKET_NAME=memeforge-images-web3ai
GOOGLE_CLOUD_PROJECT_ID=web3ai-469609
```

### Vercel
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=web3ai-469609.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=web3ai-469609
VITE_FIREBASE_STORAGE_BUCKET=web3ai-469609.appspot.com
VITE_API_BASE_URL=https://memeforge-api-836651762884.asia-southeast1.run.app
```

## Data Flow

### Meme Display Flow
1. Frontend 呼叫 `/api/memes/today`
2. API 從 Firestore 查詢今日 memes (type=daily, status=active, limit=3)
3. 回傳 memes 包含 GCS 圖片 URL
4. 瀏覽器直接從 GCS 載入圖片

### Voting Flow
1. 用戶點擊投票按鈕
2. Frontend 呼叫 `/api/voting/vote`
3. API 更新 meme 投票數
4. API 更新用戶資料 (tickets + streak)
5. API 呼叫 `/api/stats/increment-voters`
6. 回傳投票結果和獲得的 tickets

## Last Updated
2026-02-14
