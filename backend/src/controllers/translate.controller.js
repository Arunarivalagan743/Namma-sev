const axios = require('axios');

// Import AI translation cache service (graceful loading)
let translationCacheService = null;
try {
  translationCacheService = require('../ai/translation.cache');
  console.log('✅ Translation cache service loaded');
} catch (err) {
  console.warn('⚠️ Translation cache service not available:', err.message);
}

// Google Translate API Key
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const translationEnabled = !!GOOGLE_TRANSLATE_API_KEY;

if (translationEnabled) {
  console.log('✅ Google Translate API Key found - translation enabled');
} else {
  console.log('⚠️ GOOGLE_TRANSLATE_API_KEY not set - translation will return original text');
}

// Supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
];

/**
 * Call Google Translate API with timeout
 */
const translateWithApiKey = async (text, targetLanguage, sourceLanguage = 'en') => {
  const url = `https://translation.googleapis.com/language/translate/v2`;
  
  const response = await axios.post(url, null, {
    params: {
      q: text,
      target: targetLanguage,
      source: sourceLanguage,
      key: GOOGLE_TRANSLATE_API_KEY,
      format: 'text'
    },
    timeout: 5000
  });
  
  return response.data.data.translations[0].translatedText;
};

const translateController = {
  /**
   * GET /api/translate/languages
   */
  getSupportedLanguages: async (req, res) => {
    res.json({
      success: true,
      languages: SUPPORTED_LANGUAGES
    });
  },

  /**
   * POST /api/translate
   * Pipeline: Validate → Cache Check → API Call → Cache Store → Response
   */
  translateText: async (req, res) => {
    const startTime = Date.now();

    try {
      const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

      // Validate input
      if (!text || !targetLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Text and target language are required'
        });
      }

      // Same language - return original
      if (targetLanguage === sourceLanguage) {
        return res.json({
          success: true,
          translatedText: text,
          sourceLanguage,
          targetLanguage,
          latencyMs: Date.now() - startTime
        });
      }

      // Translation disabled - return original
      if (!translationEnabled) {
        return res.json({
          success: true,
          translatedText: text,
          sourceLanguage,
          targetLanguage,
          note: 'Translation service unavailable',
          latencyMs: Date.now() - startTime
        });
      }

      // Try cache first (if available)
      if (translationCacheService) {
        const cached = await translationCacheService.getCachedTranslation(
          text, sourceLanguage, targetLanguage
        );

        if (cached) {
          return res.json({
            success: true,
            translatedText: cached,
            sourceLanguage,
            targetLanguage,
            cached: true,
            latencyMs: Date.now() - startTime
          });
        }
      }

      // Call API
      const translatedText = await translateWithApiKey(text, targetLanguage, sourceLanguage);

      // Cache result asynchronously (non-blocking)
      if (translationCacheService) {
        translationCacheService.cacheTranslation(
          text, sourceLanguage, targetLanguage, translatedText
        ).catch(err => console.warn('Cache write failed:', err.message));
      }

      res.json({
        success: true,
        translatedText,
        sourceLanguage,
        targetLanguage,
        cached: false,
        latencyMs: Date.now() - startTime
      });

    } catch (error) {
      console.error('Translation error:', error.message);
      // Graceful degradation - return original text
      return res.json({
        success: true,
        translatedText: req.body.text,
        sourceLanguage: req.body.sourceLanguage || 'en',
        targetLanguage: req.body.targetLanguage,
        note: 'Translation failed - returning original text',
        latencyMs: Date.now() - startTime
      });
    }
  },

  /**
   * POST /api/translate/batch
   * Batch translate multiple texts
   */
  batchTranslate: async (req, res) => {
    const startTime = Date.now();

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

      // Limit batch size
      if (texts.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 texts per batch'
        });
      }

      // Same language - return original
      if (targetLanguage === sourceLanguage) {
        return res.json({
          success: true,
          translations: texts.map(text => ({ original: text, translated: text })),
          sourceLanguage,
          targetLanguage,
          latencyMs: Date.now() - startTime
        });
      }

      // Translate each text (with caching)
      const translations = await Promise.all(
        texts.map(async (text) => {
          try {
            // Check cache
            if (translationCacheService) {
              const cached = await translationCacheService.getCachedTranslation(
                text, sourceLanguage, targetLanguage
              );
              if (cached) {
                return { original: text, translated: cached, cached: true };
              }
            }

            // API call
            if (translationEnabled) {
              const translated = await translateWithApiKey(text, targetLanguage, sourceLanguage);

              // Cache asynchronously
              if (translationCacheService) {
                translationCacheService.cacheTranslation(
                  text, sourceLanguage, targetLanguage, translated
                ).catch(() => {});
              }

              return { original: text, translated, cached: false };
            }

            return { original: text, translated: text, cached: false };
          } catch {
            return { original: text, translated: text, error: true };
          }
        })
      );

      res.json({
        success: true,
        translations,
        sourceLanguage,
        targetLanguage,
        latencyMs: Date.now() - startTime
      });

    } catch (error) {
      console.error('Batch translation error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to translate texts'
      });
    }
  },

  /**
   * POST /api/translate/detect
   * Detect language of text (basic implementation)
   */
  detectLanguage: async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required'
        });
      }

      // Basic detection using character sets
      // Tamil
      if (/[\u0B80-\u0BFF]/.test(text)) {
        return res.json({
          success: true,
          detectedLanguage: 'ta',
          confidence: 0.9
        });
      }

      // Hindi/Devanagari
      if (/[\u0900-\u097F]/.test(text)) {
        return res.json({
          success: true,
          detectedLanguage: 'hi',
          confidence: 0.9
        });
      }

      // Telugu
      if (/[\u0C00-\u0C7F]/.test(text)) {
        return res.json({
          success: true,
          detectedLanguage: 'te',
          confidence: 0.9
        });
      }

      // Kannada
      if (/[\u0C80-\u0CFF]/.test(text)) {
        return res.json({
          success: true,
          detectedLanguage: 'kn',
          confidence: 0.9
        });
      }

      // Malayalam
      if (/[\u0D00-\u0D7F]/.test(text)) {
        return res.json({
          success: true,
          detectedLanguage: 'ml',
          confidence: 0.9
        });
      }

      // Default to English
      return res.json({
        success: true,
        detectedLanguage: 'en',
        confidence: 0.7
      });

    } catch (error) {
      console.error('Language detection error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to detect language'
      });
    }
  },

  /**
   * POST /api/translate/clear-cache
   * Clear translation cache (admin only)
   */
  clearCache: async (req, res) => {
    try {
      if (!translationCacheService) {
        return res.json({
          success: true,
          message: 'Cache service not available'
        });
      }

      const result = await translationCacheService.clearCache();

      res.json({
        success: true,
        message: 'Translation cache cleared',
        result
      });

    } catch (error) {
      console.error('Clear cache error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache'
      });
    }
  }
};

module.exports = translateController;
