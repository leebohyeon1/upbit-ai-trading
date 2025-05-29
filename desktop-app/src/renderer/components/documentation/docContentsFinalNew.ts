// 모든 문서 내용을 통합하는 파일
import { gettingStartedContents } from './docContents_new_part1';
import { initialSetupContents } from './docContents_new_part2';
import { coreConcepts, patternRecognition } from './docContents_new_part3';
import { interfaceContents } from './docContents_new_part4';
import { 
  tradingStrategyContents,
  coinSettingsContents 
} from './docContents_new_part5';
import { 
  autoTradingContents,
  calculationsContents 
} from './docContents_new_part6';
import { 
  simulationContents,
  learningContents 
} from './docContents_new_part7';
import { 
  backtestContents,
  riskManagementOverview,
  aiLearningExtendedContents 
} from './docContents_new_part8';
import { riskManagementContents } from './docContents_new_part9';
import { killSwitchContents } from './docContents_killSwitch';
import { smartOrderContents } from './docContents_smartOrder';

// 나머지 빈 섹션들에 대한 기본 내용
const notificationContents = {
  'notifications': {
    title: '알림 시스템',
    content: `
# 알림 시스템

## 알림 기능 개요
프로그램의 주요 이벤트를 실시간으로 알려드립니다.

### 지원하는 알림 방식
- Windows 시스템 알림
- 프로그램 내 알림 패널
- 로그 파일 기록

<div class="info">
💡 알림 설정은 설정 > 알림에서 관리할 수 있습니다.
</div>
    `,
  },
  'notifications.notification-types': {
    title: '알림 종류',
    content: `
# 알림 종류

## 거래 관련 알림
- **매수 완료**: 매수 주문이 체결되었을 때
- **매도 완료**: 매도 주문이 체결되었을 때
- **손절 실행**: 손절 조건이 충족되어 매도했을 때
- **익절 실행**: 익절 목표에 도달하여 매도했을 때

## 시스템 알림
- **API 연결 상태**: 연결 끊김/복구 시
- **오류 발생**: 시스템 오류 발생 시
- **일일 리포트**: 매일 자정 거래 결과 요약

## 시장 알림
- **급등/급락**: 설정한 변동률 초과 시
- **거래량 급증**: 비정상적 거래량 감지 시
    `,
  },
  'notifications.notification-settings': {
    title: '알림 설정 방법',
    content: `
# 알림 설정 방법

## 설정 화면 접근
1. 좌측 메뉴에서 '설정' 클릭
2. '알림' 탭 선택

## 알림별 설정
각 알림 유형별로 켜기/끄기 가능

### 중요도 설정
- **높음**: 모든 알림 표시
- **중간**: 중요 알림만 표시
- **낮음**: 긴급 알림만 표시

## 방해 금지 시간
특정 시간대에 알림을 받지 않도록 설정 가능
    `,
  },
  'notifications.windows-notifications': {
    title: 'Windows 알림',
    content: `
# Windows 알림

## Windows 10/11 알림 설정
1. Windows 설정 > 시스템 > 알림
2. 앱별 알림에서 'Upbit AI Trading' 찾기
3. 알림 허용 켜기

## 알림 센터
Windows 알림 센터에서 놓친 알림 확인 가능

## 문제 해결
- 알림이 표시되지 않을 때: Windows 알림 설정 확인
- 소리가 나지 않을 때: 볼륨 및 소리 설정 확인
    `,
  },
};

const troubleshootingContents = {
  'troubleshooting': {
    title: '문제 해결',
    content: `
# 문제 해결

## 일반적인 문제 해결 방법

### 1단계: 프로그램 재시작
대부분의 일시적 오류는 재시작으로 해결됩니다.

### 2단계: 로그 확인
설정 > 로그에서 상세한 오류 내용을 확인하세요.

### 3단계: API 키 확인
API 키가 올바르게 입력되었는지 확인하세요.

<div class="warning">
⚠️ 문제가 지속되면 GitHub Issues에 문의해주세요.
</div>
    `,
  },
  'troubleshooting.common-errors': {
    title: '자주 발생하는 오류',
    content: `
# 자주 발생하는 오류

## API 키 관련
- **Invalid API Key**: API 키가 잘못되었습니다
- **Insufficient Permission**: API 권한이 부족합니다
- **API Rate Limit**: API 호출 한도 초과

## 거래 관련
- **Insufficient Balance**: 잔액 부족
- **Order Failed**: 주문 실패
- **Market Closed**: 시장 점검 중

## 해결 방법
각 오류별 상세한 해결 방법은 해당 메시지를 클릭하세요.
    `,
  },
  'troubleshooting.api-issues': {
    title: 'API 연결 문제',
    content: `
# API 연결 문제

## Upbit API 연결 문제
1. API 키와 시크릿 키 확인
2. IP 주소 등록 확인
3. 네트워크 연결 상태 확인

## Claude API 연결 문제
1. API 키 유효성 확인
2. 크레딧 잔액 확인
3. API 버전 호환성 확인

## 네트워크 문제
- 방화벽 설정 확인
- 프록시 설정 확인
- DNS 설정 확인
    `,
  },
  'troubleshooting.trade-failures': {
    title: '거래 실패 분석',
    content: `
# 거래 실패 분석

## 주문 실패 원인
1. **잔액 부족**: 매수 가능 금액 확인
2. **최소 주문 금액**: 5,000원 이상
3. **시장가/지정가**: 주문 유형 확인
4. **거래 정지**: 해당 코인 거래 가능 여부

## 실패 로그 분석
- 설정 > 로그 > 거래 로그에서 상세 내용 확인
- 오류 코드별 의미 파악
- 패턴 분석으로 반복 실패 방지

## 예방 방법
- 충분한 예비 자금 확보
- 주문 전 잔액 확인 로직
- 예외 처리 강화
    `,
  },
  'troubleshooting.performance-tips': {
    title: '성능 최적화',
    content: `
# 성능 최적화

## CPU 사용량 줄이기
- 분석 주기 조정 (60초 → 120초)
- 동시 분석 코인 수 제한
- 불필요한 지표 비활성화

## 메모리 사용량 줄이기
- 차트 데이터 기간 단축
- 로그 자동 정리 활성화
- 캐시 주기적 정리

## 네트워크 최적화
- API 호출 최소화
- 데이터 압축 사용
- 캐싱 활용

## 권장 사양
- CPU: 4코어 이상
- RAM: 8GB 이상
- 네트워크: 안정적인 유선 연결
    `,
  },
};

const advancedContents = {
  'advanced': {
    title: '고급 기능',
    content: `
# 고급 기능

## 프로급 트레이더를 위한 기능

### 시장 미시구조 분석
- 호가창 불균형 분석
- 체결 강도 모니터링
- 스프레드 패턴 인식

### AI 기반 예측
- 가격 움직임 예측
- 변동성 예측
- 거래량 이상 감지

### 자동화 도구
- 전략 스크립팅
- 백테스트 자동화
- 포트폴리오 리밸런싱

<div class="info">
💡 고급 기능은 충분한 경험 후 사용하시기 바랍니다.
</div>
    `,
  },
  'advanced.market-correlation': {
    title: '시장 상관관계',
    content: `
# 시장 상관관계

## 상관관계 분석
- BTC 도미넌스 영향
- 알트코인 시즌 감지
- 섹터별 순환 패턴

## 활용 방법
1. 포트폴리오 다각화
2. 헤지 전략 수립
3. 시장 전환점 포착

## 상관계수 해석
- 1.0: 완전 양의 상관관계
- 0.0: 무상관
- -1.0: 완전 음의 상관관계
    `,
  },
  'advanced.news-analysis': {
    title: '뉴스 영향도 활용',
    content: `
# 뉴스 영향도 활용

## AI 뉴스 분석
Claude API를 통한 실시간 뉴스 감성 분석

## 영향도 측정
- 긍정/부정 점수
- 영향력 크기
- 시장 반응 예측

## 거래 전략 연동
- 부정 뉴스 시 포지션 축소
- 긍정 뉴스 시 진입 타이밍
- 루머 vs 공식 발표 구분
    `,
  },
  'advanced.whale-monitoring': {
    title: '고래 활동 모니터링',
    content: `
# 고래 활동 모니터링

## 대량 거래 감지
- 비정상적 거래량
- 대량 입출금
- 거래소 잔고 변화

## 고래 패턴 분석
- 축적 단계
- 분산 단계
- 시장 조작 패턴

## 대응 전략
- 고래 따라가기
- 역발상 전략
- 중립 포지션
    `,
  },
  'advanced.custom-strategies': {
    title: '커스텀 전략',
    content: `
# 커스텀 전략

## 전략 조합
여러 전략을 조합하여 나만의 전략 생성

## 조건 스크립팅
\`\`\`javascript
// 예시: RSI + MACD 조합
if (rsi < 30 && macd.histogram > 0) {
  // 매수 신호
}
\`\`\`

## 백테스트
커스텀 전략의 과거 성과 검증

## 최적화
파라미터 자동 최적화 기능
    `,
  },
};

const referenceContents = {
  'reference': {
    title: '참고 자료',
    content: `
# 참고 자료

## 유용한 정보 모음

### 트레이딩 기초
- 기술적 분석 이론
- 리스크 관리 원칙
- 심리적 요소

### 암호화폐 특성
- 24시간 거래
- 높은 변동성
- 규제 환경

### 추가 학습 자료
- 추천 도서
- 온라인 강의
- 커뮤니티

<div class="info">
💡 지속적인 학습이 성공적인 트레이딩의 열쇠입니다.
</div>
    `,
  },
  'reference.glossary': {
    title: '용어 사전',
    content: `
# 용어 사전

## ㄱ
- **가중치**: 각 지표의 중요도를 나타내는 수치
- **고래**: 대량의 암호화폐를 보유한 투자자
- **김프**: 김치 프리미엄, 한국 거래소의 가격 프리미엄

## ㄴ
- **낙폭**: 최고점 대비 하락 폭

## ㄷ
- **도미넌스**: 전체 시가총액 대비 특정 코인의 비중

## ㅁ
- **매집**: 대량 매수를 통한 물량 확보
- **물타기**: 평균 매수가를 낮추기 위한 추가 매수

## ㅂ
- **불마켓**: 상승장
- **베어마켓**: 하락장
- **볼린저밴드**: 가격 변동성을 나타내는 기술적 지표

## ㅅ
- **손절**: 손실을 제한하기 위한 매도
- **스캘핑**: 단기간 소폭의 이익을 노리는 매매
- **슬리피지**: 예상 가격과 실제 체결 가격의 차이

## ㅇ
- **익절**: 이익 실현을 위한 매도
- **이평선**: 이동평균선

## ㅈ
- **지지선**: 가격 하락을 막는 심리적 가격대
- **저항선**: 가격 상승을 막는 심리적 가격대

## ㅍ
- **포모(FOMO)**: Fear Of Missing Out, 기회를 놓칠까 봐 느끼는 두려움
- **펌핑**: 인위적인 가격 상승
    `,
  },
  'reference.faq': {
    title: 'FAQ',
    content: `
# 자주 묻는 질문 (FAQ)

## 일반 질문

### Q: 이 프로그램으로 수익이 보장되나요?
A: 아니요. 모든 투자는 원금 손실 위험이 있습니다. 이 프로그램은 도구일 뿐, 투자 결정과 책임은 사용자에게 있습니다.

### Q: 최소 투자 금액은 얼마인가요?
A: 업비트 최소 주문 금액인 5,000원부터 가능하지만, 안정적인 운용을 위해 최소 100만원 이상을 권장합니다.

### Q: API 키는 안전한가요?
A: API 키는 로컬에만 저장되며, 출금 권한이 없는 키만 사용하므로 안전합니다.

## 기술적 질문

### Q: 왜 60초마다 분석하나요?
A: API 호출 제한과 시장 변화 속도를 고려한 최적의 주기입니다.

### Q: 백테스트 결과를 믿을 수 있나요?
A: 과거 데이터 기반이므로 미래 수익을 보장하지 않습니다. 참고용으로만 활용하세요.

### Q: 여러 컴퓨터에서 사용할 수 있나요?
A: 네, 하지만 동시에 실행하면 중복 거래가 발생할 수 있으니 주의하세요.

## 거래 관련

### Q: 손절은 꼭 설정해야 하나요?
A: 강력히 권장합니다. 큰 손실을 방지하는 가장 중요한 안전장치입니다.

### Q: 24시간 켜놓아야 하나요?
A: 자동매매를 원한다면 그렇습니다. 안정적인 인터넷과 전원이 필요합니다.

### Q: 시뮬레이션과 실거래 차이가 큰가요?
A: 슬리피지, 체결 지연 등으로 약간의 차이가 있을 수 있습니다.
    `,
  },
  'reference.scenarios': {
    title: '실전 시나리오',
    content: `
# 실전 시나리오

## 시나리오 1: 상승장에서의 운용
### 상황
- BTC 도미넌스 하락
- 알트코인 거래량 증가
- 전반적인 상승 분위기

### 전략
1. 공격적인 포지션 (전체 자금의 70-80%)
2. 모멘텀 전략 중심
3. 트레일링 스탑으로 수익 보호

### 주의사항
- FOMO 주의
- 단계적 익절
- 과도한 레버리지 금지

## 시나리오 2: 하락장에서의 운용
### 상황
- 연속적인 하락
- 거래량 감소
- 공포 지수 상승

### 전략
1. 보수적 포지션 (전체 자금의 30-40%)
2. 현금 비중 확대
3. 단기 반등 노리기

### 주의사항
- 물타기 금지
- 엄격한 손절
- 장기 보유 지양

## 시나리오 3: 횡보장에서의 운용
### 상황
- 좁은 범위 등락
- 낮은 변동성
- 방향성 부재

### 전략
1. 박스권 매매
2. 그리드 트레이딩
3. 스캘핑 위주

### 주의사항
- 수수료 고려
- 박스권 이탈 시 빠른 대응
- 포지션 크기 제한

## 시나리오 4: 뉴스 이벤트 대응
### 상황
- 중요 발표 예정
- 규제 뉴스
- 해킹 사고

### 전략
1. 이벤트 전 포지션 정리
2. 뉴스 확인 후 진입
3. 변동성 확대 대비

### 주의사항
- 가짜 뉴스 확인
- 과도한 반응 주의
- 유동성 확인
    `,
  },
  'reference.tax-info': {
    title: '세금 관련 정보',
    content: `
# 세금 관련 정보

## 한국 암호화폐 과세 정책
### 2025년 시행 예정
- 양도소득세: 250만원 공제 후 20% 과세
- 분리과세 적용

### 과세 대상
- 암호화폐 매매 차익
- 스테이킹 보상
- 에어드랍 수익

## 세금 계산 예시
\`\`\`
연간 수익: 1,000만원
기본 공제: -250만원
과세 대상: 750만원
세금: 750만원 × 20% = 150만원
\`\`\`

## 절세 방법
1. **장기 보유**: 향후 정책 변화 가능성
2. **손실 상계**: 손실과 이익 상계
3. **기록 관리**: 모든 거래 내역 보관

## 신고 방법
- 종합소득세 신고 시 포함
- 거래소 제공 거래 내역 활용
- 세무사 상담 권장

<div class="warning">
⚠️ 세법은 변경될 수 있으니 최신 정보를 확인하세요.
</div>

<div class="info">
💡 이 정보는 일반적인 안내이며, 개인의 상황에 따라 다를 수 있습니다.
</div>
    `,
  },
};

// 모든 내용 통합
export const finalDocContents = {
  ...gettingStartedContents,
  ...initialSetupContents,
  ...coreConcepts,
  ...patternRecognition,
  ...interfaceContents,
  ...tradingStrategyContents,
  ...smartOrderContents,
  ...coinSettingsContents,
  ...autoTradingContents,
  ...calculationsContents,
  ...simulationContents,
  ...learningContents,
  ...aiLearningExtendedContents,
  ...backtestContents,
  ...riskManagementOverview,
  ...riskManagementContents,
  ...killSwitchContents,
  ...notificationContents,
  ...troubleshootingContents,
  ...advancedContents,
  ...referenceContents,
};