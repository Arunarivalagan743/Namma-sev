const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');

// Get supported languages (public)
router.get('/languages', translateController.getSupportedLanguages);

// Translate text (public)
router.post('/translate', translateController.translateText);

// Batch translate (public)
router.post('/batch', translateController.batchTranslate);

// Detect language (public)
router.post('/detect', translateController.detectLanguage);

// Clear cache (admin only - add auth middleware in production)
router.post('/clear-cache', translateController.clearCache);

module.exports = router;
