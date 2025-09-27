/**
 * JavaScript Sandbox - A secure, isolated JavaScript execution environment
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

import { SandboxController } from './ui/controller.js';
import { CodeMirrorEditor } from './editors/codemirror.js';
import { TextareaEditor } from './editors/textarea.js';
import { Logger } from './core/logger.js';

/**
 * Auto-detects and initializes the best available editor
 * @param {HTMLElement} container - DOM element to contain the editor
 * @param {Object} [options={}] - Editor configuration options
 * @param {Object} [eventEmitter] - Event emitter for theme changes
 * @returns {EditorAdapter} The initialized editor instance
 */
function createEditor(container, options = {}, eventEmitter = null) {
  const logger = new Logger({
    enabled: options.debug || false,
    level: 'info',
    prefix: 'EditorFactory'
  });

  // Try CodeMirror first if available
  if (typeof CodeMirror !== 'undefined') {
    try {
      logger.info('Initializing CodeMirror editor');
      return new CodeMirrorEditor(container, options, eventEmitter);
    } catch (e) {
      logger.warn('Failed to initialize CodeMirror, falling back to textarea:', e);
    }
  }

  // Fallback to textarea
  logger.info('Initializing textarea editor');
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
  const debug = options.debug || false;
  const logger = new Logger({
    enabled: debug,
    level: options.logLevel || 'info',
    prefix: 'App'
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
      theme: 'darcula', // Temporary default, will be updated by THEME_READY event
      autofocus: true,
      debug: debug
    }, controller.getEventEmitter());
    logger.info('Editor created, waiting for theme ready event');

    // Set editor on controller
    controller.setEditor(editor);
    logger.info('Editor set on controller');
    
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
    initSandbox({ debug: true })
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
export { SandboxController, CodeMirrorEditor, TextareaEditor };
