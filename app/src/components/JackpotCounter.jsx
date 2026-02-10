import React, { useState, useEffect } from 'react';

const JackpotCounter = ({ className = "" }) => {
  const [jackpotAmount, setJackpotAmount] = useState(12.7543);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // Simulate real-time jackpot increases
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to increase jackpot (simulate new votes/tickets)
      if (Math.random() > 0.6) { // 40% chance every 3 seconds
        const increase = (Math.random() * 0.05) + 0.01; // 0.01-0.06 SOL increase
        
        setJackpotAmount(prev => {
          const newAmount = prev + increase;
          setIsIncreasing(true);
          setPulseEffect(true);
          
          // Reset effects after animation
          setTimeout(() => setIsIncreasing(false), 1000);
          setTimeout(() => setPulseEffect(false), 500);
          
          return newAmount;
        });
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const formatSOL = (amount) => {
    return amount.toFixed(4);
  };

  const formatUSD = (solAmount) => {
    const solPrice = 200; // Mock SOL price
    return (solAmount * solPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className={`${className}`}>
      <div className={`
        relative bg-gradient-to-r from-purple-900/80 to-pink-900/80 
        border-2 border-purple-500/50 rounded-xl px-6 py-3
        backdrop-blur-sm shadow-lg
        transition-all duration-500
        ${pulseEffect ? 'scale-105 border-purple-400 shadow-purple-500/30 shadow-2xl' : ''}
        ${isIncreasing ? 'animate-pulse' : ''}
      `}>
        {/* Background glow effect */}
        <div className={`
          absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl
          transition-opacity duration-500
          ${pulseEffect ? 'opacity-100' : 'opacity-50'}
        `} />
        
        {/* Floating coins animation around the counter */}
        {isIncreasing && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce opacity-70"
                style={{
                  left: `${15 + (i * 20)}%`,
                  top: i % 2 === 0 ? '-10px' : '100%',
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1000ms'
                }}
              >
                <span className="text-lg">💰</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-purple-300 text-sm font-medium">🏆 JACKPOT POOL</span>
            {isIncreasing && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-bold">GROWING</span>
              </div>
            )}
          </div>
          
          {/* Main amount */}
          <div className="flex items-center space-x-3">
            <div className={`
              text-white font-mono font-bold text-xl
              transition-all duration-300
              ${isIncreasing ? 'text-green-400 scale-110' : ''}
            `}>
              {formatSOL(jackpotAmount)} SOL
            </div>
            
            {/* Increase indicator */}
            {isIncreasing && (
              <div className="flex items-center text-green-400 animate-bounce">
                <span className="text-sm">📈</span>
                <span className="text-xs font-bold ml-1">+</span>
              </div>
            )}
          </div>
          
          {/* USD equivalent */}
          <div className="text-purple-200 text-xs opacity-90">
            ≈ {formatUSD(jackpotAmount)}
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-xs font-medium">LIVE</span>
            </div>
            <span className="text-purple-300 text-xs">•</span>
            <span className="text-purple-300 text-xs">
              Next draw: {(() => {
                const now = new Date();
                const nextSunday = new Date(now);
                nextSunday.setDate(now.getDate() + (7 - now.getDay()));
                nextSunday.setHours(20, 0, 0, 0);
                
                const diffMs = nextSunday - now;
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                
                return diffDays === 1 ? 'Tomorrow' : `${diffDays}d`;
              })()} 8PM
            </span>
          </div>
        </div>

        {/* Sparkle effects */}
        {pulseEffect && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-ping opacity-70"
                style={{
                  left: `${10 + (i * 12)}%`,
                  top: `${20 + ((i % 3) * 25)}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '800ms'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Urgency messaging */}
      <div className="mt-2 text-center">
        <div className="inline-flex items-center bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1">
          <span className="text-red-400 text-xs font-medium mr-2">⚡</span>
          <span className="text-red-300 text-xs">
            Participate now • Win chances increase with every vote
          </span>
        </div>
      </div>
    </div>
  );
};

export default JackpotCounter;