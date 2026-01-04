const { admin } = require('../config/firebase');
const { User } = require('../models');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'panchayat.office@gmail.com';

/**
 * Verify Firebase ID Token
 * Extracts user information from the token and attaches to request
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get user from database - check by firebaseUid OR email
      let user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      // If not found by firebaseUid, try finding by email and update firebaseUid
      if (!user && decodedToken.email) {
        user = await User.findOne({ email: decodedToken.email });
        if (user) {
          // Update the firebaseUid for this user
          user.firebaseUid = decodedToken.uid;
          await user.save();
          console.log(`Updated firebaseUid for user: ${decodedToken.email}`);
        }
      }

      if (!user) {
        // User exists in Firebase but not in our database
        req.user = {
          firebaseUid: decodedToken.uid,
          uid: decodedToken.uid, // Alias for backwards compatibility
          email: decodedToken.email,
          isRegistered: false
        };
      } else {
        req.user = {
          id: user._id,
          firebaseUid: decodedToken.uid,
          uid: decodedToken.uid, // Alias for backwards compatibility
          email: user.email,
          name: user.name,
          phone: user.phone,
          address: user.address,
          role: user.role,
          status: user.status,
          panchayat_code: user.panchayatCode,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          isRegistered: true
        };
      }

      next();
    } catch (firebaseError) {
      console.error('Firebase verification failed:', firebaseError.message);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Check if user is approved citizen
 */
const requireApprovedUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isRegistered) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'User not registered in system' 
      });
    }

    if (req.user.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Pending Approval', 
        message: 'Your account is pending admin approval' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Check if user is admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    const userEmail = req.user.email;
    
    if (userEmail !== ADMIN_EMAIL) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Admin authorization check failed' });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  // If token exists, verify it
  return verifyToken(req, res, next);
};

module.exports = {
  verifyToken,
  requireApprovedUser,
  requireAdmin,
  optionalAuth,
  ADMIN_EMAIL
};
