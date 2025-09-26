import { Logger } from './logger.js';

/**
 * Template engine for building sandboxed HTML execution environments
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class TemplateEngine {
  /**
   * Creates a new TemplateEngine instance
   * @param {string} [templatePath='./src/core/sandbox-template.html'] - Path to the HTML template file
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=true] - Enable debug logging
   * @param {string} [options.logLevel='info'] - Log level for debugging
   */
  constructor(templatePath = './src/core/sandbox-template.html', options = {}) {
    this.templatePath = templatePath;
    this.template = null;
    this.isLoaded = false;
    this.logger = new Logger({
      enabled: options.debug !== false,
      level: options.logLevel || 'info',
      prefix: 'TemplateEngine'
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
      const response = await fetch(this.templatePath + cacheBuster);
      if (!response.ok) throw new Error(`Failed to load template: ${response.status}`);
      this.template = await response.text();
      this.logger.info('Template loaded successfully, length:', this.template.length);
      this.logger.debug('Template preview:', this.template.substring(0, 200) + '...');
      this.logger.debug('SECRET marker check:', this.template.includes('{{SECRET}}') ? 'Found {{SECRET}}' : 'SECRET marker missing!');
      this.isLoaded = true;
    } catch (error) {
      this.logger.error('Failed to load sandbox template:', error);
      this.logger.warn('Using fallback template');
      this.template = this.getFallbackTemplate();
      this.isLoaded = true;
    }
  }

  /**
   * Returns a fallback HTML template when the external template file fails to load
   * @returns {string} The fallback HTML template
   */
  getFallbackTemplate() {
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Sandbox</title>
<style>html,body{margin:0;padding:12px;font:14px/1.4 -apple-system, system-ui, Segoe UI, Roboto} body{background:#fff;color:#111}</style>
</head><body>
<script>
(function(){
  var SECRET = "{{ SECRET }}";
  var send = function(type){
    var args = Array.prototype.slice.call(arguments,1);
    try { parent.postMessage({ __sandbox: true, secret: SECRET, type: type, args: args }, "*"); } catch(e) {}
  };
  ["log","info","warn","error"].forEach ? ["log","info","warn","error"].forEach(function(m){
    var original = console[m].bind(console);
    console[m] = function(){ send.apply(null, [m].concat([].slice.call(arguments))); try { original.apply(console, arguments); } catch(_) {} };
  }) : null;
  addEventListener("error", function(e){
    send("error", (e.error && (e.error.stack || e.error.message)) || (e.message + " @" + e.filename + ":" + e.lineno + ":" + e.colno));
  });
  addEventListener("unhandledrejection", function(e){
    var r = e.reason; send("error", "Unhandled rejection: " + (r && (r.stack || r.message) || String(r)));
  });
  try {
{{ USER_CODE }}
  } catch (err) {
    try { console.error(err); } catch(_) {}
  } finally {
    setTimeout(function(){ send("done"); }, 0);
  }
})();
</script>
</body></html>`;
  }

  /**
   * Builds an HTML document with user code and security token injected
   * @param {string} userCode - The user's JavaScript code to execute
   * @param {string} secret - Security token for sandboxed communication
   * @returns {string} Complete HTML document ready for iframe execution
   */
  buildSrcDoc(userCode, secret) {
    this.logger.debug('Building srcDoc...');
    if (!this.isLoaded) {
      throw new Error('TemplateEngine not initialized. Call initialize() first.');
    }

    const escaped = userCode.replace(/<\/(script)/gi, '<\\/$1');
    const secretValue = String(secret); // Just the raw string, no quotes

    // Add sourceURL to user code for better debugging
    const userCodeWithSourceMap = `//# sourceURL=user-code.js\n${escaped}`;

    this.logger.trace('Replacing markers - SECRET:', secretValue);
    this.logger.trace('Replacing markers - USER_CODE preview:', escaped.substring(0, 100) + '...');
    this.logger.trace('USER_CODE marker check:', this.template.includes('USER_CODE') ? 'Found USER_CODE' : 'USER_CODE marker missing!');

    const afterSecret = this.template.replace(/\{\{\s*SECRET\s*\}\}/g, secretValue);
    this.logger.trace('After SECRET replacement, length:', afterSecret.length);

    const result = afterSecret.replace(/\{\{\s*USER_CODE\s*\}\}/g, userCodeWithSourceMap);
    this.logger.trace('After USER_CODE replacement, length:', result.length);

    this.logger.debug('Template replacement complete');
    this.logger.trace('Result preview:', result.substring(0, 500) + '...');

    return result;
  }
}