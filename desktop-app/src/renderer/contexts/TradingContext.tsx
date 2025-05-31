import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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
  LearningState,
  BacktestResult
} from '../types';
import { DEFAULT_CONFIG } from '../constants';

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
  validateApiKey: (accessKey: string, secretKey: string, claudeApiKey?: string) => Promise<ApiKeyStatus>;
  fetchAccounts: () => Promise<Account[]>;
  fetchMarkets: () => Promise<MarketData[]>;
  fetchTickers: (symbols: string[]) => Promise<TickerData[]>;
  toggleLearning: (ticker: string, isRunning: boolean) => Promise<void>;
  fetchSupportedCoins: () => Promise<string[]>;
  fetchProfitHistory: () => Promise<void>;
  calculatePortfolioData: () => void;
  generateRiskReport: () => Promise<any>;
  getPortfolio: () => Promise<PortfolioCoin[]>;
  getRebalancingConfig: () => Promise<any>;
  saveRebalancingConfig: (config: any) => Promise<boolean>;
  executeRebalancing: () => Promise<{ success: boolean }>;
  simulateRebalancing: () => Promise<any>;
  getCooldownInfo: (market: string) => Promise<any>;
  runBacktest: (ticker: string, startDate: string, endDate: string, config: any) => Promise<BacktestResult | null>;
  startTrading: (tradingConfig: TradingConfig, analysisConfigs: any[]) => Promise<any>;
  stopTrading: () => Promise<any>;
  
  // 2FA methods
  get2FAStatus: () => Promise<any>;
  setup2FA: () => Promise<any>;
  enable2FA: (token: string) => Promise<any>;
  disable2FA: (token: string) => Promise<any>;
  verify2FA: (token: string) => Promise<any>;
  regenerateBackupCodes: (token: string) => Promise<any>;
  
  // Multi-timeframe analysis
  analyzeMultiTimeframe: (params: any) => Promise<any>;
  
  // Support/Resistance analysis
  analyzeSupportResistance: (params: any) => Promise<any>;
  
  // Advanced indicators analysis
  analyzeAdvancedIndicators: (params: any) => Promise<any>;
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
  // 직접 상태 관리
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ 
    accessKey: '', 
    isValid: false 
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [learningStates, setLearningStates] = useState<LearningState[]>([]);
  const [supportedCoins, setSupportedCoins] = useState<string[]>([]);
  const [localTradingState, setLocalTradingState] = useState<TradingState>({
    isRunning: false,
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    aiEnabled: false
  });
  
  // 초기값은 null로 설정하여 localStorage에서 로드할 때까지 기다림
  const [tradingConfig, setTradingConfig] = useState<TradingConfig | null>(null);
  const [analysisConfigs, setAnalysisConfigs] = useState<AnalysisConfig[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioCoin[]>([]);
  const [profitHistory, setProfitHistory] = useState<ProfitHistoryItem[]>([]);
  const [portfolioChartData, setPortfolioChartData] = useState<PortfolioChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // API 함수들
  const validateApiKey = useCallback(async (accessKey: string, secretKey: string, claudeApiKey?: string) => {
    try {
      const result = await window.electronAPI.validateApiKey(accessKey, secretKey, claudeApiKey);
      setApiKeyStatus(result);
      return result;
    } catch (error) {
      console.error('API key validation failed:', error);
      return { accessKey: '', isValid: false };
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await window.electronAPI.fetchAccounts();
      setAccounts(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      return [];
    }
  }, []);

  const fetchMarkets = useCallback(async () => {
    try {
      const data = await window.electronAPI.fetchMarkets();
      setMarkets(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      return [];
    }
  }, []);

  const fetchTickers = useCallback(async (symbols: string[]) => {
    try {
      const data = await window.electronAPI.fetchTickers(symbols);
      setTickers(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch tickers:', error);
      return [];
    }
  }, []);

  const fetchSupportedCoins = useCallback(async () => {
    try {
      const coins = await window.electronAPI.getSupportedKrwCoins();
      setSupportedCoins(coins);
      return coins;
    } catch (error) {
      console.error('Failed to fetch supported coins:', error);
      return [];
    }
  }, []);

  const toggleLearning = useCallback(async (ticker: string, isRunning: boolean) => {
    try {
      console.log('[TradingContext] toggleLearning called:', ticker, isRunning);
      await window.electronAPI.toggleLearning(ticker, isRunning);
      
      // 학습 상태가 업데이트될 때까지 잠시 대기 후 상태 다시 가져오기
      setTimeout(async () => {
        try {
          const updatedStates = await window.electronAPI.getLearningStates();
          console.log('[TradingContext] Updated learning states:', updatedStates);
          setLearningStates(updatedStates);
        } catch (error) {
          console.error('[TradingContext] Failed to get updated learning states:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to toggle learning:', error);
    }
  }, []);

  // 추가 API 메서드들
  const generateRiskReport = useCallback(async () => {
    try {
      return await window.electronAPI.generateRiskReport();
    } catch (error) {
      console.error('Failed to generate risk report:', error);
      return null;
    }
  }, []);

  const getPortfolio = useCallback(async () => {
    try {
      return await window.electronAPI.getPortfolio();
    } catch (error) {
      console.error('Failed to get portfolio:', error);
      return [];
    }
  }, []);

  const getRebalancingConfig = useCallback(async () => {
    try {
      return await window.electronAPI.getRebalancingConfig();
    } catch (error) {
      console.error('Failed to get rebalancing config:', error);
      return null;
    }
  }, []);

  const saveRebalancingConfig = useCallback(async (config: any) => {
    try {
      return await window.electronAPI.saveRebalancingConfig(config);
    } catch (error) {
      console.error('Failed to save rebalancing config:', error);
      return false;
    }
  }, []);

  const executeRebalancing = useCallback(async () => {
    try {
      return await window.electronAPI.executeRebalancing();
    } catch (error) {
      console.error('Failed to execute rebalancing:', error);
      return { success: false };
    }
  }, []);

  const simulateRebalancing = useCallback(async () => {
    try {
      return await window.electronAPI.simulateRebalancing();
    } catch (error) {
      console.error('Failed to simulate rebalancing:', error);
      return null;
    }
  }, []);

  const getCooldownInfo = useCallback(async (market: string) => {
    try {
      return await window.electronAPI.getCooldownInfo(market);
    } catch (error) {
      console.error('Failed to get cooldown info:', error);
      return {
        buyRemaining: 0,
        sellRemaining: 0,
        buyTotal: 30,
        sellTotal: 20
      };
    }
  }, []);

  const runBacktest = useCallback(async (
    ticker: string, 
    startDate: string, 
    endDate: string, 
    config: any
  ): Promise<BacktestResult | null> => {
    try {
      return await window.electronAPI.runBacktest(ticker, startDate, endDate, config);
    } catch (error) {
      console.error('Backtest failed:', error);
      return null;
    }
  }, []);

  const startTrading = useCallback(async (tradingConfig: TradingConfig, analysisConfigs: any[]) => {
    try {
      console.log('[TradingContext] Starting trading with config:', { enableRealTrading: tradingConfig.enableRealTrading });
      return await window.electronAPI.startTrading(tradingConfig, analysisConfigs);
    } catch (error) {
      console.error('Failed to start trading:', error);
      throw error;
    }
  }, []);

  const stopTrading = useCallback(async () => {
    try {
      console.log('[TradingContext] Stopping trading...');
      return await window.electronAPI.stopTrading();
    } catch (error) {
      console.error('Failed to stop trading:', error);
      throw error;
    }
  }, []);

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
    
    // 실제 거래가 비활성화되어 있을 때도 시뮬레이션 모드로 동작 가능
    try {
      // 활성화된 코인 목록
      const activeTickers = portfolio
        .filter(p => p.enabled)
        .map(p => `KRW-${p.symbol}`);
      
      if (localTradingState.isRunning) {
        await window.electronAPI.stopTrading();
      } else {
        console.log('[TradingContext] Starting trading with config:', { enableRealTrading: tradingConfig.enableRealTrading });
        await window.electronAPI.startTrading(tradingConfig, analysisConfigs);
      }
      // 상태 업데이트는 이벤트 리스너에서 처리됨
    } catch (error) {
      console.error('Failed to toggle trading:', error);
      throw error;
    }
  }, [tradingConfig, analysisConfigs, portfolio, localTradingState]);

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

  // 이벤트 리스너 설정
  useEffect(() => {
    const removeApiKeyListener = window.electronAPI.onApiKeyStatus((status) => {
      setApiKeyStatus(status);
    });

    const removeAnalysisListener = window.electronAPI.onAnalysisCompleted((data) => {
      console.log('[TradingContext] Analysis completed event received:', data);
      setAnalyses(data);
    });
    
    // single-analysis-completed 이벤트도 리스닝
    console.log('[TradingContext] Setting up single-analysis-completed listener');
    const removeSingleAnalysisListener = window.electronAPI.onSingleAnalysisCompleted((analysis) => {
      console.log('[TradingContext] Single analysis completed event received:', analysis);
      setAnalyses(prev => {
        console.log('[TradingContext] Previous analyses:', prev);
        // 기존 분석 중 같은 ticker가 있으면 업데이트, 없으면 추가
        const existingIndex = prev.findIndex(a => a.ticker === analysis.ticker);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = analysis;
          console.log('[TradingContext] Updated analyses:', updated);
          return updated;
        } else {
          const newAnalyses = [...prev, analysis];
          console.log('[TradingContext] New analyses:', newAnalyses);
          return newAnalyses;
        }
      });
    });

    console.log('[TradingContext] Setting up trading state listener');
    const removeTradingStateListener = window.electronAPI.onTradingStateChanged((state) => {
      console.log('[TradingContext] Trading state changed event received:', state);
      console.log('[TradingContext] Previous state:', localTradingState);
      // 새 객체로 복사하여 React가 변경을 감지하도록 함
      setLocalTradingState({ ...state });
    });

    const removeLearningListener = window.electronAPI.onLearningProgress((states) => {
      console.log('[TradingContext] Learning progress event received:', states);
      setLearningStates(states);
    });
    
    // 초기 거래 상태 로드
    window.electronAPI.getTradingState().then((state) => {
      console.log('[TradingContext] Initial trading state loaded:', state);
      setLocalTradingState(state);
    }).catch(console.error);
    
    // 초기 학습 상태 로드
    window.electronAPI.getLearningStates().then((states) => {
      console.log('[TradingContext] Initial learning states loaded:', states);
      setLearningStates(states);
    }).catch(console.error);

    // 초기 지원 코인 목록 로드
    window.electronAPI.getSupportedKrwCoins().then((coins) => {
      console.log('[TradingContext] Supported coins loaded:', coins);
      setSupportedCoins(coins);
    }).catch(console.error);

    return () => {
      removeApiKeyListener();
      removeAnalysisListener();
      removeSingleAnalysisListener();
      removeTradingStateListener();
      removeLearningListener();
    };
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
    console.log('[TradingContext] Accounts:', accounts);
    console.log('[TradingContext] Tickers:', tickers);
    
    const coinAccounts = accounts.filter(acc => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0);
    const krwAccount = accounts.find(acc => acc.currency === 'KRW');
    
    const data: PortfolioChartItem[] = coinAccounts.map(acc => {
      const ticker = tickers.find(t => t.market === `KRW-${acc.currency}`);
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
  }, [accounts, tickers]);

  // 수익률 히스토리 가져오기
  const fetchProfitHistory = useCallback(async () => {
    try {
      console.log('[TradingContext] Fetching profit history...');
      // 백엔드에서 수익률 차트 데이터 가져오기
      const history = await window.electronAPI.getProfitHistory(30); // 30일 데이터
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

  // value 객체를 미리 생성 (Hook은 조건문 이전에 호출되어야 함)
  const value: TradingContextType = useMemo(() => ({
    // States
    tradingState: localTradingState,
    analyses,
    accounts,
    markets,
    tickers,
    apiKeyStatus,
    learningStates,
    supportedCoins,
    tradingConfig: tradingConfig || defaultTradingConfig,
    analysisConfigs,
    portfolio,
    profitHistory,
    portfolioChartData,
    
    // Actions
    updateTradingConfig,
    updateAnalysisConfigs,
    updatePortfolio,
    toggleTrading,
    validateApiKey,
    fetchAccounts,
    fetchMarkets,
    fetchTickers,
    toggleLearning,
    fetchSupportedCoins,
    fetchProfitHistory,
    calculatePortfolioData,
    generateRiskReport,
    getPortfolio,
    getRebalancingConfig,
    saveRebalancingConfig,
    executeRebalancing,
    simulateRebalancing,
    getCooldownInfo,
    runBacktest,
    startTrading,
    stopTrading,
    
    // 2FA methods
    get2FAStatus: window.electronAPI.get2FAStatus,
    setup2FA: window.electronAPI.setup2FA,
    enable2FA: window.electronAPI.enable2FA,
    disable2FA: window.electronAPI.disable2FA,
    verify2FA: window.electronAPI.verify2FA,
    regenerateBackupCodes: window.electronAPI.regenerateBackupCodes,
    
    // Multi-timeframe analysis
    analyzeMultiTimeframe: window.electronAPI.analyzeMultiTimeframe,
    
    // Support/Resistance analysis
    analyzeSupportResistance: window.electronAPI.analyzeSupportResistance,
    
    // Advanced indicators analysis
    analyzeAdvancedIndicators: window.electronAPI.analyzeAdvancedIndicators
  }), [
    localTradingState,
    analyses,
    accounts,
    markets,
    tickers,
    apiKeyStatus,
    learningStates,
    supportedCoins,
    tradingConfig,
    analysisConfigs,
    portfolio,
    profitHistory,
    portfolioChartData,
    updateTradingConfig,
    updateAnalysisConfigs,
    updatePortfolio,
    toggleTrading,
    validateApiKey,
    fetchAccounts,
    fetchMarkets,
    fetchTickers,
    toggleLearning,
    fetchSupportedCoins,
    fetchProfitHistory,
    calculatePortfolioData,
    generateRiskReport,
    getPortfolio,
    getRebalancingConfig,
    saveRebalancingConfig,
    executeRebalancing,
    simulateRebalancing,
    getCooldownInfo,
    runBacktest,
    startTrading,
    stopTrading
  ]);

  // 로딩 중이면 로딩 화면 표시
  if (isLoading || tradingConfig === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};