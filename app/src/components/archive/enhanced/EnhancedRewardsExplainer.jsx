import React from 'react';

const EnhancedRewardsExplainer = () => {
  return (
    <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-xl p-6 border border-green-700 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-xl"></div>
      <div className="absolute top-2 right-2 text-6xl opacity-10">🎲</div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="text-xl font-bold text-white">
                Fair Reward System
              </h3>
              <div className="text-green-300 text-sm font-medium">
                Random • Unbiased • Participation-Based
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              8-15
            </div>
            <div className="text-sm text-green-300">
              random tickets
            </div>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Random System Explanation */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-400">🎲</span>
              <span className="text-white font-semibold text-sm">Random Rewards (No Bias)</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">
              Every vote earns random lottery tickets regardless of your choice. 
              Vote "Legendary"? Random reward. Vote "Common"? Same random reward. 
              This eliminates strategic voting and ensures authentic opinions.
            </p>
          </div>

          {/* Participation Bonus */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🔥</span>
                <span className="text-white font-semibold text-sm">Streak Bonuses</span>
              </div>
              <span className="text-blue-300 text-xs">Daily voting rewards</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-300 font-bold">Days 1-3</div>
                <div className="text-green-300">8-12 tickets</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-blue-300 font-bold">Days 4-7</div>
                <div className="text-green-300">9-13 tickets</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-purple-300 font-bold">Day 8+</div>
                <div className="text-green-300">10-15 tickets</div>
              </div>
            </div>
          </div>

          {/* Why This Works */}
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-yellow-400">⚖️</span>
              <span className="text-white font-semibold text-sm">Why This System Works</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <span className="text-green-400 mt-1">✓</span>
                <div className="text-gray-200">
                  <strong>No strategic voting:</strong> Can't game the system for better rewards
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400 mt-1">✓</span>
                <div className="text-gray-200">
                  <strong>Honest opinions:</strong> Vote based on genuine assessment
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400 mt-1">✓</span>
                <div className="text-gray-200">
                  <strong>Loyalty rewarded:</strong> Daily voters earn better ranges
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400 mt-1">✓</span>
                <div className="text-gray-200">
                  <strong>Equal opportunity:</strong> Everyone has fair chances to win
                </div>
              </div>
            </div>
          </div>

          {/* Real SOL Prizes */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-3 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="text-purple-300 font-bold text-sm">Weekly SOL Prizes</div>
                  <div className="text-gray-300 text-xs">Real cryptocurrency rewards</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-purple-300 font-bold">47.3 SOL</div>
                <div className="text-gray-400 text-xs">current pool</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default EnhancedRewardsExplainer;