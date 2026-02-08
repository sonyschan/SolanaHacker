/**
 * Colosseum Hackathon Registration
 * Registers SolanaHacker agent and saves credentials
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLOSSEUM_API = 'https://agents.colosseum.com/api';

async function registerAgent() {
  const agentName = process.env.AGENT_NAME || 'SolanaHacker';

  console.log(`🚀 Registering agent "${agentName}" with Colosseum...`);

  try {
    const response = await fetch(`${COLOSSEUM_API}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: agentName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Registration failed: ${response.status} - ${error}`);
    }

    const data = await response.json();

    console.log('✅ Registration successful!');
    console.log('');
    console.log('='.repeat(60));
    console.log('⚠️  SAVE THESE CREDENTIALS - SHOWN ONLY ONCE!');
    console.log('='.repeat(60));
    console.log(`Agent ID: ${data.id}`);
    console.log(`API Key: ${data.apiKey}`);
    console.log(`Claim Code: ${data.claimCode}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Share this claim code with a human to receive prizes:');
    console.log(`   ${data.claimCode}`);
    console.log('');

    // Update .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/COLOSSEUM_API_KEY=.*/, `COLOSSEUM_API_KEY=${data.apiKey}`);
    envContent = envContent.replace(/COLOSSEUM_CLAIM_CODE=.*/, `COLOSSEUM_CLAIM_CODE=${data.claimCode}`);
    fs.writeFileSync(envPath, envContent);

    console.log('✅ Credentials saved to .env');

    // Also save to a separate file for backup
    const credentialsPath = path.join(__dirname, '..', 'colosseum-credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify({
      agentId: data.id,
      agentName: agentName,
      apiKey: data.apiKey,
      claimCode: data.claimCode,
      registeredAt: new Date().toISOString(),
    }, null, 2));

    console.log('✅ Backup saved to ../colosseum-credentials.json');

    return data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
}

// Run if executed directly
registerAgent().catch(console.error);
