# MemeForge - AI Meme NFT Voting Platform

## Project Overview

**MemeForge** is an AI-powered meme NFT voting platform where AI generates daily memes, users vote to determine rarity, and winners become NFTs. This is a hackathon project for the Colosseum Hackathon.

- **Repository**: https://github.com/sonyschan/SolanaHacker
- **Live Demo**: https://solana-hacker.vercel.app (Production)
- **Development**: http://165.22.136.40:5173 (Droplet)

---

## Environment Separation (CRITICAL)

| Environment | Frontend | Backend | Database | Purpose |
|-------------|----------|---------|----------|---------|
| **Development** | Droplet `165.22.136.40:5173` | `localhost:3001` (DEV_MODE) | Mock Data | Testing & Development |
| **Production** | Vercel `solana-hacker.vercel.app` | Cloud Run (GCP) | Firestore | Live Users |

### Infrastructure

- **DigitalOcean Droplet** (`165.22.136.40`): Development/staging environment, git operations
- **Vercel**: Frontend hosting (auto-deploys from GitHub `main` branch)
- **Google Cloud Run**: Backend API (`memeforge-api-836651762884.asia-southeast1.run.app`)
- **Firestore**: Production database
- **Google Cloud Storage**: Meme image storage (`memeforge-images-web3ai`)

---

## Development Workflow

### Where Operations Happen

| Operation | Location | Notes |
|-----------|----------|-------|
| Code editing & development | **Local** (`/private/tmp/solanahacker-audit`) | Pull from GitHub first |
| Deploy to Droplet | **Local** → Droplet | Use `rsync` |
| Deploy to Cloud Run | **Local** | Use `gcloud run deploy` |
| Git commit & push | **Droplet** (via SSH) | Commits appear from "SolanaHacker" agent |
| Git pull | **Local** or **Droplet** | Sync latest code |

### Standard Workflow

1. **Pull latest code locally**:
   ```bash
   git pull origin main
   ```

2. **Make changes locally** in `/private/tmp/solanahacker-audit`

3. **Sync to Droplet**:
   ```bash
   rsync -avz /private/tmp/solanahacker-audit/app/src/components/ root@165.22.136.40:/root/SolanaHacker/app/src/components/
   ```

4. **SSH into Droplet and commit** (commits appear from the agent):
   ```bash
   ssh root@165.22.136.40
   cd /root/SolanaHacker
   git add <files>
   git commit -m "feat: description"
   git push origin main
   ```

5. **Vercel auto-deploys** from GitHub

### Backend Deployment (Cloud Run)

```bash
cd /private/tmp/solanahacker-audit/app/backend
gcloud run deploy memeforge-api \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

---

## Key Paths

### Local Development
- Project root: `/private/tmp/solanahacker-audit`
- Frontend: `/private/tmp/solanahacker-audit/app/src`
- Backend: `/private/tmp/solanahacker-audit/app/backend`

### Droplet
- Project root: `/root/SolanaHacker`
- Frontend: `/root/SolanaHacker/app/src`
- Backend: `/root/SolanaHacker/app/backend`

---

## Architecture

```
Frontend (Vercel)                    Backend (Cloud Run)
solana-hacker.vercel.app    →       memeforge-api-...run.app
        │                                    │
        │  READ: Firebase SDK direct         │  WRITE: API calls
        │  (real-time subscriptions)         │  (vote, generate memes)
        │                                    │
        └────────────────┬───────────────────┘
                         │
                    Firestore + GCS
```

### Read/Write Separation
- **READ operations**: Frontend uses Firebase SDK directly for real-time updates
- **WRITE operations**: Frontend calls Cloud Run API (validation, rate limiting)

---

## Key Features

1. **AI Meme Generation**: Gemini 3 Pro Image API generates daily memes
2. **Two-Phase Voting**:
   - Phase 1: Select favorite meme
   - Phase 2: Rate rarity (1-10 slider)
3. **Ticket System**: 8-15 tickets per vote, weekly lottery
4. **Social Sharing**: X share buttons with OG image previews
5. **SSR Meme Pages**: `/meme/{id}` for SEO and social previews

---

## Important Notes

- **NEVER commit/push from local** - Always SSH into droplet for git operations
- **Hackathon context**: Commits should appear from "SolanaHacker" (the AI agent identity)
- **dist/ folder**: Build artifacts, generally not committed
- **Environment variables**: Stored in Cloud Run and Vercel, not in git
