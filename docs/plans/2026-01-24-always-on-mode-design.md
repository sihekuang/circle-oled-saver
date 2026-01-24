# Always-On Mode Design

## Overview

Add an "always on" mode that keeps the screensaver active regardless of idle state, toggled via a configurable global hotkey with visual feedback.

## Core Behavior

**Always-On Mode** is a toggle that:
- When **enabled**: Immediately shows the screensaver on all displays, ignoring idle timeout. Mouse movement and keyboard input do NOT dismiss it. Only the global hotkey or tray menu toggle turns it off.
- When **disabled**: Screensaver fades out (using existing fade-out animation), normal idle-based behavior resumes.

**State persists** across app restarts.

**Three ways to toggle:**
1. Global hotkey (works even when app is not focused)
2. Tray menu checkbox
3. Settings UI checkbox

## Global Hotkey System

**Default hotkey:** `Cmd+Alt+O` (macOS) / `Ctrl+Alt+O` (Windows/Linux)

**Registration:**
- Hotkey registers when app starts
- If the key combo is already taken by another app, registration fails silently (no crash)
- Hotkey unregisters on app quit

**Click-to-record configuration:**
- In Settings, a "Hotkey" field shows current binding (e.g., "⌘⌥O")
- User clicks the field → it shows "Press keys..."
- User presses their desired combo → it captures and saves immediately
- Escape cancels recording without changing
- A "Reset to default" button restores `Cmd/Ctrl+Alt+O`

**Validation:**
- Rejects single keys (must have at least one modifier: Cmd/Ctrl/Alt/Shift)
- Rejects reserved system shortcuts (like Cmd+Q, Cmd+Tab)

## Toast Notification

**Appearance:**
- Small, centered overlay window (roughly 200x80px)
- Semi-transparent dark background with rounded corners
- White text showing: "Always On: Enabled" or "Always On: Disabled"
- Fades in quickly (150ms), holds for 1.5 seconds, fades out (300ms)

**Technical approach:**
- Creates a small borderless, always-on-top BrowserWindow
- `transparent: true`, `frame: false`, `skipTaskbar: true`, `focusable: false`
- Click-through so it doesn't interfere with anything
- Auto-destroys after the animation completes
- Appears on the primary display only (even if multiple monitors)

**Edge cases:**
- If toggled rapidly, the existing toast is destroyed and a new one appears (no stacking)
- Toast appears even if screensaver overlays are already showing (renders above them)

## UI Integration

**Tray Menu:**
- New checkbox item: "Always On" (below the existing "Enabled" checkbox)
- Shows current hotkey in label: "Always On (⌘⌥O)"
- Checking it immediately activates always-on mode + shows toast
- Unchecking it deactivates + shows toast

**Settings Window:**
- New section in General tab: "Always On Mode"
- Contains:
  - Checkbox: "Always On" with current state
  - Hotkey field: Shows current binding, click to record new one
  - Reset button: "Reset to Default"

**Config storage** (in electron-store):
```
alwaysOnMode: false (boolean)
alwaysOnHotkey: "CommandOrControl+Alt+O" (string, Electron accelerator format)
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/main/config.js` | Add `alwaysOnMode` and `alwaysOnHotkey` to schema |
| `src/main/main.js` | Register/unregister global hotkey, handle toggle |
| `src/main/windowManager.js` | Add toast window creation, modify dismiss behavior for always-on |
| `src/main/trayManager.js` | Add "Always On" menu item with hotkey label |
| `src/main/idleMonitor.js` | Respect always-on mode (bypass idle checks) |
| `src/settings/settings.html` | Add always-on section with hotkey recorder |
| `src/settings/settings.js` | Handle hotkey recording logic |
| `src/preload/preload.js` | Expose new IPC methods for hotkey config |
| New: `src/main/toastWindow.js` | Toast window manager |
| New: `src/toast/toast.html` | Toast UI |
| New: `src/toast/toast.css` | Toast styles |
