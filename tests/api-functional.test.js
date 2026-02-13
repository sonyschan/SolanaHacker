/**
 * MemeForge API Functional Tests
 * Ensures current user experience won't be changed accidentally
 * Run: node tests/api-functional.test.js
 */

const API_BASE = 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const TEST_WALLET = '3ic495zEfQNSfM56a3uuh9uzbeSQ967474MCVVzhQ4Eb';

// Simple test runner
let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ============ API Tests ============

async function testHealthEndpoint() {
  const res = await fetch(`${API_BASE}/health`);
  const data = await res.json();
  
  assert(res.ok, `Health endpoint returned ${res.status}`);
  assert(data.status === 'healthy', 'Status should be healthy');
  assert(data.scheduler?.initialized !== undefined, 'Should have scheduler info');
}

async function testStatsEndpoint() {
  const res = await fetch(`${API_BASE}/api/stats`);
  const data = await res.json();
  
  assert(res.ok, `Stats endpoint returned ${res.status}`);
  assert(data.success === true, 'Should return success: true');
  assert(data.stats !== undefined, 'Should have stats object (not data)');
  assert(typeof data.stats.weeklyVoters === 'number', 'stats.weeklyVoters should be number');
  assert(typeof data.stats.totalMemes === 'number', 'stats.totalMemes should be number');
  assert(typeof data.stats.totalVotes === 'number', 'stats.totalVotes should be number');
}

async function testUserEndpoint() {
  const res = await fetch(`${API_BASE}/api/users/${TEST_WALLET}`);
  const data = await res.json();
  
  assert(res.ok, `User endpoint returned ${res.status}`);
  assert(data.success === true, 'Should return success: true');
  assert(data.user !== undefined, 'Should have user object (not data)');
  assert(typeof data.user.weeklyTickets === 'number' || data.user.weeklyTickets === undefined, 
    'user.weeklyTickets should be number or undefined for new users');
  assert(typeof data.user.streakDays === 'number' || data.user.streakDays === undefined,
    'user.streakDays should be number or undefined for new users');
}

async function testTodaysMemesEndpoint() {
  const res = await fetch(`${API_BASE}/api/memes/today`);
  const data = await res.json();
  
  assert(res.ok, `Memes endpoint returned ${res.status}`);
  assert(data.success === true, 'Should return success: true');
  assert(Array.isArray(data.memes), 'Should have memes array');
  
  if (data.memes.length > 0) {
    const meme = data.memes[0];
    
    // Required fields
    assert(meme.id, 'Meme should have id');
    assert(meme.title, 'Meme should have title');
    assert(meme.imageUrl, 'Meme should have imageUrl');
    assert(meme.description, 'Meme should have description');
    
    // NFT Traits (new features)
    assert(meme.style, 'Meme should have style (NFT trait)');
    assert(Array.isArray(meme.tags), 'Meme should have tags array (NFT trait)');
    assert(meme.tags.length >= 2, 'Meme should have at least 2 tags');
    assert(meme.tags.length <= 8, 'Meme should have at most 8 tags');
    
    // Metadata
    assert(meme.metadata?.imageGenerated !== undefined, 'Meme should have metadata.imageGenerated');
    assert(meme.metadata?.artStyle, 'Meme should have metadata.artStyle');
    
    // Description should be clean (not full prompt)
    assert(meme.description.length <= 200, 'Description should be short (max 200 chars)');
    assert(!meme.description.includes('**Visual Scene'), 'Description should not contain prompt formatting');
  }
}

async function testVotingSubmitFormat() {
  // Test that voting accepts frontend format (voteType, walletAddress)
  const res = await fetch(`${API_BASE}/api/voting/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      memeId: 'test_meme_invalid',
      voteType: 'selection',  // Frontend uses voteType, not phase
      choice: 'yes',          // Frontend uses 'yes'/'no' strings
      walletAddress: TEST_WALLET  // Frontend uses walletAddress, not userWallet
    })
  });
  
  // We expect 400 (invalid meme) or 403 (already voted), not 500 (server error)
  assert(res.status !== 500, 'Server should not return 500 for frontend format');
  
  const data = await res.json();
  // Should have proper error structure, not crash
  assert(data.success === false || data.success === true, 'Should return valid response structure');
}

async function testSchedulerStatus() {
  const res = await fetch(`${API_BASE}/api/scheduler/status`);
  const data = await res.json();
  
  assert(res.ok, `Scheduler status returned ${res.status}`);
  assert(data.success === true, 'Should return success: true');
  assert(data.data?.running !== undefined, 'Should show if scheduler is running');
  assert(data.data?.taskCount > 0, 'Should have scheduled tasks');
}

async function testMemeImageAccessible() {
  const res = await fetch(`${API_BASE}/api/memes/today`);
  const data = await res.json();
  
  if (data.memes && data.memes.length > 0) {
    const imageUrl = data.memes[0].imageUrl;
    
    // Image should be from GCS, not placeholder
    assert(!imageUrl.includes('via.placeholder.com'), 'Image should not be placeholder');
    assert(imageUrl.includes('storage.googleapis.com') || imageUrl.includes('memeforge'), 
      'Image should be from GCS or our server');
    
    // Actually fetch the image
    const imgRes = await fetch(imageUrl, { method: 'HEAD' });
    assert(imgRes.ok, `Image should be accessible (got ${imgRes.status})`);
  }
}

// ============ Run All Tests ============

async function runTests() {
  console.log('\n🧪 MemeForge API Functional Tests\n');
  console.log(`📍 API: ${API_BASE}`);
  console.log(`👛 Test Wallet: ${TEST_WALLET}\n`);
  console.log('─'.repeat(50));
  
  await test('Health endpoint', testHealthEndpoint);
  await test('Stats endpoint (weeklyVoters format)', testStatsEndpoint);
  await test('User endpoint (user.weeklyTickets format)', testUserEndpoint);
  await test('Today\'s memes (style, tags, description)', testTodaysMemesEndpoint);
  await test('Voting submit (frontend format)', testVotingSubmitFormat);
  await test('Scheduler status', testSchedulerStatus);
  await test('Meme images accessible (GCS)', testMemeImageAccessible);
  
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    console.log('❌ Failed tests:');
    results.filter(r => r.status.includes('FAIL')).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('✅ All tests passed! UX is protected.\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
