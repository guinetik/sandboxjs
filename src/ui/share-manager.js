import { Logger } from '../core/logger.js';
import { EVENTS } from '../core/constants.js';

/**
 * Share manager for generating and handling shareable links
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ShareManager {
  /**
   * Creates a new ShareManager instance
   * @param {Object} eventEmitter - Event emitter instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=true] - Enable debug logging
   */
  constructor(eventEmitter, options = {}) {
    this.eventEmitter = eventEmitter;
    this.options = {
      debug: true,
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'ShareManager'
    });

    this.logger.info('ShareManager initialized');
  }

  /**
   * Generates a shareable URL with the current code
   * @param {string} code - The code to share
   * @returns {string} Shareable URL
   */
  generateShareUrl(code) {
    try {
      // Encode the code to base64
      const encodedCode = btoa(encodeURIComponent(code));
      this.logger.info('Generated share URL with code length:', code.length);

      // Get current URL without existing script parameter
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('script', encodedCode);

      return currentUrl.toString();
    } catch (error) {
      this.logger.error('Failed to generate share URL:', error);
      throw new Error('Failed to generate share URL');
    }
  }

  /**
   * Extracts and decodes script from URL parameters
   * @returns {string|null} Decoded script or null if not found
   */
  extractScriptFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedScript = urlParams.get('script');

      if (!encodedScript) {
        this.logger.info('No script parameter found in URL');
        return null;
      }

      // Decode base64 and then URI decode
      const decodedScript = decodeURIComponent(atob(encodedScript));
      this.logger.info('Extracted script from URL, length:', decodedScript.length);

      return decodedScript;
    } catch (error) {
      this.logger.error('Failed to extract script from URL:', error);
      return null;
    }
  }

  /**
   * Copies a URL to clipboard
   * @param {string} url - URL to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(url) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        await navigator.clipboard.writeText(url);
        this.logger.info('URL copied to clipboard using modern API');
        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          this.logger.info('URL copied to clipboard using fallback method');
          return true;
        } else {
          throw new Error('Fallback copy failed');
        }
      }
    } catch (error) {
      this.logger.error('Failed to copy URL to clipboard:', error);
      return false;
    }
  }

  /**
   * Shares the current code and copies URL to clipboard
   * @param {string} code - The code to share
   * @returns {Promise<boolean>} Success status
   */
  async shareCode(code) {
    try {
      const shareUrl = this.generateShareUrl(code);
      const success = await this.copyToClipboard(shareUrl);

      if (success) {
        // Emit success event
        this.eventEmitter.emit(EVENTS.SHARE_SUCCESS, {
          url: shareUrl,
          codeLength: code.length
        });
        this.logger.info('Code shared successfully');
        return true;
      } else {
        // Emit error event
        this.eventEmitter.emit(EVENTS.SHARE_ERROR, {
          error: 'Failed to copy to clipboard'
        });
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to share code:', error);
      this.eventEmitter.emit(EVENTS.SHARE_ERROR, {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Checks if there's a script parameter in the URL on page load
   * @returns {boolean} True if script parameter exists
   */
  hasScriptInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('script');
  }

  /**
   * Cleans up the URL by removing the script parameter
   */
  cleanupUrl() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('script');
      
      // Update URL without page reload
      window.history.replaceState({}, document.title, url.toString());
      this.logger.info('URL cleaned up, script parameter removed');
    } catch (error) {
      this.logger.error('Failed to cleanup URL:', error);
    }
  }
}
