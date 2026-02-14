import React from 'react';

const MemeForgeePlaceholder = ({ 
  title = "AI Generated Meme", 
  width = 400, 
  height = 300, 
  type = "loading", // "loading", "error", "empty", "generating"
  showAnimation = true 
}) => {
  
  const getPlaceholderContent = () => {
    switch (type) {
      case "generating":
        return {
          icon: "🎨",
          mainTitle: "AI MemeForge",
          subtitle: "Generating magic...",
          description: "Creating your meme with Gemini AI",
          gradient: "from-purple-600 via-pink-600 to-blue-600",
          borderGlow: "glow-purple"
        };
      case "error":
        return {
          icon: "😅",
          mainTitle: "Oops!",
          subtitle: "Something went wrong",
          description: "Using fallback placeholder",
          gradient: "from-red-600 via-orange-600 to-yellow-600",
          borderGlow: "glow-orange"
        };
      case "empty":
        return {
          icon: "📭",
          mainTitle: "No Memes Yet",
          subtitle: "Check back later",
          description: "New AI memes coming soon",
          gradient: "from-gray-600 via-gray-700 to-gray-600",
          borderGlow: "glow-gray"
        };
      default: // loading
        return {
          icon: "🤖",
          mainTitle: "AI MemeForge",
          subtitle: title,
          description: "AI-powered meme creation",
          gradient: "from-purple-600 via-blue-700 to-cyan-600",
          borderGlow: "glow-cyan"
        };
    }
  };

  const content = getPlaceholderContent();

  return (
    <div 
      className={`relative flex items-center justify-center ${content.gradient} bg-gradient-to-br text-white text-center rounded-2xl shadow-2xl overflow-hidden border border-white/20 ${showAnimation ? content.borderGlow : ''} transition-all duration-300 hover:scale-105`}
      style={{ width, height, minWidth: 300, minHeight: 200 }}
    >
      {/* Background animation layers */}
      {showAnimation && (
        <>
          {/* Main scanning light effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] animate-pulse"></div>
          
          {/* Surrounding glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 animate-pulse-glow"></div>
          
          {/* Border glow animation */}
          <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-r from-cyan-400/50 via-purple-400/50 to-pink-400/50 animate-pulse"></div>
        </>
      )}
      
      {/* Content layer */}
      <div className="relative z-10 p-6 flex flex-col items-center">
        {/* Main icon */}
        <div className={`text-6xl mb-4 ${showAnimation ? 'animate-bounce' : ''}`}>
          {content.icon}
        </div>
        
        {/* Main title */}
        <h2 className="font-bold text-2xl mb-2 text-gradient-cyber">
          {content.mainTitle}
        </h2>
        
        {/* Subtitle */}
        <p className="text-lg opacity-90 mb-3 font-medium">
          {content.subtitle}
        </p>
        
        {/* Description text */}
        <p className="text-sm opacity-75 mb-4 text-center max-w-xs">
          {content.description}
        </p>
        
        {/* Loading indicator */}
        {(type === "loading" || type === "generating") && showAnimation && (
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse delay-0"></div>
            <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse delay-150"></div>
            <div className="w-3 h-3 bg-white/80 rounded-full animate-pulse delay-300"></div>
          </div>
        )}
        
        {/* AI badge */}
        <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
          <span className="mr-2 text-sm">⚡</span>
          <span className="text-xs font-medium">AI Powered</span>
          <span className="ml-2 text-sm">⚡</span>
        </div>
        
        {/* Version badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/30 rounded-lg backdrop-blur-sm">
          <span className="text-xs opacity-70">v2.0</span>
        </div>
      </div>
    </div>
  );
};

export default MemeForgeePlaceholder;