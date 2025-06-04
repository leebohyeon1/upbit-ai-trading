// 신호 강도 설정 (Python 프로젝트 스타일)
export interface SignalStrengths {
  // 이동평균선 관련
  maCrossover: number;      // 골든크로스/데드크로스 (기본값: 0.7)
  maLongTrend: number;      // 장기 이동평균선 추세 (기본값: 0.5)
  
  // 볼린저 밴드 관련
  bbExtreme: number;        // 볼린저 밴드 상/하단 돌파 (기본값: 0.8)
  bbMiddle: number;         // 볼린저 밴드 중간 영역 (기본값: 0.3)
  
  // RSI 관련
  rsiExtreme: number;       // RSI 과매수/과매도 (기본값: 0.95)
  rsiMiddle: number;        // RSI 중간 영역 (기본값: 0.4)
  
  // MACD 관련
  macdCrossover: number;    // MACD 크로스 (기본값: 0.9)
  macdTrend: number;        // MACD 추세 (기본값: 0.5)
  
  // 스토캐스틱 관련
  stochExtreme: number;     // 스토캐스틱 과매수/과매도 (기본값: 0.7)
  stochMiddle: number;      // 스토캐스틱 중간 영역 (기본값: 0.3)
  
  // 기타 지표
  orderbook: number;        // 호가창 매수/매도 비율 (기본값: 0.7)
  tradeData: number;        // 체결 데이터 분석 (기본값: 0.6)
  volumeRatio: number;      // 거래량 비율 (기본값: 0.6)
  kimchiPremium: number;    // 김치 프리미엄 (기본값: 0.7)
  fearGreed: number;        // 공포/탐욕 지수 (기본값: 0.8)
  obv: number;              // OBV 지표 (기본값: 0.6)
  adx: number;              // ADX 추세 강도 (기본값: 0.7)
}

// 지표 가중치 설정 (Python 프로젝트 스타일)
export interface IndicatorWeights {
  MA: number;           // 이동평균선 (기본값: 0.8)
  MA60: number;         // 장기 이동평균선 (기본값: 0.7)
  BB: number;           // 볼린저 밴드 (기본값: 1.3)
  RSI: number;          // RSI (기본값: 1.5)
  MACD: number;         // MACD (기본값: 1.5)
  Stochastic: number;   // 스토캐스틱 (기본값: 1.3)
  Orderbook: number;    // 호가창 (기본값: 1.1)
  Trades: number;       // 체결 데이터 (기본값: 0.9)
  Volume: number;       // 거래량 (기본값: 1.0)
  KIMP: number;         // 김치 프리미엄 (기본값: 1.2)
  FearGreed: number;    // 공포/탐욕 지수 (기본값: 1.4)
  OBV: number;          // OBV (기본값: 0.8)
  ADX: number;          // ADX (기본값: 0.8)
}

// 간소화된 거래 전략 설정
export interface SimplifiedTradingConfig {
  // 타임프레임 설정 (가장 중요!)
  timeframe: 'minute1' | 'minute3' | 'minute5' | 'minute10' | 'minute15' | 'minute30' | 'minute60' | 'minute240' | 'day' | 'week' | 'month';
  analysisInterval: number; // 분석 주기 (분 단위)
  
  // 핵심 지표만 사용 (이전 프로젝트처럼)
  useIndicators: {
    movingAverage: boolean;    // MA 골든/데드크로스
    rsi: boolean;              // RSI 과매수/과매도
    macd: boolean;             // MACD 크로스
    bollingerBands: boolean;   // 볼린저 밴드
    stochastic: boolean;       // 스토캐스틱
    volume: boolean;           // 거래량
    orderbook?: boolean;       // 호가창
    trades?: boolean;          // 체결 데이터
    kimchiPremium?: boolean;   // 김치 프리미엄
    fearGreed?: boolean;       // 공포/탐욕 지수
    obv?: boolean;             // OBV
    adx?: boolean;             // ADX
  };
  
  // Python 스타일 신호 강도 설정
  signalStrengths: SignalStrengths;
  
  // Python 스타일 지표 가중치
  indicatorWeights: IndicatorWeights;
  
  // 단순화된 매매 임계값 (이전 프로젝트 방식)
  tradingThresholds: {
    buyThreshold: number;      // 매수 임계값 (기본: 0.15)
    sellThreshold: number;     // 매도 임계값 (기본: -0.2)
    
    // RSI 설정
    rsiOverbought: number;     // RSI 과매수 (기본: 70)
    rsiOversold: number;       // RSI 과매도 (기본: 30)
  };
  
  // 투자 설정 (단순화)
  investmentSettings: {
    investmentRatio: number;   // 투자 비율 (0.1 = 10%)
    maxPositionSize: number;   // 최대 투자 금액
    
    // 손익 관리
    stopLossPercent: number;   // 손절 %
    takeProfitPercent: number; // 익절 %
  };
  
  // 쿨다운 설정 (선택사항)
  cooldownSettings?: {
    enabled: boolean;
    tradeCooldown: number;     // 거래 후 대기 시간(분)
  };
}

// 코인별 개별 거래 전략 설정
export interface CoinSpecificConfig {
  // 기술적 지표 임계값
  rsiOverbought: number;
  rsiOversold: number;
  
  // 최소 거래량 (KRW) - 사용 안 함
  minVolume: number;
  
  // 신뢰도 임계값 - 사용 안 함
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
  
  // 간소화된 설정 사용
  useSimplifiedConfig?: boolean;
  simplifiedConfig?: SimplifiedTradingConfig;
  
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
      minVolume: 0,  // 사용 안 함
      minConfidenceForBuy: 0,  // 사용 안 함 (0으로 설정)
      minConfidenceForSell: 0, // 사용 안 함 (0으로 설정)
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
      preferredTradingHours: [],
      useSimplifiedConfig: false,  // 기본적으로 간소화 설정 사용 안함
      simplifiedConfig: {
        timeframe: 'minute60',  // 기본 60분봉 (이전 프로젝트처럼)
        analysisInterval: 60,   // 60분마다 분석
        useIndicators: {
          movingAverage: true,
          rsi: true,
          macd: true,
          bollingerBands: true,
          stochastic: true,
          volume: true,
          orderbook: true,
          trades: true,
          kimchiPremium: true,
          fearGreed: true,
          obv: true,
          adx: true
        },
        // Python 프로젝트와 동일한 신호 강도 설정
        signalStrengths: {
          maCrossover: 0.7,
          maLongTrend: 0.5,
          bbExtreme: 0.8,
          bbMiddle: 0.3,
          rsiExtreme: 0.95,
          rsiMiddle: 0.4,
          macdCrossover: 0.9,
          macdTrend: 0.5,
          stochExtreme: 0.7,
          stochMiddle: 0.3,
          orderbook: 0.7,
          tradeData: 0.6,
          volumeRatio: 0.6,
          kimchiPremium: 0.7,
          fearGreed: 0.9,
          obv: 0.6,
          adx: 0.7
        },
        // Python 프로젝트와 동일한 지표 가중치
        indicatorWeights: {
          MA: 0.8,
          MA60: 0.7,
          BB: 1.3,
          RSI: 1.5,
          MACD: 1.5,
          Stochastic: 1.3,
          Orderbook: 1.1,
          Trades: 0.9,
          Volume: 1.0,
          KIMP: 1.2,
          FearGreed: 1.4,
          OBV: 0.6,
          ADX: 0.8
        },
        tradingThresholds: {
          buyThreshold: 0.15,    // 이전 프로젝트와 동일
          sellThreshold: -0.2,   // 이전 프로젝트와 동일
          rsiOverbought: 70,
          rsiOversold: 30
        },
        investmentSettings: {
          investmentRatio: 0.2,  // 20% 투자
          maxPositionSize: 1000000,  // 100만원
          stopLossPercent: 5,
          takeProfitPercent: 10
        },
        cooldownSettings: {
          enabled: true,
          tradeCooldown: 60  // 60분 쿨다운
        }
      }
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
      minConfidenceForBuy: 0,  // 신뢰도 체크 제거
      minConfidenceForSell: 0, // 신뢰도 체크 제거
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