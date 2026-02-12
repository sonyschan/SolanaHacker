/**
 * MemeForge Meme Service
 * 
 * 架構：
 * - READ (即時)：Firebase 直連 (即時同步)
 * - WRITE：Cloud Run API (驗證 + 防刷)
 * - AI 生成：Cloud Run API (Gemini)
 */
import { getTodayMemes as getMemesFromFirebase } from './firebase';

// Cloud Run API for write operations
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

class MemeService {
  
  /**
   * 獲取今日梗圖
   * 優先使用 Firebase 直連，失敗時 fallback 到 Cloud Run API
   */
  async getTodaysMemes() {
    try {
      console.log('🔥 嘗試 Firebase 直連讀取梗圖...');
      
      const memes = await getMemesFromFirebase();
      
      if (memes && memes.length > 0) {
        console.log('✅ Firebase 直連成功，獲取', memes.length, '個梗圖');
        return {
          success: true,
          memes,
          source: 'firebase_direct'
        };
      }
      
      // Firebase 沒有數據，嘗試 Cloud Run API
      console.log('⚠️ Firebase 無數據，嘗試 Cloud Run API...');
      return await this.getMemesFromAPI();
      
    } catch (error) {
      console.error('❌ Firebase 讀取失敗:', error.message);
      console.log('🔄 Fallback 到 Cloud Run API...');
      return await this.getMemesFromAPI();
    }
  }

  /**
   * 從 Cloud Run API 獲取梗圖 (fallback)
   */
  async getMemesFromAPI() {
    try {
      console.log('🌐 連接到 Cloud Run API:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/memes/today`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Cloud Run API 成功');
      
      return {
        ...result,
        source: 'cloud_run_api'
      };
    } catch (error) {
      console.error('❌ Cloud Run API 失敗:', error);
      console.log('🔄 使用本地後備梗圖...');
      return {
        success: false,
        error: error.message,
        memes: this.getFallbackMemes(),
        source: 'fallback',
        fallback: true
      };
    }
  }

  /**
   * 提交投票 (必須走 Cloud Run API 進行驗證)
   */
  async submitVote(memeId, voteType, choice, walletAddress) {
    try {
      console.log('🗳️ 提交投票到 Cloud Run API...');
      
      const response = await fetch(`${API_BASE_URL}/api/voting/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memeId,
          voteType,
          choice,
          walletAddress
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ 投票成功:', result);
      
      return result;
    } catch (error) {
      console.error('❌ 投票失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成每日梗圖 (Cloud Run API + Gemini)
   */
  async generateDailyMemes() {
    try {
      console.log('🎨 呼叫 Cloud Run 生成每日梗圖...');
      
      const response = await fetch(`${API_BASE_URL}/api/memes/generate-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 3
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ 梗圖生成成功:', result);
      
      return result;
    } catch (error) {
      console.error('❌ 梗圖生成失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 測試連線
   */
  async testConnections() {
    const results = {
      firebase: false,
      cloudRun: false
    };

    // Test Firebase
    try {
      const memes = await getMemesFromFirebase();
      results.firebase = true;
      results.firebaseMemeCount = memes.length;
    } catch (e) {
      results.firebaseError = e.message;
    }

    // Test Cloud Run
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      results.cloudRun = response.ok;
    } catch (e) {
      results.cloudRunError = e.message;
    }

    return results;
  }

  /**
   * 後備梗圖 (所有連線都失敗時使用)
   * 不再使用外部 placeholder，由前端 CSS placeholder 處理
   */
  getFallbackMemes() {
    return [
      {
        id: 'fallback-1',
        title: 'AI Dreams of Electric Sheep',
        description: 'When AI tries to understand crypto volatility',
        imageUrl: null, // 讓前端處理 placeholder
        prompt: 'A confused robot looking at crypto charts',
        newsSource: 'Fallback Data',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: { selection: { yes: 89, no: 23 }, rarity: { common: 45, rare: 67, legendary: 123 } },
        metadata: { fallback: true, useCSSpplaceholder: true, icon: '🤖' }
      },
      {
        id: 'fallback-2', 
        title: 'Diamond Hands Forever',
        description: 'HODLers when market crashes',
        imageUrl: null, // 讓前端處理 placeholder
        prompt: 'Diamond hands meme with crypto theme',
        newsSource: 'Fallback Data',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active', 
        votes: { selection: { yes: 134, no: 45 }, rarity: { common: 67, rare: 89, legendary: 178 } },
        metadata: { fallback: true, useCSSpplaceholder: true, icon: '💎' }
      },
      {
        id: 'fallback-3',
        title: 'This Is Fine DeFi',
        description: 'DeFi users when gas fees are $200+',
        imageUrl: null, // 讓前端處理 placeholder
        prompt: 'This is fine meme but with DeFi theme',
        newsSource: 'Fallback Data',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: { selection: { yes: 98, no: 67 }, rarity: { common: 56, rare: 78, legendary: 134 } },
        metadata: { fallback: true, useCSSpplaceholder: true, icon: '🔥' }
      }
    ];
  }
}

const memeService = new MemeService();
export default memeService;
