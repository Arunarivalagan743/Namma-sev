const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://arunarivalagan774:arunarivalagan774@cluster0.jxg7dt3.mongodb.net/';

// Track connection state for serverless
let isConnected = false;

// Connect to MongoDB
const connectDB = async () => {
  // If already connected, return
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection');
    return mongoose.connection;
  }

  try {
    // Set mongoose options for serverless
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
    });
    
    isConnected = true;
    console.log('✅ MongoDB Database connected successfully');
    console.log(`Connected to: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    isConnected = false;
    console.error('❌ Database connection failed:', error.message);
    throw error; // Throw instead of process.exit for serverless
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
  }
};

module.exports = { connectDB, testConnection, mongoose };
