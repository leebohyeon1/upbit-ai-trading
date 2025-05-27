import { EventEmitter } from 'events';

interface KellyCalculation {
  kellyFraction: number;
  halfKelly: number;
  quarterKelly: number;
  recommendedFraction: number;
  confidence: number;
  sampleSize: number;
}

interface PerformanceMetrics {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  totalTrades: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export class KellyCriterionService extends EventEmitter {
  private readonly MIN_SAMPLE_SIZE = 30; // 최소 거래 횟수
  private readonly MAX_KELLY_FRACTION = 0.25; // 최대 Kelly 비율 (25%)
  private readonly CONFIDENCE_THRESHOLD = 0.7; // 신뢰도 임계값

  constructor() {
    super();
  }

  /**
   * Kelly Criterion 계산
   * f* = (p * b - q) / b
   * 여기서:
   * - f* = 최적 베팅 비율
   * - p = 승률
   * - q = 패배율 (1 - p)
   * - b = 승리 시 수익 배율
   */
  public calculateKelly(metrics: PerformanceMetrics): KellyCalculation {
    const { winRate, avgWin, avgLoss, totalTrades } = metrics;

    // 기본 검증
    if (totalTrades < 5 || avgLoss === 0 || winRate === 0 || winRate === 1) {
      return this.getDefaultCalculation();
    }

    // Kelly 공식 계산
    const p = winRate;
    const q = 1 - winRate;
    const b = avgWin / avgLoss; // 승리 시 수익 배율

    // 기본 Kelly 비율
    const kellyFraction = (p * b - q) / b;

    // 음수이거나 너무 큰 경우 제한
    const boundedKelly = Math.max(0, Math.min(kellyFraction, this.MAX_KELLY_FRACTION));

    // Half Kelly와 Quarter Kelly 계산 (더 보수적인 접근)
    const halfKelly = boundedKelly * 0.5;
    const quarterKelly = boundedKelly * 0.25;

    // 신뢰도 계산 (거래 횟수와 일관성 기반)
    const confidence = this.calculateConfidence(metrics);

    // 추천 비율 결정 (신뢰도에 따라 조정)
    let recommendedFraction: number;
    if (confidence >= 0.9 && totalTrades >= 100) {
      recommendedFraction = halfKelly; // 높은 신뢰도: Half Kelly 사용
    } else if (confidence >= 0.7 && totalTrades >= 50) {
      recommendedFraction = quarterKelly * 1.5; // 중간 신뢰도
    } else {
      recommendedFraction = quarterKelly; // 낮은 신뢰도: Quarter Kelly 사용
    }

    // 최대 제한 적용
    recommendedFraction = Math.min(recommendedFraction, this.MAX_KELLY_FRACTION);

    return {
      kellyFraction: boundedKelly,
      halfKelly,
      quarterKelly,
      recommendedFraction,
      confidence,
      sampleSize: totalTrades
    };
  }

  /**
   * 동적 Kelly 계산 (시장 상황 고려)
   */
  public calculateDynamicKelly(
    metrics: PerformanceMetrics,
    marketConditions: {
      volatility: number; // 0-1 범위
      trend: 'bull' | 'bear' | 'sideways';
      recentDrawdown: number; // 최근 손실률
    }
  ): KellyCalculation {
    const baseKelly = this.calculateKelly(metrics);

    // 시장 조건에 따른 조정
    let adjustmentFactor = 1.0;

    // 변동성 조정
    if (marketConditions.volatility > 0.7) {
      adjustmentFactor *= 0.5; // 높은 변동성: 50% 감소
    } else if (marketConditions.volatility > 0.5) {
      adjustmentFactor *= 0.7; // 중간 변동성: 30% 감소
    }

    // 추세 조정
    if (marketConditions.trend === 'bear') {
      adjustmentFactor *= 0.6; // 하락장: 40% 감소
    } else if (marketConditions.trend === 'sideways') {
      adjustmentFactor *= 0.8; // 횡보장: 20% 감소
    }

    // 최근 손실 조정
    if (marketConditions.recentDrawdown > 0.15) {
      adjustmentFactor *= 0.5; // 15% 이상 손실: 50% 감소
    } else if (marketConditions.recentDrawdown > 0.1) {
      adjustmentFactor *= 0.7; // 10% 이상 손실: 30% 감소
    }

    // 조정된 값 계산
    const adjustedRecommended = baseKelly.recommendedFraction * adjustmentFactor;

    return {
      ...baseKelly,
      recommendedFraction: Math.max(0.01, adjustedRecommended) // 최소 1%
    };
  }

  /**
   * 다중 자산 Kelly 계산 (포트폴리오)
   */
  public calculatePortfolioKelly(
    assets: Array<{
      symbol: string;
      metrics: PerformanceMetrics;
      correlation: number; // 다른 자산과의 상관관계
    }>
  ): Map<string, number> {
    const allocations = new Map<string, number>();
    
    // 각 자산의 기본 Kelly 계산
    const kellyCalculations = assets.map(asset => ({
      symbol: asset.symbol,
      kelly: this.calculateKelly(asset.metrics),
      correlation: asset.correlation
    }));

    // 전체 포트폴리오 제한
    const totalAllocation = 0.8; // 전체 자금의 80%까지만 사용
    let sumKelly = kellyCalculations.reduce((sum, calc) => sum + calc.kelly.recommendedFraction, 0);

    // 비례 조정
    if (sumKelly > totalAllocation) {
      const scaleFactor = totalAllocation / sumKelly;
      kellyCalculations.forEach(calc => {
        allocations.set(calc.symbol, calc.kelly.recommendedFraction * scaleFactor);
      });
    } else {
      kellyCalculations.forEach(calc => {
        allocations.set(calc.symbol, calc.kelly.recommendedFraction);
      });
    }

    // 상관관계 조정 (높은 상관관계를 가진 자산들의 비중 감소)
    kellyCalculations.forEach(calc => {
      if (calc.correlation > 0.7) {
        const currentAllocation = allocations.get(calc.symbol) || 0;
        allocations.set(calc.symbol, currentAllocation * 0.7);
      }
    });

    return allocations;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(metrics: PerformanceMetrics): number {
    const { totalTrades, winRate, profitFactor, sharpeRatio } = metrics;

    // 거래 횟수 기반 신뢰도
    const sampleConfidence = Math.min(totalTrades / this.MIN_SAMPLE_SIZE, 1);

    // 성과 일관성 기반 신뢰도
    let performanceConfidence = 0;
    if (winRate > 0.5 && profitFactor > 1.5 && sharpeRatio > 1) {
      performanceConfidence = 0.9;
    } else if (winRate > 0.45 && profitFactor > 1.2 && sharpeRatio > 0.5) {
      performanceConfidence = 0.7;
    } else if (winRate > 0.4 && profitFactor > 1) {
      performanceConfidence = 0.5;
    } else {
      performanceConfidence = 0.3;
    }

    // 가중 평균
    return sampleConfidence * 0.4 + performanceConfidence * 0.6;
  }

  /**
   * 기본 Kelly 계산값
   */
  private getDefaultCalculation(): KellyCalculation {
    return {
      kellyFraction: 0.01,
      halfKelly: 0.005,
      quarterKelly: 0.0025,
      recommendedFraction: 0.01, // 기본 1%
      confidence: 0,
      sampleSize: 0
    };
  }

  /**
   * Kelly 비율에 따른 예상 성장률 계산
   */
  public calculateExpectedGrowth(
    kellyFraction: number,
    winRate: number,
    avgWin: number,
    avgLoss: number
  ): number {
    // g = p * ln(1 + b*f) + q * ln(1 - f)
    const p = winRate;
    const q = 1 - winRate;
    const b = avgWin / avgLoss;
    const f = kellyFraction;

    const growth = p * Math.log(1 + b * f) + q * Math.log(1 - f);
    return growth;
  }

  /**
   * 파산 확률 계산
   */
  public calculateRiskOfRuin(
    kellyFraction: number,
    winRate: number,
    startingCapital: number,
    minCapital: number
  ): number {
    if (winRate >= 1 || kellyFraction <= 0) return 0;
    if (winRate <= 0) return 1;

    // 단순화된 파산 확률 공식
    const a = minCapital / startingCapital;
    const p = winRate;
    const q = 1 - winRate;
    
    if (p === q) {
      return a;
    }

    const riskOfRuin = Math.pow(q / p, (1 - a) / kellyFraction);
    return Math.min(1, Math.max(0, riskOfRuin));
  }
}

export default new KellyCriterionService();