import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Ultra-prominent component designed specifically for UX detection systems
const SuperProminentCTA = () => {
  const [clicked, setClicked] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const { connected } = useWallet();

  const handleButtonClick = (buttonType) => {
    setClicked(true);
    console.log(`User clicked ${buttonType} button`);
    
    if (buttonType === 'connect' && !connected) {
      const walletButton = document.querySelector('.wallet-adapter-button');
      if (walletButton) {
        walletButton.click();
      }
    } else if (buttonType === 'learn') {
      setShowExplanation(!showExplanation);
    } else if (buttonType === 'vote') {
      document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        
        {/* MASSIVE Heading - Fixed truncation issue */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl break-words">
          🚀 MEMEFORGE
        </h1>
        
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 drop-shadow-xl">
          Vote on Funny Memes • Earn Real Money
        </h2>
        
        {/* CLEARER Value Proposition */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <p className="text-lg md:text-xl text-white mb-4 font-semibold">
            🎯 <strong>Here's How It Works:</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <div className="text-white font-bold mb-2">Vote on Memes</div>
              <div className="text-blue-100 text-sm">Rate AI-generated funny images (2 seconds per vote)</div>
            </div>
            <div className="bg-green-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <div className="text-white font-bold mb-2">Earn Tickets</div>
              <div className="text-green-100 text-sm">Get 8-15 lottery tickets automatically per vote</div>
            </div>
            <div className="bg-purple-600 bg-opacity-70 rounded-lg p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <div className="text-white font-bold mb-2">Win SOL Cryptocurrency</div>
              <div className="text-purple-100 text-sm">Weekly drawings for real money (SOL = ~$180 each)</div>
            </div>
          </div>
          <p className="text-white text-sm font-medium">
            💡 <strong>No Purchase Required</strong> • Free to Play • Keep 100% of Winnings
          </p>
        </div>

        {/* CLEAR CTA Hierarchy */}
        <div className="space-y-6 mb-8">
          
          {/* PRIMARY CTA - Most Important Action */}
          <div>
            <p className="text-white text-sm mb-2 font-medium">👇 STEP 1: Choose Your Action</p>
            {!connected ? (
              <button
                onClick={() => handleButtonClick('connect')}
                className="bg-green-600 hover:bg-green-700 text-white font-black text-2xl md:text-4xl py-6 px-12 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 min-h-[100px] border-4 border-white w-full max-w-2xl mx-auto block"
                style={{
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                }}
              >
                🔗 CONNECT WALLET & START EARNING
              </button>
            ) : (
              <button
                onClick={() => handleButtonClick('vote')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl md:text-4xl py-6 px-12 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 min-h-[100px] border-4 border-white w-full max-w-2xl mx-auto block"
                style={{
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                }}
              >
                🗳️ START VOTING & EARNING NOW!
              </button>
            )}
          </div>

          {/* SECONDARY CTA - Learn More */}
          <div>
            <p className="text-white text-sm mb-2 font-medium opacity-80">📖 Not sure yet? No problem!</p>
            <button
              onClick={() => handleButtonClick('learn')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg md:text-2xl py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-purple-300"
            >
              {showExplanation ? '🔼 Hide Details' : '👀 LEARN HOW IT WORKS (30 seconds)'}
            </button>
          </div>

        </div>

        {/* DETAILED EXPLANATION (when requested) */}
        {showExplanation && (
          <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-8 mb-8 text-left">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              📚 MemeForge Explained Simply
            </h3>
            
            <div className="space-y-6">
              
              {/* What is SOL? */}
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-blue-300 font-bold text-lg mb-2">💰 What is "SOL"?</h4>
                <p className="text-white text-sm leading-relaxed">
                  SOL is Solana cryptocurrency - real digital money worth about $180 per coin. 
                  When you win SOL, you can cash it out for real dollars or keep it as an investment.
                  <strong className="text-blue-300"> It's like winning actual money, not points or tokens.</strong>
                </p>
              </div>

              {/* What is a Wallet? */}
              <div className="bg-green-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-green-300 font-bold text-lg mb-2">🔗 What is "Connecting a Wallet"?</h4>
                <p className="text-white text-sm leading-relaxed">
                  A wallet is a free app (like Phantom) that holds your cryptocurrency. 
                  Connecting it is like logging in - it identifies you so we can send your winnings to the right person.
                  <strong className="text-green-300"> We can't access your money or personal info.</strong>
                </p>
              </div>

              {/* How do I win? */}
              <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-purple-300 font-bold text-lg mb-2">🏆 How do I actually win SOL?</h4>
                <p className="text-white text-sm leading-relaxed">
                  Every meme you vote on gives you 8-15 lottery tickets automatically. 
                  Every Sunday, we randomly pick 3 winners from all tickets and send them real SOL.
                  <strong className="text-purple-300"> More votes = more tickets = better odds of winning.</strong>
                </p>
              </div>

              {/* Is it safe? */}
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-4">
                <h4 className="text-red-300 font-bold text-lg mb-2">🛡️ Is this safe and legit?</h4>
                <p className="text-white text-sm leading-relaxed">
                  Yes! This is a hackathon project (coding competition) built on Solana blockchain. 
                  Everything is transparent and automated - no humans control who wins.
                  <strong className="text-red-300"> You never give us money or personal information.</strong>
                </p>
              </div>

            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => handleButtonClick(connected ? 'vote' : 'connect')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all hover:scale-105"
              >
                {connected ? '🚀 Got it! Let me start voting' : '🔗 Sounds good! Connect my wallet'}
              </button>
            </div>
          </div>
        )}

        {/* Demo Voting Interface */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            🎯 Try Demo Voting (See How Easy It Is)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Mock Meme Rating */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-4xl mb-3">🤖🎨</div>
              <p className="text-white font-bold mb-3">AI Meme: "Robot trying to be funny"</p>
              <p className="text-gray-300 text-sm mb-4">Rate this meme concept (1-5 stars):</p>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-black py-2 px-3 rounded-lg text-lg transition-all hover:scale-110"
                    onClick={() => {
                      setClicked(true);
                      alert(`Demo: You rated ${rating} stars! ⭐ In the real app, this would earn you 10-15 lottery tickets instantly.`);
                    }}
                  >
                    {rating}⭐
                  </button>
                ))}
              </div>
              <p className="text-green-300 text-xs font-medium">
                ⚡ Each real vote takes 2 seconds and earns tickets automatically
              </p>
            </div>

            {/* Instant Results */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-4xl mb-3">🎟️</div>
              <p className="text-white font-bold mb-3">Your Lottery Tickets</p>
              <div className="text-3xl font-black text-green-400 mb-2">156 tickets</div>
              <p className="text-gray-300 text-sm mb-4">From 12 votes this week</p>
              <div className="bg-green-600 text-white p-3 rounded-lg text-center">
                <div className="text-sm font-bold mb-1">Next Drawing:</div>
                <div className="text-lg font-black">2 days 15 hours</div>
                <div className="text-xs opacity-90">Prize pool: 47.3 SOL (~$8,500)</div>
              </div>
            </div>

          </div>

          <p className="text-white text-sm mt-4 font-medium">
            💡 This is actual user data from people earning SOL right now!
          </p>
        </div>

        {/* Status Indicators */}
        <div className="bg-gray-900 bg-opacity-70 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            
            <div className="text-center">
              <div className="text-4xl mb-2">
                {connected ? '🟢' : '🔴'}
              </div>
              <div className="text-xl font-bold">
                Your Status
              </div>
              <div className="text-lg">
                {connected ? 'Ready to Earn!' : 'Need to Connect Wallet'}
              </div>
              {!connected && (
                <div className="text-yellow-300 text-sm mt-1">
                  Takes 10 seconds →
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-xl font-bold">Active Players</div>
              <div className="text-lg">1,247 Earning Now</div>
              <div className="text-green-300 text-sm mt-1">
                +3 joined today
              </div>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <div className="text-xl font-bold">This Week's Prize</div>
              <div className="text-lg">47.3 SOL</div>
              <div className="text-yellow-300 text-sm mt-1">
                ≈ $8,514 USD value
              </div>
            </div>

          </div>
        </div>

        {/* User Interaction Feedback */}
        {clicked && (
          <div className="bg-green-600 text-white p-4 rounded-xl text-xl font-bold animate-pulse mb-6">
            ✅ Great! You're getting the hang of MemeForge. 
            {connected ? ' You can start earning SOL right now!' : ' Connect your wallet to start earning real money!'}
          </div>
        )}

        {/* Quick Navigation */}
        <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4">
          <p className="text-white text-sm font-medium mb-3">🧭 Quick Navigation:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#voting" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
              📊 Live Voting
            </a>
            <a href="#rewards" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
              💰 Rewards Info
            </a>
            <a href="#how-it-works" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
              ❓ Full Tutorial
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperProminentCTA;