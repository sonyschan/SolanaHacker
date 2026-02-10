import React from 'react';
import { usePrivy } from '@privy-io/react-auth';

const PrivyWalletButton = ({ 
  children = 'Connect Wallet', 
  className = '',
  variant = 'primary',
  showAddress = false 
}) => {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Helper function to format wallet address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get the primary wallet address
  const getPrimaryAddress = () => {
    if (!user?.wallet?.address) return '';
    return user.wallet.address;
  };

  const buttonClasses = {
    primary: 'btn-primary-enhanced',
    secondary: 'btn-secondary-enhanced',
    ghost: 'btn-ghost-enhanced'
  };

  if (!ready) {
    return (
      <button className={`${buttonClasses[variant]} ${className}`} disabled>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </button>
    );
  }

  if (authenticated) {
    const address = getPrimaryAddress();
    
    return (
      <div className="flex items-center space-x-3">
        {showAddress && address && (
          <div className="text-enhanced-medium text-sm font-mono">
            {formatAddress(address)}
          </div>
        )}
        <button
          onClick={logout}
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
      onClick={login}
      className={`${buttonClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default PrivyWalletButton;