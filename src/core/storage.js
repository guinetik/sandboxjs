/**
 * Simple localStorage wrapper for persistent code storage
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class Storage {
  /**
   * Creates a new Storage instance
   * @param {string} [key='js-sandbox-code'] - The localStorage key to use
   */
  constructor(key = 'js-sandbox-code') {
    this.key = key;
  }

  /**
   * Saves code to localStorage
   * @param {string} code - The code to save
   */
  save(code) {
    try {
      localStorage.setItem(this.key, code);
    } catch (e) {
      console.warn('Failed to save code to localStorage:', e);
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
      console.warn('Failed to load code from localStorage:', e);
      return null;
    }
  }
}