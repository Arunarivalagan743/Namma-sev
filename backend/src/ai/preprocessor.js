/**
 * Text Preprocessor Service
 *
 * Common text preprocessing functions used by all AI services.
 * Handles Tamil, Hindi, and English text normalization.
 */

// Tamil stopwords
const TAMIL_STOPWORDS = new Set([
  'மற்றும்', 'இது', 'ஒரு', 'என்று', 'இந்த', 'அந்த', 'என்', 'அது',
  'இருக்கிறது', 'உள்ளது', 'செய்து', 'போது', 'என்ன', 'ஆனால்',
  'இருந்து', 'வேண்டும்', 'கொண்டு', 'என்பது', 'தான்', 'இல்லை'
]);

// Hindi stopwords
const HINDI_STOPWORDS = new Set([
  'और', 'एक', 'में', 'की', 'है', 'यह', 'के', 'से', 'को', 'पर',
  'इस', 'का', 'था', 'कि', 'जो', 'हैं', 'वह', 'इसे', 'थे', 'तो',
  'जब', 'होता', 'अपने', 'करने', 'किया', 'साथ'
]);

// English stopwords
const ENGLISH_STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'is', 'are', 'was', 'were', 'been', 'being'
]);

/**
 * Detect the primary language of text
 * Simple heuristic based on character ranges
 */
const detectLanguage = (text) => {
  const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

  const total = tamilChars + hindiChars + englishChars;
  if (total === 0) return 'en';

  if (tamilChars / total > 0.3) return 'ta';
  if (hindiChars / total > 0.3) return 'hi';
  return 'en';
};

/**
 * Remove stopwords from text
 */
const removeStopwords = (text, language = 'auto') => {
  const lang = language === 'auto' ? detectLanguage(text) : language;

  const stopwords = {
    ta: TAMIL_STOPWORDS,
    hi: HINDI_STOPWORDS,
    en: ENGLISH_STOPWORDS
  }[lang] || ENGLISH_STOPWORDS;

  return text
    .split(/\s+/)
    .filter(word => !stopwords.has(word.toLowerCase()))
    .join(' ');
};

/**
 * Normalize text for processing
 * Removes special characters while preserving Tamil/Hindi scripts
 */
const normalize = (text) => {
  if (!text) return '';

  return text
    // Convert to lowercase (for English only, script languages preserved)
    .toLowerCase()
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, ' ')
    // Remove email addresses
    .replace(/[\w.-]+@[\w.-]+/g, ' ')
    // Remove phone numbers (Indian format)
    .replace(/(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/g, ' ')
    // Keep Tamil (0B80-0BFF), Hindi (0900-097F), and English chars
    .replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F.,!?-]/g, ' ')
    // Normalize whitespace again
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Full preprocessing pipeline
 */
const preprocess = (text, options = {}) => {
  const {
    removeStops = true,
    detectLang = true
  } = options;

  let processed = normalize(text);

  let language = 'en';
  if (detectLang) {
    language = detectLanguage(processed);
  }

  if (removeStops) {
    processed = removeStopwords(processed, language);
  }

  return processed;
};

/**
 * Extract key phrases from text
 * Simple n-gram extraction
 */
const extractKeyPhrases = (text, n = 2) => {
  const words = preprocess(text).split(/\s+/).filter(w => w.length > 2);
  const phrases = [];

  for (let i = 0; i <= words.length - n; i++) {
    phrases.push(words.slice(i, i + n).join(' '));
  }

  return phrases;
};

/**
 * Tokenize text into words
 */
const tokenize = (text) => {
  return preprocess(text)
    .split(/\s+/)
    .filter(w => w.length > 0);
};

/**
 * Calculate text similarity using Jaccard coefficient
 * Simple but effective for duplicate detection
 */
const jaccardSimilarity = (text1, text2) => {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

/**
 * Check if text is too short for meaningful analysis
 */
const isTooShort = (text, minLength = 10) => {
  return preprocess(text).length < minLength;
};

/**
 * Truncate text to maximum length while preserving word boundaries
 */
const truncate = (text, maxLength = 500) => {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
};

module.exports = {
  detectLanguage,
  removeStopwords,
  normalize,
  preprocess,
  extractKeyPhrases,
  tokenize,
  jaccardSimilarity,
  isTooShort,
  truncate,
  // Expose stopword sets for customization
  TAMIL_STOPWORDS,
  HINDI_STOPWORDS,
  ENGLISH_STOPWORDS
};

