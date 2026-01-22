// src/overlay/background/AnimatedBackgroundProvider.js

class AnimatedBackgroundProvider extends window.BackgroundProvider {
  constructor(config = {}) {
    super(config);
    this.saturation = config.saturation || 70;
    this.lightness = config.lightness || 30;
  }

  /**
   * Get animated background color based on current hue
   * Hue changes on every bounce to prevent OLED burn-in
   */
  getColor(hue) {
    return `hsl(${hue}, ${this.saturation}%, ${this.lightness}%)`;
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.AnimatedBackgroundProvider = AnimatedBackgroundProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimatedBackgroundProvider;
}
