import { Notification, nativeImage, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface NotificationOptions {
  title: string;
  body: string;
  type: 'trade' | 'system' | 'analysis' | 'error';
  priority?: 'low' | 'normal' | 'critical';
  silent?: boolean;
  actions?: Array<{ text: string; action: string }>;
  data?: any;
}

export interface NotificationSettings {
  enabled: boolean;
  tradeNotifications: boolean;
  systemNotifications: boolean;
  analysisNotifications: boolean;
  soundEnabled: boolean;
  minimumProfitAlert: number; // 최소 수익률 알림 (%)
  minimumLossAlert: number; // 최소 손실률 알림 (%)
}

class NotificationService {
  private settings: NotificationSettings = {
    enabled: true,
    tradeNotifications: true,
    systemNotifications: true,
    analysisNotifications: true,
    soundEnabled: true,
    minimumProfitAlert: 5, // 5% 이상 수익
    minimumLossAlert: -3, // 3% 이상 손실
  };
  
  private notificationHistory: Array<NotificationOptions & { timestamp: number }> = [];
  private iconPath: string;
  
  constructor() {
    this.iconPath = path.join(__dirname, 'icon.png');
    this.loadSettings();
  }
  
  // 설정 로드
  private loadSettings(): void {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'notification-settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        this.settings = { ...this.settings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }
  
  // 설정 저장
  public saveSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    try {
      const settingsPath = path.join(app.getPath('userData'), 'notification-settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }
  
  // 설정 가져오기
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }
  
  // 알림 표시
  public async showNotification(options: NotificationOptions): Promise<void> {
    // 알림이 비활성화되어 있으면 무시
    if (!this.settings.enabled) return;
    
    // 타입별 알림 설정 확인
    if (options.type === 'trade' && !this.settings.tradeNotifications) return;
    if (options.type === 'system' && !this.settings.systemNotifications) return;
    if (options.type === 'analysis' && !this.settings.analysisNotifications) return;
    
    // 알림 생성
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: this.iconPath,
      silent: !this.settings.soundEnabled || options.silent,
      urgency: options.priority || 'normal',
      timeoutType: 'default',
    });
    
    // 클릭 이벤트 처리
    notification.on('click', () => {
      console.log('Notification clicked:', options.title);
      // 메인 윈도우 포커스
      const { getMainWindow } = require('./main');
      const mainWindow = getMainWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    
    // 알림 표시
    notification.show();
    
    // 히스토리에 추가
    this.addToHistory(options);
  }
  
  // 거래 체결 알림
  public notifyTradeExecuted(trade: {
    market: string;
    type: 'BUY' | 'SELL';
    price: number;
    amount: number;
    profit?: number;
    profitRate?: number;
  }): void {
    const isBuy = trade.type === 'BUY';
    const coin = trade.market.split('-')[1];
    
    let title = `${isBuy ? '매수' : '매도'} 체결`;
    let body = `${coin} ${isBuy ? '매수' : '매도'} 완료\n`;
    body += `가격: ₩${trade.price.toLocaleString()}\n`;
    body += `금액: ₩${trade.amount.toLocaleString()}`;
    
    // 매도의 경우 수익/손실 정보 추가
    if (!isBuy && trade.profitRate !== undefined) {
      const isProfit = trade.profitRate >= 0;
      body += `\n수익률: ${isProfit ? '+' : ''}${trade.profitRate.toFixed(2)}%`;
      
      // 수익/손실 임계값 확인
      if (trade.profitRate >= this.settings.minimumProfitAlert) {
        title = `🎉 ${coin} 수익 실현!`;
      } else if (trade.profitRate <= this.settings.minimumLossAlert) {
        title = `⚠️ ${coin} 손실 발생`;
      }
    }
    
    this.showNotification({
      title,
      body,
      type: 'trade',
      priority: trade.profitRate && Math.abs(trade.profitRate) >= 5 ? 'critical' : 'normal',
      data: trade,
    });
  }
  
  // 시스템 상태 알림
  public notifySystemStatus(status: {
    type: 'started' | 'stopped' | 'error';
    message: string;
    details?: string;
  }): void {
    let title = '';
    let priority: 'low' | 'normal' | 'critical' = 'normal';
    
    switch (status.type) {
      case 'started':
        title = '✅ 자동매매 시작';
        break;
      case 'stopped':
        title = '⏹️ 자동매매 중지';
        break;
      case 'error':
        title = '❌ 시스템 오류';
        priority = 'critical';
        break;
    }
    
    this.showNotification({
      title,
      body: status.details || status.message,
      type: 'system',
      priority,
    });
  }
  
  // 분석 완료 알림
  public notifyAnalysisComplete(analysis: {
    market: string;
    confidence: number;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
    aiAnalysis?: boolean;
  }): void {
    const coin = analysis.market.split('-')[1];
    
    // 높은 신뢰도의 신호만 알림
    if (analysis.confidence < 80) return;
    
    let icon = '';
    switch (analysis.recommendation) {
      case 'BUY':
        icon = '📈';
        break;
      case 'SELL':
        icon = '📉';
        break;
      case 'HOLD':
        icon = '⏸️';
        break;
    }
    
    this.showNotification({
      title: `${icon} ${coin} ${analysis.recommendation} 신호`,
      body: `신뢰도: ${analysis.confidence.toFixed(1)}%${analysis.aiAnalysis ? '\n(AI 분석 포함)' : ''}`,
      type: 'analysis',
      priority: analysis.confidence >= 90 ? 'critical' : 'normal',
      data: analysis,
    });
  }
  
  // 오류 알림
  public notifyError(error: {
    title: string;
    message: string;
    code?: string;
  }): void {
    this.showNotification({
      title: `⚠️ ${error.title}`,
      body: error.message + (error.code ? `\n오류 코드: ${error.code}` : ''),
      type: 'error',
      priority: 'critical',
    });
  }
  
  // 알림 히스토리 추가
  private addToHistory(notification: NotificationOptions): void {
    this.notificationHistory.push({
      ...notification,
      timestamp: Date.now(),
    });
    
    // 최대 100개까지만 보관
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(-100);
    }
  }
  
  // 알림 히스토리 가져오기
  public getHistory(limit: number = 50): Array<NotificationOptions & { timestamp: number }> {
    return this.notificationHistory.slice(-limit);
  }
  
  // 알림 히스토리 초기화
  public clearHistory(): void {
    this.notificationHistory = [];
  }
}

export default new NotificationService();