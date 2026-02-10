import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const SolanaWalletButton = ({ 
    children = 'Connect Wallet', 
    className = '',
    variant = 'primary',
    showAddress = false 
}) => {
    const { connected, publicKey } = useWallet();

    // Helper function to format wallet address
    const formatAddress = (pubKey) => {
        if (!pubKey) return '';
        const address = pubKey.toBase58();
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const buttonClasses = {
        primary: 'btn-primary-enhanced',
        secondary: 'btn-secondary-enhanced',
        ghost: 'btn-ghost-enhanced'
    };

    return (
        <div className="flex items-center space-x-3">
            {showAddress && connected && publicKey && (
                <div className="text-enhanced-medium text-sm font-mono">
                    {formatAddress(publicKey)}
                </div>
            )}
            <WalletMultiButton 
                className={`${buttonClasses[variant]} ${className} wallet-adapter-button`}
                style={{}}
            >
                {connected ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Wallet Connected</span>
                    </div>
                ) : (
                    children
                )}
            </WalletMultiButton>
        </div>
    );
};

// Also export a custom hook for wallet access
export const useSolanaWallet = () => {
    const wallet = useWallet();
    
    return {
        ...wallet,
        address: wallet.publicKey?.toBase58() || '',
        shortAddress: wallet.publicKey ? 
            `${wallet.publicKey.toBase58().slice(0, 6)}...${wallet.publicKey.toBase58().slice(-4)}` : 
            ''
    };
};

export default SolanaWalletButton;