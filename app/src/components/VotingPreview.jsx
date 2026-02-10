import React from 'react';

const VotingPreview = () => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-600/50 mb-8">
      <h3 className="text-3xl font-bold text-center text-white mb-8">
        🎯 How Voting Works
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: See Meme */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 mb-4 border-2 border-purple-400/50">
            <div className="text-5xl mb-3">👀</div>
            <h4 className="text-white font-bold text-lg mb-2">1. See Daily Meme</h4>
            <p className="text-gray-200 text-sm">
              Every day at noon, we release a new AI-generated meme for voting
            </p>
          </div>
          <div className="text-xs text-gray-400">
            Today: "Space Doge with Laser Eyes"
          </div>
        </div>

        {/* Step 2: Vote on Rarity */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 mb-4 border-2 border-yellow-400/50">
            <div className="text-5xl mb-3">🗳️</div>
            <h4 className="text-white font-bold text-lg mb-2">2. Vote on Rarity</h4>
            <p className="text-gray-200 text-sm">
              Choose: Common, Rare, or Legendary based on how epic you think it is
            </p>
          </div>
          <div className="flex justify-center space-x-1 text-xs">
            <span className="bg-gray-600 px-2 py-1 rounded text-gray-200">Common</span>
            <span className="bg-blue-600 px-2 py-1 rounded text-white">Rare</span>
            <span className="bg-purple-600 px-2 py-1 rounded text-white">Legendary</span>
          </div>
        </div>

        {/* Step 3: Earn Rewards */}
        <div className="text-center">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 mb-4 border-2 border-green-400/50">
            <div className="text-5xl mb-3">💰</div>
            <h4 className="text-white font-bold text-lg mb-2">3. Earn SOL</h4>
            <p className="text-gray-200 text-sm">
              Get 10-15 lottery tickets instantly. Weekly drawing for real SOL prizes!
            </p>
          </div>
          <div className="text-xs text-green-300 font-semibold">
            Weekly Prize: 47.3 SOL
          </div>
        </div>
      </div>

      {/* Live Example */}
      <div className="mt-8 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl p-6 border border-gray-500/30">
        <h4 className="text-white font-bold text-center mb-4">
          🔥 Live Example: Yesterday's Results
        </h4>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-300 font-semibold">Common</div>
            <div className="text-white text-lg font-bold">234 votes</div>
            <div className="text-gray-400">19%</div>
          </div>
          <div>
            <div className="text-blue-300 font-semibold">Rare</div>
            <div className="text-white text-lg font-bold">567 votes</div>
            <div className="text-gray-400">46%</div>
          </div>
          <div>
            <div className="text-purple-300 font-semibold">Legendary</div>
            <div className="text-white text-lg font-bold">433 votes</div>
            <div className="text-gray-400">35%</div>
          </div>
        </div>
        <div className="text-center mt-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
          <div className="text-purple-300 font-bold">Community Decision: RARE NFT</div>
          <div className="text-gray-300 text-sm">This meme became a Rare NFT and sold for 3.2 SOL</div>
        </div>
      </div>
    </div>
  );
};

export default VotingPreview;