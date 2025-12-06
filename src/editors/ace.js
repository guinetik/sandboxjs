import { EditorAdapter } from './base.js';
import { createLogger } from '@guinetik/logger';

/**
 * ACE editor adapter with syntax highlighting and advanced features
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ACEEditor extends EditorAdapter {
  /**
   * Creates a new ACEEditor instance
   * @param {HTMLElement} container - DOM element to contain the editor
   * @param {Object} [options={}] - Editor configuration options
   * @param {string} [options.mode='javascript'] - ACE language mode
   * @param {string} [options.theme='monokai'] - ACE theme
   * @param {boolean} [options.autofocus=true] - Whether to autofocus the editor
   * @param {boolean} [options.autocomplete=true] - Enable autocomplete
   * @param {Object} [eventEmitter] - Event emitter for listening to global events
   */
  constructor(container, options = {}, eventEmitter = null) {
    super(container, options, eventEmitter);
    this.editor = null;
    this.currentTheme = options.theme || 'monokai';

    this.logger = createLogger({
      enabled: true,
      level: 'info',
      prefix: 'ACEEditor',
      showTimestamp: false
    });

    this.logger.info('ACE editor initialized with theme:', this.currentTheme);
    this.logger.info('Event emitter provided:', !!eventEmitter);

    this.init();
  }

  /**
   * Initializes the ACE editor instance
   * @throws {Error} If ACE is not loaded
   */
  init() {
    if (typeof ace === 'undefined') {
      throw new Error('ACE is not loaded. Include ACE before using this adapter.');
    }

    // Create editor element
    const editorElement = document.createElement('div');
    editorElement.style.cssText = `
      width: 100%;
      height: 100%;
      min-height: 300px;
    `;
    this.container.appendChild(editorElement);

    // Initialize ACE editor
    this.editor = ace.edit(editorElement);
    
    // Configure editor
    this.editor.setTheme(`ace/theme/${this.currentTheme}`);
    this.editor.session.setMode('ace/mode/javascript');
    this.editor.setOptions({
      fontSize: '14px',
      showPrintMargin: false,
      showGutter: true,
      highlightActiveLine: true,
      enableBasicAutocompletion: this.options.autocomplete !== false,
      enableLiveAutocompletion: this.options.autocomplete !== false,
      enableSnippets: true,
      wrap: true,
      tabSize: 2,
      useSoftTabs: true,
      behavioursEnabled: true,
      wrapBehavioursEnabled: true
    });

    // Set up keyboard shortcuts
    this.editor.commands.addCommand({
      name: 'executeCode',
      bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
      exec: () => this.triggerExecute()
    });

    // Set up event listeners
    this.editor.on('change', () => {
      this.triggerChange();
    });

    // Apply glass effect on initial load
    this.applyGlassEffect(this.currentTheme);

    // Focus if requested
    if (this.options.autofocus !== false) {
      this.editor.focus();
    }

    this.logger.info('ACE editor initialized successfully');
  }

  /**
   * Gets the current code value from ACE
   * @returns {string} The current code
   */
  getValue() {
    return this.editor ? this.editor.getValue() : '';
  }

  /**
   * Sets the code value in ACE
   * @param {string} code - The code to set
   */
  setValue(code) {
    if (this.editor) {
      this.editor.setValue(code, -1); // -1 means move cursor to start
    }
  }

  /**
   * Focuses the ACE editor
   */
  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Gets the current font size
   * @returns {number} Font size in pixels
   */
  getFontSize() {
    if (this.editor) {
      const size = this.editor.getFontSize();
      return typeof size === 'string' ? parseInt(size, 10) : size;
    }
    return 14;
  }

  /**
   * Sets the font size
   * @param {number} size - Font size in pixels
   */
  setFontSize(size) {
    this._fontSize = size;
    if (this.editor) {
      this.editor.setFontSize(size);
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
    this.logger.info('ACE editor instance exists:', !!this.editor);

    if (this.editor && newTheme !== this.currentTheme) {
      this.logger.info('Applying theme change from', this.currentTheme, 'to', newTheme);
      this.currentTheme = newTheme;
      this.editor.setTheme(`ace/theme/${newTheme}`);
      this.logger.info('Theme applied successfully');

      // Apply glass glow effect by reducing background opacity
      this.applyGlassEffect(newTheme);
    } else {
      this.logger.warn('Theme change skipped. Reasons:');
      this.logger.warn('- ACE editor exists:', !!this.editor);
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
      const aceElement = this.container.querySelector('.ace_editor');
      if (aceElement) {
        this.logger.info('Applying consistent dark background');

        // Create or update style element for consistent background
        let styleElement = document.getElementById('ace-glass-effect');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'ace-glass-effect';
          document.head.appendChild(styleElement);
        }

        // Use CSS variables for consistent background (ignores theme)
        styleElement.textContent = `
          .ace_editor {
            background-color: var(--editor-bg, #0a0a0c) !important;
          }
          .ace_gutter {
            background-color: var(--editor-bg-gutter, #08080a) !important;
          }
          .ace_gutter-active-line {
            background-color: rgba(255, 255, 255, 0.05) !important;
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
    if (this.editor && theme !== this.currentTheme) {
      this.currentTheme = theme;
      this.editor.setTheme(`ace/theme/${theme}`);
    }
  }

  /**
   * Apply a transformation to the ACE editor
   * @param {Object} transformation - Transformation to apply
   */
  applyTransformation(transformation) {
    this.logger.debug('Applying transformation:', transformation);

    const cursor = this.editor.getCursorPosition();

    switch (transformation.action) {
      case 'insert':
        this.editor.insert(transformation.text);
        if (transformation.cursorOffset !== undefined) {
          const newCursor = this.editor.getCursorPosition();
          this.editor.moveCursorTo(newCursor.row, newCursor.column + transformation.cursorOffset);
        }
        break;

      case 'skip':
        this.editor.moveCursorTo(cursor.row, cursor.column + transformation.positions);
        break;

      case 'deleteRange':
        const range = new ace.Range(
          cursor.row, transformation.start,
          cursor.row, transformation.end
        );
        this.editor.session.remove(range);
        break;

      default:
        this.logger.warn('Unknown transformation action:', transformation.action);
    }
  }

  /**
   * Cleans up the ACE editor
   */
  destroy() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }
}
