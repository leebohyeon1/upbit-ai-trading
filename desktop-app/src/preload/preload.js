const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTradingState: () => ipcRenderer.invoke('get-trading-state'),
  startTrading: (tickers) => ipcRenderer.invoke('start-trading', tickers),
  stopTrading: () => ipcRenderer.invoke('stop-trading'),
  toggleAI: (enabled) => ipcRenderer.invoke('toggle-ai', enabled),
  toggleRealTrade: (enabled) => ipcRenderer.invoke('toggle-real-trade', enabled),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  saveApiKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  savePortfolio: (portfolio) => ipcRenderer.invoke('save-portfolio', portfolio),
  getPortfolio: () => ipcRenderer.invoke('get-portfolio'),
  saveAnalysisConfigs: (configs) => ipcRenderer.invoke('save-analysis-configs', configs),
  getAnalysisConfigs: () => ipcRenderer.invoke('get-analysis-configs'),
  saveTradingConfig: (config) => ipcRenderer.invoke('save-trading-config', config),
  getTradingConfig: () => ipcRenderer.invoke('get-trading-config'),
  
  onTradingStateChanged: (callback) => {
    ipcRenderer.on('trading-state-changed', (event, state) => callback(state));
  },
  
  onAnalysisUpdate: (callback) => {
    ipcRenderer.on('analysis-update', (event, analysis) => callback(analysis));
  }
});