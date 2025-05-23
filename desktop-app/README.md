# Upbit AI Trading Desktop App

업비트 AI 자동매매 데스크탑 애플리케이션

## 주요 기능

- ✅ 자동매매 시작/중지
- ✅ AI 분석 기능 ON/OFF
- ✅ 백그라운드 실행 (시스템 트레이)
- ✅ 실시간 상태 모니터링

## 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. Python API 서버 실행
```bash
# 프로젝트 루트에서
pip install fastapi uvicorn
python api_server.py
```

### 3. Electron 앱 개발 모드 실행
```bash
npm run dev
```

### 4. 빌드
```bash
# 모든 플랫폼
npm run dist

# Windows만
npm run dist:win
```

## 프로젝트 구조

```
desktop-app/
├── src/
│   ├── main/           # Electron 메인 프로세스
│   │   ├── main.ts     # 메인 프로세스 진입점
│   │   └── api-client.ts # Python API 클라이언트
│   ├── renderer/       # React UI
│   │   ├── index.tsx   # React 진입점
│   │   └── App.tsx     # 메인 UI 컴포넌트
│   └── preload/        # Preload 스크립트
│       └── preload.js  # IPC 브릿지
├── dist/               # 빌드 결과물
├── webpack.config.js   # Webpack 설정
├── tsconfig.json       # TypeScript 설정
└── electron-builder.json # Electron Builder 설정
```

## 사용 방법

1. 앱 실행
2. "자동매매 시작" 버튼 클릭
3. AI 기능 필요시 토글 스위치 ON
4. 창을 닫아도 시스템 트레이에서 계속 실행됨
5. 트레이 아이콘 우클릭으로 메뉴 접근

## 추후 개선사항

- [ ] 실시간 차트 추가
- [ ] 거래 내역 표시
- [ ] 수익률 대시보드
- [ ] 상세 설정 화면
- [ ] 자동 업데이트 기능