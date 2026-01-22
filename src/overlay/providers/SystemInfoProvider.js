// src/overlay/providers/SystemInfoProvider.js
const ContentProvider = require('./ContentProvider');

class SystemInfoProvider extends ContentProvider {
  constructor(config = {}) {
    super(config);
  }

  async fetchData() {
    try {
      // Get real system info via IPC
      const systemInfo = await window.oledSaver.getSystemInfo();

      let text = `⚙️ ${systemInfo.cpuPercent}%  💾 ${systemInfo.memPercent}%`;

      // Battery (if available)
      if (this.config.showBattery && typeof navigator !== 'undefined' && navigator.getBattery) {
        try {
          if (!this._batteryManager) {
            this._batteryManager = await navigator.getBattery();
          }
          const batteryPercent = Math.round(this._batteryManager.level * 100);
          text += `\n🔋 ${batteryPercent}%`;
        } catch (e) {
          // Battery API not available
        }
      }

      this.cachedData = {
        icon: '📊',
        text: text,
        backgroundColor: this.config.backgroundColor || '#1a1a2e'
      };

      console.log(`[${this.constructor.name}] Data updated:`, this.cachedData.text.replace('\n', ' '));
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
