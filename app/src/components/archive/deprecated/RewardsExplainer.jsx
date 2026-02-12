import React from 'react';

const RewardsExplainer = () => {
  return (
    <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/30">
      <h4 className="text-green-300 font-bold mb-3 text-center flex items-center justify-center space-x-2">
        <span>💰</span>
        <span>How You Earn SOL</span>
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {/* Step 1 */}
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">🗳️</div>
          <div className="font-bold text-yellow-300">Vote Daily</div>
          <div className="text-gray-300 text-xs">
            Each vote = 10-15 tickets
          </div>
        </div>
        
        {/* Step 2 */}
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">🎫</div>
          <div className="font-bold text-blue-300">Collect Tickets</div>
          <div className="text-gray-300 text-xs">
            More votes = more chances
          </div>
        </div>
        
        {/* Step 3 */}
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-purple-300">Win SOL</div>
          <div className="text-gray-300 text-xs">
            Weekly lottery draws
          </div>
        </div>
      </div>
      
      {/* Concrete Examples */}
      <div className="mt-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
        <div className="text-yellow-300 font-bold text-sm text-center mb-2">
          💎 Real Rewards This Week:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-center">
          <div className="text-gray-200">
            <div className="font-bold text-green-300">1st Prize</div>
            <div>10 SOL (~$2,000)</div>
          </div>
          <div className="text-gray-200">
            <div className="font-bold text-blue-300">2nd Prize</div>
            <div>5 SOL (~$1,000)</div>
          </div>
          <div className="text-gray-200">
            <div className="font-bold text-purple-300">3rd Prize</div>
            <div>2 SOL (~$400)</div>
          </div>
        </div>
        <div className="text-center text-gray-400 text-xs mt-2">
          + 20 smaller prizes for active voters
        </div>
      </div>
    </div>
  );
};

export default RewardsExplainer;