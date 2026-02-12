import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Add require polyfill for browser compatibility
if (typeof window !== 'undefined' && !window.require) {
  window.require = function(id) {
    if (id === 'buffer') return { Buffer: Buffer };
    if (id === 'process') return process;
    throw new Error(`Module not found: ${id}`);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)