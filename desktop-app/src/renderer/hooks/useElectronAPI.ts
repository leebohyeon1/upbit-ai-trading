import { useEffect, useState, useCallback } from 'react';
import { 
  ApiKeyStatus, 
  Account, 
  MarketData, 
  TickerData, 
  Analysis, 
  TradingState,
  TradingConfig,
  LearningState,
  BacktestResult
} from '../types';

export const useElectronAPI = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({ 
    accessKey: '', 
    isValid: false 
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [tradingState, setTradingState] = useState<TradingState>({
    isRunning: false,
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    aiEnabled: false
  });
  const [learningStates, setLearningStates] = useState<LearningState[]>([]);
  const [supportedCoins, setSupportedCoins] = useState<string[]>([]);

  // API 키 검증
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

  // 계좌 정보 조회
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

  // 마켓 정보 조회
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

  // 티커 정보 조회
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

  // 거래 시작/중지
  const toggleTrading = useCallback(async (tradingConfig: TradingConfig, analysisConfigs: any[]) => {
    try {
      if (tradingState.isRunning) {
        await window.electronAPI.stopTrading();
      } else {
        await window.electronAPI.toggleTrading(tradingConfig, analysisConfigs);
      }
    } catch (error) {
      console.error('Failed to toggle trading:', error);
    }
  }, [tradingState.isRunning]);

  // 백테스트 실행
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

  // 학습 시작/중지
  const toggleLearning = useCallback(async (ticker: string, isRunning: boolean) => {
    try {
      console.log('[useElectronAPI] toggleLearning called:', ticker, isRunning);
      await window.electronAPI.toggleLearning(ticker, isRunning);
      
      // 학습 상태가 업데이트될 때까지 잠시 대기 후 상태 다시 가져오기
      setTimeout(async () => {
        try {
          const updatedStates = await window.electronAPI.getLearningStates();
          console.log('[useElectronAPI] Updated learning states:', updatedStates);
          setLearningStates(updatedStates);
        } catch (error) {
          console.error('[useElectronAPI] Failed to get updated learning states:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to toggle learning:', error);
    }
  }, []);

  // 지원되는 KRW 코인 목록 조회
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

  // 이벤트 리스너 설정
  useEffect(() => {
    const removeApiKeyListener = window.electronAPI.onApiKeyStatus((status) => {
      setApiKeyStatus(status);
    });

    const removeAnalysisListener = window.electronAPI.onAnalysisCompleted((data) => {
      setAnalyses(data);
    });

    const removeTradingStateListener = window.electronAPI.onTradingStateChanged((state) => {
      setTradingState(state);
    });

    const removeLearningListener = window.electronAPI.onLearningProgress((states) => {
      console.log('[useElectronAPI] Learning progress event received:', states);
      setLearningStates(states);
    });
    
    // 초기 학습 상태 로드
    window.electronAPI.getLearningStates().then((states) => {
      console.log('[useElectronAPI] Initial learning states loaded:', states);
      setLearningStates(states);
    }).catch(console.error);

    // 초기 지원 코인 목록 로드
    window.electronAPI.getSupportedKrwCoins().then((coins) => {
      console.log('[useElectronAPI] Supported coins loaded:', coins);
      setSupportedCoins(coins);
    }).catch(console.error);

    return () => {
      removeApiKeyListener();
      removeAnalysisListener();
      removeTradingStateListener();
      removeLearningListener();
    };
  }, []);

  return {
    // States
    apiKeyStatus,
    accounts,
    markets,
    tickers,
    analyses,
    tradingState,
    learningStates,
    supportedCoins,
    
    // Actions
    validateApiKey,
    fetchAccounts,
    fetchMarkets,
    fetchTickers,
    toggleTrading,
    runBacktest,
    toggleLearning,
    fetchSupportedCoins
  };
};