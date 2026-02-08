const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { verifyToken, requireApprovedUser } = require('../middleware/auth.middleware');

// ==================== PUBLIC ROUTES ====================

// Track complaint by tracking ID (no auth required)
router.get('/track/:trackingId', complaintController.trackComplaint);

// Get public complaints with timelines (no auth required)
router.get('/public', complaintController.getPublicComplaints);

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

// Phase 4: Pre-submission enrichment and duplicate check
router.post('/preview/enrich', verifyToken, requireApprovedUser, complaintController.previewEnrichment);
router.post('/preview/duplicates', verifyToken, requireApprovedUser, complaintController.checkDuplicates);

// Create new complaint
router.post('/', verifyToken, requireApprovedUser, complaintController.createComplaint);

// Get user's complaints with stats
router.get('/my-complaints', verifyToken, requireApprovedUser, complaintController.getUserComplaints);

// Get single complaint with timeline
router.get('/:id', verifyToken, requireApprovedUser, complaintController.getComplaint);

// Phase 4: Get complaint summary
router.get('/:id/summary', verifyToken, requireApprovedUser, complaintController.getComplaintSummary);

// Phase 5: Submit AI feedback
router.post('/ai-feedback', verifyToken, requireApprovedUser, complaintController.submitAIFeedback);

// Submit feedback for resolved complaint
router.post('/:id/feedback', verifyToken, requireApprovedUser, complaintController.submitFeedback);

// Toggle complaint public visibility
router.patch('/:id/visibility', verifyToken, requireApprovedUser, complaintController.toggleComplaintVisibility);

module.exports = router;
