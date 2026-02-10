import React, { useState, useEffect } from 'react';

const ValueCycleVisualization = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const steps = [
    {
      id: 1,
      title: "AI 生成 Meme",
      icon: "🤖",
      description: "AI 分析熱門新聞和社群話題，生成 3 張創意 Meme",
      details: [
        "📰 Twitter 熱搜、CoinDesk、區塊鏈媒體",
        "⏱️ 過去 24-48 小時熱門事件",
        "🎯 加密貨幣、DeFi、NFT 相關主題",
        "👥 Elon Musk、Vitalik 等名人動態"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      title: "用戶投票",
      icon: "❤️",
      description: "雙階段民主投票：選出最受歡迎的 Meme，決定稀有度",
      details: [
        "🥇 第一步驟：選出最受歡迎的 Meme",
        "💎 第二步驟：投票決定稀有度等級",
        "🎫 每次投票隨機獲得 8-15 張彩票",
        "🔥 連續投票獎勵：最高 10-15 張彩票"
      ],
      color: "from-pink-500 to-rose-500"
    },
    {
      id: 3,
      title: "決定勝者 & 稀有度",
      icon: "🏆",
      description: "100% 由人類用戶投票決定，每日限量 1 個 NFT",
      details: [
        "📊 票數最高者成為當日勝者",
        "⭐ 5 個稀有度：Common → Legendary",
        "🎲 獎勵倍數：1x → 25x",
        "🏅 日限量強化稀缺性"
      ],
      color: "from-yellow-500 to-orange-500"
    },
    {
      id: 4,
      title: "鑄造 NFT",
      icon: "🎨",
      description: "基於用戶投票結果，自動鑄造稀有度 NFT",
      details: [
        "⛓️ Solana SPL Token / Metaplex 標準",
        "📋 完整元數據：投票統計、稀有度、時間",
        "🏷️ AI 生成 3-7 個隨機特徵",
        "✅ 僅獲勝 Meme 被鑄造"
      ],
      color: "from-purple-500 to-indigo-500"
    },
    {
      id: 5,
      title: "競標拍賣",
      icon: "🛒",
      description: "3 天競價期，透明公平的拍賣機制",
      details: [
        "⏳ 3 天競價期，最多 3 個 NFT 同時拍賣",
        "💰 0.01 SOL 起標，新出價需高 5%",
        "🔒 出價需預付全額到託管帳戶",
        "💸 被超越者自動退款（僅扣 gas）"
      ],
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 6,
      title: "分配獎勵",
      icon: "🎁",
      description: "80% 拍賣收益回饋用戶，每週日開獎",
      details: [
        "💵 80% NFT 收益進入獎池",
        "📅 每週日 8PM UTC 開獎",
        "🎰 依彩票比例隨機分配",
        "🏆 1st: 40% | 2nd: 25% | 3rd: 15%"
      ],
      color: "from-red-500 to-pink-500"
    }
  ];

  // Auto-advance animation
  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnimating, steps.length]);

  const handleStepClick = (index) => {
    setIsAnimating(false);
    setActiveStep(index);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          MemeForge 價值循環
        </h2>
        <p className="text-gray-600">
          6 步驟透明循環：AI 創作 → 民主投票 → NFT 鑄造 → 拍賣分配
        </p>
        <div className="flex items-center justify-center mt-4 space-x-4">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isAnimating
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isAnimating ? '⏸️ 暫停動畫' : '▶️ 播放動畫'}
          </button>
        </div>
      </div>

      {/* Circular Visualization */}
      <div className="relative flex items-center justify-center mb-8">
        <svg width="400" height="400" className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="4"
          />
          
          {/* Progress Circle */}
          <circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${((activeStep + 1) / steps.length) * 942} 942`}
            className="transition-all duration-1000 ease-in-out"
          />
          
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Step Icons */}
        {steps.map((step, index) => {
          const angle = (index * 60) - 90; // 60 degrees between each step, -90 to start at top
          const radian = (angle * Math.PI) / 180;
          const x = 200 + 150 * Math.cos(radian);
          const y = 200 + 150 * Math.sin(radian);

          return (
            <div
              key={step.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${x}px`,
                top: `${y}px`,
              }}
              onClick={() => handleStepClick(index)}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                    : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:scale-105'
                }`}
              >
                {step.icon}
              </div>
              <div
                className={`text-center mt-2 text-sm font-medium transition-all duration-300 ${
                  activeStep === index ? 'text-purple-600' : 'text-gray-500'
                }`}
              >
                Step {step.id}
              </div>
            </div>
          );
        })}

        {/* Center Information */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-32">
            <div className="text-4xl mb-2">{steps[activeStep].icon}</div>
            <div className="text-lg font-bold text-gray-800">
              Step {steps[activeStep].id}
            </div>
          </div>
        </div>
      </div>

      {/* Step Details */}
      <div className={`bg-gradient-to-r ${steps[activeStep].color} text-white rounded-xl p-6 mb-6`}>
        <div className="flex items-start space-x-4">
          <div className="text-4xl">{steps[activeStep].icon}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{steps[activeStep].title}</h3>
            <p className="text-lg mb-4 opacity-90">{steps[activeStep].description}</p>
            <div className="grid md:grid-cols-2 gap-3">
              {steps[activeStep].details.map((detail, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                  <span className="text-sm">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center space-x-2">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => handleStepClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeStep === index
                ? 'bg-purple-500 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">80%</div>
          <div className="text-sm text-gray-600">收益回饋用戶</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">1</div>
          <div className="text-sm text-gray-600">日限量 NFT</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">8-15</div>
          <div className="text-sm text-gray-600">隨機彩票獎勵</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">25x</div>
          <div className="text-sm text-gray-600">傳說級獎勵倍數</div>
        </div>
      </div>
    </div>
  );
};

export default ValueCycleVisualization;