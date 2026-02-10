import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const SocialDashboard = () => {
  const { connected } = useWallet();
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);

  // Mock data
  const userProfile = {
    username: 'cryptomemer247',
    followers: 89,
    following: 156,
    totalVotes: 47,
    streak: 5
  };

  const activityFeed = [
    { user: 'solholder_99', action: 'voted on', meme: 'SOL to the Moon', time: '2m ago' },
    { user: 'mememaster', action: 'earned', meme: '1.2 SOL from lottery', time: '5m ago' },
    { user: 'cryptoenjoyer', action: 'voted on', meme: 'HODL Life', time: '8m ago' },
  ];

  const todayMemes = [
    { 
      id: 1, 
      title: "When your portfolio is finally green", 
      author: 'ai_meme_generator',
      likes: 247, 
      comments: 12,
      shares: 8,
      timePosted: '2 hours ago'
    },
    { 
      id: 2, 
      title: "Explaining DeFi to your parents", 
      author: 'ai_meme_generator',
      likes: 189, 
      comments: 23,
      shares: 15,
      timePosted: '2 hours ago'
    },
    { 
      id: 3, 
      title: "NFT bros after the bear market", 
      author: 'ai_meme_generator',
      likes: 156, 
      comments: 7,
      shares: 4,
      timePosted: '2 hours ago'
    }
  ];

  const handleVote = (memeId) => {
    setUserVote(memeId);
    setUserTickets(Math.floor(Math.random() * 8) + 8);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Social Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                MemeForge
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-64">
              <div className="text-gray-400 mr-2">🔍</div>
              <input 
                type="text" 
                placeholder="Search memes..." 
                className="bg-transparent outline-none flex-1 text-gray-700"
              />
            </div>

            {/* Profile & Wallet */}
            <div className="flex items-center space-x-4">
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile & Stats */}
          <div className="lg:col-span-1">
            {/* User Profile Card */}
            {connected && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="text-white text-xl">🧑‍💻</div>
                  </div>
                  <h3 className="font-bold text-gray-900">{userProfile.username}</h3>
                  <div className="text-sm text-gray-500">MemeForge Member</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{userProfile.totalVotes}</div>
                    <div className="text-xs text-gray-500">Total Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">{userProfile.streak}</div>
                    <div className="text-xs text-gray-500">Day Streak 🔥</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">This Week's Tickets</div>
                  <div className="text-lg font-bold text-purple-600">156</div>
                </div>
              </div>
            )}

            {/* Trending Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">📈 Trending Today</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">#1</div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">SOL Memes</div>
                    <div className="text-gray-500 text-xs">247 votes</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">#2</div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">DeFi Humor</div>
                    <div className="text-gray-500 text-xs">189 votes</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">#3</div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">NFT Life</div>
                    <div className="text-gray-500 text-xs">156 votes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Daily Voting Prompt */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 mb-6 text-white">
              <h2 className="text-2xl font-bold mb-2">🗳️ Vote on Today's Memes</h2>
              <p className="mb-4 opacity-90">Help decide which AI-generated memes deserve to win SOL rewards</p>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-sm mb-1">Prize Pool Ends In:</div>
                <div className="text-xl font-bold">18:42:33</div>
              </div>
            </div>

            {/* Meme Feed */}
            <div className="space-y-6">
              {todayMemes.map((meme, idx) => (
                <div key={meme.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <div className="text-white text-sm">🤖</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{meme.author}</div>
                        <div className="text-gray-500 text-sm">{meme.timePosted}</div>
                      </div>
                      <div className="text-gray-400">•••</div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    <p className="text-gray-900 mb-4">{meme.title}</p>
                    
                    {/* Meme Image */}
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-6xl mb-4">
                      {idx === 0 ? '📈' : idx === 1 ? '🤯' : '😎'}
                    </div>
                  </div>

                  {/* Engagement Bar */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-6">
                        <button
                          onClick={() => handleVote(meme.id)}
                          disabled={!connected || userVote === meme.id}
                          className={`flex items-center space-x-2 ${
                            userVote === meme.id
                              ? 'text-purple-600'
                              : connected
                              ? 'text-gray-600 hover:text-purple-600'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-xl">🗳️</div>
                          <span className="text-sm font-medium">
                            {userVote === meme.id ? 'Voted!' : connected ? 'Vote' : 'Connect to Vote'}
                          </span>
                          <span className="text-sm">({meme.likes + (userVote === meme.id ? 1 : 0)})</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                          <div className="text-xl">💬</div>
                          <span className="text-sm">{meme.comments}</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600">
                          <div className="text-xl">📤</div>
                          <span className="text-sm">{meme.shares}</span>
                        </button>
                      </div>
                      
                      <button className="text-gray-600 hover:text-purple-600">
                        <div className="text-xl">🔖</div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voting Success */}
            {userVote && (
              <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-6 mt-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">🎉</div>
                  <div>
                    <h3 className="text-xl font-bold">Great choice!</h3>
                    <p className="opacity-90">You earned {userTickets} lottery tickets for next Sunday's draw</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Activity & Info */}
          <div className="lg:col-span-1">
            {/* Live Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">🔴 Live Activity</h3>
              <div className="space-y-4">
                {activityFeed.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <div className="text-purple-600 text-sm">👤</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.meme}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">ℹ️ How to Earn SOL</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="text-lg">1️⃣</div>
                  <p className="text-gray-600">Vote on daily AI memes you like</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-lg">2️⃣</div>
                  <p className="text-gray-600">Earn 8-15 lottery tickets per vote</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-lg">3️⃣</div>
                  <p className="text-gray-600">Win SOL in Sunday's weekly draw</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800">Next Draw: Sunday 8PM</div>
                <div className="text-sm text-green-600">Prize Pool: 12.7 SOL</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;