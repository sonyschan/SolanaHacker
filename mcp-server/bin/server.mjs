#!/usr/bin/env node

/**
 * AIMemeForge MCP Server — CLI Entry Point
 *
 * Usage (Solana, recommended — gas free):
 *   SECRET_KEY=your_base58_key npx @aimemeforge/mcp-server
 *
 * Usage (Base, legacy):
 *   PRIVATE_KEY=0x... npx @aimemeforge/mcp-server
 *
 * Or install in Claude Code:
 *   claude mcp add aimemeforge -- npx -y @aimemeforge/mcp-server
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '../src/index.mjs';

const server = await createServer({
  apiUrl: process.env.AIMEMEFORGE_API_URL || 'https://api.aimemeforge.io',
  privateKey: process.env.PRIVATE_KEY,
  secretKey: process.env.SECRET_KEY,
});

const transport = new StdioServerTransport();
await server.connect(transport);
