import { LOG_LEVELS, DEFAULT_LOG_LEVEL } from './constants.js';

/**
 * Global logging filter manager for enabling/disabling specific components
 */
class LoggingManager {
  constructor() {
    this.allowedComponents = new Set();
    this.globalEnabled = true;
    this.allowAll = false;

    // Try to load from localStorage
    this.loadFromStorage();
  }

  /**
   * Enables logging for specific components
   * @param {...string} components - Component names to enable
   */
  enable(...components) {
    components.forEach(comp => this.allowedComponents.add(comp.toLowerCase()));
    this.saveToStorage();
    console.log('🔧 Logging enabled for:', components.join(', '));
  }

  /**
   * Disables logging for specific components
   * @param {...string} components - Component names to disable
   */
  disable(...components) {
    components.forEach(comp => this.allowedComponents.delete(comp.toLowerCase()));
    this.saveToStorage();
    console.log('🔧 Logging disabled for:', components.join(', '));
  }

  /**
   * Enables logging for all components
   */
  enableAll() {
    this.allowAll = true;
    this.saveToStorage();
    console.log('🔧 Logging enabled for ALL components');
  }

  /**
   * Disables logging for all components except errors
   */
  disableAll() {
    this.allowAll = false;
    this.allowedComponents.clear();
    this.saveToStorage();
    console.log('🔧 Logging disabled for ALL components (errors still show)');
  }

  /**
   * Shows current logging status
   */
  status() {
    console.log('🔧 Logging Status:');
    console.log('  Global enabled:', this.globalEnabled);
    console.log('  Allow all:', this.allowAll);
    console.log('  Enabled components:', Array.from(this.allowedComponents).join(', ') || 'none');
  }

  /**
   * Lists available components that have loggers
   */
  listComponents() {
    console.log('🔧 Available components to filter:');
    const components = Array.from(this.registeredComponents || []).sort();
    components.forEach(comp => {
      const enabled = this.isComponentEnabled(comp);
      console.log(`  ${enabled ? '✅' : '❌'} ${comp}`);
    });
  }

  /**
   * Checks if a component should log
   * @param {string} component - Component name
   * @returns {boolean} True if component should log
   */
  isComponentEnabled(component) {
    if (!this.globalEnabled) return false;
    if (this.allowAll) return true;
    return this.allowedComponents.has(component.toLowerCase());
  }

  /**
   * Registers a component for tracking
   * @param {string} component - Component name
   */
  registerComponent(component) {
    if (!this.registeredComponents) this.registeredComponents = new Set();
    this.registeredComponents.add(component);
  }

  /**
   * Saves filter state to localStorage
   */
  saveToStorage() {
    try {
      const state = {
        allowedComponents: Array.from(this.allowedComponents),
        allowAll: this.allowAll,
        globalEnabled: this.globalEnabled
      };
      localStorage.setItem('sandbox_logging_filters', JSON.stringify(state));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Loads filter state from localStorage
   */
  loadFromStorage() {
    try {
      const state = JSON.parse(localStorage.getItem('sandbox_logging_filters') || '{}');
      this.allowedComponents = new Set(state.allowedComponents || []);
      this.allowAll = state.allowAll || false;
      this.globalEnabled = state.globalEnabled !== false;

      // If no saved state exists, set up sensible defaults for theme work
      if (!localStorage.getItem('sandbox_logging_filters')) {
        this.allowedComponents = new Set(['themeswitcher', 'codemirroreditor', 'editoradapter']);
      }
    } catch (e) {
      // Ignore localStorage errors, use defaults
      this.allowedComponents = new Set(['themeswitcher', 'codemirroreditor', 'editoradapter']);
    }
  }
}

// Global instance
const loggingManager = new LoggingManager();

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  window.logFilter = {
    enable: (...components) => loggingManager.enable(...components),
    disable: (...components) => loggingManager.disable(...components),
    enableAll: () => loggingManager.enableAll(),
    disableAll: () => loggingManager.disableAll(),
    status: () => loggingManager.status(),
    list: () => loggingManager.listComponents()
  };
}

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
    this.component = this.prefix; // Use prefix as component name for filtering
    this.redactSecrets = options.redactSecrets || false;
    this.currentLevel = LOG_LEVELS[this.level.toUpperCase()] ?? LOG_LEVELS.INFO;

    // Register this component with the global manager
    if (this.component) {
      loggingManager.registerComponent(this.component);
    }
  }

  /**
   * Checks if a message should be logged based on current level, enabled state, and component filter
   * @param {string} level - The log level to check
   * @returns {boolean} True if the message should be logged
   */
  shouldLog(level) {
    // Always allow errors to pass through
    if (level.toUpperCase() === 'ERROR') {
      return this.enabled && LOG_LEVELS[level.toUpperCase()] <= this.currentLevel;
    }

    // Check if this component is allowed to log
    const componentAllowed = !this.component || loggingManager.isComponentEnabled(this.component);

    return this.enabled &&
           componentAllowed &&
           LOG_LEVELS[level.toUpperCase()] <= this.currentLevel;
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
