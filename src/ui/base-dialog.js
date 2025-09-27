import { Logger } from '../core/logger.js';

/**
 * Base Dialog - Reusable dialog foundation with neon glow effects
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class BaseDialog {
  /**
   * Creates a new BaseDialog instance
   * @param {Object} options - Configuration options
   * @param {string} options.title - Dialog title
   * @param {string} [options.className=''] - Additional CSS classes
   * @param {boolean} [options.modal=true] - Whether dialog is modal
   * @param {boolean} [options.closeOnBackdrop=true] - Close on backdrop click
   * @param {boolean} [options.closeOnEscape=true] - Close on Escape key
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.logPrefix='BaseDialog'] - Logger prefix
   */
  constructor(options = {}) {
    this.options = {
      title: 'Dialog',
      className: '',
      modal: true,
      closeOnBackdrop: true,
      closeOnEscape: true,
      debug: false,
      logPrefix: 'BaseDialog',
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: this.options.logPrefix
    });

    this.dialog = null;
    this.content = null;
    this.isOpen = false;
    this.closeButton = null;

    this.logger.debug('BaseDialog instance created with options:', this.options);
    this.createDialog();
  }

  /**
   * Creates the base dialog structure
   */
  createDialog() {
    this.logger.debug('Creating dialog structure...');

    // Create dialog element
    this.dialog = document.createElement('dialog');
    this.dialog.className = `base-dialog ${this.options.className}`.trim();

    // Create dialog content wrapper
    this.content = document.createElement('div');
    this.content.className = 'dialog-content';

    // Create header
    const header = document.createElement('header');
    header.className = 'dialog-header';
    header.innerHTML = `
      <h3 class="dialog-title">${this.options.title}</h3>
      <button class="close-btn" title="Close">×</button>
    `;

    // Cache close button reference
    this.closeButton = header.querySelector('.close-btn');

    // Create body container (to be populated by subclasses)
    const body = document.createElement('div');
    body.className = 'dialog-body';

    // Assemble dialog
    this.content.appendChild(header);
    this.content.appendChild(body);
    this.dialog.appendChild(this.content);

    // Add to document
    document.body.appendChild(this.dialog);

    this.logger.debug('Dialog structure created and added to DOM');
    this.setupEventListeners();
  }

  /**
   * Sets up base event listeners
   */
  setupEventListeners() {
    this.logger.debug('Setting up base event listeners...');

    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.logger.debug('Close button clicked');
        this.close();
      });
    }

    // Backdrop click
    if (this.options.closeOnBackdrop) {
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog) {
          this.logger.debug('Backdrop clicked, closing dialog');
          this.close();
        }
      });
    }

    // Escape key
    if (this.options.closeOnEscape) {
      this.dialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.logger.debug('Escape key pressed, closing dialog');
          this.close();
        }
      });
    }

    this.logger.debug('Base event listeners configured');
  }

  /**
   * Gets the dialog body element for content injection
   * @returns {HTMLElement} The dialog body element
   */
  getBody() {
    return this.content.querySelector('.dialog-body');
  }

  /**
   * Sets the dialog title
   * @param {string} title - New title
   */
  setTitle(title) {
    this.logger.debug(`Setting dialog title to: "${title}"`);
    const titleElement = this.content.querySelector('.dialog-title');
    if (titleElement) {
      titleElement.textContent = title;
      this.options.title = title;
    }
  }

  /**
   * Opens the dialog
   * @param {Object} [options={}] - Open options
   * @param {boolean} [options.focus=true] - Whether to focus the dialog
   */
  open(options = {}) {
    const { focus = true } = options;

    if (this.isOpen) {
      this.logger.warn('Dialog is already open');
      return;
    }

    this.logger.info('Opening dialog...');

    // Call pre-open hook
    this.onBeforeOpen();

    // Show dialog
    if (this.options.modal) {
      this.dialog.showModal();
    } else {
      this.dialog.show();
    }

    this.isOpen = true;

    // Focus management
    if (focus) {
      setTimeout(() => {
        this.dialog.focus();
        this.onFocus();
      }, 100);
    }

    // Call post-open hook
    this.onAfterOpen();

    this.logger.info('Dialog opened successfully');
  }

  /**
   * Closes the dialog
   */
  close() {
    if (!this.isOpen) {
      this.logger.warn('Dialog is already closed');
      return;
    }

    this.logger.info('Closing dialog...');

    // Call pre-close hook
    this.onBeforeClose();

    this.dialog.close();
    this.isOpen = false;

    // Call post-close hook
    this.onAfterClose();

    this.logger.info('Dialog closed successfully');
  }

  /**
   * Toggles the dialog open/closed state
   */
  toggle() {
    this.logger.debug('Toggling dialog state');
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Checks if dialog is currently open
   * @returns {boolean} True if dialog is open
   */
  isDialogOpen() {
    return this.isOpen;
  }

  /**
   * Adds content to the dialog body
   * @param {string|HTMLElement} content - Content to add
   */
  setContent(content) {
    this.logger.debug('Setting dialog content...');
    const body = this.getBody();

    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.innerHTML = '';
      body.appendChild(content);
    }

    this.logger.debug('Dialog content updated');
  }

  /**
   * Adds a CSS class to the dialog
   * @param {string} className - Class name to add
   */
  addClass(className) {
    this.logger.debug(`Adding class: ${className}`);
    this.dialog.classList.add(className);
  }

  /**
   * Removes a CSS class from the dialog
   * @param {string} className - Class name to remove
   */
  removeClass(className) {
    this.logger.debug(`Removing class: ${className}`);
    this.dialog.classList.remove(className);
  }

  // Lifecycle hooks (to be overridden by subclasses)

  /**
   * Called before dialog opens
   * Override in subclasses for custom behavior
   */
  onBeforeOpen() {
    this.logger.debug('onBeforeOpen hook called');
  }

  /**
   * Called after dialog opens
   * Override in subclasses for custom behavior
   */
  onAfterOpen() {
    this.logger.debug('onAfterOpen hook called');
  }

  /**
   * Called when dialog receives focus
   * Override in subclasses for custom behavior
   */
  onFocus() {
    this.logger.debug('onFocus hook called');
  }

  /**
   * Called before dialog closes
   * Override in subclasses for custom behavior
   */
  onBeforeClose() {
    this.logger.debug('onBeforeClose hook called');
  }

  /**
   * Called after dialog closes
   * Override in subclasses for custom behavior
   */
  onAfterClose() {
    this.logger.debug('onAfterClose hook called');
  }

  /**
   * Destroys the dialog and cleans up resources
   */
  destroy() {
    this.logger.info('Destroying dialog...');

    if (this.isOpen) {
      this.close();
    }

    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }

    this.content = null;
    this.closeButton = null;
    this.isOpen = false;

    this.logger.info('Dialog destroyed successfully');
  }
}