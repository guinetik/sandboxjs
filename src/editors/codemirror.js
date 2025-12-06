import { EditorAdapter } from './base.js';
import { createLogger } from '@guinetik/logger';
import { setupAutocomplete, autocompleteStyles } from './autocomplete/setup.js';
import { AdvancedAutocomplete } from './autocomplete/advanced.js';
import { InputManager } from './input.js';

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

    this.logger = createLogger({
      enabled: true,
      level: 'info',
      prefix: 'CodeMirrorEditor',
      showTimestamp: false
    });

    // Initialize InputManager
    this.inputManager = new InputManager({
      debug: options.debug || false
    });

    this.logger.info('CodeMirror editor initialized with theme:', this.currentTheme);
    this.logger.info('Event emitter provided:', !!eventEmitter);

    this.init();
    this.setupInputHandling();
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

    // Setup autocomplete if enabled
    if (this.options.autocomplete !== false) {
      this.setupAutocomplete();
    }

    // Apply glass effect on initial load
    this.applyGlassEffect(this.currentTheme);
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
   * Gets the current font size
   * @returns {number} Font size in pixels
   */
  getFontSize() {
    if (this._fontSize) {
      return this._fontSize;
    }
    const cmElement = this.container.querySelector('.CodeMirror');
    if (cmElement) {
      const computedSize = window.getComputedStyle(cmElement).fontSize;
      return parseInt(computedSize, 10) || 14;
    }
    return 14;
  }

  /**
   * Sets the font size
   * @param {number} size - Font size in pixels
   */
  setFontSize(size) {
    this._fontSize = size;
    const cmElement = this.container.querySelector('.CodeMirror');
    if (cmElement) {
      cmElement.style.fontSize = `${size}px`;
      this.cm.refresh(); // Refresh to recalculate line heights
      this.logger.info('Font size set to:', size);
    }
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

      // Apply glass glow effect by reducing background opacity
      this.applyGlassEffect(newTheme);
    } else {
      this.logger.warn('Theme change skipped. Reasons:');
      this.logger.warn('- CodeMirror exists:', !!this.cm);
      this.logger.warn('- New theme different from current:', newTheme !== this.currentTheme);
      this.logger.warn('- New theme value:', newTheme);
      this.logger.warn('- Current theme value:', this.currentTheme);
    }
  }

  /**
   * Applies consistent dark background regardless of theme
   * Uses CSS variables for consistent monochromatic look
   */
  applyGlassEffect() {
    // Wait for theme to be applied, then override background
    setTimeout(() => {
      const cmElement = this.container.querySelector('.CodeMirror');
      if (cmElement) {
        this.logger.info('Applying consistent dark background');

        // Create or update style element for consistent background
        let styleElement = document.getElementById('codemirror-glass-effect');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'codemirror-glass-effect';
          document.head.appendChild(styleElement);
        }

        // Use CSS variables for consistent background (ignores theme)
        styleElement.textContent = `
          .CodeMirror {
            background-color: var(--editor-bg, #0a0a0c) !important;
          }
          .CodeMirror-gutters {
            background-color: var(--editor-bg-gutter, #08080a) !important;
            border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
          }
          .CodeMirror-activeline-background {
            background-color: rgba(255, 255, 255, 0.03) !important;
          }
        `;

        this.logger.info('Consistent background applied');
      }
    }, 100);
  }

  /**
   * Reduces the opacity of a CSS color value
   * @param {string} color - The CSS color value (rgb, rgba, hex, etc.)
   * @param {number} opacity - The target opacity (0-1)
   * @returns {string} The color with reduced opacity in rgba format
   */
  reduceColorOpacity(color, opacity) {
    // Handle rgba format
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const [, r, g, b] = rgbaMatch;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Handle rgb format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Handle hex format
    const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      const r = parseInt(hexMatch[1], 16);
      const g = parseInt(hexMatch[2], 16);
      const b = parseInt(hexMatch[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Fallback for other formats or if parsing fails
    this.logger.warn('Could not parse color:', color, 'using fallback');
    return `rgba(0, 0, 0, ${opacity})`;
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
   * Sets up autocomplete functionality
   */
  setupAutocomplete() {
    this.logger.info('Setting up autocomplete');

    // Inject autocomplete styles
    if (!document.getElementById('codemirror-autocomplete-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'codemirror-autocomplete-styles';
      styleElement.textContent = autocompleteStyles;
      document.head.appendChild(styleElement);
    }

    // Setup autocomplete functionality
    const autocompleteSetup = setupAutocomplete(this.cm, {
      autoComplete: true
    });

    this.advancedAutocomplete = new AdvancedAutocomplete(this.cm, {
      debug: this.options.debug
    });

    // Connect the two systems so setup can access scope variables
    if (autocompleteSetup && autocompleteSetup.setAdvancedInstance) {
      autocompleteSetup.setAdvancedInstance(this.advancedAutocomplete);
    }

    this.logger.info('Autocomplete setup complete');
  }

  /**
   * Set up input handling with InputManager
   */
  setupInputHandling() {
    this.logger.info('Setting up input handling');

    // Listen for input events from CodeMirror
    this.cm.on('inputRead', (cm, change) => {
      if (change.text.length === 1 && change.text[0]) {
        const char = change.text[0];
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);

        const inputData = {
          char,
          position: cursor.ch - 1, // Position before the character was inserted
          line: line.substring(0, cursor.ch - 1) + line.substring(cursor.ch), // Line before insertion
          lineNumber: cursor.line
        };

        this.logger.debug('Input event:', inputData);

        // Get transformation from InputManager
        const transformation = this.inputManager.handleInput(inputData);
        if (transformation) {
          this.applyTransformation(transformation);
        }

        // Trigger the adapter event for external listeners
        this.triggerInput(inputData);
      }
    });

    // Listen for delete operations
    this.cm.on('beforeChange', (cm, change) => {
      if (change.origin === '+delete' || change.origin === 'delete') {
        const cursor = cm.getCursor();
        const line = cm.getLine(cursor.line);

        const deleteData = {
          type: 'backspace', // or 'delete' depending on the operation
          position: cursor.ch,
          line,
          lineNumber: cursor.line
        };

        this.logger.debug('Delete event:', deleteData);

        // Get transformation from InputManager
        const transformation = this.inputManager.handleDelete(deleteData);
        if (transformation) {
          // We need to apply this in the next tick to avoid conflicts
          setTimeout(() => this.applyTransformation(transformation), 0);
        }

        // Trigger the adapter event for external listeners
        this.triggerDelete(deleteData);
      }
    });

    this.logger.info('Input handling setup complete');
  }

  /**
   * Apply a transformation to the CodeMirror editor
   * @param {Object} transformation - Transformation to apply
   */
  applyTransformation(transformation) {
    this.logger.debug('Applying transformation:', transformation);

    const cursor = this.cm.getCursor();

    switch (transformation.action) {
      case 'insert':
        this.cm.replaceSelection(transformation.text);
        if (transformation.cursorOffset !== undefined) {
          const newCursor = this.cm.getCursor();
          this.cm.setCursor(newCursor.line, newCursor.ch + transformation.cursorOffset);
        }
        break;

      case 'skip':
        this.cm.setCursor(cursor.line, cursor.ch + transformation.positions);
        break;

      case 'deleteRange':
        this.cm.replaceRange('',
          { line: cursor.line, ch: transformation.start },
          { line: cursor.line, ch: transformation.end }
        );
        break;

      default:
        this.logger.warn('Unknown transformation action:', transformation.action);
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