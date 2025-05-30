interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface PatternResult {
  pattern: string;
  confidence: number;
  position: number; // 패턴이 감지된 캔들 인덱스
  type: 'bullish' | 'bearish' | 'neutral';
  description: string;
  reliability: number; // 0-1 신뢰도
}

interface ChartPattern {
  pattern: string;
  startIndex: number;
  endIndex: number;
  type: 'bullish' | 'bearish' | 'continuation';
  breakoutLevel?: number;
  targetPrice?: number;
  confidence: number;
}

export default class PatternRecognitionService {
  // 캔들 패턴 인식
  detectCandlePatterns(candles: Candle[]): PatternResult[] {
    const patterns: PatternResult[] = [];
    
    // 최소 3개 이상의 캔들이 필요
    if (candles.length < 3) return patterns;
    
    // 각 캔들에 대해 패턴 검사
    for (let i = 2; i < candles.length; i++) {
      // 단일 캔들 패턴
      this.detectSingleCandlePatterns(candles[i], i, patterns);
      
      // 2-캔들 패턴
      if (i >= 1) {
        this.detectDoubleCandlePatterns(candles.slice(i-1, i+1), i, patterns);
      }
      
      // 3-캔들 패턴
      if (i >= 2) {
        this.detectTripleCandlePatterns(candles.slice(i-2, i+1), i, patterns);
      }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  // 단일 캔들 패턴
  private detectSingleCandlePatterns(candle: Candle, index: number, patterns: PatternResult[]): void {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const totalRange = candle.high - candle.low;
    
    // Doji (십자선)
    if (body / totalRange < 0.1 && totalRange > 0) {
      patterns.push({
        pattern: 'Doji',
        confidence: 1 - (body / totalRange) * 10,
        position: index,
        type: 'neutral',
        description: '매수세와 매도세가 균형을 이루는 상태',
        reliability: 0.6
      });
    }
    
    // Hammer (망치형)
    if (lowerShadow > body * 2 && upperShadow < body * 0.3 && candle.close > candle.open) {
      patterns.push({
        pattern: 'Hammer',
        confidence: Math.min(lowerShadow / body / 2, 1),
        position: index,
        type: 'bullish',
        description: '하락 추세 후 반전 가능성',
        reliability: 0.7
      });
    }
    
    // Inverted Hammer (역망치형)
    if (upperShadow > body * 2 && lowerShadow < body * 0.3 && candle.close > candle.open) {
      patterns.push({
        pattern: 'Inverted Hammer',
        confidence: Math.min(upperShadow / body / 2, 1),
        position: index,
        type: 'bullish',
        description: '하락 추세 후 반전 신호',
        reliability: 0.65
      });
    }
    
    // Shooting Star (유성형)
    if (upperShadow > body * 2 && lowerShadow < body * 0.3 && candle.close < candle.open) {
      patterns.push({
        pattern: 'Shooting Star',
        confidence: Math.min(upperShadow / body / 2, 1),
        position: index,
        type: 'bearish',
        description: '상승 추세 후 반전 가능성',
        reliability: 0.7
      });
    }
    
    // Marubozu (장대양봉/음봉)
    if (upperShadow < body * 0.05 && lowerShadow < body * 0.05) {
      patterns.push({
        pattern: candle.close > candle.open ? 'Bullish Marubozu' : 'Bearish Marubozu',
        confidence: 1 - (upperShadow + lowerShadow) / body,
        position: index,
        type: candle.close > candle.open ? 'bullish' : 'bearish',
        description: '강한 추세 지속 신호',
        reliability: 0.75
      });
    }
    
    // Spinning Top (팽이형)
    if (body < totalRange * 0.3 && upperShadow > body && lowerShadow > body) {
      patterns.push({
        pattern: 'Spinning Top',
        confidence: 1 - body / totalRange / 0.3,
        position: index,
        type: 'neutral',
        description: '추세 약화 또는 전환 가능성',
        reliability: 0.5
      });
    }
  }
  
  // 2-캔들 패턴
  private detectDoubleCandlePatterns(candles: Candle[], index: number, patterns: PatternResult[]): void {
    if (candles.length !== 2) return;
    
    const [first, second] = candles;
    const firstBody = Math.abs(first.close - first.open);
    const secondBody = Math.abs(second.close - second.open);
    
    // Bullish Engulfing (상승 장악형)
    if (first.close < first.open && // 첫 번째 음봉
        second.close > second.open && // 두 번째 양봉
        second.open < first.close && // 두 번째 시가가 첫 번째 종가보다 낮음
        second.close > first.open) { // 두 번째 종가가 첫 번째 시가보다 높음
      patterns.push({
        pattern: 'Bullish Engulfing',
        confidence: Math.min(secondBody / firstBody, 1),
        position: index,
        type: 'bullish',
        description: '강력한 상승 반전 신호',
        reliability: 0.8
      });
    }
    
    // Bearish Engulfing (하락 장악형)
    if (first.close > first.open && // 첫 번째 양봉
        second.close < second.open && // 두 번째 음봉
        second.open > first.close && // 두 번째 시가가 첫 번째 종가보다 높음
        second.close < first.open) { // 두 번째 종가가 첫 번째 시가보다 낮음
      patterns.push({
        pattern: 'Bearish Engulfing',
        confidence: Math.min(secondBody / firstBody, 1),
        position: index,
        type: 'bearish',
        description: '강력한 하락 반전 신호',
        reliability: 0.8
      });
    }
    
    // Piercing Pattern (관통형)
    if (first.close < first.open && // 첫 번째 음봉
        second.close > second.open && // 두 번째 양봉
        second.open < first.low && // 갭 하락으로 시작
        second.close > first.open - firstBody * 0.5 && // 첫 번째 캔들 중간 이상 상승
        second.close < first.open) { // 첫 번째 시가는 넘지 못함
      patterns.push({
        pattern: 'Piercing Pattern',
        confidence: (second.close - (first.open - firstBody * 0.5)) / (firstBody * 0.5),
        position: index,
        type: 'bullish',
        description: '하락 추세 반전 신호',
        reliability: 0.7
      });
    }
    
    // Dark Cloud Cover (먹구름형)
    if (first.close > first.open && // 첫 번째 양봉
        second.close < second.open && // 두 번째 음봉
        second.open > first.high && // 갭 상승으로 시작
        second.close < first.close - firstBody * 0.5 && // 첫 번째 캔들 중간 이하로 하락
        second.close > first.open) { // 첫 번째 시가는 넘지 못함
      patterns.push({
        pattern: 'Dark Cloud Cover',
        confidence: ((first.close - firstBody * 0.5) - second.close) / (firstBody * 0.5),
        position: index,
        type: 'bearish',
        description: '상승 추세 반전 신호',
        reliability: 0.7
      });
    }
    
    // Tweezer Top/Bottom (집게형)
    const highDiff = Math.abs(first.high - second.high) / Math.max(first.high, second.high);
    const lowDiff = Math.abs(first.low - second.low) / Math.max(first.low, second.low);
    
    if (highDiff < 0.001) { // 고점이 거의 같음
      patterns.push({
        pattern: 'Tweezer Top',
        confidence: 1 - highDiff * 1000,
        position: index,
        type: 'bearish',
        description: '상승 추세 반전 가능성',
        reliability: 0.65
      });
    }
    
    if (lowDiff < 0.001) { // 저점이 거의 같음
      patterns.push({
        pattern: 'Tweezer Bottom',
        confidence: 1 - lowDiff * 1000,
        position: index,
        type: 'bullish',
        description: '하락 추세 반전 가능성',
        reliability: 0.65
      });
    }
  }
  
  // 3-캔들 패턴
  private detectTripleCandlePatterns(candles: Candle[], index: number, patterns: PatternResult[]): void {
    if (candles.length !== 3) return;
    
    const [first, second, third] = candles;
    
    // Morning Star (샛별형)
    if (first.close < first.open && // 첫 번째: 큰 음봉
        Math.abs(second.close - second.open) < Math.abs(first.close - first.open) * 0.3 && // 두 번째: 작은 캔들
        third.close > third.open && // 세 번째: 큰 양봉
        third.close > first.open - Math.abs(first.close - first.open) * 0.5) { // 첫 번째 캔들 중간 이상
      patterns.push({
        pattern: 'Morning Star',
        confidence: Math.min(Math.abs(third.close - third.open) / Math.abs(first.close - first.open), 1),
        position: index,
        type: 'bullish',
        description: '강력한 상승 반전 패턴',
        reliability: 0.85
      });
    }
    
    // Evening Star (저녁별형)
    if (first.close > first.open && // 첫 번째: 큰 양봉
        Math.abs(second.close - second.open) < Math.abs(first.close - first.open) * 0.3 && // 두 번째: 작은 캔들
        third.close < third.open && // 세 번째: 큰 음봉
        third.close < first.open + Math.abs(first.close - first.open) * 0.5) { // 첫 번째 캔들 중간 이하
      patterns.push({
        pattern: 'Evening Star',
        confidence: Math.min(Math.abs(third.close - third.open) / Math.abs(first.close - first.open), 1),
        position: index,
        type: 'bearish',
        description: '강력한 하락 반전 패턴',
        reliability: 0.85
      });
    }
    
    // Three White Soldiers (적삼병)
    if (first.close > first.open &&
        second.close > second.open &&
        third.close > third.open &&
        second.open > first.open && second.open < first.close &&
        third.open > second.open && third.open < second.close &&
        second.close > first.close &&
        third.close > second.close) {
      patterns.push({
        pattern: 'Three White Soldiers',
        confidence: 0.9,
        position: index,
        type: 'bullish',
        description: '강한 상승 추세 지속',
        reliability: 0.8
      });
    }
    
    // Three Black Crows (흑삼병)
    if (first.close < first.open &&
        second.close < second.open &&
        third.close < third.open &&
        second.open < first.open && second.open > first.close &&
        third.open < second.open && third.open > second.close &&
        second.close < first.close &&
        third.close < second.close) {
      patterns.push({
        pattern: 'Three Black Crows',
        confidence: 0.9,
        position: index,
        type: 'bearish',
        description: '강한 하락 추세 지속',
        reliability: 0.8
      });
    }
  }
  
  // 차트 패턴 인식
  detectChartPatterns(candles: Candle[], minPatternSize: number = 10): ChartPattern[] {
    const patterns: ChartPattern[] = [];
    
    if (candles.length < minPatternSize) return patterns;
    
    // 각 시작점에서 패턴 검사
    for (let i = 0; i < candles.length - minPatternSize; i++) {
      // Head and Shoulders
      this.detectHeadAndShoulders(candles, i, patterns);
      
      // Double Top/Bottom
      this.detectDoubleTopBottom(candles, i, patterns);
      
      // Triangle Patterns
      this.detectTrianglePatterns(candles, i, patterns);
      
      // Flag and Pennant
      this.detectFlagPennant(candles, i, patterns);
      
      // Wedge Patterns
      this.detectWedgePatterns(candles, i, patterns);
    }
    
    return patterns;
  }
  
  // Head and Shoulders 패턴
  private detectHeadAndShoulders(candles: Candle[], startIdx: number, patterns: ChartPattern[]): void {
    const window = 20; // 검사할 캔들 수
    if (startIdx + window > candles.length) return;
    
    const slice = candles.slice(startIdx, startIdx + window);
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    
    // 3개의 피크 찾기
    const peaks = this.findPeaks(highs);
    if (peaks.length >= 3) {
      const [leftShoulder, head, rightShoulder] = peaks.slice(0, 3);
      
      // Head가 가장 높고, 양쪽 어깨가 비슷한 높이인지 확인
      if (highs[head] > highs[leftShoulder] && 
          highs[head] > highs[rightShoulder] &&
          Math.abs(highs[leftShoulder] - highs[rightShoulder]) / highs[leftShoulder] < 0.03) {
        
        // Neckline 찾기
        const neckline = (lows[leftShoulder] + lows[rightShoulder]) / 2;
        
        patterns.push({
          pattern: 'Head and Shoulders',
          startIndex: startIdx + leftShoulder,
          endIndex: startIdx + rightShoulder,
          type: 'bearish',
          breakoutLevel: neckline,
          targetPrice: neckline - (highs[head] - neckline),
          confidence: 0.8
        });
      }
    }
    
    // Inverse Head and Shoulders
    const valleys = this.findValleys(lows);
    if (valleys.length >= 3) {
      const [leftShoulder, head, rightShoulder] = valleys.slice(0, 3);
      
      if (lows[head] < lows[leftShoulder] && 
          lows[head] < lows[rightShoulder] &&
          Math.abs(lows[leftShoulder] - lows[rightShoulder]) / lows[leftShoulder] < 0.03) {
        
        const neckline = (highs[leftShoulder] + highs[rightShoulder]) / 2;
        
        patterns.push({
          pattern: 'Inverse Head and Shoulders',
          startIndex: startIdx + leftShoulder,
          endIndex: startIdx + rightShoulder,
          type: 'bullish',
          breakoutLevel: neckline,
          targetPrice: neckline + (neckline - lows[head]),
          confidence: 0.8
        });
      }
    }
  }
  
  // Double Top/Bottom 패턴
  private detectDoubleTopBottom(candles: Candle[], startIdx: number, patterns: ChartPattern[]): void {
    const window = 15;
    if (startIdx + window > candles.length) return;
    
    const slice = candles.slice(startIdx, startIdx + window);
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    
    // Double Top
    const peaks = this.findPeaks(highs);
    if (peaks.length >= 2) {
      const [first, second] = peaks.slice(0, 2);
      
      if (Math.abs(highs[first] - highs[second]) / highs[first] < 0.02) {
        const supportLevel = Math.min(...lows.slice(first, second + 1));
        
        patterns.push({
          pattern: 'Double Top',
          startIndex: startIdx + first,
          endIndex: startIdx + second,
          type: 'bearish',
          breakoutLevel: supportLevel,
          targetPrice: supportLevel - (highs[first] - supportLevel),
          confidence: 0.75
        });
      }
    }
    
    // Double Bottom
    const valleys = this.findValleys(lows);
    if (valleys.length >= 2) {
      const [first, second] = valleys.slice(0, 2);
      
      if (Math.abs(lows[first] - lows[second]) / lows[first] < 0.02) {
        const resistanceLevel = Math.max(...highs.slice(first, second + 1));
        
        patterns.push({
          pattern: 'Double Bottom',
          startIndex: startIdx + first,
          endIndex: startIdx + second,
          type: 'bullish',
          breakoutLevel: resistanceLevel,
          targetPrice: resistanceLevel + (resistanceLevel - lows[first]),
          confidence: 0.75
        });
      }
    }
  }
  
  // Triangle 패턴
  private detectTrianglePatterns(candles: Candle[], startIdx: number, patterns: ChartPattern[]): void {
    const window = 15;
    if (startIdx + window > candles.length) return;
    
    const slice = candles.slice(startIdx, startIdx + window);
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    
    // 추세선 계산
    const upperTrend = this.calculateTrendLine(highs.map((h, i) => ({ x: i, y: h })));
    const lowerTrend = this.calculateTrendLine(lows.map((l, i) => ({ x: i, y: l })));
    
    // Ascending Triangle (상승 삼각형)
    if (Math.abs(upperTrend.slope) < 0.001 && lowerTrend.slope > 0.001) {
      patterns.push({
        pattern: 'Ascending Triangle',
        startIndex: startIdx,
        endIndex: startIdx + window - 1,
        type: 'bullish',
        breakoutLevel: upperTrend.intercept,
        confidence: 0.7
      });
    }
    
    // Descending Triangle (하락 삼각형)
    if (upperTrend.slope < -0.001 && Math.abs(lowerTrend.slope) < 0.001) {
      patterns.push({
        pattern: 'Descending Triangle',
        startIndex: startIdx,
        endIndex: startIdx + window - 1,
        type: 'bearish',
        breakoutLevel: lowerTrend.intercept,
        confidence: 0.7
      });
    }
    
    // Symmetrical Triangle (대칭 삼각형)
    if (upperTrend.slope < -0.001 && lowerTrend.slope > 0.001 && 
        Math.abs(upperTrend.slope + lowerTrend.slope) < 0.001) {
      patterns.push({
        pattern: 'Symmetrical Triangle',
        startIndex: startIdx,
        endIndex: startIdx + window - 1,
        type: 'continuation',
        confidence: 0.65
      });
    }
  }
  
  // Flag and Pennant 패턴
  private detectFlagPennant(candles: Candle[], startIdx: number, patterns: ChartPattern[]): void {
    if (startIdx < 5 || startIdx + 10 > candles.length) return;
    
    // 이전 추세 확인 (flagpole)
    const prevCandles = candles.slice(startIdx - 5, startIdx);
    const prevMove = prevCandles[4].close - prevCandles[0].close;
    const prevMovePercent = prevMove / prevCandles[0].close;
    
    // 강한 추세가 있었는지 확인 (5% 이상)
    if (Math.abs(prevMovePercent) > 0.05) {
      const consolidation = candles.slice(startIdx, startIdx + 10);
      const range = Math.max(...consolidation.map(c => c.high)) - Math.min(...consolidation.map(c => c.low));
      const avgRange = consolidation.reduce((sum, c) => sum + (c.high - c.low), 0) / consolidation.length;
      
      // 좁은 레인지에서 움직이는지 확인
      if (range < Math.abs(prevMove) * 0.5) {
        patterns.push({
          pattern: prevMove > 0 ? 'Bull Flag' : 'Bear Flag',
          startIndex: startIdx,
          endIndex: startIdx + 9,
          type: 'continuation',
          targetPrice: consolidation[9].close + prevMove,
          confidence: 0.7
        });
      }
    }
  }
  
  // Wedge 패턴
  private detectWedgePatterns(candles: Candle[], startIdx: number, patterns: ChartPattern[]): void {
    const window = 20;
    if (startIdx + window > candles.length) return;
    
    const slice = candles.slice(startIdx, startIdx + window);
    const highs = slice.map(c => c.high);
    const lows = slice.map(c => c.low);
    
    const upperTrend = this.calculateTrendLine(highs.map((h, i) => ({ x: i, y: h })));
    const lowerTrend = this.calculateTrendLine(lows.map((l, i) => ({ x: i, y: l })));
    
    // Rising Wedge (상승 쐐기)
    if (upperTrend.slope > 0 && lowerTrend.slope > 0 && upperTrend.slope < lowerTrend.slope) {
      patterns.push({
        pattern: 'Rising Wedge',
        startIndex: startIdx,
        endIndex: startIdx + window - 1,
        type: 'bearish',
        confidence: 0.7
      });
    }
    
    // Falling Wedge (하락 쐐기)
    if (upperTrend.slope < 0 && lowerTrend.slope < 0 && upperTrend.slope > lowerTrend.slope) {
      patterns.push({
        pattern: 'Falling Wedge',
        startIndex: startIdx,
        endIndex: startIdx + window - 1,
        type: 'bullish',
        confidence: 0.7
      });
    }
  }
  
  // 유틸리티 함수들
  private findPeaks(data: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }
  
  private findValleys(data: number[]): number[] {
    const valleys: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        valleys.push(i);
      }
    }
    return valleys;
  }
  
  private calculateTrendLine(points: { x: number; y: number }[]): { slope: number; intercept: number } {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }
  
  // 패턴 결과를 분석 신호로 변환
  convertToSignal(candlePatterns: PatternResult[], chartPatterns: ChartPattern[]): {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
  } {
    let bullishScore = 0;
    let bearishScore = 0;
    const reasons: string[] = [];
    
    // 캔들 패턴 점수 계산
    for (const pattern of candlePatterns.slice(0, 5)) { // 최근 5개 패턴만
      const score = pattern.confidence * pattern.reliability;
      if (pattern.type === 'bullish') {
        bullishScore += score;
        reasons.push(`${pattern.pattern} (신뢰도: ${(pattern.confidence * 100).toFixed(0)}%)`);
      } else if (pattern.type === 'bearish') {
        bearishScore += score;
        reasons.push(`${pattern.pattern} (신뢰도: ${(pattern.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    // 차트 패턴 점수 계산
    for (const pattern of chartPatterns) {
      if (pattern.type === 'bullish') {
        bullishScore += pattern.confidence;
        reasons.push(`${pattern.pattern} 패턴 감지`);
      } else if (pattern.type === 'bearish') {
        bearishScore += pattern.confidence;
        reasons.push(`${pattern.pattern} 패턴 감지`);
      }
    }
    
    // 최종 신호 결정
    const totalScore = bullishScore + bearishScore;
    if (totalScore === 0) {
      return { signal: 'HOLD', confidence: 0, reasons: ['패턴 없음'] };
    }
    
    const bullishRatio = bullishScore / totalScore;
    const confidence = Math.min(totalScore / 3, 1); // 정규화
    
    if (bullishRatio > 0.65) {
      return { signal: 'BUY', confidence, reasons };
    } else if (bullishRatio < 0.35) {
      return { signal: 'SELL', confidence, reasons };
    } else {
      // HOLD일 때도 bullishRatio에 따라 동적으로 신뢰도 계산
      const holdConfidence = confidence * (0.3 + 0.4 * Math.abs(0.5 - bullishRatio) * 2);
      return { signal: 'HOLD', confidence: holdConfidence, reasons: ['매수/매도 신호 균형'] };
    }
  }
}