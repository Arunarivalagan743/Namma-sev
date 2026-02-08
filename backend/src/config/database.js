const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env file!');
  console.error('   Please add your MongoDB connection string to .env');
  process.exit(1);
}

// Cached connection for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Connect to MongoDB
const connectDB = async () => {
  // If already connected, return existing connection
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Database connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    const dbName = cached.conn.connection.db.databaseName;
    const host = cached.conn.connection.host;
    console.log(`📦 Database: ${dbName}`);
    console.log(`🌐 Host: ${host}`);
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};
const testConnection = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
  }
};

module.exports = { connectDB, testConnection, mongoose };
