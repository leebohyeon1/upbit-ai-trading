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
}

interface AnalysisConfig {
  ticker: string;
  analysisInterval: number; // 분 단위
  buyThreshold: number; // 0-100
  sellThreshold: number; // 0-100
  stopLoss: number; // %
  takeProfit: number; // %
}

declare global {
  interface Window {
    electronAPI: {
      getTradingState: () => Promise<TradingState>;
      startTrading: (tickers: string[]) => Promise<boolean>;
      stopTrading: () => Promise<boolean>;
      toggleAI: (enabled: boolean) => Promise<boolean>;
      minimizeToTray: () => Promise<void>;
      onTradingStateChanged: (callback: (state: TradingState) => void) => void;
      onAnalysisUpdate: (callback: (analysis: TradingAnalysis) => void) => void;
      saveApiKeys: (keys: ApiKeys) => Promise<boolean>;
      getApiKeys: () => Promise<ApiKeys>;
      savePortfolio: (portfolio: PortfolioCoin[]) => Promise<boolean>;
      getPortfolio: () => Promise<PortfolioCoin[]>;
      saveAnalysisConfigs: (configs: AnalysisConfig[]) => Promise<boolean>;
      getAnalysisConfigs: () => Promise<AnalysisConfig[]>;
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
      {value === index && <Box sx={{ p: 3, height: 'calc(100vh - 180px)', overflow: 'auto' }}>{children}</Box>}
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
    anthropicApiKey: ''
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
  
  // 인기 코인 목록
  const popularCoins = [
    { ticker: 'KRW-BTC', name: '비트코인 (BTC)' },
    { ticker: 'KRW-ETH', name: '이더리움 (ETH)' },
    { ticker: 'KRW-XRP', name: '리플 (XRP)' },
    { ticker: 'KRW-DOGE', name: '도지코인 (DOGE)' },
    { ticker: 'KRW-SOL', name: '솔라나 (SOL)' },
    { ticker: 'KRW-MATIC', name: '폴리곤 (MATIC)' },
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

    // 상태 변경 리스너 등록
    window.electronAPI.onTradingStateChanged((state) => {
      setTradingState(state);
    });

    // 분석 업데이트 리스너 등록
    window.electronAPI.onAnalysisUpdate((analysis) => {
      setRecentAnalyses(prev => {
        // 각 코인별로 최신 분석만 유지
        const filtered = prev.filter(a => a.ticker !== analysis.ticker);
        return [analysis, ...filtered];
      });
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

  const renderSidebar = () => (
    <Box sx={{ 
      width: 200, 
      height: '100vh', 
      bgcolor: 'background.paper', 
      borderRight: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
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
      width: 300, 
      height: '100vh', 
      bgcolor: 'background.paper', 
      borderLeft: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 1000,
      overflow: 'auto'
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
            분석 결과가 없습니다.
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {recentAnalyses.slice(0, 5).map((analysis, index) => (
              <Card key={index} sx={{ bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" fontWeight="bold">
                      {analysis.ticker.replace('KRW-', '')}
                    </Typography>
                    <Chip
                      label={getDecisionText(analysis.decision)}
                      color={getDecisionColor(analysis.decision) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    신뢰도: {(analysis.confidence * 100).toFixed(0)}%
                  </Typography>
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
      ml: '200px', 
      mr: '300px', 
      minHeight: '100vh',
      bgcolor: 'grey.50',
      p: 3
    }}>
      {/* Top Controls */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
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
        <Grid container spacing={3} mb={3}>
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
          <Grid container spacing={3}>
            {portfolio.map((coin) => {
              const analysis = recentAnalyses.find(a => a.ticker === coin.ticker);
              return (
                <Grid item xs={12} sm={6} md={4} key={coin.ticker}>
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
                    onClick={() => {
                      setTabValue(2);
                      setSelectedAnalysisCoin(coin.ticker);
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          {coin.ticker.replace('KRW-', '')}
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
                          <Typography variant="caption" color="text.secondary">
                            신뢰도: {(analysis.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="caption" display="block" textAlign="center" mt={2} color="primary">
                        클릭하여 분석 설정
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
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
        <Typography variant="h6" fontWeight="bold" mb={3}>
          분석 설정
        </Typography>
        
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
                        {selectedCoin.ticker.replace('KRW-', '').charAt(0)}
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
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSaveApiKeys}
                disabled={loading || !apiKeys.upbitAccessKey || !apiKeys.upbitSecretKey}
                fullWidth
                size="large"
              >
                API 키 저장
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
    </Box>
  );
};

export default App;