# Successful Patterns

> Code patterns and approaches that have worked well. Reference before implementing similar features.

---

## Project Setup

### Vite + React + Solana (2026 Stack)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@solana/web3.js": "^1.91.0",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.34",
    "@solana/wallet-adapter-wallets": "^0.19.24"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.1",
    "vite": "^4.5.0",
    "vite-plugin-node-polyfills": "^0.17.0",
    "tailwindcss": "^3.3.5"
  }
}
```

### Wallet Provider Setup
```jsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]

function App() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Your app */}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

---

## API Integration

### Server-Side API Proxy (Vite Middleware)
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api/grok': {
        target: 'https://api.x.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/grok/, '/v1/chat/completions'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${process.env.XAI_API_KEY}`)
          })
        }
      }
    }
  }
})
```

### Jupiter Swap Quote
```javascript
async function getSwapQuote(inputMint, outputMint, amount) {
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`
  )
  return response.json()
}
```

---

## UI Patterns

### Loading State with Skeleton
```jsx
function TokenCard({ loading, token }) {
  if (loading) {
    return <div className="animate-pulse bg-gray-700 rounded-xl h-32" />
  }
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      {/* Token content */}
    </div>
  )
}
```

### Error Boundary for 3D
```jsx
class Scene3DErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-center p-8">3D rendering unavailable</div>
    }
    return this.props.children
  }
}
```

---

## Three.js / 3D

### Basic Scene Setup
```jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Scene() {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      {/* Your 3D objects */}
    </Canvas>
  )
}
```

### Animated Token Sphere
```jsx
function TokenSphere({ position, color, scale = 1 }) {
  const meshRef = useRef()

  useFrame((state) => {
    meshRef.current.rotation.y += 0.01
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}
```

---

## Telegram Communication

### Safe Message Sending
```javascript
const SECRET_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]{20,}/g,
  /xai-[a-zA-Z0-9_-]{20,}/g,
  /ghp_[A-Za-z0-9_]{36,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
]

function maskSecrets(text) {
  let masked = String(text)
  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, (match) =>
      match.slice(0, 4) + '****' + match.slice(-4)
    )
  }
  return masked
}

// Always use before sending
await telegram.sendMessage(chatId, maskSecrets(message))
```

---

## Testing / Review

### UX Review Flow
```javascript
async function reviewAndIterate() {
  // 1. Ensure server is running
  await ensureDevServer()

  // 2. Take screenshot
  const screenshot = await takeScreenshot()

  // 3. Run review
  const review = await reviewUX()

  // 4. Check hard metrics
  if (!review.stage1.passed) {
    // Fix issues, don't request approval
    return { canApprove: false, issues: review.stage1.errors }
  }

  // 5. Check score
  if (review.combinedScore >= 90) {
    return { canApprove: true, score: review.combinedScore }
  }

  return { canApprove: false, score: review.combinedScore }
}
```

---

<!-- Add new patterns above this line -->
