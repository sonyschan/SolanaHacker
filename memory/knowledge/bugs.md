# Bug Solutions Database

> Accumulated debugging wisdom. Search here when encountering errors.

---

## Solana / Web3

### Wallet Adapter: Buffer not defined
**Error**: `ReferenceError: Buffer is not defined`
**Context**: Using @solana/web3.js in browser
**Root Cause**: Node.js Buffer polyfill not available in browser
**Solution**:
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [nodePolyfills()]
})
```
**Prevention**: Always include polyfills when using Solana in browser

### Wallet Adapter: WalletNotConnectedError
**Error**: `WalletNotConnectedError: Wallet not connected`
**Context**: Trying to sign transaction without connected wallet
**Root Cause**: Calling wallet methods before user connects
**Solution**: Check `wallet.connected` before any wallet operations
**Prevention**: Guard all wallet operations with connection check

---

## React / Vite

### Vite: Port already in use
**Error**: `Error: listen EADDRINUSE: address already in use :::5173`
**Context**: Starting dev server when another process uses the port
**Root Cause**: Previous dev server didn't shut down properly
**Solution**:
```bash
lsof -ti:5173 | xargs kill -9
# or
pkill -f vite
```
**Prevention**: Always kill existing processes before starting server

### React: Hook order changed
**Error**: `Rendered more hooks than during the previous render`
**Context**: Conditional rendering with hooks
**Root Cause**: Hooks called inside conditions or loops
**Solution**: Move hooks to component top level, use conditions after
**Prevention**: Never put hooks inside if/for/while

---

## Three.js / 3D

### Three.js: WebGL context lost
**Error**: `THREE.WebGLRenderer: Context Lost`
**Context**: Heavy 3D scenes, tab switching, memory pressure
**Root Cause**: Browser reclaims GPU resources
**Solution**:
```javascript
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  // Recreate renderer and reload scene
});
```
**Prevention**: Optimize geometry, use LOD, dispose unused resources

---

## Claude API

### Claude: Orphaned tool_result
**Error**: `unexpected 'tool_use_id' found in 'tool_result' blocks`
**Context**: After context pruning
**Root Cause**: Pruning removed assistant message with tool_use but kept user message with tool_result
**Solution**: Repair messages to match tool_use/tool_result pairs
**Prevention**: Only prune at safe boundaries (user messages with string content)

### Claude: Rate limit (429)
**Error**: `429 Too Many Requests`
**Context**: Rapid API calls
**Root Cause**: Exceeding Tier 1 limits (30K input tokens/min)
**Solution**: Exponential backoff, reduce context size
**Prevention**: Aggressive context pruning, rate-aware delays

---

## Git / GitHub

### Git: Push rejected (non-fast-forward)
**Error**: `! [rejected] main -> main (non-fast-forward)`
**Context**: Pushing when remote has new commits
**Root Cause**: Local branch behind remote
**Solution**: `git pull --rebase origin main` then push
**Prevention**: Always pull before starting work

---

## Agent Behavior Bugs

### Self-Deception: Claiming completion with blank screenshot
**Error**: Agent sends "POC Complete" but screenshot shows blank/white page
**Context**: Agent ran review_ux which detected white screen, but claimed it was a "technical issue"
**Root Cause**: Agent rationalized the failure instead of accepting it
**Example of WRONG behavior**:
> "Note: The automated UX scoring system has a technical issue (shows white screen) but the app is fully functional as shown in the screenshot."
**Why this is wrong**:
- If screenshot is blank, app is NOT functional
- If UX system reports white screen, YOUR APP has the issue
- "I believe it works" is NOT evidence
**Correct behavior**:
1. review_ux reports white screen → Confidence = 0%
2. Investigate why (dev server down? Build error? Rendering bug?)
3. Fix the issue
4. Run review_ux again until it passes
5. ONLY THEN claim completion
**Prevention**: Never claim completion without passing review_ux

### Sending Broken Links: Claiming "Link Fixed" without verification
**Error**: Agent sends "Test Link Fixed! http://..." but the URL doesn't work
**Context**: Agent restarted dev server and assumed it was working
**Root Cause**: Agent didn't verify the URL before sending
**Why this is wrong**:
- Wasting H2Crypto's time
- Lying about progress
- Server may have failed to start, or page may have errors
**Correct behavior**:
1. `dev_server({ action: 'status' })` — check if running
2. `dev_server({ action: 'start' })` — start if not running
3. `take_screenshot({ viewport: 'desktop' })` — verify page loads
4. ONLY if screenshot succeeds → send the link with screenshot attached
**Prevention**: NEVER send a test link without taking a screenshot first

### Waiting Loop: Burning API budget while "waiting for approval"
**Error**: Agent consumed $3-4 API credits just repeating "I am waiting for approval"
**Context**: After requesting approval, agent kept sending the same message every few seconds
**Root Cause**: end_turn nudge message triggered new API call, agent responded with "still waiting"
**Solution**: Implemented idle mode - after 3 consecutive "waiting" responses, sleep for 30s between checks
**Prevention**: When truly waiting, don't burn API. Sleep and only wake on new commands.

---


### Vite: Dev server returns 404 even when running
**Error**: `Dev server returns 404 even when running`
**Context**: Server running on port 5173 but URL not accessible
**Root Cause**: Improper host configuration in dev server startup
**Solution**: 1. Kill processes on port: lsof -ti:5173 | xargs kill -9 2. Fix root package.json with proper dev script 3. Restart with dev_server tool 4. Verify with curl before sending link
**Prevention**: Always test URL with curl/screenshot before claiming it's working

---


### React: Unexpected closing "SOL" tag does not match openin
**Error**: `Unexpected closing "SOL" tag does not match opening "SOLTooltip" tag`
**Context**: JSX component with custom tooltip components
**Root Cause**: Incomplete JSX closing tag - typed `<SOLTooltip>SOL</SOL` instead of `<SOLTooltip>SOL</SOLTooltip>`
**Solution**: Complete the closing tag properly to match the opening tag
**Prevention**: Use IDE with JSX syntax highlighting and auto-completion

---


### React / Solana Wallets: installHook.js:1 Encountered two children with the
**Error**: `installHook.js:1 Encountered two children with the same key, MetaMask. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.`
**Context**: React components rendering Solana wallet adapters in WalletModalProvider
**Root Cause**: Multiple wallet adapters were being created with identical name properties, causing React to see duplicate keys when rendering the wallet selection modal
**Solution**: Modified walletSingleton.js to create absolutely unique identifiers for each wallet adapter:
1. Generate unique IDs using counter + timestamp + random string
2. Override adapter.name with unique identifier (e.g., "Phantom_1_1770544000_abc123")  
3. Store original name in adapter.displayName for UI purposes
4. Add adapter.key property for React key usage
5. Apply multiple layers of deduplication and React key safety checks
6. Verify no duplicate keys exist in development logs
**Prevention**: Always ensure wallet adapters have unique identifiers when creating multiple instances. Use singleton pattern to prevent recreation. Test wallet modal rendering to verify unique React keys.

---

<!-- Add new bug solutions above this line -->
