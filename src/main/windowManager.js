const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const config = require('./config');

class WindowManager {
  constructor() {
    this.overlayWindows = [];
    this.settingsWindow = null;
    this.onDismiss = null;
  }

  createOverlays(onDismiss) {
    this.onDismiss = onDismiss;

    // Get primary display only (single screen overlay)
    const display = screen.getPrimaryDisplay();

    console.log('[WindowManager] Creating overlay on primary display');

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
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    // Make clicks pass through to windows below
    overlay.setIgnoreMouseEvents(true, { forward: true });

    overlay.loadFile(path.join(__dirname, '../overlay/overlay.html'));

    // Prevent the window from being closed by the user
    overlay.on('close', (e) => {
      e.preventDefault();
    });

    this.overlayWindows.push(overlay);

    // Setup IPC handlers for overlay dismissal
    this.setupOverlayIPC();
  }

  setupOverlayIPC() {
    ipcMain.removeHandler('dismiss-overlay');
    ipcMain.removeHandler('get-ball-size');

    ipcMain.handle('dismiss-overlay', () => {
      this.dismissOverlays();
    });

    ipcMain.handle('get-ball-size', () => {
      return config.getBallSize();
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

    ipcMain.handle('get-settings', () => {
      return {
        idleTimeout: config.getIdleTimeout(),
        enabled: config.isEnabled(),
        launchAtLogin: config.getLaunchAtLogin(),
        ballSize: config.getBallSize()
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
