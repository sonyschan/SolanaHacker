import React, { useState, useCallback } from 'react';

const SimpleWalletConnect = ({ onConnected }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [error, setError] = useState(null);

  const connectPhantom = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Check if Phantom is installed
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet not detected. Please install Phantom wallet from phantom.app');
      }

      console.log('[SimpleWalletConnect] Phantom detected, attempting connection...');

      // Request connection
      const response = await window.solana.connect();
      console.log('[SimpleWalletConnect] Connection response:', response);
      
      if (!response || !response.publicKey) {
        throw new Error('Failed to get wallet address');
      }

      const address = response.publicKey.toString();
      
      setWalletAddress(address);
      console.log('[SimpleWalletConnect] Successfully connected to Phantom:', address);
      
      if (onConnected) {
        onConnected({
          publicKey: response.publicKey,
          address: address,
          wallet: 'Phantom'
        });
      }
      
    } catch (err) {
      console.error('[SimpleWalletConnect] Connection error:', err);
      
      if (err.code === 4001 || err.message?.includes('rejected')) {
        setError('Connection rejected by user. Please approve the connection in your Phantom wallet.');
      } else if (err.message?.includes('not detected')) {
        setError('Phantom wallet not found. Please install Phantom wallet from phantom.app');
      } else if (err.message?.includes('get wallet address')) {
        setError('Failed to get wallet address. Please try again.');
      } else {
        setError(`Connection failed: ${err.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [onConnected]);

  const disconnect = useCallback(async () => {
    try {
      if (window.solana && window.solana.disconnect) {
        await window.solana.disconnect();
      }
      setWalletAddress(null);
      setError(null);
      console.log('[SimpleWalletConnect] Disconnected successfully');
    } catch (err) {
      console.error('[SimpleWalletConnect] Disconnect error:', err);
    }
  }, []);

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

  return (
    <div className="relative">
      <button
        onClick={connectPhantom}
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
          <span>🦄 Connect Phantom</span>
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
};

export default SimpleWalletConnect;