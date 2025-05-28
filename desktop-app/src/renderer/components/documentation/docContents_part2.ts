export const docContentsPart2 = {
  'trading-strategy.buy-sell-conditions': {
    title: '매수/매도 조건',
    content: `
# 매수/매도 조건

## 매수 조건 설정

### 기본 매수 조건
매수는 다음 조건이 모두 충족될 때 실행됩니다:

1. **신뢰도 조건**
   - 종합 신뢰도 ≥ 설정된 임계값
   - 예: 신뢰도 75% 이상

2. **기술적 지표 조건**
   - RSI < 30 (과매도)
   - MACD 골든크로스
   - 볼린저밴드 하단 터치
   - 거래량 증가

3. **리스크 관리 조건**
   - 현금 잔고 충분
   - 일일 거래 한도 미달
   - 쿨다운 시간 경과

### 고급 매수 전략

#### 분할 매수
\`\`\`javascript
// 3분할 매수 예시
const buyStrategy = {
  splits: 3,
  conditions: [
    { confidence: 70, ratio: 0.3 },  // 30% 매수
    { confidence: 80, ratio: 0.3 },  // 추가 30%
    { confidence: 90, ratio: 0.4 }   // 나머지 40%
  ]
};
\`\`\`

#### 추세 추종 매수
\`\`\`
조건:
- 20일 MA > 60일 MA (상승 추세)
- RSI > 50 (모멘텀 확인)
- 직전 저점 > 이전 저점 (고점 상승)
\`\`\`

#### 반전 매수
\`\`\`
조건:
- RSI < 20 (극단적 과매도)
- 긍정적 다이버전스
- 거래량 스파이크
- 지지선 근처
\`\`\`

## 매도 조건 설정

### 기본 매도 조건

1. **수익 실현**
   - 목표 수익률 도달
   - 예: +10% 익절

2. **손실 제한**
   - 손절선 도달
   - 예: -5% 손절

3. **기술적 신호**
   - RSI > 70 (과매수)
   - MACD 데드크로스
   - 볼린저밴드 상단 터치

### 고급 매도 전략

#### 트레일링 스탑
\`\`\`javascript
const trailingStop = {
  activation: 0.05,      // 5% 수익 시 활성화
  trailDistance: 0.03,   // 최고점에서 3% 하락 시 매도
  minProfit: 0.02       // 최소 2% 수익 보장
};
\`\`\`

#### 분할 매도
\`\`\`javascript
const sellStrategy = {
  targets: [
    { profit: 0.05, ratio: 0.3 },  // 5% 수익 시 30% 매도
    { profit: 0.10, ratio: 0.3 },  // 10% 수익 시 30% 매도
    { profit: 0.15, ratio: 0.4 }   // 15% 수익 시 40% 매도
  ]
};
\`\`\`

#### 시간 기반 매도
\`\`\`
조건:
- 보유 기간 > 설정 기간
- 수익률 > 최소 수익률
- 예: 3일 보유 + 2% 이상 수익
\`\`\`

## 조건 조합 전략

### AND 조건 (모두 충족)
\`\`\`javascript
const buyCondition = {
  type: "AND",
  conditions: [
    { indicator: "RSI", operator: "<", value: 30 },
    { indicator: "MACD", signal: "golden_cross" },
    { indicator: "Volume", operator: ">", value: "avg_1.5x" }
  ]
};
\`\`\`

### OR 조건 (하나만 충족)
\`\`\`javascript
const sellCondition = {
  type: "OR",
  conditions: [
    { indicator: "Profit", operator: ">", value: 0.1 },
    { indicator: "Loss", operator: ">", value: 0.05 },
    { indicator: "RSI", operator: ">", value: 80 }
  ]
};
\`\`\`

### 복합 조건
\`\`\`javascript
const complexCondition = {
  type: "AND",
  conditions: [
    {
      type: "OR",
      conditions: [
        { indicator: "RSI", operator: "<", value: 25 },
        { indicator: "BB", signal: "lower_touch" }
      ]
    },
    { indicator: "Volume", operator: ">", value: "avg_2x" }
  ]
};
\`\`\`

## 시장 상황별 조건

### 상승장 조건
\`\`\`
매수:
- RSI 40-60 구간 진입
- 이평선 지지 확인
- 거래량 평균 이상

매도:
- RSI > 80
- 목표 수익 도달
- 거래량 감소
\`\`\`

### 하락장 조건
\`\`\`
매수:
- RSI < 20 (극단적 과매도)
- 주요 지지선 터치
- 매도 거래량 감소

매도:
- 반등 저항선 도달
- 손절선 엄격 적용
- 빠른 수익 실현
\`\`\`

### 횡보장 조건
\`\`\`
매수:
- 박스 하단 지지
- RSI 30-40
- 거래량 증가

매도:
- 박스 상단 저항
- RSI 60-70
- 단기 수익 실현
\`\`\`

## 조건 최적화

### 백테스트 기반 최적화
1. 과거 데이터로 조건 테스트
2. 승률과 수익률 분석
3. 최적 파라미터 도출
4. 실전 적용 및 모니터링

### 머신러닝 최적화
\`\`\`python
# 조건 최적화 예시
def optimize_conditions(historical_data):
    best_params = {
        'rsi_buy': 30,
        'rsi_sell': 70,
        'profit_target': 0.1,
        'stop_loss': 0.05
    }
    
    for rsi_buy in range(20, 40, 5):
        for rsi_sell in range(60, 80, 5):
            performance = backtest(
                data=historical_data,
                rsi_buy=rsi_buy,
                rsi_sell=rsi_sell
            )
            if performance > best_performance:
                best_params['rsi_buy'] = rsi_buy
                best_params['rsi_sell'] = rsi_sell
    
    return best_params
\`\`\`

## 주의사항

### 과최적화 방지
- 너무 많은 조건 추가 금지
- 단순하고 명확한 규칙 선호
- 다양한 시장 상황 테스트

### 예외 상황 대비
- 급격한 시장 변동
- 시스템 오류
- 유동성 부족

<div class="info">
💡 **팁**: 처음에는 단순한 조건으로 시작하고, 경험을 바탕으로 점진적으로 복잡도를 높이세요.
</div>

<div class="warning">
⚠️ **주의**: 모든 조건이 완벽하게 충족되기를 기다리면 기회를 놓칠 수 있습니다. 적절한 균형이 중요합니다.
</div>
    `,
  },
  'trading-strategy.confidence-threshold': {
    title: '신뢰도 임계값',
    content: `
# 신뢰도 임계값

## 신뢰도 임계값이란?

신뢰도 임계값은 매매 신호를 실행하기 위한 최소 신뢰도 수준입니다. 이 값을 적절히 설정하는 것이 성공적인 자동매매의 핵심입니다.

## 임계값 설정 가이드

### 기본 권장값

| 거래 스타일 | 매수 임계값 | 매도 임계값 | 설명 |
|------------|------------|------------|------|
| 매우 보수적 | 85% | 90% | 확실한 신호만 거래 |
| 보수적 | 75% | 80% | 안정성 우선 |
| 균형 | 70% | 75% | 일반적 추천값 |
| 공격적 | 65% | 70% | 더 많은 기회 포착 |
| 매우 공격적 | 60% | 65% | 높은 거래 빈도 |

### 시장 상황별 조정

#### 변동성 높은 시장
\`\`\`
특징:
- 급격한 가격 변동
- 거짓 신호 많음
- 위험도 높음

권장 조정:
- 임계값 +5~10% 상향
- 매수: 75% → 80-85%
- 매도: 80% → 85-90%
\`\`\`

#### 안정적인 시장
\`\`\`
특징:
- 완만한 가격 변동
- 신뢰할 수 있는 신호
- 위험도 낮음

권장 조정:
- 임계값 -5% 하향 가능
- 매수: 70% → 65%
- 매도: 75% → 70%
\`\`\`

## 신뢰도 계산 이해

### 신뢰도 구성 요소
\`\`\`javascript
// 신뢰도 계산 예시
const calculateConfidence = (signals) => {
  const weights = {
    rsi: 0.15,
    macd: 0.20,
    bb: 0.15,
    ma: 0.25,
    volume: 0.10,
    ai: 0.15
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const [indicator, weight] of Object.entries(weights)) {
    if (signals[indicator]) {
      weightedSum += signals[indicator].strength * weight;
      totalWeight += weight;
    }
  }
  
  return (weightedSum / totalWeight) * 100;
};
\`\`\`

### 신호 강도 해석
- 90-100%: 매우 강한 신호
- 80-89%: 강한 신호
- 70-79%: 보통 신호
- 60-69%: 약한 신호
- 60% 미만: 무시할 만한 신호

## 임계값 최적화

### 1단계: 초기 설정
\`\`\`
1. 보수적 값으로 시작 (매수 75%, 매도 80%)
2. 최소 1주일 운영
3. 결과 데이터 수집
\`\`\`

### 2단계: 성과 분석
\`\`\`javascript
// 임계값별 성과 분석
const analyzeThresholdPerformance = (trades) => {
  const thresholdGroups = {
    '60-70': [],
    '70-80': [],
    '80-90': [],
    '90-100': []
  };
  
  trades.forEach(trade => {
    const group = Math.floor(trade.confidence / 10) * 10;
    thresholdGroups[\`\${group}-\${group + 10}\`].push(trade);
  });
  
  // 각 그룹별 승률과 수익률 계산
  for (const [range, trades] of Object.entries(thresholdGroups)) {
    const winRate = calculateWinRate(trades);
    const avgReturn = calculateAvgReturn(trades);
    console.log(\`\${range}%: 승률 \${winRate}%, 평균수익 \${avgReturn}%\`);
  }
};
\`\`\`

### 3단계: 조정
\`\`\`
분석 결과에 따른 조정:

높은 승률, 낮은 거래 횟수:
→ 임계값 5% 하향

낮은 승률, 높은 거래 횟수:
→ 임계값 5% 상향

적절한 승률과 거래 횟수:
→ 현재 값 유지
\`\`\`

## 동적 임계값 전략

### 시간대별 조정
\`\`\`javascript
const getDynamicThreshold = (hour) => {
  // 한국 시간 기준
  if (hour >= 9 && hour <= 16) {
    // 주간: 아시아 시장 활발
    return { buy: 70, sell: 75 };
  } else if (hour >= 22 || hour <= 6) {
    // 야간: 미국 시장 활발
    return { buy: 75, sell: 80 };
  } else {
    // 전환 시간: 보수적
    return { buy: 80, sell: 85 };
  }
};
\`\`\`

### 변동성 기반 조정
\`\`\`javascript
const getVolatilityAdjustedThreshold = (volatility, baseThreshold) => {
  // 변동성이 높을수록 임계값 상향
  const adjustment = Math.min(volatility * 0.5, 15);
  return baseThreshold + adjustment;
};
\`\`\`

### 성과 기반 자동 조정
\`\`\`javascript
class AdaptiveThreshold {
  constructor(initialThreshold) {
    this.threshold = initialThreshold;
    this.recentTrades = [];
    this.adjustmentPeriod = 100; // 100거래마다 조정
  }
  
  addTrade(trade) {
    this.recentTrades.push(trade);
    
    if (this.recentTrades.length >= this.adjustmentPeriod) {
      this.adjustThreshold();
      this.recentTrades = [];
    }
  }
  
  adjustThreshold() {
    const winRate = this.calculateWinRate();
    
    if (winRate > 0.7 && this.threshold > 65) {
      // 승률 높으면 임계값 낮춰서 더 많은 거래
      this.threshold -= 2;
    } else if (winRate < 0.5 && this.threshold < 85) {
      // 승률 낮으면 임계값 높여서 신중하게
      this.threshold += 2;
    }
  }
}
\`\`\`

## 코인별 임계값 설정

### 대형 코인 (BTC, ETH)
\`\`\`
특징:
- 상대적으로 안정적
- 기관 투자자 영향
- 기술적 분석 신뢰도 높음

권장 임계값:
- 매수: 65-70%
- 매도: 70-75%
\`\`\`

### 중형 코인
\`\`\`
특징:
- 중간 변동성
- 뉴스 영향 큼
- 펌핑 가능성

권장 임계값:
- 매수: 70-75%
- 매도: 75-80%
\`\`\`

### 소형 코인
\`\`\`
특징:
- 높은 변동성
- 조작 가능성
- 유동성 낮음

권장 임계값:
- 매수: 80-85%
- 매도: 85-90%
\`\`\`

## 실전 팁

### 단계적 접근
1. 높은 임계값으로 시작 (80% 이상)
2. 성과 확인 후 5%씩 하향
3. 최적점 찾기
4. 지속적 모니터링

### 리스크 관리
- 임계값을 너무 낮추지 않기
- 손절 조건은 항상 엄격하게
- 시장 상황 변화 시 즉시 조정

### 기록 관리
\`\`\`
임계값 변경 기록:
- 날짜: 2024-01-15
- 변경 전: 매수 75%, 매도 80%
- 변경 후: 매수 70%, 매도 75%
- 이유: 최근 2주간 승률 68%, 거래 횟수 부족
- 결과: (추후 기록)
\`\`\`

<div class="success">
✅ **베스트 프랙티스**: 임계값은 고정된 것이 아닙니다. 시장과 성과에 따라 지속적으로 조정하세요.
</div>

<div class="warning">
⚠️ **주의**: 임계값을 너무 자주 변경하면 일관성이 떨어집니다. 최소 1주일은 유지하고 평가하세요.
</div>
    `,
  },
  'trading-strategy.cooldown': {
    title: '쿨다운 시간 설정',
    content: `
# 쿨다운 시간 설정

## 쿨다운이란?

쿨다운은 거래 후 다음 거래까지 대기하는 최소 시간입니다. 감정적 거래와 과도한 거래를 방지하는 중요한 안전장치입니다.

## 쿨다운의 필요성

### 1. 감정적 거래 방지
- 손실 후 즉시 복구 시도 방지
- FOMO(Fear of Missing Out) 억제
- 침착한 판단 시간 확보

### 2. 시장 안정화 대기
- 거래 후 가격 안정화
- 호가 스프레드 정상화
- 거래량 회복

### 3. 수수료 절감
- 과도한 거래로 인한 수수료 누적 방지
- 효율적인 자금 운용

## 쿨다운 종류

### 1. 매수 후 쿨다운
\`\`\`javascript
const buyCooldown = {
  duration: 300,  // 5분
  type: 'after_buy',
  applyTo: ['same_coin', 'all_coins'],
  
  conditions: {
    // 수익 중일 때는 쿨다운 단축
    profitable: {
      duration: 180  // 3분
    },
    // 손실 중일 때는 쿨다운 연장
    loss: {
      duration: 600  // 10분
    }
  }
};
\`\`\`

### 2. 매도 후 쿨다운
\`\`\`javascript
const sellCooldown = {
  duration: 600,  // 10분
  type: 'after_sell',
  
  conditions: {
    // 익절 후
    takeProfit: {
      duration: 300  // 5분
    },
    // 손절 후
    stopLoss: {
      duration: 1800  // 30분
    }
  }
};
\`\`\`

### 3. 연속 손실 쿨다운
\`\`\`javascript
const consecutiveLossCooldown = {
  enabled: true,
  baseTime: 600,  // 기본 10분
  
  // 연속 손실 횟수에 따라 증가
  multiplier: {
    1: 1.0,   // 1회: 10분
    2: 2.0,   // 2회: 20분
    3: 3.0,   // 3회: 30분
    4: 6.0    // 4회: 60분
  },
  
  maxCooldown: 3600  // 최대 1시간
};
\`\`\`

## 쿨다운 설정 가이드

### 거래 스타일별 권장값

| 스타일 | 매수 후 | 매도 후 | 손절 후 | 설명 |
|--------|---------|---------|---------|------|
| 스캘핑 | 1-3분 | 3-5분 | 10-15분 | 빠른 회전 |
| 데이트레이딩 | 5-10분 | 10-15분 | 20-30분 | 균형잡힌 접근 |
| 스윙 | 15-30분 | 30-60분 | 60-120분 | 신중한 접근 |
| 장기투자 | 60분+ | 120분+ | 240분+ | 매우 신중 |

### 시장 상황별 조정

#### 높은 변동성 시장
\`\`\`
특징:
- 급격한 가격 변동
- 높은 거래량
- 뉴스 영향

권장 설정:
- 기본 쿨다운 × 1.5
- 손절 후 쿨다운 × 2
- 최대 쿨다운 설정
\`\`\`

#### 안정적 시장
\`\`\`
특징:
- 완만한 가격 변동
- 정상 거래량
- 예측 가능한 패턴

권장 설정:
- 기본 쿨다운 유지
- 수익 시 단축 허용
- 유연한 적용
\`\`\`

## 고급 쿨다운 전략

### 1. 동적 쿨다운
\`\`\`javascript
class DynamicCooldown {
  calculateCooldown(trade, market) {
    let baseCooldown = 300; // 5분 기본값
    
    // 거래 결과에 따른 조정
    if (trade.profit < -0.03) {
      baseCooldown *= 3;  // 3% 이상 손실 시 3배
    } else if (trade.profit > 0.05) {
      baseCooldown *= 0.5;  // 5% 이상 수익 시 절반
    }
    
    // 변동성에 따른 조정
    const volatilityMultiplier = 1 + (market.volatility - 0.02) * 10;
    baseCooldown *= volatilityMultiplier;
    
    // 시간대별 조정
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      baseCooldown *= 1.2;  // 야간 20% 증가
    }
    
    return Math.min(baseCooldown, 3600); // 최대 1시간
  }
}
\`\`\`

### 2. 코인별 쿨다운
\`\`\`javascript
const coinSpecificCooldown = {
  'BTC': {
    buy: 300,   // 5분
    sell: 600,  // 10분
    loss: 1200  // 20분
  },
  'ETH': {
    buy: 240,   // 4분
    sell: 480,  // 8분
    loss: 900   // 15분
  },
  'ALT': {  // 알트코인 기본값
    buy: 600,   // 10분
    sell: 1200, // 20분
    loss: 2400  // 40분
  }
};
\`\`\`

### 3. 패턴 기반 쿨다운
\`\`\`javascript
const patternBasedCooldown = {
  // 특정 패턴 발생 시 쿨다운 조정
  patterns: {
    'double_top': {
      cooldown: 1800,  // 30분
      description: '더블탑 패턴 후 시장 방향 확인'
    },
    'support_break': {
      cooldown: 2400,  // 40분
      description: '지지선 붕괴 후 안정화 대기'
    },
    'volume_spike': {
      cooldown: 900,   // 15분
      description: '거래량 급증 후 진정 대기'
    }
  }
};
\`\`\`

## 쿨다운 우회 조건

### 긴급 상황
\`\`\`javascript
const emergencyOverride = {
  enabled: true,
  conditions: [
    {
      type: 'stop_loss_critical',
      threshold: -0.08,  // 8% 이상 손실 위험
      action: 'immediate_sell'
    },
    {
      type: 'take_profit_opportunity',
      threshold: 0.15,   // 15% 이상 수익 기회
      confidence: 90,    // 90% 이상 신뢰도
      action: 'allow_trade'
    }
  ]
};
\`\`\`

### 쿨다운 스킵 조건
1. 시스템 오류 복구
2. 긴급 손절 필요
3. 극단적 시장 상황
4. 수동 개입

## 쿨다운 모니터링

### 효과성 측정
\`\`\`javascript
const analyzeCooldownEffectiveness = (trades) => {
  const metrics = {
    avgTimeBetweenTrades: 0,
    profitabilityByCooldown: {},
    overtradeInstances: 0
  };
  
  // 쿨다운 시간별 수익률 분석
  trades.forEach((trade, index) => {
    if (index > 0) {
      const cooldownTime = trade.timestamp - trades[index-1].timestamp;
      const bucket = Math.floor(cooldownTime / 300) * 300; // 5분 단위
      
      if (!metrics.profitabilityByCooldown[bucket]) {
        metrics.profitabilityByCooldown[bucket] = [];
      }
      
      metrics.profitabilityByCooldown[bucket].push(trade.profit);
    }
  });
  
  return metrics;
};
\`\`\`

### 최적화 지표
- 평균 거래 간격
- 쿨다운별 승률
- 수익률 대비 거래 횟수
- 연속 손실 빈도

## 실전 팁

### 초보자 권장 설정
\`\`\`
매수 후: 10분
매도 후: 15분
손절 후: 30분
연속 손실: 누적 적용

이유: 충분한 시간을 두고 시장 관찰
\`\`\`

### 점진적 조정
1. 보수적 설정으로 시작
2. 1주일 단위로 평가
3. 5분 단위로 조정
4. 최소값 찾기

### 예외 상황 대비
- 시스템 다운 시 쿨다운 리셋
- 수동 거래 시 쿨다운 적용 여부
- 뉴스 이벤트 시 쿨다운 연장

<div class="info">
💡 **팁**: 쿨다운은 수익을 지키는 방패입니다. 조급함은 손실의 지름길입니다.
</div>

<div class="warning">
⚠️ **주의**: 쿨다운을 너무 짧게 설정하면 과도한 거래로 수수료만 늘어납니다.
</div>
    `,
  },
  'trading-strategy.stop-loss-take-profit': {
    title: '손절/익절 전략',
    content: `
# 손절/익절 전략

## 손절매 (Stop Loss)

### 손절매의 중요성
손절매는 자본을 보호하는 가장 중요한 도구입니다. 작은 손실을 받아들여 큰 손실을 방지합니다.

### 손절매 설정 방법

#### 1. 고정 비율 손절
\`\`\`javascript
const fixedStopLoss = {
  type: 'fixed_percentage',
  value: 0.05,  // 5% 손실 시 손절
  
  calculate: (entryPrice) => {
    return entryPrice * (1 - 0.05);
  }
};
\`\`\`

#### 2. ATR 기반 손절
\`\`\`javascript
const atrStopLoss = {
  type: 'atr_based',
  multiplier: 2,  // ATR의 2배
  
  calculate: (entryPrice, atr) => {
    return entryPrice - (atr * 2);
  }
};
\`\`\`

#### 3. 지지선 기반 손절
\`\`\`javascript
const supportStopLoss = {
  type: 'support_based',
  buffer: 0.02,  // 지지선 아래 2%
  
  calculate: (supportLevel) => {
    return supportLevel * (1 - 0.02);
  }
};
\`\`\`

### 트레일링 스탑
\`\`\`javascript
class TrailingStop {
  constructor(initialStop, trailDistance) {
    this.currentStop = initialStop;
    this.trailDistance = trailDistance;
    this.highestPrice = 0;
  }
  
  update(currentPrice) {
    // 신고가 갱신
    if (currentPrice > this.highestPrice) {
      this.highestPrice = currentPrice;
      
      // 스탑 라인 상향 조정
      const newStop = this.highestPrice * (1 - this.trailDistance);
      if (newStop > this.currentStop) {
        this.currentStop = newStop;
      }
    }
    
    // 손절 체크
    return currentPrice <= this.currentStop;
  }
}
\`\`\`

## 익절매 (Take Profit)

### 익절매 전략

#### 1. 목표 수익률 익절
\`\`\`javascript
const targetTakeProfit = {
  targets: [
    { ratio: 0.05, sellRatio: 0.3 },  // 5% 수익 시 30% 매도
    { ratio: 0.10, sellRatio: 0.3 },  // 10% 수익 시 30% 매도
    { ratio: 0.15, sellRatio: 0.4 }   // 15% 수익 시 40% 매도
  ],
  
  checkTargets: (entryPrice, currentPrice, position) => {
    const profitRatio = (currentPrice - entryPrice) / entryPrice;
    
    for (const target of this.targets) {
      if (profitRatio >= target.ratio && !target.executed) {
        // 부분 익절 실행
        executeSell(position * target.sellRatio);
        target.executed = true;
      }
    }
  }
};
\`\`\`

#### 2. 기술적 지표 익절
\`\`\`javascript
const technicalTakeProfit = {
  conditions: [
    { indicator: 'RSI', value: 70, operator: '>' },
    { indicator: 'BollingerBand', position: 'upper' }
  ],
  
  checkConditions: (indicators) => {
    return this.conditions.every(condition => {
      switch(condition.operator) {
        case '>':
          return indicators[condition.indicator] > condition.value;
        case 'touch':
          return indicators[condition.indicator] === condition.position;
      }
    });
  }
};
\`\`\`

#### 3. 시간 기반 익절
\`\`\`javascript
const timeBasedTakeProfit = {
  holdingPeriods: [
    { hours: 24, minProfit: 0.02 },   // 1일 후 2% 이상이면 매도
    { hours: 72, minProfit: 0.01 },   // 3일 후 1% 이상이면 매도
    { hours: 168, minProfit: 0 }      // 7일 후 손익분기점 이상이면 매도
  ],
  
  checkTime: (entryTime, currentTime, profitRatio) => {
    const holdingHours = (currentTime - entryTime) / (1000 * 60 * 60);
    
    for (const period of this.holdingPeriods) {
      if (holdingHours >= period.hours && profitRatio >= period.minProfit) {
        return true;
      }
    }
    return false;
  }
};
\`\`\`

## R:R 비율 (Risk:Reward Ratio)

### R:R 비율 계산
\`\`\`javascript
const calculateRiskReward = (entryPrice, stopLoss, takeProfit) => {
  const risk = entryPrice - stopLoss;
  const reward = takeProfit - entryPrice;
  
  return {
    ratio: reward / risk,
    riskPercent: (risk / entryPrice) * 100,
    rewardPercent: (reward / entryPrice) * 100
  };
};

// 예시: 1:2 비율
const entry = 100000;
const stop = 95000;   // 5% 리스크
const profit = 110000; // 10% 리워드
const rr = calculateRiskReward(entry, stop, profit);
// rr.ratio = 2.0
\`\`\`

### 권장 R:R 비율
| 승률 | 최소 R:R | 설명 |
|------|----------|------|
| 30% | 1:2.5 | 낮은 승률, 높은 수익 필요 |
| 40% | 1:1.5 | 일반적인 트레이딩 |
| 50% | 1:1 | 손익분기점 |
| 60% | 1:0.7 | 높은 승률 전략 |

## 포지션 크기 조정

### Kelly Criterion 적용
\`\`\`javascript
const kellyCriterion = {
  calculate: (winRate, avgWin, avgLoss) => {
    // f = (p × b - q) / b
    // p: 승률, q: 패율, b: 평균수익/평균손실
    const p = winRate;
    const q = 1 - winRate;
    const b = avgWin / avgLoss;
    
    const f = (p * b - q) / b;
    
    // 안전을 위해 1/4 Kelly 사용
    return Math.max(0, Math.min(0.25, f * 0.25));
  }
};
\`\`\`

### 리스크 기반 포지션
\`\`\`javascript
const riskBasedPosition = {
  maxRiskPerTrade: 0.02,  // 거래당 최대 2% 리스크
  
  calculatePosition: (capital, entryPrice, stopLoss) => {
    const riskAmount = capital * this.maxRiskPerTrade;
    const riskPerCoin = entryPrice - stopLoss;
    const position = riskAmount / riskPerCoin;
    
    return {
      quantity: position,
      investment: position * entryPrice,
      maxLoss: riskAmount
    };
  }
};
\`\`\`

## 시장 상황별 전략

### 상승 트렌드
\`\`\`
손절: 이동평균선 아래 3%
익절: 트레일링 스탑 (5% 간격)
R:R: 1:3 이상

전략: 추세 따라가며 수익 극대화
\`\`\`

### 하락 트렌드
\`\`\`
손절: 진입가 대비 3%
익절: 저항선 도달 시 즉시
R:R: 1:1.5

전략: 빠른 손절, 빠른 익절
\`\`\`

### 횡보장
\`\`\`
손절: 박스 하단 돌파
익절: 박스 상단 근처
R:R: 1:1

전략: 구간 내 스윙
\`\`\`

## 심리적 요소

### 손절을 못하는 이유
1. 손실 회피 심리
2. 희망적 사고
3. 자존심
4. 매몰 비용 오류

### 극복 방법
\`\`\`javascript
// 자동 손절 시스템
const autoStopLoss = {
  enabled: true,
  override: false,  // 수동 개입 불가
  
  execute: async (position) => {
    if (position.loss >= position.stopLoss) {
      // 감정 개입 없이 즉시 실행
      await executeSell(position);
      
      // 쿨다운 적용
      applyCooldown(position.symbol, 1800);
      
      // 알림
      notify('손절 실행', \`\${position.symbol} -\${position.loss}%\`);
    }
  }
};
\`\`\`

## 백테스트 검증

### 손절/익절 효과 분석
\`\`\`javascript
const backtest = {
  compareStrategies: (data) => {
    const strategies = [
      { stopLoss: 0.03, takeProfit: 0.05 },
      { stopLoss: 0.05, takeProfit: 0.10 },
      { stopLoss: 0.07, takeProfit: 0.15 }
    ];
    
    const results = strategies.map(strategy => {
      return simulateTrades(data, strategy);
    });
    
    return {
      bestStrategy: results.sort((a, b) => b.totalReturn - a.totalReturn)[0],
      comparison: results
    };
  }
};
\`\`\`

## 실전 팁

### 설정 가이드라인
1. **초보자**: 손절 5%, 익절 10%
2. **중급자**: 손절 3-7%, 익절 분할
3. **고급자**: 동적 손절, 트레일링 스탑

### 주의사항
- 손절선을 함부로 내리지 않기
- 익절을 너무 욕심내지 않기
- 시장 상황에 맞게 조정
- 일관성 있게 적용

<div class="success">
✅ **핵심**: 손절은 선택이 아닌 필수입니다. 작은 손실이 큰 수익을 만듭니다.
</div>

<div class="warning">
⚠️ **경고**: 손절 없는 거래는 계좌를 파산으로 이끄는 지름길입니다.
</div>
    `,
  }
};