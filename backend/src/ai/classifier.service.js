/**
 * Complaint Classification Service
 *
 * Classifies complaints into categories using:
 * 1. Keyword-based matching (fast, no ML)
 * 2. TF-IDF similarity (medium accuracy)
 * 3. ONNX model inference (optional, high accuracy)
 *
 * Categories:
 * - Road & Infrastructure
 * - Water Supply
 * - Electricity
 * - Sanitation
 * - Street Lights
 * - Drainage
 * - Public Health
 * - Encroachment
 * - Noise Pollution
 * - Other
 */

const preprocessor = require('./preprocessor');

// Complaint categories
const CATEGORIES = [
  'Road & Infrastructure',
  'Water Supply',
  'Electricity',
  'Sanitation',
  'Street Lights',
  'Drainage',
  'Public Health',
  'Encroachment',
  'Noise Pollution',
  'Other'
];

// Category keywords for rule-based classification
const CATEGORY_KEYWORDS = {
  'Road & Infrastructure': {
    en: ['road', 'pothole', 'tar', 'asphalt', 'bridge', 'footpath', 'sidewalk',
         'pavement', 'street', 'highway', 'lane', 'construction', 'repair',
         'broken road', 'damaged road', 'cave-in', 'crack'],
    ta: ['சாலை', 'குழி', 'தார்', 'பாலம்', 'நடைபாதை', 'விரிசல்'],
    hi: ['सड़क', 'गड्ढा', 'पुल', 'फुटपाथ', 'रास्ता']
  },
  'Water Supply': {
    en: ['water', 'pipe', 'tap', 'supply', 'tank', 'bore', 'well', 'drinking',
         'no water', 'low pressure', 'burst pipe', 'leak', 'contaminated',
         'dirty water', 'pipeline', 'plumbing'],
    ta: ['தண்ணீர்', 'குழாய்', 'குடிநீர்', 'கிணறு', 'தொட்டி', 'கசிவு'],
    hi: ['पानी', 'नल', 'पाइप', 'टंकी', 'कुआं', 'रिसाव']
  },
  'Electricity': {
    en: ['electricity', 'power', 'electric', 'wire', 'cable', 'transformer',
         'voltage', 'current', 'meter', 'bill', 'outage', 'blackout',
         'power cut', 'electric shock', 'short circuit', 'pole'],
    ta: ['மின்சாரம்', 'மின்', 'கம்பி', 'மின்மாற்றி', 'மீட்டர்'],
    hi: ['बिजली', 'तार', 'ट्रांसफार्मर', 'मीटर', 'वोल्टेज']
  },
  'Sanitation': {
    en: ['garbage', 'waste', 'trash', 'rubbish', 'dump', 'dustbin', 'cleaning',
         'dirty', 'filthy', 'unhygienic', 'toilet', 'public toilet', 'urinal',
         'sweeping', 'cleanliness'],
    ta: ['குப்பை', 'கழிவு', 'தூய்மை', 'அழுக்கு', 'கழிப்பறை'],
    hi: ['कचरा', 'कूड़ा', 'सफाई', 'गंदगी', 'शौचालय']
  },
  'Street Lights': {
    en: ['street light', 'lamp', 'bulb', 'lighting', 'dark', 'dim', 'not working',
         'light pole', 'led', 'sodium', 'night', 'illumination'],
    ta: ['தெரு விளக்கு', 'விளக்கு', 'வெளிச்சம்', 'இருள்'],
    hi: ['स्ट्रीट लाइट', 'बल्ब', 'रोशनी', 'अंधेरा']
  },
  'Drainage': {
    en: ['drain', 'drainage', 'sewage', 'sewer', 'gutter', 'canal', 'overflow',
         'blocked drain', 'clogged', 'waterlogging', 'flooding', 'stagnant'],
    ta: ['வடிகால்', 'கழிவுநீர்', 'சாக்கடை', 'தேங்கி', 'அடைப்பு'],
    hi: ['नाला', 'सीवर', 'नाली', 'जलभराव', 'बंद']
  },
  'Public Health': {
    en: ['health', 'disease', 'mosquito', 'dengue', 'malaria', 'epidemic',
         'hospital', 'clinic', 'medical', 'doctor', 'medicine', 'vaccination',
         'infection', 'breeding', 'stray dog', 'dog bite'],
    ta: ['சுகாதாரம்', 'நோய்', 'கொசு', 'டெங்கு', 'மருத்துவமனை'],
    hi: ['स्वास्थ्य', 'बीमारी', 'मच्छर', 'डेंगू', 'अस्पताल']
  },
  'Encroachment': {
    en: ['encroachment', 'illegal', 'occupation', 'construction', 'unauthorized',
         'trespass', 'boundary', 'government land', 'public space', 'footpath blocked'],
    ta: ['ஆக்கிரமிப்பு', 'அத்துமீறல்', 'அங்கீகாரமற்ற', 'கட்டுமானம்'],
    hi: ['अतिक्रमण', 'अवैध', 'कब्जा', 'निर्माण']
  },
  'Noise Pollution': {
    en: ['noise', 'loud', 'sound', 'music', 'speaker', 'horn', 'disturbance',
         'party', 'function', 'construction noise', 'factory', 'industrial'],
    ta: ['சத்தம்', 'ஒலி', 'இரைச்சல்', 'தொந்தரவு'],
    hi: ['शोर', 'आवाज', 'ध्वनि', 'परेशानी']
  }
};

/**
 * Calculate keyword match score for a category
 */
const getKeywordScore = (text, category) => {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords) return 0;

  const lowerText = text.toLowerCase();
  let score = 0;
  let matchedKeywords = [];

  for (const lang of Object.keys(keywords)) {
    for (const keyword of keywords[lang]) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += keyword.includes(' ') ? 2 : 1; // Phrase matches score higher
        matchedKeywords.push(keyword);
      }
    }
  }

  return { score, matchedKeywords };
};

/**
 * Classify complaint using keyword matching
 * Returns category with confidence score
 */
const classifyByKeywords = (text) => {
  const scores = {};
  const details = {};

  for (const category of CATEGORIES) {
    if (category === 'Other') continue;

    const result = getKeywordScore(text, category);
    scores[category] = result.score;
    details[category] = result.matchedKeywords;
  }

  // Find category with highest score
  let maxScore = 0;
  let bestCategory = 'Other';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  // Calculate confidence based on score margin
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const margin = sortedScores[0] - (sortedScores[1] || 0);
  const confidence = maxScore === 0 ? 0.3 : Math.min(0.95, 0.5 + (margin * 0.1));

  return {
    category: bestCategory,
    confidence,
    score: maxScore,
    matchedKeywords: details[bestCategory] || [],
    method: 'keyword'
  };
};

/**
 * Main classification function
 * Uses keyword matching by default, can be extended with ML
 */
const classify = async (text, options = {}) => {
  const { useML = false } = options;

  // Preprocess text
  const processedText = preprocessor.preprocess(text, { removeStops: false });

  if (preprocessor.isTooShort(processedText)) {
    return {
      category: 'Other',
      confidence: 0.3,
      reason: 'Text too short for reliable classification',
      method: 'default'
    };
  }

  // Try keyword classification first (always fast)
  const keywordResult = classifyByKeywords(processedText);

  // If high confidence or ML not requested, return keyword result
  if (keywordResult.confidence >= 0.7 || !useML) {
    return keywordResult;
  }

  // TODO: Add ML-based classification here when ONNX model is available
  // For now, return keyword result with lower confidence
  return {
    ...keywordResult,
    note: 'ML classification not available, using keyword matching'
  };
};

/**
 * Batch classify multiple complaints
 */
const batchClassify = async (complaints) => {
  return Promise.all(
    complaints.map(async c => ({
      id: c.id || c._id,
      text: c.title || c.description,
      ...await classify(`${c.title || ''} ${c.description || ''}`)
    }))
  );
};

/**
 * Get classification statistics
 */
const getClassificationStats = (results) => {
  const stats = {};

  for (const category of CATEGORIES) {
    stats[category] = {
      count: 0,
      avgConfidence: 0,
      confidences: []
    };
  }

  results.forEach(r => {
    if (stats[r.category]) {
      stats[r.category].count++;
      stats[r.category].confidences.push(r.confidence);
    }
  });

  // Calculate averages
  for (const category of Object.keys(stats)) {
    if (stats[category].count > 0) {
      stats[category].avgConfidence =
        stats[category].confidences.reduce((a, b) => a + b, 0) / stats[category].count;
    }
    delete stats[category].confidences;
  }

  return stats;
};

/**
 * Suggest category corrections based on admin feedback
 * For future ML training data collection
 */
const recordCorrection = async (originalCategory, correctedCategory, text) => {
  // TODO: Store corrections for model retraining
  console.log(`Classification correction: ${originalCategory} -> ${correctedCategory}`);
  return { recorded: true };
};

module.exports = {
  CATEGORIES,
  classify,
  classifyByKeywords,
  batchClassify,
  getClassificationStats,
  recordCorrection
};

