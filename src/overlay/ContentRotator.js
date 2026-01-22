// src/overlay/ContentRotator.js
class ContentRotator {
  constructor(providers = [], intervalSeconds = 10) {
    this.providers = providers;
    this.currentIndex = 0;
    this.intervalSeconds = intervalSeconds;
    this.rotationTimer = null;
  }

  /**
   * Get current active provider
   */
  getCurrentProvider() {
    if (this.providers.length === 0) {
      return null;
    }
    return this.providers[this.currentIndex];
  }

  /**
   * Manually advance to next provider
   */
  next() {
    if (this.providers.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
  }

  /**
   * Start rotation timer
   */
  start() {
    // Start all providers
    this.providers.forEach(provider => provider.start());

    // Start rotation timer
    if (this.providers.length > 1) {
      this.rotationTimer = setInterval(() => {
        this.next();
      }, this.intervalSeconds * 1000);
    }
  }

  /**
   * Stop rotation and cleanup
   */
  destroy() {
    // Stop rotation timer
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }

    // Destroy all providers
    this.providers.forEach(provider => provider.destroy());
    this.providers = [];
  }

  /**
   * Update providers array (useful for settings changes)
   */
  setProviders(providers, intervalSeconds) {
    this.destroy();
    this.providers = providers;
    this.intervalSeconds = intervalSeconds;
    this.currentIndex = 0;
    this.start();
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.ContentRotator = ContentRotator;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentRotator;
}
