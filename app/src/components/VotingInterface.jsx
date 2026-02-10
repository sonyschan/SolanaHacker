import React, { useState, useEffect } from 'react';
import VotingExplanationModal from './VotingExplanationModal';

const VotingInterface = ({ onVote, userVote, connected, userTickets, consecutiveDays = 1 }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [votingStats, setVotingStats] = useState({
    common: 234,
    rare: 543, 
    legendary: 470
  });

  // Simulate live voting updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVotingStats(prev => ({
        common: prev.common + Math.floor(Math.random() * 2),
        rare: prev.rare + Math.floor(Math.random() * 3),
        legendary: prev.legendary + Math.floor(Math.random() * 2)
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const totalVotes = votingStats.common + votingStats.rare + votingStats.legendary;
  
  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // Calculate expected ticket range based on consecutive days
  const getTicketRange = () => {
    if (consecutiveDays >= 8) {
      return "10-15 tickets";
    } else if (consecutiveDays >= 4) {
      return "9-13 tickets";
    } else {
      return "8-12 tickets";
    }
  };

  const voteOptions = [
    {
      type: 'common',
      label: 'Common',
      description: 'Standard meme quality',
      tickets: getTicketRange(),
      color: 'from-green-600 to-green-700',
      hoverColor: 'from-green-500 to-green-600',
      borderColor: 'border-green-500/30',
      bgColor: 'bg-green-900/20',
      emoji: '✨',
      votes: votingStats.common,
      percentage: getPercentage(votingStats.common)
    },
    {
      type: 'rare',
      label: 'Rare',
      description: 'Above average, memorable',
      tickets: getTicketRange(),
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-900/20',
      emoji: '💎',
      votes: votingStats.rare,
      percentage: getPercentage(votingStats.rare)
    },
    {
      type: 'legendary',
      label: 'Legendary',
      description: 'Exceptional, viral potential',
      tickets: getTicketRange(),
      color: 'from-purple-600 to-purple-700',
      hoverColor: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-900/20',
      emoji: '🔥',
      votes: votingStats.legendary,
      percentage: getPercentage(votingStats.legendary)
    }
  ];

  const handleVote = (voteType) => {
    onVote(voteType);
  };

  // Find leading vote
  const leadingVote = voteOptions.reduce((prev, current) => 
    (current.votes > prev.votes) ? current : prev
  );

  return (
    <div className="space-y-4">
      
      {/* Help Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Rate This Meme's Quality</h3>
        <button
          onClick={() => setShowExplanation(true)}
          className="flex items-center space-x-2 text-yellow-300 hover:text-yellow-200 text-sm"
        >
          <span>❓</span>
          <span>How does voting work?</span>
        </button>
      </div>

      {/* Fair Rewards Explanation */}
      <div className="card-elevated p-4 bg-green-900/20 border border-green-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">🎯</span>
            <h4 className="text-sm font-semibold text-green-300">Fair Voting Rewards</h4>
          </div>
          <div className="text-right">
            <div className="text-green-200 font-bold text-sm">{consecutiveDays} days</div>
            <div className="text-green-300 text-xs">streak</div>
          </div>
        </div>
        
        <div className="text-sm text-green-200 mb-2">
          🎲 <strong>Random {getTicketRange()}</strong> • No bias • Equal rewards for all choices
        </div>
        
        {consecutiveDays >= 4 && (
          <div className="text-xs text-green-300 bg-green-800/30 rounded p-2">
            🎉 Streak bonus active! Higher reward range unlocked
          </div>
        )}
      </div>

      {/* Live Voting Stats */}
      <div className="card-elevated p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-300">Live Vote Count</h4>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">{totalVotes.toLocaleString()} votes</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {voteOptions.map(option => (
            <div key={option.type} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>{option.emoji}</span>
                <span className="text-gray-300">{option.label}</span>
                {leadingVote.type === option.type && (
                  <span className="text-yellow-300 text-xs">👑 Leading</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">{option.votes.toLocaleString()}</span>
                <span className="font-semibold min-w-[3rem] text-right">
                  {option.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Rarity Prediction */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-400 mb-1">Current NFT rarity prediction:</div>
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${
              leadingVote.type === 'legendary' ? 'text-purple-300' :
              leadingVote.type === 'rare' ? 'text-blue-300' : 'text-green-300'
            }`}>
              {leadingVote.emoji} {leadingVote.label} ({leadingVote.percentage}%)
            </span>
            {leadingVote.percentage >= 60 && (
              <span className="text-yellow-300 text-xs">🎯 Likely outcome!</span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Buttons */}
      {!userVote ? (
        <div className="space-y-3">
          <p className="text-gray-300 text-sm mb-4 text-center">
            Your vote helps determine this NFT's permanent rarity level
          </p>
          
          {voteOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleVote(option.type)}
              disabled={!connected}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-300
                ${connected 
                  ? `bg-gradient-to-r ${option.color} hover:${option.hoverColor} text-white hover:scale-105 hover:shadow-xl ${option.borderColor}`
                  : 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed opacity-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">{option.label}</div>
                    <div className="text-sm opacity-90">{option.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{option.tickets}</div>
                  <div className="text-sm opacity-90">random reward</div>
                </div>
              </div>
            </button>
          ))}
          
          {!connected && (
            <p className="text-center text-yellow-300 text-sm">
              💡 Connect your wallet above to start voting and earning rewards!
            </p>
          )}
        </div>
      ) : (
        // User has voted
        <div className="text-center space-y-4">
          <div className="card-elevated p-6 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">Vote Recorded!</h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-200">
                You voted: <span className="font-bold text-yellow-300 capitalize">{userVote}</span>
              </p>
              <p className="text-gray-200">
                Lottery tickets earned: <span className="font-bold text-green-300">{userTickets}</span>
                <span className="text-blue-300 text-xs ml-2">(Random reward!)</span>
              </p>
              <p className="text-gray-300 text-xs">
                ⏰ Come back tomorrow for the next daily meme vote!
              </p>
            </div>
          </div>

          {/* Streak info */}
          {consecutiveDays >= 2 && (
            <div className="card-elevated p-4 bg-blue-900/20 border border-blue-500/30">
              <div className="text-blue-200 text-sm">
                🔥 <strong>{consecutiveDays} day voting streak</strong>
                {consecutiveDays >= 4 && " • Bonus rewards unlocked!"}
              </div>
              <div className="text-blue-300 text-xs mt-1">
                Keep voting daily: Day 8+ unlocks 10-15 ticket range
              </div>
            </div>
          )}

          {/* Show current standings */}
          <div className="card-elevated p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Your Impact on Today's Vote</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NFT likely to become:</span>
                <span className={`font-bold ${
                  leadingVote.type === 'legendary' ? 'text-purple-300' :
                  leadingVote.type === 'rare' ? 'text-blue-300' : 'text-green-300'
                }`}>
                  {leadingVote.emoji} {leadingVote.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total community votes:</span>
                <span className="text-white font-bold">{totalVotes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Your vote weight:</span>
                <span className="text-green-300">1/{totalVotes.toLocaleString()} (Equal voice!)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      <VotingExplanationModal 
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
      />
    </div>
  );
};

export default VotingInterface;