import { Logger } from '../core/logger.js';
import { EVENTS } from '../core/constants.js';

/**
 * Library Manager - Handles CDN library loading with user-controlled allowlists
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class LibraryManager {
  /**
   * Creates a new LibraryManager instance
   * @param {Object} eventEmitter - Event emitter instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.storageKey='sandbox_libraries'] - localStorage key
   */
  constructor(eventEmitter, options = {}) {
    this.eventEmitter = eventEmitter;
    this.options = {
      debug: false,
      storageKey: 'sandbox_libraries',
      allowlistKey: 'sandbox_allowed_domains',
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'LibraryManager'
    });

    // Force a log message to test if logging is working
    console.log('🔧 LibraryManager created with debug:', this.options.debug);

    // Default trusted CDN domains
    this.defaultDomains = [
      'cdnjs.cloudflare.com',
      'unpkg.com',
      'jsdelivr.net',
      'code.jquery.com',
      'stackpath.bootstrapcdn.com'
    ];

    this.libraries = [];
    this.allowedDomains = [];
    this.libraryCache = new Map(); // Cache for fetched library content

    this.loadFromStorage();
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for library management
   */
  setupEventListeners() {
    this.eventEmitter.on(EVENTS.LIBRARY_ADD, (data) => {
      this.addLibrary(data.url, data.name);
    });

    this.eventEmitter.on(EVENTS.LIBRARY_REMOVE, (data) => {
      this.removeLibrary(data.id);
    });

    this.eventEmitter.on(EVENTS.DOMAIN_TRUST_REQUEST, (data) => {
      this.addDomain(data.domain);
    });
  }

  /**
   * Loads libraries and allowed domains from localStorage
   */
  loadFromStorage() {
    this.logger.debug('Loading library data from localStorage...');

    try {
      // Load libraries
      this.logger.debug(`Checking localStorage for key: ${this.options.storageKey}`);
      const librariesData = localStorage.getItem(this.options.storageKey);
      this.libraries = librariesData ? JSON.parse(librariesData) : [];
      this.logger.debug(`Loaded ${this.libraries.length} libraries from storage`);

      // Load allowed domains (merge with defaults)
      this.logger.debug(`Checking localStorage for key: ${this.options.allowlistKey}`);
      const domainsData = localStorage.getItem(this.options.allowlistKey);
      const savedDomains = domainsData ? JSON.parse(domainsData) : [];
      this.allowedDomains = [...new Set([...this.defaultDomains, ...savedDomains])];

      this.logger.debug(`Merged domains - defaults: ${this.defaultDomains.length}, saved: ${savedDomains.length}, total: ${this.allowedDomains.length}`);
      this.logger.info(`Storage load complete: ${this.libraries.length} libraries, ${this.allowedDomains.length} allowed domains`);

      // Log library names for debugging
      if (this.libraries.length > 0) {
        this.logger.debug('Loaded libraries:', this.libraries.map(lib => lib.name).join(', '));
      }
    } catch (error) {
      this.logger.error('Failed to load from storage:', error);
      this.logger.warn('Falling back to empty state with default domains');
      this.libraries = [];
      this.allowedDomains = [...this.defaultDomains];
    }
  }

  /**
   * Saves libraries to localStorage
   */
  saveLibraries() {
    this.logger.debug(`Saving ${this.libraries.length} libraries to localStorage...`);
    try {
      const serialized = JSON.stringify(this.libraries);
      localStorage.setItem(this.options.storageKey, serialized);
      this.logger.debug(`Libraries saved successfully (${serialized.length} chars)`);
    } catch (error) {
      this.logger.error('Failed to save libraries to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        this.logger.warn('localStorage quota exceeded - consider clearing old data');
      }
    }
  }

  /**
   * Saves allowed domains to localStorage
   */
  saveDomains() {
    // Only save non-default domains to avoid bloating storage
    const customDomains = this.allowedDomains.filter(
      domain => !this.defaultDomains.includes(domain)
    );

    this.logger.debug(`Saving ${customDomains.length} custom domains to localStorage...`);
    try {
      const serialized = JSON.stringify(customDomains);
      localStorage.setItem(this.options.allowlistKey, serialized);
      this.logger.debug(`Custom domains saved successfully: [${customDomains.join(', ')}]`);
    } catch (error) {
      this.logger.error('Failed to save domains to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        this.logger.warn('localStorage quota exceeded - consider clearing old data');
      }
    }
  }

  /**
   * Generates a unique ID for a library
   * @returns {string} Unique identifier
   */
  generateId() {
    return 'lib_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Extracts domain from URL
   * @param {string} url - The URL to extract domain from
   * @returns {string|null} Domain or null if invalid
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      this.logger.warn('Invalid URL provided:', url);
      return null;
    }
  }

  /**
   * Extracts library name from URL (best guess)
   * @param {string} url - The library URL
   * @returns {string} Guessed library name
   */
  guessLibraryName(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract filename without extension
      const filename = pathname.split('/').pop();
      const nameWithoutExt = filename.replace(/\.(min\.)?js$/, '');

      // Common library name patterns
      const patterns = [
        /^(.+?)[-.][\d]/,  // name-version or name.version
        /^(.+?)\.min$/,    // name.min
        /^(.+?)$/          // fallback to full name
      ];

      for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern);
        if (match && match[1]) {
          return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }

      return nameWithoutExt || 'Unknown Library';
    } catch (error) {
      return 'Unknown Library';
    }
  }

  /**
   * Extracts version from URL (best guess)
   * @param {string} url - The library URL
   * @returns {string|null} Version string or null if not found
   */
  extractVersionFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract filename without extension
      const filename = pathname.split('/').pop();
      const nameWithoutExt = filename.replace(/\.(min\.)?js$/, '');

      // Version extraction patterns
      const versionPatterns = [
        /[-.](\d+\.\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9]+)*)/,  // semantic version (e.g., jquery-3.6.0.min.js)
        /[-.](\d+\.\d+\.\d+)/,                              // x.y.z version
        /[-.](\d+\.\d+)/,                                   // x.y version
        /\/(\d+\.\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9]+)*)\//  // version in path (e.g., /3.6.0/)
      ];

      for (const pattern of versionPatterns) {
        const match = url.match(pattern) || nameWithoutExt.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if a domain is in the allowed list
   * @param {string} domain - Domain to check
   * @returns {boolean} True if domain is allowed
   */
  isDomainAllowed(domain) {
    return this.allowedDomains.includes(domain);
  }

  /**
   * Validates a library URL
   * @param {string} url - URL to validate
   * @returns {Object} Validation result with status and domain
   */
  validateLibraryUrl(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'URL is required' };
    }

    // Basic URL validation
    const domain = this.extractDomain(url);
    if (!domain) {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Check if URL points to a JavaScript file
    if (!url.match(/\.js(\?.*)?$/i)) {
      return { valid: false, error: 'URL must point to a JavaScript file (.js)' };
    }

    // Check if domain is allowed
    const domainAllowed = this.isDomainAllowed(domain);

    return {
      valid: true,
      domain,
      domainAllowed,
      needsDomainApproval: !domainAllowed
    };
  }

  /**
   * Adds a library to the collection
   * @param {string} url - Library URL
   * @param {string} [name] - Optional library name (will be guessed if not provided)
   * @returns {Object} Result object with success status
   */
  addLibrary(url, name = null) {
    const validation = this.validateLibraryUrl(url);

    if (!validation.valid) {
      this.logger.warn('Library validation failed:', validation.error);
      return { success: false, error: validation.error };
    }

    // Check if library already exists
    const existing = this.libraries.find(lib => lib.url === url);
    if (existing) {
      this.logger.warn('Library already exists:', url);
      return { success: false, error: 'Library already added' };
    }

    // Check domain approval
    if (validation.needsDomainApproval) {
      this.logger.info('Domain approval needed for:', validation.domain);
      this.eventEmitter.emit(EVENTS.DOMAIN_TRUST_REQUEST, {
        domain: validation.domain,
        url,
        name: name || this.guessLibraryName(url)
      });
      return { success: false, needsApproval: true, domain: validation.domain };
    }

    // Add the library
    const library = {
      id: this.generateId(),
      name: name || this.guessLibraryName(url),
      url: url.trim(),
      domain: validation.domain,
      addedAt: new Date().toISOString()
    };

    this.libraries.push(library);
    this.saveLibraries();

    this.logger.info('Library added:', library.name);
    this.eventEmitter.emit(EVENTS.LIBRARY_ADDED, { library });

    return { success: true, library };
  }

  /**
   * Removes a library by ID
   * @param {string} id - Library ID to remove
   * @returns {boolean} True if library was removed
   */
  removeLibrary(id) {
    const index = this.libraries.findIndex(lib => lib.id === id);
    if (index === -1) {
      this.logger.warn('Library not found for removal:', id);
      return false;
    }

    const removed = this.libraries.splice(index, 1)[0];
    this.saveLibraries();

    this.logger.info('Library removed:', removed.name);
    this.eventEmitter.emit(EVENTS.LIBRARY_REMOVED, { library: removed });

    return true;
  }

  /**
   * Adds a domain to the allowed list
   * @param {string} domain - Domain to add
   * @returns {boolean} True if domain was added
   */
  addDomain(domain) {
    if (!domain || this.allowedDomains.includes(domain)) {
      return false;
    }

    this.allowedDomains.push(domain);
    this.saveDomains();

    this.logger.info('Domain added to allowlist:', domain);
    this.eventEmitter.emit(EVENTS.DOMAIN_ADDED, { domain });

    return true;
  }

  /**
   * Removes a domain from the allowed list (if not default)
   * @param {string} domain - Domain to remove
   * @returns {boolean} True if domain was removed
   */
  removeDomain(domain) {
    if (this.defaultDomains.includes(domain)) {
      this.logger.warn('Cannot remove default domain:', domain);
      return false;
    }

    const index = this.allowedDomains.indexOf(domain);
    if (index === -1) {
      return false;
    }

    this.allowedDomains.splice(index, 1);
    this.saveDomains();

    this.logger.info('Domain removed from allowlist:', domain);
    this.eventEmitter.emit(EVENTS.DOMAIN_REMOVED, { domain });

    return true;
  }

  /**
   * Gets all libraries
   * @returns {Array} Array of library objects
   */
  getLibraries() {
    return [...this.libraries];
  }

  /**
   * Gets all allowed domains
   * @returns {Array} Array of allowed domains
   */
  getAllowedDomains() {
    return [...this.allowedDomains];
  }

  /**
   * Fetches library content and generates inline script tags
   * @returns {Promise<string>} HTML script tags with inline content
   */
  async generateScriptTags() {
    if (this.libraries.length === 0) {
      this.logger.debug('No libraries to generate scripts for');
      return '';
    }

    this.logger.info(`Fetching content for ${this.libraries.length} libraries...`);
    const scripts = [];

    for (const lib of this.libraries) {
      try {
        let content;

        // Check cache first
        if (this.libraryCache.has(lib.url)) {
          this.logger.debug(`Using cached content for: ${lib.name}`);
          content = this.libraryCache.get(lib.url);
        } else {
          this.logger.debug(`Fetching library: ${lib.name} from ${lib.url}`);

          const response = await fetch(lib.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          content = await response.text();
          this.logger.debug(`Fetched ${lib.name}: ${content.length} characters`);

          // Cache the content
          this.libraryCache.set(lib.url, content);
        }

        // Create clean inline script with library content
        scripts.push(`  <script data-library="${lib.name}">
/* Library: ${lib.name} */
/* Source: ${lib.url} */
/* Cached: ${new Date().toISOString()} */
${content}
</script>`);

        this.logger.info(`✅ Successfully loaded library: ${lib.name}`);
      } catch (error) {
        this.logger.error(`❌ Failed to fetch library ${lib.name}:`, error.message);

        // Add error placeholder script
        scripts.push(`  <script data-library="${lib.name}">
/* Library: ${lib.name} - FAILED TO LOAD */
/* Error: ${error.message} */
/* URL: ${lib.url} */
console.error('Failed to load library ${lib.name}: ${error.message}');
</script>`);
      }
    }

    const result = scripts.join('\n');

    // Enhanced logging for library injection
    if (this.libraries.length > 0) {
      const libraryNames = this.libraries.map(lib => lib.name).join(', ');
      this.logger.info(`📚 Injecting ${this.libraries.length} libraries into sandbox: ${libraryNames}`);

      // Log each library with detailed info including version detection
      this.libraries.forEach(lib => {
        const scriptSize = scripts.find(s => s.includes(`data-library="${lib.name}"`))?.length || 0;
        const version = this.extractVersionFromUrl(lib.url);
        const versionInfo = version ? ` v${version}` : '';
        this.logger.debug(`  → ${lib.name}${versionInfo}: ${(scriptSize / 1024).toFixed(1)}KB from ${lib.url}`);
      });

      this.logger.info(`📦 Total script injection size: ${(result.length / 1024).toFixed(1)}KB`);
    } else {
      this.logger.debug('No libraries to inject into sandbox');
    }

    return result;
  }

  /**
   * Generates dynamic CSP policy with allowed domains
   * @returns {string} CSP policy string
   */
  generateCSP() {
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      ...this.allowedDomains.map(domain => `https://${domain}`)
    ].join(' ');

    return `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src ${scriptSrc}; connect-src 'none';`;
  }

  /**
   * Gets library statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      libraryCount: this.libraries.length,
      domainCount: this.allowedDomains.length,
      customDomainCount: this.allowedDomains.length - this.defaultDomains.length
    };
  }

  /**
   * Clears all libraries and custom domains
   */
  clear() {
    this.libraries = [];
    this.allowedDomains = [...this.defaultDomains];

    localStorage.removeItem(this.options.storageKey);
    localStorage.removeItem(this.options.allowlistKey);

    this.logger.info('All libraries and custom domains cleared');
    this.eventEmitter.emit(EVENTS.LIBRARIES_CLEARED);
  }

  /**
   * Test method to verify logging is working
   */
  testLogging() {
    console.log('🧪 LibraryManager test logging - debug enabled:', this.options.debug);
    this.logger.debug('This is a debug message');
    this.logger.info('This is an info message');
    this.logger.warn('This is a warn message');
    this.logger.error('This is an error message');
  }

  /**
   * Destroys the library manager
   */
  destroy() {
    this.libraries = [];
    this.allowedDomains = [];
    this.logger.info('Library manager destroyed');
  }
}