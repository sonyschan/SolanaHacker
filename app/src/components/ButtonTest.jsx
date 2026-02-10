import React from 'react';

const ButtonTest = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-white">Button Visibility Test</h1>
        
        <div className="space-y-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg">
            Test Button 1
          </button>
          
          <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg">
            Test Button 2
          </button>
          
          <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
            Connect Wallet
          </button>
          
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg">
            Start Voting
          </button>
        </div>
      </div>
    </div>
  );
};

export default ButtonTest;