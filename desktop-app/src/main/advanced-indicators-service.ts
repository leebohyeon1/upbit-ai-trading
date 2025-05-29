import UpbitService from './upbit-service';

export interface IchimokuCloud {
  tenkanSen: number;      // 전환선 (9일)
  kijunSen: number;       // 기준선 (26일)
  senkouSpanA: number;    // 선행스팬A (치코스팬)
  senkouSpanB: number;    // 선행스팬B
  chikou: number;         // 후행스팬 (26일 뒤)
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;       // 신호 강도 (0-1)
  cloudThickness: number; // 구름 두께 (변동성 지표)
}

export interface FibonacciLevel {
  level: number;          // 피보나치 레벨 (0, 23.6, 38.2, 50, 61.8, 100 등)
  price: number;          // 해당 가격
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;       // 강도 (터치 횟수와 반응 기반)
  description: string;    // 레벨 설명
}

export interface FibonacciRetracement {
  high: number;           // 최고가
  low: number;            // 최저가
  direction: 'UPTREND' | 'DOWNTREND';
  levels: FibonacciLevel[];
  currentPriceLevel: number; // 현재가의 피보나치 레벨
  signals: {
    nearestSupport: FibonacciLevel | null;
    nearestResistance: FibonacciLevel | null;
    recommendation: string;
    confidence: number;
  };
}

export interface AdvancedIndicatorAnalysis {
  symbol: string;
  timestamp: number;
  ichimoku: IchimokuCloud;
  fibonacci: FibonacciRetracement;
  combinedSignal: {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export class AdvancedIndicatorsService {
  private upbitService: typeof UpbitService;
  private lastRequestTime: number = 0;
  private requestDelay: number = 1000; // 1초 딜레이
  
  // 피보나치 레벨 상수
  private readonly FIBONACCI_LEVELS = [0, 23.6, 38.2, 50, 61.8, 78.6, 100, 127.2, 161.8, 261.8];

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
   * 고급 지표 분석 실행
   */
  async analyzeAdvancedIndicators(
    symbol: string, 
    timeframe: string = '1h', 
    period: number = 200
  ): Promise<AdvancedIndicatorAnalysis> {
    try {
      // Rate limiting 적용
      await this.waitForRateLimit();
      
      // 캔들 데이터 가져오기
      const candles = await this.upbitService.getCandlesByTimeframe(symbol, timeframe, period);
      
      if (!candles || candles.length < 52) { // 이치모쿠에 최소 52개 필요
        throw new Error('충분한 캔들 데이터가 없습니다.');
      }

      // 이치모쿠 클라우드 계산
      const ichimoku = this.calculateIchimoku(candles);
      
      // 피보나치 되돌림 계산
      const fibonacci = this.calculateFibonacci(candles);
      
      // 종합 신호 생성
      const combinedSignal = this.generateCombinedSignal(ichimoku, fibonacci, candles);

      return {
        symbol,
        timestamp: Date.now(),
        ichimoku,
        fibonacci,
        combinedSignal
      };
    } catch (error) {
      console.error('Advanced indicators analysis failed:', error);
      throw new Error(`고급 지표 분석 실패: ${error}`);
    }
  }

  /**
   * 이치모쿠 클라우드 계산
   */
  private calculateIchimoku(candles: any[]): IchimokuCloud {
    const highs = candles.map(c => parseFloat(c.high_price.toString()));
    const lows = candles.map(c => parseFloat(c.low_price.toString()));
    const closes = candles.map(c => parseFloat(c.trade_price.toString()));
    
    // 전환선 (Tenkan-sen): 9일간 최고가와 최저가의 평균
    const tenkan9High = Math.max(...highs.slice(-9));
    const tenkan9Low = Math.min(...lows.slice(-9));
    const tenkanSen = (tenkan9High + tenkan9Low) / 2;
    
    // 기준선 (Kijun-sen): 26일간 최고가와 최저가의 평균
    const kijun26High = Math.max(...highs.slice(-26));
    const kijun26Low = Math.min(...lows.slice(-26));
    const kijunSen = (kijun26High + kijun26Low) / 2;
    
    // 선행스팬A (Senkou Span A): (전환선 + 기준선) / 2를 26일 앞에 표시
    const senkouSpanA = (tenkanSen + kijunSen) / 2;
    
    // 선행스팬B (Senkou Span B): 52일간 최고가와 최저가의 평균을 26일 앞에 표시
    const senkou52High = Math.max(...highs.slice(-52));
    const senkou52Low = Math.min(...lows.slice(-52));
    const senkouSpanB = (senkou52High + senkou52Low) / 2;
    
    // 후행스팬 (Chikou): 현재 종가를 26일 뒤에 표시
    const chikou = closes[closes.length - 1];
    
    // 신호 판단
    const currentPrice = closes[closes.length - 1];
    const signal = this.determineIchimokuSignal(
      currentPrice, 
      tenkanSen, 
      kijunSen, 
      senkouSpanA, 
      senkouSpanB,
      chikou,
      closes
    );
    
    // 신호 강도 계산
    const strength = this.calculateIchimokuStrength(
      currentPrice, 
      tenkanSen, 
      kijunSen, 
      senkouSpanA, 
      senkouSpanB
    );
    
    // 구름 두께 (변동성 지표)
    const cloudThickness = Math.abs(senkouSpanA - senkouSpanB) / currentPrice;

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikou,
      signal,
      strength,
      cloudThickness
    };
  }

  /**
   * 이치모쿠 신호 판단
   */
  private determineIchimokuSignal(
    price: number,
    tenkan: number,
    kijun: number,
    spanA: number,
    spanB: number,
    chikou: number,
    closes: number[]
  ): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    let bullishCount = 0;
    let bearishCount = 0;

    // 1. 가격이 구름 위에 있는가?
    const cloudTop = Math.max(spanA, spanB);
    const cloudBottom = Math.min(spanA, spanB);
    
    if (price > cloudTop) bullishCount++;
    else if (price < cloudBottom) bearishCount++;

    // 2. 전환선이 기준선 위에 있는가?
    if (tenkan > kijun) bullishCount++;
    else if (tenkan < kijun) bearishCount++;

    // 3. 후행스팬이 26일 전 가격 위에 있는가?
    const price26DaysAgo = closes[closes.length - 26] || closes[0];
    if (chikou > price26DaysAgo) bullishCount++;
    else if (chikou < price26DaysAgo) bearishCount++;

    // 4. 선행스팬A가 선행스팬B 위에 있는가?
    if (spanA > spanB) bullishCount++;
    else if (spanA < spanB) bearishCount++;

    if (bullishCount >= 3) return 'BULLISH';
    else if (bearishCount >= 3) return 'BEARISH';
    else return 'NEUTRAL';
  }

  /**
   * 이치모쿠 신호 강도 계산
   */
  private calculateIchimokuStrength(
    price: number,
    tenkan: number,
    kijun: number,
    spanA: number,
    spanB: number
  ): number {
    const cloudTop = Math.max(spanA, spanB);
    const cloudBottom = Math.min(spanA, spanB);
    
    // 가격과 구름의 거리
    let cloudDistance = 0;
    if (price > cloudTop) {
      cloudDistance = (price - cloudTop) / price;
    } else if (price < cloudBottom) {
      cloudDistance = (cloudBottom - price) / price;
    }
    
    // 전환선과 기준선의 간격
    const lineGap = Math.abs(tenkan - kijun) / price;
    
    // 구름의 두께
    const cloudThickness = Math.abs(spanA - spanB) / price;
    
    // 강도 계산 (0-1)
    return Math.min(1, (cloudDistance * 0.5) + (lineGap * 0.3) + (cloudThickness * 0.2));
  }

  /**
   * 피보나치 되돌림 계산
   */
  private calculateFibonacci(candles: any[]): FibonacciRetracement {
    const highs = candles.map(c => parseFloat(c.high_price.toString()));
    const lows = candles.map(c => parseFloat(c.low_price.toString()));
    const closes = candles.map(c => parseFloat(c.trade_price.toString()));
    
    // 최근 100개 캔들에서 스윙 고점/저점 찾기
    const swingPeriod = Math.min(100, candles.length);
    const recentHighs = highs.slice(-swingPeriod);
    const recentLows = lows.slice(-swingPeriod);
    
    const high = Math.max(...recentHighs);
    const low = Math.min(...recentLows);
    const range = high - low;
    
    // 추세 방향 판단
    const currentPrice = closes[closes.length - 1];
    const direction: 'UPTREND' | 'DOWNTREND' = this.determineTrendDirection(closes.slice(-50));
    
    // 피보나치 레벨 계산
    const levels: FibonacciLevel[] = this.FIBONACCI_LEVELS.map(level => {
      let price: number;
      let type: 'SUPPORT' | 'RESISTANCE';
      
      if (direction === 'UPTREND') {
        // 상승 추세에서는 고점에서 되돌림
        price = high - (range * level / 100);
        type = price < currentPrice ? 'SUPPORT' : 'RESISTANCE';
      } else {
        // 하락 추세에서는 저점에서 되돌림
        price = low + (range * level / 100);
        type = price > currentPrice ? 'RESISTANCE' : 'SUPPORT';
      }
      
      const strength = this.calculateFibonacciStrength(price, closes, highs, lows);
      
      return {
        level,
        price,
        type,
        strength,
        description: `${level}% 되돌림 (${type === 'SUPPORT' ? '지지' : '저항'})`
      };
    });
    
    // 현재가의 피보나치 레벨 계산
    const currentPriceLevel = direction === 'UPTREND' 
      ? ((high - currentPrice) / range) * 100
      : ((currentPrice - low) / range) * 100;
    
    // 가장 가까운 지지/저항 찾기
    const supports = levels.filter(l => l.type === 'SUPPORT' && l.price < currentPrice);
    const resistances = levels.filter(l => l.type === 'RESISTANCE' && l.price > currentPrice);
    
    const nearestSupport = supports.length > 0 
      ? supports.reduce((prev, curr) => curr.price > prev.price ? curr : prev)
      : null;
      
    const nearestResistance = resistances.length > 0
      ? resistances.reduce((prev, curr) => curr.price < prev.price ? curr : prev)
      : null;
    
    // 신호 생성
    const signals = this.generateFibonacciSignals(
      currentPrice,
      currentPriceLevel,
      nearestSupport,
      nearestResistance,
      direction
    );

    return {
      high,
      low,
      direction,
      levels,
      currentPriceLevel,
      signals
    };
  }

  /**
   * 추세 방향 판단
   */
  private determineTrendDirection(closes: number[]): 'UPTREND' | 'DOWNTREND' {
    if (closes.length < 20) return 'UPTREND';
    
    const sma20 = closes.slice(-20).reduce((a, b) => a + b) / 20;
    const sma50 = closes.slice(-50).reduce((a, b) => a + b) / 50;
    const currentPrice = closes[closes.length - 1];
    
    // 여러 조건으로 추세 판단
    const condition1 = currentPrice > sma20; // 현재가 > 20일 평균
    const condition2 = sma20 > sma50; // 20일 평균 > 50일 평균
    const condition3 = closes[closes.length - 1] > closes[closes.length - 20]; // 20일 전보다 상승
    
    const upCount = [condition1, condition2, condition3].filter(Boolean).length;
    
    return upCount >= 2 ? 'UPTREND' : 'DOWNTREND';
  }

  /**
   * 피보나치 레벨 강도 계산
   */
  private calculateFibonacciStrength(
    fibPrice: number,
    closes: number[],
    highs: number[],
    lows: number[]
  ): number {
    let touchCount = 0;
    let reactionCount = 0;
    
    // 최근 50개 캔들에서 해당 레벨 근처(1% 이내) 터치 확인
    const threshold = fibPrice * 0.01; // 1% 허용 오차
    
    for (let i = Math.max(0, closes.length - 50); i < closes.length; i++) {
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      
      // 레벨 터치 확인
      if ((low <= fibPrice + threshold && high >= fibPrice - threshold)) {
        touchCount++;
        
        // 반응 확인 (터치 후 반대 방향으로 움직임)
        if (i < closes.length - 1) {
          const nextClose = closes[i + 1];
          const reaction = Math.abs(nextClose - fibPrice) / fibPrice;
          if (reaction > 0.01) { // 1% 이상 반응
            reactionCount++;
          }
        }
      }
    }
    
    // 강도 계산 (터치 횟수와 반응 비율 고려)
    const reactionRatio = touchCount > 0 ? reactionCount / touchCount : 0;
    return Math.min(1, (touchCount * 0.1) + (reactionRatio * 0.5));
  }

  /**
   * 피보나치 신호 생성
   */
  private generateFibonacciSignals(
    currentPrice: number,
    currentLevel: number,
    nearestSupport: FibonacciLevel | null,
    nearestResistance: FibonacciLevel | null,
    direction: 'UPTREND' | 'DOWNTREND'
  ): FibonacciRetracement['signals'] {
    let recommendation = '관망';
    let confidence = 0;

    // 주요 피보나치 레벨에서의 반응 확인
    if (currentLevel >= 61.8 && currentLevel <= 65) {
      recommendation = direction === 'UPTREND' ? '매수 고려 (황금비율 지지)' : '매도 고려 (황금비율 저항)';
      confidence = 0.8;
    } else if (currentLevel >= 38.2 && currentLevel <= 42) {
      recommendation = direction === 'UPTREND' ? '부분 매수 (38.2% 지지)' : '부분 매도 (38.2% 저항)';
      confidence = 0.6;
    } else if (currentLevel >= 48 && currentLevel <= 52) {
      recommendation = '50% 되돌림 레벨 - 중요한 지지/저항';
      confidence = 0.7;
    } else if (currentLevel >= 23.6 && currentLevel <= 27) {
      recommendation = '얕은 되돌림 - 강한 추세 지속 가능성';
      confidence = 0.5;
    }

    // 지지/저항 근처에서의 신호
    if (nearestSupport && nearestSupport.strength > 0.5) {
      const distance = (currentPrice - nearestSupport.price) / currentPrice;
      if (distance < 0.02) { // 2% 이내
        recommendation = `강한 지지선 근처 - 매수 기회`;
        confidence = Math.max(confidence, nearestSupport.strength);
      }
    }

    if (nearestResistance && nearestResistance.strength > 0.5) {
      const distance = (nearestResistance.price - currentPrice) / currentPrice;
      if (distance < 0.02) { // 2% 이내
        recommendation = `강한 저항선 근처 - 매도 고려`;
        confidence = Math.max(confidence, nearestResistance.strength);
      }
    }

    return {
      nearestSupport,
      nearestResistance,
      recommendation,
      confidence
    };
  }

  /**
   * 종합 신호 생성
   */
  private generateCombinedSignal(
    ichimoku: IchimokuCloud,
    fibonacci: FibonacciRetracement,
    candles: any[]
  ): AdvancedIndicatorAnalysis['combinedSignal'] {
    const reasons: string[] = [];
    let buyScore = 0;
    let sellScore = 0;

    // 이치모쿠 신호 평가
    if (ichimoku.signal === 'BULLISH') {
      buyScore += ichimoku.strength * 0.4;
      reasons.push(`이치모쿠 상승 신호 (강도: ${(ichimoku.strength * 100).toFixed(1)}%)`);
    } else if (ichimoku.signal === 'BEARISH') {
      sellScore += ichimoku.strength * 0.4;
      reasons.push(`이치모쿠 하락 신호 (강도: ${(ichimoku.strength * 100).toFixed(1)}%)`);
    }

    // 피보나치 신호 평가
    const currentPrice = parseFloat(candles[candles.length - 1].trade_price.toString());
    
    // 주요 피보나치 레벨에서의 반응
    if (fibonacci.currentPriceLevel >= 61.8 && fibonacci.currentPriceLevel <= 65) {
      if (fibonacci.direction === 'UPTREND') {
        buyScore += 0.3;
        reasons.push('피보나치 61.8% 황금비율 지지선 근처');
      } else {
        sellScore += 0.3;
        reasons.push('피보나치 61.8% 황금비율 저항선 근처');
      }
    }

    // 지지/저항선 근처 평가
    if (fibonacci.signals.nearestSupport && fibonacci.signals.nearestSupport.strength > 0.5) {
      const distance = Math.abs(currentPrice - fibonacci.signals.nearestSupport.price) / currentPrice;
      if (distance < 0.02) {
        buyScore += fibonacci.signals.nearestSupport.strength * 0.3;
        reasons.push(`강한 피보나치 지지선 근처 (${fibonacci.signals.nearestSupport.level}%)`);
      }
    }

    if (fibonacci.signals.nearestResistance && fibonacci.signals.nearestResistance.strength > 0.5) {
      const distance = Math.abs(fibonacci.signals.nearestResistance.price - currentPrice) / currentPrice;
      if (distance < 0.02) {
        sellScore += fibonacci.signals.nearestResistance.strength * 0.3;
        reasons.push(`강한 피보나치 저항선 근처 (${fibonacci.signals.nearestResistance.level}%)`);
      }
    }

    // 종합 판단
    const netScore = buyScore - sellScore;
    const confidence = Math.min(Math.abs(netScore), 1.0);
    
    let action: 'BUY' | 'SELL' | 'HOLD';
    if (netScore > 0.3 && confidence > 0.5) {
      action = 'BUY';
    } else if (netScore < -0.3 && confidence > 0.5) {
      action = 'SELL';
    } else {
      action = 'HOLD';
      reasons.push('신호 강도 부족 - 관망 권장');
    }

    // 리스크 레벨 계산
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (confidence > 0.7 && ichimoku.cloudThickness < 0.02) {
      riskLevel = 'LOW';
    } else if (confidence > 0.5 && ichimoku.cloudThickness < 0.05) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    return {
      action,
      confidence,
      reasons,
      riskLevel
    };
  }
}

export default new AdvancedIndicatorsService();