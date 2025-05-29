import UpbitService from './upbit-service';
import * as fs from 'fs';
import * as path from 'path';

export interface MomentumConfig {
  symbol: string;
  enabled: boolean;
  timeframes: string[];          // 분석할 시간대 ['5m', '15m', '1h', '4h']
  momentumPeriod: number;        // 모멘텀 계산 기간 (기본 14)
  rsiPeriod: number;             // RSI 기간 (기본 14)
  rsiOverbought: number;         // RSI 과매수 기준 (기본 70)
  rsiOversold: number;           // RSI 과매도 기준 (기본 30)
  macdFastPeriod: number;        // MACD 빠른 이동평균 (기본 12)
  macdSlowPeriod: number;        // MACD 느린 이동평균 (기본 26)
  macdSignalPeriod: number;      // MACD 신호선 (기본 9)
  volumeThreshold: number;       // 거래량 증가 임계값 (기본 1.5배)
  priceChangeThreshold: number;  // 가격 변동 임계값 (%)
  stopLossRatio: number;         // 손절 비율 (%)
  takeProfitRatio: number;       // 익절 비율 (%)
  maxInvestmentRatio: number;    // 최대 투자 비율 (%)
  cooldownPeriod: number;        // 재진입 대기 시간 (분)
}

export interface MomentumSignal {
  symbol: string;
  timeframe: string;
  timestamp: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;              // 신호 강도 (0-1)
  confidence: number;            // 신뢰도 (0-1)
  indicators: {
    rsi: number;
    macd: {
      value: number;
      signal: number;
      histogram: number;
    };
    priceChange: number;
    volumeRatio: number;
    momentum: number;
  };
  reasons: string[];
}

export interface MomentumPosition {
  symbol: string;
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
  entrySignal: MomentumSignal;
  maxProfit: number;
  maxLoss: number;
}

export interface MomentumStatus {
  isEnabled: boolean;
  activePositions: number;
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  positions: MomentumPosition[];
  recentSignals: MomentumSignal[];
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgProfit: number;
    avgLoss: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export class MomentumTradingService {
  private upbitService: typeof UpbitService;
  private configPath: string;
  private positionsPath: string;
  private signalsPath: string;
  private momentumConfigs: Map<string, MomentumConfig> = new Map();
  private momentumPositions: Map<string, MomentumPosition> = new Map();
  private recentSignals: MomentumSignal[] = [];
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private priceData: Map<string, any[]> = new Map();

  constructor() {
    this.upbitService = UpbitService;
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.configPath = path.join(dataDir, 'momentum-configs.json');
    this.positionsPath = path.join(dataDir, 'momentum-positions.json');
    this.signalsPath = path.join(dataDir, 'momentum-signals.json');
    
    this.loadConfigs();
    this.loadPositions();
    this.loadSignals();
  }

  /**
   * 모멘텀 트레이딩 시작
   */
  async startMomentumTrading(): Promise<void> {
    if (this.isRunning) {
      throw new Error('모멘텀 트레이딩이 이미 실행 중입니다.');
    }

    console.log('모멘텀 트레이딩 시작...');
    this.isRunning = true;

    // 모니터링 시작
    this.startMonitoring();
  }

  /**
   * 모멘텀 트레이딩 중지
   */
  async stopMomentumTrading(): Promise<void> {
    console.log('모멘텀 트레이딩 중지...');
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 모멘텀 설정 저장
   */
  async saveMomentumConfig(config: MomentumConfig): Promise<void> {
    this.validateMomentumConfig(config);
    
    this.momentumConfigs.set(config.symbol, config);
    this.saveConfigs();
  }

  /**
   * 모멘텀 설정 조회
   */
  getMomentumConfig(symbol: string): MomentumConfig | null {
    return this.momentumConfigs.get(symbol) || null;
  }

  /**
   * 모든 모멘텀 설정 조회
   */
  getAllMomentumConfigs(): MomentumConfig[] {
    return Array.from(this.momentumConfigs.values());
  }

  /**
   * 모멘텀 상태 조회
   */
  async getMomentumStatus(): Promise<MomentumStatus> {
    const positions = Array.from(this.momentumPositions.values());
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
      performance: await this.calculatePerformance()
    };
  }

  /**
   * 모니터링 시작
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        for (const [symbol, config] of this.momentumConfigs.entries()) {
          if (config.enabled) {
            await this.processMomentumSignals(symbol, config);
          }
        }
        
        // 포지션 업데이트
        await this.updatePositions();
        
      } catch (error) {
        console.error('모멘텀 트레이딩 모니터링 오류:', error);
      }
    }, 60000); // 1분마다 체크
  }

  /**
   * 모멘텀 신호 처리
   */
  private async processMomentumSignals(symbol: string, config: MomentumConfig): Promise<void> {
    try {
      // 각 시간대별로 신호 분석
      const signals: MomentumSignal[] = [];
      
      for (const timeframe of config.timeframes) {
        const signal = await this.analyzeMomentum(symbol, timeframe, config);
        if (signal) {
          signals.push(signal);
        }
      }
      
      // 종합 신호 결정
      const combinedSignal = this.combineMomentumSignals(signals, symbol, config);
      
      if (combinedSignal) {
        this.recentSignals.push(combinedSignal);
        this.recentSignals = this.recentSignals.slice(-100); // 최대 100개 유지
        
        // 거래 실행
        await this.executeMomentumTrade(combinedSignal, config);
        
        this.saveSignals();
      }
      
    } catch (error) {
      console.error(`모멘텀 신호 처리 실패 (${symbol}):`, error);
    }
  }

  /**
   * 모멘텀 분석
   */
  private async analyzeMomentum(
    symbol: string, 
    timeframe: string, 
    config: MomentumConfig
  ): Promise<MomentumSignal | null> {
    try {
      // 캔들 데이터 조회 (실제로는 upbitService.getCandles 사용)
      const candles = await this.getCandleData(symbol, timeframe, 100);
      if (candles.length < 50) return null;
      
      // 기술적 지표 계산
      const rsi = this.calculateRSI(candles, config.rsiPeriod);
      const macd = this.calculateMACD(candles, config.macdFastPeriod, config.macdSlowPeriod, config.macdSignalPeriod);
      const momentum = this.calculateMomentum(candles, config.momentumPeriod);
      const volumeRatio = this.calculateVolumeRatio(candles, 20);
      const priceChange = this.calculatePriceChange(candles, config.momentumPeriod);
      
      const currentRSI = rsi[rsi.length - 1];
      const currentMACD = macd[macd.length - 1];
      const currentMomentum = momentum[momentum.length - 1];
      const currentVolumeRatio = volumeRatio[volumeRatio.length - 1];
      
      // 신호 강도 계산
      let signalStrength = 0;
      let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      const reasons: string[] = [];
      
      // 매수 신호 조건
      let buyScore = 0;
      
      if (currentRSI < config.rsiOversold) {
        buyScore += 0.3;
        reasons.push('RSI 과매도 구간');
      }
      
      if (currentMACD.value > currentMACD.signal && currentMACD.histogram > 0) {
        buyScore += 0.3;
        reasons.push('MACD 골든크로스');
      }
      
      if (currentMomentum > 100) {
        buyScore += 0.2;
        reasons.push('모멘텀 상승');
      }
      
      if (currentVolumeRatio > config.volumeThreshold) {
        buyScore += 0.2;
        reasons.push('거래량 급증');
      }
      
      if (priceChange > config.priceChangeThreshold) {
        buyScore += 0.2;
        reasons.push('가격 상승 모멘텀');
      }
      
      // 매도 신호 조건
      let sellScore = 0;
      
      if (currentRSI > config.rsiOverbought) {
        sellScore += 0.3;
        reasons.push('RSI 과매수 구간');
      }
      
      if (currentMACD.value < currentMACD.signal && currentMACD.histogram < 0) {
        sellScore += 0.3;
        reasons.push('MACD 데드크로스');
      }
      
      if (currentMomentum < 100) {
        sellScore += 0.2;
        reasons.push('모멘텀 하락');
      }
      
      if (priceChange < -config.priceChangeThreshold) {
        sellScore += 0.2;
        reasons.push('가격 하락 모멘텀');
      }
      
      // 신호 결정
      if (buyScore > 0.6) {
        signal = 'BUY';
        signalStrength = buyScore;
      } else if (sellScore > 0.6) {
        signal = 'SELL';
        signalStrength = sellScore;
      }
      
      if (signal === 'HOLD') return null;
      
      return {
        symbol,
        timeframe,
        timestamp: Date.now(),
        signal,
        strength: signalStrength,
        confidence: Math.min(signalStrength, 1.0),
        indicators: {
          rsi: currentRSI,
          macd: currentMACD,
          priceChange,
          volumeRatio: currentVolumeRatio,
          momentum: currentMomentum
        },
        reasons
      };
      
    } catch (error) {
      console.error(`모멘텀 분석 실패 (${symbol} ${timeframe}):`, error);
      return null;
    }
  }

  /**
   * 여러 신호 종합
   */
  private combineMomentumSignals(
    signals: MomentumSignal[], 
    symbol: string, 
    config: MomentumConfig
  ): MomentumSignal | null {
    if (signals.length === 0) return null;
    
    const buySignals = signals.filter(s => s.signal === 'BUY');
    const sellSignals = signals.filter(s => s.signal === 'SELL');
    
    const buyStrength = buySignals.reduce((sum, s) => sum + s.strength, 0) / config.timeframes.length;
    const sellStrength = sellSignals.reduce((sum, s) => sum + s.strength, 0) / config.timeframes.length;
    
    let finalSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let finalStrength = 0;
    let finalReasons: string[] = [];
    
    if (buySignals.length >= config.timeframes.length * 0.6 && buyStrength > 0.5) {
      finalSignal = 'BUY';
      finalStrength = buyStrength;
      finalReasons = ['다중 시간대 매수 신호', ...Array.from(new Set(buySignals.flatMap(s => s.reasons)))];
    } else if (sellSignals.length >= config.timeframes.length * 0.6 && sellStrength > 0.5) {
      finalSignal = 'SELL';
      finalStrength = sellStrength;
      finalReasons = ['다중 시간대 매도 신호', ...Array.from(new Set(sellSignals.flatMap(s => s.reasons)))];
    }
    
    if (finalSignal === 'HOLD') return null;
    
    // 대표 신호 생성
    const representativeSignal = signals.find(s => s.signal === finalSignal) || signals[0];
    
    return {
      symbol,
      timeframe: 'combined',
      timestamp: Date.now(),
      signal: finalSignal,
      strength: finalStrength,
      confidence: Math.min(finalStrength * (signals.length / config.timeframes.length), 1.0),
      indicators: representativeSignal.indicators,
      reasons: finalReasons
    };
  }

  /**
   * 모멘텀 거래 실행
   */
  private async executeMomentumTrade(signal: MomentumSignal, config: MomentumConfig): Promise<void> {
    try {
      const currentPosition = this.momentumPositions.get(signal.symbol);
      
      if (signal.signal === 'BUY' && !currentPosition) {
        await this.executeBuyOrder(signal, config);
      } else if (signal.signal === 'SELL' && currentPosition) {
        await this.executeSellOrder(signal, currentPosition);
      }
      
    } catch (error) {
      console.error('모멘텀 거래 실행 실패:', error);
    }
  }

  /**
   * 매수 주문 실행
   */
  private async executeBuyOrder(signal: MomentumSignal, config: MomentumConfig): Promise<void> {
    try {
      const currentPrice = await this.getCurrentPrice(signal.symbol);
      if (!currentPrice) return;
      
      // 투자 금액 계산
      const accounts = await this.upbitService.getAccounts();
      const krwAccount = accounts.find(acc => acc.currency === 'KRW');
      const availableKRW = parseFloat(krwAccount?.balance || '0');
      
      const investmentAmount = Math.min(
        availableKRW * config.maxInvestmentRatio / 100,
        availableKRW * 0.1 // 최대 10%
      );
      
      if (investmentAmount < 5000) {
        console.log(`[MOMENTUM] 투자 금액 부족: ${signal.symbol}`);
        return;
      }
      
      console.log(`[MOMENTUM] 매수 실행: ${signal.symbol} @ ${currentPrice} (${investmentAmount}원)`);
      
      // 실제 거래는 시뮬레이션 모드에서는 수행하지 않음
      // TODO: 실제 매수 주문
      
      const amount = investmentAmount / currentPrice;
      const stopLossPrice = currentPrice * (1 - config.stopLossRatio / 100);
      const takeProfitPrice = currentPrice * (1 + config.takeProfitRatio / 100);
      
      const position: MomentumPosition = {
        symbol: signal.symbol,
        entryPrice: currentPrice,
        entryTime: Date.now(),
        amount,
        investmentAmount,
        currentPrice,
        currentValue: investmentAmount,
        profitLoss: 0,
        profitRate: 0,
        stopLossPrice,
        takeProfitPrice,
        entrySignal: signal,
        maxProfit: 0,
        maxLoss: 0
      };
      
      this.momentumPositions.set(signal.symbol, position);
      this.savePositions();
      
    } catch (error) {
      console.error('매수 주문 실행 실패:', error);
    }
  }

  /**
   * 매도 주문 실행
   */
  private async executeSellOrder(signal: MomentumSignal, position: MomentumPosition): Promise<void> {
    try {
      console.log(`[MOMENTUM] 매도 실행: ${signal.symbol} @ ${position.currentPrice}`);
      
      // TODO: 실제 매도 주문
      
      this.momentumPositions.delete(signal.symbol);
      this.savePositions();
      
    } catch (error) {
      console.error('매도 주문 실행 실패:', error);
    }
  }

  /**
   * 포지션 업데이트
   */
  private async updatePositions(): Promise<void> {
    for (const [symbol, position] of this.momentumPositions.entries()) {
      const currentPrice = await this.getCurrentPrice(symbol);
      if (!currentPrice) continue;
      
      position.currentPrice = currentPrice;
      position.currentValue = position.amount * currentPrice;
      position.profitLoss = position.currentValue - position.investmentAmount;
      position.profitRate = position.profitLoss / position.investmentAmount;
      
      // 최대 수익/손실 추적
      position.maxProfit = Math.max(position.maxProfit, position.profitRate);
      position.maxLoss = Math.min(position.maxLoss, position.profitRate);
      
      // 손절/익절 체크
      const config = this.momentumConfigs.get(symbol);
      if (config) {
        await this.checkStopLossAndTakeProfit(position, config);
      }
    }
    
    this.savePositions();
  }

  /**
   * 손절/익절 체크
   */
  private async checkStopLossAndTakeProfit(
    position: MomentumPosition, 
    config: MomentumConfig
  ): Promise<void> {
    // 손절 체크
    if (position.currentPrice <= position.stopLossPrice) {
      console.log(`[MOMENTUM] 손절 실행: ${position.symbol}`);
      await this.executeSellOrder({
        symbol: position.symbol,
        timeframe: 'stop_loss',
        timestamp: Date.now(),
        signal: 'SELL',
        strength: 1.0,
        confidence: 1.0,
        indicators: position.entrySignal.indicators,
        reasons: ['손절가 도달']
      }, position);
    }
    
    // 익절 체크
    if (position.currentPrice >= position.takeProfitPrice) {
      console.log(`[MOMENTUM] 익절 실행: ${position.symbol}`);
      await this.executeSellOrder({
        symbol: position.symbol,
        timeframe: 'take_profit',
        timestamp: Date.now(),
        signal: 'SELL',
        strength: 1.0,
        confidence: 1.0,
        indicators: position.entrySignal.indicators,
        reasons: ['익절가 도달']
      }, position);
    }
  }

  /**
   * 성과 계산
   */
  private async calculatePerformance(): Promise<any> {
    // TODO: 실제 거래 히스토리 기반 성과 계산
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgProfit: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    };
  }

  // 기술적 지표 계산 메서드들
  private calculateRSI(candles: any[], period: number): number[] {
    const rsi: number[] = [];
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      
      if (i <= period) {
        if (change > 0) gains += change;
        else losses += Math.abs(change);
        
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
        }
      } else {
        const prevRSI = rsi[rsi.length - 1];
        const avgGain = ((gains / period) * (period - 1) + Math.max(change, 0)) / period;
        const avgLoss = ((losses / period) * (period - 1) + Math.abs(Math.min(change, 0))) / period;
        rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
      }
    }
    
    return rsi;
  }

  private calculateMACD(candles: any[], fastPeriod: number, slowPeriod: number, signalPeriod: number): any[] {
    const ema12 = this.calculateEMA(candles.map(c => c.close), fastPeriod);
    const ema26 = this.calculateEMA(candles.map(c => c.close), slowPeriod);
    
    const macdLine = ema12.map((fast, i) => fast - ema26[i]);
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    
    return macdLine.map((macd, i) => ({
      value: macd,
      signal: signalLine[i] || 0,
      histogram: macd - (signalLine[i] || 0)
    }));
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema: number[] = [];
    
    ema[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  }

  private calculateMomentum(candles: any[], period: number): number[] {
    const momentum: number[] = [];
    
    for (let i = period; i < candles.length; i++) {
      momentum.push((candles[i].close / candles[i - period].close) * 100);
    }
    
    return momentum;
  }

  private calculateVolumeRatio(candles: any[], period: number): number[] {
    const volumeRatio: number[] = [];
    
    for (let i = period; i < candles.length; i++) {
      const avgVolume = candles.slice(i - period, i).reduce((sum, c) => sum + c.volume, 0) / period;
      volumeRatio.push(candles[i].volume / avgVolume);
    }
    
    return volumeRatio;
  }

  private calculatePriceChange(candles: any[], period: number): number {
    if (candles.length < period + 1) return 0;
    
    const current = candles[candles.length - 1].close;
    const previous = candles[candles.length - 1 - period].close;
    
    return ((current - previous) / previous) * 100;
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
        const change = (Math.random() - 0.5) * 0.02 * price; // 2% 변동성
        
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
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

  private validateMomentumConfig(config: MomentumConfig): void {
    if (!config.symbol || !config.symbol.startsWith('KRW-')) {
      throw new Error('올바른 심볼을 입력해주세요.');
    }
    
    if (config.timeframes.length === 0) {
      throw new Error('최소 하나의 시간대를 선택해주세요.');
    }
    
    if (config.maxInvestmentRatio < 1 || config.maxInvestmentRatio > 100) {
      throw new Error('최대 투자 비율은 1-100% 범위여야 합니다.');
    }
  }

  // 파일 I/O 메서드들
  private saveConfigs(): void {
    try {
      const configs = Array.from(this.momentumConfigs.values());
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('모멘텀 설정 저장 실패:', error);
    }
  }

  private loadConfigs(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const configs: MomentumConfig[] = JSON.parse(data);
        
        for (const config of configs) {
          this.momentumConfigs.set(config.symbol, config);
        }
      }
    } catch (error) {
      console.error('모멘텀 설정 로드 실패:', error);
    }
  }

  private savePositions(): void {
    try {
      const positions = Array.from(this.momentumPositions.values());
      fs.writeFileSync(this.positionsPath, JSON.stringify(positions, null, 2));
    } catch (error) {
      console.error('모멘텀 포지션 저장 실패:', error);
    }
  }

  private loadPositions(): void {
    try {
      if (fs.existsSync(this.positionsPath)) {
        const data = fs.readFileSync(this.positionsPath, 'utf8');
        const positions: MomentumPosition[] = JSON.parse(data);
        
        for (const position of positions) {
          this.momentumPositions.set(position.symbol, position);
        }
      }
    } catch (error) {
      console.error('모멘텀 포지션 로드 실패:', error);
    }
  }

  private saveSignals(): void {
    try {
      fs.writeFileSync(this.signalsPath, JSON.stringify(this.recentSignals, null, 2));
    } catch (error) {
      console.error('모멘텀 신호 저장 실패:', error);
    }
  }

  private loadSignals(): void {
    try {
      if (fs.existsSync(this.signalsPath)) {
        const data = fs.readFileSync(this.signalsPath, 'utf8');
        this.recentSignals = JSON.parse(data);
      }
    } catch (error) {
      console.error('모멘텀 신호 로드 실패:', error);
    }
  }
}

export default new MomentumTradingService();