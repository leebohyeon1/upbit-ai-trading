import upbitService, { UpbitTicker } from './upbit-service';
import analysisService, { TechnicalAnalysis } from './analysis-service';
import aiService from './ai-service';
import { EventEmitter } from 'events';
import TradingConfigHelper, { CoinSpecificConfig } from './trading-config';
import { LearningService } from './learning-service';

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
  sellRatio: number; // 매도 비율 (0.1 = 10%, 1.0 = 100%)
  buyRatio: number; // 매수 비율 (0.1 = 10%, 1.0 = 100%)
  // 동적 파라미터 조정 설정
  dynamicRSI: boolean; // RSI 임계값 동적 조정 활성화
  dynamicConfidence: boolean; // 신뢰도 임계값 동적 조정 활성화
  useKellyCriterion: boolean; // Kelly Criterion 사용 여부
  maxKellyFraction: number; // Kelly Criterion 최대 배팅 비율
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

export interface TradeHistory {
  market: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  confidence: number;
  timestamp: number;
  profit?: number;
}

export interface DynamicParameters {
  market: string;
  adjustedRSIOverbought: number;
  adjustedRSIOversold: number;
  adjustedMinConfidence: number;
  currentVolatility: number;
  recentPerformance: {
    winRate: number;
    avgProfit: number;
    consecutiveLosses: number;
    consecutiveWins: number;
  };
}

class TradingEngine extends EventEmitter {
  private _isRunning = false;
  private aiEnabled = false;
  private activeMarkets: string[] = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-DOGE'];
  private config: TradingConfig = {
    enableRealTrading: false,
    maxInvestmentPerCoin: 50000, // 100000 → 50000 (최대 투자금 축소)
    stopLossPercent: 3, // 5 → 3 (손절선을 더 타이트하게)
    takeProfitPercent: 5, // 10 → 5 (작은 이익에도 확정)
    rsiOverbought: 75, // 70 → 75 (더 확실한 과매수에서만 매도)
    rsiOversold: 25, // 30 → 25 (더 확실한 과매도에서만 매수)
    buyingCooldown: 120, // 30분 → 120분 (2시간 매수 쿨타임)
    sellingCooldown: 60, // 20분 → 60분 (1시간 매도 쿨타임)
    minConfidenceForTrade: 75, // 60% → 75% (높은 신뢰도에서만 거래)
    sellRatio: 1.0, // 50% → 100% (손실 시 전량 매도로 리스크 차단)
    buyRatio: 0.1, // 30% → 10% (최소 금액으로 진입)
    // 동적 파라미터 조정 설정
    dynamicRSI: true,
    dynamicConfidence: true,
    useKellyCriterion: true,
    maxKellyFraction: 0.1 // 0.25 → 0.1 (Kelly의 10%만 베팅, 매우 보수적)
  };
  
  private analysisResults: Map<string, CoinAnalysis> = new Map();
  private lastTradeTime: Map<string, { buy?: number; sell?: number }> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;
  private statusInterval: NodeJS.Timeout | null = null;
  
  // 추가된 속성들
  private tradeHistory: TradeHistory[] = [];
  private dynamicParameters: Map<string, DynamicParameters> = new Map();
  private performanceMetrics: Map<string, { wins: number; losses: number; totalProfit: number }> = new Map();
  private learningService: LearningService;

  constructor() {
    super();
    this.learningService = new LearningService();
    this.setupLearningService();
  }

  private setupLearningService(): void {
    // 가중치 업데이트 이벤트 리스닝
    this.learningService.on('weights-updated', (weights) => {
      this.emit('weightsUpdated', weights);
    });

    // 거래 기록 이벤트 리스닝
    this.learningService.on('trade-recorded', (result) => {
      console.log('Trade recorded for learning:', result.market, result.profitRate + '%');
    });
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
      
      // 주기적 분석 시작 (60초마다) - 분석 빈도 감소
      this.analysisInterval = setInterval(() => {
        this.performAnalysis();
      }, 60000); // 30초 → 60초로 변경

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
          const ticker = tickers[0];
          const currentPrice = ticker?.trade_price || candles[candles.length - 1].trade_price;

          // 추가 데이터 가져오기
          const [orderbook, trades] = await Promise.all([
            upbitService.getOrderbook(market),
            upbitService.getTrades(market, 50)
          ]);

          // 기술적 분석 수행 (추가 데이터 포함)
          const technicalAnalysis = await analysisService.analyzeTechnicals(candles, ticker, orderbook, trades);
          
          // 분석 설정 찾기
          const analysisConfig = this.analysisConfigs.find(config => config.ticker === ticker);
          
          // AI 분석 (실제 Claude API 사용)
          const aiAnalysis = await aiService.generateTradingAnalysis(technicalAnalysis, { 
              currentPrice, 
              market,
              buyScore: technicalAnalysis.scores?.buyScore,
              sellScore: technicalAnalysis.scores?.sellScore
            }, analysisConfig);

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
      // 코인별 설정 가져오기
      let coinConfig = TradingConfigHelper.getCoinConfig(market);
      
      // 현재 시간 확인
      const currentHour = new Date().getHours();
      if (!TradingConfigHelper.shouldTradeAtHour(coinConfig, currentHour)) {
        console.log(`${market}: Trading not preferred at hour ${currentHour}`);
        return;
      }
      
      // 시장 상황 판단 (간단한 버전)
      const marketCondition = this.determineMarketCondition(technical);
      coinConfig = TradingConfigHelper.adjustConfigForMarketCondition(coinConfig, marketCondition);
      
      // 변동성에 따른 조정
      if (technical.atr) {
        const volatility = technical.atr / technical.bollinger.middle;
        coinConfig = TradingConfigHelper.adjustConfigForVolatility(coinConfig, volatility);
      }
      
      // 동적 파라미터 계산
      const dynamicParams = this.calculateDynamicParameters(market, technical);
      
      // 코인별 신뢰도 임계값 적용
      // 분석 설정에서 사용자가 지정한 값 우선 사용
      const ticker = market.split('-')[1];
      const analysisConfig = this.analysisConfigs.find(config => config.ticker === ticker);
      
      const minConfidenceForTrade = technical.signal === 'BUY' ? 
        (analysisConfig?.buyConfidenceThreshold || coinConfig.minConfidenceForBuy) : 
        (analysisConfig?.sellConfidenceThreshold || coinConfig.minConfidenceForSell);
      
      const minConfidence = this.config.dynamicConfidence ? 
        Math.max(dynamicParams.adjustedMinConfidence, minConfidenceForTrade) : 
        minConfidenceForTrade;
      
      if (technical.confidence < minConfidence) {
        console.log(`${market} confidence ${technical.confidence.toFixed(1)}% below threshold ${minConfidence}%`);
        return;
      }

      // 계좌 정보 확인
      const accounts = await upbitService.getAccounts();
      const krwAccount = accounts.find(acc => acc.currency === 'KRW');
      const coinAccount = accounts.find(acc => acc.currency === market.split('-')[1]);

      if (technical.signal === 'BUY') {
        // 코인별 매수 쿨타임 체크
        const buyCooldown = analysisConfig?.buyCooldown || coinConfig.buyingCooldown;
        
        // 높은 신뢰도에서 쿨다운 무시 옵션 체크
        const skipCooldown = analysisConfig?.skipCooldownOnHighConfidence && 
                           technical.confidence >= (analysisConfig?.skipCooldownThreshold || 85);
        
        if (!skipCooldown && this.isInCooldownWithConfig(market, 'buy', buyCooldown)) {
          return;
        }

        // 매수 로직
        const maxInvestment = Math.min(this.config.maxInvestmentPerCoin, coinConfig.maxPositionSize);
        if (krwAccount && parseFloat(krwAccount.balance) > maxInvestment) {
          // Kelly Criterion 계산
          let adjustedBuyRatio = coinConfig.defaultBuyRatio;
          
          if (this.config.useKellyCriterion) {
            const metrics = this.performanceMetrics.get(market);
            if (metrics && (metrics.wins + metrics.losses) > 5) { // 최소 5회 거래 후부터 Kelly 적용
              const winRate = metrics.wins / (metrics.wins + metrics.losses);
              const avgWin = metrics.wins > 0 ? metrics.totalProfit / metrics.wins : 0;
              const avgLoss = metrics.losses > 0 ? Math.abs(metrics.totalProfit / metrics.losses) : 1;
              
              const kellyFraction = this.calculateKellyFraction(winRate, avgWin, avgLoss);
              adjustedBuyRatio = kellyFraction > 0 ? kellyFraction : this.config.buyRatio * 0.5;
            }
          } else {
            // 기존 신뢰도 기반 매수 비율 조정 (더 보수적으로)
            if (technical.confidence >= 95) {
              adjustedBuyRatio = Math.min(0.3, this.config.buyRatio * 1.5); // 최대 30%
            } else if (technical.confidence >= 90) {
              adjustedBuyRatio = Math.min(0.2, this.config.buyRatio * 1.2); // 최대 20%
            } else if (technical.confidence >= 85) {
              adjustedBuyRatio = this.config.buyRatio; // 기본값 유지
            } else {
              adjustedBuyRatio = this.config.buyRatio * 0.5; // 50%로 축소
            }
          }
          
          // 변동성에 따른 추가 조정 (더 보수적으로)
          if (dynamicParams.currentVolatility > 0.05) {
            adjustedBuyRatio *= 0.3; // 극도의 변동성에서는 70% 축소
          } else if (dynamicParams.currentVolatility > 0.03) {
            adjustedBuyRatio *= 0.5; // 높은 변동성에서는 50% 축소
          } else if (dynamicParams.currentVolatility > 0.02) {
            adjustedBuyRatio *= 0.7; // 중간 변동성에서는 30% 축소
          }
          
          // 매수할 금액 계산
          const maxInvestment = this.config.maxInvestmentPerCoin;
          const buyAmount = maxInvestment * adjustedBuyRatio;
          
          // 최소 주문 금액 확인 (5,000원)
          if (buyAmount < 5000) {
            console.log(`Buy amount ₩${buyAmount.toLocaleString()} is below minimum order amount ₩5,000`);
            return;
          }
          
          const buyAmountStr = buyAmount.toFixed(0); // 원 단위로 반올림
          
          console.log(`Buy signal for ${market} - confidence: ${technical.confidence.toFixed(1)}%`);
          console.log(`Base ratio: ${(this.config.buyRatio * 100).toFixed(1)}%, Adjusted ratio: ${(adjustedBuyRatio * 100).toFixed(1)}%`);
          console.log(`Max investment: ₩${maxInvestment.toLocaleString()}, Buy amount: ₩${buyAmount.toLocaleString()}`);
          
          // 실제 거래 실행 (테스트 모드에서는 로그만)
          if (this.config.enableRealTrading) {
            await upbitService.buyOrder(market, buyAmountStr);
          }
          
          // 거래 시간 기록
          this.recordTradeTime(market, 'buy');
          
          // 거래 기록 저장
          const trade = {
            market,
            type: 'BUY' as const,
            price: analysis.currentPrice,
            amount: parseFloat(buyAmountStr),
            confidence: technical.confidence,
            timestamp: Date.now()
          };
          this.recordTrade(trade);
          
          // 학습 시스템에 매수 진입점 기록
          this.recordEntryForLearning(market, technical, analysis);
          
          this.emit('tradeExecuted', {
            type: 'BUY',
            market,
            price: analysis.currentPrice,
            amount: parseFloat(buyAmountStr),
            confidence: technical.confidence,
            adjustedRatio: adjustedBuyRatio,
            dynamicParams
          });
        }
      } else if (technical.signal === 'SELL') {
        // 코인별 매도 쿨타임 체크
        const sellCooldown = analysisConfig?.sellCooldown || coinConfig.sellingCooldown;
        
        // 높은 신뢰도에서 쿨다운 무시 옵션 체크
        const skipCooldown = analysisConfig?.skipCooldownOnHighConfidence && 
                           technical.confidence >= (analysisConfig?.skipCooldownThreshold || 85);
        
        if (!skipCooldown && this.isInCooldownWithConfig(market, 'sell', sellCooldown)) {
          return;
        }

        // 매도 로직
        if (coinAccount && parseFloat(coinAccount.balance) > 0) {
          // 코인별 기본 매도 비율 사용
          let adjustedSellRatio = coinConfig.defaultSellRatio;
          
          // 신뢰도가 90% 이상이면 더 많이 매도 (최대 100%)
          if (technical.confidence >= 0.9) {
            adjustedSellRatio = Math.min(1.0, this.config.sellRatio * 1.5);
          }
          // 신뢰도가 80% 이상이면 조금 더 매도
          else if (technical.confidence >= 0.8) {
            adjustedSellRatio = Math.min(1.0, this.config.sellRatio * 1.2);
          }
          // 신뢰도가 낮으면 (60-70%) 더 적게 매도
          else if (technical.confidence < 0.7) {
            adjustedSellRatio = this.config.sellRatio * 0.7;
          }
          
          // 매도할 수량 계산
          const totalBalance = parseFloat(coinAccount.balance);
          const sellAmount = totalBalance * adjustedSellRatio;
          const sellAmountStr = sellAmount.toFixed(8); // 소수점 8자리까지
          
          console.log(`Sell signal for ${market} - confidence: ${technical.confidence.toFixed(1)}%`);
          console.log(`Base ratio: ${(this.config.sellRatio * 100).toFixed(1)}%, Adjusted ratio: ${(adjustedSellRatio * 100).toFixed(1)}%`);
          console.log(`Total balance: ${totalBalance}, Sell amount: ${sellAmount}`);
          
          // 실제 거래 실행 (테스트 모드에서는 로그만)
          if (this.config.enableRealTrading) {
            await upbitService.sellOrder(market, sellAmountStr);
          }
          
          // 거래 시간 기록
          this.recordTradeTime(market, 'sell');
          
          // 거래 기록 저장 (매도의 경우 수익률 계산)
          const buyHistory = this.getMarketTradeHistory(market).filter(t => t.type === 'BUY');
          const avgBuyPrice = buyHistory.length > 0 ? 
            buyHistory.reduce((sum, t) => sum + t.price, 0) / buyHistory.length : 
            analysis.currentPrice;
          const profit = ((analysis.currentPrice - avgBuyPrice) / avgBuyPrice) * 100;
          
          const trade = {
            market,
            type: 'SELL' as const,
            price: analysis.currentPrice,
            amount: parseFloat(sellAmountStr),
            confidence: technical.confidence,
            timestamp: Date.now(),
            profit
          };
          this.recordTrade(trade);
          
          // 학습 시스템에 거래 결과 기록
          this.recordTradeResultForLearning(market, profit, technical, analysis);
          
          this.emit('tradeExecuted', {
            type: 'SELL',
            market,
            price: analysis.currentPrice,
            amount: parseFloat(sellAmountStr),
            confidence: technical.confidence,
            profit,
            adjustedRatio: adjustedSellRatio,
            dynamicParams
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

  // 동적 파라미터 조정 메서드들
  private calculateDynamicParameters(market: string, analysis: TechnicalAnalysis): DynamicParameters {
    const baseConfig = this.config;
    const history = this.getMarketTradeHistory(market);
    const performance = this.calculateRecentPerformance(market, history);
    
    // 현재 변동성 계산 (ATR 기반)
    const currentVolatility = analysis.atr ? (analysis.atr / analysis.bollinger.middle) : 0.02;
    
    // RSI 임계값 동적 조정
    let adjustedRSIOverbought = baseConfig.rsiOverbought;
    let adjustedRSIOversold = baseConfig.rsiOversold;
    
    if (baseConfig.dynamicRSI) {
      // 고변동성 시장: RSI 임계값을 더 극단적으로 (더 조심스럽게)
      if (currentVolatility > 0.03) {
        adjustedRSIOverbought = 85; // 75 → 85
        adjustedRSIOversold = 15; // 25 → 15
      }
      // 저변동성 시장: RSI 임계값을 보통 수준으로
      else if (currentVolatility < 0.01) {
        adjustedRSIOverbought = 75; // 65 → 75
        adjustedRSIOversold = 25; // 35 → 25
      }
    }
    
    // 신뢰도 임계값 동적 조정
    let adjustedMinConfidence = baseConfig.minConfidenceForTrade;
    
    if (baseConfig.dynamicConfidence) {
      // 최근 2회 연속 손실: 신뢰도 임계값 크게 상향
      if (performance.consecutiveLosses >= 2) {
        adjustedMinConfidence = Math.min(95, baseConfig.minConfidenceForTrade + 15);
      }
      // 최근 5회 연속 수익: 신뢰도 임계값 약간 하향 (보수적)
      else if (performance.consecutiveWins >= 5) {
        adjustedMinConfidence = Math.max(70, baseConfig.minConfidenceForTrade - 3);
      }
      // 낮은 승률: 신뢰도 임계값 크게 상향
      else if (performance.winRate < 0.4) {
        adjustedMinConfidence = Math.min(90, baseConfig.minConfidenceForTrade + 10);
      }
    }
    
    const params: DynamicParameters = {
      market,
      adjustedRSIOverbought,
      adjustedRSIOversold,
      adjustedMinConfidence,
      currentVolatility,
      recentPerformance: performance
    };
    
    this.dynamicParameters.set(market, params);
    return params;
  }
  
  // Kelly Criterion 계산
  private calculateKellyFraction(winRate: number, avgWin: number, avgLoss: number): number {
    if (avgLoss === 0 || winRate === 0) return 0;
    
    const winLossRatio = Math.abs(avgWin / avgLoss);
    const kellyFraction = (winRate * winLossRatio - (1 - winRate)) / winLossRatio;
    
    // Kelly Criterion은 종종 너무 공격적이므로 제한
    const limitedKelly = Math.max(0, Math.min(kellyFraction, this.config.maxKellyFraction));
    
    console.log(`Kelly Criterion: Win rate ${(winRate * 100).toFixed(1)}%, W/L ratio ${winLossRatio.toFixed(2)}, Kelly ${(kellyFraction * 100).toFixed(1)}%, Limited ${(limitedKelly * 100).toFixed(1)}%`);
    
    return limitedKelly;
  }
  
  // 최근 거래 성과 계산
  private calculateRecentPerformance(market: string, history: TradeHistory[]): {
    winRate: number;
    avgProfit: number;
    consecutiveLosses: number;
    consecutiveWins: number;
  } {
    if (history.length === 0) {
      return { winRate: 0.5, avgProfit: 0, consecutiveLosses: 0, consecutiveWins: 0 };
    }
    
    const recentTrades = history.slice(-20); // 최근 20개 거래
    let wins = 0;
    let totalProfit = 0;
    let consecutiveLosses = 0;
    let consecutiveWins = 0;
    let currentStreak = 0;
    let isWinStreak = false;
    
    for (const trade of recentTrades) {
      if (trade.profit && trade.profit > 0) {
        wins++;
        totalProfit += trade.profit;
        if (isWinStreak) {
          currentStreak++;
        } else {
          isWinStreak = true;
          currentStreak = 1;
        }
        consecutiveWins = Math.max(consecutiveWins, currentStreak);
      } else if (trade.profit && trade.profit < 0) {
        totalProfit += trade.profit;
        if (!isWinStreak) {
          currentStreak++;
        } else {
          isWinStreak = false;
          currentStreak = 1;
        }
        consecutiveLosses = Math.max(consecutiveLosses, currentStreak);
      }
    }
    
    const winRate = recentTrades.length > 0 ? wins / recentTrades.length : 0.5;
    const avgProfit = recentTrades.length > 0 ? totalProfit / recentTrades.length : 0;
    
    return { winRate, avgProfit, consecutiveLosses, consecutiveWins };
  }
  
  // 특정 마켓의 거래 기록 가져오기
  private getMarketTradeHistory(market: string): TradeHistory[] {
    return this.tradeHistory.filter(trade => trade.market === market);
  }
  
  // 거래 기록 저장
  private recordTrade(trade: TradeHistory): void {
    this.tradeHistory.push(trade);
    
    // 최대 1000개까지만 보관
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(-1000);
    }
    
    // 성과 메트릭 업데이트
    const metrics = this.performanceMetrics.get(trade.market) || { wins: 0, losses: 0, totalProfit: 0 };
    if (trade.profit) {
      if (trade.profit > 0) {
        metrics.wins++;
      } else {
        metrics.losses++;
      }
      metrics.totalProfit += trade.profit;
    }
    this.performanceMetrics.set(trade.market, metrics);
  }
  
  // analysisConfigs 속성 추가 (174번 라인 오류 수정)
  private analysisConfigs: any[] = [];
  
  // 시장 상황 판단
  private determineMarketCondition(technical: TechnicalAnalysis): 'bull' | 'bear' | 'sideways' {
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // RSI
    if (technical.rsi > 60) bullishSignals++;
    else if (technical.rsi < 40) bearishSignals++;
    
    // MACD
    if (technical.macd.histogram > 0) bullishSignals++;
    else if (technical.macd.histogram < 0) bearishSignals++;
    
    // 이동평균선
    if (technical.sma.sma20 > technical.sma.sma50) bullishSignals++;
    else if (technical.sma.sma20 < technical.sma.sma50) bearishSignals++;
    
    // 가격 변화
    if (technical.priceChange.changeRate24h > 0.05) bullishSignals++;
    else if (technical.priceChange.changeRate24h < -0.05) bearishSignals++;
    
    // ADX (추세 강도)
    if (technical.adx && technical.adx.trend === 'STRONG') {
      if (technical.adx.plusDI > technical.adx.minusDI) bullishSignals += 2;
      else bearishSignals += 2;
    }
    
    // 판단
    if (bullishSignals >= bearishSignals * 1.5) return 'bull';
    else if (bearishSignals >= bullishSignals * 1.5) return 'bear';
    else return 'sideways';
  }
  
  // 코인별 쿨다운 체크
  private isInCooldownWithConfig(market: string, action: 'buy' | 'sell', cooldownMinutes: number): boolean {
    const lastTrade = this.lastTradeTime.get(market);
    if (!lastTrade) return false;

    const lastTime = action === 'buy' ? lastTrade.buy : lastTrade.sell;
    if (!lastTime) return false;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const now = Date.now();

    const isInCooldown = (now - lastTime) < cooldownMs;
    
    if (isInCooldown) {
      const remainingMinutes = Math.ceil((cooldownMs - (now - lastTime)) / (60 * 1000));
      console.log(`${market} ${action} cooldown: ${remainingMinutes} minutes remaining (config: ${cooldownMinutes}min)`);
    }

    return isInCooldown;
  }

  // 학습 시스템 관련 메서드들
  private entryPoints: Map<string, { price: number; indicators: any; conditions: any; timestamp: number }> = new Map();

  private recordEntryForLearning(market: string, technical: TechnicalAnalysis, analysis: CoinAnalysis): void {
    // 매수 진입점 기록
    this.entryPoints.set(market, {
      price: analysis.currentPrice,
      indicators: {
        rsi: technical.rsi,
        macd: technical.macd.histogram,
        bb_position: technical.bollinger.position,
        volume_ratio: technical.volumeRatio,
        stochastic_rsi: technical.stochasticRSI ? technical.stochasticRSI.k : 0,
        atr: technical.atr || 0,
        obv_trend: technical.obvTrend || 0,
        adx: technical.adx ? technical.adx.adx : 0
      },
      conditions: {
        trend: this.determineMarketCondition(technical),
        volatility: this.categorizeVolatility(technical.atr, technical.bollinger.middle),
        volume: this.categorizeVolume(technical.volumeRatio)
      },
      timestamp: Date.now()
    });
  }

  private recordTradeResultForLearning(market: string, profitRate: number, technical: TechnicalAnalysis, analysis: CoinAnalysis): void {
    const entry = this.entryPoints.get(market);
    if (!entry) return;

    // 거래 결과를 학습 시스템에 기록
    this.learningService.recordTrade({
      market,
      timestamp: Date.now(),
      entryPrice: entry.price,
      exitPrice: analysis.currentPrice,
      profit: (analysis.currentPrice - entry.price) / entry.price * 100,
      profitRate,
      holding_period: (Date.now() - entry.timestamp) / (1000 * 60), // 분 단위
      indicators: entry.indicators,
      market_conditions: entry.conditions,
      news_sentiment: analysis.aiAnalysis ? this.extractSentimentScore(analysis.aiAnalysis) : 0,
      whale_activity: technical.whaleActivity || false
    });

    // 진입점 기록 삭제
    this.entryPoints.delete(market);

    // 성능 메트릭 업데이트
    this.updatePerformanceMetrics(market, profitRate);
  }

  private categorizeVolatility(atr?: number, price?: number): 'low' | 'medium' | 'high' {
    if (!atr || !price) return 'medium';
    const volatility = atr / price;
    if (volatility < 0.02) return 'low';
    if (volatility > 0.05) return 'high';
    return 'medium';
  }

  private categorizeVolume(volumeRatio: number): 'low' | 'medium' | 'high' {
    if (volumeRatio < 0.8) return 'low';
    if (volumeRatio > 1.5) return 'high';
    return 'medium';
  }

  private extractSentimentScore(aiAnalysis: string): number {
    // AI 분석에서 감정 점수 추출 (간단한 키워드 기반)
    const positiveKeywords = ['긍정', '상승', '강세', '매수', '좋', '유리'];
    const negativeKeywords = ['부정', '하락', '약세', '매도', '나쁘', '불리'];
    
    let score = 0;
    positiveKeywords.forEach(keyword => {
      if (aiAnalysis.includes(keyword)) score += 0.2;
    });
    negativeKeywords.forEach(keyword => {
      if (aiAnalysis.includes(keyword)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  private updatePerformanceMetrics(market: string, profitRate: number): void {
    const metrics = this.performanceMetrics.get(market) || { wins: 0, losses: 0, totalProfit: 0 };
    
    if (profitRate > 0) {
      metrics.wins++;
    } else {
      metrics.losses++;
    }
    metrics.totalProfit += profitRate;
    
    this.performanceMetrics.set(market, metrics);
  }

  // 학습된 가중치를 사용한 신호 평가
  public async evaluateSignalWithLearning(market: string, technical: TechnicalAnalysis): Promise<{
    adjustedConfidence: number;
    learningInsights: string[];
  }> {
    const weights = this.learningService.getWeights();
    const prediction = this.learningService.predictTradeSuccess(market, {
      rsi: technical.rsi,
      macd: technical.macd.histogram,
      bb_position: technical.bollinger.position,
      volume_ratio: technical.volumeRatio,
      stochastic_rsi: technical.stochasticRSI ? technical.stochasticRSI.k : 0,
      atr: technical.atr || 0,
      obv_trend: technical.obvTrend || 0,
      adx: technical.adx ? technical.adx.adx : 0
    }, {
      trend: this.determineMarketCondition(technical),
      volatility: this.categorizeVolatility(technical.atr, technical.bollinger.middle),
      volume: this.categorizeVolume(technical.volumeRatio)
    });

    // 기존 신뢰도와 학습 예측을 결합
    const adjustedConfidence = technical.confidence * 0.7 + prediction.probability * 100 * 0.3;
    
    const insights = [
      `학습 예측 성공률: ${(prediction.probability * 100).toFixed(1)}%`,
      `예측 신뢰도: ${(prediction.confidence * 100).toFixed(1)}%`,
      ...prediction.key_factors
    ];

    return {
      adjustedConfidence,
      learningInsights: insights
    };
  }

  // 학습 시스템 상태 조회
  public getLearningStatus(): {
    performance: ReturnType<LearningService['getPerformanceStats']>;
    indicatorWeights: ReturnType<LearningService['getIndicatorPerformance']>;
  } {
    return {
      performance: this.learningService.getPerformanceStats(),
      indicatorWeights: this.learningService.getIndicatorPerformance()
    };
  }

  // 종료 시 학습 데이터 저장
  public destroy(): void {
    if (this.learningService) {
      this.learningService.destroy();
    }
  }
}

export default new TradingEngine();