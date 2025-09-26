import { EditorAdapter } from './base.js';

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
   */
  constructor(container, options = {}) {
    super(container, options);
    this.cm = null;
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
      theme: this.options.theme || 'darcula',
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
   * Cleans up the CodeMirror editor by converting back to textarea
   */
  destroy() {
    if (this.cm) {
      this.cm.toTextArea();
    }
  }
}