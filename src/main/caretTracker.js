const { execFile } = require('child_process');
const path = require('path');
const { app, systemPreferences } = require('electron');

// Path to the caret-tracker binary
function getCaretTrackerPath() {
  if (app.isPackaged) {
    // In packaged app, binary is in Resources
    return path.join(process.resourcesPath, 'caret-tracker');
  } else {
    // In development, binary is in src/native
    return path.join(__dirname, '../native/caret-tracker');
  }
}

// Execute the caret-tracker CLI
function execCaretTracker(command) {
  return new Promise((resolve, reject) => {
    const binaryPath = getCaretTrackerPath();

    execFile(binaryPath, [command], { timeout: 1000 }, (error, stdout, stderr) => {
      if (error) {
        // Binary might not exist or not be executable
        if (error.code === 'ENOENT') {
          reject(new Error('Caret tracker binary not found. Run: npm run build:native'));
        } else {
          reject(error);
        }
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// Check if we have accessibility permission (uses Electron's built-in API)
async function checkAccessibilityPermission() {
  if (process.platform !== 'darwin') {
    return false;
  }

  // Use Electron's API - this checks permission for the Electron app itself
  return systemPreferences.isTrustedAccessibilityClient(false);
}

// Request accessibility permission (shows system dialog)
async function requestAccessibilityPermission() {
  if (process.platform !== 'darwin') {
    return false;
  }

  // Use Electron's API with prompt=true to show the system dialog
  return systemPreferences.isTrustedAccessibilityClient(true);
}

// Get the current caret position
// Returns { x, y, width, height } or null if unavailable
async function getCaretPosition() {
  if (process.platform !== 'darwin') {
    return null; // Windows implementation will be added later
  }

  try {
    const output = await execCaretTracker('get');
    const result = JSON.parse(output);

    if (result.success && result.position) {
      return result.position;
    } else {
      // Don't log every time - caret might just not be visible
      return null;
    }
  } catch (err) {
    // Only log unexpected errors
    if (!err.message.includes('not found')) {
      console.error('[CaretTracker] Error:', err.message);
    }
    return null;
  }
}

module.exports = {
  getCaretPosition,
  checkAccessibilityPermission,
  requestAccessibilityPermission
};
