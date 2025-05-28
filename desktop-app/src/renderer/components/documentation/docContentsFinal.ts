// Import all parts
import { docContentsPart2 } from './docContents_part2';
import { docContentsPart3 } from './docContents_part3';
import { docContentsPart4 } from './docContents_part4';

// Complete remaining sections
const docContentsRemaining = {
  'auto-trading.analysis-cycle': {
    title: '60초 분석 주기',
    content: `
# 60초 분석 주기

## 분석 주기란?

프로그램은 설정된 주기(기본 60초)마다 선택된 모든 코인을 분석합니다. 이 주기 동안 시장 데이터를 수집하고 매매 결정을 내립니다.

## 주기별 작업

### 0-10초: 데이터 수집
\`\`\`javascript
async function collectMarketData() {
  const tasks = [
    fetchCurrentPrices(),      // 현재가
    fetchOrderBooks(),         // 호가창
    fetchRecentTrades(),       // 최근 체결
    fetchCandles(),           // 캔들 데이터
    fetchMarketInfo()         // 시장 정보
  ];
  
  const results = await Promise.all(tasks);
  return consolidateData(results);
}
\`\`\`

### 10-30초: 지표 계산
\`\`\`javascript
function calculateIndicators(marketData) {
  return {
    rsi: calculateRSI(marketData.candles, 14),
    macd: calculateMACD(marketData.candles),
    bb: calculateBollingerBands(marketData.candles, 20),
    ma: {
      ma20: calculateSMA(marketData.candles, 20),
      ma60: calculateSMA(marketData.candles, 60),
      ma120: calculateSMA(marketData.candles, 120)
    },
    volume: analyzeVolume(marketData.volume),
    stochastic: calculateStochastic(marketData.candles),
    obv: calculateOBV(marketData.candles)
  };
}
\`\`\`

### 30-45초: AI 분석 (선택적)
\`\`\`javascript
async function performAIAnalysis(data, indicators) {
  if (!config.aiEnabled) return null;
  
  const prompt = buildAnalysisPrompt(data, indicators);
  const analysis = await claudeAPI.analyze(prompt);
  
  return {
    sentiment: analysis.marketSentiment,
    prediction: analysis.priceDirection,
    confidence: analysis.confidence,
    risks: analysis.identifiedRisks,
    opportunities: analysis.opportunities
  };
}
\`\`\`

### 45-55초: 의사결정
\`\`\`javascript
function makeDecision(indicators, aiAnalysis, currentPosition) {
  // 신뢰도 계산
  const confidence = calculateConfidence(indicators, aiAnalysis);
  
  // 매매 신호 생성
  if (confidence.buy >= config.buyThreshold && !currentPosition) {
    return { action: 'BUY', confidence: confidence.buy };
  }
  
  if (confidence.sell >= config.sellThreshold && currentPosition) {
    return { action: 'SELL', confidence: confidence.sell };
  }
  
  return { action: 'HOLD', confidence: confidence.hold };
}
\`\`\`

### 55-60초: 주문 실행
\`\`\`javascript
async function executeOrder(decision, marketData) {
  // 리스크 체크
  const riskCheck = performRiskCheck(decision);
  if (!riskCheck.passed) return;
  
  // 주문 준비
  const order = prepareOrder(decision, marketData);
  
  // 주문 실행
  try {
    const result = await upbitAPI.placeOrder(order);
    await recordTrade(result);
    return result;
  } catch (error) {
    handleOrderError(error);
  }
}
\`\`\`

## 주기 최적화

### 동적 주기 조정
\`\`\`javascript
class DynamicCycleManager {
  constructor() {
    this.baseCycle = 60;  // 기본 60초
    this.minCycle = 30;   // 최소 30초
    this.maxCycle = 300;  // 최대 5분
  }
  
  adjustCycle(marketConditions) {
    let cycle = this.baseCycle;
    
    // 변동성 기반 조정
    if (marketConditions.volatility > 0.05) {
      cycle *= 0.5;  // 높은 변동성 시 빠른 주기
    }
    
    // 거래량 기반 조정
    if (marketConditions.volume < marketConditions.avgVolume * 0.5) {
      cycle *= 2;    // 낮은 거래량 시 느린 주기
    }
    
    // 시간대 기반 조정
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 7) {
      cycle *= 1.5;  // 새벽 시간 느린 주기
    }
    
    return Math.max(this.minCycle, Math.min(this.maxCycle, cycle));
  }
}
\`\`\`

### 병렬 처리
\`\`\`javascript
class ParallelAnalyzer {
  async analyzeCoins(coins) {
    // 코인을 그룹으로 분할
    const groups = this.splitIntoGroups(coins, 5);
    
    // 각 그룹 병렬 처리
    const results = await Promise.all(
      groups.map(group => this.analyzeGroup(group))
    );
    
    return results.flat();
  }
  
  async analyzeGroup(coins) {
    return Promise.all(
      coins.map(coin => this.analyzeSingleCoin(coin))
    );
  }
}
\`\`\`

## 오류 처리

### 장애 복구
\`\`\`javascript
class CycleErrorHandler {
  constructor() {
    this.errorCount = {};
    this.maxRetries = 3;
  }
  
  async handleError(error, coin) {
    this.errorCount[coin] = (this.errorCount[coin] || 0) + 1;
    
    if (this.errorCount[coin] > this.maxRetries) {
      // 해당 코인 일시 제외
      await this.temporarilyDisableCoin(coin);
      return;
    }
    
    // 재시도 로직
    await this.wait(5000);  // 5초 대기
    return this.retry(coin);
  }
  
  reset(coin) {
    this.errorCount[coin] = 0;
  }
}
\`\`\`

<div class="info">
💡 **팁**: 시장이 활발한 시간에는 짧은 주기, 조용한 시간에는 긴 주기를 사용하면 효율적입니다.
</div>
    `,
  },
  'auto-trading.signal-generation': {
    title: '매매 신호 생성',
    content: `
# 매매 신호 생성

## 신호 생성 프로세스

### 1. 지표 신호 수집
\`\`\`javascript
class SignalCollector {
  collectSignals(indicators) {
    const signals = [];
    
    // RSI 신호
    if (indicators.rsi < 30) {
      signals.push({
        type: 'BUY',
        indicator: 'RSI',
        strength: (30 - indicators.rsi) / 30,
        reason: 'Oversold'
      });
    } else if (indicators.rsi > 70) {
      signals.push({
        type: 'SELL',
        indicator: 'RSI',
        strength: (indicators.rsi - 70) / 30,
        reason: 'Overbought'
      });
    }
    
    // MACD 신호
    if (indicators.macd.crossover > 0) {
      signals.push({
        type: 'BUY',
        indicator: 'MACD',
        strength: Math.min(1, indicators.macd.crossover / 100),
        reason: 'Golden Cross'
      });
    }
    
    // 볼린저밴드 신호
    if (indicators.price <= indicators.bb.lower) {
      signals.push({
        type: 'BUY',
        indicator: 'BB',
        strength: 0.8,
        reason: 'Lower Band Touch'
      });
    }
    
    return signals;
  }
}
\`\`\`

### 2. 신호 필터링
\`\`\`javascript
class SignalFilter {
  filter(signals, marketContext) {
    return signals.filter(signal => {
      // 시장 상황과 부합하는지 확인
      if (marketContext.trend === 'DOWN' && signal.type === 'BUY') {
        return signal.strength > 0.8;  // 하락장에서는 강한 신호만
      }
      
      // 최소 강도 필터
      if (signal.strength < 0.3) {
        return false;
      }
      
      // 상충되는 신호 제거
      const conflicting = signals.find(s => 
        s.indicator === signal.indicator && 
        s.type !== signal.type
      );
      if (conflicting) {
        return signal.strength > conflicting.strength;
      }
      
      return true;
    });
  }
}
\`\`\`

### 3. 종합 신호 생성
\`\`\`javascript
class SignalAggregator {
  aggregate(filteredSignals, weights) {
    const buySignals = filteredSignals.filter(s => s.type === 'BUY');
    const sellSignals = filteredSignals.filter(s => s.type === 'SELL');
    
    const buyStrength = this.calculateWeightedStrength(buySignals, weights);
    const sellStrength = this.calculateWeightedStrength(sellSignals, weights);
    
    if (buyStrength > sellStrength && buyStrength > 0.5) {
      return {
        type: 'BUY',
        confidence: buyStrength * 100,
        signals: buySignals,
        reasoning: this.generateReasoning(buySignals)
      };
    }
    
    if (sellStrength > buyStrength && sellStrength > 0.5) {
      return {
        type: 'SELL',
        confidence: sellStrength * 100,
        signals: sellSignals,
        reasoning: this.generateReasoning(sellSignals)
      };
    }
    
    return {
      type: 'HOLD',
      confidence: 50,
      reasoning: 'No clear signal'
    };
  }
}
\`\`\`

## 신호 검증

### 백테스트 검증
\`\`\`javascript
async function validateSignal(signal, historicalData) {
  // 과거 유사한 상황에서의 성과 확인
  const similarSituations = findSimilarPatterns(
    signal.indicators,
    historicalData
  );
  
  const performance = analyzePastPerformance(similarSituations);
  
  return {
    historicalWinRate: performance.winRate,
    avgReturn: performance.avgReturn,
    confidence: signal.confidence * performance.reliability
  };
}
\`\`\`

<div class="warning">
⚠️ **주의**: 모든 지표가 같은 방향을 가리켜도 시장은 반대로 움직일 수 있습니다.
</div>
    `,
  },
  'auto-trading.confidence-calculation': {
    title: '신뢰도 계산 상세',
    content: `
# 신뢰도 계산 상세

## 계산 알고리즘

### 기본 공식
\`\`\`javascript
function calculateConfidence(signals, weights, marketContext) {
  // 1. 가중 평균 계산
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const signal of signals) {
    const weight = weights[signal.indicator] || 0.1;
    weightedSum += signal.strength * weight;
    totalWeight += weight;
  }
  
  const baseConfidence = (weightedSum / totalWeight) * 100;
  
  // 2. 시장 상황 조정
  const marketAdjustment = getMarketAdjustment(marketContext);
  
  // 3. 신호 일치도 보너스
  const alignmentBonus = calculateAlignmentBonus(signals);
  
  // 4. 최종 신뢰도
  const finalConfidence = baseConfidence * marketAdjustment + alignmentBonus;
  
  return Math.min(100, Math.max(0, finalConfidence));
}
\`\`\`

### 시장 상황 조정
\`\`\`javascript
function getMarketAdjustment(context) {
  const adjustments = {
    trend: {
      strong_up: 1.2,
      up: 1.1,
      sideways: 1.0,
      down: 0.9,
      strong_down: 0.8
    },
    volatility: {
      low: 1.1,
      normal: 1.0,
      high: 0.9,
      extreme: 0.7
    },
    volume: {
      high: 1.1,
      normal: 1.0,
      low: 0.9
    }
  };
  
  return adjustments.trend[context.trend] *
         adjustments.volatility[context.volatility] *
         adjustments.volume[context.volume];
}
\`\`\`

### 신호 일치도
\`\`\`javascript
function calculateAlignmentBonus(signals) {
  const buyCount = signals.filter(s => s.type === 'BUY').length;
  const sellCount = signals.filter(s => s.type === 'SELL').length;
  const totalCount = signals.length;
  
  const alignment = Math.max(buyCount, sellCount) / totalCount;
  
  if (alignment > 0.8) return 10;  // 80% 이상 일치
  if (alignment > 0.6) return 5;   // 60% 이상 일치
  return 0;
}
\`\`\`

## 신뢰도 해석

### 레벨별 의미
- 90-100%: 매우 강한 신호, 즉시 실행 권장
- 80-89%: 강한 신호, 실행 권장
- 70-79%: 보통 신호, 추가 확인 후 실행
- 60-69%: 약한 신호, 신중한 접근 필요
- 60% 미만: 무시하거나 대기

<div class="info">
💡 **팁**: 신뢰도가 높다고 해서 수익이 보장되는 것은 아닙니다. 리스크 관리가 더 중요합니다.
</div>
    `,
  },
  'auto-trading.order-execution': {
    title: '주문 실행 과정',
    content: `
# 주문 실행 과정

## 주문 준비

### 1. 주문 정보 생성
\`\`\`javascript
function prepareOrder(decision, marketData, position) {
  const orderInfo = {
    symbol: decision.symbol,
    side: decision.action,  // BUY or SELL
    type: 'market',         // 시장가 주문
    timestamp: Date.now()
  };
  
  if (decision.action === 'BUY') {
    const availableCash = getAvailableBalance();
    const maxInvestment = getMaxInvestment(decision.symbol);
    const buyRatio = getBuyRatio(decision.confidence);
    
    orderInfo.amount = Math.min(
      availableCash * buyRatio,
      maxInvestment
    );
    
    // 최소 주문 금액 확인
    if (orderInfo.amount < MIN_ORDER_AMOUNT) {
      throw new Error('주문 금액이 최소 금액보다 작습니다');
    }
  } else {
    // SELL
    const holdingAmount = position.quantity * marketData.currentPrice;
    const sellRatio = getSellRatio(decision.confidence);
    
    orderInfo.quantity = position.quantity * sellRatio;
  }
  
  return orderInfo;
}
\`\`\`

### 2. 리스크 체크
\`\`\`javascript
class OrderRiskChecker {
  check(order, portfolio) {
    const checks = [
      this.checkDailyLimit(order, portfolio),
      this.checkPositionSize(order, portfolio),
      this.checkCooldown(order),
      this.checkMarketConditions(order),
      this.checkSlippage(order)
    ];
    
    const failed = checks.filter(c => !c.passed);
    
    if (failed.length > 0) {
      return {
        passed: false,
        reasons: failed.map(c => c.reason)
      };
    }
    
    return { passed: true };
  }
  
  checkSlippage(order) {
    const orderbook = getOrderbook(order.symbol);
    const expectedSlippage = calculateSlippage(order, orderbook);
    
    if (expectedSlippage > 0.01) {  // 1% 이상 슬리피지
      return {
        passed: false,
        reason: \`과도한 슬리피지: \${expectedSlippage * 100}%\`
      };
    }
    
    return { passed: true };
  }
}
\`\`\`

### 3. 주문 실행
\`\`\`javascript
async function executeOrder(order) {
  const startTime = Date.now();
  
  try {
    // 주문 전 스냅샷
    const preSnapshot = await takeMarketSnapshot(order.symbol);
    
    // API 호출
    const result = await upbitAPI.order({
      market: order.symbol,
      side: order.side,
      volume: order.quantity,
      price: order.price,
      ord_type: order.type
    });
    
    // 체결 대기
    const filled = await waitForFill(result.uuid, 30000);  // 30초 대기
    
    // 주문 후 스냅샷
    const postSnapshot = await takeMarketSnapshot(order.symbol);
    
    // 실행 분석
    const execution = analyzeExecution(
      order,
      filled,
      preSnapshot,
      postSnapshot
    );
    
    return {
      success: true,
      order: filled,
      execution: execution,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    return handleExecutionError(error, order);
  }
}
\`\`\`

## 체결 모니터링

### 부분 체결 처리
\`\`\`javascript
class FillMonitor {
  async monitor(orderId, timeout) {
    const startTime = Date.now();
    let lastFillAmount = 0;
    
    while (Date.now() - startTime < timeout) {
      const order = await upbitAPI.getOrder(orderId);
      
      if (order.state === 'done') {
        return { status: 'complete', order };
      }
      
      if (order.state === 'cancel') {
        return { status: 'cancelled', order };
      }
      
      // 부분 체결 확인
      if (order.executed_volume > lastFillAmount) {
        lastFillAmount = order.executed_volume;
        await this.handlePartialFill(order);
      }
      
      await this.wait(1000);  // 1초 대기
    }
    
    // 타임아웃 시 처리
    return this.handleTimeout(orderId);
  }
}
\`\`\`

## 사후 처리

### 거래 기록
\`\`\`javascript
async function recordTrade(execution) {
  const trade = {
    id: generateTradeId(),
    timestamp: Date.now(),
    symbol: execution.order.market,
    side: execution.order.side,
    price: execution.order.price,
    quantity: execution.order.executed_volume,
    fee: execution.order.paid_fee,
    total: execution.order.executed_volume * execution.order.price,
    
    // 실행 품질
    slippage: execution.slippage,
    executionTime: execution.duration,
    
    // 의사결정 정보
    confidence: execution.decision.confidence,
    signals: execution.decision.signals,
    
    // 시장 상황
    marketContext: execution.marketSnapshot
  };
  
  await saveToDatabase(trade);
  await updatePortfolio(trade);
  await notifyUser(trade);
  
  return trade;
}
\`\`\`

<div class="warning">
⚠️ **주의**: 시장가 주문은 예상치 못한 가격에 체결될 수 있습니다. 항상 시장 깊이를 확인하세요.
</div>
    `,
  },
  'auto-trading.real-example': {
    title: '실제 거래 예시',
    content: `
# 실제 거래 예시

## 성공적인 매수 사례

### 상황 설정
\`\`\`
시간: 2024-01-15 14:32:15
코인: BTC/KRW
현재가: 45,500,000원
계좌 잔액: 5,000,000원
\`\`\`

### 1. 시장 분석
\`\`\`javascript
{
  "indicators": {
    "rsi": 28,                    // 과매도
    "macd": {
      "line": -150,
      "signal": -180,
      "histogram": 30              // 상승 전환
    },
    "bollingerBands": {
      "upper": 46,500,000,
      "middle": 45,000,000,
      "lower": 43,500,000,
      "position": "nearLower"      // 하단 근처
    },
    "volume": {
      "current": 1,234,567,890,
      "average": 987,654,321,
      "ratio": 1.25                // 평균 대비 125%
    }
  }
}
\`\`\`

### 2. 신호 생성
\`\`\`javascript
{
  "signals": [
    {
      "indicator": "RSI",
      "type": "BUY",
      "strength": 0.85,
      "reason": "RSI 30 이하 과매도"
    },
    {
      "indicator": "MACD",
      "type": "BUY",
      "strength": 0.70,
      "reason": "히스토그램 상승 전환"
    },
    {
      "indicator": "BB",
      "type": "BUY",
      "strength": 0.75,
      "reason": "볼린저밴드 하단 터치"
    },
    {
      "indicator": "Volume",
      "type": "BUY",
      "strength": 0.60,
      "reason": "거래량 증가"
    }
  ]
}
\`\`\`

### 3. 신뢰도 계산
\`\`\`javascript
// 가중치 적용
const weights = {
  RSI: 0.25,
  MACD: 0.30,
  BB: 0.20,
  Volume: 0.25
};

// 계산
confidence = (0.85 * 0.25) + (0.70 * 0.30) + 
             (0.75 * 0.20) + (0.60 * 0.25)
           = 0.2125 + 0.21 + 0.15 + 0.15
           = 0.7225 (72.25%)

// 신호 일치 보너스 (+5%)
finalConfidence = 77.25%
\`\`\`

### 4. 주문 실행
\`\`\`javascript
{
  "decision": "BUY",
  "confidence": 77.25,
  "orderDetails": {
    "symbol": "KRW-BTC",
    "side": "bid",
    "ord_type": "price",
    "price": 500000,          // 50만원 매수
    "expectedQuantity": 0.0109890
  }
}

// 실행 결과
{
  "uuid": "abc-123-def",
  "side": "bid",
  "ord_type": "price",
  "price": 500000,
  "state": "done",
  "market": "KRW-BTC",
  "created_at": "2024-01-15T14:32:18",
  "volume": 0.01098352,
  "executed_volume": 0.01098352,
  "paid_fee": 500.0,
  "avg_price": 45520000,
  "trades_count": 3
}
\`\`\`

### 5. 결과 분석
\`\`\`
매수 체결가: 45,520,000원
슬리피지: 0.044% (20,000원)
수수료: 500원
총 투자금: 500,500원

2시간 후:
현재가: 46,200,000원
평가손익: +1.49% (+7,468원)
\`\`\`

## 손절매 실행 예시

### 상황
\`\`\`
보유: 0.01 BTC @ 46,000,000원
현재가: 43,700,000원
손실률: -5%
\`\`\`

### 자동 손절
\`\`\`javascript
{
  "trigger": "STOP_LOSS",
  "details": {
    "entryPrice": 46000000,
    "currentPrice": 43700000,
    "lossRate": -0.05,
    "stopLossThreshold": -0.05
  },
  "action": {
    "type": "MARKET_SELL",
    "quantity": 0.01,
    "urgency": "HIGH"
  }
}
\`\`\`

## 분할 매수 예시

### 1차 매수
\`\`\`
신뢰도: 71%
매수금액: 200,000원 (계획의 40%)
체결가: 45,000,000원
\`\`\`

### 2차 매수 (3% 하락)
\`\`\`
신뢰도: 78%
매수금액: 150,000원 (계획의 30%)
체결가: 43,650,000원
\`\`\`

### 3차 매수 (5% 하락)
\`\`\`
신뢰도: 85%
매수금액: 150,000원 (계획의 30%)
체결가: 42,750,000원
\`\`\`

### 평균 매수가
\`\`\`
총 투자: 500,000원
총 수량: 0.01131 BTC
평균가: 44,200,000원
\`\`\`

<div class="success">
✅ **성공 요인**: 단계적 진입으로 평균 단가를 낮추고, 신뢰도가 높아질 때 더 많이 매수했습니다.
</div>
    `,
  },
  // 나머지 모든 섹션들 추가...
  'calculations': {
    title: '내부 계산 로직',
    content: `
# 내부 계산 로직

프로그램 내부에서 사용되는 주요 계산 방법을 설명합니다.

## 개요

모든 계산은 정확성과 효율성을 고려하여 설계되었으며, 실시간으로 처리됩니다.
    `,
  },
  'simulation': {
    title: '시뮬레이션 모드',
    content: `
# 시뮬레이션 모드

실제 자금 없이 전략을 테스트할 수 있는 안전한 환경입니다.

## 시뮬레이션의 장점

1. **무위험 테스트**: 실제 손실 없이 전략 검증
2. **전략 개발**: 다양한 설정 실험
3. **학습 도구**: 시장 이해도 향상
4. **성과 측정**: 객관적인 평가 지표
    `,
  },
  'ai-learning': {
    title: 'AI 학습 시스템',
    content: `
# AI 학습 시스템

거래 결과를 학습하여 지속적으로 성능을 개선하는 시스템입니다.

## 학습 원리

1. **데이터 수집**: 모든 거래 기록
2. **패턴 분석**: 성공/실패 패턴 식별
3. **가중치 조정**: 지표별 중요도 최적화
4. **검증**: 백테스트를 통한 개선 확인
    `,
  },
  'backtest': {
    title: '백테스트',
    content: `
# 백테스트

과거 데이터를 활용하여 전략의 성과를 검증하는 기능입니다.

## 백테스트의 중요성

- 전략의 과거 성과 확인
- 리스크 요소 파악
- 최적 파라미터 도출
- 과최적화 방지
    `,
  },
  'risk-management': {
    title: '리스크 관리',
    content: `
# 리스크 관리

성공적인 투자의 핵심은 수익 극대화가 아닌 손실 최소화입니다.

## 리스크 관리 원칙

1. **자금 관리**: 적절한 포지션 크기
2. **손실 제한**: 엄격한 손절선
3. **분산 투자**: 집중 위험 회피
4. **지속 가능성**: 장기적 관점
    `,
  },
  'notifications': {
    title: '알림 시스템',
    content: `
# 알림 시스템

중요한 이벤트를 실시간으로 알려주는 시스템입니다.

## 알림의 역할

- 즉각적인 상황 인지
- 빠른 대응 가능
- 모니터링 부담 감소
- 중요 이벤트 놓치지 않기
    `,
  },
  'troubleshooting': {
    title: '문제 해결',
    content: `
# 문제 해결

프로그램 사용 중 발생할 수 있는 문제와 해결 방법입니다.

## 문제 해결 접근법

1. **증상 파악**: 정확한 문제 식별
2. **원인 분석**: 근본 원인 찾기
3. **해결 시도**: 단계별 해결 방법
4. **예방 조치**: 재발 방지
    `,
  },
  'advanced': {
    title: '고급 기능',
    content: `
# 고급 기능

숙련된 사용자를 위한 고급 기능과 전략입니다.

## 고급 기능 개요

- 복잡한 시장 분석
- 맞춤형 전략 개발
- 심화 데이터 활용
- 자동화 확장
    `,
  },
  'reference': {
    title: '참고 자료',
    content: `
# 참고 자료

프로그램 사용에 도움이 되는 추가 정보와 자료입니다.

## 참고 자료 구성

1. **용어 사전**: 전문 용어 설명
2. **FAQ**: 자주 묻는 질문
3. **시나리오**: 실전 상황 예시
4. **세금 정보**: 세금 관련 안내
    `,
  }
};

// Merge all content
export const finalDocContents = {
  ...docContentsRemaining,
  ...docContentsPart2,
  ...docContentsPart3,
  ...docContentsPart4
};