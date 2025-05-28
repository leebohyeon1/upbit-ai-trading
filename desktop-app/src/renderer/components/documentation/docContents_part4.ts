export const docContentsPart4 = {
  'coin-settings.trading-hours': {
    title: '거래 시간대 설정',
    content: `
# 거래 시간대 설정

## 시간대별 시장 특성

### 글로벌 시장 시간대
\`\`\`
아시아 시간 (09:00-17:00 KST)
- 한국, 일본, 중국 투자자 활발
- 상대적으로 안정적인 거래
- 기술적 분석 신뢰도 높음

유럽 시간 (17:00-01:00 KST)
- 유럽 투자자 참여
- 아시아-유럽 중첩 시간 활발
- 뉴스 영향 증가

미국 시간 (22:00-06:00 KST)
- 가장 큰 거래량
- 높은 변동성
- 기관 투자자 영향
\`\`\`

## 시간대별 거래 설정

### 기본 설정
\`\`\`javascript
const tradingHours = {
  enabled: true,
  timezone: 'Asia/Seoul',
  
  schedule: [
    {
      name: '아시아 세션',
      start: '09:00',
      end: '17:00',
      settings: {
        buyConfidence: 70,
        sellConfidence: 75,
        maxVolatility: 0.15
      }
    },
    {
      name: '유럽 세션',
      start: '17:00',
      end: '01:00',
      settings: {
        buyConfidence: 75,
        sellConfidence: 80,
        maxVolatility: 0.20
      }
    },
    {
      name: '미국 세션',
      start: '22:00',
      end: '06:00',
      settings: {
        buyConfidence: 80,
        sellConfidence: 85,
        maxVolatility: 0.25
      }
    }
  ]
};
\`\`\`

### 코인별 최적 시간대
\`\`\`javascript
const coinOptimalHours = {
  'BTC': {
    preferred: ['22:00-02:00'],  // 미국 오픈
    avoid: ['03:00-08:00'],      // 조용한 시간
    volatility: {
      high: ['22:00-23:00', '09:00-10:00'],
      low: ['04:00-07:00', '13:00-15:00']
    }
  },
  
  'ETH': {
    preferred: ['17:00-19:00'],  // 유럽 활발
    avoid: ['03:00-08:00'],
    volatility: {
      high: ['17:00-18:00', '22:00-23:00'],
      low: ['05:00-08:00', '14:00-16:00']
    }
  },
  
  'XRP': {
    preferred: ['09:00-11:00'],  // 아시아 오픈
    avoid: ['02:00-07:00'],
    volatility: {
      high: ['09:00-10:00', '21:00-22:00'],
      low: ['03:00-06:00', '15:00-17:00']
    }
  }
};
\`\`\`

## 고급 시간 전략

### 이벤트 기반 거래
\`\`\`javascript
const eventBasedTrading = {
  // 정기 이벤트
  recurring: [
    {
      name: 'CME 선물 만기',
      schedule: 'lastFriday',
      time: '16:00',
      impact: 'high',
      strategy: {
        before: {
          hours: 24,
          action: 'reducePosition',
          confidence: '+10'
        },
        after: {
          hours: 6,
          action: 'normal'
        }
      }
    },
    {
      name: 'FOMC 회의',
      schedule: 'custom',
      impact: 'very_high',
      strategy: {
        before: {
          hours: 48,
          action: 'stopTrading'
        },
        after: {
          hours: 12,
          action: 'cautiousResume'
        }
      }
    }
  ],
  
  // 시간대별 뉴스 영향
  newsImpact: {
    '08:00-09:00': 1.2,  // 아시아 뉴스
    '16:00-17:00': 1.3,  // 유럽 뉴스
    '21:00-22:00': 1.5   // 미국 뉴스
  }
};
\`\`\`

### 유동성 기반 거래
\`\`\`javascript
class LiquidityBasedScheduler {
  constructor() {
    this.minLiquidity = 1000000000;  // 최소 거래량
    this.liquidityMultiplier = 1.5;   // 유동성 배수
  }
  
  shouldTrade(symbol, currentHour) {
    const hourlyVolume = this.getHourlyVolume(symbol, currentHour);
    const avgVolume = this.get24hAvgVolume(symbol);
    
    // 유동성 체크
    if (hourlyVolume < this.minLiquidity) {
      return { trade: false, reason: '유동성 부족' };
    }
    
    // 평균 대비 유동성
    const liquidityRatio = hourlyVolume / avgVolume;
    
    if (liquidityRatio < 0.5) {
      return { trade: false, reason: '평균 이하 유동성' };
    }
    
    if (liquidityRatio > this.liquidityMultiplier) {
      return { 
        trade: true, 
        reason: '높은 유동성',
        adjustments: {
          positionSize: 1.2,  // 포지션 20% 증가
          confidence: -5      // 신뢰도 5% 하향
        }
      };
    }
    
    return { trade: true, reason: '정상 유동성' };
  }
}
\`\`\`

## 시간대별 리스크 관리

### 변동성 조정
\`\`\`javascript
const volatilityAdjustment = {
  // 시간대별 기본 변동성
  baseVolatility: {
    '00:00-06:00': 0.8,   // 낮은 변동성
    '06:00-09:00': 1.0,   // 보통
    '09:00-11:00': 1.3,   // 아시아 오픈
    '11:00-16:00': 0.9,   // 점심 시간
    '16:00-18:00': 1.2,   // 유럽 오픈
    '18:00-21:00': 1.0,   // 전환 시간
    '21:00-24:00': 1.5    // 미국 활발
  },
  
  adjustStopLoss: function(baseStopLoss, currentHour) {
    const hourKey = this.getHourKey(currentHour);
    const multiplier = this.baseVolatility[hourKey];
    
    // 변동성 높을 때 손절선 넓게
    return baseStopLoss * multiplier;
  },
  
  adjustPositionSize: function(baseSize, currentHour) {
    const hourKey = this.getHourKey(currentHour);
    const multiplier = this.baseVolatility[hourKey];
    
    // 변동성 높을 때 포지션 축소
    return baseSize / multiplier;
  }
};
\`\`\`

### 시간대별 쿨다운
\`\`\`javascript
const timeBasedCooldown = {
  // 기본 쿨다운 (분)
  baseCooldown: 10,
  
  // 시간대별 배수
  multipliers: {
    '00:00-06:00': 2.0,   // 20분
    '06:00-09:00': 1.5,   // 15분
    '09:00-12:00': 1.0,   // 10분
    '12:00-15:00': 1.2,   // 12분
    '15:00-18:00': 1.0,   // 10분
    '18:00-21:00': 1.5,   // 15분
    '21:00-24:00': 0.8    // 8분
  },
  
  getCooldown: function(tradeResult, currentHour) {
    const hourKey = this.getHourKey(currentHour);
    const multiplier = this.multipliers[hourKey];
    
    let cooldown = this.baseCooldown * multiplier;
    
    // 손실 거래 시 추가 쿨다운
    if (tradeResult.profit < 0) {
      cooldown *= 1.5;
    }
    
    return cooldown * 60 * 1000;  // 밀리초로 변환
  }
};
\`\`\`

## 주말/공휴일 전략

### 주말 거래 설정
\`\`\`javascript
const weekendSettings = {
  enabled: true,
  
  // 주말 특별 설정
  saturday: {
    start: '00:00',
    end: '23:59',
    adjustments: {
      buyConfidence: '+10',    // 더 신중하게
      positionSize: 0.7,       // 포지션 30% 축소
      stopLoss: 1.2,          // 손절선 20% 확대
      newsWeight: 0.5         // 뉴스 영향 감소
    }
  },
  
  sunday: {
    start: '00:00',
    end: '23:59',
    adjustments: {
      buyConfidence: '+15',
      positionSize: 0.5,
      stopLoss: 1.5,
      newsWeight: 0.3
    }
  },
  
  // 월요일 오픈 전략
  mondayOpen: {
    start: '00:00',
    end: '12:00',
    strategy: 'cautious',
    gapTrading: {
      enabled: true,
      minGap: 0.03,  // 3% 이상 갭
      fadeGap: true   // 갭 반대 매매
    }
  }
};
\`\`\`

### 공휴일 처리
\`\`\`javascript
const holidayManager = {
  // 주요 공휴일 목록
  holidays: {
    global: [
      { date: '01-01', name: '신정', impact: 'medium' },
      { date: '12-25', name: '크리스마스', impact: 'high' }
    ],
    korea: [
      { date: '02-11', name: '구정', impact: 'high' },
      { date: '09-28', name: '추석', impact: 'high' }
    ],
    us: [
      { date: '07-04', name: '독립기념일', impact: 'medium' },
      { date: '11-23', name: '추수감사절', impact: 'high' }
    ]
  },
  
  getHolidayAdjustment: function(date) {
    const holiday = this.checkHoliday(date);
    
    if (!holiday) return null;
    
    switch(holiday.impact) {
      case 'high':
        return {
          tradingEnabled: false,
          reason: \`\${holiday.name} 공휴일\`
        };
      case 'medium':
        return {
          tradingEnabled: true,
          adjustments: {
            confidence: '+20',
            positionSize: 0.5
          }
        };
      default:
        return null;
    }
  }
};
\`\`\`

## 실시간 조정

### 동적 시간 전략
\`\`\`javascript
class DynamicTimeStrategy {
  constructor() {
    this.recentVolatility = {};
    this.recentVolume = {};
    this.updateInterval = 5 * 60 * 1000;  // 5분
  }
  
  updateMetrics() {
    const currentHour = new Date().getHours();
    
    // 최근 1시간 변동성과 거래량 계산
    this.recentVolatility[currentHour] = this.calculateHourlyVolatility();
    this.recentVolume[currentHour] = this.calculateHourlyVolume();
    
    // 이상 감지
    this.detectAnomalies();
  }
  
  detectAnomalies() {
    const current = this.recentVolatility[new Date().getHours()];
    const avg = this.getAverageVolatility();
    
    if (current > avg * 2) {
      // 비정상적 변동성
      this.applyEmergencySettings({
        tradingPause: 30,  // 30분 중단
        reason: '비정상적 변동성 감지'
      });
    }
  }
  
  getOptimalSettings(symbol) {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // 기본 설정
    let settings = this.baseSettings[symbol];
    
    // 시간대 조정
    settings = this.applyHourlyAdjustment(settings, hour);
    
    // 요일 조정
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      settings = this.applyWeekendAdjustment(settings);
    }
    
    // 실시간 메트릭 반영
    settings = this.applyRealtimeAdjustment(settings);
    
    return settings;
  }
}
\`\`\`

## 시간 전략 백테스트

### 시간대별 성과 분석
\`\`\`javascript
function analyzeTimePerformance(trades) {
  const hourlyStats = {};
  
  // 시간대별 통계 초기화
  for (let h = 0; h < 24; h++) {
    hourlyStats[h] = {
      trades: 0,
      wins: 0,
      totalProfit: 0,
      avgProfit: 0
    };
  }
  
  // 거래 분석
  trades.forEach(trade => {
    const hour = new Date(trade.timestamp).getHours();
    hourlyStats[hour].trades++;
    
    if (trade.profit > 0) {
      hourlyStats[hour].wins++;
    }
    
    hourlyStats[hour].totalProfit += trade.profit;
  });
  
  // 평균 계산 및 최적 시간대 찾기
  let bestHour = 0;
  let bestProfit = 0;
  
  for (let h = 0; h < 24; h++) {
    if (hourlyStats[h].trades > 0) {
      hourlyStats[h].avgProfit = hourlyStats[h].totalProfit / hourlyStats[h].trades;
      hourlyStats[h].winRate = hourlyStats[h].wins / hourlyStats[h].trades;
      
      if (hourlyStats[h].avgProfit > bestProfit) {
        bestProfit = hourlyStats[h].avgProfit;
        bestHour = h;
      }
    }
  }
  
  return {
    hourlyStats,
    bestTradingHour: bestHour,
    recommendations: generateTimeRecommendations(hourlyStats)
  };
}
\`\`\`

## 실전 팁

### 시간대 설정 가이드
1. **처음 시작**: 24시간 거래로 데이터 수집
2. **1주 후**: 시간대별 성과 분석
3. **2주 후**: 최적 시간대 선정
4. **1개월 후**: 세밀한 조정

### 주의사항
- 서머타임 변경 고려
- 주요 이벤트 일정 확인
- 시장 구조 변화 모니터링

<div class="info">
💡 **팁**: 본인의 생활 패턴과 모니터링 가능 시간도 고려하여 거래 시간을 설정하세요.
</div>

<div class="warning">
⚠️ **주의**: 유동성이 낮은 시간대의 거래는 슬리피지가 클 수 있습니다.
</div>
    `,
  },
  'coin-settings.volatility': {
    title: '변동성 자동 조정',
    content: `
# 변동성 자동 조정

## 변동성이란?

변동성(Volatility)은 가격의 변화 정도를 나타내는 지표입니다. 높은 변동성은 큰 수익 기회와 동시에 큰 위험을 의미합니다.

## 변동성 측정

### ATR (Average True Range)
\`\`\`javascript
function calculateATR(candles, period = 14) {
  const trueRanges = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i-1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  // 이동평균 계산
  const atr = trueRanges.slice(-period)
    .reduce((sum, tr) => sum + tr, 0) / period;
  
  // 변동성 비율로 변환
  const volatilityRatio = atr / candles[candles.length-1].close;
  
  return {
    atr: atr,
    volatilityPercent: volatilityRatio * 100
  };
}
\`\`\`

### 표준편차 기반
\`\`\`javascript
function calculateVolatility(prices, period = 20) {
  // 수익률 계산
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  // 평균 수익률
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  // 표준편차
  const variance = returns.reduce((sum, ret) => {
    return sum + Math.pow(ret - avgReturn, 2);
  }, 0) / returns.length;
  
  const stdDev = Math.sqrt(variance);
  
  // 연율화 (365일 기준)
  const annualizedVol = stdDev * Math.sqrt(365);
  
  return {
    daily: stdDev * 100,
    annualized: annualizedVol * 100
  };
}
\`\`\`

## 자동 조정 시스템

### 기본 조정 규칙
\`\`\`javascript
class VolatilityAdjuster {
  constructor() {
    this.baseSettings = {
      stopLoss: 0.05,        // 5%
      takeProfit: 0.10,      // 10%
      positionSize: 0.1,     // 10%
      confidence: 70         // 70%
    };
    
    this.volatilityLevels = {
      veryLow: { max: 0.01, multiplier: 1.5 },
      low: { max: 0.02, multiplier: 1.2 },
      normal: { max: 0.04, multiplier: 1.0 },
      high: { max: 0.08, multiplier: 0.8 },
      veryHigh: { max: Infinity, multiplier: 0.5 }
    };
  }
  
  adjustSettings(currentVolatility) {
    const level = this.getVolatilityLevel(currentVolatility);
    const multiplier = level.multiplier;
    
    return {
      stopLoss: this.baseSettings.stopLoss * multiplier,
      takeProfit: this.baseSettings.takeProfit * multiplier,
      positionSize: this.baseSettings.positionSize / multiplier,
      confidence: this.baseSettings.confidence + (1 - multiplier) * 20
    };
  }
  
  getVolatilityLevel(volatility) {
    for (const [name, level] of Object.entries(this.volatilityLevels)) {
      if (volatility <= level.max) {
        return { name, ...level };
      }
    }
  }
}
\`\`\`

### 동적 손절/익절
\`\`\`javascript
class DynamicStopLoss {
  constructor() {
    this.minStop = 0.02;      // 최소 2%
    this.maxStop = 0.15;      // 최대 15%
    this.targetRatio = 2;     // Risk:Reward = 1:2
  }
  
  calculate(atr, currentPrice) {
    // ATR 기반 손절
    const atrStop = currentPrice - (atr * 2);
    const atrStopPercent = (currentPrice - atrStop) / currentPrice;
    
    // 범위 제한
    const stopPercent = Math.max(
      this.minStop,
      Math.min(this.maxStop, atrStopPercent)
    );
    
    // 익절 계산 (R:R 비율)
    const takeProfitPercent = stopPercent * this.targetRatio;
    
    return {
      stopLoss: stopPercent,
      takeProfit: takeProfitPercent,
      stopPrice: currentPrice * (1 - stopPercent),
      profitPrice: currentPrice * (1 + takeProfitPercent)
    };
  }
}
\`\`\`

### 포지션 크기 조정
\`\`\`javascript
class VolatilityPositionSizer {
  constructor(riskPerTrade = 0.02) {
    this.riskPerTrade = riskPerTrade;  // 2% 리스크
    this.minPosition = 0.02;           // 최소 2%
    this.maxPosition = 0.20;           // 최대 20%
  }
  
  calculatePosition(balance, volatility, stopLoss) {
    // 목표 변동성 (연 20%)
    const targetVolatility = 0.20;
    
    // 변동성 조정 계수
    const volAdjustment = targetVolatility / volatility;
    
    // 리스크 기반 포지션
    const riskAmount = balance * this.riskPerTrade;
    const basePosition = riskAmount / (stopLoss * balance);
    
    // 변동성 조정 적용
    const adjustedPosition = basePosition * volAdjustment;
    
    // 범위 제한
    return Math.max(
      this.minPosition,
      Math.min(this.maxPosition, adjustedPosition)
    );
  }
}

// 사용 예시
const sizer = new VolatilityPositionSizer();
const balance = 10000000;  // 1000만원
const volatility = 0.40;   // 연 40%
const stopLoss = 0.05;     // 5%

const position = sizer.calculatePosition(balance, volatility, stopLoss);
// position = 0.05 (5%, 변동성이 높아 포지션 축소)
\`\`\`

## 변동성 기반 전략

### 변동성 돌파 전략
\`\`\`javascript
const volatilityBreakout = {
  // 전일 변동폭의 K배 돌파 시 매수
  k: 0.5,
  
  checkSignal: function(current, previous) {
    const range = previous.high - previous.low;
    const breakoutPrice = current.open + (range * this.k);
    
    if (current.price > breakoutPrice) {
      return {
        signal: 'BUY',
        confidence: 80,
        stopLoss: current.open - (range * 0.5),
        takeProfit: current.open + (range * 2)
      };
    }
    
    return null;
  }
};
\`\`\`

### 변동성 평균회귀
\`\`\`javascript
class VolatilityMeanReversion {
  constructor() {
    this.lookback = 20;
    this.threshold = 2;  // 2 표준편차
  }
  
  analyze(volatilityHistory) {
    const mean = this.calculateMean(volatilityHistory);
    const stdDev = this.calculateStdDev(volatilityHistory, mean);
    const current = volatilityHistory[volatilityHistory.length - 1];
    
    const zScore = (current - mean) / stdDev;
    
    if (zScore > this.threshold) {
      // 변동성 과대 - 조만간 감소 예상
      return {
        prediction: 'decrease',
        confidence: Math.min(95, 50 + zScore * 10),
        strategy: {
          action: 'reducePosition',
          waitForStability: true
        }
      };
    } else if (zScore < -this.threshold) {
      // 변동성 과소 - 조만간 증가 예상
      return {
        prediction: 'increase',
        confidence: Math.min(95, 50 + Math.abs(zScore) * 10),
        strategy: {
          action: 'prepareForVolatility',
          adjustStopLoss: true
        }
      };
    }
    
    return { prediction: 'stable' };
  }
}
\`\`\`

## 코인별 변동성 프로파일

### 변동성 분류
\`\`\`javascript
const volatilityProfiles = {
  'BTC': {
    category: 'medium',
    avgDaily: 0.03,      // 3%
    avgAnnual: 0.60,     // 60%
    spikeProbability: 0.15,
    calmPeriods: ['13:00-16:00', '03:00-07:00']
  },
  
  'ETH': {
    category: 'medium-high',
    avgDaily: 0.04,      // 4%
    avgAnnual: 0.80,     // 80%
    spikeProbability: 0.20,
    calmPeriods: ['14:00-17:00', '04:00-08:00']
  },
  
  'DOGE': {
    category: 'very-high',
    avgDaily: 0.08,      // 8%
    avgAnnual: 1.50,     // 150%
    spikeProbability: 0.35,
    calmPeriods: ['05:00-09:00']
  }
};

// 프로파일 기반 자동 설정
function getVolatilitySettings(symbol) {
  const profile = volatilityProfiles[symbol];
  
  switch(profile.category) {
    case 'low':
      return {
        positionSize: 0.20,
        stopLoss: 0.03,
        confidence: 65
      };
    case 'medium':
      return {
        positionSize: 0.10,
        stopLoss: 0.05,
        confidence: 70
      };
    case 'high':
      return {
        positionSize: 0.05,
        stopLoss: 0.08,
        confidence: 75
      };
    case 'very-high':
      return {
        positionSize: 0.03,
        stopLoss: 0.10,
        confidence: 80
      };
  }
}
\`\`\`

## 변동성 알림 시스템

### 이상 변동성 감지
\`\`\`javascript
class VolatilityAlert {
  constructor() {
    this.normalRange = { min: 0.01, max: 0.05 };
    this.alertThresholds = {
      warning: 1.5,     // 평소의 1.5배
      critical: 2.0,    // 평소의 2배
      extreme: 3.0      // 평소의 3배
    };
  }
  
  checkVolatility(current, historical) {
    const avgVol = this.calculateAverage(historical);
    const ratio = current / avgVol;
    
    if (ratio >= this.alertThresholds.extreme) {
      return {
        level: 'EXTREME',
        message: '극단적 변동성! 거래 중단 권장',
        action: 'stopTrading',
        duration: 3600000  // 1시간
      };
    } else if (ratio >= this.alertThresholds.critical) {
      return {
        level: 'CRITICAL',
        message: '높은 변동성 주의',
        action: 'reducePosition',
        adjustment: 0.3   // 포지션 70% 축소
      };
    } else if (ratio >= this.alertThresholds.warning) {
      return {
        level: 'WARNING',
        message: '변동성 증가 감지',
        action: 'tightenStopLoss',
        adjustment: 0.8   // 손절선 20% 축소
      };
    }
    
    return null;
  }
}
\`\`\`

## 실전 활용

### 변동성 사이클 트레이딩
\`\`\`javascript
const volatilityCycleTrading = {
  // 변동성 확대기
  expansion: {
    indicators: ['볼린저밴드 확대', 'ATR 상승'],
    strategy: {
      positionSize: 'reduce',
      stopLoss: 'widen',
      takeProfit: 'extend',
      tradingFrequency: 'decrease'
    }
  },
  
  // 변동성 축소기
  contraction: {
    indicators: ['볼린저밴드 수축', 'ATR 하락'],
    strategy: {
      positionSize: 'increase',
      stopLoss: 'tighten',
      takeProfit: 'shorten',
      tradingFrequency: 'increase'
    }
  },
  
  // 전환 신호
  transition: {
    fromLowToHigh: ['거래량 급증', '뉴스 이벤트'],
    fromHighToLow: ['거래량 감소', '가격 안정화']
  }
};
\`\`\`

### 백테스트 검증
\`\`\`javascript
async function backtestVolatilityStrategy(data) {
  const results = {
    fixed: await runBacktest(data, { adjustForVolatility: false }),
    dynamic: await runBacktest(data, { adjustForVolatility: true })
  };
  
  return {
    improvement: {
      returns: (results.dynamic.totalReturn - results.fixed.totalReturn) / results.fixed.totalReturn,
      sharpe: (results.dynamic.sharpeRatio - results.fixed.sharpeRatio) / results.fixed.sharpeRatio,
      maxDrawdown: (results.fixed.maxDrawdown - results.dynamic.maxDrawdown) / results.fixed.maxDrawdown
    },
    statistics: {
      fixed: results.fixed,
      dynamic: results.dynamic
    }
  };
}
\`\`\`

## 주의사항

### 과도한 조정 방지
- 너무 민감한 반응 금지
- 최소 조정 간격 설정 (예: 1시간)
- 평활화(Smoothing) 적용

### 극단적 상황 대비
- 플래시 크래시
- 뉴스 이벤트
- 시스템 오류

<div class="success">
✅ **핵심**: 변동성은 적이 아닌 기회입니다. 적절히 관리하면 수익의 원천이 됩니다.
</div>

<div class="warning">
⚠️ **경고**: 변동성이 극도로 높을 때는 거래를 중단하는 것이 최선일 수 있습니다.
</div>
    `,
  },
  // 자동매매 작동 원리 섹션
  'auto-trading': {
    title: '자동매매 작동 원리',
    content: `
# 자동매매 작동 원리

## 시스템 개요

자동매매 시스템은 24시간 시장을 모니터링하며, 설정된 전략에 따라 자동으로 매수/매도를 실행합니다.

## 작동 프로세스

### 전체 흐름
\`\`\`
1. 시장 데이터 수집 (1초 간격)
   ↓
2. 기술적 지표 계산
   ↓
3. AI 분석 (선택적)
   ↓
4. 신뢰도 계산
   ↓
5. 매매 신호 생성
   ↓
6. 리스크 체크
   ↓
7. 주문 실행
   ↓
8. 결과 모니터링
   ↓
9. 학습 및 개선
\`\`\`

각 단계는 독립적으로 작동하며, 오류 발생 시 안전하게 처리됩니다.
    `,
  },
};