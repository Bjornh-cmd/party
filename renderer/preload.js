const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getConfig: () => ipcRenderer.invoke('get-config'),
    getMp3Path: () => ipcRenderer.invoke('get-mp3-path'),
    openYoutube: (url) => ipcRenderer.invoke('open-youtube', url),
    playMp3Inline: () => ipcRenderer.invoke('play-mp3-inline')
});
