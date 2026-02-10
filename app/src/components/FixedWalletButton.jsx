import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const FixedWalletButton = ({ children, className = '', ...props }) => {
  const { 
    wallet, 
    connect, 
    disconnect, 
    connecting, 
    connected, 
    wallets,
    select
  } = useWallet();
  
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  console.log('FixedWalletButton render:', { 
    connected, 
    connecting, 
    walletsCount: wallets.length,
    currentWallet: wallet?.adapter?.name 
  });

  // Handle wallet connection with proper error handling
  const handleConnect = useCallback(async () => {
    console.log('handleConnect called');
    
    try {
      if (connected) {
        console.log('Disconnecting...');
        await disconnect();
      } else if (wallets.length === 0) {
        console.warn('No wallets available');
        alert('No Solana wallets found. Please install Phantom or Solflare.');
        return;
      } else if (wallets.length === 1) {
        console.log('Connecting to single wallet:', wallets[0].adapter.name);
        select(wallets[0].adapter.name);
        await connect();
      } else {
        console.log('Multiple wallets found, showing menu');
        setShowWalletMenu(true);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (!error.message?.includes('User rejected')) {
        alert('Wallet connection failed: ' + error.message);
      }
    }
  }, [connected, disconnect, connect, wallets, select]);

  // Handle wallet selection from menu
  const selectWallet = useCallback(async (selectedWallet) => {
    console.log('selectWallet called:', selectedWallet.adapter.name);
    setShowWalletMenu(false);
    
    try {
      select(selectedWallet.adapter.name);
      await connect();
    } catch (error) {
      console.error('Wallet selection error:', error);
      if (!error.message?.includes('User rejected')) {
        alert('Failed to connect to ' + selectedWallet.adapter.name);
      }
    }
  }, [select, connect]);

  // Mobile touch handlers
  const handleTouchStart = useCallback((e) => {
    console.log('Touch start');
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    console.log('Touch end');
    e.preventDefault(); // Prevent double-firing
    setIsPressed(false);
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    handleConnect();
  }, [handleConnect]);

  // Click handler for desktop
  const handleClick = useCallback((e) => {
    console.log('Click handler');
    e.preventDefault();
    handleConnect();
  }, [handleConnect]);

  const getButtonText = () => {
    if (connecting) return 'Connecting...';
    if (connected && wallet) return `Disconnect ${wallet.adapter.name}`;
    if (wallets.length === 0) return 'No Wallet Found';
    return children || 'Connect Wallet';
  };

  const getShortAddress = () => {
    if (!connected || !wallet?.adapter?.publicKey) return '';
    const address = wallet.adapter.publicKey.toString();
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Base button styles
  const buttonClasses = `
    inline-flex items-center justify-center
    font-bold rounded-xl transition-all duration-200
    cursor-pointer select-none
    focus:outline-none focus:ring-4 focus:ring-purple-400/50
    disabled:opacity-50 disabled:cursor-not-allowed
    min-h-[48px] px-6 py-3 space-x-2
    bg-gradient-to-r from-purple-600 to-blue-600 
    hover:from-purple-700 hover:to-blue-700
    text-white shadow-lg
    ${isPressed ? 'scale-95 from-purple-800 to-blue-800' : ''}
    ${className}
  `;

  return (
    <>
      <button
        className={buttonClasses}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        disabled={connecting}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        {...props}
      >
        <span className="text-lg">👛</span>
        <span>{getButtonText()}</span>
        {connected && (
          <span className="text-xs opacity-80">({getShortAddress()})</span>
        )}
      </button>

      {/* Wallet Selection Modal */}
      {showWalletMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Select Wallet
            </h3>
            
            <div className="space-y-3">
              {wallets.map((walletOption) => (
                <button
                  key={walletOption.adapter.name}
                  onClick={() => selectWallet(walletOption)}
                  className="w-full flex items-center p-4 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors duration-200 border border-gray-200 hover:border-purple-300"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '56px'
                  }}
                >
                  <img
                    src={walletOption.adapter.icon}
                    alt={`${walletOption.adapter.name} icon`}
                    className="w-8 h-8 mr-3 rounded"
                  />
                  <span className="text-gray-900 font-medium text-lg">
                    {walletOption.adapter.name}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowWalletMenu(false)}
              className="w-full mt-4 p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors duration-200"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FixedWalletButton;