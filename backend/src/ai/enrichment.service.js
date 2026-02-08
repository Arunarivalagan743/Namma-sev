/**
 * Context Enrichment Service
 *
 * Phase 4 Feature 1: Improve complaint quality before submission
 *
 * Capabilities:
 * - Detect missing: Location, Duration, Impact, Landmark, Affected people
 * - Normalize: Tamil/English/Hinglish, Slang, Inconsistent phrasing
 * - Suggest structured improvements
 *
 * Rules:
 * - Never auto-edit user content
 * - Always show suggestions
 * - User must approve changes
 * - Non-blocking, async processing
 *
 * Target latency: <50ms
 */

const preprocessor = require('./preprocessor');
const cache = require('./cache');

// Configuration
const CONFIG = {
  minDescriptionLength: 30,
  maxSuggestions: 5,
  cachePrefix: 'enrichment:',
  cacheTtlMs: 5 * 60 * 1000  // 5 minutes
};

// Missing context patterns
const MISSING_CONTEXT_PATTERNS = {
  location: {
    keywords: ['where', 'location', 'address', 'area', 'street', 'ward', 'place', 'near'],
    tamil: ['எங்கே', 'இடம்', 'தெரு', 'வார்டு', 'பகுதி'],
    hindi: ['कहाँ', 'जगह', 'पता', 'क्षेत्र', 'गली'],
    examples: ['Main road', 'Near bus stand', 'Ward 5']
  },
  duration: {
    keywords: ['when', 'how long', 'since', 'days', 'weeks', 'months', 'started'],
    tamil: ['எப்போது', 'எத்தனை நாள்', 'ஆரம்பித்தது'],
    hindi: ['कब से', 'कितने दिन', 'शुरू हुआ'],
    examples: ['Since 2 weeks', 'For the past month']
  },
  impact: {
    keywords: ['affect', 'impact', 'problem', 'issue', 'causing', 'result'],
    tamil: ['பாதிப்பு', 'பிரச்சனை', 'விளைவு'],
    hindi: ['प्रभाव', 'समस्या', 'परिणाम'],
    examples: ['Affecting daily travel', 'Health hazard']
  },
  landmark: {
    keywords: ['near', 'beside', 'opposite', 'behind', 'next to', 'front of'],
    tamil: ['அருகில்', 'எதிரில்', 'பக்கத்தில்'],
    hindi: ['पास', 'सामने', 'बगल में'],
    examples: ['Near temple', 'Opposite school']
  },
  affectedPeople: {
    keywords: ['people', 'residents', 'families', 'households', 'affected', 'community'],
    tamil: ['மக்கள்', 'குடும்பங்கள்', 'குடியிருப்பாளர்கள்'],
    hindi: ['लोग', 'परिवार', 'निवासी'],
    examples: ['About 50 families', 'Entire street']
  }
};

// Common slang and abbreviation normalization
const SLANG_NORMALIZATION = {
  // English
  'govt': 'government',
  'pls': 'please',
  'plz': 'please',
  'asap': 'as soon as possible',
  'b/w': 'between',
  'w/': 'with',
  'w/o': 'without',
  'yr': 'year',
  'yrs': 'years',
  'mth': 'month',
  'mths': 'months',
  'wk': 'week',
  'wks': 'weeks',
  'rd': 'road',
  'st': 'street',
  'nr': 'near',
  'opp': 'opposite',
  'bldg': 'building',
  // Tamil transliteration
  'nalla': 'good',
  'illa': 'not',
  'iruku': 'is there',
  'panna': 'do',
  'pannunga': 'please do',
  'thanni': 'water',
  'venum': 'need',
  // Hindi transliteration
  'nahi': 'not',
  'bahut': 'very',
  'paani': 'water',
  'karo': 'do',
  'jaldi': 'quickly'
};

// Category-specific context expectations
const CATEGORY_CONTEXT = {
  'Road & Infrastructure': {
    expected: ['location', 'impact', 'landmark'],
    prompts: [
      'What is the exact location of the road issue?',
      'How is this affecting travel/commute?',
      'What is the nearest landmark?'
    ]
  },
  'Water Supply': {
    expected: ['location', 'duration', 'affectedPeople'],
    prompts: [
      'Which area is affected?',
      'How long has this been an issue?',
      'How many households are affected?'
    ]
  },
  'Electricity': {
    expected: ['location', 'duration', 'impact'],
    prompts: [
      'What is the specific location?',
      'When did the issue start?',
      'What is the impact (safety, business, etc.)?'
    ]
  },
  'Sanitation': {
    expected: ['location', 'landmark', 'impact'],
    prompts: [
      'Where exactly is the sanitation issue?',
      'Near which landmark?',
      'What health/hygiene impact is it causing?'
    ]
  },
  'Street Lights': {
    expected: ['location', 'duration', 'landmark'],
    prompts: [
      'Which street lights are not working?',
      'How long have they been off?',
      'What is the nearest landmark?'
    ]
  },
  'Drainage': {
    expected: ['location', 'duration', 'impact'],
    prompts: [
      'Where is the drainage issue?',
      'How long has water been stagnating?',
      'What is the health/traffic impact?'
    ]
  },
  'Public Health': {
    expected: ['location', 'affectedPeople', 'impact'],
    prompts: [
      'Which area is affected?',
      'How many people are affected?',
      'What is the health concern?'
    ]
  },
  'Encroachment': {
    expected: ['location', 'landmark', 'impact'],
    prompts: [
      'Where is the encroachment?',
      'Near which landmark?',
      'How is it affecting public space/traffic?'
    ]
  },
  'Noise Pollution': {
    expected: ['location', 'duration', 'impact'],
    prompts: [
      'Where is the noise source?',
      'What time/duration does it occur?',
      'How is it affecting residents?'
    ]
  },
  'Other': {
    expected: ['location', 'duration', 'impact'],
    prompts: [
      'Where is this issue located?',
      'How long has this been a problem?',
      'What is the impact?'
    ]
  }
};

/**
 * Detect if text contains context information
 */
const hasContext = (text, contextType) => {
  const patterns = MISSING_CONTEXT_PATTERNS[contextType];
  if (!patterns) return true;

  const lowerText = text.toLowerCase();

  // Check English keywords
  const hasEnglish = patterns.keywords.some(kw => lowerText.includes(kw));
  if (hasEnglish) return true;

  // Check Tamil patterns
  const hasTamil = patterns.tamil?.some(kw => text.includes(kw)) || false;
  if (hasTamil) return true;

  // Check Hindi patterns
  const hasHindi = patterns.hindi?.some(kw => text.includes(kw)) || false;
  if (hasHindi) return true;

  // Check for number patterns (for duration, affected people)
  if (contextType === 'duration' || contextType === 'affectedPeople') {
    const hasNumbers = /\d+\s*(day|week|month|year|family|families|people|household|resident)/i.test(text);
    if (hasNumbers) return true;
  }

  // Check for location patterns (street names, ward numbers)
  if (contextType === 'location') {
    const hasLocationPattern = /ward\s*\d+|street|road|main|cross|layout|colony|nagar|puram/i.test(text);
    if (hasLocationPattern) return true;
  }

  return false;
};

/**
 * Detect missing context in complaint
 */
const detectMissingContext = (title, description, category) => {
  const text = `${title} ${description}`.toLowerCase();
  const missing = [];

  // Get category-specific expectations
  const categoryConfig = CATEGORY_CONTEXT[category] || CATEGORY_CONTEXT['Other'];
  const expectedContexts = categoryConfig.expected;

  expectedContexts.forEach((contextType, index) => {
    if (!hasContext(text, contextType)) {
      const patterns = MISSING_CONTEXT_PATTERNS[contextType];
      missing.push({
        type: contextType,
        prompt: categoryConfig.prompts[index] || `Please provide ${contextType} information`,
        examples: patterns?.examples || [],
        priority: index === 0 ? 'high' : 'medium'
      });
    }
  });

  return missing;
};

/**
 * Normalize slang and abbreviations
 */
const normalizeSlang = (text) => {
  let normalized = text;
  const changes = [];

  Object.entries(SLANG_NORMALIZATION).forEach(([slang, full]) => {
    const regex = new RegExp(`\\b${slang}\\b`, 'gi');
    if (regex.test(normalized)) {
      changes.push({ from: slang, to: full });
      normalized = normalized.replace(regex, full);
    }
  });

  return { normalized, changes };
};

/**
 * Check description quality
 */
const checkDescriptionQuality = (description) => {
  const issues = [];

  // Check minimum length
  if (description.length < CONFIG.minDescriptionLength) {
    issues.push({
      type: 'length',
      message: 'Description is too short. Please provide more details.',
      severity: 'high'
    });
  }

  // Check for ALL CAPS
  const capsRatio = (description.match(/[A-Z]/g) || []).length / description.length;
  if (capsRatio > 0.5 && description.length > 20) {
    issues.push({
      type: 'formatting',
      message: 'Please avoid using all capital letters.',
      severity: 'low'
    });
  }

  // Check for excessive punctuation
  if (/[!?]{3,}/.test(description)) {
    issues.push({
      type: 'formatting',
      message: 'Please use appropriate punctuation.',
      severity: 'low'
    });
  }

  // Check for vague language
  const vaguePatterns = /\b(something|some|thing|stuff|issue|problem)\b/gi;
  const vagueMatches = description.match(vaguePatterns) || [];
  if (vagueMatches.length > 2) {
    issues.push({
      type: 'clarity',
      message: 'Please be more specific about the issue.',
      severity: 'medium'
    });
  }

  return issues;
};

/**
 * Generate improvement suggestions
 */
const generateSuggestions = (title, description, category, missingContext, qualityIssues) => {
  const suggestions = [];

  // Add missing context suggestions
  missingContext.forEach(missing => {
    suggestions.push({
      type: 'missing_context',
      field: missing.type,
      message: missing.prompt,
      examples: missing.examples,
      priority: missing.priority
    });
  });

  // Add quality improvement suggestions
  qualityIssues.forEach(issue => {
    suggestions.push({
      type: 'quality',
      field: issue.type,
      message: issue.message,
      priority: issue.severity
    });
  });

  // Add category-specific suggestions
  const categoryConfig = CATEGORY_CONTEXT[category];
  if (categoryConfig && suggestions.length === 0) {
    // No issues found, maybe suggest adding photos
    if (!description.toLowerCase().includes('photo') && !description.toLowerCase().includes('image')) {
      suggestions.push({
        type: 'enhancement',
        field: 'evidence',
        message: 'Consider adding photos to help officials understand the issue better.',
        priority: 'low'
      });
    }
  }

  // Sort by priority and limit
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions
    .sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2))
    .slice(0, CONFIG.maxSuggestions);
};

/**
 * Main enrichment function
 * @param {Object} complaint - Complaint data
 * @returns {Object} Enrichment results with suggestions
 */
const enrichComplaint = async (complaint) => {
  const startTime = Date.now();
  const { title = '', description = '', category = 'Other' } = complaint;

  // Check cache first
  const enrichmentCache = cache.getCache('enrichment');
  const cacheKey = `${CONFIG.cachePrefix}${preprocessor.preprocess(title + description).slice(0, 100)}`;

  const cached = await enrichmentCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true,
      latencyMs: Date.now() - startTime
    };
  }

  const result = {
    processed: true,
    fromCache: false,
    latencyMs: 0,
    language: 'en',
    normalizedText: null,
    normalizationChanges: [],
    missingContext: [],
    qualityIssues: [],
    suggestions: [],
    completenessScore: 100,
    errors: []
  };

  try {
    // Step 1: Detect language
    const combinedText = `${title} ${description}`;
    result.language = preprocessor.detectLanguage(combinedText);

    // Step 2: Normalize slang/abbreviations
    const { normalized, changes } = normalizeSlang(description);
    if (changes.length > 0) {
      result.normalizedText = normalized;
      result.normalizationChanges = changes;
    }

    // Step 3: Detect missing context
    result.missingContext = detectMissingContext(title, description, category);

    // Step 4: Check description quality
    result.qualityIssues = checkDescriptionQuality(description);

    // Step 5: Generate suggestions
    result.suggestions = generateSuggestions(
      title,
      description,
      category,
      result.missingContext,
      result.qualityIssues
    );

    // Step 6: Calculate completeness score
    const totalExpected = (CATEGORY_CONTEXT[category]?.expected || []).length;
    const missingCount = result.missingContext.length;
    const qualityPenalty = result.qualityIssues.filter(i => i.severity === 'high').length * 10;

    result.completenessScore = Math.max(
      0,
      Math.round(100 - (missingCount / Math.max(totalExpected, 1)) * 50 - qualityPenalty)
    );

  } catch (error) {
    result.processed = false;
    result.errors.push(error.message);
  }

  result.latencyMs = Date.now() - startTime;

  // Cache result
  await enrichmentCache.set(cacheKey, result, { l1TtlMs: CONFIG.cacheTtlMs });

  return result;
};

/**
 * Get enrichment statistics
 */
const getEnrichmentStats = async () => {
  const enrichmentCache = cache.getCache('enrichment');
  const stats = await enrichmentCache.getStats();

  return {
    cache: stats,
    config: {
      minDescriptionLength: CONFIG.minDescriptionLength,
      maxSuggestions: CONFIG.maxSuggestions
    },
    categories: Object.keys(CATEGORY_CONTEXT),
    contextTypes: Object.keys(MISSING_CONTEXT_PATTERNS)
  };
};

module.exports = {
  enrichComplaint,
  detectMissingContext,
  normalizeSlang,
  checkDescriptionQuality,
  generateSuggestions,
  getEnrichmentStats,
  // Export config for testing
  CONFIG,
  CATEGORY_CONTEXT,
  MISSING_CONTEXT_PATTERNS,
  SLANG_NORMALIZATION
};

