import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const FinanceDashboard = () => {
  const { connected } = useWallet();
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);

  // Mock data
  const marketData = {
    totalValueLocked: 127500,
    weeklyDistribution: 12.7,
    participantCount: 247,
    averageROI: 15.2
  };

  const userPortfolio = {
    ticketBalance: 156,
    expectedWeeklyReturn: 0.18,
    totalEarnings: 2.34,
    riskScore: 'Low'
  };

  const todayMemes = [
    { id: 1, title: "SOL Market Analysis", votes: 247, analyticsScore: 8.7 },
    { id: 2, title: "DeFi Trends Q1", votes: 189, analyticsScore: 7.9 },
    { id: 3, title: "Crypto Portfolio Tips", votes: 156, analyticsScore: 8.1 }
  ];

  const handleVote = (memeId) => {
    setUserVote(memeId);
    setUserTickets(Math.floor(Math.random() * 8) + 8);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-gray-900">MemeForge</div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-blue-600 font-medium">Dashboard</a>
                <a href="#" className="text-gray-600 hover:text-blue-600">Voting</a>
                <a href="#" className="text-gray-600 hover:text-blue-600">Portfolio</a>
                <a href="#" className="text-gray-600 hover:text-blue-600">Analytics</a>
              </nav>
            </div>

            {/* Wallet Connection */}
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Market Overview */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Portfolio Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Total Value Locked</div>
              <div className="text-2xl font-bold text-gray-900">${marketData.totalValueLocked.toLocaleString()}</div>
              <div className="text-sm text-green-600 mt-1">+12.5% this week</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Weekly Distribution</div>
              <div className="text-2xl font-bold text-gray-900">{marketData.weeklyDistribution} SOL</div>
              <div className="text-sm text-blue-600 mt-1">Next: Sunday 8PM UTC</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Active Participants</div>
              <div className="text-2xl font-bold text-gray-900">{marketData.participantCount}</div>
              <div className="text-sm text-gray-500 mt-1">This week</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Average ROI</div>
              <div className="text-2xl font-bold text-gray-900">{marketData.averageROI}%</div>
              <div className="text-sm text-green-600 mt-1">Past 30 days</div>
            </div>
          </div>
        </section>

        {/* User Portfolio */}
        {connected && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Portfolio Performance</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userPortfolio.ticketBalance}</div>
                  <div className="text-sm text-gray-600">Lottery Positions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userPortfolio.expectedWeeklyReturn}</div>
                  <div className="text-sm text-gray-600">Expected Weekly SOL</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{userPortfolio.totalEarnings}</div>
                  <div className="text-sm text-gray-600">Total SOL Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userPortfolio.riskScore}</div>
                  <div className="text-sm text-gray-600">Risk Assessment</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Investment Strategy Explanation */}
        <section className="mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Investment Strategy: Social Signal Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="text-blue-600 text-xl">📊</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Data Collection</h3>
                <p className="text-gray-600 text-sm">AI analyzes social sentiment and meme popularity metrics</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="text-green-600 text-xl">🗳️</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Community Input</h3>
                <p className="text-gray-600 text-sm">Your votes contribute to decentralized decision making</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="text-purple-600 text-xl">🎯</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Distribution</h3>
                <p className="text-gray-600 text-sm">Lottery system ensures fair, low-risk participation</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="text-yellow-600 text-xl">💰</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">SOL Returns</h3>
                <p className="text-gray-600 text-sm">Weekly distributions based on participation level</p>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Voting Interface */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Content Analysis & Voting</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {todayMemes.map((meme, idx) => (
              <div key={meme.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                {/* Content Preview */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl rounded-t-lg">
                  {idx === 0 ? '📈' : idx === 1 ? '🏦' : '💡'}
                </div>
                
                {/* Analysis Data */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{meme.title}</h3>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      Analytics Score: <span className="font-semibold text-blue-600">{meme.analyticsScore}/10</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {meme.votes} participants
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleVote(meme.id)}
                    disabled={!connected || userVote === meme.id}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      userVote === meme.id
                        ? 'bg-green-600 text-white'
                        : connected
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {userVote === meme.id ? '✅ Vote Submitted' : connected ? 'Cast Vote' : 'Connect Wallet to Vote'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Voting Success */}
          {userVote && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="text-green-600 text-xl">✅</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Vote Recorded Successfully</h3>
              <p className="text-gray-600 text-center">
                Added <strong>{userTickets} lottery positions</strong> to your portfolio for this week's distribution
              </p>
            </div>
          )}
        </section>

        {/* Risk Disclosure */}
        <section>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Disclosure & Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Low Risk Profile</h3>
                <ul className="space-y-1">
                  <li>• No financial investment required</li>
                  <li>• Participation through voting only</li>
                  <li>• Transparent lottery mechanics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Fair Distribution</h3>
                <ul className="space-y-1">
                  <li>• Equal opportunity for all participants</li>
                  <li>• Weekly distributions every Sunday</li>
                  <li>• Verifiable on-chain transactions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FinanceDashboard;