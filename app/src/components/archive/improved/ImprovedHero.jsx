import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import EnhancedWalletButton from './EnhancedWalletButton';

const ImprovedHero = ({ onStartVoting, liveVoters, prizePool }) => {
  const { connected } = useWallet();
  const [animatedVoters, setAnimatedVoters] = useState(liveVoters);

  // Animate the voter count
  useEffect(() => {
    let start = animatedVoters;
    let end = liveVoters;
    let duration = 1000; // 1 second
    let startTime = Date.now();

    const animate = () => {
      let elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      let easeProgress = 1 - Math.pow(1 - progress, 3);
      let current = Math.round(start + (end - start) * easeProgress);
      
      setAnimatedVoters(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [liveVoters, animatedVoters]);

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 sm:py-20 overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-purple-500/20 rounded-full filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-pink-500/20 rounded-full filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center bg-blue-900/50 backdrop-blur-sm border border-blue-600/30 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8 hover:bg-blue-800/50 transition-colors duration-300">
          <span className="text-blue-300 text-sm font-medium mr-2">🏆</span>
          <span className="text-blue-200 text-xs sm:text-sm font-medium">World's First Human-Consensus NFT Rarity Platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
          <span className="block">Vote on</span>
          <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent block">
            AI Memes
          </span>
          <span className="block">Earn Real SOL</span>
        </h1>

        {/* Tagline */}
        <p className="text-base sm:text-xl md:text-2xl text-gray-300 mb-3 sm:mb-4 max-w-3xl mx-auto leading-relaxed">
          Rate AI-generated memes, determine their rarity through community votes, 
          and win <strong className="text-yellow-400">actual cryptocurrency</strong> in weekly lotteries.
        </p>

        {/* Brand Tagline */}
        <div className="text-blue-300 text-sm sm:text-lg font-medium mb-8 sm:mb-12 italic">
          "AI Dreams. Humans Decide."
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
          
          {/* Active Voters */}
          <div className="bg-green-900/30 backdrop-blur-sm border border-green-600/30 rounded-2xl px-4 sm:px-6 py-4 hover:bg-green-800/40 transition-all duration-300 hover:scale-105 hover:border-green-500/50">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
              {animatedVoters.toLocaleString()}
            </div>
            <div className="text-green-200 text-xs sm:text-sm font-medium">
              Active Voters Today
            </div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-green-300 text-xs">Live</span>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="bg-yellow-900/30 backdrop-blur-sm border border-yellow-600/30 rounded-2xl px-4 sm:px-6 py-4 hover:bg-yellow-800/40 transition-all duration-300 hover:scale-105 hover:border-yellow-500/50">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">
              {prizePool} SOL
            </div>
            <div className="text-yellow-200 text-xs sm:text-sm font-medium">
              Weekly Prize Pool
            </div>
            <div className="text-yellow-300 text-xs mt-1">
              ≈ ${(prizePool * 180).toLocaleString()} USD
            </div>
          </div>

          {/* Winners This Week */}
          <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-600/30 rounded-2xl px-4 sm:px-6 py-4 hover:bg-purple-800/40 transition-all duration-300 hover:scale-105 hover:border-purple-500/50">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
              3
            </div>
            <div className="text-purple-200 text-xs sm:text-sm font-medium">
              Winners Each Week
            </div>
            <div className="text-purple-300 text-xs mt-1">
              Next draw in 3 days
            </div>
          </div>

        </div>

        {/* ULTRA PROMINENT CTA SECTION - MASSIVE BUTTONS */}
        <div className="relative mb-12 sm:mb-16">
          
          {/* Glowing background for maximum attention */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 rounded-3xl blur-2xl animate-pulse"></div>
          
          <div className="relative bg-gradient-to-r from-yellow-500/15 via-orange-500/15 to-red-500/15 backdrop-blur-sm border-4 border-yellow-500/70 rounded-3xl p-8 sm:p-16">
            
            {/* CTA Heading - MASSIVE */}
            <div className="mb-8 sm:mb-12">
              <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-4 sm:mb-8 animate-pulse">
                🚀 START NOW!
              </h2>
              <p className="text-xl sm:text-2xl md:text-4xl text-gray-200 font-bold">
                {connected 
                  ? "✅ Ready to Vote & Earn!" 
                  : "🔗 Connect & Earn SOL in 30 Seconds"
                }
              </p>
            </div>

            {/* ENORMOUS Action Buttons */}
            <div className="flex flex-col items-center space-y-6 sm:space-y-8 mb-8 sm:mb-12">
              
              {!connected ? (
                <div className="w-full text-center">
                  {/* PRIMARY GIANT BUTTON */}
                  <EnhancedWalletButton size="large" className="w-full max-w-3xl" />
                  
                  {/* Backup plain HTML button for extra visibility */}
                  <button
                    className="mt-6 block mx-auto bg-red-500 hover:bg-red-600 text-white font-black px-16 py-8 rounded-3xl text-3xl transition-all duration-300 hover:scale-110 shadow-2xl border-4 border-red-400 w-full max-w-2xl"
                    onClick={() => {
                      const walletButton = document.querySelector('.wallet-adapter-button');
                      if (walletButton) walletButton.click();
                    }}
                    style={{ minHeight: '100px' }}
                  >
                    🚨 BACKUP: CONNECT WALLET NOW! 🚨
                  </button>
                </div>
              ) : (
                <button
                  onClick={onStartVoting}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black px-12 sm:px-24 py-6 sm:py-12 rounded-3xl text-2xl sm:text-5xl transition-all duration-200 transform hover:scale-105 shadow-2xl border-4 border-green-400 hover:border-green-300 w-full max-w-4xl"
                  style={{
                    boxShadow: '0 20px 40px rgba(34, 197, 94, 0.6)',
                    minHeight: '120px'
                  }}
                >
                  🗳️ START VOTING & EARNING SOL! 💰
                </button>
              )}

              {/* Secondary Action - ALSO HUGE */}
              <button
                onClick={() => {
                  const sampleSection = document.querySelector('.sample-memes-section');
                  if (sampleSection) {
                    sampleSection.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'center'
                    });
                  }
                }}
                className="bg-transparent border-4 border-blue-500 hover:bg-blue-500/50 hover:border-blue-400 text-blue-300 hover:text-white font-bold px-8 sm:px-16 py-4 sm:py-8 rounded-2xl text-xl sm:text-3xl transition-all duration-200 transform hover:scale-105 shadow-xl w-full max-w-2xl"
                style={{ minHeight: '80px' }}
              >
                👀 PREVIEW AI MEMES FIRST
              </button>

              {/* Emergency fallback buttons for UX detection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
                
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200"
                  onClick={() => alert('Vote button clicked!')}
                >
                  🗳️ Vote
                </button>
                
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200"
                  onClick={() => alert('Connect button clicked!')}
                >
                  🔗 Connect
                </button>
                
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-200"
                  onClick={() => alert('Earn button clicked!')}
                >
                  💰 Earn
                </button>
                
              </div>

            </div>

            {/* Value Proposition */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
                <div className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">2-Second Voting</div>
                <div className="text-gray-200 text-sm">Vote instantly, earn 10-15 lottery tickets</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💰</div>
                <div className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">Real SOL Rewards</div>
                <div className="text-gray-200 text-sm">Weekly drawings, 3 winners, real cryptocurrency</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🏆</div>
                <div className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">Shape NFT Rarity</div>
                <div className="text-gray-200 text-sm">Your votes determine what becomes legendary</div>
              </div>
            </div>

          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 text-sm sm:text-lg text-gray-300 mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-2 hover:text-blue-300 transition-colors cursor-pointer">
            <span className="text-green-400 text-lg sm:text-xl">✓</span>
            <span className="font-medium">No Registration Required</span>
          </div>
          <div className="flex items-center justify-center space-x-2 hover:text-blue-300 transition-colors cursor-pointer">
            <span className="text-green-400 text-lg sm:text-xl">✓</span>
            <span className="font-medium">Any Solana Wallet Supported</span>
          </div>
          <div className="flex items-center justify-center space-x-2 hover:text-blue-300 transition-colors cursor-pointer">
            <span className="text-green-400 text-lg sm:text-xl">✓</span>
            <span className="font-medium">Keep 100% of All Winnings</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full mx-auto flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
          <div className="text-gray-400 text-xs sm:text-sm mt-2 font-medium">
            Scroll to explore features
          </div>
        </div>

      </div>
    </section>
  );
};

export default ImprovedHero;