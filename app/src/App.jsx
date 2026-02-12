import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import './index.css';
import './styles/placeholders.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://memeforge-api-836651762884.asia-southeast1.run.app';

function App() {
  const { connected, connecting, publicKey } = useWallet();
  const [currentView, setCurrentView] = useState('home');
  const [userTickets, setUserTickets] = useState(0);
  const [votingStreak, setVotingStreak] = useState(0);
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Fetch user data from API when wallet connects - v2 fix
  useEffect(() => {
    console.log('🔍 App useEffect: connected=', connected, 'publicKey=', publicKey?.toBase58());

    const fetchUserData = async () => {
      if (!connected || !publicKey) {
        console.log('⏭️ Skipping user fetch: not connected');
        return;
      }

      const walletAddress = publicKey.toBase58();
      setUserDataLoading(true);

      try {
        console.log('📊 獲取用戶數據:', walletAddress);
        const response = await fetch(`${API_BASE_URL}/api/users/${walletAddress}`);
        const data = await response.json();

        if (data.success && data.user) {
          setUserTickets(data.user.weeklyTickets || 0);
          setVotingStreak(data.user.streakDays || 0);
          console.log('✅ 用戶數據:', {
            tickets: data.user.weeklyTickets,
            streak: data.user.streakDays
          });
        }
      } catch (error) {
        console.error('❌ 獲取用戶數據失敗:', error);
        // Keep default values (0) on error
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [connected, publicKey]);

  // Auto-switch to dashboard when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      setCurrentView('dashboard');
    } else {
      // For testing: Allow dashboard view without wallet connection
      // In production, remove this and only show dashboard when connected
      const urlHash = window.location.hash;
      if (urlHash === '#dashboard') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('home');
      }
    }
  }, [connected, publicKey]);

  // Listen for hash changes to support direct dashboard navigation
  useEffect(() => {
    const handleHashChange = () => {
      const urlHash = window.location.hash;
      if (urlHash === '#dashboard') {
        setCurrentView('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Mock wallet connection (for backward compatibility)
  const connectWallet = () => {
    // This will be handled by the real wallet connection now
    console.log('Use WalletConnection component instead');
  };

  const disconnectWallet = () => {
    // This will be handled by the real wallet disconnection now
    console.log('Use WalletConnection component instead');
  };

  return (
    <div className="app">
      {currentView === 'home' ? (
        <HomePage 
          onConnectWallet={connectWallet}
          walletConnected={connected}
          connecting={connecting}
        />
      ) : (
        <Dashboard
          userTickets={userTickets}
          votingStreak={votingStreak}
          onDisconnectWallet={disconnectWallet}
          setUserTickets={setUserTickets}
          setVotingStreak={setVotingStreak}
          walletAddress={publicKey?.toBase58()}
          userDataLoading={userDataLoading}
        />
      )}
    </div>
  );
}

export default App;
