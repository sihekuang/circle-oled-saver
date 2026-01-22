// src/overlay/providers/ClockProvider.js
// In browser context, ContentProvider is loaded from window
const ContentProvider = (typeof window !== 'undefined') ? window.ContentProvider : require('./ContentProvider');

class ClockProvider extends ContentProvider {
  constructor(config = {}) {
    super(config);
  }

  async fetchData() {
    const now = new Date();

    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !this.config.show24Hour
    };

    const dateOptions = {
      month: 'short',
      day: 'numeric'
    };

    const time = now.toLocaleTimeString('en-US', timeOptions);
    const date = now.toLocaleDateString('en-US', dateOptions);

    this.cachedData = {
      icon: '🕐',
      text: `${time}\n${date}`,
      backgroundColor: this.config.backgroundColor || '#1a1a2e'
    };

    console.log(`[${this.constructor.name}] Data updated:`, this.cachedData.text.replace('\n', ' '));
  }

  getRefreshInterval() {
    return 1000; // Update every second
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.ClockProvider = ClockProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClockProvider;
}
