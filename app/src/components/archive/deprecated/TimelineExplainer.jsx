import React from 'react';

const TimelineExplainer = ({ timeLeft }) => {
  const parseTimeLeft = (timeString) => {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    return { hours, minutes, seconds };
  };

  const { hours, minutes } = parseTimeLeft(timeLeft);

  return (
    <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/30">
      <div className="flex items-center justify-center space-x-2 mb-3">
        <span className="text-2xl">⏰</span>
        <h3 className="text-red-300 font-bold text-lg">Voting Deadline</h3>
      </div>
      
      <div className="text-center mb-3">
        <div className="text-3xl font-bold text-red-300 mb-1">
          {hours}h {minutes}m left
        </div>
        <div className="text-gray-300 text-sm">
          to vote on today's meme
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-3 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Daily cycle:</span>
          <span className="text-white font-semibold">24 hours</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">What happens at 0:00:</span>
          <span className="text-yellow-300 font-semibold">New meme drops</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Previous meme:</span>
          <span className="text-purple-300 font-semibold">Rarity locked in</span>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <div className="text-xs text-gray-400">
          💡 Vote before the deadline to earn tickets for this week's lottery
        </div>
      </div>
    </div>
  );
};

export default TimelineExplainer;