const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spectraAPI', {
    toggleGhostMode: () => ipcRenderer.send('toggle-ghost-mode'),
    panicCloak: () => ipcRenderer.send('panic-cloak'),
    setOpacity: (opacity) => ipcRenderer.send('set-opacity', opacity),
    captureScreen: () => ipcRenderer.invoke('capture-screen'),
    openMoveOverlay: () => ipcRenderer.send('open-move-overlay'),
    closeMoveOverlay: () => ipcRenderer.send('close-move-overlay'),
    selectLocation: (location) => ipcRenderer.send('select-location', location),
    getLocation: () => ipcRenderer.invoke('get-location'),
    setPrivateMode: (enabled) => ipcRenderer.send('set-private-mode', enabled),
    getPrivateMode: () => ipcRenderer.invoke('get-private-mode'),
    closeApp: () => ipcRenderer.send('close-app'),
    minimizeApp: () => ipcRenderer.send('minimize-app')
});
