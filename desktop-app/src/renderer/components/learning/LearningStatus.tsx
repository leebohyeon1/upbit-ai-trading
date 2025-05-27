import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Badge,
  Divider
} from '@mui/material';
import {
  School,
  PlayArrow,
  Stop,
  TrendingUp,
  TrendingDown,
  Refresh,
  Psychology,
  Timeline,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTradingContext } from '../../contexts/TradingContext';
import { formatPercent } from '../../utils/formatters';

interface LearningMetrics {
  ticker: string;
  isRunning: boolean;
  totalTrades: number;
  winRate: number;
  averageProfit: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio: number;
  kellyFraction?: number;
  lastUpdated: Date;
  indicatorWeights: {
    name: string;
    weight: number;
    successRate: number;
    confidence: number;
  }[];
  performanceHistory: {
    date: string;
    winRate: number;
    profit: number;
  }[];
}

export const LearningStatus: React.FC = () => {
  const { portfolio, learningStates, toggleLearning } = useTradingContext();
  const [learningMetrics, setLearningMetrics] = useState<Record<string, LearningMetrics>>({});
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 학습 메트릭 가져오기
  const fetchLearningMetrics = async () => {
    console.log('[LearningStatus] Fetching learning metrics...');
    setIsRefreshing(true);
    try {
      const metrics: Record<string, LearningMetrics> = {};
      
      // 활성화된 코인들에 대해 학습 메트릭 가져오기
      for (const coin of portfolio.filter(p => p.enabled)) {
        try {
          const ticker = `KRW-${coin.symbol}`;
          const learningData = await window.electronAPI.getLearningMetrics(ticker);
          console.log(`[LearningStatus] Metrics for ${ticker}:`, learningData);
          
          if (learningData) {
            metrics[coin.symbol] = learningData;
          } else {
            // 데이터가 없는 경우 기본값
            const isRunning = learningStates.find(ls => ls.ticker === coin.symbol)?.isRunning || false;
            metrics[coin.symbol] = {
              ticker: coin.symbol,
              isRunning,
              totalTrades: 0,
              winRate: 0,
              averageProfit: 0,
              bestTrade: 0,
              worstTrade: 0,
              sharpeRatio: 0,
              lastUpdated: new Date(),
              indicatorWeights: [],
              performanceHistory: []
            };
          }
        } catch (error) {
          console.error(`Failed to fetch metrics for ${coin.symbol}:`, error);
        }
      }
      
      setLearningMetrics(metrics);
    } catch (error) {
      console.error('Failed to fetch learning metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLearningMetrics();
    const interval = setInterval(fetchLearningMetrics, 60000); // 1분마다 갱신
    
    // 거래 완료 시 즉시 업데이트
    const unsubscribe = window.electronAPI.onLearningUpdated((data: any) => {
      console.log('[LearningStatus] 거래 완료 알림 수신:', data);
      // 해당 코인의 메트릭만 다시 가져오기
      setTimeout(() => {
        console.log('[LearningStatus] 학습 메트릭 새로고침 시작');
        fetchLearningMetrics();
      }, 1000); // 1초 후 업데이트 (데이터 저장 시간 고려)
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [portfolio, learningStates]);

  const handleToggleLearning = async (ticker: string) => {
    console.log('[LearningStatus] Toggle learning for:', ticker);
    console.log('[LearningStatus] Current learningStates:', learningStates);
    
    const currentState = learningStates.find(ls => ls.ticker === ticker)?.isRunning || false;
    console.log('[LearningStatus] Current state:', currentState, '-> New state:', !currentState);
    
    try {
      await toggleLearning(ticker, !currentState);
      console.log('[LearningStatus] Toggle successful');
      
      // 즉시 메트릭 업데이트
      setTimeout(() => {
        fetchLearningMetrics();
      }, 500);
    } catch (error) {
      console.error('[LearningStatus] Toggle failed:', error);
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  const selectedMetrics = selectedCoin ? learningMetrics[selectedCoin] : null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          학습 상태
        </Typography>
        <IconButton onClick={fetchLearningMetrics} disabled={isRefreshing}>
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* 전체 학습 상태 요약 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                학습 중인 코인
              </Typography>
              
              <Grid container spacing={2}>
                {portfolio.filter(p => p.enabled).map(coin => {
                  const metrics = learningMetrics[coin.symbol];
                  const isRunning = metrics?.isRunning || false;
                  
                  console.log(`[LearningStatus] Coin ${coin.symbol} - isRunning:`, isRunning, 'metrics:', metrics);
                  
                  return (
                    <Grid item xs={12} sm={6} md={3} key={coin.symbol}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedCoin === coin.symbol ? 2 : 1,
                          borderColor: selectedCoin === coin.symbol ? 'primary.main' : 'divider'
                        }}
                        onClick={() => setSelectedCoin(coin.symbol)}
                      >
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="h6">
                                {coin.symbol}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {coin.name}
                              </Typography>
                            </Box>
                            <Badge
                              color={isRunning ? 'success' : 'default'}
                              variant="dot"
                              invisible={!isRunning}
                            >
                              <School />
                            </Badge>
                          </Box>
                          
                          {metrics && (
                            <Box mt={2}>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                  승률
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color={metrics.winRate > 50 ? 'success.main' : 'error.main'}
                                >
                                  {formatPercent(metrics.winRate)}
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                  평균 수익
                                </Typography>
                                <Typography 
                                  variant="body2"
                                  color={getPerformanceColor(metrics.averageProfit)}
                                >
                                  {metrics.averageProfit > 0 ? '+' : ''}{metrics.averageProfit.toFixed(2)}%
                                </Typography>
                              </Box>
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                  총 거래
                                </Typography>
                                <Typography variant="body2">
                                  {metrics.totalTrades}회
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          
                          <Box mt={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isRunning}
                                  onChange={() => handleToggleLearning(coin.symbol)}
                                  size="small"
                                />
                              }
                              label={isRunning ? '학습 중' : '학습 정지'}
                              sx={{ m: 0 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 선택된 코인 상세 정보 */}
        {selectedCoin && selectedMetrics && (
          <>
            {/* 성과 차트 */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedCoin} 학습 성과 추이
                  </Typography>
                  
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedMetrics.performanceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="winRate"
                          stroke="#8884d8"
                          name="승률 (%)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="profit"
                          stroke="#82ca9d"
                          name="수익률 (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 성과 통계 */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    상세 통계
                  </Typography>
                  
                  <Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        샤프 비율
                      </Typography>
                      <Typography variant="h5">
                        {selectedMetrics.sharpeRatio.toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          최고 수익
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          +{selectedMetrics.bestTrade.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          최대 손실
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {selectedMetrics.worstTrade.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {selectedMetrics.totalTrades >= 10 && (
                      <>
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Kelly Criterion
                          </Typography>
                          <Typography variant="h6" color="primary.main">
                            {((selectedMetrics.kellyFraction || 0) * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            최적 베팅 크기
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                      </>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      마지막 업데이트
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedMetrics.lastUpdated).toLocaleString('ko-KR')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 지표별 가중치 */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    학습된 지표 가중치
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>지표</TableCell>
                          <TableCell align="right">가중치</TableCell>
                          <TableCell align="right">성공률</TableCell>
                          <TableCell align="right">신뢰도</TableCell>
                          <TableCell align="center">상태</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedMetrics.indicatorWeights.map((indicator) => (
                          <TableRow key={indicator.name}>
                            <TableCell>{indicator.name}</TableCell>
                            <TableCell align="right">
                              <LinearProgress
                                variant="determinate"
                                value={indicator.weight * 100}
                                sx={{ width: 80, ml: 'auto' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatPercent(indicator.successRate * 100)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${(indicator.confidence * 100).toFixed(0)}%`}
                                size="small"
                                color={indicator.confidence > 0.8 ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {indicator.weight > 0.7 ? (
                                <Tooltip title="주요 지표">
                                  <CheckCircle color="success" fontSize="small" />
                                </Tooltip>
                              ) : indicator.weight < 0.5 ? (
                                <Tooltip title="신뢰도 낮음">
                                  <Warning color="warning" fontSize="small" />
                                </Tooltip>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* 학습 안내 */}
        <Grid item xs={12}>
          <Alert severity="info">
            학습 모드는 실제 거래 데이터를 기반으로 각 지표의 가중치를 자동으로 조정합니다.
            최소 100회 이상의 거래 후부터 의미 있는 학습 결과를 얻을 수 있습니다.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};