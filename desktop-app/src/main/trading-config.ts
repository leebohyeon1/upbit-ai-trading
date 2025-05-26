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
  // 사용자가 저장한 설정 가져오기
  static getCoinConfig(market: string): CoinSpecificConfig {
    // localStorage나 파일에서 사용자 설정을 불러오도록 변경
    // 여기서는 빈 설정을 반환하도록 수정
    const savedConfigs = this.loadSavedConfigs();
    return savedConfigs[market] || this.getEmptyConfig();
  }

  // 빈 설정 반환 (사용자가 직접 설정해야 함)
  static getEmptyConfig(): CoinSpecificConfig {
    return {
      rsiOverbought: 70,
      rsiOversold: 30,
      minVolume: 0,
      minConfidenceForBuy: 50,
      minConfidenceForSell: 50,
      maxPositionSize: 0,
      defaultBuyRatio: 0.1,
      defaultSellRatio: 0.5,
      buyingCooldown: 0,
      sellingCooldown: 0,
      stopLossPercent: 5,
      takeProfitPercent: 10,
      useKellyOptimization: false,
      volatilityAdjustment: false,
      newsImpactMultiplier: 1.0,
      preferredTradingHours: []
    };
  }

  // 저장된 설정 불러오기
  static loadSavedConfigs(): Record<string, CoinSpecificConfig> {
    // 실제로는 IPC를 통해 main 프로세스에서 설정을 가져와야 함
    // 여기서는 빈 객체 반환
    return {};
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