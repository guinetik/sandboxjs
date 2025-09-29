import { TemplateEngine } from '../ui/sandbox.js';
import { Logger } from './logger.js';
import { DEFAULT_TIMEOUT_MS, CRYPTO_ARRAY_SIZE } from './constants.js';

/**
 * Sandboxed JavaScript execution engine using iframe isolation
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class SandboxEngine {
  /**
   * Creates a new SandboxEngine instance
   * @param {HTMLElement} container - DOM element to contain the sandbox iframe
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.timeLimit] - Execution timeout in milliseconds
   * @param {Function} [options.onMessage] - Callback for sandbox messages
   * @param {Function} [options.onStatusChange] - Callback for status updates
   * @param {string} [options.templatePath] - Path to custom sandbox template
   * @param {boolean} [options.debug=true] - Enable debug logging
   * @param {string} [options.logLevel='info'] - Log level for debugging
   */
  constructor(container, options = {}) {
    this.container = container;
    this.timeLimit = options.timeLimit || DEFAULT_TIMEOUT_MS;
    this.onMessage = options.onMessage || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.iframe = null;
    this.killTimer = null;
    this.currentSecret = this.generateSecret();
    this.messageHandler = null;

    this.logger = new Logger({
      enabled: options.debug !== false,
      level: options.logLevel || 'info',
      prefix: 'SandboxEngine',
      redactSecrets: true
    });

    this.templateEngine = new TemplateEngine(options.templatePath, {
      debug: options.debug,
      logLevel: options.logLevel
    });

    this.createIframe();
    this.setupMessageListener();
  }

  /**
   * Initializes the sandbox engine and template system
   * @returns {Promise<void>}
   */
  async initialize() {
    this.logger.info('Initializing...');
    
    try {
      await this.templateEngine.initialize();
      this.logger.info('Template engine initialized');
    } catch (error) {
      this.logger.error('Template initialization failed:', error);
      throw new Error(`Sandbox initialization failed: ${error.message}`);
    }
  }

  /**
   * Generates a cryptographically secure random secret for sandbox communication
   * @returns {string} Random secret token
   */
  generateSecret() {
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(CRYPTO_ARRAY_SIZE);
        window.crypto.getRandomValues(arr);
        return String(arr[0]) + String(arr[1]);
      }
    } catch (e) {
      this.logger.warn('Crypto API unavailable, using fallback', e);
    }
    return String(Math.random()).slice(2) + Date.now();
  }

  /**
   * Creates a new sandboxed iframe element
   */
  createIframe() {
    // Clear the entire container to ensure no duplicates
    this.container.innerHTML = '';

    this.iframe = document.createElement('iframe');
    this.iframe.className = 'sandbox-iframe';
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-modals');
    this.iframe.title = 'Code Sandbox';
    this.container.appendChild(this.iframe);
  }

  /**
   * Resets the sandbox by creating a fresh iframe
   */
  reset() {
    if (this.killTimer) {
      clearTimeout(this.killTimer);
      this.killTimer = null;
    }
    this.createIframe();
    this.onStatusChange('reset');
  }

  /**
   * Validates JavaScript syntax without executing it
   * @param {string} code - The JavaScript code to validate
   * @returns {Object} Validation result with {valid: boolean, error?: string}
   */
  validateSyntax(code) {
    try {
      // Use Function constructor to check syntax without executing
      new Function(code);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        name: error.name,
        toString: () => `${error.name}: ${error.message}`
      };
    }
  }

  /**
   * Executes JavaScript code in the sandboxed iframe
   * @param {string} code - The JavaScript code to execute
   * @param {Object} [libraryData] - Optional library injection data
   * @param {string} [libraryData.scripts] - HTML script tags for libraries
   * @param {string} [libraryData.csp] - Dynamic CSP policy
   * @returns {Promise<void>}
   */
  async execute(code, libraryData = null) {
    this.logger.debug('Executing code...');

    // Ensure template is loaded before execution
    if (!this.templateEngine.isLoaded) {
      this.logger.debug('Template not loaded, initializing...');
      await this.templateEngine.initialize();
    }

    // First, validate syntax
    const validation = this.validateSyntax(code);
    if (!validation.valid) {
      this.logger.debug('Syntax error detected:', validation.error);
      this.onMessage('error', [validation.toString()]);
      this.onStatusChange('completed');
      return;
    }

    this.currentSecret = this.generateSecret();
    this.logger.trace('Generated secret for execution');

    // Extract library data if provided
    const libraryScripts = libraryData?.scripts || '';
    const dynamicCSP = libraryData?.csp || null;

    const srcdoc = this.templateEngine.buildSrcDoc(code, this.currentSecret, libraryScripts, dynamicCSP);
    this.logger.debug('Setting iframe srcdoc...');

    if (libraryData?.scripts) {
      this.logger.info('Injecting libraries into sandbox');
    }

    this.iframe.srcdoc = srcdoc;
    this.onStatusChange('executing');

    if (this.killTimer) clearTimeout(this.killTimer);
    this.killTimer = setTimeout(() => {
      this.onMessage('error', [`⏱️ Execution timeout (${this.timeLimit}ms). Sandbox reset.`]);
      this.reset();
      this.onStatusChange('timeout');
    }, this.timeLimit);
  }

  /**
   * Sets up the postMessage listener for communication with the sandboxed iframe
   */
  setupMessageListener() {
    // Remove existing listener if any
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }

    // Create bound handler for proper removal later
    this.messageHandler = (ev) => {
      if (ev.source !== this.iframe?.contentWindow) return;

      const data = ev.data || {};
      this.logger.trace('Received message from iframe:', data);

      if (!data.__sandbox || data.secret !== this.currentSecret) return;

      const type = data.type || 'log';
      const args = Array.isArray(data.args) ? data.args : [data.args];

      this.logger.debug(`Processing ${type} message with ${args.length} args`);
      this.logger.trace('Message args:', args);

      if (type === 'done') {
        if (this.killTimer) {
          clearTimeout(this.killTimer);
          this.killTimer = null;
        }
        this.onStatusChange('completed');
        return;
      }

      // Special logging for error messages
      if (type === 'error') {
        this.logger.warn('Error message received from sandbox:', args);
      }

      this.onMessage(type, args);
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Cleans up the sandbox engine by removing timers and DOM elements
   */
  destroy() {
    this.logger.info('Destroying sandbox engine...');
    
    if (this.killTimer) {
      clearTimeout(this.killTimer);
      this.killTimer = null;
    }
    
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    
    this.logger.info('Sandbox engine destroyed');
  }
}
