const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const config = require('./config');

class WindowManager {
  constructor() {
    this.overlayWindows = [];
    this.settingsWindow = null;
    this.onDismiss = null;
  }

  createOverlays(onDismiss, debugMode = false) {
    this.onDismiss = onDismiss;
    this.debugMode = debugMode;

    // Get all displays to show overlay on every monitor
    const displays = screen.getAllDisplays();

    console.log(`[WindowManager] Creating overlays on ${displays.length} display(s)`);

    // Create an overlay for each display
    displays.forEach((display, index) => {
      console.log(`[WindowManager] Creating overlay ${index + 1} on display at ${display.bounds.x},${display.bounds.y}`);

      const overlay = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        hasShadow: false,
        focusable: false,
        roundedCorners: false,
        show: false,
        webPreferences: {
          preload: path.join(__dirname, '../preload/preload.js'),
          contextIsolation: true,
          nodeIntegration: false
        }
      });

      // Make clicks pass through to windows below
      overlay.setIgnoreMouseEvents(true, { forward: true });

      overlay.loadFile(path.join(__dirname, '../overlay/overlay.html'));

      // Show without focusing to avoid bringing settings window forward
      overlay.once('ready-to-show', () => {
        overlay.showInactive();
        // Open DevTools in debug mode
        if (debugMode) {
          overlay.webContents.openDevTools({ mode: 'detach' });
          console.log('[WindowManager] Debug mode: DevTools opened, auto-dismiss disabled');
        }
      });

      // Prevent the window from being closed by the user
      overlay.on('close', (e) => {
        e.preventDefault();
      });

      this.overlayWindows.push(overlay);
    });

    // Setup IPC handlers for overlay dismissal
    this.setupOverlayIPC();
  }

  setupOverlayIPC() {
    ipcMain.removeHandler('dismiss-overlay');
    ipcMain.removeHandler('get-ball-size');
    ipcMain.removeHandler('get-ball-opacity');
    ipcMain.removeHandler('get-content-settings');
    ipcMain.removeHandler('get-system-info');

    ipcMain.handle('dismiss-overlay', () => {
      this.dismissOverlays();
    });

    ipcMain.handle('get-ball-size', () => {
      return config.getBallSize();
    });

    ipcMain.handle('get-ball-opacity', () => {
      return config.getBallOpacity();
    });

    ipcMain.handle('get-content-settings', () => {
      return config.getContentSettings();
    });

    ipcMain.handle('get-system-info', async () => {
      const cpuUsage = process.getCPUUsage();
      const memInfo = process.getSystemMemoryInfo();

      return {
        cpuPercent: Math.round(cpuUsage.percentCPUUsage),
        memPercent: Math.round(((memInfo.total - memInfo.free) / memInfo.total) * 100)
      };
    });
  }

  dismissOverlays() {
    this.overlayWindows.forEach(overlay => {
      if (!overlay.isDestroyed()) {
        overlay.webContents.send('fade-out');

        setTimeout(() => {
          if (!overlay.isDestroyed()) {
            overlay.removeAllListeners('close');
            overlay.destroy();
          }
        }, 250);
      }
    });

    this.overlayWindows = [];

    if (this.onDismiss) {
      this.onDismiss();
    }
  }

  hasActiveOverlays() {
    return this.overlayWindows.length > 0;
  }

  createSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return this.settingsWindow;
    }

    this.settingsWindow = new BrowserWindow({
      width: 500,
      height: 400,
      minWidth: 400,
      minHeight: 300,
      title: 'OLED Saver Settings',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.settingsWindow.loadFile(path.join(__dirname, '../settings/settings.html'));

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    this.setupSettingsIPC();

    return this.settingsWindow;
  }

  setupSettingsIPC() {
    ipcMain.removeHandler('get-settings');
    ipcMain.removeHandler('save-settings');
    ipcMain.removeHandler('save-content-settings');

    ipcMain.handle('get-settings', () => {
      return {
        idleTimeout: config.getIdleTimeout(),
        enabled: config.isEnabled(),
        launchAtLogin: config.getLaunchAtLogin(),
        ballSize: config.getBallSize(),
        ballOpacity: config.getBallOpacity(),
        content: config.getContentSettings()
      };
    });

    ipcMain.handle('save-settings', (event, settings) => {
      if (settings.idleTimeout !== undefined) {
        config.setIdleTimeout(settings.idleTimeout);
      }
      if (settings.enabled !== undefined) {
        config.setEnabled(settings.enabled);
      }
      if (settings.launchAtLogin !== undefined) {
        config.setLaunchAtLogin(settings.launchAtLogin);
        const { app } = require('electron');
        app.setLoginItemSettings({
          openAtLogin: settings.launchAtLogin
        });
      }
      if (settings.ballSize !== undefined) {
        config.setBallSize(settings.ballSize);
      }
      if (settings.ballOpacity !== undefined) {
        config.setBallOpacity(settings.ballOpacity);
      }
      return true;
    });

    ipcMain.handle('save-content-settings', (event, settings) => {
      config.setContentSettings(settings);
      return true;
    });
  }

  closeSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }

  destroyAll() {
    this.dismissOverlays();
    this.closeSettingsWindow();
  }
}

module.exports = new WindowManager();
