import React, { useState } from 'react';
import { SOLTooltip, TicketsTooltip, RarityTooltip, BattleTooltip, WalletTooltip } from './Web3Tooltip';

const ValuePropositionSection = ({ onScrollToVoting }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: '🤖',
      title: 'AI Creates Daily Memes',
      description: 'Our AI generates 3 crypto memes every day',
      details: 'Advanced AI analyzes trending crypto topics and creates original, hilarious memes that capture the community mood.'
    },
    {
      icon: '🗳️', 
      title: 'You Vote for Winners',
      description: 'Community decides which meme wins the battle',
      details: 'Simple one-click voting. No fees, no registration needed beyond connecting your wallet.'
    },
    {
      icon: '🎫',
      title: 'Earn Lottery Tickets',
      description: 'Every vote gives you 8-15 tickets automatically',
      details: 'Tickets accumulate throughout the week. More votes = more tickets = higher win chances.'
    },
    {
      icon: '💰',
      title: 'Win SOL Prizes Weekly', 
      description: 'Sunday draws distribute SOL to lucky winners',
      details: 'Live-streamed draws every Sunday 8PM UTC. All prizes paid instantly on-chain.'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Main Value Proposition */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>💎</span>
            <span>World's First Democratic Rarity System</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Vote on AI Memes,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Earn Real <SOLTooltip>SOL</SOLTooltip>
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The first platform where <strong>humans decide NFT rarity</strong> through community voting. 
            Unlike traditional NFTs with predetermined rarity, <RarityTooltip>your votes determine what becomes truly rare and valuable</RarityTooltip>.
          </p>

          {/* Key Innovation Callout */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white max-w-2xl mx-auto mb-8 shadow-xl">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <span className="text-2xl">🚀</span>
              <span className="font-bold text-lg">Revolutionary Innovation</span>
            </div>
            <p className="text-yellow-100">
              First time in NFT history: <strong>Community votes = NFT rarity</strong>. 
              No algorithms, no randomness - just human taste and democratic consensus.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={onScrollToVoting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 transform"
            >
              🗳️ Start Voting Now
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">100% Free</span> • No signup required
            </div>
          </div>
        </div>

        {/* How It Works - Interactive Steps */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative cursor-pointer transition-all duration-300 ${
                  activeStep === index 
                    ? 'transform scale-105' 
                    : 'hover:scale-102'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className={`p-6 rounded-2xl text-center ${
                  activeStep === index
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl'
                    : 'bg-white text-gray-900 shadow-lg border border-gray-200 hover:shadow-xl'
                }`}>
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <div className="font-bold text-lg mb-2">{step.title}</div>
                  <div className={`text-sm ${
                    activeStep === index ? 'text-purple-100' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </div>
                  
                  {/* Step number */}
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep === index
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-purple-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Step Details */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <span className="text-2xl">{steps[activeStep].icon}</span>
                <span className="font-bold text-lg text-gray-900">{steps[activeStep].title}</span>
              </div>
              <p className="text-gray-600 leading-relaxed">{steps[activeStep].details}</p>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
              💸
            </div>
            <h4 className="font-bold text-lg text-gray-900 mb-2">100% Free to Play</h4>
            <p className="text-gray-600">
              No entry fees, no hidden costs. Just connect your <WalletTooltip className="font-medium text-purple-600">crypto wallet</WalletTooltip> and start earning <TicketsTooltip className="font-medium text-purple-600">lottery tickets</TicketsTooltip>.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
              ⚡
            </div>
            <h4 className="font-bold text-lg text-gray-900 mb-2">Instant & Transparent</h4>
            <p className="text-gray-600">
              Votes counted instantly. Prizes distributed automatically on blockchain. 
              No delays, no manual processes - pure <WalletTooltip className="font-medium text-purple-600">blockchain</WalletTooltip> efficiency.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">
              🏆
            </div>
            <h4 className="font-bold text-lg text-gray-900 mb-2">Real SOL Rewards</h4>
            <p className="text-gray-600">
              Win actual <SOLTooltip className="font-medium text-purple-600">SOL cryptocurrency</SOLTooltip> every Sunday. 
              Current prize pool: <strong>12.7 SOL</strong> (~$2,540). All winners announced live.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ValuePropositionSection;