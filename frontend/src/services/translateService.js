import api from './api';

const translateService = {
  // Get supported languages
  getLanguages: async () => {
    const response = await api.get('/translate/languages');
    return response.data;
  },

  // Translate single text
  translate: async (text, targetLanguage, sourceLanguage = 'en') => {
    const response = await api.post('/translate/translate', {
      text,
      targetLanguage,
      sourceLanguage
    });
    return response.data;
  },

  // Batch translate multiple texts
  batchTranslate: async (texts, targetLanguage, sourceLanguage = 'en') => {
    const response = await api.post('/translate/batch', {
      texts,
      targetLanguage,
      sourceLanguage
    });
    return response.data;
  },

  // Detect language
  detectLanguage: async (text) => {
    const response = await api.post('/translate/detect', { text });
    return response.data;
  }
};

export default translateService;
