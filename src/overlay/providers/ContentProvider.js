// src/overlay/providers/ContentProvider.js
class ContentProvider {
  constructor(config = {}) {
    this.config = config;
    this.cachedData = null;
    this.refreshInterval = null;
  }

  /**
   * Get current display data (synchronous - returns cached data)
   * @returns {Object} { icon: string, text: string, backgroundColor: string }
   */
  getData() {
    return this.cachedData || {
      icon: '❓',
      text: 'Loading...',
      backgroundColor: '#1a1a2e'
    };
  }

  /**
   * Fetch/update data (async - updates cache)
   * Must be implemented by subclasses
   */
  async fetchData() {
    throw new Error('fetchData() must be implemented by subclass');
  }

  /**
   * Get refresh interval in milliseconds
   * Must be implemented by subclasses
   */
  getRefreshInterval() {
    throw new Error('getRefreshInterval() must be implemented by subclass');
  }

  /**
   * Start auto-refresh cycle
   */
  start() {
    // Initial fetch
    this.fetchData().catch(err => console.error('Provider fetch error:', err));

    // Setup interval
    this.refreshInterval = setInterval(() => {
      this.fetchData().catch(err => console.error('Provider fetch error:', err));
    }, this.getRefreshInterval());
  }

  /**
   * Stop auto-refresh and cleanup
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Export for use in renderer process
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentProvider;
}
