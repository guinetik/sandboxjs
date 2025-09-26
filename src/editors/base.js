/**
 * Base class for editor adapters providing a common interface
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class EditorAdapter {
  /**
   * Creates a new EditorAdapter instance
   * @param {HTMLElement} container - DOM element to contain the editor
   * @param {Object} [options={}] - Editor configuration options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.changeHandlers = [];
    this.executeHandlers = [];
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
   * Cleans up the editor instance
   * Override if cleanup is needed
   */
  destroy() {
    // Override if cleanup needed
  }
}