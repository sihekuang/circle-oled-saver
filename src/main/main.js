const { app, dialog, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const config = require('./config');
const idleMonitor = require('./idleMonitor');
const trayManager = require('./trayManager');
const windowManager = require('./windowManager');
const toastManager = require('./toastManager');

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
    onClearOverlayClick: () => {
      console.log('[Main] Clear overlay triggered from menu');
      if (windowManager.hasActiveOverlays()) {
        windowManager.dismissOverlays();
      }
      // Restart idle monitoring in case it was stopped by test overlay
      idleMonitor.start();
    },
    onAlwaysOnToggle: () => {
      console.log('[Main] Always-on toggle triggered from menu');
      toggleAlwaysOnMode();
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

  // Register global hotkey for always-on mode
  registerAlwaysOnHotkey();

  // If always-on was previously enabled, activate it
  if (config.isAlwaysOnMode()) {
    if (!windowManager.hasActiveOverlays()) {
      idleMonitor.stop();
      windowManager.createOverlays(() => {
        if (!config.isAlwaysOnMode()) {
          idleMonitor.start();
        }
      });
    }
  }

  // Prompt for auto-start on first run
  if (!config.hasPromptedAutoStart()) {
    promptAutoStart();
  }
});

async function promptAutoStart() {
  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    defaultId: 0,
    title: 'Circle',
    message: 'Would you like Circle to start automatically when you log in?',
    icon: icon
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
  globalShortcut.unregisterAll();
  idleMonitor.stop();
  windowManager.destroyAll();
  trayManager.destroy();
}

let currentHotkey = null;

function registerAlwaysOnHotkey() {
  // Unregister existing hotkey if any
  if (currentHotkey) {
    globalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }

  const hotkey = config.getAlwaysOnHotkey();
  if (!hotkey) return;

  const success = globalShortcut.register(hotkey, () => {
    toggleAlwaysOnMode();
  });

  if (success) {
    currentHotkey = hotkey;
    console.log(`[Main] Registered always-on hotkey: ${hotkey}`);
  } else {
    console.log(`[Main] Failed to register hotkey: ${hotkey}`);
  }
}

function toggleAlwaysOnMode() {
  const newState = !config.isAlwaysOnMode();
  console.log(`[Main] toggleAlwaysOnMode called, newState=${newState}`);
  config.setAlwaysOnMode(newState);

  // Show toast notification
  const message = newState ? 'Always On - ENABLED' : 'Always on - DISABLED';
  toastManager.show(message);

  // Notify settings window if open
  windowManager.notifyAlwaysOnChanged(newState);

  // Update tray menu
  trayManager.updateMenu();

  if (newState) {
    // Enable: show overlays immediately
    console.log(`[Main] hasActiveOverlays=${windowManager.hasActiveOverlays()}`);
    if (!windowManager.hasActiveOverlays()) {
      idleMonitor.stop();
      console.log('[Main] Creating overlays for always-on mode');
      windowManager.createOverlays(() => {
        // Only restart idle monitor if always-on is disabled
        if (!config.isAlwaysOnMode()) {
          idleMonitor.start();
        }
      });
    }
  } else {
    // Disable: dismiss overlays and restart normal monitoring
    if (windowManager.hasActiveOverlays()) {
      windowManager.dismissOverlays();
    }
    idleMonitor.start();
  }
}

// Expose for tray menu
global.toggleAlwaysOnMode = toggleAlwaysOnMode;
global.registerAlwaysOnHotkey = registerAlwaysOnHotkey;

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
