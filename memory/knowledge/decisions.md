# Architectural Decisions

> Record of key technical decisions and their rationale.

---

## Technology Choices

### Frontend: Vite + React (not Next.js)
**Date**: 2026-02-05
**Decision**: Use Vite with React instead of Next.js
**Rationale**:
- Simpler deployment (static files or simple dev server)
- No server-side rendering complexity needed
- Faster HMR during development
- Better compatibility with Three.js

### 3D Library: React Three Fiber
**Date**: 2026-02-05
**Decision**: Use @react-three/fiber + @react-three/drei
**Rationale**:
- Declarative React syntax for Three.js
- Excellent hooks integration
- drei provides common helpers (OrbitControls, Text, etc.)
- Large community and documentation

### Wallet: @solana/wallet-adapter (not Privy)
**Date**: 2026-02-05
**Decision**: Use official Solana wallet adapter instead of Privy
**Rationale**:
- No API key or domain configuration required
- Works out of the box with Phantom/Solflare
- Simpler integration
- Better suited for hackathon timeline

### Styling: Tailwind CSS
**Date**: 2026-02-05
**Decision**: Use Tailwind for styling
**Rationale**:
- Rapid prototyping with utility classes
- No context switching between CSS files
- Consistent design system
- Works great with React components

---

## Architecture Patterns

### Agent Architecture: Tool-Use Pattern
**Date**: 2026-02-05
**Decision**: Claude API with tool_use instead of hardcoded phases
**Rationale**:
- Agent has full creative autonomy
- More flexible than rigid phase orchestration
- Easier to add new capabilities
- Better error recovery

### Memory System: Markdown Files
**Date**: 2026-02-06
**Decision**: Use simple markdown files for memory instead of database
**Rationale**:
- Human-readable and editable
- Easy to debug and inspect
- No additional dependencies
- Version controllable with git

### Communication: Telegram Bridge
**Date**: 2026-02-05
**Decision**: Use Telegram bot for human-agent communication
**Rationale**:
- H2Crypto already uses Telegram
- Real-time notifications
- Easy to send screenshots
- Approval workflow support

### Prompt Caching: 3-Layer Strategy
**Date**: 2026-02-06
**Decision**: Implement Claude API prompt caching with 3 cache breakpoints
**Rationale**:
- **Layer 1 (tools)**: 20+ tool definitions (~3000 tokens), rarely changes
- **Layer 2 (system)**: AGENTS.md + memory (~8000 tokens), changes ~daily
- **Layer 3 (messages)**: Conversation prefix, caches stable history

**Implementation** (`main.js:buildCachedRequest()`):
```javascript
// Add cache_control: {type: 'ephemeral'} to:
// 1. Last tool in tools array
// 2. System prompt (converted to array format)
// 3. User message 2 turns back (stable conversation prefix)
```

**Cost Savings**:
- Cache reads = 10% of base input cost (90% savings!)
- Cache writes = 125% of base cost (one-time overhead)
- 5-minute TTL (default), refreshed on each hit
- Minimum 1024 tokens per cacheable block (Sonnet 4)

**Why this matters for hackathon**:
- Agent runs 200+ turns per session
- Each turn sends ~12000 tokens (system + tools + messages)
- Without caching: 200 × 12000 = 2.4M input tokens
- With caching: ~240K effective tokens (90% reduction!)

---

## Rejected Alternatives

### Rejected: OpenAI API for code generation
**Reason**: Don't have API key; Claude API available

### Rejected: Supabase for backend
**Reason**: Requires account setup; free alternatives exist

### Rejected: Firebase Auth
**Reason**: Unnecessary complexity; wallet-based auth sufficient

---

<!-- Add new decisions above this line -->
