/**
 * AI Firewall Middleware
 *
 * Security and rate limiting for AI-powered endpoints.
 * Protects against:
 * - Excessive API usage
 * - Prompt injection attacks
 * - PII leakage
 * - Abuse vectors
 */

// In-memory rate limiting store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_AI_REQUESTS_PER_MINUTE = 30;

// Suspicious patterns that might indicate prompt injection
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/gi,
  /you\s+are\s+now/gi,
  /forget\s+everything/gi,
  /disregard\s+(your|all)/gi,
  /new\s+instructions?:/gi,
  /system\s+prompt/gi,
  /\[INST\]/gi,
  /<\/?system>/gi,
  /\{\{.+\}\}/g,  // Template injection
];

// Aadhaar pattern (12 digits, possibly with spaces)
const AADHAAR_PATTERN = /\b\d{4}\s?\d{4}\s?\d{4}\b/g;

// Phone number patterns (Indian)
const PHONE_PATTERN = /(\+91[\-\s]?)?[0]?(91)?[6-9]\d{9}/g;

// Email pattern
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/g;

/**
 * Check rate limit for a user/IP
 */
const checkRateLimit = (identifier) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Get or create user's request history
  let requests = rateLimitStore.get(identifier) || [];

  // Filter to only requests in current window
  requests = requests.filter(time => time > windowStart);

  // Check if over limit
  if (requests.length >= MAX_AI_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((requests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    };
  }

  // Add current request
  requests.push(now);
  rateLimitStore.set(identifier, requests);

  return {
    allowed: true,
    remaining: MAX_AI_REQUESTS_PER_MINUTE - requests.length,
    resetIn: Math.ceil(RATE_LIMIT_WINDOW / 1000)
  };
};

/**
 * Detect potential prompt injection attempts
 */
const detectInjection = (text) => {
  if (!text) return { safe: true };

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'Potential prompt injection detected',
        pattern: pattern.toString()
      };
    }
  }

  return { safe: true };
};

/**
 * Sanitize input text for AI processing
 */
const sanitizeInput = (text) => {
  if (!text) return '';

  let sanitized = text
    // Remove potential script tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove potential HTML
    .replace(/<[^>]+>/g, ' ')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Limit length
    .substring(0, 5000)
    .trim();

  return sanitized;
};

/**
 * Mask sensitive data in output
 */
const maskSensitiveData = (text) => {
  if (!text) return text;

  return text
    // Mask Aadhaar numbers
    .replace(AADHAAR_PATTERN, 'XXXX-XXXX-XXXX')
    // Mask phone numbers
    .replace(PHONE_PATTERN, '+91-XXXXXXXX')
    // Optionally mask emails
    .replace(EMAIL_PATTERN, (match) => {
      const [local, domain] = match.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    });
};

/**
 * AI Firewall middleware
 */
const aiFirewall = (options = {}) => {
  const {
    rateLimit = true,
    sanitize = true,
    detectInjections = true,
    maskOutput = true,
    maxInputLength = 5000
  } = options;

  return async (req, res, next) => {
    try {
      // 1. Rate limiting
      if (rateLimit) {
        const identifier = req.user?.id || req.ip || 'anonymous';
        const rateLimitResult = checkRateLimit(identifier);

        if (!rateLimitResult.allowed) {
          return res.status(429).json({
            error: 'Rate Limit Exceeded',
            message: `Too many AI requests. Try again in ${rateLimitResult.resetIn} seconds.`,
            retryAfter: rateLimitResult.resetIn
          });
        }

        // Add rate limit headers
        res.set('X-RateLimit-Remaining', rateLimitResult.remaining);
        res.set('X-RateLimit-Reset', rateLimitResult.resetIn);
      }

      // 2. Input validation and sanitization
      if (req.body) {
        const textFields = ['text', 'title', 'description', 'query', 'message', 'content'];

        for (const field of textFields) {
          if (req.body[field]) {
            // Length check
            if (req.body[field].length > maxInputLength) {
              return res.status(400).json({
                error: 'Input Too Long',
                message: `${field} exceeds maximum length of ${maxInputLength} characters`
              });
            }

            // Injection detection
            if (detectInjections) {
              const injectionCheck = detectInjection(req.body[field]);
              if (!injectionCheck.safe) {
                console.warn(`⚠️ Potential injection attempt from ${req.user?.id || req.ip}: ${injectionCheck.reason}`);
                return res.status(400).json({
                  error: 'Invalid Input',
                  message: 'Input contains disallowed patterns'
                });
              }
            }

            // Sanitize
            if (sanitize) {
              req.body[field] = sanitizeInput(req.body[field]);
            }
          }
        }
      }

      // 3. Wrap response to mask sensitive data in output
      if (maskOutput) {
        const originalJson = res.json.bind(res);
        res.json = (data) => {
          if (data && typeof data === 'object') {
            const maskedData = JSON.parse(
              maskSensitiveData(JSON.stringify(data))
            );
            return originalJson(maskedData);
          }
          return originalJson(data);
        };
      }

      next();
    } catch (error) {
      console.error('AI Firewall error:', error);
      next(error);
    }
  };
};

/**
 * Simple rate limiter for non-AI endpoints
 */
const simpleRateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const store = new Map();

  return (req, res, next) => {
    const identifier = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    let requests = store.get(identifier) || [];
    requests = requests.filter(time => time > windowStart);

    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Please slow down and try again later'
      });
    }

    requests.push(now);
    store.set(identifier, requests);

    next();
  };
};

/**
 * Clear rate limit store (for testing or admin reset)
 */
const clearRateLimits = () => {
  rateLimitStore.clear();
};

module.exports = {
  aiFirewall,
  simpleRateLimiter,
  checkRateLimit,
  detectInjection,
  sanitizeInput,
  maskSensitiveData,
  clearRateLimits
};

