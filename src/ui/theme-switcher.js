import { Logger } from '../core/logger.js';
import { EVENTS, EDITOR_THEMES } from '../core/constants.js';

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
      defaultTheme: 'monokai',
      debug: true,
      storageKey: 'sandbox_current_theme',
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'ThemeSwitcher'
    });

    // Check for saved editor preference to initialize with correct themes
    const savedEditor = localStorage.getItem('sandbox_current_editor') || 'ace';
    this.logger.info('Initializing theme switcher with saved editor:', savedEditor);
    
    // Initialize with themes for the saved editor
    this.themes = ThemeSwitcher.getThemesForEditor(savedEditor);

    // Load saved theme or use default (now that themes array exists)
    this.currentTheme = this.loadSavedTheme() || this.options.defaultTheme;
    this.logger.info('Initializing theme switcher with theme:', this.currentTheme);

    this.createDropdown();

    // Load CSS for the current theme on startup and emit events
    this.initializeCurrentTheme();

    // Listen for editor changes to refresh theme list
    this.setupEditorChangeListener();
  }

  /**
   * Sets up listener for editor changes
   */
  setupEditorChangeListener() {
    if (this.eventEmitter) {
      this.eventEmitter.on(EVENTS.EDITOR_CHANGE, async (data) => {
        this.logger.info('Editor changed, refreshing theme list:', data);
        await this.refreshThemesForEditor(data.editor);
      });
    }
  }

  /**
   * Gets themes for a specific editor
   * @param {string} editorName - The editor name
   * @returns {Array} Array of theme objects
   */
  static getThemesForEditor(editorName) {
    switch (editorName) {
      case 'ace':
        return EDITOR_THEMES.ACE;
      case 'codemirror':
        return EDITOR_THEMES.CODEMIRROR;
      case 'textarea':
        return EDITOR_THEMES.TEXTAREA;
      default:
        return EDITOR_THEMES.ACE; // Default fallback
    }
  }

  /**
   * Refreshes themes based on the current editor
   * @param {string} editorName - The current editor name
   */
  async refreshThemesForEditor(editorName) {
    this.logger.info('Refreshing themes for editor:', editorName);
    
    // Update themes based on editor using constants
    this.themes = ThemeSwitcher.getThemesForEditor(editorName);

    // Repopulate dropdown
    this.populateThemes();
    
    // If current theme is not available in new editor, switch to first available
    if (!this.themes.find(t => t.value === this.currentTheme)) {
      const newTheme = this.themes[0].value;
      this.logger.info('Current theme not available in new editor, switching to:', newTheme);
      await this.switchTheme(newTheme);
    } else {
      // Restore current selection and re-apply the theme
      this.dropdown.value = this.currentTheme;
      this.logger.info('Re-applying current theme for new editor:', this.currentTheme);
      await this.switchTheme(this.currentTheme);
    }
  }

  /**
   * Initializes the current theme by loading its CSS and emitting events
   */
  async initializeCurrentTheme() {
    this.logger.info('Initializing current theme:', this.currentTheme);

    // Emit that theme loading started
    this.eventEmitter.emit(EVENTS.THEME_LOAD_START, {
      theme: this.currentTheme
    });

    try {
      await this.loadThemeCSS(this.currentTheme);
      this.logger.info('Current theme CSS loaded:', this.currentTheme);

      // Emit that theme is ready for use
      this.eventEmitter.emit(EVENTS.THEME_READY, {
        theme: this.currentTheme
      });
    } catch (error) {
      this.logger.warn('Failed to load current theme CSS:', error);

      // Emit error but fallback to default
      this.eventEmitter.emit(EVENTS.THEME_READY, {
        theme: 'darcula', // fallback
        error: error.message
      });
    }
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
   * Loads an ACE theme - themes are already loaded via CDN scripts
   * @param {string} themeName - The theme name to load
   * @returns {Promise<void>} Promise that resolves when theme is loaded
   */
  async loadThemeCSS(themeName) {
    // ACE themes are loaded via script tags in HTML, so we just need to verify they're available
    this.logger.info('ACE theme loading for:', themeName);
    
    // Check if ACE is available
    if (typeof ace === 'undefined') {
      throw new Error('ACE editor not loaded');
    }

    // Check if the theme is available in ACE
    try {
      // Try to access the theme to see if it's loaded
      const themePath = `ace/theme/${themeName}`;
      if (ace.require && ace.require(themePath)) {
        this.logger.info('ACE theme is available:', themeName);
        return;
      }
    } catch (error) {
      this.logger.warn('ACE theme may not be loaded:', themeName, error);
    }

    // For now, we'll assume themes are loaded via CDN scripts
    // In a production app, you might want to dynamically load theme scripts
    this.logger.info('Assuming ACE theme is available:', themeName);
    return Promise.resolve();
  }

  /**
   * Loads saved theme from localStorage
   * @returns {string|null} Saved theme name or null if not found
   */
  loadSavedTheme() {
    try {
      const savedTheme = localStorage.getItem(this.options.storageKey);
      if (savedTheme && this.themes.find(t => t.value === savedTheme)) {
        this.logger.info('Loaded saved theme from storage:', savedTheme);
        return savedTheme;
      }
    } catch (error) {
      this.logger.warn('Failed to load saved theme:', error);
    }
    return null;
  }

  /**
   * Saves current theme to localStorage
   * @param {string} themeName - Theme name to save
   */
  saveTheme(themeName) {
    try {
      localStorage.setItem(this.options.storageKey, themeName);
      this.logger.info('Saved theme to storage:', themeName);
    } catch (error) {
      this.logger.warn('Failed to save theme:', error);
    }
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

      // Save theme for persistence
      this.saveTheme(themeName);

      // Emit theme change event for editor adapters to listen to
      this.logger.info('Emitting theme change event with data:', { theme: themeName, oldTheme: oldTheme });
      this.eventEmitter.emit(EVENTS.THEME_CHANGE, {
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