import { Logger } from '../core/logger.js';
import { EVENTS } from '../core/constants.js';

/**
 * Fullscreen manager for toggling between editor and console views
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class FullscreenManager {
  /**
   * Creates a new FullscreenManager instance
   * @param {Object} eventEmitter - Event emitter instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(eventEmitter, options = {}) {
    this.eventEmitter = eventEmitter;
    this.options = {
      debug: false,
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'FullscreenManager'
    });

    this.currentMode = null; // null, 'editor', 'console'
    this.appElement = null;
    this.elements = {};
    this.isChanging = false; // Recursion guard

    this.setupEventListeners();
  }

  /**
   * Initializes the fullscreen manager with DOM elements
   * @param {Object} elements - DOM elements
   * @param {HTMLElement} elements.app - Main app container
   * @param {HTMLElement} elements.fullscreenEditor - Editor fullscreen button
   * @param {HTMLElement} elements.fullscreenConsole - Console fullscreen button
   */
  init(elements) {
    this.appElement = elements.app;
    this.elements = elements;

    this.logger.info('Fullscreen manager initialized');

    // Add click listeners to fullscreen buttons
    if (this.elements.fullscreenEditor) {
      this.elements.fullscreenEditor.addEventListener('click', () => {
        this.toggleFullscreen('editor');
      });
    }

    if (this.elements.fullscreenConsole) {
      this.elements.fullscreenConsole.addEventListener('click', () => {
        this.toggleFullscreen('console');
      });
    }

    // Add keyboard shortcut (F11 or Escape)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'Escape' && this.currentMode) {
        this.exitFullscreen();
      }
    });
  }

  /**
   * Sets up event listeners for fullscreen events
   */
  setupEventListeners() {
    this.eventEmitter.on(EVENTS.FULLSCREEN_TOGGLE, (mode) => {
      this.toggleFullscreen(mode);
    });

    this.eventEmitter.on(EVENTS.FULLSCREEN_EXIT, () => {
      this.exitFullscreen();
    });
  }

  /**
   * Toggles fullscreen mode for specified pane
   * @param {string} [mode] - 'editor', 'console', or null to cycle
   */
  toggleFullscreen(mode) {
    if (!this.appElement) {
      this.logger.warn('App element not initialized');
      return;
    }

    // If no mode specified, cycle through modes
    if (!mode) {
      if (this.currentMode === null) {
        mode = 'editor';
      } else if (this.currentMode === 'editor') {
        mode = 'console';
      } else {
        mode = null; // exit fullscreen
      }
    }

    // If same mode is clicked, exit fullscreen
    if (mode === this.currentMode) {
      mode = null;
    }

    this.setFullscreenMode(mode);
  }

  /**
   * Sets the fullscreen mode
   * @param {string|null} mode - 'editor', 'console', or null for normal view
   */
  setFullscreenMode(mode) {
    if (!this.appElement) return;

    // Prevent recursion: if we're already changing or in the target mode, don't do anything
    if (this.isChanging || mode === this.currentMode) return;

    this.isChanging = true;
    const previousMode = this.currentMode;

    try {
      // Remove all fullscreen classes
      this.appElement.classList.remove('fullscreen-editor', 'fullscreen-console');

      // Update button states
      this.updateButtonStates(null);

      if (mode) {
        // Add appropriate fullscreen class
        this.appElement.classList.add(`fullscreen-${mode}`);
        this.updateButtonStates(mode);

        this.logger.info(`Entering fullscreen mode: ${mode}`);
        this.eventEmitter.emit(`FULLSCREEN_${mode.toUpperCase()}`, { mode });
      } else if (previousMode) {
        // Only emit exit event if we were actually in fullscreen before
        this.logger.info('Exiting fullscreen mode');
        this.eventEmitter.emit(EVENTS.FULLSCREEN_EXIT, { previousMode });
      }

      this.currentMode = mode;
    } finally {
      // Always clear the changing flag
      this.isChanging = false;
    }
  }

  /**
   * Updates button states based on current mode
   * @param {string|null} activeMode - Current active mode
   */
  updateButtonStates(activeMode) {
    // Update editor button
    if (this.elements.fullscreenEditor) {
      if (activeMode === 'editor') {
        this.elements.fullscreenEditor.textContent = '◱'; // Exit symbol
        this.elements.fullscreenEditor.title = 'Exit Fullscreen';
      } else {
        this.elements.fullscreenEditor.textContent = '⛶'; // Fullscreen symbol
        this.elements.fullscreenEditor.title = 'Fullscreen Editor';
      }
    }

    // Update console button
    if (this.elements.fullscreenConsole) {
      if (activeMode === 'console') {
        this.elements.fullscreenConsole.textContent = '◱'; // Exit symbol
        this.elements.fullscreenConsole.title = 'Exit Fullscreen';
      } else {
        this.elements.fullscreenConsole.textContent = '⛶'; // Fullscreen symbol
        this.elements.fullscreenConsole.title = 'Fullscreen Console';
      }
    }
  }

  /**
   * Exits fullscreen mode
   */
  exitFullscreen() {
    this.setFullscreenMode(null);
  }

  /**
   * Gets the current fullscreen mode
   * @returns {string|null} Current mode or null
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Checks if currently in fullscreen
   * @returns {boolean} True if in fullscreen mode
   */
  isFullscreen() {
    return this.currentMode !== null;
  }

  /**
   * Destroys the fullscreen manager
   */
  destroy() {
    this.exitFullscreen();
    this.logger.info('Fullscreen manager destroyed');
  }
}