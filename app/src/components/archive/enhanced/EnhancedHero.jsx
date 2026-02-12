import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const EnhancedHero = ({ onScrollToVoting }) => {
  const { connected } = useWallet();

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
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium">
            <span className="text-green-400">●</span> 1,247+ Daily Voters
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium">
            💰 12.7 SOL Prize Pool ($2,540)
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium">
            ✅ 100% Payout Rate
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            Vote on AI Memes,<br />
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Earn Real SOL
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-purple-100 mb-8 leading-relaxed">
            Join thousands earning cryptocurrency by voting on daily AI-generated memes. 
            Each vote = lottery tickets for weekly SOL prizes.
          </p>

          {/* How It Works - Visual Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
                🗳️
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Vote Daily</h3>
              <p className="text-purple-200 text-sm">Pick your favorite from 3 AI memes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
                🎫
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Earn Tickets</h3>
              <p className="text-purple-200 text-sm">Get 8-15 lottery tickets per vote</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg">
                💰
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Win SOL</h3>
              <p className="text-purple-200 text-sm">Weekly lottery draws every Sunday</p>
            </div>
          </div>

          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {connected ? (
              <button
                onClick={onScrollToVoting}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                🚀 Vote on Today's Memes
              </button>
            ) : (
              <div className="text-center">
                <WalletMultiButton className="!bg-gradient-to-r !from-green-500 !to-emerald-500 hover:!from-green-600 hover:!to-emerald-600 !text-white !px-8 !py-4 !rounded-2xl !text-lg !font-bold !shadow-xl hover:!shadow-2xl !transform hover:!scale-105 !transition-all !duration-200" />
                <p className="text-purple-200 text-sm mt-2">Connect wallet to start earning SOL</p>
              </div>
            )}
            
            <button className="text-purple-200 hover:text-white underline text-lg font-medium transition-colors">
              Learn How It Works →
            </button>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">12.7</div>
              <div className="text-purple-200 text-sm">SOL Prize Pool</div>
              <div className="text-purple-300 text-xs">≈ $2,540 USD</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">1,247</div>
              <div className="text-purple-200 text-sm">Daily Participants</div>
              <div className="text-purple-300 text-xs">Your odds: ~1 in 8</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">247</div>
              <div className="text-purple-200 text-sm">Voting Now</div>
              <div className="text-purple-300 text-xs flex items-center justify-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Live
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">18:42</div>
              <div className="text-purple-200 text-sm">Time Left</div>
              <div className="text-purple-300 text-xs">To vote today</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="text-center mt-8">
          <button 
            onClick={onScrollToVoting}
            className="text-purple-200 hover:text-white transition-colors animate-bounce"
          >
            <div className="text-3xl">⬇</div>
            <div className="text-sm">Vote Below</div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHero;