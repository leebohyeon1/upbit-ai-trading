// 코인별 개별 거래 전략 설정
export interface CoinSpecificConfig {
  // 기술적 지표 임계값
  rsiOverbought: number;
  rsiOversold: number;
  
  // 최소 거래량 (KRW)
  minVolume: number;
  
  // 신뢰도 임계값
  minConfidenceForBuy: number;
  minConfidenceForSell: number;
  
  // 포지션 크기
  maxPositionSize: number; // 최대 투자 금액 (KRW)
  defaultBuyRatio: number; // 기본 매수 비율
  defaultSellRatio: number; // 기본 매도 비율
  
  // 쿨다운 설정
  buyingCooldown: number; // 분
  sellingCooldown: number; // 분
  
  // 손익 설정
  stopLossPercent: number;
  takeProfitPercent: number;
  
  // 특별 설정
  useKellyOptimization?: boolean; // Kelly Criterion 사용 여부
  volatilityAdjustment?: boolean; // 변동성에 따른 조정
  newsImpactMultiplier?: number; // 뉴스 영향 배수 (1.0 = 기본)
  preferredTradingHours?: number[]; // 선호 거래 시간대 (0-23)
}

// 코인별 특성 정의
export const COIN_CHARACTERISTICS = {
  'BTC': {
    type: 'major',
    description: '가장 안정적인 암호화폐, 기관 투자자 선호',
    volatility: 'medium',
    correlationWithMarket: 'very_high'
  },
  'ETH': {
    type: 'major',
    description: 'DeFi 생태계의 중심, 네트워크 활동도 중요',
    volatility: 'medium-high',
    correlationWithMarket: 'high'
  },
  'XRP': {
    type: 'major',
    description: '규제 뉴스에 민감, 급격한 가격 변동 가능',
    volatility: 'high',
    correlationWithMarket: 'medium'
  },
  'DOGE': {
    type: 'meme',
    description: '소셜 미디어 영향력 큼, 일론 머스크 트윗 주의',
    volatility: 'very_high',
    correlationWithMarket: 'low'
  },
  'SOL': {
    type: 'defi',
    description: '고성능 블록체인, 네트워크 안정성이 핵심',
    volatility: 'high',
    correlationWithMarket: 'medium-high'
  },
  'ADA': {
    type: 'platform',
    description: '학술적 접근, 개발 업데이트에 민감',
    volatility: 'medium-high',
    correlationWithMarket: 'medium'
  },
  'MATIC': {
    type: 'layer2',
    description: 'Layer 2 솔루션, 이더리움 가스비와 연동',
    volatility: 'high',
    correlationWithMarket: 'medium'
  },
  'AVAX': {
    type: 'defi',
    description: 'DeFi 플랫폼, 서브넷 채택률 중요',
    volatility: 'high',
    correlationWithMarket: 'medium'
  },
  'DOT': {
    type: 'platform',
    description: '파라체인 경매가 가격 동력',
    volatility: 'medium-high',
    correlationWithMarket: 'medium'
  },
  'ATOM': {
    type: 'platform',
    description: 'IBC 생태계 확장이 핵심',
    volatility: 'medium-high',
    correlationWithMarket: 'medium'
  },
  'LINK': {
    type: 'defi',
    description: '오라클 서비스, DeFi 성장과 비례',
    volatility: 'medium',
    correlationWithMarket: 'high'
  },
  'UNI': {
    type: 'defi',
    description: 'DEX 선두주자, 거래량이 핵심 지표',
    volatility: 'medium-high',
    correlationWithMarket: 'medium'
  }
};

// 기본 설정값
export const DEFAULT_COIN_CONFIGS: Record<string, CoinSpecificConfig> = {
  // 메이저 코인 (안정적, 보수적 전략)
  'KRW-BTC': {
    rsiOverbought: 80, // 매우 확실한 과매수에서만 매도
    rsiOversold: 20, // 매우 확실한 과매도에서만 매수
    minVolume: 2000000000, // 20억원 (유동성 높은 시장에서만)
    minConfidenceForBuy: 80, // 매수 신뢰도 80% 이상
    minConfidenceForSell: 70, // 매도 신뢰도 70% 이상  
    maxPositionSize: 100000, // 10만원 (최대 포지션 크기 축소)
    defaultBuyRatio: 0.1, // 10%만 매수 (매우 보수적)
    defaultSellRatio: 1.0, // 100% 매도 (손실 시 전량 청산)
    buyingCooldown: 180, // 3시간 매수 쿨타임
    sellingCooldown: 90, // 1.5시간 매도 쿨타임
    stopLossPercent: 2, // 2% 손실에서 즉시 손절
    takeProfitPercent: 3, // 3% 이익에서 즉시 이익 실현
    useKellyOptimization: false, // Kelly 비활성화 (더 안전하게)
    volatilityAdjustment: true,
    newsImpactMultiplier: 0.8, // 뉴스 영향 축소
    preferredTradingHours: [9, 10, 11, 14, 15, 16] // 주간 거래만
  },
  
  'KRW-ETH': {
    rsiOverbought: 85, // 매우 확실한 과매수
    rsiOversold: 15, // 매우 확실한 과매도
    minVolume: 1000000000, // 10억원 (유동성 높은 시장에서만)
    minConfidenceForBuy: 78, // 매수 신뢰도 78% 이상
    minConfidenceForSell: 68, // 매도 신뢰도 68% 이상
    maxPositionSize: 80000, // 8만원로 축소
    defaultBuyRatio: 0.15, // 15%만 매수
    defaultSellRatio: 1.0, // 100% 매도
    buyingCooldown: 150, // 2.5시간 매수 쿨타임
    sellingCooldown: 75, // 1.25시간 매도 쿨타임
    stopLossPercent: 2.5, // 2.5% 손실에서 손절
    takeProfitPercent: 4, // 4% 이익에서 이익 실현
    useKellyOptimization: false,
    volatilityAdjustment: true,
    newsImpactMultiplier: 0.7 // 뉴스 영향 축소
  },
  
  // 고변동성 알트코인 (공격적 전략)
  'KRW-XRP': {
    rsiOverbought: 90, // 극단적 과매수에서만
    rsiOversold: 10, // 극단적 과매도에서만
    minVolume: 1000000000, // 10억원 (높은 유동성 필수)
    minConfidenceForBuy: 85, // 85% 이상의 확신
    minConfidenceForSell: 75, // 75% 이상의 확신
    maxPositionSize: 50000, // 5만원 (리스크 최소화)
    defaultBuyRatio: 0.1, // 10%만 매수
    defaultSellRatio: 1.0, // 전량 매도
    buyingCooldown: 240, // 4시간 쿨타임
    sellingCooldown: 120, // 2시간 쿨타임
    stopLossPercent: 1.5, // 1.5% 손실에서 즉시 손절
    takeProfitPercent: 2.5, // 2.5% 이익에서 즉시 이익 실현
    volatilityAdjustment: true,
    newsImpactMultiplier: 0.5 // 뉴스 영향 최소화
  },
  
  'KRW-DOGE': {
    rsiOverbought: 95, // 극히 드문 과매수에서만
    rsiOversold: 5, // 극히 드문 과매도에서만
    minVolume: 500000000, // 5억원 (높은 유동성 필수)
    minConfidenceForBuy: 90, // 90% 이상의 확신
    minConfidenceForSell: 80, // 80% 이상의 확신  
    maxPositionSize: 30000, // 3만원 (최소 금액만)
    defaultBuyRatio: 0.05, // 5%만 매수 (매우 보수적)
    defaultSellRatio: 1.0, // 전량 매도
    buyingCooldown: 360, // 6시간 쿨타임
    sellingCooldown: 180, // 3시간 쿨타임
    stopLossPercent: 1, // 1% 손실에서 즉시 손절
    takeProfitPercent: 2, // 2% 이익에서 즉시 이익 실현
    newsImpactMultiplier: 0.3 // 뉴스/소셜 영향 최소화
  },
  
  // DeFi 코인 (중간 전략)
  'KRW-SOL': {
    rsiOverbought: 75,
    rsiOversold: 25,
    minVolume: 200000000,
    minConfidenceForBuy: 65,
    minConfidenceForSell: 60,
    maxPositionSize: 300000,
    defaultBuyRatio: 0.3,
    defaultSellRatio: 0.6,
    buyingCooldown: 30,
    sellingCooldown: 20,
    stopLossPercent: 7,
    takeProfitPercent: 14,
    volatilityAdjustment: true,
    newsImpactMultiplier: 1.3
  },
  
  'KRW-LINK': {
    rsiOverbought: 72,
    rsiOversold: 28,
    minVolume: 150000000,
    minConfidenceForBuy: 62,
    minConfidenceForSell: 58,
    maxPositionSize: 250000,
    defaultBuyRatio: 0.35,
    defaultSellRatio: 0.5,
    buyingCooldown: 25,
    sellingCooldown: 20,
    stopLossPercent: 6,
    takeProfitPercent: 11,
    useKellyOptimization: true,
    volatilityAdjustment: true
  },
  
  // 플랫폼 코인
  'KRW-ADA': {
    rsiOverbought: 73,
    rsiOversold: 27,
    minVolume: 150000000,
    minConfidenceForBuy: 64,
    minConfidenceForSell: 60,
    maxPositionSize: 200000,
    defaultBuyRatio: 0.3,
    defaultSellRatio: 0.5,
    buyingCooldown: 30,
    sellingCooldown: 20,
    stopLossPercent: 6,
    takeProfitPercent: 12,
    volatilityAdjustment: true,
    newsImpactMultiplier: 1.2
  },
  
  'KRW-DOT': {
    rsiOverbought: 74,
    rsiOversold: 26,
    minVolume: 100000000,
    minConfidenceForBuy: 65,
    minConfidenceForSell: 60,
    maxPositionSize: 200000,
    defaultBuyRatio: 0.3,
    defaultSellRatio: 0.5,
    buyingCooldown: 30,
    sellingCooldown: 20,
    stopLossPercent: 7,
    takeProfitPercent: 13,
    volatilityAdjustment: true
  },
  
  // Layer 2
  'KRW-MATIC': {
    rsiOverbought: 76,
    rsiOversold: 24,
    minVolume: 100000000,
    minConfidenceForBuy: 66,
    minConfidenceForSell: 61,
    maxPositionSize: 200000,
    defaultBuyRatio: 0.3,
    defaultSellRatio: 0.6,
    buyingCooldown: 35,
    sellingCooldown: 22,
    stopLossPercent: 7,
    takeProfitPercent: 14,
    volatilityAdjustment: true,
    newsImpactMultiplier: 1.1
  },
  
  // 기본값 (나머지 코인들)
  'DEFAULT': {
    rsiOverbought: 75,
    rsiOversold: 25,
    minVolume: 100000000,
    minConfidenceForBuy: 65,
    minConfidenceForSell: 60,
    maxPositionSize: 150000,
    defaultBuyRatio: 0.25,
    defaultSellRatio: 0.5,
    buyingCooldown: 35,
    sellingCooldown: 25,
    stopLossPercent: 7,
    takeProfitPercent: 12,
    volatilityAdjustment: true
  }
};

// 시장 상황별 조정 계수
export const MARKET_CONDITION_MULTIPLIERS = {
  // 상승장
  bull: {
    rsiOverbought: 1.1, // RSI 과매수 기준 상향
    rsiOversold: 1.1, // RSI 과매도 기준 상향
    minConfidence: 0.9, // 신뢰도 기준 하향
    positionSize: 1.2 // 포지션 크기 증가
  },
  // 하락장
  bear: {
    rsiOverbought: 0.9, // RSI 과매수 기준 하향
    rsiOversold: 0.9, // RSI 과매도 기준 하향
    minConfidence: 1.1, // 신뢰도 기준 상향
    positionSize: 0.7 // 포지션 크기 감소
  },
  // 횡보장
  sideways: {
    rsiOverbought: 1.0,
    rsiOversold: 1.0,
    minConfidence: 1.0,
    positionSize: 0.9
  }
};

// 거래 전략 설정 헬퍼 함수
export class TradingConfigHelper {
  // 코인별 설정 가져오기
  static getCoinConfig(market: string): CoinSpecificConfig {
    return DEFAULT_COIN_CONFIGS[market] || DEFAULT_COIN_CONFIGS['DEFAULT'];
  }
  
  // 시장 상황에 따른 설정 조정
  static adjustConfigForMarketCondition(
    config: CoinSpecificConfig,
    marketCondition: 'bull' | 'bear' | 'sideways'
  ): CoinSpecificConfig {
    const multipliers = MARKET_CONDITION_MULTIPLIERS[marketCondition];
    
    return {
      ...config,
      rsiOverbought: Math.round(config.rsiOverbought * multipliers.rsiOverbought),
      rsiOversold: Math.round(config.rsiOversold * multipliers.rsiOversold),
      minConfidenceForBuy: Math.round(config.minConfidenceForBuy * multipliers.minConfidence),
      minConfidenceForSell: Math.round(config.minConfidenceForSell * multipliers.minConfidence),
      maxPositionSize: Math.round(config.maxPositionSize * multipliers.positionSize)
    };
  }
  
  // 변동성에 따른 설정 조정
  static adjustConfigForVolatility(
    config: CoinSpecificConfig,
    volatility: number // ATR / Price
  ): CoinSpecificConfig {
    if (!config.volatilityAdjustment) return config;
    
    // 고변동성 (> 5%)
    if (volatility > 0.05) {
      return {
        ...config,
        rsiOverbought: Math.min(85, config.rsiOverbought + 5),
        rsiOversold: Math.max(15, config.rsiOversold - 5),
        stopLossPercent: config.stopLossPercent * 1.3,
        takeProfitPercent: config.takeProfitPercent * 1.3,
        defaultBuyRatio: config.defaultBuyRatio * 0.7
      };
    }
    // 저변동성 (< 2%)
    else if (volatility < 0.02) {
      return {
        ...config,
        rsiOverbought: Math.max(65, config.rsiOverbought - 5),
        rsiOversold: Math.min(35, config.rsiOversold + 5),
        stopLossPercent: config.stopLossPercent * 0.7,
        takeProfitPercent: config.takeProfitPercent * 0.7,
        defaultBuyRatio: Math.min(0.5, config.defaultBuyRatio * 1.3)
      };
    }
    
    return config;
  }
  
  // 시간대별 설정 조정
  static shouldTradeAtHour(config: CoinSpecificConfig, hour: number): boolean {
    if (!config.preferredTradingHours || config.preferredTradingHours.length === 0) {
      return true; // 시간 제한 없음
    }
    
    return config.preferredTradingHours.includes(hour);
  }
}

export default TradingConfigHelper;