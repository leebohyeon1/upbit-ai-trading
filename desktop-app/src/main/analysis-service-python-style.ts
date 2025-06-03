import { CandleData } from './upbit-service';
import { SimplifiedTradingConfig } from './trading-config';
import { TradingSignal } from './analysis-service';

export class PythonStyleAnalyzer {
  // Python 프로젝트 스타일로 개별 신호 생성
  generateTradingSignals(
    data: {
      candles: CandleData[];
      rsi: number;
      macd: { macd: number; signal: number; histogram: number };
      bollinger: { upper: number; middle: number; lower: number; position: number };
      sma: { sma20: number; sma50: number; sma60?: number };
      stochastic?: { k: number; d: number };
      volumeRatio: number;
      orderbook?: { bidAskRatio: number; spread: number };
      trades?: { buyRatio: number; whaleDetected?: boolean };
      kimchiPremium?: number;
      fearGreedIndex?: number;
      obv?: { value: number; signal: number; trend: 'UP' | 'DOWN' | 'NEUTRAL' };
      adx?: { adx: number; plusDI: number; minusDI: number; trend: 'STRONG' | 'WEAK' | 'NONE' };
      currentPrice: number;
    },
    config: SimplifiedTradingConfig
  ): TradingSignal[] {
    const signals: TradingSignal[] = [];
    const { signalStrengths, useIndicators } = config;
    
    // 1. 이동평균선(MA) 분석
    if (useIndicators.movingAverage) {
      // 골든크로스/데드크로스
      if (data.sma.sma20 > data.sma.sma50) {
        signals.push({
          source: "이동평균선(MA)",
          signal: "buy",
          strength: signalStrengths.maCrossover,
          description: "골든크로스 (단기 MA > 장기 MA)"
        });
      } else {
        signals.push({
          source: "이동평균선(MA)",
          signal: "sell",
          strength: signalStrengths.maCrossover,
          description: "데드크로스 (단기 MA < 장기 MA)"
        });
      }
      
      // 장기 추세 (MA60)
      if (data.sma.sma60 && data.currentPrice > data.sma.sma60) {
        signals.push({
          source: "장기추세(MA60)",
          signal: "buy",
          strength: signalStrengths.maLongTrend,
          description: "장기 상승 추세 (현재가 > MA60)"
        });
      } else if (data.sma.sma60 && data.currentPrice < data.sma.sma60) {
        signals.push({
          source: "장기추세(MA60)",
          signal: "sell",
          strength: signalStrengths.maLongTrend,
          description: "장기 하락 추세 (현재가 < MA60)"
        });
      }
    }
    
    // 2. 볼린저 밴드 분석
    if (useIndicators.bollingerBands) {
      if (data.bollinger.position < -0.8) {
        signals.push({
          source: "볼린저밴드(BB)",
          signal: "buy",
          strength: signalStrengths.bbExtreme,
          description: `하단 돌파 (위치: ${(data.bollinger.position * 100).toFixed(0)}%)`
        });
      } else if (data.bollinger.position > 0.8) {
        signals.push({
          source: "볼린저밴드(BB)",
          signal: "sell",
          strength: signalStrengths.bbExtreme,
          description: `상단 돌파 (위치: ${(data.bollinger.position * 100).toFixed(0)}%)`
        });
      } else if (data.bollinger.position < -0.3) {
        signals.push({
          source: "볼린저밴드(BB)",
          signal: "buy",
          strength: signalStrengths.bbMiddle,
          description: "하단 접근중"
        });
      } else if (data.bollinger.position > 0.3) {
        signals.push({
          source: "볼린저밴드(BB)",
          signal: "sell",
          strength: signalStrengths.bbMiddle,
          description: "상단 접근중"
        });
      } else {
        signals.push({
          source: "볼린저밴드(BB)",
          signal: "hold",
          strength: 0,
          description: "밴드 중앙 부근"
        });
      }
    }
    
    // 3. RSI 분석
    if (useIndicators.rsi) {
      if (data.rsi < 30) {
        signals.push({
          source: "RSI",
          signal: "buy",
          strength: signalStrengths.rsiExtreme,
          description: `과매도 영역 (RSI: ${data.rsi.toFixed(1)})`
        });
      } else if (data.rsi > 70) {
        signals.push({
          source: "RSI",
          signal: "sell",
          strength: signalStrengths.rsiExtreme,
          description: `과매수 영역 (RSI: ${data.rsi.toFixed(1)})`
        });
      } else if (data.rsi < 40) {
        signals.push({
          source: "RSI",
          signal: "buy",
          strength: signalStrengths.rsiMiddle,
          description: "매수 우위 영역"
        });
      } else if (data.rsi > 60) {
        signals.push({
          source: "RSI",
          signal: "sell",
          strength: signalStrengths.rsiMiddle,
          description: "매도 우위 영역"
        });
      } else {
        signals.push({
          source: "RSI",
          signal: "hold",
          strength: 0,
          description: "중립 영역"
        });
      }
    }
    
    // 4. MACD 분석
    if (useIndicators.macd) {
      const { macd, signal, histogram } = data.macd;
      
      if (macd > signal && histogram > 0) {
        signals.push({
          source: "MACD",
          signal: "buy",
          strength: signalStrengths.macdCrossover,
          description: "골든크로스 (MACD > Signal)"
        });
      } else if (macd < signal && histogram < 0) {
        signals.push({
          source: "MACD",
          signal: "sell",
          strength: signalStrengths.macdCrossover,
          description: "데드크로스 (MACD < Signal)"
        });
      } else if (histogram > 0) {
        signals.push({
          source: "MACD",
          signal: "buy",
          strength: signalStrengths.macdTrend,
          description: "상승 추세 유지"
        });
      } else if (histogram < 0) {
        signals.push({
          source: "MACD",
          signal: "sell",
          strength: signalStrengths.macdTrend,
          description: "하락 추세 유지"
        });
      }
    }
    
    // 5. 스토캐스틱 분석
    if (useIndicators.stochastic && data.stochastic) {
      const { k, d } = data.stochastic;
      
      if (k < 20) {
        signals.push({
          source: "스토캐스틱",
          signal: "buy",
          strength: signalStrengths.stochExtreme,
          description: `과매도 영역 (K: ${k.toFixed(1)})`
        });
      } else if (k > 80) {
        signals.push({
          source: "스토캐스틱",
          signal: "sell",
          strength: signalStrengths.stochExtreme,
          description: `과매수 영역 (K: ${k.toFixed(1)})`
        });
      } else if (k < 50 && k > d) {
        signals.push({
          source: "스토캐스틱",
          signal: "buy",
          strength: signalStrengths.stochMiddle,
          description: "상승 전환"
        });
      } else if (k > 50 && k < d) {
        signals.push({
          source: "스토캐스틱",
          signal: "sell",
          strength: signalStrengths.stochMiddle,
          description: "하락 전환"
        });
      }
    }
    
    // 6. 거래량 분석
    if (useIndicators.volume) {
      if (data.volumeRatio > 2.0) {
        signals.push({
          source: "거래량",
          signal: "buy",
          strength: signalStrengths.volumeRatio,
          description: `거래량 급증 (평균 대비 ${data.volumeRatio.toFixed(1)}배)`
        });
      } else if (data.volumeRatio < 0.5) {
        signals.push({
          source: "거래량",
          signal: "sell",
          strength: signalStrengths.volumeRatio * 0.5,
          description: "거래량 감소"
        });
      }
    }
    
    // 7. 호가창 분석
    if (useIndicators.orderbook && data.orderbook) {
      const ratio = data.orderbook.bidAskRatio;
      
      if (ratio > 1.5) {
        signals.push({
          source: "호가창",
          signal: "buy",
          strength: signalStrengths.orderbook,
          description: `매수세 우세 (비율: ${ratio.toFixed(2)})`
        });
      } else if (ratio < 0.67) {
        signals.push({
          source: "호가창",
          signal: "sell",
          strength: signalStrengths.orderbook,
          description: `매도세 우세 (비율: ${ratio.toFixed(2)})`
        });
      }
    }
    
    // 8. 체결 데이터 분석
    if (useIndicators.trades && data.trades) {
      if (data.trades.buyRatio > 0.6) {
        signals.push({
          source: "체결데이터",
          signal: "buy",
          strength: signalStrengths.tradeData,
          description: `매수 비율 높음 (${(data.trades.buyRatio * 100).toFixed(0)}%)`
        });
      } else if (data.trades.buyRatio < 0.4) {
        signals.push({
          source: "체결데이터",
          signal: "sell",
          strength: signalStrengths.tradeData,
          description: `매도 비율 높음 (${(100 - data.trades.buyRatio * 100).toFixed(0)}%)`
        });
      }
      
      // 고래 활동
      if (data.trades.whaleDetected) {
        signals.push({
          source: "고래활동",
          signal: data.trades.buyRatio > 0.5 ? "buy" : "sell",
          strength: 0.8,
          description: "고래 거래 감지"
        });
      }
    }
    
    // 9. 김치 프리미엄
    if (useIndicators.kimchiPremium && data.kimchiPremium !== undefined) {
      if (data.kimchiPremium < -2) {
        signals.push({
          source: "김치프리미엄",
          signal: "buy",
          strength: signalStrengths.kimchiPremium,
          description: `역프리미엄 (${data.kimchiPremium.toFixed(1)}%)`
        });
      } else if (data.kimchiPremium > 5) {
        signals.push({
          source: "김치프리미엄",
          signal: "sell",
          strength: signalStrengths.kimchiPremium,
          description: `높은 프리미엄 (${data.kimchiPremium.toFixed(1)}%)`
        });
      }
    }
    
    // 10. 공포/탐욕 지수
    if (useIndicators.fearGreed && data.fearGreedIndex !== undefined) {
      if (data.fearGreedIndex < 25) {
        signals.push({
          source: "공포탐욕지수",
          signal: "buy",
          strength: signalStrengths.fearGreed,
          description: `극도의 공포 (${data.fearGreedIndex})`
        });
      } else if (data.fearGreedIndex > 75) {
        signals.push({
          source: "공포탐욕지수",
          signal: "sell",
          strength: signalStrengths.fearGreed,
          description: `극도의 탐욕 (${data.fearGreedIndex})`
        });
      }
    }
    
    // 11. OBV 분석
    if (useIndicators.obv && data.obv) {
      if (data.obv.trend === 'UP') {
        signals.push({
          source: "OBV",
          signal: "buy",
          strength: signalStrengths.obv,
          description: "거래량 상승 추세"
        });
      } else if (data.obv.trend === 'DOWN') {
        signals.push({
          source: "OBV",
          signal: "sell",
          strength: signalStrengths.obv,
          description: "거래량 하락 추세"
        });
      }
    }
    
    // 12. ADX 분석
    if (useIndicators.adx && data.adx) {
      if (data.adx.trend === 'STRONG' && data.adx.plusDI > data.adx.minusDI) {
        signals.push({
          source: "ADX",
          signal: "buy",
          strength: signalStrengths.adx,
          description: `강한 상승 추세 (ADX: ${data.adx.adx.toFixed(1)})`
        });
      } else if (data.adx.trend === 'STRONG' && data.adx.plusDI < data.adx.minusDI) {
        signals.push({
          source: "ADX",
          signal: "sell",
          strength: signalStrengths.adx,
          description: `강한 하락 추세 (ADX: ${data.adx.adx.toFixed(1)})`
        });
      }
    }
    
    return signals;
  }
  
  // Python 프로젝트 스타일로 가중 평균 계산 및 최종 결정
  calculateWeightedDecision(
    signals: TradingSignal[],
    config: SimplifiedTradingConfig
  ): {
    decision: 'buy' | 'sell' | 'hold';
    decisionKr: '매수' | '매도' | '홀드';
    avgSignalStrength: number;
    confidence: number;
    signalCounts: { buy: number; sell: number; hold: number };
  } {
    const { indicatorWeights, tradingThresholds } = config;
    
    // 신호 카운트
    const signalCounts = {
      buy: signals.filter(s => s.signal === 'buy').length,
      sell: signals.filter(s => s.signal === 'sell').length,
      hold: signals.filter(s => s.signal === 'hold').length
    };
    
    // 가중 평균 계산
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const signal of signals) {
      // 지표 가중치 매핑
      let weight = 1.0;
      if (signal.source.includes('MA60')) {
        weight = indicatorWeights.MA60;
      } else if (signal.source.includes('MA')) {
        weight = indicatorWeights.MA;
      } else if (signal.source.includes('볼린저')) {
        weight = indicatorWeights.BB;
      } else if (signal.source === 'RSI') {
        weight = indicatorWeights.RSI;
      } else if (signal.source === 'MACD') {
        weight = indicatorWeights.MACD;
      } else if (signal.source.includes('스토캐스틱')) {
        weight = indicatorWeights.Stochastic;
      } else if (signal.source.includes('호가창')) {
        weight = indicatorWeights.Orderbook;
      } else if (signal.source.includes('체결')) {
        weight = indicatorWeights.Trades;
      } else if (signal.source.includes('거래량')) {
        weight = indicatorWeights.Volume;
      } else if (signal.source.includes('김치')) {
        weight = indicatorWeights.KIMP;
      } else if (signal.source.includes('공포')) {
        weight = indicatorWeights.FearGreed;
      } else if (signal.source === 'OBV') {
        weight = indicatorWeights.OBV;
      } else if (signal.source === 'ADX') {
        weight = indicatorWeights.ADX;
      }
      
      // 신호 값 계산 (buy: +1, sell: -1, hold: 0)
      let signalValue = 0;
      if (signal.signal === 'buy') {
        signalValue = signal.strength;
      } else if (signal.signal === 'sell') {
        signalValue = -signal.strength;
      }
      
      weightedSum += signalValue * weight;
      totalWeight += weight;
    }
    
    // 평균 신호 강도
    const avgSignalStrength = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // 최종 결정
    let decision: 'buy' | 'sell' | 'hold';
    let decisionKr: '매수' | '매도' | '홀드';
    
    if (avgSignalStrength > tradingThresholds.buyThreshold) {
      decision = 'buy';
      decisionKr = '매수';
    } else if (avgSignalStrength < tradingThresholds.sellThreshold) {
      decision = 'sell';
      decisionKr = '매도';
    } else {
      decision = 'hold';
      decisionKr = '홀드';
    }
    
    // 신뢰도 계산 (Python 프로젝트 방식)
    // confidence = 0.5 + abs(avg_signal_strength) / 2
    // TypeScript에서는 50 + abs(avg_signal_strength) * 50으로 변환 (0.5~1.0을 50~100%로)
    let confidence = 50 + Math.abs(avgSignalStrength) * 50;
    
    // 신뢰도 범위 제한 (50% ~ 100%)
    confidence = Math.max(50, Math.min(100, confidence));
    
    return {
      decision,
      decisionKr,
      avgSignalStrength,
      confidence,
      signalCounts
    };
  }
}

export default PythonStyleAnalyzer;