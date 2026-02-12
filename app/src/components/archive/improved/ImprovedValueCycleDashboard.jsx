import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
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
  ClockIcon
} from '@heroicons/react/24/outline';

const ImprovedValueCycleDashboard = () => {
  const { connected, publicKey } = useWallet();
  const [currentStep, setCurrentStep] = useState(0);
  const [prizePool, setPrizePool] = useState(12.7);
  const [userTickets, setUserTickets] = useState(connected ? 127 : 0);
  const [userContribution, setUserContribution] = useState(connected ? 0.8 : 0);
  const [currentMeme, setCurrentMeme] = useState({
    id: 1,
    title: "當你發現 SOL 漲了 20%",
    image: "/api/placeholder/300/300",
    votes: 1247,
    timeLeft: "2小時 15分",
    rarity: "Epic",
    rarityColor: "from-purple-500 to-violet-600"
  });
  const [userVoted, setUserVoted] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState(false);

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

    setVoteAnimation(true);
    setUserVoted(true);
    
    // Simulate getting tickets
    const newTickets = Math.floor(Math.random() * 8) + 8; // 8-15 tickets
    setUserTickets(prev => prev + newTickets);
    
    // Update vote count
    setCurrentMeme(prev => ({
      ...prev,
      votes: prev.votes + 1
    }));

    setTimeout(() => {
      setVoteAnimation(false);
    }, 2000);
  };

  const cycleSteps = [
    {
      id: 'generate',
      title: 'AI 生成 Meme',
      icon: SparklesIcon,
      description: 'AI 創造獨特的 Meme 內容',
      color: 'from-blue-400 to-cyan-500',
      position: { x: 50, y: 20 },
      action: '系統自動生成'
    },
    {
      id: 'vote',
      title: '用戶投票',
      icon: HeartIcon,
      description: '每次投票獲得 8-15 張彩票',
      color: 'from-pink-400 to-rose-500',
      position: { x: 80, y: 40 },
      action: '🎯 你在這裡！'
    },
    {
      id: 'rarity',
      title: '決定稀有度',
      icon: StarIcon,
      description: '投票共識決定 Meme 稀有等級',
      color: 'from-yellow-400 to-orange-500',
      position: { x: 80, y: 60 },
      action: '24小時後確定'
    },
    {
      id: 'nft',
      title: '鑄造 NFT',
      icon: TrophyIcon,
      description: '高稀有度 Meme 成為 NFT',
      color: 'from-purple-400 to-violet-500',
      position: { x: 50, y: 80 },
      action: '稀有度 ≥ Rare'
    },
    {
      id: 'auction',
      title: '競標拍賣',
      icon: BuildingStorefrontIcon,
      description: '收益進入獎池',
      color: 'from-green-400 to-emerald-500',
      position: { x: 20, y: 60 },
      action: '3天拍賣期'
    },
    {
      id: 'reward',
      title: '分配獎勵',
      icon: GiftIcon,
      description: '週日開獎回饋用戶',
      color: 'from-indigo-400 to-purple-500',
      position: { x: 20, y: 40 },
      action: '週日 8PM UTC'
    }
  ];

  const rarityLevels = [
    { name: 'Common', percentage: 45, color: 'bg-gray-500', reward: '0.1x', ticketValue: '低價值' },
    { name: 'Uncommon', percentage: 30, color: 'bg-green-500', reward: '0.3x', ticketValue: '一般價值' },
    { name: 'Rare', percentage: 15, color: 'bg-blue-500', reward: '0.8x', ticketValue: '中等價值' },
    { name: 'Epic', percentage: 8, color: 'bg-purple-500', reward: '2.0x', ticketValue: '高價值' },
    { name: 'Legendary', percentage: 2, color: 'bg-yellow-500', reward: '5.0x', ticketValue: '極高價值' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Wallet Connection */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              🔄 MemeForge
            </h1>
            <p className="text-gray-300 text-lg">投票 → 獲得彩票 → 分享獎池</p>
          </div>
          
          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 !rounded-xl !font-semibold !px-6 !py-3" />
            {connected && (
              <div className="text-right">
                <p className="text-purple-300 text-sm">你的彩票</p>
                <p className="text-2xl font-bold text-yellow-400">{userTickets}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Current Voting - Main Feature */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">🎯 當前投票</h2>
            
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 mb-6">
              <div className="text-center mb-4">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg font-bold mb-4">
                  Meme #{currentMeme.id}
                  <br />
                  "{currentMeme.title}"
                </div>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">當前投票</p>
                    <p className="text-2xl font-bold text-white">{currentMeme.votes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">預估稀有度</p>
                    <span className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${currentMeme.rarityColor} text-white font-bold`}>
                      {currentMeme.rarity}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">剩餘時間</p>
                    <p className="text-xl font-bold text-yellow-400 flex items-center">
                      <ClockIcon className="w-5 h-5 mr-1" />
                      {currentMeme.timeLeft}
                    </p>
                  </div>
                </div>
              </div>

              {/* Voting Buttons */}
              {!userVoted ? (
                <div className="flex justify-center space-x-6">
                  <button 
                    onClick={() => handleVote('like')}
                    disabled={!connected}
                    className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      connected 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <HeartIcon className="w-6 h-6 mr-2" />
                    喜歡 (+8-15 票)
                  </button>
                  
                  <button 
                    onClick={() => handleVote('dislike')}
                    disabled={!connected}
                    className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      connected 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <StarIcon className="w-6 h-6 mr-2" />
                    不喜歡 (+8-15 票)
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`inline-flex items-center px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 font-semibold ${voteAnimation ? 'animate-pulse' : ''}`}>
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    投票完成！獲得 {Math.floor(Math.random() * 8) + 8} 張彩票
                  </div>
                  <p className="text-gray-300 text-sm mt-2">24小時後可查看結果</p>
                </div>
              )}

              {!connected && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-4">
                  <p className="text-yellow-400 text-center font-semibold">
                    ⚠️ 請連接錢包以開始投票和獲得彩票
                  </p>
                </div>
              )}
            </div>

            {/* Your Impact */}
            {connected && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">📊 你的投票影響力</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{userTickets}</p>
                    <p className="text-gray-300 text-sm">總彩票數</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{userContribution} SOL</p>
                    <p className="text-gray-300 text-sm">貢獻價值</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">39.2%</p>
                    <p className="text-gray-300 text-sm">中獎機率</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Value Cycle - Simplified */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">💫 價值循環</h2>
            
            {/* Simplified flow */}
            <div className="space-y-4">
              {cycleSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === index;
                const isVotingStep = step.id === 'vote';
                
                return (
                  <div 
                    key={step.id} 
                    className={`relative p-4 rounded-xl border transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 transform scale-105' 
                        : isVotingStep && connected
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-4 ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                          : isVotingStep && connected
                          ? 'bg-green-500'
                          : 'bg-white/10'
                      }`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-semibold ${isActive || (isVotingStep && connected) ? 'text-white' : 'text-gray-300'}`}>
                          {step.title}
                        </p>
                        <p className={`text-sm ${isActive ? 'text-purple-200' : 'text-gray-400'}`}>
                          {step.action}
                        </p>
                      </div>
                      
                      {isVotingStep && connected && (
                        <div className="text-green-400 font-bold text-sm">
                          🎯 進行中
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prize Pool */}
            <div className="mt-6 text-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">當前獎池</p>
              <p className="text-3xl font-bold text-white">{prizePool} SOL</p>
              <p className="text-gray-300 text-xs mt-1">下次開獎：週日 8PM UTC</p>
            </div>
          </div>
        </div>

        {/* Rarity Explanation - Interactive */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">⭐ 為什麼投票很重要？</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {rarityLevels.map((rarity, index) => (
              <div key={rarity.name} className="text-center">
                <div className="relative mb-3">
                  <div className={`w-16 h-16 mx-auto rounded-full ${rarity.color} flex items-center justify-center text-white font-bold text-sm relative`}>
                    {rarity.percentage}%
                  </div>
                </div>
                <p className="text-white font-semibold text-sm">{rarity.name}</p>
                <p className="text-gray-400 text-xs mb-2">{rarity.ticketValue}</p>
                <div className={`inline-block px-2 py-1 rounded-full ${rarity.color} text-white text-xs font-bold`}>
                  獎勵 {rarity.reward}
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
            <h3 className="text-lg font-bold text-white mb-3 text-center">🔄 你的投票如何創造價值</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <HeartIcon className="w-12 h-12 text-pink-400 mx-auto mb-2" />
                <p className="text-white font-semibold">1. 你投票</p>
                <p className="text-gray-300 text-sm">獲得彩票參與抽獎</p>
              </div>
              <div className="p-4">
                <TrophyIcon className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-semibold">2. 決定稀有度</p>
                <p className="text-gray-300 text-sm">投票共識影響 NFT 價值</p>
              </div>
              <div className="p-4">
                <CurrencyDollarIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold">3. 分享獎池</p>
                <p className="text-gray-300 text-sm">NFT 拍賣收益回饋給你</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedValueCycleDashboard;