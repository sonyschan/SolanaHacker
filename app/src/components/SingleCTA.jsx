import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const SingleCTA = ({ onStartVoting }) => {
  const { connected, connecting } = useWallet();
  const [showWalletInfo, setShowWalletInfo] = useState(false);

  if (connected) {
    return (
      <div className="text-center">
        <button 
          onClick={onStartVoting}
          className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-blue-500 text-white text-xl font-bold px-12 py-4 rounded-2xl hover:scale-105 shadow-2xl transition-all duration-300"
        >
          🗳️ Vote on Today's Meme & Earn SOL
        </button>
        <div className="mt-3 text-green-300 bg-green-900/20 rounded-lg p-2 text-sm">
          ✅ <strong>Wallet Connected!</strong> You're ready to vote and earn rewards
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      {/* Main Action */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1 rounded-2xl">
        <div className="bg-gray-900 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-3">
            🚀 Start Earning SOL Rewards
          </h3>
          <p className="text-gray-300 mb-4 text-sm">
            Connect your wallet to vote on memes and earn lottery tickets
          </p>
          
          <WalletMultiButton className="!w-full !bg-gradient-to-r !from-green-500 !to-blue-500 !text-white !text-xl !font-bold !py-4 !px-8 !rounded-xl !border-0 hover:!from-green-400 hover:!to-blue-400 !transition-all" />
          
          {connecting && (
            <div className="mt-3 text-yellow-300 flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300"></div>
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Help Link */}
      <button
        onClick={() => setShowWalletInfo(!showWalletInfo)}
        className="text-blue-300 underline text-sm hover:text-blue-200"
      >
        {showWalletInfo ? 'Hide' : 'New to crypto wallets? Quick setup guide'}
      </button>
      
      {/* Wallet Help */}
      {showWalletInfo && (
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30 text-left text-sm max-w-md mx-auto">
          <h4 className="text-blue-300 font-bold mb-3 text-center">💡 Never used a crypto wallet?</h4>
          <div className="space-y-2 text-gray-200">
            <div className="flex items-start space-x-2">
              <span className="text-blue-300 font-bold">1.</span>
              <span>Download <a href="https://phantom.app" target="_blank" rel="noopener" className="text-blue-300 underline">Phantom</a> (most popular, 2 minutes setup)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-300 font-bold">2.</span>
              <span>Create wallet & save your seed phrase safely</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-300 font-bold">3.</span>
              <span>Click "Connect Wallet" above and approve</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-300 font-bold">4.</span>
              <span>Start voting and earning SOL!</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-green-900/30 rounded text-xs text-green-200 text-center">
            🔒 <strong>100% Safe:</strong> Free to create, no personal info required
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCTA;