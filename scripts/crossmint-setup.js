#!/usr/bin/env node
/**
 * One-time setup: Create Memeya's Crossmint Agentic Wallet
 *
 * Usage (run from app/backend/ so node_modules resolves):
 *   cd app/backend
 *   CROSSMINT_API_KEY=sk_production_... node ../../scripts/crossmint-setup.js
 *
 * Outputs MEMEYA_WALLET_LOCATOR and MEMEYA_WALLET_ADDRESS for env vars.
 */

async function main() {
  const apiKey = process.env.CROSSMINT_API_KEY;
  if (!apiKey) {
    console.error('❌ Set CROSSMINT_API_KEY environment variable first');
    console.error('   Get it from https://www.crossmint.com/console/api-keys');
    process.exit(1);
  }

  let CrossmintWallets, createCrossmint;
  try {
    const sdk = require('@crossmint/wallets-sdk');
    CrossmintWallets = sdk.CrossmintWallets;
    createCrossmint = sdk.createCrossmint;
  } catch (err) {
    console.error('❌ Missing SDK:', err.message);
    console.error('   Run: cd app/backend && npm install @crossmint/wallets-sdk');
    process.exit(1);
  }

  console.log('🔧 Creating Crossmint Agentic Wallet for Memeya...\n');

  const crossmint = createCrossmint({ apiKey });
  const crossmintWallets = CrossmintWallets.from(crossmint);

  // createWallet is the server-side method (getOrCreateWallet is client-only)
  const wallet = await crossmintWallets.createWallet({
    chain: 'solana',
    signer: { type: 'api-key' }
  });

  const address = wallet.address;

  console.log('✅ Wallet created successfully!\n');
  console.log('Add these to your environment:\n');
  console.log(`MEMEYA_WALLET_LOCATOR=${address}`);
  console.log(`MEMEYA_WALLET_ADDRESS=${address}`);
  console.log(`\nWallet address: ${address}`);
  console.log('\nNext steps:');
  console.log('1. Set env vars on Cloud Run: gcloud run services update memeforge-api --set-env-vars ...');
  console.log('2. Fund the wallet with USDC (send to the address above)');
  console.log('3. Test: curl /api/rewards/balance');
}

main().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
