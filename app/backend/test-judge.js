/**
 * Test script: AI Judge batch scoring on today's 3 memes from production.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx XAI_API_KEY=xxx OPENAI_API_KEY=xxx node test-judge.js
 *
 * You can also test with just one key (others will show as errors):
 *   GEMINI_API_KEY=xxx node test-judge.js
 */

const { judgeDailyMemes } = require('./services/aiJudgeService');

const API_URL = 'https://memeforge-api-836651762884.asia-southeast1.run.app/api/memes/today';

async function main() {
  console.log('🔍 Fetching today\'s memes from production...\n');

  const res = await fetch(API_URL);
  const data = await res.json();
  const memes = data.memes || [];

  if (memes.length === 0) {
    console.log('❌ No memes found for today.');
    return;
  }

  console.log(`📰 Found ${memes.length} memes:`);
  for (const m of memes) {
    console.log(`  - ${m.id}: "${m.title}" (${m.imageUrl?.slice(0, 80)}...)`);
  }

  console.log('\n🤖 Running AI batch judging (3 judges × 3 memes in 3 API calls)...\n');

  const keys = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ SET' : '❌ MISSING',
    XAI_API_KEY: process.env.XAI_API_KEY ? '✅ SET' : '❌ MISSING',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ SET' : '❌ MISSING',
  };
  console.log('API Keys:', keys, '\n');

  const start = Date.now();
  const { results, winnerId } = await judgeDailyMemes(memes);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n⏱️ Completed in ${elapsed}s\n`);
  console.log('═══════════════════════════════════════════════════');

  for (const r of results) {
    const meme = memes.find(m => m.id === r.memeId);
    console.log(`\n📰 "${meme?.title}" (${r.memeId})`);
    console.log(`   Average: ${r.averageTotal}/30 (${r.judgeCount}/3 judges)`);
    console.log(`   Dimensions: VQ=${r.dimensionAverages.visual_quality} | NC=${r.dimensionAverages.news_clarity} | MI=${r.dimensionAverages.meme_impact}`);

    for (const [name, judge] of Object.entries(r.judges)) {
      if (judge.status === 'success') {
        console.log(`   ${name.padEnd(8)}: VQ=${judge.visual_quality} NC=${judge.news_clarity} MI=${judge.meme_impact} → ${judge.total}/30`);
        if (judge.reasoning) console.log(`            "${judge.reasoning}"`);
      } else {
        console.log(`   ${name.padEnd(8)}: ❌ ${judge.error}`);
      }
    }

    if (r.isWinner) console.log(`   🏆 WINNER!`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`\n🏆 Winner: ${winnerId}`);
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
