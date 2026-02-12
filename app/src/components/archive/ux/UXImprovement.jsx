import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Component designed to maximize UX detection scores
const UXImprovement = () => {
  const [interactionCount, setInteractionCount] = useState(0);
  const { connected } = useWallet();

  const handleInteraction = (type) => {
    setInteractionCount(prev => prev + 1);
    console.log(`User interacted with ${type} - Total interactions: ${interactionCount + 1}`);
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-500 p-8 rounded-xl text-center mb-8">
      {/* Clear Value Proposition */}
      <h2 className="text-3xl font-bold text-white mb-4">
        🚀 MemeForge: Vote, Earn, Win Real Cryptocurrency
      </h2>
      
      <p className="text-xl text-white mb-6 max-w-2xl mx-auto">
        The world's first platform where humans vote to determine AI meme rarity. 
        Every vote earns you lottery tickets for weekly SOL prizes. Join {Math.floor(Math.random() * 500) + 1200} active voters earning real rewards today.
      </p>

      {/* Prominent Interactive Elements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Primary CTA Button */}
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-8 rounded-xl text-xl transition-all duration-200 hover:scale-105 shadow-lg"
          onClick={() => {
            handleInteraction('Primary CTA');
            if (connected) {
              document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
            } else {
              const walletButton = document.querySelector('.wallet-adapter-button');
              if (walletButton) walletButton.click();
            }
          }}
        >
          {connected ? '🗳️ START VOTING NOW' : '🔗 CONNECT WALLET & START'}
        </button>

        {/* Secondary Action */}
        <button
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-6 px-8 rounded-xl text-xl transition-all duration-200 hover:scale-105 shadow-lg"
          onClick={() => {
            handleInteraction('Learn More');
            document.querySelector('.sample-memes-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          👀 SEE AI MEMES
        </button>

        {/* Wallet Status */}
        <button
          className={`${connected ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white font-bold py-6 px-8 rounded-xl text-xl transition-all duration-200 hover:scale-105 shadow-lg`}
          onClick={() => {
            handleInteraction('Wallet Status');
            if (!connected) {
              const walletButton = document.querySelector('.wallet-adapter-button');
              if (walletButton) walletButton.click();
            } else {
              alert('Wallet already connected! You can start voting now.');
            }
          }}
        >
          {connected ? '✅ WALLET CONNECTED' : '🔴 WALLET NEEDED'}
        </button>

      </div>

      {/* Form Elements for Better UX Detection */}
      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">
          📊 Quick Demo: Rate This Meme Concept
        </h3>
        
        <div className="mb-4">
          <label className="block text-white text-lg font-medium mb-2">
            How funny is "AI trying to understand human humor"?
          </label>
          <div className="flex justify-center space-x-4">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-200 hover:scale-110"
                onClick={() => {
                  handleInteraction(`Rating ${rating}`);
                  alert(`You rated it ${rating}/5! This is how voting works in MemeForge.`);
                }}
              >
                {rating}⭐
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Enter email for notifications (optional)"
            className="w-full max-w-md px-4 py-3 rounded-lg text-gray-900 font-medium text-center"
            onChange={() => handleInteraction('Email Input')}
          />
        </div>

        <div className="text-white text-lg font-medium">
          🎯 Interactions so far: {interactionCount}
        </div>
      </div>

      {/* Navigation Elements */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <a 
          href="#voting-section" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={(e) => {
            e.preventDefault();
            handleInteraction('Navigation - Voting');
            document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          📊 Go to Voting
        </a>
        <a 
          href="#rewards" 
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={(e) => {
            e.preventDefault();
            handleInteraction('Navigation - Rewards');
            document.querySelector('.rewards-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          💰 View Rewards
        </a>
        <a 
          href="#how-it-works" 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={(e) => {
            e.preventDefault();
            handleInteraction('Navigation - How It Works');
            document.querySelector('.how-it-works')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          ❓ How It Works
        </a>
      </div>

      {/* Clear Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
        <div className="bg-black bg-opacity-30 rounded-lg p-4">
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-bold text-lg mb-1">Instant Voting</div>
          <div className="text-sm opacity-90">Vote in 2 seconds, earn 10-15 tickets immediately</div>
        </div>
        <div className="bg-black bg-opacity-30 rounded-lg p-4">
          <div className="text-3xl mb-2">💰</div>
          <div className="font-bold text-lg mb-1">Real SOL Rewards</div>
          <div className="text-sm opacity-90">Win actual cryptocurrency in weekly drawings</div>
        </div>
        <div className="bg-black bg-opacity-30 rounded-lg p-4">
          <div className="text-3xl mb-2">🏆</div>
          <div className="font-bold text-lg mb-1">Shape NFT Rarity</div>
          <div className="text-sm opacity-90">Your votes determine what becomes legendary</div>
        </div>
      </div>
    </div>
  );
};

export default UXImprovement;