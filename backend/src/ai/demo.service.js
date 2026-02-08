/**
 * AI Demo & Test Mode Service
 *
 * Phase 5 Feature 6: Testing and demonstration capabilities
 *
 * Provides:
 * - Synthetic complaint generator
 * - Edge-case datasets
 * - Stress scenarios
 * - Replay system
 */

const preprocessor = require('./preprocessor');

// Configuration
const CONFIG = {
  maxBatchSize: 100,
  stressTestConcurrency: 20,
  defaultStressIterations: 50
};

// Synthetic data templates
const SYNTHETIC_DATA = {
  categories: [
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
  ],

  locations: [
    'Main Road, Ward 5',
    'Near Government School',
    'Opposite Bus Stand',
    'Behind Temple',
    'Market Area',
    'Railway Station Road',
    'Hospital Road',
    'College Street',
    'Industrial Area',
    'Residential Colony'
  ],

  templates: {
    'Road & Infrastructure': [
      { title: 'Large pothole on main road', description: 'There is a dangerous pothole near {location}. It has been there for {duration} and is causing accidents.' },
      { title: 'Road cave-in', description: 'The road has caved in at {location}. Multiple vehicles have been damaged.' },
      { title: 'Broken footpath', description: 'Footpath near {location} is completely broken. Senior citizens are having difficulty walking.' }
    ],
    'Water Supply': [
      { title: 'No water supply for {duration}', description: 'We have not received water supply at {location} for {duration}. {affected} families are affected.' },
      { title: 'Water pipe leakage', description: 'Major water pipe leakage at {location}. Water is being wasted continuously.' },
      { title: 'Contaminated water', description: 'The water coming from tap at {location} is contaminated and has bad smell.' }
    ],
    'Electricity': [
      { title: 'Power outage for {duration}', description: 'No electricity at {location} since {duration}. Essential work is affected.' },
      { title: 'Dangerous exposed wires', description: 'Electrical wires hanging dangerously low at {location}. Very risky for children.' },
      { title: 'Transformer making noise', description: 'The transformer at {location} is making loud buzzing noise and sparking.' }
    ],
    'Sanitation': [
      { title: 'Garbage not collected', description: 'Garbage has not been collected at {location} for {duration}. Bad smell affecting residents.' },
      { title: 'Open defecation area', description: 'People are using the area near {location} for open defecation. Very unhygienic.' },
      { title: 'Public toilet not working', description: 'Public toilet at {location} is not functional. No water and very dirty.' }
    ],
    'Street Lights': [
      { title: 'Street lights not working', description: '{count} street lights at {location} are not working for {duration}. Area is very dark at night.' },
      { title: 'Broken street light pole', description: 'Street light pole at {location} has fallen down. Dangerous for passersby.' }
    ],
    'Drainage': [
      { title: 'Blocked drain causing flooding', description: 'Drain at {location} is blocked. Water logging during rain causing problems.' },
      { title: 'Overflowing sewage', description: 'Sewage is overflowing at {location}. Very bad smell and health hazard.' }
    ]
  },

  durations: ['2 days', '3 days', '1 week', '2 weeks', '1 month', 'several months'],
  affected: ['10', '20', '50', '100', 'Many'],
  counts: ['3', '5', '7', '10']
};

// Edge cases for testing
const EDGE_CASES = {
  shortText: [
    { title: 'Help', description: 'Problem' },
    { title: 'Fix', description: 'Issue here' },
    { title: 'Urgent', description: 'Need help' }
  ],

  longText: [
    {
      title: 'Multiple issues in our area that need immediate attention from authorities',
      description: 'I am writing to report multiple issues in our neighborhood. First, the main road has developed several large potholes that are causing accidents daily. Second, the street lights have not been working for the past two weeks making the area unsafe at night. Third, garbage collection has been irregular and there is a pile of garbage near the community center. Fourth, the water supply has been erratic with low pressure. Fifth, there is a drainage blockage causing water logging during rains. All these issues are affecting the quality of life for over 200 families in the area. We have raised these issues multiple times but no action has been taken. We request immediate attention to all these matters.'
    }
  ],

  multiLanguage: [
    { title: 'சாலை பிரச்சனை', description: 'மெயின் ரோட்ல பெரிய குழி இருக்கு. பல வாகனங்கள் damaged ஆகிடுச்சு.' },
    { title: 'पानी की समस्या', description: 'पिछले एक हफ्ते से पानी नहीं आ रहा है। कृपया जल्दी ठीक करें।' },
    { title: 'Water problem urgent', description: 'Thanni varla 5 days achu. Please fix pannunga.' }
  ],

  slang: [
    { title: 'pls fix rd asap', description: 'pothole nr school v dangerous. kids r getting hurt. need help urgntly' },
    { title: 'Thanni illama kasthapparom', description: 'Oru vaaram achu thanni varla. Govt enna pannuthu?' }
  ],

  duplicates: [
    { title: 'Water supply problem in Ward 5', description: 'No water coming from taps since 3 days. 50 families affected.' },
    { title: 'Water issue in Ward 5 area', description: 'Water not coming from taps for 3 days. Around 50 houses affected.' },
    { title: 'Ward 5 water problem', description: 'Tap water stopped 3 days back. 50 families facing difficulty.' }
  ],

  priority: {
    urgent: [
      { title: 'Fire hazard - exposed electrical wires', description: 'Sparking electrical wires hanging low near school. Very dangerous!', expectedPriority: 'urgent' },
      { title: 'Sewage flooding homes', description: 'Sewage water entering houses. Health emergency!', expectedPriority: 'urgent' }
    ],
    low: [
      { title: 'Suggestion for park', description: 'It would be nice to have benches in the park.', expectedPriority: 'low' },
      { title: 'Beautification idea', description: 'We could plant flowers along the main road.', expectedPriority: 'low' }
    ]
  }
};

/**
 * Generate random value from array
 */
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Fill template with random values
 */
const fillTemplate = (template) => {
  let { title, description } = template;

  title = title
    .replace('{duration}', randomFrom(SYNTHETIC_DATA.durations))
    .replace('{count}', randomFrom(SYNTHETIC_DATA.counts));

  description = description
    .replace('{location}', randomFrom(SYNTHETIC_DATA.locations))
    .replace('{duration}', randomFrom(SYNTHETIC_DATA.durations))
    .replace('{affected}', randomFrom(SYNTHETIC_DATA.affected))
    .replace('{count}', randomFrom(SYNTHETIC_DATA.counts));

  return { title, description };
};

/**
 * Generate synthetic complaint
 */
const generateComplaint = (options = {}) => {
  const {
    category = randomFrom(SYNTHETIC_DATA.categories),
    withLocation = true,
    withDuration = true
  } = options;

  // Get templates for category
  const templates = SYNTHETIC_DATA.templates[category] || SYNTHETIC_DATA.templates['Other'] || [
    { title: 'Issue in {location}', description: 'There is a problem at {location} for {duration}.' }
  ];

  const template = randomFrom(templates);
  const filled = fillTemplate(template);

  return {
    title: filled.title,
    description: filled.description,
    category,
    location: withLocation ? randomFrom(SYNTHETIC_DATA.locations) : null,
    _synthetic: true,
    _generatedAt: new Date().toISOString()
  };
};

/**
 * Generate batch of synthetic complaints
 */
const generateBatch = (count = 10, options = {}) => {
  const batch = [];
  const actualCount = Math.min(count, CONFIG.maxBatchSize);

  for (let i = 0; i < actualCount; i++) {
    batch.push(generateComplaint(options));
  }

  return {
    complaints: batch,
    count: actualCount,
    options
  };
};

/**
 * Get edge case test suite
 */
const getEdgeCases = (type = 'all') => {
  if (type === 'all') {
    return EDGE_CASES;
  }

  return EDGE_CASES[type] || null;
};

/**
 * Run enrichment test
 */
const testEnrichment = async (complaints) => {
  try {
    const enrichment = require('./enrichment.service');
    const results = [];

    for (const complaint of complaints) {
      const startTime = Date.now();
      const result = await enrichment.enrichComplaint(complaint);

      results.push({
        input: {
          title: complaint.title.slice(0, 50),
          descriptionLength: complaint.description.length,
          category: complaint.category
        },
        output: {
          completenessScore: result.completenessScore,
          suggestionsCount: result.suggestions?.length || 0,
          missingContext: result.missingContext?.map(m => m.type) || []
        },
        latencyMs: Date.now() - startTime,
        fromCache: result.fromCache
      });
    }

    return {
      service: 'enrichment',
      tested: results.length,
      avgLatencyMs: Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length),
      results
    };
  } catch (error) {
    return { service: 'enrichment', error: error.message };
  }
};

/**
 * Run duplicate detection test
 */
const testDuplicateDetection = async (complaints) => {
  try {
    const semantic = require('./semantic-duplicate.service');
    const results = [];

    // Test each complaint against the others
    for (let i = 0; i < complaints.length; i++) {
      const complaint = complaints[i];
      const text = `${complaint.title} ${complaint.description}`;
      const startTime = Date.now();

      // Build vector and compare with others
      const { vector } = semantic.buildVector(text);
      const similarities = [];

      for (let j = 0; j < complaints.length; j++) {
        if (i === j) continue;
        const otherText = `${complaints[j].title} ${complaints[j].description}`;
        const { vector: otherVector } = semantic.buildVector(otherText);
        const sim = semantic.cosineSimilarity(vector, otherVector);
        if (sim > 0.3) {
          similarities.push({
            index: j,
            similarity: Math.round(sim * 100),
            band: semantic.getConfidenceBand(sim).label
          });
        }
      }

      results.push({
        index: i,
        title: complaint.title.slice(0, 40),
        similarTo: similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 3),
        latencyMs: Date.now() - startTime
      });
    }

    return {
      service: 'duplicate',
      tested: results.length,
      avgLatencyMs: Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length),
      results
    };
  } catch (error) {
    return { service: 'duplicate', error: error.message };
  }
};

/**
 * Run stress test
 */
const runStressTest = async (options = {}) => {
  const {
    iterations = CONFIG.defaultStressIterations,
    service = 'all',
    concurrency = CONFIG.stressTestConcurrency
  } = options;

  const results = {
    service,
    iterations,
    concurrency,
    startTime: new Date().toISOString(),
    endTime: null,
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      requestsPerSecond: 0
    },
    errors: []
  };

  const latencies = [];
  const startTime = Date.now();

  // Generate test data
  const complaints = generateBatch(iterations).complaints;

  // Run tests in batches
  const runBatch = async (batch) => {
    const promises = batch.map(async (complaint) => {
      const reqStart = Date.now();
      try {
        if (service === 'all' || service === 'enrichment') {
          const enrichment = require('./enrichment.service');
          await enrichment.enrichComplaint(complaint);
        }
        if (service === 'all' || service === 'duplicate') {
          const semantic = require('./semantic-duplicate.service');
          semantic.buildVector(`${complaint.title} ${complaint.description}`);
        }
        results.metrics.successfulRequests++;
      } catch (error) {
        results.metrics.failedRequests++;
        results.errors.push(error.message);
      }
      latencies.push(Date.now() - reqStart);
      results.metrics.totalRequests++;
    });

    await Promise.all(promises);
  };

  // Process in batches
  for (let i = 0; i < complaints.length; i += concurrency) {
    const batch = complaints.slice(i, i + concurrency);
    await runBatch(batch);
  }

  results.endTime = new Date().toISOString();
  const totalTimeMs = Date.now() - startTime;

  // Calculate metrics
  latencies.sort((a, b) => a - b);
  results.metrics.avgLatencyMs = Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length);
  results.metrics.p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)] || 0;
  results.metrics.p99LatencyMs = latencies[Math.floor(latencies.length * 0.99)] || 0;
  results.metrics.requestsPerSecond = Math.round((results.metrics.totalRequests / totalTimeMs) * 1000 * 10) / 10;
  results.metrics.totalTimeMs = totalTimeMs;

  return results;
};

/**
 * Run full test suite
 */
const runTestSuite = async () => {
  const suite = {
    startTime: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  // Test 1: Enrichment with edge cases
  console.log('[Demo] Running enrichment tests...');
  const enrichmentCases = [
    ...EDGE_CASES.shortText,
    ...EDGE_CASES.longText,
    ...EDGE_CASES.multiLanguage,
    ...EDGE_CASES.slang
  ];
  suite.tests.enrichment = await testEnrichment(enrichmentCases);
  suite.summary.total += suite.tests.enrichment.tested || 0;
  suite.summary.passed += suite.tests.enrichment.error ? 0 : (suite.tests.enrichment.tested || 0);

  // Test 2: Duplicate detection
  console.log('[Demo] Running duplicate detection tests...');
  suite.tests.duplicate = await testDuplicateDetection(EDGE_CASES.duplicates);
  suite.summary.total += suite.tests.duplicate.tested || 0;
  suite.summary.passed += suite.tests.duplicate.error ? 0 : (suite.tests.duplicate.tested || 0);

  // Test 3: Stress test (small)
  console.log('[Demo] Running stress test...');
  suite.tests.stress = await runStressTest({ iterations: 20, concurrency: 5 });
  suite.summary.total++;
  if (suite.tests.stress.metrics.failedRequests === 0) suite.summary.passed++;

  suite.summary.failed = suite.summary.total - suite.summary.passed;
  suite.endTime = new Date().toISOString();

  return suite;
};

/**
 * Demo mode - interactive demonstration
 */
const getDemoScenarios = () => {
  return {
    scenarios: [
      {
        id: 'basic_complaint',
        name: 'Basic Complaint Processing',
        description: 'Shows how a standard complaint is processed with AI enrichment',
        input: generateComplaint({ category: 'Water Supply' })
      },
      {
        id: 'duplicate_detection',
        name: 'Duplicate Detection',
        description: 'Demonstrates how similar complaints are detected',
        inputs: EDGE_CASES.duplicates
      },
      {
        id: 'priority_scoring',
        name: 'Priority Scoring',
        description: 'Shows how urgent vs low priority complaints are classified',
        inputs: [...EDGE_CASES.priority.urgent, ...EDGE_CASES.priority.low]
      },
      {
        id: 'multilingual',
        name: 'Multi-language Support',
        description: 'Demonstrates Tamil, Hindi, and mixed-language processing',
        inputs: EDGE_CASES.multiLanguage
      },
      {
        id: 'edge_cases',
        name: 'Edge Cases',
        description: 'Tests system behavior with unusual inputs',
        inputs: [...EDGE_CASES.shortText, ...EDGE_CASES.longText]
      }
    ]
  };
};

module.exports = {
  // Generators
  generateComplaint,
  generateBatch,

  // Test data
  getEdgeCases,
  getDemoScenarios,

  // Testing
  testEnrichment,
  testDuplicateDetection,
  runStressTest,
  runTestSuite,

  // Data
  SYNTHETIC_DATA,
  EDGE_CASES,

  // Config
  CONFIG
};

