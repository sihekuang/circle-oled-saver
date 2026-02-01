const path = require('path');
const { systemPreferences } = require('electron');

let nativeAddon = null;

// Try to load the native addon
function loadNativeAddon() {
  if (nativeAddon !== null) {
    return nativeAddon;
  }

  if (process.platform !== 'darwin') {
    nativeAddon = false;
    return false;
  }

  try {
    // Try to load the compiled native addon
    const addonPath = path.join(__dirname, '../native/build/Release/caret_tracker.node');
    nativeAddon = require(addonPath);
    console.log('[CaretTracker] Native addon loaded successfully');
    return nativeAddon;
  } catch (err) {
    console.warn('[CaretTracker] Failed to load native addon:', err.message);
    console.warn('[CaretTracker] Run "npm run build:native" to compile it');
    nativeAddon = false;
    return false;
  }
}

// Check if we have accessibility permission (uses Electron's built-in API)
function checkAccessibilityPermission() {
  if (process.platform !== 'darwin') {
    return false;
  }

  // Use Electron's API - this checks permission for the Electron app itself
  return systemPreferences.isTrustedAccessibilityClient(false);
}

// Request accessibility permission (shows system dialog)
function requestAccessibilityPermission() {
  if (process.platform !== 'darwin') {
    return false;
  }

  // Use Electron's API with prompt=true to show the system dialog
  return systemPreferences.isTrustedAccessibilityClient(true);
}

// Get the current caret position using native addon
// Returns { x, y, width, height } or null if unavailable
let lastCaretLog = 0;
function getCaretPosition() {
  if (process.platform !== 'darwin') {
    return null; // Windows implementation will be added later
  }

  const addon = loadNativeAddon();
  if (!addon) {
    return null;
  }

  try {
    const result = addon.getCaretPosition();
    // Throttle logging to every 2 seconds
    const now = Date.now();
    if (result && now - lastCaretLog > 2000) {
      console.log(`[CaretTracker] Caret at (${Math.round(result.x)}, ${Math.round(result.y)})`);
      lastCaretLog = now;
    }
    return result;
  } catch (err) {
    console.error('[CaretTracker] Error getting caret position:', err.message);
    return null;
  }
}

module.exports = {
  getCaretPosition,
  checkAccessibilityPermission,
  requestAccessibilityPermission
};
