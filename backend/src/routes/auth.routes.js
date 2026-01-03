const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Register new citizen
router.post('/register', verifyToken, authController.register);

// Get current user profile
router.get('/me', verifyToken, authController.getCurrentUser);

// Check if email is admin
router.post('/check-admin', authController.checkAdmin);

// Verify user status
router.get('/status', verifyToken, authController.getUserStatus);

module.exports = router;
