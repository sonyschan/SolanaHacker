import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Include specific polyfills for Node.js modules
      include: [
        'buffer', 
        'process', 
        'util',
        'events',
        'stream',
        'crypto',
        'string_decoder',
        'assert',
        'url',
        'http',
        'https',
        'os',
        'path',
        'querystring',
        'zlib'
      ],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Add globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  define: {
    global: 'globalThis',
    // Add require for compatibility
    'process.env': {},
  },
  resolve: {
    alias: {
      // Add Node.js polyfills
      events: 'events',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
      querystring: 'querystring-es3',
      _stream_transform: 'readable-stream/transform',
      _stream_readable: 'readable-stream/readable',
      _stream_writable: 'readable-stream/writable',
      _stream_duplex: 'readable-stream/duplex',
      _stream_passthrough: 'readable-stream/passthrough',
      zlib: 'browserify-zlib'
    }
  }
})