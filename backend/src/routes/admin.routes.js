const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Apply admin middleware to all routes
router.use(verifyToken, requireAdmin);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/pending', adminController.getPendingUsers);
router.put('/users/:id/approve', adminController.approveUser);
router.put('/users/:id/reject', adminController.rejectUser);

// Complaint management
router.get('/complaints', adminController.getAllComplaints);
router.put('/complaints/:id/status', adminController.updateComplaintStatus);
router.patch('/complaints/:id/visibility', adminController.toggleComplaintVisibility);
router.get('/complaints/analytics', adminController.getComplaintAnalytics);

module.exports = router;
