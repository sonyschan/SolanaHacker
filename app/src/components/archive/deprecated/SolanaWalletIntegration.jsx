import React, { createContext, useContext, useState, useCallback } from 'react';

// Wallet Context
const WalletContext = createContext();

export const SolanaWalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [walletName, setWalletName] = useState('');

  const connectWallet = useCallback(async (walletType = 'phantom') => {
    try {
      let wallet = null;
      let name = '';

      if (walletType === 'phantom' && window.solana?.isPhantom) {
        wallet = window.solana;
        name = 'Phantom';
      } else if (walletType === 'solflare' && window.solflare?.isSolflare) {
        wallet = window.solflare;
        name = 'Solflare';
      } else {
        throw new Error(`${walletType} wallet not found`);
      }

      const response = await wallet.connect();
      
      if (response.publicKey) {
        setIsConnected(true);
        setPublicKey(response.publicKey);
        setWalletName(name);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return false;
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      if (window.solana && isConnected) {
        await window.solana.disconnect();
      }
      setIsConnected(false);
      setPublicKey(null);
      setWalletName('');
    } catch (error) {
      console.error('Disconnect failed:', error);
      setIsConnected(false);
      setPublicKey(null);
      setWalletName('');
    }
  }, [isConnected]);

  const value = {
    isConnected,
    publicKey,
    walletName,
    connectWallet,
    disconnectWallet,
    address: publicKey?.toString() || ''
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useSolanaWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return context;
};

export const WalletButton = ({ className = '' }) => {
  const { isConnected, connectWallet, disconnectWallet, walletName, address } = useSolanaWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    const success = await connectWallet('phantom');
    if (!success) {
      alert('Please install Phantom wallet or try another wallet');
    }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  if (connecting) {
    return (
      <button disabled className={`px-4 py-2 rounded-lg bg-gray-400 text-white ${className}`}>
        Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <button 
        onClick={handleDisconnect}
        className={`px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white ${className}`}
      >
        {walletName} • {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button 
      onClick={handleConnect}
      className={`px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white ${className}`}
    >
      Connect Wallet
    </button>
  );
};