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
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Minimize,
  TrendingUp,
  Psychology,
} from '@mui/icons-material';

interface TradingState {
  isRunning: boolean;
  aiEnabled: boolean;
  lastUpdate: string;
}

declare global {
  interface Window {
    electronAPI: {
      getTradingState: () => Promise<TradingState>;
      startTrading: (ticker: string) => Promise<boolean>;
      stopTrading: () => Promise<boolean>;
      toggleAI: (enabled: boolean) => Promise<boolean>;
      minimizeToTray: () => Promise<void>;
      onTradingStateChanged: (callback: (state: TradingState) => void) => void;
    };
  }
}

const App: React.FC = () => {
  const [tradingState, setTradingState] = useState<TradingState>({
    isRunning: false,
    aiEnabled: false,
    lastUpdate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState('KRW-BTC');
  
  // 인기 코인 목록
  const popularCoins = [
    { value: 'KRW-BTC', label: '비트코인 (BTC)' },
    { value: 'KRW-ETH', label: '이더리움 (ETH)' },
    { value: 'KRW-XRP', label: '리플 (XRP)' },
    { value: 'KRW-DOGE', label: '도지코인 (DOGE)' },
    { value: 'KRW-SOL', label: '솔라나 (SOL)' },
    { value: 'KRW-MATIC', label: '폴리곤 (MATIC)' },
    { value: 'KRW-ADA', label: '카르다노 (ADA)' },
    { value: 'KRW-AVAX', label: '아발란체 (AVAX)' },
    { value: 'KRW-DOT', label: '폴카닷 (DOT)' },
    { value: 'KRW-LINK', label: '체인링크 (LINK)' },
  ];

  useEffect(() => {
    // 초기 상태 로드
    loadTradingState();

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
      const success = await window.electronAPI.startTrading(selectedTicker);
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

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp fontSize="large" color="primary" />
            <Typography variant="h5" component="h1">
              Upbit AI Trading
            </Typography>
          </Box>
          <IconButton onClick={handleMinimize} size="small">
            <Minimize />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <FormControl fullWidth>
            <InputLabel id="coin-select-label">거래할 코인 선택</InputLabel>
            <Select
              labelId="coin-select-label"
              value={selectedTicker}
              label="거래할 코인 선택"
              onChange={(e) => setSelectedTicker(e.target.value)}
              disabled={tradingState.isRunning}
            >
              {popularCoins.map((coin) => (
                <MenuItem key={coin.value} value={coin.value}>
                  {coin.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box mb={4}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1">자동매매 상태</Typography>
            <Box display="flex" gap={1}>
              {tradingState.isRunning && (
                <Chip
                  label={selectedTicker.replace('KRW-', '')}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )}
              <Chip
                label={tradingState.isRunning ? '실행중' : '중지됨'}
                color={tradingState.isRunning ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>
          
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
              onClick={handleStartTrading}
              disabled={tradingState.isRunning || loading}
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
        </Box>

        <Box mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={tradingState.aiEnabled}
                onChange={handleToggleAI}
                icon={<Psychology />}
                checkedIcon={<Psychology />}
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography>AI 분석 기능</Typography>
                <Chip
                  label={tradingState.aiEnabled ? 'ON' : 'OFF'}
                  color={tradingState.aiEnabled ? 'primary' : 'default'}
                  size="small"
                />
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" display="block" ml={7}>
            Claude AI를 사용한 시장 분석 기능을 활성화합니다
          </Typography>
        </Box>

        <Box mt={4} p={2} bgcolor="background.default" borderRadius={1}>
          <Typography variant="body2" color="text.secondary" align="center">
            백그라운드 실행: 창을 닫아도 시스템 트레이에서 계속 실행됩니다
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
            마지막 업데이트: {new Date(tradingState.lastUpdate).toLocaleString('ko-KR')}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default App;