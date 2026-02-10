import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [userTickets, setUserTickets] = useState(87); // Mock data
  const [votingStreak, setVotingStreak] = useState(3);

  // Mock wallet connection
  const connectWallet = () => {
    setWalletConnected(true);
    setCurrentView('dashboard');
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setCurrentView('home');
  };

  return (
    <div className="app">
      {currentView === 'home' ? (
        <HomePage 
          onConnectWallet={connectWallet}
          walletConnected={walletConnected}
        />
      ) : (
        <Dashboard
          userTickets={userTickets}
          votingStreak={votingStreak}
          onDisconnectWallet={disconnectWallet}
          setUserTickets={setUserTickets}
          setVotingStreak={setVotingStreak}
        />
      )}
    </div>
  );
}

export default App;