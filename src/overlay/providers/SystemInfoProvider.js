// src/overlay/providers/SystemInfoProvider.js

class SystemInfoProvider extends window.ContentProvider {
  constructor(config = {}) {
    super(config);
  }

  async fetchData() {
    try {
      // Get real system info via IPC
      const systemInfo = await window.oledSaver.getSystemInfo();

      let text = `CPU ${systemInfo.cpuPercent}%  RAM ${systemInfo.memUsedGB}/${systemInfo.memTotalGB} GB`;

      // Battery (if available)
      if (this.config.showBattery && typeof navigator !== 'undefined' && navigator.getBattery) {
        try {
          if (!this._batteryManager) {
            this._batteryManager = await navigator.getBattery();
          }
          const batteryPercent = Math.round(this._batteryManager.level * 100);
          text += `\nBattery ${batteryPercent}%`;
        } catch (e) {
          // Battery API not available
        }
      }

      this.cachedData = {
        icon: 'bar-chart-2',
        text: text
      };

      console.log(`[${this.constructor.name}] Data updated:`, this.cachedData.text.replace('\n', ' '));
    } catch (err) {
      console.error('SystemInfoProvider fetch error:', err);
      this.cachedData = {
        icon: 'bar-chart-2',
        text: 'CPU N/A  RAM N/A'
      };
    }
  }

  destroy() {
    super.destroy();
    this._batteryManager = null;
  }

  getRefreshInterval() {
    return 2000; // Update every 2 seconds
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.SystemInfoProvider = SystemInfoProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemInfoProvider;
}
