import React, { useMemo, useState, useEffect } from 'react';

// Lazy load wallet adapters to catch import errors
let ConnectionProvider, WalletProvider, WalletModalProvider;
let PhantomWalletAdapter, SolflareWalletAdapter;
let clusterApiUrl;

export const SolanaWalletProvider = ({ children }) => {
    const [walletReady, setWalletReady] = useState(false);
    const [walletError, setWalletError] = useState(null);

    useEffect(() => {
        const loadWalletDeps = async () => {
            try {
                console.log('Loading wallet dependencies...');
                
                const reactModule = await import('@solana/wallet-adapter-react');
                ConnectionProvider = reactModule.ConnectionProvider;
                WalletProvider = reactModule.WalletProvider;
                
                const uiModule = await import('@solana/wallet-adapter-react-ui');
                WalletModalProvider = uiModule.WalletModalProvider;
                
                const walletsModule = await import('@solana/wallet-adapter-wallets');
                PhantomWalletAdapter = walletsModule.PhantomWalletAdapter;
                SolflareWalletAdapter = walletsModule.SolflareWalletAdapter;
                
                const web3Module = await import('@solana/web3.js');
                clusterApiUrl = web3Module.clusterApiUrl;
                
                // Import CSS
                await import('@solana/wallet-adapter-react-ui/styles.css');
                
                console.log('Wallet dependencies loaded successfully');
                setWalletReady(true);
            } catch (error) {
                console.error('Failed to load wallet dependencies:', error);
                setWalletError(error.message);
            }
        };
        
        loadWalletDeps();
    }, []);

    // Show loading while wallet deps load
    if (!walletReady && !walletError) {
        return (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                Loading wallet...
            </div>
        );
    }

    // If wallet failed to load, render children without wallet context
    if (walletError) {
        console.warn('Wallet unavailable, running without wallet support:', walletError);
        return <>{children}</>;
    }

    // Wallet is ready, create providers
    const network = 'devnet';
    const endpoint = clusterApiUrl(network);
    const wallets = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaWalletProvider;
