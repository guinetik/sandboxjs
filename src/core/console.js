/**
 * Console output renderer for displaying sandboxed code execution results
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class ConsoleOutput {
  /**
   * Creates a new ConsoleOutput instance
   * @param {HTMLElement} container - The DOM element to render console output in
   */
  constructor(container) {
    this.container = container;
  }

  /**
   * Clears all console output
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Adds a new line to the console output
   * @param {string} type - The log type (log, info, warn, error)
   * @param {Array} args - The arguments to display
   */
  addLine(type, args) {
    const div = document.createElement('div');
    div.className = `console-line console-${type}`;
    div.textContent = args.map(this.formatArg).join(' ');
    this.container.appendChild(div);
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * Formats a value for display in the console
   * @param {any} value - The value to format
   * @returns {string} The formatted string representation
   */
  formatArg(value) {
    try {
      if (value instanceof Error) {
        return value.stack || value.message || String(value);
      }
    } catch (e) {}

    const type = typeof value;
    if (type === 'string') return value;
    if (type === 'number' || type === 'boolean' || value === null) return String(value);
    if (type === 'undefined') return 'undefined';

    if (typeof Node !== 'undefined' && value instanceof Node) {
      return '<' + (value.nodeName || 'node').toLowerCase() + '>';
    }

    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]';
          seen.add(val);
        }
        if (typeof Node !== 'undefined' && val instanceof Node) {
          return '<' + (val.nodeName || 'node').toLowerCase() + '>';
        }
        if (val instanceof Error) {
          return val.stack || val.message || String(val);
        }
        return val;
      }, 2);
    } catch (e) {
      return String(value);
    }
  }
}