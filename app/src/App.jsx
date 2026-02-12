import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import './index.css';
import './styles/placeholders.css';

function App() {
  const { connected, connecting, publicKey } = useWallet();
  const [currentView, setCurrentView] = useState('home');
  const [userTickets, setUserTickets] = useState(87); // Mock data
  const [votingStreak, setVotingStreak] = useState(3);

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
        />
      )}
    </div>
  );
}

export default App;