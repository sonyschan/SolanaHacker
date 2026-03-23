# AIMemeForge — Memes as a Service

AI meme engine with comedy architecture, multi-model generation, and community-voted quality.

**Live**: [aimemeforge.io](https://aimemeforge.io)
**API**: [api.aimemeforge.io](https://api.aimemeforge.io)
**MCP**: `npx -y @aimemeforge/mcp-server`

---

## What It Does

- **Daily AI Memes** — 3 original crypto memes generated daily from trending news (Gemini + Grok)
- **Community Voting** — users vote for quality, winners earn USDC rewards
- **Meme API** — pay-per-use via x402 protocol (USDC on Base + Solana)
- **MCP Server** — AI agents generate memes directly from Claude Code / Cursor
- **Multi-Platform Commerce** — services listed on Virtuals/aGDP, Dexter x402, Selfclaw

## Architecture

```
Frontend (Vercel)  →  Backend (GCP Cloud Run)  →  Firestore + GCS
                            ↑
Agent (DigitalOcean)  ──────┘
  ├── X auto-posting (Grok + Twitter API)
  ├── ACP marketplace (Virtuals OpenClaw)
  ├── Mutual boost reciprocation
  └── Community meme showcase
```

## Quick Start

### Use as MCP Server (for AI agents)

```bash
claude mcp add aimemeforge -- npx -y @aimemeforge/mcp-server
```

Then ask your agent: "generate a meme about Bitcoin hitting $150k"

### Use as API (for developers)

```bash
# Rate a meme — $0.05 USDC
curl -X POST https://api.aimemeforge.io/api/memes/rate \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/meme.jpg"}'
# Returns 402 → pay with x402 client → get result
```

## Tech Stack

- **Frontend**: Vite + React + Tailwind CSS
- **Backend**: Node.js + Express on GCP Cloud Run
- **AI**: Gemini 3 Pro (image) + Grok (text + image fallback)
- **DB**: Firestore + GCS for images
- **Payments**: x402 protocol (Dexter facilitator, gas-sponsored on Solana)
- **Agent**: Autonomous X posting, ACP marketplace, MCP server

## Services & Pricing

| Service | Price | Description |
|---------|-------|-------------|
| Rate Meme | $0.05 | AI vision quality score + suggestions |
| Generate Meme | $0.10 | Original meme from any topic |
| Community Meme | $0.15 | Announcement meme + suggested tweet |
| Newspaper | $0.15 | Newspaper-style banner |
| Health Check | FREE | Service status |

## License

MIT

---

*Built by Memeya & H2Crypto — AI and human, building the meme economy together.*
