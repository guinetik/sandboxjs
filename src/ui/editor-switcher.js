import { Logger } from '../core/logger.js';
import { EVENTS } from '../core/constants.js';

/**
 * Editor switcher UI component
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class EditorSwitcher {
  /**
   * Creates a new EditorSwitcher instance
   * @param {HTMLElement} container - The container element for the dropdown
   * @param {Object} eventEmitter - The event emitter instance
   * @param {Object} options - Configuration options
   * @param {string} [options.defaultEditor='ace'] - Default editor name
   * @param {boolean} [options.debug=true] - Enable debug logging
   */
  constructor(container, eventEmitter, options = {}) {
    this.container = container;
    this.eventEmitter = eventEmitter;
    this.options = {
      defaultEditor: 'ace',
      debug: true,
      storageKey: 'sandbox_current_editor',
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'EditorSwitcher'
    });

    // Define available editors
    this.editors = [
      { value: 'ace', label: '🎯 ACE Editor', available: () => typeof ace !== 'undefined' },
      { value: 'codemirror', label: '📝 CodeMirror', available: () => typeof CodeMirror !== 'undefined' },
      { value: 'textarea', label: '📄 Textarea', available: () => true } // Always available
    ];

    // Load saved editor or use default
    this.currentEditor = this.loadSavedEditor() || this.options.defaultEditor;
    this.logger.info('Initializing editor switcher with editor:', this.currentEditor);

    this.createDropdown();
  }

  /**
   * Creates the editor switcher dropdown HTML structure
   */
  createDropdown() {
    // Check if dropdown already exists in container
    const existingDropdown = this.container.querySelector('.editor-switcher');
    if (existingDropdown) {
      existingDropdown.remove();
    }

    this.dropdown = document.createElement('select');
    this.dropdown.className = 'editor-switcher examples-dropdown'; // Reuse examples dropdown styling
    this.dropdown.title = 'Switch editor (ACE, CodeMirror, Textarea)';

    // Add editor options
    this.populateEditors();

    // Set current editor
    this.dropdown.value = this.currentEditor;

    this.dropdown.addEventListener('change', async (e) => {
      const editorValue = e.target.value;
      this.logger.info('Editor dropdown changed to:', editorValue);
      this.logger.info('Current editor is:', this.currentEditor);

      if (editorValue && editorValue !== this.currentEditor) {
        this.logger.info('Switching editor from', this.currentEditor, 'to', editorValue);
        await this.switchEditor(editorValue);
      } else {
        this.logger.warn('Editor value is empty or same as current editor');
      }
    });

    // Insert into the editor controls container
    this.container.appendChild(this.dropdown);
  }

  /**
   * Populates the dropdown with available editors
   */
  populateEditors() {
    // Clear existing options
    this.dropdown.innerHTML = '';

    // Add editor options, filtering by availability
    this.editors.forEach(editor => {
      if (editor.available()) {
        const option = document.createElement('option');
        option.value = editor.value;
        option.textContent = editor.label;
        this.dropdown.appendChild(option);
      } else {
        this.logger.debug('Editor not available:', editor.value);
      }
    });

    // If current editor is not available, fallback to first available
    const availableEditors = this.editors.filter(e => e.available());
    if (availableEditors.length > 0 && !this.editors.find(e => e.value === this.currentEditor)?.available()) {
      this.logger.warn('Current editor not available, falling back to:', availableEditors[0].value);
      this.currentEditor = availableEditors[0].value;
      this.dropdown.value = this.currentEditor;
    }
  }

  /**
   * Loads saved editor from localStorage
   * @returns {string|null} Saved editor name or null if not found
   */
  loadSavedEditor() {
    try {
      const savedEditor = localStorage.getItem(this.options.storageKey);
      if (savedEditor && this.editors.find(e => e.value === savedEditor && e.available())) {
        this.logger.info('Loaded saved editor from storage:', savedEditor);
        return savedEditor;
      }
    } catch (error) {
      this.logger.warn('Failed to load saved editor:', error);
    }
    return null;
  }

  /**
   * Saves current editor to localStorage
   * @param {string} editorName - Editor name to save
   */
  saveEditor(editorName) {
    try {
      localStorage.setItem(this.options.storageKey, editorName);
      this.logger.info('Saved editor to storage:', editorName);
    } catch (error) {
      this.logger.warn('Failed to save editor:', error);
    }
  }

  /**
   * Switches to a new editor
   * @param {string} editorName - The editor name to switch to
   */
  async switchEditor(editorName) {
    const oldEditor = this.currentEditor;
    this.currentEditor = editorName;

    this.logger.info('switchEditor called: changing from', oldEditor, 'to', editorName);

    // Update dropdown value
    this.dropdown.value = editorName;
    this.logger.info('Dropdown value updated to:', this.dropdown.value);

    try {
      // Save editor for persistence
      this.saveEditor(editorName);

      // Emit editor change event for controller to listen to
      this.logger.info('Emitting editor change event with data:', { editor: editorName, oldEditor: oldEditor });
      this.eventEmitter.emit(EVENTS.EDITOR_CHANGE, {
        editor: editorName,
        oldEditor: oldEditor
      });
      this.logger.info('Editor change event emitted successfully');
    } catch (error) {
      this.logger.error('Failed to switch editor:', error);
      // Revert dropdown to old editor
      this.dropdown.value = oldEditor;
      this.currentEditor = oldEditor;
    }
  }

  /**
   * Gets the current editor
   * @returns {string} Current editor name
   */
  getCurrentEditor() {
    return this.currentEditor;
  }

  /**
   * Sets the current editor programmatically
   * @param {string} editorName - The editor name to set
   */
  setEditor(editorName) {
    if (this.editors.find(e => e.value === editorName && e.available())) {
      this.switchEditor(editorName);
    }
  }

  /**
   * Refreshes the editor list (useful when new editors become available)
   */
  refreshEditors() {
    this.logger.info('Refreshing editor list');
    this.populateEditors();
    this.dropdown.value = this.currentEditor;
  }

  /**
   * Destroys the editor switcher
   */
  destroy() {
    if (this.dropdown && this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
  }
}
