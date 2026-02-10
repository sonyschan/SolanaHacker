import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const EnhancedSingleCTA = ({ onStartVoting }) => {
  const { connected, connecting } = useWallet();

  if (!connected) {
    return (
      <div className="w-full max-w-lg mx-auto">
        {/* Primary Action Card - Very Prominent */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 rounded-2xl p-8 text-center border-4 border-yellow-400/60 shadow-2xl mb-6">
          {/* Clear Step Indicator */}
          <div className="bg-yellow-400 text-black rounded-full w-12 h-12 flex items-center justify-center text-2xl font-black mx-auto mb-4">
            1
          </div>
          
          <h3 className="text-3xl font-black text-white mb-3">
            Connect Your Wallet
          </h3>
          <p className="text-purple-100 text-lg mb-6 leading-relaxed">
            Connect to vote on memes and earn <strong>real SOL cryptocurrency</strong>
          </p>

          {/* Very Prominent Wallet Button */}
          <div className="mb-6">
            <WalletMultiButton className="!bg-yellow-400 !text-black !rounded-xl !font-black !px-12 !py-6 !text-2xl !border-0 hover:!bg-yellow-300 !shadow-lg transition-all transform hover:scale-105" />
            
            {connecting && (
              <div className="text-yellow-300 text-lg mt-3 font-semibold">
                ⏳ Connecting...
              </div>
            )}
          </div>

          {/* Trust Signals */}
          <div className="text-purple-100 text-sm space-y-1 font-semibold">
            <div>✅ 100% Free • ✅ You control your money</div>
            <div>✅ Works with Phantom, Solflare & more</div>
          </div>
        </div>

        {/* Additional Motivation */}
        <div className="text-center text-gray-300 text-sm">
          <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
            💰 <strong>Today's Prize Pool:</strong> 47.3 SOL (≈ $9,460 USD)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Success State - Ready to Vote */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-green-700 rounded-2xl p-8 text-center border-4 border-yellow-400/60 shadow-2xl mb-6">
        {/* Success Indicator */}
        <div className="bg-yellow-400 text-black rounded-full w-12 h-12 flex items-center justify-center text-2xl font-black mx-auto mb-4">
          ✓
        </div>
        
        <h3 className="text-3xl font-black text-white mb-3">
          ✅ Wallet Connected!
        </h3>
        <p className="text-green-100 text-lg mb-6 leading-relaxed">
          Perfect! Now you can vote on memes and <strong>earn SOL rewards</strong>
        </p>

        {/* Very Prominent Start Voting Button */}
        <button
          onClick={onStartVoting}
          className="bg-yellow-400 text-black rounded-xl font-black px-12 py-6 text-2xl shadow-lg hover:bg-yellow-300 transition-all transform hover:scale-105 mb-4"
        >
          🗳️ START VOTING NOW
        </button>

        {/* Next Steps */}
        <div className="text-green-100 text-sm font-semibold">
          👇 Scroll down to see today's meme and cast your vote!
        </div>
      </div>
      
      {/* Encouragement */}
      <div className="text-center text-gray-300 text-sm">
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
          🎯 Each vote = 10-15 lottery tickets for weekly SOL prizes!
        </div>
      </div>
    </div>
  );
};

export default EnhancedSingleCTA;