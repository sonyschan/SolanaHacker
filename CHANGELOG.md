# Changelog

## [3.0.0] — 2026-04-04

### MemeNews Pivot — AI Judging replaces Human Voting

**Breaking Changes**
- Removed human voting, lottery, and USDC reward systems
- Removed wallet authentication requirement for viewing
- Removed Dashboard, ForgeTab, LotteryTab, ReferralTab, rarity system
- Removed i18n (multilingual support)

**Added**
- AI Judge Service: Gemini + GPT-4o + Grok batch-score 3 daily memes
- Scoring dimensions: Visual Quality, News Clarity, Meme Impact (0-10 each)
- Highest average score wins Meme of the Day
- North Star metrics injected into meme generation prompts
- MemeNews single-page frontend with editorial newspaper design (Playfair Display)
- Archive page with paginated history
- AI score display: per-judge scores + dimension breakdown bars
- Share to X button with intent URL + OG preview
- TG notifications for daily_memes and ai_judge scheduler tasks
- Cache invalidation after AI judging completes

**Changed**
- GCP Cloud Scheduler: 4 jobs → 2 (daily_memes + ai_judge)
- Frontend bundle: ~800KB → 218KB
- Backend API version: 1.0.0 → 2.0.0
- Meme documents: removed votes/rarity/mint_eligible fields
- RSS feed description updated for MemeNews
- Moltbook posting: winner-only with AI scores + MemeNews journalist style

**Infrastructure**
- Agent migrated from DigitalOcean droplet (~17K LOC) to Cloudflare Worker (~400 LOC)
- CF Worker `memenews-agent`: X posting (OAuth 1.0a), Moltbook, News Search
- Cron triggers: 10AM X post, 11AM Moltbook, every 6h news (all GMT+8)
- R2 bucket for state persistence
- DigitalOcean droplet decommissioned

## [1.x – 2.x] — 2025-12 to 2026-04

### AIMemeForge v1/v2 — Human Voting Era

- Daily AI-generated crypto memes (Gemini + Grok image generation)
- Human voting system: selection phase + rarity scoring (1-10)
- Daily lottery with USDC reward distribution (10% winner + 7% voter1 + 4% voter2)
- Ticket system with streak bonuses and token holding multiplier
- NFT minting eligibility
- Referral system with commission payouts
- Dashboard with Workshop, Forge, Gallery, Lottery, Lab tabs
- Wallet integration via Privy (Solana + EVM)
- x402 commerce endpoints (custom meme generation)
- Autonomous AI agent on DigitalOcean (X posting, Telegram bots, Moltbook)
- MCP server npm package (@aimemeforge/mcp-server)
- Multi-language support (EN, zh-TW, zh-CN)
