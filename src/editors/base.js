import { Logger } from '../core/logger.js';
import { EVENTS } from '../core/constants.js';

/**
 * Base class for editor adapters providing a common interface
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class EditorAdapter {
  /**
   * Creates a new EditorAdapter instance
   * @param {HTMLElement} container - DOM element to contain the editor
   * @param {Object} [options={}] - Editor configuration options
   * @param {Object} [eventEmitter] - Event emitter for listening to global events
   */
  constructor(container, options = {}, eventEmitter = null) {
    this.container = container;
    this.options = options;
    this.eventEmitter = eventEmitter;
    this.changeHandlers = [];
    this.executeHandlers = [];

    this.logger = new Logger({
      enabled: true,
      level: 'info',
      prefix: 'EditorAdapter'
    });

    // Listen for theme events if event emitter is provided
    if (this.eventEmitter) {
      this.logger.info('Setting up theme event listeners');

      // Listen for theme ready (initial theme load)
      this.eventEmitter.on(EVENTS.THEME_READY, (data) => {
        this.logger.info('Base adapter received theme ready event:', data);
        this.onThemeChange(data.theme, null);
      });

      // Listen for theme changes (user switching themes)
      this.eventEmitter.on(EVENTS.THEME_CHANGE, (data) => {
        this.logger.info('Base adapter received theme change event:', data);
        this.onThemeChange(data.theme, data.oldTheme);
      });
    } else {
      this.logger.warn('No event emitter provided - theme switching will not work');
    }
  }

  /**
   * Gets the current code value from the editor
   * @returns {string} The current code
   * @throws {Error} Must be implemented by subclass
   */
  getValue() {
    throw new Error('getValue() must be implemented by editor adapter');
  }

  /**
   * Sets the code value in the editor
   * @param {string} code - The code to set
   * @throws {Error} Must be implemented by subclass
   */
  setValue(code) {
    throw new Error('setValue() must be implemented by editor adapter');
  }

  /**
   * Registers a callback for code change events
   * @param {Function} callback - Callback function to call when code changes
   */
  onChange(callback) {
    this.changeHandlers.push(callback);
  }

  /**
   * Registers a callback for code execution events (Ctrl+Enter)
   * @param {Function} callback - Callback function to call when user executes code
   */
  onExecute(callback) {
    this.executeHandlers.push(callback);
  }

  /**
   * Focuses the editor
   * @throws {Error} Must be implemented by subclass
   */
  focus() {
    throw new Error('focus() must be implemented by editor adapter');
  }

  /**
   * Triggers all registered change handlers
   */
  triggerChange() {
    this.changeHandlers.forEach(handler => handler(this.getValue()));
  }

  /**
   * Triggers all registered execute handlers
   */
  triggerExecute() {
    this.executeHandlers.forEach(handler => handler());
  }

  /**
   * Called when theme changes - override in subclasses
   * @param {string} newTheme - The new theme name
   * @param {string} oldTheme - The previous theme name
   */
  onThemeChange(newTheme, oldTheme) {
    // Override in subclasses to implement theme switching
  }

  /**
   * Cleans up the editor instance
   * Override if cleanup is needed
   */
  destroy() {
    // Override if cleanup needed
  }
}