import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './ErrorBoundary'

// Mark app as loading
console.log('MemeForge: main.jsx loaded');

// Simple test app without wallet
const TestApp = () => {
  console.log('MemeForge: TestApp rendering');
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #be185d 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️ MemeForge</h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>React is working!</p>
      <p style={{ marginTop: '2rem', opacity: 0.7 }}>
        Wallet integration temporarily disabled for debugging
      </p>
    </div>
  );
};

// Mark app as loaded to hide loading screen
document.documentElement.classList.add('app-loaded');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <TestApp />
    </ErrorBoundary>
  </StrictMode>,
)
