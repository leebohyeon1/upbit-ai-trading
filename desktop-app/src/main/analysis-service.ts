import { CandleData } from './upbit-service';
import upbitService from './upbit-service';
import newsService, { NewsAnalysis } from './news-service';

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
  };
  trades?: {
    buyVolume: number;
    sellVolume: number;
    buyRatio: number; // 매수 비율
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
  async analyzeTechnicals(candles: CandleData[], ticker?: any, orderbook?: any, trades?: any[]): Promise<TechnicalAnalysis> {
    if (candles.length < 20) {
      return {
        market: candles[0]?.market || '',
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 },
        sma: { sma20: 0, sma50: 0 },
        signal: 'HOLD',
        confidence: 30,
        timestamp: Date.now(),
        volume: { current: 0, average: 0, ratio: 0 },
        priceChange: { change24h: 0, changeRate24h: 0, high24h: 0, low24h: 0 }
      };
    }

    const prices = candles.map(c => c.trade_price);
    const volumes = candles.map(c => c.candle_acc_trade_volume);
    const currentPrice = prices[prices.length - 1];
    const currentVolume = volumes[volumes.length - 1];

    // 기술적 지표 계산
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices);
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);

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

    // 호가 분석
    let orderbookData;
    if (orderbook) {
      const totalBidSize = orderbook.orderbook_units.reduce((sum: number, unit: any) => sum + unit.bid_size, 0);
      const totalAskSize = orderbook.orderbook_units.reduce((sum: number, unit: any) => sum + unit.ask_size, 0);
      const bestBid = orderbook.orderbook_units[0].bid_price;
      const bestAsk = orderbook.orderbook_units[0].ask_price;
      
      orderbookData = {
        bidAskRatio: totalBidSize / (totalAskSize || 1),
        totalBidSize,
        totalAskSize,
        spread: ((bestAsk - bestBid) / bestBid) * 100
      };
    }

    // 체결 내역 분석
    let tradesData;
    if (trades && trades.length > 0) {
      const buyVolume = trades.filter(t => t.ask_bid === 'BID').reduce((sum, t) => sum + t.trade_volume, 0);
      const sellVolume = trades.filter(t => t.ask_bid === 'ASK').reduce((sum, t) => sum + t.trade_volume, 0);
      
      tradesData = {
        buyVolume,
        sellVolume,
        buyRatio: buyVolume / (buyVolume + sellVolume || 1)
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
      { condition: rsi < 30, weight: 3.0 }, // RSI 극도의 과매도 (매우 중요)
      { condition: rsi < 40, weight: 2.0 }, // RSI 과매도
      { condition: currentPrice < bollinger.lower, weight: 2.5 }, // 볼린저 하단 돌파
      { condition: currentPrice < bollinger.middle, weight: 1.5 }, // 볼린저 중간선 아래
      { condition: sma20 > sma50, weight: 2.0 }, // 골든크로스
      { condition: macd.histogram > 0 && macd.macd > macd.signal, weight: 2.5 }, // MACD 상승 전환
      { condition: volumeRatio > 2.0, weight: 2.0 }, // 거래량 2배 이상 급증
      { condition: volumeRatio > 1.5, weight: 1.0 }, // 거래량 급증
      { condition: orderbookData && orderbookData.bidAskRatio > 1.5, weight: 2.0 }, // 강한 매수세
      { condition: orderbookData && orderbookData.bidAskRatio > 1.2, weight: 1.0 }, // 매수세 우세
      { condition: tradesData && tradesData.buyRatio > 0.7, weight: 2.0 }, // 강한 매수 체결
      { condition: tradesData && tradesData.buyRatio > 0.6, weight: 1.0 }, // 매수 체결 우세
      { condition: priceChange.changeRate24h < -0.1, weight: 2.5 }, // 24시간 10% 이상 급락 (반등 기대)
      { condition: priceChange.changeRate24h < -0.05, weight: 1.5 }, // 24시간 5% 이상 하락
      { condition: kimchiPremium < 0, weight: 3.0 }, // 역프리미엄 (매우 유리)
      { condition: kimchiPremium < 2, weight: 1.5 }, // 낮은 김프
      { condition: fearGreedIndex < 20, weight: 3.0 }, // 극도의 공포 (역발상)
      { condition: fearGreedIndex < 35, weight: 2.0 }, // 공포 상태
      { condition: orderbookData && orderbookData.spread < 0.1, weight: 1.0 }, // 좁은 스프레드
      { condition: currentPrice < priceChange.low24h * 1.02, weight: 2.0 }, // 24시간 저점 근처
      { condition: newsAnalysis && newsAnalysis.sentimentScore < -50, weight: 3.0 }, // 매우 부정적 뉴스 (역발상)
      { condition: newsAnalysis && newsAnalysis.sentimentScore < -20, weight: 2.0 }, // 부정적 뉴스
      { condition: newsAnalysis && newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore > 20, weight: 2.5 } // 긍정적 주요 이벤트
    ];

    // 매도 신호 조건들 (가중치 포함)
    const sellSignalsWithWeight = [
      { condition: rsi > 80, weight: 3.0 }, // RSI 극도의 과매수 (매우 중요)
      { condition: rsi > 70, weight: 2.0 }, // RSI 과매수
      { condition: currentPrice > bollinger.upper, weight: 2.5 }, // 볼린저 상단 돌파
      { condition: currentPrice > bollinger.middle, weight: 1.5 }, // 볼린저 중간선 위
      { condition: sma20 < sma50, weight: 2.0 }, // 데드크로스
      { condition: macd.histogram < 0 && macd.macd < macd.signal, weight: 2.5 }, // MACD 하락 전환
      { condition: volumeRatio > 2.0 && priceChange.changeRate24h > 0, weight: 2.0 }, // 상승 중 거래량 급증 (차익실현)
      { condition: orderbookData && orderbookData.bidAskRatio < 0.7, weight: 2.0 }, // 강한 매도세
      { condition: orderbookData && orderbookData.bidAskRatio < 0.8, weight: 1.0 }, // 매도세 우세
      { condition: tradesData && tradesData.buyRatio < 0.3, weight: 2.0 }, // 강한 매도 체결
      { condition: tradesData && tradesData.buyRatio < 0.4, weight: 1.0 }, // 매도 체결 우세
      { condition: priceChange.changeRate24h > 0.15, weight: 2.5 }, // 24시간 15% 이상 급등 (차익실현)
      { condition: priceChange.changeRate24h > 0.1, weight: 1.5 }, // 24시간 10% 이상 상승
      { condition: kimchiPremium > 5, weight: 3.0 }, // 매우 높은 김프 (위험)
      { condition: kimchiPremium > 4, weight: 2.0 }, // 높은 김프
      { condition: fearGreedIndex > 85, weight: 3.0 }, // 극도의 탐욕 (위험)
      { condition: fearGreedIndex > 75, weight: 2.0 }, // 탐욕 상태
      { condition: orderbookData && orderbookData.spread > 0.5, weight: 1.5 }, // 넓은 스프레드 (변동성)
      { condition: currentPrice > priceChange.high24h * 0.98, weight: 2.0 }, // 24시간 고점 근처
      { condition: newsAnalysis && newsAnalysis.sentimentScore > 50, weight: 3.0 }, // 매우 긍정적 뉴스 (과열 경고)
      { condition: newsAnalysis && newsAnalysis.sentimentScore > 20, weight: 2.0 }, // 긍정적 뉴스
      { condition: newsAnalysis && newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore < -20, weight: 2.5 } // 부정적 주요 이벤트
    ];

    // 가중치를 적용한 점수 계산
    const buyScore = buySignalsWithWeight
      .filter(signal => signal.condition)
      .reduce((sum, signal) => sum + signal.weight, 0);
    
    const sellScore = sellSignalsWithWeight
      .filter(signal => signal.condition)
      .reduce((sum, signal) => sum + signal.weight, 0);

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
    } else if (signal === 'SELL') {
      // 극도의 탐욕 + 높은 김프 + RSI 과매수 = 강력한 매도 신호
      if (fearGreedIndex > 85 && kimchiPremium > 5 && rsi > 80) {
        confidence = Math.min(confidence + 10, 95);
      }
      // 볼린저 상단 돌파 + 거래량 급증 + 매도세 우세
      if (currentPrice > bollinger.upper && volumeRatio > 2 && orderbookData && orderbookData.bidAskRatio < 0.7) {
        confidence = Math.min(confidence + 5, 95);
      }
    }

    // 활성화된 주요 신호들 수집
    const activeSignals: string[] = [];
    
    if (signal === 'BUY') {
      buySignalsWithWeight.forEach(sig => {
        if (sig.condition && sig.weight >= 2.0) {
          if (sig.condition === (rsi < 30)) activeSignals.push('RSI 극도의 과매도');
          else if (sig.condition === (currentPrice < bollinger.lower)) activeSignals.push('볼린저 하단 돌파');
          else if (sig.condition === (kimchiPremium < 0)) activeSignals.push('역프리미엄');
          else if (sig.condition === (fearGreedIndex < 20)) activeSignals.push('극도의 공포');
          else if (sig.condition === (volumeRatio > 2.0)) activeSignals.push('거래량 급증');
          else if (sig.condition === (priceChange.changeRate24h < -0.1)) activeSignals.push('24시간 10% 이상 하락');
        }
      });
    } else if (signal === 'SELL') {
      sellSignalsWithWeight.forEach(sig => {
        if (sig.condition && sig.weight >= 2.0) {
          if (sig.condition === (rsi > 80)) activeSignals.push('RSI 극도의 과매수');
          else if (sig.condition === (currentPrice > bollinger.upper)) activeSignals.push('볼린저 상단 돌파');
          else if (sig.condition === (kimchiPremium > 5)) activeSignals.push('김프 과열');
          else if (sig.condition === (fearGreedIndex > 85)) activeSignals.push('극도의 탐욕');
          else if (sig.condition === (volumeRatio > 2.0 && priceChange.changeRate24h > 0)) activeSignals.push('상승 중 거래량 급증');
          else if (sig.condition === (priceChange.changeRate24h > 0.15)) activeSignals.push('24시간 15% 이상 급등');
        }
      });
    }

    return {
      market: candles[0].market,
      rsi,
      macd,
      bollinger,
      sma: { sma20, sma50 },
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
      newsAnalysis
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