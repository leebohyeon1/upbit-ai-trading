import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import tradeHistoryService from './trade-history-service';

interface TradeResult {
  market: string;
  timestamp: number;
  entryPrice: number;
  exitPrice: number;
  profit: number;
  profitRate: number;
  holding_period: number;
  indicators: {
    rsi: number;
    macd: number;
    bb_position: number;
    volume_ratio: number;
    stochastic_rsi: number;
    atr: number;
    obv_trend: number;
    adx: number;
  };
  market_conditions: {
    trend: 'bull' | 'bear' | 'sideways';
    volatility: 'low' | 'medium' | 'high';
    volume: 'low' | 'medium' | 'high';
  };
  news_sentiment: number;
  whale_activity: boolean;
}

interface SignalWeight {
  indicator: string;
  weight: number;
  success_rate: number;
  sample_size: number;
  last_updated: number;
}

interface LearningConfig {
  min_sample_size: number;
  weight_adjustment_rate: number;
  performance_window: number; // days
  save_interval: number; // minutes
  cooldown_adjustment_enabled: boolean;
  cooldown_adjustment_rate: number;
}

// 쿨타임 상수
const MAX_COOLDOWN = 360; // 최대 쿨타임 (분)
const MIN_COOLDOWN = 5;   // 최소 쿨타임 (분)

export class LearningService extends EventEmitter {
  private tradeHistory: TradeResult[] = [];
  private signalWeights: Map<string, SignalWeight> = new Map();
  private learningConfig: LearningConfig = {
    min_sample_size: 20,
    weight_adjustment_rate: 0.1,
    performance_window: 30,
    save_interval: 30,
    cooldown_adjustment_enabled: true,
    cooldown_adjustment_rate: 0.05
  };
  private dataPath: string;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Use app.getPath('userData') for proper permissions
    const { app } = require('electron');
    this.dataPath = path.join(app.getPath('userData'), 'learning');
    this.ensureDataDirectory();
    this.loadHistoricalData();
    this.initializeWeights();
    this.startAutoSave();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadHistoricalData(): void {
    try {
      const historyFile = path.join(this.dataPath, 'trade_history.json');
      if (fs.existsSync(historyFile)) {
        const data = fs.readFileSync(historyFile, 'utf8');
        this.tradeHistory = JSON.parse(data);
      }

      const weightsFile = path.join(this.dataPath, 'signal_weights.json');
      if (fs.existsSync(weightsFile)) {
        const data = fs.readFileSync(weightsFile, 'utf8');
        const weights = JSON.parse(data);
        this.signalWeights = new Map(weights);
      }

      // 쿨타임 데이터 로드
      this.loadCooldownData();
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  private initializeWeights(): void {
    const defaultWeights = [
      { indicator: 'rsi', weight: 1.0 },
      { indicator: 'macd', weight: 1.0 },
      { indicator: 'bb_position', weight: 0.8 },
      { indicator: 'volume_ratio', weight: 0.9 },
      { indicator: 'stochastic_rsi', weight: 0.9 },
      { indicator: 'atr', weight: 0.7 },
      { indicator: 'obv_trend', weight: 0.8 },
      { indicator: 'adx', weight: 0.8 },
      { indicator: 'news_sentiment', weight: 1.2 },
      { indicator: 'whale_activity', weight: 1.1 },
      { indicator: 'market_trend', weight: 1.0 },
      { indicator: 'volatility', weight: 0.9 }
    ];

    defaultWeights.forEach(({ indicator, weight }) => {
      if (!this.signalWeights.has(indicator)) {
        this.signalWeights.set(indicator, {
          indicator,
          weight,
          success_rate: 0.5,
          sample_size: 0,
          last_updated: Date.now()
        });
      }
    });
  }

  private startAutoSave(): void {
    this.saveTimer = setInterval(() => {
      this.saveData();
    }, this.learningConfig.save_interval * 60 * 1000);
  }

  private saveData(): void {
    try {
      const historyFile = path.join(this.dataPath, 'trade_history.json');
      fs.writeFileSync(historyFile, JSON.stringify(this.tradeHistory, null, 2));

      const weightsFile = path.join(this.dataPath, 'signal_weights.json');
      const weightsArray = Array.from(this.signalWeights.entries());
      fs.writeFileSync(weightsFile, JSON.stringify(weightsArray, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  public recordTrade(result: TradeResult): void {
    console.log(`[LearningService] 거래 기록: ${result.market}, 수익률: ${result.profitRate.toFixed(2)}%`);
    this.tradeHistory.push(result);
    this.updateWeights(result);
    this.emit('trade-recorded', result);
    
    // 코인별 가중치 업데이트
    this.updateCoinWeights(result.market, result);
    
    // trade-history-service와 동기화 (매도 결과만 기록)
    if (result.profitRate !== 0) {
      const tradeRecord = {
        market: result.market,
        timestamp: result.timestamp,  // timestamp 추가
        type: 'SELL' as const,
        price: result.exitPrice,
        volume: 0, // 수량 정보가 없으므로 0으로 설정
        totalAmount: 0,
        fee: 0,
        profit: result.profit,
        profitRate: result.profitRate,
        reason: `학습 기록 - 시장 상황: ${result.market_conditions.trend}`,
        indicators: result.indicators
      };
      
      tradeHistoryService.addTrade(tradeRecord);
    }
    
    // 즉시 저장
    this.saveData();
    console.log(`[LearningService] 데이터 저장 완료. 총 거래: ${this.tradeHistory.length}`);
  }

  private updateWeights(result: TradeResult): void {
    const success = result.profitRate > 0;
    const profitMagnitude = Math.abs(result.profitRate);

    // Update indicator weights based on their values at entry
    Object.entries(result.indicators).forEach(([indicator, value]) => {
      this.updateSingleWeight(indicator, success, profitMagnitude, value);
    });

    // Update market condition weights
    this.updateSingleWeight('market_trend', success, profitMagnitude, 
      result.market_conditions.trend === 'bull' ? 1 : -1);
    
    this.updateSingleWeight('volatility', success, profitMagnitude,
      result.market_conditions.volatility === 'high' ? 1 : 0);

    // Update news and whale weights
    // news_sentiment가 0이어도 학습에 포함 (0은 중립적인 뉴스를 의미)
    if (result.news_sentiment !== undefined) {
      this.updateSingleWeight('news_sentiment', success, profitMagnitude, 
        result.news_sentiment);
    }

    if (result.whale_activity) {
      this.updateSingleWeight('whale_activity', success, profitMagnitude, 1);
    }

    this.emit('weights-updated', this.getWeights());
  }

  private updateSingleWeight(
    indicator: string, 
    success: boolean, 
    profitMagnitude: number,
    signalStrength: number
  ): void {
    const weight = this.signalWeights.get(indicator);
    if (!weight) {
      console.warn(`[학습] 가중치 업데이트 실패 - ${indicator} 지표를 찾을 수 없습니다.`);
      return;
    }

    // Update success rate
    weight.sample_size++;
    const alpha = 1 / Math.min(weight.sample_size, 100); // Adaptive learning rate
    weight.success_rate = weight.success_rate * (1 - alpha) + (success ? 1 : 0) * alpha;

    // Adjust weight based on success rate and profit magnitude
    const targetWeight = weight.success_rate * (1 + profitMagnitude / 100);
    const adjustment = (targetWeight - weight.weight) * this.learningConfig.weight_adjustment_rate;
    
    // Apply adjustment with bounds
    const oldWeight = weight.weight;
    weight.weight = Math.max(0.1, Math.min(2.0, weight.weight + adjustment));
    weight.last_updated = Date.now();

    // 뉴스 관련 지표는 상세 로깅
    if (indicator === 'news_sentiment') {
      console.log(`[학습] ${indicator} 가중치 업데이트:`);
      console.log(`  - 신호 강도: ${signalStrength.toFixed(3)}`);
      console.log(`  - 성공 여부: ${success} (수익률: ${profitMagnitude.toFixed(2)}%)`);
      console.log(`  - 샘플 수: ${weight.sample_size}`);
      console.log(`  - 성공률: ${(weight.success_rate * 100).toFixed(1)}%`);
      console.log(`  - 가중치: ${oldWeight.toFixed(3)} → ${weight.weight.toFixed(3)} (변화: ${(weight.weight - oldWeight).toFixed(3)})`);
    }

    this.signalWeights.set(indicator, weight);
  }

  public getWeights(): Record<string, number> {
    const weights: Record<string, number> = {};
    this.signalWeights.forEach((value, key) => {
      weights[key] = value.weight;
    });
    
    // UI에서 사용하는 이름으로 매핑 추가
    weights['bollinger'] = weights['bb_position'] || 0.8;
    weights['stochastic'] = weights['stochastic_rsi'] || 0.9;
    weights['volume'] = weights['volume_ratio'] || 1.0;
    weights['obv'] = weights['obv_trend'] || 0.8;
    weights['trendStrength'] = weights['market_trend'] || 1.0;
    weights['aiAnalysis'] = weights['news_sentiment'] || 1.2;
    weights['newsImpact'] = weights['news_sentiment'] || 1.2;  // newsImpact와 news_sentiment 동일하게 매핑
    weights['whaleActivity'] = weights['whale_activity'] || 1.1;
    
    return weights;
  }

  // 코인별 가중치 학습 관리
  private coinWeightLearning: Map<string, {
    weights: Record<string, number>;
    trades: number;
    performance: {
      winRate: number;
      avgProfit: number;
      lastUpdated: number;
    };
  }> = new Map();

  // 코인별 가중치 가져오기
  public getCoinWeights(market: string): Record<string, number> | null {
    const coinLearning = this.coinWeightLearning.get(market);
    
    // 최소 거래 수 확인
    if (!coinLearning || coinLearning.trades < 50) {
      // 카테고리별 학습 확인
      const category = this.getCoinCategory(market);
      if (category) {
        const categoryWeights = this.getCategoryWeights(category);
        if (categoryWeights) return this.mapWeightNames(categoryWeights);
      }
      
      // 전역 가중치 반환
      return this.getWeights();
    }
    
    return this.mapWeightNames(coinLearning.weights);
  }
  
  // 가중치 이름 매핑
  private mapWeightNames(weights: Record<string, number>): Record<string, number> {
    const mappedWeights = { ...weights };
    
    // UI에서 사용하는 이름으로 매핑
    mappedWeights['bollinger'] = weights['bb_position'] || 0.8;
    mappedWeights['stochastic'] = weights['stochastic_rsi'] || 0.9;
    mappedWeights['volume'] = weights['volume_ratio'] || 1.0;
    mappedWeights['obv'] = weights['obv_trend'] || 0.8;
    mappedWeights['trendStrength'] = weights['market_trend'] || 1.0;
    mappedWeights['aiAnalysis'] = weights['news_sentiment'] || 1.2;
    mappedWeights['newsImpact'] = weights['news_sentiment'] || 1.2;
    mappedWeights['whaleActivity'] = weights['whale_activity'] || 1.1;
    
    return mappedWeights;
  }

  // 코인 카테고리 찾기
  private getCoinCategory(market: string): string | null {
    const symbol = market.split('-')[1];
    const categories: Record<string, string[]> = {
      major: ['BTC', 'ETH'],
      defi: ['UNI', 'AAVE', 'LINK'],
      layer1: ['SOL', 'AVAX', 'DOT', 'ATOM'],
      layer2: ['MATIC', 'ARB', 'OP'],
      meme: ['DOGE', 'SHIB']
    };
    
    for (const [category, coins] of Object.entries(categories)) {
      if (coins.includes(symbol)) return category;
    }
    
    return null;
  }

  // 카테고리별 평균 가중치
  private getCategoryWeights(category: string): Record<string, number> | null {
    const categoryCoins = this.getCategoryCoins(category);
    const weights: Record<string, Record<string, number>> = {};
    let count = 0;
    
    categoryCoins.forEach(coin => {
      const coinLearning = this.coinWeightLearning.get(`KRW-${coin}`);
      if (coinLearning && coinLearning.trades >= 50) {
        Object.entries(coinLearning.weights).forEach(([key, value]) => {
          if (!weights[key]) weights[key] = {};
          weights[key][coin] = value;
        });
        count++;
      }
    });
    
    if (count === 0) return null;
    
    // 평균 계산
    const avgWeights: Record<string, number> = {};
    Object.entries(weights).forEach(([indicator, coinWeights]) => {
      avgWeights[indicator] = Object.values(coinWeights).reduce((a, b) => a + b, 0) / count;
    });
    
    return avgWeights;
  }

  // 카테고리별 코인 목록
  private getCategoryCoins(category: string): string[] {
    const categories: Record<string, string[]> = {
      major: ['BTC', 'ETH'],
      defi: ['UNI', 'AAVE', 'LINK'],
      layer1: ['SOL', 'AVAX', 'DOT', 'ATOM'],
      layer2: ['MATIC', 'ARB', 'OP'],
      meme: ['DOGE', 'SHIB']
    };
    
    return categories[category] || [];
  }

  // 코인별 가중치 업데이트
  public updateCoinWeights(market: string, trade: TradeResult): void {
    if (!this.isLearningEnabled(market)) return;
    
    let coinLearning = this.coinWeightLearning.get(market);
    if (!coinLearning) {
      // 초기화 - 전역 가중치 또는 카테고리 가중치로 시작
      const initialWeights = this.getCoinWeights(market) || this.getWeights();
      coinLearning = {
        weights: { ...initialWeights },
        trades: 0,
        performance: {
          winRate: 0,
          avgProfit: 0,
          lastUpdated: Date.now()
        }
      };
      this.coinWeightLearning.set(market, coinLearning);
    }
    
    // 거래 기록
    coinLearning.trades++;
    
    // 성과 업데이트
    const isWin = trade.profitRate > 0;
    const oldWinRate = coinLearning.performance.winRate;
    coinLearning.performance.winRate = 
      (oldWinRate * (coinLearning.trades - 1) + (isWin ? 1 : 0)) / coinLearning.trades;
    
    const oldAvgProfit = coinLearning.performance.avgProfit;
    coinLearning.performance.avgProfit = 
      (oldAvgProfit * (coinLearning.trades - 1) + trade.profitRate) / coinLearning.trades;
    
    coinLearning.performance.lastUpdated = Date.now();
    
    // 가중치 조정 (50거래 이후부터)
    if (coinLearning.trades >= 50) {
      this.adjustCoinWeights(market, trade, coinLearning);
    }
  }

  // 코인별 가중치 조정
  private adjustCoinWeights(
    market: string, 
    trade: TradeResult, 
    coinLearning: any
  ): void {
    const adjustmentRate = 0.01; // 1% 씩 조정
    const profitMultiplier = trade.profitRate > 0 ? 1 : -1;
    
    // 각 지표의 기여도에 따라 가중치 조정
    Object.entries(trade.indicators).forEach(([indicator, value]) => {
      if (coinLearning.weights[indicator] !== undefined) {
        // 수익이 났으면 해당 지표의 가중치 증가, 손실이면 감소
        const adjustment = adjustmentRate * profitMultiplier;
        coinLearning.weights[indicator] = Math.max(0.1, Math.min(2.0, 
          coinLearning.weights[indicator] * (1 + adjustment)
        ));
      }
    });
  }

  public getPerformanceStats(market?: string, days: number = 30): {
    total_trades: number;
    win_rate: number;
    average_profit: number;
    best_trade: number;
    worst_trade: number;
    sharpe_ratio: number;
    profit_factor: number;
    max_consecutive_wins: number;
    max_consecutive_losses: number;
  } {
    // trade-history-service에서 실제 거래 데이터 가져오기
    const endDate = Date.now();
    const startDate = endDate - days * 24 * 60 * 60 * 1000;
    
    const realTrades = tradeHistoryService.getTrades({
      market,
      startDate,
      endDate,
      type: 'SELL' // 매도 거래만 (수익률 계산 가능)
    });
    
    // 실거래 데이터를 학습 데이터 형식으로 변환
    const learningTrades = realTrades
      .filter(t => t.profitRate !== undefined)
      .map(t => ({
        market: t.market,
        timestamp: t.timestamp,
        entryPrice: 0,
        exitPrice: t.price,
        profit: t.profit || 0,
        profitRate: t.profitRate || 0,
        holding_period: 0,
        indicators: t.indicators || {
          rsi: 50,
          macd: 0,
          bb_position: 0,
          volume_ratio: 1,
          stochastic_rsi: 50,
          atr: 0,
          obv_trend: 0,
          adx: 0
        },
        market_conditions: {
          trend: 'sideways' as const,
          volatility: 'medium' as const,
          volume: 'medium' as const
        },
        news_sentiment: 0,
        whale_activity: false
      }));
    
    // 기존 학습 데이터와 병합
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const historicalTrades = this.tradeHistory.filter(trade => 
      trade.timestamp > cutoffDate && 
      (!market || trade.market === market)
    );
    
    // 실거래와 학습 데이터 병합 (중복 제거)
    const tradeMap = new Map<string, TradeResult>();
    
    // 학습 데이터 추가
    historicalTrades.forEach(t => {
      const key = `${t.market}_${t.timestamp}`;
      tradeMap.set(key, t);
    });
    
    // 실거래 데이터 추가 (중복 제거)
    learningTrades.forEach(t => {
      const key = `${t.market}_${t.timestamp}`;
      if (!tradeMap.has(key)) {
        // indicators 타입 보정 - 필요한 필드만 유지
        const normalizedIndicators: {
          rsi: number;
          macd: number;
          bb_position: number;
          volume_ratio: number;
          stochastic_rsi: number;
          atr: number;
          obv_trend: number;
          adx: number;
        } = {
          rsi: (t.indicators as any).rsi || 0,
          macd: (t.indicators as any).macd || 0,
          bb_position: (t.indicators as any).bb_position || 0,
          volume_ratio: (t.indicators as any).volume_ratio || 0,
          stochastic_rsi: (t.indicators as any).stochastic_rsi || 0,
          atr: (t.indicators as any).atr || 0,
          obv_trend: (t.indicators as any).obv_trend || 0,
          adx: (t.indicators as any).adx || 0
        };
        
        tradeMap.set(key, {
          ...t,
          indicators: normalizedIndicators
        });
      }
    });
    
    const relevantTrades = Array.from(tradeMap.values());

    if (relevantTrades.length === 0) {
      return {
        total_trades: 0,
        win_rate: 0,
        average_profit: 0,
        best_trade: 0,
        worst_trade: 0,
        sharpe_ratio: 0,
        profit_factor: 0,
        max_consecutive_wins: 0,
        max_consecutive_losses: 0
      };
    }

    const profits = relevantTrades.map(t => t.profitRate);
    const wins = profits.filter(p => p > 0);
    const losses = profits.filter(p => p < 0);

    // Calculate consecutive wins/losses
    let currentWins = 0, currentLosses = 0;
    let maxWins = 0, maxLosses = 0;

    relevantTrades.forEach(trade => {
      if (trade.profitRate > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    });

    // Calculate Sharpe Ratio
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
    const stdDev = Math.sqrt(
      profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length
    );
    const sharpeRatio = stdDev > 0 ? (avgProfit / stdDev) * Math.sqrt(365) : 0;

    // Calculate Profit Factor
    const totalWins = wins.reduce((a, b) => a + Math.abs(b), 0);
    const totalLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins;

    return {
      total_trades: relevantTrades.length,
      win_rate: relevantTrades.length > 0 ? (wins.length / relevantTrades.length) * 100 : 0,
      average_profit: avgProfit,
      best_trade: profits.length > 0 ? Math.max(...profits) : 0,
      worst_trade: profits.length > 0 ? Math.min(...profits) : 0,
      sharpe_ratio: sharpeRatio,
      profit_factor: profitFactor,
      max_consecutive_wins: maxWins,
      max_consecutive_losses: maxLosses
    };
  }

  public getIndicatorPerformance(): Array<{
    indicator: string;
    weight: number;
    success_rate: number;
    sample_size: number;
    confidence: number;
  }> {
    const performance: Array<any> = [];
    
    this.signalWeights.forEach((value, key) => {
      const confidence = Math.min(value.sample_size / this.learningConfig.min_sample_size, 1);
      performance.push({
        indicator: key,
        weight: value.weight,
        success_rate: value.success_rate,
        sample_size: value.sample_size,
        confidence
      });
    });

    return performance.sort((a, b) => b.weight - a.weight);
  }

  public getOptimalParameters(market: string): {
    rsi_period?: number;
    macd_fast?: number;
    macd_slow?: number;
    bb_period?: number;
    volume_threshold?: number;
    profit_target?: number;
    stop_loss?: number;
  } {
    // Analyze recent trades to find optimal parameters
    const recentTrades = this.tradeHistory
      .filter(t => t.market === market)
      .slice(-100);

    if (recentTrades.length < 20) {
      return {}; // Not enough data
    }

    // Group trades by parameter ranges and calculate success rates
    const profitableTrades = recentTrades.filter(t => t.profitRate > 0);
    
    // Calculate optimal profit target and stop loss
    const profitRates = profitableTrades.map(t => t.profitRate);
    const lossRates = recentTrades
      .filter(t => t.profitRate < 0)
      .map(t => Math.abs(t.profitRate));

    const optimalProfitTarget = profitRates.length > 0 ?
      profitRates.reduce((a, b) => a + b, 0) / profitRates.length * 0.8 : 2.0;
    
    const optimalStopLoss = lossRates.length > 0 ?
      lossRates.reduce((a, b) => a + b, 0) / lossRates.length * 1.2 : 1.5;

    return {
      profit_target: Math.round(optimalProfitTarget * 10) / 10,
      stop_loss: Math.round(optimalStopLoss * 10) / 10
    };
  }

  public predictTradeSuccess(
    market: string,
    indicators: Record<string, number>,
    marketConditions: any
  ): {
    probability: number;
    confidence: number;
    key_factors: string[];
  } {
    let totalScore = 0;
    let totalWeight = 0;
    const keyFactors: string[] = [];

    // Score each indicator based on its weight and value
    Object.entries(indicators).forEach(([indicator, value]) => {
      const weight = this.signalWeights.get(indicator);
      if (weight && weight.sample_size >= 5) {
        const normalizedValue = this.normalizeIndicatorValue(indicator, value);
        const score = normalizedValue * weight.weight * weight.success_rate;
        totalScore += score;
        totalWeight += weight.weight;

        if (Math.abs(score) > 0.5) {
          keyFactors.push(`${indicator}: ${score > 0 ? '긍정적' : '부정적'}`);
        }
      }
    });

    // Add market condition scoring
    if (marketConditions.trend === 'bull') {
      const trendWeight = this.signalWeights.get('market_trend');
      if (trendWeight) {
        totalScore += trendWeight.weight * trendWeight.success_rate;
        totalWeight += trendWeight.weight;
        keyFactors.push('상승 추세');
      }
    }

    const probability = totalWeight > 0 ? 
      Math.max(0, Math.min(1, (totalScore / totalWeight + 1) / 2)) : 0.5;
    
    const avgSampleSize = Array.from(this.signalWeights.values())
      .reduce((sum, w) => sum + w.sample_size, 0) / this.signalWeights.size;
    
    const confidence = Math.min(avgSampleSize / this.learningConfig.min_sample_size, 1);

    return {
      probability,
      confidence,
      key_factors: keyFactors.slice(0, 3)
    };
  }

  private normalizeIndicatorValue(indicator: string, value: number): number {
    // Normalize indicator values to [-1, 1] range
    switch (indicator) {
      case 'rsi':
        return (value - 50) / 50;
      case 'macd':
        return Math.max(-1, Math.min(1, value / 100));
      case 'bb_position':
        return value;
      case 'volume_ratio':
        return Math.max(-1, Math.min(1, (value - 1) / 2));
      case 'stochastic_rsi':
        return (value - 50) / 50;
      case 'obv_trend':
        return Math.max(-1, Math.min(1, value));
      case 'adx':
        return (value - 25) / 25;
      default:
        return 0;
    }
  }

  public destroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    this.saveData();
  }

  // 학습 모드 관리
  private learningStates: Map<string, boolean> = new Map();

  public isLearningEnabled(ticker: string): boolean {
    return this.learningStates.get(ticker) || false;
  }

  public getLearningStates(): Array<{ ticker: string; isRunning: boolean }> {
    const states: Array<{ ticker: string; isRunning: boolean }> = [];
    this.learningStates.forEach((isRunning, ticker) => {
      states.push({ ticker, isRunning });
    });
    return states;
  }

  public setLearningState(ticker: string, isRunning: boolean): void {
    console.log(`[LearningService] Restoring learning state for ${ticker}: ${isRunning}`);
    this.learningStates.set(ticker, isRunning);
  }

  public startLearning(ticker: string): void {
    console.log(`[LearningService] Starting learning for ${ticker}`);
    this.learningStates.set(ticker, true);
    this.emit('learningStateChanged', this.getLearningStates());
  }

  public stopLearning(ticker: string): void {
    console.log(`[LearningService] Stopping learning for ${ticker}`);
    this.learningStates.set(ticker, false);
    this.emit('learningStateChanged', this.getLearningStates());
  }

  // 쿨타임 학습 관련
  private cooldownLearning: Map<string, {
    buyCooldown: number;
    sellCooldown: number;
    performance: {
      avgTimeBetweenTrades: number;
      consecutiveLosses: number;
      recentVolatility: number;
      lastUpdated: number;
    };
  }> = new Map();

  // 쿨타임 조정
  public adjustCooldown(market: string, tradeResult: TradeResult): { buyCooldown: number; sellCooldown: number } | null {
    if (!this.learningConfig.cooldown_adjustment_enabled) {
      return null;
    }

    let cooldownData = this.cooldownLearning.get(market);
    if (!cooldownData) {
      // 초기값 설정 (기본 30분)
      cooldownData = {
        buyCooldown: 30,
        sellCooldown: 30,
        performance: {
          avgTimeBetweenTrades: 30,
          consecutiveLosses: 0,
          recentVolatility: 0.5,
          lastUpdated: Date.now()
        }
      };
      this.cooldownLearning.set(market, cooldownData);
    }

    // 성과 업데이트
    if (tradeResult.profitRate < 0) {
      cooldownData.performance.consecutiveLosses++;
    } else {
      cooldownData.performance.consecutiveLosses = 0;
    }

    // 변동성 계산 (ATR 기반)
    cooldownData.performance.recentVolatility = tradeResult.indicators.atr;
    cooldownData.performance.lastUpdated = Date.now();

    // 쿨타임 조정 로직
    const adjustmentRate = this.learningConfig.cooldown_adjustment_rate;
    
    // 1. 연속 손실 시 쿨타임 증가
    if (cooldownData.performance.consecutiveLosses > 2) {
      cooldownData.buyCooldown = Math.min(MAX_COOLDOWN, cooldownData.buyCooldown * (1 + adjustmentRate * cooldownData.performance.consecutiveLosses));
    }
    
    // 2. 수익 거래 후 쿨타임 감소
    if (tradeResult.profitRate > 2) {
      cooldownData.buyCooldown = Math.max(MIN_COOLDOWN, cooldownData.buyCooldown * (1 - adjustmentRate));
      cooldownData.sellCooldown = Math.max(MIN_COOLDOWN, cooldownData.sellCooldown * (1 - adjustmentRate));
    }
    
    // 3. 변동성에 따른 조정
    if (cooldownData.performance.recentVolatility > 2) {
      // 고변동성 시장: 쿨타임 감소 (기회 포착)
      cooldownData.buyCooldown = Math.max(MIN_COOLDOWN, cooldownData.buyCooldown * 0.8);
    } else if (cooldownData.performance.recentVolatility < 0.5) {
      // 저변동성 시장: 쿨타임 증가 (거래 빈도 감소)
      cooldownData.buyCooldown = Math.min(MAX_COOLDOWN, cooldownData.buyCooldown * 1.2);
    }

    // 4. 시장 상황에 따른 조정
    if (tradeResult.market_conditions.trend === 'bull') {
      // 상승장: 매수 쿨타임 감소
      cooldownData.buyCooldown = Math.max(MIN_COOLDOWN, cooldownData.buyCooldown * 0.9);
    } else if (tradeResult.market_conditions.trend === 'bear') {
      // 하락장: 매수 쿨타임 증가, 매도 쿨타임 감소
      cooldownData.buyCooldown = Math.min(MAX_COOLDOWN, cooldownData.buyCooldown * 1.1);
      cooldownData.sellCooldown = Math.max(MIN_COOLDOWN, cooldownData.sellCooldown * 0.9);
    }

    console.log(`[LearningService] ${market} 쿨타임 조정: 매수 ${cooldownData.buyCooldown.toFixed(0)}분, 매도 ${cooldownData.sellCooldown.toFixed(0)}분`);
    
    // 저장
    this.saveCooldownData();
    
    return {
      buyCooldown: Math.round(cooldownData.buyCooldown),
      sellCooldown: Math.round(cooldownData.sellCooldown)
    };
  }

  // 쿨타임 데이터 저장
  private saveCooldownData(): void {
    try {
      const cooldownFile = path.join(this.dataPath, 'cooldown_learning.json');
      const cooldownArray = Array.from(this.cooldownLearning.entries());
      fs.writeFileSync(cooldownFile, JSON.stringify(cooldownArray, null, 2));
    } catch (error) {
      console.error('Error saving cooldown data:', error);
    }
  }

  // 쿨타임 데이터 로드
  private loadCooldownData(): void {
    try {
      const cooldownFile = path.join(this.dataPath, 'cooldown_learning.json');
      if (fs.existsSync(cooldownFile)) {
        const data = fs.readFileSync(cooldownFile, 'utf8');
        const cooldownArray = JSON.parse(data);
        this.cooldownLearning = new Map(cooldownArray);
      }
    } catch (error) {
      console.error('Error loading cooldown data:', error);
    }
  }

  // 쿨타임 학습 정보 가져오기
  public getCooldownInfo(market: string): any {
    const cooldownData = this.cooldownLearning.get(market);
    if (!cooldownData) {
      return {
        buyCooldown: 30,
        sellCooldown: 30,
        isLearning: false
      };
    }

    return {
      buyCooldown: cooldownData.buyCooldown,
      sellCooldown: cooldownData.sellCooldown,
      performance: cooldownData.performance,
      isLearning: this.learningConfig.cooldown_adjustment_enabled
    };
  }
}