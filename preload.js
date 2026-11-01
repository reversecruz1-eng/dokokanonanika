const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kn', {
  talk: (args) => ipcRenderer.invoke('talk', args),
  quit: () => ipcRenderer.send('quit'),
});
