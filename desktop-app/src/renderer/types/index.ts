// 거래 관련 타입 정의
export interface Account {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
  avg_buy_price_modified: boolean;
  unit_currency: string;
}

export interface MarketData {
  market: string;
  korean_name: string;
  english_name: string;
}

export interface TickerData {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_date_kst: string;
  trade_time_kst: string;
  trade_timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  change: string;
  change_price: number;
  change_rate: number;
  signed_change_price: number;
  signed_change_rate: number;
  trade_volume: number;
  acc_trade_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
  timestamp: number;
}

export interface Analysis {
  ticker: string;
  decision: string;
  confidence: number;
  timestamp: string;
  reason?: string;
  tradeAttempt?: TradeAttempt;
  patterns?: {
    candlePatterns: Array<{
      pattern: string;
      type: 'bullish' | 'bearish' | 'neutral';
      confidence: number;
      description: string;
    }>;
    chartPatterns: Array<{
      pattern: string;
      type: 'bullish' | 'bearish' | 'continuation';
      confidence: number;
      targetPrice?: number;
    }>;
    patternSignal: 'BUY' | 'SELL' | 'HOLD';
    patternConfidence: number;
  };
  currentPrice?: number;
  cooldownInfo?: {
    learningEnabled: boolean;
    dynamicBuyCooldown?: number;
    dynamicSellCooldown?: number;
  };
}

export interface TradeAttempt {
  attempted: boolean;
  success: boolean;
  failureReason?: TradeFailureReason;
  details?: string;
}

export enum TradeFailureReason {
  NO_CONFIG = 'NO_CONFIG',
  TRADING_HOURS = 'TRADING_HOURS',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  COOLDOWN_BUY = 'COOLDOWN_BUY',
  COOLDOWN_SELL = 'COOLDOWN_SELL',
  MIN_ORDER_AMOUNT = 'MIN_ORDER_AMOUNT',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  REAL_TRADE_DISABLED = 'REAL_TRADE_DISABLED',
  KELLY_FRACTION_ZERO = 'KELLY_FRACTION_ZERO',
  VOLATILITY_TOO_HIGH = 'VOLATILITY_TOO_HIGH',
  VOLUME_TOO_LOW = 'VOLUME_TOO_LOW',
  API_ERROR = 'API_ERROR'
}

export const TradeFailureReasonMessages: Record<TradeFailureReason, { title: string; solution: string }> = {
  [TradeFailureReason.NO_CONFIG]: {
    title: '분석 설정 없음',
    solution: '분석 설정에서 해당 코인의 거래 설정을 추가해주세요.'
  },
  [TradeFailureReason.TRADING_HOURS]: {
    title: '거래 시간 제한',
    solution: '설정된 거래 시간이 아닙니다. 분석 설정에서 거래 시간을 확인하세요.'
  },
  [TradeFailureReason.LOW_CONFIDENCE]: {
    title: '신뢰도 미달',
    solution: '신뢰도가 설정된 임계값보다 낮습니다. 거래 설정에서 임계값을 조정하세요.'
  },
  [TradeFailureReason.COOLDOWN_BUY]: {
    title: '매수 쿨타임',
    solution: '최근 매수 후 쿨타임이 아직 끝나지 않았습니다.'
  },
  [TradeFailureReason.COOLDOWN_SELL]: {
    title: '매도 쿨타임',
    solution: '최근 매도 후 쿨타임이 아직 끝나지 않았습니다.'
  },
  [TradeFailureReason.MIN_ORDER_AMOUNT]: {
    title: '최소 주문 금액 미달',
    solution: '주문 금액이 최소 주문 금액(5,000원)보다 적습니다. 투자 비율을 높이세요.'
  },
  [TradeFailureReason.INSUFFICIENT_BALANCE]: {
    title: '잔액 부족',
    solution: 'KRW 잔액이 부족합니다. 입금하거나 다른 코인을 매도하세요.'
  },
  [TradeFailureReason.REAL_TRADE_DISABLED]: {
    title: '실거래 비활성화',
    solution: 'API 키 설정에서 실거래를 활성화하세요.'
  },
  [TradeFailureReason.KELLY_FRACTION_ZERO]: {
    title: 'Kelly 비율 0%',
    solution: '과거 성과가 좋지 않아 Kelly Criterion이 0%를 제안했습니다.'
  },
  [TradeFailureReason.VOLATILITY_TOO_HIGH]: {
    title: '변동성 과다',
    solution: '시장 변동성이 너무 높아 거래가 제한되었습니다.'
  },
  [TradeFailureReason.VOLUME_TOO_LOW]: {
    title: '거래량 부족',
    solution: '24시간 거래량이 설정된 최소 거래량보다 적습니다.'
  },
  [TradeFailureReason.API_ERROR]: {
    title: 'API 오류',
    solution: 'Upbit API 호출 중 오류가 발생했습니다. 잠시 후 다시 시도됩니다.'
  }
};

export interface LearningState {
  ticker: string;
  isRunning: boolean;
}

export interface LearningProgress {
  model: string;
  ticker: string;
  progress: number;
  episodes: number;
  totalEpisodes: number;
  avgReward: number;
  bestReward: number;
  status: 'training' | 'completed' | 'idle';
  error?: string;
}

export interface TradingState {
  isRunning: boolean;
  enableRealTrading: boolean;
  maxInvestmentPerCoin: number;
  aiEnabled: boolean;
  lastUpdate?: string;
}

export interface AnalysisConfig {
  ticker: string;
  buyConfidenceThreshold: number;
  sellConfidenceThreshold: number;
  stopLoss: number;
  takeProfit: number;
  stopLossMode: 'fixed' | 'atr' | 'signal';
  takeProfitMode: 'fixed' | 'atr' | 'signal';
  buyCooldown: number;
  sellCooldown: number;
  buying?: {
    defaultBuyRatio: number;
  };
  selling?: {
    defaultSellRatio: number;
  };
  skipCooldownOnHighConfidence?: boolean;
  skipCooldownThreshold?: number;
  // 새로 추가된 필드들
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  bbPeriod?: number;
  bbStdDev?: number;
  volumeThreshold?: number;
  minVolume?: number;
  kimchiPremiumThreshold?: number;
  whaleMultiplier?: number;
  maxPositionSize?: number;
  positionSizingMode?: 'fixed' | 'kelly' | 'volatility';
  atrMultiplier?: number;
  analysisIntervalSeconds?: number;
  preferredTradingHours?: number[];
  newsImpactMultiplier?: number;
  volatilityAdjustment?: boolean;
  useKellyOptimization?: boolean;
  minOrderAmount?: number;
  // 지표 가중치
  indicatorWeights?: IndicatorWeights;
  weightLearning?: WeightLearning;
  // 쿨타임 학습
  cooldownLearning?: {
    enabled: boolean;
    minTrades: number;
    winRateThreshold: number;
    lastUpdate: number | null;
  };
}

// 지표 가중치 타입
export interface IndicatorWeights {
  // 기술적 지표 (0.0 ~ 2.0)
  rsi: number;
  macd: number;
  bollinger: number;
  stochastic: number;
  volume: number;
  atr: number;
  obv: number;
  adx: number;
  // 시장 지표
  volatility: number;
  trendStrength: number;
  // 외부 요인
  aiAnalysis: number;
  newsImpact: number;
  whaleActivity: number;
}

// 가중치 학습 설정
export interface WeightLearning {
  enabled: boolean;
  mode: 'individual' | 'category' | 'global'; // 개별/카테고리별/전체
  minTrades: number; // 학습 시작 최소 거래 수
  adjustments: Partial<IndicatorWeights>; // 학습된 조정값
  performance: {
    trades: number;
    winRate: number;
    avgProfit: number;
    lastUpdated: number;
  };
}

export interface TradingConfig {
  buyRatio: number;
  sellRatio: number;
  maxInvestmentPerCoin: number;
  enableRealTrading: boolean;
  dynamicConfidence: boolean;
  riskLevel: number;
  useKellyCriterion: boolean;
  maxKellyFraction?: number;
  volatilityWindow: number;
  correlationThreshold: number;
  minConfidenceForBuy: number;
  minConfidenceForSell: number;
  confidenceWindowSize: number;
  buyingCooldown: number;
  sellingCooldown: number;
  decisionThresholds: {
    buyThreshold: number;
    sellThreshold: number;
  };
  scores: {
    [key: string]: number;
  };
  useAI: boolean;
  aiProvider: string;
  tradingSettings: {
    buying?: {
      defaultBuyRatio: number;
      confidenceBasedAdjustment: boolean;
      highConfidenceMultiplier: number;
      lowConfidenceMultiplier: number;
    };
    selling?: {
      defaultSellRatio: number;
      confidenceBasedAdjustment: boolean;
      highConfidenceMultiplier: number;
      lowConfidenceMultiplier: number;
    };
  };
  // 백테스트 관련 필드
  cooldownAfterTrade?: number;
  stopLoss?: number;
  takeProfit?: number;
  weights?: IndicatorWeights;
  // 간소화된 거래 설정
  simplifiedConfig?: {
    enabled?: boolean;  // 간소화 모드 활성화 여부
    timeframe: string;
    analysisInterval: number;
    useIndicators: {
      movingAverage: boolean;
      rsi: boolean;
      macd: boolean;
      bollingerBands: boolean;
      stochastic: boolean;
      volume: boolean;
    };
    tradingThresholds: {
      buyThreshold: number;
      sellThreshold: number;
      rsiOverbought: number;
      rsiOversold: number;
    };
    investmentSettings?: {
      investmentRatio: number;   // 투자 비율 (0.1 = 10%)
      maxPositionSize: number;   // 최대 투자 금액
      stopLossPercent: number;   // 손절 %
      takeProfitPercent: number; // 익절 %
    };
    cooldownSettings?: {
      enabled: boolean;
      tradeCooldown: number;     // 거래 후 대기 시간(분)
    };
  };
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL';
  date: Date;
  price: number;
  amount: number;
  confidence: number;
  profit?: number;
  profitPercent?: number;
  signal: string;
}

export interface PerformanceByCondition {
  trades: number;
  winRate: number;
  averageReturn: number;
}

export interface BacktestResult {
  market: string;
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  trades: BacktestTrade[];
  performance: {
    totalTrades: number;
    winTrades: number;
    lossTrades: number;
    winRate: number;
    totalReturn: number;
    averageReturn: number;
    maxProfit: number;
    maxLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  marketConditions: {
    bullMarket: PerformanceByCondition;
    bearMarket: PerformanceByCondition;
    sidewaysMarket: PerformanceByCondition;
  };
  optimalParameters?: {
    rsiPeriod?: number;
    bollingerPeriod?: number;
    volumeThreshold?: number;
    takeProfitPercent?: number;
    stopLossPercent?: number;
  };
}

export interface ApiKeyStatus {
  accessKey: string;
  isValid: boolean;
  balance?: string;
}

export interface PortfolioCoin {
  symbol: string;
  name: string;
  enabled: boolean;
  avgBuyPrice?: string;
  holdings?: string;
  currentPrice?: string;
  profitLoss?: string;
  profitLossPercent?: string;
}