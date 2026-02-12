# Common Error Quick Fixes

## `require is not defined` / `module is not defined`

**⚠️ 重要原則：只要 MVP 功能正常運作，忽略 require error！**

不要花時間在：
- ❌ 無限循環修 require error
- ❌ 為了解決 require error 而移除功能
- ❌ 反覆嘗試同樣的修復方法

正確做法：
1. `npm run build` — 如果 build 成功，繼續
2. `dev_server({ action: 'start' })` — 如果頁面能跑，繼續
3. 只有當 **功能完全無法使用** 時才修 require error
4. 用 `log_attempt()` 記錄嘗試過的方法，避免重複

**This is an ESM project.** Use `import`, not `require`:
```javascript
// ❌ WRONG (CommonJS)
const fs = require('fs');
const { something } = require('./module');

// ✅ CORRECT (ESM)
import fs from 'fs';
import { something } from './module.js';  // Note: .js extension required!
```

## `Cannot use import statement outside a module`
Check `package.json` has `"type": "module"`.

## `ERR_MODULE_NOT_FOUND` - missing file extension
ESM requires `.js` extension in imports:
```javascript
// ❌ WRONG
import { foo } from './utils';

// ✅ CORRECT
import { foo } from './utils.js';
```

## `__dirname is not defined` (ESM)
```javascript
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
