/**
 * MemeForge API Server
 * 
 * Express.js 伺服器，提供：
 * - 投票 API (含 Rate Limiting)
 * - 排程任務端點
 * - 錢包驗證
 * - Firestore 數據同步
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Firestore } from '@google-cloud/firestore';
import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

import SchedulerService from './services/schedulerService.js';

// 環境變數載入
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// 初始化服務
const firestore = new Firestore();
const schedulerService = new SchedulerService();

// === 中間件設置 ===

// 安全性中間件
app.use(helmet({
  contentSecurityPolicy: false, // 允許 Vercel 前端
  crossOriginEmbedderPolicy: false
}));

// CORS 設定
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'https://memeforge.vercel.app',
    'https://solana-hacker.vercel.app',
    'http://localhost:5173',
    'http://165.22.136.40:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 基礎 Rate Limiting (每 IP 每小時 1000 次請求)
const generalRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

app.use(generalRateLimit);

// === 驗證中間件 ===

/**
 * JWT 驗證中間件
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * 排程任務驗證中間件
 */
const authenticateScheduler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token !== process.env.SCHEDULER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized scheduler request' });
  }

  next();
};

// === 投票相關 Rate Limiting ===

// 每用戶每日投票限制
const votingRateLimit = rateLimit({
  keyGenerator: (req) => req.user.walletAddress,
  windowMs: 24 * 60 * 60 * 1000, // 24 小時
  max: parseInt(process.env.VOTES_PER_DAY_PER_USER) || 2,
  message: { error: 'Daily voting limit reached' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/test') // 測試端點跳過限制
});

// IP-based Rate Limiting 防止多錢包刷票
const ipVotingLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 小時
  max: parseInt(process.env.VOTES_PER_DAY_PER_IP) || 10,
  message: { error: 'Too many votes from this IP address' }
});

// === API 路由 ===

/**
 * 健康檢查
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * 錢包驗證端點
 */
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { walletAddress, message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 驗證訊息時效性 (5分鐘內有效)
    const timestampMatch = message.match(/Timestamp: (.+)/);
    if (!timestampMatch) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const messageTime = new Date(timestampMatch[1]).getTime();
    const now = Date.now();
    if (now - messageTime > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Message expired' });
    }

    // 驗證 Solana 簽名
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = new Uint8Array(signature);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 生成 JWT Token
    const token = jwt.sign(
      {
        walletAddress,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 小時
      },
      process.env.JWT_SECRET
    );

    // 記錄用戶登入
    await firestore.collection('users').doc(walletAddress).set({
      lastLogin: new Date(),
      loginCount: firestore.FieldValue.increment(1)
    }, { merge: true });

    res.json({
      success: true,
      token,
      walletAddress,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Wallet verification failed:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * 獲取當日梗圖
 */
app.get('/api/memes/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const memesSnapshot = await firestore
      .collection('dailyMemes')
      .where('generatedDate', '==', today)
      .orderBy('createdAt')
      .limit(3)
      .get();

    if (memesSnapshot.empty) {
      // 如果沒有今日梗圖，觸發生成
      console.log('No memes found for today, triggering generation...');
      const generated = await schedulerService.generateDailyMemes();
      
      return res.json({
        memes: generated.memes || [],
        message: 'Memes generated on demand',
        generated: true
      });
    }

    const memes = memesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 獲取投票期狀態
    const votingPeriod = await firestore.collection('votingPeriods').doc(today).get();
    const votingStatus = votingPeriod.exists ? votingPeriod.data() : null;

    res.json({
      memes,
      votingStatus,
      date: today
    });

  } catch (error) {
    console.error('Failed to get today\'s memes:', error);
    res.status(500).json({ error: 'Failed to load memes' });
  }
});

/**
 * 提交投票
 */
app.post('/api/vote', authenticateJWT, votingRateLimit, ipVotingLimit, async (req, res) => {
  try {
    const { memeId, voteType, choice } = req.body;
    const userId = req.user.walletAddress;
    const today = new Date().toISOString().split('T')[0];

    // 驗證請求格式
    if (!memeId || !voteType || !choice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['step1', 'step2'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // 檢查投票期是否還在進行
    const votingPeriod = await firestore.collection('votingPeriods').doc(today).get();
    if (!votingPeriod.exists || votingPeriod.data().status !== 'active') {
      return res.status(400).json({ error: 'Voting period is not active' });
    }

    // 防重複投票檢查
    const existingVote = await firestore
      .collection('votes')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .where('voteType', '==', voteType)
      .get();

    if (!existingVote.empty) {
      return res.status(400).json({ 
        error: `Already voted for ${voteType} today`,
        canVoteAgain: false
      });
    }

    // 如果是 step2，檢查是否已完成 step1
    if (voteType === 'step2') {
      const step1Vote = await firestore
        .collection('votes')
        .where('userId', '==', userId)
        .where('date', '==', today)
        .where('voteType', '==', 'step1')
        .get();

      if (step1Vote.empty) {
        return res.status(400).json({ 
          error: 'Must complete step1 voting first',
          requiredStep: 'step1'
        });
      }
    }

    // 儲存投票記錄
    const voteData = {
      userId,
      memeId,
      voteType,
      choice,
      date: today,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    await firestore.collection('votes').add(voteData);

    // 即時更新投票統計
    await updateVoteStats(today, memeId, voteType, choice);

    // 彩票獎勵計算 (只在完成 step2 後)
    let ticketsAwarded = 0;
    let consecutiveDays = 0;

    if (voteType === 'step2') {
      consecutiveDays = await getUserConsecutiveDays(userId, today);
      ticketsAwarded = calculateTicketReward(consecutiveDays);

      // 發放彩票
      await firestore.collection('tickets').add({
        userId,
        date: today,
        tickets: ticketsAwarded,
        consecutiveDays,
        awardedAt: new Date(),
        breakdown: getTicketBreakdown(consecutiveDays, ticketsAwarded)
      });

      // 更新用戶連續天數記錄
      await firestore.collection('users').doc(userId).set({
        lastVoteDate: today,
        consecutiveDays,
        totalTicketsEarned: firestore.FieldValue.increment(ticketsAwarded)
      }, { merge: true });
    }

    res.json({
      success: true,
      voteType,
      ticketsAwarded,
      consecutiveDays,
      message: voteType === 'step2' 
        ? `Vote submitted! Awarded ${ticketsAwarded} tickets` 
        : 'Step 1 completed, proceed to step 2',
      nextStep: voteType === 'step1' ? 'step2' : null
    });

  } catch (error) {
    console.error('Vote submission failed:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

/**
 * 獲取投票統計
 */
app.get('/api/stats/:date?', async (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];

    const statsSnapshot = await firestore
      .collection('voteStats')
      .doc(date)
      .get();

    if (!statsSnapshot.exists) {
      return res.json({
        date,
        stats: {},
        message: 'No voting data for this date'
      });
    }

    res.json({
      date,
      stats: statsSnapshot.data()
    });

  } catch (error) {
    console.error('Failed to get voting stats:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

/**
 * 獲取用戶資料
 */
app.get('/api/user/profile', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.walletAddress;

    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // 獲取用戶本週彩票
    const thisWeekStart = getWeekStart(new Date());
    const ticketsSnapshot = await firestore
      .collection('tickets')
      .where('userId', '==', userId)
      .where('awardedAt', '>=', thisWeekStart)
      .get();

    const weeklyTickets = ticketsSnapshot.docs.reduce((total, doc) => {
      return total + doc.data().tickets;
    }, 0);

    // 檢查今日投票狀態
    const today = new Date().toISOString().split('T')[0];
    const todayVotes = await firestore
      .collection('votes')
      .where('userId', '==', userId)
      .where('date', '==', today)
      .get();

    const votingStatus = {
      step1Complete: false,
      step2Complete: false,
      todayTickets: 0
    };

    todayVotes.docs.forEach(doc => {
      const vote = doc.data();
      if (vote.voteType === 'step1') votingStatus.step1Complete = true;
      if (vote.voteType === 'step2') votingStatus.step2Complete = true;
    });

    if (votingStatus.step2Complete) {
      const todayTicket = await firestore
        .collection('tickets')
        .where('userId', '==', userId)
        .where('date', '==', today)
        .get();
      
      if (!todayTicket.empty) {
        votingStatus.todayTickets = todayTicket.docs[0].data().tickets;
      }
    }

    res.json({
      walletAddress: userId,
      consecutiveDays: userData.consecutiveDays || 0,
      totalTicketsEarned: userData.totalTicketsEarned || 0,
      weeklyTickets,
      votingStatus,
      lastLogin: userData.lastLogin,
      joinDate: userData.createdAt
    });

  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// === 排程任務端點 ===

/**
 * 每日梗圖生成 (Cloud Scheduler 呼叫)
 */
app.post('/api/scheduler/daily-memes', authenticateScheduler, async (req, res) => {
  try {
    console.log('📅 Daily meme generation triggered by scheduler');
    const result = await schedulerService.generateDailyMemes();
    
    res.json({
      success: true,
      message: `Generated ${result.memes.length} memes`,
      memes: result.memes.map(m => ({ id: m.id, type: m.type }))
    });
  } catch (error) {
    console.error('Scheduled meme generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 檢查投票期狀態 (Cloud Scheduler 呼叫)
 */
app.post('/api/scheduler/check-voting-periods', authenticateScheduler, async (req, res) => {
  try {
    console.log('🗳️ Voting periods check triggered by scheduler');
    await schedulerService.checkVotingPeriods();
    
    res.json({
      success: true,
      message: 'Voting periods checked',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Voting periods check failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 週日彩票開獎 (Cloud Scheduler 呼叫)
 */
app.post('/api/scheduler/weekly-lottery', authenticateScheduler, async (req, res) => {
  try {
    console.log('🎰 Weekly lottery draw triggered by scheduler');
    const result = await schedulerService.weeklyLotteryDraw();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Weekly lottery draw failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 手動觸發排程任務 (開發和測試用)
 */
app.post('/api/admin/trigger/:task', authenticateJWT, async (req, res) => {
  try {
    // 這裡可以添加管理員權限檢查
    const { task } = req.params;
    
    let result;
    switch (task) {
      case 'daily-memes':
        result = await schedulerService.generateDailyMemes();
        break;
      case 'check-voting':
        await schedulerService.checkVotingPeriods();
        result = { message: 'Voting periods checked' };
        break;
      case 'weekly-lottery':
        result = await schedulerService.weeklyLotteryDraw();
        break;
      default:
        return res.status(400).json({ error: 'Unknown task' });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error(`Manual task trigger failed:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 獲取排程系統狀態
 */
app.get('/api/admin/scheduler/status', authenticateJWT, async (req, res) => {
  try {
    const status = await schedulerService.getSchedulerStatus();
    res.json(status);
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    res.status(500).json({ error: error.message });
  }
});

// === 輔助函數 ===

async function updateVoteStats(date, memeId, voteType, choice) {
  const statsRef = firestore.collection('voteStats').doc(date);
  
  const increment = firestore.FieldValue.increment(1);
  
  if (voteType === 'step1') {
    await statsRef.set({
      [`step1.${choice}`]: increment,
      [`step1.total`]: increment
    }, { merge: true });
  } else if (voteType === 'step2') {
    await statsRef.set({
      [`step2.${memeId}.${choice}`]: increment,
      [`step2.${memeId}.total`]: increment
    }, { merge: true });
  }
}

async function getUserConsecutiveDays(userId, currentDate) {
  const recentVotes = await firestore
    .collection('votes')
    .where('userId', '==', userId)
    .where('voteType', '==', 'step2')
    .orderBy('timestamp', 'desc')
    .limit(30)
    .get();

  if (recentVotes.empty) return 0;

  let consecutiveDays = 0;
  let checkDate = new Date(currentDate);
  checkDate.setDate(checkDate.getDate() - 1);

  for (const voteDoc of recentVotes.docs) {
    const voteDate = voteDoc.data().date;
    const checkDateStr = checkDate.toISOString().split('T')[0];

    if (voteDate === checkDateStr) {
      consecutiveDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return consecutiveDays;
}

function calculateTicketReward(consecutiveDays) {
  const base = Math.floor(Math.random() * 8) + 8; // 8-15 隨機基礎
  const streakBonus = consecutiveDays >= 4 ? Math.floor(Math.random() * 3) + 1 : 0;
  const capBonus = consecutiveDays >= 8 ? 2 : 0;
  return Math.min(base + streakBonus + capBonus, 15);
}

function getTicketBreakdown(consecutiveDays, totalTickets) {
  const base = Math.max(8, totalTickets - (consecutiveDays >= 4 ? 3 : 0) - (consecutiveDays >= 8 ? 2 : 0));
  return {
    base,
    streakBonus: consecutiveDays >= 4 ? Math.min(3, totalTickets - base) : 0,
    capBonus: consecutiveDays >= 8 ? Math.min(2, totalTickets - base) : 0
  };
}

function getWeekStart(date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

// === 錯誤處理 ===

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// === 伺服器啟動 ===

async function startServer() {
  try {
    // 初始化排程任務 (僅在非開發環境)
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Initializing scheduler jobs...');
      await schedulerService.initializeScheduledJobs();
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 MemeForge API Server running on port ${port}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// 優雅關閉處理
process.on('SIGTERM', () => {
  console.log('📤 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📤 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 啟動伺服器
startServer();