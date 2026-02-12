import React, { useState, useEffect } from 'react';
import { useSimplifiedSolanaWallet } from './SimplifiedSolanaWallet';

const ProductFlowGuide = () => {
  const { connected } = useSimplifiedSolanaWallet();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Update current step based on wallet connection
  useEffect(() => {
    if (connected && currentStep === 0) {
      setCurrentStep(1);
      setCompletedSteps([0]);
    }
  }, [connected, currentStep]);

  const steps = [
    {
      id: 0,
      title: "Connect Wallet",
      icon: "👛",
      description: "Link your Solana wallet to get started",
      nextAction: "Connect Phantom, Solflare, or other Solana wallet",
      tips: ["No signup required", "100% secure connection", "Takes 30 seconds"],
      completed: connected
    },
    {
      id: 1,
      title: "Browse Memes",
      icon: "🎭",
      description: "Explore today's AI-generated meme collection",
      nextAction: "Check out trending memes and community favorites",
      tips: ["New memes daily", "See real-time vote counts", "Preview potential NFTs"],
      completed: false
    },
    {
      id: 2,
      title: "Vote & Earn",
      icon: "🗳️",
      description: "Vote for your favorites and earn lottery tickets",
      nextAction: "Cast votes to influence NFT rarity and earn SOL",
      tips: ["8-15 tickets per vote", "Daily voting streaks", "Higher stakes = bigger rewards"],
      completed: false
    },
    {
      id: 3,
      title: "NFT Creation",
      icon: "🎨",
      description: "Top-voted memes become rare NFTs automatically",
      nextAction: "Wait for voting period to end and NFTs to be minted",
      tips: ["Higher votes = rarer NFT", "Automatic minting", "Metadata includes vote count"],
      completed: false
    },
    {
      id: 4,
      title: "Auction & Bidding",
      icon: "🏆",
      description: "Bid on newly created NFTs or put yours up for auction",
      nextAction: "Participate in NFT auctions and trading",
      tips: ["24-hour auction periods", "Starting bids at 0.1 SOL", "Instant settlement", "Creator royalties"],
      highlighted: true // This is the feature H2Crypto mentioned was missing
    },
    {
      id: 5,
      title: "Trade & Collect",
      icon: "💎",
      description: "Build your collection and trade with other users",
      nextAction: "Manage your NFT portfolio and marketplace listings",
      tips: ["Secondary market trading", "Portfolio tracking", "Community showcases"],
      completed: false
    }
  ];

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const StepCard = ({ step, isActive, isCompleted }) => (
    <div 
      className={`relative transition-all duration-300 cursor-pointer ${
        isActive ? 'scale-105' : 'hover:scale-102'
      }`}
      onClick={() => setCurrentStep(step.id)}
    >
      {/* Desktop: horizontal layout, Mobile: vertical layout */}
      <div className={`card-glass p-4 md:p-6 ${
        isActive ? 'border-purple-500/50 bg-purple-500/10' : ''
      } ${isCompleted ? 'border-green-500/30 bg-green-500/5' : ''} ${
        step.highlighted ? 'ring-2 ring-yellow-400/30 bg-yellow-400/5' : ''
      }`}>
        
        {/* Step indicator */}
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${
            isCompleted ? 'bg-green-500 text-white' : 
            isActive ? 'bg-purple-600 text-white' : 
            step.highlighted ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-400/50' :
            'bg-gray-700 text-gray-300'
          }`}>
            {isCompleted ? '✓' : step.icon}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${isActive ? 'text-purple-400' : 'text-enhanced-high'} ${
              step.highlighted ? 'text-yellow-400' : ''
            }`}>
              {step.title}
              {step.highlighted && <span className="ml-2 text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">NEW</span>}
            </h3>
            <p className="text-enhanced-medium text-sm">{step.description}</p>
          </div>
        </div>

        {/* Active step details */}
        {isActive && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="text-purple-400 font-semibold text-sm mb-2">What happens next?</h4>
              <p className="text-enhanced-medium text-sm">{step.nextAction}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {step.tips.map((tip, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-3 text-center">
                  <p className="text-enhanced-faint text-xs">{tip}</p>
                </div>
              ))}
            </div>
            
            {step.id === 0 && !connected && (
              <button className="btn-primary-enhanced w-full">
                🚀 Connect Wallet Now
              </button>
            )}
            
            {step.id === 1 && connected && (
              <button className="btn-ghost-enhanced w-full">
                🎭 Browse Today's Memes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="card-glass p-6 md:p-8 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold heading-gradient mb-4">Your MemeForge Journey</h2>
        <p className="text-enhanced-medium text-lg max-w-3xl mx-auto">
          From wallet connection to NFT trading - here's your complete path to earning SOL through meme voting
        </p>
        
        {/* Progress bar */}
        <div className="max-w-md mx-auto mt-6">
          <div className="flex items-center justify-between text-sm text-enhanced-faint mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-cyan-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Steps grid - responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            isActive={currentStep === step.id}
            isCompleted={completedSteps.includes(step.id) || step.completed}
          />
        ))}
      </div>

      {/* Current status summary */}
      <div className="mt-8 text-center">
        <div className="card-glass p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
          <h3 className="text-enhanced-high font-bold text-lg mb-2">
            {connected ? '🎉 Ready to Start Voting!' : '👋 Welcome to MemeForge!'}
          </h3>
          <p className="text-enhanced-medium text-sm mb-4">
            {connected 
              ? 'Your wallet is connected. Browse today\'s memes and start earning SOL rewards!' 
              : 'Connect your Solana wallet to begin your journey into democratic NFT creation.'
            }
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>{connected ? 'Wallet connected' : 'Connect wallet first'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
              <span>5,247 active voters</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>12.7 SOL prize pool</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              <span>NFT auctions daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFlowGuide;