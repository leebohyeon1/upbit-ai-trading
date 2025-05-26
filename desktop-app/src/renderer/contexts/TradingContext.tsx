import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  TradingState,
  TradingConfig,
  AnalysisConfig,
  Analysis,
  Account,
  MarketData,
  TickerData,
  ApiKeyStatus,
  PortfolioCoin,
  LearningState
} from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { useElectronAPI } from '../hooks/useElectronAPI';

interface TradingContextType {
  // States
  tradingState: TradingState;
  tradingConfig: TradingConfig;
  analysisConfigs: AnalysisConfig[];
  portfolio: PortfolioCoin[];
  analyses: Analysis[];
  accounts: Account[];
  markets: MarketData[];
  tickers: TickerData[];
  apiKeyStatus: ApiKeyStatus;
  learningStates: LearningState[];
  
  // Actions
  updateTradingConfig: (config: TradingConfig) => void;
  updateAnalysisConfigs: (configs: AnalysisConfig[]) => void;
  updatePortfolio: (portfolio: PortfolioCoin[]) => void;
  toggleTrading: () => Promise<void>;
  validateApiKey: (accessKey: string, secretKey: string) => Promise<ApiKeyStatus>;
  fetchAccounts: () => Promise<Account[]>;
  fetchMarkets: () => Promise<MarketData[]>;
  fetchTickers: (symbols: string[]) => Promise<TickerData[]>;
  toggleLearning: (ticker: string, isRunning: boolean) => Promise<void>;
}

const TradingContext = createContext<TradingContextType | null>(null);

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return context;
};

interface TradingProviderProps {
  children: React.ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const electronAPI = useElectronAPI();
  
  // States
  const [tradingConfig, setTradingConfig] = useState<TradingConfig>({
    buyRatio: DEFAULT_CONFIG.BUY_RATIO,
    sellRatio: DEFAULT_CONFIG.SELL_RATIO,
    maxInvestmentPerCoin: DEFAULT_CONFIG.MAX_INVESTMENT_PER_COIN,
    enableRealTrading: false,
    dynamicConfidence: true,
    riskLevel: 3,
    useKellyCriterion: false,
    volatilityWindow: 20,
    correlationThreshold: 0.7,
    minConfidenceForBuy: DEFAULT_CONFIG.MIN_CONFIDENCE_BUY,
    minConfidenceForSell: DEFAULT_CONFIG.MIN_CONFIDENCE_SELL,
    confidenceWindowSize: 10,
    decisionThresholds: {
      buyThreshold: 0.15,
      sellThreshold: -0.2
    },
    scores: {
      rsi: 1.0,
      bollinger: 1.0,
      volume: 0.8,
      trend: 0.9,
      volatility: 0.7,
      orderbook: 0.6,
      whaleDetection: 0.5,
      atr: 0.8,
      marketSentiment: 0.7,
      kimchiPremium: 0.6
    },
    useAI: false,
    aiProvider: 'claude',
    tradingSettings: {
      buying: {
        defaultBuyRatio: DEFAULT_CONFIG.BUY_RATIO,
        confidenceBasedAdjustment: true,
        highConfidenceMultiplier: 1.8,
        lowConfidenceMultiplier: 0.6
      },
      selling: {
        defaultSellRatio: DEFAULT_CONFIG.SELL_RATIO,
        confidenceBasedAdjustment: true,
        highConfidenceMultiplier: 1.5,
        lowConfidenceMultiplier: 0.7
      }
    }
  });

  const [analysisConfigs, setAnalysisConfigs] = useState<AnalysisConfig[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioCoin[]>([]);

  // Actions
  const updateTradingConfig = useCallback((config: TradingConfig) => {
    setTradingConfig(config);
  }, []);

  const updateAnalysisConfigs = useCallback((configs: AnalysisConfig[]) => {
    setAnalysisConfigs(configs);
  }, []);

  const updatePortfolio = useCallback((newPortfolio: PortfolioCoin[]) => {
    setPortfolio(newPortfolio);
  }, []);

  const toggleTrading = useCallback(async () => {
    await electronAPI.toggleTrading(tradingConfig, analysisConfigs);
  }, [electronAPI, tradingConfig, analysisConfigs]);

  // Load saved configurations on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load saved portfolio
        const savedPortfolio = localStorage.getItem('portfolio');
        if (savedPortfolio) {
          setPortfolio(JSON.parse(savedPortfolio));
        }

        // Load saved trading config
        const savedConfig = localStorage.getItem('tradingConfig');
        if (savedConfig) {
          setTradingConfig(JSON.parse(savedConfig));
        }

        // Load saved analysis configs
        const savedAnalysisConfigs = localStorage.getItem('analysisConfigs');
        if (savedAnalysisConfigs) {
          setAnalysisConfigs(JSON.parse(savedAnalysisConfigs));
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Save configurations when they change
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('tradingConfig', JSON.stringify(tradingConfig));
  }, [tradingConfig]);

  useEffect(() => {
    localStorage.setItem('analysisConfigs', JSON.stringify(analysisConfigs));
  }, [analysisConfigs]);

  const value: TradingContextType = {
    // States from electronAPI
    tradingState: electronAPI.tradingState,
    analyses: electronAPI.analyses,
    accounts: electronAPI.accounts,
    markets: electronAPI.markets,
    tickers: electronAPI.tickers,
    apiKeyStatus: electronAPI.apiKeyStatus,
    learningStates: electronAPI.learningStates,
    
    // Local states
    tradingConfig,
    analysisConfigs,
    portfolio,
    
    // Actions
    updateTradingConfig,
    updateAnalysisConfigs,
    updatePortfolio,
    toggleTrading,
    validateApiKey: electronAPI.validateApiKey,
    fetchAccounts: async () => {
      const accounts = await electronAPI.fetchAccounts();
      return accounts;
    },
    fetchMarkets: async () => {
      const markets = await electronAPI.fetchMarkets();
      return markets;
    },
    fetchTickers: async (symbols: string[]) => {
      const tickers = await electronAPI.fetchTickers(symbols);
      return tickers;
    },
    toggleLearning: electronAPI.toggleLearning
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};