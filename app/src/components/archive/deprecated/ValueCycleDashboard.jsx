import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  HeartIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  TicketIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ChartBarIcon,
  GiftIcon,
  RocketLaunchIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const ValueCycleDashboard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [prizePool, setPrizePool] = useState(12.7);
  const [userTickets, setUserTickets] = useState(127);
  const [userContribution, setUserContribution] = useState(0.8);

  // Auto-rotate through cycle steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const cycleSteps = [
    {
      id: 'generate',
      title: 'AI 生成 Meme',
      icon: SparklesIcon,
      description: 'AI 創造獨特的 Meme 內容',
      color: 'from-blue-400 to-cyan-500',
      position: { x: 50, y: 20 }
    },
    {
      id: 'vote',
      title: '用戶投票',
      icon: HeartIcon,
      description: '每次投票獲得 8-15 張彩票',
      color: 'from-pink-400 to-rose-500',
      position: { x: 80, y: 40 }
    },
    {
      id: 'rarity',
      title: '決定稀有度',
      icon: StarIcon,
      description: '投票共識決定 Meme 稀有等級',
      color: 'from-yellow-400 to-orange-500',
      position: { x: 80, y: 60 }
    },
    {
      id: 'nft',
      title: '鑄造 NFT',
      icon: TrophyIcon,
      description: '高稀有度 Meme 成為 NFT',
      color: 'from-purple-400 to-violet-500',
      position: { x: 50, y: 80 }
    },
    {
      id: 'auction',
      title: '競標拍賣',
      icon: BuildingStorefrontIcon,
      description: '收益進入獎池',
      color: 'from-green-400 to-emerald-500',
      position: { x: 20, y: 60 }
    },
    {
      id: 'reward',
      title: '分配獎勵',
      icon: GiftIcon,
      description: '週日開獎回饋用戶',
      color: 'from-indigo-400 to-purple-500',
      position: { x: 20, y: 40 }
    }
  ];

  const rarityLevels = [
    { name: 'Common', percentage: 45, color: 'bg-gray-500', reward: '0.1x' },
    { name: 'Uncommon', percentage: 30, color: 'bg-green-500', reward: '0.3x' },
    { name: 'Rare', percentage: 15, color: 'bg-blue-500', reward: '0.8x' },
    { name: 'Epic', percentage: 8, color: 'bg-purple-500', reward: '2.0x' },
    { name: 'Legendary', percentage: 2, color: 'bg-yellow-500', reward: '5.0x' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            🔄 MemeForge 價值循環
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            了解你的投票如何創造價值：從 Meme 投票到 NFT 拍賣，再到 SOL 獎勵分配
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Value Cycle Visualization */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">💫 價值循環流程</h2>
            
            {/* Circular Flow Diagram */}
            <div className="relative aspect-square max-w-md mx-auto mb-8">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Connection lines */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                
                {cycleSteps.map((step, index) => {
                  const nextIndex = (index + 1) % cycleSteps.length;
                  const nextStep = cycleSteps[nextIndex];
                  return (
                    <line
                      key={`line-${index}`}
                      x1={step.position.x * 2}
                      y1={step.position.y * 2}
                      x2={nextStep.position.x * 2}
                      y2={nextStep.position.y * 2}
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      strokeOpacity={currentStep === index ? "1" : "0.3"}
                      className="transition-all duration-500"
                    />
                  );
                })}
                
                {/* Step nodes */}
                {cycleSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isActive = currentStep === index;
                  
                  return (
                    <g key={step.id}>
                      <circle
                        cx={step.position.x * 2}
                        cy={step.position.y * 2}
                        r={isActive ? "20" : "16"}
                        fill={isActive ? "url(#activeGradient)" : "rgba(255,255,255,0.1)"}
                        stroke={isActive ? "#a855f7" : "rgba(255,255,255,0.2)"}
                        strokeWidth="2"
                        className="transition-all duration-500"
                      />
                      <foreignObject
                        x={step.position.x * 2 - 12}
                        y={step.position.y * 2 - 12}
                        width="24"
                        height="24"
                      >
                        <IconComponent 
                          className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'} transition-colors duration-500`}
                        />
                      </foreignObject>
                    </g>
                  );
                })}
                
                {/* Active gradient definition */}
                <defs>
                  <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-black/40 backdrop-blur-sm rounded-full p-4 border border-purple-500/30">
                  <p className="text-2xl font-bold text-white">{prizePool}</p>
                  <p className="text-sm text-purple-300">SOL 獎池</p>
                </div>
              </div>
            </div>

            {/* Current Step Description */}
            <div className="text-center">
              <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${cycleSteps[currentStep].color} text-white font-semibold mb-2`}>
                <cycleSteps[currentStep].icon className="w-5 h-5 mr-2" />
                {cycleSteps[currentStep].title}
              </div>
              <p className="text-gray-300">{cycleSteps[currentStep].description}</p>
            </div>
          </div>

          {/* Live Stats & Personal Impact */}
          <div className="space-y-6">
            
            {/* Live Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 即時數據</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-8 h-8 text-yellow-400 mr-3" />
                    <div>
                      <p className="text-yellow-400 font-semibold">當前獎池</p>
                      <p className="text-2xl font-bold text-white">{prizePool} SOL</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm">↗ +2.3 SOL</p>
                    <p className="text-gray-400 text-xs">今日增長</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center mb-2">
                      <HeartIcon className="w-5 h-5 text-pink-400 mr-2" />
                      <p className="text-gray-300 text-sm">今日投票</p>
                    </div>
                    <p className="text-xl font-bold text-white">1,247</p>
                    <p className="text-green-400 text-xs">↗ +15.2%</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center mb-2">
                      <BuildingStorefrontIcon className="w-5 h-5 text-purple-400 mr-2" />
                      <p className="text-gray-300 text-sm">進行中拍賣</p>
                    </div>
                    <p className="text-xl font-bold text-white">8</p>
                    <p className="text-blue-400 text-xs">23 個競標</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Impact */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎯 你的貢獻</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <div>
                    <p className="text-purple-300 text-sm">你的投票</p>
                    <p className="text-2xl font-bold text-white">{userTickets}</p>
                  </div>
                  <div>
                    <p className="text-pink-300 text-sm">獲得彩票</p>
                    <p className="text-2xl font-bold text-white">1,340</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-gray-300 text-sm mb-2">對獎池的貢獻</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-green-400">{userContribution} SOL</p>
                    <p className="text-gray-400 text-sm">6.3% 總貢獻</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: '6.3%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rarity Distribution */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">⭐ 稀有度分佈與獎勵倍率</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {rarityLevels.map((rarity, index) => (
              <div key={rarity.name} className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 flex items-center justify-center relative overflow-hidden">
                    <div 
                      className={`absolute bottom-0 left-0 right-0 ${rarity.color} transition-all duration-1000`}
                      style={{ height: `${rarity.percentage * 2}%` }}
                    ></div>
                    <span className="relative z-10 text-white font-bold text-sm">{rarity.percentage}%</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{rarity.name}</p>
                  <p className="text-gray-400 text-xs mb-2">機率</p>
                  <div className={`inline-block px-2 py-1 rounded-full ${rarity.color} text-white text-xs font-bold`}>
                    {rarity.reward}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-300 text-sm mt-6">
            💡 投票共識度越高，Meme 稀有度越高，NFT 價值和獎勵倍率也越高
          </p>
        </div>

        {/* Next Draw Countdown */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 text-center">
          <CalendarDaysIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">🏆 下次開獎</h2>
          <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
            週日 8PM UTC
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">2</p>
              <p className="text-gray-300">天</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">14</p>
              <p className="text-gray-300">小時</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">32</p>
              <p className="text-gray-300">分鐘</p>
            </div>
          </div>
          <p className="text-gray-300 mt-4">
            🎫 總計 3,421 張彩票 • 127 位參與者 • 你的中獎機率：39.2%
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValueCycleDashboard;