import React, { useEffect } from 'react';

const MemeModal = ({ isOpen, onClose, meme }) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !meme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 max-w-4xl max-h-[90vh] mx-4 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden animate-in fade-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">{meme.title}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            {meme.votes && meme.votes.selection && (
              <span>{meme.votes.selection.yes + meme.votes.selection.no} votes</span>
            )}
            {meme.sentiment && (
              <span className={`px-2 py-1 rounded ${
                meme.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                meme.sentiment === 'Frustrated' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {typeof meme.sentiment === 'object' ? JSON.stringify(meme.sentiment) : meme.sentiment}
              </span>
            )}
          </div>
        </div>

        {/* Image Display */}
        <div className="p-6">
          <div className="flex justify-center">
            {meme.imageUrl ? (
              <img 
                src={meme.imageUrl} 
                alt={meme.title}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback display */}
            <div 
              className="flex-col items-center justify-center bg-gray-800/50 rounded-lg p-8 min-h-[300px] hidden"
              style={{ display: meme.imageUrl ? 'none' : 'flex' }}
            >
              <div className="text-8xl mb-4">{meme.image}</div>
              <p className="text-gray-400">Click anywhere outside to close</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        {meme.source && (
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs text-gray-400">Source: {meme.source}</p>
            </div>
          </div>
        )}

        {/* Helper Text */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Press ESC or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemeModal;