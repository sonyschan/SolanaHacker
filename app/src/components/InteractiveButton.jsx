import React from 'react';

const InteractiveButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all duration-200 transform active:scale-95 shadow-lg";
  
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-purple-600 
      hover:from-blue-700 hover:to-purple-700
      hover:shadow-xl hover:scale-105
      text-white border-2 border-transparent
      hover:border-blue-400/50
      disabled:from-gray-600 disabled:to-gray-700
      disabled:hover:scale-100 disabled:shadow-lg
      disabled:cursor-not-allowed
    `,
    secondary: `
      bg-gradient-to-r from-gray-700 to-gray-800 
      hover:from-gray-600 hover:to-gray-700
      hover:shadow-xl hover:scale-105
      text-white border-2 border-gray-600
      hover:border-purple-400/50
      disabled:from-gray-800 disabled:to-gray-900
      disabled:hover:scale-100 disabled:shadow-lg
      disabled:cursor-not-allowed
    `,
    success: `
      bg-gradient-to-r from-green-600 to-emerald-600 
      hover:from-green-700 hover:to-emerald-700
      hover:shadow-xl hover:scale-105
      text-white border-2 border-transparent
      hover:border-green-400/50
      disabled:from-gray-600 disabled:to-gray-700
      disabled:hover:scale-100 disabled:shadow-lg
      disabled:cursor-not-allowed
    `,
    warning: `
      bg-gradient-to-r from-yellow-500 to-orange-500 
      hover:from-yellow-600 hover:to-orange-600
      hover:shadow-xl hover:scale-105
      text-black border-2 border-transparent
      hover:border-yellow-400/70
      font-bold
      disabled:from-gray-600 disabled:to-gray-700
      disabled:hover:scale-100 disabled:shadow-lg
      disabled:cursor-not-allowed disabled:text-white
    `,
    outline: `
      bg-transparent border-2 border-blue-500
      hover:bg-blue-500/20 hover:border-blue-400
      hover:shadow-xl hover:scale-105
      text-blue-400 hover:text-blue-300
      disabled:border-gray-600 disabled:text-gray-400
      disabled:hover:bg-transparent disabled:hover:scale-100
      disabled:cursor-not-allowed
    `
  };

  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default InteractiveButton;