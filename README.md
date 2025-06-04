# Upbit AI Trading Desktop App

업비트 암호화폐 자동매매를 위한 종합적인 데스크탑 애플리케이션입니다.

## 📋 목차
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설치 방법](#-설치-방법)
- [사용 방법](#-사용-방법)
- [거래 전략](#-거래-전략)
- [고급 기능](#-고급-기능)
- [성능 및 안전성](#-성능-및-안전성)
- [문서](#-문서)
- [문의 및 지원](#-문의-및-지원)

## 🚀 주요 기능

### 기술적 분석 (20+ 지표)
- **기본 지표**: RSI, MACD, 볼린저 밴드, 이동평균선, 스토캐스틱
- **고급 지표**: 이치모쿠 클라우드, 피보나치 되돌림, ADX, ATR, OBV
- **패턴 인식**: 30+ 캔들 패턴 및 차트 패턴 자동 인식

### AI 기반 분석
- 🤖 **Claude API 연동**: 시장 상황 종합 분석
- 📰 **뉴스 감성 분석**: 실시간 뉴스 수집 및 다국어 감성 분석
- 🧠 **머신러닝**: 거래 결과 기반 자동 학습 및 최적화

### 포트폴리오 관리
- 📈 **다중 코인 거래**: 동시 다수 코인 모니터링 및 자동매매
- 💰 **Kelly Criterion**: 수학적 최적 포지션 사이징
- 📊 **리스크 관리**: VaR, CVaR, 최대 낙폭 관리

### 거래 전략
- 🎯 **간소화 모드**: 검증된 6개 핵심 지표만 사용
- 💎 **DCA 전략**: Dollar Cost Averaging 자동화
- 🔲 **Grid Trading**: 횡보장 수익 극대화
- 🔄 **Mean Reversion**: 평균 회귀 전략

### 안전 기능
- 🛡️ **Kill Switch**: 긴급 정지 및 일일 손실 한도
- ⏱️ **쿨다운 시스템**: 과도한 거래 방지
- 🔐 **2FA 인증**: TOTP 기반 보안 강화

## 💻 기술 스택

### Frontend
- **Framework**: React 18, TypeScript 5
- **UI Library**: Material-UI v5
- **Charts**: Recharts, TradingView Widget
- **State Management**: React Context API

### Backend
- **Runtime**: Electron 31, Node.js 18+
- **API Integration**: Upbit REST/WebSocket, Claude API
- **Data Processing**: TA-Lib (기술적 분석)
- **Security**: Electron SafeStorage, Speakeasy (2FA)

### Build & Deploy
- **Bundler**: Webpack 5
- **Package**: Electron Builder
- **CI/CD**: GitHub Actions

## 📦 설치 방법

### 시스템 요구사항
- Windows 10/11 (64-bit)
- RAM 8GB 이상
- 저장공간 500MB 이상
- 인터넷 연결 필수

### 빠른 설치 (권장)
최신 설치 파일을 [Releases](https://github.com/your-username/upbit-ai-trading/releases)에서 다운로드하세요.

### 개발자 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/upbit-ai-trading.git
cd upbit-ai-trading/desktop-app

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build

# Windows 설치 파일 생성
npm run dist:win

# 포터블 버전 생성
npm run dist:win-portable
```

### 환경 설정 (.env)
```env
# .env.example을 복사하여 .env 파일 생성
ELECTRON_DEV_MODE=true
```

## 🎯 사용 방법

### 초기 설정
1. **API 키 발급**
   - Upbit: [API 관리](https://upbit.com/mypage/open_api_management) 페이지에서 발급
   - Claude (선택): [Anthropic Console](https://console.anthropic.com/)에서 발급

2. **앱 설정**
   - 설정 > API 키: Access Key, Secret Key 입력
   - 설정 > 거래 설정: 실거래/시뮬레이션 모드 선택
   - 포트폴리오: 거래할 코인 추가 및 활성화

### 거래 시작
1. 포트폴리오에서 코인 선택
2. 분석 설정에서 전략 파라미터 조정
3. 대시보드에서 "자동매매 시작" 버튼 클릭

## 📈 거래 전략

### 간소화 모드 (초보자 권장)
검증된 6개 핵심 지표만 사용하는 안정적인 전략
- 이동평균선 크로스오버
- RSI 과매수/과매도
- MACD 신호
- 볼린저 밴드 돌파
- 거래량 급증
- 스토캐스틱

### 고급 전략
- **Kelly Criterion**: 최적 베팅 사이즈 자동 계산
- **DCA**: 분할 매수로 평균 단가 하락
- **Grid Trading**: 설정 가격 구간 내 자동 매매
- **멀티 타임프레임**: 여러 시간대 동시 분석

## 🛡️ 성능 및 안전성

### 성능 최적화
- React.memo를 통한 렌더링 최적화
- 차트 업데이트 주기 동적 조절
- 백그라운드 워커 스레드 활용
- 메모리 사용량 자동 관리

### 보안 기능
- API 키 암호화 저장 (Electron SafeStorage)
- 2FA 인증 지원 (TOTP)
- IP 화이트리스트 설정
- 거래 내역 로컬 암호화

### 리스크 관리
- 일일 최대 손실 한도 설정
- 연속 손실 시 자동 중단
- 포지션 크기 제한
- 실시간 VaR 모니터링

## 📚 문서

- [사용자 매뉴얼](desktop-app/USER_MANUAL.md) - 상세한 사용 방법 및 기능 설명
- [API 문서](docs/API.md) - 개발자를 위한 API 레퍼런스
- [거래 전략 가이드](docs/STRATEGIES.md) - 각 전략의 상세 설명
- [문제 해결](docs/TROUBLESHOOTING.md) - 자주 묻는 질문과 해결 방법

## ⚠️ 주의사항

- **투자 위험**: 암호화폐 투자는 원금 손실 위험이 있습니다
- **백테스트 권장**: 실거래 전 충분한 시뮬레이션 필수
- **소액 시작**: 처음에는 소액으로 시작하여 시스템 검증
- **API 보안**: API 키는 절대 타인과 공유하지 마세요

## 🤝 기여하기

기여를 환영합니다! 다음 방법으로 참여할 수 있습니다:

1. 버그 리포트: [Issues](https://github.com/your-username/upbit-ai-trading/issues)
2. 기능 제안: [Discussions](https://github.com/your-username/upbit-ai-trading/discussions)
3. 코드 기여: Fork 후 Pull Request

### 개발 가이드
- 코드 스타일: ESLint 규칙 준수
- 커밋 메시지: 한국어 사용, 기능/수정/문서 구분
- 테스트: 주요 기능은 테스트 코드 포함

## 📞 문의 및 지원

- **버그 신고**: [GitHub Issues](https://github.com/your-username/upbit-ai-trading/issues)
- **기능 요청**: [GitHub Discussions](https://github.com/your-username/upbit-ai-trading/discussions)
- **보안 문제**: security@your-domain.com

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

**면책조항**: 이 소프트웨어는 교육 및 연구 목적으로 제공됩니다. 실제 거래로 인한 손실에 대해 개발자는 책임지지 않습니다.