# Upbit AI Trading Desktop

> AI 기반 암호화폐 자동매매 데스크탑 애플리케이션

[![Version](https://img.shields.io/badge/version-1.0.6-blue.svg)](https://github.com/leebohyeon1/upbit-ai-trading)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-36.3.1-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.3-3178C6.svg)](https://www.typescriptlang.org/)

## 📋 목차
- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [시작하기](#-시작하기)
- [개발 환경](#-개발-환경)
- [빌드 및 배포](#-빌드-및-배포)
- [프로젝트 구조](#-프로젝트-구조)
- [기술 스택](#-기술-스택)
- [라이선스](#-라이선스)

## 🚀 소개

Upbit AI Trading Desktop은 기술적 분석과 AI를 결합한 암호화폐 자동매매 프로그램입니다. 20개 이상의 기술적 지표와 Claude AI 분석을 활용하여 최적의 매매 시점을 포착합니다.

### 핵심 특징
- 🤖 **AI 기반 시장 분석** - Claude API를 통한 실시간 시장 분석
- 📊 **20+ 기술적 지표** - RSI, MACD, 볼린저밴드 등 다양한 지표 지원
- 🛡️ **리스크 관리** - Kill Switch, 손절/익절, Kelly Criterion
- 📈 **백테스팅** - 과거 데이터로 전략 검증
- 🔄 **자동 학습** - 거래 결과 기반 가중치 자동 조정

## 🎯 주요 기능

### 거래 엔진
- **실시간 자동매매**: 24시간 시장 모니터링 및 자동 거래
- **시뮬레이션 모드**: 실제 자금 없이 전략 테스트
- **멀티 코인 지원**: 여러 암호화폐 동시 거래
- **사용자 정의 전략**: 개인별 맞춤 거래 설정

### 분석 기능
- **기술적 분석**: RSI, MACD, 볼린저밴드, 스토캐스틱 등
- **패턴 인식**: 30+ 캔들/차트 패턴 자동 감지
- **멀티 타임프레임**: 1분~1일 다중 시간대 분석
- **AI 통합 분석**: Claude AI의 시장 인사이트

### 리스크 관리
- **Kill Switch**: 일일 손실 한도 및 긴급 정지
- **포지션 사이징**: Kelly Criterion 기반 최적 투자 금액 계산
- **손절/익절**: 자동 손실 제한 및 수익 확정
- **거래 쿨다운**: 과도한 거래 방지

### 고급 전략
- **DCA (Dollar Cost Averaging)**: 분할 매수 전략
- **그리드 트레이딩**: 범위 장세 대응
- **모멘텀 트레이딩**: 추세 추종 전략
- **평균 회귀**: Mean Reversion 전략

## 🏁 시작하기

### 요구 사항
- Windows 10 이상
- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치

1. **저장소 클론**
```bash
git clone https://github.com/leebohyeon1/upbit-ai-trading.git
cd upbit-ai-trading/desktop-app
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
`.env` 파일 생성:
```env
# GitHub Personal Access Token (자동 업데이트용)
GH_TOKEN=your_github_personal_access_token_here
```

4. **개발 모드 실행**
```bash
npm run dev
```

### 초기 설정

1. **Upbit API 키 발급**
   - [Upbit](https://upbit.com)에서 Open API 신청
   - Access Key와 Secret Key 발급

2. **Claude API 키 발급** (선택사항)
   - [Anthropic](https://console.anthropic.com)에서 API 키 발급
   - AI 분석 기능 사용 시 필요

3. **앱에서 API 키 설정**
   - 설정 > API 키 관리에서 키 입력
   - 실거래 모드 활성화 (주의 필요)

## 💻 개발 환경

### 개발 명령어
```bash
# 개발 모드 (hot reload)
npm run dev

# 별도 프로세스로 실행
npm run dev:separate

# 타입 체크
npm run typecheck

# 린트
npm run lint

# 빌드만 실행
npm run build
```

### 테스트
```bash
# 기능 테스트
npm run test:features

# 계산 로직 테스트
npm run test:calculations

# 시나리오 테스트
npm run test:scenarios

# 성능 테스트
npm run test:performance

# 전체 테스트 (Windows)
npm run test:all
```

## 📦 빌드 및 배포

### 빌드
```bash
# Windows 설치 파일
npm run dist:win

# Windows 포터블
npm run dist:win-portable

# 모든 플랫폼
npm run dist
```

### 자동 업데이트 배포
```bash
# GitHub Releases에 자동 배포
npm run publish:win
```

### 편의 스크립트 (Windows)
```bash
# 개발 모드 실행
run-dev.bat

# 빌드 실행
build.bat

# 디버그 모드 배포
publish-debug.bat

# 보안 빌드
build-secure.bat
```

## 📁 프로젝트 구조

```
desktop-app/
├── src/
│   ├── main/                   # Electron 메인 프로세스
│   │   ├── main.ts            # 앱 진입점
│   │   ├── trading-engine.ts  # 핵심 거래 엔진
│   │   ├── analysis-service.ts # 기술적 분석 (20+ 지표)
│   │   ├── ai-service.ts      # Claude AI 연동
│   │   ├── upbit-service.ts   # Upbit API 클라이언트
│   │   ├── backtest-service.ts # 백테스팅 엔진
│   │   ├── risk-management-service.ts # 리스크 관리
│   │   ├── kelly-criterion-service.ts # 포지션 사이징
│   │   ├── pattern-recognition-service.ts # 패턴 인식
│   │   ├── multi-timeframe-service.ts # 멀티 타임프레임
│   │   ├── news-service.ts    # 뉴스 감성 분석
│   │   ├── learning-service.ts # 자동 학습
│   │   ├── kill-switch-service.ts # 긴급 정지
│   │   └── notification-service.ts # 알림 서비스
│   ├── renderer/              # React UI
│   │   ├── components/        # UI 컴포넌트
│   │   │   ├── dashboard/     # 메인 대시보드
│   │   │   ├── portfolio/     # 포트폴리오 관리
│   │   │   ├── analysis/      # 분석 설정
│   │   │   ├── trading/       # 거래 현황
│   │   │   ├── backtest/      # 백테스팅
│   │   │   ├── settings/      # 설정 화면
│   │   │   ├── emergency/     # Kill Switch
│   │   │   ├── documentation/ # 내장 매뉴얼
│   │   │   └── charts/        # 차트 컴포넌트
│   │   ├── contexts/          # React Context
│   │   ├── hooks/             # 커스텀 훅
│   │   ├── types/             # TypeScript 타입
│   │   └── App.tsx           # React 앱 루트
│   └── preload/              # IPC 브릿지
│       └── preload.js        # Electron API 브릿지
├── data/                     # 로컬 데이터 저장소
├── dist/                     # 빌드 결과물
├── webpack.config.js         # Webpack 설정
├── tsconfig.json            # TypeScript 설정
├── electron-builder.json    # 빌드 설정
└── package.json             # 의존성 및 스크립트
```

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Material-UI** - UI 컴포넌트 라이브러리
- **Recharts** - 차트 라이브러리
- **Framer Motion** - 애니메이션

### Backend
- **Electron 36** - 데스크탑 앱 프레임워크
- **Node.js** - JavaScript 런타임
- **WebSocket** - 실시간 데이터 스트리밍
- **Worker Threads** - 백그라운드 처리

### 개발 도구
- **Webpack 5** - 번들러
- **TypeScript** - 타입 체크
- **ESLint** - 코드 품질
- **Electron Builder** - 앱 패키징

### API & 서비스
- **Upbit API** - 암호화폐 거래소 API
- **Claude API** - AI 시장 분석
- **RSS Parser** - 뉴스 수집

## 🎮 사용 방법

### 초기 설정
1. 앱 실행 후 Settings 탭으로 이동
2. Upbit API Key 설정 (Access Key, Secret Key)
3. Claude API Key 설정 (선택사항)
4. 거래 파라미터 설정 (투자 비율, 신뢰도 임계값 등)

### 자동매매 시작
1. Dashboard에서 "자동매매 시작" 버튼 클릭
2. AI 분석 기능 필요시 토글 스위치 ON
3. 실시간으로 거래 상태 모니터링

### 포트폴리오 관리
1. Portfolio 탭에서 코인별 거래 설정
2. 각 코인의 매수/매도 활성화
3. 최대 투자 금액 및 비율 설정

### 백테스팅
1. Backtest 탭에서 기간 및 코인 선택
2. "백테스팅 시작" 버튼 클릭
3. 결과 분석 (수익률, 승률, 최대 손실 등)

### 고급 설정
- **Analysis**: 지표 가중치 조정, 신뢰도 임계값 설정
- **Risk Management**: 손절/익절, 일일 손실 한도 설정
- **Emergency**: Kill Switch 활성화, 긴급 정지 설정

## 🔒 보안 및 안전

- **API 키 암호화**: Electron safeStorage로 안전하게 저장
- **2FA 지원**: TOTP 기반 이중 인증
- **Kill Switch**: 일일 손실 한도 자동 정지
- **시뮬레이션 모드**: 실제 자금 없이 테스트
- **쿨다운 시스템**: 과도한 거래 방지

## 🔧 문제 해결

### 빌드 오류
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 컴파일 체크
npm run typecheck
```

### 자동 업데이트 실패
1. `.env` 파일에 `GH_TOKEN` 확인
2. GitHub Personal Access Token의 권한 확인
3. 인터넷 연결 상태 확인

### 거래 실행 오류
1. Upbit API 키 유효성 확인
2. IP 화이트리스트 설정 확인
3. API 호출 한도 확인

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](../LICENSE) 파일을 참조하세요.

## 🤝 기여하기

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

- **GitHub Issues**: [https://github.com/leebohyeon1/upbit-ai-trading/issues](https://github.com/leebohyeon1/upbit-ai-trading/issues)
- **Email**: leebohyeon1@gmail.com

---

⚠️ **투자 경고**: 암호화폐 거래는 높은 위험을 동반합니다. 이 프로그램을 사용한 거래로 인한 손실에 대해 개발자는 책임지지 않습니다. 신중한 투자 결정을 내리시기 바랍니다.