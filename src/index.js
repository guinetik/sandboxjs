/**
 * JavaScript Sandbox - A secure, isolated JavaScript execution environment
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

import { SandboxController } from './ui/controller.js';
import { CodeMirrorEditor } from './editors/codemirror.js';
import { TextareaEditor } from './editors/textarea.js';

/**
 * Auto-detects and initializes the best available editor
 * @param {HTMLElement} container - DOM element to contain the editor
 * @param {Object} [options={}] - Editor configuration options
 * @returns {EditorAdapter} The initialized editor instance
 */
function createEditor(container, options = {}) {
  // Try CodeMirror first if available
  if (typeof CodeMirror !== 'undefined') {
    try {
      return new CodeMirrorEditor(container, options);
    } catch (e) {
      console.warn('Failed to initialize CodeMirror, falling back to textarea:', e);
    }
  }

  // Fallback to textarea
  return new TextareaEditor(container, options);
}

/**
 * Initializes the JavaScript sandbox application
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.timeLimit=4000] - Execution timeout in milliseconds
 * @param {string} [options.storageKey='js-sandbox-code'] - LocalStorage key for persistence
 * @param {string} [options.defaultCode] - Default code to load
 * @param {boolean} [options.debug=true] - Enable debug logging
 * @param {string} [options.logLevel='info'] - Log level for debugging
 * @param {string} [options.templatePath] - Path to custom sandbox template
 * @returns {Promise<SandboxController>} The initialized sandbox controller
 */
export async function initSandbox(options = {}) {
  const debug = options.debug || true;
  const logger = debug ? console : { log: () => {}, info: () => {}, error: () => {} };

  logger.log('[App] Starting sandbox initialization...');
  const controller = new SandboxController(options);
  await controller.init();
  logger.log('[App] Controller initialized');

  const editorContainer = document.getElementById('editorContainer');
  if (!editorContainer) {
    throw new Error('Editor container element not found');
  }

  const editor = createEditor(editorContainer, {
    mode: 'javascript',
    theme: 'darcula',
    autofocus: true
  });
  logger.log('[App] Editor created');

  controller.setEditor(editor);
  logger.log('[App] Editor set on controller');
  logger.log('[App] Sandbox initialization complete');

  return controller;
}

// Auto-initialize if DOM is ready and this is the main script
if (!window.sandbox && document.getElementById('editorContainer')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      if (!window.sandbox && document.getElementById('editorContainer')) {
        window.sandbox = await initSandbox();
      }
    });
  } else {
    initSandbox().then(sandbox => {
      window.sandbox = sandbox;
    });
  }
}