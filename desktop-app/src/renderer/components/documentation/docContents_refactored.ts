// 리팩토링된 문서 통합 파일
// 모든 섹션별 문서를 하나로 통합

// Import all section contents
import { gettingStartedContents } from './docContents_gettingStarted';
import { initialSetupContents } from './docContents_initialSetup';
import { coreConceptsContents } from './docContents_coreConsepts';
import { interfaceContents } from './docContents_interface';
import { tradingStrategyContents } from './docContents_tradingStrategy';
import { advancedStrategiesContents } from './docContents_advancedStrategies';
import { allFeaturesContents } from './docContents_allFeatures';

// 기존 파일에서 추가로 필요한 섹션들 (간소화된 버전)
const additionalContents = {
  // 시작하기 섹션 개요
  'getting-started': {
    title: '시작하기',
    content: `
# 시작하기 🚀

Upbit AI Trading에 오신 것을 환영합니다! 이 섹션에서는 프로그램을 시작하는 데 필요한 모든 정보를 제공합니다.

## 주요 내용

- **소개**: 프로그램의 핵심 기능과 특징
- **빠른 시작**: 5분 안에 거래 시작하기
- **요구사항**: 시스템 요구사항 확인
- **설치 가이드**: 단계별 설치 방법
- **면책조항**: 중요한 법적 고지사항

시작할 준비가 되셨나요? 아래 항목들을 차례대로 확인해보세요!
    `
  },
  
  // 초기 설정 섹션 개요
  'initial-setup': {
    title: '초기 설정',
    content: `
# 초기 설정 ⚙️

거래를 시작하기 전에 필요한 모든 설정을 안내합니다.

## 설정 단계

1. **Upbit API 설정**: 거래소 연동을 위한 API 키 발급
2. **Claude API 설정**: AI 분석을 위한 API 키 설정
3. **API 권한 설정**: 안전한 거래를 위한 권한 관리
4. **보안 설정**: 계정 보호를 위한 보안 조치
5. **2FA 설정**: 이중 인증으로 보안 강화

각 단계는 필수이며, 순서대로 진행하시는 것을 권장합니다.
    `
  },
  
  // 핵심 개념 섹션 개요
  'core-concepts': {
    title: '핵심 개념',
    content: `
# 핵심 개념 📚

성공적인 자동 거래를 위해 알아야 할 핵심 개념들을 소개합니다.

## 주요 개념

- **기술적 지표**: RSI, MACD, 볼린저밴드 등
- **고급 지표**: 이치모쿠, ADX, OBV 등
- **패턴 인식**: 캔들스틱 패턴, 차트 패턴
- **AI 분석**: 머신러닝 기반 예측
- **신뢰도 시스템**: 거래 신호의 신뢰성 평가
- **시장 상황 분석**: 시장 환경에 따른 전략 조정

이 개념들을 이해하면 더 효과적인 거래 전략을 수립할 수 있습니다.
    `
  },
  
  // 화면 구성 섹션 개요
  'interface': {
    title: '화면 구성',
    content: `
# 화면 구성 🖥️

프로그램의 각 화면과 기능을 자세히 알아봅니다.

## 주요 화면

- **대시보드**: 전체 거래 현황 한눈에 보기
- **포트폴리오**: 보유 자산 관리
- **설정**: 거래 전략 및 시스템 설정
- **차트**: 실시간 가격 차트와 분석
- **다크 모드**: 눈의 피로를 줄이는 테마

각 화면의 세부 기능과 활용법을 확인해보세요.
    `
  },
  
  // 거래 전략 설정 섹션 개요
  'trading-strategy': {
    title: '거래 전략 설정',
    content: `
# 거래 전략 설정 📈

수익을 극대화하고 리스크를 최소화하는 거래 전략 설정 방법입니다.

## 주요 설정

- **글로벌 vs 코인별 설정**: 전체 또는 개별 설정
- **매수/매도 조건**: 진입 및 청산 조건
- **신뢰도 임계값**: 거래 실행 기준
- **쿨다운 설정**: 과도한 거래 방지
- **손절/익절**: 리스크 관리
- **트레일링 스톱**: 이익 보호
- **스마트 주문**: 최적 체결을 위한 고급 주문

각자의 투자 성향에 맞는 전략을 설정해보세요.
    `
  },
  
  // 고급 거래 전략 섹션 개요
  'advanced-strategies': {
    title: '고급 거래 전략',
    content: `
# 고급 거래 전략 🎯

경험 많은 트레이더를 위한 고급 전략들을 소개합니다.

## 고급 전략

- **그리드 트레이딩**: 변동성 활용 전략
- **DCA 전략**: 분할 매수로 리스크 분산
- **모멘텀 트레이딩**: 추세 추종 전략
- **평균 회귀**: 과매수/과매도 활용
- **전략 조합**: 여러 전략의 시너지

고급 전략은 충분한 이해와 백테스트 후 사용하시기 바랍니다.
    `
  },
  
  // 백테스트 섹션 개요
  'backtest': {
    title: '백테스트',
    content: `
# 백테스트 📊

과거 데이터로 전략을 검증하는 백테스트 시스템입니다.

## 주요 기능

- **백테스트 설정**: 기간, 수수료, 슬리피지 설정
- **결과 분석**: 수익률, 리스크, 거래 통계
- **최적화**: 파라미터 조정으로 성과 개선

백테스트는 실전 투자 전 필수 과정입니다!
    `
  },
  
  // AI 학습 시스템 섹션 개요
  'ai-learning': {
    title: 'AI 학습 시스템',
    content: `
# AI 학습 시스템 🤖

AI가 거래 패턴을 학습하여 전략을 지속적으로 개선합니다.

## 학습 기능

- **학습 활성화**: AI 학습 시작하기
- **학습 과정**: 데이터 수집부터 전략 최적화까지
- **성과 모니터링**: 학습 효과 추적

AI 학습은 시간이 지날수록 더 정확해집니다!
    `
  },
  
  // 리스크 관리 섹션 개요
  'risk-management': {
    title: '리스크 관리',
    content: `
# 리스크 관리 🛡️

성공적인 투자의 핵심은 리스크 관리입니다.

## 리스크 관리 도구

- **리스크 개요**: 주요 리스크 유형과 대응
- **자동 손절**: 손실 제한 시스템
- **포지션 관리**: 적정 투자 규모 유지
- **Kill Switch**: 긴급 상황 대응

리스크 관리 없는 투자는 도박과 같습니다!
    `
  },
  
  // 뉴스 & 감성 분석 섹션 개요
  'news-analysis': {
    title: '뉴스 & 감성 분석',
    content: `
# 뉴스 & 감성 분석 📰

AI가 뉴스와 소셜미디어를 분석하여 시장 심리를 파악합니다.

## 분석 기능

- **감성 분석**: 시장 심리 점수화
- **뉴스 영향도**: 중요 뉴스 실시간 추적
- **거래 신호**: 감성 지표 기반 매매 신호

뉴스는 단기 가격에 큰 영향을 미칩니다!
    `
  },
  
  // 알림 시스템 섹션 개요
  'notification': {
    title: '알림 시스템',
    content: `
# 알림 시스템 🔔

중요한 이벤트를 놓치지 않도록 알림을 설정하세요.

## 알림 기능

- **알림 종류**: 거래, 시스템, 리스크 알림
- **알림 방법**: 팝업, 소리, 이메일 등
- **우선순위 관리**: 중요도별 알림 설정

적절한 알림은 시기적절한 대응을 가능하게 합니다!
    `
  },
  
  // 문제 해결 섹션 개요
  'troubleshooting': {
    title: '문제 해결',
    content: `
# 문제 해결 🔧

프로그램 사용 중 발생할 수 있는 문제들의 해결 방법입니다.

## 주요 내용

- **자주 발생하는 오류**: API, 거래, 시스템 오류
- **로그 확인**: 문제 원인 파악하기
- **성능 최적화**: 프로그램 속도 개선

대부분의 문제는 간단히 해결할 수 있습니다!
    `
  },
  
  // 참고 자료 섹션 개요
  'reference': {
    title: '참고 자료',
    content: `
# 참고 자료 📚

거래에 도움이 되는 추가 정보와 자료입니다.

## 제공 자료

- **용어 사전**: 거래 및 기술 용어 설명
- **FAQ**: 자주 묻는 질문과 답변
- **추천 자료**: 학습 자료 및 커뮤니티

지속적인 학습이 성공적인 투자의 비결입니다!
    `
  },
  
  // 백테스트 섹션
  'backtest.backtest-setup': {
    title: '백테스트 설정',
    content: `
# 백테스트 설정 가이드 📊

## 백테스트란?

과거 데이터를 이용하여 거래 전략의 성과를 검증하는 과정입니다.

## 기본 설정

### 백테스트 기간
\`\`\`yaml
추천 기간:
  - 최소: 3개월
  - 권장: 1년
  - 이상적: 2-3년 (다양한 시장 환경 포함)

주의사항:
  - 불장만 포함 금지
  - 곰장 구간 포함 필수
  - 횡보장 구간 포함
\`\`\`

### 수수료 반영
\`\`\`yaml
수수료 설정:
  메이커: 0.05%
  테이커: 0.05%
  슬리피지: 0.1%
  
실제 반영:
  - 모든 거래에 수수료 적용
  - 슬리피지 포함
  - 세금 고려 (국가별 다름)
\`\`\`

## 결과 분석

### 핵심 지표
\`\`\`yaml
수익률:
  - 총 수익률
  - 연간 수익률
  - 월별 수익률

리스크:
  - 최대 낙폭 (Max Drawdown)
  - 변동성
  - 샤프 비율

거래:
  - 총 거래 횟수
  - 승률
  - 평균 수익/손실
\`\`\`

💡 **핵심**: 백테스트는 과거입니다. 미래 성과를 보장하지 않으므로 참고용으로만 활용하세요!
    `,
  },

  // AI 학습 섹션
  'ai-learning.learning-activation': {
    title: '학습 시스템 활성화',
    content: `
# AI 학습 시스템 활성화 🤖

## 학습 시스템 개요

AI가 거래 결과를 분석하여 전략을 지속적으로 개선하는 시스템입니다.

## 활성화 방법

### 기본 설정
\`\`\`yaml
설정 위치: 설정 → AI 학습

기본 옵션:
  학습 활성화: ON/OFF
  학습 주기: 일일/주간
  학습 데이터: 최근 N일
  가중치 조정: 자동/수동
\`\`\`

### 학습 과정
\`\`\`python
학습 단계:
1. 거래 결과 수집
2. 성공/실패 패턴 분석
3. 가중치 조정
4. 전략 최적화
5. 백테스트 검증
6. 실전 적용
\`\`\`

## 학습 효과

### 개선 영역
- 진입 타이밍 정확도 향상
- 손절 타이밍 최적화
- 시장 상황별 적응
- 코인별 특성 학습

### 모니터링
- 학습 진행도
- 성과 개선률
- 신뢰도 변화
- 전략 진화 과정

💡 **핵심**: AI 학습은 시간이 필요합니다. 최소 1개월 이상의 데이터가 쌓여야 효과를 볼 수 있습니다!
    `,
  },

  // 리스크 관리 섹션  
  'risk-management.overview': {
    title: '리스크 관리 개요',
    content: `
# 리스크 관리 시스템 🛡️

## 리스크 관리의 중요성

성공적인 투자의 핵심은 수익을 늘리는 것이 아니라 손실을 줄이는 것입니다.

## 주요 리스크 유형

### 시장 리스크
\`\`\`yaml
가격 변동성:
  - 암호화폐 고유 특성
  - 예측 불가능한 급변동
  - 24시간 거래

대응 방법:
  - 포지션 크기 제한
  - 분산 투자
  - 손절선 설정
\`\`\`

### 기술적 리스크
\`\`\`yaml
시스템 장애:
  - API 연결 오류
  - 프로그램 버그
  - 네트워크 문제

대응 방법:
  - 모니터링 시스템
  - 백업 계획
  - 수동 개입 준비
\`\`\`

### 유동성 리스크
\`\`\`yaml
거래 불가:
  - 저유동성 코인
  - 시장 패닉
  - 거래소 문제

대응 방법:
  - 주요 코인 중심
  - 여러 거래소 활용
  - 비상 자금 준비
\`\`\`

## 리스크 관리 도구

### 자동 손절
- 실시간 모니터링
- 즉시 실행
- 감정 배제

### 포지션 관리
- 최대 투자 한도
- 분산 투자
- 상관관계 고려

### Kill Switch
- 긴급 상황 대응
- 전체 포지션 청산
- 시스템 보호

💡 **핵심**: 리스크 관리는 보험입니다. 필요 없어 보일 때가 바로 가장 필요할 때입니다!
    `,
  },

  // 뉴스 분석 섹션
  'news-analysis.sentiment-analysis': {
    title: 'AI 감성 분석',
    content: `
# AI 감성 분석 시스템 📰

## 감성 분석이란?

뉴스, 소셜미디어 등의 텍스트를 분석하여 시장 심리를 파악하는 AI 기술입니다.

## 분석 소스

### 뉴스 매체
\`\`\`yaml
국내:
  - 블록미디어
  - 토큰포스트
  - 디센터

해외:
  - CoinDesk
  - CoinTelegraph
  - Bloomberg Crypto
\`\`\`

### 소셜 미디어
\`\`\`yaml
플랫폼:
  - 트위터
  - 레딧
  - 텔레그램
  - 디스코드

분석 요소:
  - 언급 빈도
  - 감정 점수
  - 영향력 있는 계정
  - 트렌드 변화
\`\`\`

## 감성 점수

### 점수 체계
\`\`\`yaml
점수 범위: -100 ~ +100

구간별 의미:
  +80 ~ +100: 극도의 낙관
  +60 ~ +79: 강한 낙관
  +20 ~ +59: 약한 낙관
  -20 ~ +19: 중립
  -20 ~ -59: 약한 비관
  -60 ~ -79: 강한 비관
  -80 ~ -100: 극도의 비관
\`\`\`

### 거래 신호
\`\`\`python
def generate_sentiment_signal(sentiment_score):
    if sentiment_score > 80:
        return "매도 고려"  # 과도한 낙관
    elif sentiment_score < -80:
        return "매수 고려"  # 과도한 비관
    else:
        return "중립"
\`\`\`

## 활용 전략

### 역방향 지표
- 극도의 낙관 → 매도 신호
- 극도의 비관 → 매수 신호
- 대중과 반대로 행동

### 추세 확인
- 상승 중 긍정적 뉴스 → 지속 가능성
- 하락 중 부정적 뉴스 → 바닥 확인 필요

💡 **핵심**: 뉴스는 과거이고, 가격은 미래입니다. 감성 분석은 참고만 하세요!
    `,
  },

  // 알림 시스템 섹션
  'notification.notification-types': {
    title: '알림 종류',
    content: `
# 알림 시스템 가이드 🔔

## 알림 종류

### 거래 알림
\`\`\`yaml
매수/매도 체결:
  - 체결 즉시 알림
  - 체결가, 수량 표시
  - 수익률 표시

주문 실패:
  - 잔고 부족
  - 시장가 한도 초과
  - API 오류
\`\`\`

### 시스템 알림
\`\`\`yaml
연결 상태:
  - API 연결 끊김
  - 네트워크 오류
  - 재연결 성공

성과 알림:
  - 일일 수익률
  - 주간 요약
  - 월간 리포트
\`\`\`

### 리스크 알림
\`\`\`yaml
손실 경고:
  - 일일 손실 한도 근접
  - 연속 손실 발생
  - 드로다운 증가

기회 알림:
  - 고신뢰도 신호
  - 급등/급락 감지
  - 뉴스 이벤트
\`\`\`

## 알림 방법

### 프로그램 내 알림
- 팝업 창
- 시스템 트레이
- 사운드 알림

### 외부 알림
- 이메일
- SMS (별도 설정)
- 텔레그램 봇

## 알림 설정

### 우선순위 관리
\`\`\`yaml
긴급 (빨간색):
  - 시스템 오류
  - 큰 손실
  - 연결 끊김

중요 (노란색):
  - 거래 체결
  - 목표 달성
  - 리밸런싱

정보 (파란색):
  - 일반 분석
  - 시장 동향
  - 성과 리포트
\`\`\`

### Do Not Disturb
- 수면 시간 설정
- 중요 알림만 허용
- 주말 모드

💡 **핵심**: 너무 많은 알림은 오히려 방해가 됩니다. 꼭 필요한 것만 설정하세요!
    `,
  },

  // 문제 해결 섹션
  'troubleshooting.common-errors': {
    title: '자주 발생하는 오류',
    content: `
# 자주 발생하는 오류 및 해결 방법 🔧

## API 관련 오류

### "Invalid API Key"
\`\`\`yaml
원인:
  - 잘못된 API 키
  - 키 앞뒤 공백
  - 만료된 키

해결방법:
  1. API 키 재확인
  2. 공백 제거
  3. 새로운 키 발급
  4. 권한 설정 확인
\`\`\`

### "Insufficient Balance"
\`\`\`yaml
원인:
  - 잔고 부족
  - 수수료 미고려
  - 다른 주문에서 사용 중

해결방법:
  1. 잔고 확인
  2. 수수료 포함 계산
  3. 미체결 주문 취소
  4. 투자금액 조정
\`\`\`

## 거래 오류

### 체결 실패
\`\`\`yaml
원인:
  - 가격 변동
  - 유동성 부족
  - 시장 마감

해결방법:
  - 시장가 주문 고려
  - 지정가 조정
  - 거래 시간 확인
\`\`\`

### 지연 발생
\`\`\`yaml
원인:
  - 네트워크 지연
  - 서버 과부하
  - API 제한

해결방법:
  - 네트워크 상태 확인
  - 시간 간격 조정
  - 동시 요청 수 제한
\`\`\`

## 시스템 오류

### 프로그램 멈춤
\`\`\`yaml
해결 순서:
  1. 작업 관리자 확인
  2. 프로그램 재시작
  3. 로그 파일 확인
  4. 시스템 재부팅
\`\`\`

### 메모리 부족
\`\`\`yaml
증상:
  - 느린 반응
  - 프로그램 다운
  - 차트 끊김

해결:
  - 불필요한 프로그램 종료
  - 차트 개수 줄이기
  - 시스템 최적화
\`\`\`

## 로그 확인

### 로그 위치
\`\`\`yaml
Windows:
  %APPDATA%\\UpbitAI\\logs\\

macOS:
  ~/Library/Application Support/UpbitAI/logs/

Linux:
  ~/.config/UpbitAI/logs/
\`\`\`

### 중요한 로그
- error.log: 오류 정보
- trading.log: 거래 기록
- api.log: API 통신 기록

💡 **핵심**: 문제 발생 시 당황하지 말고 로그를 확인하는 습관을 기르세요!
    `,
  },

  // 참고 자료 섹션
  'reference.glossary': {
    title: '용어 사전',
    content: `
# 용어 사전 📚

## 거래 용어

### 기본 용어
\`\`\`yaml
OHLCV:
  - Open: 시가
  - High: 고가
  - Low: 저가
  - Close: 종가
  - Volume: 거래량

주문 유형:
  - 시장가: 현재 가격으로 즉시 거래
  - 지정가: 원하는 가격에 예약 주문
  - 조건부: 특정 조건 만족 시 실행
\`\`\`

### 기술 분석
\`\`\`yaml
지지선: 가격 하락을 막는 심리적 저항점
저항선: 가격 상승을 막는 심리적 저항점
돌파: 지지선/저항선을 뚫고 지나가는 현상
되돌림: 일시적으로 반대 방향으로 움직임

골든크로스: 단기 이평선이 장기 이평선 위로
데드크로스: 단기 이평선이 장기 이평선 아래로
\`\`\`

## 리스크 관리

### 핵심 개념
\`\`\`yaml
손절: 손실을 제한하기 위한 매도
익절: 이익을 확정하기 위한 매도
트레일링 스톱: 이익 보호하는 동적 손절

포지션: 보유하고 있는 투자 상품
레버리지: 빌린 돈으로 투자 규모 확대
마진: 레버리지 거래 시 담보금
\`\`\`

### 측정 지표
\`\`\`yaml
VaR: Value at Risk, 예상 최대 손실
샤프 비율: 위험 대비 수익률
드로다운: 최고점 대비 하락폭
변동성: 가격 변화의 표준편차
\`\`\`

## AI 및 기술

### 머신러닝
\`\`\`yaml
지도학습: 정답이 있는 데이터로 학습
비지도학습: 정답 없이 패턴 발견
강화학습: 시행착오를 통한 학습

오버피팅: 과도한 학습으로 일반화 실패
백테스트: 과거 데이터로 전략 검증
워크아웃: 실제 시장에서 전략 검증
\`\`\`

### 알고리즘
\`\`\`yaml
TWAP: 시간 가중 평균가
VWAP: 거래량 가중 평균가
DCA: 정액 분할 매수
그리드: 일정 간격 매수/매도 배치

API: 프로그램 간 통신 인터페이스
봇: 자동화된 거래 프로그램
백오더: 미체결된 주문
슬리피지: 예상가와 실제 체결가 차이
\`\`\`

💡 **핵심**: 용어를 정확히 이해하면 거래 전략도 더 명확해집니다!
    `,
  },

  'reference.faq': {
    title: 'FAQ (자주 묻는 질문)',
    content: `
# FAQ (자주 묻는 질문) ❓

## 시작하기

### Q: 최소 투자금액은 얼마인가요?
\`\`\`
A: 기술적으로는 10만원부터 가능하지만, 
   수수료와 분산투자를 고려하면 100만원 이상을 권장합니다.
   
   이유:
   - 수수료 비중 최소화
   - 여러 코인 분산투자
   - 리스크 관리 여유
\`\`\`

### Q: 수익률은 얼마나 되나요?
\`\`\`
A: 수익률은 보장할 수 없습니다.
   
   참고 통계:
   - 보수적 설정: 연 5-15%
   - 일반적 설정: 연 10-30%
   - 공격적 설정: 연 20-50% (고위험)
   
   주의: 과거 성과는 미래를 보장하지 않습니다.
\`\`\`

### Q: 24시간 컴퓨터를 켜두어야 하나요?
\`\`\`
A: 네, 암호화폐 시장은 24시간 거래되므로
   최상의 결과를 위해서는 지속적인 작동이 필요합니다.
   
   대안:
   - 저전력 미니PC 사용
   - 클라우드 서버 활용
   - 절전 모드 설정
\`\`\`

## 설정 및 사용

### Q: 어떤 코인을 선택해야 하나요?
\`\`\`
A: 초보자는 메이저 코인부터 시작하세요.
   
   추천 순서:
   1. BTC, ETH (가장 안정적)
   2. BNB, XRP, ADA (중간 위험)
   3. 소형 알트코인 (고위험)
   
   기준:
   - 높은 거래량
   - 안정적인 역사
   - 명확한 용도
\`\`\`

### Q: 신뢰도 임계값은 어떻게 설정하나요?
\`\`\`
A: 거래 경험과 성향에 따라 조정하세요.
   
   초보자: 80% (안전)
   중급자: 70% (균형)
   고급자: 60% (공격적)
   
   주의: 너무 낮으면 잦은 거래로 수수료 부담
\`\`\`

### Q: 손절선은 몇 %로 설정해야 하나요?
\`\`\`
A: 코인의 변동성에 따라 조정하세요.
   
   BTC: -3~5%
   ETH: -5~7%
   알트코인: -7~10%
   
   변동성이 클수록 넓게 설정
\`\`\`

## 문제 해결

### Q: 거래가 전혀 발생하지 않아요
\`\`\`
A: 다음을 확인해보세요:
   
   1. API 연결 상태
   2. 신뢰도 임계값 (너무 높지 않은지)
   3. 투자 가능 잔고
   4. 코인 선택 (거래량 충분한지)
   5. 시장 상황 (극도로 안정적이지 않은지)
\`\`\`

### Q: 계속 손실만 발생해요
\`\`\`
A: 다음을 점검해보세요:
   
   1. 설정 검토:
      - 신뢰도 임계값 상향
      - 손절선 더 타이트하게
      - 투자금액 축소
      
   2. 시장 환경:
      - 강한 하락장에서는 어려움
      - 시뮬레이션 모드로 전환 고려
      
   3. 전략 변경:
      - 다른 지표 조합 시도
      - AI 가중치 조정
\`\`\`

### Q: 프로그램이 자주 멈춰요
\`\`\`
A: 시스템 최적화가 필요합니다.
   
   1. 하드웨어:
      - 메모리 4GB 이상
      - 안정적인 인터넷
      - SSD 사용 권장
      
   2. 소프트웨어:
      - 바이러스 백신 예외 등록
      - 불필요한 프로그램 종료
      - Windows 업데이트
\`\`\`

## 고급 사용법

### Q: 여러 전략을 동시에 사용할 수 있나요?
\`\`\`
A: 네, 가능합니다.
   
   방법:
   - 자본을 나누어 배분
   - 각각 다른 설정 적용
   - 포트폴리오 관리 모드 사용
   
   주의:
   - 복잡도 증가
   - 관리 부담
   - 상호 간섭 가능성
\`\`\`

### Q: 세금은 어떻게 계산하나요?
\`\`\`
A: 국가별로 다르므로 세무 전문가 상담 권장
   
   한국 기준 (2024년):
   - 가상자산 소득세
   - 연간 250만원 기본공제
   - 250만원 초과분에 20% 세율
   
   주의: 세법은 계속 변화하므로 최신 정보 확인 필요
\`\`\`

💡 **더 궁금한 점이 있으시면 공식 커뮤니티나 고객지원에 문의하세요!**
    `,
  },
};

// 통합된 모든 문서 컨텐츠
export const allDocContents = {
  ...gettingStartedContents,
  ...initialSetupContents,
  ...coreConceptsContents,
  ...interfaceContents,
  ...tradingStrategyContents,
  ...advancedStrategiesContents,
  ...allFeaturesContents,
  ...additionalContents
};

// 섹션별 카테고리 정의
export const documentSections = {
  'getting-started': {
    title: '시작하기',
    items: [
      'getting-started.introduction',
      'getting-started.quick-start',
      'getting-started.requirements',
      'getting-started.installation',
      'getting-started.disclaimer'
    ]
  },
  'initial-setup': {
    title: '초기 설정',
    items: [
      'initial-setup.upbit-api',
      'initial-setup.claude-api',
      'initial-setup.api-permissions',
      'initial-setup.security',
      'initial-setup.2fa-setup'
    ]
  },
  'core-concepts': {
    title: '핵심 개념',
    items: [
      'core-concepts.technical-indicators',
      'core-concepts.advanced-indicators',
      'core-concepts.pattern-recognition',
      'core-concepts.ai-analysis',
      'core-concepts.confidence-system',
      'core-concepts.market-conditions'
    ]
  },
  'interface': {
    title: '화면 구성',
    items: [
      'interface.dashboard',
      'interface.portfolio',
      'interface.settings',
      'interface.charts',
      'interface.dark-mode'
    ]
  },
  'trading-strategy': {
    title: '거래 전략 설정',
    items: [
      'trading-strategy.global-vs-coin',
      'trading-strategy.buy-sell-conditions',
      'trading-strategy.confidence-threshold',
      'trading-strategy.cooldown',
      'trading-strategy.stop-loss-take-profit',
      'trading-strategy.trailing-stop',
      'trading-strategy.smart-order'
    ]
  },
  'advanced-strategies': {
    title: '고급 거래 전략',
    items: [
      'advanced-strategies.grid-trading',
      'advanced-strategies.dca-strategy',
      'advanced-strategies.momentum-trading',
      'advanced-strategies.mean-reversion',
      'advanced-strategies.strategy-combination',
      'advanced-strategies.market-correlation',
      'advanced-strategies.news-analysis'
    ]
  },
  'backtest': {
    title: '백테스트',
    items: [
      'backtest.backtest-setup'
    ]
  },
  'ai-learning': {
    title: 'AI 학습 시스템',
    items: [
      'ai-learning.learning-activation'
    ]
  },
  'risk-management': {
    title: '리스크 관리',
    items: [
      'risk-management.overview'
    ]
  },
  'news-analysis': {
    title: '뉴스 & 감성 분석',
    items: [
      'news-analysis.sentiment-analysis'
    ]
  },
  'notification': {
    title: '알림 시스템',
    items: [
      'notification.notification-types'
    ]
  },
  'troubleshooting': {
    title: '문제 해결',
    items: [
      'troubleshooting.common-errors'
    ]
  },
  'reference': {
    title: '참고 자료',
    items: [
      'reference.glossary',
      'reference.faq'
    ]
  },
  'all-features': {
    title: '전체 기능 가이드',
    items: [
      'all-features.overview'
    ]
  }
};

// 검색을 위한 키워드 매핑
export const searchKeywords = {
  // 시작하기
  '시작': ['getting-started.introduction', 'getting-started.quick-start'],
  '설치': ['getting-started.installation', 'getting-started.requirements'],
  '요구사항': ['getting-started.requirements'],
  
  // API 설정
  'api': ['initial-setup.upbit-api', 'initial-setup.claude-api'],
  '업비트': ['initial-setup.upbit-api'],
  'claude': ['initial-setup.claude-api'],
  '보안': ['initial-setup.security', 'initial-setup.2fa-setup'],
  
  // 기술 분석
  'rsi': ['core-concepts.technical-indicators'],
  'macd': ['core-concepts.technical-indicators'],
  '볼린저': ['core-concepts.technical-indicators'],
  '패턴': ['core-concepts.pattern-recognition'],
  'ai': ['core-concepts.ai-analysis'],
  
  // 거래 전략
  '매수': ['trading-strategy.buy-sell-conditions'],
  '매도': ['trading-strategy.buy-sell-conditions'],
  '손절': ['trading-strategy.stop-loss-take-profit'],
  '익절': ['trading-strategy.stop-loss-take-profit'],
  '트레일링': ['trading-strategy.trailing-stop'],
  
  // 고급 전략
  '그리드': ['advanced-strategies.grid-trading'],
  'dca': ['advanced-strategies.dca-strategy'],
  '모멘텀': ['advanced-strategies.momentum-trading'],
  
  // 기타
  '백테스트': ['backtest.backtest-setup'],
  '리스크': ['risk-management.overview'],
  '뉴스': ['news-analysis.sentiment-analysis'],
  '알림': ['notification.notification-types'],
  '오류': ['troubleshooting.common-errors'],
  '용어': ['reference.glossary'],
  'faq': ['reference.faq']
};

export default allDocContents;