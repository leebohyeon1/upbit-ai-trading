import upbitService, { UpbitTicker } from './upbit-service';
import analysisService, { TechnicalAnalysis } from './analysis-service';
import aiService from './ai-service';
import { EventEmitter } from 'events';

export interface TradingConfig {
  enableRealTrading: boolean;
  maxInvestmentPerCoin: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  rsiOverbought: number;
  rsiOversold: number;
  buyingCooldown: number; // 매수 쿨타임 (분)
  sellingCooldown: number; // 매도 쿨타임 (분)
  minConfidenceForTrade: number; // 거래 최소 신뢰도
}

export interface TradingStatus {
  isRunning: boolean;
  aiEnabled: boolean;
  activeCoins: string[];
  analyzedCoins: number;
  totalProfit: number;
  todayTrades: number;
}

export interface CoinAnalysis {
  market: string;
  currentPrice: number;
  analysis: TechnicalAnalysis;
  aiAnalysis: string;
  lastUpdated: number;
}

class TradingEngine extends EventEmitter {
  private _isRunning = false;
  private aiEnabled = false;
  private activeMarkets: string[] = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-DOGE'];
  private config: TradingConfig = {
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    rsiOverbought: 70,
    rsiOversold: 30,
    buyingCooldown: 30, // 30분 매수 쿨타임
    sellingCooldown: 20, // 20분 매도 쿨타임
    minConfidenceForTrade: 60 // 60% 이상 신뢰도에서만 거래
  };
  
  private analysisResults: Map<string, CoinAnalysis> = new Map();
  private lastTradeTime: Map<string, { buy?: number; sell?: number }> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;
  private statusInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  setApiKeys(accessKey: string, secretKey: string, anthropicApiKey?: string) {
    upbitService.setApiKeys(accessKey, secretKey);
    if (anthropicApiKey) {
      aiService.setApiKey(anthropicApiKey);
    }
  }

  setConfig(config: Partial<TradingConfig>) {
    this.config = { ...this.config, ...config };
    this.emit('configChanged', this.config);
  }

  setActiveMarkets(markets: string[]) {
    this.activeMarkets = markets;
  }

  toggleAI(enabled: boolean) {
    this.aiEnabled = enabled;
    this.emit('aiToggled', enabled);
  }

  updateConfig(newConfig: Partial<TradingConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('Trading config updated:', this.config);
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  async start(): Promise<boolean> {
    if (this._isRunning) return false;

    try {
      this._isRunning = true;
      
      // 즉시 첫 분석 실행
      await this.performAnalysis();
      
      // 주기적 분석 시작 (30초마다)
      this.analysisInterval = setInterval(() => {
        this.performAnalysis();
      }, 30000);

      // 상태 업데이트 (5초마다)
      this.statusInterval = setInterval(() => {
        this.emitStatus();
      }, 5000);

      this.emit('tradingStarted');
      console.log('Trading engine started');
      return true;
    } catch (error) {
      console.error('Failed to start trading engine:', error);
      this._isRunning = false;
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (!this._isRunning) return false;

    this._isRunning = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }

    this.emit('tradingStopped');
    console.log('Trading engine stopped');
    return true;
  }

  private async performAnalysis() {
    if (!this._isRunning) return;

    try {
      console.log('Performing market analysis...');
      
      for (const market of this.activeMarkets) {
        try {
          // 캔들 데이터 가져오기
          const candles = await upbitService.getCandles(market, 200);
          if (candles.length === 0) {
            console.log(`No candle data available for ${market}, skipping...`);
            continue;
          }

          // 현재가 가져오기
          const tickers = await upbitService.getTickers([market]);
          const currentPrice = tickers[0]?.trade_price || candles[candles.length - 1].trade_price;

          // 기술적 분석 수행
          const technicalAnalysis = analysisService.analyzeTechnicals(candles);
          
          // AI 분석 (실제 Claude API 사용)
          const aiAnalysis = this.aiEnabled 
            ? await aiService.generateTradingAnalysis(technicalAnalysis, { currentPrice, market })
            : aiService.generateAdvancedFallbackAnalysis(technicalAnalysis);

          // 결과 저장
          const coinAnalysis: CoinAnalysis = {
            market,
            currentPrice,
            analysis: technicalAnalysis,
            aiAnalysis,
            lastUpdated: Date.now()
          };

          this.analysisResults.set(market, coinAnalysis);

          // 개별 분석 결과 즉시 전송 (프론트엔드 형식으로 변환)
          const frontendAnalysis = {
            ticker: market,
            decision: technicalAnalysis.signal.toLowerCase(),
            confidence: technicalAnalysis.confidence / 100,
            reason: aiAnalysis,
            timestamp: new Date().toISOString()
          };
          
          this.emit('singleAnalysisCompleted', frontendAnalysis);

          // 거래 신호 처리
          if (this.config.enableRealTrading) {
            await this.processTradeSignal(coinAnalysis);
          }

          console.log(`Analysis completed for ${market}: ${technicalAnalysis.signal} (${technicalAnalysis.confidence.toFixed(1)}%)`);
          
        } catch (error) {
          console.log(`Failed to analyze ${market}: ${(error as Error).message}`);
        }
      }

      // 분석 완료 이벤트 발송 (프론트엔드 형식으로 변환)
      const frontendAnalyses = Array.from(this.analysisResults.values()).map(analysis => ({
        ticker: analysis.market,
        decision: analysis.analysis.signal.toLowerCase(),
        confidence: analysis.analysis.confidence / 100,
        reason: analysis.aiAnalysis,
        timestamp: new Date(analysis.lastUpdated).toISOString()
      }));
      
      this.emit('analysisCompleted', frontendAnalyses);
      
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }

  private async processTradeSignal(analysis: CoinAnalysis) {
    const { market, analysis: technical } = analysis;
    
    try {
      // 신뢰도 체크
      if (technical.confidence < this.config.minConfidenceForTrade) {
        console.log(`${market} confidence ${technical.confidence.toFixed(1)}% below threshold ${this.config.minConfidenceForTrade}%`);
        return;
      }

      // 계좌 정보 확인
      const accounts = await upbitService.getAccounts();
      const krwAccount = accounts.find(acc => acc.currency === 'KRW');
      const coinAccount = accounts.find(acc => acc.currency === market.split('-')[1]);

      if (technical.signal === 'BUY') {
        // 매수 쿨타임 체크
        if (this.isInCooldown(market, 'buy')) {
          return;
        }

        // 매수 로직
        if (krwAccount && parseFloat(krwAccount.balance) > this.config.maxInvestmentPerCoin) {
          console.log(`Buy signal for ${market} - confidence: ${technical.confidence.toFixed(1)}%`);
          
          // 실제 거래 실행 (테스트 모드에서는 로그만)
          if (this.config.enableRealTrading) {
            await upbitService.buyOrder(market, this.config.maxInvestmentPerCoin.toString());
          }
          
          // 거래 시간 기록
          this.recordTradeTime(market, 'buy');
          
          this.emit('tradeExecuted', {
            type: 'BUY',
            market,
            price: analysis.currentPrice,
            confidence: technical.confidence
          });
        }
      } else if (technical.signal === 'SELL') {
        // 매도 쿨타임 체크
        if (this.isInCooldown(market, 'sell')) {
          return;
        }

        // 매도 로직
        if (coinAccount && parseFloat(coinAccount.balance) > 0) {
          console.log(`Sell signal for ${market} - confidence: ${technical.confidence.toFixed(1)}%`);
          
          // 실제 거래 실행 (테스트 모드에서는 로그만)
          if (this.config.enableRealTrading) {
            await upbitService.sellOrder(market, coinAccount.balance);
          }
          
          // 거래 시간 기록
          this.recordTradeTime(market, 'sell');
          
          this.emit('tradeExecuted', {
            type: 'SELL',
            market,
            price: analysis.currentPrice,
            confidence: technical.confidence
          });
        }
      }
    } catch (error) {
      console.error(`Failed to process trade signal for ${market}:`, error);
    }
  }

  private emitStatus() {
    const status: TradingStatus = {
      isRunning: this._isRunning,
      aiEnabled: this.aiEnabled,
      activeCoins: this.activeMarkets,
      analyzedCoins: this.analysisResults.size,
      totalProfit: 0, // 실제 구현에서는 수익률 계산
      todayTrades: 0   // 실제 구현에서는 오늘 거래 수 계산
    };

    this.emit('statusUpdate', status);
  }

  getStatus(): TradingStatus {
    return {
      isRunning: this._isRunning,
      aiEnabled: this.aiEnabled,
      activeCoins: this.activeMarkets,
      analyzedCoins: this.analysisResults.size,
      totalProfit: 0,
      todayTrades: 0
    };
  }

  getAnalysisResults(): CoinAnalysis[] {
    return Array.from(this.analysisResults.values());
  }

  getAnalysisForMarket(market: string): CoinAnalysis | undefined {
    return this.analysisResults.get(market);
  }

  private isInCooldown(market: string, action: 'buy' | 'sell'): boolean {
    const lastTrade = this.lastTradeTime.get(market);
    if (!lastTrade) return false;

    const lastTime = action === 'buy' ? lastTrade.buy : lastTrade.sell;
    if (!lastTime) return false;

    const cooldownMinutes = action === 'buy' ? this.config.buyingCooldown : this.config.sellingCooldown;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const now = Date.now();

    const isInCooldown = (now - lastTime) < cooldownMs;
    
    if (isInCooldown) {
      const remainingMinutes = Math.ceil((cooldownMs - (now - lastTime)) / (60 * 1000));
      console.log(`${market} ${action} cooldown: ${remainingMinutes} minutes remaining`);
    }

    return isInCooldown;
  }

  private recordTradeTime(market: string, action: 'buy' | 'sell'): void {
    const existing = this.lastTradeTime.get(market) || {};
    existing[action] = Date.now();
    this.lastTradeTime.set(market, existing);
  }
}

export default new TradingEngine();