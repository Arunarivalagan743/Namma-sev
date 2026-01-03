const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      console.warn('⚠️  Firebase service account file not found.');
      console.warn('   Place firebase-service-account.json in src/config/');
      console.warn('   Running in development mode without Firebase verification.');
      
      // Initialize without credentials for development
      firebaseApp = admin.initializeApp({
        projectId: 'namsev-development'
      });
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }

  return firebaseApp;
};

// Initialize on import
initializeFirebase();

module.exports = { admin, initializeFirebase };
