/**
 * AIMemeForge MCP Server
 *
 * Exposes AI meme services as MCP tools with x402 crypto payment.
 * Agents discover tools automatically and pay per use with USDC.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createPaymentFetch } from './payment.mjs';
import { registerTools } from './tools.mjs';

const VERSION = '0.1.0';

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

  console.error(`[aimemeforge] MCP server v${VERSION} ready`);
  console.error(`[aimemeforge] API: ${apiUrl}`);
  console.error(`[aimemeforge] Tools: health_check, rate_meme, generate_meme, generate_community_meme, generate_newspaper`);

  return server;
}
