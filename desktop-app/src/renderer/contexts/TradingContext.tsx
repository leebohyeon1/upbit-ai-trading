import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
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
  supportedCoins: string[];
  
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
  fetchSupportedCoins: () => Promise<string[]>;
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

// 기본 거래 설정을 컴포넌트 외부에 정의
const defaultTradingConfig: TradingConfig = {
  buyRatio: DEFAULT_CONFIG.BUY_RATIO,
  sellRatio: DEFAULT_CONFIG.SELL_RATIO,
  maxInvestmentPerCoin: DEFAULT_CONFIG.MAX_INVESTMENT_PER_COIN,
  enableRealTrading: false,
  dynamicConfidence: true,
  riskLevel: 3,
  useKellyCriterion: false,
  maxKellyFraction: 0.25, // Kelly Criterion 기본값 추가
  volatilityWindow: 20,
  correlationThreshold: 0.7,
  minConfidenceForBuy: DEFAULT_CONFIG.MIN_CONFIDENCE_BUY,
  minConfidenceForSell: DEFAULT_CONFIG.MIN_CONFIDENCE_SELL,
  confidenceWindowSize: 10,
  buyingCooldown: 30,
  sellingCooldown: 20,
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
};

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const electronAPI = useElectronAPI();
  
  // 초기값은 null로 설정하여 localStorage에서 로드할 때까지 기다림
  const [tradingConfig, setTradingConfig] = useState<TradingConfig | null>(null);
  const [analysisConfigs, setAnalysisConfigs] = useState<AnalysisConfig[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioCoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Actions
  const updateTradingConfig = useCallback((config: TradingConfig) => {
    console.log('[TradingContext] Updating trading config:', config);
    setTradingConfig(config);
  }, []);

  const updateAnalysisConfigs = useCallback((configs: AnalysisConfig[]) => {
    setAnalysisConfigs(configs);
  }, []);

  const updatePortfolio = useCallback((newPortfolio: PortfolioCoin[]) => {
    setPortfolio(newPortfolio);
  }, []);

  const toggleTrading = useCallback(async () => {
    if (!tradingConfig) return;
    
    try {
      // 활성화된 코인 목록
      const activeTickers = portfolio
        .filter(p => p.enabled)
        .map(p => `KRW-${p.symbol}`);
      
      await electronAPI.toggleTrading(tradingConfig, analysisConfigs);
      // 상태 업데이트는 이벤트 리스너에서 처리됨
    } catch (error) {
      console.error('Failed to toggle trading:', error);
      throw error;
    }
  }, [tradingConfig, analysisConfigs, portfolio, electronAPI]);

  // Load saved data on mount
  useEffect(() => {
    console.log('[TradingContext] Starting to load saved data...');
    const loadSavedData = async () => {
      try {
        // 백엔드에서 불러오기
        const savedPortfolio = await (window as any).electronAPI.getPortfolio();
        console.log('[TradingContext] Portfolio loaded from backend:', savedPortfolio);
        if (savedPortfolio && savedPortfolio.length > 0) {
          setPortfolio(savedPortfolio);
        } else {
          // 백엔드에 데이터가 없으면 localStorage에서 로드
          const localPortfolio = localStorage.getItem('portfolio');
          if (localPortfolio) {
            try {
              const parsed = JSON.parse(localPortfolio);
              console.log('[TradingContext] Portfolio loaded from localStorage:', parsed);
              setPortfolio(parsed);
            } catch (e) {
              console.error('Failed to parse localStorage portfolio:', e);
            }
          }
        }

        const savedTradingConfig = await (window as any).electronAPI.getTradingConfig();
        if (savedTradingConfig && Object.keys(savedTradingConfig).length > 0) {
          // 백엔드에서 로드한 설정도 기본값과 병합
          setTradingConfig({
            ...defaultTradingConfig,
            ...savedTradingConfig,
            // 중첩된 객체들도 올바르게 병합
            decisionThresholds: {
              ...defaultTradingConfig.decisionThresholds,
              ...(savedTradingConfig.decisionThresholds || {})
            },
            scores: {
              ...defaultTradingConfig.scores,
              ...(savedTradingConfig.scores || {})
            },
            tradingSettings: {
              buying: {
                ...defaultTradingConfig.tradingSettings.buying,
                ...(savedTradingConfig.tradingSettings?.buying || {})
              },
              selling: {
                ...defaultTradingConfig.tradingSettings.selling,
                ...(savedTradingConfig.tradingSettings?.selling || {})
              }
            }
          });
        }

        const savedAnalysisConfigs = await (window as any).electronAPI.getAnalysisConfigs();
        if (savedAnalysisConfigs && savedAnalysisConfigs.length > 0) {
          setAnalysisConfigs(savedAnalysisConfigs);
        }

        // 학습 상태는 electronAPI에서 자동으로 관리됨
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
      
      // localStorage에서 tradingConfig 로드 (포트폴리오는 이미 위에서 처리함)

      const savedConfig = localStorage.getItem('tradingConfig');
      if (savedConfig) {
        console.log('[TradingContext] Loading saved trading config from localStorage');
        try {
          // 저장된 설정을 기본값과 병합하여 누락된 필드 처리
          const parsedConfig = JSON.parse(savedConfig);
          const mergedConfig = {
            ...defaultTradingConfig,
            ...parsedConfig,
            // 중첩된 객체들도 올바르게 병합
            decisionThresholds: {
              ...defaultTradingConfig.decisionThresholds,
              ...(parsedConfig.decisionThresholds || {})
            },
            scores: {
              ...defaultTradingConfig.scores,
              ...(parsedConfig.scores || {})
            },
            tradingSettings: {
              buying: {
                ...defaultTradingConfig.tradingSettings.buying,
                ...(parsedConfig.tradingSettings?.buying || {})
              },
              selling: {
                ...defaultTradingConfig.tradingSettings.selling,
                ...(parsedConfig.tradingSettings?.selling || {})
              }
            }
          };
          console.log('[TradingContext] Merged config:', mergedConfig);
          setTradingConfig(mergedConfig);
        } catch (e) {
          console.error('Failed to parse saved config:', e);
          setTradingConfig(defaultTradingConfig);
        }
      } else {
        console.log('[TradingContext] No saved config found, using defaults');
        setTradingConfig(defaultTradingConfig);
      }

      const savedAnalysisConfigs = localStorage.getItem('analysisConfigs');
      if (savedAnalysisConfigs) {
        try {
          setAnalysisConfigs(JSON.parse(savedAnalysisConfigs));
        } catch (e) {
          console.error('Failed to parse saved analysis configs:', e);
        }
      }
      
      console.log('[TradingContext] Setting isLoading to false');
      setIsLoading(false);
    };

    loadSavedData().catch(error => {
      console.error('[TradingContext] Critical error in loadSavedData:', error);
      // 에러가 발생해도 기본값으로 진행
      setTradingConfig(defaultTradingConfig);
      setIsLoading(false);
    });
  }, []);

  // Save configurations when they change
  useEffect(() => {
    // isLoading이 false일 때만 저장 (초기 로딩 중에는 저장하지 않음)
    if (!isLoading && portfolio.length >= 0) {
      console.log('[TradingContext] Saving portfolio:', portfolio);
      localStorage.setItem('portfolio', JSON.stringify(portfolio));
      // 백엔드에도 저장
      (window as any).electronAPI.savePortfolio(portfolio);
    }
  }, [portfolio, isLoading]);

  useEffect(() => {
    // null이 아닌 경우에만 저장 (초기 로딩 중에는 저장하지 않음)
    if (tradingConfig !== null) {
      console.log('[TradingContext] Saving trading config to localStorage:', tradingConfig);
      localStorage.setItem('tradingConfig', JSON.stringify(tradingConfig));
      // 백엔드에도 저장
      (window as any).electronAPI.saveTradingConfig(tradingConfig);
    }
  }, [tradingConfig]);

  useEffect(() => {
    localStorage.setItem('analysisConfigs', JSON.stringify(analysisConfigs));
    // 백엔드에도 저장
    (window as any).electronAPI.saveAnalysisConfigs(analysisConfigs);
  }, [analysisConfigs]);

  // 학습 상태는 electronAPI에서 자동으로 저장됨

  // 로딩 중이면 로딩 화면 표시
  if (isLoading || tradingConfig === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const value: TradingContextType = {
    // States from electronAPI
    tradingState: electronAPI.tradingState,
    analyses: electronAPI.analyses,
    accounts: electronAPI.accounts,
    markets: electronAPI.markets,
    tickers: electronAPI.tickers,
    apiKeyStatus: electronAPI.apiKeyStatus,
    learningStates: electronAPI.learningStates,
    supportedCoins: electronAPI.supportedCoins,
    
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
    toggleLearning: electronAPI.toggleLearning,
    fetchSupportedCoins: electronAPI.fetchSupportedCoins
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};