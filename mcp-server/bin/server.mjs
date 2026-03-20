#!/usr/bin/env node

/**
 * AIMemeForge MCP Server — CLI Entry Point
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx @aimemeforge/mcp-server
 *
 * Or add to Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "aimemeforge": {
 *         "command": "npx",
 *         "args": ["@aimemeforge/mcp-server"],
 *         "env": { "PRIVATE_KEY": "0x..." }
 *       }
 *     }
 *   }
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
