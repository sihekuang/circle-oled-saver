const desktopIdle = require('desktop-idle');
const { EventEmitter } = require('events');
const config = require('./config');

class IdleMonitor extends EventEmitter {
  constructor() {
    super();
    this.pollInterval = null;
    this.isScreensaverActive = false;
    this.pollIntervalMs = 1000;
  }

  start() {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(() => {
      this.checkIdleState();
    }, this.pollIntervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  checkIdleState() {
    if (!config.isEnabled()) {
      console.log('[IdleMonitor] Disabled, skipping check');
      return;
    }

    const idleTimeSeconds = desktopIdle.getIdleTime();
    const threshold = config.getIdleTimeout();
    console.log(`[IdleMonitor] Idle: ${idleTimeSeconds}s / Threshold: ${threshold}s`);

    if (!this.isScreensaverActive) {
      if (idleTimeSeconds >= threshold) {
        this.isScreensaverActive = true;
        this.emit('idle', idleTimeSeconds);
      }
    } else {
      // Screensaver is active, check if user became active
      // If idle time drops significantly (user input detected)
      // BUT ignore if always-on mode is enabled
      if (idleTimeSeconds < 2 && !config.isAlwaysOnMode()) {
        this.isScreensaverActive = false;
        this.emit('active');
      }
    }
  }

  setScreensaverActive(active) {
    this.isScreensaverActive = active;
  }

  getIdleTime() {
    return desktopIdle.getIdleTime();
  }
}

module.exports = new IdleMonitor();
