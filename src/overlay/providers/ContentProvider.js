// src/overlay/providers/ContentProvider.js
class ContentProvider {
  constructor(config = {}) {
    this.config = config;
    this.cachedData = null;
    this.refreshInterval = null;
    this._fetching = false; // Guard flag
  }

  /**
   * Get current display data (synchronous - returns cached data)
   * @returns {Object} { icon: string, text: string }
   */
  getData() {
    return this.cachedData || {
      icon: '❓',
      text: 'Loading...'
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
    this._fetching = true;
    this.fetchData()
      .catch(err => console.error('Provider fetch error:', err))
      .finally(() => { this._fetching = false; });

    // Validate refresh interval
    const interval = this.getRefreshInterval();
    if (typeof interval !== 'number' || interval <= 0) {
      console.error('Invalid refresh interval:', interval);
      return;
    }

    // Setup interval
    this.refreshInterval = setInterval(() => {
      // Guard against overlapping fetches
      if (!this._fetching) {
        this._fetching = true;
        this.fetchData()
          .catch(err => console.error('Provider fetch error:', err))
          .finally(() => { this._fetching = false; });
      }
    }, interval);
  }

  /**
   * Stop auto-refresh and cleanup
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.cachedData = null; // Allow garbage collection
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.ContentProvider = ContentProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentProvider;
}
