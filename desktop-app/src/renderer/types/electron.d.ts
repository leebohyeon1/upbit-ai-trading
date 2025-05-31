import { 
  ApiKeyStatus, 
  Account, 
  MarketData, 
  TickerData, 
  Analysis, 
  TradingState,
  TradingConfig,
  AnalysisConfig,
  LearningState,
  BacktestResult
} from './index';

declare global {
  interface Window {
    electronAPI: {
      // API Key methods
      validateApiKey: (accessKey: string, secretKey: string, claudeApiKey?: string) => Promise<ApiKeyStatus>;
      
      // Account methods
      fetchAccounts: () => Promise<Account[]>;
      
      // Market methods
      fetchMarkets: () => Promise<MarketData[]>;
      fetchTickers: (symbols: string[]) => Promise<TickerData[]>;
      getSupportedKrwCoins: () => Promise<string[]>;
      
      // Trading methods
      startTrading: (tradingConfig: TradingConfig, analysisConfigs: AnalysisConfig[]) => Promise<boolean>;
      stopTrading: () => Promise<boolean>;
      toggleTrading: (tradingConfig: TradingConfig, analysisConfigs: AnalysisConfig[]) => Promise<void>;
      getTradingState: () => Promise<TradingState>;
      
      // Backtest methods
      runBacktest: (ticker: string, startDate: string, endDate: string, config: any) => Promise<BacktestResult>;
      
      // Learning methods
      toggleLearning: (ticker: string, isRunning: boolean) => Promise<void>;
      getLearningMetrics: (ticker: string) => Promise<any>;
      getLearningStatus: () => Promise<any>;
      getLearningStates: () => Promise<Array<{ ticker: string; isRunning: boolean }>>;
      
      // Cooldown methods
      getCooldownInfo: (market: string) => Promise<{
        buyRemaining: number;
        sellRemaining: number;
        buyTotal: number;
        sellTotal: number;
      }>;
      
      // Weight learning methods
      getWeightLearningInfo: (market: string) => Promise<{
        enabled: boolean;
        mode: 'individual' | 'category' | 'global';
        adjustments: Record<string, number>;
        performance: {
          trades: number;
          winRate: number;
          avgProfit: number;
          lastUpdated: number;
        };
      } | null>;
      
      // Simulation methods
      getSimulationStatus: () => Promise<{
        krwBalance: number;
        totalValue: number;
        profitRate: number;
        portfolio: Array<{
          market: string;
          balance: number;
          avgBuyPrice: number;
          currentPrice: number;
          profitRate: number;
          value: number;
        }>;
        recentTrades: Array<{
          market: string;
          type: 'BUY' | 'SELL';
          price: number;
          amount: number;
          volume: number;
          timestamp: number;
          krwBalance: number;
          coinBalance: number;
          profit?: number;
          profitRate?: number;
        }>;
      } | null>;
      
      // Trade History methods
      getTradeHistory: () => Promise<any[]>;
      getProfitHistory: (days?: number) => Promise<Array<{ time: string; profitRate: number; totalValue: number }>>;
      getPerformanceStats: (days: number) => Promise<{
        totalProfit: number;
        totalTrades: number;
        winRate: number;
        avgProfit: number;
      }>;
      
      // Simulation methods
      resetSimulation: () => Promise<boolean>;
      
      // VaR and Risk Management methods
      generateRiskReport: () => Promise<{
        VaR: {
          dailyVaR95: number;
          dailyVaR99: number;
          weeklyVaR95: number;
          monthlyVaR95: number;
          percentageVaR95: number;
          percentageVaR99: number;
          methodology: string;
          confidence: number;
          calculatedAt: number;
        } | null;
        CVaR: number;
        stressTest: Array<{
          scenario: string;
          loss: number;
          percentage: number;
        }>;
        recommendations: string[];
      }>;
      
      // Rebalancing methods
      getRebalancingConfig: () => Promise<{
        enabled: boolean;
        interval: number;
        threshold: number;
        minTradeAmount: number;
        targetWeights: Array<{ symbol: string; weight: number }>;
        useVaRConstraints: boolean;
        maxVaR: number;
      } | null>;
      saveRebalancingConfig: (config: any) => Promise<boolean>;
      executeRebalancing: () => Promise<{ success: boolean; trades?: any[] }>;
      simulateRebalancing: () => Promise<{
        sellOrders: any[];
        buyOrders: any[];
        estimatedFees: number;
        newVaR: number;
      } | null>;
      
      // Kill Switch methods
      getKillSwitchStatus: () => Promise<{
        isActive: boolean;
        config: any;
        history: any[];
        systemStatus: {
          dailyLoss: number;
          currentDrawdown: number;
          apiHealth: boolean;
          lastCheck: number;
        };
      }>;
      activateKillSwitch: (reason: string) => Promise<any>;
      deactivateKillSwitch: () => Promise<boolean>;
      updateKillSwitchConfig: (config: any) => Promise<boolean>;

      // Settings methods
      saveApiKeys: (keys: { accessKey: string; secretKey: string }) => Promise<void>;
      getApiKeys: () => Promise<{ accessKey: string; secretKey: string }>;
      savePortfolio: (portfolio: any[]) => Promise<void>;
      getPortfolio: () => Promise<any[]>;
      saveAnalysisConfigs: (configs: AnalysisConfig[]) => Promise<void>;
      getAnalysisConfigs: () => Promise<AnalysisConfig[]>;
      saveTradingConfig: (config: TradingConfig) => Promise<void>;
      getTradingConfig: () => Promise<TradingConfig>;
      resetAllSettings: () => Promise<void>;
      
      // 2FA methods
      get2FAStatus: () => Promise<{ isEnabled: boolean; setupComplete: boolean; backupCodesRemaining: number }>;
      setup2FA: () => Promise<{ secret: string; qrUri: string; backupCodes: string[] }>;
      enable2FA: (token: string) => Promise<boolean>;
      disable2FA: (token: string) => Promise<boolean>;
      verify2FA: (token: string) => Promise<boolean>;
      regenerateBackupCodes: (token: string) => Promise<string[]>;
      
      // Multi-timeframe analysis methods
      analyzeMultiTimeframe: (params: { symbol: string; timeframes: any[] }) => Promise<any>;
      
      // Support/Resistance analysis methods
      analyzeSupportResistance: (params: { symbol: string; timeframe?: string; period?: number }) => Promise<any>;
      
      // Advanced indicators analysis methods
      analyzeAdvancedIndicators: (params: { symbol: string; timeframe?: string; period?: number }) => Promise<any>;

      // Event listeners
      onApiKeyStatus: (callback: (status: ApiKeyStatus) => void) => () => void;
      onAnalysisCompleted: (callback: (analyses: Analysis[]) => void) => () => void;
      onSingleAnalysisCompleted: (callback: (analysis: Analysis) => void) => () => void;
      onTradingStateChanged: (callback: (state: TradingState) => void) => () => void;
      onLearningProgress: (callback: (states: LearningState[]) => void) => () => void;
      onLearningUpdated: (callback: (data: any) => void) => () => void;
      onProfitUpdate: (callback: (profitHistory: Array<{ time: string; profitRate: number; totalValue: number }>) => void) => () => void;
      onAccountsUpdated: (callback: (accounts: any[]) => void) => () => void;
    };
  }
}

export {};