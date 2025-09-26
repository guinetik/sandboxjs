import { EditorAdapter } from './base.js';

/**
 * Plain textarea editor adapter for basic code editing
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class TextareaEditor extends EditorAdapter {
  /**
   * Creates a new TextareaEditor instance
   * @param {HTMLElement} container - DOM element to contain the editor
   * @param {Object} [options={}] - Editor configuration options
   * @param {string} [options.placeholder] - Placeholder text for the textarea
   */
  constructor(container, options = {}) {
    super(container, options);
    this.textarea = null;
    this.init();
  }

  /**
   * Initializes the textarea editor
   */
  init() {
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'code-editor';
    this.textarea.spellcheck = false;
    this.textarea.placeholder = this.options.placeholder || 'Enter your JavaScript code here...';

    this.container.appendChild(this.textarea);
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for the textarea
   */
  setupEventListeners() {
    this.textarea.addEventListener('input', () => {
      this.triggerChange();
    });

    this.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.triggerExecute();
      }
    });
  }

  /**
   * Gets the current code value from the textarea
   * @returns {string} The current code
   */
  getValue() {
    return this.textarea.value;
  }

  /**
   * Sets the code value in the textarea
   * @param {string} code - The code to set
   */
  setValue(code) {
    this.textarea.value = code;
  }

  /**
   * Focuses the textarea
   */
  focus() {
    this.textarea.focus();
  }

  /**
   * Cleans up the textarea editor
   */
  destroy() {
    if (this.textarea) {
      this.textarea.remove();
    }
  }
}