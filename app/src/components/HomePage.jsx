import React, { useState, useEffect, useCallback } from 'react';
import WalletConnection from './WalletConnection';

const MEMEYA_TOKEN_CA = '983j5C4udenB89Wh8Z7ebcgtqeEAUp2uprnbrLvHpump';

const HomePage = ({ onConnectWallet, walletConnected, connecting }) => {
  const [weeklyVoters, setWeeklyVoters] = useState(0);
  const [totalMemes, setTotalMemes] = useState(0);
  const [caCopied, setCaCopied] = useState(false);

  const copyCA = useCallback(() => {
    navigator.clipboard.writeText(MEMEYA_TOKEN_CA);
    setCaCopied(true);
    setTimeout(() => setCaCopied(false), 2000);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("https://memeforge-api-836651762884.asia-southeast1.run.app/api/stats");
        const data = await response.json();
        if (data.success) {
          setWeeklyVoters(data.stats.weeklyVoters || 0);
          setTotalMemes(data.stats.totalMemes || 0);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="text-lg md:text-2xl font-bold">M</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI MemeForge
            </h1>
            <div className="text-xs text-gray-500 hidden sm:block">AI Dreams. Humans Decide.</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
            <div className="text-sm">
              <span className="text-cyan-400 font-bold">{weeklyVoters}</span>
              <span className="text-gray-500 ml-1">voters this week</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <WalletConnection variant="primary" className="text-sm md:text-base" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">

        <div className="text-center mb-20 md:mb-28">
          <div className="inline-flex items-center space-x-2 mb-6 flex-wrap justify-center gap-2">
            <div className="px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-full text-sm text-green-400 font-medium">
              100% Free
            </div>
            <div className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm text-cyan-400 font-medium">
              Daily Drops
            </div>
            <div className="px-4 py-2 bg-purple-400/10 border border-purple-400/20 rounded-full text-sm text-purple-400 font-medium">
              Real NFTs
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Historical AI Memes
            </span>
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 tracking-wide bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Vote Free. Earn Daily. Own Forever.
          </p>

          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Vote on AI-generated memes every day. Win the daily lottery and claim your meme as a
            <strong className="text-white"> Solana NFT</strong>. Build your collection for free — the earlier you start, the more you accumulate.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-12">
            <WalletConnection variant="primary" className="px-8 py-4 text-lg" />
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 flex-wrap gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">&#10003;</span>
              <span>No fees, no gas to vote</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400">&#10003;</span>
              <span>1 NFT minted daily</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">&#10003;</span>
              <span>You own what you win</span>
            </div>
          </div>
        </div>

        {/* Daily Loop — 4 Steps */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h3>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              A simple daily loop. AI creates, you vote, one winner emerges, one person owns it.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <img
              src="/images/how-it-works.jpg"
              alt="How It Works: 1. AI Creates 3 memes, 2. You Vote for your favorite, 3. Daily Winner selected, 4. Claim as Solana NFT"
              className="hidden md:block w-full rounded-2xl"
              loading="lazy"
            />
            <img
              src="/images/how-it-works-mobile.jpg"
              alt="How It Works: 1. AI Creates 3 memes, 2. You Vote for your favorite, 3. Daily Winner selected, 4. Claim as Solana NFT"
              className="md:hidden w-full max-w-sm mx-auto rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>

        {/* Growth Flywheel */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">The Growth Flywheel</h3>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Free participation creates a self-reinforcing cycle. The earlier you join, the more you benefit.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Flywheel diagram — landscape on desktop, square on mobile */}
            <div className="mb-8">
              <img
                src="/images/flywheel-growth.jpg"
                alt="Growth Flywheel: Vote Free → Win Memes → Community Grows → NFTs Gain Value → cycle repeats"
                className="hidden md:block w-full rounded-2xl"
                loading="lazy"
              />
              <img
                src="/images/flywheel-growth-square.jpg"
                alt="Growth Flywheel: Vote Free → Win Memes → Community Grows → NFTs Gain Value → cycle repeats"
                className="md:hidden w-full max-w-sm mx-auto rounded-2xl"
                loading="lazy"
              />
            </div>

            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3">
                The earlier you start collecting, the more you accumulate before the ecosystem takes off.
              </p>
              <p className="text-gray-500 text-sm">
                Only 365 memes become NFTs per year. Every one you own is permanently scarce.
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Strategy Teaser */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Play It Smart</h3>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Not every meme is worth entering the lottery for. Accumulate tickets and strike when it matters.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <img
              src="/images/play-it-smart.jpg"
              alt="Daily Voter enters every lottery with 8-15 tickets vs Strategic Accumulator saves tickets across days then goes ALL IN with 80+ tickets"
              className="hidden md:block w-full rounded-2xl"
              loading="lazy"
            />
            <img
              src="/images/play-it-smart-mobile.jpg"
              alt="Daily Voter enters every lottery with 8-15 tickets vs Strategic Accumulator saves tickets across days then goes ALL IN with 80+ tickets"
              className="md:hidden w-full max-w-sm mx-auto rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>

        {/* $Memeya Token Banner */}
        <div className="mb-20 md:mb-28">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 animate-pulse" />
            <div className="relative z-10">
              <div className="text-4xl mb-3">&#129689;</div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">$Memeya</span>
                <span className="text-white"> — Official Token</span>
              </h3>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                Hold $Memeya tokens to boost your daily ticket earnings! Bonus = floor(log<sub>10</sub>(tokens held)).
              </p>

              {/* CA Display */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <code className="text-sm md:text-base font-mono text-yellow-300 bg-black/30 px-4 py-2 rounded-lg border border-yellow-500/20 truncate max-w-[280px] md:max-w-none">
                  {MEMEYA_TOKEN_CA}
                </code>
                <button
                  onClick={copyCA}
                  className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium flex-shrink-0"
                >
                  {caCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Bonus Examples */}
              <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm">
                <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">10 tokens = +1</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">1K = +3</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">10K = +4</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-gray-400">100K = +5</span>
              </div>

              <a
                href={`https://pump.fun/coin/${MEMEYA_TOKEN_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all duration-200"
              >
                Buy on PumpFun
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Value Props — 3 cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-28">
          <div className="group bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 rounded-2xl p-8 hover:border-green-400/40 transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/25">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-green-400">100% Free</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              No gas fees to vote, no tokens to buy, no cost at all.
              Connect your wallet and start earning lottery tickets immediately.
            </p>
            <div className="text-sm text-green-300 font-medium">
              &#10003; Free voting &#10003; Free tickets &#10003; Free to enter lottery
            </div>
          </div>

          <div className="group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl p-8 hover:border-cyan-400/40 transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/25">
              <span className="text-2xl">🌟</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-cyan-400">Daily NFT Drops</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              One meme becomes an NFT every single day. That's only 365 per year —
              each one is permanently scarce and community-curated.
            </p>
            <div className="text-sm text-cyan-300 font-medium">
              &#10003; 1 per day &#10003; Community voted &#10003; Solana pNFT
            </div>
          </div>

          <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-purple-400">Your Collection Grows</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Every meme you win is yours. Claim it as a Solana pNFT and own it forever.
              The more you collect, the more your portfolio is worth as the ecosystem expands.
            </p>
            <div className="text-sm text-purple-300 font-medium">
              &#10003; True ownership &#10003; Mint anytime &#10003; Trade on marketplaces
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-10 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
              <span className="text-green-400 font-medium">Live Now</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Start Collecting Today</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-base md:text-lg">
              Every day you don't vote is a meme you miss. Connect your wallet, vote for free,
              and start building your NFT collection before everyone else.
            </p>
            <div className="space-y-4">
              <WalletConnection variant="primary" className="px-12 py-4 text-xl font-bold" />

              {/* Live stats */}
              <div className="flex items-center justify-center space-x-6 md:space-x-8 text-sm text-gray-500 flex-wrap gap-y-2 mt-6">
                {weeklyVoters > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">{weeklyVoters}</span>
                    <span>voters this week</span>
                  </div>
                )}
                {totalMemes > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400 font-bold">{totalMemes}</span>
                    <span>memes created</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 font-bold">365/yr</span>
                  <span>max NFTs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
