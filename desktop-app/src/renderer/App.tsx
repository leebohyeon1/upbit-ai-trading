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
} from '@mui/icons-material';

interface TradingState {
  isRunning: boolean;
  aiEnabled: boolean;
  lastUpdate: string;
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

declare global {
  interface Window {
    electronAPI: {
      getTradingState: () => Promise<TradingState>;
      startTrading: (tickers: string[]) => Promise<boolean>;
      stopTrading: () => Promise<boolean>;
      toggleAI: (enabled: boolean) => Promise<boolean>;
      minimizeToTray: () => Promise<void>;
      onTradingStateChanged: (callback: (state: TradingState) => void) => void;
      saveApiKeys: (keys: ApiKeys) => Promise<boolean>;
      getApiKeys: () => Promise<ApiKeys>;
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

    // 상태 변경 리스너 등록
    window.electronAPI.onTradingStateChanged((state) => {
      setTradingState(state);
    });
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

  const handleAddToPortfolio = () => {
    const selectedCoin = popularCoins.find(coin => coin.ticker === selectedTicker);
    if (selectedCoin && !portfolio.find(p => p.ticker === selectedCoin.ticker)) {
      setPortfolio([...portfolio, {
        ...selectedCoin,
        enabled: true,
        currentPrice: 0,
        change24h: 0,
        balance: 0
      }]);
    }
  };

  const handleRemoveFromPortfolio = (ticker: string) => {
    setPortfolio(portfolio.filter(coin => coin.ticker !== ticker));
  };

  const handleToggleCoin = (ticker: string) => {
    setPortfolio(portfolio.map(coin => 
      coin.ticker === ticker ? { ...coin, enabled: !coin.enabled } : coin
    ));
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

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Paper elevation={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp fontSize="large" color="primary" />
            <Typography variant="h5" component="h1">
              Upbit AI Trading
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={tradingState.isRunning ? '자동매매 실행중' : '자동매매 중지됨'}
              color={tradingState.isRunning ? 'success' : 'default'}
            />
            <IconButton onClick={handleMinimize} size="small">
              <Minimize />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mx: 2, mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Dashboard />} label="대시보드" />
          <Tab icon={<AccountBalance />} label="포트폴리오" />
          <Tab icon={<Settings />} label="환경설정" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    자동매매 제어
                  </Typography>
                  <Box display="flex" gap={2} mb={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                      onClick={handleStartTrading}
                      disabled={tradingState.isRunning || loading || portfolio.filter(c => c.enabled).length === 0}
                      fullWidth
                    >
                      자동매매 시작
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : <Stop />}
                      onClick={handleStopTrading}
                      disabled={!tradingState.isRunning || loading}
                      fullWidth
                    >
                      자동매매 중지
                    </Button>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={tradingState.aiEnabled}
                        onChange={handleToggleAI}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Psychology />
                        <Typography>AI 분석 기능</Typography>
                        <Chip
                          label={tradingState.aiEnabled ? 'ON' : 'OFF'}
                          color={tradingState.aiEnabled ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
            </Box>

            <Box>
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