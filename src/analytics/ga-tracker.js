/**
 * Google Analytics Event Tracker
 * Maps internal application events to Google Analytics events
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

import { EVENTS } from '../core/constants.js';
import { createLogger } from '@guinetik/logger';

/**
 * Checks if Google Analytics is available
 * @returns {boolean} True if gtag is available
 */
function isGAAvailable() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Sends an event to Google Analytics
 * @param {string} eventName - GA event name
 * @param {Object} [params={}] - Event parameters
 */
function trackEvent(eventName, params = {}) {
  if (!isGAAvailable()) {
    return;
  }

  try {
    window.gtag('event', eventName, params);
  } catch (error) {
    console.warn('Failed to track GA event:', error);
  }
}

/**
 * Google Analytics Event Tracker
 * Listens to internal events and forwards them to Google Analytics
 */
export class GATracker {
  /**
   * Creates a new GATracker instance
   * @param {EventEmitter} eventEmitter - The application event emitter
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.enabled=true] - Whether tracking is enabled
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(eventEmitter, options = {}) {
    this.eventEmitter = eventEmitter;
    this.options = {
      enabled: true,
      debug: false,
      ...options
    };

    this.logger = createLogger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'GATracker',
      showTimestamp: false
    });

    this.unsubscribers = [];
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for all trackable events
   */
  setupEventListeners() {
    if (!this.options.enabled || !isGAAvailable()) {
      this.logger.info('GA tracking disabled or unavailable');
      return;
    }

    // Code execution events
    this.listen(EVENTS.CODE_EXECUTE_START, () => {
      trackEvent('code_execute', { action: 'start' });
    });

    this.listen(EVENTS.CODE_EXECUTE_COMPLETE, () => {
      trackEvent('code_execute', { action: 'complete' });
    });

    this.listen(EVENTS.CODE_EXECUTE_TIMEOUT, () => {
      trackEvent('code_execute', { action: 'timeout' });
    });

    // Code change events (throttled to avoid spam)
    let codeChangeTimeout = null;
    this.listen(EVENTS.CODE_CHANGE, () => {
      if (codeChangeTimeout) {
        clearTimeout(codeChangeTimeout);
      }
      codeChangeTimeout = setTimeout(() => {
        trackEvent('code_change', { action: 'edit' });
      }, 2000); // Track after 2 seconds of inactivity
    });

    // Example loading
    this.listen(EVENTS.EXAMPLE_LOAD, (data) => {
      // EXAMPLE_LOAD emits the example name directly (string) or could be an object
      const exampleName = typeof data === 'string' ? data : (data?.name || data || 'unknown');
      trackEvent('example_load', {
        example_name: exampleName
      });
    });

    this.listen(EVENTS.EXAMPLE_LOADED, (data) => {
      // EXAMPLE_LOADED emits { exampleId, example }
      const exampleName = data?.exampleId || data?.example?.name || data?.example || 'unknown';
      trackEvent('example_loaded', {
        example_name: exampleName
      });
    });

    // Theme changes
    this.listen(EVENTS.THEME_CHANGE, (data) => {
      // THEME_CHANGE emits { theme, oldTheme }
      const themeName = data?.theme || (typeof data === 'string' ? data : 'unknown');
      trackEvent('theme_change', {
        theme_name: themeName
      });
    });

    // Editor changes
    this.listen(EVENTS.EDITOR_CHANGE, (data) => {
      // EDITOR_CHANGE emits { editor, oldEditor }
      const editorType = data?.editor || (typeof data === 'string' ? data : 'unknown');
      trackEvent('editor_change', {
        editor_type: editorType
      });
    });

    // Library management
    this.listen(EVENTS.LIBRARY_MANAGER_OPEN, () => {
      trackEvent('library_manager', { action: 'open' });
    });

    this.listen(EVENTS.LIBRARY_ADDED, (data) => {
      // LIBRARY_ADDED emits { library }
      const libraryUrl = data?.library?.url || (typeof data === 'string' ? data : 'unknown');
      trackEvent('library_add', {
        library_url: this.sanitizeUrl(libraryUrl)
      });
    });

    this.listen(EVENTS.LIBRARY_REMOVED, (data) => {
      // LIBRARY_REMOVED emits { library }
      const libraryUrl = data?.library?.url || (typeof data === 'string' ? data : 'unknown');
      trackEvent('library_remove', {
        library_url: this.sanitizeUrl(libraryUrl)
      });
    });

    this.listen(EVENTS.DOMAIN_ADDED, (data) => {
      // DOMAIN_ADDED emits { domain }
      const domain = data?.domain || (typeof data === 'string' ? data : 'unknown');
      trackEvent('domain_trust', {
        domain: this.sanitizeDomain(domain)
      });
    });

    this.listen(EVENTS.LIBRARIES_CLEARED, () => {
      trackEvent('libraries_clear', { action: 'clear_all' });
    });

    // Fullscreen modes
    this.listen(EVENTS.FULLSCREEN_EDITOR, () => {
      trackEvent('fullscreen', { mode: 'editor' });
    });

    this.listen(EVENTS.FULLSCREEN_CONSOLE, () => {
      trackEvent('fullscreen', { mode: 'console' });
    });

    this.listen(EVENTS.FULLSCREEN_EXIT, () => {
      trackEvent('fullscreen', { mode: 'exit' });
    });

    // Sandbox reset
    this.listen(EVENTS.SANDBOX_RESET, () => {
      trackEvent('sandbox_reset', { action: 'reset' });
    });

    // Console clear
    this.listen(EVENTS.CONSOLE_CLEAR, () => {
      trackEvent('console_clear', { action: 'clear' });
    });

    // Share functionality
    this.listen(EVENTS.SHARE_SUCCESS, () => {
      trackEvent('share', { action: 'success' });
    });

    this.listen(EVENTS.SHARE_ERROR, () => {
      trackEvent('share', { action: 'error' });
    });

    // Initialization
    this.listen(EVENTS.INIT_COMPLETE, () => {
      trackEvent('app_init', { action: 'complete' });
    });

    this.logger.info('GA event listeners registered');
  }

  /**
   * Helper to listen to an event and store unsubscribe function
   * @param {string} eventName - Event name to listen to
   * @param {Function} callback - Callback function
   */
  listen(eventName, callback) {
    const unsubscribe = this.eventEmitter.on(eventName, (...args) => {
      this.logger.debug(`Event received: ${eventName}`, args);
      callback(...args);
    });
    this.unsubscribers.push(unsubscribe);
  }

  /**
   * Sanitizes a URL for tracking (removes sensitive data)
   * @param {string|Object} url - URL to sanitize (string or object with url property)
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    // Handle object input (defensive programming)
    if (url && typeof url === 'object') {
      url = url.url || url.href || String(url);
    }

    if (!url || typeof url !== 'string') {
      return 'unknown';
    }

    try {
      const urlObj = new URL(url);
      // Return just the domain and path, no query params or fragments
      return `${urlObj.hostname}${urlObj.pathname}`;
    } catch (e) {
      // If URL parsing fails, return a truncated version
      return url.substring(0, 100);
    }
  }

  /**
   * Sanitizes a domain name for tracking
   * @param {string|Object} domain - Domain to sanitize (string or object with domain property)
   * @returns {string} Sanitized domain
   */
  sanitizeDomain(domain) {
    // Handle object input (defensive programming)
    if (domain && typeof domain === 'object') {
      domain = domain.domain || String(domain);
    }

    if (!domain || typeof domain !== 'string') {
      return 'unknown';
    }

    // Remove protocol if present
    return domain.replace(/^https?:\/\//, '').split('/')[0];
  }

  /**
   * Manually track a custom event
   * @param {string} eventName - GA event name
   * @param {Object} [params={}] - Event parameters
   */
  track(eventName, params = {}) {
    trackEvent(eventName, params);
  }

  /**
   * Destroys the tracker and removes all event listeners
   */
  destroy() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    this.logger.info('GA tracker destroyed');
  }
}
