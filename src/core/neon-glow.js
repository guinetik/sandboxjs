/**
 * Neon Glass Glow Effect Manager
 * Applies animated neon glass borders to UI elements
 * @author Joao Guilherme (Guinetik) <guinetik@gmail.com>
 */

import { Logger } from './logger.js';

export class NeonGlowManager {
  /**
   * Creates a new NeonGlowManager instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.transitionDuration=8000] - Duration for color transitions in ms
   * @param {boolean} [options.autoRotate=true] - Automatically rotate colors
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.options = {
      transitionDuration: 8000,
      autoRotate: true,
      debug: false,
      ...options
    };

    this.logger = new Logger({
      enabled: this.options.debug,
      level: 'info',
      prefix: 'NeonGlow'
    });

    this.hue1 = this.randomHue();
    this.hue2 = this.randomHue();
    this.rotationInterval = null;
    this.glowElements = new Set();
  }

  /**
   * Generates a random hue value
   * @returns {number} Hue between 0-360
   */
  randomHue() {
    return Math.floor(Math.random() * 360);
  }

  /**
   * Generates a complementary hue with some variance
   * @param {number} baseHue - Base hue value
   * @returns {number} Complementary hue
   */
  complementaryHue(baseHue) {
    const offset = 80 + Math.floor(Math.random() * 60) - 30;
    return (baseHue + offset) % 360;
  }

  /**
   * Applies neon glow effect to an element
   * @param {HTMLElement} element - Element to apply glow to
   * @param {Object} [options={}] - Glow options (unused in new implementation)
   */
  applyGlow(element, options = {}) {
    // Add neon-glow class
    element.classList.add('neon-glow');

    // Create glow container
    const glowContainer = document.createElement('div');
    glowContainer.className = 'neon-glow-container';

    // Create SINGLE glow element that covers entire pane
    const shine = document.createElement('div');
    shine.className = 'neon-shine';
    glowContainer.appendChild(shine);

    element.appendChild(glowContainer);
    this.glowElements.add(element);

    this.logger.debug('Applied glow to element:', element);
  }

  /**
   * Updates CSS custom properties for hue values
   * @param {number} hue1 - Primary hue
   * @param {number} hue2 - Secondary hue
   */
  updateHues(hue1, hue2) {
    this.hue1 = hue1;
    this.hue2 = hue2;

    document.documentElement.style.setProperty('--hue1', String(hue1));
    document.documentElement.style.setProperty('--hue2', String(hue2));

    this.logger.debug(`Updated hues: ${hue1}, ${hue2}`);
  }

  /**
   * Rotates to new random colors
   */
  rotateColors() {
    const newHue1 = this.randomHue();
    const newHue2 = this.complementaryHue(newHue1);

    this.logger.info(`Rotating colors: ${newHue1}, ${newHue2}`);
    this.updateHues(newHue1, newHue2);
  }

  /**
   * Starts automatic color rotation
   */
  startRotation() {
    if (this.rotationInterval) {
      this.stopRotation();
    }

    // Initial colors
    this.rotateColors();

    // Set up interval
    this.rotationInterval = setInterval(() => {
      this.rotateColors();
    }, this.options.transitionDuration);

    this.logger.info('Started color rotation');
  }

  /**
   * Stops automatic color rotation
   */
  stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
      this.logger.info('Stopped color rotation');
    }
  }

  /**
   * Removes glow from an element
   * @param {HTMLElement} element - Element to remove glow from
   */
  removeGlow(element) {
    element.classList.remove('neon-glow');
    const container = element.querySelector('.neon-glow-container');
    if (container) {
      container.remove();
    }
    this.glowElements.delete(element);
  }

  /**
   * Cleans up the glow manager
   */
  destroy() {
    this.logger.info('Destroying neon glow manager');
    this.stopRotation();
    
    // Remove glow from all elements
    this.glowElements.forEach(element => {
      this.removeGlow(element);
    });

    this.glowElements.clear();
  }
}
