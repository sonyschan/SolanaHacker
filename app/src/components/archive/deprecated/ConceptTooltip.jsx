import React, { useState } from 'react';

const ConceptTooltip = ({ children, title, content, placement = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const placementClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help border-b border-dotted border-yellow-300 text-yellow-300">
        {children}
      </span>
      
      {isVisible && (
        <div className={`
          absolute z-50 ${placementClasses[placement]}
          w-80 max-w-sm p-4 
          bg-gray-900 border border-gray-600 rounded-xl shadow-2xl
          text-sm text-gray-200 leading-relaxed
        `}>
          <div className="font-bold text-yellow-300 mb-2">{title}</div>
          <div>{content}</div>
          
          {/* Arrow */}
          <div className={`
            absolute w-2 h-2 bg-gray-900 border-gray-600 transform rotate-45
            ${placement === 'bottom' ? '-top-1 left-4 border-t border-l' : ''}
            ${placement === 'top' ? '-bottom-1 left-4 border-b border-r' : ''}
            ${placement === 'right' ? '-left-1 top-4 border-t border-l' : ''}
            ${placement === 'left' ? '-right-1 top-4 border-b border-r' : ''}
          `} />
        </div>
      )}
    </div>
  );
};

export default ConceptTooltip;