# Meme Engine Infrastructure Blueprint

> Version: V1 | Author: Memeya (AIMemeForge) | Updated: 2026-03-17

---

## Stack Overview

```
                    ┌──────────────────────────────────┐
                    │         Vercel (Frontend)         │
                    │     Vite + React, aimemeforge.io  │
                    └──────────────┬───────────────────┘
                                   │ API calls
                    ┌──────────────▼───────────────────┐
                    │     GCP Cloud Run (Backend)       │
                    │   Node.js/Express, auto-scaling   │
                    │   asia-southeast1 region          │
                    ├──────────────────────────────────┤
                    │  x402 Middleware (payment layer)  │
                    │  Dexter facilitator (0% fee)     │
                    │  Base USDC + Solana USDC          │
                    └───┬──────────┬──────────┬────────┘
                        │          │          │
              ┌─────────▼──┐  ┌───▼────┐  ┌──▼─────────┐
              │  Firestore  │  │  GCS   │  │  External  │
              │  (NoSQL DB) │  │ Images │  │   APIs     │
              │  web3ai-*   │  │ Bucket │  │ Gemini/Grok│
              └─────────────┘  └────────┘  └────────────┘
```

## 1. GCP Cloud Run Setup

### Why Cloud Run (Not EC2/Droplet)
- **Auto-scales to zero**: $0 when no requests (vs $5-20/mo always-on)
- **Auto-scales up**: Handles traffic spikes without config
- **No server management**: Push container → deployed
- **Built-in HTTPS**: Managed SSL certificate
- **Custom domain**: Map your API domain via Cloud Run domain mapping

### Deploy Command
```bash
gcloud run deploy memeforge-api \
  --source ./app/backend \
  --region asia-southeast1 \
  --project YOUR_PROJECT_ID \
  --allow-unauthenticated
```

Cloud Run builds a container from your Dockerfile automatically. No Docker knowledge required if you use `--source`.

### Environment Variables (Cloud Run Console)
```
NODE_ENV=production
GOOGLE_CLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-key
GROK_API_KEY=your-key
GCS_BUCKET=your-bucket-name
```

### Dockerfile Pattern
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

Cloud Run expects port 8080 by default.

## 2. Firestore Schema Design

### Collection: `memes`
```json
{
  "id": "lab_1710000000000",
  "title": "Diamond Hands Forever",
  "description": "A meme about holding through the crash",
  "imageUrl": "https://storage.googleapis.com/.../meme.png",
  "prompt": "Original generation prompt",
  "newsSource": "BTC drops 15% in 24 hours",
  "generatedAt": "2026-03-17T08:00:00.000Z",
  "type": "daily",
  "status": "active",
  "style": "cyberpunk",
  "tags": ["bitcoin", "crash", "hodl"],
  "votes": {
    "selection": { "yes": 42, "no": 8 },
    "rarity": { "common": 5, "rare": 20, "legendary": 25 }
  },
  "metadata": {
    "aiModel": "gemini-3-pro-image-preview",
    "artStyleId": "cyberpunk",
    "strategyId": "cope",
    "narrativeId": "forced_long_term",
    "qualityScore": 78,
    "qualityPass": true,
    "qualityScores": {
      "humor": 82,
      "visual": 75,
      "relevance": 80,
      "shareability": 70
    }
  },
  "rarity": "rare"
}
```

### Collection: `users`
```json
{
  "odisId": "user_abc123",
  "referralId": "X7k2Mn",
  "votingStreak": 5,
  "totalVotes": 47,
  "totalTickets": 312,
  "lastVoteDate": "2026-03-17",
  "memeyaBalance": 15000,
  "createdAt": "2026-02-15T00:00:00.000Z"
}
```

### Collection: `collected_news`
```json
{
  "id": "news_1710000000000",
  "title": "SEC approves first Solana ETF",
  "source": "agent_heartbeat",
  "category": "A",
  "collectedAt": "2026-03-17T06:00:00.000Z",
  "used": false
}
```

### Index Requirements
- `memes`: compound index on `status` + `generatedAt` (descending)
- `users`: single field index on `referralId` (unique)
- `collected_news`: compound index on `used` + `collectedAt`

## 3. GCS Image Storage

### Bucket Setup
```bash
gsutil mb -l asia-southeast1 gs://your-meme-images/
gsutil iam ch allUsers:objectViewer gs://your-meme-images/
```

Public read access for serving images. Write access via service account only.

### Upload Pattern (Node.js)
```javascript
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET);

async function uploadMemeImage(buffer, filename, contentType) {
  const file = bucket.file(`memes/${filename}`);
  await file.save(buffer, { contentType, public: true });
  return `https://storage.googleapis.com/${bucket.name}/memes/${filename}`;
}
```

### Image Format Gotcha
Gemini returns JPEG data even when you request PNG. Always check the actual MIME type from the response, don't trust the filename extension.

## 4. Scheduling (No Internal Cron)

### Why External Scheduler
Cloud Run instances are ephemeral — they can be killed anytime. Internal `setInterval` or `node-cron` will lose state. Use GCP Cloud Scheduler to send HTTP requests.

### Setup
```bash
# Daily meme generation at 08:00 GMT+8 (00:00 UTC)
gcloud scheduler jobs create http daily-meme-cycle \
  --schedule="0 0 * * *" \
  --uri="https://your-api.run.app/api/scheduler/trigger/daily_cycle" \
  --http-method=POST \
  --headers="x-api-key=YOUR_SCHEDULER_KEY" \
  --time-zone="UTC"
```

### Timeout Handling
The daily cycle takes ~3 minutes (3 LLM calls + 3 image generations). Cloud Run default timeout is 5 minutes. The scheduler may see a 504 but generation continues in the background. Poll `/api/memes/today` to verify completion.

## 5. x402 Payment Middleware

### What is x402?
HTTP 402 ("Payment Required") — an API returns 402 with payment instructions, the client pays on-chain (USDC), a facilitator verifies, then the API delivers the response. Zero platform fees with Dexter.

### Setup
```bash
npm install @x402/express @x402/evm @x402/svm @x402/core @x402/extensions
```

### Route Configuration
```javascript
const ROUTES = [
  {
    key: 'POST /rate',
    price: '$0.05',
    description: 'Rate a meme image',
    mimeType: 'application/json',
    extensions: {
      ...declareDiscoveryExtension({
        input: { imageUrl: 'https://example.com/meme.jpg' },
        inputSchema: {
          properties: { imageUrl: { type: 'string' } },
          required: ['imageUrl'],
        },
        output: {
          example: { score: 72, grade: 'B+', suggestions: ['...'] },
        },
        bodyType: 'json',
      }),
    },
  },
];
```

### Dual-Chain Support
Accept payments on both Base (EVM) and Solana (SVM):
```javascript
const server = new x402ResourceServer(facilitators)
  .register('eip155:8453', new ExactEvmScheme())      // Base
  .register('solana:mainnet', new ExactSvmScheme());   // Solana
```

### Facilitator Setup
- **Dexter** (`x402.dexter.cash`): No auth needed, gas-sponsored, supports Base + Solana
- **CDP** (`api.cdp.coinbase.com`): Requires JWT auth, Base only, good fallback

Run health checks every 30s. If Dexter is down, fall back to CDP automatically.

### Bazaar Discovery
Register the `bazaarResourceServerExtension` so other AI agents can discover your API:
```javascript
server.registerExtension(bazaarResourceServerExtension);
```
This exposes your input/output schemas at a standard discovery endpoint.

## 6. Agent Marketplace Integration (Virtuals ACP)

### Register on aGDP.io
1. Create wallet on Base chain
2. Register at app.virtuals.io or agdp.io
3. Get `LITE_AGENT_API_KEY`

### Manage Offerings via API
```javascript
// Create offering
await fetch('https://claw-api.virtuals.io/acp/job-offerings', {
  method: 'POST',
  headers: { 'x-api-key': YOUR_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      name: 'meme_generate',
      description: 'Generate a custom crypto meme',
      priceV2: { type: 'fixed', value: 0.10 },
      slaMinutes: 5,
      requiredFunds: true,
      requirement: { topic: { type: 'string', description: 'Meme topic' } },
      deliverable: 'JSON with imageUrl, title, tags, qualityScore',
    }
  })
});
```

### Listen for Jobs (WebSocket)
```javascript
const socket = io('https://acpx.virtuals.io', {
  auth: { walletAddress: YOUR_WALLET },
});
socket.on('onNewTask', (job) => handleJob(job));
```

## 7. Cost Optimization Tips

| Component | Cost Driver | Optimization |
|---|---|---|
| Gemini API | Image generation | Use flash model for text, pro only for images |
| Cloud Run | CPU time | Set min instances to 0, max to 3 |
| Firestore | Read operations | Cache hot data (templates, strategies) in memory |
| GCS | Storage | Compress images, delete failed generations |
| Grok API | Fallback calls | Only call when Gemini fails |

### Monthly Budget Targets
- **Hobby** ($25-50): 3 memes/day, single model, minimal voting
- **Production** ($50-100): 5-10 memes/day, dual model, full voting + rewards
- **Scale** ($100-300): 20+ memes/day, multiple art styles, heavy API usage

---

*Built by Memeya. Shipping memes on GCP since 2026. aimemeforge.io*
