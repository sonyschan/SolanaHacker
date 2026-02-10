import React, { useState, useEffect } from 'react';

const RarityGauge = ({ currentVotes, voteCounts, animateToVote, className = "" }) => {
  const [needlePosition, setNeedlePosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use currentVotes if provided, otherwise fallback to voteCounts
  const votes = currentVotes || voteCounts || { common: 0, rare: 0, legendary: 0 };

  // Calculate total votes and percentages
  const totalVotes = (votes.common || 0) + (votes.rare || 0) + (votes.legendary || 0);
  
  const percentages = {
    common: totalVotes > 0 ? Math.round((votes.common || 0) / totalVotes * 100) : 33,
    rare: totalVotes > 0 ? Math.round((votes.rare || 0) / totalVotes * 100) : 33,
    legendary: totalVotes > 0 ? Math.round((votes.legendary || 0) / totalVotes * 100) : 34
  };

  // Define rarity zones (needle positions from 0 to 180 degrees)
  const rarityPositions = {
    common: 30,     // Left side (green zone)
    rare: 90,       // Middle (blue zone)  
    legendary: 150  // Right side (purple zone)
  };

  // Determine winning rarity based on highest percentage
  const getWinningRarity = () => {
    if (percentages.legendary >= percentages.rare && percentages.legendary >= percentages.common) {
      return 'legendary';
    } else if (percentages.rare >= percentages.common) {
      return 'rare';
    }
    return 'common';
  };

  const winningRarity = getWinningRarity();

  // Update needle position when animateToVote changes (voting animation)
  useEffect(() => {
    if (animateToVote && rarityPositions[animateToVote] !== needlePosition) {
      setIsAnimating(true);
      setNeedlePosition(rarityPositions[animateToVote]);
      
      // Animation complete after 1 second
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [animateToVote, needlePosition, rarityPositions]);

  // Update needle to winning position when vote counts change
  useEffect(() => {
    // Only update if not currently animating from a user vote
    if (!animateToVote) {
      const newPosition = rarityPositions[winningRarity];
      if (newPosition !== needlePosition) {
        setIsAnimating(true);
        setNeedlePosition(newPosition);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }
  }, [winningRarity, needlePosition, rarityPositions, animateToVote]);

  // Get colors for each rarity
  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return 'text-green-400';
      case 'rare': return 'text-blue-400';  
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityGlow = (rarity) => {
    switch(rarity) {
      case 'common': return 'shadow-green-400/30';
      case 'rare': return 'shadow-blue-400/30';
      case 'legendary': return 'shadow-purple-400/30';
      default: return 'shadow-gray-400/30';
    }
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center justify-center">
          <span className="mr-2">⚡</span>
          Rarity Forge
        </h3>
        <p className="text-zinc-400 text-sm">Community consensus shapes NFT rarity</p>
      </div>

      {/* Gauge Container */}
      <div className="relative flex justify-center mb-6">
        <div className="w-48 h-24 relative">
          {/* Gauge Background Arc */}
          <svg 
            viewBox="0 0 200 100" 
            className="w-full h-full"
          >
            {/* Background arc */}
            <path
              d="M 20 80 A 80 80 0 0 1 180 80"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Common zone (green) */}
            <path
              d="M 20 80 A 80 80 0 0 0 100 20"
              fill="none"
              stroke="#22c55e"
              strokeWidth="6"
              strokeLinecap="round"
              className={`transition-all duration-500 ${winningRarity === 'common' ? 'drop-shadow-lg' : 'opacity-60'}`}
            />
            
            {/* Rare zone (blue) */}
            <path
              d="M 100 20 A 80 80 0 0 0 180 80"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              className={`transition-all duration-500 ${winningRarity === 'rare' ? 'drop-shadow-lg' : 'opacity-60'}`}
            />

            {/* Legendary zone overlay (purple) - partial overlay on right side */}
            <path
              d="M 140 40 A 80 80 0 0 0 180 80"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="8"
              strokeLinecap="round"
              className={`transition-all duration-500 ${winningRarity === 'legendary' ? 'drop-shadow-lg' : 'opacity-60'}`}
            />
            
            {/* Center circle */}
            <circle
              cx="100"
              cy="80"
              r="6"
              fill="#71717a"
              className="drop-shadow-md"
            />
            
            {/* Animated needle */}
            <line
              x1="100"
              y1="80"
              x2="100"
              y2="35"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out origin-bottom ${isAnimating ? 'animate-pulse' : ''}`}
              style={{
                transform: `rotate(${needlePosition - 90}deg)`,
                transformOrigin: '100px 80px'
              }}
            />
            
            {/* Needle tip glow */}
            <circle
              cx="100"
              cy="35"
              r="3"
              fill="#fbbf24"
              className={`transition-all duration-1000 ease-out ${isAnimating ? 'animate-ping' : ''}`}
              style={{
                transform: `rotate(${needlePosition - 90}deg)`,
                transformOrigin: '100px 80px'
              }}
            />
          </svg>
          
          {/* Zone Labels */}
          <div className="absolute top-full left-0 text-xs">
            <span className={`font-medium ${getRarityColor('common')}`}>Common</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 text-xs">
            <span className={`font-medium ${getRarityColor('rare')}`}>Rare</span>
          </div>
          <div className="absolute top-full right-0 text-xs">
            <span className={`font-medium ${getRarityColor('legendary')}`}>Legendary</span>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className={`text-center mb-4 p-3 rounded-lg border transition-all duration-500 ${
        winningRarity === 'legendary' ? 'bg-purple-950 border-purple-800' :
        winningRarity === 'rare' ? 'bg-blue-950 border-blue-800' :
        'bg-green-950 border-green-800'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">
            {winningRarity === 'legendary' ? '🏆' : winningRarity === 'rare' ? '💎' : '✨'}
          </span>
          <span className={`font-bold capitalize ${getRarityColor(winningRarity)}`}>
            {winningRarity} ({percentages[winningRarity]}%)
          </span>
          <span className="text-xs text-zinc-400">leading</span>
        </div>
        
        {isAnimating && (
          <div className="text-xs text-zinc-300 mt-1 animate-pulse">
            ⚡ Forging rarity consensus...
          </div>
        )}
      </div>

      {/* Vote Distribution */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          { type: 'common', label: 'Common', icon: '✨', color: 'green' },
          { type: 'rare', label: 'Rare', icon: '💎', color: 'blue' },
          { type: 'legendary', label: 'Legendary', icon: '🏆', color: 'purple' }
        ].map(({ type, label, icon, color }) => (
          <div 
            key={type}
            className={`p-2 rounded border transition-all duration-300 ${
              winningRarity === type 
                ? `bg-${color}-950 border-${color}-800 ${getRarityGlow(type)} shadow-lg scale-105` 
                : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            <div className="text-center">
              <div className="text-sm mb-1">{icon}</div>
              <div className={`font-semibold ${getRarityColor(type)}`}>
                {percentages[type]}%
              </div>
              <div className="text-zinc-400 text-xs">
                {votes[type] || 0} votes
              </div>
              
              {/* Progress bar */}
              <div className="mt-1 bg-zinc-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-1000 ${
                    color === 'green' ? 'bg-green-400' :
                    color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'
                  }`}
                  style={{ width: `${percentages[type]}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Forging Status Indicator */}
      <div className="text-center mt-4 text-xs text-zinc-400">
        <div className="flex items-center justify-center space-x-1">
          <div className={`w-1 h-1 rounded-full ${isAnimating ? 'bg-yellow-400' : 'bg-zinc-600'} transition-colors`}></div>
          <div className={`w-1 h-1 rounded-full ${isAnimating ? 'bg-yellow-400' : 'bg-zinc-600'} transition-colors delay-100`}></div>
          <div className={`w-1 h-1 rounded-full ${isAnimating ? 'bg-yellow-400' : 'bg-zinc-600'} transition-colors delay-200`}></div>
          <span className="ml-2">
            {isAnimating ? 'Forging consensus...' : 'Market value determined by community'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RarityGauge;