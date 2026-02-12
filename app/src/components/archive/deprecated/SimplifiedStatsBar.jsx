import React from 'react';

const SimplifiedStatsBar = ({ liveVoters, prizePool, timeLeft }) => {
  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-gray-600/50">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        
        {/* Live Voters */}
        <div className="flex items-center justify-center sm:justify-start space-x-3 p-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="text-2xl">👥</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xl sm:text-2xl font-bold text-green-300">
              {liveVoters.toLocaleString()}
            </div>
            <div className="text-xs text-gray-300">
              Voters today
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div className="flex items-center justify-center space-x-3 p-2">
          <div className="text-2xl">💰</div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-300">
              {prizePool} SOL
            </div>
            <div className="text-xs text-gray-300">
              Prize pool
            </div>
          </div>
        </div>

        {/* Time Left */}
        <div className="flex items-center justify-center sm:justify-end space-x-3 p-2">
          <div className="text-2xl">⏰</div>
          <div className="text-center sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-red-300">
              {timeLeft.split(':')[0]}h left
            </div>
            <div className="text-xs text-gray-300">
              To vote
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimplifiedStatsBar;