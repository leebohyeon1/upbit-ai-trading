import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Card,
  CardContent,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Minimize,
  TrendingUp,
  Psychology,
  Dashboard,
  AccountBalance,
  Add,
  Delete,
  Settings,
  Visibility,
  VisibilityOff,
  Save,
  Tune,
  PowerSettingsNew,
  ShowChart,
  Timeline,
  AccountCircle,
  NotificationImportant,
  Star,
  Upgrade,
  Menu,
  Close,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

interface TradingState {
  isRunning: boolean;
  aiEnabled: boolean;
  lastUpdate: string;
}

interface TradingAnalysis {
  ticker: string;
  decision: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  timestamp: string;
}

interface PortfolioCoin {
  ticker: string;
  name: string;
  enabled: boolean;
  currentPrice?: number;
  change24h?: number;
  balance?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ApiKeys {
  upbitAccessKey: string;
  upbitSecretKey: string;
  anthropicApiKey: string;
  enableRealTrade?: boolean;
}

interface AnalysisConfig {
  ticker: string;
  analysisInterval: number; // 분 단위
  buyThreshold: number; // 0-100
  sellThreshold: number; // 0-100
  stopLoss: number; // %
  takeProfit: number; // %
}

interface TradingConfig {
  decisionThresholds: {
    buyThreshold: number;
    sellThreshold: number;
  };
  investmentRatios: {
    minRatio: number;
    maxRatio: number;
    perCoinMaxRatio: number;
  };
  signalStrengths: {
    [key: string]: number;
  };
  indicatorWeights: {
    [key: string]: number;
  };
  indicatorUsage: {
    [key: string]: boolean;
  };
  tradingSettings: {
    minOrderAmount: number;
    maxSlippage: number;
    tradingInterval: number;
    cooldown: {
      enabled: boolean;
      buyMinutes: number;
      sellMinutes: number;
      minConfidenceOverride: number;
    };
    selling: {
      defaultSellRatio: number; // 기본 매도 비율
      confidenceBasedAdjustment: boolean; // 신뢰도 기반 조정 활성화
      highConfidenceMultiplier: number; // 고신뢰도 배율
      lowConfidenceMultiplier: number; // 저신뢰도 배율
    };
  };
}

declare global {
  interface Window {
    electronAPI: {
      getTradingState: () => Promise<TradingState>;
      startTrading: (tickers: string[]) => Promise<boolean>;
      stopTrading: () => Promise<boolean>;
      toggleAI: (enabled: boolean) => Promise<boolean>;
      toggleRealTrade: (enabled: boolean) => Promise<boolean>;
      minimizeToTray: () => Promise<void>;
      onTradingStateChanged: (callback: (state: TradingState) => void) => void;
      onAnalysisUpdate: (callback: (analysis: TradingAnalysis) => void) => void;
      saveApiKeys: (keys: ApiKeys) => Promise<boolean>;
      getApiKeys: () => Promise<ApiKeys>;
      savePortfolio: (portfolio: PortfolioCoin[]) => Promise<boolean>;
      getPortfolio: () => Promise<PortfolioCoin[]>;
      saveAnalysisConfigs: (configs: AnalysisConfig[]) => Promise<boolean>;
      getAnalysisConfigs: () => Promise<AnalysisConfig[]>;
      saveTradingConfig: (config: TradingConfig) => Promise<boolean>;
      getTradingConfig: () => Promise<TradingConfig>;
    };
  }
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3, height: 'calc(100vh - 80px)', overflow: 'auto' }}>{children}</Box>}
    </div>
  );
}

const App: React.FC = () => {
  const [tradingState, setTradingState] = useState<TradingState>({
    isRunning: false,
    aiEnabled: false,
    lastUpdate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState('KRW-BTC');
  const [portfolio, setPortfolio] = useState<PortfolioCoin[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    upbitAccessKey: '',
    upbitSecretKey: '',
    anthropicApiKey: '',
    enableRealTrade: false
  });
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<TradingAnalysis[]>([]);
  const [nextAnalysisTime, setNextAnalysisTime] = useState<number>(60);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [analysisConfigs, setAnalysisConfigs] = useState<AnalysisConfig[]>([]);
  const [selectedAnalysisCoin, setSelectedAnalysisCoin] = useState<string | null>(null);
  const [analysisDetailOpen, setAnalysisDetailOpen] = useState(false);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState<TradingAnalysis | null>(null);
  const [tradingConfig, setTradingConfig] = useState<TradingConfig>({
    decisionThresholds: { buyThreshold: 0.15, sellThreshold: -0.2 },
    investmentRatios: { minRatio: 0.15, maxRatio: 0.5, perCoinMaxRatio: 0.2 },
    signalStrengths: {},
    indicatorWeights: {},
    indicatorUsage: {},
    tradingSettings: {
      minOrderAmount: 5000,
      maxSlippage: 0.005,
      tradingInterval: 1,
      cooldown: {
        enabled: true,
        buyMinutes: 30,
        sellMinutes: 20,
        minConfidenceOverride: 0.85
      },
      selling: {
        defaultSellRatio: 0.5,
        confidenceBasedAdjustment: true,
        highConfidenceMultiplier: 1.5,
        lowConfidenceMultiplier: 0.7
      }
    }
  });
  const [advancedConfigOpen, setAdvancedConfigOpen] = useState(false);
  const [advancedConfigTab, setAdvancedConfigTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  // 기술적 지표 목록
  const indicators = [
    { key: 'MA', name: '이동평균선', category: 'trend' },
    { key: 'MA60', name: '장기 이동평균선', category: 'trend' },
    { key: 'BB', name: '볼린저 밴드', category: 'volatility' },
    { key: 'RSI', name: 'RSI (상대강도지수)', category: 'momentum' },
    { key: 'MACD', name: 'MACD', category: 'momentum' },
    { key: 'Stochastic', name: '스토캐스틱', category: 'momentum' },
    { key: 'Orderbook', name: '호가창 분석', category: 'market' },
    { key: 'Trades', name: '체결 데이터', category: 'market' },
    { key: 'KIMP', name: '김프(한국 프리미엄)', category: 'market' },
    { key: 'FearGreed', name: '공포&탐욕 지수', category: 'sentiment' },
    { key: 'SOPR', name: '온체인 SOPR', category: 'onchain' },
    { key: 'ActiveAddr', name: '온체인 활성 주소', category: 'onchain' }
  ];

  const signalStrengthKeys = [
    { key: 'ma_crossover', name: '이동평균선 크로스', min: 0, max: 1, step: 0.05 },
    { key: 'ma_long_trend', name: '장기 이동평균선 추세', min: 0, max: 1, step: 0.05 },
    { key: 'bb_extreme', name: '볼린저 밴드 돌파', min: 0, max: 1, step: 0.05 },
    { key: 'bb_middle', name: '볼린저 밴드 내부', min: 0, max: 1, step: 0.05 },
    { key: 'rsi_extreme', name: 'RSI 과매수/과매도', min: 0, max: 1, step: 0.05 },
    { key: 'rsi_middle', name: 'RSI 중간 영역', min: 0, max: 1, step: 0.05 },
    { key: 'macd_crossover', name: 'MACD 크로스', min: 0, max: 1, step: 0.05 },
    { key: 'macd_trend', name: 'MACD 추세', min: 0, max: 1, step: 0.05 },
    { key: 'stoch_extreme', name: '스토캐스틱 극값', min: 0, max: 1, step: 0.05 },
    { key: 'stoch_middle', name: '스토캐스틱 반전', min: 0, max: 1, step: 0.05 },
    { key: 'orderbook', name: '호가창 비율', min: 0, max: 1, step: 0.05 },
    { key: 'trade_data', name: '체결 데이터', min: 0, max: 1, step: 0.05 },
    { key: 'korea_premium', name: '김프', min: 0, max: 1, step: 0.05 },
    { key: 'fear_greed_extreme', name: '극단적 공포/탐욕', min: 0, max: 1, step: 0.05 },
    { key: 'fear_greed_middle', name: '보통 공포/탐욕', min: 0, max: 1, step: 0.05 },
    { key: 'onchain_sopr', name: '온체인 SOPR', min: 0, max: 1, step: 0.05 },
    { key: 'onchain_active_addr', name: '온체인 활성 주소', min: 0, max: 1, step: 0.05 }
  ];
  
  // 인기 코인 목록
  const popularCoins = [
    { ticker: 'KRW-BTC', name: '비트코인 (BTC)' },
    { ticker: 'KRW-ETH', name: '이더리움 (ETH)' },
    { ticker: 'KRW-XRP', name: '리플 (XRP)' },
    { ticker: 'KRW-DOGE', name: '도지코인 (DOGE)' },
    { ticker: 'KRW-SOL', name: '솔라나 (SOL)' },
    { ticker: 'KRW-ADA', name: '카르다노 (ADA)' },
    { ticker: 'KRW-AVAX', name: '아발란체 (AVAX)' },
    { ticker: 'KRW-DOT', name: '폴카닷 (DOT)' },
    { ticker: 'KRW-LINK', name: '체인링크 (LINK)' },
  ];

  useEffect(() => {
    // 초기 상태 로드
    loadTradingState();
    loadApiKeys();
    loadPortfolio();
    loadAnalysisConfigs();
    loadTradingConfig();

    // 상태 변경 리스너 등록
    window.electronAPI.onTradingStateChanged((state) => {
      setTradingState(state);
    });

    // 분석 업데이트 리스너 등록
    window.electronAPI.onAnalysisUpdate((analysis) => {
      console.log('Received analysis update:', analysis);
      
      // 단일 분석 결과인지 배열인지 확인
      if (Array.isArray(analysis)) {
        // 배열인 경우 모든 분석 결과로 교체
        setRecentAnalyses(analysis);
      } else {
        // 단일 분석인 경우 기존 로직 사용
        setRecentAnalyses(prev => {
          // 각 코인별로 최신 분석만 유지
          const filtered = prev.filter(a => a.ticker !== analysis.ticker);
          return [analysis, ...filtered];
        });
      }
      setNextAnalysisTime(60); // 타이머 리셋
    });

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  const loadTradingState = async () => {
    try {
      const state = await window.electronAPI.getTradingState();
      setTradingState(state);
    } catch (err) {
      setError('상태를 불러오는데 실패했습니다.');
    }
  };

  const handleStartTrading = async () => {
    setLoading(true);
    setError(null);
    try {
      // 포트폴리오에서 활성화된 코인들만 선택
      const activeTickers = portfolio
        .filter(coin => coin.enabled)
        .map(coin => coin.ticker);
      
      if (activeTickers.length === 0) {
        setError('거래할 코인을 선택해주세요.');
        setLoading(false);
        return;
      }
      
      const success = await window.electronAPI.startTrading(activeTickers);
      if (!success) {
        setError('자동매매 시작에 실패했습니다.');
      } else {
        // 타이머 시작
        startAnalysisTimer();
      }
    } catch (err) {
      setError('자동매매 시작 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTrading = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await window.electronAPI.stopTrading();
      if (!success) {
        setError('자동매매 중지에 실패했습니다.');
      } else {
        // 타이머 중지
        stopAnalysisTimer();
      }
    } catch (err) {
      setError('자동매매 중지 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAI = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setError(null);
    try {
      const success = await window.electronAPI.toggleAI(enabled);
      if (!success) {
        setError('AI 설정 변경에 실패했습니다.');
      }
    } catch (err) {
      setError('AI 설정 변경 중 오류가 발생했습니다.');
    }
  };

  const handleMinimize = () => {
    window.electronAPI.minimizeToTray();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddToPortfolio = async () => {
    const selectedCoin = popularCoins.find(coin => coin.ticker === selectedTicker);
    if (selectedCoin && !portfolio.find(p => p.ticker === selectedCoin.ticker)) {
      const newPortfolio = [...portfolio, {
        ...selectedCoin,
        enabled: true,
        currentPrice: 0,
        change24h: 0,
        balance: 0
      }];
      setPortfolio(newPortfolio);
      await savePortfolio();
    }
  };

  const handleRemoveFromPortfolio = async (ticker: string) => {
    const newPortfolio = portfolio.filter(coin => coin.ticker !== ticker);
    setPortfolio(newPortfolio);
    await window.electronAPI.savePortfolio(newPortfolio);
  };

  const handleToggleCoin = async (ticker: string) => {
    const newPortfolio = portfolio.map(coin => 
      coin.ticker === ticker ? { ...coin, enabled: !coin.enabled } : coin
    );
    setPortfolio(newPortfolio);
    await window.electronAPI.savePortfolio(newPortfolio);
  };

  const loadApiKeys = async () => {
    try {
      const keys = await window.electronAPI.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const handleSaveApiKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const success = await window.electronAPI.saveApiKeys(apiKeys);
      if (success) {
        // 성공 메시지를 위한 별도 상태 추가 또는 Alert 컴포넌트 사용
        setSuccessMessage('API 키가 저장되었습니다.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('API 키 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('API 키 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRealTrade = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    console.log('Real trade toggle clicked:', enabled);
    setError(null);
    
    // 상태 업데이트
    setApiKeys({...apiKeys, enableRealTrade: enabled});
    
    // 즉시 API 호출
    try {
      console.log('Calling toggleRealTrade API...');
      const success = await window.electronAPI.toggleRealTrade(enabled);
      console.log('toggleRealTrade result:', success);
      
      if (success) {
        setSuccessMessage(`실제 거래가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('실제 거래 설정 변경에 실패했습니다.');
        // 실패시 상태 롤백
        setApiKeys({...apiKeys, enableRealTrade: !enabled});
      }
    } catch (err) {
      console.error('Real trade toggle error:', err);
      setError('실제 거래 설정 변경 중 오류가 발생했습니다.');
      // 실패시 상태 롤백
      setApiKeys({...apiKeys, enableRealTrade: !enabled});
    }
  };

  const loadPortfolio = async () => {
    try {
      const savedPortfolio = await window.electronAPI.getPortfolio();
      if (savedPortfolio && savedPortfolio.length > 0) {
        setPortfolio(savedPortfolio);
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    }
  };

  const savePortfolio = async () => {
    try {
      await window.electronAPI.savePortfolio(portfolio);
    } catch (err) {
      console.error('Failed to save portfolio:', err);
    }
  };

  const startAnalysisTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const interval = setInterval(() => {
      setNextAnalysisTime(prev => {
        if (prev <= 1) {
          return 60; // 리셋
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopAnalysisTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setNextAnalysisTime(60);
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'buy': return 'success';
      case 'sell': return 'error';
      case 'hold': return 'info';
      default: return 'default';
    }
  };

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case 'buy': return '매수';
      case 'sell': return '매도';
      case 'hold': return '대기';
      default: return decision;
    }
  };

  const loadAnalysisConfigs = async () => {
    try {
      const configs = await window.electronAPI.getAnalysisConfigs();
      setAnalysisConfigs(configs);
    } catch (err) {
      console.error('Failed to load analysis configs:', err);
    }
  };

  const saveAnalysisConfigs = async () => {
    try {
      await window.electronAPI.saveAnalysisConfigs(analysisConfigs);
      setSuccessMessage('분석 설정이 저장되었습니다.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('분석 설정 저장에 실패했습니다.');
    }
  };

  const loadTradingConfig = async () => {
    try {
      const config = await window.electronAPI.getTradingConfig();
      if (config) {
        setTradingConfig(config);
      } else {
        initializeTradingConfig();
      }
    } catch (err) {
      console.error('Failed to load trading config:', err);
      initializeTradingConfig();
    }
  };

  const initializeTradingConfig = () => {
    setTradingConfig({
      decisionThresholds: { buyThreshold: 0.15, sellThreshold: -0.2 },
      investmentRatios: { minRatio: 0.15, maxRatio: 0.5, perCoinMaxRatio: 0.2 },
      signalStrengths: {
        ma_crossover: 0.7, ma_long_trend: 0.5,
        bb_extreme: 0.8, bb_middle: 0.3,
        rsi_extreme: 0.95, rsi_middle: 0.4,
        macd_crossover: 0.9, macd_trend: 0.5,
        stoch_extreme: 0.7, stoch_middle: 0.3,
        orderbook: 0.7, trade_data: 0.6, korea_premium: 0.7,
        fear_greed_extreme: 0.9, fear_greed_middle: 0.6,
        onchain_sopr: 0.7, onchain_active_addr: 0.5
      },
      indicatorWeights: {
        MA: 0.8, MA60: 0.7, BB: 1.3, RSI: 1.5, MACD: 1.5, Stochastic: 1.3,
        Orderbook: 1.1, Trades: 0.9, KIMP: 1.2, FearGreed: 1.4, SOPR: 0.6, ActiveAddr: 0.5
      },
      indicatorUsage: {
        MA: true, MA60: true, BB: true, RSI: true, MACD: true, Stochastic: true,
        Orderbook: true, Trades: true, KIMP: true, FearGreed: true, SOPR: true, ActiveAddr: true
      },
      tradingSettings: {
        minOrderAmount: 5000,
        maxSlippage: 0.005,
        tradingInterval: 1,
        cooldown: { enabled: true, buyMinutes: 30, sellMinutes: 20, minConfidenceOverride: 0.85 },
        selling: {
          defaultSellRatio: 0.5, // 기본 50% 매도
          confidenceBasedAdjustment: true, // 신뢰도 기반 조정 활성화
          highConfidenceMultiplier: 1.5, // 고신뢰도 배율 (×1.5)
          lowConfidenceMultiplier: 0.7 // 저신뢰도 배율 (×0.7)
        }
      }
    });
  };

  const saveTradingConfig = async () => {
    try {
      const success = await window.electronAPI.saveTradingConfig(tradingConfig);
      if (success) {
        setSuccessMessage('고급 분석 설정이 저장되었습니다.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('고급 분석 설정 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('고급 분석 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const getConfigForTicker = (ticker: string): AnalysisConfig => {
    const config = analysisConfigs.find(c => c.ticker === ticker);
    return config || {
      ticker,
      analysisInterval: 1, // 기본 1분
      buyThreshold: 70,
      sellThreshold: 30,
      stopLoss: 5,
      takeProfit: 10
    };
  };

  const updateConfigForTicker = (ticker: string, updates: Partial<AnalysisConfig>) => {
    const newConfigs = [...analysisConfigs];
    const index = newConfigs.findIndex(c => c.ticker === ticker);
    
    if (index >= 0) {
      newConfigs[index] = { ...newConfigs[index], ...updates };
    } else {
      newConfigs.push({ ...getConfigForTicker(ticker), ...updates });
    }
    
    setAnalysisConfigs(newConfigs);
  };

  // AI 분석 이유를 자연스러운 글 형식으로 변환
  const formatAIReason = (reason: string, decision: string): string => {
    const decisionKorean = {
      'buy': '매수',
      'sell': '매도',
      'hold': '관망'
    }[decision] || '관망';
    
    // 이미 자연스러운 형식이면 그대로 반환
    if (reason.includes('판단했습니다') || reason.includes('결정했습니다')) {
      return reason;
    }
    
    // 간단한 이유인 경우 자연스러운 문장으로 변환
    return `AI는 ${reason.toLowerCase()}는 이유로 ${decisionKorean}를 결정했습니다.`;
  };

  // 분석 상세 정보 표시
  const handleShowAnalysisDetail = (coin: PortfolioCoin) => {
    const analysis = recentAnalyses.find(a => a.ticker === coin.ticker);
    if (analysis) {
      setSelectedAnalysisDetail(analysis);
      setAnalysisDetailOpen(true);
    }
  };

  const renderSidebar = () => (
    <Box sx={{ 
      width: sidebarOpen ? 200 : 0, 
      height: '100vh', 
      bgcolor: 'background.paper', 
      borderRight: sidebarOpen ? 1 : 0, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      overflow: 'hidden',
      transition: 'width 0.3s ease-in-out'
    }}>
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUp color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Upbit AI
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 2 }}>
        {[
          { label: '대시보드', icon: <Dashboard />, value: 0 },
          { label: '포트폴리오', icon: <AccountBalance />, value: 1 },
          { label: '분석설정', icon: <ShowChart />, value: 2 },
          { label: '환경설정', icon: <Settings />, value: 3 },
        ].map((item) => (
          <Button
            key={item.value}
            fullWidth
            startIcon={item.icon}
            onClick={() => setTabValue(item.value)}
            sx={{
              justifyContent: 'flex-start',
              px: 3,
              py: 1.5,
              mb: 0.5,
              color: tabValue === item.value ? 'primary.main' : 'text.secondary',
              bgcolor: tabValue === item.value ? 'primary.50' : 'transparent',
              '&:hover': {
                bgcolor: tabValue === item.value ? 'primary.100' : 'grey.50'
              }
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>

      {/* Status/Upgrade Section */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Card sx={{ bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Star color="primary" fontSize="small" />
              <Typography variant="body2" fontWeight="bold">
                AI 상태
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {tradingState.aiEnabled ? 'AI 활성화됨' : 'AI 비활성화됨'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  const renderRightSidebar = () => (
    <Box sx={{ 
      width: rightPanelOpen ? 300 : 0, 
      height: '100vh', 
      bgcolor: 'background.paper', 
      borderLeft: rightPanelOpen ? 1 : 0, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 1000,
      overflow: rightPanelOpen ? 'auto' : 'hidden',
      transition: 'width 0.3s ease-in-out'
    }}>
      {/* User Profile */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AccountCircle />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              트레이더
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI 자동매매 시스템
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={2}>
          빠른 통계
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              활성 코인
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {portfolio.filter(c => c.enabled).length}개
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              거래 상태
            </Typography>
            <Chip
              label={tradingState.isRunning ? '실행중' : '중지됨'}
              color={tradingState.isRunning ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              AI 상태
            </Typography>
            <Chip
              label={tradingState.aiEnabled ? '활성' : '비활성'}
              color={tradingState.aiEnabled ? 'primary' : 'default'}
              size="small"
            />
          </Box>
        </Box>
      </Box>

      {/* Recent Activities */}
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="subtitle2" fontWeight="bold" mb={2}>
          최근 활동
        </Typography>
        {recentAnalyses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            분석 결과가 없습니다. (배열 길이: {recentAnalyses.length})
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {recentAnalyses.slice(0, 5).map((analysis, index) => (
              <Card key={index} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight="bold">
                      {analysis.ticker?.replace('KRW-', '') || 'Unknown'}
                    </Typography>
                    <Chip
                      label={getDecisionText(analysis.decision || 'HOLD')}
                      color={getDecisionColor(analysis.decision || 'HOLD') as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    신뢰도: {((analysis.confidence || 0) * 100).toFixed(0)}%
                  </Typography>
                  {tradingState.aiEnabled && analysis.reason && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      display="block" 
                      sx={{ 
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                        fontStyle: 'italic'
                      }}
                    >
                      💡 {formatAIReason(analysis.reason, analysis.decision)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderMainContent = () => (
    <Box sx={{ 
      ml: sidebarOpen ? '200px' : 0, 
      mr: rightPanelOpen ? '300px' : 0, 
      minHeight: '100vh',
      bgcolor: 'grey.50',
      p: 3,
      transition: 'margin 0.3s ease-in-out'
    }}>
      {/* Top Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        {/* Left Side - Navigation Controls */}
        <Box display="flex" gap={1} alignItems="center">
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ 
              bgcolor: sidebarOpen ? 'primary.50' : 'transparent',
              '&:hover': { bgcolor: sidebarOpen ? 'primary.100' : 'grey.100' }
            }}
          >
            <Menu />
          </IconButton>
          
          {/* Logo when sidebar is closed */}
          {!sidebarOpen && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mr: 2 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" fontWeight="bold" color="primary">
                Upbit AI
              </Typography>
            </Box>
          )}
          
          {/* Tab Navigation when sidebar is closed */}
          {!sidebarOpen && (
            <Box display="flex" gap={1} sx={{ flexWrap: 'wrap' }}>
              {[
                { label: '대시보드', icon: <Dashboard />, value: 0 },
                { label: '포트폴리오', icon: <AccountBalance />, value: 1 },
                { label: '분석설정', icon: <ShowChart />, value: 2 },
                { label: '환경설정', icon: <Settings />, value: 3 },
              ].map((item) => (
                <Button
                  key={item.value}
                  variant={tabValue === item.value ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={item.icon}
                  onClick={() => setTabValue(item.value)}
                  sx={{ 
                    minWidth: { xs: 100, sm: 120 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {item.label}
                  </Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    {item.icon}
                  </Box>
                </Button>
              ))}
            </Box>
          )}
        </Box>
        
        {/* Right Side - Action Controls */}
        <Box display="flex" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={tradingState.aiEnabled}
                onChange={handleToggleAI}
              />
            }
            label="AI 모드"
          />
          {tradingState.isRunning ? (
            <Button
              variant="contained"
              color="error"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Stop />}
              onClick={handleStopTrading}
              disabled={loading}
            >
              자동매매 중지
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
              onClick={handleStartTrading}
              disabled={loading || portfolio.filter(c => c.enabled).length === 0}
            >
              자동매매 시작
            </Button>
          )}
          <IconButton
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            sx={{ 
              bgcolor: rightPanelOpen ? 'info.50' : 'transparent',
              '&:hover': { bgcolor: rightPanelOpen ? 'info.100' : 'grey.100' }
            }}
          >
            <Timeline />
          </IconButton>
          <IconButton onClick={handleMinimize}>
            <Minimize />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}


      {/* Stats Cards */}
      {tabValue === 0 && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AccountBalance />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {portfolio.filter(c => c.enabled).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      활성 코인
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Timeline />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {recentAnalyses.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      분석 완료
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: tradingState.isRunning ? 'success.main' : 'grey.500' }}>
                    <PowerSettingsNew />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {tradingState.isRunning ? '실행중' : '중지됨'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      거래 상태
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: tradingState.aiEnabled ? 'primary.main' : 'grey.500' }}>
                    <Psychology />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {tradingState.aiEnabled ? '활성' : '비활성'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI 상태
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Coin Cards */}
        <Typography variant="h6" fontWeight="bold" mb={3}>
          포트폴리오 코인
        </Typography>
        {portfolio.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <AccountBalance sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                포트폴리오가 비어있습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                포트폴리오 탭에서 코인을 추가하여 시작하세요
              </Typography>
              <Button variant="contained" onClick={() => setTabValue(1)}>
                코인 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {portfolio.map((coin) => {
              const analysis = recentAnalyses.find(a => a.ticker === coin.ticker);
              return (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={coin.ticker}>
                  <Card 
                    sx={{ 
                      border: coin.enabled ? 2 : 1,
                      borderColor: coin.enabled ? 'primary.main' : 'divider',
                      opacity: coin.enabled ? 1 : 0.6,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handleShowAnalysisDetail(coin)}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          {coin.ticker?.replace('KRW-', '') || 'Unknown'}
                        </Typography>
                        <Chip
                          label={coin.enabled ? '활성' : '비활성'}
                          color={coin.enabled ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {coin.name}
                      </Typography>
                      {analysis && (
                        <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2">최근 분석:</Typography>
                            <Chip
                              label={getDecisionText(analysis.decision)}
                              color={getDecisionColor(analysis.decision) as any}
                              size="small"
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={analysis.confidence * 100}
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary" display="block">
                            신뢰도: {((analysis.confidence || 0) * 100).toFixed(0)}%
                          </Typography>
                          {tradingState.aiEnabled && analysis.reason && (
                            <Box sx={{ 
                              mt: 1.5, 
                              p: 1.5, 
                              bgcolor: 'grey.50', 
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'grey.200'
                            }}>
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                display="block" 
                                sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: 1.5,
                                  fontStyle: 'italic'
                                }}
                              >
                                <Typography component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  🤖 AI 분석 의견:
                                </Typography>
                                <br />
                                {formatAIReason(analysis.reason, analysis.decision)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                      <Typography variant="caption" display="block" textAlign="center" mt={2} color="primary">
                        클릭하여 상세 분석 보기
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
        
        {/* Additional Dashboard Content */}
        {portfolio.length > 0 && (
          <>
            {/* Market Overview Section */}
            <Typography variant="h6" fontWeight="bold" mb={3} mt={4}>
              시장 현황 및 분석
            </Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📊 실시간 차트
                    </Typography>
                    <Box sx={{ 
                      height: 300, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      border: '2px dashed',
                      borderColor: 'grey.300'
                    }}>
                      <ShowChart sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        실시간 가격 차트
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        선택된 코인의 실시간 가격 변동을 확인하세요
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎯 오늘의 거래 현황
                    </Typography>
                    <Box sx={{ height: 300, overflow: 'auto' }}>
                      {recentAnalyses.length === 0 ? (
                        <Box sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <Timeline sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            거래 기록이 없습니다
                          </Typography>
                        </Box>
                      ) : (
                        <List>
                          {recentAnalyses.map((analysis, index) => (
                            <ListItem key={index} divider>
                              <ListItemText
                                primary={
                                  <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2">
                                      {analysis.ticker?.replace('KRW-', '') || 'Unknown'}
                                    </Typography>
                                    <Chip
                                      label={getDecisionText(analysis.decision || 'HOLD')}
                                      color={getDecisionColor(analysis.decision || 'HOLD') as any}
                                      size="small"
                                    />
                                  </Box>
                                }
                                secondary={`신뢰도: ${((analysis.confidence || 0) * 100).toFixed(0)}%`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Metrics */}
            <Typography variant="h6" fontWeight="bold" mb={3}>
              📈 성과 분석
            </Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      +5.2%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      오늘 수익률
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                      <Star />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {recentAnalyses.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      오늘 분석 횟수
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                      <Psychology />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {recentAnalyses.filter(a => (a.confidence || 0) > 0.7).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      고신뢰도 신호
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                      <AccountBalance />
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      ₩0
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      오늘 거래량
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Market Analysis Summary */}
            <Typography variant="h6" fontWeight="bold" mb={3}>
              🔍 시장 분석 요약
            </Typography>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      💡 AI 분석 인사이트
                    </Typography>
                    {tradingState.aiEnabled ? (
                      <Box>
                        <Typography variant="body1" paragraph>
                          현재 시장은 {portfolio.filter(c => c.enabled).length}개 코인을 대상으로 분석 중입니다.
                        </Typography>
                        <Typography variant="body1" paragraph>
                          • 최근 분석에서 매수 신호: {recentAnalyses.filter(a => a.decision === 'buy').length}개
                        </Typography>
                        <Typography variant="body1" paragraph>
                          • 최근 분석에서 매도 신호: {recentAnalyses.filter(a => a.decision === 'sell').length}개
                        </Typography>
                        <Typography variant="body1" paragraph>
                          • 관망 권장: {recentAnalyses.filter(a => a.decision === 'hold').length}개
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          💡 팁: 신뢰도 70% 이상의 신호에 집중하여 거래 성공률을 높이세요.
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body1" paragraph>
                          기술적 분석 모드로 운영 중입니다.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          AI 모드를 활성화하면 더 정교한 분석을 받을 수 있습니다.
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      ⚙️ 시스템 상태
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">거래 엔진</Typography>
                        <Chip
                          label={tradingState.isRunning ? '가동중' : '정지'}
                          color={tradingState.isRunning ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">AI 분석</Typography>
                        <Chip
                          label={tradingState.aiEnabled ? '활성' : '비활성'}
                          color={tradingState.aiEnabled ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">활성 코인</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {portfolio.filter(c => c.enabled).length}개
                        </Typography>
                      </Box>
                      <Divider />
                      <Typography variant="caption" color="text.secondary">
                        마지막 업데이트: {new Date(tradingState.lastUpdate).toLocaleString('ko-KR')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Next Analysis Timer */}
            {tradingState.isRunning && (
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" py={2}>
                    <Typography variant="h6" gutterBottom>
                      ⏰ 다음 분석까지
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color="primary.main">
                      {Math.floor(nextAnalysisTime / 60)}:{(nextAnalysisTime % 60).toString().padStart(2, '0')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      자동 분석이 30초마다 실행됩니다
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={((60 - nextAnalysisTime) / 60) * 100}
                      sx={{ width: '100%', mt: 2, height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          포트폴리오 관리
        </Typography>
        
        {/* Add Coin Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              코인 추가
            </Typography>
            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>코인 선택</InputLabel>
                <Select
                  value={selectedTicker}
                  label="코인 선택"
                  onChange={(e) => setSelectedTicker(e.target.value)}
                  disabled={tradingState.isRunning}
                >
                  {popularCoins.map((coin) => (
                    <MenuItem key={coin.ticker} value={coin.ticker}>
                      {coin.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddToPortfolio}
                disabled={tradingState.isRunning}
              >
                추가
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Portfolio List */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              현재 포트폴리오
            </Typography>
            {portfolio.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                포트폴리오가 비어있습니다. 코인을 추가해주세요.
              </Typography>
            ) : (
              <List>
                {portfolio.map((coin, index) => (
                  <React.Fragment key={coin.ticker}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <Checkbox
                        checked={coin.enabled}
                        onChange={() => handleToggleCoin(coin.ticker)}
                        disabled={tradingState.isRunning}
                      />
                      <ListItemText
                        primary={coin.name}
                        secondary={coin.ticker}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFromPortfolio(coin.ticker)}
                          disabled={tradingState.isRunning}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            분석 설정
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Tune />}
            onClick={() => setAdvancedConfigOpen(true)}
            size="large"
          >
            고급 설정
          </Button>
        </Box>
        
        {/* 코인 선택 섹션 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              코인 선택
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>분석할 코인</InputLabel>
              <Select
                value={selectedAnalysisCoin || ''}
                label="분석할 코인"
                onChange={(e) => setSelectedAnalysisCoin(e.target.value)}
              >
                {portfolio.map((coin) => (
                  <MenuItem key={coin.ticker} value={coin.ticker}>
                    {coin.name} ({coin.ticker})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
        
        {/* 선택된 코인의 설정 */}
        {selectedAnalysisCoin && (
          <Card>
            <CardContent>
              {(() => {
                const selectedCoin = portfolio.find(c => c.ticker === selectedAnalysisCoin);
                const config = getConfigForTicker(selectedAnalysisCoin);
                
                if (!selectedCoin) return null;
                
                return (
                  <>
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {selectedCoin.ticker?.replace('KRW-', '').charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {selectedCoin.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedCoin.ticker}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          분석 설정
                        </Typography>
                        <TextField
                          fullWidth
                          label="분석 주기 (분)"
                          type="number"
                          value={config.analysisInterval}
                          onChange={(e) => updateConfigForTicker(selectedAnalysisCoin, { analysisInterval: parseInt(e.target.value) || 1 })}
                          InputProps={{ inputProps: { min: 1, max: 60 } }}
                          helperText="얼마나 자주 시장을 분석할지 설정합니다"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          거래 임계값
                        </Typography>
                        <TextField
                          fullWidth
                          label="매수 신호 강도 (%)"
                          type="number"
                          value={config.buyThreshold}
                          onChange={(e) => updateConfigForTicker(selectedAnalysisCoin, { buyThreshold: parseInt(e.target.value) || 70 })}
                          InputProps={{ inputProps: { min: 50, max: 100 } }}
                          helperText="이 수치 이상일 때 매수 신호로 판단합니다"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="매도 신호 강도 (%)"
                          type="number"
                          value={config.sellThreshold}
                          onChange={(e) => updateConfigForTicker(selectedAnalysisCoin, { sellThreshold: parseInt(e.target.value) || 30 })}
                          InputProps={{ inputProps: { min: 0, max: 50 } }}
                          helperText="이 수치 이하일 때 매도 신호로 판단합니다"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="손절 라인 (%)"
                          type="number"
                          value={config.stopLoss}
                          onChange={(e) => updateConfigForTicker(selectedAnalysisCoin, { stopLoss: parseFloat(e.target.value) || 5 })}
                          InputProps={{ inputProps: { min: 1, max: 20, step: 0.5 } }}
                          helperText="손실이 이 비율을 초과하면 자동 매도합니다"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="목표 수익률 (%)"
                          type="number"
                          value={config.takeProfit}
                          onChange={(e) => updateConfigForTicker(selectedAnalysisCoin, { takeProfit: parseFloat(e.target.value) || 10 })}
                          InputProps={{ inputProps: { min: 5, max: 50, step: 0.5 } }}
                          helperText="수익이 이 비율에 도달하면 일부 매도를 고려합니다"
                        />
                      </Grid>
                    </Grid>
                    
                    <Box mt={4}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Save />}
                        onClick={saveAnalysisConfigs}
                        fullWidth
                        size="large"
                      >
                        {selectedCoin.name} 설정 저장
                      </Button>
                    </Box>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
        
        {!selectedAnalysisCoin && portfolio.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Tune sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                포트폴리오가 비어있습니다
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                포트폴리오에 코인을 추가하면 분석 설정을 할 수 있습니다.
              </Typography>
              <Button variant="contained" onClick={() => setTabValue(1)}>
                코인 추가하기
              </Button>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          환경 설정
        </Typography>
        
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              API 키 설정
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              거래를 위해 필요한 API 키를 입력해주세요.
            </Typography>
            
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Upbit API
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Key"
                    type={showAccessKey ? "text" : "password"}
                    value={apiKeys.upbitAccessKey}
                    onChange={(e) => setApiKeys({...apiKeys, upbitAccessKey: e.target.value})}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowAccessKey(!showAccessKey)}
                            edge="end"
                          >
                            {showAccessKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Secret Key"
                    type={showSecretKey ? "text" : "password"}
                    value={apiKeys.upbitSecretKey}
                    onChange={(e) => setApiKeys({...apiKeys, upbitSecretKey: e.target.value})}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowSecretKey(!showSecretKey)}
                            edge="end"
                          >
                            {showSecretKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2" gutterBottom>
                Claude AI API (선택사항)
              </Typography>
              <TextField
                fullWidth
                label="API Key"
                type={showAnthropicKey ? "text" : "password"}
                value={apiKeys.anthropicApiKey}
                onChange={(e) => setApiKeys({...apiKeys, anthropicApiKey: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                        edge="end"
                      >
                        {showAnthropicKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                거래 설정
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={apiKeys.enableRealTrade || false}
                    onChange={handleToggleRealTrade}
                    color="warning"
                    disabled={loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">실제 거래 활성화</Typography>
                    <Typography variant="caption" color="text.secondary">
                      활성화하면 실제 돈으로 거래가 실행됩니다. 주의하세요!
                    </Typography>
                  </Box>
                }
                sx={{ mb: 3 }}
              />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSaveApiKeys}
                disabled={loading || !apiKeys.upbitAccessKey || !apiKeys.upbitSecretKey}
                fullWidth
                size="large"
              >
                설정 저장
              </Button>
            </Box>
            
            <Box mt={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  • Upbit API 키는 <a href="https://upbit.com/mypage/open_api_management" target="_blank" rel="noopener noreferrer">여기</a>에서 발급받을 수 있습니다.
                </Typography>
                <Typography variant="body2">
                  • 거래 권한이 있는 API 키를 사용해주세요.
                </Typography>
                <Typography variant="body2">
                  • API 키는 안전하게 암호화되어 로컬에 저장됩니다.
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      bgcolor: 'grey.50',
      overflow: 'hidden'
    }}>
      {renderSidebar()}
      {renderMainContent()}
      {renderRightSidebar()}
      
      {/* 분석 상세 정보 모달 */}
      <Dialog
        open={analysisDetailOpen}
        onClose={() => setAnalysisDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnalysisDetail && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6">
                    {selectedAnalysisDetail.ticker?.replace('KRW-', '') || 'Unknown'} 분석 상세 정보
                  </Typography>
                  <Chip
                    label={getDecisionText(selectedAnalysisDetail.decision)}
                    color={getDecisionColor(selectedAnalysisDetail.decision) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(selectedAnalysisDetail.timestamp).toLocaleString('ko-KR')}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  신뢰도
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedAnalysisDetail.confidence * 100}
                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {(selectedAnalysisDetail.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
              
              {tradingState.aiEnabled && selectedAnalysisDetail.reason && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    AI 분석 의견
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                      {formatAIReason(selectedAnalysisDetail.reason, selectedAnalysisDetail.decision)}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              {!tradingState.aiEnabled && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    기술적 분석 결과
                  </Typography>
                  <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAnalysisDetail.reason || '기술적 지표를 기반으로 분석한 결과입니다.'}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  분석 기준
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">결정 유형</Typography>
                    <Typography variant="body2">{getDecisionText(selectedAnalysisDetail.decision)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">AI 모드</Typography>
                    <Typography variant="body2">{tradingState.aiEnabled ? '활성' : '비활성'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setTabValue(2);
                setSelectedAnalysisCoin(selectedAnalysisDetail.ticker);
                setAnalysisDetailOpen(false);
              }}>
                분석 설정으로 이동
              </Button>
              <Button onClick={() => setAnalysisDetailOpen(false)} variant="contained">
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 고급 설정 다이얼로그 */}
      <Dialog
        open={advancedConfigOpen}
        onClose={() => setAdvancedConfigOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Tune color="primary" />
            <Typography variant="h6">고급 분석 설정</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs 
            value={advancedConfigTab} 
            onChange={(e, newValue) => setAdvancedConfigTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="결정 임계값" />
            <Tab label="신호 강도" />
            <Tab label="지표 가중치" />
            <Tab label="거래 설정" />
          </Tabs>

          {/* Tab 0: 결정 임계값 설정 */}
          {advancedConfigTab === 0 && (
            <Box>
            <Typography variant="h6" gutterBottom>결정 임계값</Typography>
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="매수 임계값"
                  type="number"
                  value={tradingConfig.decisionThresholds.buyThreshold}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    decisionThresholds: {
                      ...tradingConfig.decisionThresholds,
                      buyThreshold: parseFloat(e.target.value) || 0.15
                    }
                  })}
                  InputProps={{ inputProps: { min: 0, max: 1, step: 0.05 } }}
                  helperText="평균 신호가 이 값보다 크면 매수"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="매도 임계값"
                  type="number"
                  value={tradingConfig.decisionThresholds.sellThreshold}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    decisionThresholds: {
                      ...tradingConfig.decisionThresholds,
                      sellThreshold: parseFloat(e.target.value) || -0.2
                    }
                  })}
                  InputProps={{ inputProps: { min: -1, max: 0, step: 0.05 } }}
                  helperText="평균 신호가 이 값보다 작으면 매도"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>투자 비율</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="최소 투자 비율 (%)"
                  type="number"
                  value={(tradingConfig.investmentRatios.minRatio * 100).toFixed(0)}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    investmentRatios: {
                      ...tradingConfig.investmentRatios,
                      minRatio: parseFloat(e.target.value) / 100 || 0.15
                    }
                  })}
                  InputProps={{ inputProps: { min: 5, max: 50 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="최대 투자 비율 (%)"
                  type="number"
                  value={(tradingConfig.investmentRatios.maxRatio * 100).toFixed(0)}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    investmentRatios: {
                      ...tradingConfig.investmentRatios,
                      maxRatio: parseFloat(e.target.value) / 100 || 0.5
                    }
                  })}
                  InputProps={{ inputProps: { min: 10, max: 100 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="코인별 최대 비율 (%)"
                  type="number"
                  value={(tradingConfig.investmentRatios.perCoinMaxRatio * 100).toFixed(0)}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    investmentRatios: {
                      ...tradingConfig.investmentRatios,
                      perCoinMaxRatio: parseFloat(e.target.value) / 100 || 0.2
                    }
                  })}
                  InputProps={{ inputProps: { min: 5, max: 50 } }}
                />
              </Grid>
            </Grid>
            </Box>
          )}

          {/* Tab 1: 신호 강도 설정 */}
          {advancedConfigTab === 1 && (
            <Box>
            <Typography variant="h6" gutterBottom>신호 강도 설정</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              각 신호의 강도를 0.0~1.0 범위에서 조정합니다. 높을수록 해당 신호의 영향력이 커집니다.
            </Typography>
            <Grid container spacing={2}>
              {signalStrengthKeys.map((signal) => (
                <Grid item xs={12} sm={6} md={4} key={signal.key}>
                  <TextField
                    fullWidth
                    size="small"
                    label={signal.name}
                    type="number"
                    value={tradingConfig.signalStrengths[signal.key] || 0.5}
                    onChange={(e) => setTradingConfig({
                      ...tradingConfig,
                      signalStrengths: {
                        ...tradingConfig.signalStrengths,
                        [signal.key]: parseFloat(e.target.value) || 0.5
                      }
                    })}
                    InputProps={{ inputProps: { min: signal.min, max: signal.max, step: signal.step } }}
                  />
                </Grid>
              ))}
            </Grid>
            </Box>
          )}

          {/* Tab 2: 지표 가중치 및 사용 여부 */}
          {advancedConfigTab === 2 && (
            <Box>
            <Typography variant="h6" gutterBottom>지표 가중치 및 사용 여부</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              각 기술적 지표의 사용 여부와 가중치를 설정합니다. 가중치가 높을수록 해당 지표의 영향력이 커집니다.
            </Typography>
            <Grid container spacing={2}>
              {indicators.map((indicator) => (
                <Grid item xs={12} sm={6} md={4} key={indicator.key}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="bold">{indicator.name}</Typography>
                      <Switch
                        checked={tradingConfig.indicatorUsage[indicator.key] || false}
                        onChange={(e) => setTradingConfig({
                          ...tradingConfig,
                          indicatorUsage: {
                            ...tradingConfig.indicatorUsage,
                            [indicator.key]: e.target.checked
                          }
                        })}
                        size="small"
                      />
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="가중치"
                      type="number"
                      value={tradingConfig.indicatorWeights[indicator.key] || 1.0}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        indicatorWeights: {
                          ...tradingConfig.indicatorWeights,
                          [indicator.key]: parseFloat(e.target.value) || 1.0
                        }
                      })}
                      InputProps={{ inputProps: { min: 0.1, max: 2.0, step: 0.1 } }}
                      disabled={!tradingConfig.indicatorUsage[indicator.key]}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom mt={4}>거래 설정</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="최소 주문 금액 (원)"
                  type="number"
                  value={tradingConfig.tradingSettings.minOrderAmount}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    tradingSettings: {
                      ...tradingConfig.tradingSettings,
                      minOrderAmount: parseInt(e.target.value) || 5000
                    }
                  })}
                  InputProps={{ inputProps: { min: 1000, max: 100000 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="최대 슬리피지 (%)"
                  type="number"
                  value={(tradingConfig.tradingSettings.maxSlippage * 100).toFixed(2)}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    tradingSettings: {
                      ...tradingConfig.tradingSettings,
                      maxSlippage: parseFloat(e.target.value) / 100 || 0.005
                    }
                  })}
                  InputProps={{ inputProps: { min: 0.1, max: 5.0, step: 0.1 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="거래 간격 (분)"
                  type="number"
                  value={tradingConfig.tradingSettings.tradingInterval}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    tradingSettings: {
                      ...tradingConfig.tradingSettings,
                      tradingInterval: parseInt(e.target.value) || 1
                    }
                  })}
                  InputProps={{ inputProps: { min: 1, max: 60 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tradingConfig.tradingSettings.cooldown.enabled}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          cooldown: {
                            ...tradingConfig.tradingSettings.cooldown,
                            enabled: e.target.checked
                          }
                        }
                      })}
                    />
                  }
                  label="거래 쿨다운 활성화"
                />
              </Grid>
              {tradingConfig.tradingSettings.cooldown.enabled && (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="매수 후 대기 시간 (분)"
                      type="number"
                      value={tradingConfig.tradingSettings.cooldown.buyMinutes}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          cooldown: {
                            ...tradingConfig.tradingSettings.cooldown,
                            buyMinutes: parseInt(e.target.value) || 30
                          }
                        }
                      })}
                      InputProps={{ inputProps: { min: 1, max: 120 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="매도 후 대기 시간 (분)"
                      type="number"
                      value={tradingConfig.tradingSettings.cooldown.sellMinutes}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          cooldown: {
                            ...tradingConfig.tradingSettings.cooldown,
                            sellMinutes: parseInt(e.target.value) || 20
                          }
                        }
                      })}
                      InputProps={{ inputProps: { min: 1, max: 120 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="쿨다운 무시 신뢰도 (%)"
                      type="number"
                      value={(tradingConfig.tradingSettings.cooldown.minConfidenceOverride * 100).toFixed(0)}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          cooldown: {
                            ...tradingConfig.tradingSettings.cooldown,
                            minConfidenceOverride: parseFloat(e.target.value) / 100 || 0.85
                          }
                        }
                      })}
                      InputProps={{ inputProps: { min: 50, max: 100 } }}
                      helperText="이 신뢰도 이상이면 쿨다운 무시"
                    />
                  </Grid>
                </>
              )}
            </Grid>
            
            {/* 매도 설정 섹션 */}
            <Typography variant="h6" gutterBottom mt={4}>매도 설정</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="기본 매도 비율 (%)"
                  type="number"
                  value={(tradingConfig.tradingSettings.selling.defaultSellRatio * 100).toFixed(0)}
                  onChange={(e) => setTradingConfig({
                    ...tradingConfig,
                    tradingSettings: {
                      ...tradingConfig.tradingSettings,
                      selling: {
                        ...tradingConfig.tradingSettings.selling,
                        defaultSellRatio: parseFloat(e.target.value) / 100 || 0.5
                      }
                    }
                  })}
                  InputProps={{ inputProps: { min: 10, max: 100 } }}
                  helperText="매도 신호 발생시 기본적으로 매도할 비율"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tradingConfig.tradingSettings.selling.confidenceBasedAdjustment}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          selling: {
                            ...tradingConfig.tradingSettings.selling,
                            confidenceBasedAdjustment: e.target.checked
                          }
                        }
                      })}
                    />
                  }
                  label="신뢰도 기반 매도 비율 조정"
                />
              </Grid>
              
              {tradingConfig.tradingSettings.selling.confidenceBasedAdjustment && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="고신뢰도 배율 (90% 이상)"
                      type="number"
                      value={tradingConfig.tradingSettings.selling.highConfidenceMultiplier.toFixed(1)}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          selling: {
                            ...tradingConfig.tradingSettings.selling,
                            highConfidenceMultiplier: parseFloat(e.target.value) || 1.5
                          }
                        }
                      })}
                      InputProps={{ inputProps: { min: 1.0, max: 2.0, step: 0.1 } }}
                      helperText="신뢰도 90% 이상일 때 매도 비율 증가 배율"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="저신뢰도 배율 (70% 미만)"
                      type="number"
                      value={tradingConfig.tradingSettings.selling.lowConfidenceMultiplier.toFixed(1)}
                      onChange={(e) => setTradingConfig({
                        ...tradingConfig,
                        tradingSettings: {
                          ...tradingConfig.tradingSettings,
                          selling: {
                            ...tradingConfig.tradingSettings.selling,
                            lowConfidenceMultiplier: parseFloat(e.target.value) || 0.7
                          }
                        }
                      })}
                      InputProps={{ inputProps: { min: 0.3, max: 1.0, step: 0.1 } }}
                      helperText="신뢰도 70% 미만일 때 매도 비율 감소 배율"
                    />
                  </Grid>
                  
                  {/* 매도 비율 계산 예시 */}
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        📊 매도 비율 계산 예시
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">신뢰도 95%</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            {Math.min(100, (tradingConfig.tradingSettings.selling.defaultSellRatio * tradingConfig.tradingSettings.selling.highConfidenceMultiplier * 100)).toFixed(0)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">신뢰도 75%</Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {(tradingConfig.tradingSettings.selling.defaultSellRatio * 100).toFixed(0)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">신뢰도 65%</Typography>
                          <Typography variant="body2" fontWeight="bold" color="warning.main">
                            {(tradingConfig.tradingSettings.selling.defaultSellRatio * tradingConfig.tradingSettings.selling.lowConfidenceMultiplier * 100).toFixed(0)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                </>
              )}
            </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdvancedConfigOpen(false)}>
            취소
          </Button>
          <Button onClick={saveTradingConfig} variant="contained">
            설정 저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;