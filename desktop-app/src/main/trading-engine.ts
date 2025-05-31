import upbitService, { UpbitTicker } from './upbit-service';
import analysisService, { TechnicalAnalysis } from './analysis-service';
import aiService from './ai-service';
import { EventEmitter } from 'events';
import { CoinSpecificConfig } from './trading-config';
import { LearningService } from './learning-service';
import { ApiClient } from './api-client';
import kellyService from './kelly-criterion-service';
import notificationService from './notification-service';
import riskManagementService, { VaRResult, PortfolioPosition } from './risk-management-service';
import tradeHistoryService from './trade-history-service';
import newsService from './news-service';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface TradingConfig {
  enableRealTrading: boolean;
  maxInvestmentPerCoin: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  rsiOverbought: number;
  rsiOversold: number;
  buyingCooldown: number; // 매수 쿨타임 (분)
  sellingCooldown: number; // 매도 쿨타임 (분)
  minConfidenceForTrade: number; // 거래 최소 신뢰도 (사용 안 함)
  sellRatio: number; // 매도 비율 (0.1 = 10%, 1.0 = 100%)
  buyRatio: number; // 매수 비율 (0.1 = 10%, 1.0 = 100%)
  // 간소화된 설정
  simplifiedConfig?: {
    enabled: boolean;
    timeframe: string;
    analysisInterval: number;
  }
  // 동적 파라미터 조정 설정
  dynamicRSI: boolean; // RSI 임계값 동적 조정 활성화
  dynamicConfidence: boolean; // 신뢰도 임계값 동적 조정 활성화
  useKellyCriterion: boolean; // Kelly Criterion 사용 여부
  maxKellyFraction: number; // Kelly Criterion 최대 배팅 비율
  // 트레일링 스톱 설정
  enableTrailingStop?: boolean; // 트레일링 스톱 활성화
  trailingStopPercent?: number; // 트레일링 스톱 비율 (%)
  trailingStartPercent?: number; // 트레일링 시작 수익률 (%)
  // 포트폴리오 리밸런싱 설정
  enableAutoRebalancing?: boolean; // 자동 리밸런싱 활성화
  rebalanceInterval?: number; // 리밸런싱 주기 (시간)
  rebalanceThreshold?: number; // 리밸런싱 임계값 (%)
  targetPortfolio?: Map<string, number>; // 목표 포트폴리오 비중
  // 백테스트 관련 필드
  cooldownAfterTrade?: number;
  stopLoss?: number;
  takeProfit?: number;
  weights?: {
    rsi?: number;
    macd?: number;
    bollinger?: number;
    stochastic?: number;
    volume?: number;
    atr?: number;
    obv?: number;
    adx?: number;
    volatility?: number;
    trendStrength?: number;
    aiAnalysis?: number;
    newsImpact?: number;
    whaleActivity?: number;
  };
  minConfidenceForBuy?: number;
  minConfidenceForSell?: number;
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
  aiAnalysis: string | null;
  lastUpdated: number;
  tradeAttempt?: {
    attempted: boolean;
    success: boolean;
    failureReason?: string;
    details?: string;
  };
}

export interface TradeHistory {
  market: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  volume?: number; // 코인 수량 (시뮬레이션용)
  confidence: number;
  timestamp: number;
  profit?: number;
  profitRate?: number; // 수익률 (%)
  krwBalance?: number; // 거래 후 KRW 잔액 (시뮬레이션용)
  coinBalance?: number; // 거래 후 코인 잔액 (시뮬레이션용)
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
  private activeMarkets: string[] = [];
  private config: TradingConfig = {
    enableRealTrading: false,
    maxInvestmentPerCoin: 0,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    rsiOverbought: 70,
    rsiOversold: 30,
    buyingCooldown: 30,    // 기본 30분
    sellingCooldown: 20,   // 기본 20분
    minConfidenceForTrade: 0,  // 사용 안 함
    sellRatio: 0.5,
    buyRatio: 0.1,
    // 동적 파라미터 조정 설정
    dynamicRSI: false,
    dynamicConfidence: false,
    useKellyCriterion: false,
    maxKellyFraction: 0.25,
    // 간소화된 설정 (기본값)
    simplifiedConfig: {
      enabled: true,          // 간소화 모드 활성화
      timeframe: 'minute60',  // 기본 60분봉
      analysisInterval: 60    // 60분마다 분석
    }
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
  private apiClient: ApiClient;
  private useApiServer: boolean = false;
  
  // 트레일링 스톱을 위한 최고가 추적
  private highestPrices: Map<string, { price: number; timestamp: number }> = new Map();
  
  // VaR 계산을 위한 가격 이력
  private priceHistoryForVaR: Map<string, number[]> = new Map();
  private readonly MAX_PRICE_HISTORY = 100; // 최대 100일 가격 보관
  
  // 포트폴리오 리밸런싱
  private lastRebalanceTime: number = 0;
  private rebalanceInterval: NodeJS.Timeout | null = null;
  
  // 시뮬레이션 모드를 위한 가상 포트폴리오
  private virtualPortfolio: Map<string, {
    balance: number;
    avgBuyPrice: number;
    totalBought: number;
  }> = new Map();
  private virtualKRW: number = 10000000; // 시작 자금 1천만원
  private virtualTradeHistory: TradeHistory[] = [];
  
  // Kill Switch를 위한 시스템 잠금 상태
  private isLocked: boolean = false;

  constructor() {
    super();
    this.learningService = new LearningService();
    this.apiClient = new ApiClient();
    this.setupLearningService();
    this.setupApiClient();
    this.loadCooldownData();
  }
  
  // Kill Switch에서 사용할 시스템 잠금 메서드
  setLocked(locked: boolean): void {
    this.isLocked = locked;
    if (locked) {
      console.log('⚠️ Trading Engine locked by Kill Switch');
      this.stop();
    }
  }

  // 스마트 주문: 시장 상황에 따라 주문 타입 자동 선택
  private async determineSmartOrderType(
    market: string, 
    side: 'BUY' | 'SELL', 
    currentPrice: number
  ): Promise<{
    orderType: 'market' | 'limit';
    limitPrice?: number;
    reason: string;
  }> {
    try {
      // 호가 정보 가져오기
      const orderbook = await upbitService.getOrderbook(market);
      if (!orderbook || !orderbook.orderbook_units || orderbook.orderbook_units.length === 0) {
        return {
          orderType: 'market',
          reason: '호가 정보를 가져올 수 없어 시장가 주문 사용'
        };
      }

      const units = orderbook.orderbook_units;
      const bestBid = units[0].bid_price;
      const bestAsk = units[0].ask_price;
      const spread = (bestAsk - bestBid) / bestBid * 100; // 스프레드 비율 (%)
      
      // 호가 분석 데이터
      const analysis = orderbook.analysis;
      const imbalance = analysis?.imbalance || 0;
      const wallDetected = analysis?.wallDetected;

      // 최근 체결 내역 확인
      const trades = await upbitService.getTrades(market, 20);
      const recentTradeSummary = trades[0]?.summary;
      const dominantSide = recentTradeSummary?.dominantSide;

      // 스마트 주문 결정 로직
      if (side === 'BUY') {
        // 매수 주문
        if (spread > 0.5) {
          // 스프레드가 넓으면 지정가 주문 (중간값)
          const limitPrice = Math.floor((bestBid + bestAsk) / 2);
          return {
            orderType: 'limit',
            limitPrice,
            reason: `스프레드가 ${spread.toFixed(2)}%로 넓어 지정가 주문 사용`
          };
        }

        if (imbalance < -30 && !wallDetected?.ask) {
          // 매도 압력이 강하고 매도벽이 없으면 지정가로 낮은 가격 제시
          const limitPrice = bestBid;
          return {
            orderType: 'limit',
            limitPrice,
            reason: `매도 압력 강함(imbalance: ${imbalance.toFixed(1)}), 최고 매수가로 지정가 주문`
          };
        }

        if (dominantSide === 'BUY' && imbalance > 20) {
          // 매수 우세하면 시장가로 빠르게 진입
          return {
            orderType: 'market',
            reason: `매수 우세(${dominantSide}), 빠른 진입을 위해 시장가 주문`
          };
        }

        // 기본적으로 지정가 주문 (최고 매수가 + 1호가)
        const tickSize = this.getTickSize(bestBid);
        const limitPrice = bestBid + tickSize;
        return {
          orderType: 'limit',
          limitPrice,
          reason: '안정적인 진입을 위해 지정가 주문 사용'
        };

      } else {
        // 매도 주문
        if (spread > 0.5) {
          // 스프레드가 넓으면 지정가 주문
          const limitPrice = Math.floor((bestBid + bestAsk) / 2);
          return {
            orderType: 'limit',
            limitPrice,
            reason: `스프레드가 ${spread.toFixed(2)}%로 넓어 지정가 주문 사용`
          };
        }

        if (imbalance > 30 && !wallDetected?.bid) {
          // 매수 압력이 강하고 매수벽이 없으면 지정가로 높은 가격 제시
          const limitPrice = bestAsk;
          return {
            orderType: 'limit',
            limitPrice,
            reason: `매수 압력 강함(imbalance: ${imbalance.toFixed(1)}), 최저 매도가로 지정가 주문`
          };
        }

        if (dominantSide === 'SELL' && imbalance < -20) {
          // 매도 우세하면 시장가로 빠르게 청산
          return {
            orderType: 'market',
            reason: `매도 우세(${dominantSide}), 빠른 청산을 위해 시장가 주문`
          };
        }

        // 급등/급락 시 시장가 사용
        const priceChangeRate = (currentPrice - bestBid) / bestBid * 100;
        if (Math.abs(priceChangeRate) > 2) {
          return {
            orderType: 'market',
            reason: `가격 급변동(${priceChangeRate.toFixed(1)}%), 시장가 주문 사용`
          };
        }

        // 기본적으로 지정가 주문 (최저 매도가 - 1호가)
        const tickSize = this.getTickSize(bestAsk);
        const limitPrice = bestAsk - tickSize;
        return {
          orderType: 'limit',
          limitPrice,
          reason: '안정적인 청산을 위해 지정가 주문 사용'
        };
      }

    } catch (error) {
      console.error('Smart order determination failed:', error);
      return {
        orderType: 'market',
        reason: '스마트 주문 분석 실패, 기본 시장가 주문 사용'
      };
    }
  }

  // 호가 단위 계산
  private getTickSize(price: number): number {
    if (price >= 2000000) return 1000;
    else if (price >= 1000000) return 500;
    else if (price >= 500000) return 100;
    else if (price >= 100000) return 50;
    else if (price >= 10000) return 10;
    else if (price >= 1000) return 5;
    else if (price >= 100) return 1;
    else if (price >= 10) return 0.1;
    else if (price >= 1) return 0.01;
    else if (price >= 0.1) return 0.001;
    else return 0.0001;
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

    // 학습 상태 변경 이벤트 리스닝
    this.learningService.on('learningStateChanged', (states) => {
      console.log('Learning state changed:', states);
      this.emit('learningStateChanged', states);
    });
  }

  private setupApiClient(): void {
    // API 서버 연결 이벤트
    this.apiClient.on('connected', () => {
      console.log('Connected to API server');
      this.emit('apiConnected');
    });

    this.apiClient.on('disconnected', () => {
      console.log('Disconnected from API server');
      this.emit('apiDisconnected');
    });

    // 실시간 분석 데이터 수신
    this.apiClient.on('analysis', (data: any) => {
      this.emit('remoteAnalysis', data);
    });

    // 거래 알림 수신
    this.apiClient.on('trade', (data: any) => {
      this.emit('remoteTrade', data);
    });

    // 상태 업데이트 수신
    this.apiClient.on('status', (status: any) => {
      this.emit('remoteStatus', status);
    });
  }

  // API 서버 사용 설정
  setUseApiServer(useApiServer: boolean): void {
    this.useApiServer = useApiServer;
    if (useApiServer) {
      this.apiClient.connect();
    } else {
      this.apiClient.disconnect();
    }
  }

  // 학습 서비스 getter
  getLearningService(): LearningService {
    return this.learningService;
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
    const previousMode = this.config.enableRealTrading;
    this.config = { ...this.config, ...newConfig };
    
    // maxInvestmentPerCoin이 0이면 기본값 설정
    if (this.config.maxInvestmentPerCoin === 0) {
      this.config.maxInvestmentPerCoin = 100000; // 10만원 기본값
    }
    
    // 모드가 변경되었을 때 가상 포트폴리오 초기화
    if (previousMode !== this.config.enableRealTrading) {
      if (!this.config.enableRealTrading) {
        // 시뮬레이션 모드로 전환 시 가상 포트폴리오 초기화
        console.log('Switching to simulation mode - resetting virtual portfolio');
        this.virtualKRW = 10000000; // 1천만원으로 초기화
        this.virtualPortfolio.clear();
        this.virtualTradeHistory = [];
      } else {
        console.log('Switching to real trading mode');
      }
      
      // 모드 변경 알림
      notificationService.notifySystemStatus({
        type: 'started',
        message: this.config.enableRealTrading ? '실거래 모드 활성화' : '시뮬레이션 모드 활성화',
        details: this.config.enableRealTrading ? 
          '실제 자금으로 거래가 시작됩니다. 주의하세요!' : 
          '가상 자금으로 시뮬레이션이 시작됩니다.'
      });
    }
    
    console.log('Trading config updated:', {
      enableRealTrading: this.config.enableRealTrading,
      buyRatio: this.config.buyRatio,
      sellRatio: this.config.sellRatio,
      maxInvestmentPerCoin: this.config.maxInvestmentPerCoin,
      modeChanged: previousMode !== this.config.enableRealTrading
    });
  }

  isRunning(): boolean {
    return this._isRunning;
  }

  setLearningStates(states: any[]): void {
    // learningService에 상태 복원
    states.forEach(state => {
      this.learningService.setLearningState(state.ticker, state.isRunning);
    });
  }

  async start(): Promise<boolean> {
    if (this._isRunning) return false;

    try {
      this._isRunning = true;
      
      // 즉시 첫 분석 실행
      await this.performAnalysis();
      
      // 주기적 분석 시작 (60초마다)
      const analysisIntervalMs = 60000; // 60초 고정
      
      console.log(`분석 주기: ${analysisIntervalMs / 1000}초`);
      
      this.analysisInterval = setInterval(() => {
        this.performAnalysis();
      }, analysisIntervalMs);

      // 상태 업데이트 (5초마다)
      this.statusInterval = setInterval(() => {
        this.emitStatus();
      }, 5000);

      this.emit('tradingStarted');
      console.log('Trading engine started');
      
      // 자동매매 시작 알림
      notificationService.notifySystemStatus({
        type: 'started',
        message: '자동매매 시작',
        details: `분석 주기: ${analysisIntervalMs / 1000}초`
      });
      
      // 자동 리밸런싱 시작
      if (this.config.enableAutoRebalancing) {
        this.startAutoRebalancing();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to start trading engine:', error);
      this._isRunning = false;
      
      // 오류 알림
      notificationService.notifyError({
        title: '자동매매 시작 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      });
      
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

    // 리밸런싱 중지
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
      this.rebalanceInterval = null;
    }

    this.emit('tradingStopped');
    console.log('Trading engine stopped');
    
    // 자동매매 중지 알림
    notificationService.notifySystemStatus({
      type: 'stopped',
      message: '자동매매 중지',
      details: '자동매매가 중지되었습니다.'
    });
    
    return true;
  }

  private async performAnalysis() {
    if (!this._isRunning) return;

    try {
      console.log('Performing market analysis...');
      console.log('Active markets:', this.activeMarkets);
      console.log('Analysis configs:', this.analysisConfigs.length);
      
      if (this.activeMarkets.length === 0) {
        console.log('No active markets to analyze');
        return;
      }
      
      for (const market of this.activeMarkets) {
        try {
          // 간소화 모드 사용 여부 확인
          const useSimplifiedMode = this.config.simplifiedConfig?.enabled ?? true;
          
          if (!useSimplifiedMode) {
            // 기존 복잡한 분석 모드
            console.log(`[${market}] Using complex analysis mode`);
          } else {
            // 간소화 모드
            console.log(`[${market}] Using simplified analysis mode`);
          }
          
          // 타임프레임 설정 가져오기 (간소화 모드일 때만)
          const timeframeConfig = useSimplifiedMode ? 
            (this.config.simplifiedConfig?.timeframe || 'minute60') : 
            'minute5'; // 기존 모드는 5분봉 고정
          analysisService.setTimeframe(timeframeConfig);
          
          // 캔들 데이터 가져오기 (타임프레임 적용)
          const timeframeMap: { [key: string]: { unit: string; minutes: number } } = {
            'minute1': { unit: 'minutes', minutes: 1 },
            'minute3': { unit: 'minutes', minutes: 3 },
            'minute5': { unit: 'minutes', minutes: 5 },
            'minute10': { unit: 'minutes', minutes: 10 },
            'minute15': { unit: 'minutes', minutes: 15 },
            'minute30': { unit: 'minutes', minutes: 30 },
            'minute60': { unit: 'minutes', minutes: 60 },
            'minute240': { unit: 'minutes', minutes: 240 },
            'day': { unit: 'days', minutes: 1 },
            'week': { unit: 'weeks', minutes: 1 },
            'month': { unit: 'months', minutes: 1 }
          };
          
          const tf = timeframeMap[timeframeConfig] || timeframeMap['minute60'];
          console.log(`[${market}] Using timeframe: ${timeframeConfig} -> ${tf.minutes} minutes`);
          
          // getCandlesByTimeframe 메서드가 없으면 getCandles 사용 (기본 5분봉)
          let candles: any[];
          if (tf.minutes === 5) {
            candles = await upbitService.getCandles(market, 200);
          } else {
            // TODO: 다양한 타임프레임 지원을 위해 upbitService 개선 필요
            console.log(`[${market}] WARNING: Using default 5m timeframe instead of ${tf.minutes}m`);
            candles = await upbitService.getCandles(market, 200);
          }
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

          // 분석 설정 찾기 (market에서 코인 심볼 추출)
          const coinSymbol = market.split('-')[1];
          const analysisConfig = this.analysisConfigs.find(config => {
            // config.ticker가 KRW-BTC 형태일 수도 있고 BTC 형태일 수도 있음
            const configTicker = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
            return configTicker === coinSymbol;
          });
          
          // 학습된 가중치 가져오기 (코인별 -> 카테고리별 -> 전역)
          const learnedWeights = this.learningService.getCoinWeights(market);
          
          // 분석 설정에 학습된 가중치 병합
          const analysisConfigWithWeights = analysisConfig ? {
            ...analysisConfig,
            indicatorWeights: this.mergeWeights(
              analysisConfig.indicatorWeights,
              learnedWeights,
              analysisConfig.weightLearning
            )
          } : { indicatorWeights: learnedWeights };
          
          // 기술적 분석 수행 (추가 데이터 및 설정 포함)
          const technicalAnalysis = await analysisService.analyzeTechnicals(candles, ticker, orderbook, trades, analysisConfigWithWeights);
          
          // AI 분석 (실제 Claude API 사용)
          let aiAnalysis = null;
          if (this.aiEnabled) {
            try {
              aiAnalysis = await aiService.generateTradingAnalysis(technicalAnalysis, { 
                currentPrice, 
                market,
                buyScore: technicalAnalysis.scores?.buyScore,
                sellScore: technicalAnalysis.scores?.sellScore
              }, analysisConfig);
            } catch (error) {
              console.log(`AI 분석 실패 (${market}):`, error instanceof Error ? error.message : 'Unknown error');
            }
          }

          // 결과 저장
          const coinAnalysis: CoinAnalysis = {
            market,
            currentPrice,
            analysis: technicalAnalysis,
            aiAnalysis,
            lastUpdated: Date.now()
          };

          this.analysisResults.set(market, coinAnalysis);

          // 손절/익절 체크 (보유 포지션이 있는 경우)
          let checkCoinAccount;
          if (this.config.enableRealTrading) {
            const accounts = await upbitService.getAccounts();
            checkCoinAccount = accounts.find(acc => acc.currency === market.split('-')[1]);
          } else {
            // 시뮬레이션 모드
            const portfolio = this.virtualPortfolio.get(market);
            checkCoinAccount = portfolio ? { 
              currency: market.split('-')[1], 
              balance: portfolio.balance.toString(),
              avg_buy_price: portfolio.avgBuyPrice.toString()
            } : null;
          }
          
          if (checkCoinAccount && parseFloat(checkCoinAccount.balance) > 0) {
            const stopLossCheck = await this.checkStopLossAndTakeProfit(market, coinAnalysis, checkCoinAccount, analysisConfig);
            if (stopLossCheck.shouldSell) {
              // 손절/익절 신호를 강제로 SELL로 변경
              technicalAnalysis.signal = 'SELL';
              technicalAnalysis.confidence = 100; // 손절/익절은 100% 신뢰도
              aiAnalysis = stopLossCheck.reason;
              coinAnalysis.analysis = technicalAnalysis;
              coinAnalysis.aiAnalysis = aiAnalysis;
            }
          }

          // 거래 신호 처리 및 결과 저장 (시뮬레이션 모드에서도 동일하게 처리)
          let tradeAttempt = undefined;
          if (technicalAnalysis.signal !== 'HOLD') {
            tradeAttempt = await this.processTradeSignal(coinAnalysis);
            coinAnalysis.tradeAttempt = tradeAttempt;
          }

          // 개별 분석 결과 즉시 전송 (프론트엔드 형식으로 변환)
          const confidenceValue = isNaN(technicalAnalysis.confidence) ? 0.4 : technicalAnalysis.confidence / 100;
          const frontendAnalysis = {
            ticker: market,
            decision: technicalAnalysis.signal.toLowerCase(),
            confidence: confidenceValue,
            reason: aiAnalysis || null,  // AI 분석이 없으면 null
            timestamp: new Date().toISOString(),
            tradeAttempt: tradeAttempt,
            patterns: technicalAnalysis.patterns,  // 패턴 데이터 추가
            currentPrice: currentPrice
          };
          
          this.emit('singleAnalysisCompleted', frontendAnalysis);

          console.log(`Analysis completed for ${market}: ${technicalAnalysis.signal} (${technicalAnalysis.confidence?.toFixed(1) || '0'}%)`);
          
        } catch (error) {
          console.log(`Failed to analyze ${market}: ${(error as Error).message}`);
        }
      }

      // 분석 완료 이벤트 발송 (프론트엔드 형식으로 변환)
      const frontendAnalyses = Array.from(this.analysisResults.values()).map(analysis => {
        const confidenceValue = isNaN(analysis.analysis.confidence) ? 0.4 : analysis.analysis.confidence / 100;
        return {
          ticker: analysis.market,
          decision: analysis.analysis.signal.toLowerCase(),
          confidence: confidenceValue,
          reason: analysis.aiAnalysis || null,  // AI 분석이 없으면 null
          timestamp: new Date(analysis.lastUpdated).toISOString(),
          tradeAttempt: analysis.tradeAttempt,
          patterns: analysis.analysis.patterns,  // 패턴 데이터 추가
          currentPrice: analysis.currentPrice
        };
      });
      
      this.emit('analysisCompleted', frontendAnalyses);
      
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }

  private async processTradeSignal(analysis: CoinAnalysis): Promise<{
    attempted: boolean;
    success: boolean;
    failureReason?: string;
    details?: string;
  }> {
    const { market, analysis: technical } = analysis;
    
    // 실거래 비활성화 시에도 시뮬레이션은 계속 진행
    // (이 체크를 제거하여 시뮬레이션 모드에서도 동일한 로직 실행)
    
    try {
      // 코인별 설정 가져오기
      const ticker = market.split('-')[1];
      const analysisConfig = this.analysisConfigs.find(config => {
        // config.ticker가 KRW-BTC 형태일 수도 있고 BTC 형태일 수도 있음
        const configTicker = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
        return configTicker === ticker;
      });
      
      if (!analysisConfig) {
        console.log(`No analysis config found for ${market}, skipping trade signal`);
        return {
          attempted: true,
          success: false,
          failureReason: 'NO_CONFIG',
          details: `${market}에 대한 분석 설정이 없습니다.`
        };
      }
      
      // 실제 analysisConfig 내용 확인
      console.log(`[${market}] Found analysis config:`, analysisConfig);
      
      // UI에서 설정한 값들 사용 (전체 설정에서 기본값 가져오기)
      console.log(`[${market}] Analysis config details:`, {
        buyCooldown: analysisConfig.buyCooldown,
        sellCooldown: analysisConfig.sellCooldown,
        globalBuyingCooldown: this.config.buyingCooldown,
        globalSellingCooldown: this.config.sellingCooldown,
        buyConfidenceThreshold: analysisConfig.buyConfidenceThreshold,
        sellConfidenceThreshold: analysisConfig.sellConfidenceThreshold,
        buyRatio: analysisConfig.buying?.defaultBuyRatio,
        sellRatio: analysisConfig.selling?.defaultSellRatio,
        globalBuyRatio: this.config.buyRatio,
        globalSellRatio: this.config.sellRatio,
        finalBuyCooldown: analysisConfig.buyCooldown ?? this.config.buyingCooldown,
        finalSellCooldown: analysisConfig.sellCooldown ?? this.config.sellingCooldown
      });
      
      let coinConfig: CoinSpecificConfig = {
        minConfidenceForBuy: analysisConfig.minConfidenceForBuy ?? analysisConfig.buyConfidenceThreshold ?? 50,
        minConfidenceForSell: analysisConfig.minConfidenceForSell ?? analysisConfig.sellConfidenceThreshold ?? 50,
        buyingCooldown: analysisConfig.buyCooldown ?? analysisConfig.buyingCooldown ?? this.config.buyingCooldown,
        sellingCooldown: analysisConfig.sellCooldown ?? analysisConfig.sellingCooldown ?? this.config.sellingCooldown,
        defaultBuyRatio: analysisConfig.defaultBuyRatio ?? this.config.buyRatio,
        defaultSellRatio: analysisConfig.defaultSellRatio ?? this.config.sellRatio,
        stopLossPercent: analysisConfig.stopLossPercent ?? (analysisConfig.stopLossMode === 'signal' ? 100 : (analysisConfig.stopLoss ?? 5)),
        takeProfitPercent: analysisConfig.takeProfitPercent ?? (analysisConfig.takeProfitMode === 'signal' ? 100 : (analysisConfig.takeProfit ?? 10)),
        rsiOverbought: analysisConfig.rsiOverbought ?? 70,
        rsiOversold: analysisConfig.rsiOversold ?? 30,
        minVolume: analysisConfig.minVolume ?? 0,
        maxPositionSize: analysisConfig.maxPositionSize ?? this.config.maxInvestmentPerCoin,
        useKellyOptimization: analysisConfig.useKellyOptimization ?? false,
        volatilityAdjustment: analysisConfig.volatilityAdjustment ?? false,
        newsImpactMultiplier: analysisConfig.newsImpactMultiplier ?? 1.0,
        preferredTradingHours: analysisConfig.preferredTradingHours ?? []
      };
      
      console.log(`[${market}] CoinConfig applied:`, {
        minConfidenceForBuy: coinConfig.minConfidenceForBuy,
        minConfidenceForSell: coinConfig.minConfidenceForSell,
        buyingCooldown: coinConfig.buyingCooldown,
        sellingCooldown: coinConfig.sellingCooldown,
        defaultBuyRatio: coinConfig.defaultBuyRatio,
        defaultSellRatio: coinConfig.defaultSellRatio,
        maxPositionSize: coinConfig.maxPositionSize,
        rsiOverbought: coinConfig.rsiOverbought,
        rsiOversold: coinConfig.rsiOversold,
        stopLossPercent: coinConfig.stopLossPercent,
        takeProfitPercent: coinConfig.takeProfitPercent,
        minVolume: coinConfig.minVolume,
        useKellyOptimization: coinConfig.useKellyOptimization,
        volatilityAdjustment: coinConfig.volatilityAdjustment
      });
      
      // UI에서 설정한 preferredTradingHours가 있으면 확인
      if (coinConfig.preferredTradingHours && coinConfig.preferredTradingHours.length > 0) {
        const currentHour = new Date().getHours();
        if (!coinConfig.preferredTradingHours.includes(currentHour)) {
          console.log(`${market}: Trading not preferred at hour ${currentHour}`);
          return {
            attempted: true,
            success: false,
            failureReason: 'TRADING_HOURS',
            details: `현재 시간(${currentHour}시)은 거래 시간이 아닙니다. 설정된 거래 시간: ${coinConfig.preferredTradingHours.join(', ')}시`
          };
        }
      }
      
      // 간소화 모드 사용 여부 확인
      const useSimplifiedMode = this.config.simplifiedConfig?.enabled ?? true;
      
      // 최소 거래량 체크 (간소화 모드일 때만 비활성화)
      if (!useSimplifiedMode) {
        // 기존 모드: 거래량 체크
        const tickers = await upbitService.getTickers([market]);
        const ticker = tickers[0];
        if (ticker) {
          const volume24h = ticker.acc_trade_price_24h; // 24시간 누적 거래대금(KRW)
          if (coinConfig.minVolume && volume24h < coinConfig.minVolume) {
            console.log(`${market}: 24h volume ${volume24h.toFixed(0)} is below minimum ${coinConfig.minVolume}`);
            return {
              attempted: true,
              success: false,
              failureReason: 'VOLUME_TOO_LOW',
              details: `24시간 거래량(${volume24h.toLocaleString()} KRW)이 최소 거래량(${coinConfig.minVolume.toLocaleString()} KRW)보다 적습니다.`
            };
          }
        }
      } else {
        console.log(`[${market}] 거래량 체크 비활성화 (간소화 모드)`);
      }
      
      // 동적 파라미터 계산
      const dynamicParams = this.calculateDynamicParameters(market, technical);
      
      // 최소 신뢰도 체크 (간소화 모드일 때만 비활성화)
      if (!useSimplifiedMode) {
        // 기존 모드: 신뢰도 체크
        const minConfidence = technical.signal === 'BUY' ? 
          coinConfig.minConfidenceForBuy : 
          coinConfig.minConfidenceForSell;
        
        if (technical.confidence < minConfidence) {
          console.log(`${market}: Confidence ${technical.confidence.toFixed(1)}% is below minimum ${minConfidence}%`);
          return {
            attempted: true,
            success: false,
            failureReason: 'LOW_CONFIDENCE',
            details: `신뢰도(${technical.confidence.toFixed(1)}%)가 최소 임계값(${minConfidence}%)보다 낮습니다.`
          };
        }
      } else {
        console.log(`[${market}] 신뢰도: ${technical.confidence.toFixed(1)}% (신뢰도 체크 비활성화 - 간소화 모드)`);
      }
      
      // 동적 파라미터는 계속 계산 (로깅용)
      console.log(`[${market}] 동적 파라미터:`, {
        adjustedRSIOverbought: dynamicParams.adjustedRSIOverbought,
        adjustedRSIOversold: dynamicParams.adjustedRSIOversold,
        currentVolatility: dynamicParams.currentVolatility
      });

      // 계좌 정보 확인 (시뮬레이션 모드에서는 가상 계좌 사용)
      let krwAccount, coinAccount;
      
      if (this.config.enableRealTrading) {
        const accounts = await upbitService.getAccounts();
        krwAccount = accounts.find(acc => acc.currency === 'KRW');
        coinAccount = accounts.find(acc => acc.currency === market.split('-')[1]);
      } else {
        // 시뮬레이션 모드: 가상 계좌 정보
        krwAccount = { currency: 'KRW', balance: this.virtualKRW.toString() };
        const portfolio = this.virtualPortfolio.get(market);
        coinAccount = portfolio ? { 
          currency: market.split('-')[1], 
          balance: portfolio.balance.toString(),
          avg_buy_price: portfolio.avgBuyPrice.toString()
        } : null;
      }

      if (technical.signal === 'BUY') {
        // 높은 신뢰도에서 쿨다운 무시 옵션 체크
        const skipCooldown = analysisConfig?.skipCooldownOnHighConfidence && 
                           technical.confidence >= (analysisConfig?.skipCooldownThreshold || 85);
        
        console.log(`[${market}] 쿨타임 체크 - buyingCooldown: ${coinConfig.buyingCooldown}분, skipCooldown: ${skipCooldown}`);
        if (!skipCooldown && this.isInCooldownWithConfig(market, 'buy', coinConfig.buyingCooldown)) {
          console.log(`[${market}] 매수 쿨타임 중 (설정: ${coinConfig.buyingCooldown}분)`);
          const cooldownInfo = this.getCooldownInfo(market);
          return {
            attempted: true,
            success: false,
            failureReason: 'COOLDOWN_BUY',
            details: `매수 쿨타임 중입니다. 남은 시간: ${cooldownInfo.buyRemaining}분`
          };
        } else if (skipCooldown) {
          console.log(`[${market}] 높은 신뢰도(${technical.confidence.toFixed(1)}%)로 쿨타임 무시`);
        }

        // 매수 로직
        const maxPositionSize = coinConfig.maxPositionSize > 0 ? coinConfig.maxPositionSize : this.config.maxInvestmentPerCoin;
        const maxInvestment = Math.min(this.config.maxInvestmentPerCoin, maxPositionSize);
        if (krwAccount && parseFloat(krwAccount.balance) > 0) {
          // Kelly Criterion 계산
          let adjustedBuyRatio = coinConfig.defaultBuyRatio;
          
          // VaR 기반 리스크 조정
          const varResult = await this.calculatePortfolioVaR();
          if (varResult && varResult.percentageVaR95 > 10) {
            console.log(`[${market}] VaR 위험 조정: ${varResult.percentageVaR95.toFixed(2)}%`);
            const riskAdjustment = 10 / varResult.percentageVaR95; // VaR가 10%를 초과하면 비례적으로 감소
            adjustedBuyRatio *= riskAdjustment;
          }
          
          if (coinConfig.useKellyOptimization && this.config.useKellyCriterion) {
            const metrics = this.performanceMetrics.get(market);
            if (metrics && (metrics.wins + metrics.losses) > 5) { // 최소 5회 거래 후부터 Kelly 적용
              const winRate = metrics.wins / (metrics.wins + metrics.losses);
              const avgWin = metrics.wins > 0 ? metrics.totalProfit / metrics.wins : 0;
              const avgLoss = metrics.losses > 0 ? Math.abs(metrics.totalProfit / metrics.losses) : 1;
              
              const kellyFraction = this.calculateKellyFraction(winRate, avgWin, avgLoss, market);
              if (kellyFraction <= 0) {
                console.log(`Kelly Criterion suggests 0% for ${market}`);
                return {
                  attempted: true,
                  success: false,
                  failureReason: 'KELLY_FRACTION_ZERO',
                  details: `Kelly Criterion이 0%를 제안했습니다. 승률: ${(winRate * 100).toFixed(1)}%`
                };
              }
              adjustedBuyRatio = kellyFraction;
            }
          } else {
            // 기존 신뢰도 기반 매수 비율 조정 (더 보수적으로)
            if (technical.confidence >= 95) {
              adjustedBuyRatio = Math.min(0.3, coinConfig.defaultBuyRatio * 1.5); // 최대 30%
            } else if (technical.confidence >= 90) {
              adjustedBuyRatio = Math.min(0.2, coinConfig.defaultBuyRatio * 1.2); // 최대 20%
            } else if (technical.confidence >= 85) {
              adjustedBuyRatio = coinConfig.defaultBuyRatio; // 기본값 유지
            } else {
              adjustedBuyRatio = coinConfig.defaultBuyRatio * 0.5; // 50%로 축소
            }
          }
          
          // 변동성에 따른 추가 조정 (UI 설정에 따라)
          if (coinConfig.volatilityAdjustment) {
            if (dynamicParams.currentVolatility > 0.05) {
              console.log(`${market} volatility too high: ${(dynamicParams.currentVolatility * 100).toFixed(2)}%`);
              return {
                attempted: true,
                success: false,
                failureReason: 'VOLATILITY_TOO_HIGH',
                details: `변동성이 너무 높습니다: ${(dynamicParams.currentVolatility * 100).toFixed(2)}%`
              };
            } else if (dynamicParams.currentVolatility > 0.03) {
              adjustedBuyRatio *= 0.5; // 높은 변동성에서는 50% 축소
            } else if (dynamicParams.currentVolatility > 0.02) {
              adjustedBuyRatio *= 0.7; // 중간 변동성에서는 30% 축소
            }
          }
          
          // 매수할 금액 계산 (코인별 최대 포지션 크기 고려)
          const buyAmount = maxInvestment * adjustedBuyRatio;
          
          // 최소 주문 금액 확인 (기본 5,000원, UI 설정 사용 가능)
          const minOrderAmount = analysisConfig?.minOrderAmount ?? 5000;
          if (buyAmount < minOrderAmount) {
            console.log(`Buy amount ₩${buyAmount.toLocaleString()} is below minimum order amount ₩${minOrderAmount.toLocaleString()}`);
            console.log(`Max investment: ₩${maxInvestment.toLocaleString()}, Buy ratio: ${adjustedBuyRatio}`);
            return {
              attempted: true,
              success: false,
              failureReason: 'MIN_ORDER_AMOUNT',
              details: `주문 금액 ₩${buyAmount.toLocaleString()}이 최소 금액 ₩${minOrderAmount.toLocaleString()}보다 적습니다. 투자 비율: ${(adjustedBuyRatio * 100).toFixed(1)}%`
            };
          }
          
          const buyAmountStr = buyAmount.toFixed(0); // 원 단위로 반올림
          
          console.log(`Buy signal for ${market} - confidence: ${technical.confidence.toFixed(1)}%`);
          console.log(`Base ratio: ${(this.config.buyRatio * 100).toFixed(1)}%, Adjusted ratio: ${(adjustedBuyRatio * 100).toFixed(1)}%`);
          console.log(`Max investment: ₩${maxInvestment.toLocaleString()}, Buy amount: ₩${buyAmount.toLocaleString()}`);
          
          // 스마트 주문 타입 결정
          const smartOrder = await this.determineSmartOrderType(market, 'BUY', analysis.currentPrice);
          console.log(`Smart order: ${smartOrder.orderType} - ${smartOrder.reason}`);
          
          // 실제 거래 실행 (테스트 모드에서는 시뮬레이션)
          console.log(`Real trading enabled: ${this.config.enableRealTrading}`);
          if (this.config.enableRealTrading) {
            if (smartOrder.orderType === 'limit' && smartOrder.limitPrice) {
              // 지정가 매수: 가격과 수량을 모두 지정
              const volume = (buyAmount / smartOrder.limitPrice).toFixed(8);
              console.log(`Executing REAL LIMIT BUY order for ${market}: ${volume} @ ₩${smartOrder.limitPrice.toLocaleString()}`);
              await upbitService.buyOrder(market, smartOrder.limitPrice.toString(), volume);
            } else {
              // 시장가 매수: KRW 금액만 지정
              console.log(`Executing REAL MARKET BUY order for ${market}: ₩${buyAmount.toLocaleString()}`);
              await upbitService.buyOrder(market, buyAmountStr);
            }
          } else {
            console.log(`[시뮬레이션] ${smartOrder.orderType.toUpperCase()} BUY order for ${market}: ₩${buyAmount.toLocaleString()}`);
            // 시뮬레이션 매수 처리
            this.simulateBuyOrder(market, buyAmount, smartOrder.limitPrice || analysis.currentPrice, technical.confidence);
          }
          
          // 거래 시간 기록
          this.recordTradeTime(market, 'buy');
          
          // 트레일링 스톱을 위한 최고가 초기화
          this.highestPrices.set(market, { 
            price: smartOrder.limitPrice || analysis.currentPrice, 
            timestamp: Date.now() 
          });
          
          // 거래 기록 저장 (내부 기록)
          const trade: TradeHistory = {
            market,
            type: 'BUY' as const,
            price: analysis.currentPrice,
            amount: parseFloat(buyAmountStr),
            confidence: technical.confidence,
            timestamp: Date.now()
          };
          this.recordTrade(trade);
          
          // trade-history-service에 거래 기록 저장
          if (this.config.enableRealTrading) {
            tradeHistoryService.addTrade({
              market,
              timestamp: Date.now(),
              type: 'BUY',
              price: smartOrder.limitPrice || analysis.currentPrice,
              volume: parseFloat(buyAmountStr) / analysis.currentPrice, // 코인 수량
              totalAmount: parseFloat(buyAmountStr), // KRW 금액
              fee: parseFloat(buyAmountStr) * 0.0005, // 0.05% 수수료
              reason: `신뢰도: ${(technical.confidence * 100).toFixed(1)}%`,
              indicators: {
                rsi: technical.rsi,
                macd: technical.macd.histogram,
                bollingerBands: technical.bollinger,
                volume: technical.volumeRatio
              },
              aiAnalysis: (technical as any).aiAnalysis
            });
          }
          
          // 알림 발송
          notificationService.notifyTradeExecuted({
            market,
            type: 'BUY',
            price: analysis.currentPrice,
            amount: parseFloat(buyAmountStr)
          });
          
          // 학습 시스템에 매수 진입점 기록 (비동기로 실행)
          void this.recordEntryForLearning(market, technical, analysis).catch((error: Error) => {
            console.error(`[학습] ${market} 진입점 기록 실패:`, error);
          });
          
          // 매수 시에도 거래 횟수 증가를 위해 임시 기록 (매도 시점에 승/패 결정)
          // performanceMetrics는 wins, losses, totalProfit만 추적
          // 전체 거래 횟수는 wins + losses로 계산
          
          this.emit('tradeExecuted', {
            type: 'BUY',
            market,
            price: analysis.currentPrice,
            amount: parseFloat(buyAmountStr),
            confidence: technical.confidence,
            adjustedRatio: adjustedBuyRatio,
            dynamicParams
          });
          
          return {
            attempted: true,
            success: true,
            details: `매수 주문 성공: ₩${buyAmount.toLocaleString()}`
          };
        } else {
          // KRW 잔액 부족
          return {
            attempted: true,
            success: false,
            failureReason: 'INSUFFICIENT_BALANCE',
            details: `KRW 잔액이 부족합니다.`
          };
        }
      } else if (technical.signal === 'SELL') {
        // 높은 신뢰도에서 쿨다운 무시 옵션 체크
        const skipCooldown = analysisConfig?.skipCooldownOnHighConfidence && 
                           technical.confidence >= (analysisConfig?.skipCooldownThreshold || 85);
        
        console.log(`[${market}] 매도 쿨타임 체크 - sellingCooldown: ${coinConfig.sellingCooldown}분, skipCooldown: ${skipCooldown}`);
        if (!skipCooldown && this.isInCooldownWithConfig(market, 'sell', coinConfig.sellingCooldown)) {
          console.log(`[${market}] 매도 쿨타임 중 (설정: ${coinConfig.sellingCooldown}분)`);
          const cooldownInfo = this.getCooldownInfo(market);
          return {
            attempted: true,
            success: false,
            failureReason: 'COOLDOWN_SELL',
            details: `매도 쿨타임 중입니다. 남은 시간: ${cooldownInfo.sellRemaining}분`
          };
        } else if (skipCooldown) {
          console.log(`[${market}] 높은 신뢰도(${technical.confidence.toFixed(1)}%)로 쿨타임 무시`);
        }

        // 매도 로직
        if (coinAccount && parseFloat(coinAccount.balance) > 0) {
          // 코인별 기본 매도 비율 사용
          let adjustedSellRatio = coinConfig.defaultSellRatio;
          
          // 신뢰도가 90% 이상이면 더 많이 매도 (최대 100%)
          if (technical.confidence >= 0.9) {
            adjustedSellRatio = Math.min(1.0, coinConfig.defaultSellRatio * 1.5);
          }
          // 신뢰도가 80% 이상이면 조금 더 매도
          else if (technical.confidence >= 0.8) {
            adjustedSellRatio = Math.min(1.0, coinConfig.defaultSellRatio * 1.2);
          }
          // 신뢰도가 낮으면 (60-70%) 더 적게 매도
          else if (technical.confidence < 0.7) {
            adjustedSellRatio = coinConfig.defaultSellRatio * 0.7;
          }
          
          // 매도할 수량 계산
          const totalBalance = parseFloat(coinAccount.balance);
          const sellAmount = totalBalance * adjustedSellRatio;
          const sellAmountStr = sellAmount.toFixed(8); // 소수점 8자리까지
          
          // 매도할 금액 계산 (현재 가격 * 수량)
          const sellValue = analysis.currentPrice * sellAmount;
          
          // 최소 주문 금액 확인 (기본 5,000원, UI 설정 사용 가능)
          const minOrderAmount = analysisConfig?.minOrderAmount ?? 5000;
          if (sellValue < minOrderAmount) {
            console.log(`[${market}] 매도 금액 ₩${sellValue.toLocaleString()}이 최소 주문 금액 ₩${minOrderAmount.toLocaleString()} 미만`);
            console.log(`  - 코인 수량: ${sellAmount} ${market.split('-')[1]}`);
            console.log(`  - 현재 가격: ₩${analysis.currentPrice.toLocaleString()}`);
            console.log(`  - 매도 비율: ${(adjustedSellRatio * 100).toFixed(1)}%`);
            return {
              attempted: true,
              success: false,
              failureReason: 'MIN_ORDER_AMOUNT',
              details: `매도 금액 ₩${sellValue.toLocaleString()}이 최소 금액 ₩${minOrderAmount.toLocaleString()}보다 적습니다.`
            };
          }
          
          console.log(`Sell signal for ${market} - confidence: ${technical.confidence.toFixed(1)}%`);
          console.log(`Base ratio: ${(this.config.sellRatio * 100).toFixed(1)}%, Adjusted ratio: ${(adjustedSellRatio * 100).toFixed(1)}%`);
          console.log(`Total balance: ${totalBalance}, Sell amount: ${sellAmount}, Value: ₩${sellValue.toLocaleString()}`);
          
          // 스마트 주문 타입 결정
          const smartOrder = await this.determineSmartOrderType(market, 'SELL', analysis.currentPrice);
          console.log(`Smart order: ${smartOrder.orderType} - ${smartOrder.reason}`);
          
          // 실제 거래 실행 (테스트 모드에서는 시뮬레이션)
          console.log(`Real trading enabled: ${this.config.enableRealTrading}`);
          if (this.config.enableRealTrading) {
            if (smartOrder.orderType === 'limit' && smartOrder.limitPrice) {
              // 지정가 매도: 가격과 수량을 모두 지정
              console.log(`Executing REAL LIMIT SELL order for ${market}: ${sellAmountStr} @ ₩${smartOrder.limitPrice.toLocaleString()}`);
              await upbitService.sellOrder(market, sellAmountStr, smartOrder.limitPrice.toString());
            } else {
              // 시장가 매도: 수량만 지정
              console.log(`Executing REAL MARKET SELL order for ${market}: ${sellAmount} ${market.split('-')[1]} (₩${sellValue.toLocaleString()})`);
              await upbitService.sellOrder(market, sellAmountStr);
            }
          } else {
            console.log(`[시뮬레이션] ${smartOrder.orderType.toUpperCase()} SELL order for ${market}: ${sellAmount} ${market.split('-')[1]} (₩${sellValue.toLocaleString()})`);
            // 시뮬레이션 매도 처리
            this.simulateSellOrder(market, sellAmount, smartOrder.limitPrice || analysis.currentPrice, technical.confidence);
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
          
          // trade-history-service에 거래 기록 저장
          if (this.config.enableRealTrading) {
            tradeHistoryService.addTrade({
              market,
              timestamp: Date.now(),
              type: 'SELL',
              price: smartOrder.limitPrice || analysis.currentPrice,
              volume: sellAmount, // 코인 수량
              totalAmount: sellValue, // KRW 금액
              fee: sellValue * 0.0005, // 0.05% 수수료
              reason: `신뢰도: ${(technical.confidence * 100).toFixed(1)}%`,
              indicators: {
                rsi: technical.rsi,
                macd: technical.macd.histogram,
                bollingerBands: technical.bollinger,
                volume: technical.volumeRatio
              },
              aiAnalysis: (technical as any).aiAnalysis
            });
          }
          
          // 알림 발송
          notificationService.notifyTradeExecuted({
            market,
            type: 'SELL',
            price: analysis.currentPrice,
            amount: sellValue,
            profit: sellValue * (profit / 100),
            profitRate: profit
          });
          
          // 학습 시스템에 거래 결과 기록
          this.recordTradeResultForLearning(market, avgBuyPrice, analysis.currentPrice, profit);
          
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
          
          return {
            attempted: true,
            success: true,
            details: `매도 주문 성공: ${sellAmount.toFixed(4)} ${market.split('-')[1]} (₩${sellValue.toLocaleString()})`
          };
        } else {
          // 보유 코인 없음
          return {
            attempted: false,
            success: false,
            details: `${market.split('-')[1]} 보유량이 없습니다.`
          };
        }
      } else {
        // HOLD 신호
        return {
          attempted: false,
          success: false,
          details: 'HOLD 신호 - 거래 시도하지 않음'
        };
      }
    } catch (error) {
      console.error(`Failed to process trade signal for ${market}:`, error);
      return {
        attempted: true,
        success: false,
        failureReason: 'API_ERROR',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      };
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
    console.log(`[${market}] ${action === 'buy' ? '매수' : '매도'} 시간 기록: ${new Date().toLocaleString('ko-KR')}`);
    
    // 쿨타임 데이터 저장
    this.saveCooldownData();
  }
  
  // 쿨타임 데이터 파일 경로
  private getCooldownPath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'data', 'cooldown.json');
  }
  
  // 쿨타임 데이터 저장
  private saveCooldownData(): void {
    try {
      const cooldownPath = this.getCooldownPath();
      const dataDir = path.dirname(cooldownPath);
      
      // 디렉토리가 없으면 생성
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Map을 일반 객체로 변환하여 저장
      const cooldownData: Record<string, { buy?: number; sell?: number }> = {};
      this.lastTradeTime.forEach((value, key) => {
        cooldownData[key] = value;
      });
      
      fs.writeFileSync(cooldownPath, JSON.stringify(cooldownData, null, 2));
      console.log('쿨타임 데이터 저장 완료');
    } catch (error) {
      console.error('쿨타임 데이터 저장 실패:', error);
    }
  }
  
  // 쿨타임 데이터 로드
  private loadCooldownData(): void {
    try {
      const cooldownPath = this.getCooldownPath();
      
      if (!fs.existsSync(cooldownPath)) {
        console.log('저장된 쿨타임 데이터가 없습니다.');
        return;
      }
      
      const cooldownData = JSON.parse(fs.readFileSync(cooldownPath, 'utf-8'));
      
      // 객체를 Map으로 변환
      Object.entries(cooldownData).forEach(([market, times]) => {
        this.lastTradeTime.set(market, times as { buy?: number; sell?: number });
      });
      
      console.log('쿨타임 데이터 로드 완료:', this.lastTradeTime.size, '개 코인');
      
      // 현재 쿨타임 상태 출력
      this.lastTradeTime.forEach((times, market) => {
        if (times.buy) {
          const buyElapsed = Math.floor((Date.now() - times.buy) / 60000);
          console.log(`[${market}] 마지막 매수 후 ${buyElapsed}분 경과`);
        }
        if (times.sell) {
          const sellElapsed = Math.floor((Date.now() - times.sell) / 60000);
          console.log(`[${market}] 마지막 매도 후 ${sellElapsed}분 경과`);
        }
      });
    } catch (error) {
      console.error('쿨타임 데이터 로드 실패:', error);
    }
  }

  // 동적 파라미터 조정 메서드들
  private calculateDynamicParameters(market: string, analysis: TechnicalAnalysis): DynamicParameters {
    const baseConfig = this.config;
    const history = this.getMarketTradeHistory(market);
    const performance = this.calculateRecentPerformance(market, history);
    
    // 코인별 설정 가져오기
    const coinSymbol = market.split('-')[1];
    const coinConfig = this.analysisConfigs.find(config => {
      // config.ticker가 KRW-BTC 형태일 수도 있고 BTC 형태일 수도 있음
      const configTicker = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
      return configTicker === coinSymbol;
    });
    
    // 현재 변동성 계산 (ATR 기반)
    const currentVolatility = analysis.atr ? (analysis.atr / analysis.bollinger.middle) : 0.02;
    
    // RSI 임계값 동적 조정
    let adjustedRSIOverbought = coinConfig?.rsiOverbought ?? baseConfig.rsiOverbought;
    let adjustedRSIOversold = coinConfig?.rsiOversold ?? baseConfig.rsiOversold;
    
    // 코인별 volatilityAdjustment 설정 확인
    const useVolatilityAdjustment = coinConfig?.volatilityAdjustment ?? false;
    
    if (useVolatilityAdjustment || baseConfig.dynamicRSI) {
      // 고변동성 시장: RSI 임계값을 더 극단적으로 (더 조심스럽게)
      if (currentVolatility > 0.03) {
        adjustedRSIOverbought = Math.min(90, adjustedRSIOverbought + 10); // +10
        adjustedRSIOversold = Math.max(10, adjustedRSIOversold - 10); // -10
      }
      // 저변동성 시장: RSI 임계값을 보통 수준으로
      else if (currentVolatility < 0.01) {
        // 원래 설정값 유지
      }
      // 중간 변동성: 약간 조정
      else {
        adjustedRSIOverbought = Math.min(85, adjustedRSIOverbought + 5); // +5
        adjustedRSIOversold = Math.max(15, adjustedRSIOversold - 5); // -5
      }
    }
    
    // 신뢰도 임계값 동적 조정
    let adjustedMinConfidence = coinConfig?.minConfidenceForBuy || baseConfig.minConfidenceForTrade;
    
    if (useVolatilityAdjustment || baseConfig.dynamicConfidence) {
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
        adjustedMinConfidence = Math.min(90, adjustedMinConfidence + 10);
      }
      
      // 변동성에 따른 추가 조정
      if (currentVolatility > 0.03) {
        // 고변동성: 신뢰도 임계값 추가 상향
        adjustedMinConfidence = Math.min(95, adjustedMinConfidence + 5);
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
    
    // 변동성 조정이 적용된 경우 로그
    if (useVolatilityAdjustment) {
      console.log(`[${market}] 변동성 자동 조정 적용:`);
      console.log(`  - 현재 변동성: ${(currentVolatility * 100).toFixed(2)}%`);
      console.log(`  - RSI: ${coinConfig?.rsiOverbought}/${coinConfig?.rsiOversold} → ${adjustedRSIOverbought}/${adjustedRSIOversold}`);
      console.log(`  - 신뢰도: ${coinConfig?.minConfidenceForBuy}% → ${adjustedMinConfidence}%`);
    }
    
    this.dynamicParameters.set(market, params);
    return params;
  }
  
  // Kelly Criterion 계산 (새로운 서비스 사용)
  private calculateKellyFraction(winRate: number, avgWin: number, avgLoss: number, market: string): number {
    if (avgLoss === 0 || winRate === 0) return 0;
    
    const metrics = this.performanceMetrics.get(market);
    if (!metrics || (metrics.wins + metrics.losses) < 10) {
      // 거래 데이터가 부족한 경우 보수적인 기본값
      return this.config.buyRatio * 0.5;
    }
    
    // 성과 메트릭 준비
    const performanceMetrics = {
      winRate,
      avgWin: Math.abs(avgWin),
      avgLoss: Math.abs(avgLoss),
      winLossRatio: Math.abs(avgWin / avgLoss),
      totalTrades: metrics.wins + metrics.losses,
      profitFactor: avgLoss !== 0 ? (winRate * avgWin) / ((1 - winRate) * Math.abs(avgLoss)) : 0,
      sharpeRatio: this.calculateSharpeRatio(market),
      maxDrawdown: this.calculateMaxDrawdown(market)
    };
    
    // Kelly 계산
    const kellyResult = kellyService.calculateKelly(performanceMetrics);
    
    // 시장 상황 고려한 동적 Kelly
    const marketConditions = {
      volatility: this.getCurrentVolatility(market),
      trend: this.determineMarketTrend(market),
      recentDrawdown: this.getRecentDrawdown(market)
    };
    
    const dynamicKelly = kellyService.calculateDynamicKelly(performanceMetrics, marketConditions);
    
    console.log(`Kelly Criterion for ${market}:`);
    console.log(`  - Base Kelly: ${(kellyResult.kellyFraction * 100).toFixed(1)}%`);
    console.log(`  - Recommended: ${(dynamicKelly.recommendedFraction * 100).toFixed(1)}%`);
    console.log(`  - Confidence: ${(dynamicKelly.confidence * 100).toFixed(1)}%`);
    
    return dynamicKelly.recommendedFraction;
  }
  
  // 샤프 비율 계산
  private calculateSharpeRatio(market: string): number {
    const trades = this.getMarketTradeHistory(market).filter(t => t.profit !== undefined);
    if (trades.length < 5) return 0;
    
    const returns = trades.map(t => t.profit || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;
  }
  
  // 최대 손실 계산
  private calculateMaxDrawdown(market: string): number {
    const trades = this.getMarketTradeHistory(market).filter(t => t.profit !== undefined);
    if (trades.length < 2) return 0;
    
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    
    for (const trade of trades) {
      cumulative += trade.profit || 0;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak > 0 ? (peak - cumulative) / peak : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
  
  // 현재 변동성 가져오기
  private getCurrentVolatility(market: string): number {
    const analysis = this.analysisResults.get(market);
    if (!analysis || !analysis.analysis.atr) return 0.5;
    
    const volatility = analysis.analysis.atr / analysis.currentPrice;
    return Math.min(1, volatility * 10); // 0-1 범위로 정규화
  }
  
  // 시장 추세 판단
  private determineMarketTrend(market: string): 'bull' | 'bear' | 'sideways' {
    const analysis = this.analysisResults.get(market);
    if (!analysis) return 'sideways';
    
    return this.determineMarketCondition(analysis.analysis);
  }
  
  // 최근 손실률 계산
  private getRecentDrawdown(market: string): number {
    const recentTrades = this.getMarketTradeHistory(market).slice(-10);
    if (recentTrades.length === 0) return 0;
    
    const totalReturn = recentTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    return Math.max(0, -totalReturn / 100); // 음수면 손실
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
  
  // analysisConfigs 속성 추가 (UI에서 설정한 코인별 거래 설정)
  private analysisConfigs: any[] = [];
  
  // 코인별 거래 설정 업데이트 메서드
  setAnalysisConfigs(configs: any[]): void {
    this.analysisConfigs = configs;
    // 활성 시장 업데이트 - 이미 KRW-가 포함되어 있는지 확인
    this.activeMarkets = configs.map(config => {
      const ticker = config.ticker;
      // 이미 KRW-로 시작하면 그대로 사용, 아니면 KRW- 추가
      return ticker.startsWith('KRW-') ? ticker : `KRW-${ticker}`;
    });
    console.log('Analysis configs updated:', configs.length, 'coins');
    console.log('Active markets:', this.activeMarkets);
    
    // 디버깅: 첫 번째 설정의 쿨다운 확인
    if (configs.length > 0) {
      console.log('First config cooldowns:', {
        ticker: configs[0].ticker,
        buyCooldown: configs[0].buyCooldown,
        sellCooldown: configs[0].sellCooldown
      });
    }
  }
  
  // 시장 상황 판단
  getAnalysisConfigs(): any[] {
    return this.analysisConfigs;
  }
  
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
    console.log(`[${market}] 쿨타임 체크 상세 - action: ${action}, cooldownMinutes: ${cooldownMinutes}, lastTrade:`, lastTrade);
    
    if (!lastTrade) {
      console.log(`[${market}] 이전 거래 기록 없음 - 쿨타임 없음`);
      return false;
    }

    const lastTime = action === 'buy' ? lastTrade.buy : lastTrade.sell;
    if (!lastTime) {
      console.log(`[${market}] ${action} 거래 기록 없음 - 쿨타임 없음`);
      return false;
    }

    const cooldownMs = cooldownMinutes * 60 * 1000;
    const now = Date.now();
    const timeSinceLast = now - lastTime;

    const isInCooldown = timeSinceLast < cooldownMs;
    
    const lastTradeDate = new Date(lastTime).toLocaleString('ko-KR');
    const remainingMinutes = Math.ceil((cooldownMs - timeSinceLast) / (60 * 1000));
    
    if (isInCooldown) {
      console.log(`[${market}] ${action} 쿨타임 활성 - 마지막 거래: ${lastTradeDate}, 남은 시간: ${remainingMinutes}분 (설정: ${cooldownMinutes}분)`);
    } else {
      console.log(`[${market}] ${action} 쿨타임 완료 - 마지막 거래: ${lastTradeDate}, 경과 시간: ${Math.floor(timeSinceLast / 60000)}분`);
    }

    return isInCooldown;
  }

  // 학습 시스템 관련 메서드들 (기존 메서드 제거 - 아래에 새로운 버전 있음)
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
      volatility: this.determineVolatilityLevel(technical.atr || 0, technical.bollinger.middle),
      volume: this.determineVolumeLevel(technical.volumeRatio)
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

  // 거래 이력 조회
  public getTradeHistory(market?: string, days?: number): any[] {
    const cutoffDate = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
    
    return this.tradeHistory
      .filter(trade => 
        (!market || trade.market === market) && 
        trade.timestamp > cutoffDate
      )
      .map(trade => ({
        market: trade.market,
        timestamp: trade.timestamp,
        action: trade.type,
        price: trade.price,
        amount: trade.amount,
        profitRate: trade.profit || 0,
        winRate: this.calculateWinRate(trade.market, trade.timestamp)
      }));
  }

  private calculateWinRate(market: string, upToTimestamp: number): number {
    const marketTrades = this.tradeHistory.filter(t => 
      t.market === market && 
      t.timestamp <= upToTimestamp &&
      t.profit !== undefined
    );
    
    if (marketTrades.length === 0) return 0;
    
    const wins = marketTrades.filter(t => t.profit && t.profit > 0).length;
    return (wins / marketTrades.length) * 100;
  }

  // 특정 마켓의 Kelly Criterion 계산 (외부 호출용)
  public calculateKellyForMarket(market: string): number {
    const metrics = this.performanceMetrics.get(market);
    if (!metrics || (metrics.wins + metrics.losses) < 10) {
      return 0;
    }
    
    const winRate = metrics.wins / (metrics.wins + metrics.losses);
    const avgWin = metrics.wins > 0 ? Math.abs(metrics.totalProfit / metrics.wins) : 0;
    const avgLoss = metrics.losses > 0 ? Math.abs(metrics.totalProfit / metrics.losses) : 1;
    
    return this.calculateKellyFraction(winRate, avgWin, avgLoss, market);
  }

  // 쿨타임 정보 가져오기
  public getCooldownInfo(market: string): { 
    buyRemaining: number; 
    sellRemaining: number;
    buyTotal: number;
    sellTotal: number;
  } {
    const lastTrade = this.lastTradeTime.get(market);
    const now = Date.now();
    
    // 코인별 설정 가져오기
    const ticker = market.split('-')[1];
    const analysisConfig = this.analysisConfigs.find(config => {
      const configTicker = config.ticker.startsWith('KRW-') ? config.ticker.split('-')[1] : config.ticker;
      return configTicker === ticker;
    });
    
    const buyingCooldown = analysisConfig?.buyCooldown ?? this.config.buyingCooldown ?? 30;
    const sellingCooldown = analysisConfig?.sellCooldown ?? this.config.sellingCooldown ?? 20;
    
    let buyRemaining = 0;
    let sellRemaining = 0;
    
    if (lastTrade) {
      if (lastTrade.buy) {
        const buyElapsed = now - lastTrade.buy;
        const buyCooldownMs = buyingCooldown * 60 * 1000;
        buyRemaining = Math.max(0, Math.ceil((buyCooldownMs - buyElapsed) / (60 * 1000)));
      }
      
      if (lastTrade.sell) {
        const sellElapsed = now - lastTrade.sell;
        const sellCooldownMs = sellingCooldown * 60 * 1000;
        sellRemaining = Math.max(0, Math.ceil((sellCooldownMs - sellElapsed) / (60 * 1000)));
      }
    }
    
    return { 
      buyRemaining, 
      sellRemaining,
      buyTotal: buyingCooldown,
      sellTotal: sellingCooldown
    };
  }

  // 종료 시 학습 데이터 저장
  public destroy(): void {
    if (this.learningService) {
      this.learningService.destroy();
    }
  }

  // 가중치 병합: 사용자 설정 × 학습 조정값
  private mergeWeights(
    userWeights: any,
    learnedWeights: any,
    learningConfig?: any
  ): any {
    // 학습이 비활성화되면 사용자 가중치만 사용
    if (!learningConfig?.enabled || !learnedWeights) {
      return userWeights || {};
    }

    // 기본 가중치
    const defaultWeights: Record<string, number> = {
      rsi: 1.0,
      macd: 1.0,
      bollinger: 1.0,
      stochastic: 0.8,
      volume: 1.0,
      atr: 0.8,
      obv: 0.7,
      adx: 0.8,
      volatility: 1.0,
      trendStrength: 1.0,
      aiAnalysis: 1.2,
      newsImpact: 1.0,
      whaleActivity: 0.8
    };

    // 사용자 가중치가 없으면 학습된 가중치 사용
    if (!userWeights) {
      return learnedWeights;
    }

    // 사용자 가중치 × 학습 조정값
    const mergedWeights: Record<string, number> = {};
    Object.keys(defaultWeights).forEach(key => {
      const userWeight = userWeights[key] || defaultWeights[key];
      const learnedAdjustment = learnedWeights[key] ? learnedWeights[key] / defaultWeights[key] : 1.0;
      mergedWeights[key] = userWeight * learnedAdjustment;
    });

    return mergedWeights;
  }

  // 시뮬레이션 모드 메서드들
  private simulateBuyOrder(market: string, amount: number, price: number, confidence: number = 0): void {
    const coin = market.split('-')[1];
    const volume = amount / price;
    
    // 잔고 확인
    if (this.virtualKRW < amount) {
      console.log(`[시뮬레이션] ${coin} 매수 실패: KRW 잔고 부족 (필요: ₩${amount.toLocaleString()}, 보유: ₩${this.virtualKRW.toLocaleString()})`);
      return;
    }
    
    // 가상 KRW 차감
    this.virtualKRW -= amount;
    
    // 가상 포트폴리오 업데이트
    const existing = this.virtualPortfolio.get(market) || { balance: 0, avgBuyPrice: 0, totalBought: 0 };
    const newBalance = existing.balance + volume;
    const newTotalBought = existing.totalBought + amount;
    
    // 올바른 평균 매수가 계산: (기존 평균가 * 기존 수량 + 새 매수가 * 새 수량) / 전체 수량
    const newAvgBuyPrice = newBalance > 0 ? 
      (existing.avgBuyPrice * existing.balance + price * volume) / newBalance : price;
    
    this.virtualPortfolio.set(market, {
      balance: newBalance,
      avgBuyPrice: newAvgBuyPrice,
      totalBought: newTotalBought
    });
    
    // 거래 기록
    this.virtualTradeHistory.push({
      market,
      type: 'BUY',
      price,
      amount, // KRW 금액
      volume, // 코인 수량
      confidence,
      timestamp: Date.now(),
      profit: 0,
      krwBalance: this.virtualKRW,
      coinBalance: newBalance,
      profitRate: 0
    });
    
    console.log(`[시뮬레이션] ${coin} 매수 완료:`);
    console.log(`  - 매수 금액: ₩${amount.toLocaleString()}`);
    console.log(`  - 매수 가격: ₩${price.toLocaleString()}`);
    console.log(`  - 매수 수량: ${volume.toFixed(8)} ${coin}`);
    console.log(`  - 평균 매수가: ₩${newAvgBuyPrice.toLocaleString()}`);
    console.log(`  - 보유 수량: ${newBalance.toFixed(8)} ${coin}`);
    console.log(`  - 남은 KRW: ₩${this.virtualKRW.toLocaleString()}`);
  }
  
  private simulateSellOrder(market: string, volume: number, price: number, confidence: number = 0): void {
    const coin = market.split('-')[1];
    const portfolio = this.virtualPortfolio.get(market);
    
    if (!portfolio || portfolio.balance < volume) {
      console.log(`[시뮬레이션] ${coin} 잔고 부족으로 매도 실패`);
      return;
    }
    
    const sellAmount = volume * price;
    const profitAmount = (price - portfolio.avgBuyPrice) * volume;
    const profitRate = ((price - portfolio.avgBuyPrice) / portfolio.avgBuyPrice) * 100;
    
    // 가상 KRW 증가
    this.virtualKRW += sellAmount;
    
    // 포트폴리오 업데이트
    portfolio.balance -= volume;
    
    // 매도한 비율만큼 totalBought 감소
    const sellRatio = volume / (portfolio.balance + volume);
    portfolio.totalBought = portfolio.totalBought * (1 - sellRatio);
    
    if (portfolio.balance <= 0) {
      this.virtualPortfolio.delete(market);
    }
    
    // 거래 기록
    this.virtualTradeHistory.push({
      market,
      type: 'SELL',
      price,
      amount: sellAmount, // KRW 금액
      volume, // 코인 수량
      confidence,
      timestamp: Date.now(),
      profit: profitAmount,
      krwBalance: this.virtualKRW,
      coinBalance: portfolio.balance,
      profitRate: profitRate
    });
    
    console.log(`[시뮬레이션] ${coin} 매도 완료:`);
    console.log(`  - 매도 수량: ${volume.toFixed(8)} ${coin}`);
    console.log(`  - 매도 가격: ₩${price.toLocaleString()}`);
    console.log(`  - 매도 금액: ₩${sellAmount.toLocaleString()}`);
    console.log(`  - 수익금: ₩${profitAmount.toLocaleString()} (${profitRate.toFixed(2)}%)`);
    console.log(`  - 남은 수량: ${portfolio.balance.toFixed(8)} ${coin}`);
    console.log(`  - 현재 KRW: ₩${this.virtualKRW.toLocaleString()}`);
    
    // 전체 수익률 계산
    const totalValue = this.calculateTotalPortfolioValue();
    const totalProfitRate = ((totalValue - 10000000) / 10000000) * 100;
    console.log(`  - 총 자산: ₩${totalValue.toLocaleString()} (${totalProfitRate >= 0 ? '+' : ''}${totalProfitRate.toFixed(2)}%)`);
    
    // 학습 시스템에 거래 결과 기록 (비동기로 실행)
    this.recordTradeResultForLearning(market, portfolio.avgBuyPrice, price, profitRate).catch(error => {
      console.error(`[학습] ${market} 거래 결과 기록 실패:`, error);
    });
  }
  
  private calculateTotalPortfolioValue(): number {
    let totalValue = this.virtualKRW;
    
    this.virtualPortfolio.forEach((portfolio, market) => {
      const analysis = this.analysisResults.get(market);
      if (analysis && analysis.currentPrice) {
        totalValue += portfolio.balance * analysis.currentPrice;
      } else {
        // 현재가를 찾을 수 없는 경우 평균 매수가 사용
        console.warn(`[시뮬레이션] ${market} 현재가 조회 실패, 평균 매수가 사용`);
        totalValue += portfolio.balance * portfolio.avgBuyPrice;
      }
    });
    
    return totalValue;
  }
  
  // 시뮬레이션 상태 조회
  public getSimulationStatus(): {
    krwBalance: number;
    totalValue: number;
    profitRate: number;
    portfolio: Array<{
      market: string;
      balance: number;
      avgBuyPrice: number;
      currentPrice: number;
      profitRate: number;
      value: number;
    }>;
    recentTrades: any[];
  } {
    const totalValue = this.calculateTotalPortfolioValue();
    const profitRate = ((totalValue - 10000000) / 10000000) * 100;
    
    const portfolio: any[] = [];
    this.virtualPortfolio.forEach((data, market) => {
      const analysis = this.analysisResults.get(market);
      const currentPrice = analysis?.currentPrice || data.avgBuyPrice;
      const marketProfitRate = ((currentPrice - data.avgBuyPrice) / data.avgBuyPrice) * 100;
      
      portfolio.push({
        market,
        balance: data.balance,
        avgBuyPrice: data.avgBuyPrice,
        currentPrice,
        profitRate: marketProfitRate,
        value: data.balance * currentPrice
      });
    });
    
    return {
      krwBalance: this.virtualKRW,
      totalValue,
      profitRate,
      portfolio,
      recentTrades: this.virtualTradeHistory.slice(-10)
    };
  }

  private async checkStopLossAndTakeProfit(
    market: string,
    coinAnalysis: CoinAnalysis,
    coinAccount: any,
    analysisConfig: any
  ): Promise<{ shouldSell: boolean; reason: string }> {
    try {
      // 현재 가격 가져오기
      const currentPrice = coinAnalysis.currentPrice;
      const avgBuyPrice = parseFloat(coinAccount.avg_buy_price);
      const balance = parseFloat(coinAccount.balance);

      if (avgBuyPrice <= 0 || balance <= 0) {
        return { shouldSell: false, reason: '' };
      }

      // 수익률 계산
      const profitRate = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100;

      // 코인별 설정 우선, 없으면 전역 설정 사용
      const stopLossPercent = analysisConfig?.stopLoss ?? this.config.stopLossPercent ?? 5;
      const takeProfitPercent = analysisConfig?.takeProfit ?? this.config.takeProfitPercent ?? 10;
      
      // 트레일링 스톱 설정
      const enableTrailingStop = analysisConfig?.enableTrailingStop ?? this.config.enableTrailingStop ?? false;
      const trailingStopPercent = analysisConfig?.trailingStopPercent ?? this.config.trailingStopPercent ?? 2;
      const trailingStartPercent = analysisConfig?.trailingStartPercent ?? this.config.trailingStartPercent ?? 5;

      // 트레일링 스톱 체크
      if (enableTrailingStop && profitRate >= trailingStartPercent) {
        // 최고가 업데이트
        const highestData = this.highestPrices.get(market);
        if (!highestData || currentPrice > highestData.price) {
          this.highestPrices.set(market, { price: currentPrice, timestamp: Date.now() });
          console.log(`[${market}] 트레일링 스톱: 최고가 갱신 ₩${currentPrice.toLocaleString()}`);
        }
        
        // 트레일링 스톱 손절선 계산
        const highest = this.highestPrices.get(market);
        if (highest) {
          const trailingStopPrice = highest.price * (1 - trailingStopPercent / 100);
          const dropFromHighest = ((highest.price - currentPrice) / highest.price) * 100;
          
          if (currentPrice <= trailingStopPrice) {
            console.log(`[${market}] 트레일링 스톱 발동: 최고가 ₩${highest.price.toLocaleString()}에서 ${dropFromHighest.toFixed(2)}% 하락`);
            return {
              shouldSell: true,
              reason: `트레일링 스톱: 최고가에서 ${dropFromHighest.toFixed(2)}% 하락 (현재 수익률: ${profitRate.toFixed(2)}%)`
            };
          }
          
          // 트레일링 정보 로그
          console.log(`[${market}] 트레일링 스톱 활성: 최고가 ₩${highest.price.toLocaleString()}, 손절선 ₩${trailingStopPrice.toLocaleString()}, 현재가 ₩${currentPrice.toLocaleString()}`);
        }
      }

      // 일반 손절 체크 (트레일링 스톱이 활성화되지 않은 경우에만)
      if (!enableTrailingStop || profitRate < trailingStartPercent) {
        if (profitRate <= -stopLossPercent) {
          console.log(`[${market}] 손절 조건 충족: 수익률 ${profitRate.toFixed(2)}% <= -${stopLossPercent}%`);
          // 최고가 기록 삭제 (다음 매수를 위해)
          this.highestPrices.delete(market);
          return {
            shouldSell: true,
            reason: `손절: 수익률 ${profitRate.toFixed(2)}% (손절선: -${stopLossPercent}%)`
          };
        }
      }

      // 익절 체크
      if (profitRate >= takeProfitPercent) {
        console.log(`[${market}] 익절 조건 충족: 수익률 ${profitRate.toFixed(2)}% >= ${takeProfitPercent}%`);
        // 최고가 기록 삭제 (다음 매수를 위해)
        this.highestPrices.delete(market);
        return {
          shouldSell: true,
          reason: `익절: 수익률 ${profitRate.toFixed(2)}% (익절선: ${takeProfitPercent}%)`
        };
      }

      return { shouldSell: false, reason: '' };
    } catch (error) {
      console.error(`[${market}] 손절/익절 체크 중 오류:`, error);
      return { shouldSell: false, reason: '' };
    }
  }

  // UpbitService 인스턴스 반환
  getUpbitService() {
    return upbitService;
  }

  /**
   * VaR (Value at Risk) 계산
   * 포트폴리오의 위험을 측정하고 최대 예상 손실을 계산
   */
  public async calculatePortfolioVaR(methodology: 'historical' | 'parametric' | 'monte-carlo' = 'parametric'): Promise<VaRResult | null> {
    try {
      // 현재 포트폴리오 구성
      const portfolio = await this.getCurrentPortfolio();
      if (portfolio.length === 0) {
        console.log('VaR 계산 실패: 포트폴리오가 비어있습니다.');
        return null;
      }

      // 가격 이력 업데이트
      await this.updatePriceHistory();

      // VaR 계산
      const varResult = riskManagementService.calculateVaR(
        portfolio,
        this.priceHistoryForVaR,
        methodology
      );

      // VaR 초과 시 알림
      if (varResult.percentageVaR95 > 10) { // 10% 이상 손실 위험
        notificationService.notifySystemStatus({
          type: 'error',
          message: `VaR 경고: 포트폴리오 위험도 높음`,
          details: `일일 최대 예상 손실 ${varResult.percentageVaR95.toFixed(2)}%`
        });

        this.emit('varWarning', {
          varResult,
          message: `높은 위험: 95% 신뢰수준에서 일일 ${varResult.percentageVaR95.toFixed(2)}% 손실 가능`
        });
      }

      return varResult;
    } catch (error) {
      console.error('VaR 계산 중 오류:', error);
      return null;
    }
  }

  /**
   * 현재 포트폴리오 구성 가져오기
   */
  private async getCurrentPortfolio(): Promise<PortfolioPosition[]> {
    const positions: PortfolioPosition[] = [];
    
    if (this.config.enableRealTrading) {
      // 실제 거래 모드
      const accounts = await upbitService.getAccounts();
      const totalValue = accounts.reduce((sum, acc) => {
        if (acc.currency === 'KRW') return sum + parseFloat(acc.balance);
        const market = `KRW-${acc.currency}`;
        const analysis = this.analysisResults.get(market);
        const currentPrice = analysis?.currentPrice || parseFloat(acc.avg_buy_price);
        return sum + parseFloat(acc.balance) * currentPrice;
      }, 0);

      for (const account of accounts) {
        if (account.currency !== 'KRW' && parseFloat(account.balance) > 0) {
          const market = `KRW-${account.currency}`;
          const analysis = this.analysisResults.get(market);
          const currentPrice = analysis?.currentPrice || parseFloat(account.avg_buy_price);
          const value = parseFloat(account.balance) * currentPrice;

          positions.push({
            market,
            balance: parseFloat(account.balance),
            avgBuyPrice: parseFloat(account.avg_buy_price),
            currentPrice,
            value,
            weight: value / totalValue
          });
        }
      }
    } else {
      // 시뮬레이션 모드
      const totalValue = this.calculateTotalPortfolioValue();
      
      this.virtualPortfolio.forEach((data, market) => {
        if (data.balance > 0) {
          const analysis = this.analysisResults.get(market);
          const currentPrice = analysis?.currentPrice || data.avgBuyPrice;
          const value = data.balance * currentPrice;

          positions.push({
            market,
            balance: data.balance,
            avgBuyPrice: data.avgBuyPrice,
            currentPrice,
            value,
            weight: value / totalValue
          });
        }
      });
    }

    return positions;
  }

  /**
   * 가격 이력 업데이트
   */
  private async updatePriceHistory(): Promise<void> {
    for (const market of this.activeMarkets) {
      const analysis = this.analysisResults.get(market);
      if (analysis) {
        // 기존 이력 가져오기
        const history = this.priceHistoryForVaR.get(market) || [];
        
        // 새 가격 추가
        history.push(analysis.currentPrice);
        
        // 최대 크기 유지
        if (history.length > this.MAX_PRICE_HISTORY) {
          history.shift();
        }
        
        this.priceHistoryForVaR.set(market, history);
      }
    }
  }

  /**
   * CVaR (Conditional Value at Risk) 계산
   * VaR를 초과하는 손실의 평균값
   */
  public async calculateCVaR(confidenceLevel: number = 0.95): Promise<number> {
    const portfolio = await this.getCurrentPortfolio();
    if (portfolio.length === 0) return 0;

    return riskManagementService.calculateCVaR(portfolio, confidenceLevel);
  }

  /**
   * 스트레스 테스트 실행
   */
  public async performStressTest(): Promise<Array<{ scenario: string; loss: number; percentage: number }>> {
    const portfolio = await this.getCurrentPortfolio();
    if (portfolio.length === 0) return [];

    // 스트레스 시나리오 정의
    const scenarios = [
      {
        name: '암호화폐 시장 급락 (-20%)',
        shocks: new Map(portfolio.map(p => [p.market, -20]))
      },
      {
        name: 'BTC 급락 파급효과',
        shocks: new Map(portfolio.map(p => {
          if (p.market.includes('BTC')) return [p.market, -30];
          if (p.market.includes('ETH')) return [p.market, -25];
          return [p.market, -15]; // 알트코인
        }))
      },
      {
        name: '규제 리스크 시나리오',
        shocks: new Map(portfolio.map(p => [p.market, -40]))
      },
      {
        name: '플래시 크래시',
        shocks: new Map(portfolio.map(p => [p.market, -50]))
      }
    ];

    return riskManagementService.performStressTest(portfolio, scenarios);
  }

  /**
   * 리스크 기반 포지션 크기 조정
   */
  private adjustPositionSizeByVaR(
    baseSize: number,
    market: string,
    varResult: VaRResult | null
  ): number {
    if (!varResult) return baseSize;

    // VaR가 높으면 포지션 크기 축소
    if (varResult.percentageVaR95 > 15) {
      return baseSize * 0.5; // 50% 축소
    } else if (varResult.percentageVaR95 > 10) {
      return baseSize * 0.7; // 30% 축소
    } else if (varResult.percentageVaR95 > 5) {
      return baseSize * 0.9; // 10% 축소
    }

    return baseSize;
  }

  /**
   * 일일 리스크 리포트 생성
   */
  public async generateRiskReport(): Promise<{
    VaR: VaRResult | null;
    CVaR: number;
    stressTest: Array<{ scenario: string; loss: number; percentage: number }>;
    recommendations: string[];
  }> {
    const varResult = await this.calculatePortfolioVaR();
    const cvar = await this.calculateCVaR();
    const stressTest = await this.performStressTest();
    
    const recommendations: string[] = [];

    if (varResult) {
      if (varResult.percentageVaR95 > 15) {
        recommendations.push('포트폴리오 위험이 매우 높습니다. 포지션 축소를 권장합니다.');
      } else if (varResult.percentageVaR95 > 10) {
        recommendations.push('포트폴리오 위험이 높습니다. 리밸런싱을 고려하세요.');
      }

      if (varResult.confidence < 0.7) {
        recommendations.push('데이터가 부족합니다. 더 많은 거래 데이터 축적이 필요합니다.');
      }
    }

    // 스트레스 테스트 결과 분석
    const worstCase = stressTest.reduce((worst, test) => 
      test.percentage > worst.percentage ? test : worst
    , { scenario: '', loss: 0, percentage: 0 });

    if (worstCase.percentage > 50) {
      recommendations.push(`최악의 시나리오(${worstCase.scenario})에서 ${worstCase.percentage.toFixed(1)}% 손실 가능성이 있습니다.`);
    }

    return {
      VaR: varResult,
      CVaR: cvar,
      stressTest,
      recommendations
    };
  }


  /**
   * 포트폴리오 자동 리밸런싱 시작
   */
  private startAutoRebalancing(): void {
    const intervalHours = this.config.rebalanceInterval || 24; // 기본 24시간
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    console.log(`자동 리밸런싱 시작: ${intervalHours}시간마다 실행`);
    
    // 첫 실행
    this.checkAndRebalance();
    
    // 주기적 실행
    this.rebalanceInterval = setInterval(() => {
      this.checkAndRebalance();
    }, intervalMs);
  }

  /**
   * 리밸런싱 필요 여부 확인 및 실행
   */
  private async checkAndRebalance(): Promise<void> {
    try {
      console.log('포트폴리오 리밸런싱 체크 시작...');
      
      // 현재 포트폴리오 가져오기
      const portfolio = await this.getCurrentPortfolio();
      if (portfolio.length === 0) {
        console.log('리밸런싱 실패: 포트폴리오가 비어있습니다.');
        return;
      }
      
      // 목표 포트폴리오 설정
      const targetWeights = this.config.targetPortfolio || this.getDefaultTargetWeights();
      
      // 리밸런싱 제약 조건
      const constraints = {
        maxVaR: 10, // 최대 VaR 10%
        minWeight: 0.05, // 최소 비중 5%
        maxWeight: 0.4, // 최대 비중 40%
        rebalanceThreshold: this.config.rebalanceThreshold || 0.05 // 5% 이상 차이 시 리밸런싱
      };
      
      // 리밸런싱 제안 받기
      const rebalanceResult = riskManagementService.suggestRebalancing(
        portfolio,
        targetWeights,
        constraints
      );
      
      if (!rebalanceResult.needsRebalancing) {
        console.log('리밸런싱 불필요: 현재 포트폴리오가 목표 범위 내에 있습니다.');
        return;
      }
      
      // 리밸런싱 실행
      await this.executeRebalancing(rebalanceResult);
      
      // 리밸런싱 완료 알림
      notificationService.notifySystemStatus({
        type: 'started',
        message: '포트폴리오 리밸런싱 완료',
        details: `매수: ₩${rebalanceResult.totalBuyAmount.toLocaleString()}, 매도: ₩${rebalanceResult.totalSellAmount.toLocaleString()}`
      });
      
      this.lastRebalanceTime = Date.now();
      
    } catch (error) {
      console.error('리밸런싱 중 오류:', error);
      notificationService.notifyError({
        title: '리밸런싱 실패',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  /**
   * 리밸런싱 실행
   */
  private async executeRebalancing(rebalanceResult: any): Promise<void> {
    console.log('리밸런싱 실행 시작...');
    
    // 매도부터 실행 (자금 확보)
    for (const [market, action] of rebalanceResult.suggestions) {
      if (action.action === 'SELL') {
        try {
          const account = await this.getAccountForMarket(market);
          if (account && parseFloat(account.balance) > 0) {
            const sellRatio = action.amount / (parseFloat(account.balance) * action.currentWeight);
            const sellAmount = parseFloat(account.balance) * sellRatio;
            
            console.log(`[리밸런싱] ${market} 매도: ${sellAmount.toFixed(8)} (${(sellRatio * 100).toFixed(1)}%)`);
            
            if (this.config.enableRealTrading) {
              await upbitService.sellOrder(market, sellAmount.toFixed(8));
            } else {
              this.simulateSellOrder(market, sellAmount, 0, 0); // 현재가는 나중에 업데이트
            }
          }
        } catch (error) {
          console.error(`리밸런싱 매도 실패 (${market}):`, error);
        }
      }
    }
    
    // 잠시 대기 (체결 시간)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 매수 실행
    for (const [market, action] of rebalanceResult.suggestions) {
      if (action.action === 'BUY') {
        try {
          console.log(`[리밸런싱] ${market} 매수: ₩${action.amount.toLocaleString()}`);
          
          if (this.config.enableRealTrading) {
            await upbitService.buyOrder(market, action.amount.toFixed(0));
          } else {
            const analysis = this.analysisResults.get(market);
            if (analysis) {
              this.simulateBuyOrder(market, action.amount, analysis.currentPrice, 0);
            }
          }
        } catch (error) {
          console.error(`리밸런싱 매수 실패 (${market}):`, error);
        }
      }
    }
    
    console.log('리밸런싱 실행 완료');
    
    // 리밸런싱 결과 이벤트 발생
    this.emit('rebalancingCompleted', {
      timestamp: Date.now(),
      suggestions: rebalanceResult.suggestions,
      totalBuyAmount: rebalanceResult.totalBuyAmount,
      totalSellAmount: rebalanceResult.totalSellAmount
    });
  }

  /**
   * 특정 마켓의 계좌 정보 가져오기
   */
  private async getAccountForMarket(market: string): Promise<any> {
    const currency = market.split('-')[1];
    const accounts = await upbitService.getAccounts();
    return accounts.find(acc => acc.currency === currency);
  }

  /**
   * 기본 목표 포트폴리오 설정
   */
  private getDefaultTargetWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    
    // 기본 전략: 시가총액 가중
    weights.set('KRW-BTC', 0.4);   // 40%
    weights.set('KRW-ETH', 0.3);   // 30%
    weights.set('KRW-XRP', 0.1);   // 10%
    weights.set('KRW-ADA', 0.1);   // 10%
    weights.set('KRW-SOL', 0.1);   // 10%
    
    return weights;
  }

  /**
   * 포트폴리오 리밸런싱 설정 업데이트
   */
  public updateRebalancingConfig(config: {
    enabled: boolean;
    interval: number;
    threshold: number;
    targetWeights: Map<string, number>;
  }): void {
    this.config.enableAutoRebalancing = config.enabled;
    this.config.rebalanceInterval = config.interval;
    this.config.rebalanceThreshold = config.threshold;
    this.config.targetPortfolio = config.targetWeights;
    
    // 기존 리밸런싱 중지 후 재시작
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
      this.rebalanceInterval = null;
    }
    
    if (config.enabled && this._isRunning) {
      this.startAutoRebalancing();
    }
  }

  /**
   * 수동 리밸런싱 실행
   */
  public async executeManualRebalancing(): Promise<void> {
    await this.checkAndRebalance();
  }

  // 매수 진입점 기록 (학습용)
  private entryPointsForLearning: Map<string, {
    entryPrice: number;
    entryTime: number;
    indicators: any;
    market_conditions: any;
    news_sentiment?: number;
    whale_activity?: boolean;
  }> = new Map();

  // 매수 시 학습을 위한 진입점 기록
  private async recordEntryForLearning(market: string, technical: any, analysis: CoinAnalysis): Promise<void> {
    // 현재 분석 정보 수집
    const indicators = {
      rsi: technical.rsi,
      macd: technical.macd?.histogram || 0,
      bb_position: technical.bollinger ? 
        (analysis.currentPrice - technical.bollinger.lower) / 
        (technical.bollinger.upper - technical.bollinger.lower) : 0.5,
      volume_ratio: technical.volume?.ratio || 1,
      stochastic_rsi: technical.stochasticRSI?.k || 50,
      atr: technical.atr || 0,
      obv_trend: technical.obv?.trend === 'UP' ? 1 : technical.obv?.trend === 'DOWN' ? -1 : 0,
      adx: technical.adx?.adx || 0
    };

    // 시장 상황 판단
    const market_conditions = {
      trend: this.determineMarketCondition(technical),
      volatility: this.determineVolatilityLevel(technical.atr, analysis.currentPrice),
      volume: this.determineVolumeLevel(technical.volume?.ratio || 1)
    };

    // 뉴스 감성 점수 가져오기
    let news_sentiment = 0;
    try {
      const coinSymbol = market.split('-')[1];
      const newsAnalysis = await newsService.getCoinNews(coinSymbol);
      // -100 ~ +100 범위를 -1 ~ +1로 정규화
      news_sentiment = newsAnalysis.sentimentScore / 100;
      console.log(`[학습] ${market} 뉴스 분석 결과:
        - 감성 점수: ${news_sentiment.toFixed(2)} (원본: ${newsAnalysis.sentimentScore})
        - 뉴스 수: ${newsAnalysis.totalNews}개 (긍정: ${newsAnalysis.positiveCount}, 부정: ${newsAnalysis.negativeCount}, 중립: ${newsAnalysis.neutralCount})
        - FUD 지수: ${newsAnalysis.fudIndex || 0}/100
        - 평균 영향력: ${newsAnalysis.averageInfluence || 50}/100`);
    } catch (error) {
      console.error(`[학습] ${market} 뉴스 분석 실패:`, error);
      // 뉴스 분석 실패 시에도 0값으로 학습 진행
      news_sentiment = 0;
    }

    // 고래 활동 감지
    const whale_activity = technical.trades?.whaleDetected || false;

    this.entryPointsForLearning.set(market, {
      entryPrice: analysis.currentPrice,
      entryTime: Date.now(),
      indicators,
      market_conditions,
      news_sentiment,
      whale_activity
    });
  }

  // 매도 시 학습 시스템에 거래 결과 기록
  private async recordTradeResultForLearning(
    market: string, 
    entryPrice: number, 
    exitPrice: number, 
    profitRate: number
  ): Promise<void> {
    const entryData = this.entryPointsForLearning.get(market);
    if (!entryData) {
      console.log(`[학습] ${market} 진입 데이터가 없어 학습 기록을 생략합니다.`);
      return;
    }

    const holding_period = (Date.now() - entryData.entryTime) / (1000 * 60); // 분 단위

    // 매도 시점의 뉴스 감성도 다시 확인 (변화 추적)
    let exit_news_sentiment = 0;
    try {
      const coinSymbol = market.split('-')[1];
      const newsAnalysis = await newsService.getCoinNews(coinSymbol);
      exit_news_sentiment = newsAnalysis.sentimentScore / 100;
      console.log(`[학습] ${market} 매도 시점 뉴스 감성:
        - 현재: ${exit_news_sentiment.toFixed(2)} (원본: ${newsAnalysis.sentimentScore})
        - 진입: ${entryData.news_sentiment?.toFixed(2) || 0}
        - 변화: ${(exit_news_sentiment - (entryData.news_sentiment || 0)).toFixed(2)}`);
    } catch (error) {
      console.error(`[학습] ${market} 매도 시점 뉴스 분석 실패:`, error);
      exit_news_sentiment = 0;
    }

    const tradeResult = {
      market,
      timestamp: Date.now(),
      entryPrice,
      exitPrice,
      profit: exitPrice - entryPrice,
      profitRate,
      holding_period,
      indicators: entryData.indicators,
      market_conditions: entryData.market_conditions,
      news_sentiment: entryData.news_sentiment || 0,  // 진입 시점 뉴스
      whale_activity: entryData.whale_activity || false
    };

    // 학습 서비스에 기록
    this.learningService.recordTrade(tradeResult);

    // 진입 데이터 삭제
    this.entryPointsForLearning.delete(market);

    console.log(`[학습] ${market} 거래 결과 기록 완료: ${profitRate.toFixed(2)}% (뉴스 변화: ${(exit_news_sentiment - (entryData.news_sentiment || 0)).toFixed(2)})`);
  }


  // 변동성 수준 판단
  private determineVolatilityLevel(atr: number, price: number): 'low' | 'medium' | 'high' {
    const atrRatio = atr / price;
    if (atrRatio < 0.02) return 'low';
    if (atrRatio < 0.05) return 'medium';
    return 'high';
  }

  // 거래량 수준 판단
  private determineVolumeLevel(volumeRatio: number): 'low' | 'medium' | 'high' {
    if (volumeRatio < 0.8) return 'low';
    if (volumeRatio < 1.5) return 'medium';
    return 'high';
  }

  getProfitHistory(days: number = 7): Array<{ time: string; profitRate: number; totalValue: number }> {
    try {
      // trade-history-service에서 일별 성과 데이터 가져오기
      const dailyPerformance = tradeHistoryService.getDailyPerformance(days);
      
      if (dailyPerformance && dailyPerformance.length > 0) {
        // 시작 자금
        const initialCapital = this.config.enableRealTrading ? 10000000 : 10000000; // 1천만원
        let cumulativeProfit = 0;
        
        return dailyPerformance.map(day => {
          cumulativeProfit += day.profit;
          const totalValue = initialCapital + cumulativeProfit;
          const profitRate = (cumulativeProfit / initialCapital) * 100;
          
          return {
            time: new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            profitRate: profitRate,
            totalValue: totalValue
          };
        });
      }
      
      // 거래 내역이 없는 경우 빈 배열 반환
      return [];
    } catch (error) {
      console.error('Failed to get profit history:', error);
      return [];
    }
  }
}

export default new TradingEngine();