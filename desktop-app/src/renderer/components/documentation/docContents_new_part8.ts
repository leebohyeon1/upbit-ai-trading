// 백테스트와 리스크 관리 개요 섹션
export const backtestContents = {
  'backtest': {
    title: '백테스트',
    content: `
# 백테스트

## 백테스트란?

과거 데이터를 활용해 투자 전략의 성과를 검증하는 시뮬레이션입니다.

### 백테스트의 중요성
\`\`\`
✅ 전략 검증: 실제 돈을 투자하기 전 전략 테스트
✅ 위험 파악: 최대 손실, 변동성 등 사전 확인
✅ 개선점 발견: 전략의 약점과 개선 방향 도출
✅ 신뢰도 구축: 객관적 데이터 기반 의사결정
\`\`\`

### 백테스트의 한계
\`\`\`
⚠️ 과거 성과 ≠ 미래 수익
⚠️ 슬리피지, 수수료 등 실제 거래 비용 차이
⚠️ 시장 상황 변화 미반영
⚠️ 과최적화(Overfitting) 위험
\`\`\`

## 백테스트 프로세스

### 1단계: 데이터 준비
\`\`\`javascript
const backtestData = {
  period: {
    start: '2023-01-01',
    end: '2024-01-01'
  },
  
  symbols: ['BTC', 'ETH', 'XRP'],
  
  dataPoints: [
    'open', 'high', 'low', 'close',
    'volume', 'trades'
  ],
  
  interval: '1h'  // 1시간 봉
};
\`\`\`

### 2단계: 전략 설정
\`\`\`javascript
const strategy = {
  indicators: {
    rsi: { period: 14 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bollinger: { period: 20, std: 2 }
  },
  
  rules: {
    buy: {
      confidence: 70,
      conditions: ['RSI < 30', 'MACD 골든크로스']
    },
    sell: {
      takeProfit: 0.10,  // 10%
      stopLoss: -0.05    // -5%
    }
  }
};
\`\`\`

### 3단계: 시뮬레이션 실행
\`\`\`javascript
class BacktestEngine {
  constructor(data, strategy, initialCapital) {
    this.data = data;
    this.strategy = strategy;
    this.capital = initialCapital;
    this.positions = [];
    this.trades = [];
  }
  
  run() {
    for (let i = 0; i < this.data.length; i++) {
      const candle = this.data[i];
      
      // 지표 계산
      const indicators = this.calculateIndicators(i);
      
      // 매수/매도 신호 확인
      const signal = this.checkSignal(indicators);
      
      // 주문 실행
      if (signal.buy && !this.hasPosition()) {
        this.executeBuy(candle);
      } else if (signal.sell && this.hasPosition()) {
        this.executeSell(candle);
      }
      
      // 손절/익절 체크
      this.checkExitConditions(candle);
    }
    
    return this.generateReport();
  }
}
\`\`\`

<div class="info">
💡 **팁**: 백테스트는 다양한 시장 상황(상승장, 하락장, 횡보장)을 포함해야 신뢰도가 높아집니다.
</div>
    `,
  },
  'backtest.backtest-setup': {
    title: '백테스트 설정',
    content: `
# 백테스트 설정

## 기본 설정

### 테스트 기간 설정
\`\`\`javascript
const periodSettings = {
  // 권장 기간
  minimum: '6개월',    // 최소 6개월
  recommended: '1년',  // 권장 1년
  optimal: '2-3년',    // 최적 2-3년
  
  // 시장 상황별 포함
  bullMarket: true,    // 상승장
  bearMarket: true,    // 하락장
  sideways: true       // 횡보장
};
\`\`\`

### 초기 자본 설정
\`\`\`javascript
const capitalSettings = {
  initial: 10000000,        // 1천만원
  
  allocation: {
    trading: 0.8,           // 80% 거래용
    reserve: 0.2            // 20% 예비금
  },
  
  positionSizing: {
    method: 'fixed',        // 고정 크기
    maxPerTrade: 0.1,       // 거래당 10%
    maxTotal: 0.8           // 전체 80%
  }
};
\`\`\`

## 고급 설정

### 거래 비용 설정
\`\`\`javascript
const costSettings = {
  commission: {
    maker: 0.0005,          // 0.05%
    taker: 0.0005           // 0.05%
  },
  
  slippage: {
    average: 0.001,         // 0.1%
    worstCase: 0.003        // 0.3%
  },
  
  spread: {
    normal: 0.0001,         // 0.01%
    volatile: 0.0005        // 0.05%
  }
};
\`\`\`

### 리스크 관리 설정
\`\`\`javascript
const riskSettings = {
  stopLoss: {
    enabled: true,
    percentage: 0.05,       // 5%
    trailing: true
  },
  
  maxDrawdown: {
    warning: 0.15,          // 15% 경고
    stop: 0.20              // 20% 중단
  },
  
  maxConsecutiveLosses: 5,  // 연속 5회 손실 시 중단
  
  kellyFormula: {
    enabled: true,
    fraction: 0.25          // Kelly의 25% 사용
  }
};
\`\`\`

## 데이터 품질 설정

### 데이터 검증
\`\`\`javascript
class DataValidator {
  validate(data) {
    const issues = [];
    
    // 누락 데이터 확인
    const missing = data.filter(d => !d.close);
    if (missing.length > 0) {
      issues.push(\`누락 데이터: \${missing.length}개\`);
    }
    
    // 이상치 확인
    const outliers = this.findOutliers(data);
    if (outliers.length > 0) {
      issues.push(\`이상치: \${outliers.length}개\`);
    }
    
    // 데이터 연속성 확인
    const gaps = this.findTimeGaps(data);
    if (gaps.length > 0) {
      issues.push(\`시간 갭: \${gaps.length}개\`);
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}
\`\`\`

### 데이터 전처리
\`\`\`javascript
const preprocessor = {
  // 결측치 처리
  fillMissing: 'interpolate',  // 보간법
  
  // 이상치 처리
  outlierMethod: 'cap',         // 상하한 제한
  outlierThreshold: 3,          // 3 표준편차
  
  // 정규화
  normalize: false,             // 가격 데이터는 정규화 X
  
  // 조정
  adjustSplits: true,           // 분할 조정
  adjustDividends: false        // 배당 조정 (암호화폐 해당 없음)
};
\`\`\`

## 백테스트 시나리오

### 다중 시나리오 테스트
\`\`\`javascript
const scenarios = [
  {
    name: '기본 시나리오',
    slippage: 'average',
    commission: 'normal',
    marketCondition: 'normal'
  },
  {
    name: '최악 시나리오',
    slippage: 'worst',
    commission: 'high',
    marketCondition: 'crisis'
  },
  {
    name: '최적 시나리오',
    slippage: 'minimal',
    commission: 'low',
    marketCondition: 'bull'
  }
];

// 각 시나리오별 실행
scenarios.forEach(scenario => {
  const result = backtest.run(scenario);
  console.log(\`\${scenario.name}: \${result.totalReturn}%\`);
});
\`\`\`

<div class="warning">
⚠️ **주의**: 백테스트 설정이 너무 최적화되면 실제 거래에서 성과가 나오지 않을 수 있습니다.
</div>
    `,
  },
  'backtest.period-selection': {
    title: '기간 선택 가이드',
    content: `
# 기간 선택 가이드

## 적절한 백테스트 기간

### 기간별 특징
\`\`\`
단기 (3-6개월)
✅ 장점: 최근 시장 반영, 빠른 검증
❌ 단점: 통계적 신뢰도 낮음, 과최적화 위험

중기 (6개월-1년)
✅ 장점: 적절한 데이터량, 계절성 포함
❌ 단점: 장기 사이클 미포함

장기 (1-3년)
✅ 장점: 다양한 시장 포함, 높은 신뢰도
❌ 단점: 과거 시장과 현재 차이, 계산 시간
\`\`\`

### 시장 사이클 고려
\`\`\`javascript
const marketCycles = {
  bullMarket: {
    period: '2020-11 ~ 2021-11',
    characteristics: [
      'BTC 20,000 → 69,000',
      '알트코인 급등',
      '높은 변동성',
      'FOMO 심리'
    ]
  },
  
  bearMarket: {
    period: '2022-01 ~ 2022-12',
    characteristics: [
      'BTC 69,000 → 16,000',
      '유동성 감소',
      '공포 심리',
      '높은 상관관계'
    ]
  },
  
  recovery: {
    period: '2023-01 ~ 2023-12',
    characteristics: [
      '바닥 다지기',
      '변동성 감소',
      '선별적 상승',
      '기관 진입'
    ]
  }
};
\`\`\`

## 기간 선택 전략

### 1. 전체 사이클 포함
\`\`\`javascript
const fullCycleTest = {
  start: '2020-01-01',
  end: '2023-12-31',
  
  includes: [
    'COVID 폭락',
    '2021 불마켓',
    '2022 베어마켓',
    '2023 회복기'
  ],
  
  advantages: [
    '다양한 시장 상황 테스트',
    '전략의 견고성 확인',
    '실제와 유사한 조건'
  ]
};
\`\`\`

### 2. 특정 시장 집중
\`\`\`javascript
const specificMarketTest = {
  volatileMarket: {
    periods: ['2021-01 ~ 2021-05', '2022-05 ~ 2022-07'],
    purpose: '높은 변동성 대응력 테스트'
  },
  
  trendingMarket: {
    periods: ['2020-10 ~ 2021-04'],
    purpose: '추세 추종 전략 테스트'
  },
  
  sidewaysMarket: {
    periods: ['2023-06 ~ 2023-10'],
    purpose: '횡보장 전략 테스트'
  }
};
\`\`\`

### 3. 롤링 윈도우
\`\`\`javascript
class RollingWindowBacktest {
  constructor(data, windowSize, stepSize) {
    this.data = data;
    this.windowSize = windowSize;  // 365일
    this.stepSize = stepSize;      // 30일
  }
  
  run(strategy) {
    const results = [];
    
    for (let start = 0; start < this.data.length - this.windowSize; start += this.stepSize) {
      const end = start + this.windowSize;
      const windowData = this.data.slice(start, end);
      
      const result = this.backtestWindow(windowData, strategy);
      results.push({
        period: \`\${windowData[0].date} ~ \${windowData[windowData.length-1].date}\`,
        return: result.totalReturn,
        sharpe: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown
      });
    }
    
    return this.analyzeResults(results);
  }
  
  analyzeResults(results) {
    return {
      avgReturn: average(results.map(r => r.return)),
      consistency: stdDev(results.map(r => r.return)),
      worstPeriod: results.reduce((a, b) => a.return < b.return ? a : b),
      bestPeriod: results.reduce((a, b) => a.return > b.return ? a : b)
    };
  }
}
\`\`\`

## 데이터 분할 전략

### Train-Test Split
\`\`\`javascript
const dataSplit = {
  training: {
    period: '2020-01-01 ~ 2022-12-31',  // 70%
    purpose: '전략 개발 및 파라미터 최적화'
  },
  
  validation: {
    period: '2023-01-01 ~ 2023-06-30',  // 15%
    purpose: '과최적화 확인'
  },
  
  test: {
    period: '2023-07-01 ~ 2023-12-31',  // 15%
    purpose: '최종 성과 검증'
  }
};

// 주의: Test 데이터는 최종 검증에만 사용
// 전략 수정 후 Test 데이터로 재검증 금지
\`\`\`

### Walk-Forward Analysis
\`\`\`javascript
class WalkForwardAnalysis {
  constructor(data) {
    this.data = data;
    this.inSampleRatio = 0.8;   // 80% in-sample
    this.outSampleRatio = 0.2;  // 20% out-of-sample
  }
  
  analyze(strategy, windows) {
    const results = [];
    
    for (let i = 0; i < windows; i++) {
      // In-sample 최적화
      const optimized = this.optimize(
        this.getInSampleData(i),
        strategy
      );
      
      // Out-of-sample 검증
      const performance = this.validate(
        this.getOutSampleData(i),
        optimized
      );
      
      results.push({
        window: i,
        inSampleReturn: optimized.return,
        outSampleReturn: performance.return,
        efficiency: performance.return / optimized.return
      });
    }
    
    return {
      avgEfficiency: average(results.map(r => r.efficiency)),
      consistency: results.filter(r => r.efficiency > 0.5).length / windows,
      robust: average(results.map(r => r.efficiency)) > 0.7
    };
  }
}
\`\`\`

## 특수 상황 고려

### 이벤트 기간 처리
\`\`\`javascript
const eventPeriods = {
  exchanges: [
    {
      event: 'FTX 파산',
      date: '2022-11-08',
      impact: 'BTC -20%',
      duration: '2주'
    },
    {
      event: 'LUNA 붕괴',
      date: '2022-05-09',
      impact: '시장 전체 -30%',
      duration: '1개월'
    }
  ],
  
  regulation: [
    {
      event: '중국 채굴 금지',
      date: '2021-05-21',
      impact: 'BTC -50%',
      duration: '2개월'
    }
  ],
  
  // 이벤트 제외 옵션
  excludeEvents: false,  // true면 이벤트 기간 제외
  
  // 이벤트 가중치
  eventWeight: 0.5      // 이벤트 기간 결과 50% 가중치
};
\`\`\`

<div class="success">
✅ **권장**: 최소 1년 이상의 데이터를 사용하고, 다양한 시장 상황을 포함시키세요.
</div>

<div class="info">
💡 **팁**: 백테스트 기간이 길수록 신뢰도는 높아지지만, 최근 시장 특성과 달라질 수 있습니다.
</div>
    `,
  },
  'backtest.result-interpretation': {
    title: '결과 지표 해석',
    content: `
# 결과 지표 해석

## 주요 성과 지표

### 수익률 지표
\`\`\`javascript
const returnMetrics = {
  totalReturn: {
    formula: '(최종자산 - 초기자산) / 초기자산 * 100',
    interpretation: {
      excellent: '> 100%',    // 연 100% 이상
      good: '50-100%',        // 연 50-100%
      average: '20-50%',      // 연 20-50%
      poor: '< 20%'           // 연 20% 미만
    }
  },
  
  cagr: {  // 연평균 복합 성장률
    formula: '(최종자산/초기자산)^(1/년수) - 1',
    benchmark: {
      btcAvg: '60%',          // BTC 평균 연수익
      stockMarket: '10%',     // 주식시장 평균
      target: '30%+'          // 목표 수익률
    }
  },
  
  monthlyReturn: {
    average: '평균 월수익률',
    median: '중간값 월수익률',
    best: '최고 월수익률',
    worst: '최악 월수익률'
  }
};
\`\`\`

### 리스크 지표
\`\`\`javascript
const riskMetrics = {
  maxDrawdown: {
    formula: '(최고점 - 최저점) / 최고점 * 100',
    acceptable: {
      conservative: '< 10%',
      moderate: '10-20%',
      aggressive: '20-30%',
      dangerous: '> 30%'
    }
  },
  
  volatility: {
    formula: '일일 수익률의 표준편차 * √252',
    interpretation: {
      low: '< 30%',
      medium: '30-60%',
      high: '60-100%',
      extreme: '> 100%'
    }
  },
  
  var95: {  // 95% Value at Risk
    meaning: '95% 확률로 하루 최대 손실',
    calculation: 'percentile(일일손실, 5)',
    usage: '일일 리스크 한도 설정'
  }
};
\`\`\`

### 효율성 지표
\`\`\`javascript
const efficiencyMetrics = {
  sharpeRatio: {
    formula: '(수익률 - 무위험수익률) / 변동성',
    interpretation: {
      excellent: '> 2.0',     // 매우 우수
      good: '1.0-2.0',        // 우수
      acceptable: '0.5-1.0',  // 수용가능
      poor: '< 0.5'           // 개선필요
    },
    
    adjustedSharpe: {
      // 암호화폐는 24/7 거래
      formula: 'sharpe * √(365/252)'
    }
  },
  
  sortinoRatio: {
    formula: '(수익률 - 목표수익률) / 하방변동성',
    advantage: '상승 변동성은 페널티 없음',
    goodValue: '> 1.5'
  },
  
  calmarRatio: {
    formula: 'CAGR / MaxDrawdown',
    interpretation: {
      excellent: '> 2.0',
      good: '1.0-2.0',
      poor: '< 1.0'
    }
  }
};
\`\`\`

## 거래 분석 지표

### 거래 통계
\`\`\`javascript
const tradeStats = {
  winRate: {
    formula: '이익거래수 / 전체거래수 * 100',
    analysis: {
      highWinLowProfit: {
        winRate: '> 70%',
        avgWin: '< avgLoss',
        interpretation: '스캘핑 전략'
      },
      lowWinHighProfit: {
        winRate: '< 40%',
        avgWin: '> 2 * avgLoss',
        interpretation: '추세추종 전략'
      }
    }
  },
  
  profitFactor: {
    formula: '총이익 / 총손실',
    interpretation: {
      excellent: '> 2.0',
      good: '1.5-2.0',
      minimum: '> 1.2',
      fail: '< 1.0'
    }
  },
  
  expectancy: {
    formula: '(승률 * 평균이익) - (패율 * 평균손실)',
    perTrade: '거래당 기대수익',
    positive: '양수여야 수익 가능'
  }
};
\`\`\`

### 거래 패턴 분석
\`\`\`javascript
class TradePatternAnalysis {
  analyze(trades) {
    return {
      // 연속 패턴
      consecutive: {
        maxWinStreak: this.getMaxStreak(trades, 'win'),
        maxLossStreak: this.getMaxStreak(trades, 'loss'),
        avgWinStreak: this.getAvgStreak(trades, 'win'),
        avgLossStreak: this.getAvgStreak(trades, 'loss')
      },
      
      // 시간대별 분석
      timeAnalysis: {
        bestHours: this.getBestTradingHours(trades),
        worstHours: this.getWorstTradingHours(trades),
        weekdayPerformance: this.getWeekdayStats(trades)
      },
      
      // 홀딩 기간
      holdingPeriod: {
        avgWinningTrade: average(trades.filter(t => t.profit > 0).map(t => t.duration)),
        avgLosingTrade: average(trades.filter(t => t.profit < 0).map(t => t.duration)),
        optimal: this.getOptimalHoldingPeriod(trades)
      },
      
      // 포지션 크기
      positionSizing: {
        avgSize: average(trades.map(t => t.size)),
        winningSize: average(trades.filter(t => t.profit > 0).map(t => t.size)),
        losingSize: average(trades.filter(t => t.profit < 0).map(t => t.size)),
        sizeImpact: this.analyzeSizeImpact(trades)
      }
    };
  }
}
\`\`\`

## 결과 해석 가이드

### 종합 평가 체크리스트
\`\`\`javascript
const evaluationChecklist = {
  profitability: {
    totalReturn: 'positive',          // ✓ 양수 수익
    sharpeRatio: '> 1.0',            // ✓ 위험 대비 수익
    profitFactor: '> 1.5',           // ✓ 손익 비율
    monthlyPositive: '> 60%'         // ✓ 월 수익 비율
  },
  
  risk: {
    maxDrawdown: '< 20%',            // ✓ 최대 낙폭
    recoveryTime: '< 3 months',      // ✓ 회복 기간
    var95: '< 5%',                   // ✓ 일일 리스크
    correlation: '< 0.8'             // ✓ 시장 상관관계
  },
  
  consistency: {
    winRate: '> 40%',                // ✓ 승률
    profitDistribution: 'normal',    // ✓ 수익 분포
    monthlyVolatility: 'stable',     // ✓ 월간 변동성
    noLongDrawdowns: true            // ✓ 장기 손실 없음
  },
  
  robustness: {
    multiMarketTest: 'passed',       // ✓ 다양한 시장
    parameterStability: 'stable',    // ✓ 파라미터 안정성
    outOfSampleTest: 'passed',       // ✓ 샘플 외 검증
    stressTest: 'survived'           // ✓ 스트레스 테스트
  }
};
\`\`\`

### 위험 신호
\`\`\`javascript
const redFlags = {
  overOptimization: {
    signs: [
      'In-sample >> Out-of-sample 성과',
      '특정 기간만 수익',
      '파라미터 민감도 높음',
      '거래 횟수 극단적'
    ],
    solution: '파라미터 단순화, 더 긴 테스트 기간'
  },
  
  curveFitting: {
    signs: [
      '승률 > 80%',
      '모든 지표 사용',
      '복잡한 조건',
      '적은 거래 횟수'
    ],
    solution: '규칙 단순화, 일반화'
  },
  
  survivorshipBias: {
    signs: [
      '상승 종목만 테스트',
      '현재 상장 종목만',
      '단일 종목 의존'
    ],
    solution: '상장폐지 종목 포함, 다양한 종목'
  }
};
\`\`\`

## 보고서 생성

### 백테스트 리포트 구조
\`\`\`javascript
class BacktestReport {
  generate(results) {
    return {
      // 요약
      summary: {
        period: results.period,
        initialCapital: formatCurrency(results.initialCapital),
        finalCapital: formatCurrency(results.finalCapital),
        totalReturn: formatPercent(results.totalReturn),
        cagr: formatPercent(results.cagr),
        sharpeRatio: results.sharpeRatio.toFixed(2),
        maxDrawdown: formatPercent(results.maxDrawdown)
      },
      
      // 상세 분석
      detailed: {
        monthlyReturns: this.generateMonthlyTable(results),
        drawdownChart: this.generateDrawdownChart(results),
        tradeDistribution: this.generateTradeHistogram(results),
        performanceChart: this.generateEquityCurve(results)
      },
      
      // 리스크 분석
      riskAnalysis: {
        varChart: this.generateVaRChart(results),
        volatilityChart: this.generateVolatilityChart(results),
        correlationMatrix: this.generateCorrelationMatrix(results)
      },
      
      // 최종 평가
      evaluation: {
        score: this.calculateScore(results),
        strengths: this.identifyStrengths(results),
        weaknesses: this.identifyWeaknesses(results),
        recommendations: this.generateRecommendations(results)
      }
    };
  }
}
\`\`\`

<div class="warning">
⚠️ **주의**: 백테스트 결과가 아무리 좋아도 실제 거래에서는 예상치 못한 변수가 발생할 수 있습니다.
</div>

<div class="success">
✅ **핵심**: 단일 지표에 의존하지 말고, 여러 지표를 종합적으로 평가하세요.
</div>
    `,
  },
  'backtest.strategy-improvement': {
    title: '전략 개선 방법',
    content: `
# 전략 개선 방법

## 전략 최적화 프로세스

### 1단계: 현재 전략 분석
\`\`\`javascript
class StrategyAnalyzer {
  analyzeWeaknesses(backtestResults) {
    const issues = [];
    
    // 수익성 문제
    if (backtestResults.totalReturn < 0) {
      issues.push({
        type: 'PROFITABILITY',
        severity: 'HIGH',
        metrics: {
          totalReturn: backtestResults.totalReturn,
          winRate: backtestResults.winRate,
          profitFactor: backtestResults.profitFactor
        }
      });
    }
    
    // 리스크 문제
    if (backtestResults.maxDrawdown > 0.25) {
      issues.push({
        type: 'RISK',
        severity: 'HIGH',
        metrics: {
          maxDrawdown: backtestResults.maxDrawdown,
          volatility: backtestResults.volatility,
          var95: backtestResults.var95
        }
      });
    }
    
    // 일관성 문제
    if (backtestResults.monthlyWinRate < 0.5) {
      issues.push({
        type: 'CONSISTENCY',
        severity: 'MEDIUM',
        metrics: {
          monthlyWinRate: backtestResults.monthlyWinRate,
          profitStdDev: backtestResults.profitStdDev
        }
      });
    }
    
    return this.prioritizeIssues(issues);
  }
}
\`\`\`

### 2단계: 개선 영역 식별
\`\`\`javascript
const improvementAreas = {
  entryTiming: {
    current: 'RSI < 30',
    problems: ['너무 많은 가짜 신호', '늦은 진입'],
    
    improvements: [
      {
        method: 'Multi-Indicator Confirmation',
        change: 'RSI < 30 AND MACD 골든크로스',
        expected: '가짜 신호 50% 감소'
      },
      {
        method: 'Dynamic Threshold',
        change: 'RSI < (20 + volatility*10)',
        expected: '시장 상황 적응력 향상'
      }
    ]
  },
  
  exitStrategy: {
    current: '고정 5% 손절',
    problems: ['너무 타이트한 손절', '이익 실현 부족'],
    
    improvements: [
      {
        method: 'ATR-based Stop',
        change: 'Stop = Entry - 2*ATR',
        expected: '변동성 고려한 손절'
      },
      {
        method: 'Trailing Profit',
        change: '7% 이익 후 3% 트레일링',
        expected: '이익 극대화'
      }
    ]
  }
};
\`\`\`

## 파라미터 최적화

### Grid Search 최적화
\`\`\`javascript
class GridSearchOptimizer {
  constructor(strategy, parameterRanges) {
    this.strategy = strategy;
    this.parameterRanges = parameterRanges;
    this.results = [];
  }
  
  optimize(backtestData) {
    const combinations = this.generateCombinations();
    
    for (const params of combinations) {
      const result = this.backtest(backtestData, params);
      
      this.results.push({
        parameters: params,
        performance: result,
        score: this.calculateScore(result)
      });
    }
    
    return this.selectBestParameters();
  }
  
  generateCombinations() {
    // 예시: RSI 기간과 임계값 조합
    const combinations = [];
    
    for (let rsiPeriod = 10; rsiPeriod <= 20; rsiPeriod += 2) {
      for (let rsiThreshold = 20; rsiThreshold <= 40; rsiThreshold += 5) {
        for (let stopLoss = 0.03; stopLoss <= 0.07; stopLoss += 0.01) {
          combinations.push({
            rsiPeriod,
            rsiThreshold,
            stopLoss
          });
        }
      }
    }
    
    return combinations;
  }
  
  selectBestParameters() {
    // 단순 최고 수익률이 아닌 종합 점수로 선택
    const scored = this.results.map(r => ({
      ...r,
      finalScore: (
        r.performance.sharpeRatio * 0.3 +
        r.performance.profitFactor * 0.3 +
        (1 - r.performance.maxDrawdown) * 0.4
      )
    }));
    
    return scored.sort((a, b) => b.finalScore - a.finalScore)[0];
  }
}
\`\`\`

### Genetic Algorithm 최적화
\`\`\`javascript
class GeneticOptimizer {
  constructor(populationSize = 50, generations = 100) {
    this.populationSize = populationSize;
    this.generations = generations;
    this.mutationRate = 0.1;
    this.crossoverRate = 0.7;
  }
  
  evolve(strategy, backtestData) {
    let population = this.initializePopulation(strategy);
    
    for (let gen = 0; gen < this.generations; gen++) {
      // 평가
      const evaluated = population.map(individual => ({
        params: individual,
        fitness: this.evaluateFitness(individual, backtestData)
      }));
      
      // 선택
      const parents = this.selection(evaluated);
      
      // 교차
      const offspring = this.crossover(parents);
      
      // 변이
      const mutated = this.mutation(offspring);
      
      // 다음 세대
      population = this.nextGeneration(evaluated, mutated);
      
      console.log(\`Generation \${gen}: Best fitness = \${this.getBestFitness(evaluated)}\`);
    }
    
    return this.getBestIndividual(population, backtestData);
  }
}
\`\`\`

## 전략 검증 방법

### Walk-Forward Optimization
\`\`\`javascript
class WalkForwardValidator {
  validate(strategy, data, windows = 12) {
    const results = [];
    const windowSize = Math.floor(data.length / (windows + 1));
    
    for (let i = 0; i < windows; i++) {
      // In-sample 최적화
      const trainStart = i * windowSize;
      const trainEnd = (i + 1) * windowSize;
      const trainData = data.slice(trainStart, trainEnd);
      
      const optimizedParams = this.optimize(strategy, trainData);
      
      // Out-of-sample 검증
      const testStart = trainEnd;
      const testEnd = testStart + windowSize;
      const testData = data.slice(testStart, testEnd);
      
      const performance = this.backtest(
        strategy.withParams(optimizedParams),
        testData
      );
      
      results.push({
        window: i,
        trainPeriod: \`\${trainData[0].date} - \${trainData[trainData.length-1].date}\`,
        testPeriod: \`\${testData[0].date} - \${testData[testData.length-1].date}\`,
        trainPerformance: optimizedParams.performance,
        testPerformance: performance,
        efficiency: performance.return / optimizedParams.performance.return
      });
    }
    
    return this.analyzeRobustness(results);
  }
}
\`\`\`

### Monte Carlo 시뮬레이션
\`\`\`javascript
class MonteCarloValidator {
  simulate(strategy, historicalReturns, simulations = 1000) {
    const results = [];
    
    for (let i = 0; i < simulations; i++) {
      // 수익률 재배열
      const shuffledReturns = this.shuffle([...historicalReturns]);
      
      // 시뮬레이션 실행
      const simResult = this.runSimulation(strategy, shuffledReturns);
      
      results.push({
        return: simResult.totalReturn,
        maxDrawdown: simResult.maxDrawdown,
        sharpe: simResult.sharpeRatio
      });
    }
    
    return {
      confidenceIntervals: {
        return95: this.getPercentile(results.map(r => r.return), [2.5, 97.5]),
        drawdown95: this.getPercentile(results.map(r => r.maxDrawdown), [2.5, 97.5]),
        sharpe95: this.getPercentile(results.map(r => r.sharpe), [2.5, 97.5])
      },
      
      probabilities: {
        profitability: results.filter(r => r.return > 0).length / simulations,
        beatBenchmark: results.filter(r => r.return > 0.5).length / simulations,
        acceptableRisk: results.filter(r => r.maxDrawdown < 0.2).length / simulations
      }
    };
  }
}
\`\`\`

## 실전 적용 가이드

### 단계별 적용
\`\`\`javascript
const implementationPlan = {
  phase1: {
    duration: '2주',
    action: '최소 금액으로 실거래 테스트',
    objectives: [
      'API 연동 확인',
      '주문 체결 검증',
      '실제 슬리피지 측정'
    ],
    capital: '전체 자금의 5%'
  },
  
  phase2: {
    duration: '1개월',
    action: '제한된 전략 실행',
    objectives: [
      '백테스트 vs 실거래 차이 분석',
      '예상치 못한 상황 대응',
      '시스템 안정성 확인'
    ],
    capital: '전체 자금의 20%'
  },
  
  phase3: {
    duration: '3개월',
    action: '전체 전략 실행',
    objectives: [
      '성과 모니터링',
      '지속적 개선',
      '리스크 관리 검증'
    ],
    capital: '전체 자금의 50-80%'
  }
};
\`\`\`

### 지속적 개선 프로세스
\`\`\`javascript
class ContinuousImprovement {
  constructor() {
    this.performanceHistory = [];
    this.adjustmentLog = [];
  }
  
  weeklyReview(performance) {
    const analysis = {
      performance: performance,
      marketCondition: this.analyzeMarket(),
      strategyHealth: this.checkStrategyHealth(performance)
    };
    
    // 조정 필요 여부 결정
    if (this.needsAdjustment(analysis)) {
      const adjustment = this.proposeAdjustment(analysis);
      
      // 백테스트로 검증
      const validation = this.validateAdjustment(adjustment);
      
      if (validation.improvement > 0.1) {  // 10% 이상 개선
        this.applyAdjustment(adjustment);
        this.adjustmentLog.push({
          date: new Date(),
          change: adjustment,
          reason: analysis.issues,
          expected: validation
        });
      }
    }
    
    this.performanceHistory.push(analysis);
  }
  
  monthlyReport() {
    return {
      performanceSummary: this.summarizePerformance(),
      adjustmentsMade: this.adjustmentLog.filter(a => 
        a.date > new Date(Date.now() - 30*24*60*60*1000)
      ),
      recommendations: this.generateRecommendations(),
      nextSteps: this.planNextMonth()
    };
  }
}
\`\`\`

<div class="success">
✅ **핵심**: 전략 개선은 지속적인 과정입니다. 작은 개선을 꾸준히 누적시키세요.
</div>

<div class="warning">
⚠️ **주의**: 과도한 최적화는 오히려 성과를 해칠 수 있습니다. 단순함을 유지하세요.
</div>
    `,
  },
};

export const riskManagementOverview = {
  'risk-management': {
    title: '리스크 관리',
    content: `
# 리스크 관리

리스크 관리는 성공적인 투자의 핵심입니다. 수익을 극대화하는 것보다 손실을 최소화하는 것이 더 중요합니다.

## 리스크 관리의 기본 원칙

### 1. 자본 보존 우선
\`\`\`
원칙: "잃지 않는 것이 이기는 것이다"

✅ 원금 보전이 최우선
✅ 수익은 그 다음
✅ 회복 불가능한 손실 방지
\`\`\`

### 2. 계획된 리스크만 감수
\`\`\`
Before Trade:
- 최대 손실액 계산
- 리스크/리워드 비율 확인
- 포지션 크기 결정

After Trade:
- 계획대로 실행
- 감정 배제
- 결과 기록 및 분석
\`\`\`

### 3. 분산과 헤징
\`\`\`javascript
const riskDistribution = {
  byAsset: {
    BTC: 0.3,      // 30%
    ETH: 0.2,      // 20%
    Others: 0.3,   // 30%
    Cash: 0.2      // 20%
  },
  
  byStrategy: {
    trend: 0.4,    // 추세 추종 40%
    mean: 0.3,     // 평균 회귀 30%
    arb: 0.2,      // 차익 거래 20%
    hedge: 0.1     // 헤지 포지션 10%
  }
};
\`\`\`

## 리스크의 종류

### 시장 리스크
- 가격 변동 리스크
- 변동성 리스크
- 유동성 리스크
- 시스템 리스크

### 운영 리스크
- 기술적 오류
- 해킹 위험
- 거래소 리스크
- 규제 리스크

### 전략 리스크
- 모델 리스크
- 과최적화
- 시장 변화
- 경쟁 증가

## 리스크 관리 도구

### 1. 포지션 사이징
적절한 포지션 크기로 개별 거래 리스크 제한

### 2. 손절/익절
명확한 출구 전략으로 손실 제한

### 3. 포트폴리오 관리
분산 투자와 상관관계 관리

### 4. 실시간 모니터링
지속적인 리스크 측정과 대응

자세한 내용은 각 하위 섹션을 참고하세요.
    `,
  },
  'risk-management.overview': {
    title: '리스크 관리 개요',
    content: `
# 리스크 관리 개요

## 왜 리스크 관리가 중요한가?

### 수익보다 중요한 생존
\`\`\`
손실 회복에 필요한 수익률:
-10% 손실 → +11.1% 필요
-20% 손실 → +25% 필요
-50% 손실 → +100% 필요
-90% 손실 → +900% 필요
\`\`\`

큰 손실은 회복이 거의 불가능합니다. 따라서 큰 수익보다 큰 손실을 피하는 것이 중요합니다.

## 리스크 관리 체계

### 1. 사전 리스크 관리
\`\`\`javascript
const preTradeRiskCheck = {
  // 포지션 크기 제한
  positionSize: {
    maxPerTrade: 0.05,      // 거래당 5%
    maxPerAsset: 0.20,      // 자산당 20%
    maxTotal: 0.80          // 전체 80%
  },
  
  // 손실 한도
  lossLimits: {
    perTrade: 0.02,         // 거래당 2%
    daily: 0.05,            // 일일 5%
    weekly: 0.10,           // 주간 10%
    monthly: 0.20           // 월간 20%
  },
  
  // 상관관계 체크
  correlation: {
    maxCorrelation: 0.7,    // 70% 이상 상관관계 제한
    minAssets: 5            // 최소 5개 자산
  }
};
\`\`\`

### 2. 거래 중 리스크 관리
\`\`\`javascript
const duringTradeRisk = {
  // 실시간 모니터링
  monitoring: {
    priceAlert: 0.03,       // 3% 변동 알림
    volumeSpike: 2.0,       // 평균 대비 2배 거래량
    spreadWidening: 0.005   // 0.5% 스프레드 확대
  },
  
  // 자동 대응
  autoResponse: {
    stopLoss: 'immediate',
    profitProtection: 'trailing',
    emergencyExit: 'market_order'
  }
};
\`\`\`

### 3. 사후 리스크 분석
\`\`\`javascript
const postTradeAnalysis = {
  // 성과 분석
  performance: {
    actualVsExpected: 'compare',
    riskAdjustedReturn: 'calculate',
    drawdownAnalysis: 'review'
  },
  
  // 개선사항 도출
  improvements: {
    entryTiming: 'optimize',
    exitStrategy: 'refine',
    positionSizing: 'adjust'
  }
};
\`\`\`

## 리스크 측정 방법

### Value at Risk (VaR)
\`\`\`javascript
function calculateVaR(returns, confidence = 0.95) {
  const sorted = returns.sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  
  return {
    var: sorted[index],
    interpretation: \`\${confidence*100}% 확률로 일일 손실이 \${Math.abs(sorted[index]*100)}% 이하\`
  };
}
\`\`\`

### Expected Shortfall
\`\`\`javascript
function calculateES(returns, confidence = 0.95) {
  const var_ = calculateVaR(returns, confidence);
  const tailReturns = returns.filter(r => r <= var_.var);
  
  return {
    es: average(tailReturns),
    interpretation: \`VaR를 초과하는 손실의 평균: \${Math.abs(average(tailReturns)*100)}%\`
  };
}
\`\`\`

## 리스크 관리 원칙

### 1. 일관성
- 감정에 흔들리지 않는 규칙 기반 거래
- 모든 거래에 동일한 리스크 관리 적용

### 2. 단순성
- 복잡한 전략은 리스크 관리도 어려움
- 명확하고 실행 가능한 규칙

### 3. 보수성
- 불확실할 때는 포지션 축소
- 최악의 시나리오 대비

### 4. 지속성
- 한 번의 성공/실패로 규칙 변경 금지
- 장기적 관점 유지

<div class="warning">
⚠️ **경고**: 리스크 관리 없는 거래는 도박과 같습니다.
</div>

<div class="success">
✅ **기억하세요**: 프로 트레이더와 아마추어의 차이는 리스크 관리에 있습니다.
</div>
    `,
  },
};

// AI 학습 확장 내용
export const aiLearningExtendedContents = {
  'ai-learning': {
    title: 'AI 학습 시스템',
    content: `
# AI 학습 시스템

## AI 학습 시스템 개요

이 프로그램은 거래 결과를 지속적으로 학습하여 전략을 개선합니다.

### 학습 시스템의 특징
\`\`\`
✅ 실시간 학습: 모든 거래에서 학습
✅ 적응형 전략: 시장 변화에 자동 적응
✅ 개인화: 사용자의 거래 스타일 학습
✅ 위험 인식: 손실 패턴 학습 및 회피
\`\`\`

### 학습 데이터
\`\`\`javascript
const learningData = {
  // 시장 데이터
  market: {
    price: 'OHLCV 데이터',
    volume: '거래량 패턴',
    volatility: '변동성 지표',
    correlation: '자산 간 상관관계'
  },
  
  // 거래 데이터
  trades: {
    entry: '진입 시점과 조건',
    exit: '청산 시점과 이유',
    performance: '수익/손실',
    duration: '보유 기간'
  },
  
  // 외부 요인
  external: {
    news: '뉴스 감성 분석',
    social: '소셜 미디어 동향',
    macro: '거시경제 지표'
  }
};
\`\`\`

## 학습 프로세스

### 1. 데이터 수집
\`\`\`javascript
class DataCollector {
  async collectTradeData(trade) {
    return {
      // 거래 정보
      tradeInfo: {
        symbol: trade.symbol,
        side: trade.side,
        price: trade.price,
        quantity: trade.quantity,
        timestamp: trade.timestamp
      },
      
      // 시장 상황
      marketContext: {
        trend: await this.getTrend(trade.symbol),
        volatility: await this.getVolatility(trade.symbol),
        volume: await this.getVolumeProfile(trade.symbol),
        indicators: await this.getIndicators(trade.symbol)
      },
      
      // 결과
      outcome: {
        profit: trade.profit,
        duration: trade.duration,
        maxDrawdown: trade.maxDrawdown,
        exitReason: trade.exitReason
      }
    };
  }
}
\`\`\`

### 2. 패턴 인식
\`\`\`javascript
class PatternRecognition {
  identifyPatterns(historicalData) {
    const patterns = {
      // 성공 패턴
      successful: this.findSuccessPatterns(historicalData),
      
      // 실패 패턴
      failure: this.findFailurePatterns(historicalData),
      
      // 시장 상황별 패턴
      marketSpecific: this.findMarketPatterns(historicalData)
    };
    
    return this.rankPatterns(patterns);
  }
  
  findSuccessPatterns(data) {
    return data
      .filter(trade => trade.outcome.profit > 0.05)  // 5% 이상 수익
      .map(trade => ({
        conditions: trade.marketContext,
        confidence: this.calculatePatternConfidence(trade),
        frequency: this.getPatternFrequency(trade, data)
      }))
      .filter(pattern => pattern.confidence > 0.7);
  }
}
\`\`\`

### 3. 전략 조정
\`\`\`javascript
class StrategyAdjustment {
  adjustWeights(currentWeights, learningResults) {
    const adjustments = {};
    
    // 성과가 좋은 지표 가중치 증가
    learningResults.successfulIndicators.forEach(indicator => {
      adjustments[indicator] = currentWeights[indicator] * 1.1;
    });
    
    // 성과가 나쁜 지표 가중치 감소
    learningResults.failedIndicators.forEach(indicator => {
      adjustments[indicator] = currentWeights[indicator] * 0.9;
    });
    
    // 정규화
    return this.normalizeWeights(adjustments);
  }
  
  proposeNewRules(patterns) {
    const newRules = [];
    
    patterns.successful.forEach(pattern => {
      if (pattern.frequency > 10 && pattern.confidence > 0.8) {
        newRules.push({
          condition: pattern.conditions,
          action: 'BUY',
          confidence: pattern.confidence,
          backtest: this.quickBacktest(pattern)
        });
      }
    });
    
    return newRules.filter(rule => rule.backtest.profitable);
  }
}
\`\`\`

## 학습 모델

### 강화학습 모델
\`\`\`javascript
class ReinforcementLearning {
  constructor() {
    this.qTable = {};  // 상태-행동 가치 테이블
    this.epsilon = 0.1;  // 탐험 비율
    this.alpha = 0.1;    // 학습률
    this.gamma = 0.95;   // 할인율
  }
  
  updateQValue(state, action, reward, nextState) {
    const currentQ = this.qTable[state]?.[action] || 0;
    const maxNextQ = Math.max(...Object.values(this.qTable[nextState] || {0: 0}));
    
    // Q-learning 업데이트
    const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
    
    if (!this.qTable[state]) this.qTable[state] = {};
    this.qTable[state][action] = newQ;
  }
  
  selectAction(state) {
    // Epsilon-greedy 정책
    if (Math.random() < this.epsilon) {
      return this.randomAction();  // 탐험
    } else {
      return this.bestAction(state);  // 활용
    }
  }
}
\`\`\`

### 신경망 모델
\`\`\`javascript
class NeuralNetwork {
  constructor() {
    this.model = {
      input: 50,      // 입력 특성 수
      hidden: [128, 64, 32],  // 은닉층
      output: 3       // BUY, HOLD, SELL
    };
  }
  
  preprocessData(marketData) {
    return {
      // 기술적 지표
      technical: [
        marketData.rsi / 100,
        marketData.macd.histogram / marketData.price,
        (marketData.price - marketData.ma20) / marketData.ma20,
        // ... 더 많은 지표
      ],
      
      // 시장 미시구조
      microstructure: [
        marketData.bidAskSpread / marketData.price,
        marketData.orderImbalance,
        marketData.tradeIntensity,
        // ...
      ],
      
      // 시계열 특성
      timeSeries: [
        marketData.returns1h,
        marketData.returns24h,
        marketData.volatility,
        // ...
      ]
    };
  }
  
  predict(data) {
    const processed = this.preprocessData(data);
    const features = [...processed.technical, ...processed.microstructure, ...processed.timeSeries];
    
    // 신경망 추론 (실제로는 TensorFlow.js 등 사용)
    const output = this.forward(features);
    
    return {
      action: this.argmax(output),
      confidence: Math.max(...output),
      probabilities: {
        buy: output[0],
        hold: output[1],
        sell: output[2]
      }
    };
  }
}
\`\`\`

## 학습 결과 활용

### 실시간 적용
\`\`\`javascript
class LearningApplication {
  applyLearning(currentMarket, learningModel) {
    // 1. 현재 시장 상태 분석
    const marketState = this.analyzeMarket(currentMarket);
    
    // 2. 학습 모델 예측
    const prediction = learningModel.predict(marketState);
    
    // 3. 기존 전략과 결합
    const combinedSignal = {
      traditional: this.traditionalStrategy(currentMarket),
      learned: prediction,
      
      // 가중 평균
      final: {
        action: this.combineSignals(
          this.traditionalStrategy(currentMarket),
          prediction,
          weights = { traditional: 0.6, learned: 0.4 }
        ),
        confidence: (this.traditionalStrategy(currentMarket).confidence * 0.6 + 
                    prediction.confidence * 0.4)
      }
    };
    
    // 4. 리스크 체크
    if (this.riskCheck(combinedSignal)) {
      return combinedSignal.final;
    } else {
      return { action: 'HOLD', reason: 'Risk limit exceeded' };
    }
  }
}
\`\`\`

### 성과 모니터링
\`\`\`javascript
class LearningMonitor {
  trackPerformance() {
    return {
      // 학습 전후 비교
      comparison: {
        beforeLearning: {
          winRate: 0.45,
          avgProfit: 0.02,
          sharpeRatio: 0.8
        },
        afterLearning: {
          winRate: 0.52,
          avgProfit: 0.025,
          sharpeRatio: 1.2
        },
        improvement: {
          winRate: '+15.6%',
          avgProfit: '+25%',
          sharpeRatio: '+50%'
        }
      },
      
      // 학습 곡선
      learningCurve: {
        week1: { accuracy: 0.48 },
        week2: { accuracy: 0.51 },
        week4: { accuracy: 0.54 },
        week8: { accuracy: 0.57 }
      },
      
      // 주요 발견
      insights: [
        'RSI < 25에서 매수 성공률 73%',
        '금요일 오후 변동성 40% 증가',
        'BTC 상승 시 알트코인 24시간 후 상승'
      ]
    };
  }
}
\`\`\`

<div class="info">
💡 **팁**: AI 학습은 시간이 걸립니다. 최소 100건 이상의 거래 데이터가 쌓인 후부터 의미있는 학습이 시작됩니다.
</div>

<div class="warning">
⚠️ **주의**: AI 예측도 100% 정확하지 않습니다. 항상 리스크 관리와 함께 사용하세요.
</div>
    `,
  },
  'ai-learning.weight-optimization': {
    title: '가중치 최적화',
    content: `
# 가중치 최적화

## 가중치 최적화 개요

AI 학습 시스템의 핵심은 각 기술적 지표의 가중치를 동적으로 조정하여 시장 상황에 맞는 최적의 조합을 찾는 것입니다.

### 가중치 최적화 원리
\`\`\`javascript
const weightOptimization = {
  // 기본 가중치
  baseWeights: {
    rsi: 0.2,
    macd: 0.25,
    bollingerBands: 0.15,
    movingAverage: 0.2,
    volume: 0.2
  },
  
  // 최적화 파라미터
  optimization: {
    learningRate: 0.01,      // 학습률
    momentum: 0.9,           // 모멘텀
    regularization: 0.001,   // 정규화
    minWeight: 0.05,         // 최소 가중치
    maxWeight: 0.5           // 최대 가중치
  }
};
\`\`\`

## 최적화 알고리즘

### 1. 그래디언트 기반 최적화
\`\`\`javascript
class GradientOptimizer {
  constructor() {
    this.learningRate = 0.01;
    this.momentum = 0.9;
    this.velocity = {};
  }
  
  updateWeights(weights, gradients) {
    const newWeights = {};
    
    for (const indicator in weights) {
      // 모멘텀 계산
      if (!this.velocity[indicator]) {
        this.velocity[indicator] = 0;
      }
      
      this.velocity[indicator] = 
        this.momentum * this.velocity[indicator] - 
        this.learningRate * gradients[indicator];
      
      // 가중치 업데이트
      newWeights[indicator] = weights[indicator] + this.velocity[indicator];
      
      // 가중치 제약 조건
      newWeights[indicator] = Math.max(0.05, Math.min(0.5, newWeights[indicator]));
    }
    
    // 정규화 (합이 1이 되도록)
    return this.normalizeWeights(newWeights);
  }
}
\`\`\`

### 2. 베이지안 최적화
베이지안 최적화는 적은 데이터로도 효율적으로 최적 가중치를 찾는 방법입니다.

\`\`\`javascript
class BayesianOptimizer {
  constructor() {
    this.priorBelief = {
      rsi: { mean: 0.2, variance: 0.01 },
      macd: { mean: 0.25, variance: 0.01 },
      bollinger: { mean: 0.15, variance: 0.01 }
    };
    this.observations = [];
  }
  
  updateBelief(weights, performance) {
    this.observations.push({
      weights: weights,
      performance: performance
    });
    
    const posterior = this.calculatePosterior();
    return this.sampleFromPosterior(posterior);
  }
}
\`\`\`

## 적응형 가중치 조정

### 시장 상황별 가중치
\`\`\`javascript
const marketAdaptiveWeights = {
  bull: {     // 상승장
    rsi: 0.15,
    macd: 0.3,
    momentum: 0.25,
    volume: 0.3
  },
  bear: {     // 하락장
    rsi: 0.3,
    bollinger: 0.25,
    support: 0.25,
    volatility: 0.2
  },
  sideways: { // 횡보장
    rsi: 0.25,
    bollinger: 0.3,
    meanReversion: 0.25,
    range: 0.2
  }
};
\`\`\`

### 실시간 가중치 조정
시장 조건이 변할 때마다 자동으로 가중치를 조정합니다.

\`\`\`javascript
class AdaptiveWeightManager {
  adjustWeights(baseWeights, marketCondition, volatility) {
    const conditionWeights = marketAdaptiveWeights[marketCondition];
    let adjustedWeights = {};
    
    // 시장 상황에 따른 기본 조정
    for (const indicator in baseWeights) {
      adjustedWeights[indicator] = 
        baseWeights[indicator] * 0.7 + 
        (conditionWeights[indicator] || 0.1) * 0.3;
    }
    
    // 변동성에 따른 추가 조정
    if (volatility > 0.1) { // 고변동성
      adjustedWeights.rsi *= 1.2;
      adjustedWeights.bollinger *= 1.15;
    }
    
    return this.normalizeWeights(adjustedWeights);
  }
}
\`\`\`

## 성과 기반 최적화

### 온라인 학습
최근 거래 결과를 바탕으로 지속적으로 가중치를 업데이트합니다.

\`\`\`javascript
class OnlineLearning {
  constructor() {
    this.windowSize = 100;  // 최근 100개 거래
    this.recentTrades = [];
  }
  
  updateWeights(newTrade, currentWeights) {
    this.recentTrades.push(newTrade);
    
    if (this.recentTrades.length > this.windowSize) {
      this.recentTrades.shift();
    }
    
    const performance = this.calculatePerformance(this.recentTrades);
    
    if (this.needsAdjustment(performance)) {
      return this.optimizeWeights(currentWeights, this.recentTrades);
    }
    
    return currentWeights;
  }
  
  needsAdjustment(performance) {
    // 성과가 5% 이상 악화되면 조정
    return performance.decline > 0.05;
  }
}
\`\`\`

### A/B 테스트
새로운 가중치와 기존 가중치의 성과를 비교합니다.

\`\`\`javascript
class WeightABTest {
  runTest(originalWeights, optimizedWeights, duration = 30) {
    const results = {
      control: { weights: originalWeights, performance: [] },
      test: { weights: optimizedWeights, performance: [] }
    };
    
    // 30일간 테스트 실행
    // 결과 분석 후 더 나은 가중치 선택
    
    return this.analyzeResults(results);
  }
}
\`\`\`

## 최적화 모니터링

### 성과 지표
가중치 최적화의 효과를 다양한 지표로 측정합니다.

\`\`\`javascript
const optimizationMetrics = {
  profitability: {
    totalReturn: '전체 수익률',
    sharpeRatio: '샤프 비율',
    informationRatio: '정보 비율'
  },
  
  stability: {
    maxDrawdown: '최대 낙폭',
    volatility: '변동성',
    var95: '95% VaR'
  },
  
  consistency: {
    winRate: '승률',
    profitFactor: '수익 팩터',
    monthlyWinRate: '월간 승률'
  }
};
\`\`\`

<div class="success">
✅ **핵심**: 가중치 최적화는 지속적인 과정입니다. 시장이 변하면 최적 가중치도 함께 변합니다.
</div>

<div class="info">
💡 **팁**: 과도한 최적화는 과적합을 일으킬 수 있습니다. 단순함을 유지하세요.
</div>

<div class="warning">
⚠️ **주의**: 최적화된 가중치는 과거 데이터 기반이므로 미래 성과를 보장하지 않습니다.
</div>
    `,
  },
  'ai-learning.performance-statistics': {
    title: '성과 통계 활용',
    content: `
# 성과 통계 활용

## 성과 통계 개요

AI 학습 시스템은 거래 성과를 다양한 통계적 방법으로 분석하여 전략 개선에 활용합니다.

### 주요 성과 지표
\`\`\`javascript
const performanceMetrics = {
  // 기본 수익성 지표
  basic: {
    totalReturn: '총 수익률',
    cagr: '연평균 복합 성장률',
    volatility: '변동성',
    sharpeRatio: '샤프 비율',
    maxDrawdown: '최대 낙폭'
  },
  
  // 고급 위험 지표
  advanced: {
    sortinoRatio: '소르티노 비율',
    calmarRatio: '칼마 비율',
    var95: '95% VaR',
    expectedShortfall: '기댓 부족분',
    beta: '베타 (시장 대비)'
  },
  
  // 거래 효율성 지표
  trading: {
    winRate: '승률',
    profitFactor: '수익 팩터',
    averageWin: '평균 수익',
    averageLoss: '평균 손실',
    expectancy: '기댓값'
  }
};
\`\`\`

## 통계적 분석 방법

### 1. 시계열 분석
거래 성과의 시간적 패턴을 분석합니다.

\`\`\`javascript
class TimeSeriesAnalysis {
  constructor(returns) {
    this.returns = returns;
    this.periods = {
      daily: this.groupByPeriod('day'),
      weekly: this.groupByPeriod('week'),
      monthly: this.groupByPeriod('month')
    };
  }
  
  trendAnalysis() {
    return {
      // 선형 회귀를 통한 추세 분석
      trend: this.linearRegression(this.returns),
      
      // 이동평균을 통한 추세 확인
      movingAverages: {
        ma7: this.movingAverage(7),
        ma30: this.movingAverage(30),
        ma90: this.movingAverage(90)
      },
      
      // 추세 강도
      trendStrength: this.calculateTrendStrength(),
      
      // 변화점 탐지
      changePoints: this.detectChangePoints()
    };
  }
  
  seasonalityAnalysis() {
    return {
      // 요일별 성과
      dayOfWeek: this.analyzeByDayOfWeek(),
      
      // 시간대별 성과
      hourOfDay: this.analyzeByHour(),
      
      // 월별 성과
      monthlyPatterns: this.analyzeByMonth(),
      
      // 계절성 검정
      seasonalityTest: this.kruskalWallisTest()
    };
  }
}
\`\`\`

### 2. 리스크 분석
다양한 방법으로 투자 위험을 측정합니다.

\`\`\`javascript
class RiskAnalysis {
  calculateVaR(returns, confidence = 0.95) {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    
    return {
      parametric: this.parametricVaR(confidence),
      historical: sortedReturns[index],
      monteCarlo: this.monteCarloVaR(confidence),
      
      interpretation: \`\${confidence * 100}% 확률로 일일 손실이 \${Math.abs(sortedReturns[index] * 100).toFixed(2)}% 이하\`
    };
  }
  
  stressTest() {
    return {
      market_crash: {
        description: '시장 급락 (-30%)',
        expectedLoss: this.calculateScenarioLoss(-0.3, 0.8)
      },
      
      flash_crash: {
        description: '플래시 크래시 (-20% in 1 hour)',
        expectedLoss: this.calculateFlashCrashLoss()
      },
      
      black_swan: {
        description: '블랙 스완 이벤트',
        expectedLoss: this.calculateBlackSwanLoss()
      }
    };
  }
}
\`\`\`

### 3. 성과 귀인 분석
어떤 요소가 성과에 기여했는지 분석합니다.

\`\`\`javascript
class PerformanceAttribution {
  analyzeContributions(trades, indicators) {
    const contributions = {};
    
    // 각 지표별 기여도 계산
    for (const indicator in indicators) {
      contributions[indicator] = this.calculateIndicatorContribution(
        trades,
        indicator,
        indicators[indicator]
      );
    }
    
    return {
      // 절대 기여도
      absolute: contributions,
      
      // 상대 기여도
      relative: this.normalizeContributions(contributions),
      
      // 통계적 유의성
      significance: this.testSignificance(contributions),
      
      // 시간에 따른 기여도 변화
      timeVarying: this.rollingContribution(trades, indicators)
    };
  }
}
\`\`\`

## 실시간 성과 모니터링

### 대시보드 지표
실시간으로 성과를 모니터링하는 핵심 지표들입니다.

\`\`\`javascript
class PerformanceDashboard {
  generateMetrics(trades, timeframe = 'daily') {
    const recentTrades = this.filterByTimeframe(trades, timeframe);
    
    return {
      // 핵심 KPI
      kpi: {
        pnl: this.calculatePnL(recentTrades),
        winRate: this.calculateWinRate(recentTrades),
        sharpe: this.calculateSharpe(recentTrades),
        maxDrawdown: this.calculateMaxDrawdown(recentTrades)
      },
      
      // 경고 신호
      alerts: {
        drawdownAlert: this.checkDrawdownAlert(recentTrades),
        winRateAlert: this.checkWinRateAlert(recentTrades),
        volumeAlert: this.checkVolumeAlert(recentTrades)
      },
      
      // 성과 분포
      distribution: {
        dailyReturns: this.getDailyReturnDistribution(recentTrades),
        tradeOutcomes: this.getTradeOutcomeDistribution(recentTrades),
        holdingPeriods: this.getHoldingPeriodDistribution(recentTrades)
      }
    };
  }
}
\`\`\`

### 성과 예측
과거 데이터를 바탕으로 미래 성과를 예측합니다.

\`\`\`javascript
class PerformanceForecasting {
  predictFuturePerformance(historicalData, horizon = 30) {
    return {
      // 시계열 예측
      timeSeries: {
        arima: this.arimaForecast(historicalData, horizon),
        garch: this.garchForecast(historicalData, horizon)
      },
      
      // 시나리오 분석
      scenarios: {
        optimistic: this.generateScenario(historicalData, 'optimistic'),
        realistic: this.generateScenario(historicalData, 'realistic'),
        pessimistic: this.generateScenario(historicalData, 'pessimistic')
      },
      
      // 몬테카를로 시뮬레이션
      monteCarlo: this.monteCarloSimulation(historicalData, horizon, 1000),
      
      // 신뢰구간
      confidenceIntervals: {
        ci50: this.calculateConfidenceInterval(historicalData, 0.5),
        ci95: this.calculateConfidenceInterval(historicalData, 0.95)
      }
    };
  }
}
\`\`\`

## 벤치마크 비교

### 성과 비교 분석
다양한 벤치마크와 성과를 비교합니다.

\`\`\`javascript
class BenchmarkComparison {
  compare(portfolioReturns, benchmarks) {
    const comparisons = {};
    
    for (const [name, benchmarkReturns] of Object.entries(benchmarks)) {
      comparisons[name] = {
        // 누적 수익률 비교
        cumulativeReturn: {
          portfolio: this.calculateCumulative(portfolioReturns),
          benchmark: this.calculateCumulative(benchmarkReturns),
          outperformance: this.calculateOutperformance(portfolioReturns, benchmarkReturns)
        },
        
        // 위험 조정 수익률
        riskAdjustedReturn: {
          portfolioSharpe: this.calculateSharpe(portfolioReturns),
          benchmarkSharpe: this.calculateSharpe(benchmarkReturns),
          informationRatio: this.calculateInformationRatio(portfolioReturns, benchmarkReturns)
        },
        
        // 추적 오차
        trackingError: this.calculateTrackingError(portfolioReturns, benchmarkReturns),
        
        // 상관관계
        correlation: this.calculateCorrelation(portfolioReturns, benchmarkReturns)
      };
    }
    
    return comparisons;
  }
}
\`\`\`

## 통계 기반 전략 개선

### 패턴 인식
통계적 방법으로 수익성 있는 패턴을 찾습니다.

\`\`\`javascript
const profitablePatterns = {
  timePatterns: {
    bestTradingHours: [9, 10, 14, 15], // 수익률이 높은 시간대
    worstTradingHours: [12, 13, 16],   // 수익률이 낮은 시간대
    weekdayPerformance: {
      monday: 0.02,    // 월요일 평균 수익률
      tuesday: 0.015,
      wednesday: 0.01,
      thursday: 0.025,
      friday: -0.005   // 금요일은 평균적으로 손실
    }
  },
  
  marketConditionPatterns: {
    highVolatility: {
      winRate: 0.45,
      avgProfit: 0.035,
      recommendation: 'RSI 가중치 증가'
    },
    lowVolatility: {
      winRate: 0.55,
      avgProfit: 0.015,
      recommendation: '모멘텀 지표 활용'
    }
  }
};
\`\`\`

### 이상 탐지
비정상적인 거래 결과를 자동으로 감지합니다.

\`\`\`javascript
class AnomalyDetection {
  detectAnomalies(returns) {
    return {
      // 통계적 이상치
      statistical: this.statisticalOutliers(returns),
      
      // 시계열 이상치
      temporal: this.temporalAnomalies(returns),
      
      // 군집 기반 이상치
      clustering: this.clusteringAnomalies(returns),
      
      // 기계학습 기반
      ml: this.mlAnomalies(returns)
    };
  }
}
\`\`\`

<div class="success">
✅ **핵심**: 다양한 통계 지표를 종합적으로 분석하여 전략의 장단점을 정확히 파악하세요.
</div>

<div class="info">
💡 **팁**: 성과 통계는 과거를 보여주는 지표입니다. 미래 예측에는 한계가 있음을 인식하세요.
</div>

<div class="warning">
⚠️ **주의**: 단일 지표에만 의존하지 말고, 여러 지표를 함께 고려하여 의사결정하세요.
</div>
    `,
  },
};