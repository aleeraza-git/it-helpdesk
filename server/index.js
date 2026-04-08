/**
 * IMARAT IT Support Portal - Main Server
 * Express + WebSocket + SQLite
 *
 * Start: node server/index.js
 * Seed:  node server/seed.js (run once before first start)
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');
const { setupWebSocket } = require('./websocket');

const PORT = process.env.PORT || 3000;
const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'IMARAT IT Support', version: '1.0.0', time: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// SERVE FRONTEND (in production)
// ─────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─────────────────────────────────────────────
// HTTP + WEBSOCKET SERVER
// ─────────────────────────────────────────────
const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`\nIMARAT IT Support Portal running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  console.log('\nDefault credentials:');
  console.log('  Admin:  aleeraza665@gmail.com / Securesocketshell@22');
  console.log('  Agent:  sarah.chen@imarat.com / Agent@12345');
  console.log('  User:   tom.b@imarat.com / User@12345');
});
