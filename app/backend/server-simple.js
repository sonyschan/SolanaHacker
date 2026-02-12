const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://165.22.136.40:5173',  // 添加公網 IP
    'https://solana-hacker.vercel.app',
    'https://solanahacker.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simple server running without Firebase'
  });
});

// Mock memes endpoint
app.get('/api/memes/today', (req, res) => {
  res.json({
    success: true,
    memes: [
      {
        id: 'test1',
        title: 'Test Meme 1',
        imageUrl: '/generated/test1.jpg',
        votes: { selection: { yes: 10, no: 5 } }
      }
    ]
  });
});

app.post('/api/memes/generate-daily', (req, res) => {
  res.json({
    success: true,
    message: 'Mock generation success'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`🌍 CORS enabled for: http://165.22.136.40:5173`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;