import React, { useState } from 'react';

const RewardsCalculatorSection = () => {
  const [votesPerWeek, setVotesPerWeek] = useState(7);

  // Calculate estimated earnings with improved random ticket system
  const calculateRewards = (votes) => {
    const avgTicketsPerVote = 10; // Random range 8-12 for new users, higher for loyal users
    const totalTickets = votes * avgTicketsPerVote;
    const prizePool = 47.3; // SOL
    const estimatedWeeklyVoters = 2500;
    const averageTicketsPerWeek = estimatedWeeklyVoters * 5; // 5 votes per person average
    const winChance = totalTickets / (totalTickets + averageTicketsPerWeek);
    const expectedValue = winChance * prizePool;
    
    return {
      ticketsEarned: totalTickets,
      winChance: Math.min(winChance * 100, 99), // Cap at 99%
      expectedValue: expectedValue,
      prizePool: prizePool
    };
  };

  const rewards = calculateRewards(votesPerWeek);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-900">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          💰 Rewards Calculator
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          See exactly how much SOL you can earn based on your voting activity. 
          The more you vote, the better your chances!
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8 border border-blue-600 max-w-4xl mx-auto">
        
        {/* Vote Slider */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <label className="text-white text-lg font-medium mb-4 block">
              How many times will you vote per week?
            </label>
            
            <div className="relative">
              <input
                type="range"
                min="1"
                max="30"
                value={votesPerWeek}
                onChange={(e) => setVotesPerWeek(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(votesPerWeek / 30) * 100}%, #374151 ${(votesPerWeek / 30) * 100}%, #374151 100%)`
                }}
              />
              
              <div className="text-center mt-4">
                <span className="text-4xl font-bold text-white bg-blue-600 px-6 py-2 rounded-xl">
                  {votesPerWeek}
                </span>
                <div className="text-blue-200 text-sm mt-2">votes per week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Tickets Earned */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center border border-white border-opacity-20">
            <div className="text-3xl mb-2">🎟️</div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {rewards.ticketsEarned.toLocaleString()}
            </div>
            <div className="text-blue-200 text-sm">
              Lottery Tickets
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Random per vote
            </div>
          </div>

          {/* Win Chance */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center border border-white border-opacity-20">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {rewards.winChance.toFixed(1)}%
            </div>
            <div className="text-blue-200 text-sm">
              Win Chance
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Per week
            </div>
          </div>

          {/* Expected Value */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center border border-white border-opacity-20">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-purple-400 mb-1">
              ${(rewards.expectedValue * 180).toFixed(0)}
            </div>
            <div className="text-blue-200 text-sm">
              Expected Value
            </div>
            <div className="text-xs text-gray-300 mt-1">
              USD per week
            </div>
          </div>

          {/* Prize Pool */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 text-center border border-white border-opacity-20">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {rewards.prizePool} SOL
            </div>
            <div className="text-blue-200 text-sm">
              Weekly Prize
            </div>
            <div className="text-xs text-gray-300 mt-1">
              ~${(rewards.prizePool * 180).toLocaleString()} USD
            </div>
          </div>
        </div>

        {/* Updated Explanation */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <span className="mr-2">📊</span>
            How Fair Rewards Work
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-blue-300 font-medium mb-2">🎟️ Earning Tickets</div>
              <ul className="text-gray-300 space-y-1">
                <li>• New voters: 8-12 tickets per vote (random)</li>
                <li>• Loyal voters (4+ days): 9-13 tickets</li>
                <li>• Super loyal (8+ days): 10-15 tickets</li>
                <li>• More participation = better rewards</li>
              </ul>
            </div>
            
            <div>
              <div className="text-green-300 font-medium mb-2">🎰 Weekly Lottery</div>
              <ul className="text-gray-300 space-y-1">
                <li>• Every Sunday at 12:00 UTC</li>
                <li>• Winner selected randomly</li>
                <li>• SOL sent automatically to wallet</li>
                <li>• Transparent, verifiable results</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-yellow-950 border border-yellow-800 rounded-lg p-4">
            <div className="text-yellow-200 font-medium mb-2 flex items-center">
              <span className="mr-2">💡</span>
              Fair Voting System
            </div>
            <div className="text-yellow-100 text-sm">
              Your reward doesn't depend on picking the "correct" rarity vote. All voting choices get the same random ticket range, 
              encouraging honest opinions over strategic voting.
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              document.querySelector('.wallet-connect-section')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
              });
            }}
            className="bg-white text-blue-900 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors mr-4"
          >
            🚀 Start Earning Now
          </button>
          
          <div className="text-blue-200 text-sm mt-3">
            Connect wallet → Vote on memes → Earn SOL rewards
          </div>
        </div>
      </div>

      {/* Success Examples */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl mb-3">🏅</div>
          <div className="text-lg font-bold text-yellow-400 mb-2">Casual Voter</div>
          <div className="text-gray-300 text-sm mb-3">3 votes per week</div>
          <div className="text-white font-medium">
            {calculateRewards(3).ticketsEarned} tickets
          </div>
          <div className="text-green-400 text-sm">
            {calculateRewards(3).winChance.toFixed(1)}% win chance
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 h-1"></div>
          <div className="text-3xl mb-3">🚀</div>
          <div className="text-lg font-bold text-blue-400 mb-2">Active Voter</div>
          <div className="text-gray-300 text-sm mb-3">7 votes per week (1 daily)</div>
          <div className="text-white font-medium">
            {calculateRewards(7).ticketsEarned} tickets
          </div>
          <div className="text-green-400 text-sm">
            {calculateRewards(7).winChance.toFixed(1)}% win chance
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-3xl mb-3">🔥</div>
          <div className="text-lg font-bold text-red-400 mb-2">Power Voter</div>
          <div className="text-gray-300 text-sm mb-3">15 votes per week</div>
          <div className="text-white font-medium">
            {calculateRewards(15).ticketsEarned} tickets
          </div>
          <div className="text-green-400 text-sm">
            {calculateRewards(15).winChance.toFixed(1)}% win chance
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewardsCalculatorSection;