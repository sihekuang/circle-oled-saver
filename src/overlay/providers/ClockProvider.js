// src/overlay/providers/ClockProvider.js

class ClockProvider extends window.ContentProvider {
  constructor(config = {}) {
    super(config);
    this.hue = 0; // Start hue for color cycling
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

    // Cycle through colors: increment hue slowly
    this.hue = (this.hue + 1) % 360;

    // Use configured color or generate color based on hue
    let bgColor;
    if (this.config.backgroundColor && this.config.backgroundColor !== 'auto') {
      bgColor = this.config.backgroundColor;
    } else {
      // Generate a nice saturated color
      bgColor = `hsl(${this.hue}, 70%, 30%)`;
    }

    this.cachedData = {
      icon: '🕐',
      text: `${time}\n${date}`,
      backgroundColor: bgColor
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
