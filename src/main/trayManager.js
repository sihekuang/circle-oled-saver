const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const config = require('./config');

function formatHotkey(accelerator) {
  if (!accelerator) return '';
  return accelerator
    .replace('CommandOrControl', process.platform === 'darwin' ? '\u2318' : 'Ctrl')
    .replace('Command', '\u2318')
    .replace('Control', 'Ctrl')
    .replace('Alt', process.platform === 'darwin' ? '\u2325' : 'Alt')
    .replace('Shift', process.platform === 'darwin' ? '\u21E7' : 'Shift')
    .replace(/\+/g, '');
}

class TrayManager {
  constructor() {
    this.tray = null;
    this.onSettingsClick = null;
    this.onQuitClick = null;
  }

  create({ onSettingsClick, onQuitClick, onTestOverlayClick, onClearOverlayClick, onAlwaysOnToggle }) {
    this.onSettingsClick = onSettingsClick;
    this.onQuitClick = onQuitClick;
    this.onTestOverlayClick = onTestOverlayClick;
    this.onClearOverlayClick = onClearOverlayClick;
    this.onAlwaysOnToggle = onAlwaysOnToggle;

    const iconPath = path.join(__dirname, '../../assets/trayTemplate.png');

    // Create a simple icon if the file doesn't exist
    let icon;
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        icon = this.createDefaultIcon();
      }
    } catch (e) {
      icon = this.createDefaultIcon();
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('Circle');

    this.updateMenu();

    this.tray.on('click', () => {
      if (this.onSettingsClick) {
        this.onSettingsClick();
      }
    });

    return this.tray;
  }

  createDefaultIcon() {
    // Create a simple 16x16 icon
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);

    // Draw a simple circle pattern
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const cx = size / 2;
        const cy = size / 2;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

        if (dist < 6) {
          canvas[idx] = 255;     // R
          canvas[idx + 1] = 255; // G
          canvas[idx + 2] = 255; // B
          canvas[idx + 3] = 255; // A
        } else {
          canvas[idx] = 0;
          canvas[idx + 1] = 0;
          canvas[idx + 2] = 0;
          canvas[idx + 3] = 0;
        }
      }
    }

    return nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  updateMenu() {
    const enabled = config.isEnabled();
    const alwaysOn = config.isAlwaysOnMode();
    const hotkeyLabel = formatHotkey(config.getAlwaysOnHotkey());
    const isDev = !app.isPackaged;

    const menuItems = [
      {
        label: enabled ? 'Enabled' : 'Disabled',
        type: 'checkbox',
        checked: enabled,
        click: () => {
          config.setEnabled(!enabled);
          this.updateMenu();
        }
      },
      {
        label: `Always On${hotkeyLabel ? ' (' + hotkeyLabel + ')' : ''}`,
        type: 'checkbox',
        checked: alwaysOn,
        click: () => {
          console.log('[TrayManager] Always On clicked, callback exists:', !!this.onAlwaysOnToggle);
          if (this.onAlwaysOnToggle) {
            this.onAlwaysOnToggle();
          }
        }
      },
      { type: 'separator' }
    ];

    // Debug menu items only in development
    if (isDev) {
      menuItems.push(
        {
          label: 'Test Overlay (Debug)',
          click: () => {
            if (this.onTestOverlayClick) {
              this.onTestOverlayClick();
            }
          }
        },
        {
          label: 'Clear Test Overlay',
          click: () => {
            if (this.onClearOverlayClick) {
              this.onClearOverlayClick();
            }
          }
        }
      );
    }

    menuItems.push(
      {
        label: 'Settings...',
        click: () => {
          if (this.onSettingsClick) {
            this.onSettingsClick();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          if (this.onQuitClick) {
            this.onQuitClick();
          } else {
            app.quit();
          }
        }
      }
    );

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = new TrayManager();
