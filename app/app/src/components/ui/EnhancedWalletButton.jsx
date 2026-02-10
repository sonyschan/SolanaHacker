import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const EnhancedWalletButton = ({ className = '', children, variant = 'primary' }) => {
  const { wallet, connect, disconnect, connecting, connected, wallets, select } = useWallet();
  const [isPressed, setIsPressed] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showWalletMenu]);

  // Mobile-optimized touch handlers
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    e.preventDefault();
    setIsPressed(true);
  }, [isMobile]);

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile) return;
    e.preventDefault();
    setIsPressed(false);
    
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    if (connected) {
      disconnect();
    } else if (wallets.length === 1) {
      connect();
    } else {
      setShowWalletMenu(true);
    }
  }, [connected, disconnect, connect, wallets.length, isMobile]);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    
    if (connected) {
      disconnect();
    } else if (wallets.length === 1) {
      connect();
    } else {
      setShowWalletMenu(!showWalletMenu);
    }
  }, [connected, disconnect, connect, wallets.length, showWalletMenu]);

  const selectWallet = useCallback(async (selectedWallet) => {
    setShowWalletMenu(false);
    if (selectedWallet) {
      try {
        select(selectedWallet.adapter.name);
        await connect();
      } catch (error) {
        console.error('Wallet connection failed:', error);
      }
    }
  }, [select, connect]);

  const getButtonText = () => {
    if (connecting) return 'Connecting...';
    if (connected) return `Connected: ${wallet?.adapter?.name || ''}`;
    if (wallets.length === 0) return 'No Wallet Found';
    return children || 'Connect Wallet';
  };

  const baseStyles = `
    relative inline-flex items-center justify-center
    font-bold rounded-full transition-all duration-200
    cursor-pointer select-none
    focus:outline-none focus:ring-4 focus:ring-yellow-400/50
    active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    min-h-[48px] min-w-[48px] px-6
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-yellow-400 to-orange-500 
      hover:from-yellow-500 hover:to-orange-600
      text-black shadow-lg
      ${isPressed ? 'from-yellow-600 to-orange-700 scale-95' : ''}
    `,
    secondary: `
      bg-white/10 backdrop-blur-sm border border-white/20
      hover:bg-white/20 text-white
      ${isPressed ? 'bg-white/30 scale-95' : ''}
    `
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={connecting || wallets.length === 0}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <WalletIcon className="h-6 w-6 mr-2" />
        <span className="text-lg">{getButtonText()}</span>
        {!connected && wallets.length > 1 && (
          <ChevronDownIcon className="h-5 w-5 ml-2" />
        )}
      </button>

      {/* Desktop Dropdown vs Mobile Modal */}
      {showWalletMenu && (
        <>
          {isMobile ? (
            // Mobile Modal (Full Screen Overlay)
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-gray-900 rounded-2xl p-6 m-4 max-w-sm w-full border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  Select Wallet
                </h3>
                
                <div className="space-y-3">
                  {wallets.map((walletOption) => (
                    <button
                      key={walletOption.adapter.name}
                      onClick={() => selectWallet(walletOption)}
                      className="w-full flex items-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200 border border-gray-600 hover:border-gray-500"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        minHeight: '56px'
                      }}
                    >
                      <img
                        src={walletOption.adapter.icon}
                        alt={`${walletOption.adapter.name} icon`}
                        className="w-8 h-8 mr-3 rounded-lg"
                      />
                      <span className="text-white font-medium text-lg">
                        {walletOption.adapter.name}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowWalletMenu(false)}
                  className="w-full mt-4 p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors duration-200"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Desktop Dropdown (Positioned below button)
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[280px]"
              style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 text-center">
                  Choose Your Wallet
                </h3>
              </div>
              
              <div className="py-2">
                {wallets.map((walletOption, index) => (
                  <button
                    key={walletOption.adapter.name}
                    onClick={() => selectWallet(walletOption)}
                    className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                  >
                    <img
                      src={walletOption.adapter.icon}
                      alt={`${walletOption.adapter.name} icon`}
                      className="w-8 h-8 mr-3 rounded-lg shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {walletOption.adapter.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {walletOption.readyState === 'Installed' ? 'Detected' : 'Not installed'}
                      </div>
                    </div>
                    {walletOption.readyState === 'Installed' && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => setShowWalletMenu(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedWalletButton;