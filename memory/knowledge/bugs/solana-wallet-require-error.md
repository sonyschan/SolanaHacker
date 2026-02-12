# Bug: require is not defined

**Error**: `require is not defined`

**Context**: Solana wallet adapter in Vite React project causing browser 'require is not defined' error

**Root Cause**: Solana wallet adapters use Node.js modules that don't work in browser without polyfills

**Solution**:
Need to configure Vite with proper Node.js polyfills for Solana wallet adapters. Install buffer and process, then configure vite.config.js with nodePolyfills plugin including buffer, process, util globals.

**Prevention**: Always add Node.js polyfills when using Solana wallet adapters in Vite projects
