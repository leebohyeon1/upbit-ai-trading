import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

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
}

export class LearningService extends EventEmitter {
  private tradeHistory: TradeResult[] = [];
  private signalWeights: Map<string, SignalWeight> = new Map();
  private learningConfig: LearningConfig = {
    min_sample_size: 20,
    weight_adjustment_rate: 0.1,
    performance_window: 30,
    save_interval: 30
  };
  private dataPath: string;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.dataPath = path.join(process.cwd(), 'data', 'learning');
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
    this.tradeHistory.push(result);
    this.updateWeights(result);
    this.emit('trade-recorded', result);
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
    if (result.news_sentiment !== 0) {
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
    if (!weight) return;

    // Update success rate
    weight.sample_size++;
    const alpha = 1 / Math.min(weight.sample_size, 100); // Adaptive learning rate
    weight.success_rate = weight.success_rate * (1 - alpha) + (success ? 1 : 0) * alpha;

    // Adjust weight based on success rate and profit magnitude
    const targetWeight = weight.success_rate * (1 + profitMagnitude / 100);
    const adjustment = (targetWeight - weight.weight) * this.learningConfig.weight_adjustment_rate;
    
    // Apply adjustment with bounds
    weight.weight = Math.max(0.1, Math.min(2.0, weight.weight + adjustment));
    weight.last_updated = Date.now();

    this.signalWeights.set(indicator, weight);
  }

  public getWeights(): Record<string, number> {
    const weights: Record<string, number> = {};
    this.signalWeights.forEach((value, key) => {
      weights[key] = value.weight;
    });
    return weights;
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
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const relevantTrades = this.tradeHistory.filter(trade => 
      trade.timestamp > cutoffDate && 
      (!market || trade.market === market)
    );

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
      win_rate: wins.length / relevantTrades.length,
      average_profit: avgProfit,
      best_trade: Math.max(...profits),
      worst_trade: Math.min(...profits),
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
}