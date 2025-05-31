import React, { createContext, useContext, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
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

// State 통합을 위한 타입 정의
interface AppState {
  // Core States
  tradingState: TradingState;
  tradingConfig: TradingConfig | null;
  analysisConfigs: AnalysisConfig[];
  portfolio: PortfolioCoin[];
  
  // Market Data
  analyses: Analysis[];
  accounts: Account[];
  markets: MarketData[];
  tickers: TickerData[];
  
  // System States
  apiKeyStatus: ApiKeyStatus;
  learningStates: LearningState[];
  supportedCoins: string[];
  
  // Chart Data
  profitHistory: ProfitHistoryItem[];
  portfolioChartData: PortfolioChartItem[];
  
  // UI States
  isLoading: boolean;
}

// Action 타입 정의
type AppAction = 
  | { type: 'SET_TRADING_STATE'; payload: TradingState }
  | { type: 'SET_TRADING_CONFIG'; payload: TradingConfig | null }
  | { type: 'SET_ANALYSIS_CONFIGS'; payload: AnalysisConfig[] }
  | { type: 'SET_PORTFOLIO'; payload: PortfolioCoin[] }
  | { type: 'SET_ANALYSES'; payload: Analysis[] }
  | { type: 'UPDATE_ANALYSIS'; payload: Analysis }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SET_MARKETS'; payload: MarketData[] }
  | { type: 'SET_TICKERS'; payload: TickerData[] }
  | { type: 'SET_API_KEY_STATUS'; payload: ApiKeyStatus }
  | { type: 'SET_LEARNING_STATES'; payload: LearningState[] }
  | { type: 'SET_SUPPORTED_COINS'; payload: string[] }
  | { type: 'SET_PROFIT_HISTORY'; payload: ProfitHistoryItem[] }
  | { type: 'SET_PORTFOLIO_CHART_DATA'; payload: PortfolioChartItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'BATCH_UPDATE'; payload: Partial<AppState> };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TRADING_STATE':
      return { ...state, tradingState: action.payload };
    case 'SET_TRADING_CONFIG':
      return { ...state, tradingConfig: action.payload };
    case 'SET_ANALYSIS_CONFIGS':
      return { ...state, analysisConfigs: action.payload };
    case 'SET_PORTFOLIO':
      return { ...state, portfolio: action.payload };
    case 'SET_ANALYSES':
      return { ...state, analyses: action.payload };
    case 'UPDATE_ANALYSIS':
      const existingIndex = state.analyses.findIndex(a => a.ticker === action.payload.ticker);
      if (existingIndex >= 0) {
        const updated = [...state.analyses];
        updated[existingIndex] = action.payload;
        return { ...state, analyses: updated };
      }
      return { ...state, analyses: [...state.analyses, action.payload] };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_MARKETS':
      return { ...state, markets: action.payload };
    case 'SET_TICKERS':
      return { ...state, tickers: action.payload };
    case 'SET_API_KEY_STATUS':
      return { ...state, apiKeyStatus: action.payload };
    case 'SET_LEARNING_STATES':
      return { ...state, learningStates: action.payload };
    case 'SET_SUPPORTED_COINS':
      return { ...state, supportedCoins: action.payload };
    case 'SET_PROFIT_HISTORY':
      return { ...state, profitHistory: action.payload };
    case 'SET_PORTFOLIO_CHART_DATA':
      return { ...state, portfolioChartData: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// 초기 상태
const initialState: AppState = {
  tradingState: {
    isRunning: false,
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    aiEnabled: false
  },
  tradingConfig: null,
  analysisConfigs: [],
  portfolio: [],
  analyses: [],
  accounts: [],
  markets: [],
  tickers: [],
  apiKeyStatus: { accessKey: '', isValid: false },
  learningStates: [],
  supportedCoins: [],
  profitHistory: [],
  portfolioChartData: [],
  isLoading: true
};

// Context 타입 정의
interface TradingContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
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
    // 나머지 액션들...
  };
}

const TradingContext = createContext<TradingContextType | null>(null);

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return context;
};

// 기본 거래 설정
const defaultTradingConfig: TradingConfig = {
  buyRatio: DEFAULT_CONFIG.BUY_RATIO,
  sellRatio: DEFAULT_CONFIG.SELL_RATIO,
  maxInvestmentPerCoin: DEFAULT_CONFIG.MAX_INVESTMENT_PER_COIN,
  enableRealTrading: false,
  dynamicConfidence: true,
  riskLevel: 2,
  useKellyCriterion: true,
  maxKellyFraction: 0.15,
  volatilityWindow: 30,
  correlationThreshold: 0.6,
  minConfidenceForBuy: DEFAULT_CONFIG.MIN_CONFIDENCE_BUY,
  minConfidenceForSell: DEFAULT_CONFIG.MIN_CONFIDENCE_SELL,
  confidenceWindowSize: 15,
  buyingCooldown: DEFAULT_CONFIG.BUY_COOLDOWN_MINUTES,
  sellingCooldown: DEFAULT_CONFIG.SELL_COOLDOWN_MINUTES,
  decisionThresholds: {
    buyThreshold: 0.15,
    sellThreshold: -0.2
  },
  scores: {
    rsi: 1.2,
    bollinger: 1.1,
    volume: 1.0,
    trend: 1.0,
    volatility: 1.3,
    orderbook: 0.7,
    whaleDetection: 0.9,
    atr: 1.1,
    marketSentiment: 0.8,
    kimchiPremium: 0.5
  },
  useAI: false,
  aiProvider: 'claude',
  tradingSettings: {
    buying: {
      defaultBuyRatio: DEFAULT_CONFIG.BUY_RATIO,
      confidenceBasedAdjustment: true,
      highConfidenceMultiplier: 1.5,
      lowConfidenceMultiplier: 0.3
    },
    selling: {
      defaultSellRatio: DEFAULT_CONFIG.SELL_RATIO,
      confidenceBasedAdjustment: true,
      highConfidenceMultiplier: 2.0,
      lowConfidenceMultiplier: 1.0
    }
  }
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // 저장 상태를 추적하기 위한 ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{
    tradingConfig: string | null;
    portfolio: string | null;
    analysisConfigs: string | null;
  }>({
    tradingConfig: null,
    portfolio: null,
    analysisConfigs: null
  });

  // 디바운스된 저장 함수
  const debouncedSave = useCallback((type: 'tradingConfig' | 'portfolio' | 'analysisConfigs', data: any) => {
    // 이전 타임아웃 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const serialized = JSON.stringify(data);
      
      // 변경사항이 없으면 저장하지 않음
      if (lastSavedRef.current[type] === serialized) {
        return;
      }
      
      lastSavedRef.current[type] = serialized;
      
      // 실제 저장
      if (type === 'tradingConfig' && data) {
        localStorage.setItem('tradingConfig', serialized);
        window.electronAPI.saveTradingConfig(data);
      } else if (type === 'portfolio') {
        localStorage.setItem('portfolio', serialized);
        window.electronAPI.savePortfolio(data);
      } else if (type === 'analysisConfigs' && data.length > 0) {
        localStorage.setItem('analysisConfigs', serialized);
        window.electronAPI.saveAnalysisConfigs(data);
      }
    }, 500); // 500ms 디바운스
  }, []);

  // 액션들을 메모이제이션
  const actions = useMemo(() => ({
    updateTradingConfig: (config: TradingConfig) => {
      dispatch({ type: 'SET_TRADING_CONFIG', payload: config });
      debouncedSave('tradingConfig', config);
    },
    
    updateAnalysisConfigs: (configs: AnalysisConfig[]) => {
      dispatch({ type: 'SET_ANALYSIS_CONFIGS', payload: configs });
      debouncedSave('analysisConfigs', configs);
    },
    
    updatePortfolio: (portfolio: PortfolioCoin[]) => {
      dispatch({ type: 'SET_PORTFOLIO', payload: portfolio });
      debouncedSave('portfolio', portfolio);
    },
    
    validateApiKey: async (accessKey: string, secretKey: string, claudeApiKey?: string) => {
      try {
        const result = await window.electronAPI.validateApiKey(accessKey, secretKey, claudeApiKey);
        dispatch({ type: 'SET_API_KEY_STATUS', payload: result });
        return result;
      } catch (error) {
        console.error('API key validation failed:', error);
        return { accessKey: '', isValid: false };
      }
    },
    
    fetchAccounts: async () => {
      try {
        const data = await window.electronAPI.fetchAccounts();
        dispatch({ type: 'SET_ACCOUNTS', payload: data });
        return data;
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        return [];
      }
    },
    
    fetchMarkets: async () => {
      try {
        const data = await window.electronAPI.fetchMarkets();
        dispatch({ type: 'SET_MARKETS', payload: data });
        return data;
      } catch (error) {
        console.error('Failed to fetch markets:', error);
        return [];
      }
    },
    
    fetchTickers: async (symbols: string[]) => {
      try {
        const data = await window.electronAPI.fetchTickers(symbols);
        dispatch({ type: 'SET_TICKERS', payload: data });
        return data;
      } catch (error) {
        console.error('Failed to fetch tickers:', error);
        return [];
      }
    },
    
    toggleLearning: async (ticker: string, isRunning: boolean) => {
      try {
        await window.electronAPI.toggleLearning(ticker, isRunning);
        setTimeout(async () => {
          try {
            const updatedStates = await window.electronAPI.getLearningStates();
            dispatch({ type: 'SET_LEARNING_STATES', payload: updatedStates });
          } catch (error) {
            console.error('Failed to get updated learning states:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Failed to toggle learning:', error);
      }
    },
    
    fetchSupportedCoins: async () => {
      try {
        const coins = await window.electronAPI.getSupportedKrwCoins();
        dispatch({ type: 'SET_SUPPORTED_COINS', payload: coins });
        return coins;
      } catch (error) {
        console.error('Failed to fetch supported coins:', error);
        return [];
      }
    },
    
    toggleTrading: async () => {
      if (!state.tradingConfig) return;
      
      try {
        const activeTickers = state.portfolio
          .filter(p => p.enabled)
          .map(p => `KRW-${p.symbol}`);
        
        if (state.tradingState.isRunning) {
          await window.electronAPI.stopTrading();
        } else {
          await window.electronAPI.startTrading(state.tradingConfig, state.analysisConfigs);
        }
      } catch (error) {
        console.error('Failed to toggle trading:', error);
        throw error;
      }
    },
    
    fetchProfitHistory: async () => {
      try {
        const history = await window.electronAPI.getProfitHistory(30);
        dispatch({ type: 'SET_PROFIT_HISTORY', payload: history || [] });
      } catch (error) {
        console.error('Failed to fetch profit history:', error);
        dispatch({ type: 'SET_PROFIT_HISTORY', payload: [] });
      }
    },
    
    calculatePortfolioData: () => {
      const coinAccounts = state.accounts.filter(acc => acc.currency !== 'KRW' && parseFloat(acc.balance) > 0);
      const krwAccount = state.accounts.find(acc => acc.currency === 'KRW');
      
      const data: PortfolioChartItem[] = coinAccounts.map(acc => {
        const ticker = state.tickers.find(t => t.market === `KRW-${acc.currency}`);
        const value = ticker ? parseFloat(acc.balance) * ticker.trade_price : 0;
        return {
          name: acc.currency,
          value: value,
          percentage: 0
        };
      }).filter(item => item.value > 0);
      
      if (krwAccount && parseFloat(krwAccount.balance) > 0) {
        data.push({
          name: 'KRW',
          value: parseFloat(krwAccount.balance),
          percentage: 0
        });
      }
      
      const total = data.reduce((sum, item) => sum + item.value, 0);
      data.forEach(item => {
        item.percentage = total > 0 ? (item.value / total) * 100 : 0;
      });
      
      dispatch({ type: 'SET_PORTFOLIO_CHART_DATA', payload: data });
    }
  }), [state, debouncedSave]);

  // 초기 데이터 로드 (한 번만)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 백엔드에서 데이터 로드
        const [
          savedPortfolio,
          savedTradingConfig,
          savedAnalysisConfigs,
          tradingState,
          learningStates,
          supportedCoins
        ] = await Promise.all([
          window.electronAPI.getPortfolio(),
          window.electronAPI.getTradingConfig(),
          window.electronAPI.getAnalysisConfigs(),
          window.electronAPI.getTradingState(),
          window.electronAPI.getLearningStates(),
          window.electronAPI.getSupportedKrwCoins()
        ]);

        // 배치 업데이트로 한 번에 상태 설정
        dispatch({
          type: 'BATCH_UPDATE',
          payload: {
            portfolio: savedPortfolio?.length > 0 ? savedPortfolio : [],
            tradingConfig: savedTradingConfig && Object.keys(savedTradingConfig).length > 0
              ? { ...defaultTradingConfig, ...savedTradingConfig }
              : defaultTradingConfig,
            analysisConfigs: savedAnalysisConfigs?.length > 0 ? savedAnalysisConfigs : [],
            tradingState,
            learningStates,
            supportedCoins,
            isLoading: false
          }
        });

        // 초기 수익률 데이터 로드
        actions.fetchProfitHistory();
      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch({
          type: 'BATCH_UPDATE',
          payload: {
            tradingConfig: defaultTradingConfig,
            isLoading: false
          }
        });
      }
    };

    loadInitialData();
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 이벤트 리스너 설정 (한 번만)
  useEffect(() => {
    const listeners = [
      window.electronAPI.onApiKeyStatus((status) => 
        dispatch({ type: 'SET_API_KEY_STATUS', payload: status })
      ),
      window.electronAPI.onAnalysisCompleted((data) => 
        dispatch({ type: 'SET_ANALYSES', payload: data })
      ),
      window.electronAPI.onSingleAnalysisCompleted((analysis) => 
        dispatch({ type: 'UPDATE_ANALYSIS', payload: analysis })
      ),
      window.electronAPI.onTradingStateChanged((state) => 
        dispatch({ type: 'SET_TRADING_STATE', payload: state })
      ),
      window.electronAPI.onLearningProgress((states) => 
        dispatch({ type: 'SET_LEARNING_STATES', payload: states })
      ),
      window.electronAPI.onProfitUpdate((profitHistory) => 
        dispatch({ type: 'SET_PROFIT_HISTORY', payload: profitHistory })
      ),
      window.electronAPI.onAccountsUpdated((accounts) => 
        dispatch({ type: 'SET_ACCOUNTS', payload: accounts })
      )
    ];

    return () => {
      listeners.forEach(remove => remove());
    };
  }, []); // 빈 의존성 배열로 한 번만 설정

  // 포트폴리오 차트 데이터 계산 (accounts나 tickers 변경 시)
  useEffect(() => {
    if (state.accounts.length > 0 && state.tickers.length > 0) {
      actions.calculatePortfolioData();
    }
  }, [state.accounts, state.tickers]); // actions는 의존성에서 제외 (순환 참조 방지)

  // Context value 메모이제이션
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    actions
  }), [state, actions]);

  // 로딩 중이면 로딩 화면 표시
  if (state.isLoading || state.tradingConfig === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
};

// Helper hook for backward compatibility
export const useTradingState = () => {
  const { state, actions } = useTradingContext();
  return {
    ...state,
    ...actions,
    // Legacy properties for backward compatibility
    tradingState: state.tradingState,
    tradingConfig: state.tradingConfig!,
    analysisConfigs: state.analysisConfigs,
    portfolio: state.portfolio,
    analyses: state.analyses,
    accounts: state.accounts,
    markets: state.markets,
    tickers: state.tickers,
    apiKeyStatus: state.apiKeyStatus,
    learningStates: state.learningStates,
    supportedCoins: state.supportedCoins,
    profitHistory: state.profitHistory,
    portfolioChartData: state.portfolioChartData
  };
};

// Types for chart data
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