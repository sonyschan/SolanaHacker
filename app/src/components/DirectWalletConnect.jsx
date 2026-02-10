import React, { useState, useEffect } from 'react';

const DirectWalletConnect = ({ onConnected }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);

  // Check for available wallets on component mount
  useEffect(() => {
    const wallets = [];
    
    // Check for Phantom
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      wallets.push({
        name: 'Phantom',
        icon: '🦄',
        provider: window.solana
      });
    }
    
    // Check for Solflare
    if (typeof window !== 'undefined' && window.solflare && window.solflare.isSolflare) {
      wallets.push({
        name: 'Solflare',
        icon: '🌟', 
        provider: window.solflare
      });
    }

    // Check for Backpack
    if (typeof window !== 'undefined' && window.backpack && window.backpack.isBackpack) {
      wallets.push({
        name: 'Backpack',
        icon: '🎒',
        provider: window.backpack
      });
    }

    setAvailableWallets(wallets);
  }, []);

  const connectWallet = async (wallet) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      console.log(`[DirectWalletConnect] Connecting to ${wallet.name}...`);

      // Request connection
      const response = await wallet.provider.connect();
      console.log('[DirectWalletConnect] Connection response:', response);
      
      if (!response || !response.publicKey) {
        throw new Error('Failed to get wallet address');
      }

      const address = response.publicKey.toString();
      
      setWalletAddress(address);
      console.log(`[DirectWalletConnect] Successfully connected to ${wallet.name}:`, address);
      
      if (onConnected) {
        onConnected({
          publicKey: response.publicKey,
          address: address,
          wallet: wallet.name
        });
      }
      
    } catch (err) {
      console.error('[DirectWalletConnect] Connection error:', err);
      
      let errorMessage;
      if (err.code === 4001 || err.message?.includes('rejected')) {
        errorMessage = `Connection rejected by user. Please approve the connection in your ${wallet.name} wallet.`;
      } else if (err.message?.includes('get wallet address')) {
        errorMessage = 'Failed to get wallet address. Please try again.';
      } else {
        errorMessage = `Connection failed: ${err.message || 'Unknown error'}. Please try again.`;
      }
      
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      // Try to disconnect from any connected provider
      if (window.solana && window.solana.disconnect) {
        await window.solana.disconnect();
      }
      if (window.solflare && window.solflare.disconnect) {
        await window.solflare.disconnect();
      }
      if (window.backpack && window.backpack.disconnect) {
        await window.backpack.disconnect();
      }
      
      setWalletAddress(null);
      setError(null);
      console.log('[DirectWalletConnect] Disconnected successfully');
    } catch (err) {
      console.error('[DirectWalletConnect] Disconnect error:', err);
    }
  };

  // If already connected, show connected state
  if (walletAddress) {
    return (
      <div className="flex items-center gap-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium transition-colors">
        <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
        <span className="hidden sm:inline">
          {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
        </span>
        <span className="sm:hidden">Connected</span>
        <button
          onClick={disconnect}
          className="text-green-200 hover:text-white ml-2 text-sm underline"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Show available wallets
  if (availableWallets.length === 0) {
    return (
      <div className="text-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg">
          <p className="text-sm">No Solana wallets detected.</p>
          <p className="text-xs mt-1">
            Install <a href="https://phantom.app" target="_blank" rel="noopener" className="underline">Phantom</a> or 
            <a href="https://solflare.com" target="_blank" rel="noopener" className="underline ml-1">Solflare</a>
          </p>
        </div>
      </div>
    );
  }

  // Single wallet - show direct button
  if (availableWallets.length === 1) {
    const wallet = availableWallets[0];
    return (
      <div className="relative">
        <button
          onClick={() => connectWallet(wallet)}
          disabled={isConnecting}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isConnecting
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg transform hover:scale-105'
          }`}
        >
          {isConnecting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            <span>{wallet.icon} Connect {wallet.name}</span>
          )}
        </button>
        
        {error && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg shadow-lg z-20 w-80 max-w-sm">
            <div className="flex justify-between items-start gap-2">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 font-bold text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multiple wallets - show dropdown
  return (
    <div className="relative">
      <div className="flex gap-2">
        {availableWallets.map(wallet => (
          <button
            key={wallet.name}
            onClick={() => connectWallet(wallet)}
            disabled={isConnecting}
            className={`px-3 py-2 rounded-lg font-medium transition-all ${
              isConnecting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {isConnecting ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <span className="text-sm">{wallet.icon} {wallet.name}</span>
            )}
          </button>
        ))}
      </div>
      
      {error && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg shadow-lg z-20 w-80 max-w-sm">
          <div className="flex justify-between items-start gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectWalletConnect;