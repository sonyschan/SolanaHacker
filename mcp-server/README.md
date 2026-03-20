# @aimemeforge/mcp-server

AI meme services for your agent. Generate, rate, and share crypto memes — pay per use with USDC.

## Quick Start

### Claude Desktop / Claude Code

Add to your MCP config:

```json
{
  "mcpServers": {
    "aimemeforge": {
      "command": "npx",
      "args": ["-y", "@aimemeforge/mcp-server"],
      "env": {
        "PRIVATE_KEY": "0x_your_base_wallet_private_key"
      }
    }
  }
}
```

### Cursor / Other MCP Clients

```bash
PRIVATE_KEY=0x... npx @aimemeforge/mcp-server
```

## Tools

| Tool | Cost | Description |
|------|------|-------------|
| `health_check` | FREE | Check if AIMemeForge is online |
| `rate_meme` | $0.05 | Rate a meme image — AI score, grade, suggestions |
| `generate_meme` | $0.10 | Generate a crypto meme from any topic |
| `generate_community_meme` | $0.15 | Turn announcements into shareable memes + tweet |
| `generate_newspaper` | $0.15 | Newspaper-style banner from news text |

## Payment

Payment is automatic via [x402](https://x402.org). When your agent calls a tool, the server pays USDC from your wallet and delivers the result. No API keys, no subscriptions.

### Supported Chains

| Chain | Env Var | Token |
|-------|---------|-------|
| Base (EVM) | `PRIVATE_KEY` | USDC |
| Solana | `SECRET_KEY` | USDC |

Set one or both. Base is recommended (lower fees).

### Wallet Requirements

- **USDC** on Base or Solana (at least $0.50 to start)
- **ETH** on Base for gas (~$0.001 per tx, sponsored by Dexter)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | Yes* | Hex EVM private key (0x...) for Base chain |
| `SECRET_KEY` | Yes* | Base58 Solana secret key |
| `AIMEMEFORGE_API_URL` | No | API URL (default: `https://api.aimemeforge.io`) |

*At least one wallet key is required.

## Example Usage

Once configured, your agent can say:

> "Generate a meme about Ethereum ETF approval"

The MCP server will:
1. Call `generate_meme` with topic "Ethereum ETF approval"
2. Auto-pay $0.10 USDC via x402
3. Return the meme image URL, title, and quality score

## Pricing

All prices are in USDC. No platform fees (Dexter facilitator sponsors gas).

| Service | Price |
|---------|-------|
| Rate a meme | $0.05 |
| Generate meme | $0.10 |
| Community meme + tweet | $0.15 |
| Newspaper banner | $0.15 |

## Built by

[AIMemeForge](https://aimemeforge.io) — Memes as a Service. 500+ memes generated, community-voted quality.
