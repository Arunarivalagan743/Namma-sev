const express = require('express');
const router = express.Router();
const engagementController = require('../controllers/engagementController');
const { verifyToken, requireAdmin, optionalAuth, requireApprovedUser } = require('../middleware/auth.middleware');

// ============ PUBLIC ROUTES (No Auth Required) ============

// Home page aggregate data
router.get('/home', engagementController.getHomeData);

// News
router.get('/news', engagementController.getNews);

// Meetings (with optional auth to get user's RSVP status)
router.get('/meetings', optionalAuth, engagementController.getMeetings);

// Schemes (with optional auth to get user's bookmarks)
router.get('/schemes', optionalAuth, engagementController.getSchemes);

// Alerts
router.get('/alerts', engagementController.getAlerts);

// Polls (with optional auth to get user's votes)
router.get('/polls', optionalAuth, engagementController.getPolls);

// Events
router.get('/events', engagementController.getEvents);

// Works
router.get('/works', engagementController.getWorks);

// Budget
router.get('/budget', engagementController.getBudget);

// FAQs
router.get('/faqs', engagementController.getFaqs);

// Suggestions (with optional auth to get user's upvotes)
router.get('/suggestions', optionalAuth, engagementController.getSuggestions);

// ============ USER ROUTES (Auth Required + Approved) ============

// Meeting RSVP
router.post('/meetings/:id/rsvp', verifyToken, requireApprovedUser, engagementController.rsvpMeeting);

// Scheme Bookmark
router.post('/schemes/:id/bookmark', verifyToken, requireApprovedUser, engagementController.bookmarkScheme);

// Poll Vote
router.post('/polls/:id/vote', verifyToken, requireApprovedUser, engagementController.votePoll);

// Submit Suggestion
router.post('/suggestions', verifyToken, requireApprovedUser, engagementController.createSuggestion);

// Upvote Suggestion
router.post('/suggestions/:id/upvote', verifyToken, requireApprovedUser, engagementController.upvoteSuggestion);

// ============ ADMIN ROUTES ============

// News Management
router.post('/admin/news', verifyToken, requireAdmin, engagementController.createNews);
router.put('/admin/news/:id', verifyToken, requireAdmin, engagementController.updateNews);
router.delete('/admin/news/:id', verifyToken, requireAdmin, engagementController.deleteNews);

// Meeting Management
router.post('/admin/meetings', verifyToken, requireAdmin, engagementController.createMeeting);
router.put('/admin/meetings/:id', verifyToken, requireAdmin, engagementController.updateMeeting);
router.delete('/admin/meetings/:id', verifyToken, requireAdmin, engagementController.deleteMeeting);

// Scheme Management
router.post('/admin/schemes', verifyToken, requireAdmin, engagementController.createScheme);
router.put('/admin/schemes/:id', verifyToken, requireAdmin, engagementController.updateScheme);
router.delete('/admin/schemes/:id', verifyToken, requireAdmin, engagementController.deleteScheme);

// Alert Management
router.post('/admin/alerts', verifyToken, requireAdmin, engagementController.createAlert);
router.put('/admin/alerts/:id', verifyToken, requireAdmin, engagementController.updateAlert);
router.delete('/admin/alerts/:id', verifyToken, requireAdmin, engagementController.deleteAlert);

// Poll Management
router.post('/admin/polls', verifyToken, requireAdmin, engagementController.createPoll);
router.put('/admin/polls/:id', verifyToken, requireAdmin, engagementController.updatePoll);
router.delete('/admin/polls/:id', verifyToken, requireAdmin, engagementController.deletePoll);

// Event Management
router.post('/admin/events', verifyToken, requireAdmin, engagementController.createEvent);
router.put('/admin/events/:id', verifyToken, requireAdmin, engagementController.updateEvent);
router.delete('/admin/events/:id', verifyToken, requireAdmin, engagementController.deleteEvent);

// Works Management
router.post('/admin/works', verifyToken, requireAdmin, engagementController.createWork);
router.put('/admin/works/:id', verifyToken, requireAdmin, engagementController.updateWork);
router.delete('/admin/works/:id', verifyToken, requireAdmin, engagementController.deleteWork);
router.post('/admin/works/:id/progress', verifyToken, requireAdmin, engagementController.addWorkProgress);

// Budget Management
router.post('/admin/budget', verifyToken, requireAdmin, engagementController.updateBudget);
router.delete('/admin/budget/:id', verifyToken, requireAdmin, engagementController.deleteBudget);

// FAQ Management
router.post('/admin/faqs', verifyToken, requireAdmin, engagementController.createFaq);
router.put('/admin/faqs/:id', verifyToken, requireAdmin, engagementController.updateFaq);
router.delete('/admin/faqs/:id', verifyToken, requireAdmin, engagementController.deleteFaq);

// Suggestion Management (Admin)
router.put('/admin/suggestions/:id', verifyToken, requireAdmin, engagementController.updateSuggestionStatus);

module.exports = router;
