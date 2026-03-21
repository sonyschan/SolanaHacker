# @aimemeforge/mcp-server

AI meme services for your agent. Generate, rate, and share crypto memes — pay per use with USDC. Gas is FREE (Dexter sponsored).

## Quick Start

### Claude Code (one-line install)

```bash
claude mcp add aimemeforge -- npx -y @aimemeforge/mcp-server
```

No wallet? No problem — the server starts in free-only mode. Run `create_wallet` to generate a Solana wallet instantly.

With an existing Solana wallet:

```bash
claude mcp add aimemeforge -e SECRET_KEY=your_base58_key -- npx -y @aimemeforge/mcp-server
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aimemeforge": {
      "command": "npx",
      "args": ["-y", "@aimemeforge/mcp-server"],
      "env": {
        "SECRET_KEY": "your_solana_base58_secret_key"
      }
    }
  }
}
```

### Cursor / Other MCP Clients

```bash
SECRET_KEY=your_base58_key npx -y @aimemeforge/mcp-server
```

## Tools

| Tool | Cost | Description |
|------|------|-------------|
| `create_wallet` | FREE | Generate a new Solana wallet (gas-free) |
| `check_balance` | FREE | Check USDC balance and meme credits |
| `withdraw` | FREE | Send USDC to another address |
| `setup_wallet` | FREE | Manual wallet setup guide |
| `health_check` | FREE | Check if AIMemeForge is online |
| `rate_meme` | $0.05 | Rate a meme image — AI score, grade, suggestions |
| `generate_meme` | $0.10 | Generate a crypto meme from any topic |
| `generate_community_meme` | $0.15 | Turn announcements into shareable memes + tweet |
| `generate_newspaper` | $0.15 | Newspaper-style banner from news text |

## Payment

Payment is automatic via [x402](https://x402.org). When your agent calls a tool, the server pays USDC from your wallet and delivers the result. No API keys, no subscriptions.

### Supported Chains

| Chain | Env Var | Gas | Status |
|-------|---------|-----|--------|
| **Solana** | `SECRET_KEY` | **FREE** (Dexter sponsored) | Recommended |
| Base (EVM) | `PRIVATE_KEY` | ~$0.001 ETH per tx | Legacy fallback |

### Wallet Requirements

- **USDC** on Solana (at least $0.50 to start)
- **No SOL needed** — Dexter sponsors all gas fees

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes* | Base58 Solana secret key (recommended) |
| `PRIVATE_KEY` | Yes* | Hex EVM private key (0x...) for Base chain (legacy) |
| `AIMEMEFORGE_API_URL` | No | API URL (default: `https://api.aimemeforge.io`) |
| `AIMEMEFORGE_MAX_WITHDRAWAL` | No | Max USDC per withdrawal (default: $10) |

*At least one wallet key is required. Or run `create_wallet` to generate one.

## Example Usage

Once configured, your agent can say:

> "Generate a meme about Ethereum ETF approval"

The MCP server will:
1. Call `generate_meme` with topic "Ethereum ETF approval"
2. Auto-pay $0.10 USDC via x402 (gas free on Solana)
3. Return the meme image URL, title, and quality score

## Pricing

All prices in USDC. No platform fees. Gas sponsored by Dexter.

| Service | Price |
|---------|-------|
| Rate a meme | $0.05 |
| Generate meme | $0.10 |
| Community meme + tweet | $0.15 |
| Newspaper banner | $0.15 |

## Built by

[AIMemeForge](https://aimemeforge.io) — Memes as a Service. 500+ memes generated, community-voted quality.
