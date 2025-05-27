# Upbit AI Trading Desktop App

업비트 암호화폐 자동매매를 위한 데스크탑 애플리케이션입니다.

## 주요 기능

- 📊 **실시간 시장 분석**: RSI, MACD, 볼린저 밴드 등 다양한 기술적 지표 분석
- 🤖 **AI 기반 의사결정**: Claude API를 활용한 지능형 매매 신호 생성
- 📈 **포트폴리오 관리**: 다중 코인 동시 거래 및 관리
- 🎯 **개별 코인 설정**: 코인별 맞춤형 거래 전략 설정
- 📉 **백테스트**: 과거 데이터를 활용한 전략 검증
- 🧠 **학습 시스템**: 거래 결과를 기반으로 전략 자동 개선
- 💰 **Kelly Criterion**: 최적 포지션 크기 자동 계산
- 📰 **뉴스 분석**: 실시간 뉴스 감성 분석
- 🌡️ **변동성 자동 조정**: 시장 상황에 따른 동적 파라미터 조정

## 기술 스택

- **Frontend**: React, TypeScript, Material-UI
- **Backend**: Electron, Node.js
- **State Management**: React Context API
- **Build Tool**: Webpack, Electron Builder

## 설치 방법

### 사전 요구사항
- Node.js 16.0 이상
- npm 또는 yarn

### 설치 및 실행

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

# 패키지 생성 (Windows)
npm run package:win
```

## API 키 설정

1. [Upbit](https://upbit.com) 계정에서 API 키 발급
2. [Claude](https://anthropic.com) API 키 발급 (선택사항)
3. 앱 실행 후 설정 탭에서 API 키 입력

## 사용 방법

1. **포트폴리오 설정**: 거래할 코인 선택 및 활성화
2. **분석 설정**: 각 코인별 거래 전략 파라미터 설정
3. **거래 설정**: 전역 거래 옵션 설정
4. **자동매매 시작**: 메인 화면에서 자동매매 토글 활성화

## 주의사항

- 실제 자금으로 거래 시 손실 위험이 있습니다
- 충분한 백테스트 후 실거래를 시작하세요
- API 키는 안전하게 관리하세요

## 라이선스

MIT License - [LICENSE](LICENSE) 파일 참조

## 기여하기

버그 리포트, 기능 제안, PR은 언제나 환영합니다!

## 문의

Issues 탭을 통해 문의해주세요.