import { Logger } from '../core/logger.js';

/**
 * Universal Input Manager - Handles input transformations for all editor types
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class InputManager {
  /**
   * Creates a new InputManager instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.options = {
      debug: false,
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'InputManager'
    });

    // Bracket pairs for auto-closing
    this.bracketPairs = new Map([
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
      ['"', '"'],
      ["'", "'"],
      ['`', '`']
    ]);

    this.logger.info('InputManager initialized');
  }

  /**
   * Handle character input and return transformation if needed
   * @param {Object} inputData - Input event data
   * @param {string} inputData.char - Character that was typed
   * @param {number} inputData.position - Cursor position
   * @param {string} inputData.line - Current line content
   * @param {number} inputData.lineNumber - Line number
   * @returns {Object|null} Transformation object or null if no transformation
   */
  handleInput(inputData) {
    const { char, position, line } = inputData;

    this.logger.debug(`Handling input: "${char}" at position ${position}`);

    // Handle opening brackets/quotes
    if (this.bracketPairs.has(char)) {
      const closeChar = this.bracketPairs.get(char);

      if (this.shouldAutoClose(inputData, closeChar)) {
        this.logger.debug(`Auto-closing ${char} with ${closeChar}`);
        return {
          action: 'insert',
          text: closeChar,
          cursorOffset: -1 // Move cursor back to be between brackets
        };
      }
    }

    // Handle closing brackets - skip if already there
    if (Array.from(this.bracketPairs.values()).includes(char)) {
      const charAfter = line.charAt(position);
      if (charAfter === char) {
        this.logger.debug(`Skipping over existing ${char}`);
        return {
          action: 'skip',
          positions: 1 // Move cursor forward 1 position
        };
      }
    }

    return null; // No transformation needed
  }

  /**
   * Handle delete operations (backspace/delete)
   * @param {Object} deleteData - Delete event data
   * @param {string} deleteData.type - 'backspace' or 'delete'
   * @param {number} deleteData.position - Cursor position
   * @param {string} deleteData.line - Current line content
   * @returns {Object|null} Transformation object or null if no transformation
   */
  handleDelete(deleteData) {
    const { type, position, line } = deleteData;

    if (type === 'backspace') {
      const charBefore = line.charAt(position - 1);
      const charAfter = line.charAt(position);

      // Check for empty bracket pairs
      for (const [open, close] of this.bracketPairs) {
        if (charBefore === open && charAfter === close) {
          this.logger.debug(`Deleting empty bracket pair: ${open}${close}`);
          return {
            action: 'deleteRange',
            start: position - 1,
            end: position + 1
          };
        }
      }
    }

    return null; // No transformation needed
  }

  /**
   * Determine if a bracket should be auto-closed
   * @param {Object} inputData - Input event data
   * @param {string} closeChar - The closing character to potentially insert
   * @returns {boolean} Whether to auto-close
   */
  shouldAutoClose(inputData, closeChar) {
    const { char, position, line } = inputData;

    const charAfter = line.charAt(position);
    const charBefore = line.charAt(position - 1);

    // For quotes, don't auto-close if we're inside a word
    if (['"', "'", '`'].includes(char)) {
      if (/\w/.test(charBefore) && /\w/.test(charAfter)) {
        return false;
      }

      // If next char is the same quote, we'll skip it instead
      if (charAfter === char) {
        return false; // Let the skip logic handle this
      }
    }

    // Auto-close if:
    // - End of line
    // - Next char is whitespace
    // - Next char is punctuation/closing bracket
    return !charAfter ||
           /\s/.test(charAfter) ||
           [')', ']', '}', ',', ';', '.'].includes(charAfter);
  }

  /**
   * Get debug information about current bracket state
   * @param {string} line - Current line
   * @param {number} position - Cursor position
   * @returns {Object} Debug info
   */
  getDebugInfo(line, position) {
    return {
      charBefore: line.charAt(position - 1) || 'none',
      charAfter: line.charAt(position) || 'none',
      position,
      lineLength: line.length,
      nearContext: line.substring(Math.max(0, position - 3), position + 3)
    };
  }
}