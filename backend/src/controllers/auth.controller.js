const { User } = require('../models');
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

    // Check if user already exists by firebaseUid first
    let existingUser = await User.findOne({ firebaseUid: firebaseUid });
    
    if (existingUser) {
      // User already registered with this Firebase UID - return success with existing user
      console.log(`User already registered with Firebase UID: ${firebaseUid}`);
      return res.status(200).json({
        success: true,
        message: 'User already registered',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          status: existingUser.status,
          panchayatCode: existingUser.panchayatCode
        }
      });
    }

    // Check if user exists with same email but different firebaseUid
    existingUser = await User.findOne({ email: email });

    if (existingUser) {
      // Update the existing record with new Firebase UID
      console.log(`Updating existing user record with new Firebase UID - Email: ${email}`);
      
      try {
        existingUser.firebaseUid = firebaseUid;
        existingUser.name = name;
        existingUser.phone = phone;
        existingUser.address = address;
        if (aadhaarLast4) existingUser.aadhaarLast4 = aadhaarLast4;
        await existingUser.save();
        
        return res.status(200).json({
          success: true,
          message: 'Account linked successfully',
          user: {
            id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            status: existingUser.status,
            panchayatCode: existingUser.panchayatCode
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

    // Determine role based on email
    const role = email === ADMIN_EMAIL ? 'admin' : 'citizen';
    const status = role === 'admin' ? 'approved' : 'pending';

    // Create new user
    const newUser = new User({
      _id: uuidv4(),
      firebaseUid,
      email,
      name,
      phone,
      address,
      aadhaarLast4: aadhaarLast4 || null,
      panchayatCode: PANCHAYAT_CODE,
      role,
      status
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: role === 'admin' 
        ? 'Admin account created successfully' 
        : 'Registration submitted. Pending admin approval.',
      user: {
        id: newUser._id,
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
