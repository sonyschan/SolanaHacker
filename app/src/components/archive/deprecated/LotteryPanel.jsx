import React from 'react';

const LotteryPanel = ({ stats }) => {
  return (
    <div className="card-elevated p-6 card-interactive">
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-lg text-high-contrast flex items-center">
          🎰 Weekly Lottery
        </h2>
        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
          🔴 LIVE
        </div>
      </div>

      {/* Prize Pool - Hero Section */}
      <div className="text-center mb-8 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
        <div className="text-5xl font-bold text-green-300 mb-3">
          ⚡ {stats.prizePool.toFixed(2)} SOL
        </div>
        <p className="text-high-contrast font-semibold text-lg mb-1">This Week's Prize Pool</p>
        <p className="text-green-300 text-sm">≈ ${(stats.prizePool * 120).toFixed(0)} USD at current rates</p>
      </div>

      {/* Countdown Timer */}
      <div className="stat-card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-high-contrast font-semibold mb-1">⏰ Draw Countdown</div>
            <div className="text-medium-contrast text-sm">Next winner announced on Sunday midnight UTC</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-pink-400 font-mono">
              {stats.timeLeft}
            </div>
            <div className="text-low-contrast text-xs">HH:MM:SS</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="responsive-grid-2 mb-6">
        <div className="stat-card text-center">
          <div className="stat-number text-high-contrast mb-1">{stats.totalVoters.toLocaleString()}</div>
          <div className="stat-label">🗳️ Weekly Voters</div>
          <div className="text-low-contrast text-xs mt-1">Participating this week</div>
        </div>
        <div className="stat-card text-center">
          <div className="stat-number text-blue-400 mb-1">3</div>
          <div className="stat-label">🏆 Prize Tiers</div>
          <div className="text-low-contrast text-xs mt-1">Top winners</div>
        </div>
      </div>

      {/* Prize Distribution */}
      <div className="space-y-4 mb-6">
        <h3 className="text-high-contrast font-bold text-lg flex items-center">
          <span className="mr-2">🏆</span>
          Prize Distribution
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🥇</span>
              <div>
                <div className="text-yellow-300 font-bold">1st Place</div>
                <div className="text-yellow-200 text-sm">Highest chance winner</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-high-contrast font-bold text-lg">
                {(stats.prizePool * 0.5).toFixed(2)} SOL
              </div>
              <div className="text-yellow-300 text-sm">50%</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 stat-card">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🥈</span>
              <div>
                <div className="text-medium-contrast font-semibold">2nd Place</div>
                <div className="text-low-contrast text-sm">Second highest</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-high-contrast font-bold">
                {(stats.prizePool * 0.3).toFixed(2)} SOL
              </div>
              <div className="text-medium-contrast text-sm">30%</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-600/20 rounded-lg border border-orange-500/30">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🥉</span>
              <div>
                <div className="text-orange-300 font-semibold">3rd Place</div>
                <div className="text-orange-200 text-sm">Third highest</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-high-contrast font-bold">
                {(stats.prizePool * 0.2).toFixed(2)} SOL
              </div>
              <div className="text-orange-300 text-sm">20%</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4">
        <h4 className="text-high-contrast font-bold text-sm mb-3 flex items-center">
          <span className="mr-2">🎲</span>
          How Winners Are Selected
        </h4>
        <div className="text-medium-contrast text-sm space-y-2 leading-relaxed">
          <div className="flex items-start">
            <span className="mr-2 text-purple-400">•</span>
            <span>Weighted random selection based on lottery tickets</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 text-purple-400">•</span>
            <span>More tickets = higher probability to win</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 text-purple-400">•</span>
            <span>Automated draw every Sunday at midnight UTC</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 text-purple-400">•</span>
            <span>Winners announced on Twitter & Discord</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2 text-purple-400">•</span>
            <span>SOL automatically sent to winning wallets</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryPanel;