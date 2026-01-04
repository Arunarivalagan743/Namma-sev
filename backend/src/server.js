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

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://ganamann-sev.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB database
connectDB();

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏛️  NamSev - Panchayat Civic Engagement Platform        ║
  ║                                                           ║
  ║   Server running on port ${PORT}                            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
  
  // Start the cleanup scheduler
  scheduleCleanup();
  console.log('🕐 Auto-cleanup scheduler started (runs every 6 hours)');
});
