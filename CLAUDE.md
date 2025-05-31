# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
Upbit 암호화폐 자동매매 데스크탑 애플리케이션 (Electron + React + TypeScript)

## 빌드 및 개발 명령어

### 개발 환경
```bash
cd desktop-app
npm install                    # 의존성 설치
npm run dev                    # 개발 모드 실행 (Webpack watch + Electron)
npm run dev:separate           # 빌드 후 개발 Electron 실행
```

### 빌드 및 배포
```bash
npm run build                  # Webpack 빌드만
npm run dist:win               # Windows 설치 파일 생성
npm run dist:win-portable      # Windows 포터블 버전 생성
npm run publish:win            # GitHub Releases 자동 배포
```

### 테스트
```bash
npm run test:features          # 기능 테스트
npm run test:calculations      # 계산 로직 테스트
npm run test:scenarios         # 시나리오 테스트
npm run test:performance       # 성능 테스트
npm run test:all              # 전체 테스트 (Windows bat)
```

### 편의 스크립트 (Windows)
```bash
build.bat                      # npm run dist:win 실행
run-dev.bat                    # 개발 모드 실행 (webpack 프로세스 정리 포함)
publish-debug.bat              # 디버그 모드로 publish 실행
build-secure.bat               # 보안 빌드 (코드 서명 포함)
```

## 아키텍처 상세

### 1. Electron 프로세스 구조
```
Main Process (Node.js)
├── 시스템 리소스 접근
├── 창 관리
├── IPC 통신 허브
├── 자동매매 엔진 실행
└── 파일시스템 접근

Renderer Process (Chromium)
├── React UI 렌더링
├── 사용자 인터랙션
└── 실시간 데이터 표시

Preload Script
└── IPC 브릿지 (window.electronAPI)
```

### 2. 핵심 서비스 계층

#### 거래 엔진 (Core Trading)
- `trading-engine.ts`: 메인 거래 루프, 상태 관리, 이벤트 발행
- `upbit-service.ts`: Upbit REST API/WebSocket 통신
- `api-client.ts`: 외부 API 통신 유틸리티

#### 분석 서비스 (Analysis)
- `analysis-service.ts`: 20+ 기술적 지표 계산 (RSI, MACD, 볼린저밴드 등)
- `ai-service.ts`: Claude API 연동, AI 기반 시장 분석
- `pattern-recognition-service.ts`: 30+ 캔들/차트 패턴 인식
- `multi-timeframe-service.ts`: 다중 시간대 분석 (1분~1일)
- `support-resistance-service.ts`: 동적 지지/저항선 계산
- `advanced-indicators-service.ts`: 고급 지표 (Ichimoku, Elliott Wave 등)

#### 거래 전략 (Trading Strategies)
- `kelly-criterion-service.ts`: Kelly Criterion 기반 최적 포지션 사이징
- `dca-strategy-service.ts`: Dollar Cost Averaging 전략
- `grid-trading-service.ts`: 그리드 거래 (범위 장세)
- `momentum-trading-service.ts`: 모멘텀 기반 추세 추종
- `mean-reversion-service.ts`: 평균 회귀 전략

#### 리스크 관리 (Risk Management)
- `risk-management-service.ts`: VaR/CVaR 계산, 포트폴리오 최적화
- `kill-switch-service.ts`: 긴급 정지, 일일 손실 한도
- `market-correlation-service.ts`: 코인 간 상관관계 분석

#### 학습 및 최적화 (Learning & Optimization)
- `learning-service.ts`: 거래 결과 기반 가중치 자동 조정
- `backtest-service.ts`: 과거 데이터 백테스팅

#### 외부 데이터 (External Data)
- `news-service.ts`: RSS 피드 수집, 다국어 감성 분석

#### 사용자 기능 (User Features)
- `notification-service.ts`: 시스템 알림, 이메일/텔레그램 연동
- `two-factor-auth-service.ts`: TOTP 기반 2FA

### 3. UI 컴포넌트 구조
```
components/
├── dashboard/          # 메인 대시보드
├── portfolio/         # 포트폴리오 관리, 자동 리밸런싱
├── analysis/          # 분석 설정 (가중치, 지표)
├── trading/           # 실시간 거래 현황
├── backtest/          # 백테스팅 인터페이스
├── settings/          # API 키, 거래 설정, 알림
├── emergency/         # Kill Switch 제어
├── documentation/     # 내장 사용 설명서
├── charts/            # 차트 컴포넌트 (TradingView, Recharts)
└── common/            # 공통 UI 컴포넌트
```

### 4. 데이터 흐름

#### 실시간 데이터 플로우
```
Upbit WebSocket → Main Process → IPC → Renderer → React State → UI Update
```

#### 거래 실행 플로우
```
1. 시장 데이터 수집 (1분 간격)
2. 기술적 분석 실행 (20+ 지표)
3. AI 분석 (선택적)
4. 신뢰도 계산 (가중 평균)
5. 리스크 검증
6. Kelly Criterion 포지션 사이징
7. 주문 실행
8. 결과 기록 및 학습
```

### 5. 주요 설정 및 상태 관리

#### 설정 저장 위치
- **API 키**: Electron safeStorage (암호화)
- **거래 설정**: localStorage + 파일 시스템
- **학습 데이터**: `userData/data/` 디렉토리

#### IPC 채널 목록
- `trading:start/stop`: 자동매매 제어
- `trading:status`: 상태 업데이트
- `analysis:result`: 분석 결과
- `portfolio:update`: 포트폴리오 변경
- `notification:show`: 알림 표시

### 6. 보안 및 안전장치
- API 키 암호화 저장 (safeStorage)
- 2FA 인증 지원
- Kill Switch (일일 손실 한도, 연속 손실 정지)
- 거래 쿨다운 (중복 거래 방지)
- 최소/최대 거래 금액 제한
- 실거래/시뮬레이션 모드 분리

### 7. 개발 시 주의사항

#### TypeScript 설정
- `strict: true` 활성화
- CommonJS 모듈 시스템 사용
- JSX: React

#### Webpack 설정
- Main/Renderer 별도 빌드
- Development 모드에서 source-map 활성화
- Preload 스크립트 자동 주입

#### Electron Builder
- Auto-updater 설정 (GitHub Releases)
- NSIS 설치 프로그램 (Windows)
- 코드 서명 준비 (인증서 필요)

#### 환경 변수
- `GH_TOKEN`: GitHub 자동 업데이트용 토큰
- `ELECTRON_DEV_MODE`: 개발 모드 플래그

### 8. 고급 기능 세부사항

#### Kelly Criterion
- 과거 승률/손익비 기반 최적 배팅 크기 계산
- 최대 배팅 제한 (maxKellyFraction)
- 코인별 개별 계산

#### 패턴 인식
- 캔들 패턴: Doji, Hammer, Shooting Star 등 15종
- 차트 패턴: Head & Shoulders, Triangle, Flag 등 15종
- 신뢰도 기반 가중치 적용

#### 멀티 타임프레임
- 1분, 5분, 15분, 1시간, 4시간, 1일 동시 분석
- 타임프레임별 가중치 설정 가능
- 상위 타임프레임 트렌드 확인

#### 학습 시스템
- 코인별 지표 가중치 자동 조정
- 카테고리별 학습 (변동성 그룹)
- 수익률 기반 강화 학습

#### 매수/매도 비율 (2025년 1월 업데이트)
- **매수 비율**: 최대 투자 금액(maxPositionSize) 기준으로 계산
  - 예: 최대 투자 금액 100만원, 매수 비율 10% 설정 시 10만원 매수 시도
  - KRW 잔액이 부족하면 남은 잔액 전체를 사용
  - 최소 주문 금액(5,000원) 미만이면 거래 실패
- **매도 비율**: 현재 보유 코인 수량 기준으로 계산
  - 예: 50% 설정 시, BTC 1개 보유 중이면 0.5개 매도
  - 신뢰도에 따라 자동 조정됨