// 포맷팅 관련 유틸리티 함수들

export const formatNumber = (num: number | string, decimals: number = 0): string => {
  if (num === undefined || num === null) return '0';
  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '0';
  return value.toLocaleString('ko-KR', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const formatCurrency = (value: number | string, currency: string = 'KRW'): string => {
  if (value === undefined || value === null) return currency === 'KRW' ? '₩0' : '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return currency === 'KRW' ? '₩0' : '0';
  if (currency === 'KRW') {
    return `₩${formatNumber(num)}`;
  }
  return formatNumber(num, 8);
};

export const formatTimeAgo = (date: Date | string | number): string => {
  const timestamp = date instanceof Date 
    ? date.getTime()
    : typeof date === 'string' 
    ? new Date(date).getTime() 
    : date;
  
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

export const formatAIReason = (reason: string | null | undefined, decision: string): string => {
  if (!reason) {
    return '기술적 지표 분석에 기반한 자동 매매 결정입니다.';
  }
  
  const decisionKorean = {
    'buy': '매수',
    'sell': '매도',
    'hold': '홀드'
  }[decision] || decision;

  let formattedReason = reason
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/### (.*?)(?:\n|$)/g, '\n💡 $1\n')
    .replace(/##\s*(.*?)(?:\n|$)/g, '\n📊 $1\n')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, (match) => `${match}`)
    .replace(/`([^`]+)`/g, '$1');

  const sections = formattedReason.split(/\n{2,}/);
  const cleanedSections = sections
    .map(section => section.trim())
    .filter(section => section.length > 0);

  const finalText = cleanedSections.join('\n\n');
  
  if (!finalText.includes(decisionKorean)) {
    return `${decisionKorean} 결정\n\n${finalText}`;
  }
  
  return finalText;
};

export const getDecisionColor = (decision: string): string => {
  switch (decision?.toLowerCase()) {
    case 'buy': return 'success';
    case 'sell': return 'error';
    case 'hold': return 'warning';
    default: return 'grey';
  }
};

export const getDecisionText = (decision: string): string => {
  switch (decision?.toLowerCase()) {
    case 'buy': return '매수';
    case 'sell': return '매도';
    case 'hold': return '홀드';
    default: return '대기';
  }
};

// 안전한 숫자 변환 함수들
export const safeParseFloat = (value: string | number | undefined, defaultValue: number = 0): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? defaultValue : parsed;
};

export const safeParseInt = (value: string | number | undefined, defaultValue: number = 0): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);
  return isNaN(parsed) ? defaultValue : parsed;
};