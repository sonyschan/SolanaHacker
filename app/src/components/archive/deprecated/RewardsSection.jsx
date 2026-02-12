import React from 'react';
import SOLExplainerModal from './SOLExplainerModal';

const RewardsSection = () => {
  return (
    <section className="bg-gradient-to-br from-purple-900 to-blue-900 py-20">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            💰 <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Real Rewards</span> Await
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Vote on AI-generated memes, earn lottery tickets, and win actual SOL cryptocurrency. 
            It's that simple — no complex strategies needed.
          </p>
          <div className="mt-4 flex justify-center">
            <SOLExplainerModal />
          </div>
        </div>

        {/* Reward Pool Display */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
          
          {/* Total Prize Pool */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">Total Prize Pool</h3>
            <div className="text-4xl font-bold text-white mb-2">47.3 SOL</div>
            <div className="text-yellow-200 text-lg">≈ $8,514 USD</div>
          </div>

          {/* Weekly Winners */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">Weekly Winners</h3>
            <div className="text-4xl font-bold text-white mb-2">3 People</div>
            <div className="text-green-200 text-lg">Top 3 get SOL prizes</div>
          </div>

          {/* Your Tickets */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-2xl font-bold text-blue-400 mb-2">Your Tickets</h3>
            <div className="text-4xl font-bold text-white mb-2">0</div>
            <div className="text-blue-200 text-lg">Start voting to earn!</div>
          </div>

        </div>

        {/* How It Works */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-white mb-12">
            🎯 How to Earn Rewards
          </h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 mx-auto">
                1
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Connect Wallet</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Link your Solana wallet (Phantom, Solflare) to receive prizes directly
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 mx-auto">
                2
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Vote Daily</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Rate AI-generated memes as 🔥 Fire, 👍 Good, or 👎 Skip. Each vote earns tickets.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 mx-auto">
                3
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Weekly Lottery</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Every Sunday, lottery picks 3 winners based on ticket weight.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 mx-auto">
                4
              </div>
              <h4 className="text-lg font-bold text-white mb-3">Get Paid SOL</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Winners receive SOL directly to their wallet. No waiting, no middleman.
              </p>
            </div>

          </div>
        </div>

        {/* Bonus Earning Tips */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center">
              <span className="mr-3">💡</span>
              Pro Tips to Maximize Earnings
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div className="text-gray-200">
                    <strong className="text-white">Vote consistently:</strong> Daily voters earn the most tickets over time
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div className="text-gray-200">
                    <strong className="text-white">Quality matters:</strong> Thoughtful votes on viral potential earn bonus tickets
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div className="text-gray-200">
                    <strong className="text-white">Early bird bonus:</strong> First 100 voters each day get extra tickets
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div className="text-gray-200">
                    <strong className="text-white">Refer friends:</strong> Get bonus tickets when friends join and vote
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Start Earning Real SOL? 🚀
            </h3>
            <p className="text-gray-300 mb-8">
              The next lottery is in 3 days. Connect your wallet and start voting today to maximize your chances.
            </p>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              🎫 Start Earning Tickets Now
            </button>
            <div className="text-gray-400 text-sm mt-4">
              No purchase required • No hidden fees • Keep 100% of winnings
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default RewardsSection;