const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTradingState: () => ipcRenderer.invoke('get-trading-state'),
  startTrading: () => ipcRenderer.invoke('start-trading'),
  stopTrading: () => ipcRenderer.invoke('stop-trading'),
  toggleAI: (enabled) => ipcRenderer.invoke('toggle-ai', enabled),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  
  onTradingStateChanged: (callback) => {
    ipcRenderer.on('trading-state-changed', (event, state) => callback(state));
  }
});