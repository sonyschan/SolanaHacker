#!/usr/bin/env node
/**
 * Generate agent status dashboard HTML with current timestamp.
 *
 * Usage (on droplet):
 *   node generate-dashboard.js
 *
 * Then serve:
 *   python3 -m http.server 8090
 *   # → http://165.22.136.40:8090/dashboard.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_PATH = path.join(__dirname, 'dashboard.html');

// Generate timestamp in GMT+8 (Taiwan time)
const now = new Date();
const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
const timestamp = gmt8.toISOString().replace('T', ' ').slice(0, 19) + ' GMT+8';

// Read dashboard template
let html = fs.readFileSync(DASHBOARD_PATH, 'utf-8');

// Replace the generation timestamp placeholder (or previous timestamp)
html = html.replace(
  />__GENERATED__<|>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} GMT\+8</,
  `>${timestamp}<`
);

fs.writeFileSync(DASHBOARD_PATH, html, 'utf-8');
console.log(`Dashboard updated: ${DASHBOARD_PATH}`);
console.log(`Timestamp: ${timestamp}`);
