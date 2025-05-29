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

interface ProfitHistoryItem {
  time: string;
  profitRate: number;
  totalValue: number;
}

interface PortfolioChartItem {
  name: string;
  value: number;
  percentage: number;
}

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
  profitHistory: ProfitHistoryItem[];
  portfolioChartData: PortfolioChartItem[];
  
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
  fetchProfitHistory: () => Promise<void>;
  calculatePortfolioData: () => void;
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

// 기본 거래 설정을 컴포넌트 외부에 정의 (보수적 전략)
const defaultTradingConfig: TradingConfig = {
  buyRatio: DEFAULT_CONFIG.BUY_RATIO,
  sellRatio: DEFAULT_CONFIG.SELL_RATIO,
  maxInvestmentPerCoin: DEFAULT_CONFIG.MAX_INVESTMENT_PER_COIN,
  enableRealTrading: false,
  dynamicConfidence: true,
  riskLevel: 2,  // 낮은 리스크 레벨
  useKellyCriterion: true,  // Kelly Criterion 사용 (최적 베팅 크기)
  maxKellyFraction: 0.15,  // 보수적인 Kelly 비율
  volatilityWindow: 30,  // 더 긴 변동성 관찰 기간
  correlationThreshold: 0.6,  // 더 엄격한 상관관계 임계값
  minConfidenceForBuy: DEFAULT_CONFIG.MIN_CONFIDENCE_BUY,
  minConfidenceForSell: DEFAULT_CONFIG.MIN_CONFIDENCE_SELL,
  confidenceWindowSize: 15,  // 더 긴 신뢰도 관찰 기간
  buyingCooldown: DEFAULT_CONFIG.BUY_COOLDOWN / 60,  // 분 단위로 변환
  sellingCooldown: DEFAULT_CONFIG.SELL_COOLDOWN / 60,  // 분 단위로 변환
  decisionThresholds: {
    buyThreshold: 0.15,
    sellThreshold: -0.2
  },
  scores: {
    rsi: 1.2,  // RSI 중요도 높임 (과매수/과매도 중요)
    bollinger: 1.1,  // 볼린저 밴드 중요
    volume: 1.0,  // 거래량 중요
    trend: 1.0,  // 추세 중요
    volatility: 1.3,  // 변동성 매우 중요 (위험 관리)
    orderbook: 0.7,  // 호가 분석
    whaleDetection: 0.9,  // 고래 감지 중요
    atr: 1.1,  // ATR 중요 (변동성 측정)
    marketSentiment: 0.8,  // 시장 심리
    kimchiPremium: 0.5  // 김프는 상대적으로 덜 중요
  },
  useAI: false,
  aiProvider: 'claude',
  tradingSettings: {
    buying: {
      defaultBuyRatio: DEFAULT_CONFIG.BUY_RATIO,
      confidenceBasedAdjustment: true,
      highConfidenceMultiplier: 1.5,  // 높은 신뢰도에서도 보수적
      lowConfidenceMultiplier: 0.3   // 낮은 신뢰도에서는 매우 적게
    },
    selling: {
      defaultSellRatio: DEFAULT_CONFIG.SELL_RATIO,
      confidenceBasedAdjustment: true,
      highConfidenceMultiplier: 2.0,  // 위험 신호시 더 많이 매도
      lowConfidenceMultiplier: 1.0   // 약한 신호에서도 기본 비율 유지
    }
  }
};

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const electronAPI = useElectronAPI();
  
  // 초기값은 null로 설정하여 localStorage에서 로드할 때까지 기다림
  const [tradingConfig, setTradingConfig] = useState<TradingConfig | null>(null);
  const [analysisConfigs, setAnalysisConfigs] = useState<AnalysisConfig[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioCoin[]>([]);
  const [profitHistory, setProfitHistory] = useState<ProfitHistoryItem[]>([]);
  const [portfolioChartData, setPortfolioChartData] = useState<PortfolioChartItem[]>([]);
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
          console.log('[TradingContext] Loaded analysis configs from file:', savedAnalysisConfigs);
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
            // 최소 신뢰도는 기본값 사용 (이전 값이 60, 70인 경우)
            minConfidenceForBuy: parsedConfig.minConfidenceForBuy === 60 ? 
              DEFAULT_CONFIG.MIN_CONFIDENCE_BUY : 
              (parsedConfig.minConfidenceForBuy || DEFAULT_CONFIG.MIN_CONFIDENCE_BUY),
            minConfidenceForSell: parsedConfig.minConfidenceForSell === 70 ? 
              DEFAULT_CONFIG.MIN_CONFIDENCE_SELL : 
              (parsedConfig.minConfidenceForSell || DEFAULT_CONFIG.MIN_CONFIDENCE_SELL),
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

      // analysisConfigs는 electronAPI에서만 로드 (localStorage 제거)
      
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
    // 빈 배열일 때는 저장하지 않음 (초기 로드 시 기존 설정을 덮어쓰는 것 방지)
    if (analysisConfigs.length > 0) {
      localStorage.setItem('analysisConfigs', JSON.stringify(analysisConfigs));
      // 백엔드에도 저장
      (window as any).electronAPI.saveAnalysisConfigs(analysisConfigs);
    }
  }, [analysisConfigs]);

  // 학습 상태는 electronAPI에서 자동으로 저장됨

  // 포트폴리오 차트 데이터 계산
  const calculatePortfolioData = useCallback(() => {
    console.log('[TradingContext] Calculating portfolio data...');
    console.log('[TradingContext] Accounts:', electronAPI.accounts);
    console.log('[TradingContext] Tickers:', electronAPI.tickers);
    
    const coinAccounts = electronAPI.accounts.filter(acc => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0);
    const krwAccount = electronAPI.accounts.find(acc => acc.currency === 'KRW');
    
    const data: PortfolioChartItem[] = coinAccounts.map(acc => {
      const ticker = electronAPI.tickers.find(t => t.market === `KRW-${acc.currency}`);
      const value = ticker ? parseFloat(acc.balance) * ticker.trade_price : 0;
      return {
        name: acc.currency,
        value: value,
        percentage: 0
      };
    }).filter(item => item.value > 0);
    
    // KRW 추가
    if (krwAccount && parseFloat(krwAccount.balance) > 0) {
      data.push({
        name: 'KRW',
        value: parseFloat(krwAccount.balance),
        percentage: 0
      });
    }
    
    // 비율 계산
    const total = data.reduce((sum, item) => sum + item.value, 0);
    data.forEach(item => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });
    
    console.log('[TradingContext] Portfolio chart data:', data);
    setPortfolioChartData(data);
  }, [electronAPI.accounts, electronAPI.tickers]);

  // 수익률 히스토리 가져오기
  const fetchProfitHistory = useCallback(async () => {
    try {
      console.log('[TradingContext] Fetching profit history...');
      // 백엔드에서 거래 내역 가져오기
      const history = await (window as any).electronAPI.getTradingHistory();
      console.log('[TradingContext] Profit history received:', history);
      
      if (history && history.length > 0) {
        setProfitHistory(history);
      } else {
         console.log('[TradingContext] No profit history data, setting empty array');
        // 데이터가 없으면 빈 배열 설정
        setProfitHistory([]);
      }
    } catch (error) {
      console.error('[TradingContext] Failed to fetch profit history:', error);
      // 에러 시 빈 배열 설정
      setProfitHistory([]);
    }
  }, []);

  // 계정과 시세 변경 시 포트폴리오 차트 데이터 업데이트
  useEffect(() => {
    calculatePortfolioData();
  }, [calculatePortfolioData]);

  // 주기적으로 수익률 히스토리 업데이트
  useEffect(() => {
    fetchProfitHistory();
    const interval = setInterval(fetchProfitHistory, 300000); // 5분마다 업데이트 (너무 자주 호출하지 않도록)
    return () => clearInterval(interval);
  }, [fetchProfitHistory]);

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
    profitHistory,
    portfolioChartData,
    
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
    fetchSupportedCoins: electronAPI.fetchSupportedCoins,
    fetchProfitHistory,
    calculatePortfolioData
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};