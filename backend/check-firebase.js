#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * Run this to verify your Firebase credentials are properly configured
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking Firebase Configuration...\n');

let hasCredentials = false;

// Check Method 1: FIREBASE_SERVICE_ACCOUNT
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (parsed.project_id && parsed.private_key && parsed.client_email) {
      console.log('✅ Method 1: FIREBASE_SERVICE_ACCOUNT env var');
      console.log(`   Project ID: ${parsed.project_id}`);
      console.log(`   Client Email: ${parsed.client_email}`);
      hasCredentials = true;
    } else {
      console.log('❌ Method 1: FIREBASE_SERVICE_ACCOUNT is invalid');
    }
  } catch (e) {
    console.log('❌ Method 1: FIREBASE_SERVICE_ACCOUNT parse error:', e.message);
  }
} else {
  console.log('⚪ Method 1: FIREBASE_SERVICE_ACCOUNT not set');
}

// Check Method 2: Individual env vars
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  console.log('\n✅ Method 2: Individual environment variables');
  console.log(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`   FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL}`);
  console.log(`   FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY.substring(0, 50)}...`);
  hasCredentials = true;
} else {
  console.log('\n⚪ Method 2: Individual env vars not complete');
  if (process.env.FIREBASE_PROJECT_ID) console.log('   ✓ FIREBASE_PROJECT_ID is set');
  else console.log('   ✗ FIREBASE_PROJECT_ID is missing');

  if (process.env.FIREBASE_PRIVATE_KEY) console.log('   ✓ FIREBASE_PRIVATE_KEY is set');
  else console.log('   ✗ FIREBASE_PRIVATE_KEY is missing');

  if (process.env.FIREBASE_CLIENT_EMAIL) console.log('   ✓ FIREBASE_CLIENT_EMAIL is set');
  else console.log('   ✗ FIREBASE_CLIENT_EMAIL is missing');
}

// Check Method 3: Local file
const serviceAccountPath = path.join(__dirname, 'src/config/firebase-service-account.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('\n✅ Method 3: Local firebase-service-account.json file exists');
  console.log(`   Path: ${serviceAccountPath}`);
  hasCredentials = true;
} else {
  console.log('\n⚪ Method 3: Local firebase-service-account.json not found');
  console.log(`   Expected path: ${serviceAccountPath}`);
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasCredentials) {
  console.log('✅ Firebase credentials are configured!');
  console.log('\nYou can now start the server:');
  console.log('   npm run dev');
} else {
  console.log('❌ Firebase credentials are NOT configured!');
  console.log('\nTo fix this, choose ONE of these options:');
  console.log('\n📝 Option 1 (RECOMMENDED): Edit your .env file and add:');
  console.log('   FIREBASE_PROJECT_ID=your-project-id');
  console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
  console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com');
  console.log('\n📁 Option 2: Place firebase-service-account.json in src/config/');
  console.log('\n📖 See FIREBASE_SETUP.md for detailed instructions');
}
console.log('='.repeat(60) + '\n');

process.exit(hasCredentials ? 0 : 1);

