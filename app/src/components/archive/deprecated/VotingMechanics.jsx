import React from 'react';

const VotingMechanics = () => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/30 mb-8">
      <h3 className="text-2xl font-bold text-white mb-6 text-center">
        ⚙️ How Voting & Rewards Work
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Voting Process */}
        <div>
          <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
            <span className="mr-2">🗳️</span>
            Voting Process
          </h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-blue-400 font-bold">1.</span>
              <div className="text-sm">
                <div className="text-white font-semibold">Daily Meme Released</div>
                <div className="text-gray-400">New AI meme at 12:00 UTC daily</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-blue-400 font-bold">2.</span>
              <div className="text-sm">
                <div className="text-white font-semibold">Community Votes</div>
                <div className="text-gray-400">Rate as Common, Rare, or Legendary</div>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-blue-400 font-bold">3.</span>
              <div className="text-sm">
                <div className="text-white font-semibold">NFT Rarity Set</div>
                <div className="text-gray-400">Majority vote determines final rarity</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reward System */}
        <div>
          <h4 className="text-lg font-semibold text-green-300 mb-4 flex items-center">
            <span className="mr-2">💎</span>
            Reward System
          </h4>
          <div className="space-y-3">
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-500/20">
              <div className="text-green-300 font-semibold mb-2">Instant Tickets</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-400">Common</div>
                  <div className="text-white font-bold">10 🎫</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400">Rare</div>
                  <div className="text-white font-bold">12 🎫</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400">Legendary</div>
                  <div className="text-white font-bold">15 🎫</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/20">
              <div className="text-blue-300 font-semibold mb-2">Weekly Lottery</div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>🗓️ Every Sunday at 8PM UTC</div>
                <div>💰 47.3 SOL total prize pool</div>
                <div>🎯 Multiple winners selected randomly</div>
                <div>📤 SOL sent directly to your wallet</div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
              <div className="text-purple-300 font-semibold mb-2">Bonus Multipliers</div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>🔥 Daily voter: +2 bonus tickets</div>
                <div>👑 Week streak: +5 bonus tickets</div>
                <div>🎯 Accuracy bonus: +3 if majority matches</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Example Calculation */}
      <div className="mt-6 p-4 bg-yellow-900/20 rounded-xl border border-yellow-500/30">
        <h4 className="text-yellow-300 font-semibold mb-3 text-center">
          💡 Example: Your Weekly Potential
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-white font-bold">7 votes</div>
            <div className="text-gray-400">Daily participation</div>
          </div>
          <div>
            <div className="text-white font-bold">84 tickets</div>
            <div className="text-gray-400">Base earning</div>
          </div>
          <div>
            <div className="text-white font-bold">+10 bonus</div>
            <div className="text-gray-400">Streak + accuracy</div>
          </div>
          <div>
            <div className="text-green-300 font-bold">94 total</div>
            <div className="text-gray-400">Final lottery tickets</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingMechanics;