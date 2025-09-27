import { LOG_LEVELS, DEFAULT_LOG_LEVEL } from './constants.js';

/**
 * Configurable logging interface with level-based filtering and prefixes
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class Logger {
  /**
   * Creates a new Logger instance
   * @param {Object} options - Logger configuration options
   * @param {boolean} [options.enabled=true] - Whether logging is enabled
   * @param {string} [options.level='info'] - Log level (error, warn, info, debug, trace)
   * @param {string} [options.prefix=''] - Prefix to add to all log messages
   * @param {boolean} [options.redactSecrets=false] - Whether to redact potential secrets
   */
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.level = options.level || DEFAULT_LOG_LEVEL;
    this.prefix = options.prefix || '';
    this.redactSecrets = options.redactSecrets || false;
    this.currentLevel = LOG_LEVELS[this.level.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  /**
   * Checks if a message should be logged based on current level and enabled state
   * @param {string} level - The log level to check
   * @returns {boolean} True if the message should be logged
   */
  shouldLog(level) {
    return this.enabled && LOG_LEVELS[level.toUpperCase()] <= this.currentLevel;
  }

  /**
   * Redacts potential secrets from arguments
   * @param {Array} args - Arguments to redact
   * @returns {Array} Redacted arguments
   */
  redactArgs(args) {
    if (!this.redactSecrets) return args;
    
    return args.map(arg => {
      if (typeof arg === 'string') {
        // Redact anything that looks like a token/secret (alphanumeric strings > 20 chars)
        return arg.replace(/\b[a-zA-Z0-9]{20,}\b/g, '[REDACTED]');
      }
      return arg;
    });
  }

  /**
   * Formats a message with prefix
   * @param {string} message - The message to format
   * @param {...any} args - Additional arguments
   * @returns {Array} Formatted message array
   */
  formatMessage(message, ...args) {
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    const redactedArgs = this.redactArgs(args);
    return [prefix + message, ...redactedArgs];
  }

  /**
   * Logs an error message
   * @param {string} message - The error message
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage(message, ...args));
    }
  }

  /**
   * Logs a warning message
   * @param {string} message - The warning message
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage(message, ...args));
    }
  }

  /**
   * Logs an info message
   * @param {string} message - The info message
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage(message, ...args));
    }
  }

  /**
   * Logs a general message
   * @param {string} message - The message
   * @param {...any} args - Additional arguments
   */
  log(message, ...args) {
    if (this.shouldLog('info')) {
      console.log(...this.formatMessage(message, ...args));
    }
  }

  /**
   * Logs a debug message
   * @param {string} message - The debug message
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage(message, ...args));
    }
  }

  /**
   * Logs a trace message (with secret redaction by default)
   * @param {string} message - The trace message
   * @param {...any} args - Additional arguments
   */
  trace(message, ...args) {
    if (this.shouldLog('trace')) {
      // Always redact for trace logs to avoid leaking secrets
      const wasRedacting = this.redactSecrets;
      this.redactSecrets = true;
      console.trace(...this.formatMessage(message, ...args));
      this.redactSecrets = wasRedacting;
    }
  }

  /**
   * Logs a table of data
   * @param {any} data - The data to display in table format
   * @param {Array} [columns] - Optional column names
   */
  table(data, columns) {
    if (this.shouldLog('info')) {
      const prefix = this.prefix ? `[${this.prefix}]` : '';
      if (prefix) console.log(prefix);
      console.table(data, columns);
    }
  }

  /**
   * Creates a new group in the console
   * @param {string} label - The group label
   */
  group(label) {
    if (this.shouldLog('info')) {
      console.group(...this.formatMessage(label));
    }
  }

  /**
   * Creates a new collapsed group in the console
   * @param {string} label - The group label
   */
  groupCollapsed(label) {
    if (this.shouldLog('info')) {
      console.groupCollapsed(...this.formatMessage(label));
    }
  }

  /**
   * Ends the current console group
   */
  groupEnd() {
    if (this.shouldLog('info')) {
      console.groupEnd();
    }
  }

  /**
   * Starts a timer with the given label
   * @param {string} label - The timer label
   */
  time(label) {
    if (this.shouldLog('debug')) {
      console.time(this.prefix ? `[${this.prefix}] ${label}` : label);
    }
  }

  /**
   * Ends a timer with the given label
   * @param {string} label - The timer label
   */
  timeEnd(label) {
    if (this.shouldLog('debug')) {
      console.timeEnd(this.prefix ? `[${this.prefix}] ${label}` : label);
    }
  }

  /**
   * Sets the log level
   * @param {string} level - The new log level
   */
  setLevel(level) {
    this.level = level;
    this.currentLevel = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  /**
   * Enables logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disables logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Checks if logging is enabled
   * @returns {boolean} True if logging is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}
