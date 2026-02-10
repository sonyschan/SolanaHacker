import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ValuePropositionBanner from './ValuePropositionBanner';
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
  StarIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon
} from '@heroicons/react/24/outline';

const FinalImprovedValueCycleDashboard = () => {
  const { connected, publicKey } = useWallet();
  const [currentStep, setCurrentStep] = useState(1); // Start at voting step
  const [prizePool, setPrizePool] = useState(12.7);
  const [userTickets, setUserTickets] = useState(connected ? 127 : 0);
  const [userContribution, setUserContribution] = useState(connected ? 0.8 : 0);
  const [currentMeme, setCurrentMeme] = useState({
    id: 1,
    title: "當你發現 SOL 漲了 20%",
    image: "/api/placeholder/300/300",
    votes: 1247,
    likes: 892,
    dislikes: 355,
    timeLeft: "2小時 15分",
    rarity: "Epic",
    rarityColor: "from-purple-500 to-violet-600"
  });
  const [userVoted, setUserVoted] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState('');
  const [recentTickets, setRecentTickets] = useState(0);

  // Auto-rotate through cycle steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = (voteType) => {
    if (!connected) {
      alert('請先連接錢包！');
      return;
    }

    if (userVoted) {
      return; // Prevent double voting
    }

    const newTickets = Math.floor(Math.random() * 8) + 8; // 8-15 tickets
    setRecentTickets(newTickets);
    setVoteAnimation(voteType);
    setUserVoted(true);
    
    // Update ticket count
    setUserTickets(prev => prev + newTickets);
    
    // Update vote count
    setCurrentMeme(prev => ({
      ...prev,
      votes: prev.votes + 1,
      likes: voteType === 'like' ? prev.likes + 1 : prev.likes,
      dislikes: voteType === 'dislike' ? prev.dislikes + 1 : prev.dislikes
    }));

    // Clear animation after 3 seconds
    setTimeout(() => {
      setVoteAnimation('');
    }, 3000);
  };

  const cycleSteps = [
    {
      id: 'generate',
      title: 'AI 生成 Meme',
      icon: SparklesIcon,
      description: 'AI 創造獨特的 Meme 內容',
      color: 'from-blue-400 to-cyan-500',
      status: '自動進行中'
    },
    {
      id: 'vote',
      title: '用戶投票',
      icon: HeartIcon,
      description: '每次投票獲得 8-15 張彩票',
      color: 'from-pink-400 to-rose-500',
      status: connected ? (userVoted ? '✓ 已投票' : '🎯 立即投票') : '需要連接錢包'
    },
    {
      id: 'rarity',
      title: '決定稀有度',
      icon: StarIcon,
      description: '投票共識決定 Meme 稀有等級',
      color: 'from-yellow-400 to-orange-500',
      status: '24小時後確定'
    },
    {
      id: 'nft',
      title: '鑄造 NFT',
      icon: TrophyIcon,
      description: '高稀有度 Meme 成為 NFT',
      color: 'from-purple-400 to-violet-500',
      status: '稀有度 ≥ Rare'
    },
    {
      id: 'auction',
      title: '競標拍賣',
      icon: BuildingStorefrontIcon,
      description: '收益進入獎池',
      color: 'from-green-400 to-emerald-500',
      status: '3天拍賣期'
    },
    {
      id: 'reward',
      title: '分配獎勵',
      icon: GiftIcon,
      description: '週日開獎回饋用戶',
      color: 'from-indigo-400 to-purple-500',
      status: '週日 8PM UTC'
    }
  ];

  const rarityLevels = [
    { name: 'Common', percentage: 45, color: 'bg-gray-500', reward: '0.1x', description: '基礎獎勵' },
    { name: 'Uncommon', percentage: 30, color: 'bg-green-500', reward: '0.3x', description: '不錯的獎勵' },
    { name: 'Rare', percentage: 15, color: 'bg-blue-500', reward: '0.8x', description: '很好的獎勵' },
    { name: 'Epic', percentage: 8, color: 'bg-purple-500', reward: '2.0x', description: '高額獎勵' },
    { name: 'Legendary', percentage: 2, color: 'bg-yellow-500', reward: '5.0x', description: '頂級獎勵' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Wallet Connection */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              🔄 MemeForge
            </h1>
            <p className="text-gray-300 text-lg">投票免費，獎勵真實 • 民主決定 NFT 稀有度</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 !rounded-xl !font-semibold !px-6 !py-3 !text-white" />
            {connected && (
              <div className="text-center md:text-right">
                <p className="text-purple-300 text-sm">你的彩票</p>
                <p className="text-2xl font-bold text-yellow-400">{userTickets}</p>
                <p className="text-gray-400 text-xs">中獎機率 39.2%</p>
              </div>
            )}
          </div>
        </div>

        {/* Value Proposition Banner */}
        <ValuePropositionBanner connected={connected} userTickets={userTickets} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          
          {/* Current Voting - Main Feature */}
          <div className="xl:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-center mb-6">
              <FireIcon className="w-8 h-8 text-orange-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">🔥 熱門投票中</h2>
              <div className="ml-4 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 text-sm font-semibold animate-pulse">
                LIVE
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 mb-6">
              {/* Meme Display */}
              <div className="text-center mb-6">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4 shadow-2xl">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">🚀</div>
                    <div className="text-sm leading-tight">
                      Meme #{currentMeme.id}
                      <br />
                      <span className="text-purple-200">"{currentMeme.title}"</span>
                    </div>
                  </div>
                </div>
                
                {/* Vote Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">總投票</p>
                    <p className="text-2xl font-bold text-white">{currentMeme.votes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">👍 喜歡</p>
                    <p className="text-xl font-bold text-green-400">{currentMeme.likes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">👎 不喜歡</p>
                    <p className="text-xl font-bold text-red-400">{currentMeme.dislikes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">剩餘時間</p>
                    <p className="text-lg font-bold text-yellow-400 flex items-center justify-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {currentMeme.timeLeft}
                    </p>
                  </div>
                </div>
                
                {/* Current Rarity Prediction */}
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <p className="text-gray-300 text-sm mb-2">根據當前投票預測稀有度：</p>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`px-4 py-2 rounded-full bg-gradient-to-r ${currentMeme.rarityColor} text-white font-bold`}>
                      {currentMeme.rarity}
                    </span>
                    <span className="text-gray-300 text-sm">
                      (獎勵倍率: 2.0x)
                    </span>
                  </div>
                </div>
              </div>

              {/* Voting Section */}
              {!userVoted ? (
                <div>
                  <p className="text-center text-gray-300 mb-4">
                    💰 投票完全免費，每次獲得 8-15 張彩票參與 SOL 獎池抽獎
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <button 
                      onClick={() => handleVote('like')}
                      disabled={!connected}
                      className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        connected 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <HandThumbUpIcon className="w-6 h-6 mr-2" />
                      喜歡這個 Meme
                      <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
                        +彩票
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => handleVote('dislike')}
                      disabled={!connected}
                      className={`flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        connected 
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <HandThumbDownIcon className="w-6 h-6 mr-2" />
                      不喜歡
                      <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
                        +彩票
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`inline-flex items-center px-6 py-4 rounded-xl font-semibold text-lg mb-4 ${
                    voteAnimation === 'like' 
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400 animate-pulse' 
                      : voteAnimation === 'dislike'
                      ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse'
                      : 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                  }`}>
                    <CheckCircleIcon className="w-8 h-8 mr-3" />
                    <div className="text-left">
                      <p>投票成功！</p>
                      <p className="text-sm opacity-80">獲得 {recentTickets} 張彩票</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">✨ 24小時後查看最終稀有度結果</p>
                </div>
              )}

              {!connected && (
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 mt-4">
                  <p className="text-yellow-400 text-center font-semibold flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 mr-2" />
                    連接錢包開始投票，免費獲得 SOL 獎勵機會
                  </p>
                </div>
              )}
            </div>

            {/* User Stats for Connected Users */}
            {connected && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                  <TicketIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-400">{userTickets}</p>
                  <p className="text-gray-300 text-sm">總彩票數</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-400">{userContribution}</p>
                  <p className="text-gray-300 text-sm">SOL 貢獻值</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                  <TrophyIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-400">39.2%</p>
                  <p className="text-gray-300 text-sm">中獎機率</p>
                </div>
              </div>
            )}
          </div>

          {/* Value Cycle Flow */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">💫 價值循環流程</h2>
            
            <div className="space-y-3">
              {cycleSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === index;
                const isVotingStep = step.id === 'vote';
                const isCompleted = step.id === 'vote' && userVoted;
                
                return (
                  <div 
                    key={step.id} 
                    className={`relative p-4 rounded-xl border transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 scale-105' 
                        : isCompleted
                        ? 'bg-green-500/10 border-green-500/30'
                        : isVotingStep && connected && !userVoted
                        ? 'bg-yellow-500/10 border-yellow-500/30 animate-pulse'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                          : isCompleted
                          ? 'bg-green-500'
                          : isVotingStep && connected && !userVoted
                          ? 'bg-yellow-500'
                          : 'bg-white/10'
                      }`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${
                          isActive || isCompleted || (isVotingStep && connected) 
                            ? 'text-white' 
                            : 'text-gray-300'
                        }`}>
                          {step.title}
                        </p>
                        <p className={`text-xs ${
                          isActive 
                            ? 'text-purple-200' 
                            : isCompleted 
                            ? 'text-green-200'
                            : 'text-gray-400'
                        }`}>
                          {step.status}
                        </p>
                      </div>
                      
                      {isCompleted && (
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      )}
                      {isVotingStep && connected && !userVoted && (
                        <div className="text-yellow-400 font-bold text-xs animate-pulse">
                          🎯
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prize Pool Display */}
            <div className="mt-6 text-center p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
              <GiftIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 text-sm mb-1">當前獎池</p>
              <p className="text-4xl font-bold text-white mb-2">{prizePool} SOL</p>
              <div className="text-center text-xs text-gray-300">
                <p>下次開獎：週日 8PM UTC</p>
                <p>參與用戶：127 人</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rarity System Explanation */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">⭐ 稀有度系統：你的投票決定獎勵</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {rarityLevels.map((rarity, index) => (
              <div key={rarity.name} className="text-center group hover:scale-105 transition-transform">
                <div className="relative mb-4">
                  <div className={`w-20 h-20 mx-auto rounded-full ${rarity.color} flex items-center justify-center text-white font-bold relative overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <div className="text-center">
                      <div className="text-lg">{rarity.percentage}%</div>
                      <div className="text-xs opacity-75">機率</div>
                    </div>
                  </div>
                </div>
                <p className="text-white font-semibold">{rarity.name}</p>
                <p className="text-gray-400 text-xs mb-2">{rarity.description}</p>
                <div className={`inline-block px-3 py-1 rounded-full ${rarity.color} text-white text-sm font-bold`}>
                  獎勵 {rarity.reward}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-lg font-bold text-white mb-4 text-center">🎯 重點：投票即有機會獲得 SOL 獎勵</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <HeartIcon className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">免費投票</p>
                <p className="text-gray-300 text-sm">每次投票獲得彩票，完全免費參與</p>
              </div>
              <div className="p-4">
                <StarIcon className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">決定價值</p>
                <p className="text-gray-300 text-sm">你的投票決定 Meme 稀有度和 NFT 價值</p>
              </div>
              <div className="p-4">
                <CurrencyDollarIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">獲得 SOL</p>
                <p className="text-gray-300 text-sm">NFT 拍賣收益每週日分配給彩票持有者</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalImprovedValueCycleDashboard;