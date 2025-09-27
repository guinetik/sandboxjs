import { safeStringify } from './utils.js';
import { Logger } from './logger.js';

/**
 * Console output renderer for displaying sandboxed code execution results
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ConsoleOutput {
  /**
   * Creates a new ConsoleOutput instance
   * @param {HTMLElement} container - The DOM element to render console output in
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(container, options = {}) {
    this.container = container;
    this.logger = new Logger({
      enabled: options.debug || false,
      level: 'warn',
      prefix: 'ConsoleOutput'
    });
  }

  /**
   * Clears all console output
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Adds a new line to the console output
   * @param {string} type - The log type (log, info, warn, error)
   * @param {Array} args - The arguments to display
   */
  addLine(type, args) {
    try {
      const div = document.createElement('div');
      div.className = `console-line console-${type}`;
      div.textContent = args.map(arg => this.formatArg(arg)).join(' ');
      this.container.appendChild(div);
      this.container.scrollTop = this.container.scrollHeight;
    } catch (error) {
      this.logger.error('Failed to add console line:', error);
    }
  }

  /**
   * Formats a value for display in the console
   * @param {any} value - The value to format
   * @returns {string} The formatted string representation
   */
  formatArg(value) {
    try {
      // Handle Error objects
      if (value instanceof Error) {
        return value.stack || value.message || String(value);
      }
    } catch (e) {
      this.logger.warn('Error checking instanceof Error:', e);
    }

    const type = typeof value;
    
    // Handle primitive types
    if (type === 'string') return value;
    if (type === 'number' || type === 'boolean' || value === null) {
      return String(value);
    }
    if (type === 'undefined') return 'undefined';

    // Handle DOM nodes
    try {
      if (typeof Node !== 'undefined' && value instanceof Node) {
        return '<' + (value.nodeName || 'node').toLowerCase() + '>';
      }
    } catch (e) {
      this.logger.warn('Error checking instanceof Node:', e);
    }

    // Handle objects and arrays
    try {
      return safeStringify(value);
    } catch (e) {
      this.logger.warn('Failed to stringify value:', e);
      return String(value);
    }
  }
}
