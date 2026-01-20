const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const config = require('./config');

class TrayManager {
  constructor() {
    this.tray = null;
    this.onSettingsClick = null;
    this.onQuitClick = null;
  }

  create({ onSettingsClick, onQuitClick }) {
    this.onSettingsClick = onSettingsClick;
    this.onQuitClick = onQuitClick;

    const iconPath = path.join(__dirname, '../../assets/iconTemplate.png');

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
    this.tray.setToolTip('OLED Saver');

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

    const contextMenu = Menu.buildFromTemplate([
      {
        label: enabled ? 'Enabled' : 'Disabled',
        type: 'checkbox',
        checked: enabled,
        click: () => {
          config.setEnabled(!enabled);
          this.updateMenu();
        }
      },
      { type: 'separator' },
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
    ]);

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
