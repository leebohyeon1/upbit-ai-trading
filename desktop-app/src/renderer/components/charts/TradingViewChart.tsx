import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Toolbar,
  IconButton,
  Button,
  ButtonGroup,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Alert
} from '@mui/material';
import {
  Timeline,
  Fullscreen,
  FullscreenExit,
  Refresh,
  Settings,
  TrendingUp,
  TrendingDown,
  ShowChart,
  CandlestickChart,
  BarChart as BarChartIcon
} from '@mui/icons-material';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewChartProps {
  symbol: string;
  data?: CandleData[];
  timeframe?: string;
  indicators?: string[];
  onTimeframeChange?: (timeframe: string) => void;
  height?: number;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  data = [],
  timeframe = '1h',
  indicators = [],
  onTimeframeChange,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState<'candle' | 'line' | 'bar'>('candle');
  const [priceData, setPriceData] = useState<CandleData[]>([]);

  const timeframes = [
    { value: '1m', label: '1분' },
    { value: '5m', label: '5분' },
    { value: '15m', label: '15분' },
    { value: '1h', label: '1시간' },
    { value: '4h', label: '4시간' },
    { value: '1d', label: '1일' }
  ];

  useEffect(() => {
    // 시뮬레이션 데이터 생성
    if (data.length === 0) {
      generateSimulationData();
    } else {
      setPriceData(data);
    }
  }, [symbol, timeframe, data]);

  useEffect(() => {
    if (priceData.length > 0) {
      drawChart();
    }
  }, [priceData, chartType, isFullscreen]);

  const generateSimulationData = () => {
    const basePrice = getBasePriceForSymbol(symbol);
    const candleCount = 100;
    const simulatedData: CandleData[] = [];
    
    let currentPrice = basePrice;
    const now = Date.now();
    const timeframeMs = getTimeframeInMs(timeframe);

    for (let i = candleCount - 1; i >= 0; i--) {
      const timestamp = now - (i * timeframeMs);
      
      // 가격 변동성 시뮬레이션
      const volatility = 0.02; // 2% 변동성
      const priceChange = (Math.random() - 0.5) * volatility * currentPrice;
      
      const open = currentPrice;
      const close = currentPrice + priceChange;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;

      simulatedData.push({
        time: timestamp,
        open,
        high,
        low,
        close,
        volume
      });

      currentPrice = close;
    }

    setPriceData(simulatedData);
  };

  const getBasePriceForSymbol = (symbol: string): number => {
    const basePrices: Record<string, number> = {
      'KRW-BTC': 50000000,
      'KRW-ETH': 3000000,
      'KRW-XRP': 600,
      'KRW-ADA': 500,
      'KRW-DOT': 7000,
      'KRW-LINK': 15000,
      'KRW-LTC': 80000,
      'KRW-BCH': 200000,
      'KRW-SOL': 100000,
      'KRW-AVAX': 30000
    };
    return basePrices[symbol] || 1000000;
  };

  const getTimeframeInMs = (tf: string): number => {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return timeframes[tf] || timeframes['1h'];
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || priceData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 차트 영역 설정
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // 가격 범위 계산
    const prices = priceData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // 배경 그리기
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 그리드 그리기
    drawGrid(ctx, rect.width, rect.height, padding);

    // 차트 그리기
    switch (chartType) {
      case 'candle':
        drawCandlesticks(ctx, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
      case 'line':
        drawLineChart(ctx, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
      case 'bar':
        drawBarChart(ctx, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
    }

    // 축 라벨 그리기
    drawAxisLabels(ctx, rect.width, rect.height, padding, minPrice, maxPrice);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, padding: number) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    // 수평선
    for (let i = 0; i <= 10; i++) {
      const y = padding + (height - padding * 2) * i / 10;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // 수직선
    for (let i = 0; i <= 10; i++) {
      const x = padding + (width - padding * 2) * i / 10;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
  };

  const drawCandlesticks = (
    ctx: CanvasRenderingContext2D,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number
  ) => {
    const candleWidth = chartWidth / priceData.length * 0.7;
    
    priceData.forEach((candle, index) => {
      const x = padding + (chartWidth / priceData.length) * index + (chartWidth / priceData.length - candleWidth) / 2;
      const openY = padding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = padding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = padding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      const isGreen = candle.close >= candle.open;
      ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';

      // 심지 그리기
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // 몸통 그리기
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (bodyHeight < 1) {
        // 도지 캔들
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, openY);
        ctx.lineTo(x + candleWidth, openY);
        ctx.stroke();
      } else {
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      }
    });
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number
  ) => {
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.beginPath();

    priceData.forEach((candle, index) => {
      const x = padding + (chartWidth / priceData.length) * index + (chartWidth / priceData.length) / 2;
      const y = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    padding: number,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number
  ) => {
    const barWidth = chartWidth / priceData.length * 0.8;
    
    priceData.forEach((candle, index) => {
      const x = padding + (chartWidth / priceData.length) * index + (chartWidth / priceData.length - barWidth) / 2;
      const openY = padding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = padding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = padding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      const isGreen = candle.close >= candle.open;
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 2;

      // OHLC 바 그리기
      // 세로선 (High-Low)
      ctx.beginPath();
      ctx.moveTo(x + barWidth / 2, highY);
      ctx.lineTo(x + barWidth / 2, lowY);
      ctx.stroke();

      // Open 표시 (왼쪽)
      ctx.beginPath();
      ctx.moveTo(x, openY);
      ctx.lineTo(x + barWidth / 2, openY);
      ctx.stroke();

      // Close 표시 (오른쪽)
      ctx.beginPath();
      ctx.moveTo(x + barWidth / 2, closeY);
      ctx.lineTo(x + barWidth, closeY);
      ctx.stroke();
    });
  };

  const drawAxisLabels = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: number,
    minPrice: number,
    maxPrice: number
  ) => {
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';

    // Y축 라벨 (가격)
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (maxPrice - minPrice) * i / 5;
      const y = height - padding - (height - padding * 2) * i / 5;
      const priceText = formatPrice(price);
      
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(priceText, padding - 5, y);
    }

    // X축 라벨 (시간)
    const timeStep = Math.floor(priceData.length / 6);
    for (let i = 0; i < priceData.length; i += timeStep) {
      if (priceData[i]) {
        const x = padding + (width - padding * 2) * i / priceData.length;
        const timeText = formatTime(priceData[i].time);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(timeText, x, height - padding + 5);
      }
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    } else {
      return price.toFixed(2);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    if (timeframe.includes('m')) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe.includes('h')) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1]?.close : 0;
  const previousPrice = priceData.length > 1 ? priceData[priceData.length - 2]?.close : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <Card
      sx={{
        height: isFullscreen ? '90vh' : height,
        width: '100%',
        transition: 'all 0.3s ease',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? '5vh' : 'auto',
        left: isFullscreen ? '5vw' : 'auto',
        right: isFullscreen ? '5vw' : 'auto',
        zIndex: isFullscreen ? 1300 : 'auto'
      }}
    >
      <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
        {/* 차트 헤더 */}
        <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '48px !important' }}>
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Timeline color="primary" />
              <Typography variant="h6" fontWeight="bold">
                {symbol.replace('KRW-', '')}
              </Typography>
              <Chip
                label={timeframe}
                color="primary"
                size="small"
              />
            </Box>

            {/* 현재가 정보 */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight="bold">
                {formatPrice(currentPrice)}
              </Typography>
              <Chip
                label={`${priceChange >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`}
                color={priceChange >= 0 ? 'success' : 'error'}
                size="small"
                icon={priceChange >= 0 ? <TrendingUp /> : <TrendingDown />}
              />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {/* 시간프레임 버튼 */}
            <ButtonGroup size="small" variant="outlined">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? 'contained' : 'outlined'}
                  onClick={() => onTimeframeChange?.(tf.value)}
                  size="small"
                >
                  {tf.label}
                </Button>
              ))}
            </ButtonGroup>

            {/* 차트 타입 버튼 */}
            <ButtonGroup size="small" variant="outlined">
              <Tooltip title="캔들차트">
                <Button
                  variant={chartType === 'candle' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('candle')}
                >
                  <CandlestickChart />
                </Button>
              </Tooltip>
              <Tooltip title="라인차트">
                <Button
                  variant={chartType === 'line' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('line')}
                >
                  <ShowChart />
                </Button>
              </Tooltip>
              <Tooltip title="바차트">
                <Button
                  variant={chartType === 'bar' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('bar')}
                >
                  <BarChartIcon />
                </Button>
              </Tooltip>
            </ButtonGroup>

            {/* 컨트롤 버튼 */}
            <Tooltip title="새로고침">
              <IconButton onClick={generateSimulationData} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? '전체화면 해제' : '전체화면'}>
              <IconButton onClick={toggleFullscreen} size="small">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* 차트 캔버스 */}
        <Box sx={{ position: 'relative', height: 'calc(100% - 48px)' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
          
          {priceData.length === 0 && (
            <Box
              position="absolute"
              top="50%"
              left="50%"
              sx={{ transform: 'translate(-50%, -50%)' }}
            >
              <Alert severity="info">
                차트 데이터를 로딩중입니다...
              </Alert>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};