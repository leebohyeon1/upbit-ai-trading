import UpbitService from './upbit-service';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface DCAConfig {
  symbol: string;
  enabled: boolean;
  investmentAmount: number;    // 정기 투자 금액 (KRW)
  interval: number;            // 투자 간격 (분)
  maxInvestment: number;       // 최대 총 투자 금액
  priceChangeThreshold: number; // 가격 변동 임계값 (%)
  stopLossRatio: number;       // 손절 비율 (%)
  takeProfitRatio: number;     // 익절 비율 (%)
  enableSmartDCA: boolean;     // 스마트 DCA (변동성 기반 조절)
  volatilityMultiplier: number; // 변동성 배수 (높을수록 변동성에 민감)
  lastInvestment: number;      // 마지막 투자 시간
}

export interface DCAPosition {
  symbol: string;
  totalInvestment: number;     // 총 투자 금액
  totalCoinAmount: number;     // 총 보유 코인 수량
  avgBuyPrice: number;         // 평균 매수가
  currentValue: number;        // 현재 가치
  profitLoss: number;          // 손익
  profitRate: number;          // 수익률
  investmentCount: number;     // 투자 횟수
  lastInvestmentTime: number;  // 마지막 투자 시간
  nextInvestmentTime: number;  // 다음 투자 예정 시간
  priceHistory: Array<{
    price: number;
    timestamp: number;
    amount: number;
    volume: number;
  }>;
}

export interface DCAStatus {
  isEnabled: boolean;
  activeStrategies: number;
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  positions: DCAPosition[];
  performance: {
    totalInvestments: number;
    avgInvestmentAmount: number;
    bestPerformingAsset: string;
    worstPerformingAsset: string;
    overallReturn: number;
    timeWeightedReturn: number;
  };
}

export class DCAStrategyService {
  private upbitService: typeof UpbitService;
  private configPath: string;
  private positionsPath: string;
  private dcaConfigs: Map<string, DCAConfig> = new Map();
  private dcaPositions: Map<string, DCAPosition> = new Map();
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.upbitService = UpbitService;
    
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.configPath = path.join(dataDir, 'dca-configs.json');
    this.positionsPath = path.join(dataDir, 'dca-positions.json');
    
    this.loadConfigs();
    this.loadPositions();
  }

  /**
   * DCA 전략 시작
   */
  async startDCAStrategy(): Promise<void> {
    if (this.isRunning) {
      throw new Error('DCA 전략이 이미 실행 중입니다.');
    }

    console.log('DCA 전략 시작...');
    this.isRunning = true;

    // 활성화된 DCA 전략들 초기화
    for (const [symbol, config] of this.dcaConfigs.entries()) {
      if (config.enabled) {
        await this.initializeDCAPosition(symbol, config);
      }
    }

    // 모니터링 시작 (5분마다 체크)
    this.startMonitoring();
  }

  /**
   * DCA 전략 중지
   */
  async stopDCAStrategy(): Promise<void> {
    console.log('DCA 전략 중지...');
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * DCA 설정 저장
   */
  async saveDCAConfig(config: DCAConfig): Promise<void> {
    this.validateDCAConfig(config);
    
    this.dcaConfigs.set(config.symbol, config);
    this.saveConfigs();

    // 실행 중이면서 활성화된 경우 즉시 적용
    if (this.isRunning && config.enabled) {
      await this.initializeDCAPosition(config.symbol, config);
    }
  }

  /**
   * DCA 설정 조회
   */
  getDCAConfig(symbol: string): DCAConfig | null {
    return this.dcaConfigs.get(symbol) || null;
  }

  /**
   * 모든 DCA 설정 조회
   */
  getAllDCAConfigs(): DCAConfig[] {
    return Array.from(this.dcaConfigs.values());
  }

  /**
   * DCA 상태 조회
   */
  async getDCAStatus(): Promise<DCAStatus> {
    const positions = Array.from(this.dcaPositions.values());
    const activeStrategies = positions.filter(p => 
      this.dcaConfigs.get(p.symbol)?.enabled
    ).length;

    const totalInvestment = positions.reduce((sum, p) => sum + p.totalInvestment, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalProfitLoss = totalValue - totalInvestment;

    // 성과 계산
    const totalInvestments = positions.reduce((sum, p) => sum + p.investmentCount, 0);
    const avgInvestmentAmount = totalInvestments > 0 ? totalInvestment / totalInvestments : 0;
    
    let bestPerformingAsset = '';
    let worstPerformingAsset = '';
    let bestReturn = -Infinity;
    let worstReturn = Infinity;

    positions.forEach(position => {
      if (position.profitRate > bestReturn) {
        bestReturn = position.profitRate;
        bestPerformingAsset = position.symbol;
      }
      if (position.profitRate < worstReturn) {
        worstReturn = position.profitRate;
        worstPerformingAsset = position.symbol;
      }
    });

    const overallReturn = totalInvestment > 0 ? totalProfitLoss / totalInvestment : 0;

    return {
      isEnabled: this.isRunning,
      activeStrategies,
      totalInvestment,
      totalValue,
      totalProfitLoss,
      positions,
      performance: {
        totalInvestments,
        avgInvestmentAmount,
        bestPerformingAsset,
        worstPerformingAsset,
        overallReturn,
        timeWeightedReturn: this.calculateTimeWeightedReturn(positions)
      }
    };
  }

  /**
   * DCA 포지션 초기화
   */
  private async initializeDCAPosition(symbol: string, config: DCAConfig): Promise<void> {
    try {
      console.log(`DCA 포지션 초기화: ${symbol}`);
      
      const existingPosition = this.dcaPositions.get(symbol);
      const now = Date.now();
      
      if (!existingPosition) {
        // 새 포지션 생성
        const position: DCAPosition = {
          symbol,
          totalInvestment: 0,
          totalCoinAmount: 0,
          avgBuyPrice: 0,
          currentValue: 0,
          profitLoss: 0,
          profitRate: 0,
          investmentCount: 0,
          lastInvestmentTime: 0,
          nextInvestmentTime: now + config.interval * 60000,
          priceHistory: []
        };
        
        this.dcaPositions.set(symbol, position);
      } else {
        // 기존 포지션 업데이트
        existingPosition.nextInvestmentTime = now + config.interval * 60000;
      }
      
      // 현재 가치 업데이트
      await this.updatePositionValue(symbol);
      
      this.savePositions();
      
    } catch (error) {
      console.error(`DCA 포지션 초기화 실패 (${symbol}):`, error);
      throw error;
    }
  }

  /**
   * 모니터링 시작
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        for (const [symbol, config] of this.dcaConfigs.entries()) {
          if (config.enabled) {
            await this.processUserContent(symbol, config);
          }
        }
      } catch (error) {
        console.error('DCA 모니터링 오류:', error);
      }
    }, 60000); // 1분마다 체크
  }

  /**
   * DCA 처리
   */
  private async processUserContent(symbol: string, config: DCAConfig): Promise<void> {
    const position = this.dcaPositions.get(symbol);
    if (!position) return;

    const now = Date.now();
    
    // 투자 시간 체크
    if (now >= position.nextInvestmentTime) {
      await this.executeDCAInvestment(symbol, config, position);
    }
    
    // 포지션 가치 업데이트
    await this.updatePositionValue(symbol);
    
    // 손절/익절 체크
    await this.checkStopLossAndTakeProfit(symbol, config, position);
    
    this.savePositions();
  }

  /**
   * DCA 투자 실행
   */
  private async executeDCAInvestment(
    symbol: string, 
    config: DCAConfig, 
    position: DCAPosition
  ): Promise<void> {
    try {
      // 최대 투자 금액 체크
      if (position.totalInvestment >= config.maxInvestment) {
        console.log(`[DCA] 최대 투자 금액 도달: ${symbol}`);
        return;
      }
      
      const currentPrice = await this.getCurrentPrice(symbol);
      if (!currentPrice) return;
      
      // 스마트 DCA 적용
      let investmentAmount = config.investmentAmount;
      if (config.enableSmartDCA) {
        investmentAmount = await this.calculateSmartDCAAmount(symbol, config, currentPrice);
      }
      
      // 남은 투자 가능 금액 체크
      const remainingAmount = config.maxInvestment - position.totalInvestment;
      investmentAmount = Math.min(investmentAmount, remainingAmount);
      
      if (investmentAmount < 5000) {
        console.log(`[DCA] 투자 금액이 너무 적음: ${symbol} (${investmentAmount})`);
        return;
      }
      
      console.log(`[DCA] 투자 실행: ${symbol} @ ${currentPrice} (${investmentAmount}원)`);
      
      // 실제 거래는 시뮬레이션 모드에서는 수행하지 않음
      // TODO: 실제 매수 주문
      // const result = await this.upbitService.placeBuyOrder(symbol, investmentAmount);
      
      // 포지션 업데이트 (시뮬레이션)
      const coinAmount = investmentAmount / currentPrice;
      const newTotalInvestment = position.totalInvestment + investmentAmount;
      const newTotalCoinAmount = position.totalCoinAmount + coinAmount;
      
      position.avgBuyPrice = newTotalInvestment / newTotalCoinAmount;
      position.totalInvestment = newTotalInvestment;
      position.totalCoinAmount = newTotalCoinAmount;
      position.investmentCount++;
      position.lastInvestmentTime = Date.now();
      position.nextInvestmentTime = Date.now() + config.interval * 60000;
      
      // 가격 히스토리에 추가
      position.priceHistory.push({
        price: currentPrice,
        timestamp: Date.now(),
        amount: coinAmount,
        volume: investmentAmount
      });
      
      // 히스토리 크기 제한 (최대 1000개)
      if (position.priceHistory.length > 1000) {
        position.priceHistory = position.priceHistory.slice(-1000);
      }
      
    } catch (error) {
      console.error(`DCA 투자 실행 실패 (${symbol}):`, error);
    }
  }

  /**
   * 스마트 DCA 금액 계산
   */
  private async calculateSmartDCAAmount(
    symbol: string, 
    config: DCAConfig, 
    currentPrice: number
  ): Promise<number> {
    try {
      const position = this.dcaPositions.get(symbol);
      if (!position || position.priceHistory.length === 0) {
        return config.investmentAmount;
      }
      
      // 최근 30일간의 가격 변동성 계산
      const recentHistory = position.priceHistory.slice(-30);
      if (recentHistory.length < 2) {
        return config.investmentAmount;
      }
      
      // 평균 가격과 표준편차 계산
      const prices = recentHistory.map(h => h.price);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
      const volatility = Math.sqrt(variance) / avgPrice;
      
      // 현재 가격이 평균보다 낮으면 더 많이 투자 (하향 평균화)
      const priceRatio = currentPrice / avgPrice;
      let multiplier = 1;
      
      if (priceRatio < 0.95) {
        // 5% 이상 하락 시 투자 증액
        multiplier = 1 + (0.95 - priceRatio) * config.volatilityMultiplier;
      } else if (priceRatio > 1.05) {
        // 5% 이상 상승 시 투자 감액
        multiplier = 1 - (priceRatio - 1.05) * config.volatilityMultiplier * 0.5;
      }
      
      // 변동성이 높을 때 투자 금액 조정
      const volatilityAdjustment = 1 + volatility * config.volatilityMultiplier;
      multiplier *= volatilityAdjustment;
      
      // 최소 50%, 최대 300%로 제한
      multiplier = Math.max(0.5, Math.min(3.0, multiplier));
      
      return Math.round(config.investmentAmount * multiplier);
      
    } catch (error) {
      console.error('스마트 DCA 계산 오류:', error);
      return config.investmentAmount;
    }
  }

  /**
   * 손절/익절 체크
   */
  private async checkStopLossAndTakeProfit(
    symbol: string, 
    config: DCAConfig, 
    position: DCAPosition
  ): Promise<void> {
    if (position.totalCoinAmount <= 0) return;
    
    const currentPrice = await this.getCurrentPrice(symbol);
    if (!currentPrice) return;
    
    const profitRate = (currentPrice - position.avgBuyPrice) / position.avgBuyPrice;
    
    // 손절 체크
    if (config.stopLossRatio > 0 && profitRate <= -config.stopLossRatio / 100) {
      console.log(`[DCA] 손절 조건 달성: ${symbol} (${(profitRate * 100).toFixed(2)}%)`);
      await this.executeSellOrder(symbol, position, '손절');
    }
    
    // 익절 체크
    if (config.takeProfitRatio > 0 && profitRate >= config.takeProfitRatio / 100) {
      console.log(`[DCA] 익절 조건 달성: ${symbol} (${(profitRate * 100).toFixed(2)}%)`);
      await this.executeSellOrder(symbol, position, '익절');
    }
  }

  /**
   * 매도 주문 실행
   */
  private async executeSellOrder(
    symbol: string, 
    position: DCAPosition, 
    reason: string
  ): Promise<void> {
    try {
      console.log(`[DCA] 매도 실행 (${reason}): ${symbol}`);
      
      // TODO: 실제 매도 주문
      // const result = await this.upbitService.placeSellOrder(symbol, position.totalCoinAmount);
      
      // 포지션 초기화
      position.totalInvestment = 0;
      position.totalCoinAmount = 0;
      position.avgBuyPrice = 0;
      position.investmentCount = 0;
      position.priceHistory = [];
      
    } catch (error) {
      console.error(`매도 주문 실패 (${symbol}):`, error);
    }
  }

  /**
   * 포지션 가치 업데이트
   */
  private async updatePositionValue(symbol: string): Promise<void> {
    const position = this.dcaPositions.get(symbol);
    if (!position) return;
    
    const currentPrice = await this.getCurrentPrice(symbol);
    if (!currentPrice) return;
    
    position.currentValue = position.totalCoinAmount * currentPrice;
    position.profitLoss = position.currentValue - position.totalInvestment;
    position.profitRate = position.totalInvestment > 0 
      ? position.profitLoss / position.totalInvestment 
      : 0;
  }

  /**
   * 현재가 조회
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.upbitService.getTicker(symbol);
      return ticker?.trade_price || 0;
    } catch (error) {
      console.error(`현재가 조회 실패 (${symbol}):`, error);
      return 0;
    }
  }

  /**
   * 시간 가중 수익률 계산
   */
  private calculateTimeWeightedReturn(positions: DCAPosition[]): number {
    if (positions.length === 0) return 0;
    
    let totalWeightedReturn = 0;
    let totalWeight = 0;
    
    positions.forEach(position => {
      if (position.investmentCount > 0) {
        const timePeriod = Math.max(1, (Date.now() - position.lastInvestmentTime) / (30 * 24 * 60 * 60 * 1000)); // 월 단위
        const weight = position.totalInvestment * timePeriod;
        totalWeightedReturn += position.profitRate * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
  }

  /**
   * DCA 설정 검증
   */
  private validateDCAConfig(config: DCAConfig): void {
    if (!config.symbol || !config.symbol.startsWith('KRW-')) {
      throw new Error('올바른 심볼을 입력해주세요.');
    }
    
    if (config.investmentAmount < 5000) {
      throw new Error('투자 금액은 최소 5,000원 이상이어야 합니다.');
    }
    
    if (config.interval < 60) {
      throw new Error('투자 간격은 최소 60분 이상이어야 합니다.');
    }
    
    if (config.maxInvestment < config.investmentAmount) {
      throw new Error('최대 투자 금액은 1회 투자 금액보다 커야 합니다.');
    }
    
    if (config.stopLossRatio < 0 || config.stopLossRatio > 50) {
      throw new Error('손절 비율은 0-50% 범위여야 합니다.');
    }
    
    if (config.takeProfitRatio < 0 || config.takeProfitRatio > 1000) {
      throw new Error('익절 비율은 0-1000% 범위여야 합니다.');
    }
  }

  /**
   * 설정 저장
   */
  private saveConfigs(): void {
    try {
      const configs = Array.from(this.dcaConfigs.values());
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('DCA 설정 저장 실패:', error);
    }
  }

  /**
   * 설정 로드
   */
  private loadConfigs(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const configs: DCAConfig[] = JSON.parse(data);
        
        for (const config of configs) {
          this.dcaConfigs.set(config.symbol, config);
        }
      }
    } catch (error) {
      console.error('DCA 설정 로드 실패:', error);
    }
  }

  /**
   * 포지션 저장
   */
  private savePositions(): void {
    try {
      const positions = Array.from(this.dcaPositions.values());
      fs.writeFileSync(this.positionsPath, JSON.stringify(positions, null, 2));
    } catch (error) {
      console.error('DCA 포지션 저장 실패:', error);
    }
  }

  /**
   * 포지션 로드
   */
  private loadPositions(): void {
    try {
      if (fs.existsSync(this.positionsPath)) {
        const data = fs.readFileSync(this.positionsPath, 'utf8');
        const positions: DCAPosition[] = JSON.parse(data);
        
        for (const position of positions) {
          this.dcaPositions.set(position.symbol, position);
        }
      }
    } catch (error) {
      console.error('DCA 포지션 로드 실패:', error);
    }
  }
}

export default new DCAStrategyService();