import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const FinalEnhancedHero = ({ onScrollToVoting }) => {
  const { connected } = useWallet();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  // Show floating CTA after user scrolls
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const previewMemes = [
    { emoji: "🚀", title: "SOL to the Moon!", category: "Bullish", votes: 247 },
    { emoji: "🤯", title: "DeFi Life", category: "Relatable", votes: 189 },
    { emoji: "💎", title: "Diamond Hands", category: "Emotional", votes: 156 }
  ];

  const MainCTA = ({ isMobile = false }) => {
    if (connected) {
      return (
        <button
          onClick={onScrollToVoting}
          className={`group relative bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 hover:from-green-300 hover:via-emerald-300 hover:to-teal-300 text-black font-black shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 transition-all duration-300 border-4 border-white/90 ${
            isMobile ? 'text-xl px-8 py-4 rounded-2xl' : 'text-3xl px-16 py-8 rounded-[2rem]'
          } w-full flex items-center justify-center space-x-4`}
        >
          <span className={`${isMobile ? 'text-2xl' : 'text-4xl'} animate-bounce`}>🚀</span>
          <span className="relative z-10">
            {isMobile ? 'VOTE & EARN SOL NOW!' : 'VOTE NOW & EARN SOL'}
          </span>
          <span className={`${isMobile ? 'text-2xl' : 'text-4xl'} animate-bounce delay-75`}>💰</span>
          
          {/* Ultra glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-emerald-300 rounded-[2rem] blur-lg opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
        </button>
      );
    }

    return (
      <div className="space-y-4 w-full">
        <WalletMultiButton className={`group relative !bg-gradient-to-r !from-green-400 !via-emerald-400 !to-teal-400 hover:!from-green-300 hover:!via-emerald-300 hover:!to-teal-300 !text-black !font-black !shadow-2xl hover:!shadow-green-500/50 !transform hover:!scale-110 !transition-all !duration-300 !border-4 !border-white/90 ${
          isMobile ? '!text-xl !px-8 !py-4 !rounded-2xl' : '!text-3xl !px-16 !py-8 !rounded-[2rem]'
        } !w-full !flex !items-center !justify-center !space-x-4`} />
        <div className="text-center">
          <p className={`text-green-200 font-bold animate-pulse ${isMobile ? 'text-base' : 'text-xl'}`}>
            ⚡ Connect Wallet → Start Earning SOL ⚡
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white min-h-screen flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Mobile-First Social Proof */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="bg-green-500/30 backdrop-blur-sm border border-green-400/70 rounded-full px-3 py-2 text-xs sm:text-sm font-bold">
              <span className="text-green-300">● LIVE</span> 1,247+ Voters
            </div>
            <div className="bg-yellow-500/30 backdrop-blur-sm border border-yellow-400/70 rounded-full px-3 py-2 text-xs sm:text-sm font-bold">
              💰 12.7 SOL ($2,540)
            </div>
            <div className="bg-blue-500/30 backdrop-blur-sm border border-blue-400/70 rounded-full px-3 py-2 text-xs sm:text-sm font-bold">
              ✅ 100% Payout
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Main Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                Vote on AI Memes,<br />
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Earn Real SOL
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-purple-100 mb-6 sm:mb-8 leading-relaxed">
                Join <strong className="text-yellow-300">1,247+ daily voters</strong> earning cryptocurrency. 
                Each vote = lottery tickets for <strong className="text-green-300">weekly SOL prizes!</strong>
              </p>

              {/* Mobile-Optimized How It Works */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 lg:mb-10">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3">
                    🗳️
                  </div>
                  <div className="font-bold text-base sm:text-lg mb-1">Vote Daily</div>
                  <div className="text-purple-200 text-sm">Pick favorite from 3 memes</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3">
                    🎫
                  </div>
                  <div className="font-bold text-base sm:text-lg mb-1">Earn Tickets</div>
                  <div className="text-purple-200 text-sm">8-15 lottery tickets</div>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-3">
                    💰
                  </div>
                  <div className="font-bold text-base sm:text-lg mb-1">Win SOL</div>
                  <div className="text-purple-200 text-sm">Every Sunday 8PM</div>
                </div>
              </div>

              {/* ULTRA MEGA CTA - Desktop */}
              <div className="hidden lg:block mb-8">
                <MainCTA />
              </div>

              {/* Urgency Indicator */}
              <div className="bg-red-500/20 backdrop-blur border border-red-400/50 rounded-2xl p-3 sm:p-4 mx-auto max-w-md lg:max-w-none">
                <div className="flex items-center justify-center space-x-2 text-red-200">
                  <span className="animate-pulse text-lg">⏰</span>
                  <span className="font-bold text-sm sm:text-base">Only 18h 42m left to vote!</span>
                </div>
              </div>
            </div>

            {/* Right: Today's Meme Previews */}
            <div className="order-1 lg:order-2">
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Today's Memes Battle</h3>
                <p className="text-purple-200 text-sm sm:text-base">Vote for your favorite!</p>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-6">
                {previewMemes.map((meme, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                        idx === 1 ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                        'bg-gradient-to-br from-purple-400 to-pink-500'
                      }`}>
                        {meme.emoji}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-base sm:text-lg text-white mb-1">{meme.title}</h4>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-purple-200">{meme.category}</span>
                          <span className="text-yellow-300 font-medium">{meme.votes} votes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile CTA Preview Button */}
              <button
                onClick={onScrollToVoting}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                See All & Vote Below ↓
              </button>
            </div>
          </div>

          {/* ULTRA MEGA CTA - Mobile (Above the fold) */}
          <div className="lg:hidden mt-8 mb-6">
            <MainCTA isMobile />
          </div>

          {/* Bottom Stats */}
          <div className="mt-12 lg:mt-16 bg-black/40 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-yellow-400 mb-2">12.7</div>
                <div className="text-purple-200 font-medium text-sm sm:text-base">SOL Prize Pool</div>
                <div className="text-purple-300 text-xs sm:text-sm">$2,540 USD</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-green-400 mb-2">1,247</div>
                <div className="text-purple-200 font-medium text-sm sm:text-base">Participants</div>
                <div className="text-green-300 text-xs sm:text-sm font-bold">Growing!</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-400 mb-2">247</div>
                <div className="text-purple-200 font-medium text-sm sm:text-base">Voting Now</div>
                <div className="text-blue-300 text-xs sm:text-sm flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  LIVE
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-red-400 mb-2">18:42</div>
                <div className="text-purple-200 font-medium text-sm sm:text-base">Time Left</div>
                <div className="text-red-300 text-xs sm:text-sm font-bold">Hurry!</div>
              </div>
            </div>
          </div>

          {/* Final Scroll CTA */}
          <div className="text-center mt-8 lg:mt-12">
            <button 
              onClick={onScrollToVoting}
              className="group text-white hover:text-yellow-300 transition-colors animate-bounce"
            >
              <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">⬇</div>
              <div className="font-bold text-base sm:text-lg">VOTE BELOW</div>
            </button>
          </div>
        </div>
      </section>

      {/* Floating Action Button for Mobile */}
      {showFloatingCTA && (
        <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
          <MainCTA isMobile />
        </div>
      )}
    </>
  );
};

export default FinalEnhancedHero;