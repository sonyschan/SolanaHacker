/**
 * MemeForge Scheduler Service
 * 
 * 管理所有自動化任務：
 * - 每日梗圖生成 (UTC 00:00)
 * - 投票期結束處理 (24-48小時週期)
 * - 稀有度計算自動化
 * - 週日彩票開獎 (UTC 20:00)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CloudSchedulerClient } from '@google-cloud/scheduler';
import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';

class SchedulerService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.firestore = new Firestore();
    this.storage = new Storage();
    this.scheduler = new CloudSchedulerClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.region = process.env.GOOGLE_CLOUD_REGION;
  }

  /**
   * 初始化所有 Cloud Scheduler 任務
   */
  async initializeScheduledJobs() {
    const jobs = [
      {
        name: 'daily-meme-generation',
        schedule: '0 0 * * *', // 每日 UTC 00:00
        timeZone: 'UTC',
        httpTarget: {
          uri: `${process.env.API_BASE_URL}/api/scheduler/daily-memes`,
          httpMethod: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.SCHEDULER_SECRET}` }
        },
        description: '每日 AI 梗圖生成任務'
      },
      {
        name: 'voting-period-check',
        schedule: '0 */6 * * *', // 每 6 小時檢查一次
        timeZone: 'UTC',
        httpTarget: {
          uri: `${process.env.API_BASE_URL}/api/scheduler/check-voting-periods`,
          httpMethod: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.SCHEDULER_SECRET}` }
        },
        description: '檢查投票期狀態和自動結束處理'
      },
      {
        name: 'weekly-lottery-draw',
        schedule: '0 20 * * SUN', // 每週日 UTC 20:00
        timeZone: 'UTC',
        httpTarget: {
          uri: `${process.env.API_BASE_URL}/api/scheduler/weekly-lottery`,
          httpMethod: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.SCHEDULER_SECRET}` }
        },
        description: '週日彩票開獎'
      }
    ];

    for (const job of jobs) {
      await this.createOrUpdateSchedulerJob(job);
    }

    console.log('✅ All scheduler jobs initialized');
  }

  /**
   * 建立或更新 Cloud Scheduler 任務
   */
  async createOrUpdateSchedulerJob(jobConfig) {
    const parent = this.scheduler.locationPath(this.projectId, this.region);
    const jobName = `${parent}/jobs/${jobConfig.name}`;

    try {
      // 嘗試更新現有任務
      await this.scheduler.updateJob({
        job: {
          name: jobName,
          schedule: jobConfig.schedule,
          timeZone: jobConfig.timeZone,
          httpTarget: jobConfig.httpTarget,
          description: jobConfig.description
        }
      });
      console.log(`📝 Updated scheduler job: ${jobConfig.name}`);
    } catch (error) {
      if (error.code === 5) { // NOT_FOUND
        // 建立新任務
        await this.scheduler.createJob({
          parent,
          job: {
            name: jobName,
            schedule: jobConfig.schedule,
            timeZone: jobConfig.timeZone,
            httpTarget: jobConfig.httpTarget,
            description: jobConfig.description
          }
        });
        console.log(`✅ Created scheduler job: ${jobConfig.name}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * 每日 AI 梗圖生成任務
   */
  async generateDailyMemes() {
    console.log('🎨 Starting daily meme generation...');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const existingMemes = await this.checkExistingMemes(today);
    
    if (existingMemes.length >= 3) {
      console.log(`✅ Today's memes already generated: ${existingMemes.length}`);
      return { success: true, memes: existingMemes };
    }

    // 3 種不同風格的 Prompt 策略
    const promptTemplates = [
      {
        type: 'crypto_trend',
        prompt: `Create a humorous cryptocurrency meme about recent market trends. 
        Include relatable situations that crypto investors face. 
        Style: Bold text overlay on contrasting background. 
        Make it funny but not offensive. High visual impact.`,
        temperature: 0.8
      },
      {
        type: 'ai_tech',
        prompt: `Generate a funny meme about AI and technology in daily life. 
        Focus on unexpected AI behaviors or human-AI interactions.
        Style: Modern meme template with comparison or reaction format.
        Keep it accessible to general audience.`,
        temperature: 0.9
      },
      {
        type: 'community_social',
        prompt: `Create a meme about online community culture and social media behavior.
        Include current internet trends but keep family-friendly.
        Style: Reaction meme or before/after comparison.
        Should be shareable and viral-worthy.`,
        temperature: 0.85
      }
    ];

    const generatedMemes = [];
    const bucket = this.storage.bucket(process.env.STORAGE_BUCKET);

    for (let i = 0; i < 3; i++) {
      try {
        const template = promptTemplates[i];
        const randomSeed = Math.floor(Math.random() * 10000);
        
        const enhancedPrompt = `${template.prompt}
        
        Additional requirements:
        - Unique seed: ${randomSeed}
        - Date: ${today}
        - Must be completely different from other memes generated today
        - High contrast colors for mobile readability
        - Text should be readable at thumbnail size`;

        console.log(`🎭 Generating ${template.type} meme...`);

        const model = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          generationConfig: {
            temperature: template.temperature,
            maxOutputTokens: 1024
          }
        });

        // 生成圖像
        const result = await model.generateContent([enhancedPrompt]);
        
        // TODO: 實際圖像生成邏輯 - 目前 Gemini API 主要是文字，需要整合圖像生成
        // 暫時創建模擬數據結構，實際部署時需要實作圖像生成
        
        const memeData = {
          id: `meme_${today}_${i + 1}`,
          type: template.type,
          prompt: template.prompt,
          generatedAt: new Date().toISOString(),
          imageUrl: `gs://${process.env.STORAGE_BUCKET}/memes/${today}/meme_${i + 1}.png`,
          metadata: {
            seed: randomSeed,
            temperature: template.temperature,
            model: 'gemini-1.5-flash'
          }
        };

        // 儲存到 Firestore
        await this.firestore.collection('dailyMemes').doc(`${today}_${i + 1}`).set(memeData);
        generatedMemes.push(memeData);

        console.log(`✅ Generated meme ${i + 1}: ${template.type}`);
        
        // 間隔 2 秒避免 API Rate Limit
        await this.sleep(2000);

      } catch (error) {
        console.error(`❌ Failed to generate meme ${i + 1}:`, error);
        
        // 使用備用梗圖
        const fallbackMeme = await this.getFallbackMeme(today, i + 1);
        generatedMemes.push(fallbackMeme);
      }
    }

    // 驗證生成品質
    const qualityCheck = this.validateMemeQuality(generatedMemes);
    if (!qualityCheck.passed) {
      console.warn('⚠️ Meme quality check failed:', qualityCheck.issues);
      // 可選：重新生成低品質的梗圖
    }

    // 初始化當日投票統計
    await this.initializeDailyVoting(today, generatedMemes);

    console.log(`🎉 Daily meme generation completed: ${generatedMemes.length} memes`);
    return { success: true, memes: generatedMemes };
  }

  /**
   * 檢查投票期狀態並自動處理結束
   */
  async checkVotingPeriods() {
    console.log('🗳️ Checking voting periods...');
    
    const activePeriods = await this.firestore
      .collection('votingPeriods')
      .where('status', '==', 'active')
      .get();

    for (const doc of activePeriods.docs) {
      const period = doc.data();
      const now = new Date();
      const endTime = period.endTime.toDate();

      if (now > endTime) {
        console.log(`⏰ Voting period ${period.date} has ended, processing results...`);
        await this.processVotingResults(period.date);
      }
    }
  }

  /**
   * 處理投票結果和稀有度計算
   */
  async processVotingResults(date) {
    console.log(`📊 Processing voting results for ${date}...`);

    try {
      // 1. 計算 Step 1 結果 (選出最受歡迎梗圖)
      const step1Results = await this.calculateStep1Results(date);
      const winningMemeId = step1Results.winner;
      
      console.log(`🏆 Step 1 Winner: ${winningMemeId} (${step1Results.votes} votes)`);

      // 2. 計算 Step 2 結果 (決定稀有度)
      const step2Results = await this.calculateStep2Results(date, winningMemeId);
      const finalRarity = step2Results.rarity;
      
      console.log(`💎 Final Rarity: ${finalRarity} (${step2Results.votes} votes)`);

      // 3. 更新梗圖最終狀態
      await this.firestore.collection('dailyMemes').doc(`${date}_winner`).set({
        ...step1Results.memeData,
        finalRarity,
        totalVotes: step1Results.votes + step2Results.votes,
        step1Results,
        step2Results,
        processedAt: new Date(),
        status: 'completed'
      });

      // 4. 計算所有參與者的彩票獎勵
      await this.distributeTicketRewards(date);

      // 5. 關閉投票期
      await this.firestore.collection('votingPeriods').doc(date).update({
        status: 'completed',
        results: {
          winner: winningMemeId,
          rarity: finalRarity,
          step1Results,
          step2Results
        },
        processedAt: new Date()
      });

      console.log(`✅ Voting results processed for ${date}`);
      
      return {
        success: true,
        winner: winningMemeId,
        rarity: finalRarity,
        totalParticipants: step1Results.participants + step2Results.participants
      };

    } catch (error) {
      console.error(`❌ Failed to process voting results for ${date}:`, error);
      throw error;
    }
  }

  /**
   * 計算 Step 1 投票結果 (選出最受歡迎的梗圖)
   */
  async calculateStep1Results(date) {
    const votes = await this.firestore
      .collection('votes')
      .where('date', '==', date)
      .where('voteType', '==', 'step1')
      .get();

    const voteCounts = {};
    let totalParticipants = 0;

    votes.forEach(doc => {
      const vote = doc.data();
      const memeId = vote.choice; // 'meme1', 'meme2', or 'meme3'
      
      voteCounts[memeId] = (voteCounts[memeId] || 0) + 1;
      totalParticipants++;
    });

    // 找出得票最多的梗圖
    const winner = Object.entries(voteCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (!winner) {
      throw new Error(`No votes found for date ${date} step1`);
    }

    const [winnerId, winnerVotes] = winner;
    
    // 獲取勝出梗圖的完整數據
    const memeDoc = await this.firestore.collection('dailyMemes').doc(`${date}_${winnerId.slice(-1)}`).get();
    
    return {
      winner: winnerId,
      votes: winnerVotes,
      participants: totalParticipants,
      distribution: voteCounts,
      memeData: memeDoc.data()
    };
  }

  /**
   * 計算 Step 2 投票結果 (決定稀有度)
   */
  async calculateStep2Results(date, winningMemeId) {
    const votes = await this.firestore
      .collection('votes')
      .where('date', '==', date)
      .where('voteType', '==', 'step2')
      .where('memeId', '==', winningMemeId)
      .get();

    const rarityCounts = {
      common: 0,
      rare: 0,
      legendary: 0
    };
    
    let totalParticipants = 0;

    votes.forEach(doc => {
      const vote = doc.data();
      const rarity = vote.choice.toLowerCase();
      
      if (rarityCounts.hasOwnProperty(rarity)) {
        rarityCounts[rarity]++;
        totalParticipants++;
      }
    });

    // 找出得票最多的稀有度
    const winningRarity = Object.entries(rarityCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (!winningRarity || winningRarity[1] === 0) {
      // 預設為 common 如果沒有投票
      return {
        rarity: 'common',
        votes: 0,
        participants: 0,
        distribution: rarityCounts
      };
    }

    return {
      rarity: winningRarity[0],
      votes: winningRarity[1],
      participants: totalParticipants,
      distribution: rarityCounts
    };
  }

  /**
   * 分配彩票獎勵給所有參與者
   */
  async distributeTicketRewards(date) {
    console.log(`🎫 Distributing ticket rewards for ${date}...`);

    // 獲取所有參與者（完成兩步驟投票的用戶）
    const step1Votes = await this.firestore
      .collection('votes')
      .where('date', '==', date)
      .where('voteType', '==', 'step1')
      .get();

    const step2Votes = await this.firestore
      .collection('votes')
      .where('date', '==', date)
      .where('voteType', '==', 'step2')
      .get();

    // 找出完成兩步驟的用戶
    const step1Users = new Set();
    const step2Users = new Set();
    
    step1Votes.forEach(doc => step1Users.add(doc.data().userId));
    step2Votes.forEach(doc => step2Users.add(doc.data().userId));

    const completeParticipants = [...step1Users].filter(userId => step2Users.has(userId));
    
    console.log(`👥 Complete participants: ${completeParticipants.length}`);

    // 計算每個用戶的彩票獎勵
    const batch = this.firestore.batch();
    let totalTicketsDistributed = 0;

    for (const userId of completeParticipants) {
      try {
        // 獲取用戶的連續投票天數
        const consecutiveDays = await this.getUserConsecutiveDays(userId, date);
        
        // 計算彩票數量 (8-15 基礎 + 連續獎勵)
        const baseTickets = Math.floor(Math.random() * 8) + 8; // 8-15 隨機
        const streakBonus = consecutiveDays >= 4 ? Math.floor(Math.random() * 3) + 1 : 0;
        const capBonus = consecutiveDays >= 8 ? 2 : 0;
        const totalTickets = Math.min(baseTickets + streakBonus + capBonus, 15);

        // 創建彩票記錄
        const ticketRef = this.firestore.collection('tickets').doc(`${date}_${userId}`);
        batch.set(ticketRef, {
          userId,
          date,
          tickets: totalTickets,
          consecutiveDays,
          breakdown: {
            base: baseTickets,
            streakBonus,
            capBonus
          },
          distributedAt: new Date()
        });

        totalTicketsDistributed += totalTickets;

      } catch (error) {
        console.error(`❌ Failed to calculate tickets for user ${userId}:`, error);
      }
    }

    // 執行批次寫入
    await batch.commit();

    // 更新當日統計
    await this.firestore.collection('dailyStats').doc(date).set({
      participants: completeParticipants.length,
      totalTicketsDistributed,
      averageTicketsPerUser: totalTicketsDistributed / completeParticipants.length,
      distributedAt: new Date()
    }, { merge: true });

    console.log(`✅ Distributed ${totalTicketsDistributed} tickets to ${completeParticipants.length} users`);
  }

  /**
   * 週日彩票開獎
   */
  async weeklyLotteryDraw() {
    console.log('🎰 Starting weekly lottery draw...');

    const today = new Date();
    const thisWeek = this.getWeekDateRange(today);
    
    // 收集本週所有彩票
    const weeklyTickets = await this.collectWeeklyTickets(thisWeek);
    
    if (weeklyTickets.totalTickets === 0) {
      console.log('📭 No tickets found for this week');
      return { success: false, reason: 'No participants' };
    }

    // MVP 階段：模擬獎池
    const prizePool = this.calculatePrizePool(weeklyTickets.totalTickets);
    
    // 隨機選出中獎者
    const winners = this.drawRandomWinners(weeklyTickets, prizePool);
    
    // 記錄開獎結果
    await this.recordLotteryResults(thisWeek, winners, prizePool, weeklyTickets);
    
    console.log(`🎊 Weekly lottery completed: ${winners.length} winners, ${prizePool.total} SOL distributed`);
    
    return {
      success: true,
      winners,
      prizePool,
      totalParticipants: weeklyTickets.participants.length,
      totalTickets: weeklyTickets.totalTickets
    };
  }

  // ===== 輔助方法 =====

  async checkExistingMemes(date) {
    const memes = await this.firestore
      .collection('dailyMemes')
      .where('generatedDate', '==', date)
      .get();
    
    return memes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getFallbackMeme(date, index) {
    // 返回預設的備用梗圖
    return {
      id: `fallback_${date}_${index}`,
      type: 'fallback',
      prompt: 'Fallback meme due to generation failure',
      generatedAt: new Date().toISOString(),
      imageUrl: `gs://${process.env.STORAGE_BUCKET}/fallback/default_meme_${index}.png`,
      metadata: { type: 'fallback' }
    };
  }

  validateMemeQuality(memes) {
    const issues = [];
    
    // 檢查是否有重複類型
    const types = memes.map(m => m.type);
    const uniqueTypes = new Set(types);
    
    if (uniqueTypes.size < types.length) {
      issues.push('Duplicate meme types detected');
    }
    
    // 檢查是否都成功生成
    const fallbackCount = memes.filter(m => m.type === 'fallback').length;
    if (fallbackCount > 1) {
      issues.push(`Too many fallback memes: ${fallbackCount}`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  async initializeDailyVoting(date, memes) {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + parseInt(process.env.VOTING_PERIOD_HOURS || '24'));

    await this.firestore.collection('votingPeriods').doc(date).set({
      date,
      memes: memes.map(m => m.id),
      startTime: new Date(),
      endTime,
      status: 'active',
      phase: 'step1' // 開始時為第一階段
    });
  }

  async getUserConsecutiveDays(userId, currentDate) {
    // 簡化版：查詢用戶最近的投票記錄
    const recentVotes = await this.firestore
      .collection('votes')
      .where('userId', '==', userId)
      .where('voteType', '==', 'step2') // 完整投票的標記
      .orderBy('timestamp', 'desc')
      .limit(30)
      .get();

    if (recentVotes.empty) return 0;

    // 計算連續天數邏輯
    let consecutiveDays = 0;
    let currentCheck = new Date(currentDate);
    currentCheck.setDate(currentCheck.getDate() - 1); // 從昨天開始檢查

    for (const voteDoc of recentVotes.docs) {
      const voteDate = voteDoc.data().timestamp.toDate();
      const voteDateStr = voteDate.toISOString().split('T')[0];
      const checkDateStr = currentCheck.toISOString().split('T')[0];

      if (voteDateStr === checkDateStr) {
        consecutiveDays++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  getWeekDateRange(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // 本週日
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // 本週六
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  async collectWeeklyTickets(weekRange) {
    const tickets = await this.firestore
      .collection('tickets')
      .where('distributedAt', '>=', weekRange.start)
      .where('distributedAt', '<=', weekRange.end)
      .get();

    const participants = [];
    let totalTickets = 0;

    tickets.forEach(doc => {
      const ticket = doc.data();
      participants.push({
        userId: ticket.userId,
        tickets: ticket.tickets,
        date: ticket.date
      });
      totalTickets += ticket.tickets;
    });

    return { participants, totalTickets };
  }

  calculatePrizePool(totalTickets) {
    // MVP 階段：模擬獎池計算
    const basePool = Math.max(10, totalTickets * 0.1); // 每張彩票約 0.1 SOL 價值
    
    return {
      total: basePool,
      breakdown: {
        firstPrize: basePool * 0.5,    // 50% 給第一名
        secondPrize: basePool * 0.3,   // 30% 給第二名  
        thirdPrize: basePool * 0.2     // 20% 給第三名
      },
      note: 'MVP 階段模擬獎池，實際部署時將來自 NFT 拍賣收益'
    };
  }

  drawRandomWinners(weeklyTickets, prizePool) {
    const winners = [];
    const ticketPool = [];

    // 建立加權彩票池
    weeklyTickets.participants.forEach(participant => {
      for (let i = 0; i < participant.tickets; i++) {
        ticketPool.push(participant.userId);
      }
    });

    // 隨機選出 3 名中獎者 (不重複)
    const usedIndexes = new Set();
    const prizeNames = ['firstPrize', 'secondPrize', 'thirdPrize'];

    for (let i = 0; i < 3 && usedIndexes.size < ticketPool.length; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * ticketPool.length);
      } while (usedIndexes.has(randomIndex));

      usedIndexes.add(randomIndex);
      const winnerId = ticketPool[randomIndex];
      
      winners.push({
        userId: winnerId,
        prize: prizeNames[i],
        amount: prizePool.breakdown[prizeNames[i]],
        ticketIndex: randomIndex,
        rank: i + 1
      });
    }

    return winners;
  }

  async recordLotteryResults(weekRange, winners, prizePool, weeklyTickets) {
    const resultDoc = {
      weekStart: weekRange.start,
      weekEnd: weekRange.end,
      drawDate: new Date(),
      winners,
      prizePool,
      totalParticipants: weeklyTickets.participants.length,
      totalTickets: weeklyTickets.totalTickets,
      status: 'completed'
    };

    const weekId = weekRange.start.toISOString().split('T')[0];
    await this.firestore.collection('lotteryResults').doc(weekId).set(resultDoc);

    // 通知中獎者（後續可接入 Telegram 或 Email）
    for (const winner of winners) {
      console.log(`🏆 Winner: ${winner.userId} - ${winner.prize}: ${winner.amount} SOL`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 獲取排程系統狀態 (用於前端顯示)
   */
  async getSchedulerStatus() {
    try {
      const jobs = await this.scheduler.listJobs({
        parent: this.scheduler.locationPath(this.projectId, this.region)
      });

      const status = {
        totalJobs: jobs[0].length,
        jobs: jobs[0].map(job => ({
          name: job.name.split('/').pop(),
          schedule: job.schedule,
          state: job.state,
          lastRun: job.lastAttemptTime,
          nextRun: job.scheduleTime
        })),
        lastCheck: new Date().toISOString()
      };

      return status;
    } catch (error) {
      console.error('Failed to get scheduler status:', error);
      return { error: error.message };
    }
  }
}

export default SchedulerService;