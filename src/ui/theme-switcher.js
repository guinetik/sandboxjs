import { Logger } from '../core/logger.js';

/**
 * Theme switcher UI component
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ThemeSwitcher {
  /**
   * Creates a new ThemeSwitcher instance
   * @param {HTMLElement} container - The container element for the dropdown
   * @param {Object} eventEmitter - The event emitter instance
   * @param {Object} options - Configuration options
   * @param {string} [options.defaultTheme='darcula'] - Default theme name
   * @param {boolean} [options.debug=true] - Enable debug logging
   */
  constructor(container, eventEmitter, options = {}) {
    this.container = container;
    this.eventEmitter = eventEmitter;
    this.options = {
      defaultTheme: 'darcula',
      debug: true,
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'ThemeSwitcher'
    });

    this.currentTheme = this.options.defaultTheme;
    this.logger.info('Initializing theme switcher with default theme:', this.currentTheme);
    this.themes = [
      { value: 'default', label: '🏳️ Default' },
      { value: 'darcula', label: '🌙 Darcula' },
      { value: 'monokai', label: '🎯 Monokai' },
      { value: 'solarized', label: '☀️ Solarized Dark' },
      { value: 'material', label: '📱 Material' },
      { value: 'dracula', label: '🧛 Dracula' },
      { value: 'tomorrow-night-eighties', label: '🌉 Tomorrow Night' },
      { value: 'base16-dark', label: '🌃 Base16 Dark' },
      { value: 'blackboard', label: '⚫ Blackboard' },
      { value: 'eclipse', label: '🌅 Eclipse' }
    ];

    this.createDropdown();
  }

  /**
   * Creates the theme switcher dropdown HTML structure
   */
  createDropdown() {
    // Check if dropdown already exists in container
    const existingDropdown = this.container.querySelector('.theme-switcher');
    if (existingDropdown) {
      existingDropdown.remove();
    }

    this.dropdown = document.createElement('select');
    this.dropdown.className = 'theme-switcher examples-dropdown'; // Reuse examples dropdown styling
    this.dropdown.title = 'Switch editor theme';

    // Add theme options
    this.populateThemes();

    // Set default theme
    this.dropdown.value = this.currentTheme;

    this.dropdown.addEventListener('change', async (e) => {
      const themeValue = e.target.value;
      this.logger.info('Theme dropdown changed to:', themeValue);
      this.logger.info('Current theme is:', this.currentTheme);

      if (themeValue && themeValue !== this.currentTheme) {
        this.logger.info('Switching theme from', this.currentTheme, 'to', themeValue);
        await this.switchTheme(themeValue);
      } else {
        this.logger.warn('Theme value is empty or same as current theme');
      }
    });

    // Insert after the examples dropdown if it exists, otherwise after preview button
    const examplesDropdown = this.container.querySelector('.examples-dropdown');
    const previewLabel = this.container.querySelector('label.btn');

    if (examplesDropdown) {
      this.container.insertBefore(this.dropdown, examplesDropdown.nextSibling);
    } else if (previewLabel) {
      this.container.insertBefore(this.dropdown, previewLabel.nextSibling);
    } else {
      this.container.appendChild(this.dropdown);
    }
  }

  /**
   * Populates the dropdown with available themes
   */
  populateThemes() {
    // Clear existing options
    this.dropdown.innerHTML = '';

    // Add theme options
    this.themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme.value;
      option.textContent = theme.label;
      this.dropdown.appendChild(option);
    });
  }

  /**
   * Loads a CodeMirror theme CSS file if not already loaded
   * @param {string} themeName - The theme name to load
   * @returns {Promise<void>} Promise that resolves when theme is loaded
   */
  async loadThemeCSS(themeName) {
    // Skip loading for default theme (no CSS needed)
    if (themeName === 'default') {
      this.logger.info('Skipping CSS load for default theme');
      return;
    }

    // Check if theme CSS is already loaded
    const existingLink = document.querySelector(`link[href*="theme/${themeName}"]`);
    if (existingLink) {
      this.logger.info('Theme CSS already loaded for:', themeName);
      return;
    }

    // Load theme CSS dynamically
    this.logger.info('Loading theme CSS for:', themeName);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/${themeName}.min.css`;

    return new Promise((resolve, reject) => {
      link.onload = () => {
        this.logger.info('Theme CSS loaded successfully for:', themeName);
        resolve();
      };
      link.onerror = () => {
        this.logger.error('Failed to load theme CSS for:', themeName);
        reject(new Error(`Failed to load theme: ${themeName}`));
      };
      document.head.appendChild(link);
    });
  }

  /**
   * Switches to a new theme
   * @param {string} themeName - The theme name to switch to
   */
  async switchTheme(themeName) {
    const oldTheme = this.currentTheme;
    this.currentTheme = themeName;

    this.logger.info('switchTheme called: changing from', oldTheme, 'to', themeName);

    // Update dropdown value
    this.dropdown.value = themeName;
    this.logger.info('Dropdown value updated to:', this.dropdown.value);

    try {
      // Load theme CSS first
      await this.loadThemeCSS(themeName);

      // Emit theme change event for editor adapters to listen to
      this.logger.info('Emitting theme:changed event with data:', { theme: themeName, oldTheme: oldTheme });
      this.eventEmitter.emit('theme:changed', {
        theme: themeName,
        oldTheme: oldTheme
      });
      this.logger.info('Theme change event emitted successfully');
    } catch (error) {
      this.logger.error('Failed to switch theme:', error);
      // Revert dropdown to old theme
      this.dropdown.value = oldTheme;
      this.currentTheme = oldTheme;
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
   * Sets the current theme programmatically
   * @param {string} themeName - The theme name to set
   */
  setTheme(themeName) {
    if (this.themes.find(t => t.value === themeName)) {
      this.switchTheme(themeName);
    }
  }

  /**
   * Adds a new theme to the list
   * @param {string} value - Theme value/name
   * @param {string} label - Display label for the theme
   */
  addTheme(value, label) {
    // Check if theme already exists
    if (!this.themes.find(t => t.value === value)) {
      this.themes.push({ value, label });
      this.populateThemes();
      this.dropdown.value = this.currentTheme; // Restore selection
    }
  }

  /**
   * Destroys the theme switcher
   */
  destroy() {
    if (this.dropdown && this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
  }
}