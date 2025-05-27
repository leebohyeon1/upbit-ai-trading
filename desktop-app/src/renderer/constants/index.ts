// 거래 가능한 코인 목록
export const AVAILABLE_COINS = [
  { symbol: 'BTC', name: '비트코인' },
  { symbol: 'ETH', name: '이더리움' },
  { symbol: 'XRP', name: '리플' },
  { symbol: 'ADA', name: '에이다' },
  { symbol: 'SOL', name: '솔라나' },
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
  { symbol: 'NEAR', name: '니어프로토콜' },
  { symbol: 'ARB', name: '아비트럼' },
  { symbol: 'OP', name: '옵티미즘' },
  { symbol: 'TRX', name: '트론' },
  { symbol: 'SUI', name: '수이' }
];

// 기본 설정값
export const DEFAULT_CONFIG = {
  BUY_RATIO: 0.3,
  SELL_RATIO: 0.5,
  MAX_INVESTMENT_PER_COIN: 100000,
  MIN_CONFIDENCE_BUY: 60,
  MIN_CONFIDENCE_SELL: 70,
  STOP_LOSS: 5,
  TAKE_PROFIT: 10,
  BUY_COOLDOWN: 300,
  SELL_COOLDOWN: 180,
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
  ANALYSIS_INTERVAL_SECONDS: 60
};

// 탭 인덱스
export const TAB_INDEX = {
  OVERVIEW: 0,
  PORTFOLIO: 1,
  ANALYSIS: 2,
  SETTINGS: 3,
  LEARNING: 4,
  BACKTEST: 5
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
  hold: '보류'
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