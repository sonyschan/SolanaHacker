import React, { useState } from 'react';

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      number: 1,
      title: "Connect Your Wallet",
      icon: "🔗",
      description: "Connect any Solana wallet (Phantom, Solflare, etc.) - no registration required.",
      details: "MemeForge works with any Solana wallet. Your wallet is your account - no passwords or personal info needed."
    },
    {
      number: 2, 
      title: "Vote on AI Memes",
      icon: "🗳️",
      description: "Rate today's AI-generated memes from 1-10. Each vote takes 2 seconds.",
      details: "Every day, our AI creates fresh, unique memes. Your vote determines which ones become rare and valuable."
    },
    {
      number: 3,
      title: "Earn Lottery Tickets",
      icon: "🎫", 
      description: "Get 10-15 tickets per vote. More consecutive days = more tickets.",
      details: "Tickets are earned randomly to prevent gaming. Consistent daily voting increases your ticket range."
    },
    {
      number: 4,
      title: "Win SOL Prizes",
      icon: "💰",
      description: "Weekly drawings with 3 winners. Real cryptocurrency sent to your wallet.",
      details: "Every Sunday, 3 random ticket holders win SOL. Prizes automatically sent - no claiming required."
    }
  ];

  return (
    <section className="bg-gray-800 py-16 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Start earning SOL in 4 simple steps. No experience with crypto or NFTs needed.
          </p>
        </div>

        {/* Desktop: Side-by-side layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-12 items-start">
          
          {/* Left: Step buttons */}
          <div className="space-y-4">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => setActiveStep(step.number)}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                  activeStep === step.number
                    ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`text-4xl ${activeStep === step.number ? 'scale-110' : ''} transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-lg font-bold mb-2 ${
                      activeStep === step.number ? 'text-blue-300' : 'text-white'
                    }`}>
                      Step {step.number}: {step.title}
                    </div>
                    <div className="text-gray-300 text-sm">
                      {step.description}
                    </div>
                  </div>
                  <div className={`text-2xl transition-transform duration-300 ${
                    activeStep === step.number ? 'rotate-90' : ''
                  }`}>
                    ▶️
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Active step details */}
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-600 min-h-[400px] flex flex-col justify-center">
            {steps.map((step) => (
              activeStep === step.number && (
                <div key={step.number} className="text-center">
                  <div className="text-8xl mb-6 animate-bounce">
                    {step.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-xl text-gray-300 mb-6">
                    {step.description}
                  </p>
                  <p className="text-gray-400 leading-relaxed">
                    {step.details}
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="mt-8 flex justify-center space-x-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                          index + 1 === activeStep ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Mobile: Stacked cards */}
        <div className="md:hidden space-y-6">
          {steps.map((step) => (
            <div 
              key={step.number}
              className="bg-gray-700/30 border border-gray-600 rounded-xl p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="text-5xl">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Step {step.number}: {step.title}
                  </h3>
                  <p className="text-gray-300 mb-3">
                    {step.description}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {step.details}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-2xl p-8 border border-green-600/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Start Earning?
            </h3>
            <p className="text-gray-300 mb-6">
              Join {(1247 + Math.floor(Date.now() / 60000) % 100).toLocaleString()} active voters earning SOL daily
            </p>
            <button
              onClick={() => {
                document.querySelector('.wallet-connect-section')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'center'
                });
              }}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              🚀 Connect Wallet & Start Voting
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;