import api from './api';

// Cache for translations to avoid repeated API calls
const translationCache = new Map();

// Request queue to prevent too many concurrent requests
let pendingRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue = [];

const processQueue = async () => {
  if (requestQueue.length === 0 || pendingRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }
  
  const { resolve, reject, fn } = requestQueue.shift();
  pendingRequests++;
  
  try {
    const result = await fn();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    pendingRequests--;
    processQueue();
  }
};

const queueRequest = (fn) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, fn });
    processQueue();
  });
};

const translateService = {
  // Get supported languages
  getLanguages: async () => {
    const response = await api.get('/translate/languages');
    return response.data;
  },

  // Translate single text with caching and queueing
  translate: async (text, targetLanguage, sourceLanguage = 'en') => {
    // Return original if same language
    if (targetLanguage === sourceLanguage) {
      return { success: true, translatedText: text };
    }

    // Check cache first
    const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}`;
    if (translationCache.has(cacheKey)) {
      return { success: true, translatedText: translationCache.get(cacheKey), cached: true };
    }

    // Queue the request to prevent overwhelming the server
    return queueRequest(async () => {
      try {
        const response = await api.post('/translate/translate', {
          text,
          targetLanguage,
          sourceLanguage
        }, { timeout: 10000 }); // 10 second timeout
        
        // Cache the result
        if (response.data.success && response.data.translatedText) {
          translationCache.set(cacheKey, response.data.translatedText);
        }
        
        return response.data;
      } catch (error) {
        // Return original text on error
        console.error('Translation error:', error.message);
        return { success: true, translatedText: text, error: true };
      }
    });
  },

  // Batch translate multiple texts
  batchTranslate: async (texts, targetLanguage, sourceLanguage = 'en') => {
    if (targetLanguage === sourceLanguage) {
      return { 
        success: true, 
        translations: texts.map(text => ({ original: text, translated: text })) 
      };
    }

    try {
      const response = await api.post('/translate/batch', {
        texts,
        targetLanguage,
        sourceLanguage
      }, { timeout: 30000 }); // 30 second timeout for batch
      return response.data;
    } catch (error) {
      console.error('Batch translation error:', error.message);
      return { 
        success: true, 
        translations: texts.map(text => ({ original: text, translated: text })),
        error: true 
      };
    }
  },

  // Detect language
  detectLanguage: async (text) => {
    try {
      const response = await api.post('/translate/detect', { text }, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { success: true, language: 'en', confidence: 0 };
    }
  },

  // Clear local cache
  clearCache: () => {
    translationCache.clear();
  }
};

export default translateService;
