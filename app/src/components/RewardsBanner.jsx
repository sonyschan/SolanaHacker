import React from 'react';

const RewardsBanner = ({ liveVoters, prizePool }) => {
  return (
    <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-6 border-2 border-green-500/30 mb-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-green-300 mb-4 flex items-center justify-center">
          <span className="mr-2">💰</span>
          This Week's Live Stats
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-black text-green-300">{prizePool} SOL</div>
            <div className="text-gray-300 font-semibold">Prize Pool</div>
            <div className="text-xs text-green-400">≈ ${(prizePool * 200).toLocaleString()} USD</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-black text-blue-300">{liveVoters.toLocaleString()}</div>
            <div className="text-gray-300 font-semibold">Active Voters</div>
            <div className="text-xs text-blue-400">+{Math.floor(liveVoters/10)}/hour</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-black text-purple-300">8.7</div>
            <div className="text-gray-300 font-semibold">Biggest Win</div>
            <div className="text-xs text-purple-400">Last week's winner</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-900/20 rounded-xl border border-yellow-500/30">
          <div className="text-yellow-300 font-bold text-lg">
            🎯 Next Drawing: Sunday 8PM UTC
          </div>
          <div className="text-gray-300 text-sm">
            Every vote this week = lottery tickets for the prize pool
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsBanner;