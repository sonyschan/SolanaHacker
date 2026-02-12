import React from 'react';

// Base Skeleton component
export const Skeleton = ({ 
  width = "100%", 
  height = "1rem", 
  className = "",
  variant = "rectangular" // "rectangular", "circular", "text"
}) => {
  const baseClasses = "bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]";
  
  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4"
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Text loading skeleton
export const TextSkeleton = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i}
        height="1rem"
        width={i === lines - 1 ? "75%" : "100%"}
        variant="text"
      />
    ))}
  </div>
);

// Avatar loading skeleton
export const AvatarSkeleton = ({ size = 40, className = "" }) => (
  <Skeleton 
    width={size}
    height={size}
    variant="circular"
    className={className}
  />
);

// Button loading skeleton
export const ButtonSkeleton = ({ width = 100, height = 36, className = "" }) => (
  <Skeleton 
    width={width}
    height={height}
    className={`rounded-lg ${className}`}
  />
);

// Meme card skeleton
export const MemeCardSkeleton = () => (
  <div className="bg-gray-900 rounded-xl p-4 space-y-4 border border-gray-700/50">
    {/* Image area */}
    <Skeleton height="200px" className="rounded-lg" />
    
    {/* Title */}
    <div className="space-y-2">
      <Skeleton height="1.25rem" width="80%" />
      <Skeleton height="1rem" width="60%" />
    </div>
    
    {/* Statistics info */}
    <div className="flex justify-between items-center">
      <div className="flex space-x-2">
        <Skeleton width="30px" height="30px" variant="circular" />
        <Skeleton width="30px" height="30px" variant="circular" />
      </div>
      <Skeleton width="60px" height="24px" className="rounded-full" />
    </div>
    
    {/* Vote buttons */}
    <div className="flex space-x-2">
      <ButtonSkeleton width="48%" />
      <ButtonSkeleton width="48%" />
    </div>
  </div>
);

// Dashboard loading skeleton
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Title area */}
      <div className="mb-8">
        <Skeleton height="2.5rem" width="300px" className="mb-4" />
        <Skeleton height="1.25rem" width="500px" />
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <Skeleton width="40px" height="40px" variant="circular" />
              <Skeleton height="1rem" width="60px" />
            </div>
            <Skeleton height="2rem" width="80px" className="mb-2" />
            <Skeleton height="1rem" width="120px" />
          </div>
        ))}
      </div>
      
      {/* Meme grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <MemeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Wallet connection skeleton
export const WalletSkeleton = () => (
  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
    <div className="flex items-center space-x-4 mb-4">
      <AvatarSkeleton size={48} />
      <div className="flex-1">
        <Skeleton height="1.25rem" width="150px" className="mb-2" />
        <Skeleton height="1rem" width="200px" />
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton width="80px" height="1rem" />
        <Skeleton width="100px" height="1rem" />
      </div>
      <div className="flex justify-between">
        <Skeleton width="60px" height="1rem" />
        <Skeleton width="120px" height="1rem" />
      </div>
    </div>
    
    <div className="mt-6">
      <ButtonSkeleton width="100%" height="44px" />
    </div>
  </div>
);

// Table loading skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
    {/* Table header */}
    <div className="bg-gray-800/80 p-4 border-b border-gray-700/50">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="1rem" width="80px" />
        ))}
      </div>
    </div>
    
    {/* Table content */}
    <div className="divide-y divide-gray-700/50">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                height="1rem" 
                width={colIndex === 0 ? "120px" : "80px"} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Chat message skeleton
export const ChatMessageSkeleton = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`flex space-x-3 max-w-xs ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <AvatarSkeleton size={32} />
      <div className={`rounded-2xl p-3 ${isUser ? 'bg-blue-600/50' : 'bg-gray-700/50'}`}>
        <TextSkeleton lines={Math.floor(Math.random() * 3) + 1} />
      </div>
    </div>
  </div>
);

export default {
  Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  MemeCardSkeleton,
  DashboardSkeleton,
  WalletSkeleton,
  TableSkeleton,
  ChatMessageSkeleton
};