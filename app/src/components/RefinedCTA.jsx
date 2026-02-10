import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const RefinedCTA = ({ onStartVoting }) => {
  const { connected, connecting } = useWallet();

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-blue-500/30 shadow-xl mb-8">
      <div className="text-center">
        {!connected ? (
          <>
            <div className="text-5xl mb-6">🚀</div>
            <h3 className="text-3xl font-bold text-white mb-3">
              Get Started
            </h3>
            <p className="text-lg text-blue-200 mb-6 leading-relaxed max-w-md mx-auto">
              Connect your Solana wallet to vote on daily memes and earn SOL rewards through our weekly lottery system
            </p>
            
            <div className="mb-6">
              <WalletMultiButton className="!bg-blue-600 !text-white !rounded-xl !font-semibold !px-8 !py-4 !text-lg !border-0 hover:!bg-blue-700 !shadow-lg transition-all" />
              
              {connecting && (
                <div className="text-blue-300 text-sm mt-3">
                  ⏳ Connecting to your wallet...
                </div>
              )}
            </div>
            
            <div className="text-slate-300 text-sm space-y-1">
              <div>✓ Free to connect • ✓ You control your funds</div>
              <div>✓ Compatible with Phantom, Solflare & more</div>
            </div>
            
            {/* Trust indicator */}
            <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-500/20">
              <div className="text-green-300 text-sm font-semibold">
                💰 This week's prize pool: 47.3 SOL (~$9,460)
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">✅</div>
            <h3 className="text-3xl font-bold text-white mb-3">
              Wallet Connected
            </h3>
            <p className="text-lg text-green-200 mb-6 leading-relaxed max-w-md mx-auto">
              Perfect! Your wallet is connected. You can now participate in voting and earn SOL rewards.
            </p>
            
            <button
              onClick={onStartVoting}
              className="bg-green-600 text-white rounded-xl font-semibold px-8 py-4 text-lg hover:bg-green-700 shadow-lg transition-all mb-4"
            >
              🗳️ Start Voting
            </button>
            
            <div className="text-slate-300 text-sm">
              Scroll down to see today's meme and cast your vote
            </div>
            
            {/* Reward preview */}
            <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
              <div className="text-blue-300 text-sm font-semibold">
                🎫 Each vote earns 10-15 lottery tickets
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RefinedCTA;