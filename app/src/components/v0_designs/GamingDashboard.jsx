import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const GamingDashboard = () => {
  const { connected } = useWallet();
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);

  // Mock data
  const userStats = {
    level: 7,
    xp: 2847,
    nextLevelXP: 3500,
    totalTickets: 156,
    weekStreak: 5,
    totalWinnings: 2.3
  };

  const todayMemes = [
    { id: 1, title: "SOL to the Moon", votes: 247, boost: "🔥" },
    { id: 2, title: "HODL Life", votes: 189, boost: "⭐" },
    { id: 3, title: "Crypto Winter Blues", votes: 156, boost: "💎" }
  ];

  const handleVote = (memeId) => {
    setUserVote(memeId);
    setUserTickets(Math.floor(Math.random() * 8) + 8);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-indigo-900">
      {/* Gaming Header */}
      <header className="bg-black bg-opacity-30 backdrop-blur-md border-b border-purple-500 border-opacity-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Level */}
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-white">🗳️ MemeForge</div>
              {connected && (
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-full">
                  <span className="text-black font-bold text-sm">LVL {userStats.level}</span>
                </div>
              )}
            </div>

            {/* XP Bar & Wallet */}
            <div className="flex items-center space-x-4">
              {connected && (
                <div className="hidden md:flex items-center space-x-2">
                  <div className="text-sm text-gray-300">XP:</div>
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all"
                      style={{ width: `${(userStats.xp / userStats.nextLevelXP) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{userStats.xp}/{userStats.nextLevelXP}</div>
                </div>
              )}
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - Gaming Achievement Style */}
        <section className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              PLAY • VOTE • EARN
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Vote on epic AI memes daily and earn real SOL through our gaming-style reward system
          </p>

          {/* Achievement Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-black bg-opacity-40 rounded-xl p-4 border border-purple-500 border-opacity-30">
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-xl font-bold text-yellow-400">Daily Quest</div>
              <div className="text-sm text-gray-400">Vote Today</div>
            </div>
            
            <div className="bg-black bg-opacity-40 rounded-xl p-4 border border-blue-500 border-opacity-30">
              <div className="text-2xl mb-1">🎫</div>
              <div className="text-xl font-bold text-blue-400">12.7 SOL</div>
              <div className="text-sm text-gray-400">Prize Pool</div>
            </div>
            
            <div className="bg-black bg-opacity-40 rounded-xl p-4 border border-green-500 border-opacity-30">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xl font-bold text-green-400">247</div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            
            <div className="bg-black bg-opacity-40 rounded-xl p-4 border border-pink-500 border-opacity-30">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xl font-bold text-pink-400">18h 42m</div>
              <div className="text-sm text-gray-400">Next Draw</div>
            </div>
          </div>
        </section>

        {/* Player Dashboard */}
        {connected && (
          <section className="mb-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                🎯 Your Gaming Stats
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{userStats.totalTickets}</div>
                  <div className="text-sm text-gray-400">Lottery Tickets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{userStats.weekStreak}</div>
                  <div className="text-sm text-gray-400">Day Streak 🔥</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{userStats.totalWinnings}</div>
                  <div className="text-sm text-gray-400">SOL Won</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">LVL {userStats.level}</div>
                  <div className="text-sm text-gray-400">Player Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{userStats.xp}</div>
                  <div className="text-sm text-gray-400">Total XP</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Daily Quest - Meme Voting */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center">
            🎮 Today's Daily Quest
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {todayMemes.map((meme, idx) => (
              <div key={meme.id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all transform hover:scale-105">
                {/* Meme Display */}
                <div className="aspect-square bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-6xl relative">
                  {idx === 0 ? '🚀' : idx === 1 ? '💎' : '😂'}
                  <div className="absolute top-2 right-2 text-2xl">{meme.boost}</div>
                </div>
                
                {/* Meme Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{meme.title}</h3>
                  <div className="text-gray-400 text-sm mb-4">{meme.votes} votes</div>
                  
                  <button
                    onClick={() => handleVote(meme.id)}
                    disabled={!connected || userVote === meme.id}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      userVote === meme.id
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                        : connected
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {userVote === meme.id ? '✅ QUEST COMPLETE!' : connected ? '🗳️ CAST VOTE' : '🔒 CONNECT TO PLAY'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quest Reward */}
          {userVote && (
            <div className="mt-8 bg-gradient-to-r from-green-800 to-blue-800 rounded-2xl p-6 text-center border border-green-500">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">QUEST COMPLETE!</h3>
              <p className="text-green-200 text-lg">
                Earned <strong>{userTickets} lottery tickets</strong> + <strong>50 XP</strong>
              </p>
              <div className="text-sm text-gray-300 mt-2">
                Come back tomorrow for your next daily quest!
              </div>
            </div>
          )}
        </section>

        {/* How to Play */}
        <section className="text-center">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">🎮 How to Play & Earn SOL</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-bold text-white mb-2">AI Creates</h3>
                <p className="text-gray-400 text-sm">Fresh memes generated daily</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🎮</div>
                <h3 className="font-bold text-white mb-2">You Play</h3>
                <p className="text-gray-400 text-sm">Vote & earn XP + tickets</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">🎲</div>
                <h3 className="font-bold text-white mb-2">Weekly Draw</h3>
                <p className="text-gray-400 text-sm">Random lottery selection</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-bold text-white mb-2">Win SOL</h3>
                <p className="text-gray-400 text-sm">Real cryptocurrency prizes</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GamingDashboard;