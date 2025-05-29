import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  ShowChart,
  Timeline,
  Assessment
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { formatPercent, formatCurrency } from '../../utils/formatters';

interface MarketCorrelation {
  timestamp: number;
  btcDominance: number;
  altcoinSeason: boolean;
  sp500Correlation: number;
  nasdaqCorrelation: number;
  dxyIndex: number;
  dxyChange24h: number;
  fearGreedIndex: number;
  globalMarketCap: number;
  globalVolume24h: number;
  btcPrice: number;
  ethBtcRatio: number;
  correlationInsights: string[];
}

interface CoinCorrelation {
  coin: string;
  btcCorrelation: number;
  ethCorrelation: number;
  marketCapRank: number;
  priceChange7d: number;
  volumeChange24h: number;
  isOutperforming: boolean;
}

export const MarketCorrelationPanel: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketCorrelation | null>(null);
  const [coinCorrelations, setCoinCorrelations] = useState<CoinCorrelation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchMarketCorrelation = async () => {
    setIsLoading(true);
    setError('');

    try {
      const electronAPI = (window as any).electronAPI;
      
      // 실제 API 호출
      const response = await electronAPI.invoke('market-correlation');
      
      if (response) {
        // 응답 데이터를 MarketCorrelation 형식으로 변환
        const marketCorrelation: MarketCorrelation = {
          timestamp: new Date(response.lastUpdated).getTime(),
          btcDominance: response.btcDominance,
          altcoinSeason: response.btcDominance < 45,
          sp500Correlation: response.sp500.correlation,
          nasdaqCorrelation: response.nasdaq.correlation,
          dxyIndex: response.dxy.correlation < 0 ? 100 + Math.abs(response.dxy.change) : 100 - Math.abs(response.dxy.change),
          dxyChange24h: response.dxy.change,
          fearGreedIndex: response.fearGreedIndex.value,
          globalMarketCap: 2500000000000, // 기본값 (실제 API에서 가져올 수 있으면 추가)
          globalVolume24h: 98000000000, // 기본값 (실제 API에서 가져올 수 있으면 추가)
          btcPrice: 65000, // 기본값 (실제 API에서 가져올 수 있으면 추가)
          ethBtcRatio: 0.058, // 기본값 (실제 API에서 가져올 수 있으면 추가)
          correlationInsights: generateInsights(response)
        };

        // 코인 상관관계 데이터 (임시 - 추후 실제 API로 대체)
        const coinData: CoinCorrelation[] = [
          { coin: 'ETH', btcCorrelation: 0.85, ethCorrelation: 1, marketCapRank: 2, priceChange7d: 5.2, volumeChange24h: 12.3, isOutperforming: true },
          { coin: 'BNB', btcCorrelation: 0.75, ethCorrelation: 0.72, marketCapRank: 4, priceChange7d: -2.1, volumeChange24h: -5.2, isOutperforming: false },
          { coin: 'SOL', btcCorrelation: 0.68, ethCorrelation: 0.71, marketCapRank: 5, priceChange7d: 8.7, volumeChange24h: 25.3, isOutperforming: true },
          { coin: 'XRP', btcCorrelation: 0.62, ethCorrelation: 0.58, marketCapRank: 6, priceChange7d: -1.2, volumeChange24h: -8.1, isOutperforming: false }
        ];

        setMarketData(marketCorrelation);
        setCoinCorrelations(coinData);
      }
    } catch (error) {
      console.error('Failed to fetch market correlation:', error);
      setError('시장 상관관계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인사이트 생성 함수
  const generateInsights = (data: any): string[] => {
    const insights: string[] = [];

    // BTC 도미넌스 인사이트
    if (data.btcDominance > 60) {
      insights.push('🔴 BTC 도미넌스가 매우 높음 - 알트코인 약세 예상');
    } else if (data.btcDominance < 40) {
      insights.push('🟢 BTC 도미넌스가 낮음 - 알트코인 시즌 진행 중');
    }

    // 공포/탐욕 지수 인사이트
    if (data.fearGreedIndex.value < 20) {
      insights.push('😱 극도의 공포 - 역발상 매수 기회 가능');
    } else if (data.fearGreedIndex.value > 80) {
      insights.push('🤑 극도의 탐욕 - 차익실현 고려 필요');
    }

    // 주식 시장 상관관계
    if (data.sp500.correlation > 0.7) {
      insights.push('📊 미국 주식시장과 높은 상관관계 - 나스닥 선물 주시');
    } else if (data.sp500.correlation < 0.3) {
      insights.push('🔀 주식시장과 디커플링 - 암호화폐 고유 움직임');
    }

    // 달러 인덱스
    if (data.dxy.change > 1) {
      insights.push('💵 달러 강세 - 암호화폐 하락 압력 가능');
    } else if (data.dxy.change < -1) {
      insights.push('💸 달러 약세 - 암호화폐 상승 여력 증가');
    }

    // 시장 심리
    if (data.marketSentiment === 'Bearish') {
      insights.push('🐻 전반적인 시장 심리 약세 - 신중한 접근 필요');
    } else if (data.marketSentiment === 'Bullish') {
      insights.push('🐂 전반적인 시장 심리 강세 - 상승 모멘텀 활용');
    }

    return insights.length > 0 ? insights : ['시장은 현재 균형잡힌 상태입니다'];
  };

  useEffect(() => {
    fetchMarketCorrelation();
    const interval = setInterval(fetchMarketCorrelation, 5 * 60 * 1000); // 5분마다 갱신
    return () => clearInterval(interval);
  }, []);

  const getFearGreedColor = (index: number) => {
    if (index <= 20) return '#dc3545'; // 극도의 공포
    if (index <= 40) return '#fd7e14'; // 공포
    if (index <= 60) return '#ffc107'; // 중립
    if (index <= 80) return '#28a745'; // 탐욕
    return '#20c997'; // 극도의 탐욕
  };

  const getFearGreedText = (index: number) => {
    if (index <= 20) return '극도의 공포';
    if (index <= 40) return '공포';
    if (index <= 60) return '중립';
    if (index <= 80) return '탐욕';
    return '극도의 탐욕';
  };

  const dominanceData = marketData ? [
    { name: 'BTC', value: marketData.btcDominance, color: '#f7931a' },
    { name: '기타', value: 100 - marketData.btcDominance, color: '#e0e0e0' }
  ] : [];

  const correlationData = coinCorrelations.map(coin => ({
    name: coin.coin,
    btc: coin.btcCorrelation,
    eth: coin.ethCorrelation,
    change7d: coin.priceChange7d
  }));

  return (
    <Box sx={{ 
      width: '100%',
      minWidth: '100%',
      p: { xs: 1, sm: 2, md: 3, lg: 4 }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          시장 상관관계 분석
        </Typography>
        <IconButton onClick={fetchMarketCorrelation} disabled={isLoading}>
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {marketData && (
        <Grid container spacing={3}>
          {/* 주요 지표 */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {/* BTC 도미넌스 */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      BTC 도미넌스
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ width: 120, height: 120, minWidth: 120, minHeight: 120, mr: 2 }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <PieChart>
                            <Pie
                              data={dominanceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              dataKey="value"
                            >
                              {dominanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box>
                        <Typography variant="h4">
                          {marketData.btcDominance.toFixed(1)}%
                        </Typography>
                        <Chip
                          label={marketData.altcoinSeason ? '알트코인 시즌' : 'BTC 시즌'}
                          color={marketData.altcoinSeason ? 'success' : 'warning'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 공포/탐욕 지수 */}
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      공포/탐욕 지수
                    </Typography>
                    <Box textAlign="center">
                      <Typography 
                        variant="h2" 
                        sx={{ color: getFearGreedColor(marketData.fearGreedIndex) }}
                      >
                        {marketData.fearGreedIndex}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {getFearGreedText(marketData.fearGreedIndex)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 전통 시장과의 상관관계 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      전통 시장과의 상관관계
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <ShowChart sx={{ fontSize: 40, color: 'primary.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            S&P 500
                          </Typography>
                          <Typography variant="h6">
                            {(marketData.sp500Correlation * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Timeline sx={{ fontSize: 40, color: 'secondary.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            NASDAQ
                          </Typography>
                          <Typography variant="h6">
                            {(marketData.nasdaqCorrelation * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box textAlign="center">
                          <Assessment sx={{ fontSize: 40, color: 'success.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            달러 인덱스
                          </Typography>
                          <Typography variant="h6">
                            {marketData.dxyIndex.toFixed(1)}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color={marketData.dxyChange24h >= 0 ? 'error.main' : 'success.main'}
                          >
                            {marketData.dxyChange24h >= 0 ? '+' : ''}{marketData.dxyChange24h.toFixed(2)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* 코인별 상관관계 차트 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      주요 코인 상관관계
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={correlationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="btc" fill="#f7931a" name="BTC 상관관계" />
                          <Bar dataKey="eth" fill="#627eea" name="ETH 상관관계" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* 인사이트 및 코인 목록 */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              {/* 시장 인사이트 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      시장 인사이트
                    </Typography>
                    <List dense>
                      {marketData.correlationInsights.map((insight, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={insight}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* 우수 성과 코인 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      BTC 대비 성과
                    </Typography>
                    <List>
                      {coinCorrelations
                        .sort((a, b) => b.priceChange7d - a.priceChange7d)
                        .map((coin) => (
                          <ListItem key={coin.coin}>
                            <ListItemText
                              primary={coin.coin}
                              secondary={`시총 ${coin.marketCapRank}위`}
                            />
                            <ListItemSecondaryAction>
                              <Box textAlign="right">
                                <Typography 
                                  variant="body2" 
                                  color={coin.priceChange7d >= 0 ? 'success.main' : 'error.main'}
                                >
                                  {coin.priceChange7d >= 0 ? '+' : ''}{coin.priceChange7d.toFixed(1)}%
                                </Typography>
                                {coin.isOutperforming && (
                                  <Chip 
                                    label="우수" 
                                    size="small" 
                                    color="success"
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* 시장 통계 */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      글로벌 시장 통계
                    </Typography>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        총 시가총액
                      </Typography>
                      <Typography variant="h6">
                        ${(marketData.globalMarketCap / 1e12).toFixed(2)}T
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        24시간 거래량
                      </Typography>
                      <Typography variant="h6">
                        ${(marketData.globalVolume24h / 1e9).toFixed(1)}B
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        ETH/BTC 비율
                      </Typography>
                      <Typography variant="h6">
                        {marketData.ethBtcRatio.toFixed(4)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};