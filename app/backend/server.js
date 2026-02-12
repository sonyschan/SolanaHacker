const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const memeRoutes = require('./routes/memes');
const votingRoutes = require('./routes/voting');
const userRoutes = require('./routes/users');
const lotteryRoutes = require('./routes/lottery');
const schedulerRoutes = require('./routes/scheduler');

// Import scheduler service
const schedulerService = require('./services/schedulerService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://165.22.136.40:5173',  // 添加公網 IP
    'https://solana-hacker.vercel.app',
    'https://solanahacker.vercel.app'
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const schedulerStatus = await schedulerService.getStatus();
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      scheduler: {
        initialized: schedulerStatus.running,
        taskCount: schedulerStatus.taskCount,
        lastUpdate: schedulerStatus.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Failed to get scheduler status'
    });
  }
});

// API routes
app.use('/api/memes', memeRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lottery', lotteryRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MemeForge API is running! 🎨🚀',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      memes: '/api/memes',
      voting: '/api/voting',
      users: '/api/users',
      lottery: '/api/lottery',
      scheduler: '/api/scheduler'
    },
    automation: {
      description: '🔄 Fully automated meme generation, voting, and lottery system',
      features: [
        'Daily meme generation at 8:00 AM UTC',
        'Voting periods: 8:30 AM - 8:00 PM UTC (12 hours)',
        'Automatic rarity calculation',
        'Weekly lottery draw on Sundays at 8:00 PM UTC',
        'Hourly voting progress monitoring'
      ],
      management: {
        status: 'GET /api/scheduler/status',
        trigger: 'POST /api/scheduler/trigger/:taskName',
        logs: 'GET /api/scheduler/logs',
        health: 'GET /api/scheduler/health'
      }
    },
    documentation: 'https://github.com/sonyschan/SolanaHacker',
    hackathon: 'Colosseum Hackathon 2026'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: ['/health', '/api/memes', '/api/voting', '/api/users', '/api/lottery', '/api/scheduler']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize scheduler service
async function initializeScheduler() {
  try {
    console.log('🔄 Initializing MemeForge Automation System...');
    await schedulerService.initialize();
    console.log('✅ MemeForge Automation System initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
    // Don't exit process, allow manual operation
  }
}

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 MemeForge API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Ready for AI meme generation and voting! 🗳️`);
  console.log(`📊 Scheduler management: http://localhost:${PORT}/api/scheduler/status`);
  
  // Initialize automation after server starts
  await initializeScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Stop all scheduled tasks
  schedulerService.stopAll();
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  
  // Stop all scheduled tasks
  schedulerService.stopAll();
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;