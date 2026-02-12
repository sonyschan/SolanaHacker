import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const MinimalDashboard = () => {
  const { connected } = useWallet();
  const [userVote, setUserVote] = useState(null);
  const [userTickets, setUserTickets] = useState(0);

  const todayMemes = [
    { id: 1, title: "SOL is pumping again", votes: 247 },
    { id: 2, title: "Me explaining crypto to friends", votes: 189 },
    { id: 3, title: "HODL through the dip", votes: 156 }
  ];

  const handleVote = (memeId) => {
    setUserVote(memeId);
    setUserTickets(Math.floor(Math.random() * 8) + 8);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-light text-gray-900">MemeForge</h1>
            <WalletMultiButton className="!bg-black hover:!bg-gray-800 !rounded-md" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section - Minimal */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-light text-gray-900 mb-6">
            Vote. Earn. Repeat.
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Daily AI memes. Community voting. Weekly SOL rewards. Simple.
          </p>
        </section>

        {/* Key Stats - Clean */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center py-8">
              <div className="text-4xl font-light text-gray-900 mb-2">12.7 SOL</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">This Week's Pool</div>
            </div>
            
            <div className="text-center py-8">
              <div className="text-4xl font-light text-gray-900 mb-2">247</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">Voters Today</div>
            </div>
            
            <div className="text-center py-8">
              <div className="text-4xl font-light text-gray-900 mb-2">18:42</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">Hours Left</div>
            </div>
          </div>
        </section>

        {/* User Stats */}
        {connected && (
          <section className="mb-16">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Your Progress</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-light text-gray-900 mb-1">156</div>
                  <div className="text-sm text-gray-500">Tickets</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-gray-900 mb-1">5</div>
                  <div className="text-sm text-gray-500">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-gray-900 mb-1">2.3</div>
                  <div className="text-sm text-gray-500">SOL Won</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-gray-900 mb-1">47</div>
                  <div className="text-sm text-gray-500">Total Votes</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Voting Section - Ultra Clean */}
        <section className="mb-16">
          <h3 className="text-2xl font-light text-gray-900 mb-8 text-center">Today's Memes</h3>
          
          <div className="space-y-6">
            {todayMemes.map((meme, idx) => (
              <div key={meme.id} className="border border-gray-100 rounded-2xl p-8 hover:border-gray-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* Minimal meme representation */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      {idx === 0 ? '🚀' : idx === 1 ? '🤝' : '💎'}
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">{meme.title}</h4>
                      <div className="text-sm text-gray-500">{meme.votes} votes</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleVote(meme.id)}
                    disabled={!connected || userVote === meme.id}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      userVote === meme.id
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : connected
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {userVote === meme.id ? 'Voted' : connected ? 'Vote' : 'Connect Wallet'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vote Success - Minimal */}
          {userVote && (
            <div className="mt-8 bg-green-50 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-medium text-green-900 mb-2">Vote recorded</h3>
              <p className="text-green-700">
                You earned <strong>{userTickets} tickets</strong> for Sunday's draw
              </p>
            </div>
          )}
        </section>

        {/* How It Works - Minimal */}
        <section className="text-center mb-16">
          <h3 className="text-2xl font-light text-gray-900 mb-8">How it works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🤖</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">AI creates</h4>
              <p className="text-sm text-gray-600">Daily memes generated</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🗳️</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">You vote</h4>
              <p className="text-sm text-gray-600">Choose your favorites</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🎲</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Weekly draw</h4>
              <p className="text-sm text-gray-600">Random selection</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">💰</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Win SOL</h4>
              <p className="text-sm text-gray-600">Real cryptocurrency</p>
            </div>
          </div>
        </section>

        {/* Footer - Minimal */}
        <footer className="text-center py-8 border-t border-gray-100">
          <p className="text-gray-500 text-sm">
            MemeForge • AI Dreams. Humans Decide. • Next draw: Sunday 8PM UTC
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MinimalDashboard;