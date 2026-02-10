import React, { useState, useEffect } from 'react';

const RewardToast = ({ show, ticketAmount, onComplete }) => {
  const [animate, setAnimate] = useState(false);
  const [phase, setPhase] = useState('enter'); // enter, float, exit

  useEffect(() => {
    if (show) {
      // Start animation sequence
      setAnimate(true);
      setPhase('enter');
      
      // Float phase
      setTimeout(() => setPhase('float'), 200);
      
      // Exit phase
      setTimeout(() => setPhase('exit'), 1200);
      
      // Complete and hide
      setTimeout(() => {
        setAnimate(false);
        onComplete && onComplete();
      }, 1800);
    }
  }, [show, onComplete]);

  if (!show && !animate) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div 
        className={`
          relative flex items-center justify-center bg-gradient-to-r from-yellow-500/90 to-orange-500/90 
          backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl px-4 py-2 shadow-2xl
          transition-all duration-300 ease-out
          ${phase === 'enter' ? 'scale-0 opacity-0 translate-y-4' : ''}
          ${phase === 'float' ? 'scale-110 opacity-100 translate-y-0' : ''}
          ${phase === 'exit' ? 'scale-75 opacity-0 -translate-y-8' : ''}
        `}
      >
        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-1 h-1 bg-white rounded-full opacity-0
                ${phase === 'float' ? 'animate-ping' : ''}
              `}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i % 2) * 70}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '800ms'
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="flex items-center space-x-3 relative z-10">
          {/* Animated lottery ticket icon */}
          <div className={`
            text-2xl transition-transform duration-500
            ${phase === 'float' ? 'rotate-12 scale-125' : 'rotate-0 scale-100'}
          `}>
            🎫
          </div>
          
          {/* Text content */}
          <div className="text-white font-bold">
            <div className="text-lg leading-none">
              +{ticketAmount} Ticket{ticketAmount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-yellow-100 opacity-90 leading-none mt-1">
              Added to jackpot pool
            </div>
          </div>
          
          {/* Floating coins animation */}
          <div className="relative">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute w-4 h-4 text-yellow-300 opacity-0
                  ${phase === 'float' ? 'animate-bounce' : ''}
                `}
                style={{
                  right: `-${20 + (i * 8)}px`,
                  top: `-${5 + (i * 3)}px`,
                  animationDelay: `${200 + (i * 150)}ms`,
                  animationDuration: '1000ms'
                }}
              >
                💰
              </div>
            ))}
          </div>
        </div>
        
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/30 to-orange-400/30 blur-xl
          transition-opacity duration-300
          ${phase === 'float' ? 'opacity-100' : 'opacity-50'}
        `} />
      </div>
    </div>
  );
};

// Hook for managing reward toasts
export const useRewardToast = () => {
  const [toasts, setToasts] = useState([]);

  const showReward = (ticketAmount) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ticketAmount, show: true }]);
  };

  const handleComplete = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <RewardToast
          key={toast.id}
          show={toast.show}
          ticketAmount={toast.ticketAmount}
          onComplete={() => handleComplete(toast.id)}
        />
      ))}
    </>
  );

  return { showReward, ToastContainer };
};

export default RewardToast;