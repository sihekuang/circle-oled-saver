// src/overlay/background/BackgroundProvider.js

class BackgroundProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Get current background color
   * @param {number} hue - Current hue from ball (0-360)
   * @returns {string} CSS color string
   */
  getColor(hue) {
    throw new Error('getColor() must be implemented by subclass');
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.BackgroundProvider = BackgroundProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundProvider;
}
