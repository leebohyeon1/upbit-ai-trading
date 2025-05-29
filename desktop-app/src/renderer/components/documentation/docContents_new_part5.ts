// Trading Strategy 메인 섹션과 나머지 빈 섹션들
export const tradingStrategyContents = {
  'trading-strategy': {
    title: '거래 전략 설정',
    content: `
# 거래 전략 설정

## 전략의 중요성

성공적인 자동매매는 잘 설계된 전략에서 시작됩니다. 감정을 배제하고 일관된 원칙으로 거래하는 것이 핵심입니다.

### 전략 구성 요소
\`\`\`
1. 진입 전략 (Entry)
   - 매수 타이밍
   - 매수 조건
   - 포지션 크기

2. 청산 전략 (Exit)
   - 익절 목표
   - 손절 라인
   - 시간 제한

3. 리스크 관리
   - 자금 배분
   - 최대 손실
   - 분산 투자

4. 시장 적응
   - 상황별 조정
   - 동적 파라미터
   - 학습과 개선
\`\`\`

### 전략 유형

#### 추세 추종 (Trend Following)
\`\`\`
특징:
- "친구는 추세다"
- 큰 수익, 낮은 승률
- 장기 보유

적합한 시장:
- 명확한 상승/하락
- 낮은 변동성
- 지속적 추세
\`\`\`

#### 평균 회귀 (Mean Reversion)
\`\`\`
특징:
- 극단은 평균으로 돌아온다
- 작은 수익, 높은 승률
- 단기 거래

적합한 시장:
- 횡보장
- 박스권
- 과매수/과매도
\`\`\`

#### 모멘텀 (Momentum)
\`\`\`
특징:
- 강한 것은 더 강해진다
- 중간 수익/승률
- 중단기 보유

적합한 시장:
- 뉴스 이벤트
- 거래량 급증
- 돌파 상황
\`\`\`

## 전략 설계 프로세스

### 1단계: 목표 설정
\`\`\`
질문:
- 목표 수익률은?
- 감당 가능한 손실은?
- 투자 기간은?
- 거래 스타일은?

예시 답변:
- 월 10% 수익
- 최대 20% 손실
- 중장기 (1개월+)
- 스윙 트레이딩
\`\`\`

### 2단계: 규칙 정의
\`\`\`javascript
const strategy = {
  name: "균형잡힌 스윙 전략",
  
  entry: {
    conditions: [
      "RSI < 30 또는 > 70에서 반전",
      "MACD 크로스 확인",
      "거래량 평균 이상"
    ],
    confirmation: 2  // 2개 이상 충족
  },
  
  exit: {
    takeProfit: 0.15,  // 15%
    stopLoss: 0.05,    // 5%
    timeLimit: 72      // 72시간
  },
  
  position: {
    sizing: "kelly",   // Kelly 기준
    maxSize: 0.2       // 최대 20%
  }
};
\`\`\`

### 3단계: 백테스트
\`\`\`
테스트 항목:
- 과거 3개월 데이터
- 다양한 시장 상황
- 거래 비용 포함
- 슬리피지 고려

성과 지표:
- 총 수익률
- 최대 낙폭
- 승률
- 샤프 비율
\`\`\`

### 4단계: 최적화
\`\`\`
파라미터 조정:
- RSI 기간: 14 → 20
- 신뢰도: 70% → 75%
- 손절선: 5% → 3%

주의사항:
- 과최적화 방지
- 샘플 외 검증
- 실전 검증
\`\`\`

## 전략 템플릿

### 보수적 투자자용
\`\`\`javascript
{
  "name": "안전 우선 전략",
  "description": "원금 보존 중심",
  
  "allocation": {
    "BTC": 40,
    "ETH": 30,
    "Stable": 20,
    "Cash": 10
  },
  
  "rules": {
    "buyConfidence": 80,
    "sellConfidence": 85,
    "maxDrawdown": 0.1,
    "positionSize": 0.05
  },
  
  "safety": {
    "stopLoss": 0.03,
    "diversification": 5,
    "cooldown": 1800
  }
}
\`\`\`

### 공격적 투자자용
\`\`\`javascript
{
  "name": "고수익 추구 전략",
  "description": "높은 리스크/리턴",
  
  "allocation": {
    "Alts": 60,
    "BTC": 30,
    "Cash": 10
  },
  
  "rules": {
    "buyConfidence": 65,
    "sellConfidence": 70,
    "maxDrawdown": 0.3,
    "positionSize": 0.2
  },
  
  "aggressive": {
    "leverage": 1.5,
    "targets": [0.2, 0.5, 1.0],
    "newsTrading": true
  }
}
\`\`\`

## 시장 상황별 전략

### 불마켓 전략
\`\`\`
핵심:
- 매수 후 보유
- 조정 시 추가 매수
- 높은 포지션 유지

설정:
buyDip: true
maxPosition: 0.8
rebalance: false
profitTarget: 0.5
\`\`\`

### 베어마켓 전략
\`\`\`
핵심:
- 현금 비중 높임
- 단기 반등 매매
- 엄격한 손절

설정:
cashReserve: 0.5
quickProfit: 0.05
tightStop: 0.02
shortEnabled: true
\`\`\`

## 전략 모니터링

### 실시간 대시보드
\`\`\`
┌─────────────────────────────────┐
│ 현재 전략: 균형 스윙            │
├─────────────────────────────────┤
│ 활성 포지션: 3/5                │
│ 오늘 거래: 7회                  │
│ 승률: 71% (5승 2패)             │
│ 수익: +4.3%                     │
│                                 │
│ 다음 신호:                      │
│ BTC 매수 대기 (RSI 32)          │
└─────────────────────────────────┘
\`\`\`

### 전략 성과 분석
\`\`\`
주간 리뷰:
- 계획 대비 실행률
- 규칙 위반 사례
- 개선 필요 사항
- 시장 적합성

월간 조정:
- 파라미터 미세조정
- 새로운 패턴 추가
- 실패 패턴 제거
\`\`\`

<div class="info">
💡 **핵심**: 완벽한 전략은 없습니다. 지속적으로 개선하고 시장에 적응하세요.
</div>

<div class="warning">
⚠️ **주의**: 전략을 너무 자주 바꾸면 일관성이 없어집니다. 충분한 검증 후 변경하세요.
</div>
    `,
  },
  'trading-strategy.global-vs-coin': {
    title: '전역 vs 코인별 설정',
    content: `
# 전역 vs 코인별 설정

## 설정 계층 구조

### 우선순위
\`\`\`
1. 코인별 설정 (최우선)
   ↓
2. 카테고리 설정 (중간)
   ↓
3. 전역 설정 (기본값)
\`\`\`

### 설정 상속 예시
\`\`\`javascript
// 전역 설정 (모든 코인 기본값)
globalSettings = {
  buyConfidence: 70,
  sellConfidence: 75,
  stopLoss: 0.05,
  takeProfit: 0.15
};

// BTC 전용 설정 (전역 설정 덮어쓰기)
btcSettings = {
  buyConfidence: 65,    // 더 낮은 진입점
  sellConfidence: 80,   // 더 높은 청산점
  // stopLoss는 전역 설정 상속 (5%)
  takeProfit: 0.20     // 더 큰 목표
};
\`\`\`

## 전역 설정

### 언제 사용하나?
\`\`\`
적합한 경우:
✅ 모든 코인에 공통 적용
✅ 기본 리스크 관리
✅ 일반적인 거래 규칙
✅ 시스템 전체 설정

예시:
- 최소 주문 금액
- API 요청 간격
- 쿨다운 시간
- 일일 손실 한도
\`\`\`

### 전역 설정 예시
\`\`\`javascript
{
  "global": {
    // 거래 기본값
    "minOrderAmount": 5000,
    "maxOrderAmount": 1000000,
    "defaultConfidence": {
      "buy": 70,
      "sell": 75
    },
    
    // 리스크 관리
    "riskManagement": {
      "maxDailyLoss": 0.1,
      "maxPositions": 5,
      "defaultStopLoss": 0.05
    },
    
    // 시스템 설정
    "system": {
      "analysisInterval": 60,
      "cooldownPeriod": 300,
      "retryAttempts": 3
    }
  }
}
\`\`\`

## 코인별 설정

### 언제 사용하나?
\`\`\`
필요한 경우:
✅ 코인 특성이 다를 때
✅ 변동성 차이가 클 때
✅ 특별한 전략 적용
✅ 리스크 수준 조정

예시:
- BTC: 안정적, 큰 포지션
- 알트코인: 변동성 높음, 작은 포지션
- 신규 상장: 극도로 보수적
\`\`\`

### 코인별 설정 예시
\`\`\`javascript
{
  "coinSettings": {
    "BTC": {
      "weight": 0.4,
      "confidence": { "buy": 65, "sell": 80 },
      "position": { "min": 0.1, "max": 0.3 },
      "indicators": {
        "ma": { "weight": 0.3 },
        "rsi": { "weight": 0.2 }
      }
    },
    
    "ETH": {
      "weight": 0.3,
      "confidence": { "buy": 70, "sell": 75 },
      "position": { "min": 0.05, "max": 0.2 },
      "indicators": {
        "macd": { "weight": 0.35 },
        "volume": { "weight": 0.25 }
      }
    },
    
    "XRP": {
      "weight": 0.1,
      "confidence": { "buy": 80, "sell": 85 },
      "position": { "min": 0.02, "max": 0.1 },
      "stopLoss": 0.08,  // 더 넓은 손절
      "newsImpact": "high"  // 뉴스 민감
    }
  }
}
\`\`\`

## 카테고리 설정

### 코인 분류
\`\`\`javascript
const categories = {
  "major": {
    coins: ["BTC", "ETH"],
    settings: {
      positionSize: 0.2,
      confidence: { buy: 65, sell: 75 },
      volatilityAdjust: false
    }
  },
  
  "midCap": {
    coins: ["ADA", "DOT", "LINK"],
    settings: {
      positionSize: 0.1,
      confidence: { buy: 70, sell: 80 },
      volatilityAdjust: true
    }
  },
  
  "smallCap": {
    coins: ["MANA", "SAND", "AXS"],
    settings: {
      positionSize: 0.05,
      confidence: { buy: 80, sell: 85 },
      stopLoss: 0.1,
      newsFilter: true
    }
  }
};
\`\`\`

## 설정 병합 로직

### 자동 병합
\`\`\`javascript
function getMergedSettings(coin) {
  // 1. 전역 설정으로 시작
  let settings = { ...globalSettings };
  
  // 2. 카테고리 설정 병합
  const category = getCoinCategory(coin);
  if (category) {
    settings = { ...settings, ...categorySettings[category] };
  }
  
  // 3. 코인별 설정 병합 (최우선)
  if (coinSettings[coin]) {
    settings = { ...settings, ...coinSettings[coin] };
  }
  
  // 4. 검증 및 조정
  return validateSettings(settings);
}
\`\`\`

### 충돌 해결
\`\`\`javascript
// 설정 충돌 시 우선순위
const priority = {
  1: "coinSpecific",    // 코인 전용
  2: "userOverride",    // 사용자 수동
  3: "categoryDefault", // 카테고리
  4: "globalDefault"    // 전역
};

// 충돌 예시
if (coinSettings.stopLoss && globalSettings.stopLoss) {
  // 코인별 설정 우선
  finalStopLoss = coinSettings.stopLoss;
}
\`\`\`

## 실전 활용

### 설정 전략
\`\`\`
1. 전역 설정 먼저
   - 보수적인 기본값
   - 공통 리스크 관리
   
2. 카테고리 분류
   - 비슷한 특성 그룹화
   - 효율적 관리
   
3. 개별 미세조정
   - 특수한 경우만
   - 최소한의 커스터마이징
\`\`\`

### 관리 팁
\`\`\`
DO:
✅ 단순하게 시작
✅ 점진적 세분화
✅ 정기적 검토
✅ 문서화

DON'T:
❌ 과도한 세분화
❌ 너무 잦은 변경
❌ 검증 없는 적용
❌ 일관성 없는 설정
\`\`\`

## 설정 템플릿

### 초보자 템플릿
\`\`\`javascript
{
  "template": "beginner",
  "description": "안전한 시작",
  
  "global": {
    "all": {
      "confidence": { "buy": 80, "sell": 85 },
      "stopLoss": 0.05,
      "positionSize": 0.05
    }
  },
  
  "coinSpecific": {
    // 최소한의 개별 설정
    "BTC": { "positionSize": 0.1 }
  }
}
\`\`\`

### 고급 템플릿
\`\`\`javascript
{
  "template": "advanced",
  "description": "세밀한 제어",
  
  "categories": {
    "blue_chip": {
      "coins": ["BTC", "ETH"],
      "aggressive": true
    },
    "defi": {
      "coins": ["UNI", "AAVE", "COMP"],
      "newsWeight": 0.3
    },
    "gaming": {
      "coins": ["AXS", "SAND", "MANA"],
      "volatilityFilter": true
    }
  },
  
  "coinSpecific": {
    // 각 코인별 세부 조정
    "BTC": { /* 20+ 파라미터 */ },
    "ETH": { /* 20+ 파라미터 */ }
    // ...
  }
}
\`\`\`

<div class="success">
✅ **권장**: 전역 설정으로 시작하고, 필요한 경우에만 개별 설정을 추가하세요.
</div>

<div class="warning">
⚠️ **주의**: 너무 복잡한 설정은 관리가 어렵고 오류 가능성이 높아집니다.
</div>
    `,
  },
  'trading-strategy.buy-sell-conditions': {
    title: '매수/매도 조건',
    content: `
# 매수/매도 조건

## 매수 조건 설정

### 기본 매수 조건
\`\`\`javascript
const buyConditions = {
  // 필수 조건 (모두 만족해야 함)
  required: {
    confidence: 70,           // 최소 신뢰도
    balance: 50000,          // 최소 잔액
    cooldown: true,          // 쿨다운 완료
    maxPositions: false      // 최대 포지션 미달
  },
  
  // 기술적 지표 조건 (2개 이상 만족)
  technical: {
    rsi: { operator: '<', value: 30 },
    macd: { signal: 'golden_cross' },
    bollinger: { position: 'below_lower' },
    volume: { operator: '>', value: 'avg_20' }
  },
  
  // 시장 조건
  market: {
    trend: ['sideways', 'uptrend'],
    volatility: { max: 0.08 },
    correlation: { btc: 'positive' }
  }
};
\`\`\`

### 신호 조합 로직
\`\`\`javascript
function checkBuySignal(data) {
  const signals = [];
  
  // RSI 과매도
  if (data.rsi < 30) {
    signals.push({
      indicator: 'RSI',
      strength: (30 - data.rsi) / 30,
      message: \`RSI \${data.rsi} 과매도\`
    });
  }
  
  // MACD 골든크로스
  if (data.macd.cross === 'golden') {
    signals.push({
      indicator: 'MACD',
      strength: Math.abs(data.macd.histogram) / data.price * 100,
      message: 'MACD 골든크로스'
    });
  }
  
  // 볼린저밴드 하단 이탈
  if (data.price < data.bollinger.lower) {
    signals.push({
      indicator: 'Bollinger',
      strength: (data.bollinger.lower - data.price) / data.price,
      message: '볼린저밴드 하단 이탈'
    });
  }
  
  // 신호 종합
  return {
    buy: signals.length >= 2,
    confidence: calculateConfidence(signals),
    signals: signals
  };
}
\`\`\`

## 매도 조건 설정

### 기본 매도 조건
\`\`\`javascript
const sellConditions = {
  // 익절 조건
  takeProfit: {
    enabled: true,
    targets: [
      { ratio: 0.3, profit: 0.05 },  // 30% 물량 5% 익절
      { ratio: 0.4, profit: 0.10 },  // 40% 물량 10% 익절
      { ratio: 0.3, profit: 0.15 }   // 30% 물량 15% 익절
    ]
  },
  
  // 손절 조건
  stopLoss: {
    enabled: true,
    percentage: 0.05,     // 5% 손절
    trailing: {
      enabled: true,
      activation: 0.07,   // 7% 수익 시 활성화
      distance: 0.03      // 3% 간격 유지
    }
  },
  
  // 시간 기반 청산
  timeExit: {
    enabled: true,
    maxHoldingHours: 72,  // 최대 72시간 보유
    profitRequired: 0.02  // 2% 미만 수익 시 청산
  }
};
\`\`\`

### 동적 매도 전략
\`\`\`javascript
class DynamicSellStrategy {
  constructor(position) {
    this.position = position;
    this.entryPrice = position.avgPrice;
    this.currentPrice = 0;
    this.highestPrice = position.avgPrice;
  }
  
  updatePrice(price) {
    this.currentPrice = price;
    this.highestPrice = Math.max(this.highestPrice, price);
  }
  
  checkSellSignal() {
    const profit = (this.currentPrice - this.entryPrice) / this.entryPrice;
    const fromPeak = (this.highestPrice - this.currentPrice) / this.highestPrice;
    
    // 손절 체크
    if (profit < -0.05) {
      return { sell: true, reason: 'STOP_LOSS', urgency: 'HIGH' };
    }
    
    // 트레일링 스탑
    if (profit > 0.07 && fromPeak > 0.03) {
      return { sell: true, reason: 'TRAILING_STOP', urgency: 'MEDIUM' };
    }
    
    // 목표 수익 도달
    if (profit > 0.15) {
      return { sell: true, reason: 'TARGET_REACHED', urgency: 'LOW' };
    }
    
    // 기술적 지표 확인
    return this.checkTechnicalSell();
  }
  
  checkTechnicalSell() {
    const signals = [];
    
    if (this.position.indicators.rsi > 70) {
      signals.push('RSI_OVERBOUGHT');
    }
    
    if (this.position.indicators.macd.cross === 'death') {
      signals.push('MACD_DEATH_CROSS');
    }
    
    if (signals.length >= 2) {
      return { sell: true, reason: 'TECHNICAL', signals };
    }
    
    return { sell: false };
  }
}
\`\`\`

## 조건 커스터마이징

### 시장 상황별 조정
\`\`\`javascript
const marketAdaptiveConditions = {
  bull: {
    buy: {
      confidence: 65,      // 낮춰도 됨
      rsi: 40,            // 기준 완화
      holdBias: true      // 보유 선호
    },
    sell: {
      takeProfit: 0.20,   // 목표 상향
      stopLoss: 0.07,     // 손절 완화
      patience: 'high'    // 인내심 있게
    }
  },
  
  bear: {
    buy: {
      confidence: 80,     // 엄격하게
      rsi: 25,           // 극도의 과매도만
      volumeCheck: true  // 거래량 확인 필수
    },
    sell: {
      takeProfit: 0.05,  // 빠른 익절
      stopLoss: 0.03,    // 타이트한 손절
      patience: 'low'    // 빠른 청산
    }
  },
  
  sideways: {
    buy: {
      confidence: 70,
      rangeBottom: true,  // 박스 하단
      indicators: ['RSI', 'Bollinger']
    },
    sell: {
      rangeTop: true,     // 박스 상단
      quickProfit: 0.03,  // 작은 수익
      timeLimit: 24       // 24시간 제한
    }
  }
};
\`\`\`

### 코인별 특수 조건
\`\`\`javascript
const coinSpecificConditions = {
  BTC: {
    buy: {
      minVolume: 1000000000,  // 10억원 이상
      newsCheck: true,        // 뉴스 확인
      whaleAlert: true        // 고래 움직임
    },
    sell: {
      partialSell: true,      // 분할 매도
      targets: [0.05, 0.10, 0.20]
    }
  },
  
  altcoins: {
    buy: {
      btcCorrelation: true,   // BTC 연동 확인
      pumpDetection: true,    // 펌핑 감지
      maxSlippage: 0.02       // 슬리피지 제한
    },
    sell: {
      quickExit: true,        // 빠른 청산
      volatilityExit: 0.15    // 변동성 15% 초과 시
    }
  }
};
\`\`\`

## 실전 적용

### 조건 검증 시스템
\`\`\`javascript
class ConditionValidator {
  constructor(conditions) {
    this.conditions = conditions;
    this.history = [];
  }
  
  validate(marketData) {
    const results = {
      buy: false,
      sell: false,
      confidence: 0,
      reasons: []
    };
    
    // 매수 조건 체크
    if (this.checkBuyConditions(marketData)) {
      results.buy = true;
      results.confidence = this.calculateBuyConfidence(marketData);
      results.reasons = this.getBuyReasons(marketData);
    }
    
    // 매도 조건 체크 (포지션 있을 때만)
    if (marketData.hasPosition) {
      const sellCheck = this.checkSellConditions(marketData);
      results.sell = sellCheck.sell;
      results.reasons = sellCheck.reasons;
    }
    
    // 기록 저장
    this.history.push({
      timestamp: Date.now(),
      ...results
    });
    
    return results;
  }
  
  getSuccessRate() {
    const successful = this.history.filter(h => h.profitable).length;
    return successful / this.history.length;
  }
}
\`\`\`

<div class="info">
💡 **팁**: 조건을 너무 복잡하게 만들면 거래 기회를 놓칩니다. 핵심 조건 2-3개로 시작하세요.
</div>
    `,
  },
  'trading-strategy.confidence-threshold': {
    title: '신뢰도 임계값',
    content: `
# 신뢰도 임계값

## 신뢰도 임계값이란?

신뢰도 임계값은 자동매매 시스템이 거래를 실행하기 위한 최소 확신 수준입니다.

### 임계값의 의미
\`\`\`
70% 임계값 = "10번 중 7번은 수익 가능성이 있다고 판단"

낮은 임계값 (60-70%):
- 거래 빈도 ↑
- 수익 기회 ↑
- 리스크 ↑
- 승률 ↓

높은 임계값 (80-90%):
- 거래 빈도 ↓
- 수익 기회 ↓
- 리스크 ↓
- 승률 ↑
\`\`\`

## 최적 임계값 설정

### 기본 설정 가이드
\`\`\`javascript
const thresholdSettings = {
  // 초보자 권장
  beginner: {
    buy: 80,
    sell: 85,
    description: "안전 우선, 확실한 신호만"
  },
  
  // 중급자
  intermediate: {
    buy: 70,
    sell: 75,
    description: "균형잡힌 위험/수익"
  },
  
  // 고급자
  advanced: {
    buy: 65,
    sell: 70,
    dynamicAdjustment: true,
    description: "적극적 거래, 동적 조정"
  }
};
\`\`\`

### 시장별 임계값
\`\`\`javascript
const marketBasedThresholds = {
  trending: {
    strong_uptrend: {
      buy: 65,   // 추세 따라가기
      sell: 80   // 수익 보호
    },
    weak_uptrend: {
      buy: 70,
      sell: 75
    },
    downtrend: {
      buy: 85,   // 매우 보수적
      sell: 70   // 빠른 손절
    }
  },
  
  ranging: {
    tight_range: {
      buy: 75,   // 명확한 바닥
      sell: 75   // 명확한 천장
    },
    wide_range: {
      buy: 70,
      sell: 70
    }
  },
  
  volatile: {
    extreme: {
      buy: 90,   // 극도로 보수적
      sell: 65   // 빠른 청산
    },
    high: {
      buy: 80,
      sell: 70
    }
  }
};
\`\`\`

## 동적 임계값 조정

### 성과 기반 조정
\`\`\`javascript
class DynamicThresholdManager {
  constructor(baseThreshold = 70) {
    this.baseThreshold = baseThreshold;
    this.currentThreshold = baseThreshold;
    this.performanceHistory = [];
    this.adjustmentFactor = 0.02; // 2% 단위 조정
  }
  
  updatePerformance(trade) {
    this.performanceHistory.push({
      timestamp: trade.timestamp,
      profitable: trade.profit > 0,
      confidence: trade.entryConfidence,
      profit: trade.profit
    });
    
    // 최근 20개 거래만 유지
    if (this.performanceHistory.length > 20) {
      this.performanceHistory.shift();
    }
    
    this.adjustThreshold();
  }
  
  adjustThreshold() {
    const recentTrades = this.performanceHistory.slice(-10);
    if (recentTrades.length < 5) return; // 데이터 부족
    
    const winRate = recentTrades.filter(t => t.profitable).length / recentTrades.length;
    const avgConfidence = recentTrades.reduce((sum, t) => sum + t.confidence, 0) / recentTrades.length;
    
    // 승률이 높고 평균 신뢰도가 높으면 임계값 낮춤 (더 많은 거래)
    if (winRate > 0.7 && avgConfidence > this.currentThreshold + 5) {
      this.currentThreshold = Math.max(
        this.baseThreshold - 10,
        this.currentThreshold - this.adjustmentFactor * 100
      );
    }
    // 승률이 낮으면 임계값 높임 (더 신중하게)
    else if (winRate < 0.4) {
      this.currentThreshold = Math.min(
        this.baseThreshold + 15,
        this.currentThreshold + this.adjustmentFactor * 100
      );
    }
    // 정상 범위로 회귀
    else {
      this.currentThreshold += (this.baseThreshold - this.currentThreshold) * 0.1;
    }
  }
  
  getThreshold() {
    return Math.round(this.currentThreshold);
  }
}
\`\`\`

### 시간대별 조정
\`\`\`javascript
const timeBasedThresholds = {
  // 24시간 기준
  getThreshold: function(hour, baseThreshold) {
    const adjustments = {
      // 새벽 (낮은 유동성)
      "00-06": +5,
      // 아침 (아시아 활발)
      "06-09": 0,
      // 오전 (정상)
      "09-15": -2,
      // 오후 (유럽 시작)
      "15-21": +2,
      // 저녁 (미국 활발)
      "21-24": +3
    };
    
    for (const [range, adjustment] of Object.entries(adjustments)) {
      const [start, end] = range.split('-').map(Number);
      if (hour >= start && hour < end) {
        return baseThreshold + adjustment;
      }
    }
    
    return baseThreshold;
  }
};
\`\`\`

## 코인별 임계값 설정

### 변동성 기반 설정
\`\`\`javascript
const coinThresholds = {
  // 메이저 코인 (낮은 변동성)
  BTC: {
    buy: 65,
    sell: 75,
    volatilityMultiplier: 0.8
  },
  
  ETH: {
    buy: 68,
    sell: 75,
    volatilityMultiplier: 0.9
  },
  
  // 중형 알트코인
  ADA: {
    buy: 72,
    sell: 77,
    volatilityMultiplier: 1.0
  },
  
  // 소형 알트코인 (높은 변동성)
  SMALL_ALTS: {
    buy: 80,
    sell: 85,
    volatilityMultiplier: 1.3,
    maxDailyTrades: 2  // 일일 거래 제한
  }
};

// 변동성에 따른 동적 조정
function getAdjustedThreshold(coin, baseThreshold, currentVolatility) {
  const coinConfig = coinThresholds[coin] || coinThresholds.SMALL_ALTS;
  const normalVolatility = 0.02; // 2% 기준
  
  // 변동성이 높을수록 임계값 상향
  const volatilityAdjustment = (currentVolatility / normalVolatility - 1) * 10;
  
  return baseThreshold + volatilityAdjustment * coinConfig.volatilityMultiplier;
}
\`\`\`

## 임계값 최적화

### 백테스트 기반 최적화
\`\`\`javascript
async function optimizeThreshold(coin, historicalData) {
  const results = [];
  
  // 60% ~ 90% 범위 테스트
  for (let threshold = 60; threshold <= 90; threshold += 5) {
    const backtest = await runBacktest({
      coin: coin,
      data: historicalData,
      buyThreshold: threshold,
      sellThreshold: threshold + 5
    });
    
    results.push({
      threshold: threshold,
      totalReturn: backtest.totalReturn,
      winRate: backtest.winRate,
      numTrades: backtest.numTrades,
      maxDrawdown: backtest.maxDrawdown,
      sharpeRatio: backtest.sharpeRatio
    });
  }
  
  // 샤프 비율 기준 최적값 선택
  return results.sort((a, b) => b.sharpeRatio - a.sharpeRatio)[0];
}
\`\`\`

### A/B 테스트
\`\`\`javascript
class ThresholdABTest {
  constructor() {
    this.groups = {
      A: { threshold: 70, trades: [], profit: 0 },
      B: { threshold: 75, trades: [], profit: 0 }
    };
    this.currentGroup = 'A';
  }
  
  selectGroup() {
    // 50% 확률로 그룹 선택
    this.currentGroup = Math.random() > 0.5 ? 'A' : 'B';
    return this.groups[this.currentGroup].threshold;
  }
  
  recordResult(trade) {
    const group = this.groups[this.currentGroup];
    group.trades.push(trade);
    group.profit += trade.profit;
  }
  
  getWinner(minTrades = 20) {
    const groupA = this.groups.A;
    const groupB = this.groups.B;
    
    if (groupA.trades.length < minTrades || groupB.trades.length < minTrades) {
      return null; // 데이터 부족
    }
    
    const performanceA = {
      avgProfit: groupA.profit / groupA.trades.length,
      winRate: groupA.trades.filter(t => t.profit > 0).length / groupA.trades.length
    };
    
    const performanceB = {
      avgProfit: groupB.profit / groupB.trades.length,
      winRate: groupB.trades.filter(t => t.profit > 0).length / groupB.trades.length
    };
    
    // 평균 수익률과 승률 종합 평가
    const scoreA = performanceA.avgProfit * performanceA.winRate;
    const scoreB = performanceB.avgProfit * performanceB.winRate;
    
    return scoreA > scoreB ? 'A' : 'B';
  }
}
\`\`\`

## 실전 활용 팁

### 단계별 접근
\`\`\`javascript
const thresholdProgression = {
  week1: {
    buy: 85,
    sell: 90,
    goal: "시스템 이해"
  },
  
  week2_4: {
    buy: 80,
    sell: 85,
    goal: "안정성 확인"
  },
  
  month2: {
    buy: 75,
    sell: 80,
    goal: "수익률 향상"
  },
  
  month3: {
    buy: 70,
    sell: 75,
    dynamic: true,
    goal: "최적화"
  }
};
\`\`\`

### 위험 관리와의 연계
\`\`\`javascript
// 임계값과 포지션 크기 연동
function getPositionSize(confidence, threshold, balance) {
  const baseSize = balance * 0.1; // 기본 10%
  
  // 신뢰도가 임계값을 크게 상회할수록 포지션 증가
  const confidenceRatio = (confidence - threshold) / (100 - threshold);
  const sizeMultiplier = 1 + (confidenceRatio * 0.5); // 최대 1.5배
  
  return Math.min(baseSize * sizeMultiplier, balance * 0.2); // 최대 20%
}
\`\`\`

<div class="warning">
⚠️ **주의**: 임계값을 너무 낮게 설정하면 잦은 손실로 이어질 수 있습니다. 충분한 테스트 후 조정하세요.
</div>
    `,
  },
  'trading-strategy.cooldown': {
    title: '쿨다운 시간 설정',
    content: `
# 쿨다운 시간 설정

## 쿨다운이란?

쿨다운은 거래 후 일정 시간 동안 동일 코인의 재거래를 제한하는 안전장치입니다.

### 쿨다운의 목적
\`\`\`
1. 감정적 거래 방지
   - FOMO (Fear Of Missing Out) 억제
   - 복수 거래 (Revenge Trading) 방지
   - 충동적 재진입 차단

2. 시장 안정화 대기
   - 거래 후 변동성 진정
   - 새로운 추세 형성 확인
   - 거래 영향 흡수

3. 리스크 관리
   - 연속 손실 방지
   - 자금 보호
   - 과도한 거래 제한
\`\`\`

## 쿨다운 시간 설정

### 기본 설정
\`\`\`javascript
const cooldownSettings = {
  // 거래 유형별
  afterBuy: 300,        // 매수 후 5분
  afterSell: 600,       // 매도 후 10분
  afterStopLoss: 1800,  // 손절 후 30분
  afterTakeProfit: 900, // 익절 후 15분
  
  // 특수 상황
  afterError: 60,       // 오류 발생 후 1분
  afterCancel: 30,      // 주문 취소 후 30초
  
  // 최대/최소
  minimum: 30,          // 최소 30초
  maximum: 3600         // 최대 1시간
};
\`\`\`

### 동적 쿨다운
\`\`\`javascript
class DynamicCooldownManager {
  constructor() {
    this.baseCooldown = 300; // 5분 기본
    this.multipliers = {
      profit: 0.8,      // 수익 거래: 20% 단축
      loss: 1.5,        // 손실 거래: 50% 연장
      consecutive: 2.0,  // 연속 거래: 2배 연장
      volatility: 1.3   // 고변동성: 30% 연장
    };
  }
  
  calculateCooldown(trade, marketCondition) {
    let cooldown = this.baseCooldown;
    
    // 거래 결과에 따른 조정
    if (trade.profit > 0) {
      cooldown *= this.multipliers.profit;
    } else if (trade.profit < 0) {
      cooldown *= this.multipliers.loss;
      
      // 손실 크기에 따른 추가 조정
      if (trade.lossPercentage > 5) {
        cooldown *= 1.5; // 5% 이상 손실 시 추가 50%
      }
    }
    
    // 연속 거래 체크
    if (this.isConsecutiveTrade(trade)) {
      cooldown *= this.multipliers.consecutive;
    }
    
    // 시장 상황 반영
    if (marketCondition.volatility > 0.05) {
      cooldown *= this.multipliers.volatility;
    }
    
    // 범위 제한
    return Math.max(
      cooldownSettings.minimum,
      Math.min(cooldownSettings.maximum, Math.round(cooldown))
    );
  }
  
  isConsecutiveTrade(trade) {
    const recentTrades = this.getRecentTrades(trade.coin, 3600); // 1시간 내
    return recentTrades.length >= 2;
  }
}
\`\`\`

## 코인별 쿨다운 전략

### 변동성 기반 설정
\`\`\`javascript
const coinCooldownStrategy = {
  // 메이저 코인 (낮은 변동성)
  major: {
    BTC: {
      base: 180,          // 3분
      profit: 120,        // 수익 시 2분
      loss: 300,          // 손실 시 5분
      description: "안정적 코인, 짧은 쿨다운"
    },
    ETH: {
      base: 240,          // 4분
      profit: 180,        // 수익 시 3분
      loss: 360           // 손실 시 6분
    }
  },
  
  // 중형 알트코인
  mid: {
    default: {
      base: 600,          // 10분
      profit: 480,        // 수익 시 8분
      loss: 900,          // 손실 시 15분
      description: "표준 쿨다운"
    }
  },
  
  // 고변동성 코인
  volatile: {
    default: {
      base: 1200,         // 20분
      profit: 900,        // 수익 시 15분
      loss: 1800,         // 손실 시 30분
      streak: 3600,       // 연속 거래 시 1시간
      description: "고위험 코인, 긴 쿨다운"
    }
  }
};
\`\`\`

### 시간대별 조정
\`\`\`javascript
const timeBasedCooldown = {
  // 거래량이 많은 시간 (짧은 쿨다운)
  activePeriod: {
    hours: [9, 10, 11, 14, 15, 16, 21, 22],
    multiplier: 0.8
  },
  
  // 거래량이 적은 시간 (긴 쿨다운)
  quietPeriod: {
    hours: [0, 1, 2, 3, 4, 5],
    multiplier: 1.5
  },
  
  // 주말 (보수적)
  weekend: {
    multiplier: 1.3
  },
  
  getCooldownMultiplier: function() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // 주말 체크
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return this.weekend.multiplier;
    }
    
    // 시간대 체크
    if (this.activePeriod.hours.includes(hour)) {
      return this.activePeriod.multiplier;
    }
    if (this.quietPeriod.hours.includes(hour)) {
      return this.quietPeriod.multiplier;
    }
    
    return 1.0; // 기본값
  }
};
\`\`\`

## 스마트 쿨다운 시스템

### 상황 인식 쿨다운
\`\`\`javascript
class SmartCooldownSystem {
  constructor() {
    this.tradeHistory = new Map(); // 코인별 거래 기록
    this.marketState = {};
    this.performanceTracker = {};
  }
  
  getCooldown(coin, lastTrade) {
    const factors = this.analyzeFactors(coin, lastTrade);
    
    // 기본 쿨다운
    let cooldown = 300; // 5분
    
    // 팩터별 가중치 적용
    cooldown *= factors.profitability;
    cooldown *= factors.volatility;
    cooldown *= factors.streak;
    cooldown *= factors.marketCondition;
    cooldown *= factors.performance;
    
    // 특수 상황 처리
    if (this.isSpecialEvent()) {
      cooldown *= 2; // 이벤트 시 2배
    }
    
    return Math.round(cooldown);
  }
  
  analyzeFactors(coin, lastTrade) {
    return {
      // 수익성 팩터
      profitability: this.getProfitabilityFactor(lastTrade),
      
      // 변동성 팩터
      volatility: this.getVolatilityFactor(coin),
      
      // 연속 거래 팩터
      streak: this.getStreakFactor(coin),
      
      // 시장 상황 팩터
      marketCondition: this.getMarketFactor(),
      
      // 성과 팩터
      performance: this.getPerformanceFactor(coin)
    };
  }
  
  getProfitabilityFactor(trade) {
    if (trade.profit > 5) return 0.7;   // 5% 이상 수익: 30% 단축
    if (trade.profit > 0) return 0.85;  // 소폭 수익: 15% 단축
    if (trade.profit > -3) return 1.0;  // 소폭 손실: 변경 없음
    if (trade.profit > -5) return 1.3;  // 중간 손실: 30% 연장
    return 2.0;                          // 큰 손실: 2배 연장
  }
  
  getVolatilityFactor(coin) {
    const volatility = this.marketState[coin]?.volatility || 0.02;
    
    if (volatility < 0.01) return 0.8;  // 매우 안정: 20% 단축
    if (volatility < 0.03) return 1.0;  // 정상
    if (volatility < 0.05) return 1.3;  // 높음: 30% 연장
    return 1.5;                          // 매우 높음: 50% 연장
  }
  
  getStreakFactor(coin) {
    const recentTrades = this.tradeHistory.get(coin) || [];
    const hourAgo = Date.now() - 3600000;
    const recentCount = recentTrades.filter(t => t.timestamp > hourAgo).length;
    
    if (recentCount === 0) return 0.8;  // 첫 거래: 20% 단축
    if (recentCount === 1) return 1.0;  // 정상
    if (recentCount === 2) return 1.5;  // 3번째: 50% 연장
    return 2.0;                          // 과도한 거래: 2배
  }
}
\`\`\`

### 쿨다운 오버라이드
\`\`\`javascript
const cooldownOverrides = {
  // 긴급 상황 무시
  emergency: {
    conditions: [
      "손절 필요",
      "시스템 오류 복구",
      "극단적 시장 상황"
    ],
    override: true,
    minimumWait: 10 // 최소 10초는 대기
  },
  
  // 특별 기회 단축
  opportunity: {
    conditions: [
      "극도의 과매도 (RSI < 20)",
      "플래시 크래시",
      "확실한 반등 신호"
    ],
    multiplier: 0.3 // 70% 단축
  },
  
  // 강제 연장
  forceExtend: {
    conditions: [
      "3연속 손실",
      "일일 손실 한도 근접",
      "극심한 변동성"
    ],
    multiplier: 3.0 // 3배 연장
  }
};
\`\`\`

## 쿨다운 모니터링

### 실시간 추적
\`\`\`javascript
class CooldownTracker {
  constructor() {
    this.activeCooldowns = new Map();
  }
  
  startCooldown(coin, duration, reason) {
    const endTime = Date.now() + duration * 1000;
    
    this.activeCooldowns.set(coin, {
      startTime: Date.now(),
      endTime: endTime,
      duration: duration,
      reason: reason,
      remaining: duration
    });
    
    // 카운트다운 시작
    this.startCountdown(coin);
  }
  
  startCountdown(coin) {
    const interval = setInterval(() => {
      const cooldown = this.activeCooldowns.get(coin);
      if (!cooldown) {
        clearInterval(interval);
        return;
      }
      
      const remaining = Math.max(0, 
        Math.round((cooldown.endTime - Date.now()) / 1000)
      );
      
      cooldown.remaining = remaining;
      
      if (remaining === 0) {
        this.activeCooldowns.delete(coin);
        clearInterval(interval);
        this.onCooldownComplete(coin);
      }
    }, 1000);
  }
  
  canTrade(coin) {
    return !this.activeCooldowns.has(coin);
  }
  
  getRemainingTime(coin) {
    const cooldown = this.activeCooldowns.get(coin);
    return cooldown ? cooldown.remaining : 0;
  }
  
  getStatus() {
    const status = [];
    
    for (const [coin, cooldown] of this.activeCooldowns) {
      status.push({
        coin: coin,
        remaining: cooldown.remaining,
        reason: cooldown.reason,
        progress: 1 - (cooldown.remaining / cooldown.duration)
      });
    }
    
    return status;
  }
}
\`\`\`

## 실전 활용 예시

### 통합 쿨다운 관리
\`\`\`javascript
// 거래 완료 후 쿨다운 적용
async function applyPostTradeCooldown(trade) {
  const cooldownManager = new DynamicCooldownManager();
  const tracker = new CooldownTracker();
  
  // 쿨다운 시간 계산
  const cooldownTime = cooldownManager.calculateCooldown(
    trade,
    await getMarketCondition(trade.coin)
  );
  
  // 쿨다운 시작
  tracker.startCooldown(
    trade.coin,
    cooldownTime,
    trade.profit > 0 ? 'profit_cooldown' : 'loss_cooldown'
  );
  
  // 로그 기록
  console.log(\`[\${trade.coin}] 쿨다운 시작: \${cooldownTime}초\`);
  console.log(\`사유: \${trade.profit > 0 ? '수익 실현' : '손실 발생'}\`);
  
  // UI 업데이트
  updateUI({
    coin: trade.coin,
    cooldown: cooldownTime,
    canTradeAt: new Date(Date.now() + cooldownTime * 1000)
  });
}
\`\`\`

<div class="info">
💡 **팁**: 쿨다운은 거래 보호장치입니다. 답답하더라도 지키는 것이 장기적으로 유리합니다.
</div>
    `,
  },
  'trading-strategy.stop-loss-take-profit': {
    title: '손절/익절 전략',
    content: `
# 손절/익절 전략

## 손절과 익절의 중요성

손절(Stop Loss)과 익절(Take Profit)은 리스크 관리의 핵심이며, 감정을 배제한 체계적 거래의 기본입니다.

### 기본 개념
\`\`\`
손절 (Stop Loss):
- 손실을 제한하기 위한 자동 매도
- 계좌 보호의 최후 방어선
- "작은 손실로 큰 손실을 막는다"

익절 (Take Profit):
- 목표 수익 달성 시 자동 매도
- 수익 실현과 욕심 제어
- "확실한 수익을 확보한다"
\`\`\`

## 손절 전략

### 고정 비율 손절
\`\`\`javascript
const fixedStopLoss = {
  conservative: {
    percentage: 0.03,     // 3% 손절
    description: "안전 우선",
    suitable: "변동성 낮은 메이저 코인"
  },
  
  standard: {
    percentage: 0.05,     // 5% 손절
    description: "표준 설정",
    suitable: "대부분의 코인"
  },
  
  aggressive: {
    percentage: 0.08,     // 8% 손절
    description: "높은 변동성 허용",
    suitable: "고변동성 알트코인"
  },
  
  calculate: function(entryPrice, type = 'standard') {
    const config = this[type];
    return {
      stopPrice: entryPrice * (1 - config.percentage),
      lossAmount: entryPrice * config.percentage,
      description: config.description
    };
  }
};
\`\`\`

### 동적 손절 (ATR 기반)
\`\`\`javascript
class DynamicStopLoss {
  constructor(atrMultiplier = 2) {
    this.atrMultiplier = atrMultiplier;
  }
  
  calculate(entryPrice, atr, marketCondition) {
    // 기본 손절 = 진입가 - (ATR × 배수)
    let stopDistance = atr * this.atrMultiplier;
    
    // 시장 상황별 조정
    if (marketCondition === 'high_volatility') {
      stopDistance *= 1.5; // 변동성 높을 때 넓게
    } else if (marketCondition === 'trending') {
      stopDistance *= 0.8; // 추세장에서는 타이트하게
    }
    
    const stopPrice = entryPrice - stopDistance;
    const stopPercentage = stopDistance / entryPrice;
    
    // 최대 손절 제한 (10%)
    if (stopPercentage > 0.1) {
      stopPrice = entryPrice * 0.9;
    }
    
    return {
      stopPrice: stopPrice,
      stopPercentage: stopPercentage,
      method: 'ATR_based',
      atr: atr
    };
  }
}
\`\`\`

### 트레일링 스탑
\`\`\`javascript
class TrailingStop {
  constructor(config) {
    this.activation = config.activation || 0.05;  // 5% 수익 시 활성화
    this.distance = config.distance || 0.03;      // 3% 간격 유지
    this.minProfit = config.minProfit || 0.02;    // 최소 2% 수익 보장
    
    this.isActive = false;
    this.highestPrice = 0;
    this.currentStop = 0;
  }
  
  update(currentPrice, entryPrice) {
    const profitRatio = (currentPrice - entryPrice) / entryPrice;
    
    // 활성화 체크
    if (!this.isActive && profitRatio >= this.activation) {
      this.isActive = true;
      this.highestPrice = currentPrice;
      // 최소 수익 보장
      this.currentStop = entryPrice * (1 + this.minProfit);
      
      return {
        activated: true,
        stopPrice: this.currentStop,
        message: "트레일링 스탑 활성화"
      };
    }
    
    // 활성화된 경우 업데이트
    if (this.isActive) {
      if (currentPrice > this.highestPrice) {
        this.highestPrice = currentPrice;
        const newStop = currentPrice * (1 - this.distance);
        
        // 스탑은 올라가기만 함
        if (newStop > this.currentStop) {
          this.currentStop = newStop;
          
          return {
            updated: true,
            stopPrice: this.currentStop,
            profit: (this.currentStop - entryPrice) / entryPrice
          };
        }
      }
      
      // 스탑 도달 체크
      if (currentPrice <= this.currentStop) {
        return {
          triggered: true,
          exitPrice: this.currentStop,
          finalProfit: (this.currentStop - entryPrice) / entryPrice
        };
      }
    }
    
    return { active: this.isActive, stopPrice: this.currentStop };
  }
}
\`\`\`

## 익절 전략

### 목표가 익절
\`\`\`javascript
const targetProfitStrategy = {
  // 단일 목표
  simple: {
    target: 0.15,  // 15% 익절
    execute: function(currentPrice, entryPrice) {
      const profit = (currentPrice - entryPrice) / entryPrice;
      return profit >= this.target;
    }
  },
  
  // 다단계 익절
  scaled: {
    targets: [
      { ratio: 0.3, profit: 0.05 },   // 30% 물량을 5%에
      { ratio: 0.4, profit: 0.10 },   // 40% 물량을 10%에
      { ratio: 0.3, profit: 0.15 }    // 30% 물량을 15%에
    ],
    
    execute: function(currentPrice, entryPrice, remainingRatio) {
      const profit = (currentPrice - entryPrice) / entryPrice;
      
      for (const target of this.targets) {
        if (remainingRatio > 0 && profit >= target.profit) {
          const sellRatio = Math.min(target.ratio, remainingRatio);
          return {
            sell: true,
            ratio: sellRatio,
            price: currentPrice,
            reason: \`\${(target.profit * 100).toFixed(0)}% 목표 도달\`
          };
        }
      }
      
      return { sell: false };
    }
  },
  
  // 동적 목표
  dynamic: {
    baseTarget: 0.10,  // 기본 10%
    
    adjust: function(marketCondition, holdingTime) {
      let target = this.baseTarget;
      
      // 시장 상황별 조정
      if (marketCondition === 'bull') {
        target *= 1.5;  // 상승장에서는 목표 상향
      } else if (marketCondition === 'bear') {
        target *= 0.7;  // 하락장에서는 빠른 익절
      }
      
      // 보유 시간별 조정
      const hours = holdingTime / 3600;
      if (hours > 24) {
        target *= 0.9;  // 24시간 이상 보유 시 목표 하향
      }
      
      return target;
    }
  }
};
\`\`\`

### R:R (Risk:Reward) 기반 익절
\`\`\`javascript
class RiskRewardManager {
  constructor(minRR = 2) {
    this.minRR = minRR;  // 최소 2:1 비율
  }
  
  calculateTargets(entryPrice, stopLoss) {
    const risk = entryPrice - stopLoss;
    
    return {
      target1: {
        price: entryPrice + (risk * 1),
        profit: risk / entryPrice,
        RR: "1:1"
      },
      target2: {
        price: entryPrice + (risk * 2),
        profit: (risk * 2) / entryPrice,
        RR: "1:2"
      },
      target3: {
        price: entryPrice + (risk * 3),
        profit: (risk * 3) / entryPrice,
        RR: "1:3"
      }
    };
  }
  
  validateEntry(entryPrice, stopLoss, marketData) {
    const risk = entryPrice - stopLoss;
    const potentialReward = this.estimateReward(marketData);
    
    const rrRatio = potentialReward / risk;
    
    return {
      valid: rrRatio >= this.minRR,
      ratio: rrRatio,
      message: rrRatio >= this.minRR 
        ? \`좋은 RR 비율: 1:\${rrRatio.toFixed(1)}\`
        : \`낮은 RR 비율: 1:\${rrRatio.toFixed(1)}\`
    };
  }
}
\`\`\`

## 통합 전략

### 상황별 손절/익절 조합
\`\`\`javascript
const integratedStrategies = {
  // 보수적 전략
  conservative: {
    name: "안전 우선",
    stopLoss: {
      type: "fixed",
      value: 0.03,
      trailing: {
        enabled: true,
        activation: 0.05,
        distance: 0.02
      }
    },
    takeProfit: {
      type: "scaled",
      targets: [
        { ratio: 0.5, profit: 0.05 },
        { ratio: 0.5, profit: 0.08 }
      ]
    }
  },
  
  // 스윙 트레이딩
  swing: {
    name: "스윙 트레이딩",
    stopLoss: {
      type: "atr",
      multiplier: 2,
      max: 0.07
    },
    takeProfit: {
      type: "rr_based",
      minRR: 2,
      partialTake: true
    }
  },
  
  // 스캘핑
  scalping: {
    name: "빠른 회전",
    stopLoss: {
      type: "fixed",
      value: 0.02,
      strict: true
    },
    takeProfit: {
      type: "fixed",
      value: 0.03,
      timeLimit: 3600  // 1시간
    }
  }
};
\`\`\`

### 실시간 관리 시스템
\`\`\`javascript
class StopLossTakeProfitManager {
  constructor(strategy, position) {
    this.strategy = strategy;
    this.position = position;
    this.trailingStop = null;
    this.executedTargets = [];
  }
  
  async update(currentPrice, marketData) {
    const result = {
      action: null,
      reason: null,
      details: {}
    };
    
    // 손절 체크 (최우선)
    const stopLossCheck = this.checkStopLoss(currentPrice);
    if (stopLossCheck.triggered) {
      result.action = 'SELL_ALL';
      result.reason = 'STOP_LOSS';
      result.details = stopLossCheck;
      return result;
    }
    
    // 트레일링 스탑 업데이트
    if (this.strategy.stopLoss.trailing?.enabled) {
      const trailingUpdate = this.updateTrailingStop(currentPrice);
      if (trailingUpdate.triggered) {
        result.action = 'SELL_ALL';
        result.reason = 'TRAILING_STOP';
        result.details = trailingUpdate;
        return result;
      }
    }
    
    // 익절 체크
    const takeProfitCheck = this.checkTakeProfit(currentPrice, marketData);
    if (takeProfitCheck.triggered) {
      result.action = takeProfitCheck.partial ? 'SELL_PARTIAL' : 'SELL_ALL';
      result.reason = 'TAKE_PROFIT';
      result.details = takeProfitCheck;
      return result;
    }
    
    // 시간 기반 청산 체크
    const timeCheck = this.checkTimeExit(currentPrice);
    if (timeCheck.triggered) {
      result.action = 'SELL_ALL';
      result.reason = 'TIME_EXIT';
      result.details = timeCheck;
    }
    
    return result;
  }
  
  checkStopLoss(currentPrice) {
    const loss = (currentPrice - this.position.entryPrice) / this.position.entryPrice;
    const stopLevel = -this.strategy.stopLoss.value;
    
    if (loss <= stopLevel) {
      return {
        triggered: true,
        loss: loss,
        exitPrice: currentPrice,
        savedFromFurtherLoss: true
      };
    }
    
    return { triggered: false, currentLoss: loss };
  }
  
  adjustForMarketCondition(marketCondition) {
    // 극심한 변동성에서는 손절 확대
    if (marketCondition.extremeVolatility) {
      this.strategy.stopLoss.value *= 1.5;
      console.log("극심한 변동성 감지: 손절 범위 확대");
    }
    
    // 강한 추세에서는 익절 목표 상향
    if (marketCondition.strongTrend) {
      if (this.strategy.takeProfit.type === 'fixed') {
        this.strategy.takeProfit.value *= 1.3;
      }
      console.log("강한 추세 감지: 익절 목표 상향");
    }
  }
}
\`\`\`

## 심리적 요소와 실행

### 손절 실행의 어려움
\`\`\`javascript
const psychologicalHelpers = {
  // 손절 주저 극복
  stopLossReminders: [
    "손절은 보험료다",
    "작은 손실이 큰 손실을 막는다",
    "다음 기회는 반드시 온다",
    "계좌를 지키는 것이 최우선"
  ],
  
  // 자동 실행 강제
  forceExecution: {
    enabled: true,
    override: false,  // 수동 개입 불가
    notification: "손절 자동 실행됨",
    
    execute: async function(position, currentPrice) {
      // 주문 즉시 실행
      const order = await placeMarketSellOrder(position);
      
      // 쿨다운 적용
      await applyCooldown(position.coin, 1800); // 30분
      
      // 리포트 생성
      return {
        executed: true,
        loss: position.unrealizedLoss,
        lesson: "손절은 다음 기회를 위한 준비"
      };
    }
  }
};
\`\`\`

### 익절의 유연성
\`\`\`javascript
// 시장 상황에 따른 익절 조정
function adaptiveTakeProfit(position, marketData) {
  const baseTarget = position.takeProfitTarget;
  let adjustedTarget = baseTarget;
  
  // 모멘텀이 강하면 목표 상향
  if (marketData.momentum > 0.8) {
    adjustedTarget *= 1.2;
    console.log("강한 모멘텀: 익절 목표 20% 상향");
  }
  
  // 저항선 근처면 조기 익절
  if (Math.abs(marketData.price - marketData.resistance) < 0.01) {
    adjustedTarget *= 0.9;
    console.log("저항선 근접: 조기 익절 권장");
  }
  
  // 뉴스나 이벤트 확인
  if (marketData.upcomingNews) {
    adjustedTarget *= 0.8;
    console.log("뉴스 대기: 안전한 익절 권장");
  }
  
  return adjustedTarget;
}
\`\`\`

<div class="warning">
⚠️ **중요**: 손절은 선택이 아닌 필수입니다. 한 번의 큰 손실이 여러 번의 수익을 날릴 수 있습니다.
</div>

<div class="success">
✅ **팁**: 진입 전에 손절가와 익절가를 미리 정하고, 절대 감정적으로 변경하지 마세요.
</div>
    `,
  },
  // Calculations 섹션들
  'calculations.indicator-calculations': {
    title: '기술적 지표 계산법',
    content: `
# 기술적 지표 계산법

## RSI (Relative Strength Index)

### 계산 과정
\`\`\`javascript
function calculateRSI(prices, period = 14) {
  const changes = [];
  
  // 1. 가격 변화량 계산
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  // 2. 상승분과 하락분 분리
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  // 3. 평균 계산 (첫 번째는 단순평균)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  
  const rsiValues = [];
  
  // 4. RSI 계산
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    rsiValues.push(rsi);
  }
  
  return rsiValues;
}
\`\`\`

## MACD 계산

### 지수이동평균 (EMA)
\`\`\`javascript
function calculateEMA(prices, period) {
  const multiplier = 2 / (period + 1);
  const ema = [prices[0]]; // 첫 번째 값은 그대로
  
  for (let i = 1; i < prices.length; i++) {
    const value = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(value);
  }
  
  return ema;
}

// MACD 계산
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  // MACD 라인 = 12일 EMA - 26일 EMA
  const macdLine = ema12.map((val, idx) => val - ema26[idx]);
  
  // Signal 라인 = MACD의 9일 EMA
  const signalLine = calculateEMA(macdLine, 9);
  
  // 히스토그램 = MACD - Signal
  const histogram = macdLine.map((val, idx) => val - signalLine[idx]);
  
  return { macdLine, signalLine, histogram };
}
\`\`\`

## 볼린저밴드 계산

### 표준편차와 밴드
\`\`\`javascript
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const bands = [];
  
  for (let i = period - 1; i < prices.length; i++) {
    // 중심선 (SMA)
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b) / period;
    
    // 표준편차
    const variance = slice.reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    const std = Math.sqrt(variance);
    
    bands.push({
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev),
      bandwidth: (std * stdDev * 2) / sma
    });
  }
  
  return bands;
}
\`\`\`

<div class="info">
💡 **팁**: 지표 계산을 이해하면 파라미터 조정의 의미를 더 잘 알 수 있습니다.
</div>
    `,
  },
};

// Coin Settings sections
export const coinSettingsContents = {
  'coin-settings': {
    title: '코인별 세부 설정',
    content: `
# 코인별 세부 설정

## 개요

각 코인은 고유한 특성을 가지고 있어, 획일적인 전략보다는 코인별 맞춤 설정이 필요합니다.

### 코인 특성별 분류

#### 메이저 코인 (BTC, ETH)
\`\`\`
특징:
- 낮은 변동성
- 높은 유동성
- 뉴스 영향 큼
- 기관 투자 많음

추천 설정:
- 큰 포지션 가능
- 낮은 신뢰도 임계값
- 긴 보유 기간
\`\`\`

#### 중형 알트코인
\`\`\`
특징:
- 중간 변동성
- 적절한 유동성
- 프로젝트 진행 상황 중요

추천 설정:
- 중간 포지션
- 표준 신뢰도 임계값
- 기술적 분석 중심
\`\`\`

#### 소형 알트코인
\`\`\`
특징:
- 높은 변동성
- 낮은 유동성
- 펌핑/덤핑 위험

추천 설정:
- 작은 포지션
- 높은 신뢰도 임계값
- 엄격한 손절
\`\`\`

<div class="info">
💡 **팁**: 처음에는 메이저 코인으로 시작하고, 경험이 쌓이면 점차 다양화하세요.
</div>
    `,
  },
  'coin-settings.add-coin': {
    title: '분석 설정 추가',
    content: `
# 분석 설정 추가

## 새 코인 추가하기

### 1단계: 코인 선택
\`\`\`
1. 설정 > 거래 설정 > 코인별 설정 이동
2. "코인 추가" 버튼 클릭
3. 드롭다운에서 원하는 코인 선택
   - 검색 기능 활용
   - KRW 마켓만 표시
\`\`\`

### 2단계: 기본 정보 입력
\`\`\`javascript
{
  "symbol": "BTC",
  "name": "비트코인",
  "enabled": true,
  "category": "major",  // major, mid, small
  "description": "디지털 금"
}
\`\`\`

### 3단계: 거래 파라미터 설정
\`\`\`javascript
{
  "trading": {
    "minOrderAmount": 5000,      // 최소 주문 금액
    "maxOrderAmount": 5000000,   // 최대 주문 금액
    "defaultPosition": 0.1,      // 기본 포지션 크기 (10%)
    "maxPosition": 0.3           // 최대 포지션 크기 (30%)
  }
}
\`\`\`

## 분석 설정 구성

### 신뢰도 임계값
\`\`\`javascript
{
  "confidence": {
    "buyThreshold": 70,   // 매수 신뢰도 (기본: 70%)
    "sellThreshold": 75,  // 매도 신뢰도 (기본: 75%)
    "strongBuy": 85,      // 강력 매수 (포지션 증가)
    "strongSell": 90      // 강력 매도 (전량 매도)
  }
}
\`\`\`

### 지표별 가중치
\`\`\`javascript
{
  "indicators": {
    "rsi": {
      "enabled": true,
      "weight": 0.15,
      "params": { "period": 14 }
    },
    "macd": {
      "enabled": true,
      "weight": 0.20,
      "params": { "fast": 12, "slow": 26, "signal": 9 }
    },
    "bollinger": {
      "enabled": true,
      "weight": 0.15,
      "params": { "period": 20, "stdDev": 2 }
    },
    "ma": {
      "enabled": true,
      "weight": 0.20,
      "params": { "short": 20, "long": 50 }
    },
    "volume": {
      "enabled": true,
      "weight": 0.15,
      "params": { "period": 20 }
    },
    "ai": {
      "enabled": true,
      "weight": 0.15
    }
  }
}
\`\`\`

### 리스크 관리
\`\`\`javascript
{
  "risk": {
    "stopLoss": 0.05,        // 5% 손절
    "takeProfit": 0.15,      // 15% 익절
    "trailingStop": {
      "enabled": true,
      "activation": 0.10,    // 10% 수익 시 활성화
      "distance": 0.03       // 3% 간격 유지
    },
    "cooldown": 300          // 5분 쿨다운
  }
}
\`\`\`

## 고급 설정

### 시간대별 설정
\`\`\`javascript
{
  "timeSettings": {
    "activeHours": {
      "enabled": true,
      "start": "09:00",
      "end": "23:00",
      "timezone": "Asia/Seoul"
    },
    "weekendTrading": false,
    "holidayTrading": false
  }
}
\`\`\`

### 시장 상황별 조정
\`\`\`javascript
{
  "marketAdaptation": {
    "volatilityAdjustment": {
      "enabled": true,
      "highVolatility": {
        "threshold": 0.05,   // 5% 이상 변동
        "positionMultiplier": 0.5,
        "confidenceBonus": 10
      },
      "lowVolatility": {
        "threshold": 0.01,   // 1% 이하 변동
        "positionMultiplier": 1.5,
        "confidencePenalty": 5
      }
    }
  }
}
\`\`\`

## 템플릿 활용

### BTC 템플릿
\`\`\`javascript
{
  "template": "btc_stable",
  "description": "비트코인 안정적 운용",
  "settings": {
    "position": { "default": 0.2, "max": 0.4 },
    "confidence": { "buy": 65, "sell": 80 },
    "risk": { "stopLoss": 0.03, "takeProfit": 0.10 },
    "indicators": {
      "ma": { "weight": 0.30 },
      "volume": { "weight": 0.25 }
    }
  }
}
\`\`\`

### 변동성 코인 템플릿
\`\`\`javascript
{
  "template": "high_volatility",
  "description": "고변동성 코인용",
  "settings": {
    "position": { "default": 0.05, "max": 0.1 },
    "confidence": { "buy": 80, "sell": 85 },
    "risk": { "stopLoss": 0.08, "takeProfit": 0.25 },
    "indicators": {
      "rsi": { "weight": 0.25 },
      "bollinger": { "weight": 0.25 }
    }
  }
}
\`\`\`

## 설정 검증

### 백테스트 권장
\`\`\`
1. 새 설정 추가 후 즉시 백테스트
2. 최소 3개월 데이터로 검증
3. 다양한 시장 상황 포함
4. 실거래 전 시뮬레이션 필수
\`\`\`

<div class="success">
✅ **핵심**: 각 코인의 특성을 이해하고 그에 맞는 설정을 적용하세요.
</div>
    `,
  },
  'coin-settings.weights': {
    title: '가중치 커스터마이징',
    content: `
# 가중치 커스터마이징

## 가중치의 의미

가중치는 각 지표가 최종 신뢰도 점수에 미치는 영향력을 결정합니다.

### 가중치 합계
\`\`\`
모든 가중치의 합 = 1.0 (100%)

예시:
RSI: 0.15 (15%)
MACD: 0.20 (20%)
Bollinger: 0.15 (15%)
MA: 0.20 (20%)
Volume: 0.15 (15%)
AI: 0.15 (15%)
합계: 1.00 (100%)
\`\`\`

## 지표별 특성과 가중치

### RSI (상대강도지수)
\`\`\`javascript
{
  "rsi": {
    "description": "과매수/과매도 판단",
    "bestFor": "횡보장, 단기 반전",
    "recommendedWeight": {
      "trending": 0.10,    // 추세장에서는 낮게
      "sideways": 0.25,    // 횡보장에서는 높게
      "volatile": 0.20     // 변동성 장에서는 중간
    }
  }
}
\`\`\`

### MACD
\`\`\`javascript
{
  "macd": {
    "description": "추세 전환 포착",
    "bestFor": "중장기 추세, 모멘텀",
    "recommendedWeight": {
      "trending": 0.25,    // 추세장에서 높게
      "sideways": 0.15,    // 횡보장에서 낮게
      "volatile": 0.20     // 변동성 장에서 중간
    }
  }
}
\`\`\`

### 볼린저밴드
\`\`\`javascript
{
  "bollinger": {
    "description": "변동성과 가격 범위",
    "bestFor": "변동성 판단, 극단 포착",
    "recommendedWeight": {
      "trending": 0.15,
      "sideways": 0.20,
      "volatile": 0.25     // 변동성 장에서 가장 유용
    }
  }
}
\`\`\`

## 가중치 조정 전략

### 시장 상황별 조정
\`\`\`javascript
// 상승 추세장
const bullMarketWeights = {
  rsi: 0.10,        // 과매수 신호 무시
  macd: 0.25,       // 추세 확인 중요
  ma: 0.25,         // 이평선 지지 확인
  volume: 0.20,     // 거래량 확인
  bollinger: 0.10,  // 밴드 이탈 무시
  ai: 0.10
};

// 하락 추세장
const bearMarketWeights = {
  rsi: 0.20,        // 과매도 반등 노림
  macd: 0.20,       // 추세 전환 감지
  ma: 0.15,         // 저항선 확인
  volume: 0.15,     // 매도 압력 확인
  bollinger: 0.20,  // 하단 지지 확인
  ai: 0.10
};

// 횡보장
const sidewaysWeights = {
  rsi: 0.25,        // 박스권 상하단
  macd: 0.10,       // 추세 신호 약함
  ma: 0.15,         // 중심선 역할
  volume: 0.15,     // 돌파 확인
  bollinger: 0.25,  // 밴드 폭 활용
  ai: 0.10
};
\`\`\`

### 코인 특성별 조정
\`\`\`javascript
// BTC (안정적)
const btcWeights = {
  ma: 0.30,         // 장기 추세 중요
  volume: 0.25,     // 기관 움직임
  macd: 0.20,       // 추세 전환
  rsi: 0.10,        // 단기 신호 약함
  bollinger: 0.10,
  ai: 0.05
};

// 고변동성 알트코인
const altcoinWeights = {
  rsi: 0.25,        // 극단적 움직임
  bollinger: 0.25,  // 변동성 중요
  volume: 0.20,     // 펌핑 감지
  macd: 0.15,
  ma: 0.10,
  ai: 0.05
};
\`\`\`

## 동적 가중치 시스템

### 성과 기반 자동 조정
\`\`\`javascript
class DynamicWeightManager {
  constructor() {
    this.performance = {};
    this.baseWeights = {
      rsi: 0.15,
      macd: 0.20,
      bollinger: 0.15,
      ma: 0.20,
      volume: 0.15,
      ai: 0.15
    };
  }
  
  updatePerformance(indicator, success) {
    if (!this.performance[indicator]) {
      this.performance[indicator] = { success: 0, total: 0 };
    }
    
    this.performance[indicator].total++;
    if (success) this.performance[indicator].success++;
  }
  
  adjustWeights() {
    const indicators = Object.keys(this.baseWeights);
    const successRates = {};
    
    // 각 지표의 성공률 계산
    indicators.forEach(ind => {
      const perf = this.performance[ind];
      if (perf && perf.total > 20) {
        successRates[ind] = perf.success / perf.total;
      } else {
        successRates[ind] = 0.5; // 기본값
      }
    });
    
    // 성공률에 따라 가중치 조정
    const totalRate = Object.values(successRates).reduce((a, b) => a + b, 0);
    const adjustedWeights = {};
    
    indicators.forEach(ind => {
      adjustedWeights[ind] = successRates[ind] / totalRate;
    });
    
    return this.smoothWeights(adjustedWeights);
  }
  
  smoothWeights(newWeights) {
    // 급격한 변화 방지 (30% 반영)
    const smoothed = {};
    
    Object.keys(this.baseWeights).forEach(ind => {
      smoothed[ind] = this.baseWeights[ind] * 0.7 + newWeights[ind] * 0.3;
    });
    
    return smoothed;
  }
}
\`\`\`

## 가중치 최적화 도구

### A/B 테스트
\`\`\`javascript
async function testWeightSets(coinSymbol, weightSets, period = 90) {
  const results = [];
  
  for (const [name, weights] of Object.entries(weightSets)) {
    const backtest = await runBacktest({
      symbol: coinSymbol,
      weights: weights,
      period: period
    });
    
    results.push({
      name: name,
      weights: weights,
      performance: {
        totalReturn: backtest.totalReturn,
        winRate: backtest.winRate,
        maxDrawdown: backtest.maxDrawdown,
        sharpeRatio: backtest.sharpeRatio
      }
    });
  }
  
  // 최적 가중치 선택
  return results.sort((a, b) => 
    b.performance.sharpeRatio - a.performance.sharpeRatio
  )[0];
}
\`\`\`

### 가중치 시각화
\`\`\`javascript
function visualizeWeights(weights) {
  const chart = {
    type: 'radar',
    data: {
      labels: Object.keys(weights),
      datasets: [{
        label: '가중치 분포',
        data: Object.values(weights),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        pointBackgroundColor: 'rgb(54, 162, 235)'
      }]
    },
    options: {
      scale: {
        ticks: {
          beginAtZero: true,
          max: 0.3
        }
      }
    }
  };
  
  return chart;
}
\`\`\`

## 실전 가중치 관리

### 주기적 검토
\`\`\`
매주 검토:
1. 각 지표의 적중률 확인
2. 시장 상황 변화 체크
3. 필요시 미세 조정

매월 검토:
1. 전체적인 성과 분석
2. 가중치 재배분 검토
3. 새로운 조합 테스트
\`\`\`

### 가중치 변경 시 주의사항
\`\`\`
DO:
✅ 충분한 백테스트 후 적용
✅ 점진적으로 조정 (5% 단위)
✅ 변경 사유 기록
✅ 이전 설정 백업

DON'T:
❌ 감정적인 변경
❌ 너무 잦은 조정
❌ 극단적인 편중
❌ 검증 없는 적용
\`\`\`

<div class="info">
💡 **팁**: 가중치는 요리의 양념과 같습니다. 조금씩 조정하며 최적의 조합을 찾으세요.
</div>
    `,
  },
  'coin-settings.position-sizing': {
    title: '투자금액과 비율',
    content: `
# 투자금액과 비율

## 포지션 사이징의 중요성

적절한 포지션 크기는 수익을 극대화하면서도 리스크를 관리하는 핵심입니다.

### 기본 원칙
\`\`\`
1. 분산 투자
   - 한 코인에 전체 자금의 20% 이하
   - 최소 3-5개 코인으로 분산

2. 리스크 관리
   - 거래당 최대 손실: 총 자금의 2%
   - 일일 최대 손실: 총 자금의 5%

3. 유동성 확보
   - 현금 비중 20-30% 유지
   - 추가 매수 여력 확보
\`\`\`

## 투자 금액 계산

### 고정 금액 방식
\`\`\`javascript
// 모든 거래에 동일한 금액 사용
const fixedAmount = {
  method: "fixed",
  amount: 1000000,  // 100만원
  pros: [
    "간단한 관리",
    "일정한 리스크",
    "초보자 적합"
  ],
  cons: [
    "자금 효율성 낮음",
    "성장 제한"
  ]
};
\`\`\`

### 비율 기반 방식
\`\`\`javascript
// 총 자금의 일정 비율 사용
const percentageBased = {
  method: "percentage",
  settings: {
    defaultPercent: 10,    // 기본 10%
    minAmount: 50000,      // 최소 5만원
    maxAmount: 5000000,    // 최대 500만원
    
    // 신뢰도별 조정
    confidenceMultiplier: {
      "70-75": 0.7,  // 70% 크기
      "75-80": 1.0,  // 100% 크기
      "80-85": 1.3,  // 130% 크기
      "85+": 1.5     // 150% 크기
    }
  }
};

// 실제 계산 예시
function calculatePositionSize(balance, confidence) {
  const basePercent = 10;
  let multiplier = 1.0;
  
  if (confidence >= 85) multiplier = 1.5;
  else if (confidence >= 80) multiplier = 1.3;
  else if (confidence >= 75) multiplier = 1.0;
  else multiplier = 0.7;
  
  const amount = balance * (basePercent / 100) * multiplier;
  
  return Math.max(50000, Math.min(5000000, amount));
}
\`\`\`

### Kelly Criterion 방식
\`\`\`javascript
// 통계 기반 최적 크기
const kellyCriterion = {
  method: "kelly",
  settings: {
    fraction: 0.25,  // 1/4 Kelly (안전)
    
    // 필요 통계
    stats: {
      winRate: 0.6,      // 60% 승률
      avgWin: 0.08,      // 평균 8% 수익
      avgLoss: 0.04      // 평균 4% 손실
    }
  },
  
  calculate: function(balance) {
    const f = (this.stats.winRate * (this.stats.avgWin / this.stats.avgLoss) - (1 - this.stats.winRate)) / (this.stats.avgWin / this.stats.avgLoss);
    const kellyPercent = f * this.fraction;
    
    return balance * Math.max(0.01, Math.min(0.25, kellyPercent));
  }
};
\`\`\`

## 코인별 비율 설정

### 포트폴리오 구성
\`\`\`javascript
const portfolioAllocation = {
  // 전체 자금 배분
  total: 10000000,  // 1천만원
  
  // 카테고리별 배분
  categories: {
    major: {
      allocation: 0.5,  // 50%
      coins: {
        "BTC": { weight: 0.6, min: 0.1, max: 0.3 },
        "ETH": { weight: 0.4, min: 0.05, max: 0.2 }
      }
    },
    
    mid: {
      allocation: 0.3,  // 30%
      coins: {
        "ADA": { weight: 0.4, min: 0.02, max: 0.1 },
        "DOT": { weight: 0.3, min: 0.02, max: 0.1 },
        "LINK": { weight: 0.3, min: 0.02, max: 0.1 }
      }
    },
    
    small: {
      allocation: 0.2,  // 20%
      coins: {
        // 5-10개 소형 코인
        // 각 2-4% 배분
      }
    }
  }
};
\`\`\`

### 동적 리밸런싱
\`\`\`javascript
class PortfolioRebalancer {
  constructor(targetAllocations) {
    this.targets = targetAllocations;
    this.threshold = 0.05;  // 5% 이상 벗어나면 리밸런싱
  }
  
  checkRebalanceNeeded(currentPortfolio) {
    for (const coin in this.targets) {
      const target = this.targets[coin];
      const current = currentPortfolio[coin] || 0;
      const deviation = Math.abs(current - target) / target;
      
      if (deviation > this.threshold) {
        return true;
      }
    }
    return false;
  }
  
  calculateRebalanceTrades(currentPortfolio, totalValue) {
    const trades = [];
    
    for (const coin in this.targets) {
      const targetValue = totalValue * this.targets[coin];
      const currentValue = currentPortfolio[coin]?.value || 0;
      const difference = targetValue - currentValue;
      
      if (Math.abs(difference) > 50000) {  // 5만원 이상 차이
        trades.push({
          coin: coin,
          action: difference > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(difference)
        });
      }
    }
    
    return trades;
  }
}
\`\`\`

## 위험 등급별 설정

### 보수적 투자자
\`\`\`javascript
const conservativeSettings = {
  riskProfile: "conservative",
  
  allocation: {
    cash: 0.4,         // 40% 현금
    major: 0.5,        // 50% 메이저
    others: 0.1        // 10% 기타
  },
  
  positionSizing: {
    maxPerTrade: 0.05,     // 거래당 5%
    maxPerCoin: 0.15,      // 코인당 15%
    stopLoss: 0.03,        // 3% 손절
    confidenceRequired: 80  // 80% 이상만
  }
};
\`\`\`

### 공격적 투자자
\`\`\`javascript
const aggressiveSettings = {
  riskProfile: "aggressive",
  
  allocation: {
    cash: 0.1,         // 10% 현금
    major: 0.3,        // 30% 메이저
    others: 0.6        // 60% 알트
  },
  
  positionSizing: {
    maxPerTrade: 0.2,      // 거래당 20%
    maxPerCoin: 0.4,       // 코인당 40%
    stopLoss: 0.1,         // 10% 손절
    confidenceRequired: 65  // 65% 이상
  }
};
\`\`\`

## 자금 관리 전략

### 피라미딩
\`\`\`javascript
// 수익 중 추가 매수
const pyramidStrategy = {
  initial: 0.5,      // 초기 50%
  levels: [
    { profit: 0.05, add: 0.3 },  // 5% 수익 시 30% 추가
    { profit: 0.10, add: 0.2 }   // 10% 수익 시 20% 추가
  ],
  
  maxPosition: 0.2,  // 총 자금의 20% 한도
  
  execute: function(currentProfit, currentPosition) {
    for (const level of this.levels) {
      if (currentProfit >= level.profit && 
          currentPosition < this.maxPosition) {
        return {
          action: 'ADD',
          amount: level.add
        };
      }
    }
    return null;
  }
};
\`\`\`

### 마틴게일 방지
\`\`\`javascript
// 손실 후 베팅 증가 방지
const antiMartingale = {
  enabled: true,
  
  rules: [
    "연속 손실 시 포지션 축소",
    "2연패: 50% 크기",
    "3연패: 25% 크기",
    "4연패 이상: 거래 중단"
  ],
  
  checkStreak: function(recentTrades) {
    let lossStreak = 0;
    
    for (let i = recentTrades.length - 1; i >= 0; i--) {
      if (recentTrades[i].profit < 0) {
        lossStreak++;
      } else {
        break;
      }
    }
    
    if (lossStreak >= 4) return { action: 'STOP' };
    if (lossStreak === 3) return { multiplier: 0.25 };
    if (lossStreak === 2) return { multiplier: 0.5 };
    
    return { multiplier: 1.0 };
  }
};
\`\`\`

## 실전 예시

### 시나리오 1: 1천만원 운용
\`\`\`
초기 자금: 10,000,000원

포트폴리오 구성:
- 현금: 2,000,000원 (20%)
- BTC: 3,000,000원 (30%)
- ETH: 2,000,000원 (20%)
- 중형 알트 3종: 각 700,000원 (21%)
- 소형 알트 3종: 각 300,000원 (9%)

거래 규칙:
- 기본 거래 크기: 500,000원 (5%)
- 최대 거래 크기: 1,500,000원 (15%)
- 신뢰도 70% 이상만 거래
- 일일 최대 3회 거래
\`\`\`

### 시나리오 2: 성장 전략
\`\`\`javascript
const growthStrategy = {
  phase1: {
    capital: 10000000,
    focus: "안정성",
    allocation: { btc: 0.5, eth: 0.3, cash: 0.2 }
  },
  
  phase2: {
    trigger: "20% 수익 달성",
    capital: 12000000,
    focus: "다각화",
    allocation: { btc: 0.3, eth: 0.2, alts: 0.3, cash: 0.2 }
  },
  
  phase3: {
    trigger: "50% 수익 달성",
    capital: 15000000,
    focus: "수익 극대화",
    allocation: { btc: 0.2, eth: 0.2, alts: 0.5, cash: 0.1 }
  }
};
\`\`\`

<div class="success">
✅ **핵심**: 자금 관리는 수익률만큼 중요합니다. 욕심을 버리고 원칙을 지키세요.
</div>
    `,
  },
  'coin-settings.trading-hours': {
    title: '거래 시간대 설정',
    content: `
# 거래 시간대 설정

## 24시간 시장의 특성

암호화폐는 24시간 거래되지만, 시간대별로 특성이 다릅니다.

### 주요 거래 시간대
\`\`\`
한국 시간 기준:

1. 아시아 세션 (06:00 - 15:00)
   - 한국, 일본, 중국 활발
   - 비교적 안정적 움직임
   - 알트코인 활발

2. 유럽 세션 (15:00 - 24:00)
   - 유럽 기관 참여
   - 거래량 증가
   - 변동성 상승

3. 미국 세션 (21:00 - 06:00)
   - 가장 큰 거래량
   - 높은 변동성
   - 주요 뉴스 발표
\`\`\`

## 시간대별 전략

### 코인별 최적 거래 시간
\`\`\`javascript
const tradingHours = {
  "BTC": {
    optimal: {
      start: "21:00",
      end: "02:00",
      reason: "미국 시장 활발"
    },
    avoid: {
      start: "03:00",
      end: "06:00",
      reason: "거래량 감소"
    }
  },
  
  "ETH": {
    optimal: {
      start: "15:00",
      end: "23:00",
      reason: "유럽+미국 겹침"
    }
  },
  
  "KoreanAlts": {
    optimal: {
      start: "09:00",
      end: "15:00",
      reason: "국내 투자자 활발"
    }
  }
};
\`\`\`

### 자동 시간대 설정
\`\`\`javascript
class TradingScheduler {
  constructor(coin) {
    this.coin = coin;
    this.timezone = "Asia/Seoul";
    this.schedule = this.getDefaultSchedule(coin);
  }
  
  getDefaultSchedule(coin) {
    const schedules = {
      major: {
        // BTC, ETH 등
        weekday: { start: "09:00", end: "23:00" },
        weekend: { start: "10:00", end: "22:00" }
      },
      
      korean: {
        // 국내 선호 알트
        weekday: { start: "09:00", end: "18:00" },
        weekend: { start: "10:00", end: "16:00" }
      },
      
      volatile: {
        // 고변동성 코인
        weekday: { start: "14:00", end: "22:00" },
        weekend: null  // 주말 거래 안함
      }
    };
    
    return schedules[this.getCoinCategory(coin)] || schedules.major;
  }
  
  isTradeAllowed(timestamp) {
    const now = new Date(timestamp);
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();
    
    // 주말 체크
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const schedule = isWeekend ? this.schedule.weekend : this.schedule.weekday;
    
    if (!schedule) return false;
    
    const currentTime = hour * 60 + minute;
    const [startHour, startMin] = schedule.start.split(':').map(Number);
    const [endHour, endMin] = schedule.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  }
}
\`\`\`

## 시간대별 파라미터 조정

### 변동성 기반 조정
\`\`\`javascript
const timeBasedAdjustments = {
  // 새벽 시간 (낮은 변동성)
  "00:00-06:00": {
    positionMultiplier: 0.7,
    confidenceBonus: -5,
    indicators: {
      volume: { weight: 0.25 },  // 거래량 중요
      ma: { weight: 0.30 }       // 추세 중요
    }
  },
  
  // 오전 시간 (중간 변동성)
  "06:00-12:00": {
    positionMultiplier: 1.0,
    confidenceBonus: 0,
    indicators: {
      // 표준 가중치
    }
  },
  
  // 오후 시간 (높은 변동성)
  "12:00-18:00": {
    positionMultiplier: 1.2,
    confidenceBonus: 5,
    indicators: {
      rsi: { weight: 0.25 },      // 과매수/과매도
      bollinger: { weight: 0.25 } // 변동성
    }
  },
  
  // 저녁 시간 (최고 변동성)
  "18:00-24:00": {
    positionMultiplier: 0.8,  // 리스크 관리
    confidenceBonus: 10,      // 명확한 신호만
    stopLoss: 0.03,          // 타이트한 손절
    indicators: {
      macd: { weight: 0.30 },    // 모멘텀
      volume: { weight: 0.25 }   // 거래량
    }
  }
};
\`\`\`

### 요일별 특성
\`\`\`javascript
const dayOfWeekPatterns = {
  monday: {
    description: "주초 조정",
    characteristics: [
      "주말 뉴스 반영",
      "포지션 정리",
      "방향성 탐색"
    ],
    strategy: {
      conservative: true,
      waitForDirection: true,
      reducedPosition: 0.8
    }
  },
  
  tuesday_thursday: {
    description: "활발한 거래",
    characteristics: [
      "정상 거래량",
      "트렌드 지속",
      "기술적 분석 유효"
    ],
    strategy: {
      normal: true,
      fullPosition: 1.0
    }
  },
  
  friday: {
    description: "주말 대비",
    characteristics: [
      "포지션 정리",
      "단기 매매 증가",
      "변동성 확대"
    ],
    strategy: {
      shortTerm: true,
      tightStopLoss: true,
      profitTaking: true
    }
  },
  
  weekend: {
    description: "주말 특성",
    characteristics: [
      "거래량 감소",
      "갑작스런 변동",
      "뉴스 영향 큼"
    ],
    strategy: {
      reduced: true,
      newsWatch: true,
      positionLimit: 0.5
    }
  }
};
\`\`\`

## 휴일/이벤트 관리

### 주요 이벤트 캘린더
\`\`\`javascript
const eventCalendar = {
  recurring: {
    // 매월 반복
    monthlyOptions: {
      date: "lastFriday",
      event: "선물 만기",
      impact: "high",
      strategy: {
        reducePosition: true,
        avoidNewEntry: true
      }
    },
    
    // 분기별
    quarterlyEarnings: {
      months: [1, 4, 7, 10],
      event: "주요 기업 실적",
      impact: "medium"
    }
  },
  
  scheduled: {
    // 예정된 이벤트
    "2024-01-11": {
      event: "BTC ETF 결정",
      impact: "critical",
      coins: ["BTC", "ETH"],
      strategy: {
        beforeEvent: "포지션 축소",
        afterEvent: "변동성 거래"
      }
    }
  },
  
  holidays: {
    korea: [
      "01-01", "02-10", "03-01", "05-05",
      "06-06", "08-15", "10-03", "12-25"
    ],
    us: [
      "01-01", "07-04", "11-28", "12-25"
    ]
  }
};
\`\`\`

### 이벤트 대응 전략
\`\`\`javascript
class EventHandler {
  constructor() {
    this.upcomingEvents = [];
    this.impactLevels = {
      low: { positionAdjust: 0.9, confidenceAdjust: 0 },
      medium: { positionAdjust: 0.7, confidenceAdjust: 5 },
      high: { positionAdjust: 0.5, confidenceAdjust: 10 },
      critical: { positionAdjust: 0.2, confidenceAdjust: 20 }
    };
  }
  
  checkUpcomingEvents(days = 3) {
    const events = [];
    const today = new Date();
    
    // 예정 이벤트 확인
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const dateStr = this.formatDate(checkDate);
      if (eventCalendar.scheduled[dateStr]) {
        events.push({
          date: dateStr,
          ...eventCalendar.scheduled[dateStr],
          daysUntil: i
        });
      }
    }
    
    return events;
  }
  
  adjustForEvent(baseSettings, event) {
    const impact = this.impactLevels[event.impact];
    
    return {
      ...baseSettings,
      positionSize: baseSettings.positionSize * impact.positionAdjust,
      confidenceThreshold: baseSettings.confidenceThreshold + impact.confidenceAdjust,
      stopLoss: baseSettings.stopLoss * 0.7,  // 더 타이트하게
      alert: \`이벤트 주의: \${event.event} (D-\${event.daysUntil})\`
    };
  }
}
\`\`\`

## 거래 세션 관리

### 세션별 최적화
\`\`\`javascript
const sessionManager = {
  sessions: {
    asia: {
      hours: "06:00-15:00 KST",
      characteristics: {
        volatility: "low-medium",
        volume: "medium",
        trends: "stable"
      },
      optimalCoins: ["BTC", "ETH", "Korean alts"],
      strategy: "trend_following"
    },
    
    europe: {
      hours: "15:00-24:00 KST",
      characteristics: {
        volatility: "medium-high",
        volume: "high",
        trends: "dynamic"
      },
      optimalCoins: ["BTC", "ETH", "DeFi"],
      strategy: "momentum"
    },
    
    us: {
      hours: "21:00-06:00 KST",
      characteristics: {
        volatility: "high",
        volume: "very high",
        trends: "aggressive"
      },
      optimalCoins: ["All majors"],
      strategy: "volatility_breakout"
    }
  },
  
  getCurrentSession() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 15) return 'asia';
    if (hour >= 15 && hour < 21) return 'europe';
    return 'us';
  },
  
  getSessionSettings(session) {
    return this.sessions[session];
  }
};
\`\`\`

### 자동 스케줄링
\`\`\`javascript
// 거래 스케줄 자동화
const autoScheduler = {
  enabled: true,
  
  rules: [
    {
      name: "주중 표준",
      days: [1, 2, 3, 4, 5],
      schedule: {
        start: "09:00",
        end: "23:00",
        breakTime: {
          start: "12:00",
          end: "13:00"
        }
      }
    },
    {
      name: "주말 제한",
      days: [0, 6],
      schedule: {
        start: "10:00",
        end: "18:00",
        maxTrades: 5
      }
    }
  ],
  
  specialRules: [
    {
      condition: "highVolatility",
      action: "extendHours",
      params: { until: "02:00" }
    },
    {
      condition: "lowVolume",
      action: "pauseTrading",
      duration: 3600  // 1시간
    }
  ]
};
\`\`\`

<div class="info">
💡 **팁**: 본인의 생활 패턴과 시장 특성을 고려하여 최적의 거래 시간을 찾으세요.
</div>
    `,
  },
  'coin-settings.volatility': {
    title: '변동성 자동 조정',
    content: `
# 변동성 자동 조정

## 변동성 측정과 활용

변동성은 리스크이자 기회입니다. 올바른 측정과 대응이 중요합니다.

### 변동성 지표
\`\`\`javascript
// ATR (Average True Range) 기반
function calculateVolatility(candles, period = 14) {
  const trueRanges = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i-1].close;
    
    // True Range = max(H-L, |H-PC|, |L-PC|)
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  // ATR 계산
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b) / period;
  
  // 변동성 비율 (현재가 대비)
  const volatilityRatio = atr / candles[candles.length - 1].close;
  
  return {
    atr: atr,
    ratio: volatilityRatio,
    level: getVolatilityLevel(volatilityRatio)
  };
}

function getVolatilityLevel(ratio) {
  if (ratio < 0.02) return 'very_low';
  if (ratio < 0.04) return 'low';
  if (ratio < 0.06) return 'medium';
  if (ratio < 0.10) return 'high';
  return 'extreme';
}
\`\`\`

## 변동성 기반 전략 조정

### 자동 조정 시스템
\`\`\`javascript
class VolatilityAdjuster {
  constructor() {
    this.baseSettings = {
      positionSize: 0.1,      // 10%
      stopLoss: 0.05,         // 5%
      takeProfit: 0.15,       // 15%
      confidenceThreshold: 70
    };
    
    this.adjustments = {
      very_low: {
        positionMultiplier: 1.5,
        stopLoss: 0.03,
        takeProfit: 0.08,
        confidenceAdjust: -5,
        strategy: "range_trading"
      },
      
      low: {
        positionMultiplier: 1.2,
        stopLoss: 0.04,
        takeProfit: 0.12,
        confidenceAdjust: 0,
        strategy: "trend_following"
      },
      
      medium: {
        positionMultiplier: 1.0,
        stopLoss: 0.05,
        takeProfit: 0.15,
        confidenceAdjust: 0,
        strategy: "balanced"
      },
      
      high: {
        positionMultiplier: 0.7,
        stopLoss: 0.08,
        takeProfit: 0.25,
        confidenceAdjust: 5,
        strategy: "momentum"
      },
      
      extreme: {
        positionMultiplier: 0.3,
        stopLoss: 0.12,
        takeProfit: 0.40,
        confidenceAdjust: 10,
        strategy: "scalping"
      }
    };
  }
  
  adjustForVolatility(volatilityLevel) {
    const adjustment = this.adjustments[volatilityLevel];
    
    return {
      positionSize: this.baseSettings.positionSize * adjustment.positionMultiplier,
      stopLoss: adjustment.stopLoss,
      takeProfit: adjustment.takeProfit,
      confidenceThreshold: this.baseSettings.confidenceThreshold + adjustment.confidenceAdjust,
      recommendedStrategy: adjustment.strategy
    };
  }
}
\`\`\`

### 실시간 변동성 모니터링
\`\`\`javascript
class VolatilityMonitor {
  constructor() {
    this.history = [];
    this.alertThresholds = {
      sudden_spike: 2.0,      // 평균 대비 200%
      prolonged_high: 1.5,    // 지속적 고변동성
      regime_change: 0.3      // 체제 전환
    };
  }
  
  update(currentVolatility) {
    this.history.push({
      timestamp: Date.now(),
      value: currentVolatility,
      level: getVolatilityLevel(currentVolatility)
    });
    
    // 최근 100개만 유지
    if (this.history.length > 100) {
      this.history.shift();
    }
    
    return this.checkAlerts();
  }
  
  checkAlerts() {
    const alerts = [];
    const recent = this.history.slice(-10);
    const avgVolatility = this.getAverageVolatility();
    const currentVol = recent[recent.length - 1].value;
    
    // 급격한 변동성 증가
    if (currentVol > avgVolatility * this.alertThresholds.sudden_spike) {
      alerts.push({
        type: 'SPIKE',
        severity: 'high',
        message: '급격한 변동성 증가 감지',
        action: 'REDUCE_POSITION'
      });
    }
    
    // 지속적 고변동성
    const highVolCount = recent.filter(v => 
      v.value > avgVolatility * this.alertThresholds.prolonged_high
    ).length;
    
    if (highVolCount > 7) {
      alerts.push({
        type: 'PROLONGED_HIGH',
        severity: 'medium',
        message: '지속적인 고변동성',
        action: 'ADJUST_STRATEGY'
      });
    }
    
    return alerts;
  }
  
  getVolatilityTrend() {
    if (this.history.length < 20) return 'insufficient_data';
    
    const recent = this.history.slice(-20);
    const firstHalf = recent.slice(0, 10);
    const secondHalf = recent.slice(10);
    
    const avgFirst = firstHalf.reduce((sum, v) => sum + v.value, 0) / 10;
    const avgSecond = secondHalf.reduce((sum, v) => sum + v.value, 0) / 10;
    
    const change = (avgSecond - avgFirst) / avgFirst;
    
    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  }
}
\`\`\`

## 변동성별 거래 전략

### 저변동성 전략
\`\`\`javascript
const lowVolatilityStrategy = {
  name: "Range Trading",
  
  conditions: {
    volatility: "< 2%",
    market: "sideways",
    volume: "normal"
  },
  
  settings: {
    // 박스권 상하단 활용
    indicators: {
      bollinger: { weight: 0.30 },
      rsi: { weight: 0.25 },
      support_resistance: { weight: 0.25 },
      volume: { weight: 0.20 }
    },
    
    // 작은 목표, 타이트한 손절
    targets: {
      entry: "밴드 하단 or RSI < 30",
      stopLoss: "2%",
      takeProfit: "5%",
      timeLimit: "24시간"
    },
    
    // 큰 포지션 가능
    position: {
      size: "15-20%",
      scaling: true
    }
  }
};
\`\`\`

### 고변동성 전략
\`\`\`javascript
const highVolatilityStrategy = {
  name: "Momentum Breakout",
  
  conditions: {
    volatility: "> 6%",
    market: "trending",
    volume: "high"
  },
  
  settings: {
    // 추세와 모멘텀 중시
    indicators: {
      macd: { weight: 0.30 },
      ma: { weight: 0.25 },
      volume: { weight: 0.25 },
      atr: { weight: 0.20 }
    },
    
    // 넓은 목표, 넓은 손절
    targets: {
      entry: "돌파 확인 후",
      stopLoss: "8%",
      takeProfit: "25%",
      trailingStop: true
    },
    
    // 작은 포지션
    position: {
      size: "5-7%",
      scaling: false
    }
  }
};
\`\`\`

## 변동성 필터링

### 거래 필터
\`\`\`javascript
class VolatilityFilter {
  constructor(settings) {
    this.minVolatility = settings.minVolatility || 0.01;
    this.maxVolatility = settings.maxVolatility || 0.10;
    this.adaptiveMode = settings.adaptiveMode || true;
  }
  
  shouldTrade(currentVolatility, signal) {
    // 기본 범위 체크
    if (currentVolatility < this.minVolatility) {
      return {
        allowed: false,
        reason: "변동성 너무 낮음",
        suggestion: "거래량 증가 대기"
      };
    }
    
    if (currentVolatility > this.maxVolatility) {
      return {
        allowed: false,
        reason: "변동성 너무 높음",
        suggestion: "안정화 대기"
      };
    }
    
    // 적응형 모드
    if (this.adaptiveMode) {
      return this.adaptiveCheck(currentVolatility, signal);
    }
    
    return { allowed: true };
  }
  
  adaptiveCheck(volatility, signal) {
    // 신호 강도와 변동성 매칭
    const signalStrength = signal.confidence;
    
    // 고변동성 + 약한 신호 = 거래 금지
    if (volatility > 0.06 && signalStrength < 80) {
      return {
        allowed: false,
        reason: "신호 대비 변동성 높음",
        suggestion: "더 강한 신호 대기"
      };
    }
    
    // 저변동성 + 강한 신호 = 포지션 증가
    if (volatility < 0.03 && signalStrength > 85) {
      return {
        allowed: true,
        positionMultiplier: 1.5,
        reason: "최적 조건"
      };
    }
    
    return { allowed: true, positionMultiplier: 1.0 };
  }
}
\`\`\`

## 변동성 예측

### 역사적 변동성 패턴
\`\`\`javascript
class VolatilityPredictor {
  constructor() {
    this.patterns = {
      preNews: {
        pattern: "뉴스 전 고요",
        prediction: "폭발적 변동 예상",
        action: "포지션 축소"
      },
      
      postSpike: {
        pattern: "급등/급락 후",
        prediction: "점진적 안정화",
        action: "단계적 진입"
      },
      
      weekend: {
        pattern: "주말 패턴",
        prediction: "낮은 변동성",
        action: "레인지 전략"
      }
    };
  }
  
  predictNextPeriod(historicalData) {
    const currentPattern = this.identifyPattern(historicalData);
    const prediction = this.patterns[currentPattern];
    
    return {
      pattern: currentPattern,
      expectedVolatility: this.calculateExpected(historicalData, currentPattern),
      confidence: this.getConfidence(historicalData),
      recommendation: prediction.action
    };
  }
  
  identifyPattern(data) {
    // GARCH 모델 간소화 버전
    const recent = data.slice(-24);  // 24시간
    const volatilities = recent.map(d => d.volatility);
    
    // 자기상관 체크
    const autocorrelation = this.calculateAutocorrelation(volatilities);
    
    // 클러스터링 체크
    const clustering = this.checkVolatilityClustering(volatilities);
    
    if (clustering.highFollowsHigh) return 'persistence';
    if (clustering.calmBeforeStorm) return 'preNews';
    
    return 'normal';
  }
}
\`\`\`

## 실전 적용 예시

### 자동 조정 시나리오
\`\`\`javascript
// 실시간 변동성 대응
async function handleVolatilityChange(coin, marketData) {
  const volatility = calculateVolatility(marketData.candles);
  const adjuster = new VolatilityAdjuster();
  const monitor = new VolatilityMonitor();
  
  // 변동성 업데이트 및 알림 체크
  const alerts = monitor.update(volatility.ratio);
  
  // 긴급 알림 처리
  if (alerts.some(a => a.severity === 'high')) {
    await emergencyAction(coin, alerts[0]);
    return;
  }
  
  // 전략 조정
  const adjustedSettings = adjuster.adjustForVolatility(volatility.level);
  
  // 로그
  console.log(\`[\${coin}] 변동성: \${volatility.level}\`);
  console.log(\`조정된 설정:\`, adjustedSettings);
  
  // 적용
  await applySettings(coin, adjustedSettings);
}

// 긴급 대응
async function emergencyAction(coin, alert) {
  if (alert.action === 'REDUCE_POSITION') {
    // 포지션 50% 축소
    await reducePosition(coin, 0.5);
    
    // 신규 진입 금지
    await pauseNewEntries(coin, 3600); // 1시간
  }
}
\`\`\`

<div class="warning">
⚠️ **주의**: 변동성이 극도로 높을 때는 거래를 자제하는 것이 현명할 수 있습니다.
</div>

<div class="info">
💡 **팁**: 변동성은 양날의 검입니다. 적절히 활용하면 수익 기회가 됩니다.
</div>
    `,
  },
  'trading-strategy.smart-order': {
    title: '스마트 주문 시스템',
    content: `
# 스마트 주문 시스템 ✨ NEW

## 개요

스마트 주문은 시장 상황을 실시간으로 분석하여 **시장가와 지정가를 자동으로 선택**하는 지능형 주문 시스템입니다.

<div class="success">
✅ **장점**: 체결 가능성을 높이면서도 유리한 가격에 거래할 수 있습니다.
</div>

## 작동 원리

### 호가창 분석
\`\`\`javascript
{
  "spread": "매수/매도 호가 차이",
  "imbalance": "매수/매도 압력 비율",
  "wall": "호가벽 감지",
  "trades": "최근 체결 동향"
}
\`\`\`

### 주문 타입 결정 로직

#### 매수 시 (BUY)
\`\`\`
1. 스프레드가 넓은 경우 (> 0.5%)
   → 지정가: 중간값으로 주문

2. 매도 압력이 강한 경우
   → 지정가: 최고 매수가로 대기

3. 매수 우세인 경우
   → 시장가: 빠른 진입

4. 일반적인 경우
   → 지정가: 최고 매수가 + 1호가
\`\`\`

#### 매도 시 (SELL)
\`\`\`
1. 스프레드가 넓은 경우 (> 0.5%)
   → 지정가: 중간값으로 주문

2. 급변동 시 (> 2%)
   → 시장가: 빠른 청산

3. 매도 우세인 경우
   → 시장가: 즉시 매도

4. 일반적인 경우
   → 지정가: 최저 매도가 - 1호가
\`\`\`

## 실제 사용 예시

### 예시 1: 매수 주문
\`\`\`
상황: BTC 현재가 5,000만원
- 매수호가: 4,999만원 (100 BTC)
- 매도호가: 5,001만원 (50 BTC)
- 스프레드: 0.04%

결정: 지정가 4,999.5만원
이유: 좁은 스프레드, 안정적 진입
\`\`\`

### 예시 2: 긴급 매도
\`\`\`
상황: ETH 급락 중
- 1분 내 -3% 하락
- 매도 우세 (70%)
- 거래량 급증

결정: 시장가 매도
이유: 추가 하락 방지, 빠른 청산
\`\`\`

## 호가 단위 자동 계산

<table>
<tr>
  <th>가격 범위</th>
  <th>호가 단위</th>
</tr>
<tr>
  <td>2,000,000원 이상</td>
  <td>1,000원</td>
</tr>
<tr>
  <td>1,000,000원 이상</td>
  <td>500원</td>
</tr>
<tr>
  <td>500,000원 이상</td>
  <td>100원</td>
</tr>
<tr>
  <td>100,000원 이상</td>
  <td>50원</td>
</tr>
<tr>
  <td>10,000원 이상</td>
  <td>10원</td>
</tr>
<tr>
  <td>1,000원 이상</td>
  <td>5원</td>
</tr>
<tr>
  <td>100원 이상</td>
  <td>1원</td>
</tr>
</table>

## 성능 향상

### 체결률 개선
- 시장가 대비: **슬리피지 50% 감소**
- 일반 지정가 대비: **체결률 30% 향상**

### 수익률 개선
- 평균 0.1~0.3% 추가 수익
- 누적 시 상당한 차이 발생

<div class="info">
💡 **팁**: 스마트 주문은 특히 변동성이 큰 시장에서 효과적입니다.
</div>

<div class="warning">
⚠️ **주의**: 극도로 빠른 시장에서는 시장가가 더 안전할 수 있습니다.
</div>
    `,
  },
  'trading-strategy.trailing-stop': {
    title: '트레일링 스톱',
    content: `
# 트레일링 스톱 (Trailing Stop) ✨ NEW

## 개요

트레일링 스톱은 **수익을 보호하면서 추가 상승 여력을 놓치지 않는** 고급 손절 기법입니다.

<div class="success">
✅ **핵심**: 가격이 유리하게 움직이면 손절선도 함께 올라갑니다!
</div>

## 작동 원리

### 기본 개념
\`\`\`
1. 수익률이 설정값(예: 5%) 도달 시 활성화
2. 최고가 자동 추적
3. 최고가에서 일정 비율(예: 2%) 하락 시 매도
4. 손절선이 한번 올라가면 다시 내려가지 않음
\`\`\`

### 시각적 예시
\`\`\`
매수가: 100만원
━━━━━━━━━━━━━━━━━━━━━━━

105만원 (+5%) → 트레일링 시작 ✅
110만원 (+10%) → 최고가 갱신 📈
108만원 → 아직 안전 (110만원의 -1.8%)
107.8만원 → 매도 신호! (110만원의 -2%) 🔔

최종 수익: +7.8% (단순 익절 5%보다 높음!)
\`\`\`

## 설정 방법

### 기본 설정값
\`\`\`javascript
{
  "enableTrailingStop": true,      // 활성화
  "trailingStartPercent": 5,       // 시작 수익률
  "trailingStopPercent": 2,        // 하락 허용치
  "takeProfitPercent": 20          // 최대 익절선
}
\`\`\`

### 시장별 권장 설정

#### 변동성 낮은 시장 (BTC, ETH)
\`\`\`
- 시작: 3%
- 하락 허용: 1.5%
- 이유: 안정적 추세 추종
\`\`\`

#### 변동성 높은 시장 (알트코인)
\`\`\`
- 시작: 7%
- 하락 허용: 3%
- 이유: 급등락 대응
\`\`\`

## 실전 시나리오

### 시나리오 1: 꾸준한 상승
\`\`\`
시간  가격    최고가  손절선   상태
10:00 100만원  -      -       매수
10:30 105만원  105    102.9   트레일링 시작
11:00 108만원  108    105.8   손절선 상승
11:30 112만원  112    109.8   손절선 상승
12:00 110만원  112    109.8   홀드
12:30 109만원  112    109.8   매도! (+9%)
\`\`\`

### 시나리오 2: 급등 후 조정
\`\`\`
시간  가격    최고가  손절선   상태
14:00 100만원  -      -       매수
14:10 115만원  115    112.7   급등!
14:20 113만원  115    112.7   홀드
14:30 112만원  115    112.7   매도! (+12%)

일반 익절(10%)보다 2% 추가 수익!
\`\`\`

## 장단점 분석

### 장점
✅ 추세 장에서 수익 극대화
✅ 수익 보호와 성장 동시 추구
✅ 감정적 판단 배제
✅ 자동화된 리스크 관리

### 단점
❌ 단기 조정에 민감
❌ 횡보장에서 조기 청산 가능
❌ 완벽한 고점 포착 불가

## 고급 활용법

### 동적 트레일링
\`\`\`javascript
// 수익률에 따라 허용 하락폭 조정
if (profitRate < 10) {
  trailingPercent = 2;    // 타이트
} else if (profitRate < 20) {
  trailingPercent = 3;    // 보통
} else {
  trailingPercent = 5;    // 여유
}
\`\`\`

### 시간대별 조정
\`\`\`
- 오전 장: 2% (변동성 높음)
- 오후 장: 1.5% (안정적)
- 새벽 장: 3% (급변동 대비)
\`\`\`

## 성과 비교

<table>
<tr>
  <th>전략</th>
  <th>평균 수익</th>
  <th>최대 수익</th>
  <th>승률</th>
</tr>
<tr>
  <td>고정 익절 (10%)</td>
  <td>10%</td>
  <td>10%</td>
  <td>65%</td>
</tr>
<tr>
  <td>트레일링 스톱</td>
  <td>12.5%</td>
  <td>35%</td>
  <td>62%</td>
</tr>
</table>

<div class="info">
💡 **팁**: 트레일링 스톱은 특히 강한 상승 추세에서 빛을 발합니다.
</div>

<div class="warning">
⚠️ **주의**: 너무 타이트한 설정은 오히려 수익 기회를 놓칠 수 있습니다.
</div>

## 실전 체크리스트

✓ 시장 변동성에 맞는 설정값 사용
✓ 백테스트로 최적값 찾기
✓ 뉴스 이벤트 시 설정 조정
✓ 주기적인 성과 분석
✓ 다른 지표와 병행 사용
    `,
  },
};