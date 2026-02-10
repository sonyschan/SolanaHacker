import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const IntegratedCTA = ({ onStartVoting, onLearnMore }) => {
  const { connected, connecting } = useWallet();
  const [showWalletHelp, setShowWalletHelp] = useState(false);

  if (connected) {
    return (
      <div className="space-y-4">
        <button 
          onClick={onStartVoting}
          className="w-full btn-primary text-lg px-8 py-4 rounded-2xl hover:scale-105 shadow-2xl font-bold"
        >
          🗳️ Vote on Today's Meme & Earn SOL
        </button>
        <div className="text-sm text-green-300 bg-green-900/20 rounded-lg p-3 border border-green-500/30 text-center">
          ✅ <strong>Wallet Connected!</strong> You can now vote and earn lottery tickets
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main CTA - Wallet Connection */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1">
        <div className="bg-gray-900 rounded-2xl p-4 text-center">
          <h3 className="text-xl font-bold text-white mb-3">
            🚀 Ready to Start Earning?
          </h3>
          <div className="space-y-3">
            <WalletMultiButton className="!w-full !py-4 !text-lg !font-bold !rounded-xl !bg-gradient-to-r !from-green-500 !to-blue-500 !border-0 hover:!from-green-400 hover:!to-blue-400 !transition-all" />
            
            {connecting && (
              <div className="text-yellow-300 flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300"></div>
                <span>Connecting your wallet...</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 text-sm text-gray-300">
            <span>New to crypto wallets? </span>
            <button
              onClick={() => setShowWalletHelp(!showWalletHelp)}
              className="text-blue-300 underline hover:text-blue-200"
            >
              Quick setup guide
            </button>
          </div>
        </div>
      </div>
      
      {/* Wallet Help */}
      {showWalletHelp && (
        <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30 text-sm">
          <h4 className="text-blue-300 font-bold mb-2">💡 First time? It's easy!</h4>
          <ol className="space-y-2 text-gray-200 list-decimal list-inside">
            <li>Download <a href="https://phantom.app" target="_blank" rel="noopener" className="text-blue-300 underline">Phantom wallet</a> (takes 2 minutes)</li>
            <li>Create your wallet & save your seed phrase</li>
            <li>Click "Connect Wallet" above and select Phantom</li>
            <li>Start voting and earning SOL rewards!</li>
          </ol>
          <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
            🔒 <strong>Safe & Free:</strong> No personal info needed, no fees to connect
          </div>
        </div>
      )}
      
      {/* Secondary Action */}
      <button
        onClick={onLearnMore}
        className="w-full px-6 py-3 rounded-xl border border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 transition-colors font-semibold text-base"
      >
        🎓 Learn How It Works First
      </button>
      
      {/* Quick Benefits Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className="text-green-300 font-bold">10-15</div>
          <div className="text-gray-300">Tickets per vote</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className="text-blue-300 font-bold">Weekly</div>
          <div className="text-gray-300">SOL lottery draws</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className="text-purple-300 font-bold">Equal</div>
          <div className="text-gray-300">Voice in decisions</div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedCTA;