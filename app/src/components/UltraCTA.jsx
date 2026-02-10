import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const UltraCTA = ({ onStartVoting }) => {
  const { connected } = useWallet();
  
  if (connected) {
    return (
      <div className="bg-green-950 rounded-xl p-8 mb-12 border border-green-800 text-center animate-fade-in">
        <div className="text-4xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-green-300 mb-4">
          🎉 Wallet Connected - Ready to Vote!
        </h2>
        <p className="text-gray-200 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
          You're all set to participate in today's voting and earn SOL rewards. 
          Each vote earns you lottery tickets for the weekly prize drawing.
        </p>
        <button
          onClick={onStartVoting}
          className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-8 py-4 rounded-lg border border-green-500 transition-all duration-200 hover:scale-105 shadow-lg"
        >
          🗳️ Start Voting Now
        </button>
        <div className="mt-4 text-sm text-gray-300">
          ⏰ Today's voting closes in 23 hours
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-950 rounded-xl p-8 mb-12 border border-blue-800 text-center">
      <div className="text-4xl mb-4">🗳️</div>
      <h2 className="text-2xl font-bold text-blue-300 mb-4">
        Ready to Start Earning SOL?
      </h2>
      <p className="text-gray-200 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
        Connect your Solana wallet to join thousands of voters earning real cryptocurrency 
        through democratic meme curation. No signup required.
      </p>
      <div className="space-y-4">
        <WalletMultiButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-4 rounded-lg border border-blue-500 transition-all duration-200" />
        <div className="text-sm text-gray-300">
          ✅ Free to join • ⚡ Instant setup • 💎 Real SOL rewards
        </div>
      </div>
    </div>
  );
};

export default UltraCTA;