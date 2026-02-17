import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { MobileWalletSelector, shouldShowMobileWalletSelector, isInsideWalletBrowser } from "./MobileWalletSelector";

const WalletConnection = ({ variant = "primary", className = "", showAddress = true }) => {
    const { connected, connecting, publicKey, wallet, select, wallets } = useWallet();
    const [showMobileSelector, setShowMobileSelector] = useState(false);
    const [isWalletBrowser, setIsWalletBrowser] = useState(false);

    // Check if we are inside a wallet browser on mount
    useEffect(() => {
        setIsWalletBrowser(isInsideWalletBrowser());
        
        // Log detection for debugging
        if (typeof window !== "undefined") {
            console.log("🔍 Wallet detection:", {
                phantom: !!window.phantom?.solana?.isPhantom,
                solflare: !!window.solflare?.isSolflare,
                okx: !!(window.okxwallet?.solana || window.okexchain),
                isInsideWallet: isInsideWalletBrowser(),
                availableWallets: wallets?.map(w => w.adapter.name) || []
            });
        }
    }, [wallets]);

    // Auto-select wallet if inside wallet browser and only one wallet available
    useEffect(() => {
        if (isWalletBrowser && !connected && !connecting && wallets?.length > 0) {
            // Find the detected wallet
            const detectedWallet = wallets.find(w => w.readyState === "Installed");
            if (detectedWallet) {
                console.log("🎯 Auto-selecting wallet:", detectedWallet.adapter.name);
            }
        }
    }, [isWalletBrowser, connected, connecting, wallets, select]);

    // Helper function to format wallet address
    const formatAddress = (pubKey) => {
        if (!pubKey) return "";
        const address = pubKey.toBase58();
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const buttonClasses = {
        primary: "btn-morandi-clay text-stone-100 font-semibold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all duration-500 shadow-morandi-clay text-sm md:text-base",
        secondary: "glass-morphism-morandi border text-stone-700 hover:bg-stone-200/30 font-semibold px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all duration-500 text-sm md:text-base",
        ghost: "text-stone-600 hover:text-stone-800 hover:bg-stone-200/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-500 text-sm md:text-base"
    };

    if (connected && publicKey) {
        return (
            <div className={`flex items-center space-x-3 ${className}`}>
                {showAddress && (
                    <div className="hidden sm:flex items-center space-x-2 glass-morphism-morandi px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--morandi-pale-green)' }}></div>
                        <span className="font-mono text-sm" style={{ color: 'var(--morandi-mushroom)' }}>
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
                    <span className="hidden sm:inline">Disconnect</span>
                    <span className="sm:hidden">Logout</span>
                </WalletDisconnectButton>
            </div>
        );
    }

    // On mobile but NOT inside wallet browser: show deep link selector
    if (shouldShowMobileWalletSelector()) {
        return (
            <div className={className}>
                <button
                    onClick={() => setShowMobileSelector(true)}
                    className={`${buttonClasses[variant]} wallet-adapter-button`}
                >
                    {connecting ? (
                        <div className="flex items-center space-x-2">
                            <div className="placeholder-button button-pulse w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(155, 136, 116, 0.5)' }}></div>
                            <span>Connecting...</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="whitespace-nowrap">
                                <span className="hidden sm:inline">Connect Wallet</span>
                                <span className="sm:hidden">Connect</span>
                            </span>
                        </div>
                    )}
                </button>

                <MobileWalletSelector
                    isOpen={showMobileSelector}
                    onClose={() => setShowMobileSelector(false)}
                />
            </div>
        );
    }

    // Desktop OR inside wallet in-app browser: use standard WalletMultiButton
    return (
        <div className={className}>
            <WalletMultiButton
                className={`${buttonClasses[variant]} wallet-adapter-button`}
            >
                {connecting ? (
                    <div className="flex items-center space-x-2">
                        <div className="placeholder-button button-pulse w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(155, 136, 116, 0.5)' }}></div>
                        <span>Connecting...</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="whitespace-nowrap">
                            <span className="hidden sm:inline">Connect Wallet</span>
                            <span className="sm:hidden">Connect</span>
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
        address: wallet.publicKey?.toBase58() || "",
        shortAddress: wallet.publicKey ?
            `${wallet.publicKey.toBase58().slice(0, 6)}...${wallet.publicKey.toBase58().slice(-4)}` :
            "",
        isConnected: wallet.connected,
        walletName: wallet.wallet?.adapter.name || "",
        walletIcon: wallet.wallet?.adapter.icon || ""
    };
};

export default WalletConnection;
