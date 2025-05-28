const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // API Key methods
  validateApiKey: (accessKey, secretKey, claudeApiKey) => ipcRenderer.invoke('validate-api-key', accessKey, secretKey, claudeApiKey),
  
  // Account methods
  fetchAccounts: () => ipcRenderer.invoke('get-accounts'),
  
  // Market methods
  fetchMarkets: () => ipcRenderer.invoke('get-markets'),
  fetchTickers: (symbols) => ipcRenderer.invoke('get-tickers', symbols),
  getSupportedKrwCoins: () => ipcRenderer.invoke('get-supported-krw-coins'),
  
  // Trading methods
  toggleTrading: (tradingConfig, analysisConfigs) => ipcRenderer.invoke('start-trading', tradingConfig, analysisConfigs),
  stopTrading: () => ipcRenderer.invoke('stop-trading'),
  getTradingState: () => ipcRenderer.invoke('get-trading-state'),
  
  // Backtest methods
  runBacktest: (ticker, startDate, endDate, config) => ipcRenderer.invoke('run-backtest', ticker, startDate, endDate, config),
  
  // Learning methods
  toggleLearning: async (ticker, isRunning) => {
    return await ipcRenderer.invoke('toggle-learning', ticker, isRunning);
  },
  getLearningMetrics: (ticker) => ipcRenderer.invoke('get-learning-metrics', ticker),
  getLearningStatus: () => ipcRenderer.invoke('get-learning-status'),
  getLearningStates: () => ipcRenderer.invoke('get-learning-states'),
  
  // Cooldown methods
  getCooldownInfo: (market) => ipcRenderer.invoke('get-cooldown-info', market),
  
  // Weight learning methods
  getWeightLearningInfo: (market) => ipcRenderer.invoke('get-weight-learning-info', market),
  
  // Simulation methods
  getSimulationStatus: () => ipcRenderer.invoke('get-simulation-status'),
  
  // Notification methods
  getNotificationSettings: () => ipcRenderer.invoke('get-notification-settings'),
  saveNotificationSettings: (settings) => ipcRenderer.invoke('save-notification-settings', settings),
  getNotificationHistory: (limit) => ipcRenderer.invoke('get-notification-history', limit),
  clearNotificationHistory: () => ipcRenderer.invoke('clear-notification-history'),
  
  // Trade History methods
  getTradeHistory: () => ipcRenderer.invoke('get-trade-history'),
  getProfitHistory: (days) => ipcRenderer.invoke('get-profit-history', days),
  getTradingHistory: () => ipcRenderer.invoke('get-trading-history'),
  
  // Settings methods
  saveApiKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  savePortfolio: (portfolio) => ipcRenderer.invoke('save-portfolio', portfolio),
  getPortfolio: () => ipcRenderer.invoke('get-portfolio'),
  saveAnalysisConfigs: (configs) => ipcRenderer.invoke('save-analysis-configs', configs),
  getAnalysisConfigs: () => ipcRenderer.invoke('get-analysis-configs'),
  saveTradingConfig: (config) => ipcRenderer.invoke('save-trading-config', config),
  getTradingConfig: () => ipcRenderer.invoke('get-trading-config'),
  saveLearningStates: (states) => ipcRenderer.invoke('save-learning-states', states),
  getLearningStates: () => ipcRenderer.invoke('get-learning-states'),
  resetAllSettings: () => ipcRenderer.invoke('reset-all-settings'),
  
  // Event listeners
  onApiKeyStatus: (callback) => {
    ipcRenderer.on('api-key-status', (event, status) => callback(status));
    return () => ipcRenderer.removeAllListeners('api-key-status');
  },
  
  onAnalysisCompleted: (callback) => {
    ipcRenderer.on('analysis-completed', (event, analyses) => callback(analyses));
    return () => ipcRenderer.removeAllListeners('analysis-completed');
  },
  
  onSingleAnalysisCompleted: (callback) => {
    ipcRenderer.on('single-analysis-completed', (event, analysis) => callback(analysis));
    return () => ipcRenderer.removeAllListeners('single-analysis-completed');
  },
  
  onTradingStateChanged: (callback) => {
    ipcRenderer.on('trading-state-changed', (event, state) => callback(state));
    return () => ipcRenderer.removeAllListeners('trading-state-changed');
  },
  
  onLearningProgress: (callback) => {
    ipcRenderer.on('learning-progress', (event, states) => callback(states));
    return () => ipcRenderer.removeAllListeners('learning-progress');
  },
  
  onLearningUpdated: (callback) => {
    ipcRenderer.on('learning-updated', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('learning-updated');
  }
});