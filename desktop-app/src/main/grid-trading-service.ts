import UpbitService from './upbit-service';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface GridConfig {
  symbol: string;
  enabled: boolean;
  centerPrice: number;        // 중심 가격
  gridSpacing: number;        // 그리드 간격 (%)
  gridLevels: number;         // 그리드 레벨 수 (위아래 각각)
  orderAmount: number;        // 주문 금액 (KRW)
  maxInvestment: number;      // 최대 투자 금액
  takeProfitRatio: number;    // 익절 비율 (%)
  stopLossRatio: number;      // 손절 비율 (%)
  rebalanceInterval: number;  // 리밸런스 간격 (분)
}

export interface GridLevel {
  level: number;              // 레벨 (-3, -2, -1, 0, 1, 2, 3...)
  price: number;              // 해당 가격
  type: 'BUY' | 'SELL';      // 주문 타입
  isActive: boolean;          // 활성 상태
  orderId?: string;           // 주문 ID
  filledAt?: number;          // 체결 시간
  amount: number;             // 주문 수량/금액
}

export interface GridPosition {
  symbol: string;
  totalInvestment: number;    // 총 투자 금액
  totalValue: number;         // 현재 총 가치
  profitLoss: number;         // 손익
  profitRate: number;         // 수익률
  coinBalance: number;        // 보유 코인 수량
  avgBuyPrice: number;        // 평균 매수가
  gridLevels: GridLevel[];    // 그리드 레벨들
  activeOrders: number;       // 활성 주문 수
  completedTrades: number;    // 완료된 거래 수
  lastRebalance: number;      // 마지막 리밸런스 시간
}

export interface GridTradingStatus {
  isEnabled: boolean;
  activeGrids: number;
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  positions: GridPosition[];
  performance: {
    totalTrades: number;
    successfulTrades: number;
    avgProfit: number;
    maxDrawdown: number;
    winRate: number;
  };
}

export class GridTradingService {
  private upbitService: typeof UpbitService;
  private configPath: string;
  private positionsPath: string;
  private gridConfigs: Map<string, GridConfig> = new Map();
  private gridPositions: Map<string, GridPosition> = new Map();
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.upbitService = UpbitService;
    
    const dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.configPath = path.join(dataDir, 'grid-configs.json');
    this.positionsPath = path.join(dataDir, 'grid-positions.json');
    
    this.loadConfigs();
    this.loadPositions();
  }

  /**
   * 그리드 트레이딩 시작
   */
  async startGridTrading(): Promise<void> {
    if (this.isRunning) {
      throw new Error('그리드 트레이딩이 이미 실행 중입니다.');
    }

    console.log('그리드 트레이딩 시작...');
    this.isRunning = true;

    // 활성화된 그리드들 초기화
    for (const [symbol, config] of this.gridConfigs.entries()) {
      if (config.enabled) {
        await this.initializeGrid(symbol, config);
      }
    }

    // 모니터링 시작
    this.startMonitoring();
  }

  /**
   * 그리드 트레이딩 중지
   */
  async stopGridTrading(): Promise<void> {
    console.log('그리드 트레이딩 중지...');
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // 모든 활성 주문 취소
    for (const position of this.gridPositions.values()) {
      await this.cancelAllGridOrders(position.symbol);
    }
  }

  /**
   * 그리드 설정 저장
   */
  async saveGridConfig(config: GridConfig): Promise<void> {
    // 설정 검증
    this.validateGridConfig(config);
    
    this.gridConfigs.set(config.symbol, config);
    this.saveConfigs();

    // 실행 중이면서 활성화된 경우 즉시 적용
    if (this.isRunning && config.enabled) {
      await this.initializeGrid(config.symbol, config);
    }
  }

  /**
   * 그리드 설정 조회
   */
  getGridConfig(symbol: string): GridConfig | null {
    return this.gridConfigs.get(symbol) || null;
  }

  /**
   * 모든 그리드 설정 조회
   */
  getAllGridConfigs(): GridConfig[] {
    return Array.from(this.gridConfigs.values());
  }

  /**
   * 그리드 상태 조회
   */
  async getGridTradingStatus(): Promise<GridTradingStatus> {
    const positions = Array.from(this.gridPositions.values());
    const activeGrids = positions.filter(p => 
      this.gridConfigs.get(p.symbol)?.enabled
    ).length;

    const totalInvestment = positions.reduce((sum, p) => sum + p.totalInvestment, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
    const totalProfitLoss = totalValue - totalInvestment;

    // 성과 계산
    const totalTrades = positions.reduce((sum, p) => sum + p.completedTrades, 0);
    const successfulTrades = positions.filter(p => p.profitLoss > 0).length;
    const avgProfit = positions.length > 0 
      ? positions.reduce((sum, p) => sum + p.profitRate, 0) / positions.length 
      : 0;

    return {
      isEnabled: this.isRunning,
      activeGrids,
      totalInvestment,
      totalValue,
      totalProfitLoss,
      positions,
      performance: {
        totalTrades,
        successfulTrades,
        avgProfit,
        maxDrawdown: 0, // TODO: 실제 계산
        winRate: totalTrades > 0 ? successfulTrades / totalTrades : 0
      }
    };
  }

  /**
   * 그리드 초기화
   */
  private async initializeGrid(symbol: string, config: GridConfig): Promise<void> {
    try {
      console.log(`그리드 초기화: ${symbol}`);
      
      // 현재가 조회
      const ticker = await this.upbitService.getTicker(symbol);
      if (!ticker) {
        throw new Error(`${symbol} 티커 조회 실패`);
      }

      const currentPrice = ticker.trade_price;
      
      // 중심 가격 설정 (설정값 또는 현재가)
      const centerPrice = config.centerPrice || currentPrice;
      
      // 그리드 레벨 생성
      const gridLevels = this.generateGridLevels(config, centerPrice);
      
      // 포지션 초기화 또는 업데이트
      const existingPosition = this.gridPositions.get(symbol);
      const position: GridPosition = {
        symbol,
        totalInvestment: existingPosition?.totalInvestment || 0,
        totalValue: 0,
        profitLoss: 0,
        profitRate: 0,
        coinBalance: existingPosition?.coinBalance || 0,
        avgBuyPrice: existingPosition?.avgBuyPrice || 0,
        gridLevels,
        activeOrders: 0,
        completedTrades: existingPosition?.completedTrades || 0,
        lastRebalance: Date.now()
      };

      this.gridPositions.set(symbol, position);
      
      // 초기 주문 배치
      await this.placeInitialOrders(symbol, config, position);
      
      this.savePositions();
      
    } catch (error) {
      console.error(`그리드 초기화 실패 (${symbol}):`, error);
      throw error;
    }
  }

  /**
   * 그리드 레벨 생성
   */
  private generateGridLevels(config: GridConfig, centerPrice: number): GridLevel[] {
    const levels: GridLevel[] = [];
    
    for (let i = -config.gridLevels; i <= config.gridLevels; i++) {
      const priceMultiplier = 1 + (i * config.gridSpacing / 100);
      const price = centerPrice * priceMultiplier;
      
      // 레벨 0 (중심)은 주문하지 않음
      if (i === 0) continue;
      
      const level: GridLevel = {
        level: i,
        price,
        type: i < 0 ? 'BUY' : 'SELL', // 아래는 매수, 위는 매도
        isActive: false,
        amount: config.orderAmount
      };
      
      levels.push(level);
    }
    
    return levels.sort((a, b) => a.level - b.level);
  }

  /**
   * 초기 주문 배치
   */
  private async placeInitialOrders(
    symbol: string, 
    config: GridConfig, 
    position: GridPosition
  ): Promise<void> {
    const currentPrice = await this.getCurrentPrice(symbol);
    
    // 현재가 근처의 매수/매도 주문들만 배치
    const nearbyLevels = position.gridLevels.filter(level => {
      const priceDiff = Math.abs(level.price - currentPrice) / currentPrice;
      return priceDiff <= 0.1; // 현재가 ±10% 범위 내
    });

    for (const level of nearbyLevels) {
      try {
        if (level.type === 'BUY') {
          await this.placeBuyOrder(symbol, level, config);
        } else {
          // 매도 주문은 보유 물량이 있을 때만
          if (position.coinBalance > 0) {
            await this.placeSellOrder(symbol, level, config, position);
          }
        }
      } catch (error) {
        console.error(`주문 배치 실패 (${symbol}, 레벨 ${level.level}):`, error);
      }
    }
  }

  /**
   * 매수 주문 배치
   */
  private async placeBuyOrder(
    symbol: string, 
    level: GridLevel, 
    config: GridConfig
  ): Promise<void> {
    try {
      // 시뮬레이션 모드에서는 실제 주문하지 않음
      console.log(`[GRID] 매수 주문 배치: ${symbol} @ ${level.price} (${level.amount}원)`);
      
      // TODO: 실제 주문 로직
      // const orderId = await this.upbitService.placeBuyOrder(symbol, level.price, level.amount);
      
      level.isActive = true;
      level.orderId = `grid_buy_${Date.now()}_${level.level}`;
      
    } catch (error) {
      console.error(`매수 주문 실패:`, error);
      throw error;
    }
  }

  /**
   * 매도 주문 배치
   */
  private async placeSellOrder(
    symbol: string, 
    level: GridLevel, 
    config: GridConfig,
    position: GridPosition
  ): Promise<void> {
    try {
      // 매도할 수량 계산
      const sellAmount = Math.min(
        level.amount / level.price, 
        position.coinBalance
      );
      
      if (sellAmount <= 0) return;
      
      console.log(`[GRID] 매도 주문 배치: ${symbol} @ ${level.price} (${sellAmount} 개)`);
      
      // TODO: 실제 주문 로직
      // const orderId = await this.upbitService.placeSellOrder(symbol, level.price, sellAmount);
      
      level.isActive = true;
      level.orderId = `grid_sell_${Date.now()}_${level.level}`;
      
    } catch (error) {
      console.error(`매도 주문 실패:`, error);
      throw error;
    }
  }

  /**
   * 모니터링 시작
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        for (const [symbol, config] of this.gridConfigs.entries()) {
          if (config.enabled) {
            await this.monitorGrid(symbol, config);
          }
        }
      } catch (error) {
        console.error('그리드 모니터링 오류:', error);
      }
    }, 60000); // 60초마다 체크 (API rate limit 준수)
  }

  /**
   * 그리드 모니터링
   */
  private async monitorGrid(symbol: string, config: GridConfig): Promise<void> {
    const position = this.gridPositions.get(symbol);
    if (!position) return;

    // 체결된 주문 확인
    await this.checkFilledOrders(symbol, position, config);
    
    // 포지션 가치 업데이트
    await this.updatePositionValue(symbol, position);
    
    // 리밸런스 체크
    const now = Date.now();
    if (now - position.lastRebalance > config.rebalanceInterval * 60000) {
      await this.rebalanceGrid(symbol, config, position);
      position.lastRebalance = now;
    }
    
    this.savePositions();
  }

  /**
   * 체결된 주문 확인
   */
  private async checkFilledOrders(
    symbol: string, 
    position: GridPosition, 
    config: GridConfig
  ): Promise<void> {
    for (const level of position.gridLevels) {
      if (level.isActive && level.orderId) {
        // TODO: 실제 주문 상태 확인
        // const orderStatus = await this.upbitService.getOrderStatus(level.orderId);
        
        // 시뮬레이션: 랜덤하게 일부 주문이 체결되었다고 가정
        if (Math.random() < 0.05) { // 5% 확률로 체결
          await this.handleFilledOrder(symbol, level, position, config);
        }
      }
    }
  }

  /**
   * 체결된 주문 처리
   */
  private async handleFilledOrder(
    symbol: string,
    level: GridLevel,
    position: GridPosition,
    config: GridConfig
  ): Promise<void> {
    console.log(`[GRID] 주문 체결: ${symbol} ${level.type} @ ${level.price}`);
    
    level.isActive = false;
    level.filledAt = Date.now();
    position.completedTrades++;
    
    if (level.type === 'BUY') {
      // 매수 체결
      const boughtAmount = level.amount / level.price;
      const newTotalCoin = position.coinBalance + boughtAmount;
      const newTotalInvestment = position.totalInvestment + level.amount;
      
      position.avgBuyPrice = newTotalInvestment / newTotalCoin;
      position.coinBalance = newTotalCoin;
      position.totalInvestment = newTotalInvestment;
      
      // 위쪽에 매도 주문 배치
      const upperLevel = position.gridLevels.find(l => 
        l.level === level.level + 1 && !l.isActive
      );
      if (upperLevel) {
        await this.placeSellOrder(symbol, upperLevel, config, position);
      }
      
    } else {
      // 매도 체결
      const soldAmount = level.amount / level.price;
      position.coinBalance = Math.max(0, position.coinBalance - soldAmount);
      
      // 아래쪽에 매수 주문 배치
      const lowerLevel = position.gridLevels.find(l => 
        l.level === level.level - 1 && !l.isActive
      );
      if (lowerLevel) {
        await this.placeBuyOrder(symbol, lowerLevel, config);
      }
    }
  }

  /**
   * 포지션 가치 업데이트
   */
  private async updatePositionValue(symbol: string, position: GridPosition): Promise<void> {
    const currentPrice = await this.getCurrentPrice(symbol);
    
    position.totalValue = position.coinBalance * currentPrice;
    position.profitLoss = position.totalValue - position.totalInvestment;
    position.profitRate = position.totalInvestment > 0 
      ? position.profitLoss / position.totalInvestment 
      : 0;
  }

  /**
   * 그리드 리밸런스
   */
  private async rebalanceGrid(
    symbol: string, 
    config: GridConfig, 
    position: GridPosition
  ): Promise<void> {
    console.log(`[GRID] 리밸런스: ${symbol}`);
    
    const currentPrice = await this.getCurrentPrice(symbol);
    
    // 현재가에서 너무 멀리 떨어진 주문들 취소
    for (const level of position.gridLevels) {
      if (level.isActive) {
        const priceDiff = Math.abs(level.price - currentPrice) / currentPrice;
        if (priceDiff > 0.2) { // 20% 이상 차이나면 취소
          await this.cancelOrder(level);
        }
      }
    }
    
    // 새로운 주문들 배치
    await this.placeInitialOrders(symbol, config, position);
  }

  /**
   * 주문 취소
   */
  private async cancelOrder(level: GridLevel): Promise<void> {
    try {
      if (level.orderId) {
        // TODO: 실제 주문 취소
        // await this.upbitService.cancelOrder(level.orderId);
        console.log(`[GRID] 주문 취소: ${level.orderId}`);
      }
      
      level.isActive = false;
      level.orderId = undefined;
      
    } catch (error) {
      console.error('주문 취소 실패:', error);
    }
  }

  /**
   * 모든 그리드 주문 취소
   */
  private async cancelAllGridOrders(symbol: string): Promise<void> {
    const position = this.gridPositions.get(symbol);
    if (!position) return;
    
    for (const level of position.gridLevels) {
      if (level.isActive) {
        await this.cancelOrder(level);
      }
    }
  }

  /**
   * 현재가 조회
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    const ticker = await this.upbitService.getTicker(symbol);
    return ticker?.trade_price || 0;
  }

  /**
   * 그리드 설정 검증
   */
  private validateGridConfig(config: GridConfig): void {
    if (!config.symbol || !config.symbol.startsWith('KRW-')) {
      throw new Error('올바른 심볼을 입력해주세요.');
    }
    
    if (config.gridSpacing <= 0 || config.gridSpacing > 20) {
      throw new Error('그리드 간격은 0.1% ~ 20% 사이여야 합니다.');
    }
    
    if (config.gridLevels < 1 || config.gridLevels > 20) {
      throw new Error('그리드 레벨은 1 ~ 20 사이여야 합니다.');
    }
    
    if (config.orderAmount < 5000) {
      throw new Error('주문 금액은 최소 5,000원 이상이어야 합니다.');
    }
    
    if (config.maxInvestment < config.orderAmount * config.gridLevels) {
      throw new Error('최대 투자 금액이 너무 작습니다.');
    }
  }

  /**
   * 설정 저장
   */
  private saveConfigs(): void {
    try {
      const configs = Array.from(this.gridConfigs.values());
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('그리드 설정 저장 실패:', error);
    }
  }

  /**
   * 설정 로드
   */
  private loadConfigs(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        const configs: GridConfig[] = JSON.parse(data);
        
        for (const config of configs) {
          this.gridConfigs.set(config.symbol, config);
        }
      }
    } catch (error) {
      console.error('그리드 설정 로드 실패:', error);
    }
  }

  /**
   * 포지션 저장
   */
  private savePositions(): void {
    try {
      const positions = Array.from(this.gridPositions.values());
      fs.writeFileSync(this.positionsPath, JSON.stringify(positions, null, 2));
    } catch (error) {
      console.error('그리드 포지션 저장 실패:', error);
    }
  }

  /**
   * 포지션 로드
   */
  private loadPositions(): void {
    try {
      if (fs.existsSync(this.positionsPath)) {
        const data = fs.readFileSync(this.positionsPath, 'utf8');
        const positions: GridPosition[] = JSON.parse(data);
        
        for (const position of positions) {
          this.gridPositions.set(position.symbol, position);
        }
      }
    } catch (error) {
      console.error('그리드 포지션 로드 실패:', error);
    }
  }
}

export default new GridTradingService();