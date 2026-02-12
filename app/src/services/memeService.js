/**
 * MemeForge Frontend API Service
 * 前端 API 呼叫服務 - 連接到 GCP Gemini 3 Pro Image 後端
 */

// 優先使用 GCP 後端，回退到本地
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://165.22.136.40:3001';

class MemeService {
  
  /**
   * Test backend connections
   */
  async testConnections() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Get today's memes - 直接從 GCP Gemini 3 Pro Image 後端獲取
   */
  async getTodaysMemes() {
    try {
      console.log('🌐 連接到 GCP Gemini 3 Pro Image 後端:', API_BASE_URL);
      
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
      console.log('✅ 成功獲取 Gemini 3 Pro 生成的梗圖:', result);
      
      return result;
    } catch (error) {
      console.error('❌ 獲取 Gemini 3 梗圖失敗:', error);
      console.log('🔄 使用後備梗圖...');
      return {
        success: false,
        error: error.message,
        memes: this.getFallbackMemes(),
        fallback: true
      };
    }
  }

  /**
   * Generate daily memes - 調用 GCP Gemini 3 Pro Image 生成
   */
  async generateDailyMemes() {
    try {
      console.log('📅 呼叫 GCP 生成每日梗圖...');
      
      const response = await fetch(`${API_BASE_URL}/api/memes/generate-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 3  // Generate 3 memes per day
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Gemini 3 Pro 每日梗圖已生成:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Gemini 3 Pro 梗圖生成失敗:', error);
      return {
        success: false,
        error: error.message,
        memes: this.getFallbackMemes()
      };
    }
  }

  /**
   * Generate a single custom meme
   */
  async generateMeme(prompt, theme = 'crypto') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          theme,
          style: 'funny'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Meme generation failed:', error);
      return {
        success: false,
        error: error.message,
        meme: null
      };
    }
  }

  /**
   * Get fallback memes when backend is not available
   */
  getFallbackMemes() {
    return [
      {
        id: 'fallback-1',
        title: 'AI Dreams of Electric Sheep',
        description: 'When AI tries to understand crypto volatility',
        imageUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=AI+Dreams', 
        image: '🤖💭', // Emoji fallback
        prompt: 'A confused robot looking at crypto charts',
        newsSource: 'Mock Crypto News',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: {
          selection: { yes: 89, no: 23 },
          rarity: { common: 45, rare: 67, legendary: 123 }
        },
        metadata: {
          fallback: true,
          note: 'Backend connection failed - using fallback data'
        }
      },
      {
        id: 'fallback-2', 
        title: 'Diamond Hands Forever',
        description: 'HODLers when market crashes but they keep buying',
        imageUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Diamond+Hands',
        image: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Diamond+Hands',
        prompt: 'Diamond hands meme with crypto theme',
        newsSource: 'Mock DeFi News',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active', 
        votes: {
          selection: { yes: 134, no: 45 },
          rarity: { common: 67, rare: 89, legendary: 178 }
        },
        metadata: {
          fallback: true,
          note: 'Backend connection failed - using fallback data'
        }
      },
      {
        id: 'fallback-3',
        title: 'This Is Fine DeFi',
        description: 'DeFi users when gas fees are $200+',
        imageUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=This+Is+Fine',
        image: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=This+Is+Fine',
        prompt: 'This is fine meme but with DeFi theme',
        newsSource: 'Mock Solana News',
        generatedAt: new Date().toISOString(),
        type: 'fallback',
        status: 'active',
        votes: {
          selection: { yes: 98, no: 67 },
          rarity: { common: 56, rare: 78, legendary: 134 }
        },
        metadata: {
          fallback: true,
          note: 'Backend connection failed - using fallback data'
        }
      }
    ];
  }
}

// Create singleton instance
const memeService = new MemeService();

export default memeService;