import UpbitService from './upbit-service';

export interface TimeframeConfig {
  interval: string;
  period: number;
  weight: number;
  enabled: boolean;
}

export interface TimeframeData {
  interval: string;
  candles: any[];
  indicators: {
    rsi: number;
    macd: { signal: string; macd: number; histogram: number };
    bb: { upper: number; middle: number; lower: number };
    sma: { sma20: number; sma50: number };
    ema: { ema12: number; ema26: number };
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    momentum: number;
    volatility: number;
  };
  signals: {
    buy: number;
    sell: number;
    confidence: number;
  };
}

export interface MultiTimeframeAnalysis {
  symbol: string;
  timestamp: number;
  timeframes: TimeframeData[];
  overallSignal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedAction: string;
}

export class MultiTimeframeService {
  private upbitService: typeof UpbitService;
  private lastRequestTime: number = 0;
  private requestDelay: number = 1000; // 1초 딜레이
  private defaultTimeframes: TimeframeConfig[] = [
    { interval: '1m', period: 100, weight: 0.1, enabled: true },
    { interval: '5m', period: 100, weight: 0.15, enabled: true },
    { interval: '15m', period: 100, weight: 0.2, enabled: true },
    { interval: '1h', period: 100, weight: 0.25, enabled: true },
    { interval: '4h', period: 100, weight: 0.2, enabled: true },
    { interval: '1d', period: 30, weight: 0.1, enabled: true }
  ];

  constructor() {
    this.upbitService = UpbitService;
  }

  /**
   * Rate limiting을 위한 대기
   */
  private async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * 멀티 타임프레임 분석 실행
   */
  async analyzeMultiTimeframe(symbol: string, timeframes?: TimeframeConfig[]): Promise<MultiTimeframeAnalysis> {
    const configs = timeframes || this.defaultTimeframes.filter(tf => tf.enabled);
    const timeframeData: TimeframeData[] = [];
    
    try {
      // 각 타임프레임별 데이터 수집 및 분석
      for (const config of configs) {
        const data = await this.analyzeTimeframe(symbol, config);
        if (data) {
          timeframeData.push(data);
        }
      }

      // 전체 신호 통합
      const overallAnalysis = this.combineTimeframeSignals(timeframeData, configs);
      
      return {
        symbol,
        timestamp: Date.now(),
        timeframes: timeframeData,
        ...overallAnalysis
      };
    } catch (error) {
      console.error('Multi-timeframe analysis failed:', error);
      throw new Error(`멀티 타임프레임 분석 실패: ${error}`);
    }
  }

  /**
   * 개별 타임프레임 분석
   */
  private async analyzeTimeframe(symbol: string, config: TimeframeConfig): Promise<TimeframeData | null> {
    try {
      // Rate limiting 적용
      await this.waitForRateLimit();
      
      const candles = await this.upbitService.getCandlesByTimeframe(symbol, config.interval, config.period);
      
      if (!candles || candles.length === 0) {
        console.warn(`No candles data for ${symbol} ${config.interval}`);
        return null;
      }

      const indicators = this.calculateIndicators(candles);
      const signals = this.generateTimeframeSignals(indicators, candles);

      return {
        interval: config.interval,
        candles: candles.slice(-20), // 최근 20개만 저장
        indicators,
        signals
      };
    } catch (error) {
      console.error(`Failed to analyze timeframe ${config.interval}:`, error);
      return null;
    }
  }

  /**
   * 기술적 지표 계산
   */
  private calculateIndicators(candles: any[]): TimeframeData['indicators'] {
    if (!candles || candles.length < 50) {
      throw new Error('충분한 캔들 데이터가 없습니다.');
    }

    const closes = candles.map(c => parseFloat(c.trade_price));
    const highs = candles.map(c => parseFloat(c.high_price));
    const lows = candles.map(c => parseFloat(c.low_price));
    const volumes = candles.map(c => parseFloat(c.candle_acc_trade_volume));

    // RSI 계산
    const rsi = this.calculateRSI(closes, 14);

    // MACD 계산
    const macd = this.calculateMACD(closes);

    // Bollinger Bands 계산
    const bb = this.calculateBollingerBands(closes, 20, 2);

    // 이동평균선 계산
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);

    // 추세 판단
    const trend = this.determineTrend(closes, sma20, sma50);

    // 모멘텀 계산
    const momentum = this.calculateMomentum(closes, 10);

    // 변동성 계산 (ATR 기반)
    const volatility = this.calculateATR(highs, lows, closes, 14);

    return {
      rsi,
      macd,
      bb,
      sma: { sma20, sma50 },
      ema: { ema12, ema26 },
      trend,
      momentum,
      volatility
    };
  }

  /**
   * 타임프레임별 신호 생성
   */
  private generateTimeframeSignals(indicators: TimeframeData['indicators'], candles: any[]): TimeframeData['signals'] {
    let buySignal = 0;
    let sellSignal = 0;
    const signals: string[] = [];

    // RSI 신호
    if (indicators.rsi < 30) {
      buySignal += 0.3;
      signals.push('RSI 과매도');
    } else if (indicators.rsi > 70) {
      sellSignal += 0.3;
      signals.push('RSI 과매수');
    }

    // MACD 신호
    if (indicators.macd.macd > indicators.macd.histogram && indicators.macd.histogram > 0) {
      buySignal += 0.25;
      signals.push('MACD 상승');
    } else if (indicators.macd.macd < indicators.macd.histogram && indicators.macd.histogram < 0) {
      sellSignal += 0.25;
      signals.push('MACD 하락');
    }

    // 볼린저 밴드 신호
    const currentPrice = parseFloat(candles[candles.length - 1].trade_price);
    if (currentPrice < indicators.bb.lower) {
      buySignal += 0.2;
      signals.push('볼린저 하단 터치');
    } else if (currentPrice > indicators.bb.upper) {
      sellSignal += 0.2;
      signals.push('볼린저 상단 터치');
    }

    // 이동평균선 신호
    if (indicators.ema.ema12 > indicators.ema.ema26 && indicators.trend === 'BULLISH') {
      buySignal += 0.15;
      signals.push('EMA 골든크로스');
    } else if (indicators.ema.ema12 < indicators.ema.ema26 && indicators.trend === 'BEARISH') {
      sellSignal += 0.15;
      signals.push('EMA 데드크로스');
    }

    // 모멘텀 신호
    if (indicators.momentum > 0.05) {
      buySignal += 0.1;
      signals.push('상승 모멘텀');
    } else if (indicators.momentum < -0.05) {
      sellSignal += 0.1;
      signals.push('하락 모멘텀');
    }

    const netSignal = buySignal - sellSignal;
    const confidence = Math.min(Math.abs(netSignal), 1.0);

    return {
      buy: buySignal,
      sell: sellSignal,
      confidence
    };
  }

  /**
   * 타임프레임 신호 통합
   */
  private combineTimeframeSignals(
    timeframeData: TimeframeData[], 
    configs: TimeframeConfig[]
  ): Omit<MultiTimeframeAnalysis, 'symbol' | 'timestamp' | 'timeframes'> {
    let weightedBuyScore = 0;
    let weightedSellScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];

    // 가중 평균 계산
    for (const data of timeframeData) {
      const config = configs.find(c => c.interval === data.interval);
      if (!config) continue;

      const weight = config.weight;
      weightedBuyScore += data.signals.buy * weight;
      weightedSellScore += data.signals.sell * weight;
      totalWeight += weight;

      // 강한 신호가 있는 타임프레임 기록
      if (data.signals.confidence > 0.6) {
        const signal = data.signals.buy > data.signals.sell ? '매수' : '매도';
        reasons.push(`${data.interval} ${signal} 신호 (신뢰도: ${(data.signals.confidence * 100).toFixed(1)}%)`);
      }
    }

    if (totalWeight === 0) {
      return {
        overallSignal: 'HOLD',
        confidence: 0,
        reasons: ['분석 데이터 부족'],
        riskLevel: 'HIGH',
        recommendedAction: '추가 데이터 확보 후 재분석 필요'
      };
    }

    const avgBuyScore = weightedBuyScore / totalWeight;
    const avgSellScore = weightedSellScore / totalWeight;
    const netScore = avgBuyScore - avgSellScore;
    const confidence = Math.min(Math.abs(netScore), 1.0);

    // 신호 결정
    let overallSignal: 'BUY' | 'SELL' | 'HOLD';
    if (netScore > 0.3 && confidence > 0.5) {
      overallSignal = 'BUY';
    } else if (netScore < -0.3 && confidence > 0.5) {
      overallSignal = 'SELL';
    } else {
      overallSignal = 'HOLD';
    }

    // 리스크 레벨 계산
    const riskLevel = this.calculateRiskLevel(timeframeData, confidence);
    
    // 추천 행동
    const recommendedAction = this.generateRecommendation(overallSignal, confidence, riskLevel);

    return {
      overallSignal,
      confidence,
      reasons: reasons.length > 0 ? reasons : ['신호 강도 부족'],
      riskLevel,
      recommendedAction
    };
  }

  /**
   * 리스크 레벨 계산
   */
  private calculateRiskLevel(timeframeData: TimeframeData[], confidence: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    // 변동성 평균 계산
    const avgVolatility = timeframeData.reduce((sum, data) => sum + data.indicators.volatility, 0) / timeframeData.length;
    
    // 타임프레임 간 신호 일치도 계산
    const signalConsistency = this.calculateSignalConsistency(timeframeData);
    
    if (confidence > 0.7 && signalConsistency > 0.7 && avgVolatility < 0.05) {
      return 'LOW';
    } else if (confidence > 0.5 && signalConsistency > 0.5 && avgVolatility < 0.1) {
      return 'MEDIUM';
    } else {
      return 'HIGH';
    }
  }

  /**
   * 신호 일치도 계산
   */
  private calculateSignalConsistency(timeframeData: TimeframeData[]): number {
    if (timeframeData.length < 2) return 0;

    let agreements = 0;
    const totalPairs = timeframeData.length * (timeframeData.length - 1) / 2;

    for (let i = 0; i < timeframeData.length; i++) {
      for (let j = i + 1; j < timeframeData.length; j++) {
        const signal1 = timeframeData[i].signals.buy > timeframeData[i].signals.sell ? 'BUY' : 'SELL';
        const signal2 = timeframeData[j].signals.buy > timeframeData[j].signals.sell ? 'BUY' : 'SELL';
        
        if (signal1 === signal2) {
          agreements++;
        }
      }
    }

    return agreements / totalPairs;
  }

  /**
   * 추천 행동 생성
   */
  private generateRecommendation(signal: 'BUY' | 'SELL' | 'HOLD', confidence: number, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    if (signal === 'HOLD') {
      return '관망 권장 - 더 명확한 신호를 기다리세요';
    }

    const action = signal === 'BUY' ? '매수' : '매도';
    const confidenceText = confidence > 0.7 ? '강한' : confidence > 0.5 ? '보통' : '약한';
    
    let recommendation = `${confidenceText} ${action} 신호`;
    
    if (riskLevel === 'HIGH') {
      recommendation += ' - 높은 리스크, 신중한 진입 필요';
    } else if (riskLevel === 'MEDIUM') {
      recommendation += ' - 적정 리스크, 분할 진입 고려';
    } else {
      recommendation += ' - 낮은 리스크, 적극적 진입 가능';
    }

    return recommendation;
  }

  // ===== 기술적 지표 계산 메서드들 =====

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { signal: string; macd: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    
    // 단순화된 시그널 라인 (실제로는 MACD의 EMA)
    const signalLine = macdLine * 0.9;
    const histogram = macdLine - signalLine;
    
    const signal = histogram > 0 ? 'BUY' : 'SELL';
    
    return {
      signal,
      macd: macdLine,
      histogram
    };
  }

  private calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    const variance = this.calculateVariance(prices.slice(-period), sma);
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * multiplier),
      middle: sma,
      lower: sma - (stdDev * multiplier)
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateVariance(values: number[], mean: number): number {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private determineTrend(prices: number[], sma20: number, sma50: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const currentPrice = prices[prices.length - 1];
    
    if (currentPrice > sma20 && sma20 > sma50) {
      return 'BULLISH';
    } else if (currentPrice < sma20 && sma20 < sma50) {
      return 'BEARISH';
    } else {
      return 'NEUTRAL';
    }
  }

  private calculateMomentum(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - period - 1];
    
    return (currentPrice - pastPrice) / pastPrice;
  }

  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < Math.min(highs.length, period + 1); i++) {
      const tr1 = highs[highs.length - i] - lows[lows.length - i];
      const tr2 = Math.abs(highs[highs.length - i] - closes[closes.length - i - 1]);
      const tr3 = Math.abs(lows[lows.length - i] - closes[closes.length - i - 1]);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }

  /**
   * 타임프레임 설정 업데이트
   */
  updateTimeframeConfig(config: TimeframeConfig[]): void {
    this.defaultTimeframes = config;
  }

  /**
   * 현재 타임프레임 설정 조회
   */
  getTimeframeConfig(): TimeframeConfig[] {
    return this.defaultTimeframes;
  }
}

export default new MultiTimeframeService();