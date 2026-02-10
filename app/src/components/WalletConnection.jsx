import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

const WalletConnection = ({ variant = 'primary', className = '', showAddress = true }) => {
    const { connected, connecting, publicKey, wallet } = useWallet();

    // Helper function to format wallet address
    const formatAddress = (pubKey) => {
        if (!pubKey) return '';
        const address = pubKey.toBase58();
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const buttonClasses = {
        primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 text-sm md:text-base',
        secondary: 'bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 font-semibold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all duration-300 text-sm md:text-base',
        ghost: 'text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-300 text-sm md:text-base'
    };

    if (connected && publicKey) {
        return (
            <div className={`flex items-center space-x-3 ${className}`}>
                {showAddress && (
                    <div className="hidden sm:flex items-center space-x-2 bg-gray-900/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-cyan-500/20">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-cyan-300 font-mono text-sm">
                            {formatAddress(publicKey)}
                        </span>
                        {wallet && (
                            <img 
                                src={wallet.adapter.icon} 
                                alt={wallet.adapter.name}
                                className="w-5 h-5 rounded"
                            />
                        )}
                    </div>
                )}
                <WalletDisconnectButton 
                    className={`${buttonClasses.secondary} wallet-adapter-button`}
                >
                    <span className="hidden sm:inline">登出錢包</span>
                    <span className="sm:hidden">登出</span>
                </WalletDisconnectButton>
            </div>
        );
    }

    return (
        <div className={className}>
            <WalletMultiButton 
                className={`${buttonClasses[variant]} wallet-adapter-button`}
            >
                {connecting ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>連接中...</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="whitespace-nowrap">
                            <span className="hidden sm:inline">連接錢包</span>
                            <span className="sm:hidden">連接</span>
                        </span>
                    </div>
                )}
            </WalletMultiButton>
        </div>
    );
};

// Custom hook for wallet utilities
export const useWalletConnection = () => {
    const wallet = useWallet();
    
    return {
        ...wallet,
        address: wallet.publicKey?.toBase58() || '',
        shortAddress: wallet.publicKey ? 
            `${wallet.publicKey.toBase58().slice(0, 6)}...${wallet.publicKey.toBase58().slice(-4)}` : 
            '',
        isConnected: wallet.connected,
        walletName: wallet.wallet?.adapter.name || '',
        walletIcon: wallet.wallet?.adapter.icon || ''
    };
};

export default WalletConnection;