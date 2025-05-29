import UpbitService from './upbit-service';
import * as fs from 'fs';
import * as path from 'path';

export interface MeanReversionConfig {
  symbol: string;
  enabled: boolean;
  period: number;                    // 이동평균 기간 (기본 20)
  stdDevPeriod: number;              // 표준편차 계산 기간 (기본 20)
  upperBand: number;                 // 상단 밴드 배수 (기본 2.0)
  lowerBand: number;                 // 하단 밴드 배수 (기본 2.0)
  rsiPeriod: number;                 // RSI 기간 (기본 14)
  rsiOverbought: number;             // RSI 과매수 기준 (기본 70)
  rsiOversold: number;               // RSI 과매도 기준 (기본 30)
  stochPeriod: number;               // Stochastic 기간 (기본 14)
  stochOverbought: number;           // Stochastic 과매수 기준 (기본 80)
  stochOversold: number;             // Stochastic 과매도 기준 (기본 20)
  volumeConfirmation: boolean;       // 거래량 확인 필요 여부
  volumeThreshold: number;           // 거래량 임계값 (평균 대비 배수)
  maxPositions: number;              // 최대 동시 포지션 수
  positionSize: number;              // 포지션 크기 (KRW)
  stopLossRatio: number;             // 손절 비율 (%)
  takeProfitRatio: number;           // 익절 비율 (%)
  timeframe: string;                 // 분석 시간대
  cooldownPeriod: number;            // 재진입 대기 시간 (분)
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  width: number;
  percentB: number;
}

export interface MeanReversionSignal {
  symbol: string;
  timestamp: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;                  // 신호 강도 (0-1)
  confidence: number;                // 신뢰도 (0-1)
  price: number;
  indicators: {
    bollingerBands: BollingerBands;
    rsi: number;
    stochastic: {
      k: number;
      d: number;
    };
    volumeRatio: number;
    pricePosition: number;           // 밴드 내 위치 (0-1)
  };
  reasons: string[];
}

export interface MeanReversionPosition {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  entryTime: number;
  amount: number;
  investmentAmount: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitRate: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  entrySignal: MeanReversionSignal;
  maxFavorableExcursion: number;     // 최대 유리한 변동
  maxAdverseExcursion: number;       // 최대 불리한 변동
  holdingPeriod: number;             // 보유 시간 (분)
}

export interface MeanReversionStatus {
  isEnabled: boolean;
  activePositions: number;
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  positions: MeanReversionPosition[];
  recentSignals: MeanReversionSignal[];
  statistics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
    profitFactor: number;
    avgHoldingPeriod: number;
    maxDrawdown: number;
    sharpeRatio: number;
    calmarRatio: number;
  };
}

export class MeanReversionService {
  private upbitService: typeof UpbitService;
  private configPath: string;
  private positionsPath: string;
  private signalsPath: string;
  private tradeHistoryPath: string;
  private meanReversionConfigs: Map<string, MeanReversionConfig> = new Map();
  private meanReversionPositions: Map<string, MeanReversionPosition> = new Map();
  private recentSignals: MeanReversionSignal[] = [];
  private tradeHistory: any[] = [];
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cooldownMap: Map<string, number> = new Map();

  constructor() {
    this.upbitService = UpbitService;
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.configPath = path.join(dataDir, 'mean-reversion-configs.json');
    this.positionsPath = path.join(dataDir, 'mean-reversion-positions.json');
    this.signalsPath = path.join(dataDir, 'mean-reversion-signals.json');
    this.tradeHistoryPath = path.join(dataDir, 'mean-reversion-history.json');
    
    this.loadConfigs();
    this.loadPositions();
    this.loadSignals();
    this.loadTradeHistory();
  }

  /**
   * 평균 회귀 전략 시작
   */
  async startMeanReversionStrategy(): Promise<void> {
    if (this.isRunning) {
      throw new Error('평균 회귀 전략이 이미 실행 중입니다.');
    }

    console.log('평균 회귀 전략 시작...');
    this.isRunning = true;

    // 모니터링 시작
    this.startMonitoring();
  }

  /**
   * 평균 회귀 전략 중지
   */
  async stopMeanReversionStrategy(): Promise<void> {
    console.log('평균 회귀 전략 중지...');
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 평균 회귀 설정 저장
   */
  async saveMeanReversionConfig(config: MeanReversionConfig): Promise<void> {
    this.validateMeanReversionConfig(config);
    
    this.meanReversionConfigs.set(config.symbol, config);
    this.saveConfigs();
  }

  /**
   * 평균 회귀 설정 조회
   */
  getMeanReversionConfig(symbol: string): MeanReversionConfig | null {
    return this.meanReversionConfigs.get(symbol) || null;
  }

  /**
   * 모든 평균 회귀 설정 조회
   */
  getAllMeanReversionConfigs(): MeanReversionConfig[] {
    return Array.from(this.meanReversionConfigs.values());
  }

  /**
   * 평균 회귀 상태 조회
   */
  async getMeanReversionStatus(): Promise<MeanReversionStatus> {
    const positions = Array.from(this.meanReversionPositions.values());
    const activePositions = positions.length;

    const totalInvestment = positions.reduce((sum, p) => sum + p.investmentAmount, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalProfitLoss = totalValue - totalInvestment;

    return {
      isEnabled: this.isRunning,
      activePositions,
      totalInvestment,
      totalValue,
      totalProfitLoss,
      positions,
      recentSignals: this.recentSignals.slice(-20),
      statistics: this.calculateStatistics()
    };
  }

  /**
   * 모니터링 시작
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        for (const [symbol, config] of this.meanReversionConfigs.entries()) {
          if (config.enabled) {
            await this.processMeanReversionSignals(symbol, config);
          }
        }
        
        // 포지션 업데이트
        await this.updatePositions();
        
      } catch (error) {
        console.error('평균 회귀 전략 모니터링 오류:', error);
      }
    }, 60000); // 1분마다 체크
  }

  /**
   * 평균 회귀 신호 처리
   */
  private async processMeanReversionSignals(symbol: string, config: MeanReversionConfig): Promise<void> {
    try {
      // 쿨다운 체크
      const lastSignalTime = this.cooldownMap.get(symbol) || 0;
      const now = Date.now();
      if (now - lastSignalTime < config.cooldownPeriod * 60000) {
        return;
      }
      
      const signal = await this.analyzeMeanReversion(symbol, config);
      
      if (signal && signal.signal !== 'HOLD') {
        this.recentSignals.push(signal);
        this.recentSignals = this.recentSignals.slice(-100);
        
        // 거래 실행
        await this.executeMeanReversionTrade(signal, config);
        
        // 쿨다운 설정
        this.cooldownMap.set(symbol, now);
        
        this.saveSignals();
      }
      
    } catch (error) {
      console.error(`평균 회귀 신호 처리 실패 (${symbol}):`, error);
    }
  }

  /**
   * 평균 회귀 분석
   */
  private async analyzeMeanReversion(
    symbol: string, 
    config: MeanReversionConfig
  ): Promise<MeanReversionSignal | null> {
    try {
      // 캔들 데이터 조회
      const candles = await this.getCandleData(symbol, config.timeframe, config.period + 50);
      if (candles.length < config.period + 20) return null;
      
      const prices = candles.map(c => c.close);
      const volumes = candles.map(c => c.volume);
      const currentPrice = prices[prices.length - 1];
      
      // 볼린저 밴드 계산
      const bollingerBands = this.calculateBollingerBands(prices, config.period, config.upperBand, config.lowerBand);
      
      // RSI 계산
      const rsi = this.calculateRSI(prices, config.rsiPeriod);
      const currentRSI = rsi[rsi.length - 1];
      
      // Stochastic 계산
      const stochastic = this.calculateStochastic(candles, config.stochPeriod);
      const currentStoch = stochastic[stochastic.length - 1];
      
      // 거래량 비율 계산
      const volumeRatio = this.calculateVolumeRatio(volumes, 20);
      const currentVolumeRatio = volumeRatio[volumeRatio.length - 1];
      
      // 현재 볼린저 밴드
      const currentBB = bollingerBands[bollingerBands.length - 1];
      
      // 신호 분석
      let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let strength = 0;
      const reasons: string[] = [];
      
      // 매수 신호 (하단 밴드 근처에서 반등)
      if (currentPrice <= currentBB.lower) {
        strength += 0.4;
        reasons.push('볼린저 밴드 하단 터치');
        
        if (currentRSI <= config.rsiOversold) {
          strength += 0.3;
          reasons.push('RSI 과매도');
        }
        
        if (currentStoch.k <= config.stochOversold) {
          strength += 0.2;
          reasons.push('Stochastic 과매도');
        }
        
        if (!config.volumeConfirmation || currentVolumeRatio >= config.volumeThreshold) {
          strength += 0.1;
          reasons.push('거래량 확인');
        }
        
        if (strength >= 0.6) {
          signal = 'BUY';
        }
      }
      
      // 매도 신호 (상단 밴드 근처에서 하락)
      else if (currentPrice >= currentBB.upper) {
        strength += 0.4;
        reasons.push('볼린저 밴드 상단 터치');
        
        if (currentRSI >= config.rsiOverbought) {
          strength += 0.3;
          reasons.push('RSI 과매수');
        }
        
        if (currentStoch.k >= config.stochOverbought) {
          strength += 0.2;
          reasons.push('Stochastic 과매수');
        }
        
        if (!config.volumeConfirmation || currentVolumeRatio >= config.volumeThreshold) {
          strength += 0.1;
          reasons.push('거래량 확인');
        }
        
        if (strength >= 0.6) {
          signal = 'SELL';
        }
      }
      
      if (signal === 'HOLD') return null;
      
      return {
        symbol,
        timestamp: Date.now(),
        signal,
        strength,
        confidence: Math.min(strength, 1.0),
        price: currentPrice,
        indicators: {
          bollingerBands: currentBB,
          rsi: currentRSI,
          stochastic: currentStoch,
          volumeRatio: currentVolumeRatio,
          pricePosition: currentBB.percentB
        },
        reasons
      };
      
    } catch (error) {
      console.error(`평균 회귀 분석 실패 (${symbol}):`, error);
      return null;
    }
  }

  /**
   * 평균 회귀 거래 실행
   */
  private async executeMeanReversionTrade(signal: MeanReversionSignal, config: MeanReversionConfig): Promise<void> {
    try {
      // 최대 포지션 수 체크
      const currentPositions = Array.from(this.meanReversionPositions.values())
        .filter(p => p.symbol === signal.symbol);
      
      if (currentPositions.length >= config.maxPositions) {
        console.log(`[MEAN_REVERSION] 최대 포지션 수 도달: ${signal.symbol}`);
        return;
      }
      
      if (signal.signal === 'BUY') {
        await this.executeBuyOrder(signal, config);
      } else if (signal.signal === 'SELL') {
        // 평균 회귀에서는 일반적으로 Long 포지션만 사용
        // Short 포지션이 필요한 경우 여기서 구현
        console.log(`[MEAN_REVERSION] 매도 신호 감지하지만 Long 전략만 사용: ${signal.symbol}`);
      }
      
    } catch (error) {
      console.error('평균 회귀 거래 실행 실패:', error);
    }
  }

  /**
   * 매수 주문 실행
   */
  private async executeBuyOrder(signal: MeanReversionSignal, config: MeanReversionConfig): Promise<void> {
    try {
      console.log(`[MEAN_REVERSION] 매수 실행: ${signal.symbol} @ ${signal.price} (${config.positionSize}원)`);
      
      // 실제 거래는 시뮬레이션 모드에서는 수행하지 않음
      // TODO: 실제 매수 주문
      
      const amount = config.positionSize / signal.price;
      const stopLossPrice = signal.price * (1 - config.stopLossRatio / 100);
      const takeProfitPrice = signal.price * (1 + config.takeProfitRatio / 100);
      
      const position: MeanReversionPosition = {
        id: `${signal.symbol}_${Date.now()}`,
        symbol: signal.symbol,
        type: 'LONG',
        entryPrice: signal.price,
        entryTime: Date.now(),
        amount,
        investmentAmount: config.positionSize,
        currentPrice: signal.price,
        currentValue: config.positionSize,
        profitLoss: 0,
        profitRate: 0,
        stopLossPrice,
        takeProfitPrice,
        entrySignal: signal,
        maxFavorableExcursion: 0,
        maxAdverseExcursion: 0,
        holdingPeriod: 0
      };
      
      this.meanReversionPositions.set(position.id, position);
      this.savePositions();
      
    } catch (error) {
      console.error('매수 주문 실행 실패:', error);
    }
  }

  /**
   * 포지션 업데이트
   */
  private async updatePositions(): Promise<void> {
    const now = Date.now();
    
    for (const [positionId, position] of this.meanReversionPositions.entries()) {
      const currentPrice = await this.getCurrentPrice(position.symbol);
      if (!currentPrice) continue;
      
      // 가격 및 손익 업데이트
      position.currentPrice = currentPrice;
      position.currentValue = position.amount * currentPrice;
      position.profitLoss = position.currentValue - position.investmentAmount;
      position.profitRate = position.profitLoss / position.investmentAmount;
      position.holdingPeriod = (now - position.entryTime) / (60 * 1000); // 분 단위
      
      // MFE/MAE 추적
      if (position.type === 'LONG') {
        const unrealizedReturn = (currentPrice - position.entryPrice) / position.entryPrice;
        position.maxFavorableExcursion = Math.max(position.maxFavorableExcursion, unrealizedReturn);
        position.maxAdverseExcursion = Math.min(position.maxAdverseExcursion, unrealizedReturn);
      }
      
      // 손절/익절 체크
      const config = this.meanReversionConfigs.get(position.symbol);
      if (config) {
        await this.checkExitConditions(position, config);
      }
    }
    
    this.savePositions();
  }

  /**
   * 청산 조건 체크
   */
  private async checkExitConditions(
    position: MeanReversionPosition, 
    config: MeanReversionConfig
  ): Promise<void> {
    let shouldExit = false;
    let exitReason = '';
    
    // 손절 체크
    if (position.currentPrice <= position.stopLossPrice) {
      shouldExit = true;
      exitReason = '손절';
    }
    
    // 익절 체크
    else if (position.currentPrice >= position.takeProfitPrice) {
      shouldExit = true;
      exitReason = '익절';
    }
    
    // 평균 회귀 신호 기반 청산 (중심선 회귀 시)
    else {
      try {
        const signal = await this.analyzeMeanReversion(position.symbol, config);
        if (signal) {
          const bb = signal.indicators.bollingerBands;
          
          // 가격이 중심선 근처로 회귀했을 때 청산
          if (position.type === 'LONG' && 
              position.currentPrice >= bb.middle && 
              signal.indicators.pricePosition > 0.4 && 
              signal.indicators.pricePosition < 0.6) {
            shouldExit = true;
            exitReason = '평균 회귀 완료';
          }
        }
      } catch (error) {
        console.error('평균 회귀 신호 분석 실패:', error);
      }
    }
    
    if (shouldExit) {
      console.log(`[MEAN_REVERSION] 포지션 청산 (${exitReason}): ${position.symbol}`);
      await this.closePosition(position, exitReason);
    }
  }

  /**
   * 포지션 청산
   */
  private async closePosition(position: MeanReversionPosition, reason: string): Promise<void> {
    try {
      // TODO: 실제 매도 주문
      
      // 거래 히스토리에 추가
      const trade = {
        symbol: position.symbol,
        type: position.type,
        entryPrice: position.entryPrice,
        exitPrice: position.currentPrice,
        entryTime: position.entryTime,
        exitTime: Date.now(),
        amount: position.amount,
        investmentAmount: position.investmentAmount,
        profitLoss: position.profitLoss,
        profitRate: position.profitRate,
        holdingPeriod: position.holdingPeriod,
        maxFavorableExcursion: position.maxFavorableExcursion,
        maxAdverseExcursion: position.maxAdverseExcursion,
        exitReason: reason,
        entrySignal: position.entrySignal
      };
      
      this.tradeHistory.push(trade);
      this.saveTradeHistory();
      
      // 포지션 제거
      this.meanReversionPositions.delete(position.id);
      this.savePositions();
      
    } catch (error) {
      console.error('포지션 청산 실패:', error);
    }
  }

  /**
   * 통계 계산
   */
  private calculateStatistics(): any {
    if (this.tradeHistory.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        avgHoldingPeriod: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        calmarRatio: 0
      };
    }
    
    const trades = this.tradeHistory;
    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const losingTrades = trades.filter(t => t.profitLoss < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    
    const avgProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    const avgHoldingPeriod = trades.reduce((sum, t) => sum + t.holdingPeriod, 0) / trades.length;
    
    // 간단한 최대 낙폭 계산
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    trades.forEach(trade => {
      runningPnL += trade.profitLoss;
      peak = Math.max(peak, runningPnL);
      const drawdown = (peak - runningPnL) / (peak || 1);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });
    
    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      avgProfit,
      avgLoss,
      profitFactor,
      avgHoldingPeriod,
      maxDrawdown,
      sharpeRatio: 0, // TODO: 샤프 비율 계산
      calmarRatio: 0  // TODO: 칼마 비율 계산
    };
  }

  // 기술적 지표 계산 메서드들
  private calculateBollingerBands(prices: number[], period: number, upper: number, lower: number): BollingerBands[] {
    const bands: BollingerBands[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((sum, price) => sum + price, 0) / period;
      
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      const upperBand = sma + (stdDev * upper);
      const lowerBand = sma - (stdDev * lower);
      const currentPrice = prices[i];
      
      const percentB = (currentPrice - lowerBand) / (upperBand - lowerBand);
      const width = (upperBand - lowerBand) / sma;
      
      bands.push({
        upper: upperBand,
        middle: sma,
        lower: lowerBand,
        width,
        percentB
      });
    }
    
    return bands;
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      
      if (i <= period) {
        if (change > 0) gains += change;
        else losses += Math.abs(change);
        
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          rsi.push(100 - (100 / (1 + avgGain / (avgLoss || 0.0001))));
        }
      } else {
        const prevRSI = rsi[rsi.length - 1];
        const rs = rsi.length > 0 ? (100 - prevRSI) / prevRSI : 0;
        const avgGain = ((gains / period) * (period - 1) + Math.max(change, 0)) / period;
        const avgLoss = ((losses / period) * (period - 1) + Math.abs(Math.min(change, 0))) / period;
        rsi.push(100 - (100 / (1 + avgGain / (avgLoss || 0.0001))));
        
        gains = avgGain * period;
        losses = avgLoss * period;
      }
    }
    
    return rsi;
  }

  private calculateStochastic(candles: any[], period: number): Array<{k: number, d: number}> {
    const stochastic: Array<{k: number, d: number}> = [];
    
    for (let i = period - 1; i < candles.length; i++) {
      const slice = candles.slice(i - period + 1, i + 1);
      const highest = Math.max(...slice.map(c => c.high));
      const lowest = Math.min(...slice.map(c => c.low));
      const current = candles[i].close;
      
      const k = ((current - lowest) / (highest - lowest)) * 100;
      
      // %D는 %K의 3일 이동평균
      let d = k;
      if (stochastic.length >= 2) {
        const recentK = [k, stochastic[stochastic.length - 1].k, stochastic[stochastic.length - 2].k];
        d = recentK.reduce((sum, val) => sum + val, 0) / 3;
      }
      
      stochastic.push({ k, d });
    }
    
    return stochastic;
  }

  private calculateVolumeRatio(volumes: number[], period: number): number[] {
    const volumeRatio: number[] = [];
    
    for (let i = period; i < volumes.length; i++) {
      const avgVolume = volumes.slice(i - period, i).reduce((sum, v) => sum + v, 0) / period;
      volumeRatio.push(volumes[i] / avgVolume);
    }
    
    return volumeRatio;
  }

  // 유틸리티 메서드들
  private async getCandleData(symbol: string, timeframe: string, count: number): Promise<any[]> {
    try {
      // 시뮬레이션 데이터 생성
      const candles = [];
      let price = this.getBasePriceForSymbol(symbol);
      const now = Date.now();
      const timeframeMs = this.getTimeframeInMs(timeframe);
      
      for (let i = count - 1; i >= 0; i--) {
        const timestamp = now - (i * timeframeMs);
        const change = (Math.random() - 0.5) * 0.015 * price; // 1.5% 변동성
        
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.008);
        const low = Math.min(open, close) * (1 - Math.random() * 0.008);
        const volume = Math.random() * 1000000;
        
        candles.push({ timestamp, open, high, low, close, volume });
        price = close;
      }
      
      return candles;
    } catch (error) {
      console.error('캔들 데이터 조회 실패:', error);
      return [];
    }
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      'KRW-BTC': 50000000,
      'KRW-ETH': 3000000,
      'KRW-XRP': 600,
      'KRW-ADA': 500,
      'KRW-DOT': 7000
    };
    return basePrices[symbol] || 1000000;
  }

  private getTimeframeInMs(timeframe: string): number {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || timeframes['1h'];
  }

  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.upbitService.getTicker(symbol);
      return ticker?.trade_price || 0;
    } catch (error) {
      console.error(`현재가 조회 실패 (${symbol}):`, error);
      return 0;
    }
  }

  private validateMeanReversionConfig(config: MeanReversionConfig): void {
    if (!config.symbol || !config.symbol.startsWith('KRW-')) {
      throw new Error('올바른 심볼을 입력해주세요.');
    }
    
    if (config.period < 10 || config.period > 100) {
      throw new Error('이동평균 기간은 10-100 범위여야 합니다.');
    }
    
    if (config.upperBand < 1 || config.upperBand > 5) {
      throw new Error('상단 밴드 배수는 1-5 범위여야 합니다.');
    }
    
    if (config.positionSize < 5000) {
      throw new Error('포지션 크기는 최소 5,000원 이상이어야 합니다.');
    }
  }

  // 파일 I/O 메서드들
  private saveConfigs(): void {
    try {
      const configs = Array.from(this.meanReversionConfigs.values());
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('평균 회귀 설정 저장 실패:', error);
    }
  }

  private loadConfigs(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const configs: MeanReversionConfig[] = JSON.parse(data);
        
        for (const config of configs) {
          this.meanReversionConfigs.set(config.symbol, config);
        }
      }
    } catch (error) {
      console.error('평균 회귀 설정 로드 실패:', error);
    }
  }

  private savePositions(): void {
    try {
      const positions = Array.from(this.meanReversionPositions.values());
      fs.writeFileSync(this.positionsPath, JSON.stringify(positions, null, 2));
    } catch (error) {
      console.error('평균 회귀 포지션 저장 실패:', error);
    }
  }

  private loadPositions(): void {
    try {
      if (fs.existsSync(this.positionsPath)) {
        const data = fs.readFileSync(this.positionsPath, 'utf8');
        const positions: MeanReversionPosition[] = JSON.parse(data);
        
        for (const position of positions) {
          this.meanReversionPositions.set(position.id, position);
        }
      }
    } catch (error) {
      console.error('평균 회귀 포지션 로드 실패:', error);
    }
  }

  private saveSignals(): void {
    try {
      fs.writeFileSync(this.signalsPath, JSON.stringify(this.recentSignals, null, 2));
    } catch (error) {
      console.error('평균 회귀 신호 저장 실패:', error);
    }
  }

  private loadSignals(): void {
    try {
      if (fs.existsSync(this.signalsPath)) {
        const data = fs.readFileSync(this.signalsPath, 'utf8');
        this.recentSignals = JSON.parse(data);
      }
    } catch (error) {
      console.error('평균 회귀 신호 로드 실패:', error);
    }
  }

  private saveTradeHistory(): void {
    try {
      fs.writeFileSync(this.tradeHistoryPath, JSON.stringify(this.tradeHistory, null, 2));
    } catch (error) {
      console.error('평균 회귀 거래 히스토리 저장 실패:', error);
    }
  }

  private loadTradeHistory(): void {
    try {
      if (fs.existsSync(this.tradeHistoryPath)) {
        const data = fs.readFileSync(this.tradeHistoryPath, 'utf8');
        this.tradeHistory = JSON.parse(data);
      }
    } catch (error) {
      console.error('평균 회귀 거래 히스토리 로드 실패:', error);
    }
  }
}

export default new MeanReversionService();