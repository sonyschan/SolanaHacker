import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletGuide = () => {
  const { connected, connecting } = useWallet();
  const [showGuide, setShowGuide] = useState(false);

  if (connected) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-purple-900/30 rounded-2xl p-8 max-w-md w-full border border-purple-500/30">
        {/* Visual Guide */}
        <div className="text-center mb-6">
          <img 
            src="/generated/wallet-connection-guide.png" 
            alt="Wallet Connection Guide"
            className="w-32 h-32 mx-auto mb-4 object-contain"
          />
          <h3 className="text-2xl font-bold text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            To vote and earn SOL rewards, you need a Solana wallet. 
            It's free and takes 30 seconds to set up!
          </p>
        </div>

        {/* Step by Step */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <span className="text-blue-400 font-bold">1.</span>
            <div className="text-sm text-gray-200">
              <strong>Click "Select Wallet"</strong> and choose Phantom (recommended for beginners)
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <span className="text-blue-400 font-bold">2.</span>
            <div className="text-sm text-gray-200">
              <strong>Install Phantom</strong> if you don't have it (auto-opens Chrome store)
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
            <span className="text-blue-400 font-bold">3.</span>
            <div className="text-sm text-gray-200">
              <strong>Create wallet</strong> and come back to this page
            </div>
          </div>
        </div>

        {/* Connection Button */}
        <div className="text-center space-y-4">
          <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 !rounded-lg !font-bold !px-8 !py-3 !text-white !border-0 hover:!from-purple-700 hover:!to-blue-700 transition-all" />
          
          {connecting && (
            <div className="text-yellow-300 text-sm">
              ⏳ Connecting to wallet...
            </div>
          )}
          
          <div className="text-xs text-gray-400 bg-gray-800/30 rounded-lg p-3">
            💡 <strong>New to crypto?</strong> A wallet is like a secure login for blockchain apps. 
            Your coins stay in YOUR wallet - we never control them.
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => setShowGuide(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default WalletGuide;