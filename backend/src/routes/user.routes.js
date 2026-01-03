const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, requireApprovedUser } = require('../middleware/auth.middleware');

// Get user profile
router.get('/profile', verifyToken, requireApprovedUser, userController.getProfile);

// Update user profile
router.put('/profile', verifyToken, requireApprovedUser, userController.updateProfile);

module.exports = router;
