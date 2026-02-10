import React, { useState, createContext, useContext, useCallback } from 'react';
import DesktopWalletSelector from './DesktopWalletSelector';

// Create wallet context
const SolanaWalletContext = createContext();

// Simplified Solana wallet provider using direct wallet APIs
export const SimplifiedSolanaWalletProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [walletName, setWalletName] = useState('');
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  const connectWallet = useCallback(async (walletType = 'phantom') => {
    try {
      let wallet = null;
      let name = '';
      
      // Enhanced wallet detection with multiple options
      if (walletType === 'phantom' && window.solana?.isPhantom) {
        wallet = window.solana;
        name = 'Phantom';
      } else if (walletType === 'solflare' && window.solflare?.isSolflare) {
        wallet = window.solflare;
        name = 'Solflare';
      } else if (walletType === 'okx' && window.okxwallet?.solana) {
        wallet = window.okxwallet.solana;
        name = 'OKX Wallet';
      } else if (walletType === 'coinbase' && window.coinbaseSolana) {
        wallet = window.coinbaseSolana;
        name = 'Coinbase Wallet';
      } else {
        throw new Error(`${walletType} wallet not found. Please install the extension.`);
      }

      // Connect to the wallet with timeout
      console.log(`Attempting to connect to ${name}...`);
      
      const connectPromise = wallet.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );
      
      const response = await Promise.race([connectPromise, timeoutPromise]);
      
      if (response.publicKey) {
        setConnected(true);
        setPublicKey(response.publicKey);
        setWalletName(name);
        console.log(`Successfully connected to ${name}:`, response.publicKey.toString());
        
        // Store connection preference
        localStorage.setItem('lastConnectedWallet', walletType);
        
        return true;
      }
      
      throw new Error('No public key returned');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      // User-friendly error messages
      let errorMessage = '';
      if (error.message.includes('User rejected')) {
        errorMessage = 'Connection was cancelled. Please try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = `Connection timeout. Please check your ${walletType} wallet and try again.`;
      } else if (error.message.includes('not found')) {
        errorMessage = `${walletType} wallet not detected. Please install the extension first.`;
      } else {
        errorMessage = `Failed to connect to ${walletType}. Please try again or use a different wallet.`;
      }
      
      // Don't show alert for user rejection or auto-connect failures
      if (!error.message.includes('User rejected') && !isAutoConnecting) {
        alert(errorMessage);
      }
      
      return false;
    }
  }, [isAutoConnecting]);

  const disconnectWallet = useCallback(async () => {
    try {
      // Try to disconnect from the current wallet
      if (walletName === 'Phantom' && window.solana?.isPhantom && connected) {
        await window.solana.disconnect();
      } else if (walletName === 'Solflare' && window.solflare?.isSolflare && connected) {
        await window.solflare.disconnect();
      } else if (walletName === 'OKX Wallet' && window.okxwallet?.solana && connected) {
        await window.okxwallet.solana.disconnect();
      }
      
      setConnected(false);
      setPublicKey(null);
      setWalletName('');
      
      // Clear stored preference
      localStorage.removeItem('lastConnectedWallet');
      
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Disconnect failed:', error);
      // Force disconnect on error
      setConnected(false);
      setPublicKey(null);
      setWalletName('');
    }
  }, [connected, walletName]);

  // Auto-reconnect on page load if previously connected
  React.useEffect(() => {
    const lastWallet = localStorage.getItem('lastConnectedWallet');
    if (lastWallet && !connected && !isAutoConnecting) {
      setIsAutoConnecting(true);
      
      // Small delay to ensure wallet extensions are loaded
      setTimeout(async () => {
        try {
          const success = await connectWallet(lastWallet);
          if (success) {
            console.log(`Auto-reconnected to ${lastWallet}`);
          } else {
            // Clear failed auto-connect preference
            localStorage.removeItem('lastConnectedWallet');
          }
        } catch (error) {
          console.log('Auto-reconnect failed:', error);
          localStorage.removeItem('lastConnectedWallet');
        } finally {
          // Always reset auto-connecting state
          setIsAutoConnecting(false);
        }
      }, 1000);
    }
  }, [connectWallet, connected, isAutoConnecting]);

  const value = {
    connected,
    publicKey,
    walletName,
    connectWallet,
    disconnectWallet,
    isAutoConnecting,
    address: publicKey?.toString() || ''
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

// Hook to use wallet context
export const useSimplifiedSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSimplifiedSolanaWallet must be used within SimplifiedSolanaWalletProvider');
  }
  return context;
};

// Enhanced wallet button component with desktop-optimized UX
const SimplifiedSolanaWalletButton = ({ 
  children = 'Connect Wallet', 
  className = '',
  variant = 'primary',
  showAddress = false 
}) => {
  const { connected, address, connectWallet, disconnectWallet, walletName, isAutoConnecting } = useSimplifiedSolanaWallet();
  const [showModal, setShowModal] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Helper function to format wallet address
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const buttonClasses = {
    primary: 'btn-primary-enhanced',
    secondary: 'btn-secondary-enhanced', 
    ghost: 'btn-ghost-enhanced'
  };

  const handleConnect = async () => {
    setShowModal(true);
  };

  const handleWalletSelect = async (walletType) => {
    setShowModal(false);
    setConnecting(true);
    
    try {
      const success = await connectWallet(walletType);
      if (success) {
        console.log(`Successfully connected to ${walletType}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your wallet?')) {
      await disconnectWallet();
    }
  };

  // Auto-connecting state (silent, no spinner)
  if (isAutoConnecting && !connected) {
    return (
      <button className={`${buttonClasses[variant]} ${className}`} disabled>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Connect Wallet</span>
        </div>
      </button>
    );
  }

  // Manual connecting state (with spinner)
  if (connecting) {
    return (
      <button className={`${buttonClasses[variant]} ${className}`} disabled>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Connecting...</span>
        </div>
      </button>
    );
  }

  // Connected state
  if (connected) {
    const displayContent = showAddress && address ? (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="font-mono">{formatAddress(address)}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    ) : (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span>{walletName ? `${walletName}` : 'Connected'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );

    return (
      <div className="relative group">
        <button
          onClick={handleDisconnect}
          className={`${buttonClasses[variant]} ${className}`}
        >
          {displayContent}
        </button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Click to disconnect
        </div>
      </div>
    );
  }

  // Disconnected state - show connect button
  return (
    <>
      <button
        onClick={handleConnect}
        className={`${buttonClasses[variant]} ${className}`}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{children}</span>
        </div>
      </button>
      
      <DesktopWalletSelector
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectWallet={handleWalletSelect}
        isConnecting={connecting}
      />
    </>
  );
};

export default SimplifiedSolanaWalletButton;