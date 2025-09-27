/**
 * Utility functions for the sandbox application
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

import { NETWORK_TIMEOUT_MS } from './constants.js';

/**
 * Creates a fetch request with timeout
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} The fetch response
 */
export async function fetchWithTimeout(url, options = {}, timeout = NETWORK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounces a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Creates a safe JSON stringify that handles circular references
 * @param {any} obj - Object to stringify
 * @param {number} space - Spacing for formatting
 * @returns {string} JSON string
 */
export function safeStringify(obj, space = 2) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    if (typeof Node !== 'undefined' && value instanceof Node) {
      return '<' + (value.nodeName || 'node').toLowerCase() + '>';
    }
    if (value instanceof Error) {
      return value.stack || value.message || String(value);
    }
    return value;
  }, space);
}

/**
 * Checks if device is mobile based on viewport width
 * @param {number} breakpoint - Mobile breakpoint in pixels
 * @returns {boolean} True if mobile
 */
export function isMobile(breakpoint = 768) {
  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
}

/**
 * Creates a promise that resolves after a delay
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sanitizes code for safe template injection
 * @param {string} code - Code to sanitize
 * @returns {string} Sanitized code
 */
export function sanitizeCode(code) {
  // Escape closing script tags to prevent breaking out of the script context
  return code.replace(/<\/(script)/gi, '<\\/$1');
}
