const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { verifyToken, requireApprovedUser } = require('../middleware/auth.middleware');

// Create new complaint
router.post('/', verifyToken, requireApprovedUser, complaintController.createComplaint);

// Get user's complaints
router.get('/my-complaints', verifyToken, requireApprovedUser, complaintController.getUserComplaints);

// Get single complaint
router.get('/:id', verifyToken, requireApprovedUser, complaintController.getComplaint);

module.exports = router;
