const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('oledSaver', {
  // Overlay APIs
  dismissOverlay: () => ipcRenderer.invoke('dismiss-overlay'),
  getBallSize: () => ipcRenderer.invoke('get-ball-size'),
  getBallOpacity: () => ipcRenderer.invoke('get-ball-opacity'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Event listeners
  onFadeOut: (callback) => {
    ipcRenderer.on('fade-out', () => callback());
  }
});
