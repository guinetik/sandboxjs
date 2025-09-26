/**
 * Examples dropdown UI component
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ExamplesDropdown {
  /**
   * Creates a new ExamplesDropdown instance
   * @param {HTMLElement} container - The container element for the dropdown
   * @param {Object} options - Configuration options
   * @param {Function} [options.onSelect] - Callback when example is selected
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onSelect = options.onSelect || (() => {});
    this.examples = [];

    this.createDropdown();
  }

  /**
   * Creates the dropdown HTML structure
   */
  createDropdown() {
    // Check if dropdown already exists in container
    const existingDropdown = this.container.querySelector('.examples-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
    }

    this.dropdown = document.createElement('select');
    this.dropdown.className = 'examples-dropdown';
    this.dropdown.innerHTML = '<option value="">📚 Load Example...</option>';

    this.dropdown.addEventListener('change', (e) => {
      const exampleId = e.target.value;
      if (exampleId) {
        this.onSelect(exampleId);
        // Reset to placeholder after selection
        setTimeout(() => {
          this.dropdown.value = '';
        }, 100);
      }
    });

    // Insert before the preview button (last element in toolbar)
    const previewLabel = this.container.querySelector('label.btn');
    if (previewLabel) {
      this.container.insertBefore(this.dropdown, previewLabel);
    } else {
      this.container.appendChild(this.dropdown);
    }
  }

  /**
   * Populates the dropdown with examples
   * @param {Array} examples - Array of example objects
   */
  setExamples(examples) {
    this.examples = examples;

    // Reset to normal placeholder first
    this.dropdown.innerHTML = '<option value="">📚 Load Example...</option>';

    // Add example options
    examples.forEach(example => {
      const option = document.createElement('option');
      option.value = example.id;
      option.textContent = example.title;
      option.title = example.description; // Tooltip
      this.dropdown.appendChild(option);
    });

    // Enable dropdown if we have examples
    this.dropdown.disabled = examples.length === 0;
  }

  /**
   * Shows loading state
   */
  setLoading(loading = true) {
    if (loading) {
      this.dropdown.innerHTML = '<option value="">⏳ Loading examples...</option>';
      this.dropdown.disabled = true;
    } else {
      this.dropdown.innerHTML = '<option value="">📚 Load Example...</option>';
      this.dropdown.disabled = false;
    }
  }

  /**
   * Shows error state
   * @param {string} message - Error message to display
   */
  setError(message = 'Failed to load examples') {
    this.dropdown.innerHTML = `<option value="">❌ ${message}</option>`;
    this.dropdown.disabled = true;
  }

  /**
   * Destroys the dropdown
   */
  destroy() {
    if (this.dropdown && this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
  }
}