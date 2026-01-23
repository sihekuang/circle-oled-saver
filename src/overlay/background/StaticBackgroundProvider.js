// src/overlay/background/StaticBackgroundProvider.js

class StaticBackgroundProvider extends window.BackgroundProvider {
  constructor(config = {}) {
    super(config);
    this.color = config.color || '#1a1a2e';
  }

  /**
   * Get static background color (ignores hue)
   */
  getColor(hue) {
    return this.color;
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.StaticBackgroundProvider = StaticBackgroundProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StaticBackgroundProvider;
}
