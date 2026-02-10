import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const SuperEnhancedHero = ({ onScrollToVoting }) => {
  const { connected } = useWallet();

  const previewMemes = [
    { emoji: "🚀", title: "SOL to the Moon!", category: "Bullish" },
    { emoji: "🤯", title: "DeFi Life Explained", category: "Relatable" },
    { emoji: "💎", title: "Diamond Hands", category: "Emotional" }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Social Proof Badges - Prominent Top Section */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/50 rounded-full px-4 py-2 text-sm font-bold">
            <span className="text-green-400">● LIVE</span> 1,247+ Daily Voters
          </div>
          <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/50 rounded-full px-4 py-2 text-sm font-bold">
            💰 12.7 SOL Prize Pool <span className="text-yellow-300">($2,540)</span>
          </div>
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/50 rounded-full px-4 py-2 text-sm font-bold">
            ✅ 100% Payout History
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Main Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              Vote on AI Memes,<br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Earn Real SOL
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-purple-100 mb-8 leading-relaxed">
              Join thousands earning cryptocurrency by voting on daily AI-generated crypto memes. 
              <strong className="text-yellow-300"> Each vote = lottery tickets for weekly SOL prizes.</strong>
            </p>

            {/* How It Works - Compact Visual Flow */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-10">
              <div className="flex items-center space-x-2 text-left">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl shadow-lg">
                  🗳️
                </div>
                <div>
                  <div className="font-bold">Vote Daily</div>
                  <div className="text-purple-200 text-sm">Pick your favorite</div>
                </div>
              </div>
              <div className="hidden sm:block text-purple-300 text-2xl">→</div>
              <div className="flex items-center space-x-2 text-left">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xl shadow-lg">
                  🎫
                </div>
                <div>
                  <div className="font-bold">Earn Tickets</div>
                  <div className="text-purple-200 text-sm">8-15 per vote</div>
                </div>
              </div>
              <div className="hidden sm:block text-purple-300 text-2xl">→</div>
              <div className="flex items-center space-x-2 text-left">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-xl shadow-lg">
                  💰
                </div>
                <div>
                  <div className="font-bold">Win SOL</div>
                  <div className="text-purple-200 text-sm">Every Sunday</div>
                </div>
              </div>
            </div>

            {/* MEGA CTA - Most Prominent Element */}
            <div className="space-y-4">
              {connected ? (
                <button
                  onClick={onScrollToVoting}
                  className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-400 hover:via-emerald-400 hover:to-teal-400 text-white px-12 py-6 rounded-3xl text-2xl font-black shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 transition-all duration-300 border-4 border-green-300/50 w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-3">
                    <span className="text-3xl animate-bounce">🚀</span>
                    <span>VOTE NOW & EARN SOL</span>
                    <span className="text-3xl animate-bounce delay-75">💰</span>
                  </span>
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                </button>
              ) : (
                <div className="space-y-3">
                  <WalletMultiButton className="group relative !bg-gradient-to-r !from-green-500 !via-emerald-500 !to-teal-500 hover:!from-green-400 hover:!via-emerald-400 hover:!to-teal-400 !text-white !px-12 !py-6 !rounded-3xl !text-2xl !font-black !shadow-2xl hover:!shadow-green-500/50 !transform hover:!scale-110 !transition-all !duration-300 !border-4 !border-green-300/50 !w-full sm:!w-auto" />
                  <p className="text-green-200 text-lg font-bold animate-pulse">
                    ⚡ Connect Wallet to Start Earning SOL ⚡
                  </p>
                </div>
              )}
              
              {/* Urgency Indicator */}
              <div className="bg-red-500/20 backdrop-blur border border-red-400/50 rounded-2xl p-4 inline-block">
                <div className="flex items-center justify-center space-x-2 text-red-200">
                  <span className="animate-pulse">⏰</span>
                  <span className="font-bold">Only 18h 42m left to vote today!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Today's Meme Previews */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Today's Memes</h3>
              <p className="text-purple-200">Vote for your favorite to earn tickets!</p>
            </div>

            <div className="space-y-4">
              {previewMemes.map((meme, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${
                      idx === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                      idx === 1 ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                      'bg-gradient-to-br from-purple-400 to-pink-500'
                    }`}>
                      {meme.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-lg text-white mb-1">{meme.title}</h4>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-200 text-sm">{meme.category}</span>
                        <span className="text-yellow-300 text-sm font-medium">8-15 tickets</span>
                      </div>
                    </div>
                    <div className="text-purple-300 group-hover:text-white transition-colors">
                      →
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onScrollToVoting}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              See All 3 Memes & Vote →
            </button>
          </div>
        </div>

        {/* Bottom Stats - More Prominent */}
        <div className="mt-16 bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-yellow-400 mb-2">12.7</div>
              <div className="text-purple-200 font-medium">SOL Prize Pool</div>
              <div className="text-purple-300 text-sm">≈ $2,540 USD</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-green-400 mb-2">1,247</div>
              <div className="text-purple-200 font-medium">Daily Participants</div>
              <div className="text-green-300 text-sm font-bold">🔥 Growing Fast</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-400 mb-2">247</div>
              <div className="text-purple-200 font-medium">Voting Now</div>
              <div className="text-blue-300 text-sm flex items-center justify-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                LIVE
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-red-400 mb-2">18:42</div>
              <div className="text-purple-200 font-medium">Time Left</div>
              <div className="text-red-300 text-sm font-bold">⏰ Hurry!</div>
            </div>
          </div>
        </div>

        {/* Final Scroll CTA */}
        <div className="text-center mt-12">
          <button 
            onClick={onScrollToVoting}
            className="group text-white hover:text-yellow-300 transition-colors animate-bounce"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⬇</div>
            <div className="font-bold text-lg">START VOTING NOW</div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default SuperEnhancedHero;