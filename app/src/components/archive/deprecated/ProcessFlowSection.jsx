import React, { useState } from 'react';

const ProcessFlowSection = () => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 'connect',
      number: '1',
      emoji: '🔗',
      title: 'Connect Wallet',
      subtitle: '30 seconds',
      description: 'Connect your Phantom or Solflare wallet to participate',
      details: [
        'Click "Connect Wallet" button',
        'Choose Phantom or Solflare',
        'Approve connection in your wallet',
        'Ready to vote!'
      ]
    },
    {
      id: 'vote',
      number: '2',
      emoji: '🗳️',
      title: 'Vote on Rarity',
      subtitle: 'Before minting',
      description: 'Judge AI-generated meme and vote for its future rarity level',
      details: [
        'AI creates a unique meme (not yet an NFT)',
        'Community votes: Common, Rare, or Legendary?',
        'Voting determines what rarity the NFT will have',
        'All voters earn random lottery tickets'
      ]
    },
    {
      id: 'community',
      number: '3',
      emoji: '⚡',
      title: 'NFT Gets Minted',
      subtitle: 'With voted rarity',
      description: 'After voting closes, NFT is minted with the community-chosen rarity',
      details: [
        'If 60%+ voted "Legendary" → NFT becomes Legendary',
        'If majority voted "Rare" → NFT becomes Rare',
        'Otherwise → NFT becomes Common',
        'NFT is minted with permanent rarity - no changes!'
      ]
    },
    {
      id: 'win',
      number: '4',
      emoji: '💰',
      title: 'Win SOL Prizes',
      subtitle: 'Weekly lottery',
      description: 'Your tickets enter the weekly lottery for real SOL prizes',
      details: [
        'Vote daily to accumulate more tickets',
        'Weekly lottery draws winners randomly',
        'Prizes: 1st place (10 SOL), 2nd (5 SOL), 3rd (2 SOL)',
        'Plus multiple smaller prizes for active voters'
      ]
    }
  ];

  return (
    <section className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 sm:p-8 border border-gray-700/30">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-300 mb-3 flex items-center justify-center space-x-3">
          <span>⚡</span>
          <span>How MemeForge Works</span>
        </h2>
        <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
          Vote first → Determine rarity → Then mint NFT. World's first pre-mint rarity democracy.
        </p>
      </div>

      {/* Desktop Flow - Horizontal */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-4 gap-6 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div 
                className={`
                  p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center
                  ${activeStep === step.id 
                    ? 'bg-gradient-to-b from-purple-600/20 to-blue-600/20 border-purple-400 transform scale-105' 
                    : 'bg-gray-800/50 border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  }
                `}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <div className="text-4xl mb-3">{step.emoji}</div>
                <div className="text-lg font-bold text-white mb-1">{step.title}</div>
                <div className="text-sm text-gray-400 mb-2">{step.subtitle}</div>
                <div className="text-sm text-gray-300">{step.description}</div>
                
                {/* Step number badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {step.number}
                </div>
                
                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-400 text-2xl">
                    →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Details Panel */}
        {activeStep && (
          <div className="bg-gray-900/50 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{steps.find(s => s.id === activeStep)?.emoji}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-300 mb-2">
                  Step {steps.find(s => s.id === activeStep)?.number}: {steps.find(s => s.id === activeStep)?.title}
                </h3>
                <ul className="space-y-2">
                  {steps.find(s => s.id === activeStep)?.details.map((detail, i) => (
                    <li key={i} className="flex items-start space-x-2 text-gray-200">
                      <span className="text-purple-300 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Flow - Vertical */}
      <div className="lg:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.id}>
            <div 
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                ${activeStep === step.id 
                  ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-400' 
                  : 'bg-gray-800/50 border-gray-600'
                }
              `}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl">{step.emoji}</span>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{step.subtitle}</p>
                  <p className="text-sm text-gray-300 mt-1">{step.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-gray-400 transition-transform duration-300 ${
                    activeStep === step.id ? 'rotate-90' : ''
                  }`}>
                    ▶
                  </span>
                </div>
              </div>
            </div>
            
            {/* Mobile Details */}
            {activeStep === step.id && (
              <div className="bg-gray-900/50 rounded-xl p-4 border border-purple-500/30 ml-4">
                <h4 className="text-purple-300 font-bold mb-2">Detailed Steps:</h4>
                <ul className="space-y-1">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start space-x-2 text-gray-200 text-sm">
                      <span className="text-purple-300 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Mobile Arrow to Next */}
            {index < steps.length - 1 && activeStep !== step.id && (
              <div className="flex justify-center py-2">
                <div className="text-gray-400 text-xl">↓</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/20">
          <p className="text-green-300 font-bold mb-2">
            🎯 Ready to Shape NFT History?
          </p>
          <p className="text-gray-200 text-sm">
            Join 1,247+ voters determining NFT rarity BEFORE minting!
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlowSection;