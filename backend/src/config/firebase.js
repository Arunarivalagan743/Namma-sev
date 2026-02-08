const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Priority 1: Use environment variable (for production - Vercel/Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // Parse the JSON string from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT env var');
        return firebaseApp;
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError.message);
      }
    }

    // Priority 2: Use individual environment variables (RECOMMENDED for development)
    const hasIndividualVars = process.env.FIREBASE_PROJECT_ID &&
                              process.env.FIREBASE_PRIVATE_KEY &&
                              process.env.FIREBASE_CLIENT_EMAIL;

    if (hasIndividualVars) {
      try {
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID || '',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
        };

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized from individual env vars');
        console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);
        return firebaseApp;
      } catch (error) {
        console.error('❌ Failed to initialize with individual env vars:', error.message);
      }
    }

    // Priority 3: Use local file (for local development)
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = require(serviceAccountPath);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin SDK initialized from local file');
        console.log(`   File: ${serviceAccountPath}`);
        return firebaseApp;
      } catch (error) {
        console.error('❌ Failed to initialize from file:', error.message);
      }
    }
    
    // Fallback: No credentials available
    console.error('\n❌ Firebase credentials not found!');
    console.error('   You have 3 options to fix this:\n');
    console.error('   Option 1 (RECOMMENDED): Set these in your .env file:');
    console.error('     FIREBASE_PROJECT_ID=your-project-id');
    console.error('     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.error('     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com\n');
    console.error('   Option 2: Set FIREBASE_SERVICE_ACCOUNT env var (JSON string)\n');
    console.error('   Option 3: Place firebase-service-account.json in src/config/\n');
    console.error('   📖 See FIREBASE_SETUP.md for detailed instructions\n');

    // Initialize without credentials - this will fail token verification
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'namsev-development'
    });
    console.warn('⚠️  Firebase initialized without credentials - token verification will fail');
    console.warn('   The server will start but authentication features will not work\n');

  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    // Try to initialize without credentials as last resort
    try {
      firebaseApp = admin.initializeApp({
        projectId: 'namsev-fallback'
      });
    } catch (fallbackError) {
      console.error('❌ Fallback initialization also failed:', fallbackError.message);
    }
  }

  return firebaseApp;
};

// Initialize on import
initializeFirebase();

module.exports = { admin, initializeFirebase };


