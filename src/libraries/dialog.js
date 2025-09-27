import { BaseDialog } from '../ui/base-dialog.js';
import { EVENTS } from '../core/constants.js';

/**
 * Library Manager Dialog - UI for managing runtime libraries
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class LibraryDialog extends BaseDialog {
  /**
   * Creates a new LibraryDialog instance
   * @param {Object} eventEmitter - Event emitter instance
   * @param {Object} libraryManager - Library manager instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(eventEmitter, libraryManager, options = {}) {
    // Call parent constructor with dialog-specific options
    super({
      title: 'Runtime Libraries',
      className: 'library-dialog',
      debug: options.debug || false,
      logPrefix: 'LibraryDialog',
      ...options
    });

    this.eventEmitter = eventEmitter;
    this.libraryManager = libraryManager;

    this.urlInput = null;
    this.addBtn = null;
    this.libraryList = null;

    // Force a log message to test if logging is working
    console.log('🔧 LibraryDialog created with debug:', this.options.debug);

    this.logger.info('LibraryDialog initializing...');
    this.createLibraryContent();
    this.setupLibraryEventListeners();
    this.logger.info('LibraryDialog initialization complete');
  }

  /**
   * Creates the library-specific content for the dialog
   */
  createLibraryContent() {
    this.logger.debug('Creating library-specific dialog content...');

    const body = this.getBody();
    body.innerHTML = `
      <section class="current-libraries">
        <p class="descriptor">Manage libraries loaded into the sandbox environment</p>
        <div class="library-list">
          <div class="empty-state">
            <span class="empty-icon">📚</span>
            <p>No libraries added yet</p>
            <small>Add a CDN URL below to get started</small>
          </div>
        </div>
      </section>

      <section class="add-library">
        <h4>Add Library</h4>
        <p class="descriptor">Paste CDN URL to add a new library to your sandbox</p>
        <div class="input-row">
          <input type="url" class="url-input" placeholder="https://cdnjs.cloudflare.com/ajax/libs/...">
          <button class="add-btn">Add</button>
        </div>
        <div class="input-feedback"></div>
      </section>
    `;

    // Cache element references
    this.urlInput = body.querySelector('.url-input');
    this.addBtn = body.querySelector('.add-btn');
    this.libraryList = body.querySelector('.library-list');

    // Setup library-specific event listeners
    this.addBtn.addEventListener('click', () => {
      this.logger.debug('Add button clicked');
      this.handleAddLibrary();
    });

    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.logger.debug('Enter key pressed in URL input');
        this.handleAddLibrary();
      }
    });

    this.logger.debug('Library content created successfully');
  }

  /**
   * Sets up library-specific event listeners
   */
  setupLibraryEventListeners() {
    this.logger.debug('Setting up library event listeners...');

    this.eventEmitter.on(EVENTS.LIBRARY_MANAGER_OPEN, () => {
      this.logger.info('Received LIBRARY_MANAGER_OPEN event');
      this.open();
    });

    this.eventEmitter.on(EVENTS.LIBRARY_ADDED, (data) => {
      this.logger.info('Received LIBRARY_ADDED event for:', data?.library?.name);
      this.refreshLibraryList();
    });

    this.eventEmitter.on(EVENTS.LIBRARY_REMOVED, (data) => {
      this.logger.info('Received LIBRARY_REMOVED event for:', data?.library?.name);
      this.refreshLibraryList();
    });

    this.eventEmitter.on(EVENTS.DOMAIN_TRUST_REQUEST, (data) => {
      this.logger.warn('Received DOMAIN_TRUST_REQUEST for domain:', data?.domain);
      this.showDomainTrustDialog(data);
    });

    this.logger.debug('Library event listeners configured');
  }

  /**
   * Called before dialog opens - prepare library content
   */
  onBeforeOpen() {
    this.logger.debug('Preparing library dialog for opening...');
    this.refreshLibraryList();
    this.urlInput.value = '';
    this.clearFeedback();
  }

  /**
   * Called when dialog receives focus - focus URL input
   */
  onFocus() {
    this.logger.debug('Library dialog focused, focusing URL input');
    if (this.urlInput) {
      this.urlInput.focus();
    }
  }

  /**
   * Called after dialog closes - clear feedback
   */
  onAfterClose() {
    this.logger.debug('Library dialog closed, clearing feedback');
    this.clearFeedback();
  }

  /**
   * Handles adding a new library
   */
  handleAddLibrary() {
    const url = this.urlInput.value.trim();
    this.logger.debug('handleAddLibrary called with URL:', url);

    if (!url) {
      this.logger.warn('Add library attempted with empty URL');
      this.showFeedback('Please enter a library URL', 'error');
      return;
    }

    this.logger.info('Attempting to add library:', url);
    this.showFeedback('Adding library...', 'loading');
    this.addBtn.disabled = true;

    // Attempt to add the library
    const result = this.libraryManager.addLibrary(url);
    this.logger.debug('Library manager result:', result);

    if (result.success) {
      this.logger.info(`Library added successfully: ${result.library.name}`);
      this.showFeedback(`Added: ${result.library.name}`, 'success');
      this.urlInput.value = '';
      setTimeout(() => {
        this.logger.debug('Clearing success feedback after timeout');
        this.clearFeedback();
      }, 2000);
    } else if (result.needsApproval) {
      this.logger.warn(`Domain approval needed for: ${result.domain}`);
      this.showFeedback(`Waiting for domain approval: ${result.domain}`, 'warning');
      // Dialog will be shown by domain trust request event
    } else {
      this.logger.error(`Failed to add library: ${result.error}`);
      this.showFeedback(`Error: ${result.error}`, 'error');
    }

    this.addBtn.disabled = false;
    this.logger.debug('Add library operation completed');
  }

  /**
   * Shows domain trust confirmation dialog
   * @param {Object} data - Domain trust data
   */
  showDomainTrustDialog(data) {
    this.logger.info(`Showing domain trust dialog for: ${data.domain}`);

    const confirmed = confirm(
      `⚠️ New CDN Domain Detected\n\n` +
      `The domain "${data.domain}" is not in your trusted list.\n\n` +
      `Adding this domain will allow all scripts from:\n` +
      `https://${data.domain}\n\n` +
      `Do you want to trust this domain?`
    );

    if (confirmed) {
      this.logger.info(`User confirmed trust for domain: ${data.domain}`);
      this.libraryManager.addDomain(data.domain);

      // Try adding the library again
      this.logger.debug(`Retrying library addition for: ${data.url}`);
      const result = this.libraryManager.addLibrary(data.url, data.name);

      if (result.success) {
        this.logger.info(`Library added after domain approval: ${result.library.name}`);
        this.showFeedback(`Added: ${result.library.name}`, 'success');
        this.urlInput.value = '';
        setTimeout(() => {
          this.logger.debug('Clearing success feedback after domain approval');
          this.clearFeedback();
        }, 2000);
      } else {
        this.logger.error(`Library addition failed after domain approval: ${result.error}`);
        this.showFeedback(`Error: ${result.error}`, 'error');
      }
    } else {
      this.logger.info(`User cancelled domain trust for: ${data.domain}`);
      this.showFeedback('Library addition cancelled', 'info');
      setTimeout(() => {
        this.logger.debug('Clearing cancellation feedback');
        this.clearFeedback();
      }, 2000);
    }
  }

  /**
   * Refreshes the library list display
   */
  refreshLibraryList() {
    this.logger.debug('Refreshing library list display...');
    const libraries = this.libraryManager.getLibraries();

    if (libraries.length === 0) {
      this.logger.debug('No libraries found, showing empty state');
      this.libraryList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📚</span>
          <p>No libraries added yet</p>
          <small>Add a CDN URL below to get started</small>
        </div>
      `;
    } else {
      this.logger.info(`Displaying ${libraries.length} libraries in list`);
      this.libraryList.innerHTML = libraries.map(lib => {
        this.logger.trace(`Rendering library item: ${lib.name}`);
        return `
          <div class="library-item" data-id="${lib.id}">
            <div class="library-info">
              <span class="library-name">${lib.name}</span>
              <small class="library-url">${lib.url}</small>
            </div>
            <button class="remove-btn" title="Remove library" data-id="${lib.id}">🗑️</button>
          </div>
        `;
      }).join('');

      // Add remove button listeners
      this.libraryList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          const library = libraries.find(lib => lib.id === id);
          this.logger.info(`Remove button clicked for library: ${library?.name || id}`);
          this.libraryManager.removeLibrary(id);
        });
      });

      this.logger.debug('Remove button listeners attached to all library items');
    }

    this.logger.debug(`Library list refresh completed: ${libraries.length} libraries displayed`);
  }

  /**
   * Shows feedback message
   * @param {string} message - Message to show
   * @param {string} type - Type of feedback (success, error, warning, info, loading)
   */
  showFeedback(message, type = 'info') {
    this.logger.debug(`Showing ${type} feedback: ${message}`);
    const feedback = this.getBody().querySelector('.input-feedback');
    if (feedback) {
      feedback.textContent = message;
      feedback.className = `input-feedback ${type}`;
    } else {
      this.logger.warn('Feedback element not found in dialog body');
    }
  }

  /**
   * Clears feedback message
   */
  clearFeedback() {
    this.logger.debug('Clearing feedback message');
    const feedback = this.getBody().querySelector('.input-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'input-feedback';
    }
  }
}