const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('oledSaver', {
  // Overlay APIs
  dismissOverlay: () => ipcRenderer.invoke('dismiss-overlay'),
  videoEnded: () => ipcRenderer.invoke('video-ended'),
  getNextPlaylist: () => ipcRenderer.invoke('get-next-playlist'),

  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  addPlaylist: (name, url) => ipcRenderer.invoke('add-playlist', { name, url }),
  removePlaylist: (index) => ipcRenderer.invoke('remove-playlist', index),

  // Event listeners
  onLoadVideo: (callback) => {
    ipcRenderer.on('load-video', (event, data) => callback(data));
  },
  onFadeOut: (callback) => {
    ipcRenderer.on('fade-out', () => callback());
  }
});
