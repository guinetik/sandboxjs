import { SandboxEngine } from '../core/sandbox.js';
import { ConsoleOutput } from '../core/console.js';
import { Storage } from '../core/storage.js';
import { Logger } from '../core/logger.js';
import { EventEmitter } from '../core/events.js';
import { ExamplesLoader } from './examples.js';
import { ExamplesDropdown } from './examples-dropdown.js';
import { ThemeSwitcher } from './theme-switcher.js';
import { FullscreenManager } from './fullscreen.js';
import { createHorizontalResizeHandler, createVerticalResizeHandler } from './resize-utils.js';
import { isMobile } from '../core/utils.js';
import { NeonGlowManager } from './neon.js';
import { 
  DEFAULT_TIMEOUT_MS, 
  DEFAULT_STORAGE_KEY, 
  EVENTS, 
  STATUS_MESSAGES,
  MOBILE_BREAKPOINT 
} from '../core/constants.js';

/**
 * Main controller that orchestrates the sandbox application components
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class SandboxController {
  /**
   * Creates a new SandboxController instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.timeLimit] - Execution timeout in milliseconds
   * @param {string} [options.storageKey] - LocalStorage key for persistence
   * @param {string} [options.defaultCode] - Default code to load
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.logLevel='info'] - Log level for debugging
   */
  constructor(options = {}) {
    this.options = {
      timeLimit: DEFAULT_TIMEOUT_MS,
      storageKey: DEFAULT_STORAGE_KEY,
      defaultCode: this.getDefaultCode(),
      debug: false,
      logLevel: 'info',
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: this.options.logLevel,
      prefix: 'Controller'
    });

    this.events = new EventEmitter();
    this.editor = null;
    this.sandbox = null;
    this.console = null;
    this.storage = null;
    this.examples = null;
    this.examplesDropdown = null;
    this.themeSwitcher = null;
    this.fullscreenManager = null;
    this.neonGlow = null;
    this.elements = {};
    this.resizeHandlers = [];
    this.responsiveListener = null;
    this.isInitialized = false;
  }

  /**
   * Returns the default JavaScript code to load in the editor
   * @returns {string} Default code content
   */
  getDefaultCode() {
    return [
      '// Welcome to JS Sandbox! 🙌',
      '//',
      '// Tips:',
      '//  - Use console.log/info/warn/error',
      '//  - Ctrl/Cmd+Enter to execute',
      '//  - "Reset" kills stuck executions',
      '//',
      '// Examples:',
      'console.log("Hello, sandbox!");',
      'function noReturn() { var x = 1+1; }',
      'noReturn(); // no return value, all good',
      '',
      '// DOM inside sandbox:',
      'var el = document.createElement("h1");',
      'el.textContent = "Hello from iframe!";',
      'document.body.appendChild(el);',
      '',
      '// Errors:',
      'Promise.reject("rejected!");',
      '// throw new Error("Exception thrown");',
      '',
      '// Infinite loop test (commented):',
      '// while(true) {}'
    ].join('\n');
  }

  /**
   * Initializes the controller and all components
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      this.logger.warn('Controller already initialized');
      return;
    }

    try {
      this.events.emit(EVENTS.INIT_START);
      this.logger.info('Initializing controller...');
      
      this.findElements();
      await this.initializeComponents();
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.events.emit(EVENTS.INIT_COMPLETE);
      this.logger.info('Controller initialization complete');
    } catch (error) {
      this.logger.error('Initialization failed:', error);
      this.events.emit(EVENTS.INIT_ERROR, error);
      
      // Show user-friendly error message
      this.showInitializationError(error);
      throw error;
    }
  }

  /**
   * Shows initialization error to user
   * @param {Error} error - The error that occurred
   */
  showInitializationError(error) {
    if (this.elements.consoleContainer) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'console-line console-error';
      errorDiv.textContent = `⚠️ Initialization failed: ${error.message}`;
      this.elements.consoleContainer.appendChild(errorDiv);
    }
  }

  /**
   * Finds and caches DOM elements
   */
  findElements() {
    this.elements = {
      app: document.querySelector('.app'),
      editorContainer: document.getElementById('editorContainer'),
      consoleContainer: document.getElementById('console'),
      sandboxContainer: document.getElementById('sandboxContainer'),
      runBtn: document.getElementById('runBtn'),
      clearBtn: document.getElementById('clearBtn'),
      resetBtn: document.getElementById('resetBtn'),
      togglePreview: document.getElementById('togglePreview'),
      previewWrap: document.getElementById('previewWrap'),
      status: document.getElementById('status'),
      limitLabel: document.getElementById('limitLabel'),
      toolbar: document.querySelector('.toolbar'),
      fullscreenEditor: document.getElementById('fullscreenEditor'),
      fullscreenConsole: document.getElementById('fullscreenConsole')
    };

    // Validate required elements
    const required = ['app', 'editorContainer', 'consoleContainer', 'sandboxContainer'];
    const missing = required.filter(key => !this.elements[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required elements: ${missing.join(', ')}`);
    }
  }

  /**
   * Initializes all components with error boundaries
   * @returns {Promise<void>}
   */
  async initializeComponents() {
    this.logger.info('Initializing components...');

    // Initialize storage
    try {
      this.storage = new Storage(this.options.storageKey, {
        debug: this.options.debug
      });
      this.logger.debug('Storage initialized');
    } catch (error) {
      this.logger.error('Storage initialization failed:', error);
      // Non-fatal, continue without persistence
    }

    // Initialize console
    try {
      this.console = new ConsoleOutput(this.elements.consoleContainer, {
        debug: this.options.debug
      });
      this.logger.debug('Console initialized');
    } catch (error) {
      this.logger.error('Console initialization failed:', error);
      throw new Error('Failed to initialize console output');
    }

    // Initialize sandbox
    try {
      this.sandbox = new SandboxEngine(this.elements.sandboxContainer, {
        timeLimit: this.options.timeLimit,
        debug: this.options.debug,
        logLevel: this.options.logLevel,
        onMessage: (type, args) => {
          this.console.addLine(type, args);
          this.events.emit(EVENTS.CONSOLE_MESSAGE, { type, args });
        },
        onStatusChange: (status) => this.updateStatus(status)
      });
      this.logger.debug('SandboxEngine created');

      // Initialize sandbox template
      await this.sandbox.initialize();
      this.logger.info('Sandbox initialized');
    } catch (error) {
      this.logger.error('Sandbox initialization failed:', error);
      throw new Error(`Failed to initialize sandbox: ${error.message}`);
    }

    // Initialize examples system
    try {
      this.examples = new ExamplesLoader({
        onLoad: (example) => this.events.emit(EVENTS.EXAMPLE_LOAD, example),
        onError: (error) => this.events.emit(EVENTS.EXAMPLE_ERROR, error),
        debug: true // Always debug examples loading to help troubleshoot
      });

      // Initialize examples dropdown (only if not already created)
      if (this.elements.toolbar && !this.examplesDropdown) {
        this.examplesDropdown = new ExamplesDropdown(this.elements.toolbar, {
          onSelect: (exampleId) => this.loadExample(exampleId)
        });

        // Load available examples
        try {
          this.examplesDropdown.setLoading(true);
          const availableExamples = await this.examples.discoverExamples();
          this.examplesDropdown.setExamples(availableExamples);
          this.logger.info('Examples loaded:', availableExamples.length);
        } catch (error) {
          this.logger.error('Failed to load examples:', error);
          this.examplesDropdown.setError('Failed to load');
        }
      }

      // Initialize theme switcher (only if not already created)
      if (this.elements.toolbar && !this.themeSwitcher) {
        this.themeSwitcher = new ThemeSwitcher(this.elements.toolbar, this.events, {
          defaultTheme: 'darcula'
        });
        this.logger.info('Theme switcher initialized');
      }

      // Initialize fullscreen manager (only if not already created)
      if (!this.fullscreenManager) {
        this.fullscreenManager = new FullscreenManager(this.events, {
          debug: this.options.debug
        });
        this.fullscreenManager.init({
          app: this.elements.app,
          fullscreenEditor: this.elements.fullscreenEditor,
          fullscreenConsole: this.elements.fullscreenConsole
        });
        this.logger.info('Fullscreen manager initialized');
      }
    } catch (error) {
      this.logger.warn('Examples system initialization failed:', error);
      // Non-fatal, continue without examples
    }

    // Update time limit display
    if (this.elements.limitLabel) {
      this.elements.limitLabel.textContent = this.options.timeLimit + 'ms';
    }

    // Initialize resizable panes
    this.initializeResizer();

    // Handle responsive layout changes
    this.setupResponsiveListener();

    // Set initial state for preview toggle
    const rightPane = this.elements.app.querySelector('.pane.right');
    if (rightPane && this.elements.previewWrap) {
      const isPreviewVisible = this.elements.previewWrap.classList.contains('show');
      rightPane.classList.toggle('has-preview', isPreviewVisible);
    }

    // Initialize neon glow effects
    this.initializeNeonGlow();

    this.logger.info('Components initialization complete');
  }

  /**
   * Initializes neon glow effects on UI elements
   */
  initializeNeonGlow() {
    try {
      this.neonGlow = new NeonGlowManager({
        transitionDuration: 8000,
        autoRotate: true,
        debug: true // Enable debug to see color changes
      });

      // Apply glow ONLY to panes (not navbar)
      const panes = this.elements.app.querySelectorAll('.pane');
      panes.forEach(pane => {
        this.neonGlow.applyGlow(pane);
      });

      // Start automatic color rotation
      this.neonGlow.startRotation();

      this.logger.info('Neon glow effects initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize neon glow:', error);
      // Non-fatal, continue without neon effects
    }
  }

  /**
   * Cleans up existing resize handlers
   */
  cleanupResizeHandlers() {
    this.resizeHandlers.forEach(handler => {
      if (handler && handler.cleanup) {
        handler.cleanup();
      }
    });
    this.resizeHandlers = [];
  }

  /**
   * Initializes the resizable panes functionality
   */
  initializeResizer() {
    if (!this.elements.app) return;

    // Cleanup existing handlers
    this.cleanupResizeHandlers();

    // Skip horizontal resize on mobile
    if (isMobile(MOBILE_BREAKPOINT)) {
      this.initializeVerticalResize();
      return;
    }

    const mainContent = this.elements.app.querySelector('.main-content');
    if (!mainContent) return;

    // Remove any existing resize handles first
    const existingHandles = this.elements.app.querySelectorAll('.resize-handle, .vertical-resize-handle');
    existingHandles.forEach(handle => handle.remove());

    // Reset any inline grid styles that might have been applied
    mainContent.style.gridTemplateColumns = '';
    mainContent.style.gridTemplateRows = '';

    // Reset right pane styles
    const rightPane = mainContent.querySelector('.pane:last-child');
    if (rightPane) {
      rightPane.style.gridTemplateRows = '';
      rightPane.classList.remove('preview-hidden');
    }

    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';

    // Insert between the first and last pane in main-content
    const panes = mainContent.querySelectorAll('.pane');
    if (panes.length >= 2) {
      mainContent.insertBefore(resizeHandle, panes[1]);

      // Create horizontal resize handler using utility
      const horizontalHandler = createHorizontalResizeHandler({
        container: mainContent,
        leftPane: panes[0],
        rightPane: panes[1],
        handle: resizeHandle,
        onResize: () => this.events.emit(EVENTS.PANES_RESIZED)
      });

      this.resizeHandlers.push(horizontalHandler);
    }

    // Initialize vertical resizing
    this.initializeVerticalResize();
  }

  /**
   * Sets up responsive layout listener for orientation/resize changes
   */
  setupResponsiveListener() {
    // Clean up existing listener
    if (this.responsiveListener) {
      this.responsiveListener.mediaQuery.removeListener(this.responsiveListener.handleChange);
    }

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const handleChange = () => {
      this.logger.debug('Responsive breakpoint changed');
      this.initializeResizer();
    };

    mediaQuery.addListener(handleChange);

    // Store reference for cleanup
    this.responsiveListener = { mediaQuery, handleChange };
  }

  /**
   * Initializes vertical resizing between console and preview
   */
  initializeVerticalResize() {
    const rightPane = this.elements.app.querySelector('.pane.right');
    if (!rightPane) return;

    // Create vertical resize handle
    const verticalHandle = document.createElement('div');
    verticalHandle.className = 'vertical-resize-handle';

    // Insert after console
    const consoleEl = rightPane.querySelector('.console');
    if (consoleEl) {
      consoleEl.parentNode.insertBefore(verticalHandle, consoleEl.nextSibling);

      // Create vertical resize handler using utility
      const verticalHandler = createVerticalResizeHandler({
        container: rightPane,
        topPane: consoleEl,
        bottomPane: this.elements.previewWrap,
        handle: verticalHandle,
        shouldResize: () => this.elements.previewWrap.classList.contains('show'),
        onResize: () => this.events.emit(EVENTS.PANES_RESIZED_VERTICAL)
      });

      this.resizeHandlers.push(verticalHandler);
    }
  }

  /**
   * Gets the event emitter instance
   * @returns {EventEmitter} The event emitter
   */
  getEventEmitter() {
    return this.events;
  }


  /**
   * Sets the editor instance
   * @param {EditorAdapter} editor - The editor instance
   */
  setEditor(editor) {
    if (this.editor) {
      this.editor.destroy();
    }

    this.editor = editor;

    // Setup editor event handlers
    this.editor.onChange((code) => {
      if (this.storage) {
        this.storage.save(code);
      }
      this.events.emit(EVENTS.CODE_CHANGE, { code });
    });

    this.editor.onExecute(() => {
      this.run();
    });

    // Load initial code now that editor is ready
    this.loadInitialCode();
    this.events.emit(EVENTS.EDITOR_READY, { editor });
  }

  /**
   * Sets up event listeners for UI interactions
   */
  setupEventListeners() {
    if (this.elements.runBtn) {
      this.elements.runBtn.addEventListener('click', () => this.run());
    }

    if (this.elements.clearBtn) {
      this.elements.clearBtn.addEventListener('click', () => this.clearConsole());
    }

    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => this.reset());
    }

    if (this.elements.togglePreview) {
      this.elements.togglePreview.addEventListener('change', (e) => {
        this.elements.previewWrap.classList.toggle('show', e.target.checked);

        const rightPane = this.elements.app.querySelector('.pane.right');
        if (rightPane) {
          if (e.target.checked) {
            rightPane.classList.add('has-preview');
          } else {
            rightPane.classList.remove('has-preview');
            rightPane.style.gridTemplateRows = '';
          }
        }
      });
    }

    // Set up theme event listeners
    this.setupThemeEventListeners();
  }

  /**
   * Sets up theme-related event listeners
   */
  setupThemeEventListeners() {
    // Listen for theme loading start
    this.events.on(EVENTS.THEME_LOAD_START, (data) => {
      this.logger.info('Theme loading started:', data.theme);
    });

    // Listen for theme ready
    this.events.on(EVENTS.THEME_READY, (data) => {
      this.logger.info('Theme ready:', data.theme);
      if (data.error) {
        this.logger.warn('Theme ready with error:', data.error);
      }
    });

    // Listen for theme changes
    this.events.on(EVENTS.THEME_CHANGE, (data) => {
      this.logger.info('Theme changed from', data.oldTheme, 'to', data.theme);
    });
  }

  /**
   * Loads initial code into the editor
   */
  loadInitialCode() {
    const savedCode = this.storage ? this.storage.load() : null;
    const initialCode = savedCode || this.options.defaultCode;

    if (this.editor) {
      this.editor.setValue(initialCode);
      this.editor.focus();
      this.events.emit(EVENTS.CODE_LOAD, { code: initialCode, fromStorage: !!savedCode });
    }
  }

  /**
   * Runs the current code in the sandbox
   */
  run() {
    if (!this.editor) {
      this.logger.error('No editor configured');
      return;
    }

    const code = this.editor.getValue();
    this.events.emit(EVENTS.CODE_EXECUTE_START, { code });

    // Validate syntax first
    const validation = this.sandbox.validateSyntax(code);
    this.events.emit(EVENTS.CODE_VALIDATE, { code, validation });

    this.console.clear();
    this.sandbox.execute(code);
  }

  /**
   * Clears the console output
   */
  clearConsole() {
    this.console.clear();
    this.updateStatus(STATUS_MESSAGES.cleared);
    this.events.emit(EVENTS.CONSOLE_CLEAR);
  }

  /**
   * Resets the sandbox
   */
  reset() {
    this.sandbox.reset();
    this.updateStatus(STATUS_MESSAGES.reset);
    this.events.emit(EVENTS.SANDBOX_RESET);
  }

  /**
   * Updates the status display
   * @param {string} status - Status message or key
   */
  updateStatus(status) {
    if (!this.elements.status) return;

    const displayStatus = STATUS_MESSAGES[status] || status;
    this.elements.status.textContent = displayStatus;
    this.events.emit(EVENTS.STATUS_CHANGE, { status, displayStatus });

    // Emit specific status events
    if (status === 'completed') {
      this.events.emit(EVENTS.CODE_EXECUTE_COMPLETE);
    } else if (status === 'timeout') {
      this.events.emit(EVENTS.CODE_EXECUTE_TIMEOUT);
    }
  }

  /**
   * Registers an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @param {Object} [options={}] - Options for the listener
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options) {
    return this.events.on(event, callback, options);
  }

  /**
   * Registers a one-time event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    return this.events.once(event, callback);
  }

  /**
   * Removes an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   */
  off(event, callback) {
    this.events.off(event, callback);
  }

  /**
   * Gets the current code from the editor
   * @returns {string|null} The current code or null if no editor
   */
  getCode() {
    return this.editor ? this.editor.getValue() : null;
  }

  /**
   * Sets code in the editor
   * @param {string} code - The code to set
   */
  setCode(code) {
    if (this.editor) {
      this.editor.setValue(code);
    }
  }

  /**
   * Validates JavaScript syntax without executing
   * @param {string} [code] - The code to validate, or current editor code if not provided
   * @returns {Object} Validation result with {valid: boolean, error?: string}
   */
  validateCode(code) {
    const codeToValidate = code || this.getCode();
    return this.sandbox ? 
      this.sandbox.validateSyntax(codeToValidate) : 
      { valid: false, error: 'Sandbox not initialized' };
  }

  /**
   * Loads and runs an example
   * @param {string} exampleId - The example ID to load
   * @returns {Promise<void>}
   */
  async loadExample(exampleId) {
    try {
      this.logger.info('Loading example:', exampleId);

      const example = await this.examples.loadExample(exampleId);

      // Set the code in the editor
      this.setCode(example.code);

      // Open preview pane
      if (this.elements.togglePreview && !this.elements.togglePreview.checked) {
        this.elements.togglePreview.checked = true;
        this.elements.previewWrap.classList.add('show');

        const rightPane = this.elements.app.querySelector('.pane.right');
        if (rightPane) {
          rightPane.classList.add('has-preview');
        }
      }

      // Run the example
      this.run();

      this.events.emit(EVENTS.EXAMPLE_LOADED, { exampleId, example });
    } catch (error) {
      this.logger.error('Failed to load example:', error);
      this.events.emit(EVENTS.EXAMPLE_ERROR, error);
    }
  }

  /**
   * Cleans up the controller and all components
   */
  destroy() {
    this.logger.info('Destroying controller...');
    
    this.events.emit(EVENTS.DESTROY);

    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }

    if (this.sandbox) {
      this.sandbox.destroy();
      this.sandbox = null;
    }

    if (this.examples) {
      this.examples.destroy();
      this.examples = null;
    }

    if (this.examplesDropdown) {
      this.examplesDropdown.destroy();
      this.examplesDropdown = null;
    }

    if (this.neonGlow) {
      this.neonGlow.destroy();
      this.neonGlow = null;
    }

    if (this.fullscreenManager) {
      this.fullscreenManager.destroy();
      this.fullscreenManager = null;
    }

    // Cleanup resize handlers
    this.cleanupResizeHandlers();

    // Cleanup responsive listener
    if (this.responsiveListener) {
      this.responsiveListener.mediaQuery.removeListener(this.responsiveListener.handleChange);
      this.responsiveListener = null;
    }

    this.events.removeAllListeners();
    this.isInitialized = false;
    
    this.logger.info('Controller destroyed');
  }
}
