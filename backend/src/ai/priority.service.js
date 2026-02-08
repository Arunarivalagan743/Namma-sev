/**
 * Priority Scoring Service
 *
 * Automatically scores complaint priority based on:
 * - Keywords (urgent, high, normal, low)
 * - Category defaults
 * - Sentiment indicators
 *
 * Supports Tamil and Hindi keywords for multi-language detection.
 */

// Urgent keywords - immediate attention required
const URGENT_KEYWORDS = {
  en: [
    'accident', 'flood', 'fire', 'collapse', 'contaminated', 'outbreak',
    'emergency', 'danger', 'urgent', 'critical', 'life-threatening',
    'death', 'dying', 'drowning', 'electrocution', 'explosion',
    'immediate', 'crisis', 'disaster', 'toxic', 'poisoning'
  ],
  ta: [
    'விபத்து', 'வெள்ளம்', 'தீ', 'அவசரம்', 'ஆபத்து', 'மரணம்',
    'நெருக்கடி', 'பேரழிவு', 'விஷம்', 'கசிவு', 'இடிந்து'
  ],
  hi: [
    'दुर्घटना', 'बाढ़', 'आग', 'आपातकाल', 'खतरा', 'मौत',
    'संकट', 'आपदा', 'जहर', 'टूट', 'गिरा'
  ]
};

// High priority keywords - needs quick attention
const HIGH_KEYWORDS = {
  en: [
    'no water', 'power cut', 'blocked road', 'overflow', 'broken pipe',
    'sewage leak', 'electrical hazard', 'waterlogging', 'stagnant water',
    'open wire', 'exposed cable', 'gas leak', 'major pothole',
    'complete blackout', 'burst pipe', 'road cave-in', 'wall crack'
  ],
  ta: [
    'தண்ணீர் இல்லை', 'மின்சாரம் இல்லை', 'சாலை அடைப்பு',
    'கழிவு கசிவு', 'குழாய் உடைந்தது', 'மின் கம்பி'
  ],
  hi: [
    'पानी नहीं', 'बिजली कट', 'सड़क बंद', 'पाइप टूटा',
    'नाला भरा', 'बिजली का तार'
  ]
};

// Normal priority keywords
const NORMAL_KEYWORDS = {
  en: [
    'pothole', 'maintenance', 'cleaning', 'garbage', 'noise',
    'repair needed', 'dim light', 'irregular', 'delay', 'complaint'
  ],
  ta: [
    'குழி', 'பராமரிப்பு', 'சுத்தம்', 'குப்பை', 'சத்தம்'
  ],
  hi: [
    'गड्ढा', 'रखरखाव', 'सफाई', 'कचरा', 'शोर'
  ]
};

// Low priority keywords
const LOW_KEYWORDS = {
  en: [
    'suggestion', 'improvement', 'beautification', 'enhancement',
    'future', 'consider', 'request', 'would like', 'nice to have',
    'aesthetic', 'paint', 'garden', 'park bench'
  ],
  ta: [
    'பரிந்துரை', 'மேம்பாடு', 'அழகூட்டல்'
  ],
  hi: [
    'सुझाव', 'सुधार', 'सौंदर्यीकरण'
  ]
};

// Category-based default priorities
const CATEGORY_PRIORITY = {
  'Water Supply': 'high',
  'Electricity': 'high',
  'Public Health': 'high',
  'Sanitation': 'normal',
  'Street Lights': 'normal',
  'Road & Infrastructure': 'normal',
  'Drainage': 'normal',
  'Encroachment': 'low',
  'Noise Pollution': 'low',
  'Other': 'normal'
};

// Priority weights for scoring
const PRIORITY_WEIGHTS = {
  urgent: 100,
  high: 75,
  normal: 50,
  low: 25
};

/**
 * Check if text contains any keywords from a list
 * @param {string} text - Text to check
 * @param {Object} keywordMap - Map of language codes to keyword arrays
 * @returns {boolean}
 */
const containsKeyword = (text, keywordMap) => {
  const lowerText = text.toLowerCase();

  for (const lang of Object.keys(keywordMap)) {
    for (const keyword of keywordMap[lang]) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return { found: true, keyword, language: lang };
      }
    }
  }

  return { found: false };
};

/**
 * Score complaint priority
 * @param {string} title - Complaint title
 * @param {string} description - Complaint description
 * @param {string} category - Complaint category
 * @returns {Object} - Priority result with score and reasoning
 */
const scorePriority = (title, description, category) => {
  const text = `${title || ''} ${description || ''}`.trim();

  if (!text) {
    return {
      priority: 'normal',
      score: 50,
      confidence: 0.5,
      reason: 'No text provided',
      method: 'default'
    };
  }

  // Check urgent keywords first
  const urgentCheck = containsKeyword(text, URGENT_KEYWORDS);
  if (urgentCheck.found) {
    return {
      priority: 'urgent',
      score: 100,
      confidence: 0.95,
      reason: `Urgent keyword detected: "${urgentCheck.keyword}"`,
      method: 'keyword',
      detectedLanguage: urgentCheck.language
    };
  }

  // Check high priority keywords
  const highCheck = containsKeyword(text, HIGH_KEYWORDS);
  if (highCheck.found) {
    return {
      priority: 'high',
      score: 75,
      confidence: 0.85,
      reason: `High priority keyword detected: "${highCheck.keyword}"`,
      method: 'keyword',
      detectedLanguage: highCheck.language
    };
  }

  // Check low priority keywords
  const lowCheck = containsKeyword(text, LOW_KEYWORDS);
  if (lowCheck.found) {
    return {
      priority: 'low',
      score: 25,
      confidence: 0.8,
      reason: `Low priority keyword detected: "${lowCheck.keyword}"`,
      method: 'keyword',
      detectedLanguage: lowCheck.language
    };
  }

  // Fall back to category-based priority
  const categoryPriority = CATEGORY_PRIORITY[category] || 'normal';

  return {
    priority: categoryPriority,
    score: PRIORITY_WEIGHTS[categoryPriority],
    confidence: 0.7,
    reason: `Category-based default for "${category}"`,
    method: 'category'
  };
};

/**
 * Batch score multiple complaints
 * @param {Array} complaints - Array of complaints with title, description, category
 * @returns {Array} - Array of priority results
 */
const batchScorePriority = (complaints) => {
  return complaints.map(c => ({
    id: c.id || c._id,
    ...scorePriority(c.title, c.description, c.category)
  }));
};

/**
 * Get priority statistics for analytics
 * @param {Array} complaints - Array of complaints with priority scores
 * @returns {Object} - Statistics
 */
const getPriorityStats = (complaints) => {
  const counts = { urgent: 0, high: 0, normal: 0, low: 0 };
  const methodCounts = { keyword: 0, category: 0, default: 0 };

  complaints.forEach(c => {
    counts[c.priority] = (counts[c.priority] || 0) + 1;
    methodCounts[c.method] = (methodCounts[c.method] || 0) + 1;
  });

  return {
    total: complaints.length,
    byPriority: counts,
    byMethod: methodCounts,
    percentageKeywordDetected: (methodCounts.keyword / complaints.length * 100).toFixed(1)
  };
};

/**
 * Add custom keywords for a specific panchayat/region
 * @param {string} priority - Priority level
 * @param {string} language - Language code
 * @param {Array} keywords - Keywords to add
 */
const addCustomKeywords = (priority, language, keywords) => {
  const keywordMap = {
    urgent: URGENT_KEYWORDS,
    high: HIGH_KEYWORDS,
    normal: NORMAL_KEYWORDS,
    low: LOW_KEYWORDS
  }[priority];

  if (!keywordMap) {
    throw new Error(`Invalid priority: ${priority}`);
  }

  if (!keywordMap[language]) {
    keywordMap[language] = [];
  }

  keywordMap[language].push(...keywords);
  console.log(`Added ${keywords.length} custom ${priority} keywords for ${language}`);
};

module.exports = {
  scorePriority,
  batchScorePriority,
  getPriorityStats,
  addCustomKeywords,
  PRIORITY_WEIGHTS,
  CATEGORY_PRIORITY
};

