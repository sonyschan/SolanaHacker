/**
 * MCP Tool Definitions for AIMemeForge Meme Services
 *
 * Each tool maps to an x402-paywalled API endpoint.
 * Payment is handled transparently by the x402 fetch wrapper.
 * If no wallet is configured, paid tools return setup instructions.
 */

import { z } from 'zod';

const SETUP_GUIDE = `
To use paid meme services, you need a crypto wallet with USDC.

STEP 1: Get a wallet private key
  Option A (Base/EVM — recommended):
    - Use any EVM wallet (MetaMask, Coinbase Wallet, Rainbow)
    - Export the private key (starts with 0x...)
  Option B (Solana):
    - Use any Solana wallet (Phantom, Solflare)
    - Export the secret key (base58 format)

STEP 2: Fund with USDC
  - Base: Send USDC to your wallet on Base chain (as little as $0.50)
  - Solana: Send USDC to your wallet on Solana
  - Gas: Dexter sponsors gas on both chains — you only need USDC

STEP 3: Configure the MCP server
  Add to your Claude Desktop config (claude_desktop_config.json):
  {
    "mcpServers": {
      "aimemeforge": {
        "command": "npx",
        "args": ["-y", "@aimemeforge/mcp-server"],
        "env": {
          "PRIVATE_KEY": "0x_your_private_key_here"
        }
      }
    }
  }

  Or for Claude Code (.claude/settings.json):
  {
    "mcpServers": {
      "aimemeforge": {
        "command": "npx",
        "args": ["-y", "@aimemeforge/mcp-server"],
        "env": {
          "PRIVATE_KEY": "0x_your_private_key_here"
        }
      }
    }
  }

STEP 4: Restart Claude and start creating memes!

PRICING:
  health_check     — FREE
  rate_meme        — $0.05 USDC
  generate_meme    — $0.10 USDC
  community_meme   — $0.15 USDC
  newspaper        — $0.15 USDC

Payment is automatic via x402 — no API keys, no subscriptions.
Learn more: https://aimemeforge.io
`.trim();

/**
 * Return setup instructions when wallet is not configured.
 */
function walletRequiredResponse(toolName, price) {
  return {
    content: [{
      type: 'text',
      text: `${toolName} costs $${price} USDC per call. No wallet configured yet.\n\n${SETUP_GUIDE}`,
    }],
    isError: true,
  };
}

/**
 * Register all meme service tools on the MCP server.
 * @param {McpServer} server - MCP server instance
 * @param {Function|null} fetchPaid - x402 payment-enabled fetch (null if no wallet)
 * @param {Function} fetchFree - normal fetch (for free endpoints)
 * @param {string} apiUrl - base API URL
 */
export function registerTools(server, fetchPaid, fetchFree, apiUrl) {

  // ─── Setup Guide (always available) ────────────────────────

  server.tool(
    'setup_wallet',
    'Get step-by-step instructions to set up a crypto wallet for paid meme services. Run this first if you see payment errors.',
    {},
    async () => ({
      content: [{ type: 'text', text: SETUP_GUIDE }],
    })
  );

  // ─── Health Check (FREE) ───────────────────────────────────

  server.tool(
    'health_check',
    'Check if AIMemeForge is online. Free, no wallet required.',
    {},
    async () => {
      const res = await fetchFree(`${apiUrl}/health`);
      const data = await res.json();
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ─── Rate Meme ($0.05 USDC) ────────────────────────────────

  server.tool(
    'rate_meme',
    'Rate a meme image with AI vision analysis. Returns score (0-100), grade, and suggestions. Costs $0.05 USDC.',
    {
      imageUrl: z.string().url().describe('Public URL of the meme image to rate'),
    },
    async ({ imageUrl }) => {
      if (!fetchPaid) return walletRequiredResponse('rate_meme', '0.05');
      const res = await fetchPaid(`${apiUrl}/api/memes/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) {
        return { content: [{ type: 'text', text: `Error (${res.status}): ${await res.text()}` }], isError: true };
      }
      const data = await res.json();
      const summary = [
        `Score: ${data.score}/100 (${data.grade})`,
        `Pass: ${data.pass ? 'Yes' : 'No'}`,
        data.suggestions?.length ? `Suggestions:\n${data.suggestions.map(s => `  - ${s}`).join('\n')}` : '',
      ].filter(Boolean).join('\n');
      return { content: [{ type: 'text', text: summary }] };
    }
  );

  // ─── Generate Meme ($0.10 USDC) ────────────────────────────

  server.tool(
    'generate_meme',
    'Generate an AI crypto meme from a topic or news headline. Returns image URL, title, and quality score. Costs $0.10 USDC.',
    {
      topic: z.string().describe('Meme topic or news headline (required)'),
      artStyleId: z.string().optional().describe('Art style: pixel-art, cyberpunk, watercolor, comic-book, vaporwave, ukiyo-e, bauhaus, synthwave, claymation, stained-glass'),
    },
    async ({ topic, artStyleId }) => {
      if (!fetchPaid) return walletRequiredResponse('generate_meme', '0.10');
      const body = { topic };
      if (artStyleId) body.artStyleId = artStyleId;
      const res = await fetchPaid(`${apiUrl}/api/memes/generate-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return { content: [{ type: 'text', text: `Error (${res.status}): ${await res.text()}` }], isError: true };
      }
      const data = await res.json();
      const meme = data.meme || data;
      const summary = [
        `Title: ${meme.title}`,
        `Image: ${meme.imageUrl}`,
        `Tags: ${(meme.tags || []).join(', ')}`,
        `Quality: ${meme.metadata?.qualityScore || 'N/A'}/100`,
        `Style: ${meme.metadata?.artStyleName || 'auto'}`,
      ].join('\n');
      return { content: [
        { type: 'text', text: summary },
        { type: 'resource', resource: { uri: meme.imageUrl, mimeType: 'image/png', text: meme.title } },
      ] };
    }
  );

  // ─── Generate Community Meme ($0.15 USDC) ──────────────────

  server.tool(
    'generate_community_meme',
    'Turn a project announcement into a shareable meme with suggested tweet. Choose tone and visual style. Costs $0.15 USDC.',
    {
      description: z.string().max(500).describe('Project announcement or event (max 500 chars)'),
      tone: z.enum(['hype', 'wholesome', 'funny', 'flex']).optional().describe('Meme tone (default: hype)'),
      style: z.enum(['meme', 'announcement', 'comic', 'infographic']).optional().describe('Visual style (default: meme)'),
    },
    async ({ description, tone, style }) => {
      if (!fetchPaid) return walletRequiredResponse('generate_community_meme', '0.15');
      const res = await fetchPaid(`${apiUrl}/api/memes/generate-community`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, tone: tone || 'hype', style: style || 'meme' }),
      });
      if (!res.ok) {
        return { content: [{ type: 'text', text: `Error (${res.status}): ${await res.text()}` }], isError: true };
      }
      const data = await res.json();
      const meme = data.meme || data;
      const summary = [
        `Title: ${meme.title}`,
        `Image: ${meme.imageUrl}`,
        data.suggestedTweet ? `\nSuggested Tweet:\n${data.suggestedTweet}` : '',
      ].filter(Boolean).join('\n');
      return { content: [{ type: 'text', text: summary }] };
    }
  );

  // ─── Generate Newspaper ($0.15 USDC) ───────────────────────

  server.tool(
    'generate_newspaper',
    'Generate a newspaper-style banner image from news text. Great for X posts. Costs $0.15 USDC.',
    {
      description: z.string().max(500).describe('News or announcement text (max 500 chars)'),
      xProfileUrl: z.string().url().optional().describe('X/Twitter profile URL for avatar in the newspaper'),
    },
    async ({ description, xProfileUrl }) => {
      if (!fetchPaid) return walletRequiredResponse('generate_newspaper', '0.15');
      const body = { description };
      if (xProfileUrl) body.xProfileUrl = xProfileUrl;
      const res = await fetchPaid(`${apiUrl}/api/memes/generate-newspaper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return { content: [{ type: 'text', text: `Error (${res.status}): ${await res.text()}` }], isError: true };
      }
      const data = await res.json();
      const meme = data.meme || data;
      const summary = [
        `Title: ${meme.title}`,
        `Image: ${meme.imageUrl}`,
        data.suggestedTweet ? `\nSuggested Tweet:\n${data.suggestedTweet}` : '',
      ].filter(Boolean).join('\n');
      return { content: [{ type: 'text', text: summary }] };
    }
  );
}
