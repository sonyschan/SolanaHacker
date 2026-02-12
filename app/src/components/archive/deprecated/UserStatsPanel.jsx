import React from 'react';

const UserStatsPanel = ({ stats }) => {
  return (
    <div className="card-elevated p-4 sm:p-6 card-interactive">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="heading-md text-high-contrast flex items-center">
          <span className="mr-2 text-2xl sm:text-3xl">📊</span>
          Your Stats
        </h2>
        <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl px-3 py-1">
          <span className="text-purple-300 font-bold text-sm">
            {stats.currentRank}
          </span>
        </div>
      </div>

      <div className="responsive-grid-2 mb-6">
        <div className="stat-card">
          <div className="stat-number text-green-400">{stats.totalTickets}</div>
          <div className="stat-label">
            <span className="mr-1">🎟️</span>
            Total Tickets
          </div>
          <div className="text-xs text-gray-400 mt-1">For this week's lottery</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number text-blue-400">{stats.weeklyVotes}</div>
          <div className="stat-label">
            <span className="mr-1">🗳️</span>
            This Week
          </div>
          <div className="text-xs text-gray-400 mt-1">Votes cast</div>
        </div>
      </div>

      <div className="responsive-grid-2 mb-6">
        <div className="stat-card">
          <div className="stat-number text-purple-400">{stats.allTimeVotes}</div>
          <div className="stat-label">
            <span className="mr-1">🏆</span>
            All Time
          </div>
          <div className="text-xs text-gray-400 mt-1">Total votes</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number text-yellow-400">
            {stats.winningsToDate.toFixed(1)}
          </div>
          <div className="stat-label">
            <span className="mr-1">💰</span>
            SOL Won
          </div>
          <div className="text-xs text-gray-400 mt-1">Lifetime earnings</div>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-medium-contrast font-semibold text-sm sm:text-base">
            🎯 Progress to VIP Status
          </h4>
          <span className="text-xs text-gray-400">
            {stats.allTimeVotes}/100 votes
          </span>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-2 sm:h-3 mb-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 sm:h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((stats.allTimeVotes / 100) * 100, 100)}%` }}
          ></div>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          🌟 VIP voters get 2x lottery tickets and early access to premium memes!
        </p>
      </div>

      {/* Recent Activity - Updated with random ticket amounts */}
      <div className="mt-4 sm:mt-6 bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
        <h4 className="text-medium-contrast font-semibold text-sm sm:text-base mb-3 flex items-center">
          <span className="mr-2">⚡</span>
          Recent Activity
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">Voted "Legendary" on Penguin Meme</span>
            </div>
            <span className="text-gray-500">+11 tickets</span>
          </div>
          
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">🗳️</span>
              <span className="text-gray-300">Voted "Rare" on Doge Rocket</span>
            </div>
            <span className="text-gray-500">+9 tickets</span>
          </div>
          
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400">🏆</span>
              <span className="text-gray-300">Won 3rd place in lottery</span>
            </div>
            <span className="text-green-400">+2.1 SOL</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
        <button className="btn-primary flex-1 text-sm sm:text-base">
          <span className="mr-2">🎯</span>
          View Voting History
        </button>
        <button className="btn-secondary flex-1 text-sm sm:text-base">
          <span className="mr-2">📈</span>
          Leaderboard
        </button>
      </div>
    </div>
  );
};

export default UserStatsPanel;