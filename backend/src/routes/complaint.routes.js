const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { verifyToken, requireApprovedUser } = require('../middleware/auth.middleware');

// ==================== PUBLIC ROUTES ====================

// Track complaint by tracking ID (no auth required)
router.get('/track/:trackingId', complaintController.trackComplaint);

// Get wards list (no auth required)
router.get('/wards', complaintController.getWards);

// Get categories (no auth required)
router.get('/categories', (req, res) => {
  res.json({ 
    categories: complaintController.COMPLAINT_CATEGORIES,
    priorities: complaintController.PRIORITY_LEVELS
  });
});

// ==================== PROTECTED ROUTES ====================

// Create new complaint
router.post('/', verifyToken, requireApprovedUser, complaintController.createComplaint);

// Get user's complaints with stats
router.get('/my-complaints', verifyToken, requireApprovedUser, complaintController.getUserComplaints);

// Get single complaint with timeline
router.get('/:id', verifyToken, requireApprovedUser, complaintController.getComplaint);

// Submit feedback for resolved complaint
router.post('/:id/feedback', verifyToken, requireApprovedUser, complaintController.submitFeedback);

module.exports = router;
