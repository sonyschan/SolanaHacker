import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Value Proposition Header - Clear and Prominent
const ValuePropSection = ({ onLearnMore }) => (
  <section className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 py-16 px-4">
    <div className="max-w-6xl mx-auto text-center">
      {/* Main Headline */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          🗳️ MemeForge
        </h1>
        <p className="text-xl md:text-2xl text-blue-200 font-medium mb-2">
          AI Dreams. Humans Decide.
        </p>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Vote on daily AI-generated memes and earn real SOL cryptocurrency through our transparent weekly lottery system
        </p>
      </div>

      {/* Key Stats - Trustworthy Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
          <div className="text-3xl font-bold text-green-300">247</div>
          <div className="text-sm text-gray-300">Active Voters Today</div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
          <div className="text-3xl font-bold text-yellow-300">12.7 SOL</div>
          <div className="text-sm text-gray-300">This Week's Prize Pool</div>
        </div>
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
          <div className="text-3xl font-bold text-blue-300">~$180</div>
          <div className="text-sm text-gray-300">Average Weekly Prizes</div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="space-y-4">
        <button 
          onClick={onLearnMore}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-lg"
        >
          🚀 See How It Works (30 seconds)
        </button>
        <div className="text-sm text-gray-400">
          No wallet needed to learn • Free to start voting
        </div>
      </div>
    </div>
  </section>
);

// How It Works - Crystal Clear Explanation
const HowItWorksSection = ({ isExpanded, onToggle }) => (
  <section className="py-16 bg-gray-900">
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          💡 How You Earn SOL (Simple!)
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          It's like a daily lottery ticket, but instead of buying tickets, you earn them by voting on memes
        </p>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-purple-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🤖
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">1. AI Creates</h3>
            <p className="text-gray-300 text-sm">
              Every day, our AI generates 2-3 unique memes and posts them for voting
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🗳️
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">2. You Vote</h3>
            <p className="text-gray-300 text-sm">
              Vote for your favorite meme. Each vote earns you 8-15 lottery tickets automatically
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🎲
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">3. Weekly Draw</h3>
            <p className="text-gray-300 text-sm">
              Every Sunday, we randomly select winning tickets from all participants
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              💰
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">4. You Win SOL</h3>
            <p className="text-gray-300 text-sm">
              Winners receive SOL directly to their wallet. Average prizes: 0.1 to 3 SOL
            </p>
          </div>
        </div>
      )}

      {/* Key Benefits */}
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-green-400 text-lg font-semibold mb-2">✅ Fair & Random</div>
            <p className="text-gray-300 text-sm">Everyone has equal chances based on participation, not money invested</p>
          </div>
          <div>
            <div className="text-blue-400 text-lg font-semibold mb-2">✅ No Risk</div>
            <p className="text-gray-300 text-sm">Voting is free - you're never risking your own money</p>
          </div>
          <div>
            <div className="text-purple-400 text-lg font-semibold mb-2">✅ Real SOL</div>
            <p className="text-gray-300 text-sm">All prizes are paid in genuine Solana cryptocurrency</p>
          </div>
        </div>
      </div>

      {!isExpanded && (
        <div className="text-center mt-8">
          <button
            onClick={onToggle}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center mx-auto space-x-2 transition-colors"
          >
            <span>See detailed breakdown</span>
            <span>▼</span>
          </button>
        </div>
      )}
    </div>
  </section>
);

// Today's Voting Dashboard - Clean and Focused
const VotingDashboard = ({ connected, onVote, userVote, userTickets }) => {
  // Mock memes for today
  const todayMemes = [
    {
      id: 1,
      title: "When SOL hits new ATH",
      imageUrl: "/generated/sample-meme-2-sol-pump.png",
      votes: 89,
      description: "Diamond hands celebration"
    },
    {
      id: 2,
      title: "Crypto investor's daily routine",
      imageUrl: "/generated/sample-meme-1-crypto-confusion.png", 
      votes: 156,
      description: "The eternal struggle"
    },
    {
      id: 3,
      title: "Discord mod energy",
      imageUrl: "/generated/sample-meme-3-discord-mod.png",
      votes: 234,
      description: "Community management vibes"
    }
  ];

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🗳️ Today's Meme Voting
          </h2>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full inline-block">
            ⏰ Voting closes in: 18:42:33
          </div>
        </div>

        {/* Voting Interface */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {todayMemes.map((meme) => (
            <div key={meme.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500 transition-colors">
              {/* Meme Image */}
              <div className="aspect-square bg-gray-700 flex items-center justify-center">
                <img 
                  src={meme.imageUrl} 
                  alt={meme.title}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<div class="text-6xl">${meme.id === 1 ? '🚀' : meme.id === 2 ? '😵‍💫' : '🤖'}</div>`;
                  }}
                />
              </div>
              
              {/* Meme Info */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{meme.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{meme.description}</p>
                
                {/* Vote Button */}
                <button
                  onClick={() => onVote(meme.id)}
                  disabled={!connected || userVote === meme.id}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    userVote === meme.id
                      ? 'bg-green-600 text-white'
                      : connected
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {userVote === meme.id ? '✅ Voted!' : connected ? '🗳️ Vote for This' : '🔒 Connect Wallet to Vote'}
                </button>
                
                {/* Vote Count */}
                <div className="text-center mt-2 text-gray-400 text-sm">
                  {meme.votes + (userVote === meme.id ? 1 : 0)} votes
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Voting Result */}
        {userVote && (
          <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-xl p-6 text-center border border-green-600">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Vote Cast Successfully!</h3>
            <p className="text-green-200 mb-4">
              You earned <strong>{userTickets} lottery tickets</strong> for next Sunday's drawing
            </p>
            <div className="text-sm text-gray-300">
              Keep voting daily to earn more tickets and increase your chances!
            </div>
          </div>
        )}

        {/* Wallet Connection CTA - Only show when needed */}
        {!connected && (
          <div className="text-center">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-2xl font-semibold text-white mb-4">Ready to Start Earning?</h3>
              <p className="text-gray-300 mb-6">Connect your Solana wallet to start voting and earning lottery tickets</p>
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !font-bold !py-3 !px-6 !rounded-xl !text-lg" />
              <div className="mt-4 text-sm text-gray-400">
                Supports Phantom, Solflare, and other popular Solana wallets
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// User Stats Dashboard
const StatsSection = ({ connected, userStats }) => {
  if (!connected) return null;

  return (
    <section className="py-12 bg-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">📊 Your MemeForge Stats</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-purple-400">{userStats.totalTickets}</div>
            <div className="text-sm text-gray-300">Total Tickets</div>
          </div>
          
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-blue-400">{userStats.weeklyVotes}</div>
            <div className="text-sm text-gray-300">Votes This Week</div>
          </div>
          
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-green-400">{userStats.consecutiveDays}</div>
            <div className="text-sm text-gray-300">Day Streak</div>
          </div>
          
          <div className="bg-gray-700 rounded-xl p-4 text-center border border-gray-600">
            <div className="text-2xl font-bold text-yellow-400">{userStats.winningsToDate} SOL</div>
            <div className="text-sm text-gray-300">Total Winnings</div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Improved Dashboard Component
const ImprovedDashboard = () => {
  const { connected } = useWallet();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);

  // Mock user stats
  const userStats = {
    totalTickets: 156,
    weeklyVotes: 5,
    consecutiveDays: 3,
    winningsToDate: 0.0
  };

  const handleVote = (memeId) => {
    setUserVote(memeId);
    const ticketsEarned = Math.floor(Math.random() * 8) + 8; // 8-15 tickets
    setUserTickets(ticketsEarned);
  };

  const handleLearnMore = () => {
    setShowHowItWorks(true);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Value Proposition Header */}
      <ValuePropSection onLearnMore={handleLearnMore} />
      
      {/* How It Works Section */}
      <HowItWorksSection 
        isExpanded={showHowItWorks} 
        onToggle={() => setShowHowItWorks(!showHowItWorks)} 
      />
      
      {/* Today's Voting Dashboard */}
      <VotingDashboard 
        connected={connected}
        onVote={handleVote}
        userVote={userVote}
        userTickets={userTickets}
      />
      
      {/* User Stats */}
      <StatsSection connected={connected} userStats={userStats} />
    </div>
  );
};

export default ImprovedDashboard;