import { CandleData } from './upbit-service';
import upbitService from './upbit-service';
import newsService, { NewsAnalysis } from './news-service';

export interface TechnicalAnalysis {
  market: string;
  rsi: number;
  stochasticRSI?: {
    k: number;
    d: number;
  };
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    position: number; // -1 (below lower) to 1 (above upper)
  };
  sma: {
    sma20: number;
    sma50: number;
  };
  atr?: number; // Average True Range
  obv?: {
    value: number;
    signal: number; // OBV의 이동평균
    trend: 'UP' | 'DOWN' | 'NEUTRAL';
  };
  adx?: {
    adx: number;
    plusDI: number;
    minusDI: number;
    trend: 'STRONG' | 'WEAK' | 'NONE';
  };
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: number;
  volumeRatio: number; // volume.ratio alias for compatibility
  obvTrend: number; // -1 to 1, simplified OBV trend
  whaleActivity?: boolean; // whether whale activity detected
  // 추가 데이터
  volume: {
    current: number;
    average: number;
    ratio: number; // current / average
  };
  priceChange: {
    change24h: number;
    changeRate24h: number;
    high24h: number;
    low24h: number;
  };
  orderbook?: {
    bidAskRatio: number; // 매수세력 / 매도세력
    totalBidSize: number;
    totalAskSize: number;
    spread: number; // 스프레드 (%)
    imbalance?: number; // 호가 불균형 지수 (-100 ~ 100)
  };
  trades?: {
    buyVolume: number;
    sellVolume: number;
    buyRatio: number; // 매수 비율
    whaleDetected?: boolean; // 고래 감지
    whaleVolume?: number; // 고래 거래량
  };
  kimchiPremium?: number; // 김치 프리미엄 (%)
  fearGreedIndex?: number; // 공포/탐욕 지수 (0-100)
  // 분석 점수
  scores?: {
    buyScore: number; // 매수 신호 강도 (0-100)
    sellScore: number; // 매도 신호 강도 (0-100)
    activeSignals: string[]; // 활성화된 주요 신호들
  };
  // 뉴스 분석
  newsAnalysis?: NewsAnalysis;
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

  // MACD 계산 (개선된 버전)
  calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    
    // MACD line 계산을 위한 전체 기간의 EMA 값들
    const ema12Values: number[] = [];
    const ema26Values: number[] = [];
    
    let ema12 = prices[0];
    let ema26 = prices[0];
    
    const multiplier12 = 2 / (12 + 1);
    const multiplier26 = 2 / (26 + 1);
    
    for (let i = 0; i < prices.length; i++) {
      ema12 = (prices[i] * multiplier12) + (ema12 * (1 - multiplier12));
      ema26 = (prices[i] * multiplier26) + (ema26 * (1 - multiplier26));
      ema12Values.push(ema12);
      ema26Values.push(ema26);
    }
    
    // MACD line 계산
    const macdValues: number[] = [];
    for (let i = 0; i < ema12Values.length; i++) {
      macdValues.push(ema12Values[i] - ema26Values[i]);
    }
    
    // Signal line (MACD의 9일 EMA)
    const signalValues = this.calculateEMAArray(macdValues, 9);
    
    const lastMACD = macdValues[macdValues.length - 1];
    const lastSignal = signalValues[signalValues.length - 1];
    const histogram = lastMACD - lastSignal;
    
    return { macd: lastMACD, signal: lastSignal, histogram };
  }
  
  // 배열에 대한 EMA 계산
  calculateEMAArray(values: number[], period: number): number[] {
    if (values.length === 0) return [];
    
    const multiplier = 2 / (period + 1);
    const emaValues: number[] = [values[0]];
    
    for (let i = 1; i < values.length; i++) {
      const ema = (values[i] * multiplier) + (emaValues[i - 1] * (1 - multiplier));
      emaValues.push(ema);
    }
    
    return emaValues;
  }
  
  // Stochastic RSI 계산
  calculateStochasticRSI(prices: number[], rsiPeriod: number = 14, stochPeriod: number = 14, smoothK: number = 3, smoothD: number = 3): { k: number; d: number } {
    if (prices.length < rsiPeriod + stochPeriod) return { k: 50, d: 50 };
    
    // RSI 값들의 배열 계산
    const rsiValues: number[] = [];
    for (let i = rsiPeriod; i < prices.length; i++) {
      const periodPrices = prices.slice(i - rsiPeriod, i + 1);
      const rsi = this.calculateRSI(periodPrices, rsiPeriod);
      rsiValues.push(rsi);
    }
    
    if (rsiValues.length < stochPeriod) return { k: 50, d: 50 };
    
    // Stochastic 계산
    const stochValues: number[] = [];
    for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
      const periodRSI = rsiValues.slice(i - stochPeriod + 1, i + 1);
      const highestRSI = Math.max(...periodRSI);
      const lowestRSI = Math.min(...periodRSI);
      const currentRSI = periodRSI[periodRSI.length - 1];
      
      const stoch = highestRSI === lowestRSI ? 50 : ((currentRSI - lowestRSI) / (highestRSI - lowestRSI)) * 100;
      stochValues.push(stoch);
    }
    
    // %K 계산 (smoothed)
    const kValues = this.calculateSMA(stochValues, smoothK);
    const k = kValues;
    
    // %D 계산 (K의 이동평균)
    const d = this.calculateSMA([k], smoothD);
    
    return { k, d };
  }
  
  // ATR (Average True Range) 계산
  calculateATR(candles: CandleData[], period: number = 14): number {
    if (candles.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high_price;
      const low = candles[i].low_price;
      const prevClose = candles[i - 1].trade_price;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    // ATR은 True Range의 지수이동평균
    return this.calculateEMA(trueRanges, period);
  }
  
  // OBV (On Balance Volume) 계산
  calculateOBV(candles: CandleData[]): { value: number; signal: number; trend: 'UP' | 'DOWN' | 'NEUTRAL' } {
    if (candles.length < 2) return { value: 0, signal: 0, trend: 'NEUTRAL' };
    
    const obvValues: number[] = [0];
    
    for (let i = 1; i < candles.length; i++) {
      const currentClose = candles[i].trade_price;
      const prevClose = candles[i - 1].trade_price;
      const volume = candles[i].candle_acc_trade_volume;
      
      let obv = obvValues[i - 1];
      
      if (currentClose > prevClose) {
        obv += volume;
      } else if (currentClose < prevClose) {
        obv -= volume;
      }
      // 가격이 같으면 OBV 변화 없음
      
      obvValues.push(obv);
    }
    
    const currentOBV = obvValues[obvValues.length - 1];
    const obvSignal = this.calculateSMA(obvValues.slice(-20), 20); // 20일 이동평균
    
    let trend: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
    if (currentOBV > obvSignal * 1.02) trend = 'UP';
    else if (currentOBV < obvSignal * 0.98) trend = 'DOWN';
    
    return { value: currentOBV, signal: obvSignal, trend };
  }
  
  // ADX (Average Directional Index) 계산
  calculateADX(candles: CandleData[], period: number = 14): { adx: number; plusDI: number; minusDI: number; trend: 'STRONG' | 'WEAK' | 'NONE' } {
    if (candles.length < period * 2) return { adx: 0, plusDI: 0, minusDI: 0, trend: 'NONE' };
    
    const plusDM: number[] = [];
    const minusDM: number[] = [];
    const trueRanges: number[] = [];
    
    // DM과 TR 계산
    for (let i = 1; i < candles.length; i++) {
      const highDiff = candles[i].high_price - candles[i - 1].high_price;
      const lowDiff = candles[i - 1].low_price - candles[i].low_price;
      
      // +DM과 -DM 계산
      if (highDiff > lowDiff && highDiff > 0) {
        plusDM.push(highDiff);
        minusDM.push(0);
      } else if (lowDiff > highDiff && lowDiff > 0) {
        plusDM.push(0);
        minusDM.push(lowDiff);
      } else {
        plusDM.push(0);
        minusDM.push(0);
      }
      
      // True Range 계산
      const tr = Math.max(
        candles[i].high_price - candles[i].low_price,
        Math.abs(candles[i].high_price - candles[i - 1].trade_price),
        Math.abs(candles[i].low_price - candles[i - 1].trade_price)
      );
      trueRanges.push(tr);
    }
    
    // Smoothed 값들 계산
    const smoothedPlusDM = this.calculateEMA(plusDM, period);
    const smoothedMinusDM = this.calculateEMA(minusDM, period);
    const smoothedTR = this.calculateEMA(trueRanges, period);
    
    // DI 계산
    const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
    
    // DX 계산
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? Math.abs(plusDI - minusDI) / diSum * 100 : 0;
    
    // ADX는 DX의 이동평균 (간단화를 위해 현재 DX 값 사용)
    const adx = dx;
    
    // 추세 강도 판단
    let trend: 'STRONG' | 'WEAK' | 'NONE' = 'NONE';
    if (adx > 50) trend = 'STRONG';
    else if (adx > 25) trend = 'WEAK';
    
    return { adx, plusDI, minusDI, trend };
  }

  // 볼린저 밴드 계산
  calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
    upper: number;
    middle: number;
    lower: number;
    position: number;
  } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    
    // 표준편차 계산
    const variance = slice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = sma + (stdDev * multiplier);
    const lower = sma - (stdDev * multiplier);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate position (-1 to 1)
    let position = 0;
    if (currentPrice > upper) {
      position = Math.min(1, (currentPrice - upper) / (upper - sma));
    } else if (currentPrice < lower) {
      position = Math.max(-1, (currentPrice - lower) / (sma - lower));
    } else {
      position = (currentPrice - sma) / (upper - sma);
    }
    
    return {
      upper,
      middle: sma,
      lower,
      position
    };
  }

  // 종합 기술적 분석
  async analyzeTechnicals(candles: CandleData[], ticker?: any, orderbook?: any, trades?: any[], config?: any): Promise<TechnicalAnalysis> {
    if (candles.length < 20) {
      return {
        market: candles[0]?.market || '',
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0, position: 0 },
        sma: { sma20: 0, sma50: 0 },
        signal: 'HOLD',
        confidence: 30,
        timestamp: Date.now(),
        volume: { current: 0, average: 0, ratio: 0 },
        priceChange: { change24h: 0, changeRate24h: 0, high24h: 0, low24h: 0 },
        volumeRatio: 0,
        obvTrend: 0,
        whaleActivity: false
      };
    }

    const prices = candles.map(c => c.trade_price);
    const volumes = candles.map(c => c.candle_acc_trade_volume);
    const currentPrice = prices[prices.length - 1];
    const currentVolume = volumes[volumes.length - 1];

    // 기본 기술적 지표 계산 (사용자 설정 적용)
    const rsiPeriod = config?.rsiPeriod || 14;
    const bbPeriod = config?.bbPeriod || 20;
    const bbStdDev = config?.bbStdDev || 2;
    
    const rsi = this.calculateRSI(prices, rsiPeriod);
    const stochasticRSI = this.calculateStochasticRSI(prices, rsiPeriod);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices, bbPeriod, bbStdDev);
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    
    // 추가 지표 계산
    const atr = this.calculateATR(candles);
    const obv = this.calculateOBV(candles);
    const adx = this.calculateADX(candles);

    // 거래량 분석
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const volumeRatio = currentVolume / avgVolume;

    // 가격 변화 정보
    const priceChange = ticker ? {
      change24h: ticker.change_price || 0,
      changeRate24h: ticker.change_rate || 0,
      high24h: ticker.high_price || 0,
      low24h: ticker.low_price || 0
    } : {
      change24h: 0,
      changeRate24h: 0,
      high24h: Math.max(...prices.slice(-288)), // 24시간 = 288개 5분봉
      low24h: Math.min(...prices.slice(-288))
    };

    // 호가 분석 (개선된 버전)
    let orderbookData;
    if (orderbook) {
      const totalBidSize = orderbook.orderbook_units.reduce((sum: number, unit: any) => sum + unit.bid_size, 0);
      const totalAskSize = orderbook.orderbook_units.reduce((sum: number, unit: any) => sum + unit.ask_size, 0);
      const bestBid = orderbook.orderbook_units[0].bid_price;
      const bestAsk = orderbook.orderbook_units[0].ask_price;
      
      // 상위 5단계 호가 불균형 계산
      let top5BidSize = 0;
      let top5AskSize = 0;
      for (let i = 0; i < Math.min(5, orderbook.orderbook_units.length); i++) {
        top5BidSize += orderbook.orderbook_units[i].bid_size;
        top5AskSize += orderbook.orderbook_units[i].ask_size;
      }
      
      // 호가 불균형 지수 (-100 ~ 100)
      const imbalance = ((top5BidSize - top5AskSize) / (top5BidSize + top5AskSize)) * 100;
      
      orderbookData = {
        bidAskRatio: totalBidSize / (totalAskSize || 1),
        totalBidSize,
        totalAskSize,
        spread: ((bestAsk - bestBid) / bestBid) * 100,
        imbalance
      };
    }

    // 체결 내역 분석 (고래 감지 추가)
    let tradesData: {
      buyVolume: number;
      sellVolume: number;
      buyRatio: number;
      whaleDetected?: boolean;
      whaleVolume?: number;
    } | undefined;
    if (trades && trades.length > 0) {
      const buyVolume = trades.filter(t => t.ask_bid === 'BID').reduce((sum, t) => sum + t.trade_volume, 0);
      const sellVolume = trades.filter(t => t.ask_bid === 'ASK').reduce((sum, t) => sum + t.trade_volume, 0);
      
      // 평균 거래량 계산
      const avgTradeVolume = trades.reduce((sum, t) => sum + t.trade_volume, 0) / trades.length;
      
      // 고래 감지 (사용자 설정 배수 또는 기본 10배)
      const whaleMultiplier = config?.whaleMultiplier || 10;
      const whaleThreshold = avgTradeVolume * whaleMultiplier;
      const whaleTrades = trades.filter(t => t.trade_volume > whaleThreshold);
      const whaleVolume = whaleTrades.reduce((sum, t) => sum + t.trade_volume, 0);
      
      tradesData = {
        buyVolume,
        sellVolume,
        buyRatio: buyVolume / (buyVolume + sellVolume || 1),
        whaleDetected: whaleTrades.length > 0,
        whaleVolume
      };
    }

    // 신호 생성 로직 (추가 데이터 포함)
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;

    // 김치 프리미엄 계산
    let kimchiPremium = 0;
    try {
      kimchiPremium = await upbitService.getKimchiPremium(candles[0].market);
    } catch (error) {
      console.log('김프 계산 실패:', error);
    }

    // 뉴스 데이터 가져오기
    let newsAnalysis: NewsAnalysis | undefined;
    try {
      const symbol = candles[0].market.split('-')[1]; // 예: KRW-BTC -> BTC
      newsAnalysis = await newsService.getCoinNews(symbol);
      console.log(`${symbol} 뉴스 분석:`, {
        총뉴스: newsAnalysis.totalNews,
        긍정: newsAnalysis.positiveCount,
        부정: newsAnalysis.negativeCount,
        감정점수: newsAnalysis.sentimentScore
      });
    } catch (error) {
      console.log('뉴스 분석 실패:', error);
    }

    // 공포/탐욕 지수 계산
    const fearGreedIndex = upbitService.calculateFearGreedIndex(
      rsi,
      volumeRatio,
      priceChange.changeRate24h
    );

    // 각 신호에 가중치 부여 (중요도에 따라 다르게 설정)
    const buySignalsWithWeight = [
      // RSI 관련 지표
      { condition: rsi < (config?.rsiOversold || 30), weight: 3.0 }, // RSI 극도의 과매도 (매우 중요)
      { condition: rsi < ((config?.rsiOversold || 30) + 10), weight: 2.0 }, // RSI 과매도
      { condition: stochasticRSI && stochasticRSI.k < 20 && stochasticRSI.d < 20, weight: 3.0 }, // Stochastic RSI 극도의 과매도
      { condition: stochasticRSI && stochasticRSI.k < 30, weight: 2.0 }, // Stochastic RSI 과매도
      { condition: stochasticRSI && stochasticRSI.k > stochasticRSI.d && stochasticRSI.k < 50, weight: 2.5 }, // Stochastic RSI 골든크로스
      
      // 가격 및 볼린저 관련
      { condition: currentPrice < bollinger.lower, weight: 2.5 }, // 볼린저 하단 돌파
      { condition: currentPrice < bollinger.middle, weight: 1.5 }, // 볼린저 중간선 아래
      { condition: sma20 > sma50, weight: 2.0 }, // 골든크로스
      
      // MACD 및 운동량 지표
      { condition: macd.histogram > 0 && macd.macd > macd.signal, weight: 2.5 }, // MACD 상승 전환
      { condition: macd.histogram > 0 && Math.abs(macd.histogram) > Math.abs(macd.macd) * 0.1, weight: 2.0 }, // MACD 히스토그램 강세
      
      // 거래량 및 OBV
      { condition: volumeRatio > (config?.volumeThreshold || 2.0), weight: 2.0 }, // 거래량 급증 (사용자 설정)
      { condition: volumeRatio > ((config?.volumeThreshold || 2.0) * 0.75), weight: 1.0 }, // 거래량 증가
      { condition: obv && obv.trend === 'UP', weight: 2.5 }, // OBV 상승 추세
      { condition: obv && obv.value > obv.signal * 1.05, weight: 2.0 }, // OBV 시그널 돌파
      
      // 추세 강도 (ADX)
      { condition: adx && adx.trend === 'STRONG' && adx.plusDI > adx.minusDI, weight: 3.0 }, // 강한 상승 추세
      { condition: adx && adx.adx > 25 && adx.plusDI > adx.minusDI, weight: 2.0 }, // 약한 상승 추세
      
      // 변동성 (ATR)
      { condition: atr && atr > 0 && currentPrice < (currentPrice - atr), weight: 2.0 }, // 변동성 대비 하락
      
      // 호가 및 체결 분석
      { condition: orderbookData && orderbookData.bidAskRatio > 1.5, weight: 2.0 }, // 강한 매수세
      { condition: orderbookData && orderbookData.bidAskRatio > 1.2, weight: 1.0 }, // 매수세 우세
      { condition: orderbookData && orderbookData.imbalance && orderbookData.imbalance > 20, weight: 2.5 }, // 호가 매수 불균형
      { condition: tradesData && tradesData.buyRatio > 0.7, weight: 2.0 }, // 강한 매수 체결
      { condition: tradesData && tradesData.buyRatio > 0.6, weight: 1.0 }, // 매수 체결 우세
      { condition: tradesData && tradesData.whaleDetected && tradesData.buyVolume > tradesData.sellVolume, weight: 3.5 }, // 매수 고래 감지
      
      // 가격 변화 및 시장 상황
      { condition: priceChange.changeRate24h < -0.1, weight: 2.5 }, // 24시간 10% 이상 급락 (반등 기대)
      { condition: priceChange.changeRate24h < -0.05, weight: 1.5 }, // 24시간 5% 이상 하락
      { condition: kimchiPremium < 0, weight: 3.0 }, // 역프리미엄 (매우 유리)
      { condition: kimchiPremium < 2, weight: 1.5 }, // 낮은 김프
      { condition: fearGreedIndex < 20, weight: 3.0 }, // 극도의 공포 (역발상)
      { condition: fearGreedIndex < 35, weight: 2.0 }, // 공포 상태
      { condition: orderbookData && orderbookData.spread < 0.1, weight: 1.0 }, // 좁은 스프레드
      { condition: currentPrice < priceChange.low24h * 1.02, weight: 2.0 }, // 24시간 저점 근처
      
      // 뉴스 및 이벤트
      { condition: newsAnalysis && newsAnalysis.sentimentScore < -50, weight: 3.0 }, // 매우 부정적 뉴스 (역발상)
      { condition: newsAnalysis && newsAnalysis.sentimentScore < -20, weight: 2.0 }, // 부정적 뉴스
      { condition: newsAnalysis && newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore > 20, weight: 2.5 } // 긍정적 주요 이벤트
    ];

    // 매도 신호 조건들 (가중치 포함)
    const sellSignalsWithWeight = [
      // RSI 관련 지표
      { condition: rsi > (config?.rsiOverbought || 70), weight: 3.0 }, // RSI 극도의 과매수 (매우 중요)
      { condition: rsi > ((config?.rsiOverbought || 70) - 10), weight: 2.0 }, // RSI 과매수
      { condition: stochasticRSI && stochasticRSI.k > 80 && stochasticRSI.d > 80, weight: 3.0 }, // Stochastic RSI 극도의 과매수
      { condition: stochasticRSI && stochasticRSI.k > 70, weight: 2.0 }, // Stochastic RSI 과매수
      { condition: stochasticRSI && stochasticRSI.k < stochasticRSI.d && stochasticRSI.k > 50, weight: 2.5 }, // Stochastic RSI 데드크로스
      
      // 가격 및 볼린저 관련
      { condition: currentPrice > bollinger.upper, weight: 2.5 }, // 볼린저 상단 돌파
      { condition: currentPrice > bollinger.middle, weight: 1.5 }, // 볼린저 중간선 위
      { condition: sma20 < sma50, weight: 2.0 }, // 데드크로스
      
      // MACD 및 운동량 지표
      { condition: macd.histogram < 0 && macd.macd < macd.signal, weight: 2.5 }, // MACD 하락 전환
      { condition: macd.histogram < 0 && Math.abs(macd.histogram) > Math.abs(macd.macd) * 0.1, weight: 2.0 }, // MACD 히스토그램 약세
      
      // 거래량 및 OBV
      { condition: volumeRatio > 2.0 && priceChange.changeRate24h > 0, weight: 2.0 }, // 상승 중 거래량 급증 (차익실현)
      { condition: obv && obv.trend === 'DOWN', weight: 2.5 }, // OBV 하락 추세
      { condition: obv && obv.value < obv.signal * 0.95, weight: 2.0 }, // OBV 시그널 하향 돌파
      
      // 추세 강도 (ADX)
      { condition: adx && adx.trend === 'STRONG' && adx.minusDI > adx.plusDI, weight: 3.0 }, // 강한 하락 추세
      { condition: adx && adx.adx > 25 && adx.minusDI > adx.plusDI, weight: 2.0 }, // 약한 하락 추세
      
      // 변동성 (ATR)
      { condition: atr && atr > 0 && currentPrice > (currentPrice + atr), weight: 2.0 }, // 변동성 대비 상승
      
      // 호가 및 체결 분석
      { condition: orderbookData && orderbookData.bidAskRatio < 0.7, weight: 2.0 }, // 강한 매도세
      { condition: orderbookData && orderbookData.bidAskRatio < 0.8, weight: 1.0 }, // 매도세 우세
      { condition: orderbookData && orderbookData.imbalance && orderbookData.imbalance < -20, weight: 2.5 }, // 호가 매도 불균형
      { condition: tradesData && tradesData.buyRatio < 0.3, weight: 2.0 }, // 강한 매도 체결
      { condition: tradesData && tradesData.buyRatio < 0.4, weight: 1.0 }, // 매도 체결 우세
      { condition: tradesData && tradesData.whaleDetected && tradesData.sellVolume > tradesData.buyVolume, weight: 3.5 }, // 매도 고래 감지
      
      // 가격 변화 및 시장 상황
      { condition: priceChange.changeRate24h > 0.15, weight: 2.5 }, // 24시간 15% 이상 급등 (차익실현)
      { condition: priceChange.changeRate24h > 0.1, weight: 1.5 }, // 24시간 10% 이상 상승
      { condition: kimchiPremium > 5, weight: 3.0 }, // 매우 높은 김프 (위험)
      { condition: kimchiPremium > 4, weight: 2.0 }, // 높은 김프
      { condition: fearGreedIndex > 85, weight: 3.0 }, // 극도의 탐욕 (위험)
      { condition: fearGreedIndex > 75, weight: 2.0 }, // 탐욕 상태
      { condition: orderbookData && orderbookData.spread > 0.5, weight: 1.5 }, // 넓은 스프레드 (변동성)
      { condition: currentPrice > priceChange.high24h * 0.98, weight: 2.0 }, // 24시간 고점 근처
      
      // 뉴스 및 이벤트
      { condition: newsAnalysis && newsAnalysis.sentimentScore > 50, weight: 3.0 }, // 매우 긍정적 뉴스 (과열 경고)
      { condition: newsAnalysis && newsAnalysis.sentimentScore > 20, weight: 2.0 }, // 긍정적 뉴스
      { condition: newsAnalysis && newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore < -20, weight: 2.5 } // 부정적 주요 이벤트
    ];

    // 가중치 설정 가져오기
    const indicatorWeights = config?.indicatorWeights || {
      rsi: 1.0,
      macd: 1.0,
      bollinger: 1.0,
      stochastic: 0.8,
      volume: 1.0,
      atr: 0.8,
      obv: 0.7,
      adx: 0.8,
      volatility: 1.0,
      trendStrength: 1.0,
      aiAnalysis: 1.2,
      newsImpact: 1.0,
      whaleActivity: 0.8
    };

    // 지표별 가중치 적용 함수
    const applyIndicatorWeight = (score: number, indicatorType: string): number => {
      return score * (indicatorWeights[indicatorType] || 1.0);
    };

    // 가중치를 적용한 점수 계산
    let buyScore = 0;
    let sellScore = 0;

    // RSI 관련 신호들
    buyScore += buySignalsWithWeight.slice(0, 5).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.rsi;
    sellScore += sellSignalsWithWeight.slice(0, 5).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.rsi;

    // MACD 관련 신호들 (인덱스 조정 필요)
    buyScore += buySignalsWithWeight.slice(10, 12).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.macd;
    sellScore += sellSignalsWithWeight.slice(9, 11).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.macd;

    // 볼린저 밴드 관련
    buyScore += buySignalsWithWeight.slice(5, 7).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.bollinger;
    sellScore += sellSignalsWithWeight.slice(5, 7).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.bollinger;

    // 거래량 관련
    buyScore += buySignalsWithWeight.slice(12, 15).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.volume;
    sellScore += sellSignalsWithWeight.slice(11, 14).filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0) * indicatorWeights.volume;

    // 나머지 신호들 (기본 가중치)
    const remainingBuySignals = buySignalsWithWeight.slice(15);
    const remainingSellSignals = sellSignalsWithWeight.slice(14);
    
    buyScore += remainingBuySignals.filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0);
    sellScore += remainingSellSignals.filter(s => s.condition).reduce((sum, s) => sum + s.weight, 0);

    // 최대 가능 점수 (모든 조건이 true일 때)
    const maxBuyScore = buySignalsWithWeight.reduce((sum, signal) => sum + signal.weight, 0);
    const maxSellScore = sellSignalsWithWeight.reduce((sum, signal) => sum + signal.weight, 0);

    // 정규화된 점수 (0-100)
    const normalizedBuyScore = (buyScore / maxBuyScore) * 100;
    const normalizedSellScore = (sellScore / maxSellScore) * 100;

    // 더 정교한 신호 결정
    if (normalizedBuyScore > 25 && normalizedBuyScore > normalizedSellScore * 1.2) {
      signal = 'BUY';
      confidence = Math.min(50 + normalizedBuyScore * 0.45, 95); // 50-95% 범위
    } else if (normalizedSellScore > 25 && normalizedSellScore > normalizedBuyScore * 1.2) {
      signal = 'SELL';
      confidence = Math.min(50 + normalizedSellScore * 0.45, 95); // 50-95% 범위
    } else {
      signal = 'HOLD';
      // HOLD일 때도 어느 쪽에 더 가까운지에 따라 신뢰도 조정
      const scoreDiff = Math.abs(normalizedBuyScore - normalizedSellScore);
      confidence = Math.max(30, 50 - scoreDiff * 0.5); // 30-50% 범위
    }

    // 특수 상황 보너스 (추가 신뢰도)
    if (signal === 'BUY') {
      // 극도의 공포 + 역프리미엄 + RSI 과매도 = 황금 매수 기회
      if (fearGreedIndex < 20 && kimchiPremium < 0 && rsi < 30) {
        confidence = Math.min(confidence + 10, 95);
      }
      // 볼린저 하단 돌파 + 거래량 급증 + 매수세 우세
      if (currentPrice < bollinger.lower && volumeRatio > 2 && orderbookData && orderbookData.bidAskRatio > 1.5) {
        confidence = Math.min(confidence + 5, 95);
      }
      // Stochastic RSI + OBV + ADX 트리플 매수 신호
      if (stochasticRSI && stochasticRSI.k < 20 && obv && obv.trend === 'UP' && adx && adx.plusDI > adx.minusDI) {
        confidence = Math.min(confidence + 8, 95);
      }
      // 고래 매수 감지 + 강한 트렌드
      if (tradesData && tradesData.whaleDetected && tradesData.buyVolume > tradesData.sellVolume && adx && adx.trend === 'STRONG') {
        confidence = Math.min(confidence + 12, 95);
      }
    } else if (signal === 'SELL') {
      // 극도의 탐욕 + 높은 김프 + RSI 과매수 = 강력한 매도 신호
      if (fearGreedIndex > 85 && kimchiPremium > 5 && rsi > 80) {
        confidence = Math.min(confidence + 10, 95);
      }
      // 볼린저 상단 돌파 + 거래량 급증 + 매도세 우세
      if (currentPrice > bollinger.upper && volumeRatio > 2 && orderbookData && orderbookData.bidAskRatio < 0.7) {
        confidence = Math.min(confidence + 5, 95);
      }
      // Stochastic RSI + OBV + ADX 트리플 매도 신호
      if (stochasticRSI && stochasticRSI.k > 80 && obv && obv.trend === 'DOWN' && adx && adx.minusDI > adx.plusDI) {
        confidence = Math.min(confidence + 8, 95);
      }
      // 고래 매도 감지 + 강한 트렌드
      if (tradesData && tradesData.whaleDetected && tradesData.sellVolume > tradesData.buyVolume && adx && adx.trend === 'STRONG') {
        confidence = Math.min(confidence + 12, 95);
      }
    }

    // 활성화된 주요 신호들 수집
    const activeSignals: string[] = [];
    
    if (signal === 'BUY') {
      buySignalsWithWeight.forEach(sig => {
        if (sig.condition && sig.weight >= 2.0) {
          if (sig.condition === (rsi < 30)) activeSignals.push('RSI 극도의 과매도');
          else if (sig.condition === (stochasticRSI && stochasticRSI.k < 20 && stochasticRSI.d < 20)) activeSignals.push('Stochastic RSI 과매도');
          else if (sig.condition === (currentPrice < bollinger.lower)) activeSignals.push('볼린저 하단 돌파');
          else if (sig.condition === (kimchiPremium < 0)) activeSignals.push('역프리미엄');
          else if (sig.condition === (fearGreedIndex < 20)) activeSignals.push('극도의 공포');
          else if (sig.condition === (volumeRatio > 2.0)) activeSignals.push('거래량 급증');
          else if (sig.condition === (priceChange.changeRate24h < -0.1)) activeSignals.push('24시간 10% 이상 하락');
          else if (sig.condition === (obv && obv.trend === 'UP')) activeSignals.push('OBV 상승 추세');
          else if (sig.condition === (adx && adx.trend === 'STRONG' && adx.plusDI > adx.minusDI)) activeSignals.push('ADX 강한 상승 추세');
          else if (sig.condition === (tradesData && tradesData.whaleDetected && tradesData.buyVolume > tradesData.sellVolume)) activeSignals.push('매수 고래 감지');
        }
      });
    } else if (signal === 'SELL') {
      sellSignalsWithWeight.forEach(sig => {
        if (sig.condition && sig.weight >= 2.0) {
          if (sig.condition === (rsi > 80)) activeSignals.push('RSI 극도의 과매수');
          else if (sig.condition === (stochasticRSI && stochasticRSI.k > 80 && stochasticRSI.d > 80)) activeSignals.push('Stochastic RSI 과매수');
          else if (sig.condition === (currentPrice > bollinger.upper)) activeSignals.push('볼린저 상단 돌파');
          else if (sig.condition === (kimchiPremium > 5)) activeSignals.push('김프 과열');
          else if (sig.condition === (fearGreedIndex > 85)) activeSignals.push('극도의 탐욕');
          else if (sig.condition === (volumeRatio > 2.0 && priceChange.changeRate24h > 0)) activeSignals.push('상승 중 거래량 급증');
          else if (sig.condition === (priceChange.changeRate24h > 0.15)) activeSignals.push('24시간 15% 이상 급등');
          else if (sig.condition === (obv && obv.trend === 'DOWN')) activeSignals.push('OBV 하락 추세');
          else if (sig.condition === (adx && adx.trend === 'STRONG' && adx.minusDI > adx.plusDI)) activeSignals.push('ADX 강한 하락 추세');
          else if (sig.condition === (tradesData && tradesData.whaleDetected && tradesData.sellVolume > tradesData.buyVolume)) activeSignals.push('매도 고래 감지');
        }
      });
    }

    return {
      market: candles[0].market,
      rsi,
      stochasticRSI,
      macd,
      bollinger,
      sma: { sma20, sma50 },
      atr,
      obv,
      adx,
      signal,
      confidence,
      timestamp: Date.now(),
      volume: {
        current: currentVolume,
        average: avgVolume,
        ratio: volumeRatio
      },
      priceChange,
      orderbook: orderbookData,
      trades: tradesData,
      kimchiPremium,
      fearGreedIndex,
      scores: {
        buyScore: normalizedBuyScore,
        sellScore: normalizedSellScore,
        activeSignals
      },
      newsAnalysis,
      // Additional properties for compatibility
      volumeRatio,
      obvTrend: obv ? (obv.trend === 'UP' ? 1 : obv.trend === 'DOWN' ? -1 : 0) : 0,
      whaleActivity: tradesData?.whaleDetected || false
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