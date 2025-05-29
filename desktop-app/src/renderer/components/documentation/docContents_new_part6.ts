// Calculations 나머지 섹션들
export const calculationsContents = {
  'calculations': {
    title: '내부 계산 로직',
    content: `
# 내부 계산 로직

## 자동매매의 수학적 기반

성공적인 자동매매는 정확한 계산과 수학적 모델링에 기반합니다. 이 섹션에서는 프로그램 내부에서 사용되는 핵심 계산 로직을 설명합니다.

### 계산의 중요성
\`\`\`
1. 객관적 의사결정
   - 감정 배제
   - 일관된 기준
   - 검증 가능

2. 리스크 정량화
   - 손실 한도 계산
   - 포지션 크기 결정
   - 수익/위험 비율

3. 성과 측정
   - 수익률 계산
   - 통계적 분석
   - 전략 검증
\`\`\`

### 주요 계산 영역
- **기술적 지표**: 시장 데이터를 수학적으로 변환
- **신뢰도 점수**: 여러 신호를 하나의 확률로 통합
- **포지션 사이징**: 적절한 투자 금액 결정
- **수익률**: 정확한 성과 측정
- **Kelly Criterion**: 최적 베팅 크기 계산

<div class="info">
💡 **참고**: 모든 계산은 실시간으로 수행되며, 결과는 즉시 거래 결정에 반영됩니다.
</div>
    `,
  },
  'calculations.confidence-scoring': {
    title: '신뢰도 점수 계산',
    content: `
# 신뢰도 점수 계산

## 신뢰도 점수란?

여러 지표와 분석 결과를 종합하여 0-100% 사이의 단일 점수로 표현한 것입니다.

## 계산 과정 상세

### 1단계: 개별 신호 수집
\`\`\`javascript
// 각 지표에서 신호 추출
const signals = {
  rsi: {
    value: 28,
    signal: 'BUY',
    strength: calculateRSIStrength(28)  // 0-100
  },
  macd: {
    cross: 'golden',
    signal: 'BUY', 
    strength: calculateMACDStrength(macdData)
  },
  volume: {
    ratio: 1.8,  // 평균 대비
    signal: 'STRONG',
    strength: calculateVolumeStrength(1.8)
  }
};
\`\`\`

### 2단계: 신호 강도 계산
\`\`\`javascript
// RSI 신호 강도 계산
function calculateRSIStrength(rsi) {
  if (rsi < 20) return 100;        // 극단적 과매도
  if (rsi < 30) return 80;         // 과매도
  if (rsi > 80) return 100;        // 극단적 과매수
  if (rsi > 70) return 80;         // 과매수
  
  // 중립 구간에서는 거리에 따라
  const distance = Math.abs(50 - rsi);
  return Math.max(0, 50 - distance);
}

// MACD 신호 강도
function calculateMACDStrength(macd) {
  const { line, signal, histogram } = macd;
  
  // 크로스 직후가 가장 강함
  const crossStrength = Math.abs(histogram) * 1000;
  
  // 다이버전스 확인
  const divergence = checkDivergence(macd, prices);
  
  return Math.min(100, crossStrength + divergence * 20);
}
\`\`\`

### 3단계: 방향성 확인
\`\`\`javascript
function aggregateSignals(signals) {
  let buyCount = 0;
  let sellCount = 0;
  let neutralCount = 0;
  
  let buyStrength = 0;
  let sellStrength = 0;
  
  for (const [indicator, data] of Object.entries(signals)) {
    switch(data.signal) {
      case 'BUY':
        buyCount++;
        buyStrength += data.strength;
        break;
      case 'SELL':
        sellCount++;
        sellStrength += data.strength;
        break;
      default:
        neutralCount++;
    }
  }
  
  // 방향성 결정
  if (buyCount > sellCount * 1.5) {
    return { direction: 'BUY', strength: buyStrength / buyCount };
  } else if (sellCount > buyCount * 1.5) {
    return { direction: 'SELL', strength: sellStrength / sellCount };
  }
  
  return { direction: 'NEUTRAL', strength: 0 };
}
\`\`\`

### 4단계: 가중 평균 계산
\`\`\`javascript
function calculateWeightedConfidence(signals, weights) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  // 기본 가중치
  const defaultWeights = {
    rsi: 0.15,
    macd: 0.20,
    bollinger: 0.15,
    ma: 0.20,
    volume: 0.15,
    ai: 0.15
  };
  
  // 사용자 정의 가중치와 병합
  const finalWeights = { ...defaultWeights, ...weights };
  
  for (const [indicator, signal] of Object.entries(signals)) {
    if (signal && finalWeights[indicator]) {
      // 방향이 일치하는 경우만 포함
      if (signal.direction === aggregatedDirection) {
        weightedSum += signal.strength * finalWeights[indicator];
        totalWeight += finalWeights[indicator];
      }
    }
  }
  
  // 정규화 (0-100)
  return totalWeight > 0 ? (weightedSum / totalWeight) : 0;
}
\`\`\`

### 5단계: 시장 상황 보정
\`\`\`javascript
function applyMarketAdjustment(baseConfidence, marketCondition) {
  const adjustments = {
    'STRONG_TREND': {
      multiplier: 1.1,
      bonus: 5
    },
    'SIDEWAYS': {
      multiplier: 0.9,
      penalty: -5
    },
    'HIGH_VOLATILITY': {
      multiplier: 0.8,
      penalty: -10
    }
  };
  
  const adjustment = adjustments[marketCondition] || { multiplier: 1, bonus: 0 };
  
  let adjusted = baseConfidence * adjustment.multiplier;
  adjusted += adjustment.bonus || adjustment.penalty || 0;
  
  // 범위 제한
  return Math.max(0, Math.min(100, adjusted));
}
\`\`\`

## 신뢰도 향상 기법

### 1. 시간 가중치
\`\`\`javascript
// 최근 신호에 더 높은 가중치
function timeWeightedConfidence(signals, lookback = 5) {
  const timeWeights = [0.35, 0.25, 0.20, 0.15, 0.05];
  let confidence = 0;
  
  for (let i = 0; i < Math.min(signals.length, lookback); i++) {
    confidence += signals[i].confidence * timeWeights[i];
  }
  
  return confidence;
}
\`\`\`

### 2. 신호 일치도
\`\`\`javascript
// 더 많은 지표가 일치할수록 신뢰도 상승
function consensusBonus(signals) {
  const agreement = calculateAgreementRatio(signals);
  
  if (agreement > 0.8) return 10;   // 80% 이상 일치
  if (agreement > 0.6) return 5;    // 60% 이상 일치
  return 0;
}
\`\`\`

### 3. 신호 강도 분포
\`\`\`javascript
// 극단적 신호가 많을수록 신뢰도 상승
function extremeSignalBonus(signals) {
  const extremeCount = signals.filter(s => s.strength > 80).length;
  const totalCount = signals.length;
  
  const ratio = extremeCount / totalCount;
  return ratio * 15;  // 최대 15점 보너스
}
\`\`\`

## 신뢰도 검증

### 백테스트 검증
\`\`\`javascript
async function validateConfidenceModel(historicalData) {
  const results = [];
  
  for (const dataPoint of historicalData) {
    const confidence = calculateConfidence(dataPoint);
    const actualOutcome = getActualOutcome(dataPoint);
    
    results.push({
      confidence,
      predicted: confidence > 70 ? 'UP' : 'DOWN',
      actual: actualOutcome,
      correct: (confidence > 70) === (actualOutcome === 'UP')
    });
  }
  
  // 신뢰도별 정확도 분석
  const accuracyByConfidence = analyzeAccuracy(results);
  
  return {
    overall: calculateOverallAccuracy(results),
    byRange: accuracyByConfidence,
    calibration: calculateCalibration(results)
  };
}
\`\`\`

### 실시간 보정
\`\`\`javascript
class ConfidenceCalibrator {
  constructor() {
    this.recentPredictions = [];
    this.calibrationFactor = 1.0;
  }
  
  addResult(prediction, actual) {
    this.recentPredictions.push({ prediction, actual });
    
    // 최근 100개만 유지
    if (this.recentPredictions.length > 100) {
      this.recentPredictions.shift();
    }
    
    this.recalibrate();
  }
  
  recalibrate() {
    // 예측 신뢰도와 실제 성공률 비교
    const groups = this.groupByConfidence();
    
    for (const [range, predictions] of Object.entries(groups)) {
      const successRate = this.calculateSuccessRate(predictions);
      const expectedRate = this.getRangeMidpoint(range);
      
      // 보정 계수 조정
      if (Math.abs(successRate - expectedRate) > 0.1) {
        this.calibrationFactor *= (successRate / expectedRate);
      }
    }
  }
  
  adjustConfidence(rawConfidence) {
    return rawConfidence * this.calibrationFactor;
  }
}
\`\`\`

## 실전 활용 예시

### 매수 결정
\`\`\`javascript
function shouldBuy(marketData, settings) {
  // 1. 모든 지표 계산
  const indicators = calculateAllIndicators(marketData);
  
  // 2. 신호 추출
  const signals = extractSignals(indicators);
  
  // 3. 신뢰도 계산
  const confidence = calculateConfidence(signals, settings.weights);
  
  // 4. 시장 보정
  const adjusted = applyMarketAdjustment(confidence, marketData.condition);
  
  // 5. 최종 결정
  return {
    shouldBuy: adjusted >= settings.buyThreshold,
    confidence: adjusted,
    reasoning: explainDecision(signals, adjusted)
  };
}
\`\`\`

<div class="success">
✅ **핵심**: 신뢰도는 확률이지 확실성이 아닙니다. 70% 신뢰도는 10번 중 7번 성공을 의미합니다.
</div>

<div class="warning">
⚠️ **주의**: 과거 데이터로 계산한 신뢰도가 미래를 보장하지는 않습니다.
</div>
    `,
  },
  'calculations.position-sizing-calc': {
    title: '매수/매도 금액 계산',
    content: `
# 매수/매도 금액 계산

## 포지션 크기 결정의 중요성

적절한 포지션 크기는 수익을 극대화하면서도 리스크를 통제하는 핵심입니다.

## 기본 계산 방법

### 고정 금액 방식
\`\`\`javascript
// 가장 단순한 방법
function fixedAmountPosition(settings) {
  return {
    buyAmount: settings.fixedAmount,  // 예: 100만원
    sellAmount: settings.fixedAmount
  };
}
\`\`\`

### 고정 비율 방식
\`\`\`javascript
function fixedPercentagePosition(balance, settings) {
  const positionSize = balance * settings.percentage;
  
  // 최소/최대 제한
  return {
    amount: Math.max(
      settings.minOrder,
      Math.min(settings.maxOrder, positionSize)
    )
  };
}

// 예시: 총 자산의 10%
const position = fixedPercentagePosition(10000000, {
  percentage: 0.1,
  minOrder: 5000,
  maxOrder: 2000000
});
// 결과: 1,000,000원
\`\`\`

## 리스크 기반 계산

### 고정 리스크 모델
\`\`\`javascript
function riskBasedPosition(account, trade) {
  // 계좌의 2% 리스크
  const riskAmount = account.balance * 0.02;
  
  // 코인당 리스크 = 진입가 - 손절가
  const riskPerCoin = trade.entryPrice - trade.stopLoss;
  
  // 포지션 크기 = 리스크 금액 / 코인당 리스크
  const coins = riskAmount / riskPerCoin;
  
  return {
    coins: coins,
    investment: coins * trade.entryPrice,
    maxLoss: riskAmount,
    calculation: {
      accountBalance: account.balance,
      riskPercentage: 0.02,
      riskAmount: riskAmount,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      riskPerCoin: riskPerCoin
    }
  };
}

// 실제 계산 예시
const position = riskBasedPosition(
  { balance: 10000000 },  // 1천만원
  { entryPrice: 50000, stopLoss: 47500 }  // 5% 손절
);
// 결과: 80개 코인, 400만원 투자, 최대손실 20만원
\`\`\`

### 변동성 조정 포지션
\`\`\`javascript
function volatilityAdjustedPosition(baseAmount, marketData) {
  // ATR 기반 변동성
  const volatility = marketData.atr / marketData.price;
  
  // 변동성 조정 계수
  const adjustmentFactor = calculateVolatilityFactor(volatility);
  
  // 변동성이 높을수록 포지션 축소
  const adjustedAmount = baseAmount * adjustmentFactor;
  
  return {
    amount: adjustedAmount,
    volatility: volatility,
    adjustment: adjustmentFactor,
    reasoning: getVolatilityReasoning(volatility)
  };
}

function calculateVolatilityFactor(volatility) {
  // 기준 변동성 2%
  const baseVolatility = 0.02;
  
  // 역비례 관계
  let factor = baseVolatility / volatility;
  
  // 범위 제한 (0.3x ~ 2.0x)
  return Math.max(0.3, Math.min(2.0, factor));
}
\`\`\`

## Kelly Criterion 적용

### Kelly 공식
\`\`\`javascript
function kellyPosition(stats, bankroll) {
  // Kelly % = (p * b - q) / b
  // p: 승률, q: 패율, b: 평균수익/평균손실
  
  const p = stats.winRate;
  const q = 1 - p;
  const b = stats.avgWin / stats.avgLoss;
  
  // Kelly 비율 계산
  const kellyPercentage = (p * b - q) / b;
  
  // 안전을 위해 1/4 Kelly 사용
  const safeKelly = kellyPercentage * 0.25;
  
  // 음수면 거래하지 않음
  if (safeKelly <= 0) {
    return { amount: 0, reason: "Negative Kelly" };
  }
  
  // 포지션 크기
  const positionSize = bankroll * safeKelly;
  
  return {
    amount: Math.min(positionSize, bankroll * 0.25), // 최대 25%
    kellyRaw: kellyPercentage,
    kellySafe: safeKelly,
    stats: stats
  };
}

// 사용 예시
const position = kellyPosition({
  winRate: 0.6,      // 60% 승률
  avgWin: 0.08,      // 평균 8% 수익
  avgLoss: 0.04      // 평균 4% 손실
}, 10000000);
// Kelly = (0.6 * 2 - 0.4) / 2 = 0.4
// Safe Kelly = 0.4 * 0.25 = 0.1 (10%)
// 포지션 = 1,000,000원
\`\`\`

## 분할 매수/매도

### 피라미딩 전략
\`\`\`javascript
function pyramidEntry(totalAmount, levels) {
  const positions = [];
  
  // 역피라미드: 첫 매수가 가장 큼
  const ratios = [0.5, 0.3, 0.2];  // 50%, 30%, 20%
  
  for (let i = 0; i < levels; i++) {
    positions.push({
      level: i + 1,
      amount: totalAmount * ratios[i],
      condition: \`가격이 \${(i + 1) * 2}% 하락 시\`
    });
  }
  
  return positions;
}

// 3단계 분할 매수
const pyramid = pyramidEntry(1000000, 3);
// Level 1: 500,000원 (즉시)
// Level 2: 300,000원 (2% 하락 시)
// Level 3: 200,000원 (4% 하락 시)
\`\`\`

### 목표가 분할 매도
\`\`\`javascript
function scaledExit(position, targets) {
  const exitPlan = [];
  let remaining = position.quantity;
  
  targets.forEach((target, index) => {
    const sellQuantity = position.quantity * target.ratio;
    remaining -= sellQuantity;
    
    exitPlan.push({
      target: target.price,
      quantity: sellQuantity,
      percentage: target.ratio * 100,
      profit: ((target.price - position.avgPrice) / position.avgPrice) * 100
    });
  });
  
  return exitPlan;
}

// 사용 예시
const exits = scaledExit(
  { quantity: 100, avgPrice: 50000 },
  [
    { price: 55000, ratio: 0.3 },  // 10% 수익 시 30% 매도
    { price: 60000, ratio: 0.4 },  // 20% 수익 시 40% 매도
    { price: 70000, ratio: 0.3 }   // 40% 수익 시 30% 매도
  ]
);
\`\`\`

## 동적 포지션 조정

### 성과 기반 조정
\`\`\`javascript
class DynamicPositionSizer {
  constructor(baseSize) {
    this.baseSize = baseSize;
    this.recentTrades = [];
    this.adjustmentFactor = 1.0;
  }
  
  calculatePosition(balance) {
    // 최근 성과 분석
    const recentPerformance = this.analyzeRecentTrades();
    
    // 연승/연패 고려
    this.adjustForStreaks();
    
    // 드로다운 고려
    this.adjustForDrawdown();
    
    // 최종 포지션
    const position = balance * this.baseSize * this.adjustmentFactor;
    
    return {
      amount: Math.max(5000, position),  // 최소 5000원
      factor: this.adjustmentFactor,
      reasoning: this.getAdjustmentReasoning()
    };
  }
  
  adjustForStreaks() {
    const streak = this.getCurrentStreak();
    
    if (streak.type === 'WIN' && streak.count >= 3) {
      // 3연승 이상: 포지션 증가
      this.adjustmentFactor *= 1.2;
    } else if (streak.type === 'LOSS' && streak.count >= 2) {
      // 2연패 이상: 포지션 감소
      this.adjustmentFactor *= 0.7;
    }
  }
  
  adjustForDrawdown() {
    const drawdown = this.getCurrentDrawdown();
    
    if (drawdown > 0.15) {  // 15% 이상 손실
      this.adjustmentFactor *= 0.5;
    } else if (drawdown > 0.10) {  // 10% 이상 손실
      this.adjustmentFactor *= 0.7;
    }
  }
}
\`\`\`

## 수수료 고려

### 실제 투자금 계산
\`\`\`javascript
function calculateActualInvestment(intendedAmount, feeRate = 0.0005) {
  // 업비트 기본 수수료 0.05%
  const fee = intendedAmount * feeRate;
  
  // 실제 코인 구매에 사용될 금액
  const actualAmount = intendedAmount - fee;
  
  // 슬리피지 고려 (0.1% 가정)
  const slippage = actualAmount * 0.001;
  
  return {
    intended: intendedAmount,
    fee: fee,
    slippage: slippage,
    actual: actualAmount - slippage,
    total: intendedAmount
  };
}
\`\`\`

## 실전 포지션 계산

### 종합 계산 함수
\`\`\`javascript
function calculateOptimalPosition(params) {
  const {
    balance,
    confidence,
    volatility,
    winStats,
    riskProfile,
    marketCondition
  } = params;
  
  // 1. 기본 포지션 (Kelly)
  let position = kellyPosition(winStats, balance).amount;
  
  // 2. 신뢰도 조정
  position *= (confidence / 100);
  
  // 3. 변동성 조정
  const volAdjustment = calculateVolatilityFactor(volatility);
  position *= volAdjustment;
  
  // 4. 시장 상황 조정
  if (marketCondition === 'BEAR') {
    position *= 0.5;
  } else if (marketCondition === 'BULL') {
    position *= 1.2;
  }
  
  // 5. 리스크 프로필 적용
  position *= riskProfile.multiplier;
  
  // 6. 제한 사항 적용
  position = Math.max(5000, position);  // 최소
  position = Math.min(balance * 0.25, position);  // 최대 25%
  
  // 7. 1000원 단위로 반올림
  position = Math.round(position / 1000) * 1000;
  
  return {
    amount: position,
    percentage: (position / balance) * 100,
    breakdown: {
      kelly: kellyPosition(winStats, balance).amount,
      confidence: confidence,
      volatility: volAdjustment,
      market: marketCondition
    }
  };
}
\`\`\`

<div class="success">
✅ **핵심**: 포지션 사이징은 자금관리의 핵심입니다. 한 번의 거래로 파산하지 않도록 신중하게 계산하세요.
</div>

<div class="info">
💡 **팁**: 처음에는 작은 포지션으로 시작하고, 경험과 데이터가 쌓이면 점진적으로 늘리세요.
</div>
    `,
  },
  'calculations.profit-calculations': {
    title: '수익률 계산 방식',
    content: `
# 수익률 계산 방식

## 기본 수익률 계산

### 단순 수익률
\`\`\`javascript
// 개별 거래 수익률
function calculateSimpleReturn(buyPrice, sellPrice, quantity) {
  const profit = (sellPrice - buyPrice) * quantity;
  const investment = buyPrice * quantity;
  const returnRate = (profit / investment) * 100;
  
  return {
    profit: profit,
    investment: investment,
    returnRate: returnRate,
    returnRateDisplay: \`\${returnRate.toFixed(2)}%\`
  };
}

// 예시
const trade = calculateSimpleReturn(50000, 55000, 10);
// profit: 50,000원
// investment: 500,000원  
// returnRate: 10%
\`\`\`

### 수수료 포함 계산
\`\`\`javascript
function calculateNetReturn(trade) {
  const { buyPrice, sellPrice, quantity, feeRate = 0.0005 } = trade;
  
  // 매수 시 수수료
  const buyAmount = buyPrice * quantity;
  const buyFee = buyAmount * feeRate;
  
  // 매도 시 수수료
  const sellAmount = sellPrice * quantity;
  const sellFee = sellAmount * feeRate;
  
  // 순수익
  const grossProfit = sellAmount - buyAmount;
  const totalFees = buyFee + sellFee;
  const netProfit = grossProfit - totalFees;
  
  // 실제 투자금 (수수료 포함)
  const actualInvestment = buyAmount + buyFee;
  
  // 순수익률
  const netReturn = (netProfit / actualInvestment) * 100;
  
  return {
    grossProfit: grossProfit,
    totalFees: totalFees,
    netProfit: netProfit,
    netReturn: netReturn,
    breakdown: {
      buyAmount: buyAmount,
      buyFee: buyFee,
      sellAmount: sellAmount,
      sellFee: sellFee
    }
  };
}
\`\`\`

## 평균 단가 계산

### 이동평균법
\`\`\`javascript
class AveragePriceCalculator {
  constructor() {
    this.positions = [];
  }
  
  addBuy(price, quantity, timestamp) {
    this.positions.push({
      type: 'BUY',
      price: price,
      quantity: quantity,
      timestamp: timestamp
    });
  }
  
  calculateAveragePrice() {
    let totalCost = 0;
    let totalQuantity = 0;
    
    for (const position of this.positions) {
      if (position.type === 'BUY') {
        totalCost += position.price * position.quantity;
        totalQuantity += position.quantity;
      }
    }
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }
  
  // 부분 매도 시 평단가 유지
  addSell(price, quantity, timestamp) {
    const avgPrice = this.calculateAveragePrice();
    
    this.positions.push({
      type: 'SELL',
      price: price,
      quantity: quantity,
      timestamp: timestamp,
      profit: (price - avgPrice) * quantity
    });
    
    // FIFO 방식으로 매도 물량 차감
    this.updatePositionsAfterSell(quantity);
  }
}
\`\`\`

## 포트폴리오 수익률

### 시간가중수익률 (TWR)
\`\`\`javascript
function calculateTWR(portfolio) {
  const periods = portfolio.periods;
  let twr = 1;
  
  for (const period of periods) {
    const periodReturn = calculatePeriodReturn(period);
    twr *= (1 + periodReturn);
  }
  
  // 연율화
  const years = portfolio.totalDays / 365;
  const annualizedTWR = Math.pow(twr, 1/years) - 1;
  
  return {
    totalReturn: (twr - 1) * 100,
    annualizedReturn: annualizedTWR * 100
  };
}

function calculatePeriodReturn(period) {
  const startValue = period.startBalance + period.startHoldings;
  const endValue = period.endBalance + period.endHoldings;
  
  // 입출금 조정
  const netFlow = period.deposits - period.withdrawals;
  
  return (endValue - startValue - netFlow) / startValue;
}
\`\`\`

### 금액가중수익률 (MWR)
\`\`\`javascript
function calculateMWR(cashFlows) {
  // IRR (Internal Rate of Return) 계산
  // Newton-Raphson 방법 사용
  
  let rate = 0.1;  // 초기 추정값 10%
  const maxIterations = 100;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    const { npv, derivative } = calculateNPV(cashFlows, rate);
    
    if (Math.abs(npv) < tolerance) {
      return rate * 100;  // 백분율로 변환
    }
    
    rate = rate - npv / derivative;
  }
  
  return rate * 100;
}

function calculateNPV(cashFlows, rate) {
  let npv = 0;
  let derivative = 0;
  
  for (const cf of cashFlows) {
    const t = cf.days / 365;  // 연 단위로 변환
    const discountFactor = Math.pow(1 + rate, -t);
    
    npv += cf.amount * discountFactor;
    derivative -= t * cf.amount * discountFactor / (1 + rate);
  }
  
  return { npv, derivative };
}
\`\`\`

## 위험조정 수익률

### 샤프 비율 (Sharpe Ratio)
\`\`\`javascript
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
  const avgReturn = calculateAverage(returns);
  const stdDev = calculateStandardDeviation(returns);
  
  // 연율화
  const annualizedReturn = avgReturn * 252;  // 거래일 기준
  const annualizedStdDev = stdDev * Math.sqrt(252);
  
  // 샤프 비율 = (수익률 - 무위험수익률) / 표준편차
  const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedStdDev;
  
  return {
    sharpeRatio: sharpeRatio,
    interpretation: interpretSharpe(sharpeRatio),
    components: {
      avgReturn: avgReturn,
      annualizedReturn: annualizedReturn,
      stdDev: stdDev,
      annualizedStdDev: annualizedStdDev
    }
  };
}

function interpretSharpe(ratio) {
  if (ratio < 0) return "음수: 무위험 수익률보다 낮음";
  if (ratio < 0.5) return "낮음: 위험 대비 수익 부족";
  if (ratio < 1) return "보통: 적절한 위험 대비 수익";
  if (ratio < 2) return "좋음: 우수한 위험 대비 수익";
  return "매우 좋음: 탁월한 위험 대비 수익";
}
\`\`\`

### 최대낙폭 (Maximum Drawdown)
\`\`\`javascript
function calculateMaxDrawdown(equityCurve) {
  let maxDrawdown = 0;
  let peak = equityCurve[0];
  let maxDrawdownPeriod = { start: 0, end: 0 };
  
  for (let i = 1; i < equityCurve.length; i++) {
    // 신고점 갱신
    if (equityCurve[i].value > peak.value) {
      peak = equityCurve[i];
    }
    
    // 현재 낙폭
    const drawdown = (peak.value - equityCurve[i].value) / peak.value;
    
    // 최대 낙폭 갱신
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPeriod = {
        start: peak.date,
        end: equityCurve[i].date,
        duration: daysBetween(peak.date, equityCurve[i].date)
      };
    }
  }
  
  return {
    maxDrawdown: maxDrawdown * 100,
    period: maxDrawdownPeriod,
    recovery: calculateRecoveryTime(equityCurve, maxDrawdownPeriod)
  };
}
\`\`\`

## 거래별 통계

### 승률과 손익비
\`\`\`javascript
function calculateTradeStatistics(trades) {
  const winners = trades.filter(t => t.profit > 0);
  const losers = trades.filter(t => t.profit <= 0);
  
  // 승률
  const winRate = winners.length / trades.length;
  
  // 평균 수익/손실
  const avgWin = winners.length > 0 
    ? winners.reduce((sum, t) => sum + t.profitRate, 0) / winners.length 
    : 0;
    
  const avgLoss = losers.length > 0
    ? Math.abs(losers.reduce((sum, t) => sum + t.profitRate, 0) / losers.length)
    : 0;
  
  // 손익비
  const profitFactor = avgWin / avgLoss;
  
  // 기댓값
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
  
  return {
    totalTrades: trades.length,
    winners: winners.length,
    losers: losers.length,
    winRate: winRate * 100,
    avgWin: avgWin,
    avgLoss: avgLoss,
    profitFactor: profitFactor,
    expectancy: expectancy,
    largestWin: Math.max(...winners.map(t => t.profit)),
    largestLoss: Math.min(...losers.map(t => t.profit))
  };
}
\`\`\`

### 연속 승패 분석
\`\`\`javascript
function analyzeStreaks(trades) {
  let currentStreak = { type: null, count: 0 };
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  const streaks = [];
  
  for (const trade of trades) {
    const isWin = trade.profit > 0;
    
    if (currentStreak.type === null || 
        (isWin && currentStreak.type === 'WIN') ||
        (!isWin && currentStreak.type === 'LOSS')) {
      // 연속 유지
      currentStreak.type = isWin ? 'WIN' : 'LOSS';
      currentStreak.count++;
    } else {
      // 연속 종료
      streaks.push({ ...currentStreak });
      
      if (currentStreak.type === 'WIN') {
        maxWinStreak = Math.max(maxWinStreak, currentStreak.count);
      } else {
        maxLossStreak = Math.max(maxLossStreak, currentStreak.count);
      }
      
      currentStreak = { type: isWin ? 'WIN' : 'LOSS', count: 1 };
    }
  }
  
  return {
    maxWinStreak: maxWinStreak,
    maxLossStreak: maxLossStreak,
    currentStreak: currentStreak,
    allStreaks: streaks
  };
}
\`\`\`

## 실시간 수익률 계산

### 미실현 손익 포함
\`\`\`javascript
function calculateRealtimeReturn(portfolio) {
  let totalValue = portfolio.cashBalance;
  let totalCost = 0;
  
  // 보유 코인 평가
  for (const holding of portfolio.holdings) {
    const currentPrice = getCurrentPrice(holding.symbol);
    const currentValue = currentPrice * holding.quantity;
    
    totalValue += currentValue;
    totalCost += holding.avgPrice * holding.quantity;
    
    holding.unrealizedPnL = currentValue - (holding.avgPrice * holding.quantity);
    holding.unrealizedReturn = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
  }
  
  // 실현 손익
  const realizedPnL = portfolio.trades
    .filter(t => t.type === 'SELL')
    .reduce((sum, t) => sum + t.profit, 0);
  
  // 총 수익률
  const totalReturn = ((totalValue - portfolio.initialCapital) / portfolio.initialCapital) * 100;
  
  return {
    totalValue: totalValue,
    realizedPnL: realizedPnL,
    unrealizedPnL: totalValue - totalCost - portfolio.cashBalance,
    totalReturn: totalReturn,
    holdings: portfolio.holdings
  };
}
\`\`\`

<div class="success">
✅ **핵심**: 정확한 수익률 계산은 전략 평가의 기초입니다. 수수료와 세금을 반드시 고려하세요.
</div>

<div class="info">
💡 **팁**: 단순 수익률보다는 위험조정 수익률(샤프 비율)이 더 의미있는 지표입니다.
</div>
    `,
  },
  'calculations.kelly-criterion': {
    title: 'Kelly Criterion 계산',
    content: `
# Kelly Criterion 계산

## Kelly Criterion이란?

1956년 존 켈리가 개발한 최적 베팅 크기 공식으로, 장기적으로 자산을 최대화하는 포지션 크기를 계산합니다.

## 기본 공식

### 단순 Kelly 공식
\`\`\`
f* = (p × b - q) / b

여기서:
f* = 베팅할 자금의 비율
p = 승률
q = 패율 (1 - p)
b = 손익비 (평균 수익 / 평균 손실)
\`\`\`

### JavaScript 구현
\`\`\`javascript
function calculateKelly(winRate, avgWin, avgLoss) {
  const p = winRate;
  const q = 1 - winRate;
  const b = avgWin / avgLoss;
  
  // Kelly 비율
  const kelly = (p * b - q) / b;
  
  // 음수면 베팅하지 않음
  return Math.max(0, kelly);
}

// 예시: 60% 승률, 평균 10% 수익, 평균 5% 손실
const kelly = calculateKelly(0.6, 0.10, 0.05);
// f* = (0.6 × 2 - 0.4) / 2 = 0.4 (40%)
\`\`\`

## 실전 적용

### Fractional Kelly
\`\`\`javascript
class KellyCriterion {
  constructor(fraction = 0.25) {
    this.fraction = fraction;  // 안전을 위해 1/4 Kelly 사용
    this.minBet = 0.01;       // 최소 1%
    this.maxBet = 0.25;       // 최대 25%
  }
  
  calculate(stats) {
    // 기본 Kelly 계산
    const fullKelly = this.calculateFullKelly(stats);
    
    // Fractional Kelly 적용
    let betSize = fullKelly * this.fraction;
    
    // 범위 제한
    betSize = Math.max(this.minBet, Math.min(this.maxBet, betSize));
    
    return {
      fullKelly: fullKelly,
      fractionalKelly: betSize,
      fraction: this.fraction,
      recommendation: this.getRecommendation(betSize)
    };
  }
  
  calculateFullKelly(stats) {
    const { winRate, avgWinPercent, avgLossPercent } = stats;
    
    if (avgLossPercent === 0) return 0;
    
    const b = avgWinPercent / avgLossPercent;
    const p = winRate;
    const q = 1 - winRate;
    
    return (p * b - q) / b;
  }
  
  getRecommendation(betSize) {
    if (betSize <= 0) return "거래하지 마세요";
    if (betSize < 0.02) return "최소 포지션";
    if (betSize < 0.05) return "보수적 포지션";
    if (betSize < 0.10) return "표준 포지션";
    if (betSize < 0.15) return "공격적 포지션";
    return "최대 포지션";
  }
}
\`\`\`

### 다중 자산 Kelly
\`\`\`javascript
function multiAssetKelly(assets, correlationMatrix) {
  // 각 자산의 Kelly 비율
  const kellyRatios = assets.map(asset => 
    calculateKelly(asset.winRate, asset.avgWin, asset.avgLoss)
  );
  
  // 상관관계 조정
  const adjustedRatios = adjustForCorrelation(kellyRatios, correlationMatrix);
  
  // 정규화 (합이 1을 넘지 않도록)
  const sum = adjustedRatios.reduce((a, b) => a + b, 0);
  if (sum > 1) {
    return adjustedRatios.map(ratio => ratio / sum);
  }
  
  return adjustedRatios;
}

function adjustForCorrelation(ratios, correlations) {
  // 높은 상관관계 자산들의 비중 감소
  const adjusted = [...ratios];
  
  for (let i = 0; i < ratios.length; i++) {
    for (let j = i + 1; j < ratios.length; j++) {
      if (correlations[i][j] > 0.7) {
        // 상관관계가 0.7 이상이면 각각 20% 감소
        adjusted[i] *= 0.8;
        adjusted[j] *= 0.8;
      }
    }
  }
  
  return adjusted;
}
\`\`\`

## Kelly with Drawdown 제약

### 최대 손실 제한
\`\`\`javascript
class KellyWithDrawdownLimit {
  constructor(maxDrawdown = 0.20) {
    this.maxDrawdown = maxDrawdown;
  }
  
  calculate(stats, currentDrawdown = 0) {
    // 기본 Kelly
    const baseKelly = calculateKelly(stats.winRate, stats.avgWin, stats.avgLoss);
    
    // 현재 낙폭에 따른 조정
    const drawdownAdjustment = 1 - (currentDrawdown / this.maxDrawdown);
    
    // 낙폭이 한계에 가까울수록 베팅 크기 감소
    const adjustedKelly = baseKelly * Math.max(0, drawdownAdjustment);
    
    // 연속 손실 시 추가 감소
    if (stats.currentStreak < 0) {
      const streakPenalty = Math.pow(0.8, Math.abs(stats.currentStreak));
      return adjustedKelly * streakPenalty;
    }
    
    return adjustedKelly;
  }
}

// 사용 예시
const kellyDD = new KellyWithDrawdownLimit(0.20);
const betSize = kellyDD.calculate(
  {
    winRate: 0.55,
    avgWin: 0.08,
    avgLoss: 0.04,
    currentStreak: -2  // 2연패 중
  },
  0.12  // 현재 12% 손실
);
// 기본 Kelly × 낙폭 조정 × 연패 페널티
\`\`\`

## 실시간 Kelly 업데이트

### 베이지안 Kelly
\`\`\`javascript
class BayesianKelly {
  constructor(priorWinRate = 0.5, priorSampleSize = 30) {
    this.priorWinRate = priorWinRate;
    this.priorSampleSize = priorSampleSize;
    this.trades = [];
  }
  
  addTrade(result) {
    this.trades.push(result);
  }
  
  calculatePosteriorWinRate() {
    const wins = this.trades.filter(t => t.profit > 0).length;
    const totalTrades = this.trades.length;
    
    // 베이지안 업데이트
    const posteriorWins = this.priorWinRate * this.priorSampleSize + wins;
    const posteriorTotal = this.priorSampleSize + totalTrades;
    
    return posteriorWins / posteriorTotal;
  }
  
  getKellySize() {
    const winRate = this.calculatePosteriorWinRate();
    
    // 신뢰 구간 계산
    const confidence = this.calculateConfidenceInterval(winRate);
    
    // 보수적 접근: 신뢰구간 하한 사용
    const conservativeWinRate = confidence.lower;
    
    const avgWin = this.calculateAvgWin();
    const avgLoss = this.calculateAvgLoss();
    
    return calculateKelly(conservativeWinRate, avgWin, avgLoss);
  }
  
  calculateConfidenceInterval(winRate) {
    const n = this.priorSampleSize + this.trades.length;
    const z = 1.96;  // 95% 신뢰구간
    
    const margin = z * Math.sqrt(winRate * (1 - winRate) / n);
    
    return {
      lower: Math.max(0, winRate - margin),
      upper: Math.min(1, winRate + margin)
    };
  }
}
\`\`\`

## Kelly 시뮬레이션

### 몬테카를로 시뮬레이션
\`\`\`javascript
function simulateKellyGrowth(params, iterations = 10000) {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    let capital = 1.0;  // 초기 자본 1
    const path = [capital];
    
    for (let trade = 0; trade < params.numTrades; trade++) {
      // Kelly 베팅 크기
      const betSize = capital * params.kellyFraction;
      
      // 거래 결과 (확률적)
      if (Math.random() < params.winRate) {
        capital += betSize * params.winReturn;
      } else {
        capital -= betSize * params.lossReturn;
      }
      
      path.push(capital);
      
      // 파산 체크
      if (capital <= 0) break;
    }
    
    results.push({
      finalCapital: capital,
      maxDrawdown: calculateMaxDrawdown(path),
      path: path
    });
  }
  
  return analyzeSimulationResults(results);
}

function analyzeSimulationResults(results) {
  const finalCapitals = results.map(r => r.finalCapital);
  
  return {
    avgFinalCapital: average(finalCapitals),
    medianFinalCapital: median(finalCapitals),
    bankruptcyRate: results.filter(r => r.finalCapital <= 0).length / results.length,
    maxDrawdown: Math.max(...results.map(r => r.maxDrawdown)),
    percentiles: {
      p10: percentile(finalCapitals, 0.1),
      p25: percentile(finalCapitals, 0.25),
      p50: percentile(finalCapitals, 0.5),
      p75: percentile(finalCapitals, 0.75),
      p90: percentile(finalCapitals, 0.9)
    }
  };
}
\`\`\`

## 실전 Kelly 관리

### 동적 Kelly 조정
\`\`\`javascript
class DynamicKellyManager {
  constructor() {
    this.baseKelly = 0.25;
    this.recentPerformance = [];
    this.marketConditions = {};
  }
  
  getAdjustedKelly() {
    let kelly = this.baseKelly;
    
    // 1. 최근 성과 조정
    const recentWinRate = this.getRecentWinRate(20);
    if (recentWinRate < 0.4) kelly *= 0.5;
    else if (recentWinRate > 0.7) kelly *= 1.2;
    
    // 2. 변동성 조정
    const volatility = this.marketConditions.volatility || 0.02;
    const volAdjustment = 0.02 / volatility;  // 2% 기준
    kelly *= Math.min(1.5, Math.max(0.5, volAdjustment));
    
    // 3. 시장 체제 조정
    if (this.marketConditions.regime === 'BEAR') {
      kelly *= 0.6;
    } else if (this.marketConditions.regime === 'BULL') {
      kelly *= 1.1;
    }
    
    // 4. 상한/하한
    return Math.max(0.01, Math.min(0.4, kelly));
  }
  
  updatePerformance(trade) {
    this.recentPerformance.push({
      timestamp: Date.now(),
      profit: trade.profit,
      isWin: trade.profit > 0
    });
    
    // 최근 100개만 유지
    if (this.recentPerformance.length > 100) {
      this.recentPerformance.shift();
    }
  }
  
  getRecentWinRate(n) {
    const recent = this.recentPerformance.slice(-n);
    const wins = recent.filter(t => t.isWin).length;
    return wins / recent.length;
  }
}
\`\`\`

## Kelly 주의사항

### 과대평가 위험
\`\`\`javascript
// Kelly의 가정과 현실의 차이
const kellyAssumptions = {
  // Kelly 가정
  assumptions: [
    "정확한 승률 알고 있음",
    "정확한 수익/손실 알고 있음", 
    "무한 분할 가능",
    "거래 비용 없음",
    "시장 영향 없음"
  ],
  
  // 현실
  reality: [
    "승률은 추정치",
    "수익/손실 변동",
    "최소 거래 단위",
    "수수료와 슬리피지",
    "대량 거래 시 가격 영향"
  ],
  
  // 해결책
  solutions: [
    "Fractional Kelly 사용",
    "보수적 추정",
    "정기적 재계산",
    "거래 비용 고려",
    "포지션 한도 설정"
  ]
};
\`\`\`

<div class="success">
✅ **핵심**: Full Kelly는 이론적 최적값입니다. 실전에서는 1/4 Kelly로 시작하세요.
</div>

<div class="danger">
⚠️ **경고**: Kelly Criterion은 파산 가능성이 있습니다. 반드시 분수 Kelly를 사용하세요.
</div>
    `,
  },
};

// Auto Trading sections
export const autoTradingContents = {
  'auto-trading': {
    title: '자동매매 작동 원리',
    content: `
# 자동매매 작동 원리

## 개요

업비트 AI 자동매매 시스템은 24시간 시장을 모니터링하며, 설정된 전략에 따라 자동으로 매수/매도를 실행합니다.

### 핵심 구성 요소
\`\`\`
1. 시장 데이터 수집
   - 실시간 가격 정보
   - 거래량 데이터
   - 호가창 정보
   - 뉴스 및 공시

2. 기술적 분석
   - 10여 가지 지표 계산
   - 패턴 인식
   - 추세 분석

3. AI 의사결정
   - Claude API 활용
   - 종합적 시장 판단
   - 신뢰도 점수 계산

4. 자동 실행
   - 매수/매도 주문
   - 포지션 관리
   - 리스크 통제
\`\`\`

## 시스템 아키텍처

### 실시간 처리 흐름
\`\`\`javascript
const AutoTradingSystem = {
  // 메인 루프 (60초마다 실행)
  mainLoop: async function() {
    while (this.isRunning) {
      try {
        // 1. 데이터 수집
        const marketData = await this.collectMarketData();
        
        // 2. 기술적 분석
        const technicalAnalysis = await this.analyzeTechnical(marketData);
        
        // 3. AI 분석
        const aiAnalysis = await this.getAIInsight(marketData, technicalAnalysis);
        
        // 4. 신뢰도 계산
        const confidence = this.calculateConfidence(technicalAnalysis, aiAnalysis);
        
        // 5. 거래 결정
        const decision = this.makeDecision(confidence);
        
        // 6. 주문 실행
        if (decision.action) {
          await this.executeOrder(decision);
        }
        
        // 7. 포지션 모니터링
        await this.monitorPositions();
        
      } catch (error) {
        this.handleError(error);
      }
      
      // 60초 대기
      await this.sleep(60000);
    }
  }
};
\`\`\`

### 병렬 처리 구조
\`\`\`javascript
// 여러 코인 동시 분석
async function analyzeMultipleCoins(coins) {
  const analysisPromises = coins.map(coin => 
    analyzeSingleCoin(coin).catch(err => ({
      coin: coin,
      error: err,
      skip: true
    }))
  );
  
  const results = await Promise.all(analysisPromises);
  
  // 오류 처리 및 유효한 결과만 필터링
  return results.filter(r => !r.skip);
}
\`\`\`

## 안전장치와 제어

### 다중 안전장치
\`\`\`javascript
const SafetyMechanisms = {
  // 1. 일일 손실 한도
  dailyLossLimit: {
    percentage: 0.05,  // 5%
    check: function(currentLoss) {
      return currentLoss < this.percentage;
    }
  },
  
  // 2. 포지션 한도
  positionLimits: {
    maxPositions: 5,
    maxPerCoin: 0.2,  // 20%
    maxTotal: 0.8     // 80%
  },
  
  // 3. 주문 검증
  orderValidation: {
    minAmount: 5000,
    maxSlippage: 0.02,
    timeLimit: 5000  // 5초 내 체결
  },
  
  // 4. 긴급 정지
  emergencyStop: {
    triggers: [
      "API 오류 연속 3회",
      "비정상적 가격 변동",
      "시스템 리소스 부족",
      "네트워크 불안정"
    ],
    execute: function() {
      this.stopAllTrading();
      this.cancelPendingOrders();
      this.notifyUser();
    }
  }
};
\`\`\`

### 실시간 모니터링
\`\`\`javascript
class SystemMonitor {
  constructor() {
    this.metrics = {
      uptime: 0,
      tradesExecuted: 0,
      successRate: 0,
      latency: [],
      errors: []
    };
  }
  
  trackPerformance() {
    setInterval(() => {
      // CPU 사용률
      const cpuUsage = process.cpuUsage();
      
      // 메모리 사용량
      const memUsage = process.memoryUsage();
      
      // API 응답 시간
      const apiLatency = this.getAverageLatency();
      
      // 경고 조건
      if (cpuUsage.user > 80) {
        this.alert("높은 CPU 사용률");
      }
      
      if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
        this.alert("메모리 부족 경고");
      }
      
      if (apiLatency > 1000) {
        this.alert("API 응답 지연");
      }
    }, 10000); // 10초마다
  }
}
\`\`\`

## 상태 관리

### 거래 상태 추적
\`\`\`javascript
const TradingState = {
  global: {
    isRunning: false,
    isPaused: false,
    mode: 'simulation', // 'simulation' | 'live'
    startTime: null,
    lastUpdate: null
  },
  
  positions: new Map(), // 코인별 포지션
  
  orders: {
    pending: [],
    executed: [],
    cancelled: []
  },
  
  performance: {
    totalTrades: 0,
    winningTrades: 0,
    totalProfit: 0,
    maxDrawdown: 0
  },
  
  updatePosition(coin, data) {
    this.positions.set(coin, {
      ...this.positions.get(coin),
      ...data,
      lastUpdate: Date.now()
    });
  }
};
\`\`\`

## 오류 처리와 복구

### 장애 대응 시스템
\`\`\`javascript
class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.recoveryStrategies = {
      'API_ERROR': this.handleAPIError,
      'NETWORK_ERROR': this.handleNetworkError,
      'INSUFFICIENT_BALANCE': this.handleBalanceError,
      'ORDER_FAILED': this.handleOrderError
    };
  }
  
  async handle(error, context) {
    // 오류 분류
    const errorType = this.classifyError(error);
    
    // 오류 횟수 추적
    const count = (this.errorCounts.get(errorType) || 0) + 1;
    this.errorCounts.set(errorType, count);
    
    // 복구 전략 실행
    if (count <= 3) {
      const strategy = this.recoveryStrategies[errorType];
      if (strategy) {
        return await strategy.call(this, error, context);
      }
    } else {
      // 3회 이상 실패 시 해당 기능 일시 중단
      await this.suspendFeature(errorType, context);
    }
    
    // 로그 기록
    this.logError(error, errorType, context);
  }
  
  async handleAPIError(error, context) {
    // API 키 갱신
    await this.refreshAPIKey();
    
    // 재시도
    await this.sleep(5000);
    return { retry: true };
  }
}
\`\`\`

## 성능 최적화

### 캐싱 전략
\`\`\`javascript
class DataCache {
  constructor() {
    this.cache = new Map();
    this.ttl = {
      marketData: 1000,      // 1초
      indicators: 5000,      // 5초
      aiAnalysis: 30000,     // 30초
      staticData: 3600000    // 1시간
    };
  }
  
  get(key, fetcher) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // 캐시 미스 또는 만료
    const data = fetcher();
    this.set(key, data);
    return data;
  }
  
  set(key, data) {
    const ttl = this.getTTL(key);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now(),
      ttl: ttl
    });
  }
}
\`\`\`

### 리소스 관리
\`\`\`javascript
const ResourceManager = {
  // API 호출 제한 관리
  rateLimiter: {
    limits: {
      upbit: { calls: 1000, window: 60000 },    // 분당 1000회
      claude: { calls: 100, window: 60000 }      // 분당 100회
    },
    
    canCall(api) {
      const limit = this.limits[api];
      const calls = this.getRecentCalls(api, limit.window);
      return calls < limit.calls;
    }
  },
  
  // 메모리 관리
  memoryManager: {
    cleanup() {
      // 오래된 데이터 정리
      this.clearOldLogs();
      this.trimTradeHistory();
      
      // 가비지 컬렉션 강제 실행
      if (global.gc) {
        global.gc();
      }
    }
  }
};
\`\`\`

## 사용자 인터페이스 연동

### 실시간 업데이트
\`\`\`javascript
class UIConnector {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateInterval = 1000; // 1초
  }
  
  startUpdates() {
    setInterval(() => {
      const state = this.collectCurrentState();
      
      // IPC를 통해 렌더러 프로세스로 전송
      this.mainWindow.webContents.send('trading-update', {
        positions: Array.from(TradingState.positions.entries()),
        performance: TradingState.performance,
        alerts: this.getRecentAlerts(),
        nextActions: this.getUpcomingActions()
      });
    }, this.updateInterval);
  }
  
  handleUserCommand(command, params) {
    switch(command) {
      case 'START_TRADING':
        return this.startTrading(params);
      case 'STOP_TRADING':
        return this.stopTrading();
      case 'MODIFY_SETTINGS':
        return this.updateSettings(params);
      case 'FORCE_SELL':
        return this.forceSell(params.coin);
    }
  }
}
\`\`\`

<div class="info">
💡 **핵심**: 자동매매 시스템은 복잡하지만, 각 구성 요소가 독립적으로 작동하며 서로 협력합니다.
</div>
    `,
  },
  'auto-trading.analysis-cycle': {
    title: '60초 분석 주기',
    content: `
# 60초 분석 주기

## 왜 60초인가?

60초 주기는 실시간성과 안정성의 최적 균형점입니다.

### 주기 선정 이유
\`\`\`
장점:
1. API 호출 제한 준수
   - 업비트: 초당 10회, 분당 600회
   - 여유있는 호출로 안정성 확보

2. 의미있는 데이터 변화
   - 너무 짧으면 노이즈
   - 너무 길면 기회 손실

3. 시스템 부하 관리
   - CPU/메모리 효율적 사용
   - 여러 코인 동시 분석 가능

4. 전략 실행 시간
   - 복잡한 계산 수행
   - AI 분석 완료
   - 주문 실행 여유
\`\`\`

## 60초 동안 일어나는 일

### 타임라인 분해
\`\`\`javascript
const AnalysisCycle = {
  // 0-10초: 데이터 수집
  phase1: {
    duration: "0-10초",
    tasks: [
      "현재가 조회",
      "호가창 스냅샷",
      "거래량 데이터",
      "최근 체결 내역",
      "계좌 잔고 확인"
    ],
    parallel: true
  },
  
  // 10-30초: 기술적 분석
  phase2: {
    duration: "10-30초",
    tasks: [
      "지표 계산 (RSI, MACD 등)",
      "패턴 인식",
      "지지/저항선 분석",
      "추세 판단",
      "변동성 측정"
    ],
    parallel: true
  },
  
  // 30-45초: AI 분석 및 결정
  phase3: {
    duration: "30-45초",
    tasks: [
      "Claude API 호출",
      "종합 분석",
      "신뢰도 계산",
      "거래 결정"
    ],
    sequential: true
  },
  
  // 45-55초: 실행
  phase4: {
    duration: "45-55초",
    tasks: [
      "주문 검증",
      "주문 실행",
      "체결 확인",
      "포지션 업데이트"
    ],
    sequential: true
  },
  
  // 55-60초: 정리 및 대기
  phase5: {
    duration: "55-60초",
    tasks: [
      "로그 기록",
      "UI 업데이트",
      "다음 주기 준비",
      "대기"
    ]
  }
};
\`\`\`

### 실제 구현 코드
\`\`\`javascript
class TradingCycle {
  constructor(coins) {
    this.coins = coins;
    this.cycleCount = 0;
    this.isRunning = false;
  }
  
  async start() {
    this.isRunning = true;
    
    while (this.isRunning) {
      const cycleStart = Date.now();
      this.cycleCount++;
      
      console.log(\`[주기 \${this.cycleCount}] 시작\`);
      
      try {
        // Phase 1: 데이터 수집 (병렬)
        const marketData = await this.collectDataParallel();
        
        // Phase 2: 기술적 분석 (병렬)
        const technicalResults = await this.analyzeTechnicalParallel(marketData);
        
        // Phase 3: AI 분석 및 결정
        const decisions = await this.makeDecisions(marketData, technicalResults);
        
        // Phase 4: 주문 실행
        await this.executeDecisions(decisions);
        
        // Phase 5: 마무리
        await this.finalizeCycle();
        
      } catch (error) {
        await this.handleCycleError(error);
      }
      
      // 정확히 60초 대기
      const cycleTime = Date.now() - cycleStart;
      const waitTime = Math.max(0, 60000 - cycleTime);
      
      console.log(\`[주기 \${this.cycleCount}] 완료: \${cycleTime}ms, 대기: \${waitTime}ms\`);
      
      await this.sleep(waitTime);
    }
  }
  
  async collectDataParallel() {
    const dataPromises = this.coins.map(coin => ({
      coin: coin,
      promise: this.collectCoinData(coin)
    }));
    
    const results = await Promise.allSettled(
      dataPromises.map(d => d.promise)
    );
    
    // 성공한 데이터만 반환
    return results
      .map((result, index) => ({
        coin: dataPromises[index].coin,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
      .filter(r => r.data !== null);
  }
}
\`\`\`

## 주기 최적화

### 동적 주기 조정
\`\`\`javascript
class AdaptiveCycleManager {
  constructor() {
    this.baseCycle = 60000; // 60초
    this.minCycle = 30000;  // 최소 30초
    this.maxCycle = 120000; // 최대 120초
    
    this.adjustmentFactors = {
      highVolatility: 0.5,    // 높은 변동성: 주기 단축
      lowVolatility: 1.5,     // 낮은 변동성: 주기 연장
      manyPositions: 0.7,     // 많은 포지션: 주기 단축
      fewPositions: 1.3,      // 적은 포지션: 주기 연장
      peakHours: 0.8,         // 피크 시간: 주기 단축
      quietHours: 1.2         // 조용한 시간: 주기 연장
    };
  }
  
  calculateNextCycle(currentState) {
    let cycleTime = this.baseCycle;
    
    // 변동성 기반 조정
    if (currentState.volatility > 0.05) {
      cycleTime *= this.adjustmentFactors.highVolatility;
    } else if (currentState.volatility < 0.02) {
      cycleTime *= this.adjustmentFactors.lowVolatility;
    }
    
    // 포지션 수 기반 조정
    if (currentState.openPositions > 3) {
      cycleTime *= this.adjustmentFactors.manyPositions;
    } else if (currentState.openPositions === 0) {
      cycleTime *= this.adjustmentFactors.fewPositions;
    }
    
    // 시간대 기반 조정
    const hour = new Date().getHours();
    if (hour >= 21 || hour <= 2) { // 미국 장 시간
      cycleTime *= this.adjustmentFactors.peakHours;
    } else if (hour >= 3 && hour <= 8) { // 새벽
      cycleTime *= this.adjustmentFactors.quietHours;
    }
    
    // 범위 제한
    return Math.max(
      this.minCycle,
      Math.min(this.maxCycle, Math.round(cycleTime))
    );
  }
}
\`\`\`

### 부하 분산
\`\`\`javascript
class LoadBalancer {
  constructor(coins, maxConcurrent = 3) {
    this.coins = coins;
    this.maxConcurrent = maxConcurrent;
    this.queues = this.initializeQueues();
  }
  
  initializeQueues() {
    // 코인을 우선순위별로 그룹화
    return {
      high: [],    // 활발한 거래
      medium: [],  // 보통
      low: []      // 조용한 코인
    };
  }
  
  async processInBatches() {
    const batches = this.createBatches();
    
    for (const batch of batches) {
      console.log(\`배치 처리: \${batch.map(c => c.symbol).join(', ')}\`);
      
      // 배치 내 병렬 처리
      await Promise.all(
        batch.map(coin => this.processCoin(coin))
      );
      
      // 배치 간 짧은 대기
      await this.sleep(5000);
    }
  }
  
  createBatches() {
    const batches = [];
    let currentBatch = [];
    
    // 우선순위 순으로 배치 생성
    const allCoins = [
      ...this.queues.high,
      ...this.queues.medium,
      ...this.queues.low
    ];
    
    for (const coin of allCoins) {
      currentBatch.push(coin);
      
      if (currentBatch.length >= this.maxConcurrent) {
        batches.push([...currentBatch]);
        currentBatch = [];
      }
    }
    
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    return batches;
  }
}
\`\`\`

## 주기 모니터링

### 성능 추적
\`\`\`javascript
class CycleMonitor {
  constructor() {
    this.metrics = {
      cycleTime: [],
      phaseTime: {},
      successRate: [],
      apiCalls: []
    };
  }
  
  recordCycle(cycleData) {
    // 전체 주기 시간
    this.metrics.cycleTime.push(cycleData.totalTime);
    
    // 단계별 시간
    for (const [phase, time] of Object.entries(cycleData.phases)) {
      if (!this.metrics.phaseTime[phase]) {
        this.metrics.phaseTime[phase] = [];
      }
      this.metrics.phaseTime[phase].push(time);
    }
    
    // 성공률
    this.metrics.successRate.push(cycleData.successRate);
    
    // 최근 100개만 유지
    this.trimMetrics();
  }
  
  getReport() {
    return {
      avgCycleTime: this.average(this.metrics.cycleTime),
      maxCycleTime: Math.max(...this.metrics.cycleTime),
      phaseBreakdown: this.getPhaseBreakdown(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.getRecommendations()
    };
  }
  
  identifyBottlenecks() {
    const bottlenecks = [];
    
    // 각 단계의 평균 시간 분석
    for (const [phase, times] of Object.entries(this.metrics.phaseTime)) {
      const avgTime = this.average(times);
      const maxTime = Math.max(...times);
      
      if (avgTime > 15000) { // 15초 이상
        bottlenecks.push({
          phase: phase,
          avgTime: avgTime,
          maxTime: maxTime,
          severity: avgTime > 20000 ? 'high' : 'medium'
        });
      }
    }
    
    return bottlenecks;
  }
}
\`\`\`

## 장애 상황 대응

### 주기 스킵 방지
\`\`\`javascript
class CycleGuard {
  constructor() {
    this.skipCount = 0;
    this.maxSkips = 3;
    this.lastCycleTime = Date.now();
  }
  
  checkHealth() {
    const timeSinceLastCycle = Date.now() - this.lastCycleTime;
    
    // 90초 이상 지연 시 경고
    if (timeSinceLastCycle > 90000) {
      this.handleDelayedCycle();
    }
    
    // 3분 이상 중단 시 재시작
    if (timeSinceLastCycle > 180000) {
      this.forceRestart();
    }
  }
  
  async handleDelayedCycle() {
    console.warn("주기 지연 감지");
    
    // 현재 작업 중단
    await this.cancelCurrentTasks();
    
    // 빠른 복구 모드
    await this.quickRecovery();
  }
  
  async quickRecovery() {
    // 필수 작업만 수행
    const essentialTasks = [
      this.checkOpenPositions(),
      this.updateStopLoss(),
      this.cancelPendingOrders()
    ];
    
    await Promise.all(essentialTasks);
    
    // 다음 정상 주기로 복귀
    this.skipCount = 0;
    this.lastCycleTime = Date.now();
  }
}
\`\`\`

### 우선순위 처리
\`\`\`javascript
// 시간이 부족할 때 중요한 작업 우선 처리
const PriorityManager = {
  high: [
    "손절 확인",
    "포지션 모니터링",
    "긴급 매도"
  ],
  
  medium: [
    "신규 매수 분석",
    "기술적 지표 계산"
  ],
  
  low: [
    "AI 상세 분석",
    "백테스트",
    "리포트 생성"
  ],
  
  executeByPriority(timeRemaining) {
    const tasks = [];
    
    if (timeRemaining > 40000) {
      tasks.push(...this.high, ...this.medium, ...this.low);
    } else if (timeRemaining > 20000) {
      tasks.push(...this.high, ...this.medium);
    } else {
      tasks.push(...this.high);
    }
    
    return tasks;
  }
};
\`\`\`

<div class="success">
✅ **최적화 팁**: 코인 수가 많을 때는 중요도에 따라 분석 주기를 다르게 설정하세요.
</div>
    `,
  },
  'auto-trading.signal-generation': {
    title: '매매 신호 생성',
    content: `
# 매매 신호 생성

## 신호 생성 과정

매매 신호는 여러 데이터 소스와 분석 결과를 종합하여 생성됩니다.

### 데이터 입력
\`\`\`javascript
const SignalInputs = {
  // 시장 데이터
  marketData: {
    price: 50000,
    volume: 1234567890,
    change24h: 0.035,
    high24h: 51000,
    low24h: 48500,
    trades: 45678
  },
  
  // 기술적 지표
  technicalIndicators: {
    rsi: 28,
    macd: { line: 100, signal: 95, histogram: 5 },
    bollinger: { upper: 52000, middle: 50000, lower: 48000 },
    ma: { ma20: 49500, ma50: 48000, ma200: 45000 },
    volume: { ratio: 1.8, trend: 'increasing' }
  },
  
  // AI 분석
  aiAnalysis: {
    sentiment: 0.7,
    prediction: 'bullish',
    confidence: 0.82,
    keyFactors: ['oversold', 'volume_surge', 'support_bounce']
  },
  
  // 시장 상황
  marketContext: {
    btcTrend: 'up',
    globalSentiment: 'neutral',
    newsImpact: 'positive',
    whaleActivity: 'accumulating'
  }
};
\`\`\`

## 신호 유형과 강도

### 매수 신호
\`\`\`javascript
class BuySignalGenerator {
  constructor() {
    this.signals = {
      strong: [],
      medium: [],
      weak: []
    };
  }
  
  generateSignals(data) {
    this.signals = { strong: [], medium: [], weak: [] };
    
    // RSI 과매도
    if (data.rsi < 20) {
      this.signals.strong.push({
        type: 'RSI_EXTREME_OVERSOLD',
        value: data.rsi,
        strength: 90,
        message: 'RSI 극단적 과매도 구간'
      });
    } else if (data.rsi < 30) {
      this.signals.medium.push({
        type: 'RSI_OVERSOLD',
        value: data.rsi,
        strength: 70,
        message: 'RSI 과매도 구간'
      });
    }
    
    // MACD 골든크로스
    if (data.macd.histogram > 0 && data.macd.previousHistogram <= 0) {
      this.signals.strong.push({
        type: 'MACD_GOLDEN_CROSS',
        value: data.macd.histogram,
        strength: 85,
        message: 'MACD 골든크로스 발생'
      });
    }
    
    // 볼린저밴드 하단 터치
    if (data.price <= data.bollinger.lower) {
      this.signals.medium.push({
        type: 'BOLLINGER_LOWER_TOUCH',
        value: (data.bollinger.lower - data.price) / data.price,
        strength: 75,
        message: '볼린저밴드 하단 돌파'
      });
    }
    
    // 거래량 급증
    if (data.volume.ratio > 2.0) {
      this.signals.medium.push({
        type: 'VOLUME_SURGE',
        value: data.volume.ratio,
        strength: 80,
        message: \\\`거래량 \\\${data.volume.ratio.toFixed(1)}배 증가\\\`
      });
    }
    
    // 이동평균선 지지
    if (Math.abs(data.price - data.ma.ma200) / data.price < 0.01) {
      this.signals.weak.push({
        type: 'MA_SUPPORT',
        value: data.ma.ma200,
        strength: 60,
        message: '200일 이동평균선 지지'
      });
    }
    
    return this.combineSignals();
  }
  
  combineSignals() {
    const allSignals = [
      ...this.signals.strong,
      ...this.signals.medium,
      ...this.signals.weak
    ];
    
    if (allSignals.length === 0) {
      return { action: 'HOLD', confidence: 0 };
    }
    
    // 가중 평균 계산
    const totalStrength = allSignals.reduce((sum, s) => sum + s.strength, 0);
    const avgStrength = totalStrength / allSignals.length;
    
    // 신호 개수에 따른 보너스
    const countBonus = Math.min(allSignals.length * 5, 20);
    
    const finalConfidence = Math.min(avgStrength + countBonus, 100);
    
    return {
      action: finalConfidence >= 70 ? 'BUY' : 'HOLD',
      confidence: finalConfidence,
      signals: allSignals,
      summary: this.generateSummary(allSignals)
    };
  }
}
\`\`\`

### 매도 신호
\`\`\`javascript
class SellSignalGenerator {
  constructor(position) {
    this.position = position;
    this.entryPrice = position.avgPrice;
    this.holdingTime = Date.now() - position.entryTime;
  }
  
  generateSignals(data) {
    const signals = [];
    const currentProfit = (data.price - this.entryPrice) / this.entryPrice;
    
    // 목표 수익 도달
    if (currentProfit >= 0.15) {
      signals.push({
        type: 'TARGET_REACHED',
        strength: 95,
        urgency: 'low',
        message: '목표 수익 15% 도달'
      });
    }
    
    // 손절선 도달
    if (currentProfit <= -0.05) {
      signals.push({
        type: 'STOP_LOSS',
        strength: 100,
        urgency: 'immediate',
        message: '손절선 -5% 도달'
      });
    }
    
    // RSI 과매수
    if (data.rsi > 80) {
      signals.push({
        type: 'RSI_OVERBOUGHT',
        strength: 85,
        urgency: 'medium',
        message: 'RSI 극단적 과매수'
      });
    }
    
    // MACD 데드크로스
    if (data.macd.histogram < 0 && data.macd.previousHistogram >= 0) {
      signals.push({
        type: 'MACD_DEATH_CROSS',
        strength: 80,
        urgency: 'medium',
        message: 'MACD 데드크로스 발생'
      });
    }
    
    // 추세 전환
    if (data.trend.changed && data.trend.direction === 'down') {
      signals.push({
        type: 'TREND_REVERSAL',
        strength: 75,
        urgency: 'high',
        message: '하락 추세 전환 감지'
      });
    }
    
    // 시간 기반 청산
    if (this.holdingTime > 72 * 3600 * 1000 && currentProfit < 0.05) {
      signals.push({
        type: 'TIME_EXIT',
        strength: 70,
        urgency: 'low',
        message: '72시간 경과, 수익 미달'
      });
    }
    
    return this.evaluateSellSignals(signals);
  }
  
  evaluateSellSignals(signals) {
    if (signals.length === 0) {
      return { action: 'HOLD', confidence: 0 };
    }
    
    // 긴급도별 분류
    const immediate = signals.filter(s => s.urgency === 'immediate');
    const high = signals.filter(s => s.urgency === 'high');
    const medium = signals.filter(s => s.urgency === 'medium');
    
    // 즉시 매도 필요
    if (immediate.length > 0) {
      return {
        action: 'SELL',
        confidence: 100,
        urgency: 'immediate',
        reason: immediate[0].message
      };
    }
    
    // 종합 평가
    const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
    
    return {
      action: avgStrength >= 75 ? 'SELL' : 'HOLD',
      confidence: avgStrength,
      urgency: high.length > 0 ? 'high' : 'normal',
      signals: signals
    };
  }
}
\`\`\`

## 신호 필터링

### 노이즈 제거
\`\`\`javascript
class SignalFilter {
  constructor() {
    this.history = [];
    this.falseSignals = new Set();
  }
  
  filter(signal, marketData) {
    // 1. 최소 강도 필터
    if (signal.confidence < 60) {
      return null;
    }
    
    // 2. 시장 상황 필터
    if (!this.isValidMarketCondition(marketData)) {
      return null;
    }
    
    // 3. 연속 신호 필터
    if (this.isDuplicateSignal(signal)) {
      return null;
    }
    
    // 4. 변동성 필터
    if (marketData.volatility > 0.10) {
      signal.confidence *= 0.8; // 높은 변동성에서는 신뢰도 감소
    }
    
    // 5. 거래량 필터
    if (marketData.volume < marketData.avgVolume * 0.5) {
      signal.confidence *= 0.9; // 낮은 거래량에서는 신뢰도 감소
    }
    
    // 6. 시간대 필터
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) { // 새벽 시간
      signal.confidence *= 0.85;
    }
    
    // 최종 신뢰도 확인
    if (signal.confidence < 65) {
      return null;
    }
    
    // 검증된 신호 기록
    this.history.push({
      signal: signal,
      timestamp: Date.now(),
      marketSnapshot: marketData
    });
    
    return signal;
  }
  
  isValidMarketCondition(data) {
    // 시장 정지 확인
    if (data.isHalted) return false;
    
    // 비정상적 스프레드
    if (data.spread > 0.02) return false;
    
    // 유동성 부족
    if (data.orderBookDepth < 100000000) return false;
    
    return true;
  }
  
  isDuplicateSignal(signal) {
    const recentSignals = this.history.filter(
      h => Date.now() - h.timestamp < 300000 // 5분 이내
    );
    
    return recentSignals.some(h => 
      h.signal.type === signal.type &&
      Math.abs(h.signal.confidence - signal.confidence) < 5
    );
  }
}
\`\`\`

## 멀티 타임프레임 분석

### 시간대별 신호 통합
\`\`\`javascript
class MultiTimeframeAnalysis {
  constructor() {
    this.timeframes = {
      '1m': { weight: 0.1, signals: [] },
      '5m': { weight: 0.2, signals: [] },
      '15m': { weight: 0.3, signals: [] },
      '1h': { weight: 0.25, signals: [] },
      '4h': { weight: 0.15, signals: [] }
    };
  }
  
  async analyzeAllTimeframes(coin) {
    const promises = Object.keys(this.timeframes).map(async (tf) => {
      const data = await this.getTimeframeData(coin, tf);
      const signals = this.generateTimeframeSignals(data, tf);
      
      return { timeframe: tf, signals: signals };
    });
    
    const results = await Promise.all(promises);
    
    // 결과 저장
    results.forEach(r => {
      this.timeframes[r.timeframe].signals = r.signals;
    });
    
    return this.combineTimeframeSignals();
  }
  
  combineTimeframeSignals() {
    let weightedBuyScore = 0;
    let weightedSellScore = 0;
    let totalWeight = 0;
    
    for (const [tf, data] of Object.entries(this.timeframes)) {
      if (data.signals.length === 0) continue;
      
      const buySignals = data.signals.filter(s => s.action === 'BUY');
      const sellSignals = data.signals.filter(s => s.action === 'SELL');
      
      const buyScore = buySignals.reduce((sum, s) => sum + s.strength, 0) / (buySignals.length || 1);
      const sellScore = sellSignals.reduce((sum, s) => sum + s.strength, 0) / (sellSignals.length || 1);
      
      weightedBuyScore += buyScore * data.weight;
      weightedSellScore += sellScore * data.weight;
      totalWeight += data.weight;
    }
    
    const finalBuyScore = totalWeight > 0 ? weightedBuyScore / totalWeight : 0;
    const finalSellScore = totalWeight > 0 ? weightedSellScore / totalWeight : 0;
    
    // 최종 결정
    if (finalBuyScore > finalSellScore && finalBuyScore > 70) {
      return {
        action: 'BUY',
        confidence: finalBuyScore,
        timeframeAlignment: this.checkAlignment('BUY')
      };
    } else if (finalSellScore > finalBuyScore && finalSellScore > 70) {
      return {
        action: 'SELL',
        confidence: finalSellScore,
        timeframeAlignment: this.checkAlignment('SELL')
      };
    }
    
    return { action: 'HOLD', confidence: 0 };
  }
  
  checkAlignment(action) {
    let alignedCount = 0;
    let totalCount = 0;
    
    for (const [tf, data] of Object.entries(this.timeframes)) {
      if (data.signals.length > 0) {
        totalCount++;
        const hasAction = data.signals.some(s => s.action === action);
        if (hasAction) alignedCount++;
      }
    }
    
    return {
      ratio: alignedCount / totalCount,
      isStrong: alignedCount / totalCount > 0.7
    };
  }
}
\`\`\`

## 신호 검증과 백테스트

### 실시간 검증
\`\`\`javascript
class SignalValidator {
  constructor() {
    this.pendingSignals = new Map();
    this.validationPeriod = 60000; // 1분
  }
  
  async validate(signal, marketData) {
    // 즉시 실행이 필요한 신호
    if (signal.urgency === 'immediate') {
      return { valid: true, execute: true };
    }
    
    // 검증 대기열에 추가
    this.pendingSignals.set(signal.id, {
      signal: signal,
      startPrice: marketData.price,
      startTime: Date.now(),
      marketSnapshot: marketData
    });
    
    // 검증 기간 대기
    await this.sleep(this.validationPeriod);
    
    // 신호 유효성 확인
    const validation = await this.checkSignalValidity(signal.id);
    
    return validation;
  }
  
  async checkSignalValidity(signalId) {
    const pending = this.pendingSignals.get(signalId);
    if (!pending) return { valid: false };
    
    const currentData = await this.getCurrentMarketData(pending.signal.coin);
    const priceChange = (currentData.price - pending.startPrice) / pending.startPrice;
    
    // 매수 신호 검증
    if (pending.signal.action === 'BUY') {
      // 가격이 상승하기 시작했으면 유효
      if (priceChange > 0.001) {
        return { valid: true, confidence: pending.signal.confidence * 1.1 };
      }
      // 추가 하락했으면 무효
      if (priceChange < -0.005) {
        return { valid: false, reason: '추가 하락 발생' };
      }
    }
    
    // 매도 신호 검증
    if (pending.signal.action === 'SELL') {
      // 가격이 하락하기 시작했으면 유효
      if (priceChange < -0.001) {
        return { valid: true, confidence: pending.signal.confidence * 1.1 };
      }
    }
    
    // 변동이 없으면 원래 신뢰도로 실행
    return { valid: true, confidence: pending.signal.confidence };
  }
}
\`\`\`

<div class="info">
💡 **핵심**: 여러 신호가 동시에 나타날 때 더 신뢰할 수 있습니다. 단일 신호만으로는 거래하지 마세요.
</div>
    `,
  },
  'auto-trading.confidence-calculation': {
    title: '신뢰도 계산 상세',
    content: `
# 신뢰도 계산 상세

## 신뢰도 점수의 구성

신뢰도는 0-100% 사이의 값으로, 거래 신호의 확실성을 나타냅니다.

### 계산 구조
\`\`\`javascript
const ConfidenceStructure = {
  // 기본 구성 요소
  components: {
    technical: {
      weight: 0.40,  // 40%
      subComponents: {
        rsi: 0.15,
        macd: 0.20,
        bollinger: 0.15,
        ma: 0.20,
        volume: 0.15,
        pattern: 0.15
      }
    },
    
    ai: {
      weight: 0.30,  // 30%
      subComponents: {
        sentiment: 0.40,
        prediction: 0.30,
        reasoning: 0.30
      }
    },
    
    market: {
      weight: 0.20,  // 20%
      subComponents: {
        trend: 0.35,
        volatility: 0.25,
        correlation: 0.20,
        liquidity: 0.20
      }
    },
    
    historical: {
      weight: 0.10,  // 10%
      subComponents: {
        successRate: 0.50,
        recentPerformance: 0.30,
        patternMatch: 0.20
      }
    }
  }
};
\`\`\`

## 상세 계산 과정

### 1. 기술적 지표 신뢰도
\`\`\`javascript
class TechnicalConfidence {
  calculate(indicators) {
    const scores = {};
    
    // RSI 점수 계산
    scores.rsi = this.calculateRSIScore(indicators.rsi);
    
    // MACD 점수 계산
    scores.macd = this.calculateMACDScore(indicators.macd);
    
    // 볼린저밴드 점수 계산
    scores.bollinger = this.calculateBollingerScore(indicators.bollinger);
    
    // 이동평균 점수 계산
    scores.ma = this.calculateMAScore(indicators.ma);
    
    // 거래량 점수 계산
    scores.volume = this.calculateVolumeScore(indicators.volume);
    
    // 패턴 인식 점수
    scores.pattern = this.calculatePatternScore(indicators.pattern);
    
    // 가중 평균
    return this.weightedAverage(scores);
  }
  
  calculateRSIScore(rsi) {
    // RSI 극단값일수록 높은 점수
    if (rsi < 20) return 100;        // 극단적 과매도
    if (rsi < 30) return 80;         // 과매도
    if (rsi > 80) return 100;        // 극단적 과매수
    if (rsi > 70) return 80;         // 과매수
    
    // 중립 구간
    const distance = Math.abs(50 - rsi);
    return Math.max(0, 50 - distance);
  }
  
  calculateMACDScore(macd) {
    const { line, signal, histogram, trend } = macd;
    let score = 50; // 기본 점수
    
    // 크로스 발생
    if (Math.abs(histogram) < 0.001 && trend === 'converging') {
      score = 90;
    }
    
    // 강한 모멘텀
    else if (Math.abs(histogram) > 0.01) {
      score = 70 + Math.min(20, Math.abs(histogram) * 1000);
    }
    
    // 다이버전스
    if (macd.divergence) {
      score += 20;
    }
    
    return Math.min(100, score);
  }
  
  calculateBollingerScore(bollinger) {
    const { price, upper, middle, lower, bandwidth } = bollinger;
    let score = 50;
    
    // 밴드 터치/돌파
    if (price <= lower) {
      score = 90; // 하단 돌파
    } else if (price >= upper) {
      score = 90; // 상단 돌파
    }
    
    // 밴드 폭 고려
    if (bandwidth < 0.02) {
      score += 10; // 스퀴즈
    } else if (bandwidth > 0.10) {
      score -= 10; // 과도한 확장
    }
    
    // 중심선 대비 위치
    const position = (price - middle) / (upper - lower);
    if (Math.abs(position) > 0.8) {
      score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }
}
\`\`\`

### 2. AI 분석 신뢰도
\`\`\`javascript
class AIConfidence {
  calculate(aiAnalysis) {
    // Claude API 응답 파싱
    const sentiment = this.parseSentiment(aiAnalysis.sentiment);
    const prediction = this.parsePrediction(aiAnalysis.prediction);
    const reasoning = this.evaluateReasoning(aiAnalysis.reasoning);
    
    // AI 자체 신뢰도
    const aiSelfConfidence = aiAnalysis.confidence || 0.7;
    
    // 구성 요소별 점수
    const scores = {
      sentiment: sentiment.score * 100,
      prediction: prediction.score * 100,
      reasoning: reasoning.score * 100
    };
    
    // 일관성 체크
    const consistency = this.checkConsistency(sentiment, prediction, reasoning);
    
    // 최종 AI 신뢰도
    const baseScore = this.weightedAverage(scores);
    const finalScore = baseScore * aiSelfConfidence * consistency;
    
    return {
      score: finalScore,
      details: {
        sentiment: sentiment,
        prediction: prediction,
        reasoning: reasoning,
        consistency: consistency
      }
    };
  }
  
  parseSentiment(sentiment) {
    // -1 (매우 부정) ~ +1 (매우 긍정)
    const keywords = {
      bullish: ['bullish', '상승', '긍정적', '강세'],
      bearish: ['bearish', '하락', '부정적', '약세'],
      neutral: ['neutral', '중립', '횡보', '관망']
    };
    
    let score = 0.5; // 중립
    let direction = 'neutral';
    
    // 키워드 매칭
    for (const [key, words] of Object.entries(keywords)) {
      if (words.some(word => sentiment.toLowerCase().includes(word))) {
        direction = key;
        score = key === 'bullish' ? 0.8 : key === 'bearish' ? 0.2 : 0.5;
        break;
      }
    }
    
    return { score, direction, raw: sentiment };
  }
  
  evaluateReasoning(reasoning) {
    const qualityFactors = {
      hasData: reasoning.includes('데이터') || reasoning.includes('data'),
      hasLogic: reasoning.includes('따라서') || reasoning.includes('because'),
      hasSpecifics: /\d+%|\d+원|RSI|MACD/i.test(reasoning),
      hasWarnings: reasoning.includes('주의') || reasoning.includes('리스크'),
      length: reasoning.length > 100
    };
    
    let score = 0.5;
    
    // 각 요소별 점수 추가
    if (qualityFactors.hasData) score += 0.1;
    if (qualityFactors.hasLogic) score += 0.1;
    if (qualityFactors.hasSpecifics) score += 0.2;
    if (qualityFactors.hasWarnings) score += 0.05;
    if (qualityFactors.length) score += 0.05;
    
    return {
      score: Math.min(1, score),
      factors: qualityFactors
    };
  }
}
\`\`\`

### 3. 시장 상황 신뢰도
\`\`\`javascript
class MarketConfidence {
  calculate(marketData) {
    const scores = {};
    
    // 추세 점수
    scores.trend = this.calculateTrendScore(marketData.trend);
    
    // 변동성 점수
    scores.volatility = this.calculateVolatilityScore(marketData.volatility);
    
    // 상관관계 점수
    scores.correlation = this.calculateCorrelationScore(marketData.correlation);
    
    // 유동성 점수
    scores.liquidity = this.calculateLiquidityScore(marketData.liquidity);
    
    return this.weightedAverage(scores);
  }
  
  calculateTrendScore(trend) {
    const { direction, strength, duration } = trend;
    let score = 50;
    
    // 명확한 추세일수록 높은 점수
    if (strength > 0.7) {
      score = 80;
    } else if (strength > 0.5) {
      score = 70;
    }
    
    // 추세 지속 기간 보너스
    if (duration > 24) { // 24시간 이상
      score += 10;
    }
    
    // 추세 전환 시그널
    if (trend.reversal) {
      score += 15;
    }
    
    return Math.min(100, score);
  }
  
  calculateVolatilityScore(volatility) {
    // 적절한 변동성이 가장 좋음
    const optimal = 0.03; // 3%
    const difference = Math.abs(volatility - optimal);
    
    if (difference < 0.01) {
      return 90; // 최적 범위
    } else if (difference < 0.03) {
      return 70; // 양호
    } else if (difference < 0.05) {
      return 50; // 보통
    } else {
      return 30; // 위험
    }
  }
}
\`\`\`

### 4. 과거 성과 기반 신뢰도
\`\`\`javascript
class HistoricalConfidence {
  constructor() {
    this.tradeHistory = [];
    this.patternDatabase = new Map();
  }
  
  calculate(currentSignal, historicalData) {
    const scores = {};
    
    // 유사 상황 성공률
    scores.successRate = this.calculateSimilarSuccessRate(currentSignal);
    
    // 최근 성과
    scores.recentPerformance = this.calculateRecentPerformance();
    
    // 패턴 매칭
    scores.patternMatch = this.calculatePatternMatch(currentSignal);
    
    return this.weightedAverage(scores);
  }
  
  calculateSimilarSuccessRate(signal) {
    // 유사한 과거 거래 찾기
    const similarTrades = this.findSimilarTrades(signal, {
      rsiRange: 5,
      macdRange: 0.02,
      priceRange: 0.03,
      limit: 20
    });
    
    if (similarTrades.length < 5) {
      return 50; // 데이터 부족
    }
    
    // 성공률 계산
    const successful = similarTrades.filter(t => t.profit > 0).length;
    const successRate = (successful / similarTrades.length) * 100;
    
    // 신뢰도 조정
    let confidence = successRate;
    
    // 샘플 크기에 따른 조정
    if (similarTrades.length < 10) {
      confidence *= 0.8;
    }
    
    // 최근 거래 가중치
    const recentWeight = this.calculateRecencyWeight(similarTrades);
    confidence *= recentWeight;
    
    return confidence;
  }
  
  calculatePatternMatch(signal) {
    const patterns = [
      { name: 'double_bottom', score: 90 },
      { name: 'ascending_triangle', score: 85 },
      { name: 'bull_flag', score: 80 },
      { name: 'cup_and_handle', score: 85 },
      { name: 'golden_cross', score: 75 }
    ];
    
    let maxScore = 50; // 기본 점수
    
    for (const pattern of patterns) {
      if (this.matchesPattern(signal, pattern.name)) {
        maxScore = Math.max(maxScore, pattern.score);
      }
    }
    
    return maxScore;
  }
}
\`\`\`

## 최종 신뢰도 통합

### 종합 계산
\`\`\`javascript
class ConfidenceCalculator {
  constructor() {
    this.components = {
      technical: new TechnicalConfidence(),
      ai: new AIConfidence(),
      market: new MarketConfidence(),
      historical: new HistoricalConfidence()
    };
    
    this.weights = {
      technical: 0.40,
      ai: 0.30,
      market: 0.20,
      historical: 0.10
    };
  }
  
  async calculate(data) {
    const scores = {};
    
    // 각 구성 요소 계산
    scores.technical = await this.components.technical.calculate(data.indicators);
    scores.ai = await this.components.ai.calculate(data.aiAnalysis);
    scores.market = await this.components.market.calculate(data.marketData);
    scores.historical = await this.components.historical.calculate(data.signal, data.history);
    
    // 가중 평균
    let totalScore = 0;
    for (const [component, score] of Object.entries(scores)) {
      totalScore += score * this.weights[component];
    }
    
    // 보정 요소 적용
    const adjustedScore = this.applyAdjustments(totalScore, data);
    
    return {
      final: Math.round(adjustedScore),
      components: scores,
      adjustments: this.getAdjustmentDetails(),
      recommendation: this.getRecommendation(adjustedScore)
    };
  }
  
  applyAdjustments(baseScore, data) {
    let score = baseScore;
    
    // 시간대 조정
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) {
      score *= 0.9; // 새벽 시간 10% 감소
    }
    
    // 뉴스 영향
    if (data.newsImpact === 'negative') {
      score *= 0.8;
    } else if (data.newsImpact === 'positive') {
      score *= 1.1;
    }
    
    // 시장 전체 상황
    if (data.marketData.btcTrend === 'crash') {
      score *= 0.7;
    }
    
    // 연속 거래 페널티
    if (data.recentTrades > 3) {
      score *= 0.85;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  getRecommendation(score) {
    if (score >= 85) {
      return {
        action: 'STRONG_BUY',
        message: '강력 매수 추천',
        positionSize: 1.5
      };
    } else if (score >= 70) {
      return {
        action: 'BUY',
        message: '매수 추천',
        positionSize: 1.0
      };
    } else if (score >= 50) {
      return {
        action: 'HOLD',
        message: '관망 추천',
        positionSize: 0
      };
    } else {
      return {
        action: 'AVOID',
        message: '거래 회피',
        positionSize: 0
      };
    }
  }
}
\`\`\`

## 신뢰도 시각화

### 실시간 모니터링
\`\`\`javascript
class ConfidenceVisualizer {
  generateReport(confidence) {
    return {
      summary: \`
┌─────────────────────────────────────┐
│ 신뢰도 점수: \${confidence.final}% \${'█'.repeat(confidence.final / 5)}
├─────────────────────────────────────┤
│ 구성 요소별 점수:                   │
│ • 기술적 지표: \${confidence.components.technical.toFixed(1)}%
│ • AI 분석: \${confidence.components.ai.toFixed(1)}%
│ • 시장 상황: \${confidence.components.market.toFixed(1)}%
│ • 과거 성과: \${confidence.components.historical.toFixed(1)}%
├─────────────────────────────────────┤
│ 추천: \${confidence.recommendation.message}
└─────────────────────────────────────┘
      \`,
      
      details: this.generateDetailedBreakdown(confidence),
      
      chart: this.generateConfidenceChart(confidence)
    };
  }
}
\`\`\`

<div class="warning">
⚠️ **중요**: 신뢰도가 100%여도 손실 가능성은 있습니다. 항상 리스크 관리를 우선하세요.
</div>
    `,
  },
  'auto-trading.order-execution': {
    title: '주문 실행 과정',
    content: `
# 주문 실행 과정

## 주문 실행 플로우

### 전체 프로세스
\`\`\`javascript
class OrderExecutionFlow {
  async execute(decision) {
    try {
      // 1. 주문 전 검증
      const validation = await this.validateOrder(decision);
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }
      
      // 2. 주문 준비
      const orderParams = await this.prepareOrder(decision);
      
      // 3. 주문 실행
      const order = await this.placeOrder(orderParams);
      
      // 4. 체결 확인
      const result = await this.confirmExecution(order);
      
      // 5. 후처리
      await this.postProcess(result);
      
      return { success: true, result: result };
      
    } catch (error) {
      return await this.handleExecutionError(error);
    }
  }
}
\`\`\`

## 주문 전 검증

### 다단계 검증 시스템
\`\`\`javascript
class OrderValidator {
  async validateOrder(decision) {
    const checks = [];
    
    // 1. 잔액 확인
    checks.push(await this.checkBalance(decision));
    
    // 2. 포지션 한도 확인
    checks.push(await this.checkPositionLimits(decision));
    
    // 3. 주문 금액 확인
    checks.push(await this.checkOrderAmount(decision));
    
    // 4. 시장 상태 확인
    checks.push(await this.checkMarketStatus(decision));
    
    // 5. 리스크 확인
    checks.push(await this.checkRiskLimits(decision));
    
    // 6. 쿨다운 확인
    checks.push(await this.checkCooldown(decision));
    
    // 모든 검증 통과 확인
    const failed = checks.find(check => !check.valid);
    if (failed) {
      return {
        valid: false,
        reason: failed.reason,
        details: checks
      };
    }
    
    return { valid: true, checks: checks };
  }
  
  async checkBalance(decision) {
    const balance = await this.getBalance(decision.currency);
    const required = decision.amount * (1 + 0.001); // 수수료 포함
    
    if (decision.type === 'BUY') {
      if (balance.available < required) {
        return {
          valid: false,
          reason: \`잔액 부족: \${balance.available}원 < \${required}원\`
        };
      }
    } else { // SELL
      const coinBalance = await this.getCoinBalance(decision.coin);
      if (coinBalance.available < decision.quantity) {
        return {
          valid: false,
          reason: \`코인 부족: \${coinBalance.available} < \${decision.quantity}\`
        };
      }
    }
    
    return { valid: true, balance: balance };
  }
  
  async checkPositionLimits(decision) {
    const currentPositions = await this.getCurrentPositions();
    
    // 전체 포지션 수 확인
    if (currentPositions.length >= this.settings.maxPositions) {
      return {
        valid: false,
        reason: \`최대 포지션 수 초과: \${currentPositions.length}/\${this.settings.maxPositions}\`
      };
    }
    
    // 코인별 포지션 확인
    const coinPosition = currentPositions.find(p => p.coin === decision.coin);
    if (coinPosition) {
      const currentValue = coinPosition.quantity * coinPosition.currentPrice;
      const totalValue = currentValue + decision.amount;
      const totalBalance = await this.getTotalBalance();
      
      if (totalValue / totalBalance > this.settings.maxPerCoin) {
        return {
          valid: false,
          reason: \`코인별 최대 비중 초과: \${(totalValue / totalBalance * 100).toFixed(1)}%\`
        };
      }
    }
    
    return { valid: true };
  }
  
  async checkMarketStatus(decision) {
    const market = await this.getMarketInfo(decision.coin);
    
    // 거래 정지 확인
    if (market.state !== 'active') {
      return {
        valid: false,
        reason: \`거래 정지 상태: \${market.state}\`
      };
    }
    
    // 호가 스프레드 확인
    const spread = (market.ask - market.bid) / market.bid;
    if (spread > 0.02) { // 2% 이상
      return {
        valid: false,
        reason: \`비정상적 스프레드: \${(spread * 100).toFixed(2)}%\`
      };
    }
    
    // 유동성 확인
    if (market.volume24h < 1000000000) { // 10억원
      return {
        valid: false,
        reason: \`낮은 유동성: \${(market.volume24h / 100000000).toFixed(1)}억원\`
      };
    }
    
    return { valid: true, market: market };
  }
}
\`\`\`

## 주문 준비

### 주문 파라미터 생성
\`\`\`javascript
class OrderPreparer {
  async prepareOrder(decision) {
    const market = \`KRW-\${decision.coin}\`;
    const orderType = this.determineOrderType(decision);
    
    let orderParams = {
      market: market,
      side: decision.action.toLowerCase(), // 'bid' or 'ask'
      ord_type: orderType,
      identifier: this.generateOrderId()
    };
    
    // 주문 타입별 파라미터
    if (orderType === 'limit') {
      orderParams = await this.prepareLimitOrder(orderParams, decision);
    } else if (orderType === 'market') {
      orderParams = await this.prepareMarketOrder(orderParams, decision);
    } else if (orderType === 'price') {
      orderParams = await this.preparePriceOrder(orderParams, decision);
    }
    
    // 주문 사전 시뮬레이션
    const simulation = await this.simulateOrder(orderParams);
    if (!simulation.acceptable) {
      throw new Error(\`주문 시뮬레이션 실패: \${simulation.reason}\`);
    }
    
    return orderParams;
  }
  
  async prepareLimitOrder(params, decision) {
    const currentPrice = await this.getCurrentPrice(params.market);
    
    // 가격 결정 전략
    let price;
    if (params.side === 'bid') {
      // 매수: 현재가 대비 약간 높게
      price = currentPrice * 1.001;
    } else {
      // 매도: 현재가 대비 약간 낮게
      price = currentPrice * 0.999;
    }
    
    // 호가 단위 조정
    price = this.adjustPriceUnit(price);
    
    // 수량 계산
    const volume = params.side === 'bid' 
      ? decision.amount / price 
      : decision.quantity;
    
    return {
      ...params,
      price: price.toString(),
      volume: volume.toFixed(8)
    };
  }
  
  async prepareMarketOrder(params, decision) {
    if (params.side === 'bid') {
      // 시장가 매수: 주문 금액
      return {
        ...params,
        price: decision.amount.toString()
      };
    } else {
      // 시장가 매도: 주문 수량
      return {
        ...params,
        volume: decision.quantity.toFixed(8)
      };
    }
  }
  
  adjustPriceUnit(price) {
    // 업비트 호가 단위 규칙
    if (price >= 2000000) {
      return Math.round(price / 1000) * 1000;
    } else if (price >= 1000000) {
      return Math.round(price / 500) * 500;
    } else if (price >= 500000) {
      return Math.round(price / 100) * 100;
    } else if (price >= 100000) {
      return Math.round(price / 50) * 50;
    } else if (price >= 10000) {
      return Math.round(price / 10) * 10;
    } else if (price >= 1000) {
      return Math.round(price / 5) * 5;
    } else if (price >= 100) {
      return Math.round(price);
    } else if (price >= 10) {
      return Math.round(price * 10) / 10;
    } else {
      return Math.round(price * 100) / 100;
    }
  }
}
\`\`\`

## 주문 실행

### API 호출 및 에러 처리
\`\`\`javascript
class OrderExecutor {
  async placeOrder(orderParams) {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // API 호출 전 최종 확인
        await this.finalCheck(orderParams);
        
        // 주문 실행
        console.log(\`[주문 실행] 시도 \${attempt}/\${maxRetries}\`, orderParams);
        const response = await this.upbitAPI.placeOrder(orderParams);
        
        // 응답 검증
        if (response.uuid) {
          console.log(\`[주문 성공] UUID: \${response.uuid}\`);
          
          return {
            success: true,
            orderId: response.uuid,
            orderType: response.ord_type,
            price: response.price,
            volume: response.volume,
            timestamp: Date.now()
          };
        }
        
      } catch (error) {
        lastError = error;
        console.error(\`[주문 실패] 시도 \${attempt}: \${error.message}\`);
        
        // 재시도 가능한 에러인지 확인
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // 재시도 전 대기
        await this.sleep(1000 * attempt);
      }
    }
    
    throw new Error(\`주문 실행 실패 (\${maxRetries}회 시도): \${lastError.message}\`);
  }
  
  isRetryableError(error) {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'RATE_LIMIT'
    ];
    
    return retryableCodes.includes(error.code) || 
           error.message.includes('일시적');
  }
  
  async finalCheck(orderParams) {
    // 현재가 재확인
    const currentPrice = await this.getCurrentPrice(orderParams.market);
    
    // 가격 급변동 체크 (지정가 주문인 경우)
    if (orderParams.price && orderParams.ord_type === 'limit') {
      const orderPrice = parseFloat(orderParams.price);
      const priceChange = Math.abs(orderPrice - currentPrice) / currentPrice;
      
      if (priceChange > 0.03) { // 3% 이상 변동
        throw new Error(\`가격 급변동: \${(priceChange * 100).toFixed(1)}%\`);
      }
    }
  }
}
\`\`\`

## 체결 확인

### 주문 상태 추적
\`\`\`javascript
class ExecutionConfirmer {
  async confirmExecution(order) {
    const startTime = Date.now();
    const timeout = 30000; // 30초
    const checkInterval = 1000; // 1초
    
    while (Date.now() - startTime < timeout) {
      try {
        // 주문 상태 조회
        const orderStatus = await this.getOrderStatus(order.orderId);
        
        console.log(\`[체결 확인] 상태: \${orderStatus.state}, 체결량: \${orderStatus.executed_volume}\`);
        
        // 체결 완료
        if (orderStatus.state === 'done') {
          return {
            success: true,
            orderId: order.orderId,
            executedPrice: parseFloat(orderStatus.avg_price),
            executedVolume: parseFloat(orderStatus.executed_volume),
            fee: parseFloat(orderStatus.paid_fee),
            executionTime: Date.now() - startTime
          };
        }
        
        // 부분 체결
        if (orderStatus.state === 'wait' && parseFloat(orderStatus.executed_volume) > 0) {
          console.log(\`[부분 체결] \${orderStatus.executed_volume}/\${orderStatus.volume}\`);
        }
        
        // 주문 취소됨
        if (orderStatus.state === 'cancel') {
          return {
            success: false,
            reason: '주문 취소됨',
            executedVolume: parseFloat(orderStatus.executed_volume)
          };
        }
        
      } catch (error) {
        console.error(\`[체결 확인 오류] \${error.message}\`);
      }
      
      await this.sleep(checkInterval);
    }
    
    // 타임아웃 - 미체결 주문 처리
    return await this.handleUnfilledOrder(order);
  }
  
  async handleUnfilledOrder(order) {
    console.log(\`[미체결 처리] 주문 ID: \${order.orderId}\`);
    
    // 현재 주문 상태 확인
    const currentStatus = await this.getOrderStatus(order.orderId);
    
    // 부분 체결 확인
    if (parseFloat(currentStatus.executed_volume) > 0) {
      // 부분 체결된 경우 나머지 취소
      await this.cancelOrder(order.orderId);
      
      return {
        success: true,
        partial: true,
        executedVolume: parseFloat(currentStatus.executed_volume),
        remainingVolume: parseFloat(currentStatus.remaining_volume)
      };
    }
    
    // 전체 미체결 - 시장가로 재주문 여부 결정
    const decision = await this.decideReorder(order, currentStatus);
    
    if (decision.reorder) {
      // 기존 주문 취소
      await this.cancelOrder(order.orderId);
      
      // 시장가로 재주문
      return await this.reorderAsMarket(order);
    }
    
    // 주문 유지
    return {
      success: false,
      pending: true,
      orderId: order.orderId,
      message: '주문 대기 중'
    };
  }
}
\`\`\`

## 후처리

### 거래 완료 후 작업
\`\`\`javascript
class PostProcessor {
  async postProcess(result) {
    const tasks = [];
    
    // 1. 포지션 업데이트
    tasks.push(this.updatePosition(result));
    
    // 2. 거래 기록 저장
    tasks.push(this.saveTrade(result));
    
    // 3. 성과 통계 업데이트
    tasks.push(this.updateStatistics(result));
    
    // 4. 알림 발송
    tasks.push(this.sendNotification(result));
    
    // 5. 쿨다운 설정
    tasks.push(this.setCooldown(result));
    
    // 6. 학습 데이터 기록
    tasks.push(this.recordForLearning(result));
    
    // 병렬 처리
    await Promise.all(tasks);
    
    // 후속 액션 스케줄링
    await this.scheduleFollowUp(result);
  }
  
  async updatePosition(result) {
    if (result.side === 'bid') {
      // 매수 포지션 추가/업데이트
      await this.positionManager.addPosition({
        coin: result.coin,
        quantity: result.executedVolume,
        avgPrice: result.executedPrice,
        entryTime: Date.now()
      });
    } else {
      // 매도 포지션 감소/제거
      await this.positionManager.reducePosition({
        coin: result.coin,
        quantity: result.executedVolume,
        exitPrice: result.executedPrice,
        exitTime: Date.now()
      });
    }
  }
  
  async scheduleFollowUp(result) {
    if (result.side === 'bid') {
      // 매수 후 모니터링 스케줄
      this.scheduler.add({
        type: 'MONITOR_POSITION',
        coin: result.coin,
        interval: 60000, // 1분마다
        actions: ['CHECK_STOP_LOSS', 'CHECK_TAKE_PROFIT', 'UPDATE_TRAILING']
      });
    } else if (result.side === 'ask' && result.partial) {
      // 부분 매도 후 잔여 포지션 관리
      this.scheduler.add({
        type: 'MANAGE_REMAINING',
        coin: result.coin,
        checkAfter: 300000 // 5분 후
      });
    }
  }
}
\`\`\`

## 특수 상황 처리

### 슬리피지 대응
\`\`\`javascript
class SlippageHandler {
  async handleSlippage(order, market) {
    const acceptableSlippage = 0.01; // 1%
    
    // 예상 가격과 실제 체결가 비교
    const slippage = Math.abs(order.expectedPrice - order.executedPrice) / order.expectedPrice;
    
    if (slippage > acceptableSlippage) {
      console.warn(\`[슬리피지 경고] \${(slippage * 100).toFixed(2)}%\`);
      
      // 슬리피지가 크면 추가 분석
      const analysis = await this.analyzeSlippage(order, market);
      
      if (analysis.abnormal) {
        // 비정상적 슬리피지 - 거래 중단 고려
        await this.alertAbnormalSlippage(analysis);
      }
    }
    
    return {
      slippage: slippage,
      acceptable: slippage <= acceptableSlippage
    };
  }
}
\`\`\`

<div class="warning">
⚠️ **중요**: 주문 실행 중 네트워크 오류나 API 장애가 발생할 수 있습니다. 항상 주문 상태를 확인하세요.
</div>
    `,
  },
  'auto-trading.real-example': {
    title: '실제 거래 예시',
    content: `
# 실제 거래 예시

## 성공적인 거래 사례

### 사례 1: BTC 스윙 트레이딩
\`\`\`
상황: 2024년 1월 15일 오후 3시
초기 자본: 10,000,000원
분석 대상: BTC (비트코인)

[14:59:00] 분석 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시장 데이터:
• 현재가: 52,345,000원
• 24시간 변동: -3.2%
• 거래량: 일평균 대비 1.8배
• RSI: 28 (과매도)
• MACD: 골든크로스 임박

[14:59:15] 기술적 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
지표별 신호:
• RSI: 매수 신호 (강도: 85/100)
• MACD: 매수 준비 (강도: 70/100)
• 볼린저밴드: 하단 터치 (강도: 90/100)
• 이동평균선: 200MA 지지 확인
• 거래량: 매집 패턴 감지

[14:59:30] AI 분석 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claude: "현재 BTC는 과매도 구간에서 강한 지지선을
터치했습니다. 거래량 증가와 함께 반등 가능성이
높습니다. 단, 52,000,000원 저항선 주의 필요."

AI 신뢰도: 82%
예상 방향: 상승
목표가: 54,500,000원 (+4.1%)

[14:59:45] 종합 신뢰도 계산
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 기술적 지표: 81%
• AI 분석: 82%
• 시장 상황: 75%
• 과거 패턴: 78%

최종 신뢰도: 79% ✓

[15:00:00] 매수 결정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
결정: 매수 실행
금액: 1,000,000원 (총 자본의 10%)
주문 유형: 지정가
주문 가격: 52,350,000원

[15:00:05] 주문 실행
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
주문 ID: 8a7b6c5d-4e3f-2a1b
상태: 체결 완료
체결가: 52,350,000원
수량: 0.01908307 BTC
수수료: 500원

[15:00:10] 포지션 설정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
손절가: 49,732,500원 (-5%)
목표가: 54,500,000원 (+4.1%)
트레일링 스탑: 3% 수익 후 활성화

[이후 진행 상황]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15:30 - 가격 상승 시작 (52,800,000원)
16:45 - 53,500,000원 돌파
18:20 - 트레일링 스탑 활성화
20:15 - 최고가 54,650,000원 기록
20:45 - 트레일링 스탑 체결 (54,100,000원)

[거래 결과]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
매수가: 52,350,000원
매도가: 54,100,000원
수익률: +3.34%
순수익: 33,400원
거래 시간: 5시간 45분
\`\`\`

### 사례 2: 알트코인 단타 매매
\`\`\`javascript
// 실제 거래 로그
const trade = {
  coin: "ADA",
  date: "2024-01-20",
  timeline: [
    {
      time: "09:15:00",
      event: "신호 감지",
      data: {
        price: 680,
        rsi: 25,
        volume_spike: 3.2,
        ai_sentiment: "극도의 공포 → 기회"
      }
    },
    {
      time: "09:15:30",
      event: "매수 실행",
      data: {
        confidence: 85,
        amount: 500000,
        quantity: 735.29,
        order_type: "market"
      }
    },
    {
      time: "09:45:00",
      event: "1차 목표 도달",
      data: {
        price: 714,
        profit_rate: 0.05,
        action: "부분 매도 30%"
      }
    },
    {
      time: "10:30:00",
      event: "추가 상승",
      data: {
        price: 731,
        trailing_stop_activated: true,
        distance: 0.03
      }
    },
    {
      time: "11:15:00",
      event: "전량 청산",
      data: {
        exit_price: 725,
        total_profit_rate: 0.066,
        reason: "트레일링 스탑"
      }
    }
  ],
  
  summary: {
    duration: "2시간",
    profit: 33000,
    strategy: "단기 반등",
    key_factors: ["극도의 과매도", "거래량 폭증", "AI 긍정 전환"]
  }
};
\`\`\`

## 실패 사례와 교훈

### 사례 3: 손절 실행
\`\`\`
[실패 거래 분석]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
코인: XRP
일시: 2024-01-22 14:30

[거래 시작]
• 매수 신호: RSI 35, MACD 크로스
• 신뢰도: 72%
• 매수가: 850원
• 투자금: 1,000,000원

[문제 발생]
14:45 - SEC 소송 관련 부정적 뉴스
15:00 - 가격 급락 시작
15:15 - 830원 (-2.4%)
15:30 - 810원 (-4.7%)

[손절 실행]
15:31 - 자동 손절 발동
• 손절가: 807원 (-5%)
• 손실액: -50,000원

[사후 분석]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 뉴스 리스크 미고려
   → 해결: 뉴스 모니터링 강화

2. 손절 설정이 적절했음
   → 이후 750원까지 추가 하락

3. 기술적 신호는 정확했으나 외부 요인
   → 교훈: 펀더멘털 리스크 항상 고려

[개선 사항]
• 주요 이벤트 캘린더 체크
• 뉴스 감성 분석 가중치 상향
• 변동성 높은 시간대 거래 자제
\`\`\`

## 다양한 시장 상황별 실전

### 횡보장 대응
\`\`\`javascript
// 박스권 거래 전략 실행
const sidewaysMarketTrade = {
  market_condition: "횡보장 3일째",
  strategy: "박스권 상하단 매매",
  
  setup: {
    box_top: 45500,
    box_bottom: 44000,
    confidence_threshold: 75  // 평소보다 높게
  },
  
  execution: [
    {
      date: "2024-01-25",
      action: "매수",
      price: 44050,
      reason: "박스 하단 터치 + RSI 28"
    },
    {
      date: "2024-01-25",
      action: "매도",
      price: 45400,
      reason: "박스 상단 근접 + RSI 72",
      profit: "+3.06%"
    },
    {
      date: "2024-01-26",
      action: "매수",
      price: 44100,
      reason: "박스 하단 재터치"
    },
    {
      date: "2024-01-26",
      action: "매도",
      price: 45350,
      reason: "목표가 도달",
      profit: "+2.84%"
    }
  ],
  
  total_result: {
    trades: 2,
    avg_profit: "+2.95%",
    success_rate: "100%"
  }
};
\`\`\`

### 급등장 대응
\`\`\`javascript
// 모멘텀 추종 전략
const bullRunTrade = async function() {
  console.log("[급등장 감지] BTC 5% 급등");
  
  // 1단계: 추격 매수 여부 판단
  const momentum = await analyzeMomentum();
  if (momentum.strength < 0.8) {
    console.log("모멘텀 부족 - 관망");
    return;
  }
  
  // 2단계: 분할 매수 실행
  const entries = [
    { ratio: 0.3, price: 55000000, time: "10:00" },
    { ratio: 0.4, price: 55500000, time: "10:30" },
    { ratio: 0.3, price: 56000000, time: "11:00" }
  ];
  
  // 3단계: 트레일링 스탑 설정
  const trailingStop = {
    activation: 0.05,  // 5% 수익 시
    distance: 0.02,    // 2% 간격
    tightening: true   // 수익 증가 시 간격 축소
  };
  
  // 4단계: 부분 익절
  const exits = [
    { ratio: 0.3, target: 0.08 },  // 8% 수익 시 30%
    { ratio: 0.3, target: 0.12 },  // 12% 수익 시 30%
    { ratio: 0.4, trailing: true } // 나머지는 트레일링
  ];
  
  return {
    strategy: "momentum_following",
    risk: "managed",
    expected_return: "8-15%"
  };
};
\`\`\`

## 실시간 의사결정 과정

### 복잡한 상황에서의 판단
\`\`\`
[2024-01-28 16:45:00]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

상황: ETH 분석 중 상충되는 신호 발생

긍정 신호:
• RSI 과매도 (26)
• 일봉 지지선 터치
• 거래량 증가

부정 신호:
• MACD 데드크로스
• BTC 하락 중 (-2%)
• 4시간봉 하락 추세

[AI 분석]
"단기적으로는 반등 가능하나, 중기 추세는
여전히 약세입니다. BTC 연동성이 높아
추가 하락 위험이 있습니다."

[신뢰도 계산]
• 기술적: 65% (상충)
• AI: 60% (신중)
• 시장: 55% (약세)
• 과거: 70% (유사 패턴 존재)

종합: 62% (임계값 70% 미달)

[최종 결정]
행동: 관망
이유: 신뢰도 부족, 리스크 > 기회
대안: BTC 방향성 확정 후 재평가

[1시간 후]
BTC 추가 하락 → ETH 동반 하락
결정이 옳았음 확인 ✓
\`\`\`

## 월간 성과 요약

### 2024년 1월 실적
\`\`\`javascript
const monthlyPerformance = {
  period: "2024-01",
  initial_capital: 10000000,
  final_capital: 10875000,
  
  summary: {
    total_return: "8.75%",
    total_trades: 47,
    winning_trades: 31,
    losing_trades: 16,
    win_rate: "65.96%",
    
    avg_profit: "4.2%",
    avg_loss: "2.8%",
    profit_factor: 1.5,
    
    max_win: "12.3% (SOL)",
    max_loss: "5.0% (XRP)",
    max_drawdown: "3.2%",
    
    sharpe_ratio: 2.1,
    sortino_ratio: 3.4
  },
  
  by_coin: {
    BTC: { trades: 12, profit: "+3.2%" },
    ETH: { trades: 8, profit: "+2.1%" },
    ADA: { trades: 10, profit: "+1.8%" },
    SOL: { trades: 7, profit: "+2.5%" },
    XRP: { trades: 10, profit: "-0.85%" }
  },
  
  by_strategy: {
    trend_following: { usage: "40%", return: "+4.1%" },
    mean_reversion: { usage: "35%", return: "+3.2%" },
    scalping: { usage: "25%", return: "+1.45%" }
  },
  
  lessons_learned: [
    "뉴스 리스크 관리 강화 필요",
    "손절 규칙 준수가 큰 손실 방지",
    "AI 분석 신뢰도 70% 이상에서 높은 성공률",
    "시장 상황별 전략 구분이 효과적"
  ]
};
\`\`\`

<div class="success">
✅ **핵심 성공 요인**: 일관된 규칙 준수, 감정 배제, 리스크 관리, 지속적 학습
</div>

<div class="info">
💡 **팁**: 모든 거래를 기록하고 분석하세요. 실패에서 배우는 것이 성공의 지름길입니다.
</div>
    `,
  },
};