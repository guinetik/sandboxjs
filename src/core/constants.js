/**
 * Application-wide constants
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

// Execution timeouts
export const DEFAULT_TIMEOUT_MS = 4000;
export const NETWORK_TIMEOUT_MS = 5000;
export const TEMPLATE_LOAD_TIMEOUT_MS = 5000;

// UI dimensions
export const MIN_LEFT_PANE_WIDTH = 320;
export const MIN_RIGHT_PANE_WIDTH = 420;
export const MIN_CONSOLE_HEIGHT = 100;
export const MIN_PREVIEW_HEIGHT = 100;
export const RESIZE_HANDLE_WIDTH = 5;
export const VERTICAL_RESIZE_HANDLE_HEIGHT = 8;

// Storage keys
export const DEFAULT_STORAGE_KEY = 'js-sandbox-code';

// Log levels
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Default log level
export const DEFAULT_LOG_LEVEL = 'info';

// Mobile breakpoint
export const MOBILE_BREAKPOINT = 768;

/**
 * Gets the base path from the current document base or defaults to root
 * @returns {string} The base path (e.g., '/sandboxjs/' or '/')
 */
function getBasePath() {
  // Check if there's a base tag
  const baseTag = document.querySelector('base');
  if (baseTag && baseTag.href) {
    const url = new URL(baseTag.href);
    return url.pathname;
  }
  
  // Fallback: detect from current path
  const path = window.location.pathname;
  // If path includes /sandboxjs/, use that as base
  if (path.includes('/sandboxjs/')) {
    return '/sandboxjs/';
  }
  
  return '/';
}

// Examples path - dynamically determined based on base path
export const DEFAULT_EXAMPLES_PATH = getBasePath() + 'examples';

// Template path - relative path works in both dev and production
export const DEFAULT_TEMPLATE_PATH = './src/ui/sandbox.html';

// Event names
export const EVENTS = {
  // Initialization
  INIT_START: 'init:start',
  INIT_COMPLETE: 'init:complete',
  INIT_ERROR: 'init:error',
  
  // Code events
  CODE_CHANGE: 'code:change',
  CODE_LOAD: 'code:load',
  CODE_VALIDATE: 'code:validate',
  CODE_EXECUTE_START: 'code:execute:start',
  CODE_EXECUTE_COMPLETE: 'code:execute:complete',
  CODE_EXECUTE_TIMEOUT: 'code:execute:timeout',
  
  // Console events
  CONSOLE_MESSAGE: 'console:message',
  CONSOLE_CLEAR: 'console:clear',
  
  // Sandbox events
  SANDBOX_RESET: 'sandbox:reset',
  
  // Status events
  STATUS_CHANGE: 'status:change',

  // Theme events
  THEME_LOAD_START: 'theme:load:start',
  THEME_LOAD_COMPLETE: 'theme:load:complete',
  THEME_CHANGE: 'theme:change',
  THEME_READY: 'theme:ready',
  
  // Editor events
  EDITOR_READY: 'editor:ready',
  
  // Example events
  EXAMPLE_LOAD: 'example:load',
  EXAMPLE_LOADED: 'example:loaded',
  EXAMPLE_ERROR: 'example:error',
  
  // Pane events
  PANES_RESIZED: 'panes:resized',
  PANES_RESIZED_VERTICAL: 'panes:resized:vertical',

  // Fullscreen events
  FULLSCREEN_TOGGLE: 'fullscreen:toggle',
  FULLSCREEN_EDITOR: 'fullscreen:editor',
  FULLSCREEN_CONSOLE: 'fullscreen:console',
  FULLSCREEN_EXIT: 'fullscreen:exit',

  // Library events
  LIBRARY_MANAGER_OPEN: 'library:manager:open',
  LIBRARY_ADD: 'library:add',
  LIBRARY_ADDED: 'library:added',
  LIBRARY_REMOVE: 'library:remove',
  LIBRARY_REMOVED: 'library:removed',
  DOMAIN_TRUST_REQUEST: 'domain:trust:request',
  DOMAIN_ADDED: 'domain:added',
  DOMAIN_REMOVED: 'domain:removed',
  LIBRARIES_CLEARED: 'libraries:cleared',

  // Destroy
  DESTROY: 'destroy'
};

// Status messages
export const STATUS_MESSAGES = {
  executing: 'Executing…',
  completed: 'Completed',
  timeout: 'Timeout exceeded',
  reset: 'Sandbox reset',
  cleared: 'Console cleared'
};

// Security
export const CRYPTO_ARRAY_SIZE = 2;

// Template markers
export const TEMPLATE_MARKERS = {
  SECRET: '{{SECRET}}',
  USER_CODE: '{{USER_CODE}}',
  DYNAMIC_CSP: '{{DYNAMIC_CSP}}',
  LIBRARY_SCRIPTS: '{{LIBRARY_SCRIPTS}}'
};
