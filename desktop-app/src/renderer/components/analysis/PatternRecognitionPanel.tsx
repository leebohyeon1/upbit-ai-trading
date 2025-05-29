import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Chip, LinearProgress, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown, HorizontalRule } from '@mui/icons-material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';

interface PatternData {
  candlePatterns: Array<{
    pattern: string;
    type: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    description: string;
  }>;
  chartPatterns: Array<{
    pattern: string;
    type: 'bullish' | 'bearish' | 'continuation';
    confidence: number;
    targetPrice?: number;
  }>;
  patternSignal: 'BUY' | 'SELL' | 'HOLD';
  patternConfidence: number;
}

interface PatternRecognitionPanelProps {
  patterns?: PatternData;
  currentPrice?: number;
}

const PatternRecognitionPanel: React.FC<PatternRecognitionPanelProps> = ({ patterns, currentPrice }) => {
  if (!patterns) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            패턴 인식
          </Typography>
          <Typography color="textSecondary">
            패턴 데이터를 분석 중입니다...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'bullish':
        return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'bearish':
        return <TrendingDown sx={{ color: '#f44336' }} />;
      default:
        return <HorizontalRule sx={{ color: '#ff9800' }} />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return '#4caf50';
      case 'SELL':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const formatTargetPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  const calculatePriceChange = (targetPrice?: number) => {
    if (!targetPrice || !currentPrice) return null;
    const change = ((targetPrice - currentPrice) / currentPrice) * 100;
    return change;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ShowChartIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            패턴 인식 분석
          </Typography>
        </Box>

        {/* 종합 신호 */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            종합 패턴 신호
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: getSignalColor(patterns.patternSignal),
                fontWeight: 'bold'
              }}
            >
              {patterns.patternSignal}
            </Typography>
            <Box sx={{ flex: 1, mx: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={patterns.patternConfidence * 100} 
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getSignalColor(patterns.patternSignal)
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ minWidth: 50 }}>
                  {(patterns.patternConfidence * 100).toFixed(0)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 캔들 패턴 */}
        {patterns.candlePatterns.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CandlestickChartIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                캔들 패턴
              </Typography>
            </Box>
            <Grid container spacing={1}>
              {patterns.candlePatterns.map((pattern, index) => (
                <Grid item xs={12} key={index}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {getPatternIcon(pattern.type)}
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {pattern.pattern}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {pattern.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`${(pattern.confidence * 100).toFixed(0)}%`}
                      size="small"
                      sx={{
                        backgroundColor: pattern.type === 'bullish' ? '#e8f5e9' : 
                                       pattern.type === 'bearish' ? '#ffebee' : '#fff3e0',
                        color: pattern.type === 'bullish' ? '#2e7d32' : 
                               pattern.type === 'bearish' ? '#c62828' : '#ef6c00'
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* 차트 패턴 */}
        {patterns.chartPatterns.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ShowChartIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                차트 패턴
              </Typography>
            </Box>
            <Grid container spacing={1}>
              {patterns.chartPatterns.map((pattern, index) => {
                const priceChange = calculatePriceChange(pattern.targetPrice);
                return (
                  <Grid item xs={12} key={index}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getPatternIcon(pattern.type)}
                          <Typography variant="body2" fontWeight="medium" sx={{ ml: 1 }}>
                            {pattern.pattern}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`${(pattern.confidence * 100).toFixed(0)}%`}
                          size="small"
                          sx={{
                            backgroundColor: pattern.type === 'bullish' ? '#e8f5e9' : 
                                           pattern.type === 'bearish' ? '#ffebee' : '#fff3e0',
                            color: pattern.type === 'bullish' ? '#2e7d32' : 
                                   pattern.type === 'bearish' ? '#c62828' : '#ef6c00'
                          }}
                        />
                      </Box>
                      {pattern.targetPrice && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="textSecondary">
                            목표가: {formatTargetPrice(pattern.targetPrice)}
                          </Typography>
                          {priceChange !== null && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: priceChange > 0 ? '#4caf50' : '#f44336',
                                fontWeight: 'medium'
                              }}
                            >
                              {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* 패턴이 없는 경우 */}
        {patterns.candlePatterns.length === 0 && patterns.chartPatterns.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="textSecondary">
              현재 감지된 패턴이 없습니다
            </Typography>
          </Box>
        )}

        {/* 도움말 */}
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="textSecondary">
            💡 패턴 인식은 과거 가격 움직임에서 반복되는 형태를 찾아 미래 가격을 예측합니다.
            단독으로 사용하지 말고 다른 지표와 함께 참고하세요.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PatternRecognitionPanel;