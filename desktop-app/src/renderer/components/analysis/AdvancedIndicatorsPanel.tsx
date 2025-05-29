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
  CircularProgress,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  TextField,
  MenuItem
} from '@mui/material';
import {
  ShowChart,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  ExpandMore,
  Timeline,
  Analytics,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Cloud,
  Functions
} from '@mui/icons-material';
import { useTradingContext } from '../../contexts/TradingContext';

interface IchimokuCloud {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikou: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  cloudThickness: number;
}

interface FibonacciLevel {
  level: number;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;
  description: string;
}

interface FibonacciRetracement {
  high: number;
  low: number;
  direction: 'UPTREND' | 'DOWNTREND';
  levels: FibonacciLevel[];
  currentPriceLevel: number;
  signals: {
    nearestSupport: FibonacciLevel | null;
    nearestResistance: FibonacciLevel | null;
    recommendation: string;
    confidence: number;
  };
}

interface AdvancedIndicatorAnalysis {
  symbol: string;
  timestamp: number;
  ichimoku: IchimokuCloud;
  fibonacci: FibonacciRetracement;
  combinedSignal: {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export const AdvancedIndicatorsPanel: React.FC = () => {
  const { analyzeAdvancedIndicators } = useTradingContext();
  const [analysis, setAnalysis] = useState<AdvancedIndicatorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('KRW-BTC');
  const [timeframe, setTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const timeframes = [
    { value: '15m', label: '15분' },
    { value: '1h', label: '1시간' },
    { value: '4h', label: '4시간' },
    { value: '1d', label: '1일' }
  ];

  const symbols = [
    'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT',
    'KRW-LINK', 'KRW-LTC', 'KRW-BCH', 'KRW-SOL', 'KRW-AVAX'
  ];

  useEffect(() => {
    handleAnalyze();
  }, [selectedSymbol, timeframe]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleAnalyze();
      }, 300000); // 5분마다 자동 새로고침
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await analyzeAdvancedIndicators({
        symbol: selectedSymbol,
        timeframe,
        period: 200
      });
      
      setAnalysis(result);
    } catch (err) {
      setError('고급 지표 분석에 실패했습니다.');
      console.error('Advanced indicators analysis error:', err);
    } finally {
      setLoading(false);
    }
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

  const getRiskIcon = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (risk) {
      case 'LOW': return <CheckCircle color="success" />;
      case 'MEDIUM': return <Warning color="warning" />;
      default: return <Error color="error" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  return (
    <Box>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Analytics color="primary" />
          <Typography variant="h5" fontWeight="bold">
            고급 기술 지표 분석
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            select
            size="small"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {symbols.map((symbol) => (
              <MenuItem key={symbol} value={symbol}>
                {symbol.replace('KRW-', '')}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            size="small"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            sx={{ minWidth: 100 }}
          >
            {timeframes.map((tf) => (
              <MenuItem key={tf.value} value={tf.value}>
                {tf.label}
              </MenuItem>
            ))}
          </TextField>
          
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
          <Typography>고급 지표 분석 중...</Typography>
        </Box>
      )}

      {analysis && (
        <Grid container spacing={3}>
          {/* 종합 분석 결과 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    종합 분석 결과
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(analysis.timestamp)}
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                        {getSignalIcon(analysis.combinedSignal.action)}
                        <Typography variant="h4" fontWeight="bold">
                          {analysis.combinedSignal.action}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`신뢰도 ${(analysis.combinedSignal.confidence * 100).toFixed(1)}%`}
                        color={getSignalColor(analysis.combinedSignal.action)}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box textAlign="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                        {getRiskIcon(analysis.combinedSignal.riskLevel)}
                        <Typography variant="h6">
                          {analysis.combinedSignal.riskLevel} 리스크
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={analysis.combinedSignal.confidence * 100}
                        color={getSignalColor(analysis.combinedSignal.action) as any}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      분석 근거:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                      {analysis.combinedSignal.reasons.map((reason, index) => (
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

          {/* 이치모쿠 클라우드 분석 */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Cloud color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    이치모쿠 클라우드
                  </Typography>
                  <Chip 
                    label={analysis.ichimoku.signal}
                    color={analysis.ichimoku.signal === 'BULLISH' ? 'success' : 
                           analysis.ichimoku.signal === 'BEARISH' ? 'error' : 'default'}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>전환선 (9일)</strong></TableCell>
                            <TableCell>{formatPrice(analysis.ichimoku.tenkanSen)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>기준선 (26일)</strong></TableCell>
                            <TableCell>{formatPrice(analysis.ichimoku.kijunSen)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>선행스팬A</strong></TableCell>
                            <TableCell>{formatPrice(analysis.ichimoku.senkouSpanA)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>선행스팬B</strong></TableCell>
                            <TableCell>{formatPrice(analysis.ichimoku.senkouSpanB)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>후행스팬</strong></TableCell>
                            <TableCell>{formatPrice(analysis.ichimoku.chikou)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="body2">
                        신호 강도: {(analysis.ichimoku.strength * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        구름 두께: {(analysis.ichimoku.cloudThickness * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={analysis.ichimoku.strength * 100}
                      sx={{ mt: 1 }}
                      color={analysis.ichimoku.signal === 'BULLISH' ? 'success' : 
                             analysis.ichimoku.signal === 'BEARISH' ? 'error' : 'primary'}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 피보나치 되돌림 분석 */}
          <Grid item xs={12} md={6}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Functions color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    피보나치 되돌림
                  </Typography>
                  <Chip 
                    label={analysis.fibonacci.direction}
                    color={analysis.fibonacci.direction === 'UPTREND' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box mb={2}>
                      <Typography variant="body2" gutterBottom>
                        <strong>분석 범위:</strong> {formatPrice(analysis.fibonacci.low)} ~ {formatPrice(analysis.fibonacci.high)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>현재 레벨:</strong> {analysis.fibonacci.currentPriceLevel.toFixed(1)}% 되돌림
                      </Typography>
                      <Typography variant="body2" color="primary" gutterBottom>
                        <strong>추천:</strong> {analysis.fibonacci.signals.recommendation}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      주요 피보나치 레벨
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 200 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>레벨</TableCell>
                            <TableCell>가격</TableCell>
                            <TableCell>타입</TableCell>
                            <TableCell>강도</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analysis.fibonacci.levels
                            .filter(level => level.strength > 0.1 || [23.6, 38.2, 50, 61.8, 78.6].includes(level.level))
                            .slice(0, 8)
                            .map((level) => (
                              <TableRow key={level.level}>
                                <TableCell>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={[38.2, 50, 61.8].includes(level.level) ? 'bold' : 'normal'}
                                    color={[38.2, 50, 61.8].includes(level.level) ? 'primary' : 'inherit'}
                                  >
                                    {level.level}%
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {formatPrice(level.price)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={level.type === 'SUPPORT' ? '지지' : '저항'}
                                    color={level.type === 'SUPPORT' ? 'success' : 'error'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={level.strength * 100}
                                      sx={{ width: 40, height: 4 }}
                                    />
                                    <Typography variant="caption">
                                      {(level.strength * 100).toFixed(0)}%
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  {(analysis.fibonacci.signals.nearestSupport || analysis.fibonacci.signals.nearestResistance) && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        가장 가까운 레벨
                      </Typography>
                      
                      {analysis.fibonacci.signals.nearestSupport && (
                        <Typography variant="body2" color="success.main">
                          📈 지지: {analysis.fibonacci.signals.nearestSupport.level}% ({formatPrice(analysis.fibonacci.signals.nearestSupport.price)})
                        </Typography>
                      )}
                      
                      {analysis.fibonacci.signals.nearestResistance && (
                        <Typography variant="body2" color="error.main">
                          📉 저항: {analysis.fibonacci.signals.nearestResistance.level}% ({formatPrice(analysis.fibonacci.signals.nearestResistance.price)})
                        </Typography>
                      )}
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 사용법 안내 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📚 고급 지표 해석 가이드
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                      이치모쿠 클라우드
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Cloud fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="구름 위 = 상승 추세" 
                          secondary="가격이 구름(선행스팬A, B) 위에 있으면 강세"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="전환선 > 기준선" 
                          secondary="단기 상승 모멘텀"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Timeline fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="후행스팬 분석" 
                          secondary="과거 가격 대비 현재 상황 비교"
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="secondary">
                      피보나치 되돌림
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Functions fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="38.2%, 50%, 61.8%" 
                          secondary="주요 되돌림 레벨에서 반등 가능성"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="61.8% 황금비율" 
                          secondary="가장 중요한 지지/저항 레벨"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="강도 확인 필수" 
                          secondary="과거 반응 횟수로 신뢰도 판단"
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};