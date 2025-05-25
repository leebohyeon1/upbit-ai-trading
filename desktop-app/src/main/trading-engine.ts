import upbitService, { UpbitTicker } from './upbit-service';
import analysisService, { TechnicalAnalysis } from './analysis-service';
import { EventEmitter } from 'events';

export interface TradingConfig {
  enableRealTrading: boolean;
  maxInvestmentPerCoin: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  rsiOverbought: number;
  rsiOversold: number;
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
  private isRunning = false;
  private aiEnabled = false;
  private activeMarkets: string[] = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-DOGE'];
  private config: TradingConfig = {
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    rsiOverbought: 70,
    rsiOversold: 30
  };
  
  private analysisResults: Map<string, CoinAnalysis> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;
  private statusInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  setApiKeys(accessKey: string, secretKey: string) {
    upbitService.setApiKeys(accessKey, secretKey);
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

  async start(): Promise<boolean> {
    if (this.isRunning) return false;

    try {
      this.isRunning = true;
      
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
      this.isRunning = false;
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (!this.isRunning) return false;

    this.isRunning = false;
    
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
    if (!this.isRunning) return;

    try {
      console.log('Performing market analysis...');
      
      for (const market of this.activeMarkets) {
        try {
          // 캔들 데이터 가져오기
          const candles = await upbitService.getCandles(market, 200);
          if (candles.length === 0) continue;

          // 현재가 가져오기
          const tickers = await upbitService.getTickers([market]);
          const currentPrice = tickers[0]?.trade_price || candles[candles.length - 1].trade_price;

          // 기술적 분석 수행
          const technicalAnalysis = analysisService.analyzeTechnicals(candles);
          
          // AI 분석 (간단한 규칙 기반)
          const aiAnalysis = this.aiEnabled 
            ? analysisService.generateAIAnalysis(technicalAnalysis)
            : '기본 기술적 분석만 수행됨';

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
          console.error(`Failed to analyze ${market}:`, error);
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
      // 계좌 정보 확인
      const accounts = await upbitService.getAccounts();
      const krwAccount = accounts.find(acc => acc.currency === 'KRW');
      const coinAccount = accounts.find(acc => acc.currency === market.split('-')[1]);

      if (technical.signal === 'BUY' && technical.confidence > 60) {
        // 매수 로직
        if (krwAccount && parseFloat(krwAccount.balance) > this.config.maxInvestmentPerCoin) {
          console.log(`Buy signal for ${market} - attempting purchase`);
          // 실제 거래 실행 (테스트 모드에서는 로그만)
          if (this.config.enableRealTrading) {
            await upbitService.buyOrder(market, this.config.maxInvestmentPerCoin.toString());
          }
          this.emit('tradeExecuted', {
            type: 'BUY',
            market,
            price: analysis.currentPrice,
            confidence: technical.confidence
          });
        }
      } else if (technical.signal === 'SELL' && technical.confidence > 60) {
        // 매도 로직
        if (coinAccount && parseFloat(coinAccount.balance) > 0) {
          console.log(`Sell signal for ${market} - attempting sale`);
          // 실제 거래 실행 (테스트 모드에서는 로그만)
          if (this.config.enableRealTrading) {
            await upbitService.sellOrder(market, coinAccount.balance);
          }
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
      isRunning: this.isRunning,
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
      isRunning: this.isRunning,
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
}

export default new TradingEngine();