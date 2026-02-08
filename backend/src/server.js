const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const complaintRoutes = require('./routes/complaint.routes');
const announcementRoutes = require('./routes/announcement.routes');
const adminRoutes = require('./routes/admin.routes');
const translateRoutes = require('./routes/translate.routes');
const engagementRoutes = require('./routes/engagement.routes');

// Import database connection
const { connectDB } = require('./config/database');

// ============ PHASE 3: Import System Modules ============
let warmupModule = null;
let batchModule = null;
let cleanupModule = null;
let metricsModule = null;

try { warmupModule = require('./ai/workers/warmup'); } catch (e) { console.warn('[Phase3] Warmup module not available'); }
try { batchModule = require('./ai/workers/batch'); } catch (e) { console.warn('[Phase3] Batch module not available'); }
try { cleanupModule = require('./ai/workers/cleanup'); } catch (e) { console.warn('[Phase3] Cleanup module not available'); }
try { metricsModule = require('./ai/workers/metrics'); } catch (e) { console.warn('[Phase3] Metrics module not available'); }

// Initialize express app
const app = express();

// ============ PHASE 3: SYSTEM INITIALIZATION ============
const initializePhase3Systems = async () => {
  console.log('[Phase3] Initializing engineering systems...');
  const startTime = Date.now();

  // 1. Run warmup
  if (warmupModule) {
    try {
      await warmupModule.runWarmup();
      console.log('[Phase3] ✓ Warmup complete');
    } catch (e) {
      console.error('[Phase3] Warmup failed:', e.message);
    }
  }

  // 2. Register batch handlers
  if (batchModule) {
    try {
      batchModule.registerBatchHandlers();
      console.log('[Phase3] ✓ Batch handlers registered');
    } catch (e) {
      console.error('[Phase3] Batch registration failed:', e.message);
    }
  }

  // 3. Start batch scheduler (only in non-serverless)
  if (batchModule && process.env.VERCEL !== '1') {
    try {
      batchModule.startScheduler();
      console.log('[Phase3] ✓ Batch scheduler started');
    } catch (e) {
      console.error('[Phase3] Batch scheduler failed:', e.message);
    }
  }

  // 4. Start cleanup scheduler (only in non-serverless)
  if (cleanupModule && process.env.VERCEL !== '1') {
    try {
      cleanupModule.startCleanupScheduler();
      console.log('[Phase3] ✓ Cleanup scheduler started');
    } catch (e) {
      console.error('[Phase3] Cleanup scheduler failed:', e.message);
    }
  }

  console.log(`[Phase3] Systems initialized in ${Date.now() - startTime}ms`);
};

// ============ AUTO-CLEANUP SCHEDULER (Legacy - now handled by Phase 3) ============
const scheduleCleanup = () => {
  // Phase 3 cleanup system now handles this
  if (cleanupModule) {
    console.log('[Cleanup] Using Phase 3 cleanup system');
    return;
  }

  // Fallback to legacy cleanup
  const runCleanup = async () => {
    try {
      console.log('🧹 Running scheduled cleanup...');
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  };

  setTimeout(runCleanup, 5000);
  setInterval(runCleanup, 6 * 60 * 60 * 1000);
};
// ============ END CLEANUP SCHEDULER ============

// CORS configuration - must be first middleware
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:3000', 
      'https://gananam-sev.vercel.app',
      'https://namma-sev.vercel.app',
      'https://namma-sev-4.onrender.com'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for serverless - ensure connection before any API route
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error.message);
    return res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message 
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/engagement', engagementRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NamSev Backend is running',
    panchayat: process.env.PANCHAYAT_NAME || 'Ganapathipalayam Panchayat'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server only when not in Vercel serverless environment
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏛️  NamSev - Panchayat Civic Engagement Platform        ║
  ║                                                           ║
  ║   Server running on port ${PORT}                            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
  ║   Phase: 3 (Engineering Maturity)                         ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);

    // Initialize Phase 3 systems
    try {
      await initializePhase3Systems();
      console.log('✅ Phase 3 systems initialized');
    } catch (error) {
      console.error('Phase 3 initialization error:', error.message);
    }

    // Start the cleanup scheduler (handled by Phase 3 or legacy)
    scheduleCleanup();
    console.log('🕐 Scheduled tasks active');
  });
}

// Export for Vercel serverless
module.exports = app;
