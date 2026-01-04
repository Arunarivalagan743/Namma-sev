const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://arunarivalagan774:arunarivalagan774@cluster0.jxg7dt3.mongodb.net/';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Database connected successfully');
    console.log(`Connected to: ${conn.connection.host}`);
    
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Please ensure MongoDB is running and connection string is correct.');
    process.exit(1);
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
