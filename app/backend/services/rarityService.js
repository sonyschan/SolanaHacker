/**
 * Rarity Service - Score-based rarity calculation using historical percentiles
 *
 * 5 Rarity Levels:
 * - Common (0-40%): Most frequent
 * - Uncommon (40-65%): 25% of memes
 * - Rare (65-85%): 20% of memes
 * - Epic (85-95%): 10% of memes
 * - Legendary (95-100%): Rarest 5%
 */

const { getFirestore, collections } = require('../config/firebase');

// Minimum historical data count before using percentile-based calculation
const COLD_START_THRESHOLD = 30;

// Fixed score thresholds for cold start period
const COLD_START_THRESHOLDS = {
  Common: { max: 4 },
  Uncommon: { max: 5.5 },
  Rare: { max: 7 },
  Epic: { max: 8.5 },
  Legendary: { max: 10 }
};

// Percentile ranges for each rarity level
const PERCENTILE_RANGES = {
  Common: { min: 0, max: 40 },
  Uncommon: { min: 40, max: 65 },
  Rare: { min: 65, max: 85 },
  Epic: { min: 85, max: 95 },
  Legendary: { min: 95, max: 100 }
};

/**
 * Get all historical meme scores from the database
 * @returns {Promise<number[]>} Sorted array of average scores
 */
async function getHistoricalScores() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('status', '==', 'active')
      .get();

    const scores = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const avgScore = data.rarity?.averageScore;
      if (typeof avgScore === 'number' && avgScore > 0) {
        scores.push(avgScore);
      }
    });

    // Sort ascending for percentile calculation
    return scores.sort((a, b) => a - b);
  } catch (error) {
    console.error('Error fetching historical scores:', error);
    return [];
  }
}

/**
 * Calculate percentile of a score within historical distribution
 * @param {number} score - The score to evaluate
 * @param {number[]} historicalScores - Sorted array of historical scores
 * @returns {number} Percentile (0-100)
 */
function calculatePercentile(score, historicalScores) {
  if (historicalScores.length === 0) return 50; // Default to middle

  const belowCount = historicalScores.filter(s => s < score).length;
  return (belowCount / historicalScores.length) * 100;
}

/**
 * Get rarity level from percentile
 * @param {number} percentile - Percentile value (0-100)
 * @returns {string} Rarity level
 */
function getRarityFromPercentile(percentile) {
  if (percentile < PERCENTILE_RANGES.Common.max) return 'Common';
  if (percentile < PERCENTILE_RANGES.Uncommon.max) return 'Uncommon';
  if (percentile < PERCENTILE_RANGES.Rare.max) return 'Rare';
  if (percentile < PERCENTILE_RANGES.Epic.max) return 'Epic';
  return 'Legendary';
}

/**
 * Get rarity from fixed score thresholds (used during cold start)
 * @param {number} score - Average score (1-10)
 * @returns {string} Rarity level
 */
function getRarityFromFixedThresholds(score) {
  if (score < COLD_START_THRESHOLDS.Common.max) return 'Common';
  if (score < COLD_START_THRESHOLDS.Uncommon.max) return 'Uncommon';
  if (score < COLD_START_THRESHOLDS.Rare.max) return 'Rare';
  if (score < COLD_START_THRESHOLDS.Epic.max) return 'Epic';
  return 'Legendary';
}

/**
 * Calculate rarity for a meme based on its average score
 * Uses percentile-based calculation if enough historical data exists,
 * otherwise falls back to fixed thresholds
 *
 * @param {number} averageScore - The meme's average score (1-10)
 * @returns {Promise<{rarity: string, percentile: number, method: string}>}
 */
async function calculateRarity(averageScore) {
  try {
    const historicalScores = await getHistoricalScores();
    const historicalCount = historicalScores.length;

    if (historicalCount < COLD_START_THRESHOLD) {
      // Cold start: use fixed thresholds
      const rarity = getRarityFromFixedThresholds(averageScore);
      console.log(`[RarityService] Cold start mode (${historicalCount}/${COLD_START_THRESHOLD}): score=${averageScore} -> ${rarity}`);

      return {
        rarity,
        percentile: null,
        method: 'fixed_threshold',
        historicalCount
      };
    }

    // Percentile-based calculation
    const percentile = calculatePercentile(averageScore, historicalScores);
    const rarity = getRarityFromPercentile(percentile);

    console.log(`[RarityService] Percentile mode: score=${averageScore}, percentile=${percentile.toFixed(1)}% -> ${rarity}`);

    return {
      rarity,
      percentile: Math.round(percentile * 10) / 10, // Round to 1 decimal
      method: 'percentile',
      historicalCount,
      scoreRange: {
        min: historicalScores[0],
        max: historicalScores[historicalScores.length - 1]
      }
    };
  } catch (error) {
    console.error('Error calculating rarity:', error);
    // Fallback to fixed thresholds on error
    return {
      rarity: getRarityFromFixedThresholds(averageScore),
      percentile: null,
      method: 'fallback',
      error: error.message
    };
  }
}

/**
 * Calculate average score from all rarity votes for a meme
 * @param {string} memeId - The meme ID
 * @returns {Promise<{averageScore: number, totalVotes: number}>}
 */
async function calculateMemeAverageScore(memeId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(collections.VOTES)
      .where('memeId', '==', memeId)
      .where('voteType', '==', 'rarity')
      .where('status', '==', 'active')
      .get();

    if (snapshot.empty) {
      return { averageScore: 0, totalVotes: 0 };
    }

    let totalScore = 0;
    let voteCount = 0;

    snapshot.forEach(doc => {
      const vote = doc.data();
      if (typeof vote.score === 'number') {
        totalScore += vote.score;
        voteCount++;
      }
    });

    const averageScore = voteCount > 0 ? totalScore / voteCount : 0;

    return {
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      totalVotes: voteCount
    };
  } catch (error) {
    console.error('Error calculating meme average score:', error);
    return { averageScore: 0, totalVotes: 0 };
  }
}

/**
 * Update meme's rarity based on current votes
 * Called after voting ends or when recalculating
 * @param {string} memeId - The meme ID
 * @returns {Promise<{success: boolean, rarity: object}>}
 */
async function updateMemeRarity(memeId) {
  try {
    const { averageScore, totalVotes } = await calculateMemeAverageScore(memeId);

    if (totalVotes === 0) {
      console.log(`[RarityService] No votes for meme ${memeId}, skipping rarity update`);
      return { success: false, reason: 'no_votes' };
    }

    const rarityResult = await calculateRarity(averageScore);

    const db = getFirestore();
    await db.collection(collections.MEMES).doc(memeId).update({
      'rarity.averageScore': averageScore,
      'rarity.totalVotes': totalVotes,
      'rarity.rarity': rarityResult.rarity,
      'rarity.percentile': rarityResult.percentile,
      'rarity.method': rarityResult.method,
      'rarity.calculatedAt': new Date().toISOString()
    });

    console.log(`[RarityService] Updated meme ${memeId}: avgScore=${averageScore}, rarity=${rarityResult.rarity}`);

    return {
      success: true,
      rarity: {
        averageScore,
        totalVotes,
        ...rarityResult
      }
    };
  } catch (error) {
    console.error('Error updating meme rarity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get rarity distribution statistics
 * @returns {Promise<object>} Distribution stats
 */
async function getRarityDistribution() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('status', '==', 'active')
      .get();

    const distribution = {
      Common: 0,
      Uncommon: 0,
      Rare: 0,
      Epic: 0,
      Legendary: 0,
      Unrated: 0
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      const rarity = data.rarity?.rarity;
      if (rarity && distribution.hasOwnProperty(rarity)) {
        distribution[rarity]++;
      } else {
        distribution.Unrated++;
      }
    });

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    return {
      counts: distribution,
      percentages: {
        Common: total > 0 ? ((distribution.Common / total) * 100).toFixed(1) : 0,
        Uncommon: total > 0 ? ((distribution.Uncommon / total) * 100).toFixed(1) : 0,
        Rare: total > 0 ? ((distribution.Rare / total) * 100).toFixed(1) : 0,
        Epic: total > 0 ? ((distribution.Epic / total) * 100).toFixed(1) : 0,
        Legendary: total > 0 ? ((distribution.Legendary / total) * 100).toFixed(1) : 0
      },
      total
    };
  } catch (error) {
    console.error('Error getting rarity distribution:', error);
    return { counts: {}, percentages: {}, total: 0, error: error.message };
  }
}

module.exports = {
  calculateRarity,
  calculateMemeAverageScore,
  updateMemeRarity,
  getRarityDistribution,
  getHistoricalScores,
  calculatePercentile,
  getRarityFromPercentile,
  getRarityFromFixedThresholds,
  // Constants for external use
  COLD_START_THRESHOLD,
  PERCENTILE_RANGES
};
