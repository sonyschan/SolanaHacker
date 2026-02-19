#!/usr/bin/env node
/**
 * Dashboard server — serves dashboard.html + regen/health/shutdown endpoints.
 *
 * Usage:
 *   node dashboard-server.js            # port 8090
 *   PORT=9090 node dashboard-server.js
 *
 * Systemd:
 *   systemctl start dashboard-server
 *   systemctl stop dashboard-server
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.DASHBOARD_PORT || '8090');
const DASHBOARD_PATH = path.join(__dirname, 'dashboard.html');
const startedAt = Date.now();

function stampTimestamp() {
  const now = new Date();
  const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const timestamp = gmt8.toISOString().replace('T', ' ').slice(0, 19) + ' GMT+8';

  let html = fs.readFileSync(DASHBOARD_PATH, 'utf-8');
  html = html.replace(
    />__GENERATED__|>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} GMT\+8</,
    `>${timestamp}<`
  );
  fs.writeFileSync(DASHBOARD_PATH, html, 'utf-8');
  return timestamp;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    const uptimeMs = Date.now() - startedAt;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      uptime: `${h}h ${m}m ${s}s`,
      uptimeMs,
      startedAt: new Date(startedAt).toISOString(),
      pid: process.pid,
    }));
    return;
  }

  // Regen timestamp
  if (req.method === 'POST' && req.url === '/regen') {
    try {
      const ts = stampTimestamp();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, timestamp: ts }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Graceful shutdown
  if (req.method === 'POST' && req.url === '/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Shutting down...' }));
    setTimeout(() => process.exit(0), 500);
    return;
  }

  // Serve dashboard
  if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard.html')) {
    try {
      const html = fs.readFileSync(DASHBOARD_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading dashboard.html');
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard server running on http://0.0.0.0:${PORT}/dashboard.html (PID: ${process.pid})`);
});
