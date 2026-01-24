const { BrowserWindow, screen } = require('electron');
const path = require('path');

class ToastManager {
  constructor() {
    this.toastWindow = null;
    this.hideTimeout = null;
  }

  show(message) {
    // Destroy existing toast if any
    this.destroy();

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    this.toastWindow = new BrowserWindow({
      width: 280,
      height: 80,
      x: Math.round((width - 280) / 2),
      y: Math.round((height - 80) / 2),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.toastWindow.setAlwaysOnTop(true, 'screen-saver');
    this.toastWindow.setIgnoreMouseEvents(true);
    this.toastWindow.setVisibleOnAllWorkspaces(true);

    this.toastWindow.loadFile(path.join(__dirname, '../toast/toast.html'));

    this.toastWindow.webContents.once('did-finish-load', () => {
      this.toastWindow.webContents.send('show-toast', message);
    });

    // Auto-hide after 1.5 seconds + fade out time
    this.hideTimeout = setTimeout(() => {
      this.destroy();
    }, 1800);
  }

  destroy() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.toastWindow && !this.toastWindow.isDestroyed()) {
      this.toastWindow.destroy();
      this.toastWindow = null;
    }
  }
}

module.exports = new ToastManager();
