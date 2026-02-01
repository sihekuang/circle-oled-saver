# Proximity Fade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the bouncing circle gradually fade when it gets close to the cursor, preventing distraction while working.

**Architecture:** Track mouse cursor position in the overlay renderer, calculate distance between cursor and ball center on each frame, modulate ball opacity based on proximity. Settings stored in electron-store, exposed via IPC.

**Tech Stack:** Electron, electron-store, Canvas API, existing IPC patterns

---

## Task 1: Add Proximity Fade Schema to Config

**Files:**
- Modify: `src/main/config.js:72-79` (after alwaysOnMode)

**Step 1: Add schema entries**

Add after line 79 (after `alwaysOnHotkey`):

```javascript
  proximityFadeEnabled: {
    type: 'boolean',
    default: true
  },
  proximityFadeRadius: {
    type: 'number',
    default: 150,
    minimum: 50,
    maximum: 500
  }
```

**Step 2: Add getter/setter methods**

Add after `setAlwaysOnHotkey` method (after line 205):

```javascript
  isProximityFadeEnabled() {
    return store.get('proximityFadeEnabled');
  },

  setProximityFadeEnabled(enabled) {
    store.set('proximityFadeEnabled', enabled);
  },

  getProximityFadeRadius() {
    return store.get('proximityFadeRadius');
  },

  setProximityFadeRadius(pixels) {
    store.set('proximityFadeRadius', pixels);
  }
```

**Step 3: Test manually**

Run: `npm start`
Expected: App starts without errors

**Step 4: Commit**

```bash
git add src/main/config.js
git commit -m "feat: add proximity fade config schema and methods"
```

---

## Task 2: Add IPC Handlers for Proximity Settings

**Files:**
- Modify: `src/main/windowManager.js:225-239` (get-settings handler)
- Modify: `src/main/windowManager.js:241-276` (save-settings handler)
- Modify: `src/preload/preload.js:12-13` (add getters)

**Step 1: Update get-settings handler**

In `setupSettingsIPC`, update the `get-settings` handler to include proximity settings. Add to the return object (after line 237):

```javascript
        proximityFadeEnabled: config.isProximityFadeEnabled(),
        proximityFadeRadius: config.getProximityFadeRadius()
```

**Step 2: Update save-settings handler**

In the `save-settings` handler, add handling for new settings (after line 272):

```javascript
      if (settings.proximityFadeEnabled !== undefined) {
        config.setProximityFadeEnabled(settings.proximityFadeEnabled);
      }
      if (settings.proximityFadeRadius !== undefined) {
        config.setProximityFadeRadius(settings.proximityFadeRadius);
      }
```

**Step 3: Add overlay getters to preload**

Add to `src/preload/preload.js` after `getBallSpeed` (line 9):

```javascript
  getProximityFadeEnabled: () => ipcRenderer.invoke('get-proximity-fade-enabled'),
  getProximityFadeRadius: () => ipcRenderer.invoke('get-proximity-fade-radius'),
```

**Step 4: Add overlay IPC handlers**

In `setupOverlayIPC` in windowManager.js, add handlers (after line 106):

```javascript
    ipcMain.removeHandler('get-proximity-fade-enabled');
    ipcMain.removeHandler('get-proximity-fade-radius');

    ipcMain.handle('get-proximity-fade-enabled', () => {
      return config.isProximityFadeEnabled();
    });

    ipcMain.handle('get-proximity-fade-radius', () => {
      return config.getProximityFadeRadius();
    });
```

**Step 5: Test manually**

Run: `npm start`
Expected: App starts, settings window loads without errors

**Step 6: Commit**

```bash
git add src/main/windowManager.js src/preload/preload.js
git commit -m "feat: add IPC handlers for proximity fade settings"
```

---

## Task 3: Add Cursor Tracking and Proximity Logic to Overlay

**Files:**
- Modify: `src/overlay/overlay.js`

**Step 1: Add module-level variables for cursor tracking**

Add after line 10 (after `lastFrameTime`):

```javascript
// Proximity fade settings
let proximityFadeEnabled = true;
let proximityFadeRadius = 150;
let cursorX = -1000; // Off-screen initially
let cursorY = -1000;
let lastCursorLogTime = 0;
```

**Step 2: Add cursor tracking event listener**

Add after the resize event listener (after line 34):

```javascript
// Track cursor position for proximity fade
document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;

  // Throttled logging (every 2 seconds max)
  const now = Date.now();
  if (now - lastCursorLogTime > 2000) {
    console.log(`[ProximityFade] Cursor at (${cursorX}, ${cursorY})`);
    lastCursorLogTime = now;
  }
});
```

**Step 3: Add proximity opacity calculation method to BouncingBall**

Add after `limitSpeed()` method (after line 67):

```javascript
  calculateProximityOpacity() {
    if (!proximityFadeEnabled) {
      return 1.0;
    }

    // Calculate distance from ball center to cursor
    const dx = this.x - cursorX;
    const dy = this.y - cursorY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If outside fade radius, full opacity
    if (distance >= proximityFadeRadius) {
      return 1.0;
    }

    // Linear interpolation: closer = more transparent
    const opacity = distance / proximityFadeRadius;

    // Log when entering/exiting fade zone (throttled)
    const now = Date.now();
    if (now - lastCursorLogTime > 500) {
      if (opacity < 1.0) {
        console.log(`[ProximityFade] Circle in fade zone - distance: ${Math.round(distance)}px, opacity: ${opacity.toFixed(2)}`);
      }
      lastCursorLogTime = now;
    }

    return opacity;
  }
```

**Step 4: Modify draw() to apply proximity opacity**

Update the `draw()` method. Change line 176 from:
```javascript
          opacity: ballOpacityPercentage / 100
```
to:
```javascript
          opacity: (ballOpacityPercentage / 100) * this.calculateProximityOpacity()
```

**Step 5: Update legacy draw methods**

In `drawGradient()` (line 193), change:
```javascript
    const opacity = ballOpacityPercentage / 100;
```
to:
```javascript
    const opacity = (ballOpacityPercentage / 100) * this.calculateProximityOpacity();
```

In `drawWithContent()` (line 212), change:
```javascript
    const opacity = ballOpacityPercentage / 100;
```
to:
```javascript
    const opacity = (ballOpacityPercentage / 100) * this.calculateProximityOpacity();
```

**Step 6: Load proximity settings in init()**

In the `init()` function, after loading ballSpeedPercentage (after line 372), add:

```javascript
    proximityFadeEnabled = await window.oledSaver.getProximityFadeEnabled();
    proximityFadeRadius = await window.oledSaver.getProximityFadeRadius();
    console.log('[Overlay] Proximity fade settings loaded:', { proximityFadeEnabled, proximityFadeRadius });
```

**Step 7: Handle settings changes**

In the `onSettingsChanged` handler (after line 463), add:

```javascript
  if (settings.proximityFadeEnabled !== undefined) {
    proximityFadeEnabled = settings.proximityFadeEnabled;
    console.log('[Overlay] Proximity fade enabled:', proximityFadeEnabled);
  }
  if (settings.proximityFadeRadius !== undefined) {
    proximityFadeRadius = settings.proximityFadeRadius;
    console.log('[Overlay] Proximity fade radius:', proximityFadeRadius);
  }
```

**Step 8: Test manually**

Run: `npm start`
- Trigger the overlay (wait for idle or use hotkey)
- Move cursor near the circle
- Expected: Circle fades as cursor approaches, logs appear in DevTools

**Step 9: Commit**

```bash
git add src/overlay/overlay.js
git commit -m "feat: add cursor tracking and proximity fade logic"
```

---

## Task 4: Add Settings UI for Proximity Fade

**Files:**
- Modify: `src/settings/settings.html:89-97` (after theme section, before launch at login)
- Modify: `src/settings/settings.js`

**Step 1: Add HTML for proximity fade settings**

Add after the theme section (after line 89, before the "Start at login" section):

```html
      <section class="setting-group">
        <h3 style="margin-top: 0;">Proximity Fade</h3>
        <label class="toggle-label" style="margin-bottom: 16px;">
          <span>Fade near cursor</span>
          <input type="checkbox" id="proximity-fade-enabled" checked>
          <span class="toggle-slider"></span>
        </label>
        <label for="proximity-fade-radius">Fade distance</label>
        <div class="timeout-input">
          <input type="range" id="proximity-fade-radius" min="50" max="500" step="10" value="150">
          <input type="number" id="proximity-fade-radius-value" min="50" max="500" step="10" value="150"> px
        </div>
      </section>
```

**Step 2: Add element references in settings.js**

Add after line 18 (after `hotkeyHint`):

```javascript
const proximityFadeEnabledCheckbox = document.getElementById('proximity-fade-enabled');
const proximityFadeRadiusSlider = document.getElementById('proximity-fade-radius');
const proximityFadeRadiusValueInput = document.getElementById('proximity-fade-radius-value');
```

**Step 3: Load proximity settings in loadSettings()**

In `loadSettings()`, add after line 191 (after loading alwaysOnHotkey):

```javascript
  // Proximity fade settings
  proximityFadeEnabledCheckbox.checked = settings.proximityFadeEnabled !== false;
  proximityFadeRadiusSlider.value = settings.proximityFadeRadius || 150;
  proximityFadeRadiusValueInput.value = settings.proximityFadeRadius || 150;
```

**Step 4: Add save function for proximity fade radius**

Add after `saveBallSpeed` function (after line 271):

```javascript
async function saveProximityFadeRadius(pixels) {
  pixels = Math.max(50, Math.min(500, parseInt(pixels) || 150));
  proximityFadeRadiusSlider.value = pixels;
  proximityFadeRadiusValueInput.value = pixels;
  await window.oledSaver.saveSettings({ proximityFadeRadius: pixels });
}
```

**Step 5: Add event listeners for proximity fade controls**

Add after the ballSpeedValueInput event listeners (after line 373):

```javascript
// Proximity fade event listeners
proximityFadeEnabledCheckbox.addEventListener('change', async () => {
  await window.oledSaver.saveSettings({ proximityFadeEnabled: proximityFadeEnabledCheckbox.checked });
});

proximityFadeRadiusSlider.addEventListener('input', () => {
  proximityFadeRadiusValueInput.value = proximityFadeRadiusSlider.value;
});

proximityFadeRadiusSlider.addEventListener('change', async () => {
  await saveProximityFadeRadius(proximityFadeRadiusSlider.value);
});

proximityFadeRadiusValueInput.addEventListener('change', async () => {
  await saveProximityFadeRadius(proximityFadeRadiusValueInput.value);
});
```

**Step 6: Test manually**

Run: `npm start`
- Open settings from tray
- Verify "Proximity Fade" section appears
- Toggle the checkbox - should save
- Adjust slider - should update value and save
- Trigger overlay and test that settings take effect

**Step 7: Commit**

```bash
git add src/settings/settings.html src/settings/settings.js
git commit -m "feat: add proximity fade settings UI"
```

---

## Task 5: Final Testing and Polish

**Step 1: Full integration test**

Run: `npm start`
1. Open settings, verify proximity fade section shows with defaults (enabled, 150px)
2. Trigger overlay
3. Move cursor toward circle - verify gradual fade
4. Move cursor away - verify opacity returns
5. Check DevTools console for proximity logs
6. Disable proximity fade in settings
7. Verify circle no longer fades near cursor
8. Re-enable, change radius to 300px
9. Verify larger fade zone takes effect

**Step 2: Commit final state**

```bash
git add -A
git commit -m "feat: complete proximity fade feature with cursor tracking and settings UI"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Config schema | config.js |
| 2 | IPC handlers | windowManager.js, preload.js |
| 3 | Cursor tracking & fade logic | overlay.js |
| 4 | Settings UI | settings.html, settings.js |
| 5 | Integration testing | - |
