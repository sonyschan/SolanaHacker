import React, { useState } from 'react';

const RarityExplanationTooltip = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-blue-400 hover:text-blue-300 text-sm underline cursor-help"
      >
        What makes a meme rare?
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl w-80 max-w-sm">
            <div className="text-sm space-y-3">
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🏆</span>
                  <span className="font-bold text-purple-300">Legendary</span>
                </div>
                <p className="text-gray-200 text-xs">
                  Extremely creative, original humor, perfect timing, makes you laugh out loud. 
                  Community consensus: "This is brilliant!"
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">💎</span>
                  <span className="font-bold text-blue-300">Rare</span>
                </div>
                <p className="text-gray-200 text-xs">
                  Good humor, relatable content, above average creativity. 
                  Community consensus: "This is pretty good!"
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">👍</span>
                  <span className="font-bold text-gray-300">Common</span>
                </div>
                <p className="text-gray-200 text-xs">
                  Standard meme quality, basic humor, nothing special. 
                  Community consensus: "It's okay, I guess."
                </p>
              </div>

              <div className="pt-2 border-t border-gray-600">
                <p className="text-xs text-gray-400">
                  <strong className="text-blue-300">Remember:</strong> Your honest opinion matters! 
                  Random rewards prevent strategic voting.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RarityExplanationTooltip;