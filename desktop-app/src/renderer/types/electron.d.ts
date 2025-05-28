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
      toggleTrading: (tradingConfig: TradingConfig, analysisConfigs: AnalysisConfig[]) => Promise<void>;
      stopTrading: () => Promise<void>;
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
      
      // Event listeners
      onApiKeyStatus: (callback: (status: ApiKeyStatus) => void) => () => void;
      onAnalysisCompleted: (callback: (analyses: Analysis[]) => void) => () => void;
      onSingleAnalysisCompleted: (callback: (analysis: Analysis) => void) => () => void;
      onTradingStateChanged: (callback: (state: TradingState) => void) => () => void;
      onLearningProgress: (callback: (states: LearningState[]) => void) => () => void;
      onLearningUpdated: (callback: (data: any) => void) => () => void;
    };
  }
}

export {};