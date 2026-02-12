/**
 * MemeForge API Client
 * 
 * 統一的 API 呼叫客戶端，處理：
 * - 錢包驗證
 * - 錯誤處理和重試
 * - 請求攔截
 * - 離線緩存
 */

class APIClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    this.timeout = 10000; // 10 秒超時
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 秒初始重試延遲
  }

  /**
   * 獲取授權 headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('memeforge_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * 基礎 fetch 包裝器，含重試邏輯
   */
  async fetchWithRetry(url, options = {}, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 如果請求成功，直接返回
      if (response.ok) {
        return response;
      }

      // 處理特定錯誤
      if (response.status === 401) {
        // Token 過期或無效
        this.handleAuthError();
        throw new Error('Authentication required');
      }

      if (response.status === 429) {
        // Rate limit 超過
        const resetTime = response.headers.get('X-RateLimit-Reset');
        throw new Error(`Rate limit exceeded${resetTime ? `, reset at ${new Date(resetTime * 1000)}` : ''}`);
      }

      // 服務器錯誤且可以重試
      if (response.status >= 500 && attempt < this.retryAttempts) {
        console.log(`API request failed (attempt ${attempt}), retrying...`);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      // 其他錯誤
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);

    } catch (error) {
      clearTimeout(timeoutId);

      // 網路錯誤且可以重試
      if ((error.name === 'AbortError' || error.name === 'TypeError') && attempt < this.retryAttempts) {
        console.log(`Network error (attempt ${attempt}), retrying...`);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * GET 請求
   */
  async get(endpoint) {
    const response = await this.fetchWithRetry(endpoint, { method: 'GET' });
    return response.json();
  }

  /**
   * POST 請求
   */
  async post(endpoint, data) {
    const response = await this.fetchWithRetry(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * PUT 請求
   */
  async put(endpoint, data) {
    const response = await this.fetchWithRetry(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * DELETE 請求
   */
  async delete(endpoint) {
    const response = await this.fetchWithRetry(endpoint, { method: 'DELETE' });
    return response.json();
  }

  // === 錢包驗證相關 ===

  /**
   * 錢包簽名驗證
   */
  async authenticateWallet(wallet) {
    try {
      // 生成隨機 nonce 防重放攻擊
      const nonce = Date.now().toString() + Math.random().toString(36);
      const message = `MemeForge Login\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
      
      // 用 Solana 錢包簽名訊息
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);
      
      // 發送到後端驗證
      const response = await this.post('/api/auth/verify', {
        walletAddress: wallet.publicKey.toString(),
        message,
        signature: Array.from(signature)
      });
      
      if (response.success) {
        // 儲存 JWT Token
        localStorage.setItem('memeforge_auth_token', response.token);
        sessionStorage.setItem('wallet_address', wallet.publicKey.toString());
        
        return {
          success: true,
          token: response.token,
          walletAddress: wallet.publicKey.toString()
        };
      }

      throw new Error(response.error || 'Wallet authentication failed');

    } catch (error) {
      console.error('Wallet authentication failed:', error);
      throw error;
    }
  }

  /**
   * 處理驗證錯誤
   */
  handleAuthError() {
    // 清除過期的 token
    localStorage.removeItem('memeforge_auth_token');
    sessionStorage.removeItem('wallet_address');
    
    // 觸發重新連接錢包 (可以通過事件系統)
    window.dispatchEvent(new CustomEvent('auth-required'));
  }

  // === 投票相關 API ===

  /**
   * 獲取今日梗圖
   */
  async getTodayMemes() {
    return this.get('/api/memes/today');
  }

  /**
   * 提交投票
   */
  async submitVote(memeId, voteType, choice) {
    return this.post('/api/vote', {
      memeId,
      voteType, // 'step1' or 'step2'
      choice    // 'meme1', 'meme2', 'meme3', 'common', 'rare', 'legendary'
    });
  }

  /**
   * 獲取投票統計
   */
  async getVotingStats(date) {
    const endpoint = date ? `/api/stats/${date}` : '/api/stats';
    return this.get(endpoint);
  }

  // === 用戶相關 API ===

  /**
   * 獲取用戶資料
   */
  async getUserProfile() {
    return this.get('/api/user/profile');
  }

  // === 管理員 API ===

  /**
   * 手動觸發排程任務 (開發用)
   */
  async triggerTask(taskName) {
    return this.post(`/api/admin/trigger/${taskName}`, {});
  }

  /**
   * 獲取排程系統狀態
   */
  async getSchedulerStatus() {
    return this.get('/api/admin/scheduler/status');
  }

  // === 輔助方法 ===

  /**
   * 延遲執行
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 檢查是否已認證
   */
  isAuthenticated() {
    const token = localStorage.getItem('memeforge_auth_token');
    if (!token) return false;

    try {
      // 簡單檢查 token 是否過期 (不驗證簽名)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  /**
   * 獲取當前用戶錢包地址
   */
  getCurrentWallet() {
    return sessionStorage.getItem('wallet_address');
  }

  /**
   * 離線緩存 (簡化版)
   */
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const data = JSON.parse(cached);
        // 檢查是否在 5 分鐘內
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data.value;
        }
      }
    } catch {
      // 忽略緩存錯誤
    }
    return null;
  }

  /**
   * 設置離線緩存
   */
  setCachedData(key, value) {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        value,
        timestamp: Date.now()
      }));
    } catch {
      // 忽略存儲錯誤 (存儲空間不足等)
    }
  }
}

// 創建全局實例
const apiClient = new APIClient();

// React Hook 整合
export const useAPI = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const callAPI = React.useCallback(async (apiFunction) => {
    try {
      setLoading(true);
      setError(null);
      return await apiFunction(apiClient);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    apiClient, 
    callAPI, 
    loading, 
    error,
    clearError: () => setError(null)
  };
};

export default apiClient;