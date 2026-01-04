const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { ADMIN_EMAIL } = require('../middleware/auth.middleware');

const PANCHAYAT_CODE = process.env.PANCHAYAT_CODE || 'TIRU001';

/**
 * Register new citizen
 */
const register = async (req, res) => {
  try {
    const { name, phone, address, aadhaarLast4 } = req.body;
    const { firebaseUid, email } = req.user;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Name, phone, and address are required' 
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id, firebase_uid, email FROM users WHERE firebase_uid = ? OR email = ?',
      [firebaseUid, email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // If same Firebase UID, user is already fully registered
      if (existingUser.firebase_uid === firebaseUid) {
        console.log(`User registration conflict - Firebase UID already exists: ${firebaseUid}`);
        return res.status(409).json({ 
          error: 'Conflict',
          message: 'User already registered',
          conflictType: 'firebase_uid'
        });
      }
      
      // If same email but different Firebase UID, update the existing record
      if (existingUser.email === email && existingUser.firebase_uid !== firebaseUid) {
        console.log(`Updating existing user record with new Firebase UID - Email: ${email}, Old UID: ${existingUser.firebase_uid}, New UID: ${firebaseUid}`);
        
        try {
          await pool.execute(
            'UPDATE users SET firebase_uid = ?, updated_at = NOW() WHERE email = ?',
            [firebaseUid, email]
          );
          
          // Return the updated user info
          const [updatedUser] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
          );
          
          return res.status(200).json({
            success: true,
            message: 'Account linked successfully',
            user: {
              id: updatedUser[0].id,
              email: updatedUser[0].email,
              name: updatedUser[0].name,
              role: updatedUser[0].role,
              status: updatedUser[0].status,
              panchayatCode: updatedUser[0].panchayat_code
            }
          });
        } catch (updateError) {
          console.error('Failed to update user Firebase UID:', updateError);
          return res.status(500).json({
            error: 'Update Failed',
            message: 'Failed to link account'
          });
        }
      }
    }

    // Determine role based on email
    const role = email === ADMIN_EMAIL ? 'admin' : 'citizen';
    const status = role === 'admin' ? 'approved' : 'pending';

    // Insert new user
    const userId = uuidv4();
    await pool.execute(
      `INSERT INTO users (id, firebase_uid, email, name, phone, address, aadhaar_last4, panchayat_code, role, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, firebaseUid, email, name, phone, address, aadhaarLast4 || null, PANCHAYAT_CODE, role, status]
    );

    res.status(201).json({
      success: true,
      message: role === 'admin' 
        ? 'Admin account created successfully' 
        : 'Registration submitted. Pending admin approval.',
      user: {
        id: userId,
        email,
        name,
        role,
        status,
        panchayatCode: PANCHAYAT_CODE
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration Failed',
      message: 'Unable to complete registration' 
    });
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user.isRegistered) {
      return res.json({
        isRegistered: false,
        email: req.user.email,
        isAdmin: req.user.email === ADMIN_EMAIL
      });
    }

    res.json({
      isRegistered: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role,
        status: req.user.status,
        panchayatCode: req.user.panchayat_code,
        createdAt: req.user.created_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
};

/**
 * Check if email is admin
 */
const checkAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    res.json({
      isAdmin: email === ADMIN_EMAIL
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to check admin status' });
  }
};

/**
 * Get user status
 */
const getUserStatus = async (req, res) => {
  try {
    if (!req.user.isRegistered) {
      return res.json({
        status: 'not_registered',
        message: 'User needs to complete registration'
      });
    }

    res.json({
      status: req.user.status,
      role: req.user.role,
      message: getStatusMessage(req.user.status)
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get user status' });
  }
};

const getStatusMessage = (status) => {
  switch (status) {
    case 'pending':
      return 'Your registration is pending admin approval';
    case 'approved':
      return 'Your account is active';
    case 'rejected':
      return 'Your registration was not approved';
    default:
      return 'Unknown status';
  }
};

module.exports = {
  register,
  getCurrentUser,
  checkAdmin,
  getUserStatus
};
