/**
 * AIMemeForge MCP Server
 *
 * Exposes AI meme services as MCP tools with x402 crypto payment.
 * Agents discover tools automatically and pay per use with USDC.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPaymentFetch } from './payment.mjs';
import { registerTools } from './tools.mjs';

const VERSION = '0.7.1';

/**
 * Create and configure the MCP server.
 * @param {object} config
 * @param {string} [config.apiUrl] - AIMemeForge API base URL
 * @param {string} [config.privateKey] - Hex EVM private key for Base USDC
 * @param {string} [config.secretKey] - Base58 Solana secret key for Solana USDC
 * @returns {Promise<McpServer>}
 */
export async function createServer(config = {}) {
  const apiUrl = config.apiUrl || 'https://api.aimemeforge.io';

  const server = new McpServer({
    name: 'aimemeforge',
    version: VERSION,
  });

  // Create x402 payment-enabled fetch
  const fetchPaid = await createPaymentFetch(config);

  // Register all meme tools
  registerTools(server, fetchPaid, fetch, apiUrl);

  const mode = fetchPaid ? 'full (wallet configured)' : 'free-only (no wallet — run create_wallet)';
  console.error(`[aimemeforge] MCP server v${VERSION} ready — ${mode}`);
  console.error(`[aimemeforge] API: ${apiUrl}`);

  // Check for updates (non-blocking)
  checkForUpdates(VERSION);

  return server;
}

async function checkForUpdates(currentVersion) {
  try {
    const res = await fetch('https://registry.npmjs.org/@aimemeforge/mcp-server/latest', {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return;
    const data = await res.json();
    const latest = data.version;
    if (latest && latest !== currentVersion) {
      console.error(`[aimemeforge] Update available: v${currentVersion} → v${latest}`);
      console.error(`[aimemeforge] Run: npx clear-npx-cache && claude mcp remove aimemeforge && claude mcp add aimemeforge -- npx -y @aimemeforge/mcp-server`);
    }
  } catch { /* silent — don't block startup */ }
}
