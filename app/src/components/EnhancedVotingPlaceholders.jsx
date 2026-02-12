import React, { useState, useEffect } from 'react';

// 改良的梗圖卡片 placeholder
export const EnhancedMemeCardPlaceholder = ({ 
  delay = 0,
  showProgress = false,
  aiGeneration = false 
}) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('analyzing');
  
  useEffect(() => {
    if (!showProgress) return;
    
    const steps = [
      { name: 'analyzing', duration: 1000, label: '🔍 Analyzing trends...' },
      { name: 'creating', duration: 2000, label: '🎨 Creating artwork...' },
      { name: 'optimizing', duration: 1000, label: '⚡ Optimizing quality...' },
      { name: 'complete', duration: 500, label: '✅ Ready to vote!' }
    ];
    
    let currentStep = 0;
    let currentProgress = 0;
    
    const updateProgress = () => {
      if (currentStep >= steps.length) return;
      
      const stepProgress = 100 / steps.length;
      const targetProgress = (currentStep + 1) * stepProgress;
      
      setStep(steps[currentStep].name);
      
      const interval = setInterval(() => {
        currentProgress += 2;
        setProgress(Math.min(currentProgress, targetProgress));
        
        if (currentProgress >= targetProgress) {
          clearInterval(interval);
          currentStep++;
          setTimeout(updateProgress, 200);
        }
      }, steps[currentStep].duration / 50);
    };
    
    setTimeout(updateProgress, delay);
  }, [showProgress, delay]);

  return (
    <div 
      className="relative bg-gradient-to-br from-gray-800/40 via-gray-900/60 to-black/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 背景動畫光效 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent transform -skew-x-12 animate-[slide_3s_ease-in-out_infinite] group-hover:via-purple-400/15"></div>
      
      {/* AI生成狀態指示器 */}
      {aiGeneration && (
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <div className="bg-gradient-to-r from-purple-600 to-cyan-500 px-3 py-1 rounded-full animate-pulse">
            <span className="text-white text-xs font-bold">🤖 AI</span>
          </div>
          {showProgress && (
            <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-cyan-300 animate-pulse">
              {progress.toFixed(0)}%
            </div>
          )}
        </div>
      )}
      
      <div className="p-6 h-full flex flex-col">
        {/* 圖片區域 - 增強版 placeholder */}
        <div className="relative bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-gray-900/30 rounded-lg h-64 mb-4 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
          {/* 多層動畫效果 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[slide_2s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-cyan-500/10 to-transparent animate-[slide_2.5s_ease-in-out_infinite] animation-delay-500"></div>
          
          {/* 中央圖示 */}
          <div className="relative z-10 text-center">
            <div className="text-6xl mb-3 animate-bounce">
              {aiGeneration ? '🧙‍♂️' : '🎭'}
            </div>
            <div className="text-purple-300 font-semibold animate-pulse">
              {aiGeneration ? 'AI Crafting...' : 'Meme Loading...'}
            </div>
            
            {/* 進度條 */}
            {showProgress && (
              <div className="w-32 bg-gray-700/50 rounded-full h-2 mt-3 mx-auto overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* 角落裝飾 */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-purple-500/40 rounded-full animate-ping"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-cyan-500/40 rounded-full animate-ping animation-delay-1000"></div>
        </div>
        
        {/* 文字內容區域 */}
        <div className="space-y-4 flex-grow">
          {/* 標題 placeholder */}
          <div className="space-y-2">
            <div className="h-5 bg-gradient-to-r from-gray-600/60 via-gray-500/60 to-gray-600/60 rounded animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
            <div className="h-4 bg-gradient-to-r from-gray-700/40 via-gray-600/40 to-gray-700/40 rounded w-3/4 animate-pulse"></div>
          </div>
          
          {/* 標籤區域 */}
          <div className="flex space-x-2">
            <div className="h-6 w-16 bg-purple-600/30 rounded-full animate-pulse"></div>
            <div className="h-6 w-20 bg-blue-600/30 rounded-full animate-pulse"></div>
            {aiGeneration && (
              <div className="h-6 w-12 bg-green-600/30 rounded-full animate-pulse"></div>
            )}
          </div>
          
          {/* 投票統計 */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-red-500/30 rounded-full animate-pulse flex items-center justify-center">
                <span className="text-xs">❤️</span>
              </div>
              <div className="w-8 h-8 bg-yellow-500/30 rounded-full animate-pulse flex items-center justify-center">
                <span className="text-xs">😂</span>
              </div>
            </div>
            <div className="h-5 w-16 bg-gray-600/50 rounded animate-pulse"></div>
          </div>
          
          {/* 投票按鈕 */}
          <div className="mt-auto">
            <div className="h-12 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 rounded-lg flex items-center justify-center animate-pulse bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] group-hover:from-purple-500/40 group-hover:to-pink-500/40 transition-all duration-300">
              <span className="text-purple-200 font-semibold animate-pulse">
                {showProgress ? '⏳ Preparing...' : '🔄 Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 進度狀態指示 */}
      {showProgress && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="text-xs text-cyan-300 font-medium">
              {step === 'analyzing' && '🔍 Analyzing trends...'}
              {step === 'creating' && '🎨 Creating artwork...'}
              {step === 'optimizing' && '⚡ Optimizing quality...'}
              {step === 'complete' && '✅ Ready to vote!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 投票階段 placeholder
export const VotingPhasePlaceholder = ({ phase = 'selection' }) => {
  return (
    <div className="text-center mb-8">
      <div className="relative inline-block">
        {/* 背景光圈 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
        
        <div className="relative bg-gray-900/80 backdrop-blur-lg border border-purple-500/30 rounded-2xl px-8 py-6">
          {phase === 'selection' && (
            <>
              <div className="text-4xl mb-2 animate-bounce">🎭</div>
              <div className="h-6 bg-gradient-to-r from-purple-400 to-cyan-400 rounded w-48 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-600/50 rounded w-64 mx-auto animate-pulse"></div>
            </>
          )}
          
          {phase === 'rarity' && (
            <>
              <div className="text-4xl mb-2 animate-bounce">💎</div>
              <div className="h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded w-52 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-600/50 rounded w-72 mx-auto animate-pulse"></div>
            </>
          )}
          
          {phase === 'completed' && (
            <>
              <div className="text-4xl mb-2">🏆</div>
              <div className="h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded w-44 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-600/50 rounded w-56 mx-auto animate-pulse"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 網格載入 placeholder
export const EnhancedMemeGridPlaceholder = ({ 
  count = 3,
  aiGeneration = false,
  showStagger = true 
}) => {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <EnhancedMemeCardPlaceholder 
          key={index}
          delay={showStagger ? index * 200 : 0}
          showProgress={aiGeneration && index === 0} // 只有第一個顯示詳細進度
          aiGeneration={aiGeneration}
        />
      ))}
    </div>
  );
};

// 稀有度投票 placeholder
export const RarityVotingPlaceholder = () => {
  const rarityOptions = [
    { id: 'common', color: 'from-gray-600 to-gray-700', icon: '👍' },
    { id: 'rare', color: 'from-blue-600 to-blue-700', icon: '💎' },
    { id: 'legendary', color: 'from-purple-600 to-purple-700', icon: '🏆' }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {rarityOptions.map((option, index) => (
        <div 
          key={option.id}
          className={`relative bg-gradient-to-br ${option.color} bg-opacity-20 border-2 border-opacity-40 rounded-xl p-8 overflow-hidden group`}
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* 背景動畫 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-[slide_2.5s_ease-in-out_infinite]"></div>
          
          <div className="relative z-10 text-center">
            <div className="text-5xl mb-4 animate-bounce" style={{ animationDelay: `${index * 100}ms` }}>
              {option.icon}
            </div>
            
            {/* 標題 placeholder */}
            <div className="h-6 bg-white/20 rounded w-24 mx-auto mb-3 animate-pulse"></div>
            
            {/* 描述 placeholder */}
            <div className="h-4 bg-white/15 rounded w-32 mx-auto mb-4 animate-pulse"></div>
            
            {/* 投票數 placeholder */}
            <div className="h-3 bg-white/10 rounded w-20 mx-auto animate-pulse"></div>
          </div>
          
          {/* 懸浮效果 */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  );
};

// 獎勵動畫 placeholder
export const RewardPlaceholder = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-md">
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-purple-600 rounded-3xl p-8 text-center animate-[success-bounce_1s_ease-in-out] max-w-md mx-4">
        {/* 背景粒子效果 */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-white/15 rounded w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-40 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default {
  EnhancedMemeCardPlaceholder,
  VotingPhasePlaceholder,
  EnhancedMemeGridPlaceholder,
  RarityVotingPlaceholder,
  RewardPlaceholder
};