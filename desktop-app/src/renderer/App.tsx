import React, { useState, useEffect } from 'react';
import {
  Container,
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
      setRecentAnalyses(prev => [analysis, ...prev.slice(0, 9)]); // 최근 10개만 유지
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

  return (
    <Container maxWidth="md" sx={{ py: 2, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 상단 고정 영역 */}
      <Paper elevation={3} sx={{ position: 'sticky', top: 0, zIndex: 1100, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp fontSize="large" color="primary" />
            <Typography variant="h5" component="h1">
              Upbit AI Trading
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={tradingState.aiEnabled}
                  onChange={handleToggleAI}
                  size="small"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Psychology fontSize="small" />
                  <Typography variant="body2">AI</Typography>
                </Box>
              }
              sx={{ mr: 1 }}
            />
            {tradingState.isRunning ? (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Stop />}
                onClick={handleStopTrading}
                disabled={loading}
              >
                자동매매 중지
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
                onClick={handleStartTrading}
                disabled={loading || portfolio.filter(c => c.enabled).length === 0}
              >
                자동매매 시작
              </Button>
            )}
            <IconButton onClick={handleMinimize} size="small">
              <Minimize />
            </IconButton>
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Dashboard />} label="대시보드" />
          <Tab icon={<AccountBalance />} label="포트폴리오" />
          <Tab icon={<Tune />} label="분석설정" />
          <Tab icon={<Settings />} label="환경설정" />
        </Tabs>
      </Paper>

      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <Paper elevation={3} sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2, mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mx: 2, mt: 2, mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
            {/* Left Sidebar */}
            <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Portfolio Summary Card */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    포트폴리오 요약
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    활성 코인: {portfolio.filter(c => c.enabled).length}개 / 
                    전체: {portfolio.length}개
                  </Typography>
                  {portfolio.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      포트폴리오 탭에서 코인을 추가해주세요.
                    </Typography>
                  ) : (
                    <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                      {portfolio.filter(c => c.enabled).map(coin => (
                        <Chip
                          key={coin.ticker}
                          label={coin.ticker.replace('KRW-', '')}
                          color="primary"
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

            </Box>

            {/* Right Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Card sx={{ flex: 1 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                      최근 분석
                    </Typography>
                    {tradingState.isRunning && (
                      <Chip
                        icon={<CircularProgress size={16} />}
                        label={`다음 분석까지: ${nextAnalysisTime}초`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {!tradingState.isRunning ? (
                      <Typography variant="body2" color="text.secondary">
                        자동매매를 시작하면 분석 결과가 표시됩니다.
                      </Typography>
                    ) : recentAnalyses.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        첫 분석을 기다리고 있습니다...
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {recentAnalyses.map((analysis) => (
                          <Box 
                            key={`${analysis.ticker}-${analysis.timestamp}`} 
                            sx={{ 
                              p: 3, 
                              bgcolor: 'background.default', 
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                boxShadow: 1
                              }
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Chip
                                  label={analysis.ticker.replace('KRW-', '')}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={getDecisionText(analysis.decision)}
                                  color={getDecisionColor(analysis.decision) as any}
                                  size="small"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  신뢰도: {(analysis.confidence * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(analysis.timestamp).toLocaleTimeString('ko-KR')}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                              {analysis.reason}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 50%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    코인 추가
                  </Typography>
                  <Box display="flex" gap={2}>
                    <FormControl fullWidth>
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
            </Box>

            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    포트폴리오 관리
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
                              secondary={
                                <Box>
                                  <Typography variant="caption">
                                    {coin.ticker}
                                  </Typography>
                                  {coin.currentPrice && (
                                    <Typography variant="caption" sx={{ ml: 2 }}>
                                      현재가: {coin.currentPrice.toLocaleString()}원
                                    </Typography>
                                  )}
                                </Box>
                              }
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
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    분석 설정
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    각 코인별로 분석 주기와 거래 임계값을 설정할 수 있습니다.
                  </Typography>
                  
                  {portfolio.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      포트폴리오에 코인을 추가하면 분석 설정을 할 수 있습니다.
                    </Typography>
                  ) : (
                    <Box mt={3}>
                      {portfolio.map((coin) => {
                        const config = getConfigForTicker(coin.ticker);
                        return (
                          <Box key={coin.ticker} mb={4} p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                              {coin.name}
                            </Typography>
                            
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={2}>
                              <TextField
                                label="분석 주기 (분)"
                                type="number"
                                value={config.analysisInterval}
                                onChange={(e) => updateConfigForTicker(coin.ticker, { analysisInterval: parseInt(e.target.value) || 1 })}
                                InputProps={{ inputProps: { min: 1, max: 60 } }}
                                size="small"
                              />
                              
                              <TextField
                                label="매수 임계값 (%)"
                                type="number"
                                value={config.buyThreshold}
                                onChange={(e) => updateConfigForTicker(coin.ticker, { buyThreshold: parseInt(e.target.value) || 70 })}
                                InputProps={{ inputProps: { min: 50, max: 100 } }}
                                size="small"
                              />
                              
                              <TextField
                                label="매도 임계값 (%)"
                                type="number"
                                value={config.sellThreshold}
                                onChange={(e) => updateConfigForTicker(coin.ticker, { sellThreshold: parseInt(e.target.value) || 30 })}
                                InputProps={{ inputProps: { min: 0, max: 50 } }}
                                size="small"
                              />
                              
                              <TextField
                                label="손절 라인 (%)"
                                type="number"
                                value={config.stopLoss}
                                onChange={(e) => updateConfigForTicker(coin.ticker, { stopLoss: parseFloat(e.target.value) || 5 })}
                                InputProps={{ inputProps: { min: 1, max: 20, step: 0.5 } }}
                                size="small"
                              />
                              
                              <TextField
                                label="익절 라인 (%)"
                                type="number"
                                value={config.takeProfit}
                                onChange={(e) => updateConfigForTicker(coin.ticker, { takeProfit: parseFloat(e.target.value) || 10 })}
                                InputProps={{ inputProps: { min: 5, max: 50, step: 0.5 } }}
                                size="small"
                              />
                            </Box>
                          </Box>
                        );
                      })}
                      
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Save />}
                        onClick={saveAnalysisConfigs}
                        fullWidth
                      >
                        분석 설정 저장
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API 키 설정
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    거래를 위해 필요한 API 키를 입력해주세요.
                  </Typography>
                  
                  <Box mt={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      Upbit API
                    </Typography>
                    <Box mb={2}>
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
                    </Box>
                    
                    <Box mb={3}>
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
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Claude AI API (선택사항)
                    </Typography>
                    <Box mb={3}>
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
                      />
                    </Box>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Save />}
                      onClick={handleSaveApiKeys}
                      disabled={loading || !apiKeys.upbitAccessKey || !apiKeys.upbitSecretKey}
                      fullWidth
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
            </Box>
          </Box>
        </TabPanel>

        <Box p={2} bgcolor="background.default">
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            백그라운드 실행: 창을 닫아도 시스템 트레이에서 계속 실행됩니다
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            마지막 업데이트: {new Date(tradingState.lastUpdate).toLocaleString('ko-KR')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default App;