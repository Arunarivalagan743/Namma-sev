const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { verifyToken, requireApprovedUser, requireAdmin, optionalAuth } = require('../middleware/auth.middleware');

// Get all announcements (public access)
router.get('/', optionalAuth, announcementController.getAnnouncements);

// Get single announcement (public access)
router.get('/:id', optionalAuth, announcementController.getAnnouncement);

// Create announcement (admin only)
router.post('/', verifyToken, requireAdmin, announcementController.createAnnouncement);

// Update announcement (admin only)
router.put('/:id', verifyToken, requireAdmin, announcementController.updateAnnouncement);

// Delete announcement (admin only)
router.delete('/:id', verifyToken, requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;
