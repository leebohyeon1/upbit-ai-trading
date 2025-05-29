// Risk Management 섹션들
export const riskManagementContents = {
  'risk-management': {
    title: '리스크 관리',
    content: `
# 리스크 관리

## 리스크 관리의 중요성

수익보다 중요한 것은 원금 보존입니다. 아무리 좋은 전략도 리스크 관리 없이는 실패합니다.

### 주요 리스크 유형
\`\`\`
1. 시장 리스크
   - 가격 변동
   - 변동성 증가
   - 블랙스완 이벤트

2. 거래 리스크
   - 슬리피지
   - 유동성 부족
   - 시스템 오류

3. 포트폴리오 리스크
   - 과도한 집중
   - 상관관계
   - 레버리지

4. 심리적 리스크
   - FOMO (Fear of Missing Out)
   - 공포와 탐욕
   - 복수 매매
\`\`\`

### 리스크 관리 원칙
1. **자본 보존**: 한 번의 거래로 파산하지 않도록
2. **일관성**: 감정이 아닌 규칙에 따라
3. **다각화**: 계란을 한 바구니에 담지 않기
4. **측정 가능**: 정량화된 리스크만 감수

<div class="danger">
⚠️ **경고**: 리스크 관리 없는 거래는 도박입니다.
</div>
    `,
  },
  'risk-management.stop-loss': {
    title: '손절 전략',
    content: `
# 손절 전략

## 손절의 필요성

손절은 작은 손실로 큰 손실을 막는 방패입니다.

### 손절하지 않으면
\`\`\`
예시: 손실 회복에 필요한 수익률
-10% 손실 → +11.1% 필요
-20% 손실 → +25% 필요
-50% 손실 → +100% 필요
-80% 손실 → +400% 필요
\`\`\`

## 손절 방법

### 1. 고정 퍼센트 손절
\`\`\`javascript
const fixedStopLoss = {
  method: "FIXED_PERCENT",
  value: 0.05,  // 5%
  
  calculate: function(entryPrice) {
    return entryPrice * (1 - this.value);
  },
  
  example: {
    entry: 50000,
    stopLoss: 47500,  // -5%
    maxLoss: 2500
  }
};
\`\`\`

### 2. ATR 기반 손절
\`\`\`javascript
const atrStopLoss = {
  method: "ATR_BASED",
  multiplier: 2,
  
  calculate: function(entryPrice, atr) {
    return entryPrice - (atr * this.multiplier);
  },
  
  advantage: "변동성에 따라 조정",
  
  example: {
    entry: 50000,
    atr: 1000,
    stopLoss: 48000  // -2 ATR
  }
};
\`\`\`

### 3. 지지선 기반 손절
\`\`\`javascript
const supportStopLoss = {
  method: "SUPPORT_BASED",
  buffer: 0.02,  // 2% 여유
  
  calculate: function(supportLevel) {
    return supportLevel * (1 - this.buffer);
  },
  
  findSupport: function(priceData) {
    // 최근 저점, 이동평균선, 피봇포인트 등
    return {
      recentLow: Math.min(...priceData.slice(-20)),
      ma60: calculateMA(priceData, 60),
      pivot: calculatePivot(priceData)
    };
  }
};
\`\`\`

### 4. 트레일링 스탑
\`\`\`javascript
class TrailingStop {
  constructor(initialStop, trailPercent) {
    this.currentStop = initialStop;
    this.trailPercent = trailPercent;  // 3%
    this.highestPrice = 0;
  }
  
  update(currentPrice) {
    // 신고가 갱신
    if (currentPrice > this.highestPrice) {
      this.highestPrice = currentPrice;
      
      // 손절선 상향 조정
      const newStop = this.highestPrice * (1 - this.trailPercent);
      if (newStop > this.currentStop) {
        this.currentStop = newStop;
      }
    }
    
    return {
      stop: this.currentStop,
      distance: (currentPrice - this.currentStop) / currentPrice,
      profit: (this.highestPrice - currentPrice) / currentPrice
    };
  }
}
\`\`\`

## 손절 설정 가이드

### 코인별 손절 설정
\`\`\`javascript
const stopLossGuide = {
  BTC: {
    normal: 0.03,      // 3%
    volatile: 0.05,    // 5%
    conservative: 0.02 // 2%
  },
  
  altcoins: {
    large: 0.05,       // 5%
    medium: 0.07,      // 7%
    small: 0.10        // 10%
  },
  
  newListings: {
    initial: 0.15,     // 15%
    afterStable: 0.10  // 10%
  }
};
\`\`\`

### 시장 상황별 조정
\`\`\`javascript
function adjustStopLoss(baseStop, marketCondition) {
  const adjustments = {
    BULL: 1.2,      // 넓게
    NORMAL: 1.0,    // 기본
    BEAR: 0.8,      // 타이트하게
    CRASH: 0.5      // 매우 타이트
  };
  
  return baseStop * adjustments[marketCondition];
}
\`\`\`

## 손절 실행

### 자동 손절 시스템
\`\`\`javascript
class StopLossManager {
  constructor() {
    this.positions = new Map();
    this.checkInterval = 1000;  // 1초마다 체크
  }
  
  addPosition(symbol, entry, stopLoss) {
    this.positions.set(symbol, {
      entry: entry,
      stop: stopLoss,
      status: 'ACTIVE',
      trailing: new TrailingStop(stopLoss, 0.03)
    });
  }
  
  async checkStopLoss() {
    for (const [symbol, position] of this.positions) {
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // 트레일링 스탑 업데이트
      const { stop } = position.trailing.update(currentPrice);
      
      // 손절 조건 확인
      if (currentPrice <= stop) {
        await this.executeSell(symbol, 'STOP_LOSS');
        this.positions.delete(symbol);
        
        // 알림
        this.notifyStopLoss(symbol, position, currentPrice);
      }
    }
  }
  
  notifyStopLoss(symbol, position, currentPrice) {
    const loss = ((currentPrice - position.entry) / position.entry) * 100;
    
    console.log(\`🛑 손절 실행: \\\${symbol}\`);
    console.log(\`진입가: \\\${position.entry}\`);
    console.log(\`손절가: \\\${currentPrice}\`);
    console.log(\`손실률: \\\${loss.toFixed(2)}%\`);
  }
}
\`\`\`

## 손절 심리학

### 손절이 어려운 이유
\`\`\`
1. 손실 인정의 고통
   - "조금만 기다리면 회복할거야"
   - "평단을 낮추면 되지 않을까?"

2. 확증 편향
   - 긍정적 뉴스만 찾기
   - 부정적 신호 무시

3. 매몰 비용 오류
   - "이미 많이 잃었는데..."
   - "여기서 팔면 진짜 손해"

해결책:
- 자동 손절 시스템 사용
- 진입 전 손절가 설정
- 손절 = 자본 보호
\`\`\`

### 손절 후 대응
\`\`\`javascript
class PostStopLossStrategy {
  constructor() {
    this.cooldownPeriod = 3600000;  // 1시간
    this.blacklist = new Map();
  }
  
  afterStopLoss(symbol) {
    // 재진입 금지
    this.blacklist.set(symbol, Date.now());
    
    // 포지션 크기 축소
    this.reduceNextPosition();
    
    // 전략 재검토
    this.reviewStrategy();
  }
  
  canTrade(symbol) {
    if (!this.blacklist.has(symbol)) return true;
    
    const blacklistedTime = this.blacklist.get(symbol);
    if (Date.now() - blacklistedTime > this.cooldownPeriod) {
      this.blacklist.delete(symbol);
      return true;
    }
    
    return false;
  }
}
\`\`\`

## 손절 통계 분석

### 손절 효과 측정
\`\`\`javascript
function analyzeStopLossEffectiveness(trades) {
  const withStopLoss = trades.filter(t => t.hadStopLoss);
  const withoutStopLoss = trades.filter(t => !t.hadStopLoss);
  
  return {
    withStopLoss: {
      avgLoss: average(withStopLoss.map(t => t.loss)),
      maxLoss: Math.min(...withStopLoss.map(t => t.loss)),
      recoveryTime: average(withStopLoss.map(t => t.recoveryDays))
    },
    
    withoutStopLoss: {
      avgLoss: average(withoutStopLoss.map(t => t.loss)),
      maxLoss: Math.min(...withoutStopLoss.map(t => t.loss)),
      recoveryTime: average(withoutStopLoss.map(t => t.recoveryDays))
    },
    
    savedCapital: calculateSavedCapital(trades)
  };
}
\`\`\`

<div class="success">
✅ **핵심**: 손절은 패배가 아니라 다음 기회를 위한 자본 보존입니다.
</div>

<div class="danger">
⚠️ **절대 규칙**: 손절선은 한번 정하면 절대 내리지 마세요. 올리기만 가능합니다.
</div>
    `,
  },
  'risk-management.portfolio-risk': {
    title: '포트폴리오 리스크',
    content: `
# 포트폴리오 리스크

## 리스크 측정 지표

### 1. 포트폴리오 변동성
\`\`\`javascript
function calculatePortfolioVolatility(holdings, correlationMatrix) {
  let variance = 0;
  
  // 개별 변동성 기여도
  for (let i = 0; i < holdings.length; i++) {
    const weight_i = holdings[i].weight;
    const vol_i = holdings[i].volatility;
    variance += Math.pow(weight_i * vol_i, 2);
  }
  
  // 상관관계 기여도
  for (let i = 0; i < holdings.length; i++) {
    for (let j = i + 1; j < holdings.length; j++) {
      const weight_i = holdings[i].weight;
      const weight_j = holdings[j].weight;
      const vol_i = holdings[i].volatility;
      const vol_j = holdings[j].volatility;
      const corr_ij = correlationMatrix[i][j];
      
      variance += 2 * weight_i * weight_j * vol_i * vol_j * corr_ij;
    }
  }
  
  return Math.sqrt(variance);
}
\`\`\`

### 2. Value at Risk (VaR)
\`\`\`javascript
class VaRCalculator {
  // 95% 신뢰수준에서 일일 최대 예상 손실
  calculate(portfolio, confidence = 0.95) {
    const returns = this.getHistoricalReturns(portfolio);
    const sortedReturns = returns.sort((a, b) => a - b);
    
    // 파라메트릭 VaR
    const mean = average(returns);
    const std = standardDeviation(returns);
    const z = this.getZScore(confidence);  // 1.645 for 95%
    
    const parametricVaR = mean - z * std;
    
    // 역사적 VaR
    const index = Math.floor((1 - confidence) * returns.length);
    const historicalVaR = sortedReturns[index];
    
    // 몬테카를로 VaR
    const monteCarloVaR = this.monteCarloSimulation(portfolio, confidence);
    
    return {
      parametric: parametricVaR,
      historical: historicalVaR,
      monteCarlo: monteCarloVaR,
      interpretation: \`\\\${confidence*100}% 확률로 일일 손실이 \\\${Math.abs(parametricVaR*100).toFixed(2)}% 이하\`
    };
  }
}
\`\`\`

### 3. 최대낙폭 (Maximum Drawdown)
\`\`\`javascript
function calculateMaxDrawdown(portfolioValues) {
  let maxDrawdown = 0;
  let peak = portfolioValues[0];
  let trough = portfolioValues[0];
  let drawdownPeriods = [];
  
  for (let i = 1; i < portfolioValues.length; i++) {
    const value = portfolioValues[i];
    
    // 신고점 갱신
    if (value > peak) {
      if (peak - trough > 0) {
        drawdownPeriods.push({
          start: peak,
          end: trough,
          drawdown: (peak - trough) / peak,
          duration: i - peakIndex
        });
      }
      peak = value;
      trough = value;
    } else if (value < trough) {
      trough = value;
      const currentDrawdown = (peak - trough) / peak;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
    }
  }
  
  return {
    maxDrawdown: maxDrawdown,
    periods: drawdownPeriods,
    currentDrawdown: (peak - portfolioValues[portfolioValues.length-1]) / peak,
    recoveryTime: this.calculateRecoveryTime(drawdownPeriods)
  };
}
\`\`\`

## 집중도 리스크

### 포지션 집중도 관리
\`\`\`javascript
class ConcentrationRiskManager {
  constructor() {
    this.limits = {
      singleAsset: 0.25,      // 25%
      assetClass: 0.40,       // 40%
      correlatedAssets: 0.35  // 35%
    };
  }
  
  checkConcentration(portfolio) {
    const risks = [];
    
    // 단일 자산 집중도
    for (const holding of portfolio.holdings) {
      if (holding.weight > this.limits.singleAsset) {
        risks.push({
          type: 'SINGLE_ASSET',
          asset: holding.symbol,
          weight: holding.weight,
          limit: this.limits.singleAsset,
          action: 'REDUCE_POSITION'
        });
      }
    }
    
    // 상관관계 집중도
    const correlatedGroups = this.findCorrelatedAssets(portfolio);
    for (const group of correlatedGroups) {
      const totalWeight = group.reduce((sum, asset) => sum + asset.weight, 0);
      if (totalWeight > this.limits.correlatedAssets) {
        risks.push({
          type: 'CORRELATED_GROUP',
          assets: group.map(a => a.symbol),
          totalWeight: totalWeight,
          correlation: group[0].correlation,
          action: 'DIVERSIFY'
        });
      }
    }
    
    return risks;
  }
  
  findCorrelatedAssets(portfolio, threshold = 0.7) {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < portfolio.holdings.length; i++) {
      if (processed.has(i)) continue;
      
      const group = [portfolio.holdings[i]];
      processed.add(i);
      
      for (let j = i + 1; j < portfolio.holdings.length; j++) {
        const correlation = this.getCorrelation(
          portfolio.holdings[i].symbol,
          portfolio.holdings[j].symbol
        );
        
        if (correlation > threshold) {
          group.push({
            ...portfolio.holdings[j],
            correlation: correlation
          });
          processed.add(j);
        }
      }
      
      if (group.length > 1) {
        groups.push(group);
      }
    }
    
    return groups;
  }
}
\`\`\`

### 섹터별 분산
\`\`\`javascript
const sectorAllocation = {
  recommended: {
    'store-of-value': { min: 0.2, max: 0.4 },    // BTC
    'smart-contract': { min: 0.15, max: 0.3 },   // ETH, ADA
    'defi': { min: 0.1, max: 0.25 },             // UNI, AAVE
    'payments': { min: 0.05, max: 0.15 },        // XRP, XLM
    'gaming': { min: 0.05, max: 0.15 },          // AXS, SAND
    'cash': { min: 0.1, max: 0.3 }               // 현금
  },
  
  checkBalance: function(portfolio) {
    const sectorWeights = this.calculateSectorWeights(portfolio);
    const imbalances = [];
    
    for (const [sector, limits] of Object.entries(this.recommended)) {
      const weight = sectorWeights[sector] || 0;
      
      if (weight < limits.min) {
        imbalances.push({
          sector: sector,
          current: weight,
          target: limits.min,
          action: 'INCREASE'
        });
      } else if (weight > limits.max) {
        imbalances.push({
          sector: sector,
          current: weight,
          target: limits.max,
          action: 'DECREASE'
        });
      }
    }
    
    return imbalances;
  }
};
\`\`\`

## 시스템적 리스크

### 시장 전체 리스크
\`\`\`javascript
class SystemicRiskMonitor {
  constructor() {
    this.indicators = {
      fearGreedIndex: 0,
      marketCap: 0,
      volume: 0,
      dominance: 0,
      correlation: 0
    };
  }
  
  assessMarketRisk() {
    const risks = [];
    
    // 극단적 탐욕/공포
    if (this.indicators.fearGreedIndex > 80) {
      risks.push({
        type: 'EXTREME_GREED',
        level: 'HIGH',
        recommendation: 'REDUCE_EXPOSURE'
      });
    } else if (this.indicators.fearGreedIndex < 20) {
      risks.push({
        type: 'EXTREME_FEAR',
        level: 'MEDIUM',
        recommendation: 'PREPARE_CASH'
      });
    }
    
    // 높은 상관관계 (시장 동조화)
    if (this.indicators.correlation > 0.8) {
      risks.push({
        type: 'HIGH_CORRELATION',
        level: 'HIGH',
        recommendation: 'INCREASE_CASH_POSITION'
      });
    }
    
    return {
      overallRisk: this.calculateOverallRisk(risks),
      risks: risks,
      recommendations: this.generateRecommendations(risks)
    };
  }
}
\`\`\`

## 리스크 대응 전략

### 동적 헤징
\`\`\`javascript
class DynamicHedging {
  constructor(portfolio) {
    this.portfolio = portfolio;
    this.hedgeRatio = 0;
  }
  
  calculateOptimalHedge() {
    const marketRisk = this.assessMarketRisk();
    const portfolioBeta = this.calculatePortfolioBeta();
    
    // 헤지 비율 결정
    if (marketRisk > 0.7) {
      this.hedgeRatio = Math.min(0.5, portfolioBeta * 0.3);
    } else if (marketRisk > 0.5) {
      this.hedgeRatio = Math.min(0.3, portfolioBeta * 0.2);
    } else {
      this.hedgeRatio = 0;
    }
    
    return {
      hedgeRatio: this.hedgeRatio,
      hedgeAmount: this.portfolio.totalValue * this.hedgeRatio,
      instruments: this.selectHedgeInstruments()
    };
  }
  
  selectHedgeInstruments() {
    return [
      { type: 'STABLE_COIN', allocation: 0.6 },
      { type: 'INVERSE_ETF', allocation: 0.3 },
      { type: 'PUT_OPTIONS', allocation: 0.1 }
    ];
  }
}
\`\`\`

### 리스크 한도 설정
\`\`\`javascript
const riskLimits = {
  daily: {
    maxLoss: 0.05,          // 5%
    maxVolatility: 0.03,    // 3%
    maxNewPositions: 3
  },
  
  weekly: {
    maxLoss: 0.10,          // 10%
    maxDrawdown: 0.15       // 15%
  },
  
  position: {
    maxSize: 0.20,          // 20%
    maxLeverage: 1.0,       // No leverage
    minDiversification: 5   // 최소 5개 종목
  },
  
  checkLimits: function(current) {
    const breaches = [];
    
    // 일일 한도 체크
    if (current.dailyLoss > this.daily.maxLoss) {
      breaches.push({
        type: 'DAILY_LOSS_LIMIT',
        current: current.dailyLoss,
        limit: this.daily.maxLoss,
        action: 'STOP_TRADING'
      });
    }
    
    return breaches;
  }
};
\`\`\`

## 리스크 리포팅

### 일일 리스크 보고서
\`\`\`javascript
function generateRiskReport(portfolio) {
  return {
    date: new Date().toISOString(),
    
    summary: {
      totalRisk: 'MEDIUM',
      riskScore: 65,
      changes: '+5 from yesterday'
    },
    
    metrics: {
      portfolioVolatility: 0.0234,  // 2.34%
      var95: -0.0156,                // -1.56%
      maxDrawdown: -0.0823,          // -8.23%
      sharpeRatio: 1.45,
      beta: 0.87
    },
    
    concentrations: {
      largestPosition: { symbol: 'BTC', weight: 0.35 },
      topThree: 0.72,  // 72%
      herfindahlIndex: 0.2341
    },
    
    alerts: [
      'ETH 포지션이 25% 초과',
      '상관관계 0.85로 상승',
      '일일 변동성 한도 근접'
    ],
    
    recommendations: [
      '고상관 자산 비중 축소',
      '현금 비중 10%로 증가',
      '신규 포지션 진입 보류'
    ]
  };
}
\`\`\`

<div class="success">
✅ **핵심**: 리스크를 제거하는 것이 아니라 관리하는 것이 목표입니다.
</div>

<div class="info">
💡 **팁**: 포트폴리오 리스크는 개별 리스크의 합보다 작을 수 있습니다 (분산 효과).
</div>
    `,
  },
  'risk-management.capital-management': {
    title: '자금 관리 원칙',
    content: `
# 자금 관리 원칙

## 자금 관리의 기본

### 2% 규칙
\`\`\`javascript
const twoPercentRule = {
  principle: "한 번의 거래에서 전체 자본의 2% 이상 위험 노출 금지",
  
  calculatePositionSize: function(capital, entryPrice, stopLoss) {
    const riskAmount = capital * 0.02;
    const riskPerCoin = entryPrice - stopLoss;
    const positionSize = riskAmount / riskPerCoin;
    
    return {
      maxRisk: riskAmount,
      positionSize: positionSize,
      totalInvestment: positionSize * entryPrice,
      example: {
        capital: 10000000,      // 1천만원
        maxRisk: 200000,        // 20만원
        entry: 50000,
        stop: 47500,
        riskPerCoin: 2500,
        coins: 80,              // 200000 / 2500
        investment: 4000000     // 80 * 50000
      }
    };
  }
};
\`\`\`

### 포지션 사이징 피라미드
\`\`\`
자본 배분 구조:
         /\\
        /  \\  핵심 자산 (40%)
       /    \\  - BTC, ETH
      /------\\
     /        \\ 주요 알트 (30%)
    /          \\ - 시가총액 상위
   /------------\\
  /              \\ 실험적 투자 (20%)
 /                \\ - 신규 프로젝트
/__________________\\
     예비 자금 (10%)
\`\`\`

## 자금 배분 전략

### 1. 고정 비율 방식
\`\`\`javascript
class FixedAllocation {
  constructor(capital) {
    this.totalCapital = capital;
    this.allocation = {
      trading: 0.7,      // 70% 거래용
      reserve: 0.2,      // 20% 예비금
      emergency: 0.1     // 10% 비상금
    };
  }
  
  getAllocations() {
    return {
      trading: this.totalCapital * this.allocation.trading,
      reserve: this.totalCapital * this.allocation.reserve,
      emergency: this.totalCapital * this.allocation.emergency
    };
  }
  
  rebalance() {
    const current = this.getCurrentBalances();
    const target = this.getAllocations();
    
    const adjustments = {};
    for (const [category, targetAmount] of Object.entries(target)) {
      adjustments[category] = targetAmount - current[category];
    }
    
    return adjustments;
  }
}
\`\`\`

### 2. 동적 배분 방식
\`\`\`javascript
class DynamicAllocation {
  constructor(capital) {
    this.capital = capital;
    this.marketConditions = this.assessMarket();
  }
  
  calculateAllocation() {
    const { trend, volatility, sentiment } = this.marketConditions;
    
    let tradingRatio = 0.5;  // 기본 50%
    
    // 시장 상황에 따라 조정
    if (trend === 'STRONG_UP') {
      tradingRatio += 0.2;
    } else if (trend === 'STRONG_DOWN') {
      tradingRatio -= 0.2;
    }
    
    // 변동성에 따라 조정
    if (volatility > 0.03) {  // 3% 이상
      tradingRatio -= 0.1;
    }
    
    // 심리 지표 반영
    if (sentiment < 30) {  // 극도의 공포
      tradingRatio += 0.1;  // 역발상
    } else if (sentiment > 70) {  // 극도의 탐욕
      tradingRatio -= 0.1;
    }
    
    // 범위 제한
    tradingRatio = Math.max(0.3, Math.min(0.8, tradingRatio));
    
    return {
      trading: this.capital * tradingRatio,
      reserve: this.capital * (1 - tradingRatio)
    };
  }
}
\`\`\`

### 3. 계층적 자금 관리
\`\`\`javascript
class TieredCapitalManagement {
  constructor(totalCapital) {
    this.tiers = [
      {
        name: "Core",
        allocation: 0.4,
        maxPositions: 2,
        assets: ["BTC", "ETH"],
        riskLevel: "LOW"
      },
      {
        name: "Satellite",
        allocation: 0.3,
        maxPositions: 5,
        assets: ["ADA", "DOT", "LINK", "UNI", "AAVE"],
        riskLevel: "MEDIUM"
      },
      {
        name: "Speculative",
        allocation: 0.2,
        maxPositions: 10,
        assets: ["small_caps"],
        riskLevel: "HIGH"
      },
      {
        name: "Cash",
        allocation: 0.1,
        maxPositions: 0,
        assets: ["KRW", "USDT"],
        riskLevel: "NONE"
      }
    ];
  }
  
  allocateToTier(tier, amount) {
    const maxAllocation = this.totalCapital * tier.allocation;
    const currentAllocation = this.getCurrentTierAllocation(tier);
    const availableSpace = maxAllocation - currentAllocation;
    
    if (amount > availableSpace) {
      throw new Error(\`초과 배분: \\\${tier.name} 티어 한도 초과\`);
    }
    
    // 티어 내 분산
    const perPosition = amount / tier.maxPositions;
    
    return {
      tier: tier.name,
      totalAmount: amount,
      perPosition: perPosition,
      positions: tier.maxPositions
    };
  }
}
\`\`\`

## 복리 효과 활용

### 복리 재투자 전략
\`\`\`javascript
class CompoundingStrategy {
  constructor(initialCapital) {
    this.initialCapital = initialCapital;
    this.currentCapital = initialCapital;
    this.reinvestmentRatio = 0.7;  // 수익의 70% 재투자
  }
  
  processProfit(profit) {
    const reinvest = profit * this.reinvestmentRatio;
    const withdraw = profit * (1 - this.reinvestmentRatio);
    
    this.currentCapital += reinvest;
    
    return {
      reinvested: reinvest,
      withdrawn: withdraw,
      newCapital: this.currentCapital,
      growth: (this.currentCapital - this.initialCapital) / this.initialCapital
    };
  }
  
  calculateProjection(monthlyReturn, months) {
    let capital = this.currentCapital;
    const projection = [capital];
    
    for (let i = 0; i < months; i++) {
      const monthlyProfit = capital * monthlyReturn;
      const reinvest = monthlyProfit * this.reinvestmentRatio;
      capital += reinvest;
      projection.push(capital);
    }
    
    return {
      projection: projection,
      finalCapital: capital,
      totalReturn: (capital - this.currentCapital) / this.currentCapital,
      chart: this.generateChart(projection)
    };
  }
}
\`\`\`

### 인출 전략
\`\`\`javascript
const withdrawalStrategies = {
  // 정액 인출
  fixed: {
    amount: 1000000,  // 월 100만원
    execute: function(capital, profit) {
      if (profit >= this.amount) {
        return {
          withdraw: this.amount,
          reinvest: profit - this.amount
        };
      }
      return { withdraw: 0, reinvest: profit };
    }
  },
  
  // 정률 인출
  percentage: {
    rate: 0.3,  // 수익의 30%
    execute: function(capital, profit) {
      return {
        withdraw: profit * this.rate,
        reinvest: profit * (1 - this.rate)
      };
    }
  },
  
  // 목표 달성 인출
  target: {
    goal: 50000000,  // 5천만원 목표
    execute: function(capital, profit) {
      if (capital >= this.goal) {
        // 목표 초과분 인출
        const excess = capital - this.goal;
        return {
          withdraw: Math.min(excess, profit),
          reinvest: Math.max(0, profit - excess)
        };
      }
      return { withdraw: 0, reinvest: profit };
    }
  }
};
\`\`\`

## 자금 보호 메커니즘

### 단계적 진입/청산
\`\`\`javascript
class ScaledEntry {
  constructor(totalAmount, levels = 3) {
    this.totalAmount = totalAmount;
    this.levels = levels;
    this.executed = 0;
  }
  
  // 분할 매수
  getEntryLevels(currentPrice) {
    const levels = [];
    const amountPerLevel = this.totalAmount / this.levels;
    
    // 가격 레벨 설정 (2% 간격)
    for (let i = 0; i < this.levels; i++) {
      levels.push({
        level: i + 1,
        price: currentPrice * (1 - 0.02 * i),
        amount: amountPerLevel,
        condition: \`\\\${i * 2}% 하락 시\`
      });
    }
    
    return levels;
  }
  
  // 분할 매도
  getExitLevels(avgPrice, currentHolding) {
    return [
      {
        target: avgPrice * 1.05,
        amount: currentHolding * 0.3,
        reason: "첫 목표가 (5%)"
      },
      {
        target: avgPrice * 1.10,
        amount: currentHolding * 0.4,
        reason: "주 목표가 (10%)"
      },
      {
        target: avgPrice * 1.15,
        amount: currentHolding * 0.3,
        reason: "최종 목표가 (15%)"
      }
    ];
  }
}
\`\`\`

### 자금 동결 시스템
\`\`\`javascript
class CapitalLockSystem {
  constructor() {
    this.locks = new Map();
    this.rules = {
      dailyLossLimit: 0.05,     // 5%
      weeklyLossLimit: 0.10,    // 10%
      consecutiveLosses: 3,
      lockDuration: 86400000    // 24시간
    };
  }
  
  checkAndLock(tradingResult) {
    // 일일 손실 한도
    if (tradingResult.dailyLoss > this.rules.dailyLossLimit) {
      this.lockCapital('DAILY_LOSS_LIMIT', this.rules.lockDuration);
    }
    
    // 연속 손실
    if (tradingResult.consecutiveLosses >= this.rules.consecutiveLosses) {
      this.lockCapital('CONSECUTIVE_LOSSES', this.rules.lockDuration * 2);
    }
    
    // 주간 손실 한도
    if (tradingResult.weeklyLoss > this.rules.weeklyLossLimit) {
      this.lockCapital('WEEKLY_LOSS_LIMIT', this.rules.lockDuration * 7);
    }
  }
  
  lockCapital(reason, duration) {
    this.locks.set(reason, {
      timestamp: Date.now(),
      duration: duration,
      unlockTime: Date.now() + duration
    });
    
    console.log(\`🔒 자금 동결: \\\${reason}\`);
    console.log(\`해제 시간: \\\${new Date(Date.now() + duration)}\`);
  }
  
  canTrade() {
    for (const [reason, lock] of this.locks) {
      if (Date.now() < lock.unlockTime) {
        return {
          allowed: false,
          reason: reason,
          remainingTime: lock.unlockTime - Date.now()
        };
      }
    }
    return { allowed: true };
  }
}
\`\`\`

## 자금 관리 체크리스트

### 일일 점검 사항
\`\`\`javascript
const dailyCapitalCheckList = {
  morning: [
    "총 자본 확인",
    "포지션별 비중 확인",
    "예비금 잔액 확인",
    "어제 손익 분석",
    "오늘 거래 한도 설정"
  ],
  
  trading: [
    "주문 전 자금 확인",
    "포지션 크기 계산",
    "리스크 한도 체크",
    "상관관계 확인"
  ],
  
  closing: [
    "일일 결산",
    "한도 초과 확인",
    "내일 자금 계획",
    "리밸런싱 필요성"
  ],
  
  performCheck: function() {
    const results = {};
    const timestamp = new Date();
    
    // 시간대별 체크리스트 선택
    const hour = timestamp.getHours();
    let checklist;
    
    if (hour < 9) checklist = this.morning;
    else if (hour < 18) checklist = this.trading;
    else checklist = this.closing;
    
    checklist.forEach(item => {
      results[item] = this.checkItem(item);
    });
    
    return results;
  }
};
\`\`\`

<div class="success">
✅ **황금률**: 잃을 수 있는 돈만 투자하세요. 생활비는 절대 사용하지 마세요.
</div>

<div class="warning">
⚠️ **경고**: 자금 관리 규칙을 어기는 순간, 투자가 아닌 도박이 됩니다.
</div>
    `,
  },
  'risk-management.monitoring': {
    title: '실시간 리스크 모니터링',
    content: `
# 실시간 리스크 모니터링

## 모니터링 시스템 구축

### 실시간 리스크 대시보드
\`\`\`javascript
class RiskMonitoringDashboard {
  constructor() {
    this.metrics = {
      portfolio: new PortfolioMetrics(),
      market: new MarketMetrics(),
      system: new SystemMetrics(),
      alerts: new AlertSystem()
    };
    
    this.updateInterval = 1000;  // 1초
    this.criticalCheckInterval = 100;  // 0.1초 (중요 지표)
  }
  
  startMonitoring() {
    // 중요 지표 모니터링
    setInterval(() => {
      this.checkCriticalMetrics();
    }, this.criticalCheckInterval);
    
    // 일반 지표 모니터링
    setInterval(() => {
      this.updateAllMetrics();
    }, this.updateInterval);
  }
  
  checkCriticalMetrics() {
    // 손실 한도 체크
    const currentLoss = this.metrics.portfolio.getDailyLoss();
    if (currentLoss > 0.05) {  // 5% 초과
      this.metrics.alerts.trigger('CRITICAL_LOSS', {
        current: currentLoss,
        limit: 0.05,
        action: 'STOP_ALL_TRADING'
      });
    }
    
    // 시스템 이상 체크
    if (this.metrics.system.getLatency() > 1000) {  // 1초 초과
      this.metrics.alerts.trigger('SYSTEM_LATENCY', {
        latency: this.metrics.system.getLatency(),
        impact: 'HIGH'
      });
    }
  }
}
\`\`\`

### 주요 모니터링 지표
\`\`\`javascript
const monitoringMetrics = {
  // 포트폴리오 메트릭
  portfolio: {
    totalValue: {
      current: 0,
      change24h: 0,
      changePercent: 0,
      alert: { threshold: -0.10 }  // -10%
    },
    
    unrealizedPnL: {
      amount: 0,
      percent: 0,
      byPosition: {}
    },
    
    exposure: {
      total: 0,
      byAsset: {},
      concentration: 0,
      alert: { maxSingle: 0.30 }  // 30%
    }
  },
  
  // 시장 메트릭
  market: {
    volatility: {
      current: 0,
      average: 0,
      spike: false,
      alert: { threshold: 0.05 }  // 5%
    },
    
    correlation: {
      matrix: {},
      average: 0,
      alert: { threshold: 0.80 }  // 80%
    },
    
    liquidity: {
      bidAskSpread: {},
      depth: {},
      alert: { minDepth: 1000000 }  // 100만원
    }
  },
  
  // 시스템 메트릭
  system: {
    apiHealth: {
      upbit: { status: 'OK', latency: 0 },
      claude: { status: 'OK', latency: 0 }
    },
    
    orderExecution: {
      successRate: 0,
      avgSlippage: 0,
      failedOrders: []
    },
    
    resources: {
      cpu: 0,
      memory: 0,
      network: 0
    }
  }
};
\`\`\`

## 경보 시스템

### 다단계 경보 체계
\`\`\`javascript
class AlertSystem {
  constructor() {
    this.levels = {
      INFO: { color: 'blue', sound: false, pause: false },
      WARNING: { color: 'yellow', sound: true, pause: false },
      CRITICAL: { color: 'red', sound: true, pause: true },
      EMERGENCY: { color: 'red', sound: true, pause: true, notify: true }
    };
    
    this.activeAlerts = new Map();
    this.alertHistory = [];
  }
  
  trigger(alertType, data) {
    const alert = {
      id: this.generateId(),
      type: alertType,
      level: this.determineLevel(alertType, data),
      data: data,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.activeAlerts.set(alert.id, alert);
    this.processAlert(alert);
    
    return alert.id;
  }
  
  processAlert(alert) {
    const level = this.levels[alert.level];
    
    // 시각적 알림
    this.showVisualAlert(alert, level);
    
    // 소리 알림
    if (level.sound) {
      this.playAlertSound(alert.level);
    }
    
    // 거래 일시정지
    if (level.pause) {
      this.pauseTrading(alert);
    }
    
    // 외부 알림 (이메일, 메신저)
    if (level.notify) {
      this.sendExternalNotification(alert);
    }
    
    // 자동 대응
    this.executeAutoResponse(alert);
  }
  
  executeAutoResponse(alert) {
    const responses = {
      'CRITICAL_LOSS': () => {
        this.stopAllTrading();
        this.closeHighRiskPositions();
      },
      
      'MARGIN_CALL': () => {
        this.reduceLeverage();
        this.closeLosingPositions();
      },
      
      'SYSTEM_FAILURE': () => {
        this.activateFailsafe();
        this.notifyAdministrator();
      },
      
      'UNUSUAL_ACTIVITY': () => {
        this.freezeAccount();
        this.logSecurityEvent();
      }
    };
    
    if (responses[alert.type]) {
      responses[alert.type]();
    }
  }
}
\`\`\`

### 경보 규칙 설정
\`\`\`javascript
const alertRules = {
  portfolio: [
    {
      name: "일일 손실 한도",
      condition: (metrics) => metrics.dailyLoss > 0.05,
      level: "CRITICAL",
      message: "일일 손실 5% 초과"
    },
    {
      name: "포지션 집중도",
      condition: (metrics) => Math.max(...Object.values(metrics.weights)) > 0.30,
      level: "WARNING",
      message: "단일 포지션 30% 초과"
    },
    {
      name: "급격한 자산 변동",
      condition: (metrics) => Math.abs(metrics.change1h) > 0.10,
      level: "WARNING",
      message: "1시간 내 10% 이상 변동"
    }
  ],
  
  market: [
    {
      name: "극단적 변동성",
      condition: (metrics) => metrics.volatility > 0.10,
      level: "CRITICAL",
      message: "시장 변동성 10% 초과"
    },
    {
      name: "플래시 크래시",
      condition: (metrics) => metrics.change1m < -0.05,
      level: "EMERGENCY",
      message: "1분 내 5% 이상 급락"
    }
  ],
  
  system: [
    {
      name: "API 연결 끊김",
      condition: (metrics) => metrics.apiStatus !== 'OK',
      level: "CRITICAL",
      message: "거래소 API 연결 실패"
    },
    {
      name: "높은 지연시간",
      condition: (metrics) => metrics.latency > 5000,
      level: "WARNING",
      message: "API 응답 5초 초과"
    }
  ]
};
\`\`\`

## 실시간 분석 도구

### 리스크 히트맵
\`\`\`javascript
class RiskHeatmap {
  constructor() {
    this.grid = this.initializeGrid();
    this.colorScale = {
      safe: '#00ff00',
      caution: '#ffff00',
      warning: '#ff9900',
      danger: '#ff0000'
    };
  }
  
  updateHeatmap(positions) {
    const heatmapData = [];
    
    positions.forEach(position => {
      const riskScore = this.calculateRiskScore(position);
      
      heatmapData.push({
        symbol: position.symbol,
        weight: position.weight,
        volatility: position.volatility,
        correlation: position.correlationWithPortfolio,
        riskScore: riskScore,
        color: this.getColor(riskScore),
        details: {
          var: position.valueAtRisk,
          beta: position.beta,
          drawdown: position.currentDrawdown
        }
      });
    });
    
    return this.renderHeatmap(heatmapData);
  }
  
  calculateRiskScore(position) {
    let score = 0;
    
    // 포지션 크기 리스크 (0-40점)
    score += Math.min(40, position.weight * 100 * 1.5);
    
    // 변동성 리스크 (0-30점)
    score += Math.min(30, position.volatility * 100 * 3);
    
    // 상관관계 리스크 (0-20점)
    score += Math.min(20, position.correlation * 20);
    
    // 손실 리스크 (0-10점)
    if (position.unrealizedPnL < 0) {
      score += Math.min(10, Math.abs(position.unrealizedPnL) * 0.5);
    }
    
    return score;
  }
}
\`\`\`

### 스트레스 테스트
\`\`\`javascript
class StressTest {
  constructor(portfolio) {
    this.portfolio = portfolio;
    this.scenarios = this.defineScenarios();
  }
  
  defineScenarios() {
    return [
      {
        name: "시장 폭락",
        changes: { BTC: -0.30, ETH: -0.35, alts: -0.40 }
      },
      {
        name: "규제 발표",
        changes: { all: -0.20, volume: -0.50 }
      },
      {
        name: "거래소 해킹",
        changes: { exchange: -0.25, confidence: -0.80 }
      },
      {
        name: "글로벌 금융위기",
        changes: { all: -0.40, correlation: 0.95 }
      }
    ];
  }
  
  runStressTest() {
    const results = [];
    
    this.scenarios.forEach(scenario => {
      const impact = this.simulateScenario(scenario);
      
      results.push({
        scenario: scenario.name,
        portfolioValue: impact.newValue,
        loss: impact.loss,
        lossPercent: impact.lossPercent,
        worstPosition: impact.worstPosition,
        survivalProbability: impact.survivalProbability,
        recommendations: this.generateRecommendations(impact)
      });
    });
    
    return {
      timestamp: Date.now(),
      currentValue: this.portfolio.totalValue,
      results: results,
      worstCase: this.findWorstCase(results),
      resilience: this.calculateResilience(results)
    };
  }
  
  simulateScenario(scenario) {
    let newValue = 0;
    const impacts = [];
    
    this.portfolio.positions.forEach(position => {
      const change = this.getScenarioChange(position.symbol, scenario);
      const newPositionValue = position.value * (1 + change);
      const loss = position.value - newPositionValue;
      
      impacts.push({
        symbol: position.symbol,
        oldValue: position.value,
        newValue: newPositionValue,
        loss: loss,
        changePercent: change * 100
      });
      
      newValue += newPositionValue;
    });
    
    return {
      newValue: newValue,
      loss: this.portfolio.totalValue - newValue,
      lossPercent: (this.portfolio.totalValue - newValue) / this.portfolio.totalValue,
      impacts: impacts,
      worstPosition: impacts.reduce((a, b) => a.loss > b.loss ? a : b)
    };
  }
}
\`\`\`

## 자동 대응 시스템

### 리스크 기반 자동 조치
\`\`\`javascript
class AutoRiskResponse {
  constructor() {
    this.triggers = this.defineTriggers();
    this.actions = this.defineActions();
    this.executed = new Set();
  }
  
  defineTriggers() {
    return [
      {
        id: 'PORTFOLIO_LOSS_5',
        condition: (m) => m.portfolio.dailyLoss > 0.05,
        action: 'REDUCE_EXPOSURE',
        priority: 1
      },
      {
        id: 'PORTFOLIO_LOSS_10',
        condition: (m) => m.portfolio.dailyLoss > 0.10,
        action: 'EMERGENCY_LIQUIDATION',
        priority: 0
      },
      {
        id: 'HIGH_CORRELATION',
        condition: (m) => m.market.avgCorrelation > 0.85,
        action: 'INCREASE_DIVERSIFICATION',
        priority: 2
      },
      {
        id: 'VOLATILITY_SPIKE',
        condition: (m) => m.market.volatility > m.market.avgVolatility * 2,
        action: 'REDUCE_POSITION_SIZES',
        priority: 1
      }
    ];
  }
  
  defineActions() {
    return {
      REDUCE_EXPOSURE: async () => {
        // 고위험 포지션부터 축소
        const positions = await this.getPositionsByRisk();
        for (const position of positions.slice(0, 3)) {
          await this.reducePosition(position.symbol, 0.5);
        }
      },
      
      EMERGENCY_LIQUIDATION: async () => {
        // 모든 포지션 청산
        await this.closeAllPositions();
        await this.notifyEmergency();
      },
      
      INCREASE_DIVERSIFICATION: async () => {
        // 상관관계 높은 자산 매도
        const correlated = await this.findHighlyCorrelated();
        await this.rebalancePortfolio(correlated);
      },
      
      REDUCE_POSITION_SIZES: async () => {
        // 전체 포지션 20% 축소
        await this.scaleDownAllPositions(0.8);
      }
    };
  }
  
  async checkAndExecute(metrics) {
    // 우선순위 순으로 정렬
    const triggeredActions = this.triggers
      .filter(t => t.condition(metrics))
      .sort((a, b) => a.priority - b.priority);
    
    for (const trigger of triggeredActions) {
      if (!this.executed.has(trigger.id)) {
        console.log(\`🚨 자동 대응 실행: \\\${trigger.action}\`);
        
        await this.actions[trigger.action]();
        this.executed.add(trigger.id);
        
        // 쿨다운 설정
        setTimeout(() => {
          this.executed.delete(trigger.id);
        }, 3600000);  // 1시간
      }
    }
  }
}
\`\`\`

### 회복 모니터링
\`\`\`javascript
class RecoveryMonitor {
  constructor() {
    this.drawdownStart = null;
    this.peakValue = 0;
    this.recoveryPhase = false;
  }
  
  trackRecovery(currentValue) {
    // 신고점 갱신
    if (currentValue > this.peakValue) {
      if (this.recoveryPhase) {
        // 회복 완료
        const recoveryTime = Date.now() - this.drawdownStart;
        console.log(\`✅ 손실 회복 완료: \\\\\${this.formatDuration(recoveryTime)}\`);
        
        this.recoveryPhase = false;
      }
      this.peakValue = currentValue;
    }
    
    // 낙폭 시작
    const drawdown = (this.peakValue - currentValue) / this.peakValue;
    if (drawdown > 0.05 && !this.recoveryPhase) {
      this.drawdownStart = Date.now();
      this.recoveryPhase = true;
      console.log(\`📉 낙폭 시작: -\\\${(drawdown * 100).toFixed(2)}%\`);
    }
    
    // 회복 진행률
    if (this.recoveryPhase) {
      const recoveryProgress = (currentValue - this.troughValue) / 
                             (this.peakValue - this.troughValue);
      
      return {
        inRecovery: true,
        drawdown: drawdown,
        recoveryProgress: recoveryProgress,
        timeElapsed: Date.now() - this.drawdownStart
      };
    }
    
    return { inRecovery: false };
  }
}
\`\`\`

<div class="success">
✅ **핵심**: 실시간 모니터링은 문제를 조기에 발견하고 대응할 수 있게 합니다.
</div>

<div class="warning">
⚠️ **주의**: 너무 민감한 알림 설정은 오히려 중요한 신호를 놓치게 할 수 있습니다.
</div>
    `,
  },
  'risk-management.var': {
    title: 'VaR (Value at Risk)',
    content: `
# VaR (Value at Risk) ✨ NEW

## 개요

VaR는 **특정 신뢰수준에서 특정 기간 동안 발생할 수 있는 최대 예상 손실**을 측정하는 리스크 관리 지표입니다.

<div class="success">
✅ **핵심**: "95% 신뢰수준에서 내일 최대 5% 손실" = 20일 중 1일은 5% 이상 손실 가능
</div>

## VaR 계산 방법

### 1. 모수적 방법 (Parametric)
\`\`\`javascript
// 정규분포 가정하에 계산
{
  "method": "parametric",
  "assumption": "수익률이 정규분포를 따름",
  "formula": "VaR = μ - σ × Z",
  "where": {
    "μ": "평균 수익률",
    "σ": "표준편차",
    "Z": "신뢰수준 Z-score (95%: 1.645)"
  }
}
\`\`\`

### 2. 역사적 방법 (Historical)
\`\`\`javascript
// 과거 데이터의 실제 분포 사용
{
  "method": "historical",
  "advantage": "분포 가정 불필요",
  "process": [
    "과거 수익률 정렬",
    "하위 5% 지점 찾기",
    "해당 값이 VaR"
  ]
}
\`\`\`

### 3. 몬테카를로 시뮬레이션
\`\`\`javascript
// 10,000번 시뮬레이션
{
  "method": "monte-carlo",
  "simulations": 10000,
  "advantage": "복잡한 포트폴리오에 적합",
  "accuracy": "매우 높음"
}
\`\`\`

## VaR 해석 방법

### 실제 예시
\`\`\`
포트폴리오 가치: 1,000만원
일일 VaR (95%): 50만원 (5%)

해석:
- 95% 확률로 내일 손실이 50만원 이하
- 5% 확률로 50만원 초과 손실 가능
- 한 달(20일) 중 1일은 50만원 이상 손실 예상
\`\`\`

### 시간 스케일링
\`\`\`javascript
// 제곱근 법칙 적용
const dailyVaR = 50000;  // 일일 VaR

const weeklyVaR = dailyVaR * Math.sqrt(7);   // 132,288원
const monthlyVaR = dailyVaR * Math.sqrt(30); // 273,861원
const yearlyVaR = dailyVaR * Math.sqrt(252); // 793,725원
\`\`\`

## CVaR (Conditional VaR)

### Expected Shortfall
\`\`\`
VaR를 초과하는 손실의 평균값

예시:
- VaR (95%): 5%
- CVaR (95%): 7.5%

의미: 최악의 5% 상황에서 평균 7.5% 손실
\`\`\`

## 포트폴리오 VaR

### 상관관계 고려
\`\`\`javascript
// 분산 포트폴리오의 이점
{
  "BTC_VaR": "5%",
  "ETH_VaR": "7%",
  "portfolio_VaR": "4.5%",  // 단순 합보다 작음
  "reason": "상관관계 < 1"
}
\`\`\`

## VaR 기반 포지션 조정

### 자동 리스크 관리
\`\`\`javascript
if (VaR > 10%) {
  // 고위험: 포지션 50% 축소
  positionSize *= 0.5;
} else if (VaR > 7%) {
  // 중위험: 포지션 30% 축소
  positionSize *= 0.7;
} else if (VaR > 5%) {
  // 저위험: 포지션 10% 축소
  positionSize *= 0.9;
}
\`\`\`

## 스트레스 테스트

### 극단적 시나리오
<table>
<tr>
  <th>시나리오</th>
  <th>BTC 충격</th>
  <th>알트 충격</th>
  <th>예상 손실</th>
</tr>
<tr>
  <td>시장 급락</td>
  <td>-20%</td>
  <td>-20%</td>
  <td>20%</td>
</tr>
<tr>
  <td>BTC 도미노</td>
  <td>-30%</td>
  <td>-15%</td>
  <td>25%</td>
</tr>
<tr>
  <td>규제 리스크</td>
  <td>-40%</td>
  <td>-40%</td>
  <td>40%</td>
</tr>
<tr>
  <td>플래시 크래시</td>
  <td>-50%</td>
  <td>-50%</td>
  <td>50%</td>
</tr>
</table>

## 리스크 리포트

### 일일 체크리스트
\`\`\`
✓ 현재 VaR: 4.5%
✓ CVaR: 6.8%
✓ 최대 노출: 200만원
✓ 스트레스 테스트: 통과
✓ 권장사항: 현재 포지션 유지
\`\`\`

### VaR 한계점

<div class="warning">
⚠️ **주의사항**:
- 정규분포 가정의 한계
- 꼬리 위험(tail risk) 과소평가
- 과거 데이터 의존성
- 극단적 이벤트 예측 불가
</div>

## 실전 활용법

### 1. 포지션 크기 결정
\`\`\`javascript
const maxLoss = 100000;  // 최대 손실 한도
const VaR = 0.05;        // 5% VaR

const maxPosition = maxLoss / VaR;  // 200만원
\`\`\`

### 2. 리밸런싱 타이밍
\`\`\`
- VaR < 3%: 리스크 증가 가능
- VaR 3-7%: 적정 수준 유지
- VaR > 7%: 리스크 감소 필요
- VaR > 10%: 즉시 조치 필요
\`\`\`

### 3. 동적 조정
\`\`\`javascript
// 시장 상황에 따른 VaR 목표 조정
const targetVaR = {
  bull: 0.07,    // 상승장: 7%
  normal: 0.05,  // 평상시: 5%
  bear: 0.03,    // 하락장: 3%
  crisis: 0.02   // 위기시: 2%
};
\`\`\`

<div class="info">
💡 **팁**: VaR는 평상시 리스크 관리에 유용하지만, 극단적 상황에는 스트레스 테스트를 병행하세요.
</div>
    `,
  },
  'risk-management.auto-rebalancing': {
    title: '포트폴리오 자동 리밸런싱',
    content: `
# 포트폴리오 자동 리밸런싱 ✨ NEW

## 개요

포트폴리오 자동 리밸런싱은 **목표 비중을 유지하고 리스크를 관리**하는 핵심 기능입니다.

<div class="success">
✅ **핵심 이점**: 
- 고점 매도, 저점 매수 자동화
- 리스크 분산 유지
- 감정 배제한 체계적 관리
</div>

## 리밸런싱이란?

### 기본 개념
\`\`\`
초기 포트폴리오 (100만원)
- BTC: 40% (40만원)
- ETH: 30% (30만원)
- XRP: 30% (30만원)

3개월 후 (150만원)
- BTC: 55% (82.5만원) ↑
- ETH: 25% (37.5만원) ↓
- XRP: 20% (30만원) →

리밸런싱 후 (150만원)
- BTC: 40% (60만원) 매도 22.5
- ETH: 30% (45만원) 매수 7.5
- XRP: 30% (45만원) 매수 15
\`\`\`

## 자동 리밸런싱 설정

### 기본 설정
\`\`\`javascript
{
  "enableAutoRebalancing": true,
  "rebalanceInterval": 24,      // 24시간마다
  "rebalanceThreshold": 0.05,   // 5% 이상 차이 시
  "targetPortfolio": {
    "KRW-BTC": 0.4,   // 40%
    "KRW-ETH": 0.3,   // 30%
    "KRW-XRP": 0.1,   // 10%
    "KRW-ADA": 0.1,   // 10%
    "KRW-SOL": 0.1    // 10%
  }
}
\`\`\`

### 리밸런싱 전략

#### 1. 정기 리밸런싱
\`\`\`
- 일간: 변동성 높은 시장
- 주간: 일반적인 선택
- 월간: 장기 투자자
- 분기: 수수료 민감
\`\`\`

#### 2. 임계값 리밸런싱
\`\`\`
5% 룰: 목표 대비 5% 이상 벗어나면 실행
10% 룰: 더 여유로운 관리
Band 방식: 상하한선 설정
\`\`\`

#### 3. 혼합 전략
\`\`\`javascript
// 주간 체크 + 10% 임계값
{
  "interval": 168,     // 7일
  "threshold": 0.1,    // 10%
  "minTrade": 50000    // 최소 거래 5만원
}
\`\`\`

## VaR 기반 리밸런싱

### 리스크 제약 조건
\`\`\`javascript
{
  "maxVaR": 10,        // 최대 VaR 10%
  "minWeight": 0.05,   // 최소 비중 5%
  "maxWeight": 0.4,    // 최대 비중 40%
}

// VaR 초과 시 자동 비중 축소
if (currentVaR > maxVaR) {
  scaleFactor = maxVaR / currentVaR;
  adjustWeights(scaleFactor);
}
\`\`\`

## 리밸런싱 프로세스

### 실행 순서
\`\`\`
1. 현재 포트폴리오 분석
   └─ 각 자산 비중 계산
   
2. 목표 대비 차이 계산
   └─ 임계값 초과 확인
   
3. VaR 제약 확인
   └─ 위험도 조정
   
4. 매도 주문 실행
   └─ 자금 확보
   
5. 대기 (5초)
   └─ 체결 확인
   
6. 매수 주문 실행
   └─ 목표 비중 맞춤
\`\`\`

## 실전 예시

### 시나리오 1: BTC 급등
\`\`\`
상황: BTC 20% 상승, 비중 40% → 48%

리밸런싱:
1. BTC 8% 매도 (48% → 40%)
2. 매도 대금으로 ETH, XRP 매수
3. 결과: 고점에서 일부 차익 실현

효과: 자동으로 "Buy Low, Sell High"
\`\`\`

### 시나리오 2: 알트 시즌
\`\`\`
상황: 알트코인 전체 상승, BTC 도미넌스 하락

리밸런싱:
1. 과열된 알트 일부 매도
2. 상대적으로 저평가된 BTC 매수
3. 결과: 시장 사이클 활용

효과: 역발상 투자 자동화
\`\`\`

## 목표 포트폴리오 전략

### 보수적 전략
\`\`\`javascript
{
  "KRW-BTC": 0.5,    // 50%
  "KRW-ETH": 0.3,    // 30%
  "KRW-USDT": 0.2    // 20% (스테이블)
}
\`\`\`

### 균형 전략
\`\`\`javascript
{
  "KRW-BTC": 0.3,    // 30%
  "KRW-ETH": 0.3,    // 30%
  "KRW-XRP": 0.2,    // 20%
  "KRW-SOL": 0.1,    // 10%
  "KRW-ADA": 0.1     // 10%
}
\`\`\`

### 공격적 전략
\`\`\`javascript
{
  "KRW-ETH": 0.4,    // 40%
  "KRW-SOL": 0.3,    // 30%
  "KRW-AVAX": 0.15,  // 15%
  "KRW-MATIC": 0.15  // 15%
}
\`\`\`

## 리밸런싱 최적화

### 비용 절감
\`\`\`
1. 최소 거래 금액 설정
   - 5만원 이하 무시
   
2. 밴드 방식 사용
   - ±2% 이내 허용
   
3. 거래 수수료 고려
   - 0.05% × 2 = 0.1%
\`\`\`

### 타이밍 최적화
\`\`\`
최적 시간:
- 한국: 오전 9-10시 (거래량 많음)
- 글로벌: 뉴욕 장 마감 전후
- 피해야 할 시간: 주말, 공휴일
\`\`\`

## 성과 측정

### 리밸런싱 효과
<table>
<tr>
  <th>전략</th>
  <th>연 수익률</th>
  <th>최대 낙폭</th>
  <th>샤프 비율</th>
</tr>
<tr>
  <td>Buy & Hold</td>
  <td>+45%</td>
  <td>-55%</td>
  <td>0.82</td>
</tr>
<tr>
  <td>월간 리밸런싱</td>
  <td>+52%</td>
  <td>-42%</td>
  <td>1.24</td>
</tr>
<tr>
  <td>임계값 리밸런싱</td>
  <td>+58%</td>
  <td>-38%</td>
  <td>1.53</td>
</tr>
</table>

## 주의사항

<div class="warning">
⚠️ **주의**:
- 과도한 리밸런싱은 수수료 부담
- 세금 이벤트 발생 가능
- 상승장에서 수익 제한 가능
- 최소 5개 이상 자산 권장
</div>

## 수동 리밸런싱

### 즉시 실행
\`\`\`javascript
// API 호출
await tradingEngine.executeManualRebalancing();

// 또는 UI에서 버튼 클릭
"지금 리밸런싱" 버튼
\`\`\`

### 시뮬레이션
\`\`\`
리밸런싱 시뮬레이션:
- 현재 포트폴리오 분석
- 목표 비중과 비교
- 필요 거래 내역 표시
- 예상 수수료 계산
- 실행 여부 결정
\`\`\`

<div class="info">
💡 **팁**: 리밸런싱은 단순하지만 강력한 전략입니다. 정기적으로 실행하면 장기적으로 안정적인 수익을 얻을 수 있습니다.
</div>
    `,
  },
};