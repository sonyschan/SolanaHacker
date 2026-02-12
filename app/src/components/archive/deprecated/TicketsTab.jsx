import React from 'react';

const TicketsTab = ({ userTickets }) => {
  // Mock data - in production would come from blockchain
  const recentWins = [
    { date: '2026-02-08', amount: 2.3, tickets: 234, type: 'Weekly Lottery' },
    { date: '2026-02-01', amount: 0.8, tickets: 89, type: 'Weekly Lottery' },
    { date: '2026-01-25', amount: 1.2, tickets: 156, type: 'Weekly Lottery' }
  ];

  const votingHistory = [
    { date: '2026-02-09', votes: 2, tickets: 13, streak: 3 },
    { date: '2026-02-08', votes: 2, tickets: 11, streak: 2 },
    { date: '2026-02-07', votes: 2, tickets: 9, streak: 1 },
    { date: '2026-02-06', votes: 2, tickets: 8, streak: 0 },
    { date: '2026-02-05', votes: 2, tickets: 10, streak: 4 }
  ];

  const currentPrizePool = 12.7; // SOL
  const weeklyDrawDate = '2026-02-16 8:00 PM UTC';
  const userWinProbability = ((userTickets / (userTickets + 8567)) * 100).toFixed(2); // Mock total tickets

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-600 to-orange-600 bg-opacity-20 border border-yellow-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🎫</div>
          <h3 className="font-bold text-lg mb-1">My Tickets</h3>
          <div className="text-3xl font-bold text-yellow-300">{userTickets}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-pink-600 bg-opacity-20 border border-purple-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-bold text-lg mb-1">Prize Pool</h3>
          <div className="text-3xl font-bold text-purple-300">{currentPrizePool} SOL</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-emerald-600 bg-opacity-20 border border-green-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-bold text-lg mb-1">Win Chance</h3>
          <div className="text-3xl font-bold text-green-300">{userWinProbability}%</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 bg-opacity-20 border border-blue-600 border-opacity-40 rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <h3 className="font-bold text-lg mb-1">Next Draw</h3>
          <div className="text-sm font-bold text-blue-300">Sunday 8PM</div>
          <div className="text-xs text-blue-200">Feb 16, UTC</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
        <h2 className="text-2xl font-bold mb-6 text-center">🎰 How Lottery Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🗳️</div>
            <h3 className="font-bold mb-2">Vote & Earn</h3>
            <p className="text-sm text-gray-300">
              Vote on memes to earn 8-15 tickets per vote. Voting streak increases rewards.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💎</div>
            <h3 className="font-bold mb-2">NFT Auctions</h3>
            <p className="text-sm text-gray-300">
              Winning memes become NFTs. 80% of auction proceeds feed the weekly prize pool.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-bold mb-2">Random Distribution</h3>
            <p className="text-sm text-gray-300">
              Every Sunday, prize pool distributed randomly based on ticket proportions.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Wins */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
        <h2 className="text-2xl font-bold mb-6">🏆 My Winning History</h2>
        {recentWins.length > 0 ? (
          <div className="space-y-4">
            {recentWins.map((win, index) => (
              <div key={index} className="bg-green-600 bg-opacity-20 border border-green-600 border-opacity-40 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold text-green-300">+{win.amount} SOL</div>
                  <div className="text-sm text-gray-300">{win.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">{win.date}</div>
                  <div className="text-xs text-gray-500">With {win.tickets} tickets</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-3">🎯</div>
            <p>No wins yet. Keep voting to increase your chances!</p>
          </div>
        )}
      </div>

      {/* Voting History */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
        <h2 className="text-2xl font-bold mb-6">📊 Recent Voting Activity</h2>
        <div className="space-y-3">
          {votingHistory.map((day, index) => (
            <div key={index} className="bg-gray-600 bg-opacity-30 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">📅</div>
                <div>
                  <div className="font-medium">{day.date}</div>
                  <div className="text-sm text-gray-400">{day.votes} votes cast</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-300 font-bold">+{day.tickets} tickets</div>
                <div className="text-xs text-gray-400">
                  {day.streak > 0 ? `${day.streak} day streak` : 'No streak'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips for Success */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 bg-opacity-20 border border-blue-600 border-opacity-40 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">💡 Tips for More Tickets</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-bold">Build Voting Streaks</div>
                <div className="text-sm text-gray-300">5+ day streaks earn 10-15 tickets per vote</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-bold">Vote Consistently</div>
                <div className="text-sm text-gray-300">Daily participation maximizes lottery chances</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤝</span>
              <div>
                <div className="font-bold">Engage Both Phases</div>
                <div className="text-sm text-gray-300">Meme selection + rarity voting both reward tickets</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="font-bold">Early Voting Bonus</div>
                <div className="text-sm text-gray-300">Vote early in the day for potential bonus tickets</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketsTab;