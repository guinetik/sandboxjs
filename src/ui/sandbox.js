import { Logger } from '../core/logger.js';
import { fetchWithTimeout, sanitizeCode } from '../core/utils.js';
import {
  TEMPLATE_LOAD_TIMEOUT_MS,
  DEFAULT_TEMPLATE_PATH,
  TEMPLATE_MARKERS
} from '../core/constants.js';

/**
 * Template engine for building sandboxed HTML execution environments
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class TemplateEngine {
  /**
   * Creates a new TemplateEngine instance
   * @param {string} [templatePath] - Path to the HTML template file
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=true] - Enable debug logging
   * @param {string} [options.logLevel='info'] - Log level for debugging
   */
  constructor(templatePath = DEFAULT_TEMPLATE_PATH, options = {}) {
    this.templatePath = templatePath;
    this.template = null;
    this.isLoaded = false;
    this.logger = new Logger({
      enabled: options.debug !== false,
      level: options.logLevel || 'info',
      prefix: 'TemplateEngine',
      redactSecrets: true
    });
  }

  /**
   * Forces a reload of the template from disk
   */
  forceReload() {
    this.logger.info('Force reloading template...');
    this.template = null;
    this.isLoaded = false;
  }

  /**
   * Initializes the template engine by loading the HTML template
   * @returns {Promise<void>}
   */
  async initialize() {
    this.logger.info('Starting initialization...');
    if (this.isLoaded) {
      this.logger.debug('Already loaded, skipping');
      return;
    }

    try {
      this.logger.debug('Fetching template from:', this.templatePath);
      // Add cache busting to force reload
      const cacheBuster = '?t=' + Date.now();
      const response = await fetchWithTimeout(
        this.templatePath + cacheBuster,
        {},
        TEMPLATE_LOAD_TIMEOUT_MS
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status}`);
      }
      
      this.template = await response.text();
      
      // Validate template has required markers
      this.validateTemplate();
      
      this.logger.info('Template loaded successfully, length:', this.template.length);
      this.logger.debug('Template preview:', this.template.substring(0, 200) + '...');
      this.isLoaded = true;
    } catch (error) {
      this.logger.error('Failed to load sandbox template:', error.message);
      this.logger.warn('Using fallback template');
      this.template = this.getFallbackTemplate();
      this.isLoaded = true;
    }
  }

  /**
   * Validates that the template contains required markers
   * @throws {Error} If template is missing required markers
   */
  validateTemplate() {
    const requiredMarkers = [
      TEMPLATE_MARKERS.SECRET,
      TEMPLATE_MARKERS.USER_CODE,
      TEMPLATE_MARKERS.DYNAMIC_CSP,
      TEMPLATE_MARKERS.LIBRARY_SCRIPTS
    ];

    const missingMarkers = requiredMarkers.filter(
      marker => !this.template.includes(marker)
    );

    if (missingMarkers.length > 0) {
      throw new Error(
        `Template missing required markers: ${missingMarkers.join(', ')}`
      );
    }

    this.logger.debug('Template validation passed');
  }

  /**
   * Returns a fallback HTML template when the external template file fails to load
   * @returns {string} The fallback HTML template
   */
  getFallbackTemplate() {
    return `<!doctype html>
<html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${TEMPLATE_MARKERS.DYNAMIC_CSP}">
<title>Sandbox</title>
${TEMPLATE_MARKERS.LIBRARY_SCRIPTS}
<style>html,body{margin:0;padding:12px;font:14px/1.4 -apple-system, system-ui, Segoe UI, Roboto} body{background:#fff;color:#111}</style>
</head><body>
<script>
(function(){
  var SECRET = "${TEMPLATE_MARKERS.SECRET}";

  // Debug logging to sandbox console
  var debug = function(msg) {
    console.log('[SANDBOX DEBUG]', msg);
  };

  // Convert any value to a string for sending
  var stringify = function(val) {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);

    // Handle Error objects specially
    if (val instanceof Error) {
      var errorStr = val.name + ': ' + val.message;
      if (val.stack) {
        // Clean up the stack trace
        var lines = val.stack.split('\\n');
        var cleaned = [];
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (i === 0) {
            cleaned.push(line); // Keep error message
          } else if (line.indexOf('<anonymous>') !== -1) {
            // Extract line and column numbers
            var match = line.match(/:(\d+):(\d+)/);
            if (match) {
              cleaned.push('    at line ' + match[1] + ', column ' + match[2]);
            }
          }
        }
        errorStr = cleaned.join('\\n');
      }
      return errorStr;
    }

    // Try to stringify objects
    try {
      return JSON.stringify(val);
    } catch(e) {
      return Object.prototype.toString.call(val);
    }
  };

  var send = function(type){
    var args = Array.prototype.slice.call(arguments, 1);
    // Make sure all arguments are strings
    var stringArgs = [];
    for (var i = 0; i < args.length; i++) {
      stringArgs.push(stringify(args[i]));
    }

    debug('Sending ' + type + ' message with ' + stringArgs.length + ' args');

    try {
      parent.postMessage({
        __sandbox: true,
        secret: SECRET,
        type: type,
        args: stringArgs
      }, "*");
    } catch(e) {
      debug('Failed to send message: ' + e.message);
    }
  };

  // Override console methods
  ["log","info","warn","error"].forEach(function(m){
    var original = console[m];
    console[m] = function(){
      var args = Array.prototype.slice.call(arguments);
      send.apply(null, [m].concat(args));
      // Still call original for debugging
      if (original && original.apply) {
        try { original.apply(console, arguments); } catch(_) {}
      }
    };
  });

  // Global error handler
  window.addEventListener("error", function(e){
    debug('Error event caught');
    debug('Error object: ' + e.error);
    debug('Error message: ' + e.message);
    debug('Error lineno: ' + e.lineno);

    var errorMsg = '';
    if (e.error) {
      // Extract error details manually since stringify might fail
      var err = e.error;
      errorMsg = (err.name || 'Error') + ': ' + (err.message || 'Unknown error');

      // Try to get stack trace
      if (err.stack) {
        var lines = err.stack.split('\\n');
        // First line is usually the error message, skip it if it's redundant
        var startIdx = (lines[0].indexOf(err.message) !== -1) ? 1 : 0;

        for (var i = startIdx; i < lines.length; i++) {
          var line = lines[i].trim();
          if (line) {
            // Clean up the stack trace line
            var match = line.match(/at\\s+(?:(.+?)\\s+\\()?(?:.+?):(\\d+):(\\d+)/);
            if (match) {
              var fnName = match[1] || 'anonymous';
              errorMsg += '\\n    at ' + fnName + ' (line ' + match[2] + ', column ' + match[3] + ')';
            } else if (line.indexOf('at ') === 0) {
              // Keep other 'at' lines but clean them up
              errorMsg += '\\n    ' + line;
            }
          }
        }
      } else if (e.lineno) {
        // Fallback to basic location info
        errorMsg += '\\n    at line ' + e.lineno + ', column ' + e.colno;
      }
    } else {
      // Fallback when no error object
      errorMsg = e.message || 'Unknown error';
      if (e.lineno) {
        errorMsg += '\\n    at line ' + e.lineno + ', column ' + e.colno;
      }
    }

    debug('Formatted error: ' + errorMsg);
    send("error", errorMsg);

    // Prevent default browser error handling
    e.preventDefault();
    return true;
  });

  // Handle promise rejections
  window.addEventListener("unhandledrejection", function(e){
    debug('Unhandled rejection caught');
    var errorMsg = "Unhandled Promise Rejection: " + stringify(e.reason);
    send("error", errorMsg);
    e.preventDefault();
    return true;
  });

  // Execute user code
  debug('Executing user code...');
  try {
${TEMPLATE_MARKERS.USER_CODE}
  } catch (err) {
    debug('Caught error in try-catch: ' + err.message);
    send("error", stringify(err));
  }

  // Signal completion
  setTimeout(function(){
    debug('Sending done signal');
    send("done");
  }, 0);
})();
</script>
</body></html>`;
  }

  /**
   * Builds an HTML document with user code and security token injected
   * @param {string} userCode - The user's JavaScript code to execute
   * @param {string} secret - Security token for sandboxed communication
   * @param {string} [libraryScripts=''] - HTML script tags for libraries
   * @param {string} [dynamicCSP] - Dynamic CSP policy string
   * @returns {string} Complete HTML document ready for iframe execution
   */
  buildSrcDoc(userCode, secret, libraryScripts = '', dynamicCSP = null) {
    this.logger.debug('Building srcDoc...');
    if (!this.isLoaded) {
      throw new Error('TemplateEngine not initialized. Call initialize() first.');
    }

    // Sanitize user code
    const sanitized = sanitizeCode(userCode);
    const secretValue = String(secret);

    // Add sourceURL to user code for better debugging and line number tracking
    const userCodeWithSourceMap = `//# sourceURL=user-code.js\n${sanitized}`;

    // Use provided CSP or fallback to default
    const cspPolicy = dynamicCSP || "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'none';";

    this.logger.trace('Replacing template markers');

    // Replace all markers in sequence
    let result = this.template;

    result = result.replace(
      new RegExp(this.escapeRegExp(TEMPLATE_MARKERS.SECRET), 'g'),
      secretValue
    );

    result = result.replace(
      new RegExp(this.escapeRegExp(TEMPLATE_MARKERS.USER_CODE), 'g'),
      userCodeWithSourceMap
    );

    result = result.replace(
      new RegExp(this.escapeRegExp(TEMPLATE_MARKERS.LIBRARY_SCRIPTS), 'g'),
      libraryScripts
    );

    result = result.replace(
      new RegExp(this.escapeRegExp(TEMPLATE_MARKERS.DYNAMIC_CSP), 'g'),
      cspPolicy
    );

    this.logger.debug('Template replacement complete');
    this.logger.trace('Result preview:', result.substring(0, 500) + '...');

    if (libraryScripts) {
      this.logger.info('Libraries injected:', libraryScripts.split('<script').length - 1);
    }

    return result;
  }

  /**
   * Escapes special regex characters in a string
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
