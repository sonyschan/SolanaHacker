/**
 * MCP Tool Definitions for AIMemeForge Meme Services
 *
 * Each tool maps to an x402-paywalled API endpoint.
 * Payment is handled transparently by the x402 fetch wrapper.
 */

import { z } from 'zod';

/**
 * Register all meme service tools on the MCP server.
 * @param {McpServer} server - MCP server instance
 * @param {Function} fetchPaid - x402 payment-enabled fetch
 * @param {Function} fetchFree - normal fetch (for free endpoints)
 * @param {string} apiUrl - base API URL
 */
export function registerTools(server, fetchPaid, fetchFree, apiUrl) {

  // ─── Health Check (FREE) ───────────────────────────────────

  server.tool(
    'health_check',
    'Check if AIMemeForge is online. Free, no payment required.',
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
