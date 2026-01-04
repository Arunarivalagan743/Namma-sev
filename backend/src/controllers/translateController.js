const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Google Translate API Key (simpler method for deployment)
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

// Check if translation is enabled
let translationEnabled = !!GOOGLE_TRANSLATE_API_KEY;

if (translationEnabled) {
  console.log('✅ Google Translate API Key found - translation enabled');
} else {
  console.log('⚠️ GOOGLE_TRANSLATE_API_KEY not set - translation will return original text');
}

const projectId = 'nam-sevai';
const location = 'global';

// Supported languages for the Panchayat website
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
];

// Cache for translations to reduce API calls
const translationCache = new Map();

// Helper function to translate using Google Translate API v2 (API Key method)
const translateWithApiKey = async (text, targetLanguage, sourceLanguage = 'en') => {
  const url = `https://translation.googleapis.com/language/translate/v2`;
  
  const response = await axios.post(url, null, {
    params: {
      q: text,
      target: targetLanguage,
      source: sourceLanguage,
      key: GOOGLE_TRANSLATE_API_KEY,
      format: 'text'
    }
  });
  
  return response.data.data.translations[0].translatedText;
};

const translateController = {
  // Get list of supported languages
  getSupportedLanguages: async (req, res) => {
    try {
      res.json({
        success: true,
        languages: SUPPORTED_LANGUAGES
      });
    } catch (error) {
      console.error('Error getting languages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get supported languages'
      });
    }
  },

  // Translate text
  translateText: async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Text and target language are required'
        });
      }

      // If target is same as source, return original text
      if (targetLanguage === sourceLanguage) {
        return res.json({
          success: true,
          translatedText: text,
          sourceLanguage,
          targetLanguage
        });
      }

      // If translation is disabled, return original text
      if (!translationEnabled) {
        return res.json({
          success: true,
          translatedText: text,
          sourceLanguage,
          targetLanguage,
          note: 'Translation service unavailable - returning original text'
        });
      }

      // Check cache first
      const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
      if (translationCache.has(cacheKey)) {
        return res.json({
          success: true,
          translatedText: translationCache.get(cacheKey),
          sourceLanguage,
          targetLanguage,
          cached: true
        });
      }

      // Call Google Translate API
      const translatedText = await translateWithApiKey(text, targetLanguage, sourceLanguage);

      // Cache the translation
      translationCache.set(cacheKey, translatedText);

      res.json({
        success: true,
        translatedText,
        sourceLanguage,
        targetLanguage
      });
    } catch (error) {
      console.error('Translation error:', error.message);
      // Return original text on error instead of failing
      return res.json({
        success: true,
        translatedText: req.body.text,
        sourceLanguage: req.body.sourceLanguage || 'en',
        targetLanguage: req.body.targetLanguage,
        note: 'Translation failed - returning original text'
      });
    }
  },

  // Batch translate multiple texts
  batchTranslate: async (req, res) => {
    try {
      const { texts, targetLanguage, sourceLanguage = 'en' } = req.body;

      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Texts array is required'
        });
      }

      if (!targetLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Target language is required'
        });
      }

      // If translation is disabled, return original texts
      if (!translationEnabled) {
        return res.json({
          success: true,
          translations: texts.map(text => ({ original: text, translated: text })),
          sourceLanguage,
          targetLanguage,
          note: 'Translation service unavailable - returning original texts'
        });
      }

      // If target is same as source, return original texts
      if (targetLanguage === sourceLanguage) {
        return res.json({
          success: true,
          translations: texts.map(text => ({ original: text, translated: text })),
          sourceLanguage,
          targetLanguage
        });
      }

      // Check which texts are cached and which need translation
      const results = [];
      const textsToTranslate = [];
      const indexMap = [];

      texts.forEach((text, index) => {
        const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
        if (translationCache.has(cacheKey)) {
          results[index] = {
            original: text,
            translated: translationCache.get(cacheKey),
            cached: true
          };
        } else {
          textsToTranslate.push(text);
          indexMap.push(index);
        }
      });

      // If all translations were cached
      if (textsToTranslate.length === 0) {
        return res.json({
          success: true,
          translations: results,
          sourceLanguage,
          targetLanguage
        });
      }

      // Translate uncached texts using API key method
      const translationPromises = textsToTranslate.map(text => 
        translateWithApiKey(text, targetLanguage, sourceLanguage)
      );
      
      const translatedTexts = await Promise.all(translationPromises);

      // Process and cache results
      translatedTexts.forEach((translatedText, i) => {
        const originalIndex = indexMap[i];
        const originalText = textsToTranslate[i];

        // Cache the translation
        const cacheKey = `${originalText}_${sourceLanguage}_${targetLanguage}`;
        translationCache.set(cacheKey, translatedText);

        results[originalIndex] = {
          original: originalText,
          translated: translatedText,
          cached: false
        };
      });

      res.json({
        success: true,
        translations: results,
        sourceLanguage,
        targetLanguage
      });
    } catch (error) {
      console.error('Batch translation error:', error.message);
      // Return original texts on error
      return res.json({
        success: true,
        translations: req.body.texts.map(text => ({ original: text, translated: text })),
        sourceLanguage: req.body.sourceLanguage || 'en',
        targetLanguage: req.body.targetLanguage,
        note: 'Batch translation failed - returning original texts'
      });
    }
  },

  // Detect language of text
  detectLanguage: async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required'
        });
      }

      if (!translationEnabled) {
        return res.json({
          success: true,
          language: 'en',
          confidence: 0,
          note: 'Detection unavailable - defaulting to English'
        });
      }

      // Use Google Translate API v2 for detection
      const url = `https://translation.googleapis.com/language/translate/v2/detect`;
      const response = await axios.post(url, null, {
        params: {
          q: text,
          key: GOOGLE_TRANSLATE_API_KEY
        }
      });

      const detectedLanguage = response.data.data.detections[0][0];

      res.json({
        success: true,
        language: detectedLanguage.language,
        confidence: detectedLanguage.confidence
      });
    } catch (error) {
      console.error('Language detection error:', error.message);
      res.json({
        success: true,
        language: 'en',
        confidence: 0,
        note: 'Detection failed - defaulting to English'
      });
    }
  },

  // Clear translation cache (admin only)
  clearCache: async (req, res) => {
    try {
      translationCache.clear();
      res.json({
        success: true,
        message: 'Translation cache cleared'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache'
      });
    }
  }
};

module.exports = translateController;
