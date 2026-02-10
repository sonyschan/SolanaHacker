import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const MegaCTA = ({ onStartVoting }) => {
  const { connected, connecting } = useWallet();

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-1 shadow-2xl mb-12 animate-pulse">
      <div className="bg-gray-900 rounded-3xl p-8 text-center">
        {!connected ? (
          <>
            {/* Super prominent call to action */}
            <div className="text-8xl mb-4 animate-bounce">🎯</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Start Earning SOL Now!
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join <span className="font-bold text-yellow-300">1,247 active voters</span> earning real cryptocurrency. 
              Just connect your wallet and vote on today's memes!
            </p>
            
            {/* Mega Connect Button */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-1 inline-block shadow-2xl">
                <div className="bg-gray-900 rounded-2xl px-2 py-1">
                  <WalletMultiButton className="!bg-gradient-to-r !from-green-500 !to-blue-600 !text-white !rounded-xl !font-black !px-12 !py-6 !text-2xl !border-0 hover:!from-green-600 hover:!to-blue-700 !shadow-2xl !transform hover:!scale-105 !transition-all" />
                </div>
              </div>
              
              {connecting && (
                <div className="text-yellow-300 text-lg mt-4 font-bold animate-pulse">
                  ⏳ Connecting your wallet...
                </div>
              )}
            </div>
            
            {/* Trust and reward indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-green-900/30 rounded-xl p-4 border-2 border-green-400/50">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-green-300 font-bold">47.3 SOL</div>
                <div className="text-sm text-gray-300">Prize Pool</div>
              </div>
              
              <div className="bg-blue-900/30 rounded-xl p-4 border-2 border-blue-400/50">
                <div className="text-2xl mb-2">🎫</div>
                <div className="text-blue-300 font-bold">8-12</div>
                <div className="text-sm text-gray-300">Random Tickets</div>
              </div>
              
              <div className="bg-purple-900/30 rounded-xl p-4 border-2 border-purple-400/50">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-purple-300 font-bold">Free</div>
                <div className="text-sm text-gray-300">No Cost to Play</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Connected state */}
            <div className="text-8xl mb-4">🚀</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Ready to Vote!
            </h2>
            <p className="text-xl text-green-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Awesome! Your wallet is connected. Time to vote on today's meme and earn lottery tickets.
            </p>
            
            {/* Mega Start Button */}
            <button
              onClick={onStartVoting}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl font-black px-16 py-8 text-3xl hover:from-green-600 hover:to-blue-700 shadow-2xl transform hover:scale-105 transition-all mb-6"
            >
              🗳️ VOTE NOW
            </button>
            
            <div className="text-lg text-gray-300 mb-6">
              ⬇️ Scroll down to see today's meme and cast your vote ⬇️
            </div>
            
            {/* Action preview */}
            <div className="bg-yellow-900/30 rounded-xl p-4 border-2 border-yellow-400/50 max-w-md mx-auto">
              <div className="text-yellow-300 font-bold text-lg">
                🎯 Next: Vote on meme rarity → Earn random tickets → Weekly SOL lottery
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MegaCTA;