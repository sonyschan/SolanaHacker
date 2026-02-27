/**
 * One-time backfill: recalculate finalRarity for all memes using
 * the percentile-based rarityService instead of legacy vote counts.
 *
 * Usage: cd app/backend && node scripts/backfill-rarity.js [--dry-run]
 * Requires: .env with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { getFirestore, collections, initializeFirebase } = require('../config/firebase');
const rarityService = require('../services/rarityService');

async function backfillRarity(dryRun = false) {
  initializeFirebase();
  const db = getFirestore();

  console.log(`\n🔄 Backfilling meme rarity${dryRun ? ' (DRY RUN)' : ''}...\n`);

  const snapshot = await db.collection(collections.MEMES).get();
  console.log(`Found ${snapshot.size} total memes\n`);

  let updated = 0;
  let skipped = 0;
  let noScore = 0;
  const changes = [];

  for (const doc of snapshot.docs) {
    const meme = doc.data();
    const id = doc.id;
    const avgScore = meme.rarity?.averageScore;

    if (typeof avgScore !== 'number' || avgScore <= 0) {
      noScore++;
      continue;
    }

    const result = await rarityService.calculateRarity(avgScore);
    const newRarity = result.rarity.toLowerCase();
    const oldRarity = (meme.finalRarity || '').toLowerCase();

    if (newRarity === oldRarity) {
      skipped++;
      continue;
    }

    changes.push({
      id: id.slice(0, 12),
      title: (meme.title || '').slice(0, 30),
      avgScore,
      percentile: result.percentile,
      old: oldRarity || '(none)',
      new: newRarity,
    });

    if (!dryRun) {
      await db.collection(collections.MEMES).doc(id).update({
        finalRarity: newRarity,
      });
    }

    updated++;
  }

  // Print changes table
  if (changes.length > 0) {
    console.log('Changes:');
    console.log('-'.repeat(100));
    console.log(
      'ID'.padEnd(14) +
      'Title'.padEnd(32) +
      'Score'.padEnd(8) +
      'Pctl'.padEnd(8) +
      'Old'.padEnd(14) +
      'New'
    );
    console.log('-'.repeat(100));
    for (const c of changes) {
      console.log(
        c.id.padEnd(14) +
        c.title.padEnd(32) +
        String(c.avgScore).padEnd(8) +
        String(c.percentile ?? 'N/A').padEnd(8) +
        c.old.padEnd(14) +
        c.new
      );
    }
    console.log('-'.repeat(100));
  }

  console.log(`\n✅ Done: ${updated} updated, ${skipped} unchanged, ${noScore} no score data\n`);
}

const dryRun = process.argv.includes('--dry-run');
backfillRarity(dryRun)
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1); });
