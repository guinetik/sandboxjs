import { EditorAdapter } from './base.js';
import { Logger } from '../core/logger.js';

/**
 * CodeMirror editor adapter with syntax highlighting and advanced features
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class CodeMirrorEditor extends EditorAdapter {
  /**
   * Creates a new CodeMirrorEditor instance
   * @param {HTMLElement} container - DOM element to contain the editor
   * @param {Object} [options={}] - Editor configuration options
   * @param {string} [options.mode='javascript'] - CodeMirror language mode
   * @param {string} [options.theme='darcula'] - CodeMirror theme
   * @param {boolean} [options.autofocus=true] - Whether to autofocus the editor
   * @param {Object} [eventEmitter] - Event emitter for listening to global events
   */
  constructor(container, options = {}, eventEmitter = null) {
    super(container, options, eventEmitter);
    this.cm = null;
    this.currentTheme = options.theme || 'darcula';

    this.logger = new Logger({
      enabled: true,
      level: 'info',
      prefix: 'CodeMirrorEditor'
    });

    this.logger.info('CodeMirror editor initialized with theme:', this.currentTheme);
    this.logger.info('Event emitter provided:', !!eventEmitter);

    this.init();
  }

  /**
   * Initializes the CodeMirror editor instance
   * @throws {Error} If CodeMirror is not loaded
   */
  init() {
    if (typeof CodeMirror === 'undefined') {
      throw new Error('CodeMirror is not loaded. Include CodeMirror before using this adapter.');
    }

    const textarea = document.createElement('textarea');
    this.container.appendChild(textarea);

    this.cm = CodeMirror.fromTextArea(textarea, {
      mode: this.options.mode || 'javascript',
      theme: this.currentTheme,
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      autofocus: this.options.autofocus !== false,
      extraKeys: {
        'Ctrl-Enter': () => this.triggerExecute(),
        'Cmd-Enter': () => this.triggerExecute()
      }
    });

    this.cm.on('change', () => {
      this.triggerChange();
    });
  }

  /**
   * Gets the current code value from CodeMirror
   * @returns {string} The current code
   */
  getValue() {
    return this.cm.getValue();
  }

  /**
   * Sets the code value in CodeMirror
   * @param {string} code - The code to set
   */
  setValue(code) {
    this.cm.setValue(code);
  }

  /**
   * Focuses the CodeMirror editor
   */
  focus() {
    this.cm.focus();
  }

  /**
   * Handles theme change events
   * @param {string} newTheme - The new theme name
   * @param {string} oldTheme - The previous theme name
   */
  onThemeChange(newTheme, oldTheme) {
    this.logger.info('onThemeChange called with:', { newTheme, oldTheme });
    this.logger.info('Current theme before change:', this.currentTheme);
    this.logger.info('CodeMirror instance exists:', !!this.cm);

    if (this.cm && newTheme !== this.currentTheme) {
      this.logger.info('Applying theme change from', this.currentTheme, 'to', newTheme);
      this.currentTheme = newTheme;
      this.cm.setOption('theme', newTheme);
      this.logger.info('Theme applied successfully. CodeMirror theme is now:', this.cm.getOption('theme'));
    } else {
      this.logger.warn('Theme change skipped. Reasons:');
      this.logger.warn('- CodeMirror exists:', !!this.cm);
      this.logger.warn('- New theme different from current:', newTheme !== this.currentTheme);
      this.logger.warn('- New theme value:', newTheme);
      this.logger.warn('- Current theme value:', this.currentTheme);
    }
  }

  /**
   * Gets the current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Sets the theme programmatically
   * @param {string} theme - Theme name to set
   */
  setTheme(theme) {
    if (this.cm && theme !== this.currentTheme) {
      this.currentTheme = theme;
      this.cm.setOption('theme', theme);
    }
  }

  /**
   * Cleans up the CodeMirror editor by converting back to textarea
   */
  destroy() {
    if (this.cm) {
      this.cm.toTextArea();
    }
  }
}