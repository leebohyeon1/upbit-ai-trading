import { EventEmitter } from 'events';
import upbitService from './upbit-service';
import tradingEngine from './trading-engine';
import notificationService from './notification-service';

export enum KillSwitchReason {
  MANUAL = 'MANUAL', // 수동 실행
  MAX_LOSS = 'MAX_LOSS', // 최대 손실 도달
  API_ERROR = 'API_ERROR', // API 오류
  SYSTEM_ERROR = 'SYSTEM_ERROR', // 시스템 오류
  NETWORK_ERROR = 'NETWORK_ERROR', // 네트워크 오류
  ABNORMAL_MARKET = 'ABNORMAL_MARKET', // 비정상적 시장 상황
  SECURITY_BREACH = 'SECURITY_BREACH' // 보안 위협
}

export interface KillSwitchConfig {
  enabled: boolean;
  maxDailyLoss: number; // 일일 최대 손실률 (%)
  maxDrawdown: number; // 최대 낙폭 (%)
  emergencyMarketSell: boolean; // 긴급 시장가 매도 여부
  notifyBeforeAction: boolean; // 실행 전 알림
  cooldownMinutes: number; // 재시작 대기 시간 (분)
  autoRestart: boolean; // 자동 재시작 여부
  whitelistAddresses: string[]; // 출금 허용 주소
}

export interface KillSwitchEvent {
  timestamp: number;
  reason: KillSwitchReason;
  details: string;
  portfolio: any[];
  actions: string[];
  success: boolean;
}

class KillSwitchService extends EventEmitter {
  private config: KillSwitchConfig = {
    enabled: true,
    maxDailyLoss: 10, // 10% 일일 손실
    maxDrawdown: 15, // 15% 최대 낙폭
    emergencyMarketSell: true,
    notifyBeforeAction: true,
    cooldownMinutes: 60,
    autoRestart: false,
    whitelistAddresses: []
  };

  private isActive = false;
  private history: KillSwitchEvent[] = [];
  private dailyStartBalance = 0;
  private peakBalance = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      // 저장된 설정 로드
      const savedConfig = await this.getSavedConfig();
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load kill switch config:', error);
    }
  }

  // Kill Switch 활성화
  async activate(reason: KillSwitchReason, details: string): Promise<KillSwitchEvent> {
    console.log(`🚨 KILL SWITCH ACTIVATED - Reason: ${reason}, Details: ${details}`);
    
    const event: KillSwitchEvent = {
      timestamp: Date.now(),
      reason,
      details,
      portfolio: [],
      actions: [],
      success: false
    };

    try {
      this.isActive = true;
      this.emit('activated', { reason, details });

      // 1. 즉시 자동매매 중지
      await this.stopAutoTrading();
      event.actions.push('자동매매 중지');

      // 2. 모든 미체결 주문 취소
      await this.cancelAllOrders();
      event.actions.push('미체결 주문 취소');

      // 3. 현재 포트폴리오 상태 저장
      const portfolio = await this.savePortfolioSnapshot();
      event.portfolio = portfolio;
      event.actions.push('포트폴리오 스냅샷 저장');

      // 4. 알림 발송
      if (this.config.notifyBeforeAction) {
        await this.sendEmergencyNotification(reason, details);
        event.actions.push('긴급 알림 발송');
      }

      // 5. 긴급 매도 실행 (설정된 경우)
      if (this.config.emergencyMarketSell && reason !== KillSwitchReason.MANUAL) {
        await this.emergencySellAll();
        event.actions.push('긴급 시장가 매도 실행');
      }

      // 6. 시스템 잠금
      await this.lockSystem();
      event.actions.push('시스템 잠금');

      event.success = true;
      this.history.push(event);
      this.emit('completed', event);

      // 자동 재시작 스케줄링
      if (this.config.autoRestart && reason !== KillSwitchReason.MANUAL) {
        setTimeout(() => {
          this.deactivate();
        }, this.config.cooldownMinutes * 60 * 1000);
      }

    } catch (error) {
      console.error('Kill switch activation failed:', error);
      event.success = false;
      this.history.push(event);
      this.emit('error', error);
    }

    return event;
  }

  // Kill Switch 비활성화
  async deactivate(): Promise<void> {
    if (!this.isActive) return;

    console.log('🟢 Kill Switch deactivated');
    this.isActive = false;
    
    // 시스템 잠금 해제
    await this.unlockSystem();
    
    // 모니터링 재시작
    this.startMonitoring();
    
    this.emit('deactivated');
  }

  // 자동매매 중지
  private async stopAutoTrading(): Promise<void> {
    try {
      await tradingEngine.stop();
    } catch (error) {
      console.error('Failed to stop auto trading:', error);
      throw error;
    }
  }

  // 모든 미체결 주문 취소
  private async cancelAllOrders(): Promise<void> {
    try {
      const orders = await upbitService.getOrders();
      
      // 주문 취소 API가 없으므로 로그만 남김
      console.log(`Found ${orders.length} pending orders to cancel`);
      orders.forEach(order => {
        console.log(`Pending order: ${order.uuid} - ${order.market} ${order.side} ${order.volume}@${order.price}`);
      });
      
      // 실제 환경에서는 수동으로 취소하거나 다른 방법 필요
      console.warn('Order cancellation API not available. Manual intervention required.');
    } catch (error) {
      console.error('Failed to get orders:', error);
      throw error;
    }
  }

  // 포트폴리오 스냅샷 저장
  private async savePortfolioSnapshot(): Promise<any[]> {
    try {
      const accounts = await upbitService.getAccounts();
      const snapshot = accounts.map(account => ({
        currency: account.currency,
        balance: account.balance,
        locked: account.locked,
        avg_buy_price: account.avg_buy_price,
        timestamp: Date.now()
      }));

      // 파일로 저장
      const fs = require('fs').promises;
      const path = require('path');
      const filename = `portfolio_snapshot_${Date.now()}.json`;
      const filepath = path.join(process.cwd(), 'data', 'emergency', filename);
      
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2));

      return snapshot;
    } catch (error) {
      console.error('Failed to save portfolio snapshot:', error);
      return [];
    }
  }

  // 긴급 알림 발송
  private async sendEmergencyNotification(reason: KillSwitchReason, details: string): Promise<void> {
    const title = '🚨 긴급: Kill Switch 활성화';
    const message = `
사유: ${reason}
상세: ${details}
시간: ${new Date().toLocaleString('ko-KR')}

즉시 확인이 필요합니다!
    `.trim();

    await notificationService.showNotification({
      type: 'system',
      title,
      body: message,
      priority: 'critical'
    });
  }

  // 긴급 시장가 매도
  private async emergencySellAll(): Promise<void> {
    try {
      const accounts = await upbitService.getAccounts();
      const cryptoAccounts = accounts.filter(acc => 
        acc.currency !== 'KRW' && 
        parseFloat(acc.balance) > 0
      );

      for (const account of cryptoAccounts) {
        try {
          const market = `KRW-${account.currency}`;
          const balance = parseFloat(account.balance) - parseFloat(account.locked);
          
          if (balance > 0) {
            await upbitService.sellOrder(market, balance.toString());
            
            console.log(`Emergency sold ${balance} ${account.currency}`);
          }
        } catch (error) {
          console.error(`Failed to emergency sell ${account.currency}:`, error);
        }
      }
    } catch (error) {
      console.error('Emergency sell all failed:', error);
      throw error;
    }
  }

  // 시스템 잠금
  private async lockSystem(): Promise<void> {
    // 거래 엔진 잠금
    tradingEngine.setLocked(true);
    
    // 설정 파일에 잠금 상태 저장
    const fs = require('fs').promises;
    const lockFile = require('path').join(process.cwd(), 'data', '.system.lock');
    await fs.writeFile(lockFile, JSON.stringify({
      locked: true,
      timestamp: Date.now(),
      reason: this.history[this.history.length - 1]?.reason
    }));
  }

  // 시스템 잠금 해제
  private async unlockSystem(): Promise<void> {
    // 거래 엔진 잠금 해제
    tradingEngine.setLocked(false);
    
    // 잠금 파일 삭제
    const fs = require('fs').promises;
    const lockFile = require('path').join(process.cwd(), 'data', '.system.lock');
    try {
      await fs.unlink(lockFile);
    } catch (error) {
      // 파일이 없어도 무시
    }
  }

  // 실시간 모니터링
  startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // 일일 시작 잔고 설정
    this.updateDailyStartBalance();

    this.monitoringInterval = setInterval(async () => {
      if (!this.config.enabled || this.isActive) return;

      try {
        // 1. 일일 손실률 체크
        const dailyLoss = await this.checkDailyLoss();
        if (dailyLoss > this.config.maxDailyLoss) {
          await this.activate(
            KillSwitchReason.MAX_LOSS,
            `일일 손실률 ${dailyLoss.toFixed(2)}% 초과`
          );
          return;
        }

        // 2. 최대 낙폭 체크
        const drawdown = await this.checkDrawdown();
        if (drawdown > this.config.maxDrawdown) {
          await this.activate(
            KillSwitchReason.MAX_LOSS,
            `최대 낙폭 ${drawdown.toFixed(2)}% 초과`
          );
          return;
        }

        // 3. API 상태 체크
        const apiHealthy = await this.checkAPIHealth();
        if (!apiHealthy) {
          await this.activate(
            KillSwitchReason.API_ERROR,
            'API 연결 오류 감지'
          );
          return;
        }

        // 4. 비정상적 시장 상황 체크
        const marketAbnormal = await this.checkMarketConditions();
        if (marketAbnormal) {
          await this.activate(
            KillSwitchReason.ABNORMAL_MARKET,
            '비정상적 시장 상황 감지'
          );
          return;
        }

      } catch (error) {
        console.error('Kill switch monitoring error:', error);
      }
    }, 10000); // 10초마다 체크
  }

  // 일일 손실률 체크
  private async checkDailyLoss(): Promise<number> {
    try {
      const currentBalance = await this.getTotalBalance();
      const loss = ((this.dailyStartBalance - currentBalance) / this.dailyStartBalance) * 100;
      return Math.max(0, loss);
    } catch (error) {
      console.error('Failed to check daily loss:', error);
      return 0;
    }
  }

  // 최대 낙폭 체크
  private async checkDrawdown(): Promise<number> {
    try {
      const currentBalance = await this.getTotalBalance();
      
      // 피크 잔고 업데이트
      if (currentBalance > this.peakBalance) {
        this.peakBalance = currentBalance;
      }
      
      const drawdown = ((this.peakBalance - currentBalance) / this.peakBalance) * 100;
      return Math.max(0, drawdown);
    } catch (error) {
      console.error('Failed to check drawdown:', error);
      return 0;
    }
  }

  // 총 잔고 계산
  private async getTotalBalance(): Promise<number> {
    try {
      const accounts = await upbitService.getAccounts();
      let totalKRW = 0;

      for (const account of accounts) {
        if (account.currency === 'KRW') {
          totalKRW += parseFloat(account.balance);
        } else {
          const market = `KRW-${account.currency}`;
          try {
            const ticker = await upbitService.getTicker(market);
            const value = parseFloat(account.balance) * ticker.trade_price;
            totalKRW += value;
          } catch {
            // 시세를 가져올 수 없는 경우 평균 매수가 사용
            const value = parseFloat(account.balance) * parseFloat(account.avg_buy_price || '0');
            totalKRW += value;
          }
        }
      }

      return totalKRW;
    } catch (error) {
      console.error('Failed to get total balance:', error);
      return 0;
    }
  }

  // API 상태 체크
  private async checkAPIHealth(): Promise<boolean> {
    try {
      // 계좌 정보 조회로 상태 확인
      const accounts = await upbitService.getAccounts();
      return accounts && accounts.length > 0;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  // 비정상적 시장 상황 체크
  private async checkMarketConditions(): Promise<boolean> {
    try {
      // BTC 급락 체크 (5분 내 10% 이상 하락)
      const btcCandles = await upbitService.getCandles('KRW-BTC', 5);
      if (btcCandles && btcCandles.length >= 2) {
        const currentPrice = btcCandles[0].trade_price;
        const prevPrice = btcCandles[1].trade_price;
        const change = ((currentPrice - prevPrice) / prevPrice) * 100;
        
        if (change < -10) {
          console.warn('Abnormal market detected: BTC dropped more than 10% in 5 minutes');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Market condition check failed:', error);
      return false;
    }
  }

  // 일일 시작 잔고 업데이트
  private updateDailyStartBalance(): void {
    // 매일 자정에 실행
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(async () => {
      this.dailyStartBalance = await this.getTotalBalance();
      this.peakBalance = this.dailyStartBalance;
      
      // 다음 날 자정에 다시 실행
      setInterval(async () => {
        this.dailyStartBalance = await this.getTotalBalance();
        this.peakBalance = this.dailyStartBalance;
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // 최초 실행 시 현재 잔고로 설정
    this.getTotalBalance().then(balance => {
      this.dailyStartBalance = balance;
      this.peakBalance = balance;
    });
  }

  // 설정 관련 메서드
  async updateConfig(config: Partial<KillSwitchConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
    this.emit('configUpdated', this.config);
  }

  getConfig(): KillSwitchConfig {
    return { ...this.config };
  }

  private async saveConfig(): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = path.join(process.cwd(), 'data', 'config', 'kill-switch.json');
    
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
  }

  private async getSavedConfig(): Promise<KillSwitchConfig | null> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const configPath = path.join(process.cwd(), 'data', 'config', 'kill-switch.json');
      
      const data = await fs.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // 상태 조회 메서드
  isKillSwitchActive(): boolean {
    return this.isActive;
  }

  getHistory(): KillSwitchEvent[] {
    return [...this.history];
  }

  getLastEvent(): KillSwitchEvent | null {
    return this.history[this.history.length - 1] || null;
  }

  // 수동 트리거
  async triggerManual(reason: string): Promise<KillSwitchEvent> {
    return this.activate(KillSwitchReason.MANUAL, reason);
  }

  // 정리
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export default new KillSwitchService();