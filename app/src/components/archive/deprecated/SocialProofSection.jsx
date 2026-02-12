import React from 'react';

const SocialProofSection = () => {
  // Mock recent winners data
  const recentWinners = [
    {
      address: "9Hq...4k2M",
      amount: "2.3 SOL",
      usd: "$414",
      timeAgo: "2 hours ago",
      meme: "Diamond Hands Dog",
      votes: 1247
    },
    {
      address: "7Xp...8vNr", 
      amount: "1.8 SOL",
      usd: "$324",
      timeAgo: "1 day ago",
      meme: "Confused Crypto Cat",
      votes: 892
    },
    {
      address: "4Mw...2qLs",
      amount: "3.1 SOL", 
      usd: "$558",
      timeAgo: "3 days ago",
      meme: "Bullish Moon Bear",
      votes: 1456
    }
  ];

  const memeExamples = [
    {
      title: "Diamond Hands Dog",
      rarity: "Legendary",
      votes: 1247,
      winner: "9Hq...4k2M",
      prize: "2.3 SOL"
    },
    {
      title: "Confused Crypto Cat", 
      rarity: "Rare",
      votes: 892,
      winner: "7Xp...8vNr",
      prize: "1.8 SOL"
    },
    {
      title: "Bullish Moon Bear",
      rarity: "Legendary", 
      votes: 1456,
      winner: "4Mw...2qLs",
      prize: "3.1 SOL"
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Recent Winners */}
      <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-6 border border-green-700 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🏆 Recent SOL Winners
          </h2>
          <p className="text-green-300">
            Real people winning real cryptocurrency every day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentWinners.map((winner, index) => (
            <div key={index} className="bg-black/20 rounded-lg p-4 border border-green-600/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-green-400 font-mono text-sm">{winner.address}</div>
                <div className="text-gray-400 text-xs">{winner.timeAgo}</div>
              </div>
              
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-white">{winner.amount}</div>
                <div className="text-green-400 font-medium">{winner.usd}</div>
              </div>
              
              <div className="bg-gray-800 rounded-md p-3 text-center">
                <div className="text-sm text-white font-medium mb-1">"{winner.meme}"</div>
                <div className="text-xs text-gray-400">{winner.votes.toLocaleString()} community votes</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <div className="inline-flex items-center space-x-2 bg-green-800 rounded-full px-4 py-2 border border-green-600">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-200 text-sm font-medium">Live payouts every 24 hours</span>
          </div>
        </div>
      </div>

      {/* Meme Hall of Fame */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🎭 Meme Hall of Fame
          </h2>
          <p className="text-gray-300">
            Community-crowned legendary memes that became valuable NFTs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {memeExamples.map((meme, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4 border border-gray-600">
              
              {/* Meme Preview */}
              <div className="aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-4 flex items-center justify-center relative">
                <div className="text-6xl">
                  {index === 0 ? '🐕' : index === 1 ? '🐱' : '🐻'}
                </div>
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                  meme.rarity === 'Legendary' ? 'bg-yellow-500 text-black' : 'bg-purple-500 text-white'
                }`}>
                  {meme.rarity === 'Legendary' ? '🏆' : '💎'} {meme.rarity}
                </div>
              </div>

              {/* Meme Info */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">"{meme.title}"</h3>
                
                <div className="bg-gray-800 rounded-md p-3 mb-3">
                  <div className="text-sm text-gray-300 mb-1">
                    {meme.votes.toLocaleString()} votes → {meme.rarity}
                  </div>
                  <div className="text-xs text-gray-400">
                    Winner: <span className="text-green-400 font-mono">{meme.winner}</span>
                  </div>
                </div>

                <div className="bg-green-900 rounded-md p-2 border border-green-700">
                  <div className="text-green-300 font-bold">{meme.prize}</div>
                  <div className="text-xs text-green-400">Prize Won</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm mb-4">
            Every day, new AI memes compete. Every day, the community decides what's valuable.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full">
              🏆 Legendary: Community voted as exceptional
            </span>
            <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full">
              💎 Rare: Community voted as noteworthy
            </span>
            <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full">
              👍 Common: Community voted as enjoyable
            </span>
          </div>
        </div>
      </div>

    </section>
  );
};

export default SocialProofSection;