# Always-On Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an always-on mode that keeps the screensaver active, toggled via configurable global hotkey with toast notification feedback.

**Architecture:** Extend config with new settings, register global hotkey in main process, create toast window module, modify idle monitor to respect always-on state, update tray menu and settings UI.

**Tech Stack:** Electron globalShortcut, BrowserWindow for toast, electron-store for persistence

---

## Task 1: Add Config Schema and Getters/Setters

**Files:**
- Modify: `src/main/config.js`

**Step 1: Add schema entries for alwaysOnMode and alwaysOnHotkey**

In `src/main/config.js`, add to the schema object (after `contentProviders`):

```javascript
  alwaysOnMode: {
    type: 'boolean',
    default: false
  },
  alwaysOnHotkey: {
    type: 'string',
    default: 'CommandOrControl+Alt+O'
  }
```

**Step 2: Add getter/setter functions**

After `setContentSettings()`, add:

```javascript
  isAlwaysOnMode() {
    return store.get('alwaysOnMode');
  },

  setAlwaysOnMode(enabled) {
    store.set('alwaysOnMode', enabled);
  },

  getAlwaysOnHotkey() {
    return store.get('alwaysOnHotkey');
  },

  setAlwaysOnHotkey(accelerator) {
    store.set('alwaysOnHotkey', accelerator);
  }
```

**Step 3: Verify changes work**

Run: `npm start`
Expected: App starts without errors

**Step 4: Commit**

```bash
git add src/main/config.js
git commit -m "feat: add alwaysOnMode and alwaysOnHotkey config"
```

---

## Task 2: Create Toast Window Module

**Files:**
- Create: `src/main/toastManager.js`
- Create: `src/toast/toast.html`
- Create: `src/toast/toast.css`

**Step 1: Create toast HTML**

Create `src/toast/toast.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="toast.css">
</head>
<body>
  <div class="toast" id="toast">
    <span id="message">Always On: Enabled</span>
  </div>
  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('show-toast', (event, message) => {
      document.getElementById('message').textContent = message;
      document.getElementById('toast').classList.add('visible');
    });
  </script>
</body>
</html>
```

**Step 2: Create toast CSS**

Create `src/toast/toast.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  background: transparent;
  overflow: hidden;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 80px;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.toast.visible {
  opacity: 1;
  transform: scale(1);
}

#message {
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}
```

**Step 3: Create toast manager module**

Create `src/main/toastManager.js`:

```javascript
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
      width: 200,
      height: 80,
      x: Math.round((width - 200) / 2),
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
```

**Step 4: Verify toast renders**

Run: `npm start`
(We'll test it properly after integrating with the hotkey)

**Step 5: Commit**

```bash
git add src/main/toastManager.js src/toast/toast.html src/toast/toast.css
git commit -m "feat: add toast notification window"
```

---

## Task 3: Register Global Hotkey and Toggle Logic

**Files:**
- Modify: `src/main/main.js`

**Step 1: Import required modules**

At the top of `src/main/main.js`, update the require to include `globalShortcut`:

```javascript
const { app, dialog, nativeImage, globalShortcut } = require('electron');
```

Also add:

```javascript
const toastManager = require('./toastManager');
```

**Step 2: Add hotkey registration function**

After the `cleanup()` function, add:

```javascript
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
  config.setAlwaysOnMode(newState);

  // Show toast notification
  const message = newState ? 'Always On: Enabled' : 'Always On: Disabled';
  toastManager.show(message);

  // Update tray menu
  trayManager.updateMenu();

  if (newState) {
    // Enable: show overlays immediately
    if (!windowManager.hasActiveOverlays()) {
      idleMonitor.stop();
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
```

**Step 3: Export toggleAlwaysOnMode for tray menu use**

Make the function available to other modules. After `module.exports` at the bottom (or create it if not present):

Actually, since main.js doesn't export anything, we need a different approach. Add this after the toggleAlwaysOnMode function:

```javascript
// Expose for tray menu
global.toggleAlwaysOnMode = toggleAlwaysOnMode;
```

**Step 4: Call registerAlwaysOnHotkey in app.ready**

Inside the `app.on('ready', async () => {` block, after `idleMonitor.start();`, add:

```javascript
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
```

**Step 5: Unregister hotkey on quit**

Update the `cleanup()` function:

```javascript
function cleanup() {
  globalShortcut.unregisterAll();
  idleMonitor.stop();
  windowManager.destroyAll();
  trayManager.destroy();
}
```

**Step 6: Export registerAlwaysOnHotkey for settings to call when hotkey changes**

Add after the global.toggleAlwaysOnMode line:

```javascript
global.registerAlwaysOnHotkey = registerAlwaysOnHotkey;
```

**Step 7: Verify hotkey works**

Run: `npm start`
Press: Cmd+Alt+O (or Ctrl+Alt+O on Windows)
Expected: Toast shows "Always On: Enabled", screensaver appears
Press again: Toast shows "Always On: Disabled", screensaver dismisses

**Step 8: Commit**

```bash
git add src/main/main.js
git commit -m "feat: register global hotkey for always-on toggle"
```

---

## Task 4: Update Idle Monitor to Respect Always-On Mode

**Files:**
- Modify: `src/main/idleMonitor.js`

**Step 1: Modify checkIdleState to skip dismiss when always-on**

In `checkIdleState()`, update the active detection block. Replace:

```javascript
    } else {
      // Screensaver is active, check if user became active
      // If idle time drops significantly (user input detected)
      if (idleTimeSeconds < 2) {
        this.isScreensaverActive = false;
        this.emit('active');
      }
    }
```

With:

```javascript
    } else {
      // Screensaver is active, check if user became active
      // If idle time drops significantly (user input detected)
      // BUT ignore if always-on mode is enabled
      if (idleTimeSeconds < 2 && !config.isAlwaysOnMode()) {
        this.isScreensaverActive = false;
        this.emit('active');
      }
    }
```

**Step 2: Verify always-on blocks dismiss**

Run: `npm start`
Press: Cmd+Alt+O to enable always-on
Move mouse: Screensaver should NOT dismiss
Press: Cmd+Alt+O to disable
Expected: Screensaver dismisses

**Step 3: Commit**

```bash
git add src/main/idleMonitor.js
git commit -m "feat: idle monitor respects always-on mode"
```

---

## Task 5: Update Tray Menu with Always-On Toggle

**Files:**
- Modify: `src/main/trayManager.js`

**Step 1: Add helper function to format hotkey for display**

At the top of the file, after the requires, add:

```javascript
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
```

**Step 2: Add Always On menu item**

In `updateMenu()`, after the Enabled checkbox and before the separator, add a new menu item. The menu template should become:

```javascript
  updateMenu() {
    const enabled = config.isEnabled();
    const alwaysOn = config.isAlwaysOnMode();
    const hotkeyLabel = formatHotkey(config.getAlwaysOnHotkey());

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
      {
        label: `Always On${hotkeyLabel ? ' (' + hotkeyLabel + ')' : ''}`,
        type: 'checkbox',
        checked: alwaysOn,
        click: () => {
          if (global.toggleAlwaysOnMode) {
            global.toggleAlwaysOnMode();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Test Overlay (Debug)',
        click: () => {
          if (this.onTestOverlayClick) {
            this.onTestOverlayClick();
          }
        }
      },
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
```

**Step 3: Verify tray menu toggle works**

Run: `npm start`
Right-click tray icon
Expected: See "Always On (⌘⌥O)" menu item
Click it: Toast appears, screensaver shows
Click again: Toast appears, screensaver dismisses

**Step 4: Commit**

```bash
git add src/main/trayManager.js
git commit -m "feat: add always-on toggle to tray menu"
```

---

## Task 6: Add Settings UI for Always-On Mode

**Files:**
- Modify: `src/settings/settings.html`
- Modify: `src/settings/settings.css`
- Modify: `src/settings/settings.js`
- Modify: `src/preload/preload.js`
- Modify: `src/main/windowManager.js`

**Step 1: Add IPC handlers for always-on settings**

In `src/main/windowManager.js`, in `setupSettingsIPC()`, add these handlers:

After `ipcMain.removeHandler('save-content-settings');`, add:

```javascript
    ipcMain.removeHandler('get-always-on-hotkey');
    ipcMain.removeHandler('set-always-on-hotkey');
```

After `ipcMain.handle('save-content-settings', ...)`, add:

```javascript
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
```

Also update `get-settings` handler to include always-on settings:

```javascript
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
        alwaysOnHotkey: config.getAlwaysOnHotkey()
      };
    });
```

Update `save-settings` handler to include always-on mode:

After the `settings.theme` block, add:

```javascript
      if (settings.alwaysOnMode !== undefined) {
        config.setAlwaysOnMode(settings.alwaysOnMode);
      }
```

**Step 2: Add preload API**

In `src/preload/preload.js`, add these to the exposed API:

```javascript
  getAlwaysOnHotkey: () => ipcRenderer.invoke('get-always-on-hotkey'),
  setAlwaysOnHotkey: (accelerator) => ipcRenderer.invoke('set-always-on-hotkey', accelerator),
```

**Step 3: Add HTML for always-on settings section**

In `src/settings/settings.html`, after the "Start at login" section (around line 97), add:

```html
      <section class="setting-group">
        <h3 style="margin-top: 0;">Always On Mode</h3>
        <label class="toggle-label" style="margin-bottom: 16px;">
          <span>Always On</span>
          <input type="checkbox" id="always-on-mode">
          <span class="toggle-slider"></span>
        </label>
        <label for="always-on-hotkey">Hotkey</label>
        <div class="hotkey-input-group">
          <div class="hotkey-display" id="hotkey-display" tabindex="0">
            <span id="hotkey-text">Loading...</span>
          </div>
          <button type="button" id="hotkey-reset" class="hotkey-reset-btn">Reset</button>
        </div>
        <p class="info-text" id="hotkey-hint">Click to record new hotkey</p>
      </section>
```

**Step 4: Add CSS for hotkey input**

In `src/settings/settings.css`, add at the end:

```css
/* Hotkey input */
.hotkey-input-group {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.hotkey-display {
  flex: 1;
  padding: 10px 14px;
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: center;
}

.hotkey-display:hover {
  border-color: #666;
}

.hotkey-display:focus {
  outline: none;
  border-color: #4CAF50;
}

.hotkey-display.recording {
  border-color: #ff9800;
  background: #3a3020;
}

.hotkey-display.recording #hotkey-text {
  color: #ff9800;
}

.hotkey-reset-btn {
  padding: 10px 16px;
  background: #444;
  border: none;
  border-radius: 6px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.hotkey-reset-btn:hover {
  background: #555;
}
```

**Step 5: Add JavaScript for hotkey recording**

In `src/settings/settings.js`, add the always-on elements at the top with other element refs:

```javascript
const alwaysOnCheckbox = document.getElementById('always-on-mode');
const hotkeyDisplay = document.getElementById('hotkey-display');
const hotkeyText = document.getElementById('hotkey-text');
const hotkeyReset = document.getElementById('hotkey-reset');
const hotkeyHint = document.getElementById('hotkey-hint');
```

Add helper function to format accelerator for display:

```javascript
function formatAcceleratorForDisplay(accelerator) {
  if (!accelerator) return 'Not set';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return accelerator
    .replace('CommandOrControl', isMac ? '\u2318' : 'Ctrl')
    .replace('Command', '\u2318')
    .replace('Control', 'Ctrl')
    .replace('Alt', isMac ? '\u2325' : 'Alt')
    .replace('Shift', isMac ? '\u21E7' : 'Shift')
    .replace(/\+/g, ' + ');
}
```

Add hotkey recording state and logic:

```javascript
let isRecordingHotkey = false;

function startHotkeyRecording() {
  isRecordingHotkey = true;
  hotkeyDisplay.classList.add('recording');
  hotkeyText.textContent = 'Press keys...';
  hotkeyHint.textContent = 'Press Escape to cancel';
}

function stopHotkeyRecording() {
  isRecordingHotkey = false;
  hotkeyDisplay.classList.remove('recording');
  hotkeyHint.textContent = 'Click to record new hotkey';
}

function keyEventToAccelerator(e) {
  const parts = [];

  if (e.metaKey) parts.push('Command');
  if (e.ctrlKey) parts.push('Control');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  // Get the key, excluding modifier keys themselves
  const key = e.key;
  if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
    // Convert to Electron accelerator format
    if (key.length === 1) {
      parts.push(key.toUpperCase());
    } else if (key.startsWith('F') && key.length <= 3) {
      parts.push(key); // F1-F12
    } else {
      // Map other keys
      const keyMap = {
        'ArrowUp': 'Up',
        'ArrowDown': 'Down',
        'ArrowLeft': 'Left',
        'ArrowRight': 'Right',
        'Escape': 'Escape',
        'Enter': 'Return',
        'Backspace': 'Backspace',
        'Delete': 'Delete',
        'Tab': 'Tab',
        'Home': 'Home',
        'End': 'End',
        'PageUp': 'PageUp',
        'PageDown': 'PageDown',
        ' ': 'Space'
      };
      if (keyMap[key]) {
        parts.push(keyMap[key]);
      }
    }
  }

  return parts.join('+');
}

function isValidHotkey(accelerator) {
  // Must have at least one modifier
  const hasModifier = accelerator.includes('Command') ||
                      accelerator.includes('Control') ||
                      accelerator.includes('Alt') ||
                      accelerator.includes('Shift');

  // Must have a non-modifier key
  const parts = accelerator.split('+');
  const hasKey = parts.some(p => !['Command', 'Control', 'Alt', 'Shift'].includes(p));

  // Reject some reserved shortcuts
  const reserved = ['Command+Q', 'Command+W', 'Command+Tab', 'Control+Alt+Delete'];
  const isReserved = reserved.some(r => accelerator.includes(r));

  return hasModifier && hasKey && !isReserved;
}

hotkeyDisplay.addEventListener('click', () => {
  if (!isRecordingHotkey) {
    startHotkeyRecording();
  }
});

hotkeyDisplay.addEventListener('keydown', async (e) => {
  if (!isRecordingHotkey) return;

  e.preventDefault();
  e.stopPropagation();

  // Escape cancels
  if (e.key === 'Escape') {
    stopHotkeyRecording();
    const currentHotkey = await window.oledSaver.getAlwaysOnHotkey();
    hotkeyText.textContent = formatAcceleratorForDisplay(currentHotkey);
    return;
  }

  const accelerator = keyEventToAccelerator(e);

  if (isValidHotkey(accelerator)) {
    // Use CommandOrControl for cross-platform
    const normalized = accelerator.replace('Command', 'CommandOrControl').replace('Control', 'CommandOrControl');
    // Remove duplicate CommandOrControl
    const final = normalized.replace('CommandOrControl+CommandOrControl', 'CommandOrControl');

    await window.oledSaver.setAlwaysOnHotkey(final);
    hotkeyText.textContent = formatAcceleratorForDisplay(final);
    stopHotkeyRecording();
  }
});

hotkeyDisplay.addEventListener('blur', async () => {
  if (isRecordingHotkey) {
    stopHotkeyRecording();
    const currentHotkey = await window.oledSaver.getAlwaysOnHotkey();
    hotkeyText.textContent = formatAcceleratorForDisplay(currentHotkey);
  }
});

hotkeyReset.addEventListener('click', async () => {
  const defaultHotkey = 'CommandOrControl+Alt+O';
  await window.oledSaver.setAlwaysOnHotkey(defaultHotkey);
  hotkeyText.textContent = formatAcceleratorForDisplay(defaultHotkey);
});

alwaysOnCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ alwaysOnMode: alwaysOnCheckbox.checked });
});
```

Update `loadSettings()` to load always-on settings. Add after theme loading:

```javascript
  // Always On settings
  alwaysOnCheckbox.checked = settings.alwaysOnMode || false;
  hotkeyText.textContent = formatAcceleratorForDisplay(settings.alwaysOnHotkey);
```

**Step 6: Verify settings UI works**

Run: `npm start`
Open Settings
Expected: See "Always On Mode" section with toggle and hotkey field
Click hotkey field: Shows "Press keys..."
Press Cmd+Shift+A: Updates to show new hotkey
Click Reset: Reverts to ⌘⌥O

**Step 7: Commit**

```bash
git add src/main/windowManager.js src/preload/preload.js src/settings/settings.html src/settings/settings.css src/settings/settings.js
git commit -m "feat: add always-on settings UI with hotkey recorder"
```

---

## Task 7: Final Testing and Cleanup

**Step 1: Full integration test**

Run: `npm start`

Test scenarios:
1. Press Cmd+Alt+O: Toast shows "Enabled", screensaver appears, doesn't dismiss on mouse move
2. Press Cmd+Alt+O again: Toast shows "Disabled", screensaver dismisses
3. Toggle via tray menu: Same behavior as hotkey
4. Change hotkey in settings: New hotkey works, old hotkey doesn't
5. Toggle via settings checkbox: Works (note: no toast in this case, that's OK)
6. Quit and restart with always-on enabled: Screensaver shows on startup

**Step 2: Commit final state**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: address integration issues"
```

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `src/main/config.js` | Add schema + getters/setters |
| `src/main/main.js` | Add hotkey registration + toggle logic |
| `src/main/windowManager.js` | Add IPC handlers for hotkey settings |
| `src/main/idleMonitor.js` | Skip dismiss when always-on |
| `src/main/trayManager.js` | Add always-on menu item |
| `src/main/toastManager.js` | NEW - Toast window manager |
| `src/toast/toast.html` | NEW - Toast UI |
| `src/toast/toast.css` | NEW - Toast styles |
| `src/settings/settings.html` | Add always-on section |
| `src/settings/settings.css` | Add hotkey input styles |
| `src/settings/settings.js` | Add hotkey recording logic |
| `src/preload/preload.js` | Add hotkey IPC methods |
