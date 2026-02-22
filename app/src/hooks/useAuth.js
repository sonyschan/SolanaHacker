import { usePrivy, useWallets, useExportWallet } from '@privy-io/react-auth';

export function useAuth() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { exportWallet } = useExportWallet();

  // Derive walletAddress: prefer external Solana wallet, fall back to embedded/linked
  let walletAddress = null;
  let walletName = null;

  if (authenticated && user) {
    // 1. Check connected wallets for Solana type
    const solanaWallet = wallets.find(
      (w) => w.chainType === 'solana' || w.walletClientType === 'phantom' || w.walletClientType === 'solflare'
    );
    if (solanaWallet) {
      walletAddress = solanaWallet.address;
      walletName = solanaWallet.walletClientType || 'Solana Wallet';
    }

    // 2. Fall back to linked Solana wallet from user account
    if (!walletAddress) {
      const linkedSolana = user.linkedAccounts?.find(
        (a) => a.type === 'wallet' && a.chainType === 'solana'
      );
      if (linkedSolana) {
        walletAddress = linkedSolana.address;
        walletName = linkedSolana.walletClientType || 'Embedded Wallet';
      }
    }
  }

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  const isGoogleUser = user?.linkedAccounts?.some((a) => a.type === 'google_oauth') || false;

  // Check linkedAccounts only (wallets array can give false positives)
  const hasEmbeddedWallet = user?.linkedAccounts?.some(
    (a) => a.type === 'wallet' && a.walletClientType === 'privy'
  ) || false;

  return {
    ready,
    authenticated,
    walletAddress,
    walletName,
    shortAddress,
    isGoogleUser,
    hasEmbeddedWallet,
    exportWallet,
    login,
    logout,
    user,
  };
}

export default useAuth;
