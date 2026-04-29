const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const config = require('./config');
const si = require('systeminformation');
const caretTracker = require('./caretTracker');

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

      // Set to screen-saver level to appear above menu bar and dock on macOS
      overlay.setAlwaysOnTop(true, 'screen-saver');
      overlay.setVisibleOnAllWorkspaces(true);

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
    ipcMain.removeHandler('get-ball-size-mode');
    ipcMain.removeHandler('get-ball-size');
    ipcMain.removeHandler('get-ball-opacity');
    ipcMain.removeHandler('get-ball-speed');
    ipcMain.removeHandler('get-content-settings');
    ipcMain.removeHandler('get-system-info');
    ipcMain.removeHandler('get-theme');
    ipcMain.removeHandler('save-theme');

    ipcMain.handle('dismiss-overlay', () => {
      this.dismissOverlays();
    });

    ipcMain.handle('get-ball-size-mode', () => {
      return config.getBallSizeMode();
    });

    ipcMain.handle('get-ball-size', () => {
      return config.getBallSize();
    });

    ipcMain.handle('get-ball-opacity', () => {
      return config.getBallOpacity();
    });

    ipcMain.handle('get-ball-speed', () => {
      return config.getBallSpeed();
    });

    ipcMain.handle('get-content-settings', () => {
      return config.getContentSettings();
    });

    ipcMain.handle('get-theme', () => {
      return config.getTheme();
    });

    ipcMain.handle('save-theme', (event, themeId) => {
      config.setTheme(themeId);
    });

    ipcMain.removeHandler('get-proximity-fade-enabled');
    ipcMain.removeHandler('get-proximity-fade-radius');

    ipcMain.handle('get-proximity-fade-enabled', () => {
      return config.isProximityFadeEnabled();
    });

    ipcMain.handle('get-proximity-fade-radius', () => {
      return config.getProximityFadeRadius();
    });

    ipcMain.removeHandler('get-caret-position');
    ipcMain.removeHandler('check-accessibility-permission');
    ipcMain.removeHandler('request-accessibility-permission');

    ipcMain.handle('get-caret-position', async () => {
      return await caretTracker.getCaretPosition();
    });

    ipcMain.handle('check-accessibility-permission', async () => {
      return await caretTracker.checkAccessibilityPermission();
    });

    ipcMain.handle('request-accessibility-permission', async () => {
      return await caretTracker.requestAccessibilityPermission();
    });

    ipcMain.handle('get-system-info', async () => {
      try {
        // Get accurate system-wide CPU load (current load across all cores)
        const cpuData = await si.currentLoad();
        const cpuPercent = Math.round(cpuData.currentLoad);

        // Get memory info
        const memData = await si.mem();

        // On macOS, use 'active' memory (excludes cache/buffers)
        // On other platforms, use 'used'
        // 'active' represents memory actually used by applications (App Memory in Activity Monitor)
        // 'used' includes cached files that can be freed
        const os = require('os');
        const isMac = os.platform() === 'darwin';
        const memUsed = isMac && memData.active ? memData.active : memData.used;

        const memUsedGB = (memUsed / 1024 / 1024 / 1024).toFixed(1);
        const memTotalGB = (memData.total / 1024 / 1024 / 1024).toFixed(1);
        const memPercent = Math.round((memUsed / memData.total) * 100);

        console.log('[WindowManager] System info - Platform:', os.platform(), 'CPU:', cpuPercent, '% Memory:', memUsedGB, '/', memTotalGB, 'GB (', memPercent, '%)');

        return {
          cpuPercent: cpuPercent,
          memUsedGB: memUsedGB,
          memTotalGB: memTotalGB,
          memPercent: memPercent
        };
      } catch (err) {
        console.error('[WindowManager] Failed to get system info:', err);
        return {
          cpuPercent: 0,
          memUsedGB: '0',
          memTotalGB: '0',
          memPercent: 0
        };
      }
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
      title: 'Circle Settings',
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
    ipcMain.removeHandler('get-ball-speed');
    ipcMain.removeHandler('get-always-on-hotkey');
    ipcMain.removeHandler('set-always-on-hotkey');
    ipcMain.removeHandler('toggle-always-on');

    ipcMain.handle('get-settings', () => {
      return {
        idleTimeout: config.getIdleTimeout(),
        enabled: config.isEnabled(),
        launchAtLogin: config.getLaunchAtLogin(),
        ballSizeMode: config.getBallSizeMode(),
        ballSize: config.getBallSize(),
        ballOpacity: config.getBallOpacity(),
        ballSpeed: config.getBallSpeed(),
        content: config.getContentSettings(),
        theme: config.getTheme(),
        alwaysOnMode: config.isAlwaysOnMode(),
        alwaysOnHotkey: config.getAlwaysOnHotkey(),
        proximityFadeEnabled: config.isProximityFadeEnabled(),
        proximityFadeRadius: config.getProximityFadeRadius()
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
      if (settings.ballSizeMode !== undefined) {
        config.setBallSizeMode(settings.ballSizeMode);
      }
      if (settings.ballSize !== undefined) {
        config.setBallSize(settings.ballSize);
      }
      if (settings.ballOpacity !== undefined) {
        config.setBallOpacity(settings.ballOpacity);
      }
      if (settings.ballSpeed !== undefined) {
        config.setBallSpeed(settings.ballSpeed);
      }
      if (settings.theme !== undefined) {
        config.setTheme(settings.theme);
      }
      if (settings.alwaysOnMode !== undefined) {
        config.setAlwaysOnMode(settings.alwaysOnMode);
      }
      if (settings.proximityFadeEnabled !== undefined) {
        config.setProximityFadeEnabled(settings.proximityFadeEnabled);
      }
      if (settings.proximityFadeRadius !== undefined) {
        config.setProximityFadeRadius(settings.proximityFadeRadius);
      }
      // Notify overlays of settings changes
      this.notifyOverlaysSettingsChanged(settings);
      return true;
    });

    ipcMain.handle('save-content-settings', (event, settings) => {
      config.setContentSettings(settings);
      return true;
    });

    ipcMain.handle('get-always-on-hotkey', () => {
      return config.getAlwaysOnHotkey();
    });

    ipcMain.handle('set-always-on-hotkey', (event, accelerator) => {
      config.setAlwaysOnHotkey(accelerator);
      // Re-register the hotkey
      if (global.registerAlwaysOnHotkey) {
        global.registerAlwaysOnHotkey();
      }
      return true;
    });

    ipcMain.handle('toggle-always-on', () => {
      if (global.toggleAlwaysOnMode) {
        global.toggleAlwaysOnMode();
      }
      return config.isAlwaysOnMode();
    });
  }

  closeSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }

  notifyAlwaysOnChanged(newState) {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.webContents.send('always-on-changed', newState);
    }
  }

  notifyOverlaysSettingsChanged(settings) {
    this.overlayWindows.forEach(overlay => {
      if (!overlay.isDestroyed()) {
        overlay.webContents.send('settings-changed', settings);
      }
    });
  }

  destroyAll() {
    this.dismissOverlays();
    this.closeSettingsWindow();
  }
}

module.exports = new WindowManager();
