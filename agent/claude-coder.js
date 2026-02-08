/**
 * Claude Coder
 * Uses Claude API for autonomous code generation
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

export class ClaudeCoder {
  constructor(apiKey, knowledgeBasePath) {
    this.client = new Anthropic({ apiKey });
    this.knowledgeBasePath = knowledgeBasePath;
    this.conversationHistory = [];
    this.model = 'claude-sonnet-4-20250514';
    this.maxRetries = 3;
    this.baseDelay = 5000; // 5s, doubles each retry
  }

  /**
   * Load knowledge base from files
   */
  loadKnowledgeBase() {
    const knowledge = [];

    if (!fs.existsSync(this.knowledgeBasePath)) {
      console.log('[Coder] No knowledge base found');
      return '';
    }

    const files = fs.readdirSync(this.knowledgeBasePath);
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.txt')) {
        const content = fs.readFileSync(
          path.join(this.knowledgeBasePath, file),
          'utf-8'
        );
        knowledge.push(`## ${file}\n${content}`);
      }
    }

    return knowledge.join('\n\n---\n\n');
  }

  /**
   * Generate code with Claude
   */
  async generateCode(task, context = {}) {
    const knowledgeBase = this.loadKnowledgeBase();

    const systemPrompt = `You are SolanaHacker, an autonomous AI developer building a Solana web application.

## Your Mission
Build an innovative, fun, and practical web app on Solana. You have freedom to choose the product idea, but it should leverage your knowledge of existing projects.

## Your Knowledge Base
You have learned from these projects:
${knowledgeBase}

## Technical Stack
- Frontend: Vite + React + Three.js (for 3D visualization)
- Blockchain: Solana (use @solana/web3.js)
- Wallet: @solana/wallet-adapter-react + @solana/wallet-adapter-wallets (no API key, no domain config needed)
- Styling: Tailwind CSS
- AI Chat: Grok API (X.AI) — available for app features

## Available APIs
The following API keys are available via process.env on the server side:

- **XAI_API_KEY** — Grok API (https://api.x.ai/v1/chat/completions, model: "grok-3-mini")
  Use this to add AI-powered features: chat assistant, token analysis, natural language trading, etc.
  IMPORTANT: Never expose API keys in client-side code. Create a server-side proxy (e.g., Vite server middleware or a /api route) that the frontend calls.

- **SOLANA_RPC_URL** — Solana RPC endpoint (devnet)

## Free Public APIs (no key needed)
- Jupiter Swap: https://quote-api.jup.ag/v6/
- DexScreener: https://api.dexscreener.com/
- Solana public RPC: https://api.devnet.solana.com

## Resource Rules
- API keys must ONLY be accessed server-side via process.env
- Frontend must call your proxy endpoints, NEVER external APIs directly with keys
- Never hardcode or log API keys
- NEVER use services requiring API keys you don't have (e.g., Helius, Alchemy, OpenAI, Infura, Firebase, Supabase)
- If a feature requires a paid/auth service, pivot: use a free alternative, simplify the feature, or redesign around it
- Hitting a wall is normal. Don't waste iterations retrying the same failing approach. Adapt your product idea if needed — a working simpler app beats a broken ambitious one

## Output Format
When generating code, always output complete, working files. Use this format:

\`\`\`[language]::[filepath]
// code here
\`\`\`

Example:
\`\`\`javascript::src/App.jsx
import React from 'react';
// ...
\`\`\`

When you need to run shell commands (e.g., install system packages, fix environment issues), output them as:

\`\`\`bash::SHELL
apt-get install -y python3
\`\`\`

Only use SHELL commands for system-level fixes that cannot be solved by editing files. Do NOT use SHELL for npm install (handled automatically).

## Current Context
${context.currentFiles ? `Existing files: ${context.currentFiles.join(', ')}` : 'Starting fresh'}
${context.lastError ? `Last error to fix: ${context.lastError}` : ''}
${context.uxFeedback ? `UX feedback: ${context.uxFeedback}` : ''}
`;

    this.conversationHistory.push({
      role: 'user',
      content: task,
    });

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 8192,
          system: systemPrompt,
          messages: this.conversationHistory,
        });

        const assistantMessage = response.content[0].text;

        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage,
        });

        // Parse code blocks from response
        const codeBlocks = this.parseCodeBlocks(assistantMessage);

        return {
          response: assistantMessage,
          codeBlocks,
          usage: response.usage,
        };
      } catch (error) {
        lastError = error;
        const status = error.status || error.statusCode;
        if (status === 429 || status === 529) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          console.log(`[Coder] Rate limited (${status}), retry ${attempt + 1}/${this.maxRetries} in ${delay / 1000}s...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        console.error('[Coder] Claude API error:', error.message);
        throw error;
      }
    }
    console.error(`[Coder] All ${this.maxRetries} retries exhausted`);
    throw lastError;
  }

  /**
   * Parse code blocks from response
   */
  parseCodeBlocks(text) {
    const blocks = [];
    const regex = /```(\w+)::([^\n]+)\n([\s\S]*?)```/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1],
        filepath: match[2],
        content: match[3].trim(),
      });
    }

    return blocks;
  }

  /**
   * Write code blocks to filesystem
   */
  writeCodeToFiles(codeBlocks, baseDir) {
    const writtenFiles = [];

    for (const block of codeBlocks) {
      const fullPath = path.join(baseDir, block.filepath);
      const dir = path.dirname(fullPath);

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, block.content);
      writtenFiles.push(block.filepath);
      console.log(`[Coder] Wrote: ${block.filepath}`);
    }

    return writtenFiles;
  }

  /**
   * Fix code based on error
   */
  async fixCode(error, context) {
    const task = `
I got this error:
\`\`\`
${error}
\`\`\`

Please fix the code. Output only the corrected file(s) using the same format.
`;

    return this.generateCode(task, context);
  }

  /**
   * Improve code based on UX feedback
   */
  async improveUX(feedback, confidence, context) {
    const task = `
The current UX confidence is ${confidence}%. Target is 90%.

UX Review feedback:
${feedback}

Please improve the code to address these issues. Focus on:
1. Visual hierarchy
2. User flow clarity
3. Error states
4. Loading states
5. Mobile responsiveness

Output the improved file(s).
`;

    return this.generateCode(task, context);
  }

  /**
   * Brainstorm product ideas
   */
  async brainstormProduct() {
    const task = `
Based on your knowledge of IdleTrencher (3D token visualization), TraderHan (trading bot), and Beedog (farm game), brainstorm a NEW product idea that:

1. Is fun and engaging
2. Uses Solana blockchain
3. Has practical utility
4. Can be built in 10 days
5. Combines learnings from the existing projects

Provide:
1. Product name
2. One-sentence pitch
3. Core features (max 5)
4. Technical approach
5. Why it's unique

Be creative and think outside the box!
`;

    return this.generateCode(task, { currentFiles: [] });
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}
