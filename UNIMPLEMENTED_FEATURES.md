# 미구현 기능 체크리스트

이 문서는 현재 코드베이스에서 구현되지 않았거나 부분적으로만 구현된 기능들을 추적합니다.

## 📌 IPC 통신 미구현

### Market Correlation (시장 상관관계)
- [x] Main 프로세스에 `market-correlation` IPC 핸들러 추가
- [x] MarketCorrelationPanel.tsx의 더미 데이터를 실제 데이터로 대체
- [x] 파일 위치: `src/renderer/components/market/MarketCorrelationPanel.tsx`

### News Analysis (뉴스 분석)
- [x] Main 프로세스에 `news-analysis` IPC 핸들러 추가
- [ ] NewsAnalysisPanel.tsx의 더미 데이터를 실제 데이터로 대체
- [ ] 파일 위치: `src/renderer/components/news/NewsAnalysisPanel.tsx`

## 🌐 외부 API 연동 필요

### 주식 시장 데이터
- [x] S&P 500 실시간 데이터 연동 (Alpha Vantage API)
- [x] NASDAQ 실시간 데이터 연동 (Alpha Vantage API)
- [x] 추천 API: Yahoo Finance API 또는 Alpha Vantage API
- [x] 파일 위치: `src/main/market-correlation-service.ts`

### 외환 데이터
- [x] 달러 인덱스(DXY) 실시간 데이터 연동 (Exchange Rate API)
- [ ] USD/KRW 환율 데이터 연동
- [x] 추천 API: Fixer.io, ExchangeRate-API
- [x] 파일 위치: `src/main/market-correlation-service.ts`

### 암호화폐 공포/탐욕 지수
- [ ] Alternative.me API 실시간 연동 개선
- [ ] 캐시 전략 구현 완료 필요
- [ ] 에러 처리 개선
- [ ] 파일 위치: `src/main/market-correlation-service.ts`

## 🤖 AI/ML 기능 개선

### Claude API 통합
- [ ] 에러 재시도 로직 개선
- [ ] API 사용량 추적 및 제한
- [ ] 응답 캐싱 전략 구현
- [ ] 파일 위치: `src/main/ai-service.ts`

### 학습 시스템
- [ ] 학습 결과 시각화 UI 구현
- [ ] 학습 진행률 표시
- [ ] 학습 히스토리 관리
- [ ] 파일 위치: `src/main/learning-service.ts`

## 📊 고급 거래 전략

### Grid Trading (그리드 거래)
- [ ] 그리드 레벨 동적 조정 로직
- [ ] 부분 체결 처리 로직
- [ ] 그리드 재설정 조건 구현
- [ ] 파일 위치: `src/main/grid-trading-service.ts`

### DCA Strategy (분할 매수)
- [ ] 동적 간격 조정 알고리즘
- [ ] 시장 상황별 DCA 중단/재개 로직
- [ ] DCA 성과 분석 도구
- [ ] 파일 위치: `src/main/dca-strategy-service.ts`

## 🔔 알림 시스템

### 이메일 알림
- [ ] SMTP 서버 설정 UI
- [ ] 이메일 템플릿 시스템
- [ ] 이메일 발송 로직 구현
- [ ] 파일 위치: `src/main/notification-service.ts`

## 🛡️ 보안 기능

### 2FA (이중 인증)
- [ ] QR 코드 생성 기능
- [ ] 백업 코드 생성 및 관리
- [ ] 2FA 설정 프로세스 개선
- [ ] 파일 위치: `src/main/two-factor-auth-service.ts`

### API 키 관리
- [ ] API 키 권한 검증
- [ ] API 키 만료 알림
- [ ] API 키 사용 로그
- [ ] 파일 위치: `src/main/main.ts`

## 📈 차트 및 시각화

### TradingView 차트
- [ ] 고급 지표 오버레이
- [ ] 차트 설정 저장/불러오기
- [ ] 멀티 타임프레임 동기화
- [ ] 파일 위치: `src/renderer/components/charts/TradingViewChart.tsx`

### 백테스트 결과 시각화
- [ ] 드로우다운 차트
- [ ] 월별/연도별 수익률 히트맵
- [ ] 거래 분포 차트
- [ ] 파일 위치: `src/renderer/components/backtest/BacktestPanel.tsx`

## 🔧 시스템 개선

### 성능 최적화
- [ ] 대용량 데이터 처리 시 페이지네이션
- [ ] 메모리 사용량 모니터링
- [ ] CPU 사용률 최적화
- [ ] WebSocket 재연결 로직 개선

### 에러 처리
- [ ] 전역 에러 핸들러 구현
- [ ] 에러 리포팅 시스템
- [ ] 사용자 친화적 에러 메시지
- [ ] 에러 복구 메커니즘

### 로깅 시스템
- [ ] 구조화된 로그 포맷
- [ ] 로그 레벨 관리
- [ ] 로그 파일 로테이션
- [ ] 원격 로그 수집

## 📱 UI/UX 개선

### 다크 모드
- [ ] 시스템 테마 자동 감지
- [ ] 차트 테마 동기화
- [ ] 커스텀 테마 지원

### 접근성
- [ ] 키보드 단축키 시스템
- [ ] 스크린 리더 지원
- [ ] 고대비 모드

## 📋 기타

### 문서화
- [ ] API 문서 자동 생성
- [ ] 사용자 가이드 개선
- [ ] 개발자 문서 작성

### 테스트
- [ ] 단위 테스트 커버리지 증가
- [ ] E2E 테스트 구현
- [ ] 성능 벤치마크 테스트

### 배포
- [ ] 자동 업데이트 서버 구축

---

## 우선순위 가이드

1. **높음** 🔴: 핵심 기능에 영향을 미치는 항목
2. **중간** 🟡: 사용자 경험을 개선하는 항목
3. **낮음** 🟢: 추가적인 편의 기능

각 기능을 구현할 때는 관련된 테스트 코드도 함께 작성하는 것을 권장합니다.