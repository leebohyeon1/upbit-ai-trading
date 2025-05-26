import upbitService, { CandleData } from './upbit-service';
import analysisService, { TechnicalAnalysis } from './analysis-service';
import { TradingConfig } from './trading-engine';

export interface BacktestResult {
  market: string;
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  trades: BacktestTrade[];
  performance: {
    totalTrades: number;
    winTrades: number;
    lossTrades: number;
    winRate: number;
    totalReturn: number;
    averageReturn: number;
    maxProfit: number;
    maxLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  marketConditions: {
    bullMarket: PerformanceByCondition;
    bearMarket: PerformanceByCondition;
    sidewaysMarket: PerformanceByCondition;
  };
  optimalParameters?: OptimalParameters;
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL';
  date: Date;
  price: number;
  amount: number;
  confidence: number;
  profit?: number;
  profitPercent?: number;
  signal: string;
}

export interface PerformanceByCondition {
  trades: number;
  winRate: number;
  averageReturn: number;
}

export interface OptimalParameters {
  rsiOverbought: number;
  rsiOversold: number;
  minConfidenceForTrade: number;
  buyRatio: number;
  sellRatio: number;
  score: number;
}

class BacktestService {
  // 백테스트 실행 (과거 6개월)
  async runBacktest(
    market: string,
    config: TradingConfig,
    months: number = 6
  ): Promise<BacktestResult> {
    console.log(`Starting backtest for ${market} over ${months} months...`);
    
    // 과거 데이터 가져오기
    const candles = await this.fetchHistoricalData(market, months);
    if (candles.length < 200) {
      throw new Error('Insufficient historical data for backtest');
    }
    
    // 백테스트 실행
    const trades: BacktestTrade[] = [];
    let position: { price: number; amount: number; date: Date } | null = null;
    let capital = 1000000; // 초기 자본 100만원
    let maxCapital = capital;
    let minCapital = capital;
    
    // 슬라이딩 윈도우로 캔들 데이터 분석
    for (let i = 200; i < candles.length; i++) {
      const window = candles.slice(i - 200, i + 1);
      const currentCandle = window[window.length - 1];
      
      // 기술적 분석 수행
      const analysis = await analysisService.analyzeTechnicals(window);
      
      // 동적 파라미터 조정 시뮬레이션
      const adjustedConfig = this.adjustParametersForBacktest(config, trades);
      
      // 거래 신호 확인
      if (analysis.confidence >= adjustedConfig.minConfidenceForTrade) {
        if (analysis.signal === 'BUY' && !position) {
          // 매수
          const buyAmount = capital * adjustedConfig.buyRatio;
          const shares = buyAmount / currentCandle.trade_price;
          
          position = {
            price: currentCandle.trade_price,
            amount: shares,
            date: new Date(currentCandle.candle_date_time_utc)
          };
          
          trades.push({
            type: 'BUY',
            date: position.date,
            price: position.price,
            amount: position.amount,
            confidence: analysis.confidence,
            signal: analysis.scores?.activeSignals?.join(', ') || 'Technical Buy'
          });
          
          capital -= buyAmount;
        } else if (analysis.signal === 'SELL' && position) {
          // 매도
          const sellAmount = position.amount * adjustedConfig.sellRatio;
          const sellValue = sellAmount * currentCandle.trade_price;
          const profit = (currentCandle.trade_price - position.price) * sellAmount;
          const profitPercent = ((currentCandle.trade_price - position.price) / position.price) * 100;
          
          trades.push({
            type: 'SELL',
            date: new Date(currentCandle.candle_date_time_utc),
            price: currentCandle.trade_price,
            amount: sellAmount,
            confidence: analysis.confidence,
            profit,
            profitPercent,
            signal: analysis.scores?.activeSignals?.join(', ') || 'Technical Sell'
          });
          
          capital += sellValue;
          
          // 포지션 업데이트
          position.amount -= sellAmount;
          if (position.amount <= 0.0001) {
            position = null;
          }
          
          // 최대/최소 자본 추적
          maxCapital = Math.max(maxCapital, capital);
          minCapital = Math.min(minCapital, capital);
        }
      }
    }
    
    // 마지막 포지션 청산
    if (position) {
      const lastCandle = candles[candles.length - 1];
      const sellValue = position.amount * lastCandle.trade_price;
      const profit = (lastCandle.trade_price - position.price) * position.amount;
      const profitPercent = ((lastCandle.trade_price - position.price) / position.price) * 100;
      
      trades.push({
        type: 'SELL',
        date: new Date(lastCandle.candle_date_time_utc),
        price: lastCandle.trade_price,
        amount: position.amount,
        confidence: 100,
        profit,
        profitPercent,
        signal: 'Final Position Close'
      });
      
      capital += sellValue;
    }
    
    // 성과 계산
    const performance = this.calculatePerformance(trades, capital, maxCapital, minCapital);
    
    // 시장 상황별 성과 분석
    const marketConditions = await this.analyzeMarketConditions(market, candles, trades);
    
    return {
      market,
      period: {
        start: new Date(candles[0].candle_date_time_utc),
        end: new Date(candles[candles.length - 1].candle_date_time_utc),
        days: Math.round((new Date(candles[candles.length - 1].candle_date_time_utc).getTime() - 
                         new Date(candles[0].candle_date_time_utc).getTime()) / (1000 * 60 * 60 * 24))
      },
      trades,
      performance,
      marketConditions
    };
  }
  
  // 최적 파라미터 탐색
  async findOptimalParameters(
    market: string,
    baseConfig: TradingConfig,
    months: number = 6
  ): Promise<OptimalParameters> {
    console.log(`Searching for optimal parameters for ${market}...`);
    
    const parameterSets = this.generateParameterCombinations();
    let bestParams: OptimalParameters | null = null;
    let bestScore = -Infinity;
    
    for (const params of parameterSets) {
      const testConfig = {
        ...baseConfig,
        rsiOverbought: params.rsiOverbought,
        rsiOversold: params.rsiOversold,
        minConfidenceForTrade: params.minConfidenceForTrade,
        buyRatio: params.buyRatio,
        sellRatio: params.sellRatio
      };
      
      try {
        const result = await this.runBacktest(market, testConfig, months);
        
        // 점수 계산 (승률 * 평균 수익률 - 최대 낙폭)
        const score = result.performance.winRate * result.performance.averageReturn - 
                     result.performance.maxDrawdown;
        
        if (score > bestScore) {
          bestScore = score;
          bestParams = {
            ...params,
            score
          };
        }
      } catch (error) {
        console.error('Backtest failed for parameters:', params, error);
      }
    }
    
    return bestParams || {
      rsiOverbought: 70,
      rsiOversold: 30,
      minConfidenceForTrade: 60,
      buyRatio: 0.3,
      sellRatio: 0.5,
      score: 0
    };
  }
  
  // 과거 데이터 가져오기
  private async fetchHistoricalData(market: string, months: number): Promise<CandleData[]> {
    const allCandles: CandleData[] = [];
    const candlesPerDay = 288; // 5분봉 기준 하루 288개
    const totalCandles = candlesPerDay * 30 * months;
    const requestsNeeded = Math.ceil(totalCandles / 200); // API 한 번에 200개까지
    
    let lastDateTime: string | null = null;
    
    for (let i = 0; i < requestsNeeded; i++) {
      try {
        const candles = await upbitService.getCandles(market, 200);
        
        if (candles.length === 0) break;
        
        // 중복 제거
        const newCandles: CandleData[] = lastDateTime
          ? candles.filter(c => c.candle_date_time_utc < lastDateTime!)
          : candles;
        
        allCandles.push(...newCandles);
        
        if (newCandles.length < 200) break; // 더 이상 데이터 없음
        
        lastDateTime = newCandles[newCandles.length - 1].candle_date_time_utc;
        
        // API 요청 제한 방지
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
        break;
      }
    }
    
    // 시간순 정렬 (오래된 것부터)
    return allCandles.sort((a, b) => 
      new Date(a.candle_date_time_utc).getTime() - new Date(b.candle_date_time_utc).getTime()
    );
  }
  
  // 백테스트용 동적 파라미터 조정
  private adjustParametersForBacktest(config: TradingConfig, trades: BacktestTrade[]): TradingConfig {
    if (!config.dynamicConfidence || trades.length < 5) {
      return config;
    }
    
    const recentTrades = trades.slice(-5);
    const losses = recentTrades.filter(t => t.profit && t.profit < 0).length;
    
    const adjustedConfig = { ...config };
    
    // 연속 손실 시 신뢰도 임계값 상향
    if (losses >= 3) {
      adjustedConfig.minConfidenceForTrade = Math.min(90, config.minConfidenceForTrade + 10);
    }
    
    return adjustedConfig;
  }
  
  // 성과 계산
  private calculatePerformance(
    trades: BacktestTrade[],
    finalCapital: number,
    maxCapital: number,
    minCapital: number
  ): BacktestResult['performance'] {
    const sellTrades = trades.filter(t => t.type === 'SELL' && t.profit !== undefined);
    const winTrades = sellTrades.filter(t => t.profit! > 0);
    const lossTrades = sellTrades.filter(t => t.profit! <= 0);
    
    const totalReturn = ((finalCapital - 1000000) / 1000000) * 100;
    const averageReturn = sellTrades.length > 0
      ? sellTrades.reduce((sum, t) => sum + (t.profitPercent || 0), 0) / sellTrades.length
      : 0;
    
    const maxProfit = sellTrades.length > 0
      ? Math.max(...sellTrades.map(t => t.profitPercent || 0))
      : 0;
    
    const maxLoss = sellTrades.length > 0
      ? Math.min(...sellTrades.map(t => t.profitPercent || 0))
      : 0;
    
    const maxDrawdown = ((maxCapital - minCapital) / maxCapital) * 100;
    
    // Sharpe Ratio 계산 (간단화된 버전)
    const returns = sellTrades.map(t => t.profitPercent || 0);
    const avgReturn = returns.length > 0
      ? returns.reduce((sum, r) => sum + r, 0) / returns.length
      : 0;
    
    const stdDev = returns.length > 0
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
      : 1;
    
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
    
    return {
      totalTrades: trades.length,
      winTrades: winTrades.length,
      lossTrades: lossTrades.length,
      winRate: sellTrades.length > 0 ? (winTrades.length / sellTrades.length) * 100 : 0,
      totalReturn,
      averageReturn,
      maxProfit,
      maxLoss,
      maxDrawdown,
      sharpeRatio
    };
  }
  
  // 시장 상황별 성과 분석
  private async analyzeMarketConditions(
    market: string,
    candles: CandleData[],
    trades: BacktestTrade[]
  ): Promise<BacktestResult['marketConditions']> {
    // 시장 상황 분류
    const marketPhases: Array<{ start: number; end: number; type: 'bull' | 'bear' | 'sideways' }> = [];
    const windowSize = 288 * 7; // 7일 단위로 시장 분석
    
    for (let i = windowSize; i < candles.length; i += windowSize) {
      const window = candles.slice(i - windowSize, i);
      const startPrice = window[0].trade_price;
      const endPrice = window[window.length - 1].trade_price;
      const change = ((endPrice - startPrice) / startPrice) * 100;
      
      let type: 'bull' | 'bear' | 'sideways';
      if (change > 10) type = 'bull';
      else if (change < -10) type = 'bear';
      else type = 'sideways';
      
      marketPhases.push({
        start: i - windowSize,
        end: i,
        type
      });
    }
    
    // 각 시장 상황별 거래 성과 계산
    const bullTrades: BacktestTrade[] = [];
    const bearTrades: BacktestTrade[] = [];
    const sidewaysTrades: BacktestTrade[] = [];
    
    for (const trade of trades) {
      const tradeIndex = candles.findIndex(c => 
        new Date(c.candle_date_time_utc).getTime() >= trade.date.getTime()
      );
      
      if (tradeIndex >= 0) {
        const phase = marketPhases.find(p => tradeIndex >= p.start && tradeIndex < p.end);
        if (phase) {
          if (phase.type === 'bull') bullTrades.push(trade);
          else if (phase.type === 'bear') bearTrades.push(trade);
          else sidewaysTrades.push(trade);
        }
      }
    }
    
    return {
      bullMarket: this.calculateConditionPerformance(bullTrades),
      bearMarket: this.calculateConditionPerformance(bearTrades),
      sidewaysMarket: this.calculateConditionPerformance(sidewaysTrades)
    };
  }
  
  // 조건별 성과 계산
  private calculateConditionPerformance(trades: BacktestTrade[]): PerformanceByCondition {
    const sellTrades = trades.filter(t => t.type === 'SELL' && t.profit !== undefined);
    const winTrades = sellTrades.filter(t => t.profit! > 0);
    
    return {
      trades: trades.length,
      winRate: sellTrades.length > 0 ? (winTrades.length / sellTrades.length) * 100 : 0,
      averageReturn: sellTrades.length > 0
        ? sellTrades.reduce((sum, t) => sum + (t.profitPercent || 0), 0) / sellTrades.length
        : 0
    };
  }
  
  // 파라미터 조합 생성
  private generateParameterCombinations(): Array<Omit<OptimalParameters, 'score'>> {
    const combinations: Array<Omit<OptimalParameters, 'score'>> = [];
    
    // RSI 범위
    const rsiOverboughtValues = [65, 70, 75, 80];
    const rsiOversoldValues = [20, 25, 30, 35];
    
    // 신뢰도 범위
    const confidenceValues = [50, 60, 70, 80];
    
    // 거래 비율 범위
    const buyRatios = [0.2, 0.3, 0.4, 0.5];
    const sellRatios = [0.3, 0.5, 0.7, 1.0];
    
    // 모든 조합 생성 (총 256개)
    for (const rsiOverbought of rsiOverboughtValues) {
      for (const rsiOversold of rsiOversoldValues) {
        for (const minConfidenceForTrade of confidenceValues) {
          for (const buyRatio of buyRatios) {
            for (const sellRatio of sellRatios) {
              combinations.push({
                rsiOverbought,
                rsiOversold,
                minConfidenceForTrade,
                buyRatio,
                sellRatio
              });
            }
          }
        }
      }
    }
    
    // 무작위로 20개만 선택 (성능을 위해)
    return combinations
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);
  }
}

export default new BacktestService();