// src/overlay/providers/ClockProvider.js
const ContentProvider = require('./ContentProvider');

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
  }

  getRefreshInterval() {
    return 1000; // Update every second
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClockProvider;
}
