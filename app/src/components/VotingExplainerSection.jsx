import React, { useState } from 'react';

const VotingExplainerSection = () => {
  const [activeDemo, setActiveDemo] = useState(0);

  const demoSteps = [
    {
      title: "1. AI Generates Daily Memes",
      description: "Every 24 hours, advanced AI creates fresh, unique memes for the community to evaluate",
      icon: "🤖",
      visual: "/generated/process-flow-infographic.png",
      details: [
        "New content every day",
        "AI ensures uniqueness",
        "Multiple themes & styles"
      ]
    },
    {
      title: "2. Community Votes on Rarity",
      description: "You decide if each meme is Common, Rare, or Legendary based on your judgment",
      icon: "🗳️",
      visual: "/generated/voting-interface-demo.png",
      details: [
        "3 rarity levels to choose from",
        "Your vote determines final rarity",
        "Real-time results display"
      ]
    },
    {
      title: "3. Earn Lottery Tickets",
      description: "Every vote earns you lottery tickets for the weekly SOL prize drawing",
      icon: "🎟️",
      visual: null,
      details: [
        "Random tickets per vote",
        "More votes = better odds",
        "Weekly prize drawings"
      ]
    },
    {
      title: "4. Win SOL Cryptocurrency",
      description: "Prize pool is distributed to active voters through fair lottery system",
      icon: "💰",
      visual: null,
      details: [
        "Real Solana cryptocurrency",
        "Transparent prize distribution",
        "Automatic payments to winners"
      ]
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">
          How Voting Works
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          MemeForge is the first platform where <strong className="text-blue-300">human consensus determines NFT rarity</strong>. 
          Here's exactly how you participate and earn rewards.
        </p>
      </div>

      {/* Interactive Demo */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        
        {/* Step Selector */}
        <div className="border-b border-gray-700">
          <div className="flex overflow-x-auto">
            {demoSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveDemo(index)}
                className={`flex-shrink-0 px-6 py-4 border-b-2 transition-all ${
                  activeDemo === index
                    ? 'border-blue-500 bg-blue-950 text-white'
                    : 'border-transparent text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{step.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-400 hidden md:block">Click to see details</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Description */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {demoSteps[activeDemo].title}
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                {demoSteps[activeDemo].description}
              </p>
              
              <div className="space-y-3">
                {demoSteps[activeDemo].details.map((detail, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <span className="text-blue-400">✓</span>
                    <span className="text-gray-200">{detail}</span>
                  </div>
                ))}
              </div>

              {/* Special callouts for certain steps */}
              {activeDemo === 1 && (
                <div className="mt-6 bg-purple-950 border border-purple-800 rounded-lg p-4">
                  <div className="text-purple-300 font-medium mb-2">🏆 Revolutionary Concept</div>
                  <div className="text-gray-200 text-sm">
                    Unlike traditional NFTs with pre-defined rarity, MemeForge lets the community decide value through democratic voting.
                  </div>
                </div>
              )}

              {activeDemo === 2 && (
                <div className="mt-6 bg-green-950 border border-green-800 rounded-lg p-4">
                  <div className="text-green-300 font-medium mb-2">🎯 Fair Reward System</div>
                  <div className="text-gray-200 text-sm">
                    All voting choices earn the same random ticket range - your reward doesn't depend on picking the "correct" rarity.
                  </div>
                </div>
              )}
            </div>

            {/* Visual */}
            <div>
              {demoSteps[activeDemo].visual ? (
                <div className="bg-gray-900 rounded-lg border border-gray-600 overflow-hidden">
                  <img 
                    src={demoSteps[activeDemo].visual}
                    alt={demoSteps[activeDemo].title}
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-64 flex-col items-center justify-center text-gray-400">
                    <div className="text-4xl mb-4">{demoSteps[activeDemo].icon}</div>
                    <div className="text-lg font-medium">{demoSteps[activeDemo].title}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg border border-gray-600 p-8 h-64 flex flex-col items-center justify-center">
                  <div className="text-6xl mb-4">{demoSteps[activeDemo].icon}</div>
                  <div className="text-xl font-bold text-white mb-2">
                    {demoSteps[activeDemo].title.split('. ')[1]}
                  </div>
                  <div className="text-gray-300 text-center">
                    {demoSteps[activeDemo].description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Example */}
      <div className="mt-12 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8 border border-blue-600">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            🎯 Try It Right Now
          </h3>
          <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
            Connect your wallet below to start voting on today's AI-generated memes and earning SOL rewards immediately.
          </p>
          
          {/* Mock voting preview */}
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto">
            <div className="aspect-square bg-gray-700 rounded-md mb-4 flex items-center justify-center">
              <img 
                src="/generated/meme-preview-ai-confusion.png"
                alt="Today's meme"
                className="w-full h-full object-cover rounded-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="text-4xl hidden">🤖</div>
            </div>
            <div className="text-white font-medium mb-3">Rate this meme:</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-700 rounded px-3 py-2 text-xs text-gray-300">👍 Common</div>
              <div className="bg-blue-600 rounded px-3 py-2 text-xs text-white">💎 Rare</div>
              <div className="bg-gray-700 rounded px-3 py-2 text-xs text-gray-300">🏆 Legendary</div>
            </div>
            <div className="text-xs text-gray-400 mt-3">
              Current votes: 156 people
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                document.querySelector('.wallet-connect-section')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'center'
                });
              }}
              className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Connect Wallet & Start Earning
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Quick Answers */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-bold text-white mb-3">💡 Why does my vote matter?</h4>
          <p className="text-gray-300 text-sm">
            Your vote directly determines the rarity level of each meme NFT. Unlike traditional NFTs where rarity is pre-defined by algorithms, MemeForge uses human consensus to create truly democratic value.
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-bold text-white mb-3">🎰 How do I win SOL?</h4>
          <p className="text-gray-300 text-sm">
            Every vote earns lottery tickets. The more you vote, the better your odds. Winners are selected randomly from the pool of active voters and automatically receive SOL cryptocurrency to their connected wallet.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VotingExplainerSection;