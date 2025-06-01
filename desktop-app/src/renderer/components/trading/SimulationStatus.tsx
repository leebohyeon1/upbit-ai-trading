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
  AlertTitle,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Assessment,
  Timer,
  AutoMode
} from '@mui/icons-material';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface CooldownInfo {
  learningEnabled: boolean;
  dynamicBuyCooldown: number;
  dynamicSellCooldown: number;
  cooldownPerformance?: {
    consecutiveLosses: number;
    recentVolatility: number;
    lastUpdated: number;
  };
}

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
  const [cooldownInfoMap, setCooldownInfoMap] = useState<Map<string, CooldownInfo>>(new Map());

  useEffect(() => {
    const fetchSimulationStatus = async () => {
      try {
        const data = await window.electronAPI.getSimulationStatus();
        setSimulationData(data);
        setLoading(false);

        // 포트폴리오의 각 코인에 대한 쿨타임 정보 가져오기
        if (data?.portfolio) {
          const cooldownPromises = data.portfolio.map(async (coin) => {
            try {
              const info = await window.electronAPI.getCooldownInfo(coin.market);
              return { market: coin.market, info };
            } catch (error) {
              console.error(`Failed to fetch cooldown info for ${coin.market}:`, error);
              return null;
            }
          });

          const results = await Promise.all(cooldownPromises);
          const newMap = new Map<string, CooldownInfo>();
          results.forEach((result) => {
            if (result) {
              console.log(`[SimulationStatus] Cooldown info for ${result.market}:`, result.info);
              newMap.set(result.market, result.info);
            }
          });
          setCooldownInfoMap(newMap);
        }
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
                    <TableCell align="center">쿨타임</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simulationData.portfolio.map((coin) => {
                    const cooldownInfo = cooldownInfoMap.get(coin.market);
                    return (
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
                      <TableCell align="center">
                        {cooldownInfo?.learningEnabled ? (
                          <Tooltip 
                            title={
                              <Box>
                                <Typography variant="caption" display="block">
                                  학습된 쿨타임 적용중
                                </Typography>
                                <Typography variant="caption" display="block">
                                  매수: {cooldownInfo.dynamicBuyCooldown}분
                                </Typography>
                                <Typography variant="caption" display="block">
                                  매도: {cooldownInfo.dynamicSellCooldown}분
                                </Typography>
                                {cooldownInfo.cooldownPerformance && (
                                  <>
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                      연속 손실: {cooldownInfo.cooldownPerformance.consecutiveLosses}회
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      변동성: {(cooldownInfo.cooldownPerformance.recentVolatility * 100).toFixed(2)}%
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            }
                          >
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <AutoMode sx={{ fontSize: 16, color: 'info.main' }} />
                              <Typography variant="caption" color="info.main">
                                {cooldownInfo.dynamicBuyCooldown}/{cooldownInfo.dynamicSellCooldown}분
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              기본값
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
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