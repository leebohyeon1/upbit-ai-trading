// Simulation 섹션들
export const simulationContents = {
  'simulation': {
    title: '시뮬레이션 모드',
    content: `
# 시뮬레이션 모드

## 시뮬레이션의 중요성

실제 돈을 투자하기 전에 전략을 충분히 검증하는 것은 필수입니다. 시뮬레이션 모드는 실제 시장 데이터를 사용하면서도 가상의 자금으로 거래하는 안전한 환경을 제공합니다.

### 시뮬레이션 vs 실거래
\`\`\`
시뮬레이션 모드:
✅ 실시간 시장 데이터
✅ 동일한 거래 로직
✅ 가상 자금 사용
✅ 무제한 테스트
❌ 실제 수익 없음
❌ 심리적 압박 없음

실거래 모드:
✅ 실제 수익 가능
✅ 진짜 시장 경험
❌ 손실 위험
❌ 심리적 부담
❌ 실수 시 복구 불가
\`\`\`

### 시뮬레이션 활용 단계
1. **전략 개발**: 새로운 아이디어 테스트
2. **파라미터 조정**: 최적값 찾기
3. **리스크 평가**: 최대 손실 확인
4. **심리 훈련**: 거래 습관 형성
5. **전환 준비**: 실거래 준비도 평가

<div class="info">
💡 **권장**: 최소 1개월 이상 시뮬레이션에서 안정적인 수익을 낸 후 실거래를 시작하세요.
</div>
    `,
  },
  'simulation.simulation-overview': {
    title: '시뮬레이션 개요',
    content: `
# 시뮬레이션 개요

## 시뮬레이션 작동 방식

### 시스템 구조
\`\`\`javascript
class SimulationEngine {
  constructor(initialCapital = 10000000) {
    this.mode = 'SIMULATION';
    this.virtualAccount = {
      balance: initialCapital,
      holdings: {},
      trades: [],
      startTime: Date.now()
    };
    
    this.realMarketData = true;  // 실제 시장 데이터 사용
    this.orderExecution = 'instant';  // 즉시 체결 가정
  }
  
  async executeOrder(order) {
    // 실제 API 호출 대신 가상 실행
    if (this.validateOrder(order)) {
      const execution = this.simulateExecution(order);
      this.updateVirtualAccount(execution);
      return execution;
    }
    
    throw new Error('주문 검증 실패');
  }
}
\`\`\`

### 주요 특징

#### 1. 실시간 데이터
\`\`\`javascript
// 실제 시장 데이터 스트림
const marketData = {
  source: 'Upbit WebSocket',
  latency: '<100ms',
  updates: 'tick-by-tick',
  
  data: {
    price: realtime,
    volume: realtime,
    orderbook: realtime,
    trades: realtime
  }
};
\`\`\`

#### 2. 가상 주문 처리
\`\`\`javascript
function simulateExecution(order) {
  const currentPrice = getCurrentPrice(order.symbol);
  
  // 슬리피지 시뮬레이션 (0.1%)
  const slippage = order.side === 'BUY' ? 1.001 : 0.999;
  const executionPrice = currentPrice * slippage;
  
  // 수수료 계산 (0.05%)
  const fee = order.amount * 0.0005;
  
  return {
    orderId: generateVirtualOrderId(),
    symbol: order.symbol,
    side: order.side,
    price: executionPrice,
    quantity: order.quantity,
    fee: fee,
    timestamp: Date.now(),
    status: 'FILLED'
  };
}
\`\`\`

## 시뮬레이션 설정

### 초기 설정
\`\`\`javascript
const simulationConfig = {
  // 계좌 설정
  account: {
    initialBalance: 10000000,  // 1천만원
    currency: 'KRW',
    marginEnabled: false       // 레버리지 비활성화
  },
  
  // 거래 설정
  trading: {
    fees: {
      maker: 0.0005,  // 0.05%
      taker: 0.0005   // 0.05%
    },
    slippage: {
      market: 0.001,  // 0.1%
      limit: 0        // 지정가는 슬리피지 없음
    },
    minOrderSize: 5000  // 최소 주문 5천원
  },
  
  // 시뮬레이션 옵션
  simulation: {
    speed: 1.0,        // 1배속 (실시간)
    fillProbability: 1.0,  // 100% 체결
    partialFills: false,   // 부분 체결 비활성화
    latency: 50           // 50ms 지연
  }
};
\`\`\`

### 고급 옵션
\`\`\`javascript
// 현실적인 시뮬레이션
const realisticMode = {
  // 호가창 영향
  orderBookImpact: true,
  impactModel: {
    small: 0,      // 10만원 이하: 영향 없음
    medium: 0.001, // 100만원: 0.1% 영향
    large: 0.005   // 1000만원: 0.5% 영향
  },
  
  // 부분 체결
  partialFills: {
    enabled: true,
    probability: 0.3,  // 30% 확률로 부분 체결
    minFillRatio: 0.5  // 최소 50% 체결
  },
  
  // 거래 실패
  orderFailures: {
    enabled: true,
    networkError: 0.001,    // 0.1% 네트워크 오류
    insufficientBalance: true,
    priceMovement: true     // 급격한 가격 변동 시 실패
  }
};
\`\`\`

## 성과 추적

### 실시간 통계
\`\`\`javascript
class PerformanceTracker {
  constructor() {
    this.metrics = {
      totalReturn: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalTrades: 0,
      profitableTrades: 0
    };
    
    this.updateInterval = 1000;  // 1초마다 업데이트
  }
  
  track(trade) {
    this.addTrade(trade);
    this.updateMetrics();
    this.checkMilestones();
  }
  
  updateMetrics() {
    this.metrics.totalReturn = this.calculateTotalReturn();
    this.metrics.winRate = this.profitableTrades / this.totalTrades;
    this.metrics.sharpeRatio = this.calculateSharpeRatio();
    this.metrics.maxDrawdown = this.calculateMaxDrawdown();
  }
  
  checkMilestones() {
    const milestones = [
      { trades: 10, message: "첫 10회 거래 완료!" },
      { return: 0.05, message: "5% 수익 달성!" },
      { winRate: 0.6, message: "60% 승률 달성!" }
    ];
    
    // 마일스톤 알림
    milestones.forEach(milestone => {
      if (this.checkMilestone(milestone)) {
        this.notify(milestone.message);
      }
    });
  }
}
\`\`\`

### 일일 리포트
\`\`\`
=== 시뮬레이션 일일 리포트 ===
날짜: 2024-01-15

[계좌 현황]
시작 잔고: ₩10,000,000
현재 잔고: ₩10,534,567
총 수익률: +5.35%

[거래 통계]
총 거래: 24회
매수: 12회 / 매도: 12회
승률: 66.7% (8승 4패)
평균 수익: +3.2%
평균 손실: -1.8%

[보유 포지션]
BTC: 0.05 (₩2,615,000)
ETH: 1.2 (₩4,147,000)
현금: ₩3,772,567

[최고/최저]
최고 잔고: ₩10,623,000
최대 낙폭: -2.3%
최대 연승: 5회
\`\`\`

## 시뮬레이션 전략

### 1. 점진적 테스트
\`\`\`
1주차: 단일 코인 (BTC)
- 기본 전략 테스트
- 파라미터 민감도 분석

2주차: 2-3개 코인
- 포트폴리오 관리
- 상관관계 분석

3주차: 5개 코인
- 분산 투자 효과
- 리밸런싱 테스트

4주차: 전체 전략
- 모든 기능 활성화
- 실전 준비
\`\`\`

### 2. A/B 테스트
\`\`\`javascript
// 두 가지 전략 동시 실행
const strategyA = {
  name: "Conservative",
  config: {
    buyThreshold: 80,
    stopLoss: 0.03,
    positionSize: 0.05
  }
};

const strategyB = {
  name: "Aggressive",
  config: {
    buyThreshold: 65,
    stopLoss: 0.05,
    positionSize: 0.10
  }
};

// 성과 비교
function compareStrategies(periodDays = 30) {
  const resultsA = runSimulation(strategyA, periodDays);
  const resultsB = runSimulation(strategyB, periodDays);
  
  return {
    winner: resultsA.totalReturn > resultsB.totalReturn ? 'A' : 'B',
    comparison: {
      returnDiff: Math.abs(resultsA.totalReturn - resultsB.totalReturn),
      riskDiff: Math.abs(resultsA.maxDrawdown - resultsB.maxDrawdown),
      tradesDiff: Math.abs(resultsA.totalTrades - resultsB.totalTrades)
    }
  };
}
\`\`\`

## 시뮬레이션 함정

### 주의사항
\`\`\`
1. 과적합 (Overfitting)
   - 문제: 시뮬레이션에만 최적화
   - 해결: 다양한 기간 테스트

2. 심리적 요인 무시
   - 문제: 실제 돈의 압박감 없음
   - 해결: 가상으로라도 진지하게

3. 완벽한 체결 가정
   - 문제: 항상 원하는 가격에 체결
   - 해결: 현실적 시뮬레이션 옵션

4. 시장 영향 무시
   - 문제: 대량 주문의 가격 영향
   - 해결: 주문 크기 제한
\`\`\`

<div class="success">
✅ **팁**: 시뮬레이션에서 3개월 연속 수익을 내면 실거래 준비가 된 것입니다.
</div>

<div class="warning">
⚠️ **주의**: 시뮬레이션 성과가 실거래를 보장하지 않습니다. 항상 보수적으로 접근하세요.
</div>
    `,
  },
  'simulation.virtual-portfolio': {
    title: '가상 포트폴리오',
    content: `
# 가상 포트폴리오

## 포트폴리오 구성

### 초기 설정
\`\`\`javascript
class VirtualPortfolio {
  constructor(initialBalance = 10000000) {
    this.cash = initialBalance;
    this.holdings = new Map();
    this.transactions = [];
    this.startTime = Date.now();
    this.startBalance = initialBalance;
    
    // 성과 추적
    this.performance = {
      peakValue: initialBalance,
      currentDrawdown: 0,
      realizedPnL: 0,
      unrealizedPnL: 0
    };
  }
  
  // 현재 포트폴리오 가치
  getTotalValue() {
    let totalValue = this.cash;
    
    for (const [symbol, position] of this.holdings) {
      const currentPrice = this.getCurrentPrice(symbol);
      totalValue += position.quantity * currentPrice;
    }
    
    return totalValue;
  }
  
  // 포지션 추가/업데이트
  addPosition(symbol, quantity, price) {
    if (!this.holdings.has(symbol)) {
      this.holdings.set(symbol, {
        quantity: 0,
        totalCost: 0,
        avgPrice: 0,
        trades: []
      });
    }
    
    const position = this.holdings.get(symbol);
    position.totalCost += quantity * price;
    position.quantity += quantity;
    position.avgPrice = position.totalCost / position.quantity;
    position.trades.push({
      date: new Date(),
      quantity: quantity,
      price: price,
      type: 'BUY'
    });
  }
}
\`\`\`

### 포트폴리오 상태
\`\`\`javascript
// 실시간 포트폴리오 스냅샷
function getPortfolioSnapshot(portfolio) {
  const totalValue = portfolio.getTotalValue();
  const holdings = [];
  
  for (const [symbol, position] of portfolio.holdings) {
    const currentPrice = getCurrentPrice(symbol);
    const currentValue = position.quantity * currentPrice;
    const unrealizedPnL = (currentPrice - position.avgPrice) * position.quantity;
    const unrealizedReturn = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
    
    holdings.push({
      symbol: symbol,
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      currentPrice: currentPrice,
      currentValue: currentValue,
      unrealizedPnL: unrealizedPnL,
      unrealizedReturn: unrealizedReturn,
      weight: (currentValue / totalValue) * 100
    });
  }
  
  return {
    totalValue: totalValue,
    cash: portfolio.cash,
    cashWeight: (portfolio.cash / totalValue) * 100,
    holdings: holdings,
    totalReturn: ((totalValue - portfolio.startBalance) / portfolio.startBalance) * 100,
    drawdown: portfolio.performance.currentDrawdown
  };
}
\`\`\`

## 거래 실행

### 매수 프로세스
\`\`\`javascript
async function executeBuyOrder(portfolio, order) {
  // 1. 주문 검증
  if (order.amount > portfolio.cash) {
    throw new Error('잔고 부족');
  }
  
  // 2. 시장가 시뮬레이션
  const marketPrice = await getMarketPrice(order.symbol);
  const slippage = calculateSlippage(order.amount);
  const executionPrice = marketPrice * (1 + slippage);
  
  // 3. 수수료 계산
  const fee = order.amount * 0.0005;
  const netAmount = order.amount - fee;
  const quantity = netAmount / executionPrice;
  
  // 4. 포트폴리오 업데이트
  portfolio.cash -= order.amount;
  portfolio.addPosition(order.symbol, quantity, executionPrice);
  
  // 5. 거래 기록
  const transaction = {
    id: generateTransactionId(),
    type: 'BUY',
    symbol: order.symbol,
    quantity: quantity,
    price: executionPrice,
    amount: order.amount,
    fee: fee,
    timestamp: Date.now()
  };
  
  portfolio.transactions.push(transaction);
  
  return transaction;
}
\`\`\`

### 매도 프로세스
\`\`\`javascript
async function executeSellOrder(portfolio, order) {
  const position = portfolio.holdings.get(order.symbol);
  
  // 1. 보유량 확인
  if (!position || position.quantity < order.quantity) {
    throw new Error('보유량 부족');
  }
  
  // 2. 시장가 시뮬레이션
  const marketPrice = await getMarketPrice(order.symbol);
  const slippage = calculateSlippage(order.quantity * marketPrice);
  const executionPrice = marketPrice * (1 - slippage);
  
  // 3. 수익 계산
  const proceeds = order.quantity * executionPrice;
  const fee = proceeds * 0.0005;
  const netProceeds = proceeds - fee;
  
  const costBasis = position.avgPrice * order.quantity;
  const realizedPnL = netProceeds - costBasis;
  
  // 4. 포트폴리오 업데이트
  portfolio.cash += netProceeds;
  position.quantity -= order.quantity;
  
  if (position.quantity === 0) {
    portfolio.holdings.delete(order.symbol);
  } else {
    // 평균 단가 유지
    position.totalCost = position.avgPrice * position.quantity;
  }
  
  // 5. 실현 손익 업데이트
  portfolio.performance.realizedPnL += realizedPnL;
  
  return {
    id: generateTransactionId(),
    type: 'SELL',
    realizedPnL: realizedPnL,
    returnRate: (realizedPnL / costBasis) * 100
  };
}
\`\`\`

## 성과 분석

### 수익률 계산
\`\`\`javascript
class PortfolioAnalytics {
  constructor(portfolio) {
    this.portfolio = portfolio;
    this.dailyReturns = [];
    this.equityCurve = [];
  }
  
  calculateMetrics() {
    const currentValue = this.portfolio.getTotalValue();
    const totalReturn = (currentValue - this.portfolio.startBalance) / this.portfolio.startBalance;
    
    // 일별 수익률
    this.updateDailyReturns();
    
    // 변동성 (연율화)
    const volatility = this.calculateVolatility() * Math.sqrt(252);
    
    // 샤프 비율 (무위험 수익률 2%)
    const sharpeRatio = (totalReturn - 0.02) / volatility;
    
    // 최대 낙폭
    const maxDrawdown = this.calculateMaxDrawdown();
    
    // 승률
    const winRate = this.calculateWinRate();
    
    return {
      totalReturn: totalReturn * 100,
      annualizedReturn: this.annualizeReturn(totalReturn),
      volatility: volatility * 100,
      sharpeRatio: sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      winRate: winRate * 100,
      totalTrades: this.portfolio.transactions.length,
      avgTradeReturn: this.calculateAvgTradeReturn()
    };
  }
  
  calculateVolatility() {
    if (this.dailyReturns.length < 2) return 0;
    
    const avg = this.dailyReturns.reduce((a, b) => a + b) / this.dailyReturns.length;
    const variance = this.dailyReturns.reduce((sum, ret) => {
      return sum + Math.pow(ret - avg, 2);
    }, 0) / this.dailyReturns.length;
    
    return Math.sqrt(variance);
  }
}
\`\`\`

### 리스크 분석
\`\`\`javascript
function analyzeRisk(portfolio) {
  const positions = Array.from(portfolio.holdings.entries());
  const totalValue = portfolio.getTotalValue();
  
  // 집중도 리스크
  const concentration = positions.map(([symbol, pos]) => {
    const value = pos.quantity * getCurrentPrice(symbol);
    return {
      symbol: symbol,
      weight: (value / totalValue) * 100
    };
  }).sort((a, b) => b.weight - a.weight);
  
  const top3Weight = concentration.slice(0, 3)
    .reduce((sum, pos) => sum + pos.weight, 0);
  
  // 상관관계 리스크
  const correlationMatrix = calculateCorrelationMatrix(positions);
  const avgCorrelation = calculateAvgCorrelation(correlationMatrix);
  
  // VaR (Value at Risk) - 95% 신뢰구간
  const portfolioReturns = getHistoricalReturns(portfolio);
  const var95 = calculateVaR(portfolioReturns, 0.95);
  
  return {
    concentrationRisk: {
      level: top3Weight > 70 ? 'HIGH' : top3Weight > 50 ? 'MEDIUM' : 'LOW',
      top3Weight: top3Weight,
      largestPosition: concentration[0]
    },
    correlationRisk: {
      level: avgCorrelation > 0.7 ? 'HIGH' : avgCorrelation > 0.5 ? 'MEDIUM' : 'LOW',
      avgCorrelation: avgCorrelation
    },
    valueAtRisk: {
      var95: var95,
      interpretation: \`95% 확률로 일일 손실이 \${Math.abs(var95)}% 이하\`
    }
  };
}
\`\`\`

## 포트폴리오 최적화

### 리밸런싱
\`\`\`javascript
class PortfolioRebalancer {
  constructor(targetWeights) {
    this.targetWeights = targetWeights;  // { 'BTC': 0.4, 'ETH': 0.3, ... }
  }
  
  calculateRebalancingOrders(portfolio) {
    const currentSnapshot = getPortfolioSnapshot(portfolio);
    const totalValue = currentSnapshot.totalValue;
    const orders = [];
    
    // 목표 금액 계산
    for (const [symbol, targetWeight] of Object.entries(this.targetWeights)) {
      const targetValue = totalValue * targetWeight;
      const currentPosition = portfolio.holdings.get(symbol);
      const currentValue = currentPosition 
        ? currentPosition.quantity * getCurrentPrice(symbol) 
        : 0;
      
      const difference = targetValue - currentValue;
      
      if (Math.abs(difference) > 10000) {  // 1만원 이상 차이
        orders.push({
          symbol: symbol,
          side: difference > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(difference),
          reason: 'rebalancing'
        });
      }
    }
    
    return this.optimizeOrders(orders, portfolio.cash);
  }
  
  optimizeOrders(orders, availableCash) {
    // 매도 먼저 실행하여 현금 확보
    const sellOrders = orders.filter(o => o.side === 'SELL');
    const buyOrders = orders.filter(o => o.side === 'BUY');
    
    return [...sellOrders, ...buyOrders];
  }
}
\`\`\`

### 시뮬레이션 실험
\`\`\`javascript
// 다양한 포트폴리오 전략 테스트
async function experimentPortfolioStrategies() {
  const strategies = [
    {
      name: "Equal Weight",
      weights: { BTC: 0.2, ETH: 0.2, XRP: 0.2, ADA: 0.2, DOT: 0.2 }
    },
    {
      name: "Market Cap Weighted",
      weights: { BTC: 0.5, ETH: 0.3, XRP: 0.1, ADA: 0.05, DOT: 0.05 }
    },
    {
      name: "Risk Parity",
      weights: calculateRiskParityWeights(['BTC', 'ETH', 'XRP', 'ADA', 'DOT'])
    }
  ];
  
  const results = [];
  
  for (const strategy of strategies) {
    const portfolio = new VirtualPortfolio(10000000);
    const rebalancer = new PortfolioRebalancer(strategy.weights);
    
    // 3개월 시뮬레이션
    const result = await runPortfolioSimulation(portfolio, rebalancer, 90);
    
    results.push({
      strategy: strategy.name,
      totalReturn: result.totalReturn,
      sharpeRatio: result.sharpeRatio,
      maxDrawdown: result.maxDrawdown
    });
  }
  
  return results.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
}
\`\`\`

<div class="info">
💡 **팁**: 가상 포트폴리오에서도 실제처럼 분산 투자와 리스크 관리를 실천하세요.
</div>

<div class="success">
✅ **체크포인트**: 가상 포트폴리오에서 3개월간 안정적인 수익을 내면 다음 단계로 진행하세요.
</div>
    `,
  },
  'simulation.result-analysis': {
    title: '결과 분석 방법',
    content: `
# 시뮬레이션 결과 분석 방법

## 핵심 성과 지표 (KPI)

### 수익성 지표
\`\`\`javascript
class ProfitabilityMetrics {
  calculate(trades, portfolio) {
    return {
      // 총 수익률
      totalReturn: this.calculateTotalReturn(portfolio),
      
      // 연환산 수익률
      annualizedReturn: this.calculateAnnualizedReturn(portfolio),
      
      // 월평균 수익률
      monthlyAvgReturn: this.calculateMonthlyAverage(trades),
      
      // 최고/최저 수익
      bestTrade: this.findBestTrade(trades),
      worstTrade: this.findWorstTrade(trades),
      
      // 수익 분포
      profitDistribution: this.analyzeProfitDistribution(trades)
    };
  }
  
  analyzeProfitDistribution(trades) {
    const profits = trades.map(t => t.returnRate);
    
    return {
      mean: average(profits),
      median: median(profits),
      stdDev: standardDeviation(profits),
      skewness: skewness(profits),
      kurtosis: kurtosis(profits),
      percentiles: {
        p10: percentile(profits, 0.1),
        p25: percentile(profits, 0.25),
        p50: percentile(profits, 0.5),
        p75: percentile(profits, 0.75),
        p90: percentile(profits, 0.9)
      }
    };
  }
}
\`\`\`

### 리스크 지표
\`\`\`javascript
class RiskMetrics {
  calculate(returns, trades) {
    return {
      // 변동성 (연율화)
      volatility: this.calculateVolatility(returns) * Math.sqrt(252),
      
      // 최대 낙폭
      maxDrawdown: this.calculateMaxDrawdown(returns),
      
      // 평균 낙폭
      avgDrawdown: this.calculateAvgDrawdown(returns),
      
      // 낙폭 지속 기간
      maxDrawdownDuration: this.calculateDrawdownDuration(returns),
      
      // 하방 변동성
      downsideDeviation: this.calculateDownsideDeviation(returns),
      
      // VaR (95% 신뢰구간)
      valueAtRisk: this.calculateVaR(returns, 0.95),
      
      // CVaR (Conditional VaR)
      conditionalVaR: this.calculateCVaR(returns, 0.95)
    };
  }
  
  calculateDrawdownDuration(equityCurve) {
    let maxDuration = 0;
    let currentDuration = 0;
    let peak = equityCurve[0];
    
    for (const point of equityCurve) {
      if (point.value >= peak.value) {
        peak = point;
        maxDuration = Math.max(maxDuration, currentDuration);
        currentDuration = 0;
      } else {
        currentDuration++;
      }
    }
    
    return maxDuration;
  }
}
\`\`\`

### 효율성 지표
\`\`\`javascript
class EfficiencyMetrics {
  calculate(portfolio, trades) {
    const returns = this.getDailyReturns(portfolio);
    const riskFreeRate = 0.02; // 연 2%
    
    return {
      // 샤프 비율
      sharpeRatio: this.calculateSharpe(returns, riskFreeRate),
      
      // 소르티노 비율 (하방 리스크만 고려)
      sortinoRatio: this.calculateSortino(returns, riskFreeRate),
      
      // 칼마 비율 (수익/최대낙폭)
      calmarRatio: this.calculateCalmar(returns),
      
      // 정보 비율 (vs 벤치마크)
      informationRatio: this.calculateIR(returns, 'BTC'),
      
      // 트레이드 효율성
      winRate: this.calculateWinRate(trades),
      profitFactor: this.calculateProfitFactor(trades),
      expectancy: this.calculateExpectancy(trades)
    };
  }
  
  calculateSortino(returns, riskFreeRate) {
    const excessReturns = returns.map(r => r - riskFreeRate/252);
    const avgExcessReturn = average(excessReturns);
    
    // 음수 수익률만 사용
    const negativeReturns = excessReturns.filter(r => r < 0);
    const downsideDeviation = standardDeviation(negativeReturns);
    
    return avgExcessReturn / downsideDeviation * Math.sqrt(252);
  }
}
\`\`\`

## 상세 분석 도구

### 거래 패턴 분석
\`\`\`javascript
function analyzeTradePatterns(trades) {
  return {
    // 시간대별 분석
    timeAnalysis: analyzeByTimeOfDay(trades),
    
    // 요일별 분석
    dayOfWeekAnalysis: analyzeByDayOfWeek(trades),
    
    // 보유 기간 분석
    holdingPeriodAnalysis: analyzeHoldingPeriods(trades),
    
    // 연속 승/패 분석
    streakAnalysis: analyzeWinLossStreaks(trades),
    
    // 코인별 성과
    symbolAnalysis: analyzeBySymbol(trades)
  };
}

function analyzeByTimeOfDay(trades) {
  const hourlyStats = {};
  
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats[hour] = {
      count: 0,
      totalReturn: 0,
      wins: 0
    };
  }
  
  trades.forEach(trade => {
    const hour = new Date(trade.timestamp).getHours();
    hourlyStats[hour].count++;
    hourlyStats[hour].totalReturn += trade.returnRate;
    if (trade.returnRate > 0) hourlyStats[hour].wins++;
  });
  
  // 최적 거래 시간 찾기
  let bestHour = 0;
  let bestAvgReturn = 0;
  
  for (const [hour, stats] of Object.entries(hourlyStats)) {
    if (stats.count > 0) {
      const avgReturn = stats.totalReturn / stats.count;
      if (avgReturn > bestAvgReturn) {
        bestAvgReturn = avgReturn;
        bestHour = hour;
      }
    }
  }
  
  return {
    hourlyStats,
    bestTradingHour: bestHour,
    bestHourAvgReturn: bestAvgReturn
  };
}
\`\`\`

### 시각화 데이터 준비
\`\`\`javascript
class ChartDataPreparer {
  prepareEquityCurve(portfolio) {
    const curve = [];
    let cumulativeReturn = 0;
    
    portfolio.transactions.forEach((tx, index) => {
      const value = this.calculatePortfolioValue(portfolio, tx.timestamp);
      cumulativeReturn = (value - portfolio.startBalance) / portfolio.startBalance;
      
      curve.push({
        x: new Date(tx.timestamp),
        y: value,
        return: cumulativeReturn * 100,
        drawdown: this.calculateDrawdownAtPoint(value, curve)
      });
    });
    
    return curve;
  }
  
  prepareReturnDistribution(trades) {
    const returns = trades.map(t => t.returnRate);
    const bins = this.createHistogramBins(returns, 20);
    
    return {
      histogram: bins,
      normalCurve: this.generateNormalCurve(returns),
      statistics: {
        mean: average(returns),
        median: median(returns),
        mode: mode(returns),
        skewness: skewness(returns)
      }
    };
  }
  
  prepareHeatmap(trades) {
    // 월별 수익률 히트맵
    const monthlyReturns = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.timestamp);
      const key = \`\${date.getFullYear()}-\${date.getMonth() + 1}\`;
      
      if (!monthlyReturns[key]) {
        monthlyReturns[key] = [];
      }
      
      monthlyReturns[key].push(trade.returnRate);
    });
    
    // 월별 평균 계산
    const heatmapData = [];
    
    for (const [month, returns] of Object.entries(monthlyReturns)) {
      const [year, monthNum] = month.split('-');
      heatmapData.push({
        year: parseInt(year),
        month: parseInt(monthNum),
        return: average(returns),
        count: returns.length
      });
    }
    
    return heatmapData;
  }
}
\`\`\`

## 비교 분석

### 벤치마크 대비 성과
\`\`\`javascript
function compareToBenchmark(portfolio, benchmark = 'BTC') {
  const portfolioReturns = calculateDailyReturns(portfolio);
  const benchmarkReturns = getBenchmarkReturns(benchmark);
  
  // 상대 성과
  const relativeReturns = portfolioReturns.map((ret, idx) => 
    ret - benchmarkReturns[idx]
  );
  
  // 베타 계산
  const beta = calculateBeta(portfolioReturns, benchmarkReturns);
  
  // 알파 계산
  const alpha = calculateAlpha(portfolioReturns, benchmarkReturns, beta);
  
  // 추적 오차
  const trackingError = standardDeviation(relativeReturns) * Math.sqrt(252);
  
  return {
    totalOutperformance: sum(relativeReturns),
    avgDailyOutperformance: average(relativeReturns),
    winRateVsBenchmark: relativeReturns.filter(r => r > 0).length / relativeReturns.length,
    beta: beta,
    alpha: alpha * 252,  // 연율화
    trackingError: trackingError,
    informationRatio: (average(relativeReturns) * 252) / trackingError
  };
}
\`\`\`

### 전략 비교
\`\`\`javascript
function compareStrategies(strategies) {
  const comparison = [];
  
  for (const strategy of strategies) {
    const result = runSimulation(strategy);
    
    comparison.push({
      name: strategy.name,
      metrics: {
        totalReturn: result.totalReturn,
        annualizedReturn: result.annualizedReturn,
        sharpeRatio: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown,
        winRate: result.winRate,
        avgTrade: result.avgTradeReturn
      },
      score: calculateCompositeScore(result)
    });
  }
  
  // 종합 점수로 순위 매기기
  return comparison.sort((a, b) => b.score - a.score);
}

function calculateCompositeScore(result) {
  // 가중치 적용
  const weights = {
    return: 0.3,
    sharpe: 0.3,
    drawdown: 0.2,
    winRate: 0.2
  };
  
  // 정규화 후 가중 평균
  return (
    result.annualizedReturn * weights.return +
    result.sharpeRatio * weights.sharpe +
    (1 - result.maxDrawdown) * weights.drawdown +
    result.winRate * weights.winRate
  );
}
\`\`\`

## 개선점 도출

### 약점 분석
\`\`\`javascript
function identifyWeaknesses(analysis) {
  const weaknesses = [];
  
  // 낮은 승률
  if (analysis.winRate < 0.5) {
    weaknesses.push({
      issue: "낮은 승률",
      value: analysis.winRate,
      suggestion: "진입 조건을 더 엄격하게 조정"
    });
  }
  
  // 큰 낙폭
  if (analysis.maxDrawdown > 0.2) {
    weaknesses.push({
      issue: "과도한 최대 낙폭",
      value: analysis.maxDrawdown,
      suggestion: "포지션 크기 축소 또는 손절선 강화"
    });
  }
  
  // 낮은 샤프 비율
  if (analysis.sharpeRatio < 1) {
    weaknesses.push({
      issue: "위험 대비 수익 부족",
      value: analysis.sharpeRatio,
      suggestion: "변동성 관리 강화"
    });
  }
  
  return weaknesses;
}
\`\`\`

### 최적화 제안
\`\`\`javascript
function generateOptimizationSuggestions(analysis, trades) {
  const suggestions = [];
  
  // 시간대 최적화
  const timeAnalysis = analyzeByTimeOfDay(trades);
  if (timeAnalysis.bestHourAvgReturn > analysis.avgReturn * 2) {
    suggestions.push({
      type: "시간대 집중",
      description: \`\${timeAnalysis.bestHour}시에 거래 집중\`,
      expectedImprovement: "수익률 30% 향상 가능"
    });
  }
  
  // 손절 최적화
  const stopLossAnalysis = analyzeStopLosses(trades);
  if (stopLossAnalysis.avgLossWithoutStop > stopLossAnalysis.avgLossWithStop * 2) {
    suggestions.push({
      type: "손절 강화",
      description: "더 타이트한 손절선 설정",
      expectedImprovement: "최대 낙폭 50% 감소 가능"
    });
  }
  
  return suggestions;
}
\`\`\`

<div class="success">
✅ **핵심**: 단순히 수익률만 보지 말고 리스크 조정 수익률을 중점적으로 분석하세요.
</div>

<div class="info">
💡 **팁**: 최소 100회 이상의 거래 데이터가 있어야 통계적으로 의미있는 분석이 가능합니다.
</div>
    `,
  },
  'simulation.transition-checklist': {
    title: '실거래 전환 체크리스트',
    content: `
# 실거래 전환 체크리스트

## 전환 준비도 평가

### 필수 달성 기준
\`\`\`javascript
const readinessChecklist = {
  // 1. 수익성
  profitability: {
    requirement: "3개월 연속 양의 수익",
    check: () => monthlyReturns.slice(-3).every(r => r > 0),
    importance: "CRITICAL"
  },
  
  // 2. 안정성
  stability: {
    requirement: "최대 낙폭 20% 이하",
    check: () => maxDrawdown <= 0.20,
    importance: "CRITICAL"
  },
  
  // 3. 일관성
  consistency: {
    requirement: "월간 수익률 표준편차 < 10%",
    check: () => monthlyStdDev < 0.10,
    importance: "HIGH"
  },
  
  // 4. 거래 경험
  experience: {
    requirement: "최소 100회 이상 거래",
    check: () => totalTrades >= 100,
    importance: "HIGH"
  },
  
  // 5. 다양한 시장 경험
  marketExperience: {
    requirement: "상승장/하락장/횡보장 모두 경험",
    check: () => experiencedMarkets.length >= 3,
    importance: "MEDIUM"
  }
};
\`\`\`

### 점수 계산
\`\`\`javascript
function calculateReadinessScore(simulationResults) {
  let score = 0;
  const maxScore = 100;
  const breakdown = {};
  
  // 수익성 (30점)
  if (simulationResults.totalReturn > 0) {
    score += 15;
    if (simulationResults.totalReturn > 0.20) score += 15;
  }
  breakdown.profitability = score;
  
  // 리스크 관리 (30점)
  const riskScore = 30 * (1 - Math.min(simulationResults.maxDrawdown / 0.30, 1));
  score += riskScore;
  breakdown.riskManagement = riskScore;
  
  // 일관성 (20점)
  const consistencyScore = 20 * simulationResults.winRate;
  score += consistencyScore;
  breakdown.consistency = consistencyScore;
  
  // 경험 (20점)
  const experienceScore = Math.min(20, simulationResults.totalTrades / 5);
  score += experienceScore;
  breakdown.experience = experienceScore;
  
  return {
    totalScore: score,
    breakdown: breakdown,
    ready: score >= 70,
    recommendation: getRecommendation(score)
  };
}

function getRecommendation(score) {
  if (score >= 85) return "실거래 전환 적극 권장";
  if (score >= 70) return "소액으로 실거래 시작 가능";
  if (score >= 50) return "추가 시뮬레이션 필요";
  return "아직 준비되지 않음";
}
\`\`\`

## 단계별 전환 계획

### 1단계: 최종 검증
\`\`\`
체크리스트:
□ 시뮬레이션 결과 문서화
□ 전략 파라미터 최종 확정
□ 리스크 한도 설정
□ 비상 계획 수립
□ 심리적 준비 완료

기간: 1주일
\`\`\`

### 2단계: 소액 실거래
\`\`\`javascript
const initialRealTrading = {
  // 자금 설정
  capital: {
    amount: 500000,  // 50만원으로 시작
    maxLoss: 0.20,    // 최대 20% 손실 허용
  },
  
  // 거래 제한
  restrictions: {
    maxPositions: 2,
    maxPositionSize: 0.5,  // 자금의 50%
    onlyMajorCoins: true,  // BTC, ETH만
  },
  
  // 모니터링
  monitoring: {
    checkInterval: "1hour",
    stopConditions: [
      "20% 손실",
      "시스템 오류 3회",
      "예상과 다른 거래 패턴"
    ]
  }
};
\`\`\`

### 3단계: 점진적 확대
\`\`\`javascript
const scalingPlan = [
  {
    week: 1,
    capital: 500000,
    coins: ["BTC", "ETH"],
    maxPosition: 0.5
  },
  {
    week: 2,
    capital: 1000000,
    coins: ["BTC", "ETH", "XRP"],
    maxPosition: 0.4
  },
  {
    week: 4,
    capital: 2000000,
    coins: ["BTC", "ETH", "XRP", "ADA"],
    maxPosition: 0.3
  },
  {
    week: 8,
    capital: 5000000,
    coins: "ALL",
    maxPosition: 0.2
  }
];
\`\`\`

## 전환 시 주의사항

### 심리적 차이
\`\`\`
시뮬레이션 vs 실거래:

1. 감정적 압박
   - 시뮬: 차분하고 객관적
   - 실거래: 스트레스와 두려움
   
2. 실행 지연
   - 시뮬: 즉각적 실행
   - 실거래: 망설임과 의심
   
3. 손실 대응
   - 시뮬: 학습 기회로 인식
   - 실거래: 패닉과 복구 시도

대응 방안:
- 자동화 최대한 활용
- 감정 일기 작성
- 일일 한도 엄격 준수
\`\`\`

### 기술적 준비
\`\`\`javascript
// 실거래 전 시스템 점검
const systemChecklist = {
  api: {
    test: () => testAPIConnection(),
    verify: () => verifyAPIPermissions(),
    backup: () => setupAPIKeyBackup()
  },
  
  security: {
    twoFactor: () => enable2FA(),
    ipWhitelist: () => configureIPWhitelist(),
    encryption: () => verifyEncryption()
  },
  
  monitoring: {
    alerts: () => setupAlertSystem(),
    logging: () => configureLogging(),
    backup: () => setupDataBackup()
  },
  
  emergency: {
    killSwitch: () => testEmergencyStop(),
    contacts: () => setupEmergencyContacts(),
    procedures: () => documentEmergencyProcedures()
  }
};
\`\`\`

## 실거래 초기 관리

### 일일 체크리스트
\`\`\`
오전 점검 (09:00):
□ 시스템 정상 작동 확인
□ 밤사이 거래 내역 검토
□ 현재 포지션 확인
□ 리스크 레벨 체크
□ 오늘의 시장 상황 파악

오후 점검 (15:00):
□ 거래 성과 중간 점검
□ 이상 거래 여부 확인
□ 포지션 조정 필요성 검토

저녁 마감 (21:00):
□ 일일 성과 기록
□ 내일 전략 확인
□ 시스템 로그 백업
□ 문제점 기록 및 개선사항 도출
\`\`\`

### 주간 리뷰
\`\`\`javascript
function weeklyReview(weekData) {
  const report = {
    // 성과 요약
    performance: {
      totalReturn: calculateWeeklyReturn(weekData),
      trades: weekData.trades.length,
      winRate: calculateWinRate(weekData.trades),
      avgTradeReturn: calculateAvgReturn(weekData.trades)
    },
    
    // 시뮬레이션 대비
    vsSimulation: {
      returnDiff: weekData.actualReturn - weekData.expectedReturn,
      winRateDiff: weekData.actualWinRate - weekData.expectedWinRate,
      adherence: calculateStrategyAdherence(weekData)
    },
    
    // 문제점 분석
    issues: identifyIssues(weekData),
    
    // 다음 주 계획
    nextWeekPlan: generateWeeklyPlan(weekData)
  };
  
  return report;
}
\`\`\`

## 비상 계획

### 손실 한도 도달 시
\`\`\`javascript
const emergencyProtocol = {
  triggers: [
    { type: "DAILY_LOSS", threshold: -0.10, action: "PAUSE_24H" },
    { type: "WEEKLY_LOSS", threshold: -0.20, action: "REVIEW_STRATEGY" },
    { type: "TOTAL_LOSS", threshold: -0.30, action: "STOP_ALL" }
  ],
  
  actions: {
    PAUSE_24H: () => {
      stopAutoTrading();
      scheduleResume(24 * 60 * 60 * 1000);
      notifyUser("24시간 거래 중단");
    },
    
    REVIEW_STRATEGY: () => {
      stopAutoTrading();
      exportTradingData();
      notifyUser("전략 재검토 필요");
    },
    
    STOP_ALL: () => {
      emergencyLiquidation();
      disableTrading();
      notifyEmergencyContacts();
    }
  }
};
\`\`\`

### 시스템 오류 대응
\`\`\`
오류 등급:
1. 경미 (거래 지속)
   - API 일시적 오류
   - 차트 표시 오류
   
2. 중대 (거래 일시 중단)
   - 주문 실패 반복
   - 데이터 불일치
   
3. 심각 (즉시 중단)
   - 보안 침해 의심
   - 중복 주문 발생
   - 자금 불일치

대응 매뉴얼:
- 자동 복구 시도
- 관리자 알림
- 거래 기록 보존
- 원인 분석 및 보고
\`\`\`

<div class="success">
✅ **축하합니다!** 모든 체크리스트를 통과했다면 실거래를 시작할 준비가 되었습니다.
</div>

<div class="danger">
🚨 **최종 경고**: 실거래는 실제 돈이 걸려있습니다. 감당할 수 있는 금액만 투자하세요.
</div>
    `,
  },
};

// AI Learning 섹션들
export const learningContents = {
  'ai-learning': {
    title: 'AI 학습 시스템',
    content: `
# AI 학습 시스템

## AI 학습의 개념

자동매매 시스템이 거래 결과를 분석하고 스스로 개선하는 능력입니다. 기계학습 알고리즘을 활용하여 패턴을 인식하고 전략을 최적화합니다.

### 학습 시스템의 목표
\`\`\`
1. 패턴 인식 개선
   - 성공/실패 패턴 학습
   - 시장 상황별 최적 대응
   
2. 파라미터 최적화
   - 가중치 자동 조정
   - 임계값 동적 변경
   
3. 리스크 관리 향상
   - 손실 패턴 회피
   - 포지션 크기 최적화
   
4. 적응력 강화
   - 시장 변화 감지
   - 전략 자동 전환
\`\`\`

### 학습 프로세스
\`\`\`
데이터 수집 → 분석 → 패턴 추출 → 모델 업데이트 → 검증 → 적용
     ↑                                                    ↓
     ←──────────────── 피드백 루프 ──────────────────────←
\`\`\`

<div class="info">
💡 **중요**: AI 학습은 보조 도구입니다. 최종 결정은 항상 설정된 규칙을 따릅니다.
</div>
    `,
  },
  'ai-learning.learning-activation': {
    title: '학습 시스템 활성화',
    content: `
# 학습 시스템 활성화

## 활성화 전 준비사항

### 최소 데이터 요구사항
\`\`\`javascript
const learningRequirements = {
  minTrades: 50,          // 최소 거래 횟수
  minDays: 30,           // 최소 운영 기간
  minMarketConditions: 2, // 경험한 시장 상황 수
  
  checkReadiness: function(tradingData) {
    return {
      trades: tradingData.trades.length >= this.minTrades,
      days: daysSince(tradingData.startDate) >= this.minDays,
      conditions: tradingData.marketConditions.size >= this.minMarketConditions,
      ready: this.isReady(tradingData)
    };
  }
};
\`\`\`

### 시스템 설정
\`\`\`javascript
// 학습 시스템 초기화
const learningSystem = {
  enabled: false,
  mode: 'supervised',  // supervised, reinforcement, hybrid
  
  config: {
    learningRate: 0.001,      // 학습률 (느리게 시작)
    batchSize: 10,            // 배치 크기
    updateFrequency: 'daily', // 업데이트 주기
    maxAdjustment: 0.1,       // 최대 조정폭 10%
  },
  
  safety: {
    requireConfirmation: true,  // 중요 변경 시 확인
    maxWeightChange: 0.05,      // 가중치 최대 변경 5%
    rollbackEnabled: true,      // 롤백 기능
    testPeriod: 7              // 7일 테스트 후 적용
  }
};
\`\`\`

## 활성화 절차

### 1단계: 기준선 설정
\`\`\`javascript
async function establishBaseline() {
  const historicalData = await loadHistoricalTrades();
  
  // 현재 성과 측정
  const baseline = {
    performance: calculatePerformanceMetrics(historicalData),
    parameters: getCurrentParameters(),
    timestamp: Date.now()
  };
  
  // 베이스라인 저장
  await saveBaseline(baseline);
  
  return {
    winRate: baseline.performance.winRate,
    avgReturn: baseline.performance.avgReturn,
    sharpeRatio: baseline.performance.sharpeRatio,
    maxDrawdown: baseline.performance.maxDrawdown
  };
}
\`\`\`

### 2단계: 학습 모델 선택
\`\`\`javascript
class LearningModelSelector {
  selectModel(tradingStyle, dataCharacteristics) {
    const models = {
      // 단순 선형 회귀
      linear: {
        suitable: ['trending', 'stable'],
        complexity: 'low',
        interpretability: 'high'
      },
      
      // 결정 트리
      decisionTree: {
        suitable: ['categorical', 'rule-based'],
        complexity: 'medium',
        interpretability: 'high'
      },
      
      // 신경망
      neuralNetwork: {
        suitable: ['complex', 'non-linear'],
        complexity: 'high',
        interpretability: 'low'
      },
      
      // 강화학습
      reinforcement: {
        suitable: ['adaptive', 'dynamic'],
        complexity: 'very-high',
        interpretability: 'low'
      }
    };
    
    // 거래 스타일에 맞는 모델 추천
    return this.recommendModel(tradingStyle, models);
  }
}
\`\`\`

### 3단계: 학습 시작
\`\`\`javascript
class LearningEngine {
  constructor(config) {
    this.config = config;
    this.model = null;
    this.isLearning = false;
    this.history = [];
  }
  
  async startLearning() {
    this.isLearning = true;
    
    // 초기 모델 생성
    this.model = await this.initializeModel();
    
    // 학습 루프 시작
    this.learningLoop = setInterval(() => {
      this.performLearningCycle();
    }, this.config.updateFrequency);
    
    // 모니터링 시작
    this.startMonitoring();
    
    console.log('학습 시스템 활성화됨');
  }
  
  async performLearningCycle() {
    try {
      // 1. 최근 데이터 수집
      const recentData = await this.collectRecentData();
      
      // 2. 특징 추출
      const features = this.extractFeatures(recentData);
      
      // 3. 모델 업데이트
      const updates = await this.model.train(features);
      
      // 4. 검증
      const validation = await this.validateUpdates(updates);
      
      // 5. 적용 여부 결정
      if (validation.passed) {
        await this.applyUpdates(updates);
      }
      
      // 6. 기록
      this.logLearningCycle(updates, validation);
      
    } catch (error) {
      this.handleLearningError(error);
    }
  }
}
\`\`\`

## 학습 모드 설정

### Supervised Learning (지도학습)
\`\`\`javascript
const supervisedLearning = {
  // 레이블된 데이터로 학습
  trainModel: function(labeledData) {
    const features = [];
    const labels = [];
    
    labeledData.forEach(trade => {
      // 특징 추출
      features.push([
        trade.rsi,
        trade.macd,
        trade.volume,
        trade.priceChange,
        trade.marketCondition
      ]);
      
      // 레이블 (성공/실패)
      labels.push(trade.profit > 0 ? 1 : 0);
    });
    
    // 모델 학습
    return this.fitModel(features, labels);
  },
  
  // 예측
  predict: function(currentMarket) {
    const features = this.extractFeatures(currentMarket);
    return this.model.predict(features);
  }
};
\`\`\`

### Reinforcement Learning (강화학습)
\`\`\`javascript
class ReinforcementLearner {
  constructor() {
    this.qTable = {};  // 상태-행동 가치 테이블
    this.epsilon = 0.1; // 탐험 비율
    this.alpha = 0.1;   // 학습률
    this.gamma = 0.95;  // 할인율
  }
  
  chooseAction(state) {
    // ε-greedy 정책
    if (Math.random() < this.epsilon) {
      // 탐험: 무작위 행동
      return this.randomAction();
    } else {
      // 활용: 최적 행동
      return this.getBestAction(state);
    }
  }
  
  updateQValue(state, action, reward, nextState) {
    const currentQ = this.getQValue(state, action);
    const maxNextQ = this.getMaxQValue(nextState);
    
    // Q-learning 업데이트
    const newQ = currentQ + this.alpha * (
      reward + this.gamma * maxNextQ - currentQ
    );
    
    this.setQValue(state, action, newQ);
  }
  
  learn(experience) {
    const { state, action, reward, nextState } = experience;
    this.updateQValue(state, action, reward, nextState);
    
    // 탐험 비율 감소
    this.epsilon = Math.max(0.01, this.epsilon * 0.995);
  }
}
\`\`\`

## 안전장치

### 변경사항 검증
\`\`\`javascript
class SafetyValidator {
  validateChanges(original, proposed) {
    const checks = [];
    
    // 1. 변경폭 체크
    const changePercent = Math.abs(proposed - original) / original;
    checks.push({
      name: 'changeLimit',
      passed: changePercent <= 0.1,
      value: changePercent,
      message: \`변경폭: \${(changePercent * 100).toFixed(2)}%\`
    });
    
    // 2. 백테스트 검증
    const backtest = this.runBacktest(proposed);
    checks.push({
      name: 'backtestPerformance',
      passed: backtest.performance >= original.performance * 0.95,
      value: backtest.performance,
      message: \`백테스트 성과: \${backtest.performance.toFixed(2)}\`
    });
    
    // 3. 리스크 체크
    const riskMetrics = this.assessRisk(proposed);
    checks.push({
      name: 'riskLimit',
      passed: riskMetrics.maxDrawdown <= 0.25,
      value: riskMetrics.maxDrawdown,
      message: \`최대 낙폭: \${(riskMetrics.maxDrawdown * 100).toFixed(2)}%\`
    });
    
    return {
      approved: checks.every(c => c.passed),
      checks: checks
    };
  }
}
\`\`\`

### 롤백 메커니즘
\`\`\`javascript
class RollbackManager {
  constructor() {
    this.snapshots = [];
    this.maxSnapshots = 10;
  }
  
  createSnapshot(state) {
    const snapshot = {
      id: generateId(),
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
      performance: this.getCurrentPerformance()
    };
    
    this.snapshots.push(snapshot);
    
    // 오래된 스냅샷 제거
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    
    return snapshot.id;
  }
  
  rollback(snapshotId) {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    
    if (!snapshot) {
      throw new Error('스냅샷을 찾을 수 없습니다');
    }
    
    // 상태 복원
    this.restoreState(snapshot.state);
    
    // 알림
    this.notifyRollback(snapshot);
    
    return snapshot;
  }
  
  autoRollback() {
    // 성과가 20% 이상 하락하면 자동 롤백
    const currentPerf = this.getCurrentPerformance();
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    
    if (currentPerf < lastSnapshot.performance * 0.8) {
      console.warn('성과 급락 감지, 자동 롤백 실행');
      return this.rollback(lastSnapshot.id);
    }
  }
}
\`\`\`

## 모니터링

### 학습 진행 상황
\`\`\`javascript
class LearningMonitor {
  constructor() {
    this.metrics = {
      learningCycles: 0,
      improvements: 0,
      failures: 0,
      currentPerformance: 0
    };
  }
  
  displayDashboard() {
    return {
      status: this.getLearningStatus(),
      progress: {
        cycles: this.metrics.learningCycles,
        successRate: this.metrics.improvements / this.metrics.learningCycles,
        recentChanges: this.getRecentChanges()
      },
      performance: {
        current: this.metrics.currentPerformance,
        improvement: this.calculateImprovement(),
        trend: this.getPerformanceTrend()
      },
      alerts: this.checkAlerts()
    };
  }
  
  checkAlerts() {
    const alerts = [];
    
    // 학습 정체
    if (this.isLearningStagnant()) {
      alerts.push({
        level: 'warning',
        message: '최근 10회 학습에서 개선 없음'
      });
    }
    
    // 성과 하락
    if (this.isPerformanceDeclining()) {
      alerts.push({
        level: 'danger',
        message: '성과 지속 하락 중'
      });
    }
    
    return alerts;
  }
}
\`\`\`

<div class="success">
✅ **팁**: 학습 시스템은 천천히 시작하세요. 급격한 변화는 예상치 못한 결과를 초래할 수 있습니다.
</div>

<div class="warning">
⚠️ **주의**: AI 학습이 항상 개선을 보장하지는 않습니다. 지속적인 모니터링이 필요합니다.
</div>
    `,
  },
  'ai-learning.auto-learning': {
    title: '거래 결과 자동 학습',
    content: `
# 거래 결과 자동 학습

## 자동 학습 프로세스

### 데이터 수집
\`\`\`javascript
class TradeDataCollector {
  constructor() {
    this.buffer = [];
    this.features = [
      'price', 'volume', 'rsi', 'macd', 'bollingerBands',
      'marketCap', 'sentiment', 'timeOfDay', 'dayOfWeek'
    ];
  }
  
  collectTradeData(trade) {
    const tradeData = {
      // 거래 정보
      id: trade.id,
      timestamp: trade.timestamp,
      symbol: trade.symbol,
      side: trade.side,
      price: trade.price,
      quantity: trade.quantity,
      
      // 거래 시점 시장 상황
      marketSnapshot: {
        ...this.captureMarketState(trade.symbol, trade.timestamp)
      },
      
      // 거래 결과
      result: {
        profit: trade.profit,
        profitPercent: trade.profitPercent,
        holdingPeriod: trade.holdingPeriod,
        maxDrawdown: trade.maxDrawdown
      },
      
      // 메타 정보
      strategy: trade.strategy,
      confidence: trade.confidence,
      marketCondition: trade.marketCondition
    };
    
    this.buffer.push(tradeData);
    
    // 배치 처리
    if (this.buffer.length >= 10) {
      this.processBatch();
    }
  }
  
  captureMarketState(symbol, timestamp) {
    return {
      technicalIndicators: this.getTechnicalIndicators(symbol, timestamp),
      marketMetrics: this.getMarketMetrics(symbol, timestamp),
      contextualFactors: this.getContextualFactors(timestamp)
    };
  }
}
\`\`\`

### 패턴 인식
\`\`\`javascript
class PatternRecognizer {
  constructor() {
    this.patterns = new Map();
    this.minSupport = 0.05;  // 최소 5% 빈도
    this.minConfidence = 0.7; // 최소 70% 신뢰도
  }
  
  analyzePatterns(trades) {
    // 성공 거래 패턴
    const successfulTrades = trades.filter(t => t.result.profit > 0);
    const successPatterns = this.extractPatterns(successfulTrades);
    
    // 실패 거래 패턴
    const failedTrades = trades.filter(t => t.result.profit <= 0);
    const failurePatterns = this.extractPatterns(failedTrades);
    
    // 패턴 평가
    return {
      success: this.evaluatePatterns(successPatterns, trades),
      failure: this.evaluatePatterns(failurePatterns, trades),
      insights: this.generateInsights(successPatterns, failurePatterns)
    };
  }
  
  extractPatterns(trades) {
    const patterns = [];
    
    // 단일 특징 패턴
    for (const feature of this.features) {
      const pattern = this.analyzeSingleFeature(trades, feature);
      if (pattern.support >= this.minSupport) {
        patterns.push(pattern);
      }
    }
    
    // 복합 특징 패턴
    const combinedPatterns = this.analyzeCombinedFeatures(trades);
    patterns.push(...combinedPatterns);
    
    return patterns;
  }
  
  analyzeSingleFeature(trades, feature) {
    const values = trades.map(t => t.marketSnapshot[feature]);
    const histogram = this.createHistogram(values);
    
    // 가장 빈번한 값/범위 찾기
    const mostFrequent = this.findMostFrequent(histogram);
    
    return {
      feature: feature,
      condition: mostFrequent.condition,
      support: mostFrequent.count / trades.length,
      avgProfit: this.calculateAvgProfit(trades, mostFrequent.condition)
    };
  }
}
\`\`\`

### 모델 업데이트
\`\`\`javascript
class ModelUpdater {
  constructor(model) {
    this.model = model;
    this.updateHistory = [];
    this.performanceBaseline = null;
  }
  
  async updateModel(newPatterns, validationData) {
    // 1. 현재 성능 기록
    const currentPerformance = await this.evaluateModel(validationData);
    
    // 2. 패턴을 모델에 통합
    const updatedModel = this.integratePatterns(this.model, newPatterns);
    
    // 3. 업데이트된 모델 검증
    const newPerformance = await this.evaluateModel(validationData, updatedModel);
    
    // 4. 개선 여부 확인
    const improvement = (newPerformance - currentPerformance) / currentPerformance;
    
    if (improvement > 0.01) { // 1% 이상 개선
      // 모델 업데이트 적용
      this.applyUpdate(updatedModel);
      
      // 기록
      this.logUpdate({
        timestamp: Date.now(),
        patterns: newPatterns.length,
        improvement: improvement,
        newPerformance: newPerformance
      });
      
      return { success: true, improvement };
    }
    
    return { success: false, reason: '충분한 개선 없음' };
  }
  
  integratePatterns(model, patterns) {
    const updatedRules = [...model.rules];
    
    patterns.forEach(pattern => {
      // 기존 규칙과 충돌 확인
      const conflict = this.checkConflict(pattern, model.rules);
      
      if (!conflict) {
        // 새 규칙 추가
        updatedRules.push(this.patternToRule(pattern));
      } else {
        // 충돌 해결
        this.resolveConflict(pattern, conflict, updatedRules);
      }
    });
    
    return { ...model, rules: updatedRules };
  }
}
\`\`\`

## 학습 전략

### 증분 학습 (Incremental Learning)
\`\`\`javascript
class IncrementalLearner {
  constructor() {
    this.memory = new LimitedMemory(1000); // 최근 1000개 거래 기억
    this.learningRate = 0.01;
  }
  
  learn(newTrade) {
    // 1. 메모리에 추가
    this.memory.add(newTrade);
    
    // 2. 예측과 실제 결과 비교
    const prediction = this.predict(newTrade.marketSnapshot);
    const error = newTrade.result.profit - prediction;
    
    // 3. 가중치 업데이트 (경사하강법)
    this.updateWeights(error, newTrade.marketSnapshot);
    
    // 4. 성능 추적
    this.trackPerformance(error);
  }
  
  updateWeights(error, features) {
    // 각 특징에 대한 가중치 조정
    for (const [feature, value] of Object.entries(features)) {
      const gradient = error * value;
      const update = this.learningRate * gradient;
      
      // 가중치 업데이트
      this.weights[feature] = (this.weights[feature] || 0) + update;
      
      // 가중치 제한 (과적합 방지)
      this.weights[feature] = Math.max(-1, Math.min(1, this.weights[feature]));
    }
  }
}
\`\`\`

### 배치 학습 (Batch Learning)
\`\`\`javascript
class BatchLearner {
  constructor() {
    this.batchSize = 100;
    this.epochSize = 10;
  }
  
  async trainBatch(trades) {
    const dataset = this.prepareDataset(trades);
    
    for (let epoch = 0; epoch < this.epochSize; epoch++) {
      // 데이터 섞기
      const shuffled = this.shuffle(dataset);
      
      // 미니배치로 분할
      const batches = this.createBatches(shuffled, this.batchSize);
      
      for (const batch of batches) {
        // 배치 학습
        await this.processBatch(batch);
      }
      
      // 에폭 완료 후 검증
      const validation = await this.validate();
      console.log(\`Epoch \${epoch + 1}: Accuracy \${validation.accuracy}\`);
      
      // 조기 종료
      if (validation.accuracy > 0.95) break;
    }
  }
  
  processBatch(batch) {
    // 배치 내 모든 샘플의 그래디언트 계산
    const gradients = batch.map(sample => 
      this.calculateGradient(sample)
    );
    
    // 평균 그래디언트로 가중치 업데이트
    const avgGradient = this.averageGradients(gradients);
    this.applyGradient(avgGradient);
  }
}
\`\`\`

## 성과 추적

### 학습 효과 측정
\`\`\`javascript
class LearningEffectivenessTracker {
  constructor() {
    this.metrics = {
      before: {},
      after: {},
      improvements: []
    };
  }
  
  measureImprovement(period = 30) {
    // 학습 전 성과
    const beforeLearning = this.getPerformance(-60, -30); // 60-30일 전
    
    // 학습 후 성과
    const afterLearning = this.getPerformance(-30, 0); // 최근 30일
    
    // 개선도 계산
    const improvements = {
      winRate: {
        before: beforeLearning.winRate,
        after: afterLearning.winRate,
        change: afterLearning.winRate - beforeLearning.winRate,
        percentChange: ((afterLearning.winRate - beforeLearning.winRate) / beforeLearning.winRate) * 100
      },
      avgReturn: {
        before: beforeLearning.avgReturn,
        after: afterLearning.avgReturn,
        change: afterLearning.avgReturn - beforeLearning.avgReturn,
        percentChange: ((afterLearning.avgReturn - beforeLearning.avgReturn) / beforeLearning.avgReturn) * 100
      },
      sharpeRatio: {
        before: beforeLearning.sharpeRatio,
        after: afterLearning.sharpeRatio,
        change: afterLearning.sharpeRatio - beforeLearning.sharpeRatio
      }
    };
    
    return {
      summary: this.generateSummary(improvements),
      details: improvements,
      recommendation: this.generateRecommendation(improvements)
    };
  }
  
  generateRecommendation(improvements) {
    const significantImprovement = 
      improvements.winRate.percentChange > 10 ||
      improvements.avgReturn.percentChange > 15 ||
      improvements.sharpeRatio.change > 0.2;
    
    if (significantImprovement) {
      return {
        action: "CONTINUE",
        message: "학습이 효과적입니다. 현재 설정을 유지하세요."
      };
    } else if (improvements.winRate.change < -5) {
      return {
        action: "REVIEW",
        message: "성과가 악화되고 있습니다. 학습 파라미터를 검토하세요."
      };
    } else {
      return {
        action: "ADJUST",
        message: "학습 효과가 미미합니다. 학습률을 조정해보세요."
      };
    }
  }
}
\`\`\`

### 학습 곡선 분석
\`\`\`javascript
function analyzeLearningCurve(learningHistory) {
  const curve = learningHistory.map(h => ({
    iteration: h.iteration,
    performance: h.performance,
    loss: h.loss
  }));
  
  // 수렴 여부 확인
  const lastN = curve.slice(-10);
  const variance = calculateVariance(lastN.map(p => p.performance));
  const isConverged = variance < 0.001;
  
  // 과적합 확인
  const trainingPerf = lastN.map(p => p.performance);
  const validationPerf = lastN.map(p => p.validationPerformance);
  const perfGap = average(trainingPerf) - average(validationPerf);
  const isOverfitting = perfGap > 0.1;
  
  return {
    isConverged,
    isOverfitting,
    convergenceRate: calculateConvergenceRate(curve),
    optimalIteration: findOptimalIteration(curve),
    suggestions: generateSuggestions(isConverged, isOverfitting)
  };
}
\`\`\`

## 자동 조정 메커니즘

### 동적 파라미터 조정
\`\`\`javascript
class AutoParameterTuner {
  constructor() {
    this.parameters = {
      learningRate: 0.01,
      batchSize: 32,
      regularization: 0.001
    };
    
    this.tuningHistory = [];
  }
  
  async autoTune() {
    const experiments = this.generateExperiments();
    const results = [];
    
    for (const experiment of experiments) {
      // 파라미터 설정
      this.setParameters(experiment);
      
      // 학습 실행
      const result = await this.runExperiment();
      
      results.push({
        parameters: experiment,
        performance: result.performance
      });
    }
    
    // 최적 파라미터 선택
    const best = results.reduce((a, b) => 
      a.performance > b.performance ? a : b
    );
    
    // 적용
    this.applyOptimalParameters(best.parameters);
    
    return best;
  }
  
  generateExperiments() {
    // 그리드 서치
    const experiments = [];
    const learningRates = [0.001, 0.01, 0.1];
    const batchSizes = [16, 32, 64];
    const regularizations = [0.0001, 0.001, 0.01];
    
    for (const lr of learningRates) {
      for (const bs of batchSizes) {
        for (const reg of regularizations) {
          experiments.push({
            learningRate: lr,
            batchSize: bs,
            regularization: reg
          });
        }
      }
    }
    
    return experiments;
  }
}
\`\`\`

<div class="info">
💡 **팁**: 자동 학습은 지속적인 개선을 가능하게 하지만, 정기적인 검토와 검증이 필요합니다.
</div>

<div class="warning">
⚠️ **주의**: 과도한 학습은 과적합을 일으킬 수 있습니다. 검증 데이터로 항상 확인하세요.
</div>
    `,
  },
};