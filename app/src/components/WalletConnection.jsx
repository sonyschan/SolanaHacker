import React from "react";
import { useAuth } from "../hooks/useAuth";

const WalletConnection = ({ variant = "primary", className = "", showAddress = true }) => {
    const { authenticated, walletAddress, shortAddress, walletName, login, logout } = useAuth();

    const buttonClasses = {
        primary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 text-sm md:text-base",
        secondary: "bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 font-semibold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all duration-300 text-sm md:text-base",
        ghost: "text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-300 text-sm md:text-base"
    };

    if (authenticated && walletAddress) {
        return (
            <div className={`flex items-center space-x-3 ${className}`}>
                {showAddress && (
                    <div className="hidden sm:flex items-center space-x-2 bg-gray-900/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-cyan-500/20">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-cyan-300 font-mono text-sm">
                            {shortAddress}
                        </span>
                    </div>
                )}
                <button
                    onClick={logout}
                    className={buttonClasses.secondary}
                >
                    <span className="hidden sm:inline">Disconnect</span>
                    <span className="sm:hidden">Logout</span>
                </button>
            </div>
        );
    }

    return (
        <div className={className}>
            <button
                onClick={login}
                className={buttonClasses[variant]}
            >
                <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="whitespace-nowrap">
                        <span className="hidden sm:inline">Sign In</span>
                        <span className="sm:hidden">Sign In</span>
                    </span>
                </div>
            </button>
        </div>
    );
};

export default WalletConnection;
