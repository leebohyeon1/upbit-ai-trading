export const docContentsPart3 = {
  // 코인별 세부 설정 섹션
  'coin-settings': {
    title: '코인별 세부 설정',
    content: `
# 코인별 세부 설정

각 코인의 특성에 맞는 맞춤형 설정으로 수익률을 극대화하세요.

## 설정의 중요성

모든 코인이 같은 방식으로 움직이지 않습니다. 각 코인의:
- 변동성 패턴
- 거래량 특성
- 뉴스 민감도
- 커뮤니티 영향

을 고려한 개별 설정이 필요합니다.
    `,
  },
  'coin-settings.add-coin': {
    title: '분석 설정 추가',
    content: `
# 분석 설정 추가

## 코인 추가 과정

### 1단계: 코인 선택
\`\`\`
1. 분석 설정 → "코인 추가" 클릭
2. 드롭다운에서 코인 선택
3. 또는 검색창에 심볼 입력 (예: BTC, ETH)
\`\`\`

### 2단계: 기본 설정
\`\`\`javascript
{
  "symbol": "BTC",
  "enabled": true,
  "maxInvestment": 2000000,  // 코인별 최대 투자금
  "minOrderAmount": 5000,     // 최소 주문 금액
  "tradingEnabled": true      // 거래 활성화
}
\`\`\`

### 3단계: 상세 설정
각 코인에 맞는 세부 파라미터 조정

## 코인 선택 기준

### 추천 코인 특성
1. **충분한 거래량**
   - 일일 거래량 100억원 이상
   - 호가 스프레드 0.1% 이하

2. **안정적인 시장**
   - 상장 후 6개월 이상 경과
   - 극단적 변동성 없음

3. **기술적 분석 유효성**
   - 차트 패턴 신뢰도
   - 지표 정확도

### 피해야 할 코인
- 신규 상장 코인 (변동성 극심)
- 거래량 적은 코인 (조작 위험)
- 뉴스에 극도로 민감한 코인
- 펌핑/덤핑 이력 있는 코인

## 코인 카테고리별 설정

### 메이저 코인 (BTC, ETH)
\`\`\`javascript
const majorCoinSettings = {
  // 기본 설정
  maxInvestment: 3000000,
  buyRatio: 0.2,          // 20% 씩 매수
  sellRatio: 0.5,         // 50% 씩 매도
  
  // 신뢰도 설정
  buyConfidence: 65,      // 상대적으로 낮은 임계값
  sellConfidence: 70,
  
  // 리스크 관리
  stopLoss: 0.05,         // 5% 손절
  takeProfit: 0.15,       // 15% 익절
  
  // 쿨다운
  cooldownBuy: 300,       // 5분
  cooldownSell: 600       // 10분
};
\`\`\`

### 대형 알트코인 (XRP, ADA, DOT)
\`\`\`javascript
const largeAltSettings = {
  maxInvestment: 1500000,
  buyRatio: 0.15,
  sellRatio: 0.4,
  
  buyConfidence: 70,
  sellConfidence: 75,
  
  stopLoss: 0.07,
  takeProfit: 0.20,
  
  cooldownBuy: 600,
  cooldownSell: 900
};
\`\`\`

### 중소형 알트코인
\`\`\`javascript
const smallAltSettings = {
  maxInvestment: 500000,
  buyRatio: 0.1,
  sellRatio: 0.3,
  
  buyConfidence: 80,      // 높은 신뢰도 요구
  sellConfidence: 85,
  
  stopLoss: 0.10,         // 넓은 손절
  takeProfit: 0.30,       // 높은 목표
  
  cooldownBuy: 1200,      // 20분
  cooldownSell: 1800      // 30분
};
\`\`\`

## 코인별 지표 가중치

### BTC 최적화 가중치
\`\`\`javascript
const btcWeights = {
  rsi: 0.15,              // RSI 비중 낮음
  macd: 0.20,
  bollingerBands: 0.15,
  movingAverage: 0.30,    // 이평선 중시
  volume: 0.10,
  ai: 0.10
};
\`\`\`

### 변동성 높은 코인 가중치
\`\`\`javascript
const volatileWeights = {
  rsi: 0.25,              // RSI 중요
  macd: 0.15,
  bollingerBands: 0.25,   // 볼린저밴드 중요
  movingAverage: 0.15,
  volume: 0.15,
  ai: 0.05
};
\`\`\`

## 특수 설정

### 뉴스 반응형 코인
\`\`\`javascript
const newsReactiveCoin = {
  symbol: "XRP",
  newsImpact: "high",
  
  // 뉴스 발생 시 설정 변경
  newsSettings: {
    // 긍정적 뉴스
    positive: {
      buyConfidence: -10,    // 임계값 낮춤
      maxInvestment: 1.5,    // 투자금 증가
    },
    // 부정적 뉴스
    negative: {
      tradingEnabled: false, // 거래 중단
      sellAll: true         // 전량 매도
    }
  }
};
\`\`\`

### 시간대별 설정
\`\`\`javascript
const timeBasedSettings = {
  symbol: "ETH",
  
  timeSlots: [
    {
      start: "09:00",
      end: "15:00",
      settings: {
        buyConfidence: 70,
        description: "아시아 시장 활발"
      }
    },
    {
      start: "22:00",
      end: "06:00", 
      settings: {
        buyConfidence: 75,
        description: "미국 시장 활발"
      }
    }
  ]
};
\`\`\`

## 성과 기반 자동 조정

### 성과 추적
\`\`\`javascript
class CoinPerformanceTracker {
  constructor(symbol) {
    this.symbol = symbol;
    this.trades = [];
    this.metrics = {
      winRate: 0,
      avgProfit: 0,
      maxDrawdown: 0
    };
  }
  
  updateMetrics(trade) {
    this.trades.push(trade);
    this.calculateMetrics();
    this.adjustSettings();
  }
  
  adjustSettings() {
    // 승률이 낮으면 신뢰도 임계값 상향
    if (this.metrics.winRate < 0.4) {
      this.settings.buyConfidence += 5;
    }
    
    // 평균 수익이 높으면 투자금 증가
    if (this.metrics.avgProfit > 0.05) {
      this.settings.maxInvestment *= 1.2;
    }
  }
}
\`\`\`

## 코인 관리

### 정기 검토
\`\`\`
매주 검토 사항:
1. 각 코인 수익률
2. 승률 및 거래 횟수
3. 최대 손실/수익
4. 설정 효과성

월간 검토:
1. 코인 제거/추가 결정
2. 전체 포트폴리오 재구성
3. 설정 대대적 개편
\`\`\`

### 코인 제거 기준
- 3주 연속 손실
- 승률 30% 미만
- 거래량 급감
- 기술적 분석 무효화

### 포트폴리오 구성
\`\`\`
추천 구성:
- 메이저 코인: 50-60%
- 대형 알트: 30-40%
- 중소형 알트: 10-20%

코인 수:
- 초보자: 3-5개
- 중급자: 5-10개
- 고급자: 10-15개
\`\`\`

## 백테스트 활용

### 코인별 백테스트
\`\`\`javascript
async function backtestCoinSettings(symbol, settings) {
  const historicalData = await getHistoricalData(symbol, '3months');
  
  const results = {
    original: await runBacktest(historicalData, currentSettings),
    optimized: await runBacktest(historicalData, settings)
  };
  
  return {
    improvement: (results.optimized.totalReturn - results.original.totalReturn) / results.original.totalReturn,
    metrics: {
      winRate: results.optimized.winRate,
      avgTrade: results.optimized.avgTradeReturn,
      maxDrawdown: results.optimized.maxDrawdown
    }
  };
}
\`\`\`

## 설정 템플릿

### 안전 투자형
\`\`\`json
{
  "template": "conservative",
  "settings": {
    "buyConfidence": 80,
    "sellConfidence": 85,
    "stopLoss": 0.03,
    "takeProfit": 0.10,
    "maxInvestment": 500000
  }
}
\`\`\`

### 공격 투자형
\`\`\`json
{
  "template": "aggressive",
  "settings": {
    "buyConfidence": 65,
    "sellConfidence": 70,
    "stopLoss": 0.10,
    "takeProfit": 0.30,
    "maxInvestment": 1000000
  }
}
\`\`\`

<div class="info">
💡 **팁**: 처음에는 적은 수의 코인으로 시작하여 각각을 충분히 이해한 후 확대하세요.
</div>

<div class="warning">
⚠️ **주의**: 너무 많은 코인을 추가하면 관리가 어렵고 수수료가 늘어납니다.
</div>
    `,
  },
  'coin-settings.weights': {
    title: '가중치 커스터마이징',
    content: `
# 가중치 커스터마이징

## 가중치란?

가중치는 각 기술적 지표가 최종 매매 결정에 미치는 영향력을 나타냅니다. 
합리적인 가중치 설정이 성공적인 자동매매의 핵심입니다.

## 기본 가중치 체계

### 표준 가중치 분배
\`\`\`javascript
const defaultWeights = {
  rsi: 0.15,           // 15% - 과매수/과매도
  macd: 0.20,          // 20% - 추세와 모멘텀
  bollingerBands: 0.15, // 15% - 변동성과 지지/저항
  movingAverage: 0.25,  // 25% - 중장기 추세
  volume: 0.10,         // 10% - 거래 강도
  ai: 0.15             // 15% - AI 종합 분석
  // 합계: 1.00 (100%)
};
\`\`\`

### 가중치 검증
\`\`\`javascript
function validateWeights(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(\`가중치 합계가 1.0이 아닙니다: \${sum}\`);
  }
  
  for (const [indicator, weight] of Object.entries(weights)) {
    if (weight < 0 || weight > 1) {
      throw new Error(\`\${indicator} 가중치가 범위를 벗어났습니다: \${weight}\`);
    }
  }
  
  return true;
}
\`\`\`

## 시장 상황별 가중치

### 트렌드 시장
\`\`\`javascript
const trendMarketWeights = {
  rsi: 0.10,           // 감소 - 트렌드에서는 극단값 지속
  macd: 0.25,          // 증가 - 트렌드 확인 중요
  bollingerBands: 0.10, // 감소 - 밴드 이탈 빈번
  movingAverage: 0.35,  // 크게 증가 - 트렌드 추종
  volume: 0.15,         // 증가 - 트렌드 강도 확인
  ai: 0.05             // 감소 - 명확한 트렌드
};
\`\`\`

### 횡보 시장
\`\`\`javascript
const sidewaysMarketWeights = {
  rsi: 0.25,           // 증가 - 과매수/과매도 중요
  macd: 0.10,          // 감소 - 트렌드 불명확
  bollingerBands: 0.30, // 크게 증가 - 밴드 내 움직임
  movingAverage: 0.10,  // 감소 - 방향성 없음
  volume: 0.10,         // 유지
  ai: 0.15             // 유지
};
\`\`\`

### 고변동성 시장
\`\`\`javascript
const volatileMarketWeights = {
  rsi: 0.20,           // 증가 - 극단 신호 포착
  macd: 0.15,          // 약간 감소
  bollingerBands: 0.25, // 증가 - 변동성 측정
  movingAverage: 0.15,  // 감소 - 빈번한 돌파
  volume: 0.15,         // 증가 - 패닉/FOMO 감지
  ai: 0.10             // 감소 - 예측 어려움
};
\`\`\`

## 코인 특성별 가중치

### 대형주 (BTC, ETH)
\`\`\`javascript
const largeCapsWeights = {
  rsi: 0.10,
  macd: 0.20,
  bollingerBands: 0.10,
  movingAverage: 0.35,   // 이평선 중시
  volume: 0.10,
  ai: 0.15
};
\`\`\`

### 중형주
\`\`\`javascript
const midCapsWeights = {
  rsi: 0.15,
  macd: 0.20,
  bollingerBands: 0.15,
  movingAverage: 0.25,
  volume: 0.15,          // 거래량 중요
  ai: 0.10
};
\`\`\`

### 소형주/알트코인
\`\`\`javascript
const smallCapsWeights = {
  rsi: 0.25,             // RSI 매우 중요
  macd: 0.15,
  bollingerBands: 0.25,  // 변동성 지표 중요
  movingAverage: 0.10,
  volume: 0.20,          // 펌핑/덤핑 감지
  ai: 0.05
};
\`\`\`

## 동적 가중치 조정

### 성과 기반 조정
\`\`\`javascript
class DynamicWeightAdjuster {
  constructor(initialWeights) {
    this.weights = {...initialWeights};
    this.performance = {};
    this.adjustmentRate = 0.05; // 5% 씩 조정
  }
  
  recordTrade(trade) {
    // 각 지표의 신호와 결과 기록
    for (const indicator of trade.signals) {
      if (!this.performance[indicator.name]) {
        this.performance[indicator.name] = {
          correct: 0,
          total: 0
        };
      }
      
      this.performance[indicator.name].total++;
      if (indicator.signal === trade.result) {
        this.performance[indicator.name].correct++;
      }
    }
  }
  
  adjustWeights() {
    const accuracies = {};
    let totalAccuracy = 0;
    
    // 각 지표의 정확도 계산
    for (const [indicator, perf] of Object.entries(this.performance)) {
      accuracies[indicator] = perf.correct / perf.total;
      totalAccuracy += accuracies[indicator];
    }
    
    // 정확도에 비례하여 가중치 재분배
    for (const indicator in this.weights) {
      this.weights[indicator] = accuracies[indicator] / totalAccuracy;
    }
    
    // 극단적 변화 방지
    this.smoothWeights();
  }
  
  smoothWeights() {
    const minWeight = 0.05;
    const maxWeight = 0.35;
    
    for (const indicator in this.weights) {
      this.weights[indicator] = Math.max(minWeight, 
                                Math.min(maxWeight, this.weights[indicator]));
    }
    
    // 정규화
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const indicator in this.weights) {
      this.weights[indicator] /= sum;
    }
  }
}
\`\`\`

### 시간대별 가중치
\`\`\`javascript
const timeBasedWeights = {
  // 아시아 시간 (09:00-17:00 KST)
  asia: {
    rsi: 0.15,
    macd: 0.20,
    bollingerBands: 0.15,
    movingAverage: 0.25,
    volume: 0.15,
    ai: 0.10
  },
  
  // 유럽 시간 (17:00-01:00 KST)
  europe: {
    rsi: 0.15,
    macd: 0.25,
    bollingerBands: 0.15,
    movingAverage: 0.20,
    volume: 0.15,
    ai: 0.10
  },
  
  // 미국 시간 (22:00-06:00 KST)
  us: {
    rsi: 0.20,
    macd: 0.20,
    bollingerBands: 0.20,
    movingAverage: 0.15,
    volume: 0.15,
    ai: 0.10
  }
};
\`\`\`

## 가중치 최적화

### 백테스트 기반 최적화
\`\`\`javascript
async function optimizeWeights(symbol, historicalData) {
  const baseWeights = getDefaultWeights();
  let bestWeights = {...baseWeights};
  let bestPerformance = 0;
  
  // 그리드 서치
  for (let rsi = 0.05; rsi <= 0.30; rsi += 0.05) {
    for (let macd = 0.05; macd <= 0.30; macd += 0.05) {
      for (let bb = 0.05; bb <= 0.30; bb += 0.05) {
        for (let ma = 0.05; ma <= 0.35; ma += 0.05) {
          for (let vol = 0.05; vol <= 0.20; vol += 0.05) {
            const ai = 1 - (rsi + macd + bb + ma + vol);
            
            if (ai >= 0.05 && ai <= 0.25) {
              const weights = { rsi, macd, bb, ma, volume: vol, ai };
              const performance = await backtest(historicalData, weights);
              
              if (performance.sharpeRatio > bestPerformance) {
                bestPerformance = performance.sharpeRatio;
                bestWeights = weights;
              }
            }
          }
        }
      }
    }
  }
  
  return bestWeights;
}
\`\`\`

### 머신러닝 접근
\`\`\`python
# Python 예시 (의사코드)
from sklearn.ensemble import RandomForestRegressor

def ml_weight_optimization(features, returns):
    # 각 지표의 중요도 학습
    model = RandomForestRegressor()
    model.fit(features, returns)
    
    # 특성 중요도 추출
    importances = model.feature_importances_
    
    # 가중치로 변환
    weights = importances / importances.sum()
    
    return {
        'rsi': weights[0],
        'macd': weights[1],
        'bb': weights[2],
        'ma': weights[3],
        'volume': weights[4],
        'ai': weights[5]
    }
\`\`\`

## 가중치 관리 팁

### 1. 점진적 변경
- 한 번에 5% 이상 변경하지 않기
- 최소 100거래 후 평가
- 변경 사항 문서화

### 2. 균형 유지
- 단일 지표 35% 초과 금지
- 모든 지표 최소 5% 유지
- 극단적 편중 방지

### 3. 검증 프로세스
\`\`\`
1. 백테스트로 초기 검증
2. 시뮬레이션에서 1주일 테스트
3. 소액으로 실거래 테스트
4. 단계적 확대 적용
\`\`\`

## 일반적인 실수

### 과최적화
- 과거 데이터에 너무 맞춤
- 미래 성과 보장 못함
- 해결: 교차 검증 사용

### 빈번한 변경
- 일관성 부족
- 성과 평가 어려움
- 해결: 최소 평가 기간 설정

### 극단적 가중치
- 단일 지표 의존
- 리스크 증가
- 해결: 상하한선 설정

<div class="info">
💡 **팁**: 가중치는 요리의 양념과 같습니다. 적절한 배합이 최고의 맛을 냅니다.
</div>

<div class="warning">
⚠️ **주의**: 완벽한 가중치는 없습니다. 시장은 계속 변하므로 지속적인 조정이 필요합니다.
</div>
    `,
  },
  'coin-settings.position-sizing': {
    title: '투자금액과 비율',
    content: `
# 투자금액과 비율

## 포지션 사이징의 중요성

적절한 포지션 크기는 리스크 관리의 핵심입니다. 너무 크면 큰 손실을, 너무 작으면 기회비용 손실을 초래합니다.

## 기본 설정

### 코인당 최대 투자금
\`\`\`javascript
const positionSettings = {
  // 절대 금액 방식
  maxInvestmentPerCoin: 1000000,  // 100만원
  
  // 비율 방식
  maxInvestmentRatio: 0.2,        // 총 자산의 20%
  
  // 둘 중 작은 값 적용
  getMaxInvestment: (totalBalance) => {
    return Math.min(
      this.maxInvestmentPerCoin,
      totalBalance * this.maxInvestmentRatio
    );
  }
};
\`\`\`

### 매수/매도 비율
\`\`\`javascript
const tradingRatios = {
  // 매수 비율
  buyRatio: 0.1,    // 가용 자금의 10%씩 매수
  
  // 매도 비율  
  sellRatio: 0.5,   // 보유 물량의 50%씩 매도
  
  // 분할 매수/매도
  splits: {
    buy: [0.3, 0.3, 0.4],   // 3분할 매수
    sell: [0.5, 0.3, 0.2]   // 3분할 매도
  }
};
\`\`\`

## Kelly Criterion

### Kelly 공식 이해
\`\`\`javascript
// Kelly % = (승률 × 평균수익률 - 패율) / 평균수익률
function kellyPercentage(winRate, avgWin, avgLoss) {
  const lossRate = 1 - winRate;
  const b = avgWin / avgLoss;  // 수익/손실 비율
  
  const kelly = (winRate * b - lossRate) / b;
  
  // 안전을 위해 1/4 Kelly 사용
  return Math.max(0, kelly * 0.25);
}

// 예시
const winRate = 0.6;      // 60% 승률
const avgWin = 0.08;      // 평균 8% 수익
const avgLoss = 0.04;     // 평균 4% 손실

const kellySize = kellyPercentage(winRate, avgWin, avgLoss);
// 결과: 0.2 × 0.25 = 0.05 (자산의 5%)
\`\`\`

### Kelly 적용 예시
\`\`\`javascript
class KellyPositionSizer {
  constructor(maxKellyRatio = 0.25) {
    this.maxKellyRatio = maxKellyRatio;
    this.tradeHistory = [];
  }
  
  calculatePosition(balance, confidence) {
    const stats = this.calculateStats();
    
    if (stats.trades < 30) {
      // 충분한 데이터 없으면 고정 비율
      return balance * 0.02;
    }
    
    const kellyRatio = this.kellyPercentage(
      stats.winRate,
      stats.avgWin,
      stats.avgLoss
    );
    
    // 신뢰도에 따라 조정
    const adjustedRatio = kellyRatio * (confidence / 100);
    
    // 상한선 적용
    const finalRatio = Math.min(adjustedRatio, this.maxKellyRatio);
    
    return balance * finalRatio;
  }
}
\`\`\`

## 리스크 기반 포지션

### 고정 리스크 방식
\`\`\`javascript
const fixedRiskPosition = {
  riskPerTrade: 0.02,  // 거래당 2% 리스크
  
  calculatePosition: (balance, entryPrice, stopLoss) => {
    // 리스크 금액 = 총자산 × 리스크 비율
    const riskAmount = balance * 0.02;
    
    // 코인당 리스크 = 진입가 - 손절가
    const riskPerCoin = entryPrice - stopLoss;
    
    // 포지션 크기 = 리스크 금액 ÷ 코인당 리스크
    const position = riskAmount / riskPerCoin;
    
    return {
      coins: position,
      investment: position * entryPrice,
      maxLoss: riskAmount
    };
  }
};

// 예시
const balance = 10000000;    // 1000만원
const entry = 50000;         // 진입가 5만원
const stop = 47500;          // 손절가 4.75만원 (5% 손절)

const position = fixedRiskPosition.calculatePosition(balance, entry, stop);
// coins: 80개
// investment: 4,000,000원
// maxLoss: 200,000원 (2%)
\`\`\`

### 변동성 조정 포지션
\`\`\`javascript
class VolatilityAdjustedPosition {
  constructor(baseRatio = 0.1) {
    this.baseRatio = baseRatio;
  }
  
  calculatePosition(balance, volatility) {
    // 변동성 20% 기준
    const baseVolatility = 0.20;
    
    // 변동성에 반비례하여 포지션 조정
    const adjustmentFactor = baseVolatility / volatility;
    
    // 조정 범위 제한 (0.5x ~ 2x)
    const limitedFactor = Math.max(0.5, Math.min(2.0, adjustmentFactor));
    
    const positionRatio = this.baseRatio * limitedFactor;
    
    return balance * positionRatio;
  }
}

// 예시
const sizer = new VolatilityAdjustedPosition(0.1);

// 저변동성 (10%)
const lowVolPosition = sizer.calculatePosition(10000000, 0.1);
// = 10,000,000 × 0.1 × 2.0 = 2,000,000원

// 고변동성 (40%) 
const highVolPosition = sizer.calculatePosition(10000000, 0.4);
// = 10,000,000 × 0.1 × 0.5 = 500,000원
\`\`\`

## 분할 매수/매도 전략

### 피라미딩 (Pyramiding)
\`\`\`javascript
const pyramidStrategy = {
  levels: [
    { priceChange: 0.00, ratio: 0.4 },   // 초기 40%
    { priceChange: -0.03, ratio: 0.3 },  // 3% 하락 시 30%
    { priceChange: -0.05, ratio: 0.3 }   // 5% 하락 시 30%
  ],
  
  execute: function(currentPrice, balance) {
    const positions = [];
    let remainingBalance = balance;
    
    for (const level of this.levels) {
      const targetPrice = currentPrice * (1 + level.priceChange);
      const investment = balance * level.ratio;
      
      positions.push({
        price: targetPrice,
        amount: investment,
        coins: investment / targetPrice
      });
      
      remainingBalance -= investment;
    }
    
    return positions;
  }
};
\`\`\`

### 스케일링 아웃 (Scaling Out)
\`\`\`javascript
const scaleOutStrategy = {
  targets: [
    { profit: 0.05, ratio: 0.3 },   // 5% 수익 시 30% 매도
    { profit: 0.10, ratio: 0.3 },   // 10% 수익 시 30% 매도
    { profit: 0.20, ratio: 0.4 }    // 20% 수익 시 40% 매도
  ],
  
  checkTargets: function(position) {
    const profitRatio = (position.currentPrice - position.avgPrice) / position.avgPrice;
    
    for (const target of this.targets) {
      if (profitRatio >= target.profit && !target.executed) {
        const sellAmount = position.quantity * target.ratio;
        
        executeSell({
          symbol: position.symbol,
          quantity: sellAmount,
          reason: \`목표 수익 \${target.profit * 100}% 달성\`
        });
        
        target.executed = true;
      }
    }
  }
};
\`\`\`

## 포트폴리오 배분

### 리스크 패리티
\`\`\`javascript
class RiskParityAllocator {
  allocate(coins, totalBalance) {
    // 각 코인의 변동성 계산
    const volatilities = coins.map(coin => this.calculateVolatility(coin));
    
    // 역변동성 가중치
    const inverseVols = volatilities.map(v => 1 / v);
    const sumInverseVols = inverseVols.reduce((a, b) => a + b, 0);
    
    // 각 코인 배분
    const allocations = {};
    coins.forEach((coin, i) => {
      const weight = inverseVols[i] / sumInverseVols;
      allocations[coin.symbol] = {
        weight: weight,
        amount: totalBalance * weight
      };
    });
    
    return allocations;
  }
}
\`\`\`

### 상관관계 고려
\`\`\`javascript
const correlationAdjustedAllocation = {
  maxCorrelation: 0.7,  // 상관관계 0.7 이상은 제한
  
  adjustForCorrelation: function(allocations, correlationMatrix) {
    for (let i = 0; i < allocations.length; i++) {
      for (let j = i + 1; j < allocations.length; j++) {
        if (correlationMatrix[i][j] > this.maxCorrelation) {
          // 높은 상관관계 코인들의 합산 비중 제한
          const totalWeight = allocations[i].weight + allocations[j].weight;
          const maxWeight = 0.3;  // 최대 30%
          
          if (totalWeight > maxWeight) {
            const ratio = maxWeight / totalWeight;
            allocations[i].weight *= ratio;
            allocations[j].weight *= ratio;
          }
        }
      }
    }
    
    // 재정규화
    this.normalizeWeights(allocations);
  }
};
\`\`\`

## 실전 예시

### 보수적 투자자
\`\`\`javascript
const conservativeSettings = {
  // 포지션 크기
  maxPositionSize: 0.05,        // 총자산의 5%
  maxCoinAllocation: 0.15,      // 코인당 최대 15%
  
  // 매매 비율
  buyRatio: 0.05,               // 5%씩 매수
  sellRatio: 0.3,               // 30%씩 매도
  
  // 분할 전략
  buyLevels: 5,                 // 5분할 매수
  sellLevels: 3,                // 3분할 매도
  
  // Kelly 제한
  maxKelly: 0.1                 // Kelly의 10%만 사용
};
\`\`\`

### 공격적 투자자
\`\`\`javascript
const aggressiveSettings = {
  // 포지션 크기
  maxPositionSize: 0.2,         // 총자산의 20%
  maxCoinAllocation: 0.3,       // 코인당 최대 30%
  
  // 매매 비율
  buyRatio: 0.2,                // 20%씩 매수
  sellRatio: 0.5,               // 50%씩 매도
  
  // 분할 전략
  buyLevels: 2,                 // 2분할 매수
  sellLevels: 2,                // 2분할 매도
  
  // Kelly 제한
  maxKelly: 0.4                 // Kelly의 40% 사용
};
\`\`\`

## 주의사항

### 과도한 집중 방지
- 단일 코인 최대 30%
- 상관성 높은 코인 그룹 최대 50%
- 최소 3개 이상 코인 분산

### 레버리지 고려
- 레버리지 사용 시 포지션 축소
- 2배 레버리지 = 포지션 50% 축소
- 변동성 증가 고려

### 유동성 확인
- 일일 거래량의 1% 이하로 제한
- 호가 스프레드 확인
- 슬리피지 고려

<div class="success">
✅ **핵심**: 포지션 사이징은 생존의 문제입니다. 한 번의 실수로 파산하지 않도록 신중하게 관리하세요.
</div>

<div class="warning">
⚠️ **경고**: 계산된 포지션 크기가 최소 주문 금액보다 작으면 거래하지 마세요.
</div>
    `,
  },
};