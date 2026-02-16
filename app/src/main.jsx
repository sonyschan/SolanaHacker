import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/morandi-theme.css'
import App from './App.jsx'
import { SolanaWalletProvider } from './components/SolanaWalletProvider'
import { ThemeProvider } from './components/ThemeProvider'
import ErrorBoundary from './ErrorBoundary'

console.log('MemeForge: main.jsx loaded');

// Mark app as loaded to hide loading screen
document.documentElement.classList.add('app-loaded');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <SolanaWalletProvider>
          <App />
        </SolanaWalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
