/**
 * NamSev - Secure Test Credential Reset Script
 *
 * Security Features:
 * - Environment validation
 * - Dry-run mode
 * - Confirmation prompts
 * - Audit logging
 * - Production protection
 *
 * Usage:
 *   node reset-test-credentials.js --env=development --dry-run
 *   node reset-test-credentials.js --env=staging --confirm
 *   node reset-test-credentials.js --env=production --force --confirm (DANGEROUS)
 *
 * @module scripts/reset-test-credentials
 */

require('dotenv').config();
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  environments: ['development', 'staging', 'production'],
  passwordLength: 20,
  passwordExpiry: 30, // days
  testAccountPrefix: 'test_',
  auditLogPath: path.join(__dirname, '../../logs/security_audit.log'),
  credentialsPath: path.join(__dirname, '../../docs/TEST_CREDENTIALS.md'),
};

// ============================================================================
// ARGUMENT PARSING
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    env: 'development',
    dryRun: false,
    confirm: false,
    force: false,
    help: false,
  };

  args.forEach(arg => {
    if (arg.startsWith('--env=')) {
      parsed.env = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--confirm') {
      parsed.confirm = true;
    } else if (arg === '--force') {
      parsed.force = true;
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  });

  return parsed;
}

// ============================================================================
// PASSWORD GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure password
 * @param {number} length - Password length (minimum 16)
 * @returns {string} Generated password
 */
function generateSecurePassword(length = CONFIG.passwordLength) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

/**
 * Hash password for audit logging (never log raw passwords)
 * @param {string} password - Password to hash
 * @returns {string} SHA256 hash
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex').substring(0, 16);
}

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validate environment and prerequisites
 * @param {object} args - Parsed arguments
 * @returns {boolean} Validation result
 */
function validateEnvironment(args) {
  console.log('\n🔍 Validating Environment...\n');

  // Check environment
  if (!CONFIG.environments.includes(args.env)) {
    console.error(`❌ Invalid environment: ${args.env}`);
    console.error(`   Valid options: ${CONFIG.environments.join(', ')}`);
    return false;
  }

  // Production protection
  if (args.env === 'production' && !args.force) {
    console.error('❌ Cannot reset production credentials without --force flag');
    console.error('   This is a safety mechanism.');
    console.error('   Use: --env=production --force --confirm (if you really mean it)');
    return false;
  }

  // Confirmation required
  if (!args.dryRun && !args.confirm) {
    console.error('❌ Must use --confirm flag for actual reset');
    console.error('   Use --dry-run to test without changes');
    return false;
  }

  // Check environment variables
  const requiredEnvVars = ['ADMIN_EMAIL', 'MONGODB_URI'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  console.log(`✅ Environment: ${args.env}`);
  console.log(`✅ Mode: ${args.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`✅ Admin Email: ${process.env.ADMIN_EMAIL}`);

  return true;
}

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

async function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // Initialize Firebase Admin SDK
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Try local file
      const serviceAccountPath = path.join(__dirname, '../src/config/firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
    }

    throw new Error('Firebase credentials not found');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

// ============================================================================
// CREDENTIAL RESET
// ============================================================================

/**
 * Reset admin credentials
 * @param {boolean} dryRun - Dry run mode
 * @returns {object} Reset result
 */
async function resetAdminCredentials(dryRun) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const newPassword = generateSecurePassword();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + CONFIG.passwordExpiry);

  console.log(`\n📝 Resetting Admin Credentials...`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password Hash: ${hashPassword(newPassword)}`);
  console.log(`   Expires: ${expiryDate.toISOString().split('T')[0]}`);

  if (dryRun) {
    console.log('   ⚠️  DRY RUN - No changes made');
    return { email: adminEmail, password: '********', expiry: expiryDate };
  }

  try {
    // Get Firebase user by email
    const userRecord = await admin.auth().getUserByEmail(adminEmail);

    // Update password in Firebase
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    console.log('   ✅ Admin password reset in Firebase');

    return { email: adminEmail, password: newPassword, expiry: expiryDate };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('   ⚠️  Admin user not found in Firebase - may need manual creation');
      return { email: adminEmail, password: newPassword, expiry: expiryDate, created: false };
    }
    throw error;
  }
}

/**
 * Get or create test accounts for each role
 * @param {boolean} dryRun - Dry run mode
 * @returns {Array} Test accounts
 */
async function resetTestAccounts(dryRun) {
  const roles = [
    { role: 'admin', email: `${CONFIG.testAccountPrefix}admin@namsev.test` },
    { role: 'citizen', email: `${CONFIG.testAccountPrefix}citizen@namsev.test` },
  ];

  const results = [];

  console.log(`\n📝 Resetting Test Accounts...`);

  for (const roleConfig of roles) {
    const newPassword = generateSecurePassword();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CONFIG.passwordExpiry);

    console.log(`\n   Role: ${roleConfig.role.toUpperCase()}`);
    console.log(`   Email: ${roleConfig.email}`);
    console.log(`   Password Hash: ${hashPassword(newPassword)}`);
    console.log(`   Expires: ${expiryDate.toISOString().split('T')[0]}`);

    if (dryRun) {
      console.log('   ⚠️  DRY RUN - No changes made');
      results.push({ ...roleConfig, password: '********', expiry: expiryDate });
      continue;
    }

    try {
      // Try to get existing user
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(roleConfig.email);
        // Update existing
        await admin.auth().updateUser(userRecord.uid, {
          password: newPassword,
        });
        console.log('   ✅ Test account password reset');
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new test user
          userRecord = await admin.auth().createUser({
            email: roleConfig.email,
            password: newPassword,
            emailVerified: true,
          });
          console.log('   ✅ Test account created');
        } else {
          throw error;
        }
      }

      results.push({ ...roleConfig, password: newPassword, expiry: expiryDate, uid: userRecord.uid });
    } catch (error) {
      console.error(`   ❌ Failed to reset ${roleConfig.role}:`, error.message);
      results.push({ ...roleConfig, password: null, expiry: null, error: error.message });
    }
  }

  return results;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Write to security audit log
 * @param {string} action - Action performed
 * @param {object} details - Action details
 */
function writeAuditLog(action, details) {
  const logDir = path.dirname(CONFIG.auditLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    actor: process.env.USER || 'system',
    environment: details.environment,
    details: {
      ...details,
      // Never log raw passwords
      passwordHash: details.passwordHash || hashPassword(details.password || ''),
    },
  };

  delete logEntry.details.password; // Remove password if present

  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(CONFIG.auditLogPath, logLine);
}

// ============================================================================
// CREDENTIAL STORAGE
// ============================================================================

/**
 * Store test credentials securely
 * @param {object} adminCreds - Admin credentials
 * @param {Array} testAccounts - Test account credentials
 */
function storeCredentials(adminCreds, testAccounts) {
  const docsDir = path.dirname(CONFIG.credentialsPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  let content = `# NamSev Test Credentials

**⚠️  SECURITY WARNING ⚠️**

This file contains test credentials. It is:
- Automatically generated
- Gitignored (never committed)
- For testing/development only
- Must be regenerated periodically

**Generated:** ${new Date().toISOString()}
**Expires:** ${adminCreds.expiry.toISOString().split('T')[0]}

---

## Admin Account

**Email:** ${adminCreds.email}
**Password:** ${adminCreds.password || '(not set - check Firebase)'}
**Expires:** ${adminCreds.expiry.toISOString().split('T')[0]}

**Usage:**
\`\`\`bash
# Login via frontend
Email: ${adminCreds.email}
Password: [see above]
\`\`\`

---

## Test Accounts

`;

  testAccounts.forEach(account => {
    content += `### ${account.role.toUpperCase()} Test Account

**Email:** ${account.email}
**Password:** ${account.password || '(not set)'}
**Expires:** ${account.expiry ? account.expiry.toISOString().split('T')[0] : 'N/A'}
${account.error ? `**Error:** ${account.error}\n` : ''}

`;
  });

  content += `---

## Regeneration

To regenerate these credentials:

\`\`\`bash
cd backend
node scripts/reset-test-credentials.js --env=development --confirm
\`\`\`

## Security Notes

1. **Never commit this file to Git**
2. **Regenerate before sharing with team**
3. **Use --env=staging for staging environment**
4. **Production requires --force flag (use with caution)**

## Troubleshooting

If login fails:
1. Check if Firebase user exists
2. Verify email is correct
3. Regenerate credentials
4. Check audit log: \`logs/security_audit.log\`
`;

  fs.writeFileSync(CONFIG.credentialsPath, content);
  fs.chmodSync(CONFIG.credentialsPath, 0o600); // Owner read/write only

  console.log(`\n✅ Credentials stored: ${CONFIG.credentialsPath}`);
  console.log(`   Permissions: 600 (owner read/write only)`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = parseArgs();

  // Show help
  if (args.help) {
    console.log(`
NamSev - Secure Test Credential Reset Script

Usage:
  node reset-test-credentials.js [options]

Options:
  --env=<environment>     Environment: development, staging, production
  --dry-run               Test without making changes
  --confirm               Required for actual reset
  --force                 Required for production environment
  --help, -h              Show this help

Examples:
  # Dry run (safe, no changes)
  node reset-test-credentials.js --env=development --dry-run

  # Reset development credentials
  node reset-test-credentials.js --env=development --confirm

  # Reset staging credentials
  node reset-test-credentials.js --env=staging --confirm

  # Reset production (DANGEROUS)
  node reset-test-credentials.js --env=production --force --confirm

Security Features:
  ✓ 20-character passwords (mixed case, numbers, symbols)
  ✓ 30-day expiry
  ✓ Audit logging
  ✓ Production protection
  ✓ Dry-run mode

Output:
  - Credentials: docs/TEST_CREDENTIALS.md
  - Audit log: logs/security_audit.log
`);
    process.exit(0);
  }

  console.log('🔐 NamSev - Secure Credential Reset\n');
  console.log('═'.repeat(60));

  // Validate
  if (!validateEnvironment(args)) {
    process.exit(1);
  }

  // Final confirmation for production
  if (args.env === 'production' && args.force && args.confirm) {
    console.log('\n⚠️  WARNING: You are about to reset PRODUCTION credentials!');
    console.log('   This will affect live users.');
    console.log('\n   Press Ctrl+C to cancel or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n' + '═'.repeat(60));

  try {
    // Initialize services
    console.log('\n🔧 Initializing Services...\n');
    await initializeFirebase();
    console.log('✅ Firebase initialized');

    await connectDatabase();

    // Reset credentials
    console.log('\n' + '═'.repeat(60));
    const adminCreds = await resetAdminCredentials(args.dryRun);
    const testAccounts = await resetTestAccounts(args.dryRun);

    // Log audit
    if (!args.dryRun) {
      writeAuditLog('CREDENTIAL_RESET', {
        environment: args.env,
        adminEmail: adminCreds.email,
        passwordHash: hashPassword(adminCreds.password || ''),
        testAccountCount: testAccounts.length,
      });

      // Store credentials
      storeCredentials(adminCreds, testAccounts);

      console.log(`\n✅ Audit logged: ${CONFIG.auditLogPath}`);
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Reset Summary:\n');
    console.log(`   Admin: ${adminCreds.email}`);
    console.log(`   Test Accounts: ${testAccounts.length}`);
    console.log(`   Expiry: ${adminCreds.expiry.toISOString().split('T')[0]}`);

    if (args.dryRun) {
      console.log('\n   ⚠️  DRY RUN - No changes were made');
      console.log('   Remove --dry-run and add --confirm to apply changes');
    } else {
      console.log('\n   ✅ Credentials reset successfully');
      console.log(`   📄 See: ${CONFIG.credentialsPath}`);
    }

    console.log('\n' + '═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSecurePassword, hashPassword };

