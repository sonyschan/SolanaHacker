import React from 'react';

const EnhancedTabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { 
      id: 'vote', 
      icon: '🗳️', 
      label: 'Vote', 
      description: 'Vote on AI memes',
      badge: '3 New',
      color: 'purple'
    },
    { 
      id: 'stats', 
      icon: '📊', 
      label: 'Stats', 
      description: 'Platform analytics',
      badge: null,
      color: 'blue'
    },
    { 
      id: 'winners', 
      icon: '🏆', 
      label: 'Winners', 
      description: 'Recent winners',
      badge: null,
      color: 'gold'
    }
  ];

  const getTabStyles = (tab, isActive) => {
    const baseStyles = "relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group min-w-0 flex-1";
    
    if (isActive) {
      const colorMap = {
        purple: "bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/25",
        blue: "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/25",
        gold: "bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-lg shadow-yellow-500/25"
      };
      return `${baseStyles} ${colorMap[tab.color]}`;
    } else {
      return `${baseStyles} bg-gray-500/5 border-gray-500/20 text-gray-400 hover:bg-gray-500/10 hover:border-gray-500/30 hover:text-gray-300`;
    }
  };

  const getBadgeStyles = (color) => {
    const colorMap = {
      purple: "bg-purple-500 text-white",
      blue: "bg-blue-500 text-white", 
      gold: "bg-yellow-500 text-black"
    };
    return colorMap[color] || "bg-red-500 text-white";
  };

  return (
    <div className="mb-8">
      {/* Tab Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold heading-gradient mb-2">
          Explore Platform
        </h2>
        <p className="text-enhanced-medium text-sm sm:text-base">
          Navigate through voting, statistics, and winners
        </p>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={getTabStyles(tab, activeTab === tab.id)}
          >
            {/* Badge */}
            {tab.badge && (
              <div className={`absolute -top-2 -right-2 ${getBadgeStyles(tab.color)} text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10`}>
                {tab.badge}
              </div>
            )}
            
            {/* Icon */}
            <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
              {tab.icon}
            </div>
            
            {/* Label */}
            <div className="font-bold text-sm sm:text-lg mb-1">
              {tab.label}
            </div>
            
            {/* Description */}
            <div className="text-xs sm:text-sm opacity-70 text-center leading-tight">
              {tab.description}
            </div>

            {/* Active Indicator */}
            {activeTab === tab.id && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-current rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Active Tab Summary */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-2 bg-gray-500/5 rounded-full px-4 py-2">
          <span className="text-lg">
            {tabs.find(tab => tab.id === activeTab)?.icon}
          </span>
          <span className="text-enhanced-medium text-sm">
            Currently viewing: <strong className="text-enhanced-high">{tabs.find(tab => tab.id === activeTab)?.label}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTabNavigation;