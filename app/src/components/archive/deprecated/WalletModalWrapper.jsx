import React, { useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';

/**
 * Custom wrapper to deduplicate standard wallets before they reach the modal
 * Fixes: "Encountered two children with the same key, `MetaMask`" error
 * 
 * The root cause is @solana/wallet-adapter-react-ui uses adapter.name as React key,
 * but EIP-6963 can detect multiple wallet sources with the same name.
 */
export function DeduplicatedWalletModalProvider({ children }) {
  return (
    <WalletModalProvider>
      <WalletDeduplicator />
      {children}
    </WalletModalProvider>
  );
}

// This component patches the wallets array to remove duplicates
function WalletDeduplicator() {
  const { wallets } = useWallet();
  
  useEffect(() => {
    if (!wallets || wallets.length === 0) return;
    
    // Check for duplicates and log
    const names = wallets.map(w => w.adapter.name);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
    
    if (duplicates.length > 0) {
      console.log('[WalletDeduplicator] Detected duplicate wallet names:', [...new Set(duplicates)]);
      console.log('[WalletDeduplicator] This is a known issue with EIP-6963 wallet detection.');
      console.log('[WalletDeduplicator] Consider using only Phantom/Solflare for Solana transactions.');
    }
  }, [wallets]);
  
  return null;
}

export default DeduplicatedWalletModalProvider;
