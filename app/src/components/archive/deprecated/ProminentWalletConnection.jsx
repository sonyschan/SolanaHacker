import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const ProminentWalletConnection = () => {
  const { connected, publicKey } = useWallet();
  const [showTooltip, setShowTooltip] = useState(false);

  // Show wallet address in shortened form
  const getShortAddress = (address) => {
    if (!address) return '';
    const str = address.toString();
    return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
  };

  if (connected && publicKey) {
    return (
      <div className="relative">
        <div 
          className="flex items-center space-x-2 sm:space-x-3 bg-green-50 border-2 border-green-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 hover:bg-green-100 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <div className="text-green-800 font-semibold text-xs sm:text-sm">Connected</div>
              <div className="text-green-600 text-xs">{getShortAddress(publicKey)}</div>
            </div>
          </div>
          <WalletMultiButton 
            className="!bg-green-600 hover:!bg-green-700 !text-white !text-xs sm:!text-sm !px-2 sm:!px-3 !py-1 !rounded-lg !border-0 !shadow-sm"
            style={{
              backgroundColor: '#16a34a !important',
              fontSize: '12px'
            }}
          />
        </div>

        {showTooltip && (
          <div className="absolute top-full left-0 mt-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-50 whitespace-nowrap shadow-lg hidden sm:block">
            ✅ Wallet connected - You can now vote and earn!
            <div className="text-gray-300 mt-1">Click button to manage wallet</div>
          </div>
        )}
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className="relative">
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative"
      >
        {/* Desktop version */}
        <div className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="font-bold text-lg">Connect Wallet</span>
            </div>
            <div className="text-purple-200 text-sm">
              Required to vote and earn SOL prizes
            </div>
          </div>
          <div className="text-3xl">🔗</div>
        </div>

        {/* Mobile version - simpler */}
        <div className="sm:hidden bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg px-4 py-3 shadow-lg">
          <div className="text-white text-center">
            <div className="font-bold text-sm">Connect Wallet</div>
            <div className="text-purple-200 text-xs">To vote & earn</div>
          </div>
        </div>
        
        {/* Position the actual wallet button on top */}
        <WalletMultiButton 
          className="!absolute !inset-0 !w-full !h-full !bg-transparent !text-transparent !border-0 !shadow-none hover:!bg-transparent hover:!text-transparent !cursor-pointer"
          style={{
            backgroundColor: 'transparent !important',
            border: 'none !important'
          }}
        />
      </div>

      {/* Desktop tooltip only */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 text-white text-sm rounded-lg px-4 py-3 z-50 max-w-sm shadow-lg hidden sm:block">
          <div className="font-semibold mb-2 text-yellow-400">🔐 Why connect your wallet?</div>
          <ul className="space-y-1 text-gray-300 text-xs">
            <li>• Vote on daily AI-generated memes</li>
            <li>• Automatically earn lottery tickets</li>
            <li>• Win SOL prizes directly to your wallet</li>
            <li>• Track your voting streak & rewards</li>
          </ul>
          <div className="text-green-400 mt-2 font-medium text-sm">100% FREE • No fees • Instant rewards</div>
        </div>
      )}
    </div>
  );
};

export default ProminentWalletConnection;