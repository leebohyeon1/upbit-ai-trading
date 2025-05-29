import UpbitService from './upbit-service';

export interface SupportResistanceLevel {
  price: number;
  strength: number; // 0-1 사이의 강도
  type: 'SUPPORT' | 'RESISTANCE';
  touches: number; // 터치 횟수
  lastTouch: number; // 마지막 터치 시간
  timeframe: string;
  confidence: number; // 신뢰도
}

export interface PriceAction {
  timestamp: number;
  price: number;
  volume: number;
  type: 'BOUNCE' | 'BREAK' | 'TEST' | 'TOUCH';
  strength: number;
}

export interface SupportResistanceAnalysis {
  symbol: string;
  timestamp: number;
  currentPrice: number;
  levels: SupportResistanceLevel[];
  nearestSupport: SupportResistanceLevel | null;
  nearestResistance: SupportResistanceLevel | null;
  priceActions: PriceAction[];
  recommendations: {
    action: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    targetPrice?: number;
    stopLoss?: number;
    confidence: number;
  };
}

export class SupportResistanceService {
  private upbitService: typeof UpbitService;
  private minTouches = 2; // 최소 터치 횟수
  private priceThreshold = 0.01; // 1% 오차 허용
  private strengthThreshold = 0.3; // 최소 강도

  constructor() {
    this.upbitService = UpbitService;
  }

  /**
   * 지지/저항선 분석 실행
   */
  async analyzeSupportResistance(
    symbol: string, 
    timeframe: string = '1h', 
    period: number = 200
  ): Promise<SupportResistanceAnalysis> {
    try {
      // 캔들 데이터 가져오기
      const candles = await this.upbitService.getCandlesByTimeframe(symbol, timeframe, period);
      
      if (!candles || candles.length < 50) {
        throw new Error('충분한 캔들 데이터가 없습니다.');
      }

      const currentPrice = parseFloat(candles[0].trade_price.toString());
      
      // 고점/저점 찾기
      const pivots = this.findPivotPoints(candles);
      
      // 지지/저항선 식별
      const levels = this.identifySupportResistanceLevels(pivots, candles);
      
      // 가장 가까운 지지/저항선 찾기
      const nearestSupport = this.findNearestLevel(levels, currentPrice, 'SUPPORT');
      const nearestResistance = this.findNearestLevel(levels, currentPrice, 'RESISTANCE');
      
      // 가격 액션 분석
      const priceActions = this.analyzePriceActions(candles, levels);
      
      // 추천 생성
      const recommendations = this.generateRecommendations(
        currentPrice, 
        levels, 
        nearestSupport, 
        nearestResistance, 
        priceActions
      );

      return {
        symbol,
        timestamp: Date.now(),
        currentPrice,
        levels: levels.filter(level => level.confidence > this.strengthThreshold),
        nearestSupport,
        nearestResistance,
        priceActions,
        recommendations
      };
    } catch (error) {
      console.error('Support/Resistance analysis failed:', error);
      throw new Error(`지지/저항선 분석 실패: ${error}`);
    }
  }

  /**
   * 피벗 포인트 찾기 (고점/저점)
   */
  private findPivotPoints(candles: any[]): Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }> {
    const pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }> = [];
    const lookback = 5; // 좌우 5개 캔들을 확인

    for (let i = lookback; i < candles.length - lookback; i++) {
      const current = candles[i];
      const currentHigh = parseFloat(current.high_price);
      const currentLow = parseFloat(current.low_price);
      const currentVolume = parseFloat(current.candle_acc_trade_volume);
      const timestamp = new Date(current.candle_date_time_kst).getTime();

      // 고점 확인
      let isHigh = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && parseFloat(candles[j].high_price) >= currentHigh) {
          isHigh = false;
          break;
        }
      }

      if (isHigh) {
        pivots.push({
          price: currentHigh,
          timestamp,
          type: 'HIGH',
          volume: currentVolume
        });
      }

      // 저점 확인
      let isLow = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && parseFloat(candles[j].low_price) <= currentLow) {
          isLow = false;
          break;
        }
      }

      if (isLow) {
        pivots.push({
          price: currentLow,
          timestamp,
          type: 'LOW',
          volume: currentVolume
        });
      }
    }

    return pivots.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 지지/저항선 식별
   */
  private identifySupportResistanceLevels(
    pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }>, 
    candles: any[]
  ): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const groupedPivots = this.groupPivotsByPrice(pivots);

    for (const group of groupedPivots) {
      if (group.pivots.length < this.minTouches) continue;

      const avgPrice = group.pivots.reduce((sum, p) => sum + p.price, 0) / group.pivots.length;
      const touches = group.pivots.length;
      const lastTouch = Math.max(...group.pivots.map(p => p.timestamp));
      
      // 타입 결정 (고점이 많으면 저항선, 저점이 많으면 지지선)
      const highCount = group.pivots.filter(p => p.type === 'HIGH').length;
      const lowCount = group.pivots.filter(p => p.type === 'LOW').length;
      const type: 'SUPPORT' | 'RESISTANCE' = lowCount > highCount ? 'SUPPORT' : 'RESISTANCE';

      // 강도 계산 (터치 횟수, 최근성, 거래량 고려)
      const strength = this.calculateLevelStrength(group.pivots, candles);
      
      // 신뢰도 계산
      const confidence = this.calculateConfidence(group.pivots, type, candles);

      levels.push({
        price: avgPrice,
        strength,
        type,
        touches,
        lastTouch,
        timeframe: '1h', // TODO: 파라미터로 받은 timeframe 사용
        confidence
      });
    }

    return levels.sort((a, b) => b.strength - a.strength);
  }

  /**
   * 가격별로 피벗 그룹화
   */
  private groupPivotsByPrice(pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }>): Array<{
    priceRange: { min: number; max: number };
    pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }>;
  }> {
    const groups: Array<{
      priceRange: { min: number; max: number };
      pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }>;
    }> = [];

    const sortedPivots = [...pivots].sort((a, b) => a.price - b.price);

    for (const pivot of sortedPivots) {
      let addedToGroup = false;

      for (const group of groups) {
        const threshold = group.priceRange.min * this.priceThreshold;
        
        if (Math.abs(pivot.price - group.priceRange.min) <= threshold ||
            Math.abs(pivot.price - group.priceRange.max) <= threshold) {
          group.pivots.push(pivot);
          group.priceRange.min = Math.min(group.priceRange.min, pivot.price);
          group.priceRange.max = Math.max(group.priceRange.max, pivot.price);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push({
          priceRange: { min: pivot.price, max: pivot.price },
          pivots: [pivot]
        });
      }
    }

    return groups;
  }

  /**
   * 레벨 강도 계산
   */
  private calculateLevelStrength(
    pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }>, 
    candles: any[]
  ): number {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // 터치 횟수 점수 (0-0.4)
    const touchScore = Math.min(pivots.length / 10, 0.4);

    // 최근성 점수 (0-0.3)
    const latestTouch = Math.max(...pivots.map(p => p.timestamp));
    const daysSinceTouch = (now - latestTouch) / dayMs;
    const recencyScore = Math.max(0, 0.3 - (daysSinceTouch / 30) * 0.3);

    // 거래량 점수 (0-0.3)
    const avgVolume = pivots.reduce((sum, p) => sum + p.volume, 0) / pivots.length;
    const totalAvgVolume = candles.reduce((sum, c) => sum + parseFloat(c.candle_acc_trade_volume), 0) / candles.length;
    const volumeRatio = avgVolume / totalAvgVolume;
    const volumeScore = Math.min(volumeRatio * 0.3, 0.3);

    return touchScore + recencyScore + volumeScore;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    pivots: Array<{ price: number; timestamp: number; type: 'HIGH' | 'LOW'; volume: number }>, 
    type: 'SUPPORT' | 'RESISTANCE',
    candles: any[]
  ): number {
    // 가격 분산도 (낮을수록 좋음)
    const prices = pivots.map(p => p.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const priceSpread = Math.sqrt(variance) / avgPrice;
    const spreadScore = Math.max(0, 1 - (priceSpread / this.priceThreshold) * 0.5);

    // 타입 일치도
    const correctTypeCount = pivots.filter(p => 
      (type === 'SUPPORT' && p.type === 'LOW') || 
      (type === 'RESISTANCE' && p.type === 'HIGH')
    ).length;
    const typeScore = correctTypeCount / pivots.length;

    // 시간 분산도 (적절히 분산되어 있으면 좋음)
    const timestamps = pivots.map(p => p.timestamp).sort((a, b) => a - b);
    const timeSpans = [];
    for (let i = 1; i < timestamps.length; i++) {
      timeSpans.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgTimeSpan = timeSpans.reduce((sum, t) => sum + t, 0) / timeSpans.length || 1;
    const timeVariance = timeSpans.reduce((sum, t) => sum + Math.pow(t - avgTimeSpan, 2), 0) / timeSpans.length || 1;
    const timeScore = Math.min(1, avgTimeSpan / Math.sqrt(timeVariance + 1));

    return (spreadScore * 0.4 + typeScore * 0.4 + timeScore * 0.2);
  }

  /**
   * 가장 가까운 지지/저항선 찾기
   */
  private findNearestLevel(
    levels: SupportResistanceLevel[], 
    currentPrice: number, 
    type: 'SUPPORT' | 'RESISTANCE'
  ): SupportResistanceLevel | null {
    const filtered = levels.filter(level => level.type === type);
    
    if (filtered.length === 0) return null;

    if (type === 'SUPPORT') {
      // 현재가보다 낮은 가장 가까운 지지선
      const supportLevels = filtered.filter(level => level.price < currentPrice);
      return supportLevels.length > 0 
        ? supportLevels.reduce((closest, level) => level.price > closest.price ? level : closest)
        : null;
    } else {
      // 현재가보다 높은 가장 가까운 저항선
      const resistanceLevels = filtered.filter(level => level.price > currentPrice);
      return resistanceLevels.length > 0
        ? resistanceLevels.reduce((closest, level) => level.price < closest.price ? level : closest)
        : null;
    }
  }

  /**
   * 가격 액션 분석
   */
  private analyzePriceActions(candles: any[], levels: SupportResistanceLevel[]): PriceAction[] {
    const actions: PriceAction[] = [];
    
    for (let i = 1; i < Math.min(candles.length, 50); i++) { // 최근 50개 캔들만 분석
      const current = candles[i];
      const previous = candles[i - 1];
      
      const currentPrice = parseFloat(current.trade_price);
      const currentHigh = parseFloat(current.high_price);
      const currentLow = parseFloat(current.low_price);
      const previousPrice = parseFloat(previous.trade_price);
      const volume = parseFloat(current.candle_acc_trade_volume);
      const timestamp = new Date(current.candle_date_time_kst).getTime();

      // 각 레벨에 대해 가격 액션 확인
      for (const level of levels) {
        const distanceRatio = Math.abs(currentPrice - level.price) / level.price;
        
        if (distanceRatio <= this.priceThreshold) {
          let actionType: 'BOUNCE' | 'BREAK' | 'TEST' | 'TOUCH';
          let strength = 0;

          if (level.type === 'SUPPORT') {
            if (currentLow <= level.price && currentPrice > level.price && previousPrice <= level.price) {
              actionType = 'BOUNCE';
              strength = (currentPrice - level.price) / level.price;
            } else if (currentPrice < level.price && previousPrice >= level.price) {
              actionType = 'BREAK';
              strength = (level.price - currentPrice) / level.price;
            } else if (Math.abs(currentPrice - level.price) / level.price < 0.005) {
              actionType = 'TEST';
              strength = 0.5;
            } else {
              actionType = 'TOUCH';
              strength = 0.3;
            }
          } else { // RESISTANCE
            if (currentHigh >= level.price && currentPrice < level.price && previousPrice >= level.price) {
              actionType = 'BOUNCE';
              strength = (level.price - currentPrice) / level.price;
            } else if (currentPrice > level.price && previousPrice <= level.price) {
              actionType = 'BREAK';
              strength = (currentPrice - level.price) / level.price;
            } else if (Math.abs(currentPrice - level.price) / level.price < 0.005) {
              actionType = 'TEST';
              strength = 0.5;
            } else {
              actionType = 'TOUCH';
              strength = 0.3;
            }
          }

          actions.push({
            timestamp,
            price: currentPrice,
            volume,
            type: actionType,
            strength: Math.min(strength, 1.0)
          });
        }
      }
    }

    return actions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 매매 추천 생성
   */
  private generateRecommendations(
    currentPrice: number,
    levels: SupportResistanceLevel[],
    nearestSupport: SupportResistanceLevel | null,
    nearestResistance: SupportResistanceLevel | null,
    priceActions: PriceAction[]
  ): SupportResistanceAnalysis['recommendations'] {
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let reason = '명확한 신호 없음';
    let targetPrice: number | undefined;
    let stopLoss: number | undefined;
    let confidence = 0;

    // 최근 가격 액션 분석
    const recentActions = priceActions.slice(0, 5);
    const bounceActions = recentActions.filter(a => a.type === 'BOUNCE');
    const breakActions = recentActions.filter(a => a.type === 'BREAK');

    // 지지선에서 반등 신호
    if (nearestSupport && bounceActions.length > 0) {
      const supportBounce = bounceActions.find(a => 
        Math.abs(a.price - nearestSupport.price) / nearestSupport.price < this.priceThreshold
      );
      
      if (supportBounce && supportBounce.strength > 0.3) {
        action = 'BUY';
        reason = `지지선 ${nearestSupport.price.toLocaleString()}에서 반등 신호`;
        targetPrice = nearestResistance?.price;
        stopLoss = nearestSupport.price * 0.98; // 지지선 2% 아래
        confidence = Math.min(supportBounce.strength + nearestSupport.confidence, 1.0);
      }
    }

    // 저항선에서 반등 신호
    if (nearestResistance && bounceActions.length > 0) {
      const resistanceBounce = bounceActions.find(a => 
        Math.abs(a.price - nearestResistance.price) / nearestResistance.price < this.priceThreshold
      );
      
      if (resistanceBounce && resistanceBounce.strength > 0.3) {
        action = 'SELL';
        reason = `저항선 ${nearestResistance.price.toLocaleString()}에서 반등 신호`;
        targetPrice = nearestSupport?.price;
        stopLoss = nearestResistance.price * 1.02; // 저항선 2% 위
        confidence = Math.min(resistanceBounce.strength + nearestResistance.confidence, 1.0);
      }
    }

    // 돌파 신호
    if (breakActions.length > 0) {
      const strongBreak = breakActions.find(a => a.strength > 0.5);
      
      if (strongBreak) {
        const brokenLevel = levels.find(level => 
          Math.abs(strongBreak.price - level.price) / level.price < this.priceThreshold
        );
        
        if (brokenLevel) {
          if (brokenLevel.type === 'RESISTANCE' && currentPrice > brokenLevel.price) {
            action = 'BUY';
            reason = `저항선 ${brokenLevel.price.toLocaleString()} 상향 돌파`;
            confidence = strongBreak.strength;
          } else if (brokenLevel.type === 'SUPPORT' && currentPrice < brokenLevel.price) {
            action = 'SELL';
            reason = `지지선 ${brokenLevel.price.toLocaleString()} 하향 돌파`;
            confidence = strongBreak.strength;
          }
        }
      }
    }

    // 현재가가 강한 지지/저항선 사이에 있는 경우
    if (nearestSupport && nearestResistance) {
      const supportDistance = (currentPrice - nearestSupport.price) / nearestSupport.price;
      const resistanceDistance = (nearestResistance.price - currentPrice) / currentPrice;
      
      if (supportDistance < 0.02 && nearestSupport.strength > 0.7) {
        action = 'BUY';
        reason = `강한 지지선 ${nearestSupport.price.toLocaleString()} 근처`;
        targetPrice = nearestResistance.price;
        stopLoss = nearestSupport.price * 0.98;
        confidence = nearestSupport.confidence;
      } else if (resistanceDistance < 0.02 && nearestResistance.strength > 0.7) {
        action = 'SELL';
        reason = `강한 저항선 ${nearestResistance.price.toLocaleString()} 근처`;
        targetPrice = nearestSupport.price;
        stopLoss = nearestResistance.price * 1.02;
        confidence = nearestResistance.confidence;
      }
    }

    return {
      action,
      reason,
      targetPrice,
      stopLoss,
      confidence
    };
  }

  /**
   * 특정 가격대의 지지/저항 강도 계산
   */
  async getStrengthAtPrice(symbol: string, targetPrice: number, timeframe: string = '1h'): Promise<number> {
    try {
      const analysis = await this.analyzeSupportResistance(symbol, timeframe);
      
      const nearestLevel = analysis.levels.find(level => 
        Math.abs(level.price - targetPrice) / targetPrice < this.priceThreshold
      );
      
      return nearestLevel ? nearestLevel.strength : 0;
    } catch (error) {
      console.error('Failed to get strength at price:', error);
      return 0;
    }
  }
}

export default new SupportResistanceService();