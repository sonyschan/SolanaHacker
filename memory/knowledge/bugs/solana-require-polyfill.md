# Bug: require is not defined in browser when using Solana wallet l

**Error**: `require is not defined in browser when using Solana wallet libraries`

**Context**: Occurs when loading Solana wallet components in React app built with Vite

**Root Cause**: Solana wallet adapter libraries use Node.js-style require() which is not available in browser environment

**Solution**:
Add comprehensive polyfills in vite.config.js and global require function in index.html. Also ensure nodePolyfills plugin is properly configured with all necessary modules.

**Prevention**: Always include node polyfills plugin and configure proper aliases when working with Solana/Web3 libraries in browser environment
