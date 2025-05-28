import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Assessment
} from '@mui/icons-material';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface SimulationData {
  krwBalance: number;
  totalValue: number;
  profitRate: number;
  portfolio: Array<{
    market: string;
    balance: number;
    avgBuyPrice: number;
    currentPrice: number;
    profitRate: number;
    value: number;
  }>;
  recentTrades: Array<{
    market: string;
    type: 'BUY' | 'SELL';
    price: number;
    amount: number;
    volume: number;
    timestamp: number;
    krwBalance: number;
    coinBalance: number;
    profit?: number;
    profitRate?: number;
  }>;
}

export const SimulationStatus: React.FC = () => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimulationStatus = async () => {
      try {
        const data = await window.electronAPI.getSimulationStatus();
        setSimulationData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch simulation status:', error);
        setLoading(false);
      }
    };

    fetchSimulationStatus();
    const interval = setInterval(fetchSimulationStatus, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  if (!simulationData) {
    return (
      <Alert severity="info">
        <AlertTitle>시뮬레이션 모드가 아닙니다</AlertTitle>
        실거래가 활성화되어 있거나 거래가 중지된 상태입니다.
      </Alert>
    );
  }

  const initialCapital = 10000000; // 초기 자금 1천만원
  const profitAmount = simulationData.totalValue - initialCapital;

  return (
    <Box>
      {/* 전체 성과 요약 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    총 자산
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(simulationData.totalValue)}
                  </Typography>
                </Box>
                <Assessment color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    수익률
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={simulationData.profitRate >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatPercent(simulationData.profitRate)}
                  </Typography>
                </Box>
                {simulationData.profitRate >= 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    수익금
                  </Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    color={profitAmount >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(profitAmount)}
                  </Typography>
                </Box>
                <ShowChart color={profitAmount >= 0 ? 'success' : 'error'} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    현금 보유
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(simulationData.krwBalance)}
                  </Typography>
                </Box>
                <AccountBalance color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 포트폴리오 현황 */}
      {simulationData.portfolio.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              보유 코인
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>코인</TableCell>
                    <TableCell align="right">수량</TableCell>
                    <TableCell align="right">평균 매수가</TableCell>
                    <TableCell align="right">현재가</TableCell>
                    <TableCell align="right">평가금액</TableCell>
                    <TableCell align="right">수익률</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simulationData.portfolio.map((coin) => (
                    <TableRow key={coin.market}>
                      <TableCell>
                        <Chip label={coin.market.split('-')[1]} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {coin.balance.toFixed(8)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(coin.avgBuyPrice)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(coin.currentPrice)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(coin.value)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={coin.profitRate >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatPercent(coin.profitRate)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 최근 거래 내역 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            최근 거래 내역
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>시간</TableCell>
                  <TableCell>코인</TableCell>
                  <TableCell>구분</TableCell>
                  <TableCell align="right">가격</TableCell>
                  <TableCell align="right">금액</TableCell>
                  <TableCell align="right">수익률</TableCell>
                  <TableCell align="right">잔고</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {simulationData.recentTrades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {new Date(trade.timestamp).toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={trade.market.split('-')[1]} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.type === 'BUY' ? '매수' : '매도'}
                        size="small"
                        color={trade.type === 'BUY' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(trade.amount)}
                    </TableCell>
                    <TableCell align="right">
                      {trade.profitRate !== undefined && (
                        <Typography
                          variant="body2"
                          color={trade.profitRate >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatPercent(trade.profitRate)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(trade.krwBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};