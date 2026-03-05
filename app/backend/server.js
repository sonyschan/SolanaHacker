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
const ogRoutes = require('./routes/og');
const tapestryRoutes = require('./routes/tapestry');
const rewardRoutes = require('./routes/rewards');
const memeyaRoutes = require('./routes/memeya');
const catalogRoutes = require('./routes/catalog');

// Import scheduler service
const schedulerService = require('./services/schedulerService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS must be first for preflight
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://165.22.136.40:5173',
    'https://solana-hacker.vercel.app',
    'https://solanahacker.vercel.app',
    'https://aimemeforge.io',
    'https://www.aimemeforge.io'
  ],
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve generated images
const path = require('path');
app.use('/generated', express.static(path.join(__dirname, 'public/generated')));

// Health check endpoint
app.get('/health', async (req, res) => {
  // DEV_MODE: Skip scheduler status check
  if (process.env.DEV_MODE === 'true') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'development',
      devMode: true
    });
  }
  try {
    const schedulerStatus = await schedulerService.getStatus();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      scheduler: {
        mode: schedulerStatus.mode,
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
app.use('/api/og', ogRoutes);
app.use('/api/tapestry', tapestryRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/memeya', memeyaRoutes);
app.use('/api/catalog', catalogRoutes);

// Referral ID resolution endpoint
app.get('/api/referral/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.length < 3 || id.length > 8 || !/^[a-zA-Z0-9]+$/.test(id)) {
      return res.status(400).json({ success: false, error: 'Invalid referral ID format' });
    }
    const { getFirestore, collections } = require('./config/firebase');
    const db = getFirestore();
    const doc = await db.collection(collections.REFERRAL_IDS).doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Referral ID not found' });
    }
    res.json({ success: true, wallet: doc.data().wallet });
  } catch (error) {
    console.error('Referral ID lookup error:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve referral ID' });
  }
});

// Global stats endpoint (cached 10min)
const { cacheResponse, TTL } = require('./utils/cache');
app.get('/api/stats', cacheResponse('global:stats', TTL.LONG), async (req, res) => {
  try {
    const { getFirestore, collections } = require('./config/firebase');
    const db = getFirestore();

    // Get total meme count
    const memesSnapshot = await db.collection(collections.MEMES).count().get();
    const totalMemes = memesSnapshot.data().count;

    // Get total votes count
    const votesSnapshot = await db.collection(collections.VOTES).count().get();
    const totalVotes = votesSnapshot.data().count;

    // Get total users count
    const usersSnapshot = await db.collection(collections.USERS).count().get();
    const totalUsers = usersSnapshot.data().count;

    // Get weekly voters — unique wallets that voted in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentVotes = await db.collection(collections.VOTES)
      .where('timestamp', '>=', weekAgo)
      .select('walletAddress')
      .get();
    const weekWallets = new Set();
    recentVotes.forEach(doc => weekWallets.add(doc.data().walletAddress));

    res.json({
      success: true,
      stats: {
        totalMemes,
        totalVotes,
        totalUsers,
        weeklyVoters: weekWallets.size,
        prizePool: 'Coming Soon',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.json({
      success: true,
      stats: {
        totalMemes: 0,
        totalVotes: 0,
        totalUsers: 0,
        weeklyVoters: 0,
        prizePool: 'Coming Soon',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// In-memory cache for feed/sitemap (changes once per day, avoids Firestore hammering from crawlers)
const xmlCache = { feed: { data: null, expires: 0 }, sitemap: { data: null, expires: 0 } };
const XML_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// RSS feed — recent daily memes
app.get('/feed.xml', async (req, res) => {
  try {
    if (xmlCache.feed.data && Date.now() < xmlCache.feed.expires) {
      res.set('Content-Type', 'application/rss+xml; charset=utf-8');
      return res.send(xmlCache.feed.data);
    }

    const { getFirestore, collections } = require('./config/firebase');
    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('status', 'in', ['active', 'voting_active', 'voting_completed'])
      .orderBy('generatedAt', 'desc')
      .limit(20)
      .get();

    const items = [];
    snapshot.forEach(doc => {
      const m = doc.data();
      const pubDate = new Date(m.generatedAt).toUTCString();
      const imageUrl = m.imageUrl && m.imageUrl.startsWith('/generated/')
        ? `https://memeforge-api-836651762884.asia-southeast1.run.app${m.imageUrl}`
        : m.imageUrl || '';
      items.push(`    <item>
      <title><![CDATA[${m.title || 'AI Meme'}]]></title>
      <description><![CDATA[${m.description || m.prompt || ''}]]></description>
      <link>https://aimemeforge.io/meme/${doc.id}</link>
      <guid isPermaLink="true">https://aimemeforge.io/meme/${doc.id}</guid>
      <pubDate>${pubDate}</pubDate>${imageUrl ? `\n      <enclosure url="${imageUrl}" type="image/png" />` : ''}
    </item>`);
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI MemeForge — Daily AI Memes</title>
    <link>https://aimemeforge.io</link>
    <description>Daily AI-generated crypto memes. Vote for free, win NFT ownership. One meme, one owner, every day.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://memeforge-api-836651762884.asia-southeast1.run.app/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;

    xmlCache.feed = { data: rss, expires: Date.now() + XML_CACHE_TTL };
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(rss);
  } catch (error) {
    console.error('RSS feed error:', error);
    res.status(500).send('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>');
  }
});

// Sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    if (xmlCache.sitemap.data && Date.now() < xmlCache.sitemap.expires) {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      return res.send(xmlCache.sitemap.data);
    }

    const { getFirestore, collections } = require('./config/firebase');
    const db = getFirestore();
    const snapshot = await db.collection(collections.MEMES)
      .where('type', '==', 'daily')
      .where('status', 'in', ['active', 'voting_active', 'voting_completed'])
      .orderBy('generatedAt', 'desc')
      .limit(50)
      .get();

    const urls = [`  <url>
    <loc>https://aimemeforge.io/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>https://aimemeforge.io/docs</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`,
    `  <url>
    <loc>https://aimemeforge.io/docs/how-it-works</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>https://aimemeforge.io/docs/tokenomics</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>https://aimemeforge.io/docs/rarity-system</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    `  <url>
    <loc>https://aimemeforge.io/docs/memeya-agent</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`];

    snapshot.forEach(doc => {
      const m = doc.data();
      const lastmod = m.generatedAt ? new Date(m.generatedAt).toISOString().split('T')[0] : '';
      urls.push(`  <url>
    <loc>https://aimemeforge.io/meme/${doc.id}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    xmlCache.sitemap = { data: sitemap, expires: Date.now() + XML_CACHE_TTL };
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

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

// Note: Scheduler is now handled by GCP Cloud Scheduler (external)
// Cloud Scheduler calls POST /api/scheduler/trigger/:taskName endpoints
// This ensures reliability even when Cloud Run scales to zero

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MemeForge API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Ready for AI meme generation and voting! 🗳️`);
  console.log(`⏰ Scheduler: GCP Cloud Scheduler (external) triggers /api/scheduler/trigger/:taskName`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;