/**
 * x402 End-to-End Test: POST /api/memes/generate-custom
 *
 * Tests the x402 payment flow against AIMemeForge's meme generation endpoint.
 * Cost: $0.10 USDC on Base per call.
 *
 * Prerequisites:
 *   - Base wallet with USDC (at least $0.15)
 *   - Small amount of ETH on Base for gas
 *
 * Usage:
 *   PRIVATE_KEY=0x... node test-generate.mjs
 *   PRIVATE_KEY=0x... node test-generate.mjs "Bitcoin hits 200k"
 */

import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

// --- Config ---
const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const GENERATE_ENDPOINT = `${API_BASE}/api/memes/generate-custom`;

// --- Wallet setup ---
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('❌ Set PRIVATE_KEY env var:\n   PRIVATE_KEY=0x... node test-generate.mjs');
  process.exit(1);
}

const account = privateKeyToAccount(privateKey);
console.log(`🔑 Wallet: ${account.address}`);
console.log(`💰 Endpoint: ${GENERATE_ENDPOINT}`);
console.log(`🖼️  Cost: $0.10 USDC on Base\n`);

// --- Initialize x402 client ---
const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// --- Step 1: Confirm 402 ---
console.log('Step 1: Verify endpoint returns 402...');
const probeRes = await fetch(GENERATE_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic: 'test' }),
});
console.log(`  → HTTP ${probeRes.status} ${probeRes.status === 402 ? '✅ Payment Required' : '⚠️ Unexpected'}\n`);

if (probeRes.status !== 402) {
  console.error('Expected 402, got', probeRes.status);
  console.error(await probeRes.text());
  process.exit(1);
}

// --- Step 2: Pay and generate ---
const topic = process.argv[2] || 'Solana ecosystem is thriving';
console.log(`Step 2: Paying $0.10 USDC and generating meme...`);
console.log(`  → Topic: "${topic}"`);
console.log(`  ⏳ This takes ~1-2 minutes (AI image generation)\n`);

try {
  const response = await fetchWithPayment(GENERATE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });

  console.log(`  → HTTP ${response.status}\n`);

  if (response.ok) {
    const body = await response.json();
    if (body.success) {
      const m = body.meme;
      console.log('✅ Meme generated:');
      console.log(`  Title:    ${m.title}`);
      console.log(`  Image:    ${m.imageUrl}`);
      console.log(`  Score:    ${m.metadata?.qualityScore ?? '-'}/100`);
      console.log(`  Tags:     ${m.tags?.join(', ') || 'none'}`);
      console.log(`  Strategy: ${m.metadata?.strategyName || '-'}`);
      console.log(`  Style:    ${m.metadata?.artStyleName || '-'}`);
      console.log('\n🎉 x402 generateMeme flow complete! Check Base wallet for $0.10 USDC debit.');
    } else {
      console.log('❌ API error:', body.error || body.message);
    }
  } else {
    console.log('❌ Response:', response.status, await response.text());
  }
} catch (err) {
  console.error('❌ Payment/request failed:', err.message);
  if (err.message.includes('insufficient') || err.message.includes('balance')) {
    console.error('\n💡 Make sure your wallet has:');
    console.error('   - USDC on Base (at least $0.15)');
    console.error('   - ETH on Base (for gas, ~$0.001)');
  }
}
