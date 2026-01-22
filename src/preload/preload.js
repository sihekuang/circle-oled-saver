const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('oledSaver', {
  // Overlay APIs
  dismissOverlay: () => ipcRenderer.invoke('dismiss-overlay'),
  getBallSize: () => ipcRenderer.invoke('get-ball-size'),
  getBallOpacity: () => ipcRenderer.invoke('get-ball-opacity'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getContentSettings: () => ipcRenderer.invoke('get-content-settings'),
  saveContentSettings: (settings) => ipcRenderer.invoke('save-content-settings', settings),

  // Event listeners
  onFadeOut: (callback) => {
    ipcRenderer.on('fade-out', () => callback());
  }
});
