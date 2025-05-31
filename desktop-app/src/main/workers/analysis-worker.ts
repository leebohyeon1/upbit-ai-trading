import { parentPort, workerData } from 'worker_threads';
import { Analysis } from '../../renderer/types';

interface WorkerMessage {
  type: 'analyze' | 'batch' | 'stop';
  data?: any;
}

interface WorkerResult {
  type: 'result' | 'error' | 'progress';
  data?: any;
  error?: string;
}

// 기술적 지표 계산 (CPU 집약적 작업)
function calculateIndicators(candles: any[], config: any): any {
  // RSI 계산
  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // MACD 계산
  const calculateMACD = (prices: number[]): any => {
    const ema = (prices: number[], period: number): number => {
      const k = 2 / (period + 1);
      let ema = prices[0];
      for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
      }
      return ema;
    };

    const ema12 = ema(prices, 12);
    const ema26 = ema(prices, 26);
    const macdLine = ema12 - ema26;
    const signal = ema([macdLine], 9);
    
    return {
      macd: macdLine,
      signal,
      histogram: macdLine - signal
    };
  };

  // 볼린저 밴드 계산
  const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2): any => {
    const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const variance = prices.slice(-period).reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: sma + stdDev * std,
      middle: sma,
      lower: sma - stdDev * std,
      bandwidth: (2 * stdDev * std) / sma
    };
  };

  const closePrices = candles.map(c => c.trade_price);
  const volumes = candles.map(c => c.candle_acc_trade_volume);

  return {
    rsi: calculateRSI(closePrices),
    macd: calculateMACD(closePrices),
    bollingerBands: calculateBollingerBands(closePrices),
    volume: {
      current: volumes[volumes.length - 1],
      average: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      ratio: volumes[volumes.length - 1] / (volumes.reduce((a, b) => a + b, 0) / volumes.length)
    }
  };
}

// 패턴 인식 (CPU 집약적 작업)
function recognizePatterns(candles: any[]): any {
  const patterns: {
    candlePatterns: Array<{ name: string; confidence: number }>;
    chartPatterns: Array<{ name: string; confidence: number }>;
  } = {
    candlePatterns: [],
    chartPatterns: []
  };

  // 캔들 패턴
  if (candles.length >= 3) {
    const [prev2, prev1, current] = candles.slice(-3);
    
    // Doji
    const bodyRatio = Math.abs(current.trade_price - current.opening_price) / current.trade_price;
    if (bodyRatio < 0.001) {
      patterns.candlePatterns.push({ name: 'Doji', confidence: 0.8 });
    }

    // Hammer
    const lowerShadow = Math.min(current.opening_price, current.trade_price) - current.low_price;
    const body = Math.abs(current.trade_price - current.opening_price);
    if (lowerShadow > body * 2 && current.trade_price > current.opening_price) {
      patterns.candlePatterns.push({ name: 'Hammer', confidence: 0.7 });
    }
  }

  // 차트 패턴 (간단한 예시)
  if (candles.length >= 20) {
    const prices = candles.map(c => c.trade_price);
    const recentPrices = prices.slice(-20);
    
    // 상승 추세
    const trend = (recentPrices[19] - recentPrices[0]) / recentPrices[0];
    if (trend > 0.05) {
      patterns.chartPatterns.push({ name: 'Uptrend', confidence: 0.6 });
    } else if (trend < -0.05) {
      patterns.chartPatterns.push({ name: 'Downtrend', confidence: 0.6 });
    }
  }

  return patterns;
}

// 메시지 핸들러
if (parentPort) {
  parentPort.on('message', async (message: WorkerMessage) => {
    try {
      switch (message.type) {
        case 'analyze':
          const { candles, config } = message.data;
          
          // 진행 상황 보고
          parentPort!.postMessage({
            type: 'progress',
            data: { stage: 'indicators', progress: 0.3 }
          });
          
          const indicators = calculateIndicators(candles, config);
          
          parentPort!.postMessage({
            type: 'progress',
            data: { stage: 'patterns', progress: 0.6 }
          });
          
          const patterns = recognizePatterns(candles);
          
          parentPort!.postMessage({
            type: 'progress',
            data: { stage: 'complete', progress: 1.0 }
          });
          
          parentPort!.postMessage({
            type: 'result',
            data: {
              indicators,
              patterns,
              timestamp: Date.now()
            }
          });
          break;

        case 'batch':
          const results = [];
          const { items } = message.data;
          
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const indicators = calculateIndicators(item.candles, item.config);
            const patterns = recognizePatterns(item.candles);
            
            results.push({
              market: item.market,
              indicators,
              patterns
            });
            
            parentPort!.postMessage({
              type: 'progress',
              data: { 
                current: i + 1, 
                total: items.length,
                progress: (i + 1) / items.length
              }
            });
          }
          
          parentPort!.postMessage({
            type: 'result',
            data: results
          });
          break;

        case 'stop':
          process.exit(0);
          break;
      }
    } catch (error) {
      parentPort!.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// 초기화 데이터 처리
if (workerData) {
  console.log('Worker initialized with data:', workerData);
}