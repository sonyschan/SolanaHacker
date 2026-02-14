/**
 * MemeForge Meme Service
 * 
 * Architecture:
 * - READ: Cloud Run API (daily memes don't need real-time sync)
 * - WRITE: Cloud Run API (validation + anti-spam)
 * - AI Generation: Cloud Run API (Gemini)
 */

// Cloud Run API for all meme operations
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

class MemeService {
  
  /**
   * Get today's memes (directly from API, with date filtering + limit 3)
   */
  async getTodaysMemes() {
    try {
      console.log('🌐 Fetching today\'s memes from Cloud Run API...');
      
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
      console.log('✅ Fetch successful,', result.memes?.length || 0, 'memes loaded');
      
      return {
        success: true,
        memes: result.memes || [],
        source: 'cloud_run_api'
      };
      
    } catch (error) {
      console.error('❌ API fetch failed:', error);
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
   * Submit vote (Cloud Run API for validation)
   */
  async submitVote(memeId, voteType, choice, walletAddress) {
    try {
      console.log('🗳️ Submitting vote to Cloud Run API...', { memeId, voteType, choice, walletAddress });

      const response = await fetch(`${API_BASE_URL}/api/voting/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memeId,
          phase: voteType,      // Backend expects 'phase' not 'voteType'
          choice,
          userWallet: walletAddress  // Backend expects 'userWallet' not 'walletAddress'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Vote successful:', result);

      // Extract data from nested response
      const voteData = result.data || result;

      // Increment weekly voter count after successful vote
      if (result.success) {
        this.incrementVoters().catch(err =>
          console.warn('⚠️ Failed to update voter count:', err)
        );
      }

      // Return with consistent structure for ForgeTab
      return {
        success: result.success,
        ticketsEarned: voteData.ticketsEarned,
        user: voteData.user,
        vote: voteData
      };
    } catch (error) {
      console.error('❌ Vote failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit score-based rarity vote (1-10)
   * Used in Phase 2 of the new voting system
   */
  async submitScoreVote(memeId, score, walletAddress) {
    try {
      console.log('🗳️ Submitting score vote to Cloud Run API...', { memeId, score, walletAddress });

      const response = await fetch(`${API_BASE_URL}/api/voting/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memeId,
          phase: 'rarity',
          score,  // NEW: numeric score (1-10)
          userWallet: walletAddress
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Score vote successful:', result);

      const voteData = result.data || result;

      // Increment weekly voter count after successful vote
      if (result.success) {
        this.incrementVoters().catch(err =>
          console.warn('⚠️ Failed to update voter count:', err)
        );
      }

      return {
        success: result.success,
        ticketsEarned: voteData.ticketsEarned,
        user: voteData.user,
        vote: voteData
      };
    } catch (error) {
      console.error('❌ Score vote failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Increment weekly voter count
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
      console.log('📊 Voter count updated:', result.stats?.weeklyVoters);
      return result;
    } catch (error) {
      console.error('❌ Failed to update voter count:', error);
      throw error;
    }
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate daily memes (Cloud Run API + Gemini)
   */
  async generateDailyMemes() {
    try {
      console.log('🎨 Calling Cloud Run to generate daily memes...');
      
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
      console.log('✅ Meme generation successful:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Meme generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test connection
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
   * Fallback memes (used when API fails)
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