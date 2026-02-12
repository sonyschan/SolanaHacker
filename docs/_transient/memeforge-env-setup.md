# MemeForge 環境配置指南

## ✅ 已完成設置

### 1. Agent 環境 (`agent/.env`)
```
GEMINI_API_KEY=已配置 ✅
```

### 2. GCP 專案
```
Project ID: web3ai-469609
Region: asia-southeast1
Firestore: 已建立 (asia-southeast1) ✅
```

### 3. 已啟用的 GCP 服務
- ✅ Cloud Run
- ✅ Cloud Scheduler
- ✅ Cloud Build
- ✅ Artifact Registry
- ✅ Firestore
- ✅ Cloud Storage

---

## 🔧 需要 Agent 完成的設置

### 1. 建立 Cloud Run 後端服務

後端目錄: `/home/projects/solanahacker/app/backend/`

建立 `backend/package.json`:
```json
{
  "name": "memeforge-api",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@google-cloud/firestore": "^7.0.0",
    "@google/generative-ai": "^0.2.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

建立 `backend/Dockerfile`:
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

### 2. 部署到 Cloud Run

```bash
# 在 backend/ 目錄執行
gcloud run deploy memeforge-api \
  --source . \
  --project=web3ai-469609 \
  --region=asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY}"
```

部署後的 URL 格式:
`https://memeforge-api-836651762884.asia-southeast1.run.app`

### 3. 前端環境變數

建立 `app/.env.local`:
```
VITE_API_BASE_URL=https://memeforge-api-836651762884.asia-southeast1.run.app
VITE_FIREBASE_PROJECT_ID=web3ai-469609
VITE_FIREBASE_API_KEY=需要從 Firebase Console 取得
```

### 4. Vercel 部署

在專案根目錄建立 `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://memeforge-api-836651762884.asia-southeast1.run.app/api/:path*"
    }
  ]
}
```

### 5. Cloud Scheduler 設置

```bash
# 每日 UTC 00:00 生成梗圖
gcloud scheduler jobs create http daily-meme-generation \
  --project=web3ai-469609 \
  --location=asia-southeast1 \
  --schedule="0 0 * * *" \
  --uri="https://memeforge-api-xxx.asia-southeast1.run.app/api/cron/generate-memes" \
  --http-method=POST

# 每週日 UTC 00:00 開獎
gcloud scheduler jobs create http weekly-lottery \
  --project=web3ai-469609 \
  --location=asia-southeast1 \
  --schedule="0 0 * * 0" \
  --uri="https://memeforge-api-xxx.asia-southeast1.run.app/api/cron/lottery" \
  --http-method=POST
```

---

## 📁 Firestore 結構

```
/users/{walletAddress}
  - consecutiveDays: number
  - lastVoteDate: timestamp
  - totalTickets: number

/votes/{date}_{walletAddress}
  - memeId: string
  - voteType: 'step1' | 'step2'
  - choice: string
  - timestamp: timestamp

/voteStats/{memeId}
  - common: number
  - rare: number
  - legendary: number

/tickets/{date}_{walletAddress}
  - tickets: number
  - consecutiveDays: number
  - date: timestamp

/memes/{date}
  - memes: array of { id, imageUrl, prompt, type }
  - generatedAt: timestamp
```

---

## 🔑 重要資訊

| 項目 | 值 |
|-----|-----|
| GCP Project ID | `web3ai-469609` |
| Region | `asia-southeast1` |
| Firestore Database | `(default)` |
| Cloud Run URL Pattern | `https://{service}-836651762884.asia-southeast1.run.app` |

---

## ⚠️ 注意事項

1. **Firebase Console 設置**: 需要 H2Crypto 手動在 Firebase Console 建立 Web App 來取得 API Key
2. **Vercel 部署**: 需要 H2Crypto 手動 import GitHub repo 到 Vercel
3. **Secret 管理**: 後端環境變數通過 Cloud Run 設置，不要 commit 到 git

