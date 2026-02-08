/**
 * NamSev - Simple Credential Reset
 * Creates/resets admin and test user in both Firebase and MongoDB
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Fixed credentials for easy testing
const ADMIN_PASSWORD = 'Admin@123456';
const USER_PASSWORD = 'User@123456';

// User Schema
const userSchema = new mongoose.Schema({
  _id: String,
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  aadhaarLast4: String,
  panchayatCode: { type: String, default: 'TIRU001' },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true, collection: 'users' });

let User;

async function main() {
  try {
    console.log('\n🔄 Starting Credential Reset...\n');

    // 1. Initialize Firebase
    const serviceAccountPath = path.join(__dirname, '../src/config/firebase-service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('Firebase service account file not found');
    }
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✅ Firebase initialized');

    // 2. Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // 3. Get or create User model
    try {
      User = mongoose.model('User');
    } catch (e) {
      User = mongoose.model('User', userSchema);
    }

    // 4. Reset Admin
    console.log('\n📝 Resetting ADMIN...');
    const adminEmail = process.env.ADMIN_EMAIL || 'panchayat.office@gmail.com';
    const adminResult = await resetUser(
      adminEmail,
      ADMIN_PASSWORD,
      'admin',
      'Panchayat Admin',
      '9876543210',
      'Panchayat Office, Tiruppur'
    );

    // 5. Reset Test User
    console.log('\n📝 Resetting TEST USER...');
    const userResult = await resetUser(
      'testuser@namsev.test',
      USER_PASSWORD,
      'citizen',
      'Test Citizen',
      '9876543211',
      'Test Address, Tiruppur'
    );

    // 6. Display Results
    console.log('\n' + '='.repeat(70));
    console.log('✅ CREDENTIALS RESET SUCCESSFUL');
    console.log('='.repeat(70));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log('ADMIN ACCOUNT:');
    console.log(`  Email:    ${adminResult.email}`);
    console.log(`  Password: ${adminResult.password}`);
    console.log(`  Role:     ${adminResult.role}`);
    console.log('');
    console.log('TEST USER ACCOUNT:');
    console.log(`  Email:    ${userResult.email}`);
    console.log(`  Password: ${userResult.password}`);
    console.log(`  Role:     ${userResult.role}`);
    console.log('\n' + '='.repeat(70));
    console.log('');
    console.log('💡 Frontend URL: ' + (process.env.FRONTEND_URL || 'http://localhost:5173'));
    console.log('');

    // 7. Save credentials to file
    const credFile = path.join(__dirname, '../../CREDENTIALS.txt');
    const content = `NamSev Test Credentials
Generated: ${new Date().toLocaleString()}

ADMIN:
Email: ${adminResult.email}
Password: ${adminResult.password}

TEST USER:
Email: ${userResult.email}
Password: ${userResult.password}

Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
`;
    fs.writeFileSync(credFile, content);
    console.log(`📄 Credentials saved to: ${credFile}\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function resetUser(email, password, role, name, phone, address) {
  // Create or update Firebase user
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(firebaseUser.uid, {
      password: password,
      emailVerified: true
    });
    console.log(`   ✅ Updated Firebase user: ${email}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        emailVerified: true,
        displayName: name
      });
      console.log(`   ✅ Created Firebase user: ${email}`);
    } else {
      throw error;
    }
  }

  // Create or update MongoDB user
  let mongoUser = await User.findOne({ firebaseUid: firebaseUser.uid });

  if (mongoUser) {
    mongoUser.email = email;
    mongoUser.name = name;
    mongoUser.phone = phone;
    mongoUser.address = address;
    mongoUser.role = role;
    mongoUser.status = 'approved';
    await mongoUser.save();
    console.log(`   ✅ Updated MongoDB user`);
  } else {
    mongoUser = await User.create({
      _id: uuidv4(),
      firebaseUid: firebaseUser.uid,
      email: email,
      name: name,
      phone: phone,
      address: address,
      aadhaarLast4: '1234',
      panchayatCode: 'TIRU001',
      role: role,
      status: 'approved'
    });
    console.log(`   ✅ Created MongoDB user`);
  }

  return { email, password, role, uid: firebaseUser.uid };
}

// Run
main();

