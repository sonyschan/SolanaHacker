import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SolanaWalletProvider } from './components/SolanaWalletProvider'
import ErrorBoundary from './ErrorBoundary'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

// Mark app as loaded
document.documentElement.classList.add('app-loaded');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SolanaWalletProvider>
        <App />
      </SolanaWalletProvider>
    </ErrorBoundary>
  </StrictMode>,
)
