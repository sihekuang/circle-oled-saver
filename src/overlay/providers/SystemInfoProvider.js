// src/overlay/providers/SystemInfoProvider.js
const ContentProvider = require('./ContentProvider');

class SystemInfoProvider extends ContentProvider {
  constructor(config = {}) {
    super(config);
  }

  async fetchData() {
    try {
      // CPU usage (note: only available in Electron main process)
      // We'll get this via IPC in the real implementation
      // For now, use placeholder
      const cpuUsage = this.config.cpuUsage || 0;

      // Memory usage (available in renderer via performance API)
      let memPercent = 0;
      if (typeof performance !== 'undefined' && performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.jsHeapSizeLimit;
        memPercent = Math.round((used / total) * 100);
      }

      let text = `⚙️ ${cpuUsage}%  💾 ${memPercent}%`;

      // Battery (if available) - cache the battery manager
      if (this.config.showBattery && typeof navigator !== 'undefined' && navigator.getBattery) {
        try {
          if (!this._batteryManager) {
            this._batteryManager = await navigator.getBattery();
          }
          const batteryPercent = Math.round(this._batteryManager.level * 100);
          text += `\n🔋 ${batteryPercent}%`;
        } catch (e) {
          // Battery API not available, skip
        }
      }

      this.cachedData = {
        icon: '📊',
        text: text,
        backgroundColor: this.config.backgroundColor || '#1a1a2e'
      };
    } catch (err) {
      console.error('SystemInfoProvider fetch error:', err);
      this.cachedData = {
        icon: '📊',
        text: '⚙️ N/A  💾 N/A',
        backgroundColor: this.config.backgroundColor || '#1a1a2e'
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemInfoProvider;
}
