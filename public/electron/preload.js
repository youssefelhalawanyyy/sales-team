const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
    isMaximized: () => ipcRenderer.invoke('app:isMaximized')
  },
  
  // Persistent storage
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear')
  },

  // System info
  isElectron: () => true,
  platform: process.platform,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron
});
