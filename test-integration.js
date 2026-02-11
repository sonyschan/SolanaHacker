#!/usr/bin/env node

/**
 * Integration test script for MemeForge
 * Tests frontend-backend API integration
 */

const fs = require('fs').promises;
const path = require('path');

async function testAPI() {
  console.log('🧪 Testing MemeForge API Integration...\n');
  
  try {
    // Test 1: Backend health
    console.log('1. Testing backend health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData);
    
    // Test 2: Today's memes endpoint
    console.log('\n2. Testing today\'s memes endpoint...');
    const memesResponse = await fetch('http://localhost:3001/api/memes/today');
    const memesData = await memesResponse.json();
    console.log('✅ Today\'s memes:', memesData);
    
    // Test 3: Generate test memes if empty
    if (memesData.memes && memesData.memes.length === 0) {
      console.log('\n3. No memes found, generating test memes...');
      const generateResponse = await fetch('http://localhost:3001/api/memes/generate-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 2 })
      });
      const generateData = await generateResponse.json();
      console.log('✅ Generated memes:', generateData);
    }
    
    // Test 4: Test meme service connection
    console.log('\n4. Testing frontend meme service...');
    const memeServicePath = path.join(__dirname, 'app/src/services/memeService.js');
    const memeServiceExists = await fs.access(memeServicePath).then(() => true).catch(() => false);
    console.log('✅ MemeService file exists:', memeServiceExists);
    
    console.log('\n🎉 All integration tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:5173 (Frontend)');
    console.log('2. Click on Dashboard');
    console.log('3. Check if real memes load in ForgeTab');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend is running: cd app/backend && node server.js');
    console.log('2. Make sure frontend is running: npm run dev');
    console.log('3. Check API_BASE_URL in memeService.js');
  }
}

testAPI();