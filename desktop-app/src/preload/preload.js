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
  startTrading: (tradingConfig, analysisConfigs) => ipcRenderer.invoke('start-trading', tradingConfig, analysisConfigs),
  stopTrading: () => ipcRenderer.invoke('stop-trading'),
  toggleTrading: (tradingConfig, analysisConfigs) => ipcRenderer.invoke('start-trading', tradingConfig, analysisConfigs),
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
  
  // Simulation methods
  resetSimulation: () => ipcRenderer.invoke('reset-simulation'),
  
  // VaR and Risk Management methods
  generateRiskReport: () => ipcRenderer.invoke('generate-risk-report'),
  
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
    console.log('[Preload] Setting up single-analysis-completed listener');
    const listener = (event, analysis) => {
      console.log('[Preload] single-analysis-completed event received:', analysis);
      callback(analysis);
    };
    ipcRenderer.on('single-analysis-completed', listener);
    return () => {
      console.log('[Preload] Removing single-analysis-completed listener');
      ipcRenderer.removeListener('single-analysis-completed', listener);
    };
  },
  
  onTradingStateChanged: (callback) => {
    console.log('[Preload] Setting up trading-state-changed listener');
    const listener = (event, state) => {
      console.log('[Preload] trading-state-changed event received:', state);
      callback(state);
    };
    ipcRenderer.on('trading-state-changed', listener);
    return () => {
      console.log('[Preload] Removing trading-state-changed listener');
      ipcRenderer.removeListener('trading-state-changed', listener);
    };
  },
  
  onLearningProgress: (callback) => {
    ipcRenderer.on('learning-progress', (event, states) => callback(states));
    return () => ipcRenderer.removeAllListeners('learning-progress');
  },
  
  onLearningUpdated: (callback) => {
    ipcRenderer.on('learning-updated', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('learning-updated');
  },
  
  onProfitUpdate: (callback) => {
    console.log('[Preload] Setting up profit-update listener');
    const listener = (event, profitHistory) => {
      console.log('[Preload] profit-update event received:', profitHistory);
      callback(profitHistory);
    };
    ipcRenderer.on('profit-update', listener);
    return () => {
      console.log('[Preload] Removing profit-update listener');
      ipcRenderer.removeListener('profit-update', listener);
    };
  },
  
  onAccountsUpdated: (callback) => {
    console.log('[Preload] Setting up accounts-updated listener');
    const listener = (event, accounts) => {
      console.log('[Preload] accounts-updated event received:', accounts);
      callback(accounts);
    };
    ipcRenderer.on('accounts-updated', listener);
    return () => {
      console.log('[Preload] Removing accounts-updated listener');
      ipcRenderer.removeListener('accounts-updated', listener);
    };
  },
  
  // Kill Switch methods
  getKillSwitchStatus: () => ipcRenderer.invoke('get-kill-switch-status'),
  activateKillSwitch: (reason) => ipcRenderer.invoke('activate-kill-switch', reason),
  deactivateKillSwitch: () => ipcRenderer.invoke('deactivate-kill-switch'),
  updateKillSwitchConfig: (config) => ipcRenderer.invoke('update-kill-switch-config', config),
  
  // 2FA methods
  get2FAStatus: () => ipcRenderer.invoke('get-2fa-status'),
  setup2FA: () => ipcRenderer.invoke('setup-2fa'),
  enable2FA: (token) => ipcRenderer.invoke('enable-2fa', token),
  disable2FA: (token) => ipcRenderer.invoke('disable-2fa', token),
  verify2FA: (token) => ipcRenderer.invoke('verify-2fa', token),
  regenerateBackupCodes: (token) => ipcRenderer.invoke('regenerate-backup-codes', token),
  
  // Multi-timeframe analysis methods
  analyzeMultiTimeframe: (params) => ipcRenderer.invoke('analyze-multi-timeframe', params),
  
  // Support/Resistance analysis methods
  analyzeSupportResistance: (params) => ipcRenderer.invoke('analyze-support-resistance', params),
  
  // Advanced indicators analysis methods
  analyzeAdvancedIndicators: (params) => ipcRenderer.invoke('analyze-advanced-indicators', params),
  
  // Trade history methods
  addTrade: (trade) => ipcRenderer.invoke('add-trade', trade),
  getTradeHistory: (options) => ipcRenderer.invoke('get-trade-history', options),
  getTradeStatistics: (period) => ipcRenderer.invoke('get-trade-statistics', period),
  getDailyPerformance: (days) => ipcRenderer.invoke('get-daily-performance', days),
  getProfitChartData: (days) => ipcRenderer.invoke('get-profit-chart-data', days),
  getPerformanceStats: (days) => ipcRenderer.invoke('get-performance-stats', days),
  
  // News API methods
  setNewsApiKeys: (keys) => ipcRenderer.invoke('set-news-api-keys', keys),
  getCryptoNews: (symbol, limit) => ipcRenderer.invoke('get-crypto-news', symbol, limit),
  analyzeMarketNews: (market) => ipcRenderer.invoke('analyze-market-news', market)
});