import { EventEmitter } from 'events';

export interface PortfolioPosition {
  market: string;
  balance: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  weight: number;
}

export interface VaRResult {
  dailyVaR95: number;      // 일일 95% VaR (금액)
  dailyVaR99: number;      // 일일 99% VaR (금액)
  weeklyVaR95: number;     // 주간 95% VaR (금액)
  monthlyVaR95: number;    // 월간 95% VaR (금액)
  percentageVaR95: number; // 95% VaR (%)
  percentageVaR99: number; // 99% VaR (%)
  methodology: 'historical' | 'parametric' | 'monte-carlo';
  confidence: number;
  sampleSize: number;
  calculatedAt: number;
}

export interface RiskMetrics {
  VaR: VaRResult;
  CVaR: number;           // Conditional VaR (Expected Shortfall)
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  correlation: Map<string, number>;
}

export class RiskManagementService extends EventEmitter {
  private priceHistory: Map<string, number[]> = new Map();
  private readonly MIN_HISTORY_SIZE = 30; // 최소 30일 데이터
  private readonly CONFIDENCE_LEVELS = {
    95: 1.645, // 95% 신뢰수준 Z-score
    99: 2.326  // 99% 신뢰수준 Z-score
  };

  constructor() {
    super();
  }

  /**
   * VaR (Value at Risk) 계산
   * 특정 신뢰수준에서 특정 기간 동안 발생할 수 있는 최대 예상 손실
   */
  public calculateVaR(
    portfolio: PortfolioPosition[],
    priceHistory: Map<string, number[]>,
    methodology: 'historical' | 'parametric' | 'monte-carlo' = 'parametric'
  ): VaRResult {
    this.priceHistory = priceHistory;

    switch (methodology) {
      case 'historical':
        return this.calculateHistoricalVaR(portfolio);
      case 'monte-carlo':
        return this.calculateMonteCarloVaR(portfolio);
      case 'parametric':
      default:
        return this.calculateParametricVaR(portfolio);
    }
  }

  /**
   * 모수적 VaR (분산-공분산 방법)
   * 정규분포 가정하에 계산
   */
  private calculateParametricVaR(portfolio: PortfolioPosition[]): VaRResult {
    const totalValue = portfolio.reduce((sum, pos) => sum + pos.value, 0);
    
    // 포트폴리오 수익률 계산
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);
    
    if (portfolioReturns.length < this.MIN_HISTORY_SIZE) {
      return this.getDefaultVaR(totalValue);
    }

    // 평균과 표준편차 계산
    const mean = this.calculateMean(portfolioReturns);
    const stdDev = this.calculateStdDev(portfolioReturns, mean);

    // VaR 계산
    const dailyVaR95 = totalValue * (mean - this.CONFIDENCE_LEVELS[95] * stdDev);
    const dailyVaR99 = totalValue * (mean - this.CONFIDENCE_LEVELS[99] * stdDev);

    // 시간 스케일링 (제곱근 법칙)
    const weeklyVaR95 = dailyVaR95 * Math.sqrt(7);
    const monthlyVaR95 = dailyVaR95 * Math.sqrt(30);

    return {
      dailyVaR95: Math.abs(dailyVaR95),
      dailyVaR99: Math.abs(dailyVaR99),
      weeklyVaR95: Math.abs(weeklyVaR95),
      monthlyVaR95: Math.abs(monthlyVaR95),
      percentageVaR95: Math.abs(dailyVaR95 / totalValue * 100),
      percentageVaR99: Math.abs(dailyVaR99 / totalValue * 100),
      methodology: 'parametric',
      confidence: this.calculateConfidence(portfolioReturns.length),
      sampleSize: portfolioReturns.length,
      calculatedAt: Date.now()
    };
  }

  /**
   * 역사적 VaR
   * 과거 데이터의 실제 분포 사용
   */
  private calculateHistoricalVaR(portfolio: PortfolioPosition[]): VaRResult {
    const totalValue = portfolio.reduce((sum, pos) => sum + pos.value, 0);
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);

    if (portfolioReturns.length < this.MIN_HISTORY_SIZE) {
      return this.getDefaultVaR(totalValue);
    }

    // 수익률 정렬 (오름차순)
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);

    // 백분위수 계산
    const index95 = Math.floor(portfolioReturns.length * 0.05);
    const index99 = Math.floor(portfolioReturns.length * 0.01);

    const var95 = sortedReturns[index95];
    const var99 = sortedReturns[index99];

    const dailyVaR95 = Math.abs(totalValue * var95);
    const dailyVaR99 = Math.abs(totalValue * var99);

    return {
      dailyVaR95,
      dailyVaR99,
      weeklyVaR95: dailyVaR95 * Math.sqrt(7),
      monthlyVaR95: dailyVaR95 * Math.sqrt(30),
      percentageVaR95: Math.abs(var95 * 100),
      percentageVaR99: Math.abs(var99 * 100),
      methodology: 'historical',
      confidence: this.calculateConfidence(portfolioReturns.length),
      sampleSize: portfolioReturns.length,
      calculatedAt: Date.now()
    };
  }

  /**
   * 몬테카를로 VaR
   * 시뮬레이션 기반 계산
   */
  private calculateMonteCarloVaR(portfolio: PortfolioPosition[]): VaRResult {
    const totalValue = portfolio.reduce((sum, pos) => sum + pos.value, 0);
    const numSimulations = 10000;
    const simulatedReturns: number[] = [];

    // 각 자산의 통계 계산
    const assetStats = portfolio.map(pos => {
      const returns = this.calculateReturns(this.priceHistory.get(pos.market) || []);
      return {
        market: pos.market,
        weight: pos.weight,
        mean: this.calculateMean(returns),
        stdDev: this.calculateStdDev(returns, this.calculateMean(returns))
      };
    });

    // 몬테카를로 시뮬레이션
    for (let i = 0; i < numSimulations; i++) {
      let portfolioReturn = 0;
      
      for (const asset of assetStats) {
        // Box-Muller 변환으로 정규분포 난수 생성
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        const assetReturn = asset.mean + asset.stdDev * z;
        portfolioReturn += assetReturn * asset.weight;
      }
      
      simulatedReturns.push(portfolioReturn);
    }

    // VaR 계산
    const sortedSimulations = simulatedReturns.sort((a, b) => a - b);
    const index95 = Math.floor(numSimulations * 0.05);
    const index99 = Math.floor(numSimulations * 0.01);

    const var95 = sortedSimulations[index95];
    const var99 = sortedSimulations[index99];

    const dailyVaR95 = Math.abs(totalValue * var95);
    const dailyVaR99 = Math.abs(totalValue * var99);

    return {
      dailyVaR95,
      dailyVaR99,
      weeklyVaR95: dailyVaR95 * Math.sqrt(7),
      monthlyVaR95: dailyVaR95 * Math.sqrt(30),
      percentageVaR95: Math.abs(var95 * 100),
      percentageVaR99: Math.abs(var99 * 100),
      methodology: 'monte-carlo',
      confidence: 0.95, // 몬테카를로는 높은 신뢰도
      sampleSize: numSimulations,
      calculatedAt: Date.now()
    };
  }

  /**
   * CVaR (Conditional Value at Risk) 계산
   * VaR를 초과하는 손실의 평균
   */
  public calculateCVaR(
    portfolio: PortfolioPosition[],
    confidenceLevel: number = 0.95
  ): number {
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
    
    const varIndex = Math.floor(portfolioReturns.length * (1 - confidenceLevel));
    const tailReturns = sortedReturns.slice(0, varIndex);
    
    if (tailReturns.length === 0) return 0;
    
    const cvar = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
    const totalValue = portfolio.reduce((sum, pos) => sum + pos.value, 0);
    
    return Math.abs(cvar * totalValue);
  }

  /**
   * 포트폴리오 수익률 계산
   */
  private calculatePortfolioReturns(portfolio: PortfolioPosition[]): number[] {
    const minLength = Math.min(
      ...portfolio.map(pos => 
        (this.priceHistory.get(pos.market) || []).length
      )
    );

    if (minLength < 2) return [];

    const portfolioReturns: number[] = [];

    for (let i = 1; i < minLength; i++) {
      let portfolioReturn = 0;

      for (const position of portfolio) {
        const prices = this.priceHistory.get(position.market) || [];
        if (prices.length > i) {
          const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
          portfolioReturn += dailyReturn * position.weight;
        }
      }

      portfolioReturns.push(portfolioReturn);
    }

    return portfolioReturns;
  }

  /**
   * 개별 자산 수익률 계산
   */
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  /**
   * 평균 계산
   */
  private calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * 표준편차 계산
   */
  private calculateStdDev(data: number[], mean?: number): number {
    if (data.length === 0) return 0;
    const avg = mean !== undefined ? mean : this.calculateMean(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(sampleSize: number): number {
    if (sampleSize >= 250) return 0.95; // 1년 데이터
    if (sampleSize >= 100) return 0.85;
    if (sampleSize >= 50) return 0.75;
    if (sampleSize >= 30) return 0.65;
    return 0.5;
  }

  /**
   * 기본 VaR 값 (데이터 부족 시)
   */
  private getDefaultVaR(totalValue: number): VaRResult {
    // 보수적인 기본값 사용 (일일 2% 손실 가정)
    const defaultDailyLoss = totalValue * 0.02;
    
    return {
      dailyVaR95: defaultDailyLoss,
      dailyVaR99: defaultDailyLoss * 1.5,
      weeklyVaR95: defaultDailyLoss * Math.sqrt(7),
      monthlyVaR95: defaultDailyLoss * Math.sqrt(30),
      percentageVaR95: 2,
      percentageVaR99: 3,
      methodology: 'parametric',
      confidence: 0.3,
      sampleSize: 0,
      calculatedAt: Date.now()
    };
  }

  /**
   * 포트폴리오 리밸런싱 제안
   */
  public suggestRebalancing(
    currentPortfolio: PortfolioPosition[],
    targetWeights: Map<string, number>,
    constraints: {
      maxVaR: number;          // 최대 허용 VaR
      minWeight: number;       // 최소 포지션 비중
      maxWeight: number;       // 최대 포지션 비중
      rebalanceThreshold: number; // 리밸런싱 임계값 (%)
    }
  ): {
    suggestions: Map<string, { 
      currentWeight: number; 
      targetWeight: number; 
      action: 'BUY' | 'SELL' | 'HOLD';
      amount: number;
    }>;
    totalBuyAmount: number;
    totalSellAmount: number;
    needsRebalancing: boolean;
  } {
    const suggestions = new Map<string, any>();
    const currentVaR = this.calculateVaR(currentPortfolio, this.priceHistory);
    const totalValue = currentPortfolio.reduce((sum, pos) => sum + pos.value, 0);
    
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let needsRebalancing = false;
    
    // 현재 가중치 맵 생성
    const currentWeights = new Map<string, number>();
    currentPortfolio.forEach(pos => {
      currentWeights.set(pos.market, pos.weight);
    });
    
    // VaR 제약 조건에 따른 전체 스케일 조정
    let scaleFactor = 1.0;
    if (currentVaR.percentageVaR95 > constraints.maxVaR) {
      scaleFactor = constraints.maxVaR / currentVaR.percentageVaR95;
      console.log(`VaR 초과: ${currentVaR.percentageVaR95.toFixed(2)}% > ${constraints.maxVaR}%, 스케일 팩터: ${scaleFactor.toFixed(2)}`);
    }
    
    // 각 자산별 리밸런싱 계산
    targetWeights.forEach((targetWeight, market) => {
      const currentWeight = currentWeights.get(market) || 0;
      let adjustedTargetWeight = targetWeight * scaleFactor;
      
      // 최소/최대 가중치 제약
      adjustedTargetWeight = Math.max(constraints.minWeight, 
                                    Math.min(constraints.maxWeight, adjustedTargetWeight));
      
      const weightDifference = Math.abs(adjustedTargetWeight - currentWeight);
      
      // 리밸런싱 필요 여부 확인
      if (weightDifference > constraints.rebalanceThreshold) {
        needsRebalancing = true;
        
        const currentPosition = currentPortfolio.find(p => p.market === market);
        const currentValue = currentPosition ? currentPosition.value : 0;
        const targetValue = totalValue * adjustedTargetWeight;
        const valueDifference = targetValue - currentValue;
        
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        if (valueDifference > 0) {
          action = 'BUY';
          totalBuyAmount += valueDifference;
        } else if (valueDifference < 0) {
          action = 'SELL';
          totalSellAmount += Math.abs(valueDifference);
        }
        
        suggestions.set(market, {
          currentWeight,
          targetWeight: adjustedTargetWeight,
          action,
          amount: Math.abs(valueDifference)
        });
      } else {
        // 임계값 이하면 HOLD
        suggestions.set(market, {
          currentWeight,
          targetWeight: currentWeight,
          action: 'HOLD',
          amount: 0
        });
      }
    });
    
    // 현재 포트폴리오에 있지만 목표에 없는 자산 처리
    currentPortfolio.forEach(pos => {
      if (!targetWeights.has(pos.market)) {
        needsRebalancing = true;
        totalSellAmount += pos.value;
        
        suggestions.set(pos.market, {
          currentWeight: pos.weight,
          targetWeight: 0,
          action: 'SELL',
          amount: pos.value
        });
      }
    });
    
    return {
      suggestions,
      totalBuyAmount,
      totalSellAmount,
      needsRebalancing
    };
  }

  /**
   * 최적 포트폴리오 가중치 계산 (Mean-Variance Optimization)
   */
  public calculateOptimalWeights(
    assets: Array<{
      market: string;
      expectedReturn: number;
      volatility: number;
    }>,
    correlationMatrix: number[][],
    targetReturn?: number
  ): Map<string, number> {
    // 간단한 동일 가중 방식으로 시작
    // 실제로는 최적화 알고리즘 필요
    const equalWeight = 1 / assets.length;
    const weights = new Map<string, number>();
    
    assets.forEach(asset => {
      weights.set(asset.market, equalWeight);
    });
    
    // TODO: Markowitz 최적화 구현
    // - 공분산 행렬 계산
    // - 제약 조건 하 최적화
    // - 효율적 프론티어 계산
    
    return weights;
  }

  /**
   * 스트레스 테스트
   */
  public performStressTest(
    portfolio: PortfolioPosition[],
    scenarios: Array<{
      name: string;
      shocks: Map<string, number>; // 각 자산별 충격 (%)
    }>
  ): Array<{ scenario: string; loss: number; percentage: number }> {
    const results: Array<{ scenario: string; loss: number; percentage: number }> = [];
    const totalValue = portfolio.reduce((sum, pos) => sum + pos.value, 0);
    
    for (const scenario of scenarios) {
      let totalLoss = 0;
      
      for (const position of portfolio) {
        const shock = scenario.shocks.get(position.market) || 0;
        const loss = position.value * (shock / 100);
        totalLoss += loss;
      }
      
      results.push({
        scenario: scenario.name,
        loss: Math.abs(totalLoss),
        percentage: Math.abs(totalLoss / totalValue * 100)
      });
    }
    
    return results;
  }
}

export default new RiskManagementService();