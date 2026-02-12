/**
 * MemeForge Meme Service
 * 
 * 架構：
 * - READ：Cloud Run API (每日梗圖不需要即時同步)
 * - WRITE：Cloud Run API (驗證 + 防刷)
 * - AI 生成：Cloud Run API (Gemini)
 */

// Cloud Run API for all meme operations
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

class MemeService {
  
  /**
   * 獲取今日梗圖 (直接從 API，已有日期過濾 + limit 3)
   */
  async getTodaysMemes() {
    try {
      console.log('🌐 從 Cloud Run API 獲取今日梗圖...');
      
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
      console.log('✅ 獲取成功，', result.memes?.length || 0, '個梗圖');
      
      return {
        success: true,
        memes: result.memes || [],
        source: 'cloud_run_api'
      };
      
    } catch (error) {
      console.error('❌ API 讀取失敗:', error);
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
   * 提交投票 (Cloud Run API 進行驗證)
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
      
      // 投票成功後增加週投票者計數
      if (result.success) {
        this.incrementVoters().catch(err => 
          console.warn('⚠️ 更新投票者計數失敗:', err)
        );
      }
      
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
   * 增加週投票者計數
   */
  async incrementVoters() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats/increment-voters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 投票者計數已更新:', result.stats?.weeklyVoters);
      return result;
    } catch (error) {
      console.error('❌ 更新投票者計數失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取平台統計
   */
  async getPlatformStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ 獲取統計失敗:', error);
      return { success: false, error: error.message };
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
      cloudRun: false
    };

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      results.cloudRun = response.ok;
    } catch (e) {
      results.cloudRunError = e.message;
    }

    return results;
  }

  /**
   * 後備梗圖 (API 失敗時使用)
   */
  getFallbackMemes() {
    return [
      {
        id: 'fallback-1',
        title: 'AI Dreams of Electric Sheep',
        description: 'When AI tries to understand crypto volatility',
        imageUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=AI+Dreams', 
        prompt: 'A confused robot looking at crypto charts',
        newsSource: 'Fallback Data',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: { selection: { yes: 89, no: 23 }, rarity: { common: 45, rare: 67, legendary: 123 } }
      },
      {
        id: 'fallback-2', 
        title: 'Diamond Hands Forever',
        description: 'HODLers when market crashes',
        imageUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Diamond+Hands',
        prompt: 'Diamond hands meme with crypto theme',
        newsSource: 'Fallback Data',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active', 
        votes: { selection: { yes: 134, no: 45 }, rarity: { common: 67, rare: 89, legendary: 178 } }
      },
      {
        id: 'fallback-3',
        title: 'This Is Fine DeFi',
        description: 'DeFi users when gas fees are $200+',
        imageUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=This+Is+Fine',
        prompt: 'This is fine meme but with DeFi theme',
        newsSource: 'Fallback Data',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: { selection: { yes: 98, no: 67 }, rarity: { common: 56, rare: 78, legendary: 134 } }
      }
    ];
  }
}

const memeService = new MemeService();
export default memeService;
