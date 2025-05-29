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
        console.log('[useElectronAPI] Stopping trading...');
        await window.electronAPI.stopTrading();
      } else {
        console.log('[useElectronAPI] Starting trading with config:', { enableRealTrading: tradingConfig.enableRealTrading });
        await window.electronAPI.startTrading(tradingConfig, analysisConfigs);
      }
    } catch (error) {
      console.error('Failed to toggle trading:', error);
    }
  }, [tradingState.isRunning]);

  // 거래 시작
  const startTrading = useCallback(async (tradingConfig: TradingConfig, analysisConfigs: any[]) => {
    try {
      console.log('[useElectronAPI] Starting trading with config:', { enableRealTrading: tradingConfig.enableRealTrading });
      return await window.electronAPI.startTrading(tradingConfig, analysisConfigs);
    } catch (error) {
      console.error('Failed to start trading:', error);
      throw error;
    }
  }, []);

  // 거래 중지
  const stopTrading = useCallback(async () => {
    try {
      console.log('[useElectronAPI] Stopping trading...');
      return await window.electronAPI.stopTrading();
    } catch (error) {
      console.error('Failed to stop trading:', error);
      throw error;
    }
  }, []);

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

  // VaR 리포트 생성
  const generateRiskReport = useCallback(async () => {
    try {
      return await window.electronAPI.generateRiskReport();
    } catch (error) {
      console.error('Failed to generate risk report:', error);
      return null;
    }
  }, []);

  // 포트폴리오 정보 조회
  const getPortfolio = useCallback(async () => {
    try {
      return await window.electronAPI.getPortfolio();
    } catch (error) {
      console.error('Failed to get portfolio:', error);
      return [];
    }
  }, []);

  // 리밸런싱 설정 조회
  const getRebalancingConfig = useCallback(async () => {
    try {
      return await window.electronAPI.getRebalancingConfig();
    } catch (error) {
      console.error('Failed to get rebalancing config:', error);
      return null;
    }
  }, []);

  // 리밸런싱 설정 저장
  const saveRebalancingConfig = useCallback(async (config: any) => {
    try {
      return await window.electronAPI.saveRebalancingConfig(config);
    } catch (error) {
      console.error('Failed to save rebalancing config:', error);
      return false;
    }
  }, []);

  // 리밸런싱 실행
  const executeRebalancing = useCallback(async () => {
    try {
      return await window.electronAPI.executeRebalancing();
    } catch (error) {
      console.error('Failed to execute rebalancing:', error);
      return { success: false };
    }
  }, []);

  // 리밸런싱 시뮬레이션
  const simulateRebalancing = useCallback(async () => {
    try {
      return await window.electronAPI.simulateRebalancing();
    } catch (error) {
      console.error('Failed to simulate rebalancing:', error);
      return null;
    }
  }, []);

  // 쿨다운 정보 조회
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

  // 이벤트 리스너 설정
  useEffect(() => {
    const removeApiKeyListener = window.electronAPI.onApiKeyStatus((status) => {
      setApiKeyStatus(status);
    });

    const removeAnalysisListener = window.electronAPI.onAnalysisCompleted((data) => {
      console.log('[useElectronAPI] Analysis completed event received:', data);
      setAnalyses(data);
    });
    
    // single-analysis-completed 이벤트도 리스닝
    const removeSingleAnalysisListener = window.electronAPI.onSingleAnalysisCompleted((analysis) => {
      console.log('[useElectronAPI] Single analysis completed event received:', analysis);
      setAnalyses(prev => {
        console.log('[useElectronAPI] Previous analyses:', prev);
        // 기존 분석 중 같은 ticker가 있으면 업데이트, 없으면 추가
        const existingIndex = prev.findIndex(a => a.ticker === analysis.ticker);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = analysis;
          console.log('[useElectronAPI] Updated analyses:', updated);
          return updated;
        } else {
          const newAnalyses = [...prev, analysis];
          console.log('[useElectronAPI] New analyses:', newAnalyses);
          return newAnalyses;
        }
      });
    });

    console.log('[useElectronAPI] Setting up trading state listener');
    const removeTradingStateListener = window.electronAPI.onTradingStateChanged((state) => {
      console.log('[useElectronAPI] Trading state changed event received:', state);
      console.log('[useElectronAPI] Previous state:', tradingState);
      // 새 객체로 복사하여 React가 변경을 감지하도록 함
      setTradingState({ ...state });
    });

    const removeLearningListener = window.electronAPI.onLearningProgress((states) => {
      console.log('[useElectronAPI] Learning progress event received:', states);
      setLearningStates(states);
    });
    
    // 초기 거래 상태 로드
    window.electronAPI.getTradingState().then((state) => {
      console.log('[useElectronAPI] Initial trading state loaded:', state);
      setTradingState(state);
    }).catch(console.error);
    
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
      removeSingleAnalysisListener();
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
    startTrading,
    stopTrading,
    runBacktest,
    toggleLearning,
    fetchSupportedCoins,
    generateRiskReport,
    getPortfolio,
    getRebalancingConfig,
    saveRebalancingConfig,
    executeRebalancing,
    simulateRebalancing,
    getCooldownInfo,
    
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
  };
};