const { app, dialog } = require('electron');
const config = require('./config');
const idleMonitor = require('./idleMonitor');
const trayManager = require('./trayManager');
const windowManager = require('./windowManager');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Hide dock icon on macOS (tray-only app)
if (process.platform === 'darwin') {
  app.dock.hide();
}

app.on('ready', async () => {
  // Create tray icon
  trayManager.create({
    onSettingsClick: () => {
      windowManager.createSettingsWindow();
    },
    onTestOverlayClick: () => {
      console.log('[Main] Test overlay triggered from menu');
      // Temporarily stop idle monitoring
      idleMonitor.stop();
      // Create overlay that won't auto-dismiss
      windowManager.createOverlays(() => {
        console.log('[Main] Test overlay dismissed');
        // Restart idle monitoring
        idleMonitor.start();
      }, true); // Pass debug flag
    },
    onQuitClick: () => {
      cleanup();
      app.quit();
    }
  });

  // Setup idle monitor events
  idleMonitor.on('idle', () => {
    console.log('[Main] Idle event received, creating overlays...');
    if (!windowManager.hasActiveOverlays()) {
      windowManager.createOverlays(() => {
        console.log('[Main] Overlays dismissed');
        idleMonitor.setScreensaverActive(false);
      });
    }
  });

  idleMonitor.on('active', () => {
    if (windowManager.hasActiveOverlays()) {
      windowManager.dismissOverlays();
    }
  });

  // Start monitoring
  idleMonitor.start();

  // Prompt for auto-start on first run
  if (!config.hasPromptedAutoStart()) {
    promptAutoStart();
  }
});

async function promptAutoStart() {
  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 0,
    title: 'OLED Saver',
    message: 'Would you like OLED Saver to start automatically when you log in?'
  });

  config.setHasPromptedAutoStart(true);

  if (result.response === 0) {
    config.setLaunchAtLogin(true);
    app.setLoginItemSettings({
      openAtLogin: true
    });
  }
}

function cleanup() {
  idleMonitor.stop();
  windowManager.destroyAll();
  trayManager.destroy();
}

app.on('window-all-closed', (e) => {
  // Prevent app from quitting when all windows are closed
  e.preventDefault();
});

app.on('before-quit', () => {
  cleanup();
});

// Handle second instance
app.on('second-instance', () => {
  windowManager.createSettingsWindow();
});
