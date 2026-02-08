/**
 * NamSev Centralized Logger
 *
 * Provides consistent logging format across all modules.
 * Format: [ISO_TIMESTAMP] [LEVEL] [MODULE] MESSAGE
 *
 * Levels: DEBUG, INFO, WARN, ERROR, CRITICAL
 *
 * @module utils/logger
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Get log level from environment, default to INFO in production, DEBUG in development
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL?.toUpperCase();

  if (configuredLevel && LOG_LEVELS[configuredLevel] !== undefined) {
    return LOG_LEVELS[configuredLevel];
  }

  return env === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
};

const currentLogLevel = getLogLevel();

/**
 * Format a log message with timestamp, level, and module
 * @param {string} level - Log level
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @returns {string} Formatted log message
 */
const formatMessage = (level, module, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${module}] ${message}`;
};

/**
 * Create a logger instance for a specific module
 * @param {string} moduleName - Name of the module using the logger
 * @returns {Object} Logger instance with debug, info, warn, error, critical methods
 */
const createLogger = (moduleName) => {
  return {
    /**
     * Log debug message (development only by default)
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to include
     */
    debug: (message, data = null) => {
      if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        const formatted = formatMessage('DEBUG', moduleName, message);
        if (data) {
          console.debug(formatted, data);
        } else {
          console.debug(formatted);
        }
      }
    },

    /**
     * Log info message
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to include
     */
    info: (message, data = null) => {
      if (currentLogLevel <= LOG_LEVELS.INFO) {
        const formatted = formatMessage('INFO', moduleName, message);
        if (data) {
          console.info(formatted, data);
        } else {
          console.info(formatted);
        }
      }
    },

    /**
     * Log warning message
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to include
     */
    warn: (message, data = null) => {
      if (currentLogLevel <= LOG_LEVELS.WARN) {
        const formatted = formatMessage('WARN', moduleName, message);
        if (data) {
          console.warn(formatted, data);
        } else {
          console.warn(formatted);
        }
      }
    },

    /**
     * Log error message
     * @param {string} message - Message to log
     * @param {Error|Object} [error] - Optional error object or data
     */
    error: (message, error = null) => {
      if (currentLogLevel <= LOG_LEVELS.ERROR) {
        const formatted = formatMessage('ERROR', moduleName, message);
        if (error) {
          console.error(formatted, error instanceof Error ? error.message : error);
        } else {
          console.error(formatted);
        }
      }
    },

    /**
     * Log critical message (always logged, triggers alerts)
     * @param {string} message - Message to log
     * @param {Error|Object} [error] - Optional error object or data
     */
    critical: (message, error = null) => {
      const formatted = formatMessage('CRITICAL', moduleName, message);
      if (error) {
        console.error(formatted, error instanceof Error ? error.message : error);
      } else {
        console.error(formatted);
      }
    },

    /**
     * Log a success message (info level with checkmark)
     * @param {string} message - Message to log
     */
    success: (message) => {
      if (currentLogLevel <= LOG_LEVELS.INFO) {
        const formatted = formatMessage('INFO', moduleName, `✓ ${message}`);
        console.info(formatted);
      }
    },

    /**
     * Log performance timing
     * @param {string} operation - Operation name
     * @param {number} durationMs - Duration in milliseconds
     */
    timing: (operation, durationMs) => {
      if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        const formatted = formatMessage('DEBUG', moduleName, `${operation} completed in ${durationMs}ms`);
        console.debug(formatted);
      }
    }
  };
};

/**
 * Global logger for system-level messages
 */
const systemLogger = createLogger('System');

module.exports = {
  createLogger,
  LOG_LEVELS,
  systemLogger
};

