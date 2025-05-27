import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { format, parse } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTradingContext } from '../../contexts/TradingContext';
import { BacktestResult } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export const BacktestPanel: React.FC = () => {
  const { portfolio, tradingConfig } = useTradingContext();
  const [selectedCoin, setSelectedCoin] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleRunBacktest = async () => {
    if (!selectedCoin || !startDate || !endDate) {
      setError('코인과 기간을 선택해주세요.');
      return;
    }

    setIsRunning(true);
    setError('');
    setResult(null);

    try {
      const electronAPI = (window as any).electronAPI;
      const backtestResult = await electronAPI.runBacktest(
        selectedCoin,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        tradingConfig
      );

      if (backtestResult) {
        setResult(backtestResult);
      } else {
        setError('백테스트 실행에 실패했습니다.');
      }
    } catch (error) {
      console.error('Backtest error:', error);
      setError('백테스트 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
    }
  };

  const getChartData = () => {
    if (!result?.trades) return [];

    let balance = 1000000; // 초기 자금 100만원
    const data = [{ date: startDate ? format(startDate, 'MM/dd') : '', value: balance }];

    result.trades.forEach(trade => {
      if (trade.type === 'BUY') {
        balance -= trade.price * trade.amount;
      } else {
        balance += trade.price * trade.amount;
        if (trade.profit) {
          balance += trade.profit;
        }
      }
      data.push({
        date: format(new Date(trade.date), 'MM/dd'),
        value: Math.round(balance)
      });
    });

    return data;
  };

  // 설정 카드 컴포넌트
  const SettingsCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          백테스트 설정
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            select
            fullWidth
            label="코인 선택"
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            SelectProps={{ native: true }}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          >
            <option value="">선택하세요</option>
            {portfolio.filter(p => p.enabled).map(coin => (
              <option key={coin.symbol} value={coin.symbol}>
                {coin.name} ({coin.symbol})
              </option>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="시작일"
            type="date"
            value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => setStartDate(e.target.value ? parse(e.target.value, 'yyyy-MM-dd', new Date()) : null)}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            fullWidth
            label="종료일"
            type="date"
            value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => setEndDate(e.target.value ? parse(e.target.value, 'yyyy-MM-dd', new Date()) : null)}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handleRunBacktest}
            disabled={!selectedCoin || !startDate || !endDate || isRunning}
            sx={{ mt: 3 }}
          >
            {isRunning ? '백테스트 실행 중...' : '백테스트 실행'}
          </Button>

          {isRunning && <LinearProgress sx={{ mt: 2 }} />}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      flex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1, sm: 2, md: 3, lg: 4 },
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          백테스트
        </Typography>
      </Box>

      {!result ? (
        // 결과가 없을 때: 중앙 정렬된 설정 카드
        <Box display="flex" justifyContent="center">
          <Box sx={{ maxWidth: 600, width: '100%' }}>
            <SettingsCard />
          </Box>
        </Box>
      ) : (
        // 결과가 있을 때: Grid 레이아웃
        <Grid container spacing={3}>
          {/* 설정 카드 */}
          <Grid item xs={12} md={4}>
            <SettingsCard />
          </Grid>

          {/* 결과 카드 */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  백테스트 결과
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">
                      총 수익률
                    </Typography>
                    <Typography variant="h6" color={result.performance.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                      {formatPercent(result.performance.totalReturn)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">
                      승률
                    </Typography>
                    <Typography variant="h6">
                      {formatPercent(result.performance.winRate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">
                      총 거래 횟수
                    </Typography>
                    <Typography variant="h6">
                      {result.performance.totalTrades}회
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">
                      샤프 비율
                    </Typography>
                    <Typography variant="h6">
                      {result.performance.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* 수익 곡선 차트 */}
                <Box sx={{ mt: 4, height: 300, minHeight: 300, width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    누적 수익 곡선
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        name="자산가치"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 거래 내역 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  거래 내역
                </Typography>

                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>날짜</TableCell>
                        <TableCell>유형</TableCell>
                        <TableCell align="right">가격</TableCell>
                        <TableCell align="right">수량</TableCell>
                        <TableCell align="right">신뢰도</TableCell>
                        <TableCell align="right">수익률</TableCell>
                        <TableCell>신호</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.trades.map((trade, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(trade.date).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={trade.type}
                              size="small"
                              color={trade.type === 'BUY' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(trade.price)}
                          </TableCell>
                          <TableCell align="right">
                            {trade.amount.toFixed(8)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent(trade.confidence)}
                          </TableCell>
                          <TableCell align="right">
                            {trade.profitPercent && (
                              <Typography
                                color={trade.profitPercent >= 0 ? 'success.main' : 'error.main'}
                              >
                                {formatPercent(trade.profitPercent)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{trade.signal}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* 시장 상황별 성과 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  시장 상황별 성과
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    상승장
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>승률: {formatPercent(result.marketConditions.bullMarket.winRate)}</Typography>
                    <Typography>평균 수익: {formatPercent(result.marketConditions.bullMarket.averageReturn)}</Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    하락장
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>승률: {formatPercent(result.marketConditions.bearMarket.winRate)}</Typography>
                    <Typography>평균 수익: {formatPercent(result.marketConditions.bearMarket.averageReturn)}</Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    횡보장
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>승률: {formatPercent(result.marketConditions.sidewaysMarket.winRate)}</Typography>
                    <Typography>평균 수익: {formatPercent(result.marketConditions.sidewaysMarket.averageReturn)}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 최적 파라미터 */}
          {result.optimalParameters && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    권장 파라미터
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      RSI 기간: {result.optimalParameters.rsiPeriod || '14'}
                    </Typography>
                    <Typography variant="body2">
                      볼린저 밴드 기간: {result.optimalParameters.bollingerPeriod || '20'}
                    </Typography>
                    <Typography variant="body2">
                      거래량 임계값: {result.optimalParameters.volumeThreshold || '1.5'}x
                    </Typography>
                    <Typography variant="body2">
                      익절 목표: {formatPercent(result.optimalParameters.takeProfitPercent || 5)}
                    </Typography>
                    <Typography variant="body2">
                      손절 기준: {formatPercent(result.optimalParameters.stopLossPercent || 3)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};