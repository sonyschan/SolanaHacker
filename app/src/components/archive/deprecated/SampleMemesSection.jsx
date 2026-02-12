import React from 'react';
import InteractiveButton from './InteractiveButton';

const SampleMemesSection = () => {
  const sampleMemes = [
    {
      id: 1,
      image: "/generated/sample-meme-1-crypto-confusion.png",
      prompt: "When you finally understand NFTs but then someone mentions utility",
      votes: { fire: 234, good: 89, skip: 12 },
      rarity: "Epic",
      rarityColor: "text-purple-400",
      dailyRank: 2
    },
    {
      id: 2,
      image: "/generated/sample-meme-2-sol-pump.png",
      prompt: "When SOL pumps to $200 but you sold at $150",
      votes: { fire: 445, good: 156, skip: 23 },
      rarity: "Legendary",
      rarityColor: "text-yellow-400",
      dailyRank: 1
    },
    {
      id: 3,
      image: "/generated/sample-meme-3-discord-mod.png",
      prompt: "Discord mod explaining why your Web3 opinion is wrong",
      votes: { fire: 167, good: 203, skip: 87 },
      rarity: "Rare",
      rarityColor: "text-blue-400",
      dailyRank: 4
    }
  ];

  return (
    <section className="sample-memes-section bg-gray-900 py-20">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            🎨 <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">AI-Generated</span> Meme Previews
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Every day, our AI creates fresh, hilarious memes based on crypto trends and internet culture. 
            Here's what you'll be voting on:
          </p>
        </div>

        {/* Sample Memes Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          {sampleMemes.map((meme, index) => (
            <div key={meme.id} className="bg-gray-800 border border-gray-600 rounded-2xl overflow-hidden hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              
              {/* Rank Badge */}
              <div className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-3 py-1 rounded-full text-sm group-hover:scale-110 transition-transform duration-200">
                    #{meme.dailyRank} Today
                  </div>
                </div>
                
                {/* Actual AI-Generated Meme Image */}
                <div className="aspect-square bg-gray-700 flex items-center justify-center">
                  <img 
                    src={meme.image} 
                    alt={meme.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.target.parentNode.innerHTML = `
                        <div class="text-center text-gray-400 p-8">
                          <div class="text-4xl mb-2">🤖</div>
                          <div class="text-lg font-bold">AI Meme #${meme.id}</div>
                          <div class="text-sm px-4 mt-2 italic opacity-80">"${meme.prompt}"</div>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>

              {/* Meme Info */}
              <div className="p-6">
                
                {/* Meme Prompt */}
                <div className="mb-4">
                  <div className="text-white text-sm font-medium mb-2">AI Prompt:</div>
                  <div className="text-gray-300 text-sm italic">"{meme.prompt}"</div>
                </div>
                
                {/* Rarity */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Rarity:</span>
                    <span className={`font-bold ${meme.rarityColor} group-hover:text-opacity-100`}>{meme.rarity}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <span>🗳️</span>
                    <span>{meme.votes.fire + meme.votes.good + meme.votes.skip} votes</span>
                  </div>
                </div>

                {/* Voting Results */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-orange-400">
                      <span>🔥</span>
                      <span className="text-sm">Fire</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500 group-hover:bg-orange-400"
                          style={{ 
                            width: `${(meme.votes.fire / (meme.votes.fire + meme.votes.good + meme.votes.skip)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-8 text-right">{meme.votes.fire}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-green-400">
                      <span>👍</span>
                      <span className="text-sm">Good</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500 group-hover:bg-green-400"
                          style={{ 
                            width: `${(meme.votes.good / (meme.votes.fire + meme.votes.good + meme.votes.skip)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-8 text-right">{meme.votes.good}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-red-400">
                      <span>👎</span>
                      <span className="text-sm">Skip</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-500 group-hover:bg-red-400"
                          style={{ 
                            width: `${(meme.votes.skip / (meme.votes.fire + meme.votes.good + meme.votes.skip)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-8 text-right">{meme.votes.skip}</span>
                    </div>
                  </div>
                </div>

                {/* Vote Call to Action */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs mb-2">Your vote would earn:</div>
                    <div className="text-yellow-400 font-bold text-sm flex items-center justify-center space-x-1 group-hover:scale-105 transition-transform duration-200">
                      <span>🎫</span>
                      <span>+10-15 Lottery Tickets</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Rarity Explanation */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-400/50 transition-colors duration-300">
            <h3 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center">
              <span className="mr-3">💎</span>
              How Meme Rarity Works
            </h3>
            
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="space-y-3 hover:scale-105 transition-transform duration-200 cursor-pointer">
                <div className="text-3xl">🥉</div>
                <div className="text-blue-400 font-bold">Common</div>
                <div className="text-gray-300 text-sm">40-60% Fire votes</div>
              </div>
              
              <div className="space-y-3 hover:scale-105 transition-transform duration-200 cursor-pointer">
                <div className="text-3xl">🥈</div>
                <div className="text-blue-400 font-bold">Rare</div>
                <div className="text-gray-300 text-sm">60-75% Fire votes</div>
              </div>
              
              <div className="space-y-3 hover:scale-105 transition-transform duration-200 cursor-pointer">
                <div className="text-3xl">🏆</div>
                <div className="text-purple-400 font-bold">Epic</div>
                <div className="text-gray-300 text-sm">75-90% Fire votes</div>
              </div>
              
              <div className="space-y-3 hover:scale-105 transition-transform duration-200 cursor-pointer">
                <div className="text-3xl">👑</div>
                <div className="text-yellow-400 font-bold">Legendary</div>
                <div className="text-gray-300 text-sm">90%+ Fire votes</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-300 max-w-2xl mx-auto">
                The community's votes determine each meme's final rarity. Legendary memes get minted as special NFTs 
                and their voters earn <span className="text-yellow-400 font-bold">bonus lottery tickets!</span>
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Vote on Today's Memes? 🗳️
            </h3>
            <p className="text-gray-300 mb-8">
              Fresh AI-generated memes are waiting for your vote. Start earning lottery tickets now!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <InteractiveButton
                onClick={() => {
                  document.getElementById('voting-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                variant="primary"
                size="large"
                className="flex items-center space-x-2"
              >
                <span className="text-xl">🎨</span>
                <span>View Today's Memes</span>
              </InteractiveButton>
              
              <InteractiveButton
                onClick={() => {
                  document.querySelector('.wallet-connect-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                variant="outline"
                size="large"
                className="flex items-center space-x-2"
              >
                <span className="text-xl">🔗</span>
                <span>Connect Wallet First</span>
              </InteractiveButton>
            </div>
            
            <div className="text-gray-400 text-sm mt-4">
              New memes generated daily at 12:00 PM UTC
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SampleMemesSection;