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
   * Applies glass effect by reducing CodeMirror background opacity
   * @param {string} theme - The current theme name
   */
  applyGlassEffect(theme) {
    // Wait for theme to be applied, then modify background opacity
    setTimeout(() => {
      const cmElement = this.container.querySelector('.CodeMirror');
      if (cmElement) {
        this.logger.info('Applying glass effect for theme:', theme);

        // Get the computed background color from the theme
        const computedStyle = window.getComputedStyle(cmElement);
        const backgroundColor = computedStyle.backgroundColor;
        this.logger.info('Original background color:', backgroundColor);

        // Parse the color and reduce opacity to 70% (not 50% - too transparent)
        const reducedOpacityColor = this.reduceColorOpacity(backgroundColor, 0.7);
        this.logger.info('Reduced opacity color:', reducedOpacityColor);

        // Create or update style element for glass effect
        let styleElement = document.getElementById('codemirror-glass-effect');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'codemirror-glass-effect';
          document.head.appendChild(styleElement);
        }

        // Apply reduced opacity background to let glow show through
        const themeClass = `.cm-s-${theme}`;
        styleElement.textContent = `
          ${themeClass}.CodeMirror {
            background-color: ${reducedOpacityColor} !important;
          }
          ${themeClass} .CodeMirror-gutters {
            background-color: ${this.reduceColorOpacity(backgroundColor, 0.8)} !important;
          }
        `;

        this.logger.info('Glass effect applied with reduced opacity background');
      }
    }, 200); // Slightly longer delay to ensure theme CSS is fully loaded
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
   * Cleans up the CodeMirror editor by converting back to textarea
   */
  destroy() {
    if (this.cm) {
      this.cm.toTextArea();
    }
  }
}