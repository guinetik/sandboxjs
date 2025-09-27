import { Logger } from '../core/logger.js';
import { fetchWithTimeout } from '../core/utils.js';
import { DEFAULT_EXAMPLES_PATH, NETWORK_TIMEOUT_MS } from '../core/constants.js';

/**
 * Examples loader for the JavaScript sandbox
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ExamplesLoader {
  /**
   * Creates a new ExamplesLoader instance
   * @param {Object} options - Configuration options
   * @param {string} [options.examplesPath] - Path to examples directory
   * @param {Function} [options.onLoad] - Callback when example is loaded
   * @param {Function} [options.onError] - Callback when loading fails
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.examplesPath = options.examplesPath || DEFAULT_EXAMPLES_PATH;
    this.onLoad = options.onLoad || (() => {});
    this.onError = options.onError || (() => {});
    this.examples = new Map();
    
    this.logger = new Logger({
      enabled: options.debug || false,
      level: 'info',
      prefix: 'ExamplesLoader'
    });
  }

  /**
   * Discovers available examples by attempting to load known files
   * @returns {Promise<Array>} Array of example metadata
   */
  async discoverExamples() {
    // Known examples - in a real app, this could come from an API or manifest
    const knownExamples = [
      {
        id: 'hello-world',
        title: '👋 Hello World',
        description: 'Simple greeting with interactive button',
        file: 'hello-world.js'
      },
      {
        id: 'spinning-animation',
        title: '🌀 CSS Animations',
        description: 'Spinning box with rainbow colors and controls',
        file: 'spinning-animation.js'
      },
      {
        id: 'interactive-form',
        title: '📝 Interactive Form',
        description: 'Form validation and submission handling',
        file: 'interactive-form.js'
      },
      {
        id: 'canvas-drawing',
        title: '🎨 Canvas Drawing',
        description: 'Draw with mouse or touch on HTML5 canvas',
        file: 'canvas-drawing.js'
      }
    ];

    const availableExamples = [];

    this.logger.info(`Discovering examples from: ${this.examplesPath}`);

    // Test each example to see if it's available
    for (const example of knownExamples) {
      try {
        const url = `${this.examplesPath}/${example.file}`;
        this.logger.debug(`Fetching example: ${url}`);
        
        const response = await fetchWithTimeout(
          url,
          {},
          NETWORK_TIMEOUT_MS
        );
        
        if (response.ok) {
          const code = await response.text();
          this.examples.set(example.id, { ...example, code });
          availableExamples.push(example);
          this.logger.debug(`✓ Example loaded: ${example.id}`);
        } else {
          this.logger.warn(`✗ Example ${example.id} returned ${response.status}`);
        }
      } catch (error) {
        this.logger.warn(`✗ Example ${example.id} failed:`, error.message);
      }
    }

    this.logger.info(`Discovered ${availableExamples.length} of ${knownExamples.length} examples`);
    return availableExamples;
  }

  /**
   * Loads an example by ID
   * @param {string} exampleId - The example ID to load
   * @returns {Promise<Object>} Example data with code
   */
  async loadExample(exampleId) {
    if (this.examples.has(exampleId)) {
      const example = this.examples.get(exampleId);
      this.onLoad(example);
      return example;
    }

    // Try to load if not cached
    try {
      await this.discoverExamples();
      const example = this.examples.get(exampleId);

      if (example) {
        this.onLoad(example);
        return example;
      } else {
        throw new Error(`Example '${exampleId}' not found`);
      }
    } catch (error) {
      this.logger.error('Failed to load example:', error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Gets all available examples
   * @returns {Array} Array of cached examples
   */
  getAvailableExamples() {
    return Array.from(this.examples.values());
  }

  /**
   * Clears the examples cache
   */
  clearCache() {
    this.logger.debug('Clearing examples cache');
    this.examples.clear();
  }

  /**
   * Cleans up the examples loader
   */
  destroy() {
    this.logger.debug('Destroying examples loader');
    this.clearCache();
  }
}
