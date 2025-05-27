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
}

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