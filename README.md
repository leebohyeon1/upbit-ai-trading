# Upbit AI Trading Bot

업비트 거래소에서 비트코인 자동매매를 수행하는 AI 트레이딩 봇입니다.

## 주요 기능

- **기술적 분석**: 다양한 기술적 지표를 활용한 시장 분석
  - 이동평균선 (MA)
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - 볼린저 밴드
  - 스토캐스틱
  
- **AI 분석**: Claude AI를 활용한 시장 분석 및 매매 결정
- **자동 매매**: 24/7 자동 매매 실행
- **데스크탑 앱**: 사용자 친화적인 GUI 제공
- **백그라운드 실행**: 시스템 트레이에서 지속적으로 실행

## 프로젝트 구조

```
Upbit_AI_Trading/
├── src/                    # Python 소스 코드
│   ├── main.py            # 기본 자동매매 프로그램
│   ├── main_dual.py       # AI 통합 자동매매 프로그램
│   ├── api/               # API 인터페이스
│   ├── indicators/        # 기술적 지표
│   ├── strategy/          # 매매 전략
│   └── utils/             # 유틸리티
├── desktop-app/           # Electron 데스크탑 애플리케이션
├── config/                # 설정 파일
├── requirements.txt       # Python 의존성
└── api_server.py         # FastAPI 서버
```

## 설치 방법

### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/Upbit_AI_Trading.git
cd Upbit_AI_Trading
```

### 2. Python 환경 설정
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:
```
UPBIT_ACCESS_KEY=your_access_key
UPBIT_SECRET_KEY=your_secret_key
CLAUDE_API_KEY=your_claude_api_key
```

### 4. 데스크탑 앱 설치 (선택사항)
```bash
cd desktop-app
npm install
```

## 사용 방법

### Python 직접 실행
```bash
# 기본 자동매매
python src/main.py

# AI 통합 자동매매
python src/main_dual.py
```

### 데스크탑 앱 실행
```bash
# API 서버 시작
python api_server.py

# 별도 터미널에서 데스크탑 앱 실행
cd desktop-app
npm start
```

## 데스크탑 앱 기능

- **자동매매 시작/중지**: 간편한 버튼으로 제어
- **AI 기능 토글**: AI 분석 기능 ON/OFF
- **백그라운드 실행**: 창을 닫아도 시스템 트레이에서 계속 실행
- **실시간 상태 표시**: 현재 자동매매 상태 확인

## 주의사항

- 실제 자금으로 운영하기 전에 충분한 테스트를 진행하세요
- API 키는 절대 공개하지 마세요
- 시장 상황에 따라 손실이 발생할 수 있습니다

## 라이선스

MIT License

## 기여

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!