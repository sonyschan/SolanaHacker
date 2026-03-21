/**
 * MCP Tool Definitions for AIMemeForge Meme Services
 *
 * Each tool maps to an x402-paywalled API endpoint.
 * Payment is handled transparently by the x402 fetch wrapper.
 * If no wallet is configured, paid tools return setup instructions.
 */

import { z } from 'zod';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import crypto from 'crypto';

const WALLET_DIR = join(homedir(), '.aimemeforge');
const WALLET_FILE = join(WALLET_DIR, 'wallet.json');

const SETUP_GUIDE = `
To use paid meme services, you need a crypto wallet with USDC.

QUICKEST WAY: Run the create_wallet tool — it generates a fresh Solana wallet instantly. Then fund it with USDC.

MANUAL SETUP (Solana, recommended):
  claude mcp add aimemeforge -e SECRET_KEY=your_base58_key -- npx -y @aimemeforge/mcp-server

MANUAL SETUP (Base, legacy):
  claude mcp add aimemeforge -e PRIVATE_KEY=0x_your_key -- npx -y @aimemeforge/mcp-server

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
      text: `${toolName} costs $${price} USDC per call. No wallet configured.\n\nRun create_wallet to generate a fresh Solana wallet instantly, then fund it with USDC. Gas is FREE.\n\nOr run setup_wallet for manual configuration options.`,
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

  // ─── Create Wallet (FREE) ───────────────────────────────────

  server.tool(
    'create_wallet',
    'Create a new Solana wallet for paying meme services. Gas is FREE (sponsored by Dexter) — you only need USDC. Run this if you do not have a crypto wallet.',
    {},
    async () => {
      // Check if wallet already exists
      if (existsSync(WALLET_FILE)) {
        try {
          const existing = JSON.parse(readFileSync(WALLET_FILE, 'utf-8'));
          const explorer = existing.chain === 'solana'
            ? `https://solscan.io/account/${existing.address}`
            : `https://basescan.org/address/${existing.address}`;
          return { content: [{ type: 'text', text: [
            `Wallet already exists!`,
            ``,
            `Address: ${existing.address}`,
            `Chain:   ${existing.chain === 'solana' ? 'Solana' : 'Base (EVM)'}`,
            `Key:     ${WALLET_FILE}`,
            `View:    ${explorer}`,
            `Created: ${existing.createdAt || 'unknown'}`,
            ``,
            `=== What You Can Do ===`,
            ``,
            `  check_balance  — See your USDC balance`,
            `  withdraw       — Send USDC to another address`,
            `  health_check   — Check service status`,
            ``,
            `To enable paid tools: send USDC to ${existing.address} on Solana, then restart Claude Code.`,
            `Gas is FREE — Dexter sponsors it. You only need USDC.`,
            `Wallet is auto-loaded on restart — no reconfiguration needed.`,
          ].join('\n') }] };
        } catch { /* corrupted file, regenerate */ }
      }

      // Generate Solana Ed25519 keypair
      const bs58 = await import('bs58');
      const { generateKeyPairSigner } = await import('@solana/signers');
      const signer = await generateKeyPairSigner();

      // Export secret key as base58 (64 bytes: secret + public)
      const secretKeyBytes = new Uint8Array(64);
      const keyPair = signer.keyPair;
      const privBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.privateKey));
      const pubBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
      secretKeyBytes.set(privBytes.slice(0, 32), 0);
      secretKeyBytes.set(pubBytes, 32);
      const secretKeyBase58 = bs58.default.encode(secretKeyBytes);

      // Save locally
      if (!existsSync(WALLET_DIR)) mkdirSync(WALLET_DIR, { recursive: true, mode: 0o700 });
      const walletData = JSON.stringify({
        address: signer.address,
        secretKey: secretKeyBase58,
        chain: 'solana',
        createdAt: new Date().toISOString(),
        note: 'Generated by @aimemeforge/mcp-server. Fund with USDC on Solana. Gas is sponsored by Dexter.',
      }, null, 2);
      try {
        writeFileSync(WALLET_FILE, walletData, { flag: 'wx', mode: 0o600 });
      } catch (err) {
        if (err.code === 'EEXIST') {
          const existing = JSON.parse(readFileSync(WALLET_FILE, 'utf-8'));
          return { content: [{ type: 'text', text: `Wallet already exists!\nAddress: ${existing.address}\nView: https://solscan.io/account/${existing.address}` }] };
        }
        throw err;
      }

      return { content: [{ type: 'text', text: [
        `=== Solana Wallet Created! ===`,
        ``,
        `Address: ${signer.address}`,
        `Chain:   Solana`,
        `Key:     ${WALLET_FILE}`,
        `View:    https://solscan.io/account/${signer.address}`,
        ``,
        `=== How to Fund ===`,
        ``,
        `Send USDC to: ${signer.address}`,
        `Network: Solana`,
        ``,
        `Ways to fund:`,
        `  - Coinbase → Send → USDC → Solana network → paste address above`,
        `  - Binance → Withdraw → USDC → Solana (SPL) → paste address above`,
        `  - Phantom wallet → Send USDC → paste address above`,
        `  - Any exchange that supports Solana USDC withdrawal`,
        ``,
        `Amount: $0.50 is enough for 5 memes.`,
        `Gas is FREE — Dexter sponsors all transaction fees. You ONLY need USDC.`,
        ``,
        `=== Activate Wallet ===`,
        ``,
        `Your wallet is saved and will be auto-loaded on next restart.`,
        `Just restart Claude Code — no need to reconfigure anything.`,
        ``,
        `=== Available Tools ===`,
        ``,
        `  check_balance           — Check USDC balance (FREE)`,
        `  health_check            — Check service status (FREE)`,
        `  generate_meme           — Generate AI meme ($0.10)`,
        `  rate_meme               — Rate a meme image ($0.05)`,
        `  generate_community_meme — Announcement meme + tweet ($0.15)`,
        `  generate_newspaper      — Newspaper banner ($0.15)`,
        `  withdraw                — Send USDC to another address`,
        ``,
        `=== Security ===`,
        ``,
        `Your secret key is saved locally at: ${WALLET_FILE}`,
        `Only you have access. Back it up if you hold significant funds.`,
        `Never share your secret key with anyone.`,
      ].join('\n') }] };
    }
  );

  // ─── Check Balance (FREE) ────────────────────────────────────

  server.tool(
    'check_balance',
    'Check your wallet USDC balance. Shows address, balance, and how many memes you can generate.',
    {},
    async () => {
      // Load wallet info
      let address = null;
      let chain = 'solana';
      let source = '';
      if (existsSync(WALLET_FILE)) {
        try {
          const w = JSON.parse(readFileSync(WALLET_FILE, 'utf-8'));
          address = w.address;
          chain = w.chain || 'solana';
          source = 'saved wallet';
        } catch {}
      }
      if (!address && process.env.SECRET_KEY) {
        try {
          const bs58 = await import('bs58');
          const { createKeyPairSignerFromBytes } = await import('@solana/signers');
          const signer = await createKeyPairSignerFromBytes(bs58.default.decode(process.env.SECRET_KEY));
          address = signer.address;
          chain = 'solana';
          source = 'env SECRET_KEY';
        } catch {}
      }
      if (!address && process.env.PRIVATE_KEY) {
        try {
          const { privateKeyToAccount } = await import('viem/accounts');
          address = privateKeyToAccount(process.env.PRIVATE_KEY).address;
          chain = 'base';
          source = 'env PRIVATE_KEY';
        } catch {}
      }
      if (!address) {
        return { content: [{ type: 'text', text: 'No wallet found. Run create_wallet first.' }], isError: true };
      }

      try {
        let usdc, explorer;

        if (chain === 'solana') {
          // Solana USDC SPL token balance
          const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
          const rpcBody = {
            jsonrpc: '2.0', id: 1,
            method: 'getTokenAccountsByOwner',
            params: [address, { mint: USDC_MINT }, { encoding: 'jsonParsed' }],
          };
          const res = await fetchFree('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcBody),
          });
          const data = await res.json();
          const accounts = data.result?.value || [];
          const rawBalance = accounts.length > 0
            ? parseInt(accounts[0].account.data.parsed.info.tokenAmount.amount || '0')
            : 0;
          usdc = (rawBalance / 1e6).toFixed(2);
          explorer = `https://solscan.io/account/${address}`;
        } else {
          // Base USDC ERC-20 balance
          const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
          const res = await fetchFree('https://mainnet.base.org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1, method: 'eth_call',
              params: [{ to: USDC_BASE, data: '0x70a08231000000000000000000000000' + address.slice(2).toLowerCase() }, 'latest'],
            }),
          });
          const data = await res.json();
          const rawBalance = parseInt(data.result || '0', 16);
          usdc = (rawBalance / 1e6).toFixed(2);
          explorer = `https://basescan.org/address/${address}`;
        }

        const memeCount = Math.floor(parseFloat(usdc) / 0.10);
        return { content: [{ type: 'text', text: [
          `Wallet:  ${address} (${source})`,
          `Chain:   ${chain === 'solana' ? 'Solana' : 'Base'}`,
          `Balance: ${usdc} USDC`,
          chain === 'solana' ? `Gas:     FREE (Dexter sponsored)` : `Gas:     Requires ETH (~$0.001/tx)`,
          ``,
          `Can generate ~${memeCount} memes at $0.10 each`,
          ``,
          `View: ${explorer}`,
        ].join('\n') }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Wallet: ${address}\nBalance check failed: ${err.message}` }], isError: true };
      }
    }
  );

  // ─── Withdraw USDC ──────────────────────────────────────────

  server.tool(
    'withdraw',
    'Send USDC from your wallet to another address. Supports Solana and Base. Use this to withdraw funds or pay someone.',
    {
      to: z.string().describe('Recipient address (Solana base58 or EVM 0x...)'),
      amount: z.string().describe('Amount in USDC (e.g. "1.50")'),
    },
    async ({ to, amount }) => {
      // Load wallet
      let walletInfo = null;
      if (existsSync(WALLET_FILE)) {
        try { walletInfo = JSON.parse(readFileSync(WALLET_FILE, 'utf-8')); } catch {}
      }
      if (!walletInfo?.secretKey && !walletInfo?.privateKey && !process.env.SECRET_KEY && !process.env.PRIVATE_KEY) {
        return { content: [{ type: 'text', text: 'No wallet configured. Run create_wallet first.' }], isError: true };
      }

      const usdcAmount = parseFloat(amount);
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        return { content: [{ type: 'text', text: 'Invalid amount. Must be a positive number.' }], isError: true };
      }
      const MAX_WITHDRAWAL = parseFloat(process.env.AIMEMEFORGE_MAX_WITHDRAWAL || '10');
      if (usdcAmount > MAX_WITHDRAWAL) {
        return { content: [{ type: 'text', text: `Withdrawal capped at $${MAX_WITHDRAWAL} USDC per transaction for safety.\nSet AIMEMEFORGE_MAX_WITHDRAWAL env var to adjust.` }], isError: true };
      }

      const chain = walletInfo?.chain || (process.env.SECRET_KEY ? 'solana' : 'base');

      try {
        if (chain === 'solana') {
          // Solana SPL USDC transfer
          const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
          const { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction, getAccount } = await import('@solana/spl-token');
          const bs58 = await import('bs58');

          const secretKey = walletInfo?.secretKey || process.env.SECRET_KEY;
          const keyBytes = bs58.default.decode(secretKey);
          const { Keypair } = await import('@solana/web3.js');
          const payer = Keypair.fromSecretKey(keyBytes);

          const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
          const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
          const recipient = new PublicKey(to);

          const fromATA = await getAssociatedTokenAddress(USDC_MINT, payer.publicKey);
          const toATA = await getAssociatedTokenAddress(USDC_MINT, recipient);

          const tx = new Transaction();

          // Create recipient ATA if it doesn't exist
          try {
            await getAccount(connection, toATA);
          } catch {
            tx.add(createAssociatedTokenAccountInstruction(payer.publicKey, toATA, recipient, USDC_MINT));
          }

          const rawAmount = BigInt(Math.round(usdcAmount * 1e6));
          tx.add(createTransferInstruction(fromATA, toATA, payer.publicKey, rawAmount));

          const sig = await connection.sendTransaction(tx, [payer]);

          return { content: [{ type: 'text', text: [
            `Transfer sent!`,
            ``,
            `From: ${payer.publicKey.toBase58()}`,
            `To: ${to}`,
            `Amount: ${amount} USDC`,
            `Tx: https://solscan.io/tx/${sig}`,
            ``,
            `Gas: FREE (Solana). Confirmation in ~2 seconds.`,
          ].join('\n') }] };
        } else {
          // Base EVM USDC transfer
          const { createWalletClient, http, parseUnits, encodeFunctionData } = await import('viem');
          const { privateKeyToAccount } = await import('viem/accounts');
          const { base } = await import('viem/chains');

          const pk = walletInfo?.privateKey || process.env.PRIVATE_KEY;
          const account = privateKeyToAccount(pk);
          const client = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });

          const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
          const data = encodeFunctionData({
            abi: [{ name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }],
            functionName: 'transfer',
            args: [to, parseUnits(amount, 6)],
          });
          const hash = await client.sendTransaction({ to: USDC_BASE, data });

          return { content: [{ type: 'text', text: [
            `Transfer sent!`,
            ``,
            `From: ${account.address}`,
            `To: ${to}`,
            `Amount: ${amount} USDC`,
            `Tx: https://basescan.org/tx/${hash}`,
          ].join('\n') }] };
        }
      } catch (err) {
        const msg = err.message || String(err);
        return { content: [{ type: 'text', text: `Transfer failed: ${msg.slice(0, 300)}` }], isError: true };
      }
    }
  );

  // ─── Health Check (FREE) ───────────────────────────────────

  server.tool(
    'health_check',
    'Check if AIMemeForge is online. Free, no wallet required.',
    {},
    async () => {
      try {
        const res = await fetchFree(`${apiUrl}/health`);
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Health check failed: ${err.message}` }], isError: true };
      }
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
