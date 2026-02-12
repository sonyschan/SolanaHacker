/**
 * Firebase React Hooks
 * Provides real-time synced React hooks
 */
import { useState, useEffect } from 'react';
import { 
  subscribeTodayMemes, 
  subscribeVoteStats, 
  subscribeUserData,
  getTodayMemes
} from '../services/firebase';

/**
 * Hook: Real-time listener for today's memes
 */
export const useTodayMemes = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeTodayMemes((data, err) => {
      if (err) {
        setError(err);
        setMemes([]);
      } else {
        setMemes(data);
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { memes, loading, error };
};

/**
 * Hook: Real-time listener for vote statistics
 */
export const useVoteStats = (memeId) => {
  const [stats, setStats] = useState({ common: 0, rare: 0, legendary: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = subscribeVoteStats(memeId, (data, err) => {
      if (!err) {
        setStats(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [memeId]);

  return { stats, loading };
};

/**
 * Hook: Real-time listener for user data
 */
export const useUserData = (walletAddress) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = subscribeUserData(walletAddress, (data, err) => {
      if (!err) {
        setUserData(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [walletAddress]);

  return { userData, loading };
};

/**
 * Hook: Vote statistics for multiple memes
 */
export const useAllVoteStats = (memeIds) => {
  const [allStats, setAllStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memeIds || memeIds.length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribes = [];
    const statsMap = {};

    memeIds.forEach(memeId => {
      const unsubscribe = subscribeVoteStats(memeId, (data) => {
        statsMap[memeId] = data;
        setAllStats({ ...statsMap });
      });
      unsubscribes.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [JSON.stringify(memeIds)]);

  return { allStats, loading };
};