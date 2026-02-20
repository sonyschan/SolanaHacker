/**
 * One-time OAuth 1.0a setup for @AiMemeForgeIO
 *
 * Usage:
 *   cd /home/projects/solanahacker/agent
 *   node scripts/x-oauth-setup.js
 *
 * Steps:
 *   1. Script generates an auth URL
 *   2. Open URL in browser logged into @AiMemeForgeIO
 *   3. Authorize the app → get a PIN code
 *   4. Enter the PIN → script outputs Access Token + Secret
 *   5. Add them to agent/.env
 */

import dotenv from 'dotenv';
dotenv.config();

import { TwitterApi } from 'twitter-api-v2';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  const appKey = process.env.X_CONSUMER_KEY;
  const appSecret = process.env.X_CONSUMER_SECRET;

  if (!appKey || !appSecret) {
    console.error('❌ Missing X_CONSUMER_KEY or X_CONSUMER_SECRET in .env');
    process.exit(1);
  }

  console.log('=== X/Twitter OAuth 1.0a Setup for @AiMemeForgeIO ===\n');

  // Step 1: Get request token + auth URL
  const client = new TwitterApi({ appKey, appSecret });
  const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink('oob');

  console.log('1. Open this URL in a browser where @AiMemeForgeIO is logged in:\n');
  console.log(`   ${url}\n`);
  console.log('2. Click "Authorize app"');
  console.log('3. Copy the PIN code shown\n');

  // Step 2: User enters PIN
  const pin = await ask('Enter PIN: ');
  rl.close();

  if (!pin.trim()) {
    console.error('❌ No PIN entered');
    process.exit(1);
  }

  // Step 3: Exchange PIN for access token
  const loginClient = new TwitterApi({
    appKey,
    appSecret,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  const { accessToken, accessSecret, screenName, userId } = await loginClient.login(pin.trim());

  console.log(`\n✅ Authorized as @${screenName} (ID: ${userId})\n`);
  console.log('Add these to agent/.env (replace existing X_ACCESS_TOKEN/SECRET):\n');
  console.log(`X_ACCESS_TOKEN=${accessToken}`);
  console.log(`X_ACCESS_SECRET=${accessSecret}`);
  console.log(`\n# Authorized account: @${screenName} (${userId})`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
