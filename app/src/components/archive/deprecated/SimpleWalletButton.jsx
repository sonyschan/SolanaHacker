import React, { useState, createContext, useContext } from 'react';

// Create a simple wallet context for demo purposes
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');

  const connect = async () => {
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    setConnected(true);
    setAddress('8FqwkwJpRqK7QChWzaZZZvqXnE7F9RnCr2yTsSoC6Pk5'); // Mock address
  };

  const disconnect = () => {
    setConnected(false);
    setAddress('');
  };

  return (
    <WalletContext.Provider value={{
      connected,
      address,
      connect,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

const SimpleWalletButton = ({ 
  children = 'Connect Wallet', 
  className = '',
  variant = 'primary',
  showAddress = false 
}) => {
  const { connected, address, connect, disconnect } = useWallet();
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
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  };

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

  if (connected) {
    return (
      <div className="flex items-center space-x-3">
        {showAddress && address && (
          <div className="text-enhanced-medium text-sm font-mono">
            {formatAddress(address)}
          </div>
        )}
        <button
          onClick={disconnect}
          className={`${buttonClasses[variant]} ${className}`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Disconnect</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className={`${buttonClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default SimpleWalletButton;