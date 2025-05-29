import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Settings,
  Refresh,
  InfoOutlined,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useElectronAPI } from '../../hooks/useElectronAPI';

interface TimeframeConfig {
  interval: string;
  period: number;
  weight: number;
  enabled: boolean;
}

interface TimeframeData {
  interval: string;
  indicators: {
    rsi: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    momentum: number;
    volatility: number;
  };
  signals: {
    buy: number;
    sell: number;
    confidence: number;
  };
}

interface MultiTimeframeAnalysis {
  symbol: string;
  timestamp: number;
  timeframes: TimeframeData[];
  overallSignal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: string;
}

export const MultiTimeframePanel: React.FC = () => {
  const electronAPI = useElectronAPI();
  const [analysis, setAnalysis] = useState<MultiTimeframeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('KRW-BTC');
  const [configDialog, setConfigDialog] = useState(false);
  const [timeframeConfig, setTimeframeConfig] = useState<TimeframeConfig[]>([
    { interval: '1m', period: 100, weight: 0.1, enabled: true },
    { interval: '5m', period: 100, weight: 0.15, enabled: true },
    { interval: '15m', period: 100, weight: 0.2, enabled: true },
    { interval: '1h', period: 100, weight: 0.25, enabled: true },
    { interval: '4h', period: 100, weight: 0.2, enabled: true },
    { interval: '1d', period: 30, weight: 0.1, enabled: true }
  ]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 초기 분석
    handleAnalyze();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleAnalyze();
      }, 60000); // 1분마다 자동 새로고침
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await electronAPI.analyzeMultiTimeframe({
        symbol: selectedSymbol,
        timeframes: timeframeConfig.filter(tf => tf.enabled)
      });
      
      setAnalysis(result);
    } catch (err) {
      setError('멀티 타임프레임 분석에 실패했습니다.');
      console.error('Multi-timeframe analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = () => {
    // 가중치 합계가 1이 되도록 정규화
    const enabledConfigs = timeframeConfig.filter(tf => tf.enabled);
    const totalWeight = enabledConfigs.reduce((sum, tf) => sum + tf.weight, 0);
    
    if (totalWeight > 0) {
      const normalizedConfig = timeframeConfig.map(tf => ({
        ...tf,
        weight: tf.enabled ? tf.weight / totalWeight : tf.weight
      }));
      setTimeframeConfig(normalizedConfig);
    }
    
    setConfigDialog(false);
    handleAnalyze(); // 설정 변경 후 재분석
  };

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return 'success';
      case 'SELL': return 'error';
      default: return 'default';
    }
  };

  const getSignalIcon = (signal: 'BUY' | 'SELL' | 'HOLD') => {
    switch (signal) {
      case 'BUY': return <TrendingUp />;
      case 'SELL': return <TrendingDown />;
      default: return <TrendingFlat />;
    }
  };

  const getTrendIcon = (trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    switch (trend) {
      case 'BULLISH': return <TrendingUp color="success" />;
      case 'BEARISH': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="disabled" />;
    }
  };

  const getRiskIcon = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return <CheckCircle color="success" />;
      case 'MEDIUM': return <Warning color="warning" />;
      default: return <Error color="error" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getTimeframeName = (interval: string) => {
    const names: { [key: string]: string } = {
      '1m': '1분',
      '5m': '5분',
      '15m': '15분',
      '1h': '1시간',
      '4h': '4시간',
      '1d': '1일'
    };
    return names[interval] || interval;
  };

  return (
    <Box>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Timeline color="primary" />
          <Typography variant="h5" fontWeight="bold">
            멀티 타임프레임 분석
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="자동 새로고침"
          />
          
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setConfigDialog(true)}
          >
            설정
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleAnalyze}
            disabled={loading}
          >
            분석
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <CircularProgress size={24} />
          <Typography>멀티 타임프레임 분석 중...</Typography>
        </Box>
      )}

      {analysis && (
        <Grid container spacing={3}>
          {/* 전체 분석 결과 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    종합 분석 결과
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    분석 시간: {formatTimestamp(analysis.timestamp)}
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                        {getSignalIcon(analysis.overallSignal)}
                        <Typography variant="h4" fontWeight="bold">
                          {analysis.overallSignal}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`신뢰도 ${(analysis.confidence * 100).toFixed(1)}%`}
                        color={getSignalColor(analysis.overallSignal)}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Box textAlign="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                        {getRiskIcon(analysis.riskLevel)}
                        <Typography variant="h6">
                          {analysis.riskLevel} 리스크
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.confidence * 100}
                        color={getSignalColor(analysis.overallSignal) as any}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      추천 행동
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analysis.recommendedAction}
                    </Typography>
                    
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>
                      주요 근거:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                      {analysis.reasons.map((reason, index) => (
                        <Typography key={index} component="li" variant="body2" color="text.secondary">
                          {reason}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 타임프레임별 상세 분석 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  타임프레임별 분석
                </Typography>
                
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>타임프레임</TableCell>
                        <TableCell>추세</TableCell>
                        <TableCell>RSI</TableCell>
                        <TableCell>모멘텀</TableCell>
                        <TableCell>변동성</TableCell>
                        <TableCell>신호</TableCell>
                        <TableCell>신뢰도</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analysis.timeframes.map((tf) => {
                        const netSignal = tf.signals.buy - tf.signals.sell;
                        const signal = netSignal > 0.1 ? 'BUY' : netSignal < -0.1 ? 'SELL' : 'HOLD';
                        
                        return (
                          <TableRow key={tf.interval}>
                            <TableCell>
                              <Typography fontWeight="bold">
                                {getTimeframeName(tf.interval)}
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getTrendIcon(tf.indicators.trend)}
                                <Typography variant="body2">
                                  {tf.indicators.trend}
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            <TableCell>
                              <Typography 
                                color={tf.indicators.rsi > 70 ? 'error' : tf.indicators.rsi < 30 ? 'success' : 'text.primary'}
                                fontWeight={tf.indicators.rsi > 70 || tf.indicators.rsi < 30 ? 'bold' : 'normal'}
                              >
                                {tf.indicators.rsi.toFixed(1)}
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Typography 
                                color={tf.indicators.momentum > 0 ? 'success' : 'error'}
                              >
                                {(tf.indicators.momentum * 100).toFixed(2)}%
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="body2">
                                {(tf.indicators.volatility * 100).toFixed(2)}%
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Chip
                                icon={getSignalIcon(signal)}
                                label={signal}
                                color={getSignalColor(signal)}
                                size="small"
                              />
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="body2">
                                {(tf.signals.confidence * 100).toFixed(1)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 설정 다이얼로그 */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>멀티 타임프레임 설정</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            각 타임프레임의 활성화 여부와 가중치를 설정하세요. 가중치 합계는 자동으로 1.0으로 정규화됩니다.
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>활성화</TableCell>
                  <TableCell>타임프레임</TableCell>
                  <TableCell>기간</TableCell>
                  <TableCell>가중치</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timeframeConfig.map((config, index) => (
                  <TableRow key={config.interval}>
                    <TableCell>
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => {
                          const newConfig = [...timeframeConfig];
                          newConfig[index].enabled = e.target.checked;
                          setTimeframeConfig(newConfig);
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography fontWeight="bold">
                        {getTimeframeName(config.interval)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <TextField
                        type="number"
                        value={config.period}
                        onChange={(e) => {
                          const newConfig = [...timeframeConfig];
                          newConfig[index].period = parseInt(e.target.value) || 100;
                          setTimeframeConfig(newConfig);
                        }}
                        size="small"
                        inputProps={{ min: 10, max: 200 }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <TextField
                        type="number"
                        value={config.weight}
                        onChange={(e) => {
                          const newConfig = [...timeframeConfig];
                          newConfig[index].weight = parseFloat(e.target.value) || 0.1;
                          setTimeframeConfig(newConfig);
                        }}
                        size="small"
                        inputProps={{ min: 0.01, max: 1.0, step: 0.01 }}
                        disabled={!config.enabled}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>
            취소
          </Button>
          <Button variant="contained" onClick={handleConfigSave}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};