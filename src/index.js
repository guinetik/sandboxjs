/**
 * JavaScript Sandbox - A secure, isolated JavaScript execution environment
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

import { SandboxController } from './ui/controller.js';
import { ACEEditor } from './editors/ace.js';
import { CodeMirrorEditor } from './editors/codemirror.js';
import { TextareaEditor } from './editors/textarea.js';
import { createLogger } from '@guinetik/logger';
import { GATracker } from './analytics/ga-tracker.js';

// Disable all logging in production by default
// Users can re-enable with logFilter.enableAll() in the console
if (import.meta.env.PROD && typeof window !== 'undefined' && window.logFilter) {
  window.logFilter.disableAll();
}

// Initialize Google Analytics if VITE_GA_ID is set
const GA_ID = import.meta.env.VITE_GA_ID;
if (GA_ID && typeof window !== 'undefined') {
  // Load gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
}

/**
 * Auto-detects and initializes the best available editor
 * @param {HTMLElement} container - DOM element to contain the editor
 * @param {Object} [options={}] - Editor configuration options
 * @param {Object} [eventEmitter] - Event emitter for theme changes
 * @returns {EditorAdapter} The initialized editor instance
 */
function createEditor(container, options = {}, eventEmitter = null) {
  const logger = createLogger({
    enabled: true,
    level: 'info',
    prefix: 'EditorFactory',
    showTimestamp: false
  });

  // Check for saved editor preference
  const savedEditor = localStorage.getItem('sandbox_current_editor');
  logger.info('Saved editor preference:', savedEditor);

  // Try saved editor first if available
  if (savedEditor === 'ace' && typeof ace !== 'undefined') {
    try {
      logger.info('Initializing saved ACE editor');
      return new ACEEditor(container, options, eventEmitter);
    } catch (e) {
      logger.warn('Failed to initialize saved ACE, falling back:', e);
    }
  } else if (savedEditor === 'codemirror' && typeof CodeMirror !== 'undefined') {
    try {
      logger.info('Initializing saved CodeMirror editor');
      return new CodeMirrorEditor(container, options, eventEmitter);
    } catch (e) {
      logger.warn('Failed to initialize saved CodeMirror, falling back:', e);
    }
  } else if (savedEditor === 'textarea') {
    try {
      logger.info('Initializing saved textarea editor');
      return new TextareaEditor(container, options, eventEmitter);
    } catch (e) {
      logger.warn('Failed to initialize saved textarea, falling back:', e);
    }
  }

  // Fallback: Try ACE first if available
  if (typeof ace !== 'undefined') {
    try {
      logger.info('Initializing ACE editor (fallback)');
      return new ACEEditor(container, options, eventEmitter);
    } catch (e) {
      logger.warn('Failed to initialize ACE, falling back to textarea:', e);
    }
  }

  // Final fallback to textarea
  logger.info('Initializing textarea editor (final fallback)');
  return new TextareaEditor(container, options, eventEmitter);
}

/**
 * Initializes the JavaScript sandbox application
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.timeLimit] - Execution timeout in milliseconds
 * @param {string} [options.storageKey] - LocalStorage key for persistence
 * @param {string} [options.defaultCode] - Default code to load
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @param {string} [options.logLevel='info'] - Log level for debugging
 * @param {string} [options.templatePath] - Path to custom sandbox template
 * @returns {Promise<SandboxController>} The initialized sandbox controller
 */
export async function initSandbox(options = {}) {
  const logger = createLogger({
    enabled: true,
    level: options.logLevel || 'info',
    prefix: 'App',
    showTimestamp: false
  });

  try {
    logger.info('Starting sandbox initialization...');

    // Create controller
    const controller = new SandboxController(options);
    
    // Initialize controller (now properly awaited)
    await controller.init();
    logger.info('Controller initialized');

    // Find editor container
    const editorContainer = document.getElementById('editorContainer');
    if (!editorContainer) {
      throw new Error('Editor container element not found');
    }

    // Create editor with event emitter for theme switching
    // Start with default theme, will be updated when ThemeSwitcher emits THEME_READY
    const editor = createEditor(editorContainer, {
      mode: 'javascript',
      theme: 'monokai', // Temporary default, will be updated by THEME_READY event
      autofocus: true
    }, controller.getEventEmitter());
    logger.info('Editor created, waiting for theme ready event');

    // Set editor on controller
    controller.setEditor(editor);
    logger.info('Editor set on controller');

    // Initialize Google Analytics event tracking if GA is available
    if (GA_ID && typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        const gaTracker = new GATracker(controller.getEventEmitter(), {
          enabled: true,
          debug: options.debug || false
        });
        // Store tracker on controller for potential manual tracking
        controller.gaTracker = gaTracker;
        logger.info('GA event tracking initialized');
      } catch (error) {
        logger.warn('Failed to initialize GA tracking:', error);
      }
    }
    
    logger.info('Sandbox initialization complete');
    return controller;
  } catch (error) {
    logger.error('Sandbox initialization failed:', error);
    throw error;
  }
}

/**
 * Auto-initializes the sandbox if DOM is ready
 */
function autoInit() {
  // Only auto-init if not already initialized and editor container exists
  if (!window.sandbox && document.getElementById('editorContainer')) {
    initSandbox({ logLevel: 'info' })
      .then(sandbox => {
        window.sandbox = sandbox;
        console.log('✅ Sandbox initialized successfully');
      })
      .catch(error => {
        console.error('❌ Failed to initialize sandbox:', error);
      });
  }
}

// Auto-initialize based on document state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  // DOM already loaded
  autoInit();
}

// Export for manual initialization
export { SandboxController, ACEEditor, CodeMirrorEditor, TextareaEditor };
