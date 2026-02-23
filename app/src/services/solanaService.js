const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch $Memeya token balance via backend proxy.
 * Caches in localStorage for 10 minutes.
 * Returns { balance, bonus } — gracefully returns zeros on error.
 */
export async function getMemeyaBalance(walletAddress) {
  try {
    // Check localStorage cache
    const cacheKey = `memeya_bal_${walletAddress}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { balance, bonus, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) {
        return { balance, bonus };
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${walletAddress}/memeya-balance`);
    const data = await response.json();

    if (data.success) {
      const { balance, bonus } = data.data;
      localStorage.setItem(cacheKey, JSON.stringify({ balance, bonus, ts: Date.now() }));
      return { balance, bonus };
    }

    return { balance: 0, bonus: 0 };
  } catch (error) {
    console.error('Error fetching $Memeya balance:', error);
    return { balance: 0, bonus: 0 };
  }
}

/**
 * Format token amount for display.
 * < 1000 → as-is with commas, >= 1K → "1.2K", >= 1M → "1.2M"
 */
export function formatTokenAmount(amount) {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return amount.toLocaleString();
}
