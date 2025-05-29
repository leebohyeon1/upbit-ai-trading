// Core Concepts 섹션
// Pattern Recognition 섹션
export const patternRecognition = {
  'pattern-recognition': {
    title: '패턴 인식 ✨ NEW',
    content: `
# 패턴 인식 ✨ NEW

## 개요

패턴 인식은 과거 가격 움직임에서 반복되는 형태를 찾아내어 미래 가격을 예측하는 기술적 분석 방법입니다.

<div class="success">
✅ **핵심**: 캔들 패턴과 차트 패턴을 자동으로 인식하여 매매 신호를 생성합니다.
</div>

## 캔들 패턴

### 단일 캔들 패턴

#### 1. Doji (십자선)
\`\`\`
특징: 시가와 종가가 거의 같음
의미: 매수세와 매도세의 균형, 추세 전환 가능성
신뢰도: 60%

    |
 ---|---
    |
\`\`\`

#### 2. Hammer (망치형)
\`\`\`
특징: 긴 아래꼬리, 짧은 몸통
의미: 하락 추세 후 반전 신호
신뢰도: 70%

    □
    |
    |
    |
\`\`\`

#### 3. Shooting Star (유성형)
\`\`\`
특징: 긴 위꼬리, 짧은 몸통
의미: 상승 추세 후 반전 신호
신뢰도: 70%

    |
    |
    |
    ■
\`\`\`

### 2-캔들 패턴

#### 1. Bullish Engulfing (상승 장악형)
\`\`\`
특징: 작은 음봉 후 큰 양봉이 완전히 감싸는 형태
의미: 강력한 상승 반전 신호
신뢰도: 80%

  ■     □
  ■   □   □
      □   □
        □
\`\`\`

#### 2. Bearish Engulfing (하락 장악형)
\`\`\`
특징: 작은 양봉 후 큰 음봉이 완전히 감싸는 형태
의미: 강력한 하락 반전 신호
신뢰도: 80%

  □     ■
  □   ■   ■
      ■   ■
        ■
\`\`\`

### 3-캔들 패턴

#### 1. Morning Star (샛별형)
\`\`\`
특징: 큰 음봉 → 작은 캔들 → 큰 양봉
의미: 강력한 상승 반전 패턴
신뢰도: 85%

■         □
■         □
■   · ·   □
■         □
\`\`\`

#### 2. Three White Soldiers (적삼병)
\`\`\`
특징: 3개의 연속 상승 양봉
의미: 강한 상승 추세 지속
신뢰도: 80%

        □
      □ □
    □ □ □
  □ □ □
\`\`\`

## 차트 패턴

### 반전 패턴

#### 1. Head and Shoulders (머리어깨)
\`\`\`
특징: 좌측 어깨 - 머리 - 우측 어깨
의미: 상승 추세의 끝, 하락 전환
목표가: 넥라인 - (머리 - 넥라인)

      /\\
     /  \\
 /\\  /    \\  /\\
/  \\/      \\/  \\
-----------------  넥라인
\`\`\`

#### 2. Double Top/Bottom (이중 천정/바닥)
\`\`\`
특징: 비슷한 높이의 두 개 고점/저점
의미: 추세 반전
목표가: 지지/저항 ± 패턴 높이

Double Top:
  /\\      /\\
 /  \\    /  \\
/    \\  /    \\
      \\/
\`\`\`

### 지속 패턴

#### 1. Triangle (삼각형)
\`\`\`
상승 삼각형: 수평 저항선, 상승 지지선
하락 삼각형: 하락 저항선, 수평 지지선
대칭 삼각형: 수렴하는 추세선

  /\\    /\\
 /  \\  /  \\  /
/    \\/    \\/
\`\`\`

#### 2. Flag & Pennant (깃발형)
\`\`\`
특징: 강한 추세 후 짧은 조정
의미: 추세 지속
목표가: 깃대 길이만큼 추가 상승/하락

   |/////|
   |/////|  ← Flag
   |
   |  ← Flagpole
   |
\`\`\`

## 패턴 인식 활용법

### 신호 강도 계산
\`\`\`javascript
// 패턴 신호 통합
function integratePatternSignals(candlePatterns, chartPatterns) {
  let bullishScore = 0;
  let bearishScore = 0;
  
  // 캔들 패턴 점수
  for (const pattern of candlePatterns) {
    const score = pattern.confidence * pattern.reliability;
    if (pattern.type === 'bullish') {
      bullishScore += score;
    } else if (pattern.type === 'bearish') {
      bearishScore += score;
    }
  }
  
  // 차트 패턴 점수 (더 높은 가중치)
  for (const pattern of chartPatterns) {
    if (pattern.type === 'bullish') {
      bullishScore += pattern.confidence * 1.5;
    } else if (pattern.type === 'bearish') {
      bearishScore += pattern.confidence * 1.5;
    }
  }
  
  return {
    signal: bullishScore > bearishScore ? 'BUY' : 'SELL',
    confidence: Math.abs(bullishScore - bearishScore)
  };
}
\`\`\`

### 패턴 필터링
\`\`\`javascript
// 신뢰도 높은 패턴만 사용
const reliablePatterns = patterns.filter(p => 
  p.confidence > 0.7 && p.reliability > 0.65
);

// 최근 패턴 우선
const recentPatterns = patterns
  .sort((a, b) => b.position - a.position)
  .slice(0, 5);
\`\`\`

## 주의사항

<div class="danger">
⚠️ **경고**: 
- 패턴은 확률일 뿐, 100% 확실하지 않습니다
- 다른 지표와 함께 사용하세요
- 거래량 확인이 중요합니다
- 시장 상황을 고려하세요
</div>

## 실전 활용 예시

### 매수 시나리오
\`\`\`
1. RSI 30 이하 (과매도)
2. Bullish Engulfing 패턴 발생
3. Double Bottom 형성 중
4. 거래량 증가

→ 강력한 매수 신호 (신뢰도 85%)
\`\`\`

### 매도 시나리오
\`\`\`
1. RSI 70 이상 (과매수)
2. Shooting Star 패턴 발생
3. Head and Shoulders 완성
4. 거래량 감소

→ 강력한 매도 신호 (신뢰도 85%)
\`\`\`

<div class="info">
💡 **팁**: 패턴 인식은 보조 지표입니다. 주요 기술적 지표와 함께 사용할 때 가장 효과적입니다.
</div>
    `,
  },
};

export const coreConcepts = {
  'core-concepts': {
    title: '핵심 개념',
    content: `
# 핵심 개념

## 자동매매의 기본 원리

성공적인 자동매매를 위해 반드시 이해해야 할 핵심 개념들을 설명합니다.

### 자동매매 시스템 구조
\`\`\`
시장 데이터 수집
    ↓
기술적 지표 계산
    ↓
AI 분석 (선택적)
    ↓
신뢰도 계산
    ↓
매매 결정
    ↓
주문 실행
    ↓
결과 학습
\`\`\`

### 왜 이 개념들이 중요한가?

1. **일관성**: 감정을 배제한 기계적 거래
2. **효율성**: 24시간 시장 모니터링
3. **정확성**: 복잡한 계산을 실시간으로
4. **학습**: 지속적인 전략 개선

<div class="info">
💡 **학습 팁**: 각 개념을 완벽히 이해할 필요는 없지만, 기본 원리를 알면 더 나은 설정이 가능합니다.
</div>
    `,
  },
  'core-concepts.technical-indicators': {
    title: '기술적 지표 이해하기',
    content: `
# 기술적 지표 이해하기

## 기술적 지표란?

과거 가격과 거래량 데이터를 수학적으로 계산하여 미래 가격 움직임을 예측하는 도구입니다.

## 주요 지표 상세 설명

### 1. RSI (Relative Strength Index)
상대강도지수 - 과매수/과매도 판단

#### 계산 방법
\`\`\`
RSI = 100 - (100 / (1 + RS))
RS = 평균 상승폭 / 평균 하락폭 (14일 기준)
\`\`\`

#### 해석
\`\`\`
RSI > 70: 과매수 (하락 가능성)
RSI < 30: 과매도 (상승 가능성)
RSI 50: 중립
\`\`\`

#### 실제 활용
\`\`\`javascript
// RSI 신호 예시
if (rsi < 30 && rsi_prev >= 30) {
  // 과매도 진입 → 매수 고려
  signal = "BUY";
} else if (rsi > 70 && rsi_prev <= 70) {
  // 과매수 진입 → 매도 고려
  signal = "SELL";
}
\`\`\`

### 2. MACD (Moving Average Convergence Divergence)
이동평균수렴확산 - 추세 전환 포착

#### 구성 요소
\`\`\`
MACD선 = 12일 EMA - 26일 EMA
Signal선 = MACD의 9일 EMA
히스토그램 = MACD선 - Signal선
\`\`\`

#### 매매 신호
\`\`\`
골든크로스: MACD가 Signal을 상향 돌파 → 매수
데드크로스: MACD가 Signal을 하향 돌파 → 매도
히스토그램 양수 전환 → 상승 모멘텀
히스토그램 음수 전환 → 하락 모멘텀
\`\`\`

### 3. 볼린저밴드 (Bollinger Bands)
변동성 지표 - 가격의 상대적 위치 판단

#### 구성
\`\`\`
중심선 = 20일 이동평균
상단밴드 = 중심선 + (2 × 표준편차)
하단밴드 = 중심선 - (2 × 표준편차)
\`\`\`

#### 활용법
\`\`\`
밴드 수축 → 변동성 감소, 큰 움직임 예고
밴드 확장 → 변동성 증가, 추세 진행
상단 터치 + RSI 과매수 → 강한 매도 신호
하단 터치 + RSI 과매도 → 강한 매수 신호
\`\`\`

### 4. 이동평균선 (Moving Average)
추세 지표 - 전반적인 방향성 파악

#### 종류
\`\`\`
SMA (단순이동평균): 일정 기간 평균
EMA (지수이동평균): 최근 가격에 가중치
WMA (가중이동평균): 선형 가중치 적용
\`\`\`

#### 주요 기간
\`\`\`
단기: 5일, 10일, 20일
중기: 50일, 60일
장기: 120일, 200일
\`\`\`

#### 매매 전략
\`\`\`
정배열: 단기 > 중기 > 장기 → 상승 추세
역배열: 단기 < 중기 < 장기 → 하락 추세
골든크로스: 단기가 장기를 상향 돌파
데드크로스: 단기가 장기를 하향 돌파
\`\`\`

### 5. 거래량 (Volume)
시장 참여도 - 가격 움직임의 신뢰도

#### 분석 방법
\`\`\`
가격↑ + 거래량↑ = 건강한 상승
가격↑ + 거래량↓ = 상승 의심
가격↓ + 거래량↑ = 강한 하락
가격↓ + 거래량↓ = 하락 둔화
\`\`\`

#### 거래량 지표
\`\`\`
OBV (On Balance Volume): 누적 거래량
거래량 이동평균: 평균 거래량 대비
VWAP: 거래량 가중 평균가
\`\`\`

### 6. 스토캐스틱 (Stochastic)
모멘텀 지표 - 현재 가격의 상대적 위치

#### 계산
\`\`\`
%K = (현재가 - 최저가) / (최고가 - 최저가) × 100
%D = %K의 3일 이동평균
\`\`\`

#### 해석
\`\`\`
80 이상: 과매수 구간
20 이하: 과매도 구간
%K가 %D를 상향 돌파: 매수 신호
%K가 %D를 하향 돌파: 매도 신호
\`\`\`

## 지표 조합 전략

### 추세 추종 조합
\`\`\`
MACD + 이동평균 + ADX
- 추세 방향과 강도 확인
- 진입 타이밍 포착
\`\`\`

### 반전 매매 조합
\`\`\`
RSI + 스토캐스틱 + 볼린저밴드
- 과매수/과매도 확인
- 반전 시점 포착
\`\`\`

### 모멘텀 전략
\`\`\`
MACD + RSI + 거래량
- 모멘텀 강도 측정
- 지속 가능성 평가
\`\`\`

## 지표의 한계

### 1. 후행성
- 과거 데이터 기반
- 실시간 반응 지연
- 급변하는 시장 대응 어려움

### 2. 거짓 신호
- 횡보장에서 빈번
- 뉴스 영향 반영 못함
- 조작 가능성

### 3. 상충되는 신호
- 지표마다 다른 신호
- 가중치 설정 필요
- 종합적 판단 중요

## 실전 활용 팁

### 1. 복수 지표 활용
\`\`\`
절대 하나의 지표만 믿지 마세요
최소 3개 이상 지표 조합
서로 다른 유형 지표 선택
\`\`\`

### 2. 시장 상황 고려
\`\`\`
상승장: 추세 지표 중심
하락장: 오실레이터 중심
횡보장: 밴드/채널 지표
\`\`\`

### 3. 백테스트 필수
\`\`\`
과거 데이터로 검증
다양한 시장 상황 테스트
파라미터 최적화
\`\`\`

<div class="success">
✅ **핵심**: 지표는 도구일 뿐입니다. 맹신하지 말고 참고 자료로 활용하세요.
</div>

<div class="warning">
⚠️ **주의**: 모든 지표가 같은 방향을 가리킬 때까지 기다리면 이미 늦을 수 있습니다.
</div>
    `,
  },
  'core-concepts.ai-analysis': {
    title: 'AI 분석의 원리',
    content: `
# AI 분석의 원리

## AI가 하는 일

### 전통적 분석 vs AI 분석

#### 전통적 기술적 분석
\`\`\`
장점:
- 명확한 규칙
- 예측 가능한 결과
- 빠른 계산

한계:
- 단순 패턴만 인식
- 복잡한 상관관계 놓침
- 시장 심리 반영 어려움
\`\`\`

#### AI 분석
\`\`\`
장점:
- 복잡한 패턴 인식
- 다차원 데이터 처리
- 시장 심리 해석
- 지속적 학습

과제:
- 블랙박스 문제
- 과적합 위험
- 계산 비용
\`\`\`

## Claude AI의 역할

### 1. 종합적 시장 분석
\`\`\`javascript
// AI에게 전달되는 데이터
{
  "technicalIndicators": {
    "rsi": 45,
    "macd": { "value": 0.5, "signal": 0.3 },
    "bollingerBands": { "upper": 52000, "middle": 50000, "lower": 48000 }
  },
  "marketContext": {
    "trend": "sideways",
    "volatility": "high",
    "volume": "increasing"
  },
  "recentPatterns": ["double_bottom", "breakout_attempt"]
}
\`\`\`

### 2. 자연어 해석
\`\`\`
AI 분석 예시:
"현재 RSI는 45로 중립 구간이지만, MACD가 상승 
전환 신호를 보이고 있습니다. 최근 이중 바닥 
패턴 형성 후 돌파 시도 중이며, 거래량 증가가 
동반되고 있어 상승 가능성이 높아 보입니다.
다만 전반적인 시장이 횡보 중이므로 신중한 
접근이 필요합니다."
\`\`\`

### 3. 확률적 예측
\`\`\`javascript
// AI 예측 결과
{
  "prediction": {
    "direction": "UP",
    "confidence": 72,
    "timeframe": "4H",
    "reasoning": [
      "기술적 지표 상승 신호",
      "거래량 증가 확인",
      "주요 지지선 유지"
    ]
  }
}
\`\`\`

## AI 분석 프로세스

### 1단계: 데이터 준비
\`\`\`python
# 의사코드
data = {
  'price': get_price_history(period='7d'),
  'volume': get_volume_data(),
  'indicators': calculate_all_indicators(),
  'orderbook': get_orderbook_snapshot(),
  'news_sentiment': analyze_recent_news()
}
\`\`\`

### 2단계: 컨텍스트 구성
\`\`\`
현재 상황 요약:
- 가격 위치 (고/중/저)
- 추세 방향과 강도
- 변동성 수준
- 주요 레벨 근접도
- 시장 심리 지표
\`\`\`

### 3단계: AI 쿼리
\`\`\`
프롬프트 구조:
1. 객관적 데이터 제시
2. 기술적 분석 요청
3. 리스크 평가 요청
4. 구체적 제안 요청
\`\`\`

### 4단계: 응답 파싱
\`\`\`javascript
function parseAIResponse(response) {
  return {
    sentiment: extractSentiment(response),
    confidence: extractConfidence(response),
    keyFactors: extractKeyFactors(response),
    warnings: extractWarnings(response)
  };
}
\`\`\`

## AI 분석의 장점

### 1. 패턴 인식 능력
\`\`\`
인식 가능한 패턴:
- 헤드앤숄더
- 삼각수렴
- 플래그/페넌트
- 엘리엇 파동
- 하모닉 패턴
\`\`\`

### 2. 다중 시간대 분석
\`\`\`
동시 분석:
- 1분봉: 단기 모멘텀
- 15분봉: 진입 타이밍
- 1시간봉: 중기 추세
- 4시간봉: 주요 추세
- 일봉: 장기 방향
\`\`\`

### 3. 감정 분석
\`\`\`
분석 요소:
- 공포/탐욕 지수
- 소셜 미디어 심리
- 뉴스 톤 분석
- 거래량 패턴
\`\`\`

## AI 활용 전략

### 1. 보조 도구로 활용
\`\`\`javascript
// AI는 최종 결정이 아닌 참고용
if (technicalSignal === 'BUY' && aiConfidence > 70) {
  // 기술적 신호와 AI가 일치할 때만
  executeTrade();
}
\`\`\`

### 2. 리스크 관리
\`\`\`
AI 신뢰도별 포지션:
90% 이상: 100% 포지션
80-90%: 75% 포지션
70-80%: 50% 포지션
70% 미만: 거래 보류
\`\`\`

### 3. 학습 피드백
\`\`\`javascript
// 거래 결과를 AI 학습에 활용
{
  "trade": {
    "aiPrediction": "BUY",
    "confidence": 85,
    "actualResult": "PROFIT",
    "returnRate": 5.2
  },
  "feedback": "SUCCESS"
}
\`\`\`

## AI의 한계

### 1. 블랙스완 이벤트
- 예측 불가능한 사건
- 과거 데이터에 없는 상황
- 극단적 시장 변동

### 2. 과적합 위험
- 과거 데이터에 너무 최적화
- 새로운 패턴 대응 어려움
- 정기적 재학습 필요

### 3. 지연 시간
- API 호출 시간
- 복잡한 계산 과정
- 실시간 대응 한계

## 효과적인 AI 활용법

### 1. 하이브리드 접근
\`\`\`
기술적 지표 (60%) + AI 분석 (40%)
= 균형잡힌 의사결정
\`\`\`

### 2. 상황별 가중치
\`\`\`
변동성 높을 때: AI 비중 감소
명확한 추세: 기술적 지표 우선
복잡한 패턴: AI 분석 중시
\`\`\`

### 3. 지속적 검증
\`\`\`
주간 성과 리뷰:
- AI 예측 정확도
- 수익 기여도
- 오류 패턴 분석
\`\`\`

<div class="info">
💡 **팁**: AI는 만능이 아닙니다. 도구로써 현명하게 활용하는 것이 중요합니다.
</div>

<div class="warning">
⚠️ **주의**: AI가 100% 확신한다고 해도 항상 리스크 관리를 우선하세요.
</div>
    `,
  },
  'core-concepts.confidence-system': {
    title: '신뢰도와 가중치',
    content: `
# 신뢰도와 가중치

## 신뢰도 시스템이란?

여러 지표와 분석 결과를 종합하여 하나의 숫자(0-100%)로 표현하는 시스템입니다.

## 신뢰도 계산 과정

### 1. 개별 지표 신호
\`\`\`javascript
// 각 지표의 신호 강도 (0-100)
const signals = {
  rsi: {
    value: 25,
    signal: 'BUY',
    strength: 80  // 과매도 구간이므로 강한 매수
  },
  macd: {
    crossover: true,
    signal: 'BUY',
    strength: 60  // 골든크로스 발생
  },
  bollinger: {
    position: 'lower',
    signal: 'BUY',
    strength: 70  // 하단 밴드 터치
  }
};
\`\`\`

### 2. 가중치 적용
\`\`\`javascript
// 각 지표의 중요도 (합계 1.0)
const weights = {
  rsi: 0.20,        // 20%
  macd: 0.25,       // 25%
  bollinger: 0.15,  // 15%
  ma: 0.20,         // 20%
  volume: 0.10,     // 10%
  ai: 0.10          // 10%
};

// 가중 평균 계산
let weightedSum = 0;
for (const [indicator, data] of Object.entries(signals)) {
  weightedSum += data.strength * weights[indicator];
}
\`\`\`

### 3. 최종 신뢰도
\`\`\`javascript
// 시장 상황 보정
const marketAdjustment = getMarketConditionMultiplier();
const finalConfidence = weightedSum * marketAdjustment;

// 결과 예시
{
  "action": "BUY",
  "confidence": 72.5,
  "breakdown": {
    "rsi": 16.0,      // 80 * 0.20
    "macd": 15.0,     // 60 * 0.25
    "bollinger": 10.5 // 70 * 0.15
  }
}
\`\`\`

## 가중치의 의미

### 가중치 설정 원칙

#### 1. 신뢰성 기반
\`\`\`
높은 가중치 (0.2-0.3):
- 역사적으로 정확도 높음
- 시장 상황에 강건함
- 조작 어려움

낮은 가중치 (0.05-0.15):
- 보조 지표
- 특정 상황에만 유효
- 노이즈 많음
\`\`\`

#### 2. 상호보완성
\`\`\`
추세 지표: 40% (MACD, MA)
모멘텀 지표: 30% (RSI, Stochastic)
변동성 지표: 20% (Bollinger, ATR)
거래량 지표: 10% (Volume, OBV)
\`\`\`

#### 3. 시장별 최적화
\`\`\`javascript
// 상승장 가중치
const bullMarketWeights = {
  ma: 0.30,     // 추세 추종 중요
  macd: 0.25,
  rsi: 0.15,    // 과매수 무시
  volume: 0.20,
  ai: 0.10
};

// 하락장 가중치
const bearMarketWeights = {
  rsi: 0.30,    // 과매도 포착 중요
  bollinger: 0.25,
  ma: 0.15,     // 추세 덜 중요
  volume: 0.20,
  ai: 0.10
};
\`\`\`

## 신뢰도 해석

### 신뢰도 구간별 의미

\`\`\`
90-100%: 매우 강한 신호
- 모든 지표 일치
- 즉시 실행 권장
- 최대 포지션 가능

80-89%: 강한 신호
- 대부분 지표 일치
- 실행 권장
- 정상 포지션

70-79%: 보통 신호
- 과반수 지표 일치
- 신중한 실행
- 축소 포지션

60-69%: 약한 신호
- 일부 지표만 일치
- 추가 확인 필요
- 최소 포지션

60% 미만: 무시
- 명확한 신호 없음
- 거래 보류
- 관망
\`\`\`

### 매수/매도 비대칭

\`\`\`javascript
// 매도가 매수보다 보수적
const thresholds = {
  buy: 70,   // 매수는 70% 이상
  sell: 75   // 매도는 75% 이상
};

// 이유: 상승은 천천히, 하락은 급격히
\`\`\`

## 동적 가중치 시스템

### 1. 성과 기반 조정
\`\`\`javascript
class DynamicWeightManager {
  constructor() {
    this.performance = {};
    this.weights = { ...defaultWeights };
  }
  
  updatePerformance(indicator, prediction, actual) {
    if (!this.performance[indicator]) {
      this.performance[indicator] = { correct: 0, total: 0 };
    }
    
    this.performance[indicator].total++;
    if (prediction === actual) {
      this.performance[indicator].correct++;
    }
  }
  
  adjustWeights() {
    // 정확도 기반 가중치 재분배
    const accuracies = {};
    let totalAccuracy = 0;
    
    for (const [indicator, perf] of Object.entries(this.performance)) {
      accuracies[indicator] = perf.correct / perf.total;
      totalAccuracy += accuracies[indicator];
    }
    
    // 새로운 가중치 계산
    for (const indicator in this.weights) {
      this.weights[indicator] = accuracies[indicator] / totalAccuracy;
    }
  }
}
\`\`\`

### 2. 시장 상황별 조정
\`\`\`javascript
function getMarketAdjustedWeights(marketCondition) {
  switch(marketCondition) {
    case 'STRONG_TREND':
      return {
        ma: 0.35,
        macd: 0.30,
        rsi: 0.10,
        bollinger: 0.10,
        volume: 0.15
      };
      
    case 'SIDEWAYS':
      return {
        rsi: 0.30,
        bollinger: 0.30,
        macd: 0.15,
        ma: 0.10,
        volume: 0.15
      };
      
    case 'HIGH_VOLATILITY':
      return {
        bollinger: 0.35,
        atr: 0.25,
        rsi: 0.20,
        volume: 0.20
      };
  }
}
\`\`\`

### 3. 시간대별 조정
\`\`\`javascript
function getTimeBasedWeights(hour) {
  if (hour >= 9 && hour <= 11) {
    // 아시아 오픈 - 거래량 중요
    return { ...defaultWeights, volume: 0.25 };
  } else if (hour >= 22 && hour <= 24) {
    // 미국 시장 - AI 분석 중요
    return { ...defaultWeights, ai: 0.20 };
  }
  return defaultWeights;
}
\`\`\`

## 실전 활용 예시

### 매수 신호 생성
\`\`\`javascript
function generateBuySignal(data) {
  const signals = analyzeAllIndicators(data);
  const weights = getCurrentWeights();
  
  let buyConfidence = 0;
  let sellConfidence = 0;
  
  for (const [indicator, signal] of Object.entries(signals)) {
    if (signal.direction === 'BUY') {
      buyConfidence += signal.strength * weights[indicator];
    } else if (signal.direction === 'SELL') {
      sellConfidence += signal.strength * weights[indicator];
    }
  }
  
  // 신뢰도가 임계값을 넘으면 신호 생성
  if (buyConfidence > thresholds.buy) {
    return {
      action: 'BUY',
      confidence: buyConfidence,
      strength: getPositionSize(buyConfidence)
    };
  }
  
  return { action: 'HOLD' };
}
\`\`\`

### 포지션 크기 결정
\`\`\`javascript
function getPositionSize(confidence) {
  if (confidence >= 90) return 1.0;      // 100%
  if (confidence >= 80) return 0.75;     // 75%
  if (confidence >= 70) return 0.5;      // 50%
  return 0.25;                            // 25%
}
\`\`\`

## 주의사항

### 1. 과최적화 방지
- 너무 복잡한 가중치 체계 지양
- 최소 100건 이상 거래 후 조정
- 정기적인 리셋 고려

### 2. 시장 변화 대응
- 월 1회 가중치 검토
- 급변하는 시장에서는 보수적 접근
- 백테스트로 검증

### 3. 예외 상황 처리
- 모든 지표가 상충할 때
- 극단적인 신뢰도 (95% 이상)
- 시스템 오류 가능성

<div class="success">
✅ **핵심**: 신뢰도는 확률이지 확실성이 아닙니다. 항상 리스크 관리를 병행하세요.
</div>

<div class="info">
💡 **팁**: 처음에는 기본 가중치로 시작하고, 경험이 쌓이면 조금씩 조정하세요.
</div>
    `,
  },
  'core-concepts.market-conditions': {
    title: '시장 상황 판단',
    content: `
# 시장 상황 판단

## 시장 상황의 중요성

같은 신호라도 시장 상황에 따라 결과가 완전히 달라집니다. 현재 시장이 어떤 상태인지 정확히 파악하는 것이 성공의 열쇠입니다.

## 주요 시장 유형

### 1. 상승 추세 (Bull Market)
\`\`\`
특징:
- 고점과 저점이 계속 상승
- 이평선 정배열 (단기 > 중기 > 장기)
- 강한 매수세
- 긍정적 뉴스 지배

거래 전략:
- 추세 추종 전략
- 조정 시 매수 (Buy the dip)
- 손절 라인 상향 조정
- 롱 포지션 위주
\`\`\`

### 2. 하락 추세 (Bear Market)
\`\`\`
특징:
- 고점과 저점이 계속 하락
- 이평선 역배열 (단기 < 중기 < 장기)
- 매도 압력 지속
- 부정적 심리 만연

거래 전략:
- 반등 시 매도
- 숏 포지션 고려
- 엄격한 손절
- 현금 비중 확대
\`\`\`

### 3. 횡보장 (Sideways/Range Market)
\`\`\`
특징:
- 일정 범위 내 등락
- 명확한 지지/저항선
- 이평선 수평
- 방향성 부재

거래 전략:
- 박스권 매매
- 지지선 매수, 저항선 매도
- 작은 수익 실현
- 돌파 시 손절
\`\`\`

### 4. 변동성 장세
\`\`\`
특징:
- 급격한 가격 변동
- 예측 불가능
- 높은 거래량
- 공포와 탐욕 교차

거래 전략:
- 포지션 축소
- 넓은 손절선
- 분할 매매
- 단기 거래 지양
\`\`\`

## 시장 상황 판단 지표

### 1. 추세 강도 지표
\`\`\`javascript
// ADX (Average Directional Index)
function getTrendStrength(adx) {
  if (adx > 40) return "VERY_STRONG";
  if (adx > 25) return "STRONG";
  if (adx > 20) return "MODERATE";
  return "WEAK_OR_NONE";
}

// 추세 방향
function getTrendDirection(price, ma200) {
  const diff = (price - ma200) / ma200;
  
  if (diff > 0.1) return "STRONG_UP";
  if (diff > 0.03) return "UP";
  if (diff > -0.03) return "SIDEWAYS";
  if (diff > -0.1) return "DOWN";
  return "STRONG_DOWN";
}
\`\`\`

### 2. 변동성 측정
\`\`\`javascript
// ATR 기반 변동성
function getVolatilityLevel(atr, price) {
  const atrPercent = (atr / price) * 100;
  
  if (atrPercent > 5) return "EXTREME";
  if (atrPercent > 3) return "HIGH";
  if (atrPercent > 1.5) return "NORMAL";
  return "LOW";
}

// 볼린저밴드 폭
function getBBWidth(upper, lower, middle) {
  const width = (upper - lower) / middle;
  
  if (width > 0.1) return "WIDE";      // 높은 변동성
  if (width < 0.02) return "SQUEEZE";  // 낮은 변동성
  return "NORMAL";
}
\`\`\`

### 3. 시장 심리 지표
\`\`\`javascript
// Fear & Greed Index 해석
function getMarketSentiment(fearGreedIndex) {
  if (fearGreedIndex < 20) return "EXTREME_FEAR";
  if (fearGreedIndex < 40) return "FEAR";
  if (fearGreedIndex < 60) return "NEUTRAL";
  if (fearGreedIndex < 80) return "GREED";
  return "EXTREME_GREED";
}

// RSI 다이버전스
function checkDivergence(priceHigh, rsiHigh) {
  if (priceHigh.current > priceHigh.previous && 
      rsiHigh.current < rsiHigh.previous) {
    return "BEARISH_DIVERGENCE";  // 하락 전환 신호
  }
  // ... 추가 로직
}
\`\`\`

## 시장 단계별 전략

### 1. 축적 단계 (Accumulation)
\`\`\`
특징:
- 하락 후 바닥권
- 거래량 감소
- 변동성 감소
- 스마트머니 매집

전략:
- 소량 분할 매수
- 장기 관점
- 낮은 레버리지
\`\`\`

### 2. 상승 단계 (Markup)
\`\`\`
특징:
- 명확한 상승 추세
- 거래량 증가
- 긍정적 뉴스
- FOMO 시작

전략:
- 추세 추종
- 조정 시 추가 매수
- 트레일링 스탑
\`\`\`

### 3. 분산 단계 (Distribution)
\`\`\`
특징:
- 고점 부근 횡보
- 거래량 감소
- 변동성 증가
- 스마트머니 매도

전략:
- 단계적 익절
- 숏 포지션 준비
- 현금 비중 증가
\`\`\`

### 4. 하락 단계 (Markdown)
\`\`\`
특징:
- 지지선 붕괴
- 패닉 셀링
- 부정적 뉴스
- 거래량 폭증

전략:
- 매수 자제
- 단기 반등 매도
- 리스크 최소화
\`\`\`

## 실시간 시장 분석

### 종합 판단 시스템
\`\`\`javascript
class MarketAnalyzer {
  analyzeMarket(data) {
    const trend = this.analyzeTrend(data);
    const volatility = this.analyzeVolatility(data);
    const sentiment = this.analyzeSentiment(data);
    const volume = this.analyzeVolume(data);
    
    return {
      condition: this.getOverallCondition(trend, volatility, sentiment),
      confidence: this.calculateConfidence(trend, volatility, sentiment, volume),
      strategy: this.recommendStrategy(trend, volatility),
      warnings: this.detectWarnings(data)
    };
  }
  
  getOverallCondition(trend, volatility, sentiment) {
    if (trend.strength > 30 && trend.direction === 'UP') {
      return volatility.level === 'LOW' ? 'STRONG_UPTREND' : 'VOLATILE_UPTREND';
    }
    if (trend.strength < 20) {
      return 'SIDEWAYS';
    }
    // ... 추가 조건
  }
}
\`\`\`

### 시장 전환 신호
\`\`\`javascript
const transitionSignals = {
  // 상승 → 횡보
  upToSideways: [
    "거래량 감소",
    "RSI 다이버전스",
    "주요 저항선 반복 실패",
    "이평선 수렴"
  ],
  
  // 횡보 → 하락
  sidewaysToDown: [
    "하단 지지선 붕괴",
    "거래량 동반 하락",
    "이평선 역배열 시작",
    "부정적 뉴스 증가"
  ],
  
  // 하락 → 상승
  downToUp: [
    "더블 바텀 형성",
    "거래량 증가",
    "RSI 상승 다이버전스",
    "이평선 돌파"
  ]
};
\`\`\`

## 시장별 리스크 관리

### 상승장 리스크
\`\`\`
위험 요소:
- 과도한 낙관
- 레버리지 과다
- 조정 무시

대응 방안:
- 정기적 수익 실현
- 레버리지 제한
- 조정 대비 현금 확보
\`\`\`

### 하락장 리스크
\`\`\`
위험 요소:
- 나이프 캐칭
- 평단가 낮추기
- 손절 미루기

대응 방안:
- 엄격한 손절
- 포지션 최소화
- 반등 확인 후 진입
\`\`\`

### 횡보장 리스크
\`\`\`
위험 요소:
- 잦은 손절
- 수수료 누적
- 돌파 놓치기

대응 방안:
- 거래 빈도 감소
- 범위 확인 후 거래
- 돌파 시 빠른 대응
\`\`\`

## 시장 상황별 파라미터

### 동적 조정 예시
\`\`\`javascript
function getMarketAdjustedParams(marketCondition) {
  const params = {
    STRONG_UPTREND: {
      buyThreshold: 65,      // 낮춤
      sellThreshold: 80,     // 높임
      stopLoss: 0.07,        // 넓힘
      positionSize: 1.2      // 증가
    },
    SIDEWAYS: {
      buyThreshold: 75,      // 표준
      sellThreshold: 75,     // 표준
      stopLoss: 0.03,        // 좁힘
      positionSize: 0.8      // 감소
    },
    DOWNTREND: {
      buyThreshold: 85,      // 높임
      sellThreshold: 65,     // 낮춤
      stopLoss: 0.05,        // 표준
      positionSize: 0.5      // 크게 감소
    }
  };
  
  return params[marketCondition] || params.SIDEWAYS;
}
\`\`\`

<div class="success">
✅ **핵심**: 시장 상황을 정확히 파악하면 승률을 크게 높일 수 있습니다.
</div>

<div class="warning">
⚠️ **주의**: 시장은 언제든 변할 수 있습니다. 고정관념을 버리고 유연하게 대응하세요.
</div>
    `,
  },
};