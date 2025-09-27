import { SandboxEngine } from '../core/sandbox.js';
import { ConsoleOutput } from '../core/console.js';
import { Storage } from '../core/storage.js';
import { Logger } from '../core/logger.js';
import { EventEmitter } from '../core/events.js';
import { ExamplesLoader } from '../core/examples.js';
import { ExamplesDropdown } from './examples-dropdown.js';

/**
 * Main controller that orchestrates the sandbox application components
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class SandboxController {
  /**
   * Creates a new SandboxController instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.timeLimit=4000] - Execution timeout in milliseconds
   * @param {string} [options.storageKey='js-sandbox-code'] - LocalStorage key for persistence
   * @param {string} [options.defaultCode] - Default code to load
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.logLevel='info'] - Log level for debugging
   */
  constructor(options = {}) {
    this.options = {
      timeLimit: 4000,
      storageKey: 'js-sandbox-code',
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
    this.elements = {};

    this.init();
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

  async init() {
    this.events.emit('init:start');
    this.findElements();
    await this.initializeComponents();
    this.setupEventListeners();
    this.events.emit('init:complete');
    // Note: loadInitialCode() is called after editor is set in setEditor()
  }

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
      toolbar: document.querySelector('.toolbar')
    };
  }

  async initializeComponents() {
    this.logger.info('Initializing components...');

    // Initialize storage
    this.storage = new Storage(this.options.storageKey);
    this.logger.debug('Storage initialized');

    // Initialize console
    this.console = new ConsoleOutput(this.elements.consoleContainer);
    this.logger.debug('Console initialized');

    // Initialize sandbox
    this.sandbox = new SandboxEngine(this.elements.sandboxContainer, {
      timeLimit: this.options.timeLimit,
      debug: this.options.debug,
      logLevel: this.options.logLevel,
      onMessage: (type, args) => {
        this.console.addLine(type, args);
        this.events.emit('console:message', { type, args });
      },
      onStatusChange: (status) => this.updateStatus(status)
    });
    this.logger.debug('SandboxEngine created');

    // Initialize sandbox template
    await this.sandbox.initialize();
    this.logger.info('Sandbox initialized');

    // Initialize examples system
    this.examples = new ExamplesLoader({
      onLoad: (example) => this.events.emit('example:load', example),
      onError: (error) => this.events.emit('example:error', error)
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
        this.examplesDropdown.setError();
      }
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
      // Ensure initial state is consistent
      const isPreviewVisible = this.elements.previewWrap.classList.contains('show');
      rightPane.classList.toggle('has-preview', isPreviewVisible);
    }

    this.logger.info('Components initialization complete');
  }

  /**
   * Initializes the resizable panes functionality
   */
  initializeResizer() {
    if (!this.elements.app) return;

    // Skip horizontal resize on mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      this.initializeVerticalResize();
      return;
    }

    // Remove any existing resize handles first
    const existingHandles = this.elements.app.querySelectorAll('.resize-handle, .vertical-resize-handle');
    existingHandles.forEach(handle => handle.remove());

    // Reset any inline grid styles that might have been applied
    const mainContent = this.elements.app.querySelector('.main-content');
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
    }

    let isResizing = false;
    let startX = 0;
    let startLeftWidth = 0;
    let startRightWidth = 0;

    const handleMouseDown = (e) => {
      isResizing = true;
      startX = e.clientX;
      resizeHandle.classList.add('dragging');

      // Get current column sizes
      const appRect = this.elements.app.getBoundingClientRect();
      const handleRect = resizeHandle.getBoundingClientRect();
      const leftPane = panes[0];
      const rightPane = panes[1];

      startLeftWidth = leftPane.getBoundingClientRect().width;
      startRightWidth = rightPane.getBoundingClientRect().width;

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const mainContentRect = mainContent.getBoundingClientRect();
      const totalWidth = mainContentRect.width - 25; // Subtract padding and handle width

      // Calculate new widths
      const newLeftWidth = Math.max(320, Math.min(totalWidth - 420, startLeftWidth + deltaX));
      const newRightWidth = totalWidth - newLeftWidth;

      // Update grid template
      const leftFr = newLeftWidth / totalWidth;
      const rightFr = newRightWidth / totalWidth;

      mainContent.style.gridTemplateColumns = `${newLeftWidth}px 5px ${newRightWidth}px`;

      e.preventDefault();
    };

    const handleMouseUp = () => {
      if (!isResizing) return;

      isResizing = false;
      resizeHandle.classList.remove('dragging');

      // Restore styles
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      this.events.emit('panes:resized');
    };

    // Event listeners
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Store references for cleanup
    this.resizeHandle = resizeHandle;
    this.resizeListeners = { handleMouseDown, handleMouseMove, handleMouseUp };

    // Initialize vertical resizing if preview is visible
    this.initializeVerticalResize();
  }

  /**
   * Sets up responsive layout listener for orientation/resize changes
   */
  setupResponsiveListener() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleResponsiveChange = (e) => {
      // Reinitialize resizer when switching between mobile/desktop
      this.initializeResizer();
    };

    mediaQuery.addListener(handleResponsiveChange);

    // Store reference for cleanup
    this.responsiveListener = { mediaQuery, handleResponsiveChange };
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
    const console = rightPane.querySelector('.console');
    if (console) {
      console.parentNode.insertBefore(verticalHandle, console.nextSibling);
    }

    let isResizing = false;
    let startY = 0;
    let startConsoleHeight = 0;
    let startPreviewHeight = 0;

    const handleMouseDown = (e) => {
      // Only allow resizing if preview is visible
      if (!this.elements.previewWrap.classList.contains('show')) return;

      isResizing = true;
      startY = e.clientY;
      verticalHandle.classList.add('dragging');

      const consoleRect = console.getBoundingClientRect();
      const previewRect = this.elements.previewWrap.getBoundingClientRect();

      startConsoleHeight = consoleRect.height;
      startPreviewHeight = previewRect.height;

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';

      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaY = e.clientY - startY;
      const totalContentHeight = startConsoleHeight + startPreviewHeight;

      // Calculate new heights - one grows while the other shrinks
      const newConsoleHeight = Math.max(100, Math.min(totalContentHeight - 100, startConsoleHeight + deltaY));
      const newPreviewHeight = totalContentHeight - newConsoleHeight;

      // Update grid template
      rightPane.style.gridTemplateRows = `auto ${newConsoleHeight}px 8px ${newPreviewHeight}px auto`;

      e.preventDefault();
    };

    const handleMouseUp = () => {
      if (!isResizing) return;

      isResizing = false;
      verticalHandle.classList.remove('dragging');

      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      this.events.emit('panes:resized:vertical');
    };

    // Event listeners
    verticalHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Store references for cleanup
    this.verticalResizeHandle = verticalHandle;
    this.verticalResizeListeners = { handleMouseDown, handleMouseMove, handleMouseUp };
  }

  setEditor(editor) {
    if (this.editor) {
      this.editor.destroy();
    }

    this.editor = editor;

    // Setup editor event handlers
    this.editor.onChange((code) => {
      this.storage.save(code);
      this.events.emit('code:change', { code });
    });

    this.editor.onExecute(() => {
      this.run();
    });

    // Load initial code now that editor is ready
    this.loadInitialCode();
    this.events.emit('editor:ready', { editor });
  }

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
            // Preview is now visible - enable vertical resizing
            rightPane.classList.add('has-preview');
          } else {
            // Preview is hidden - disable vertical resizing
            rightPane.classList.remove('has-preview');
            rightPane.style.gridTemplateRows = ''; // Reset to CSS default
          }
        }
      });
    }
  }

  loadInitialCode() {
    const savedCode = this.storage.load();
    const initialCode = savedCode || this.options.defaultCode;

    if (this.editor) {
      this.editor.setValue(initialCode);
      this.editor.focus();
      this.events.emit('code:load', { code: initialCode, fromStorage: !!savedCode });
    }
  }

  run() {
    if (!this.editor) {
      console.error('No editor configured');
      return;
    }

    const code = this.editor.getValue();
    this.events.emit('code:execute:start', { code });

    // Validate syntax first
    const validation = this.sandbox.validateSyntax(code);
    this.events.emit('code:validate', { code, validation });

    this.console.clear();
    this.sandbox.execute(code);
  }

  clearConsole() {
    this.console.clear();
    this.updateStatus('Console cleared');
    this.events.emit('console:clear');
  }

  reset() {
    this.sandbox.reset();
    this.updateStatus('Sandbox reset');
    this.events.emit('sandbox:reset');
  }

  updateStatus(status) {
    if (!this.elements.status) return;

    const statusMessages = {
      executing: 'Executing…',
      completed: 'Completed',
      timeout: 'Timeout exceeded',
      reset: 'Sandbox reset',
      'Console cleared': 'Console cleared'
    };

    const displayStatus = statusMessages[status] || status;
    this.elements.status.textContent = displayStatus;
    this.events.emit('status:change', { status, displayStatus });

    // Emit specific status events
    if (status === 'completed') {
      this.events.emit('code:execute:complete');
    } else if (status === 'timeout') {
      this.events.emit('code:execute:timeout');
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
    return this.sandbox ? this.sandbox.validateSyntax(codeToValidate) : { valid: false, error: 'Sandbox not initialized' };
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

        // Also update the right pane class for resize handle
        const rightPane = this.elements.app.querySelector('.pane.right');
        if (rightPane) {
          rightPane.classList.add('has-preview');
        }
      }

      // Run the example
      this.run();

      this.events.emit('example:loaded', { exampleId, example });

    } catch (error) {
      this.logger.error('Failed to load example:', error);
      this.events.emit('example:error', error);
    }
  }

  /**
   * Cleans up the controller and all components
   */
  destroy() {
    this.events.emit('destroy');

    if (this.editor) {
      this.editor.destroy();
    }
    if (this.sandbox) {
      this.sandbox.destroy();
    }
    if (this.examplesDropdown) {
      this.examplesDropdown.destroy();
    }

    // Cleanup resize listeners
    if (this.resizeListeners) {
      document.removeEventListener('mousemove', this.resizeListeners.handleMouseMove);
      document.removeEventListener('mouseup', this.resizeListeners.handleMouseUp);
    }
    if (this.verticalResizeListeners) {
      document.removeEventListener('mousemove', this.verticalResizeListeners.handleMouseMove);
      document.removeEventListener('mouseup', this.verticalResizeListeners.handleMouseUp);
    }
    if (this.resizeHandle && this.resizeHandle.parentNode) {
      this.resizeHandle.parentNode.removeChild(this.resizeHandle);
    }
    if (this.verticalResizeHandle && this.verticalResizeHandle.parentNode) {
      this.verticalResizeHandle.parentNode.removeChild(this.verticalResizeHandle);
    }

    // Cleanup responsive listener
    if (this.responsiveListener) {
      this.responsiveListener.mediaQuery.removeListener(this.responsiveListener.handleResponsiveChange);
    }

    this.events.removeAllListeners();
  }
}