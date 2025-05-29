export interface DocSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

export interface DocContent {
  title: string;
  content: string;
}

export const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: '시작하기',
    subsections: [
      { id: 'introduction', title: '프로그램 소개' },
      { id: 'quick-start', title: '5분 빠른 시작' },
      { id: 'requirements', title: '시스템 요구사항' },
      { id: 'installation', title: '설치 및 업데이트' },
      { id: 'disclaimer', title: '면책 조항' },
    ],
  },
  {
    id: 'initial-setup',
    title: '초기 설정',
    subsections: [
      { id: 'upbit-api', title: '업비트 API 키 발급' },
      { id: 'claude-api', title: 'Claude API 키 발급' },
      { id: 'api-permissions', title: 'API 권한 설정' },
      { id: 'security', title: '보안 주의사항' },
    ],
  },
  {
    id: 'core-concepts',
    title: '핵심 개념',
    subsections: [
      { id: 'technical-indicators', title: '기술적 지표 이해하기' },
      { id: 'pattern-recognition', title: '패턴 인식 ✨ NEW' },
      { id: 'ai-analysis', title: 'AI 분석의 원리' },
      { id: 'confidence-system', title: '신뢰도와 가중치' },
      { id: 'market-conditions', title: '시장 상황 판단' },
    ],
  },
  {
    id: 'interface',
    title: '화면 구성',
    subsections: [
      { id: 'dashboard', title: '대시보드 가이드' },
      { id: 'portfolio', title: '포트폴리오 관리' },
      { id: 'settings', title: '설정 화면 설명' },
      { id: 'charts', title: '차트와 지표 읽기' },
    ],
  },
  {
    id: 'trading-strategy',
    title: '거래 전략 설정',
    subsections: [
      { id: 'global-vs-coin', title: '전역 vs 코인별 설정' },
      { id: 'buy-sell-conditions', title: '매수/매도 조건' },
      { id: 'confidence-threshold', title: '신뢰도 임계값' },
      { id: 'cooldown', title: '쿨다운 시간 설정' },
      { id: 'stop-loss-take-profit', title: '손절/익절 전략' },
    ],
  },
  {
    id: 'coin-settings',
    title: '코인별 세부 설정',
    subsections: [
      { id: 'add-coin', title: '분석 설정 추가' },
      { id: 'weights', title: '가중치 커스터마이징' },
      { id: 'position-sizing', title: '투자금액과 비율' },
      { id: 'trading-hours', title: '거래 시간대 설정' },
      { id: 'volatility', title: '변동성 자동 조정' },
    ],
  },
  {
    id: 'auto-trading',
    title: '자동매매 작동 원리',
    subsections: [
      { id: 'analysis-cycle', title: '60초 분석 주기' },
      { id: 'signal-generation', title: '매매 신호 생성' },
      { id: 'confidence-calculation', title: '신뢰도 계산 상세' },
      { id: 'order-execution', title: '주문 실행 과정' },
      { id: 'real-example', title: '실제 거래 예시' },
    ],
  },
  {
    id: 'calculations',
    title: '내부 계산 로직',
    subsections: [
      { id: 'indicator-calculations', title: '기술적 지표 계산법' },
      { id: 'confidence-scoring', title: '신뢰도 점수 계산' },
      { id: 'position-sizing-calc', title: '매수/매도 금액 계산' },
      { id: 'profit-calculations', title: '수익률 계산 방식' },
      { id: 'kelly-criterion', title: 'Kelly Criterion 계산' },
    ],
  },
  {
    id: 'simulation',
    title: '시뮬레이션 모드',
    subsections: [
      { id: 'simulation-overview', title: '시뮬레이션 개요' },
      { id: 'virtual-portfolio', title: '가상 포트폴리오' },
      { id: 'result-analysis', title: '결과 분석 방법' },
      { id: 'transition-checklist', title: '실거래 전환 체크리스트' },
    ],
  },
  {
    id: 'ai-learning',
    title: 'AI 학습 시스템',
    subsections: [
      { id: 'learning-activation', title: '학습 시스템 활성화' },
      { id: 'auto-learning', title: '거래 결과 자동 학습' },
      { id: 'weight-optimization', title: '가중치 최적화' },
      { id: 'performance-statistics', title: '성과 통계 활용' },
    ],
  },
  {
    id: 'backtest',
    title: '백테스트',
    subsections: [
      { id: 'backtest-setup', title: '백테스트 설정' },
      { id: 'period-selection', title: '기간 선택 가이드' },
      { id: 'result-interpretation', title: '결과 지표 해석' },
      { id: 'strategy-improvement', title: '전략 개선 방법' },
    ],
  },
  {
    id: 'risk-management',
    title: '리스크 관리',
    subsections: [
      { id: 'overview', title: '리스크 관리 개요' },
      { id: 'stop-loss', title: '손절 전략' },
      { id: 'portfolio-risk', title: '포트폴리오 리스크' },
      { id: 'capital-management', title: '자금 관리 원칙' },
      { id: 'monitoring', title: '실시간 리스크 모니터링' },
    ],
  },
  {
    id: 'notifications',
    title: '알림 시스템',
    subsections: [
      { id: 'notification-types', title: '알림 종류' },
      { id: 'notification-settings', title: '알림 설정 방법' },
      { id: 'windows-notifications', title: 'Windows 알림' },
    ],
  },
  {
    id: 'troubleshooting',
    title: '문제 해결',
    subsections: [
      { id: 'common-errors', title: '자주 발생하는 오류' },
      { id: 'api-issues', title: 'API 연결 문제' },
      { id: 'trade-failures', title: '거래 실패 분석' },
      { id: 'performance-tips', title: '성능 최적화' },
    ],
  },
  {
    id: 'advanced',
    title: '고급 기능',
    subsections: [
      { id: 'market-correlation', title: '시장 상관관계' },
      { id: 'news-analysis', title: '뉴스 영향도 활용' },
      { id: 'whale-monitoring', title: '고래 활동 모니터링' },
      { id: 'custom-strategies', title: '커스텀 전략' },
    ],
  },
  {
    id: 'reference',
    title: '참고 자료',
    subsections: [
      { id: 'glossary', title: '용어 사전' },
      { id: 'faq', title: 'FAQ' },
      { id: 'scenarios', title: '실전 시나리오' },
      { id: 'tax-info', title: '세금 관련 정보' },
    ],
  },
];

// Import final contents from the merged file
import { finalDocContents } from './docContentsFinalNew';

// Export the complete documentation contents
export const docContents: Record<string, DocContent> = {
  'getting-started': {
    title: '시작하기',
    content: `
# 업비트 AI 자동매매 프로그램에 오신 것을 환영합니다! 🚀

이 프로그램은 암호화폐 자동매매를 위한 종합적인 솔루션입니다. AI 기반 분석과 기술적 지표를 결합하여 최적의 매매 시점을 포착합니다.

## 주요 기능

- **실시간 시장 분석**: 60초마다 선택한 코인들을 자동 분석
- **AI 기반 의사결정**: Claude API를 활용한 지능형 매매 판단
- **다양한 기술적 지표**: RSI, MACD, 볼린저밴드 등 10여 가지 지표 활용
- **리스크 관리**: 손절/익절, Kelly Criterion, 분산 투자
- **학습 시스템**: 거래 결과를 학습하여 전략 자동 개선
- **시뮬레이션 모드**: 실제 자금 없이 전략 테스트 가능

## 이 설명서를 활용하는 방법

1. **처음 사용자**: '빠른 시작 가이드'부터 시작하세요
2. **기본 설정**: 'API 키 발급'과 '초기 설정'을 완료하세요
3. **전략 수립**: '거래 전략 설정'에서 나만의 전략을 만드세요
4. **실전 적용**: 시뮬레이션으로 충분히 테스트 후 실거래를 시작하세요

<div class="info">
💡 **팁**: 좌측 메뉴를 통해 필요한 섹션으로 바로 이동할 수 있습니다.
</div>
    `,
  },
  ...finalDocContents
};