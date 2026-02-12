import React, { useState } from 'react';

const LotteryExplanationSection = () => {
  const [activeTab, setActiveTab] = useState('how');

  return (
    <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 sm:p-8 border border-yellow-500/30">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-3 flex items-center justify-center space-x-3">
          <span>🎰</span>
          <span>Weekly SOL Lottery</span>
        </h2>
        <p className="text-yellow-200 text-base sm:text-lg max-w-2xl mx-auto">
          Vote → Earn tickets → Win real Solana. Simple, fair, transparent.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row justify-center mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
        {[
          { key: 'how', label: 'How It Works', icon: '⚙️' },
          { key: 'schedule', label: 'Draw Schedule', icon: '📅' },
          { key: 'prizes', label: 'Prize Tiers', icon: '💰' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
        
        {/* How It Works */}
        {activeTab === 'how' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-4">
              🎯 Vote-to-Earn Mechanism
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earning Tickets */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">🎫 Earning Tickets</h4>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-green-300 mb-2">Daily Voting Rewards</div>
                    <div className="text-gray-200 text-sm">
                      Every vote earns you <strong>random lottery tickets</strong> regardless of your choice:
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-700 p-2 rounded text-center">
                        <div className="text-gray-300">Days 1-3</div>
                        <div className="text-green-300 font-bold">8-12</div>
                      </div>
                      <div className="bg-gray-700 p-2 rounded text-center">
                        <div className="text-blue-300">Days 4-7</div>
                        <div className="text-green-300 font-bold">9-13</div>
                      </div>
                      <div className="bg-gray-700 p-2 rounded text-center">
                        <div className="text-purple-300">Day 8+</div>
                        <div className="text-green-300 font-bold">10-15</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700/30">
                    <div className="font-bold text-blue-300 mb-2">Why Random?</div>
                    <div className="text-gray-200 text-sm">
                      Random rewards prevent strategic voting and ensure authentic opinions.
                      You can't game the system - just vote honestly!
                    </div>
                  </div>
                </div>
              </div>

              {/* Using Tickets */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">🎲 Using Tickets</h4>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-yellow-300 mb-2">Automatic Entry</div>
                    <div className="text-gray-200 text-sm">
                      All tickets automatically enter the weekly lottery.
                      More tickets = better odds, but everyone has a chance!
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-purple-300 mb-2">Fair Draw System</div>
                    <div className="text-gray-200 text-sm">
                      Winners selected using verifiable on-chain randomness.
                      No manipulation possible - completely transparent!
                    </div>
                  </div>
                  
                  <div className="bg-green-900/30 rounded-lg p-4 border border-green-700/30">
                    <div className="font-bold text-green-300 mb-2">Example Odds</div>
                    <div className="text-gray-200 text-sm">
                      If you have 100 tickets out of 10,000 total tickets,
                      you have a 1% chance of winning each prize.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-4">
              📅 Weekly Draw Schedule
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Week */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-500/30">
                <h4 className="text-blue-300 font-bold mb-4 text-lg">⏰ This Week's Draw</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Draw Date:</span>
                    <span className="text-white font-bold">Sunday, Feb 9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Draw Time:</span>
                    <span className="text-white font-bold">8:00 PM UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Prize Pool:</span>
                    <span className="text-green-300 font-bold">45 SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Tickets:</span>
                    <span className="text-yellow-300 font-bold">12,847</span>
                  </div>
                </div>
                
                <div className="mt-4 bg-blue-800/20 rounded p-3 text-center">
                  <div className="text-blue-200 text-sm font-medium">Countdown to Draw</div>
                  <div className="text-white text-2xl font-bold">2d 13h 45m</div>
                </div>
              </div>

              {/* How Draws Work */}
              <div className="space-y-4">
                <h4 className="text-white font-bold mb-4 text-lg">🔄 Draw Process</h4>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-green-300 mb-2">1. Ticket Collection</div>
                    <div className="text-gray-200 text-sm">
                      All tickets earned from Monday-Sunday are collected
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-blue-300 mb-2">2. Prize Pool Formation</div>
                    <div className="text-gray-200 text-sm">
                      30% of weekly NFT sales fund the prize pool
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-purple-300 mb-2">3. Random Selection</div>
                    <div className="text-gray-200 text-sm">
                      Solana's on-chain randomness picks winners
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="font-bold text-yellow-300 mb-2">4. Instant Payout</div>
                    <div className="text-gray-200 text-sm">
                      Winners receive SOL directly to their wallets
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prizes */}
        {activeTab === 'prizes' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-4">
              🏆 Prize Structure
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { place: '1st', prize: '22.5 SOL', color: 'from-yellow-500 to-yellow-600', icon: '🥇', percent: '50%' },
                { place: '2nd', prize: '13.5 SOL', color: 'from-gray-400 to-gray-500', icon: '🥈', percent: '30%' },
                { place: '3rd', prize: '9 SOL', color: 'from-orange-500 to-orange-600', icon: '🥉', percent: '20%' }
              ].map((tier, index) => (
                <div key={index} className={`bg-gradient-to-r ${tier.color} rounded-xl p-4 text-center text-white`}>
                  <div className="text-3xl mb-2">{tier.icon}</div>
                  <div className="font-bold text-lg">{tier.place} Place</div>
                  <div className="text-2xl font-bold">{tier.prize}</div>
                  <div className="text-sm opacity-80">{tier.percent}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h4 className="text-white font-bold mb-4 text-lg">💡 Prize Pool Details</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-green-300 font-bold mb-3">How Prize Pool is Funded</h5>
                  <ul className="space-y-2 text-gray-200 text-sm">
                    <li>• 30% of all NFT sales go to lottery</li>
                    <li>• Minimum guaranteed pool: 20 SOL</li>
                    <li>• Maximum pool size: 100 SOL</li>
                    <li>• Unused funds carry over to next week</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-blue-300 font-bold mb-3">Prize Distribution</h5>
                  <ul className="space-y-2 text-gray-200 text-sm">
                    <li>• 50% to 1st place winner</li>
                    <li>• 30% to 2nd place winner</li>
                    <li>• 20% to 3rd place winner</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <div className="text-yellow-300 font-bold mb-2">🎯 Your Winning Chances</div>
                <div className="text-gray-200 text-sm">
                  Example: If you have 50 tickets out of 5,000 total tickets,
                  you have a 1% chance for each prize tier. With 3 prizes total,
                  your overall winning chance is much higher than single-winner systems!
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LotteryExplanationSection;