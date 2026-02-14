import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SolanaWalletProvider } from './components/SolanaWalletProvider'
import ErrorBoundary from './ErrorBoundary'

console.log('AI MemeForge: main.jsx loaded');

// Mark app as loaded to hide loading screen
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
