import { DEFAULT_STORAGE_KEY } from './constants.js';
import { Logger } from './logger.js';

/**
 * Simple localStorage wrapper for persistent code storage
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class Storage {
  /**
   * Creates a new Storage instance
   * @param {string} [key] - The localStorage key to use
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(key = DEFAULT_STORAGE_KEY, options = {}) {
    this.key = key;
    this.logger = new Logger({
      enabled: options.debug || false,
      level: 'warn',
      prefix: 'Storage'
    });
  }

  /**
   * Saves code to localStorage
   * @param {string} code - The code to save
   * @returns {boolean} True if save was successful
   */
  save(code) {
    try {
      localStorage.setItem(this.key, code);
      return true;
    } catch (e) {
      this.logger.warn('Failed to save code to localStorage:', e);
      return false;
    }
  }

  /**
   * Loads code from localStorage
   * @returns {string|null} The saved code or null if not found
   */
  load() {
    try {
      return localStorage.getItem(this.key);
    } catch (e) {
      this.logger.warn('Failed to load code from localStorage:', e);
      return null;
    }
  }

  /**
   * Clears the saved code
   * @returns {boolean} True if clear was successful
   */
  clear() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (e) {
      this.logger.warn('Failed to clear localStorage:', e);
      return false;
    }
  }
}
