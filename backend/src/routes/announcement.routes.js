const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { verifyToken, requireApprovedUser, requireAdmin } = require('../middleware/auth.middleware');

// Get all announcements (for approved users)
router.get('/', verifyToken, requireApprovedUser, announcementController.getAnnouncements);

// Get single announcement
router.get('/:id', verifyToken, requireApprovedUser, announcementController.getAnnouncement);

// Create announcement (admin only)
router.post('/', verifyToken, requireAdmin, announcementController.createAnnouncement);

// Update announcement (admin only)
router.put('/:id', verifyToken, requireAdmin, announcementController.updateAnnouncement);

// Delete announcement (admin only)
router.delete('/:id', verifyToken, requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;
