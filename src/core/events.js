/**
 * Event system for external communication with the sandbox
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */
export class EventEmitter {
  /**
   * Creates a new EventEmitter instance
   */
  constructor() {
    this.events = new Map();
  }

  /**
   * Registers an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @param {Object} [options={}] - Options for the listener
   * @param {boolean} [options.once=false] - Whether to remove after first call
   * @returns {Function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listener = {
      callback,
      once: options.once || false
    };

    this.events.get(event).push(listener);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Registers a one-time event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  /**
   * Removes an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function to remove
   */
  off(event, callback) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const index = listeners.findIndex(listener => listener.callback === callback);

    if (index > -1) {
      listeners.splice(index, 1);
    }

    // Clean up empty event arrays
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emits an event to all registered listeners
   * @param {string} event - The event name
   * @param {...any} args - Arguments to pass to listeners
   * @returns {boolean} True if any listeners were called
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return false;

    const listeners = this.events.get(event);
    const listenersToRemove = [];

    listeners.forEach((listener, index) => {
      try {
        listener.callback(...args);
        if (listener.once) {
          listenersToRemove.push(index);
        }
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });

    // Remove one-time listeners (in reverse order to maintain indices)
    listenersToRemove.reverse().forEach(index => {
      listeners.splice(index, 1);
    });

    // Clean up empty event arrays
    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return true;
  }

  /**
   * Removes all listeners for an event, or all listeners if no event specified
   * @param {string} [event] - The event name, or undefined to clear all
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Returns an array of event names that have listeners
   * @returns {Array<string>} Array of event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Returns the number of listeners for an event
   * @param {string} event - The event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }
}