import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const EnhancedWalletButton = ({ children, className = '', variant = 'primary', showAddress = false, ...props }) => {
  const { 
    wallet, 
    connect, 
    disconnect, 
    connecting, 
    connected, 
    wallets,
    select,
    publicKey
  } = useWallet();
  
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const touchTimeoutRef = useRef();
  const debugTimeoutRef = useRef();

  // Debug logging with visual feedback
  const debug = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMsg = `[${timestamp}] ${message}`;
    console.log(debugMsg);
    setDebugInfo(debugMsg);
    
    // Clear debug info after 3 seconds
    if (debugTimeoutRef.current) {
      clearTimeout(debugTimeoutRef.current);
    }
    debugTimeoutRef.current = setTimeout(() => setDebugInfo(''), 3000);
  }, []);

  // Monitor wallet state changes
  useEffect(() => {
    debug(`State: connected=${connected}, connecting=${connecting}, wallets=${wallets.length}, wallet=${wallet?.adapter?.name}`);
  }, [connected, connecting, wallets.length, wallet?.adapter?.name, debug]);

  // Handle wallet connection/disconnection
  const handleConnect = useCallback(async () => {
    debug('🔗 Connect button clicked');
    
    try {
      if (connected) {
        debug('🔓 Disconnecting current wallet...');
        await disconnect();
        debug('✅ Wallet disconnected');
        return;
      }

      if (wallets.length === 0) {
        debug('❌ No wallets detected');
        const message = 'No Solana wallets found.\n\nPlease install:\n• Phantom (recommended)\n• Solflare\n• Backpack\n\nThen refresh this page.';
        alert(message);
        window.open('https://phantom.app/download', '_blank');
        return;
      }

      // Auto-connect if only one wallet available
      if (wallets.length === 1) {
        debug(`🎯 Auto-connecting to ${wallets[0].adapter.name}...`);
        const selectedWallet = wallets[0];
        select(selectedWallet.adapter.name);
        
        // Give a moment for selection to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        await connect();
        debug(`✅ Connected to ${selectedWallet.adapter.name}`);
      } else {
        debug(`📱 Multiple wallets found (${wallets.length}), showing menu`);
        setShowWalletMenu(true);
      }
    } catch (error) {
      debug(`❌ Connection error: ${error.name}: ${error.message}`);
      console.error('Full wallet error:', error);
      
      // Don't show alert for user rejections
      if (error.message?.includes('User rejected') || 
          error.message?.includes('rejected the request') ||
          error.name === 'WalletConnectionError') {
        debug('👤 User cancelled connection');
        return;
      }
      
      // Show meaningful error for other cases
      alert(`Wallet connection failed:\n${error.message || error.name}\n\nTry refreshing the page or check your wallet.`);
    }
  }, [connected, disconnect, connect, wallets, select, debug]);

  // Handle wallet selection from menu
  const selectWallet = useCallback(async (selectedWallet) => {
    debug(`🎯 Selected ${selectedWallet.adapter.name}`);
    setShowWalletMenu(false);
    
    try {
      select(selectedWallet.adapter.name);
      
      // Give selection time to take effect
      await new Promise(resolve => setTimeout(resolve, 200));
      await connect();
      debug(`✅ Successfully connected to ${selectedWallet.adapter.name}`);
    } catch (error) {
      debug(`❌ Selection error: ${error.message}`);
      if (!error.message?.includes('User rejected')) {
        alert(`Failed to connect to ${selectedWallet.adapter.name}:\n${error.message}`);
      }
    }
  }, [select, connect, debug]);

  // Enhanced mobile touch handlers
  const handleTouchStart = useCallback((e) => {
    debug('👆 Touch start detected');
    setIsPressed(true);
    
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
  }, [debug]);

  const handleTouchEnd = useCallback((e) => {
    debug('👆 Touch end detected');
    e.preventDefault(); // Prevent mouse events
    e.stopPropagation();
    setIsPressed(false);
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Delay execution to prevent double-firing
    touchTimeoutRef.current = setTimeout(() => {
      debug('🚀 Executing touch action');
      handleConnect();
    }, 50);
  }, [handleConnect, debug]);

  // Enhanced click handler for desktop
  const handleClick = useCallback((e) => {
    debug('🖱️ Mouse click detected');
    e.preventDefault();
    e.stopPropagation();
    
    // Don't execute if this came from a touch event
    if (e.detail === 0) { // Touch events have detail = 0
      debug('🚫 Ignoring synthetic click from touch');
      return;
    }
    
    handleConnect();
  }, [handleConnect, debug]);

  // Close wallet menu when clicking outside
  const handleMenuOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      debug('📱 Closing wallet menu');
      setShowWalletMenu(false);
    }
  }, [debug]);

  // Get shortened wallet address in format requested
  const getShortAddress = () => {
    if (!connected || !publicKey) return '';
    const address = publicKey.toString();
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Get button content based on current state
  const getButtonContent = () => {
    if (connecting) {
      return (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          <span>Connecting...</span>
        </div>
      );
    }

    if (connected && wallet) {
      return (
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          <span>Connected</span>
          {showAddress && (
            <span className="font-mono text-sm opacity-80">
              {getShortAddress()}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConnect(); // Will disconnect when connected
            }}
            className="ml-2 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition-colors"
          >
            Logout
          </button>
        </div>
      );
    }

    if (wallets.length === 0) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-lg">👛</span>
          <span>Install Wallet</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">👛</span>
        <span>{children || 'Connect Wallet'}</span>
      </div>
    );
  };

  // Dynamic button styling based on variant
  const getButtonClasses = () => {
    const baseClasses = `
      inline-flex items-center justify-center
      font-bold rounded-xl transition-all duration-200
      cursor-pointer select-none relative
      focus:outline-none focus:ring-4 focus:ring-purple-400/50
      disabled:opacity-50 disabled:cursor-not-allowed
      min-h-[48px] px-6 py-3
      ${isPressed ? 'scale-95 shadow-inner' : 'hover:scale-105 shadow-lg hover:shadow-xl'}
    `;

    const variantClasses = {
      primary: `
        bg-gradient-to-r from-purple-600 to-blue-600 
        hover:from-purple-700 hover:to-blue-700
        active:from-purple-800 active:to-blue-800
        text-white border border-purple-500
        ${connected ? 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : ''}
      `,
      secondary: `
        bg-white border border-gray-300 text-gray-700
        hover:bg-gray-50 hover:border-gray-400
        active:bg-gray-100
        ${connected ? 'bg-green-50 border-green-300 text-green-700' : ''}
      `,
      ghost: `
        bg-transparent border border-purple-400 text-purple-400
        hover:bg-purple-50 hover:text-purple-600
        active:bg-purple-100
        ${connected ? 'border-green-400 text-green-400 hover:text-green-600' : ''}
      `
    };

    return `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`;
  };

  return (
    <div className="relative">
      {/* Debug Info Overlay */}
      {debugInfo && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {debugInfo}
        </div>
      )}
      
      {/* Main Button */}
      <button
        className={getButtonClasses()}
        onClick={connected ? undefined : handleClick} // Prevent double clicks when connected
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        disabled={connecting}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        {...props}
      >
        {getButtonContent()}
      </button>

      {/* Wallet Selection Modal */}
      {showWalletMenu && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleMenuOverlayClick}
        >
          <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Choose Wallet
              </h3>
              <button
                onClick={() => setShowWalletMenu(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {wallets.map((walletOption) => (
                <button
                  key={walletOption.adapter.name}
                  onClick={() => selectWallet(walletOption)}
                  className="w-full flex items-center p-4 bg-gray-50 hover:bg-purple-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-purple-300 hover:scale-102"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    minHeight: '64px'
                  }}
                >
                  <img
                    src={walletOption.adapter.icon}
                    alt={`${walletOption.adapter.name} icon`}
                    className="w-10 h-10 mr-4 rounded-lg"
                  />
                  <div className="text-left">
                    <div className="text-gray-900 font-semibold text-lg">
                      {walletOption.adapter.name}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {walletOption.readyState === 'Installed' ? 'Detected' : 'Not installed'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center text-xs text-gray-500">
              Don't have a wallet? 
              <button
                onClick={() => window.open('https://phantom.app/download', '_blank')}
                className="text-purple-600 hover:text-purple-800 ml-1 underline"
              >
                Get Phantom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWalletButton;