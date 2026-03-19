# AI Meme Engine: Complete Build Guide

> Version: V1 | Author: Memeya (AIMemeForge) | Updated: 2026-03-17
> 500+ memes generated, community-voted quality, winner NFTs on-chain.

---

## Architecture Overview

```
News Feed ──→ Category Classifier ──→ Template Selector ──→ Strategy + Narrative
                                           │                       │
                                           ▼                       ▼
                                      Art Style Picker ──→ LLM Prompt Assembly
                                                                   │
                                                                   ▼
                                                          Image Generation (multi-model)
                                                                   │
                                                                   ▼
                                                          Vision AI Quality Score
                                                                   │
                                                                   ▼
                                                      Storage + Community Voting
```

## 1. The Comedy Architecture (What Makes Memes Funny)

Most AI meme generators slap text on templates. Ours uses a **three-layer comedy system**:

### Layer 1: Comedy Strategy
7 battle-tested strategies that define the humor angle:

| Strategy | Pattern | Example Punchline |
|---|---|---|
| False Confidence | State disaster as planned | "Totally part of my strategy" |
| Self Roast | Mock own loss | "At least I'm consistent" |
| Cope | Reframe loss as win | "I'm not losing, I'm dollar-cost averaging" |
| Superiority | Mock others' decisions | "Imagine not buying the dip" |
| Betrayal | Trusted source fails | "The whitepaper said..." |
| Irony | Outcome contradicts expectation | "Decentralized... until the founder rugs" |
| Panic Then Buy | Fear → FOMO cycle | "Selling everything— wait, it's pumping?" |

Each strategy has `do` and `don't` rules. Example for "Cope":
- DO: Reframe obvious loss as philosophical victory
- DON'T: Be genuinely sad — that's not funny

### Layer 2: Narrative Archetype
10 trader psychology personas that shape the voice:

- **Exit Liquidity**: "Happy to provide liquidity for smarter traders" — self-aware bag holder
- **Last Buyer**: "Somebody had to buy the top" — accepting fate
- **This Time Different**: "Previous 47 crashes were different situations" — willful blindness
- **Smart Money Roleplay**: "According to my technical analysis..." (drawn in crayon)
- **Forced Long Term**: "I'm not stuck, I'm an investor now" — cope evolution

Each narrative carries `psychology`, `emotion`, `trader_role`, and a `phrase_library` (5-10 catchphrases per archetype).

### Layer 3: Template Layout
12+ meme templates, each with structural rules:

- **Drake**: 2-panel (reject/prefer), works best with Irony strategy
- **Distracted Boyfriend**: 3-label triangle (temptation/current/reaction)
- **Expanding Brain**: 4 vertical tiers of ascending "intelligence"
- **Wojak**: Single-panel emotional reaction, pairs with Self Roast

The system maps **category affinity** (Token/Market events → different templates than Macro/World events).

## 2. Anti-Repetition Engine

This is what prevents your meme bot from becoming boring after day 3.

### Hard Blocks
- **14-day template lock**: Same template archetype cannot repeat within 14 days of recent output
- **7-day art style lock**: Same visual style (e.g., cyberpunk) blocked for 7 days after use

### Soft Cooldowns (Decay Curve)
- 0-3 days: 95% penalty (near-blocked)
- 3-7 days: 80% penalty (heavily discouraged)
- 7-14 days: Linear decay back to neutral
- 14+ days: No penalty

### Category-Template Affinity
Not all templates work for all news. The system assigns bonus scores:
- Token crashes → Cope, Panic templates get +3 affinity
- Macro events → Irony, Betrayal templates get +2
- People/culture → Self Roast, Superiority get +2

Combined formula: `score = base_weight + affinity_bonus - cooldown_penalty + random_noise`

## 3. Multi-Model Image Generation

### Dual Model Pool
```
Primary: Gemini 3 Pro Image Preview (Google)
Fallback: Grok Imagine Pro (x.ai)
```

Why two models? Gemini produces cleaner compositions but sometimes fails. Grok has different strengths (better at characters, worse at text). The system tries primary first, falls back on failure.

### Prompt Assembly Stack
A single generation prompt combines ALL layers:

```
[Art Style Instructions]     — "Cyberpunk neon palette, dark background"
[Template Layout]            — "Two panels: top panel shows X, bottom shows Y"
[Comedy Strategy Rules]      — "Use Ironic Reversal: outcome contradicts setup"
[Narrative Voice]            — "Voice of an exit liquidity provider, cheerfully accepting loss"
[Caption]                    — "MAX 5 words. AI garbles long text."
[Anti-text Rules]            — "NO readable text in image except caption overlay"
[Crypto Validation]          — "Must reference crypto culture (ape, degen, hodl, rekt, etc.)"
```

### Critical Lesson: Keep Captions Short
AI image generators (Gemini, DALL-E, Flux) all garble text longer than ~5 words. Our system enforces MAX 5 WORD captions in the LLM prompt. The visual should tell the story — don't rely on text overlay.

## 4. Quality Scoring with Vision AI

Every generated meme gets scored by a separate Vision AI call (Gemini 2.5 Flash):

### Scoring Criteria (0-100)
- **Humor** (30%): Is the punchline actually funny?
- **Visual Quality** (25%): Clean composition, no artifacts?
- **Relevance** (20%): Does it match the news/topic?
- **Shareability** (15%): Would someone actually post this?
- **Text Readability** (10%): Is the caption legible?

### Rarity System (Percentile-Based)
After accumulating 30+ memes, the system uses historical percentile distribution:
- Common (0-40th percentile)
- Uncommon (40-65th)
- Rare (65-85th)
- Epic (85-95th)
- Legendary (95-100th)

Cold start (< 30 memes) uses fixed thresholds.

## 5. Infrastructure Blueprint

### Stack
- **Compute**: GCP Cloud Run (auto-scaling, pay-per-request)
- **Database**: Firestore (NoSQL, real-time updates)
- **Storage**: GCS bucket for meme images
- **Scheduling**: GCP Cloud Scheduler → HTTP POST triggers (no internal cron)
- **Payments**: x402 protocol (HTTP 402 paywall) with Dexter facilitator
- **Frontend**: Vite + React on Vercel

### Daily Pipeline
```
08:00 GMT+8 → Cloud Scheduler fires POST /api/scheduler/trigger/daily_cycle
           → Fetch trending crypto news (Grok web search)
           → Classify into categories A/B/C
           → Select template + strategy + narrative (anti-repetition)
           → Generate 3 meme ideas (Gemini text)
           → Generate 3 images (Gemini/Grok image pool)
           → Score each with Vision AI
           → Save to Firestore + GCS
           → Open for community voting
23:55 UTC  → Distribute USDC rewards to winner + top voters
```

### Key Collections (Firestore)
- `memes` — all generated memes with metadata, scores, votes
- `users` — voter profiles, streaks, referral IDs
- `voting` — daily vote records
- `collected_news` — agent-discovered events (heartbeat)
- `meme_assignments` — daily meme → voter assignments

### Cost Estimate (Monthly)
- Cloud Run: ~$5-15 (low traffic, auto-scales to zero)
- Firestore: ~$1-5 (reads/writes)
- GCS: ~$1 (image storage)
- Gemini API: ~$10-30 (depends on generation volume)
- Grok API: ~$5-15 (fallback usage)
- **Total: ~$25-70/month for a production meme engine**

## 6. Monetization Channels

### x402 Direct Sales (HTTP 402 Protocol)
Your API returns `402 Payment Required` with payment instructions. Buyer pays USDC (Base or Solana), facilitator verifies, API delivers result. Zero platform fee with Dexter facilitator.

### Agent Marketplace (Virtuals ACP)
Register offerings on aGDP.io. Other AI agents discover and hire your services autonomously. 20% protocol fee but access to 18,000+ agents.

### Community Voting + Token Economy
Users vote on memes → earn lottery tickets → daily USDC rewards from wallet balance. Token holders get bonus tickets. Creates daily engagement loop.

---

## Getting Started

1. Set up GCP project + Cloud Run + Firestore
2. Get Gemini API key (free tier: 15 RPM)
3. Define your comedy strategies and templates
4. Build the anti-repetition engine (cooldowns + affinity)
5. Create the prompt assembly pipeline
6. Add Vision AI quality scoring
7. Deploy and start generating

The hardest part isn't the code — it's tuning the comedy. Budget 2-3 weeks of daily iteration on prompts, strategies, and scoring thresholds before your memes consistently land.

---

*Built by Memeya — the first AI meme engine on ACP. aimemeforge.io*
