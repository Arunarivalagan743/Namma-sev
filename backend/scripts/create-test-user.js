#!/usr/bin/env node

/**
 * Test User Creation Script
 *
 * Creates a test citizen user in both Firebase and MongoDB
 * Usage: node create-test-user.js
 */

require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Initialize Firebase
const initializeFirebase = () => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (fs.existsSync(path.join(__dirname, '../src/config/firebase-service-account.json'))) {
      const serviceAccount = require('../src/config/firebase-service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('✅ Firebase initialized');
  } catch (err) {
    console.error('❌ Firebase error:', err.message);
    process.exit(1);
  }
};

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/namsev_db';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  }
};

// Get User model
const getUserModel = () => {
  const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: String,
    phone: String,
    address: String,
    aadhaarLast4: String,
    role: { type: String, enum: ['citizen', 'admin', 'super-admin'], default: 'citizen' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    panchayatCode: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });

  return mongoose.model('User', userSchema);
};

// Create test user
const createTestUser = async () => {
  const testEmail = 'testcitizen@example.com';
  const testPassword = 'TestPassword123!';
  const testName = 'Test Citizen';
  const testPhone = '9876543210';
  const testAddress = 'Test Address, Ward 1, Tirupur';

  console.log('\n📝 Creating test user...');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Name: ${testName}`);
  console.log(`   Phone: ${testPhone}`);

  try {
    // Step 1: Create user in Firebase
    console.log('\n1️⃣  Creating Firebase user...');
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: testName,
      emailVerified: true
    });
    console.log('✅ Firebase user created');
    console.log(`   UID: ${userRecord.uid}`);

    // Step 2: Create user in MongoDB
    console.log('\n2️⃣  Creating MongoDB user document...');
    const User = getUserModel();

    const newUser = new User({
      firebaseUid: userRecord.uid,
      email: testEmail,
      name: testName,
      phone: testPhone,
      address: testAddress,
      aadhaarLast4: '1234',
      role: 'citizen',
      status: 'approved',
      panchayatCode: 'TIRU001'
    });

    await newUser.save();
    console.log('✅ MongoDB user created');
    console.log(`   ID: ${newUser._id}`);

    // Step 3: Generate custom token (optional, for testing)
    console.log('\n3️⃣  Generating custom token for testing...');
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    console.log('✅ Custom token created (first 50 chars): ' + customToken.substring(0, 50) + '...');

    // Display summary
    console.log('\n✅ Test user created successfully!\n');
    console.log('📋 Test User Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Firebase UID: ${userRecord.uid}`);
    console.log(`   MongoDB ID: ${newUser._id}`);
    console.log(`   Role: citizen`);
    console.log(`   Status: approved`);
    console.log(`   Name: ${testName}`);
    console.log(`   Phone: ${testPhone}`);
    console.log('\n💡 You can now use these credentials to login to the application!\n');

    return {
      firebaseUid: userRecord.uid,
      email: testEmail,
      password: testPassword,
      mongoId: newUser._id,
      customToken: customToken
    };

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  User already exists with this email!');

      // Try to get the existing user and MongoDB record
      try {
        const existingUser = await admin.auth().getUserByEmail(testEmail);
        const User = getUserModel();
        const mongoUser = await User.findOne({ email: testEmail });

        console.log('\n📋 Existing User Credentials:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Firebase UID: ${existingUser.uid}`);
        console.log(`   MongoDB ID: ${mongoUser ? mongoUser._id : 'Not found'}`);
        console.log(`   Status: ${mongoUser ? mongoUser.status : 'Unknown'}`);

        return {
          firebaseUid: existingUser.uid,
          email: testEmail,
          mongoId: mongoUser ? mongoUser._id : null,
          existing: true
        };
      } catch (lookupError) {
        throw error;
      }
    }

    console.error('\n❌ Error creating user:', error.message);
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log('\n🚀 NamSev Test User Creation\n');
  console.log('═'.repeat(50));

  try {
    initializeFirebase();
    await connectMongoDB();
    const result = await createTestUser();

    console.log('═'.repeat(50));
    console.log('\n✅ All done! You can now test the application.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create test user');
    console.error('Error:', error.message);
    process.exit(1);
  }
};

main();

