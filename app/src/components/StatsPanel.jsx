import React from 'react';

const StatsPanel = ({ stats }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <span className="mr-2">📊</span>
        Your Stats
      </h2>

      {/* Current Tickets - Hero */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 mb-6 border border-purple-500/30">
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-300 mb-2">
            🎟️ {stats.totalTickets}
          </div>
          <p className="text-white font-semibold mb-2">Total Lottery Tickets</p>
          <div className="bg-white/10 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.totalTickets / 200) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-purple-200 text-sm">
            {((stats.totalTickets / 18470) * 100).toFixed(2)}% chance to win tonight's draw*
          </p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-blue-400">#{stats.weeklyRank}</div>
          <div className="text-gray-300 text-sm font-semibold">Weekly Rank</div>
          <div className="text-gray-400 text-xs mt-1">Out of 2,847 users</div>
        </div>
        
        <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-green-400">{stats.winStreak}</div>
          <div className="text-gray-300 text-sm font-semibold">Vote Streak</div>
          <div className="text-gray-400 text-xs mt-1">Days in a row</div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center">
          <span className="mr-2">🏅</span>
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Earned Achievements */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-yellow-300 text-sm font-bold">Hot Streak</div>
            <div className="text-yellow-200 text-xs">3+ days voting</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-purple-300 text-sm font-bold">Sharp Eye</div>
            <div className="text-purple-200 text-xs">Rare predictor</div>
          </div>
          
          {/* Locked Achievements */}
          <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-3 text-center opacity-50">
            <div className="text-2xl mb-1 grayscale">💎</div>
            <div className="text-gray-400 text-sm font-bold">Diamond Hands</div>
            <div className="text-gray-500 text-xs">Vote 7 days straight</div>
          </div>
          
          <div className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-3 text-center opacity-50">
            <div className="text-2xl mb-1 grayscale">👑</div>
            <div className="text-gray-400 text-sm font-bold">Lottery King</div>
            <div className="text-gray-500 text-xs">Win any prize</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center">
          <span className="mr-2">📈</span>
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="text-lg">🗳️</div>
              <div>
                <div className="text-white font-semibold text-sm">Today's Vote</div>
                <div className="text-gray-400 text-xs">Voted "Rare Gem"</div>
              </div>
            </div>
            <div className="text-green-400 font-bold">+12</div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="flex items-center space-x-3">
              <div className="text-lg">⚡</div>
              <div>
                <div className="text-white font-semibold text-sm">Yesterday</div>
                <div className="text-gray-400 text-xs">Courage bonus earned</div>
              </div>
            </div>
            <div className="text-green-400 font-bold">+15</div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="flex items-center space-x-3">
              <div className="text-lg">🎯</div>
              <div>
                <div className="text-white font-semibold text-sm">Feb 5</div>
                <div className="text-gray-400 text-xs">Standard vote</div>
              </div>
            </div>
            <div className="text-green-400 font-bold">+10</div>
          </div>
        </div>
      </div>

      {/* Social Boost */}
      <div className="bg-gradient-to-r from-pink-600/10 to-red-600/10 border border-pink-500/20 rounded-xl p-4">
        <h4 className="text-white font-bold text-sm mb-3 flex items-center">
          <span className="mr-2">📱</span>
          Social Boost
          <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold">
            COMING SOON
          </span>
        </h4>
        <p className="text-gray-300 text-sm mb-3 leading-relaxed">
          Share your daily vote on Twitter/X to earn a <span className="text-green-300 font-semibold">+10% ticket bonus</span>!
        </p>
        <button 
          disabled 
          className="w-full bg-gray-600/50 text-gray-400 py-3 rounded-lg text-sm font-bold cursor-not-allowed border border-gray-500/30"
        >
          🐦 Share Vote on X (+10% bonus)
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-center border-t border-gray-700 pt-4">
        <p className="text-gray-500 text-xs leading-relaxed">
          *Win probability estimated from current ticket distribution. 
          Actual odds vary based on total participation at draw time.
        </p>
      </div>
    </div>
  );
};

export default StatsPanel;