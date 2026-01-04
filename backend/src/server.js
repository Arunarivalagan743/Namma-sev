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
const translateRoutes = require('./routes/translateRoutes');
const engagementRoutes = require('./routes/engagementRoutes');

// Import database connection
const { connectDB } = require('./config/database');

// Initialize express app
const app = express();

// ============ AUTO-CLEANUP SCHEDULER ============
// TODO: Implement MongoDB-based cleanup for expired polls and meetings
const scheduleCleanup = () => {
  const runCleanup = async () => {
    try {
      console.log('🧹 Running scheduled cleanup...');
      // MongoDB cleanup implementation will be added here
      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  };

  // Run cleanup immediately on startup
  setTimeout(runCleanup, 5000);
  
  // Run cleanup every 6 hours
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
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏛️  NamSev - Panchayat Civic Engagement Platform        ║
  ║                                                           ║
  ║   Server running on port ${PORT}                            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
    
    // Start the cleanup scheduler
    scheduleCleanup();
    console.log('🕐 Auto-cleanup scheduler started (runs every 6 hours)');
  });
}

// Export for Vercel serverless
module.exports = app;
