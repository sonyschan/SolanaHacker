import React, { useState } from 'react';

const Web3ConceptExplainer = ({ onScrollToVoting }) => {
  const [hoveredStep, setHoveredStep] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const steps = [
    {
      id: 1,
      title: "🤖 AI Creates Memes",
      description: "Our AI generates unique meme concepts daily. Each one starts as just an idea waiting for community judgment.",
      details: "AI uses trending topics, cultural references, and crypto themes to create original meme concepts.",
      icon: "🎨"
    },
    {
      id: 2,
      title: "🗳️ Community Votes",
      description: "You vote on your favorites. More votes = More rare. Earn lottery tickets for every vote!",
      details: "Your vote directly influences the final NFT rarity. Higher voted memes become more valuable NFTs.",
      icon: "⚡"
    },
    {
      id: 3,
      title: "💎 NFTs Born",
      description: "Top voted memes become rare NFTs. Prize pool gets distributed to voters. Democracy wins!",
      details: "Winning memes are minted as NFTs and auctioned. Voters share in the proceeds based on their participation.",
      icon: "🏆"
    }
  ];

  const Tooltip = ({ term, explanation, children }) => (
    <div className="relative inline-block">
      <span 
        className="text-purple-400 underline decoration-dotted cursor-help"
        onMouseEnter={() => setActiveTooltip(term)}
        onMouseLeave={() => setActiveTooltip(null)}
        onClick={() => setActiveTooltip(activeTooltip === term ? null : term)}
      >
        {children}
      </span>
      {activeTooltip === term && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900/95 border border-purple-500/30 rounded-lg text-sm text-white whitespace-nowrap z-20 shadow-lg">
          <div className="text-purple-300 font-semibold mb-1">{term}</div>
          <div className="max-w-xs whitespace-normal">{explanation}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="card-glass p-6 md:p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold heading-gradient mb-4">How Democratic NFT Rarity Works</h2>
        <p className="text-enhanced-medium text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          Revolutionary system where <strong className="text-purple-400">community votes</strong> determine which AI memes become rare{' '}
          <Tooltip 
            term="NFT" 
            explanation="Non-Fungible Token - a unique digital asset stored on the blockchain that proves ownership"
          >
            NFTs
          </Tooltip>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <div 
              className={`text-center transition-all duration-300 ${
                hoveredStep === step.id ? 'transform scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Step number and icon */}
              <div className="relative mb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-2xl font-bold text-white">{step.id}</span>
                </div>
                {hoveredStep === step.id && (
                  <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                    {step.icon}
                  </div>
                )}
              </div>
              
              <h3 className="text-enhanced-high font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-enhanced-medium text-sm leading-relaxed mb-3">
                {step.description}
              </p>
              
              {/* Expanded details on hover/mobile */}
              <div className={`text-enhanced-low text-xs leading-relaxed transition-all duration-300 ${
                hoveredStep === step.id ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 md:opacity-70 md:max-h-20'
              } overflow-hidden`}>
                {step.details}
              </div>
            </div>
            
            {/* Connection arrow for desktop */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 left-full w-8 text-center text-purple-400/50 animate-pulse">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Democratic NFT Rarity explanation */}
      <div className="card-glass p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30">
        <div className="text-center">
          <div className="text-3xl mb-3">🏛️</div>
          <h3 className="text-enhanced-high font-bold text-lg mb-3">What Makes This "Democratic"?</h3>
          <p className="text-enhanced-medium text-sm leading-relaxed mb-4">
            Unlike traditional NFTs where rarity is predetermined, <strong className="text-cyan-400">your community votes</strong> literally create the rarity. 
            The more people vote for a meme, the rarer its{' '}
            <Tooltip 
              term="NFT" 
              explanation="The voted meme becomes a unique collectible digital asset"
            >
              NFT
            </Tooltip> becomes. 
            Plus, voters earn{' '}
            <Tooltip 
              term="SOL" 
              explanation="Solana's native cryptocurrency - you earn real money for voting!"
            >
              SOL
            </Tooltip> rewards from the prize pool!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-enhanced-faint">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>No wallet needed to browse</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>Free to vote (gas fees covered)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Earn real SOL rewards</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onScrollToVoting}
          className="btn-primary-enhanced text-lg px-8 py-3"
        >
          🚀 Start Voting Now
        </button>
        <p className="text-enhanced-faint text-sm mt-2">Join 5,247 voters • Win up to 12.7 SOL</p>
      </div>
    </div>
  );
};

export default Web3ConceptExplainer;