import { PrivyProvider } from '@privy-io/react-auth';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmlx57eat01ao0cjlud2vorx8';

export const PrivyAuthProvider = ({ children }) => {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#06B6D4',
          logo: '/images/logo-48.png',
        },
        loginMethods: ['google', 'twitter', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        solanaClusters: [
          { name: 'devnet', rpcUrl: 'https://api.devnet.solana.com' },
        ],
        externalWallets: {
          solana: {
            connectors: ['phantom', 'solflare'],
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};

export default PrivyAuthProvider;
