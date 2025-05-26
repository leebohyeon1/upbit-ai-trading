import { CandleData } from './upbit-service';

export interface TechnicalAnalysis {
  market: string;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  sma: {
    sma20: number;
    sma50: number;
  };
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: number;
}

class AnalysisService {
  // RSI 계산
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // 단순 이동평균 계산
  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  // 지수 이동평균 계산
  calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  // MACD 계산
  calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    // Signal line (MACD의 9일 EMA)
    const macdValues = [macd]; // 실제로는 여러 MACD 값들이 필요하지만 단순화
    const signal = macd; // 단순화된 버전

    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  // 볼린저 밴드 계산
  calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    
    // 표준편차 계산
    const variance = slice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * multiplier),
      middle: sma,
      lower: sma - (stdDev * multiplier)
    };
  }

  // 종합 기술적 분석
  analyzeTechnicals(candles: CandleData[]): TechnicalAnalysis {
    if (candles.length < 20) {
      return {
        market: candles[0]?.market || '',
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 },
        sma: { sma20: 0, sma50: 0 },
        signal: 'HOLD',
        confidence: 30,
        timestamp: Date.now()
      };
    }

    const prices = candles.map(c => c.trade_price);
    const currentPrice = prices[prices.length - 1];

    // 기술적 지표 계산
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices);
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);

    // 신호 생성 로직
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;

    // 매수 신호 조건들 (조건 완화)
    const buySignals = [
      rsi < 40, // RSI 과매도 (완화)
      currentPrice < bollinger.middle, // 볼린저 밴드 중간선 아래
      sma20 > sma50, // 골든크로스
      macd.histogram > 0, // MACD 히스토그램 양수
      rsi < 50 && macd.macd > macd.signal // RSI 중립 이하 + MACD 상승
    ];

    // 매도 신호 조건들 (조건 완화)
    const sellSignals = [
      rsi > 60, // RSI 과매수 (완화)
      currentPrice > bollinger.middle, // 볼린저 밴드 중간선 위
      sma20 < sma50, // 데드크로스
      macd.histogram < 0, // MACD 히스토그램 음수
      rsi > 50 && macd.macd < macd.signal // RSI 중립 이상 + MACD 하락
    ];

    const buyCount = buySignals.filter(Boolean).length;
    const sellCount = sellSignals.filter(Boolean).length;

    // 더 민감한 신호 결정
    if (buyCount >= 2 || (buyCount > sellCount && buyCount >= 1)) {
      signal = 'BUY';
      confidence = Math.min(50 + (buyCount * 15), 95); // 50-95% 범위
    } else if (sellCount >= 2 || (sellCount > buyCount && sellCount >= 1)) {
      signal = 'SELL';
      confidence = Math.min(50 + (sellCount * 15), 95); // 50-95% 범위
    } else {
      signal = 'HOLD';
      confidence = Math.max(30, 50 - Math.abs(buyCount - sellCount) * 10); // 30-50% 범위
    }

    return {
      market: candles[0].market,
      rsi,
      macd,
      bollinger,
      sma: { sma20, sma50 },
      signal,
      confidence,
      timestamp: Date.now()
    };
  }

  // 간단한 AI 기반 분석 (Claude API 없이)
  generateAIAnalysis(technical: TechnicalAnalysis): string {
    const { market, rsi, signal, confidence } = technical;
    
    let analysis = `${market} 분석 결과:\n`;
    
    // RSI 기반 분석
    if (rsi < 30) {
      analysis += `• RSI ${rsi.toFixed(2)} - 과매도 구간, 반등 가능성\n`;
    } else if (rsi > 70) {
      analysis += `• RSI ${rsi.toFixed(2)} - 과매수 구간, 조정 가능성\n`;
    } else {
      analysis += `• RSI ${rsi.toFixed(2)} - 중립 구간\n`;
    }

    // 신호 기반 분석
    switch (signal) {
      case 'BUY':
        analysis += `• 매수 신호 감지 (신뢰도: ${confidence.toFixed(1)}%)\n`;
        analysis += `• 기술적 지표들이 상승세를 시사합니다.\n`;
        break;
      case 'SELL':
        analysis += `• 매도 신호 감지 (신뢰도: ${confidence.toFixed(1)}%)\n`;
        analysis += `• 기술적 지표들이 하락세를 시사합니다.\n`;
        break;
      default:
        analysis += `• 관망 신호 (신뢰도: ${confidence.toFixed(1)}%)\n`;
        analysis += `• 명확한 방향성이 없어 관망을 권장합니다.\n`;
    }

    return analysis;
  }
}

export default new AnalysisService();