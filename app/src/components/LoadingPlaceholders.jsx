import React from 'react';

// 卡片載入 placeholder
export const MemeCardPlaceholder = ({ width = 300, height = 400 }) => (
  <div 
    className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-xl animate-pulse border border-gray-700/50"
    style={{ width, height }}
  >
    <div className="p-4 h-full flex flex-col">
      {/* 圖片區域 */}
      <div className="bg-gray-700/50 rounded-lg flex-1 mb-4 flex items-center justify-center">
        <div className="text-gray-500 text-4xl animate-bounce">🎨</div>
      </div>
      
      {/* 標題區域 */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-700/60 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-700/40 rounded w-3/4 animate-pulse"></div>
        
        {/* 投票按鈕區域 */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-700/50 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-700/50 rounded-full animate-pulse"></div>
          </div>
          <div className="w-16 h-6 bg-gray-700/50 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

// 網格載入 placeholder
export const MemeGridPlaceholder = ({ count = 6, columns = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
    {Array.from({ length: count }).map((_, index) => (
      <MemeCardPlaceholder key={index} />
    ))}
  </div>
);

// 生成中 placeholder (大尺寸)
export const GeneratingPlaceholder = ({ 
  width = 500, 
  height = 600,
  progress = 0 // 0-100
}) => (
  <div 
    className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden relative"
    style={{ width, height }}
  >
    {/* 背景動畫 */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform translate-x-[-100%] animate-[slide_3s_ease-in-out_infinite]"></div>
    
    <div className="relative z-10 p-8 h-full flex flex-col justify-center items-center text-center">
      {/* 主要圖示 */}
      <div className="text-8xl mb-6 animate-pulse">
        🧙‍♂️
      </div>
      
      {/* 標題 */}
      <h2 className="text-3xl font-bold text-white mb-4 text-gradient-hologram">
        MemeForge AI
      </h2>
      
      <p className="text-xl text-purple-200 mb-8 animate-pulse">
        Crafting your perfect meme...
      </p>
      
      {/* 進度條 */}
      <div className="w-full max-w-sm mb-6">
        <div className="bg-gray-800/50 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full transition-all duration-300 animate-pulse"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-purple-300 text-sm mt-2">
          {progress}% complete
        </p>
      </div>
      
      {/* 狀態指示器 */}
      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          {[0, 1, 2].map(i => (
            <div 
              key={i}
              className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
        <span className="text-cyan-300 text-sm font-medium">
          AI Processing...
        </span>
      </div>
      
      {/* AI 徽章 */}
      <div className="absolute top-6 right-6 bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 rounded-full">
        <span className="text-white text-sm font-bold">⚡ GEMINI AI</span>
      </div>
    </div>
  </div>
);

// 錯誤 placeholder
export const ErrorPlaceholder = ({ 
  width = 400, 
  height = 300,
  message = "Something went wrong!",
  onRetry = null
}) => (
  <div 
    className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-xl shadow-xl border border-red-600/50 text-white text-center"
    style={{ width, height }}
  >
    <div className="p-6 h-full flex flex-col justify-center items-center">
      <div className="text-6xl mb-4 animate-bounce">
        😵‍💫
      </div>
      
      <h3 className="text-xl font-bold mb-2 text-red-200">
        Oops!
      </h3>
      
      <p className="text-red-300 mb-6">
        {message}
      </p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          Try Again
        </button>
      )}
      
      <div className="mt-4 text-xs text-red-400">
        Using fallback placeholder
      </div>
    </div>
  </div>
);

// 空狀態 placeholder
export const EmptyStatePlaceholder = ({ 
  width = 400, 
  height = 300,
  title = "No Memes Yet",
  description = "Check back later for fresh AI memes!"
}) => (
  <div 
    className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl shadow-xl border border-gray-600/50 text-white text-center"
    style={{ width, height }}
  >
    <div className="p-6 h-full flex flex-col justify-center items-center">
      <div className="text-6xl mb-4 opacity-60">
        📭
      </div>
      
      <h3 className="text-xl font-bold mb-2 text-gray-200">
        {title}
      </h3>
      
      <p className="text-gray-400 mb-6">
        {description}
      </p>
      
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        <span>New content coming soon</span>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

// 簡潔的圖片 placeholder
export const ImagePlaceholder = ({ 
  width = 200, 
  height = 200,
  className = "",
  showIcon = true
}) => (
  <div 
    className={`bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border border-gray-600/50 ${className}`}
    style={{ width, height }}
  >
    {showIcon && (
      <div className="text-gray-500 text-3xl opacity-60">
        🖼️
      </div>
    )}
  </div>
);

export default {
  MemeCardPlaceholder,
  MemeGridPlaceholder,
  GeneratingPlaceholder,
  ErrorPlaceholder,
  EmptyStatePlaceholder,
  ImagePlaceholder
};