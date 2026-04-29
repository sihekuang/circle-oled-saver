const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('oledSaver', {
  // Overlay APIs
  dismissOverlay: () => ipcRenderer.invoke('dismiss-overlay'),
  getBallSizeMode: () => ipcRenderer.invoke('get-ball-size-mode'),
  getBallSize: () => ipcRenderer.invoke('get-ball-size'),
  getBallOpacity: () => ipcRenderer.invoke('get-ball-opacity'),
  getBallSpeed: () => ipcRenderer.invoke('get-ball-speed'),
  getProximityFadeEnabled: () => ipcRenderer.invoke('get-proximity-fade-enabled'),
  getProximityFadeRadius: () => ipcRenderer.invoke('get-proximity-fade-radius'),
  getCaretPosition: () => ipcRenderer.invoke('get-caret-position'),
  checkAccessibilityPermission: () => ipcRenderer.invoke('check-accessibility-permission'),
  requestAccessibilityPermission: () => ipcRenderer.invoke('request-accessibility-permission'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getContentSettings: () => ipcRenderer.invoke('get-content-settings'),
  saveContentSettings: (settings) => ipcRenderer.invoke('save-content-settings', settings),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  saveTheme: (themeId) => ipcRenderer.invoke('save-theme', themeId),
  getAlwaysOnHotkey: () => ipcRenderer.invoke('get-always-on-hotkey'),
  setAlwaysOnHotkey: (accelerator) => ipcRenderer.invoke('set-always-on-hotkey', accelerator),
  toggleAlwaysOn: () => ipcRenderer.invoke('toggle-always-on'),

  // Event listeners
  onFadeOut: (callback) => {
    ipcRenderer.on('fade-out', () => callback());
  },
  onAlwaysOnChanged: (callback) => {
    ipcRenderer.on('always-on-changed', (event, newState) => callback(newState));
  },
  onSettingsChanged: (callback) => {
    ipcRenderer.on('settings-changed', (event, settings) => callback(settings));
  }
});
