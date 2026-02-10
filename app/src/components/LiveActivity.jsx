import React, { useState, useEffect } from 'react';

const LiveActivity = ({ liveVoters }) => {
  const [recentActivity, setRecentActivity] = useState([
    { user: 'CryptoFan', action: 'voted Legendary', time: '2s ago', reward: '11 tickets' },
    { user: 'MemeHunter', action: 'voted Rare', time: '8s ago', reward: '9 tickets' },
    { user: 'NFTLover', action: 'voted Common', time: '12s ago', reward: '12 tickets' }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate random ticket reward
  const generateRandomTickets = () => {
    const min = 8;
    const max = 12;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Simulate live activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = ['voted Legendary', 'voted Rare', 'voted Common'];
      const users = ['CryptoFan', 'MemeHunter', 'NFTLover', 'SolTrader', 'DigitalArt', 'BlockchainBob'];
      
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomTickets = generateRandomTickets();
      
      const newActivity = {
        user: randomUser,
        action: randomAction,
        time: 'just now',
        reward: `${randomTickets} tickets`
      };

      setRecentActivity(prev => [newActivity, ...prev.slice(0, 2)]);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll through activity
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % recentActivity.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [recentActivity.length]);

  return (
    <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-green-300 font-bold flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live Activity</span>
        </h4>
        <div className="text-green-300 text-sm font-bold">
          {liveVoters.toLocaleString()} online
        </div>
      </div>

      {/* Current Activity Display */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-3 min-h-[60px] flex items-center">
        {recentActivity[currentIndex] && (
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {recentActivity[currentIndex].user.charAt(0)}
                </div>
                <span className="text-white font-semibold text-sm">
                  {recentActivity[currentIndex].user}
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                {recentActivity[currentIndex].time}
              </span>
            </div>
            <div className="mt-1 text-gray-300 text-sm">
              {recentActivity[currentIndex].action} → earned <span className="text-yellow-300 font-bold">{recentActivity[currentIndex].reward}</span>
            </div>
          </div>
        )}
      </div>

      {/* Activity Indicators */}
      <div className="flex justify-center space-x-1">
        {recentActivity.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-green-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-3 pt-3 border-t border-green-500/30">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-green-300">+{Math.floor(liveVoters/8)}</div>
            <div className="text-xs text-gray-300">Votes this hour</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-300">{Math.floor(liveVoters * 10)}</div>
            <div className="text-xs text-gray-300">Tickets earned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveActivity;