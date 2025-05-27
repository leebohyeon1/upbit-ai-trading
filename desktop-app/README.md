# Upbit AI Trading Desktop App

업비트 AI 자동매매 데스크탑 애플리케이션

## 주요 기능

### 자동매매
- ✅ 자동매매 시작/중지
- ✅ AI 분석 기능 ON/OFF
- ✅ 백그라운드 실행 (시스템 트레이)
- ✅ 실시간 상태 모니터링

### AI 분석
- ✅ 뉴스 감성 분석
- ✅ 시장 상관관계 분석
- ✅ 머신러닝 기반 학습
- ✅ Kelly Criterion 기반 포지션 사이징

### 백테스팅
- ✅ 과거 데이터 기반 전략 검증
- ✅ 수익률 및 승률 분석
- ✅ 최대 손실(MDD) 계산

### 포트폴리오 관리
- ✅ 코인별 매수/매도 설정
- ✅ 최대 투자 비율 관리
- ✅ 실시간 수익률 모니터링

## 설치 및 실행

### 1. 의존성 설치
```bash
cd desktop-app
npm install
```

### 2. 환경 변수 설정
`.env` 파일 생성:
```env
# GitHub Personal Access Token (자동 업데이트용)
GH_TOKEN=your_github_personal_access_token_here
```

### 3. 개발 모드 실행
```bash
npm run dev
```

### 4. 빌드
```bash
# Windows 설치 파일
npm run dist:win

# Windows 포터블 버전
npm run dist:win-portable

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

### 5. GitHub Releases 배포
```bash
# 자동으로 GitHub Releases에 업로드
npm run publish:win

# 또는 배치 파일 사용
publish.bat
```

## 프로젝트 구조

```
desktop-app/
├── src/
│   ├── main/                    # Electron 메인 프로세스
│   │   ├── main.ts             # 메인 프로세스 진입점
│   │   ├── trading-engine.ts   # 자동매매 엔진
│   │   ├── ai-service.ts       # AI 분석 서비스
│   │   ├── upbit-service.ts    # Upbit API 클라이언트
│   │   ├── news-service.ts     # 뉴스 분석 서비스
│   │   ├── backtest-service.ts # 백테스팅 서비스
│   │   └── learning-service.ts # 머신러닝 서비스
│   ├── renderer/               # React UI
│   │   ├── components/         # UI 컴포넌트
│   │   │   ├── dashboard/      # 대시보드
│   │   │   ├── settings/       # 설정 화면
│   │   │   ├── portfolio/      # 포트폴리오 관리
│   │   │   └── backtest/       # 백테스팅
│   │   ├── contexts/           # React Context
│   │   └── App.tsx            # 메인 앱 컴포넌트
│   └── preload/               # Preload 스크립트
│       └── preload.js         # IPC 브릿지
├── dist/                      # 빌드 결과물
├── data/                      # 로컬 데이터 저장소
├── webpack.config.js          # Webpack 설정
├── tsconfig.json             # TypeScript 설정
├── electron-builder.json     # Electron Builder 설정
└── package.json              # 프로젝트 설정

```

## 사용 방법

### 초기 설정
1. 앱 실행 후 Settings 탭으로 이동
2. Upbit API Key 설정
3. 거래 파라미터 설정 (투자 비율, 신뢰도 임계값 등)

### 자동매매 시작
1. Dashboard에서 "자동매매 시작" 버튼 클릭
2. AI 분석 기능 필요시 토글 스위치 ON
3. 실시간으로 거래 상태 모니터링

### 포트폴리오 관리
1. Portfolio 탭에서 코인별 거래 설정
2. 각 코인의 매수/매도 활성화
3. 최대 투자 비율 설정

### 백테스팅
1. Backtest 탭에서 기간 설정
2. "백테스팅 시작" 버튼 클릭
3. 결과 분석 (수익률, 승률, MDD 등)

### 백그라운드 실행
- 창을 닫아도 시스템 트레이에서 계속 실행
- 트레이 아이콘 우클릭으로 메뉴 접근
- "Show App"으로 다시 열기

## 자동 업데이트

앱은 자동으로 업데이트를 확인하고 설치합니다:
1. 앱 실행 시 자동으로 업데이트 확인
2. 새 버전이 있으면 알림 표시
3. "업데이트 설치" 클릭으로 자동 업데이트

## 보안 주의사항

- API Key는 로컬에 암호화되어 저장됨
- `.env` 파일은 절대 Git에 커밋하지 마세요
- GitHub Token은 환경 변수로 관리

## 문제 해결

### 빌드 오류
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### 자동 업데이트 실패
1. `.env` 파일에 `GH_TOKEN` 확인
2. GitHub Personal Access Token의 `repo` 권한 확인
3. 인터넷 연결 상태 확인

## 라이선스

MIT License