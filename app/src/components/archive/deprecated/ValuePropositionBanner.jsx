import React, { useState } from 'react';
import { 
  SparklesIcon, 
  HeartIcon, 
  CurrencyDollarIcon,
  TicketIcon,
  InformationCircleIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const ValuePropositionBanner = ({ connected, userTickets }) => {
  const [showDetails, setShowDetails] = useState(false);

  const steps = [
    {
      icon: HeartIcon,
      title: '免費投票',
      description: '為你喜歡的 Meme 投票',
      color: 'text-pink-400'
    },
    {
      icon: TicketIcon,
      title: '獲得彩票',
      description: '每次投票獲得 8-15 張彩票',
      color: 'text-purple-400'
    },
    {
      icon: SparklesIcon,
      title: '決定稀有度',
      description: '投票決定 Meme 是否成為 NFT',
      color: 'text-yellow-400'
    },
    {
      icon: CurrencyDollarIcon,
      title: '分享獎池',
      description: 'NFT 拍賣收益週日分配',
      color: 'text-green-400'
    }
  ];

  if (!connected) {
    return (
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-purple-400 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-white">🎯 開始你的 MemeForge 之旅</h2>
              <p className="text-purple-200">投票賺取 SOL，完全免費參與！</p>
            </div>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-purple-300 hover:text-white transition-colors"
          >
            <InformationCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-purple-500/30">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-white/10 rounded-full mr-2">
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <p className="text-white font-semibold text-sm">{step.title}</p>
                <p className="text-gray-300 text-xs">{step.description}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
          <div className="flex items-center justify-center">
            <CurrencyDollarIcon className="w-6 h-6 text-yellow-400 mr-2" />
            <div className="text-center">
              <p className="text-yellow-400 font-semibold">當前獎池：12.7 SOL</p>
              <p className="text-gray-300 text-sm">下次開獎：週日 8PM UTC • 連接錢包即可參與</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For connected users, show a smaller success banner
  return (
    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <TicketIcon className="w-6 h-6 text-green-400 mr-3" />
          <div>
            <p className="text-green-400 font-semibold">
              🎉 歡迎回來！你有 {userTickets} 張彩票
            </p>
            <p className="text-green-200 text-sm">繼續投票獲得更多彩票，增加中獎機會！</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-green-400 text-sm">中獎機率</p>
          <p className="text-2xl font-bold text-white">39.2%</p>
        </div>
      </div>
    </div>
  );
};

export default ValuePropositionBanner;