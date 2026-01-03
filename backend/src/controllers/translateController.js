const { TranslationServiceClient } = require('@google-cloud/translate');
const path = require('path');

// Initialize the Translation client with service account
const translationClient = new TranslationServiceClient({
  keyFilename: path.join(__dirname, '../config/google-translate-service-account.json')
});

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

      // Prepare request for Google Cloud Translation API v3
      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: Array.isArray(text) ? text : [text],
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage
      };

      // Call the Translation API
      const [response] = await translationClient.translateText(request);

      // Extract translated text
      const translations = response.translations.map(t => t.translatedText);
      const translatedText = Array.isArray(text) ? translations : translations[0];

      // Cache the translation
      translationCache.set(cacheKey, translatedText);

      res.json({
        success: true,
        translatedText,
        sourceLanguage,
        targetLanguage
      });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({
        success: false,
        message: 'Translation failed',
        error: error.message
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

      // Translate uncached texts
      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: textsToTranslate,
        mimeType: 'text/plain',
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage
      };

      const [response] = await translationClient.translateText(request);

      // Process and cache results
      response.translations.forEach((translation, i) => {
        const originalIndex = indexMap[i];
        const originalText = textsToTranslate[i];
        const translatedText = translation.translatedText;

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
      console.error('Batch translation error:', error);
      res.status(500).json({
        success: false,
        message: 'Batch translation failed',
        error: error.message
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

      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        content: text
      };

      const [response] = await translationClient.detectLanguage(request);
      const detectedLanguage = response.languages[0];

      res.json({
        success: true,
        language: detectedLanguage.languageCode,
        confidence: detectedLanguage.confidence
      });
    } catch (error) {
      console.error('Language detection error:', error);
      res.status(500).json({
        success: false,
        message: 'Language detection failed',
        error: error.message
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
