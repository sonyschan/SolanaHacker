const { getFirestore, collections, dbUtils } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Daily Lottery Controller
 *
 * Core lottery logic: weighted draw from users/{wallet}.weeklyTickets,
 * opt-in/out toggle, ticket reset after draw, idempotent daily draws.
 */

// ==================== Helper ====================

/**
 * Get next daily draw time (today or tomorrow at 23:56 UTC)
 */
function getNextDrawTime() {
  const now = new Date();
  const todayDraw = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    23, 56, 0, 0
  ));

  if (now < todayDraw) {
    return todayDraw.toISOString();
  }
  // Already past today's draw — next is tomorrow
  const tomorrow = new Date(todayDraw);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString();
}

/**
 * Get today's date string in YYYY-MM-DD (UTC)
 */
function getTodayId() {
  return new Date().toISOString().split('T')[0];
}

// ==================== Core ====================

/**
 * Run the daily lottery draw (called by scheduler at 23:56 UTC)
 *
 * 1. Idempotency check
 * 2. Find today's winning meme
 * 3. Gather participants (weeklyTickets > 0, lotteryOptIn !== false)
 * 4. Weighted random selection
 * 5. Record draw, update meme nftOwner, update winner user
 * 6. Reset participants' tickets to 0
 */
async function runDailyLottery() {
  const today = getTodayId();
  console.log(`🎰 Running daily lottery for ${today}...`);

  // 1. Idempotency — skip if draw already exists
  const existing = await dbUtils.getDocument(collections.LOTTERY_DRAWS, today);
  if (existing) {
    console.log(`⏭️ Draw already completed for ${today}`);
    return { skipped: true, drawId: today, reason: 'already_completed' };
  }

  // 2. Find today's winning meme
  const db = getFirestore();
  const memesSnap = await db.collection(collections.MEMES)
    .where('isWinner', '==', true)
    .get();

  // Filter in code: votingCompleted starts with today
  let winningMeme = null;
  memesSnap.forEach(doc => {
    const data = doc.data();
    if (data.votingCompleted && data.votingCompleted.startsWith(today)) {
      winningMeme = { id: doc.id, ...data };
    }
  });

  if (!winningMeme) {
    console.log(`⚠️ No winning meme found for ${today}`);
    await dbUtils.setDocument(collections.LOTTERY_DRAWS, today, {
      id: today,
      date: today,
      drawTime: new Date().toISOString(),
      winnerWallet: null,
      winnerTickets: 0,
      totalParticipants: 0,
      totalTickets: 0,
      winningMemeId: null,
      status: 'no_winner_meme'
    });
    return { drawId: today, status: 'no_winner_meme' };
  }

  // 3. Get participants: users with weeklyTickets > 0
  const usersSnap = await db.collection(collections.USERS)
    .where('weeklyTickets', '>', 0)
    .get();

  // Filter for opt-in (missing field = true)
  const participants = [];
  const nonParticipants = [];
  usersSnap.forEach(doc => {
    const data = { id: doc.id, ...doc.data() };
    if (data.lotteryOptIn === false) {
      nonParticipants.push(data);
    } else {
      participants.push(data);
    }
  });

  if (participants.length === 0) {
    console.log(`⚠️ No participants for ${today} draw`);
    await dbUtils.setDocument(collections.LOTTERY_DRAWS, today, {
      id: today,
      date: today,
      drawTime: new Date().toISOString(),
      winnerWallet: null,
      winnerTickets: 0,
      totalParticipants: 0,
      totalTickets: 0,
      winningMemeId: winningMeme.id,
      status: 'no_participants'
    });
    return { drawId: today, status: 'no_participants' };
  }

  // 4. Weighted random selection
  const totalTickets = participants.reduce((sum, u) => sum + (u.weeklyTickets || 0), 0);
  let winner;

  if (participants.length === 1) {
    winner = participants[0];
  } else {
    const rand = Math.floor(Math.random() * totalTickets);
    let cumulative = 0;
    for (const p of participants) {
      cumulative += (p.weeklyTickets || 0);
      if (rand < cumulative) {
        winner = p;
        break;
      }
    }
    // Safety fallback
    if (!winner) winner = participants[participants.length - 1];
  }

  console.log(`🎉 Winner: ${winner.id} with ${winner.weeklyTickets} tickets (total pool: ${totalTickets})`);

  // 5. Record draw
  const drawData = {
    id: today,
    date: today,
    drawTime: new Date().toISOString(),
    winnerWallet: winner.id,
    winnerTickets: winner.weeklyTickets || 0,
    totalParticipants: participants.length,
    totalTickets,
    winningMemeId: winningMeme.id,
    status: 'completed'
  };
  await dbUtils.setDocument(collections.LOTTERY_DRAWS, today, drawData);

  // 6. Update meme with nftOwner
  await dbUtils.updateDocument(collections.MEMES, winningMeme.id, {
    nftOwner: {
      walletAddress: winner.id,
      selectedAt: new Date().toISOString(),
      drawId: today,
      claimTxSignature: null,
      mintAddress: null
    }
  });

  // 7. Update winner user — append to nftWins array
  const winnerRef = db.collection(collections.USERS).doc(winner.id);
  await winnerRef.update({
    nftWins: admin.firestore.FieldValue.arrayUnion({
      memeId: winningMeme.id,
      drawId: today,
      selectedAt: new Date().toISOString(),
      claimed: false
    })
  });

  // 8. Reset participants' tickets (batch max 500)
  const BATCH_LIMIT = 500;
  for (let i = 0; i < participants.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = participants.slice(i, i + BATCH_LIMIT);
    for (const p of chunk) {
      batch.update(db.collection(collections.USERS).doc(p.id), {
        weeklyTickets: 0
      });
    }
    await batch.commit();
  }

  console.log(`✅ Daily lottery complete. Reset ${participants.length} participants' tickets. ${nonParticipants.length} non-participants kept tickets.`);

  return { drawId: today, status: 'completed', winner: winner.id, memeId: winningMeme.id };
}

// ==================== Toggle ====================

/**
 * Toggle lottery opt-in for a user
 */
async function toggleLotteryOptIn(walletAddress, optIn) {
  if (!walletAddress) throw new Error('walletAddress required');

  await dbUtils.setDocument(collections.USERS, walletAddress, {
    lotteryOptIn: !!optIn
  });

  return { walletAddress, lotteryOptIn: !!optIn };
}

// ==================== Read endpoints ====================

/**
 * Get today's draw status
 */
async function getCurrentLottery() {
  const today = getTodayId();
  const draw = await dbUtils.getDocument(collections.LOTTERY_DRAWS, today);

  let winningMeme = null;
  if (draw && draw.winningMemeId) {
    winningMeme = await dbUtils.getDocument(collections.MEMES, draw.winningMemeId);
  }

  // Current pool stats
  const db = getFirestore();
  const usersSnap = await db.collection(collections.USERS)
    .where('weeklyTickets', '>', 0)
    .get();

  let participantCount = 0;
  let totalTickets = 0;
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.lotteryOptIn !== false) {
      participantCount++;
      totalTickets += (data.weeklyTickets || 0);
    }
  });

  return {
    date: today,
    drawCompleted: !!draw,
    result: draw || null,
    winningMeme: winningMeme ? { id: winningMeme.id, title: winningMeme.title, imageUrl: winningMeme.imageUrl } : null,
    participantCount,
    totalTickets,
    nextDrawTime: getNextDrawTime()
  };
}

/**
 * Get lottery draw history
 */
async function getLotteryHistory({ page = 1, limit = 20 } = {}) {
  const db = getFirestore();
  const snapshot = await db.collection(collections.LOTTERY_DRAWS)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get lottery pool stats
 */
async function getLotteryStats() {
  const db = getFirestore();

  // Participating users with tickets > 0
  const usersSnap = await db.collection(collections.USERS)
    .where('weeklyTickets', '>', 0)
    .get();

  let participantCount = 0;
  let totalTickets = 0;
  usersSnap.forEach(doc => {
    const data = doc.data();
    if (data.lotteryOptIn !== false) {
      participantCount++;
      totalTickets += (data.weeklyTickets || 0);
    }
  });

  // Recent draws
  const drawsSnap = await db.collection(collections.LOTTERY_DRAWS)
    .orderBy('date', 'desc')
    .limit(5)
    .get();

  const recentDraws = drawsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    participantCount,
    totalTickets,
    nextDrawTime: getNextDrawTime(),
    recentDraws
  };
}

/**
 * Get user lottery data
 */
async function getUserLotteryData(wallet) {
  if (!wallet) throw new Error('wallet required');

  const user = await dbUtils.getDocument(collections.USERS, wallet);
  if (!user) {
    return {
      walletAddress: wallet,
      weeklyTickets: 0,
      lotteryOptIn: true,
      nftWins: []
    };
  }

  return {
    walletAddress: wallet,
    weeklyTickets: user.weeklyTickets || 0,
    lotteryOptIn: user.lotteryOptIn !== false,
    nftWins: user.nftWins || []
  };
}

module.exports = {
  runDailyLottery,
  toggleLotteryOptIn,
  getCurrentLottery,
  getLotteryHistory,
  getLotteryStats,
  getNextDrawTime,
  getUserLotteryData
};
