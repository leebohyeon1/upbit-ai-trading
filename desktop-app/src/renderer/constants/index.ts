import { IndicatorWeights } from '../types';

// 거래 가능한 코인 목록 (업비트 KRW 마켓 실제 지원 코인)
export const AVAILABLE_COINS = [
  // 주요 코인
  { symbol: 'BTC', name: '비트코인' },
  { symbol: 'ETH', name: '이더리움' },
  { symbol: 'XRP', name: '리플' },
  { symbol: 'SOL', name: '솔라나' },
  { symbol: 'ADA', name: '에이다' },
  { symbol: 'DOGE', name: '도지코인' },
  { symbol: 'AVAX', name: '아발란체' },
  { symbol: 'DOT', name: '폴카닷' },
  { symbol: 'MATIC', name: '폴리곤' },
  { symbol: 'LINK', name: '체인링크' },
  { symbol: 'ATOM', name: '코스모스' },
  { symbol: 'UNI', name: '유니스왑' },
  { symbol: 'ETC', name: '이더리움클래식' },
  { symbol: 'XLM', name: '스텔라루멘' },
  { symbol: 'BCH', name: '비트코인캐시' },
  { symbol: 'TRX', name: '트론' },
  { symbol: 'SAND', name: '샌드박스' },
  { symbol: 'AXS', name: '엑시인피니티' },
  { symbol: 'MANA', name: '디센트럴랜드' },
  { symbol: 'FLOW', name: '플로우' },
  // 추가 인기 코인
  { symbol: 'HBAR', name: '헤데라' },
  { symbol: 'VET', name: '비체인' },
  { symbol: 'THETA', name: '쎄타토큰' },
  { symbol: 'CHZ', name: '칠리즈' },
  { symbol: 'ENJ', name: '엔진코인' },
  { symbol: 'ALGO', name: '알고랜드' },
  { symbol: 'XTZ', name: '테조스' },
  { symbol: 'KAVA', name: '카바' },
  { symbol: 'CRO', name: '크로노스' },
  { symbol: 'STX', name: '스택스' }
];

// 기본 설정값 (보수적인 전략)
export const DEFAULT_CONFIG = {
  // 거래 비율 (0-1 사이의 값)
  BUY_RATIO: 0.1,  // 10%만 투자 (리스크 최소화)
  SELL_RATIO: 0.3,  // 30%만 매도 (분할 매도로 추가 상승 기회 확보)
  
  // 금액 설정 (원화)
  MAX_INVESTMENT_PER_COIN: 100000,  // 코인당 최대 10만원 (분산 투자)
  
  // 신뢰도 임계값 (%)
  MIN_CONFIDENCE_BUY: 65,  // 높은 확신이 있을 때만 매수
  MIN_CONFIDENCE_SELL: 45,  // 조금이라도 위험 신호가 있으면 매도
  
  // 손익 설정 (%)
  STOP_LOSS: 3,  // 3% 손실에서 손절 (빠른 손절)
  TAKE_PROFIT: 8,  // 8% 수익에서 일부 익절
  
  // 쿨타임 설정 (분 단위로 통일)
  BUY_COOLDOWN_MINUTES: 10,  // 10분 매수 쿨타임
  SELL_COOLDOWN_MINUTES: 1,   // 1분 매도 쿨타임
  
  // 기존 초 단위 값 (하위 호환성)
  BUY_COOLDOWN: 600,  // @deprecated - BUY_COOLDOWN_MINUTES 사용
  SELL_COOLDOWN: 60,   // @deprecated - SELL_COOLDOWN_MINUTES 사용
  RSI_PERIOD: 14,
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 30,
  BB_PERIOD: 20,
  BB_STD_DEV: 2,
  VOLUME_THRESHOLD: 2,
  MIN_VOLUME: 1000000000,
  KIMCHI_PREMIUM_THRESHOLD: 5,
  WHALE_MULTIPLIER: 10,
  ATR_MULTIPLIER: 2,
  ANALYSIS_INTERVAL_SECONDS: 60,  // 60초 = 1분마다 분석
  // 간소화된 설정 추가
  simplifiedConfig: {
    enabled: false,  // 기본적으로 간소화 모드 비활성화
    timeframe: 'minute60',
    analysisInterval: 60,
    useIndicators: {
      movingAverage: true,
      rsi: true,
      macd: true,
      bollingerBands: true,
      stochastic: true,
      volume: true
    },
    tradingThresholds: {
      buyThreshold: 0.15,
      sellThreshold: -0.2,
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

// 탭 인덱스
export const TAB_INDEX = {
  OVERVIEW: 0,
  PORTFOLIO: 1,
  ANALYSIS: 2,
  ADVANCED_ANALYSIS: 3,
  SETTINGS: 4,
  LEARNING: 5,
  BACKTEST: 6,
  SIMULATION: 7,
  KILL_SWITCH: 8,
  DOCUMENTATION: 9
};

// 색상 정의
export const COLORS = {
  BUY: 'success',
  SELL: 'error',
  HOLD: 'warning',
  NEUTRAL: 'grey'
};

// 결정 텍스트
export const DECISION_TEXT = {
  buy: '매수',
  sell: '매도',
  hold: '홀드'
};

// 신뢰도 임계값
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 70,
  LOW: 50
};

// 분석 주기 옵션
export const ANALYSIS_INTERVAL_OPTIONS = [
  { value: 30, label: '30초' },
  { value: 60, label: '1분' },
  { value: 120, label: '2분' },
  { value: 300, label: '5분' },
  { value: 600, label: '10분' }
];

// 포지션 크기 모드
export const POSITION_SIZING_MODES = {
  FIXED: 'fixed',
  KELLY: 'kelly',
  VOLATILITY: 'volatility'
};

// 손절/익절 모드
export const STOP_MODES = {
  FIXED: 'fixed',
  ATR: 'atr',
  SIGNAL: 'signal'
};

// 기본 지표 가중치
export const DEFAULT_INDICATOR_WEIGHTS: IndicatorWeights = {
  // 기술적 지표
  rsi: 1.0,
  macd: 1.0,
  bollinger: 1.0,
  stochastic: 0.8,
  volume: 1.0,
  atr: 0.8,
  obv: 0.7,
  adx: 0.8,
  // 시장 지표
  volatility: 1.0,
  trendStrength: 1.0,
  // 외부 요인
  aiAnalysis: 1.2,
  newsImpact: 1.0,
  whaleActivity: 0.8
};

// 가중치 프리셋
export const WEIGHT_PRESETS = {
  balanced: {
    name: '균형',
    description: '모든 지표를 균등하게 고려',
    weights: DEFAULT_INDICATOR_WEIGHTS
  },
  technical: {
    name: '기술적 분석 중심',
    description: '기술적 지표에 높은 가중치',
    weights: {
      ...DEFAULT_INDICATOR_WEIGHTS,
      rsi: 1.5,
      macd: 1.5,
      bollinger: 1.3,
      aiAnalysis: 0.7,
      newsImpact: 0.5
    }
  },
  aiDriven: {
    name: 'AI 분석 중심',
    description: 'AI와 뉴스 분석에 높은 가중치',
    weights: {
      ...DEFAULT_INDICATOR_WEIGHTS,
      aiAnalysis: 2.0,
      newsImpact: 1.5,
      rsi: 0.7,
      macd: 0.7
    }
  },
  volume: {
    name: '거래량 중심',
    description: '거래량과 고래 활동 중심',
    weights: {
      ...DEFAULT_INDICATOR_WEIGHTS,
      volume: 2.0,
      obv: 1.5,
      whaleActivity: 1.5,
      rsi: 0.8
    }
  }
};

// 가중치 학습 모드
export const WEIGHT_LEARNING_MODES = {
  INDIVIDUAL: 'individual',
  CATEGORY: 'category',
  GLOBAL: 'global'
};

// 코인 카테고리 (학습 공유용)
export const COIN_CATEGORIES = {
  major: ['BTC', 'ETH'],
  defi: ['UNI', 'AAVE', 'LINK'],
  layer1: ['SOL', 'AVAX', 'DOT', 'ATOM'],
  layer2: ['MATIC', 'ARB', 'OP'],
  meme: ['DOGE', 'SHIB'],
  stable: ['USDT', 'USDC', 'DAI']
};