/**
 * Admin Response Templates Service
 *
 * Phase 2 Feature 2: Suggest pre-defined responses for complaints
 *
 * Architecture:
 * - Template matching based on category + status
 * - Confidence scoring
 * - Human always edits (never auto-send)
 * - Uses existing preprocessor
 *
 * Performance Targets:
 * - Suggestion latency: <5ms
 * - Memory: <2MB
 */

const preprocessor = require('./preprocessor');

// Response templates organized by category and status
const TEMPLATES = {
  // Water Supply
  'Water Supply': {
    pending: [
      {
        id: 'ws_ack_1',
        title: 'Acknowledgment',
        template: 'Your complaint regarding water supply issue has been received. Our team will inspect the area within {days} working days.',
        variables: { days: '2-3' },
        confidence: 0.9
      },
      {
        id: 'ws_ack_2',
        title: 'Tank/Pipeline Issue',
        template: 'We have noted the water supply disruption in your area. Our engineers are checking the water tank/pipeline. Expected restoration: {time}.',
        variables: { time: '24-48 hours' },
        confidence: 0.85
      }
    ],
    in_progress: [
      {
        id: 'ws_prog_1',
        title: 'Work Started',
        template: 'Our team has started work on your water supply complaint. Pipeline repair is in progress. We apologize for the inconvenience.',
        confidence: 0.9
      },
      {
        id: 'ws_prog_2',
        title: 'Waiting for Parts',
        template: 'The repair work requires specific parts which have been ordered. Expected completion: {date}. Temporary water supply arrangements are being made.',
        variables: { date: 'within 3 days' },
        confidence: 0.8
      }
    ],
    resolved: [
      {
        id: 'ws_res_1',
        title: 'Issue Fixed',
        template: 'The water supply issue in your area has been resolved. Please confirm if water supply is restored. Contact us if the problem persists.',
        confidence: 0.95
      }
    ]
  },

  // Road & Infrastructure
  'Road & Infrastructure': {
    pending: [
      {
        id: 'road_ack_1',
        title: 'Pothole Acknowledgment',
        template: 'Your complaint about road damage has been registered. Our PWD team will inspect and schedule repairs within {days} days.',
        variables: { days: '5-7' },
        confidence: 0.9
      },
      {
        id: 'road_ack_2',
        title: 'Road Work Request',
        template: 'We have received your request for road repair. This has been added to our maintenance schedule. Priority: {priority}.',
        variables: { priority: 'Normal' },
        confidence: 0.85
      }
    ],
    in_progress: [
      {
        id: 'road_prog_1',
        title: 'Repair Scheduled',
        template: 'Road repair work has been scheduled for {date}. Please avoid the area during work hours (6 AM - 6 PM).',
        variables: { date: 'next week' },
        confidence: 0.85
      }
    ],
    resolved: [
      {
        id: 'road_res_1',
        title: 'Repair Completed',
        template: 'The road repair work at your reported location has been completed. Thank you for bringing this to our attention.',
        confidence: 0.95
      }
    ]
  },

  // Electricity
  'Electricity': {
    pending: [
      {
        id: 'elec_ack_1',
        title: 'Power Issue Acknowledgment',
        template: 'Your electricity complaint has been forwarded to TNEB. Reference: {ref}. Expected response: {time}.',
        variables: { ref: 'TBD', time: '24 hours' },
        confidence: 0.9
      }
    ],
    in_progress: [
      {
        id: 'elec_prog_1',
        title: 'Lineman Assigned',
        template: 'A lineman has been assigned to inspect the electrical issue. Expected visit: {date}. Please ensure someone is available.',
        variables: { date: 'today/tomorrow' },
        confidence: 0.85
      }
    ],
    resolved: [
      {
        id: 'elec_res_1',
        title: 'Issue Resolved',
        template: 'The electrical issue has been resolved by TNEB. Please check and confirm. For persistent issues, contact TNEB: 1912.',
        confidence: 0.9
      }
    ]
  },

  // Street Lights
  'Street Lights': {
    pending: [
      {
        id: 'light_ack_1',
        title: 'Light Complaint Received',
        template: 'Your complaint about street light at {location} has been registered. Our team will repair it within {days} working days.',
        variables: { location: 'reported location', days: '3-5' },
        confidence: 0.9
      }
    ],
    in_progress: [
      {
        id: 'light_prog_1',
        title: 'Bulb Replacement',
        template: 'Street light repair work is scheduled. New LED bulb will be installed by {date}.',
        variables: { date: 'this week' },
        confidence: 0.85
      }
    ],
    resolved: [
      {
        id: 'light_res_1',
        title: 'Light Fixed',
        template: 'The street light has been repaired and is now functional. Please verify after sunset.',
        confidence: 0.95
      }
    ]
  },

  // Sanitation
  'Sanitation': {
    pending: [
      {
        id: 'san_ack_1',
        title: 'Cleaning Request',
        template: 'Your sanitation complaint has been noted. Our cleaning team will address this within {days} working days.',
        variables: { days: '1-2' },
        confidence: 0.9
      }
    ],
    in_progress: [
      {
        id: 'san_prog_1',
        title: 'Cleaning Scheduled',
        template: 'Cleaning/garbage collection has been scheduled for {date}. Please ensure waste is segregated.',
        variables: { date: 'tomorrow' },
        confidence: 0.85
      }
    ],
    resolved: [
      {
        id: 'san_res_1',
        title: 'Area Cleaned',
        template: 'The reported area has been cleaned. Please help maintain cleanliness. Report future issues promptly.',
        confidence: 0.95
      }
    ]
  },

  // Drainage
  'Drainage': {
    pending: [
      {
        id: 'drain_ack_1',
        title: 'Drainage Complaint',
        template: 'Your drainage/sewage complaint has been registered. Our team will inspect within {days} days.',
        variables: { days: '2-3' },
        confidence: 0.9
      }
    ],
    in_progress: [
      {
        id: 'drain_prog_1',
        title: 'Cleaning Work',
        template: 'Drainage cleaning work is in progress at your reported location. Expected completion: {time}.',
        variables: { time: '24-48 hours' },
        confidence: 0.85
      }
    ],
    resolved: [
      {
        id: 'drain_res_1',
        title: 'Drainage Cleared',
        template: 'The drainage blockage has been cleared. Water flow should be normal now. Contact us if issue persists.',
        confidence: 0.95
      }
    ]
  },

  // Public Health
  'Public Health': {
    pending: [
      {
        id: 'health_ack_1',
        title: 'Health Concern Acknowledged',
        template: 'Your public health concern has been noted and forwarded to the Health Department. Action within {days} days.',
        variables: { days: '1-2' },
        confidence: 0.9
      }
    ],
    in_progress: [
      {
        id: 'health_prog_1',
        title: 'Inspection Scheduled',
        template: 'Health inspector visit scheduled for {date}. Fogging/spraying will be done if required.',
        variables: { date: 'this week' },
        confidence: 0.85
      }
    ],
    resolved: [
      {
        id: 'health_res_1',
        title: 'Action Completed',
        template: 'Health department has completed the required action. Please maintain hygiene in the area.',
        confidence: 0.9
      }
    ]
  },

  // Generic (fallback)
  'Other': {
    pending: [
      {
        id: 'gen_ack_1',
        title: 'Generic Acknowledgment',
        template: 'Your complaint has been received and registered. Our team will review and take appropriate action within {days} working days.',
        variables: { days: '5-7' },
        confidence: 0.7
      }
    ],
    in_progress: [
      {
        id: 'gen_prog_1',
        title: 'Under Review',
        template: 'Your complaint is being reviewed by the concerned department. We will update you on the progress.',
        confidence: 0.7
      }
    ],
    resolved: [
      {
        id: 'gen_res_1',
        title: 'Generic Resolution',
        template: 'Your complaint has been addressed. Please verify and let us know if any further action is needed.',
        confidence: 0.7
      }
    ],
    rejected: [
      {
        id: 'gen_rej_1',
        title: 'Not in Jurisdiction',
        template: 'After review, we found this issue falls outside Panchayat jurisdiction. Please contact {authority} for assistance.',
        variables: { authority: 'concerned authority' },
        confidence: 0.8
      },
      {
        id: 'gen_rej_2',
        title: 'Insufficient Information',
        template: 'We need more details to process your complaint. Please provide: {details}. You can submit a new complaint with complete information.',
        variables: { details: 'exact location, photos' },
        confidence: 0.75
      }
    ]
  }
};

// Keywords that boost template relevance
const BOOST_KEYWORDS = {
  'urgent': ['immediate', 'emergency', 'urgent', 'critical', 'அவசரம்'],
  'recurring': ['again', 'repeated', 'multiple times', 'மீண்டும்'],
  'partial': ['partially', 'some', 'half', 'incomplete']
};

/**
 * Get suggested response templates for a complaint
 *
 * @param {Object} complaint - Complaint object
 * @param {string} newStatus - Status being set
 * @returns {Array} - Ranked template suggestions
 */
const getSuggestions = (complaint, newStatus) => {
  const { category, title, description, priority } = complaint;
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  // Get templates for category, fallback to 'Other'
  const categoryTemplates = TEMPLATES[category] || TEMPLATES['Other'];
  const statusTemplates = categoryTemplates[newStatus] || categoryTemplates['pending'] || [];

  // Also include generic templates as fallback
  const genericTemplates = (TEMPLATES['Other'][newStatus] || [])
    .filter(t => !statusTemplates.find(st => st.id === t.id));

  const allTemplates = [...statusTemplates, ...genericTemplates];

  // Score templates based on relevance
  const scored = allTemplates.map(template => {
    let score = template.confidence;

    // Boost for priority match
    if (priority === 'urgent' && template.id.includes('ack')) {
      score += 0.05;
    }

    // Boost for keyword matches
    Object.entries(BOOST_KEYWORDS).forEach(([type, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        if (type === 'urgent' && newStatus === 'pending') score += 0.03;
        if (type === 'recurring' && newStatus === 'in_progress') score += 0.03;
      }
    });

    return {
      ...template,
      score: Math.min(score, 1.0)
    };
  });

  // Sort by score and return top 3
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...t }) => ({
      ...t,
      relevanceScore: Math.round(score * 100)
    }));
};

/**
 * Fill template variables with actual values
 *
 * @param {string} template - Template string
 * @param {Object} variables - Variable values
 * @returns {string} - Filled template
 */
const fillTemplate = (template, variables = {}) => {
  let filled = template;

  Object.entries(variables).forEach(([key, value]) => {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return filled;
};

/**
 * Get all available template categories
 */
const getCategories = () => {
  return Object.keys(TEMPLATES);
};

/**
 * Get all templates for a specific category
 */
const getTemplatesForCategory = (category) => {
  return TEMPLATES[category] || TEMPLATES['Other'];
};

/**
 * Get template statistics
 */
const getStats = () => {
  let total = 0;
  const byCategory = {};
  const byStatus = {};

  Object.entries(TEMPLATES).forEach(([category, statuses]) => {
    byCategory[category] = 0;
    Object.entries(statuses).forEach(([status, templates]) => {
      const count = templates.length;
      total += count;
      byCategory[category] += count;
      byStatus[status] = (byStatus[status] || 0) + count;
    });
  });

  return { total, byCategory, byStatus };
};

module.exports = {
  getSuggestions,
  fillTemplate,
  getCategories,
  getTemplatesForCategory,
  getStats,
  TEMPLATES
};

