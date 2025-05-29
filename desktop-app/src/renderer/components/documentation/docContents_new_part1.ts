// Getting Started 서브섹션들
export const gettingStartedContents = {
  'getting-started.introduction': {
    title: '프로그램 소개',
    content: `
# 프로그램 소개

## 업비트 AI 자동매매 프로그램이란?

이 프로그램은 **인공지능(AI)**과 **기술적 분석**을 결합하여 암호화폐를 자동으로 매매하는 데스크톱 애플리케이션입니다.

### 핵심 특징

#### 1. AI 기반 분석
- Claude API를 활용한 시장 분석
- 복잡한 패턴과 시장 심리 해석
- 뉴스와 이벤트 영향 평가

#### 2. 기술적 지표 활용
- RSI, MACD, 볼린저밴드 등 10여 가지 지표
- 실시간 계산 및 분석
- 가중치 기반 종합 평가

#### 3. 자동화된 거래
- 24시간 무중단 모니터링
- 감정 배제한 일관된 거래
- 빠른 시장 대응

### 왜 이 프로그램을 사용해야 하나요?

#### 시간 절약
- 차트를 계속 보고 있을 필요 없음
- 자동으로 기회 포착
- 수면 중에도 거래 가능

#### 감정 배제
- FOMO나 공포에 의한 잘못된 결정 방지
- 미리 설정한 전략대로만 거래
- 일관성 있는 투자

#### 리스크 관리
- 자동 손절/익절 시스템
- 포지션 사이징
- 분산 투자

### 프로그램 구성 요소

1. **거래 엔진**: 실제 매매를 담당
2. **분석 모듈**: 시장 데이터 분석
3. **AI 모듈**: 복잡한 패턴 해석
4. **리스크 관리**: 자산 보호
5. **학습 시스템**: 지속적 개선

### 지원 거래소

현재 **업비트(Upbit)** 거래소만 지원합니다.
- KRW 마켓 모든 코인
- 실시간 데이터 연동
- 안정적인 API 지원

<div class="info">
💡 **참고**: 이 프로그램은 수익을 보장하지 않습니다. 암호화폐 투자는 원금 손실 위험이 있으니 신중하게 투자하세요.
</div>
    `,
  },
  'getting-started.quick-start': {
    title: '5분 빠른 시작',
    content: `
# 5분 빠른 시작 가이드

## 단 5분만에 자동매매를 시작하세요!

### 1단계: 프로그램 설치 (1분)
\`\`\`bash
1. GitHub Releases에서 최신 버전 다운로드
2. 설치 파일 실행
3. 기본 설정으로 설치 완료
\`\`\`

### 2단계: API 키 발급 (2분)

#### 업비트 API 키
1. [업비트](https://upbit.com) 로그인
2. 마이페이지 → Open API 관리
3. 새 API 키 발급
   - 자산 조회 ✓
   - 주문 조회 ✓
   - 주문 하기 ✓
   - (주의: 출금 권한은 체크하지 마세요!)

#### Claude API 키
1. [Anthropic Console](https://console.anthropic.com) 접속
2. API Keys 메뉴 클릭
3. Create Key 클릭

### 3단계: 프로그램 설정 (1분)
1. 프로그램 실행
2. 설정 → API 설정
3. 발급받은 키 입력
4. 연결 테스트 클릭

### 4단계: 첫 거래 설정 (1분)
\`\`\`
1. 분석 설정 → 코인 추가
2. BTC (비트코인) 선택
3. 기본 설정 그대로 사용
4. 시뮬레이션 모드 ON
5. 자동매매 시작!
\`\`\`

### 완료! 🎉

이제 시뮬레이션 모드에서 자동매매가 작동합니다.
- 실시간으로 매매 신호 확인
- 가상 포트폴리오 수익률 확인
- 충분히 테스트 후 실거래 전환

### 다음 단계

시뮬레이션에서 만족스러운 결과가 나오면:
1. 소액으로 실거래 시작 (10-50만원)
2. 1주일 동안 결과 모니터링
3. 점진적으로 투자금 증가

<div class="success">
✅ **축하합니다!** 이제 AI 자동매매의 세계로 첫 발을 내디뎠습니다.
</div>

<div class="warning">
⚠️ **중요**: 처음에는 반드시 시뮬레이션 모드로 시작하세요. 실제 돈을 투자하기 전에 충분히 테스트하는 것이 중요합니다.
</div>
    `,
  },
  'getting-started.requirements': {
    title: '시스템 요구사항',
    content: `
# 시스템 요구사항

## 최소 사양

### 운영체제
- **Windows**: Windows 10 이상 (64비트)
- **macOS**: macOS 10.14 (Mojave) 이상
- **Linux**: Ubuntu 18.04 이상 (또는 동급)

### 하드웨어
- **CPU**: 듀얼코어 2GHz 이상
- **RAM**: 4GB 이상
- **저장공간**: 500MB 이상의 여유 공간
- **인터넷**: 안정적인 광대역 연결

## 권장 사양

### 하드웨어
- **CPU**: 쿼드코어 3GHz 이상
- **RAM**: 8GB 이상
- **저장공간**: 2GB 이상의 여유 공간
- **인터넷**: 100Mbps 이상의 안정적인 연결

### 추가 요구사항

#### 계정 및 API
- 업비트 계정 (KYC 인증 완료)
- 업비트 API 키 (거래 권한 포함)
- Claude API 키 (유료 구독)

#### 네트워크
- 방화벽에서 다음 도메인 허용:
  - api.upbit.com
  - api.anthropic.com
  - github.com (업데이트용)

## 성능 최적화

### Windows 사용자
\`\`\`
1. Windows Defender 예외 추가
2. 전원 옵션을 '고성능'으로 설정
3. 백그라운드 앱 최소화
\`\`\`

### macOS 사용자
\`\`\`
1. 에너지 절약 해제
2. 앱이 백그라운드에서 실행되도록 허용
3. 알림 센터에서 집중 모드 설정
\`\`\`

### Linux 사용자
\`\`\`bash
# 필요한 패키지 설치
sudo apt-get update
sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6
\`\`\`

## 보안 권장사항

### 전용 컴퓨터 사용
- 가능하면 거래 전용 PC 사용
- 불필요한 프로그램 설치 금지
- 정기적인 보안 업데이트

### 네트워크 보안
- 공용 WiFi 사용 금지
- VPN 사용 시 안정성 확인
- 고정 IP 사용 권장

### 백업
- API 키 안전한 곳에 백업
- 거래 기록 정기적 백업
- 설정 파일 백업

<div class="info">
💡 **팁**: 24시간 자동매매를 위해서는 절전 모드를 해제하고, 자동 업데이트를 비활성화하는 것이 좋습니다.
</div>

<div class="warning">
⚠️ **주의**: 최소 사양에서도 작동하지만, 여러 코인을 동시에 거래하거나 복잡한 전략을 사용할 경우 권장 사양을 충족하는 것이 좋습니다.
</div>
    `,
  },
  'getting-started.installation': {
    title: '설치 및 업데이트',
    content: `
# 설치 및 업데이트

## 신규 설치

### Windows

1. **다운로드**
   - [GitHub Releases](https://github.com/your-repo/releases) 접속
   - \`upbit-ai-trading-setup-x.x.x.exe\` 다운로드

2. **설치**
   \`\`\`
   1. 다운로드한 설치 파일 실행
   2. Windows Defender 경고 시 '추가 정보' → '실행' 클릭
   3. 설치 마법사 따라 진행
   4. 바탕화면 바로가기 생성 체크
   \`\`\`

3. **첫 실행**
   - 바탕화면 아이콘 더블클릭
   - Windows 방화벽 허용
   - 초기 설정 마법사 시작

### macOS

1. **다운로드**
   - \`upbit-ai-trading-x.x.x.dmg\` 다운로드

2. **설치**
   \`\`\`bash
   1. DMG 파일 열기
   2. 앱을 Applications 폴더로 드래그
   3. 처음 실행 시: 우클릭 → 열기
   4. 보안 경고 확인
   \`\`\`

### Linux

1. **AppImage 방식** (권장)
   \`\`\`bash
   # 다운로드
   wget https://github.com/.../upbit-ai-trading-x.x.x.AppImage
   
   # 실행 권한 부여
   chmod +x upbit-ai-trading-x.x.x.AppImage
   
   # 실행
   ./upbit-ai-trading-x.x.x.AppImage
   \`\`\`

2. **DEB 패키지** (Ubuntu/Debian)
   \`\`\`bash
   # 다운로드 및 설치
   sudo dpkg -i upbit-ai-trading-x.x.x.deb
   
   # 의존성 문제 해결
   sudo apt-get install -f
   \`\`\`

## 업데이트

### 자동 업데이트
프로그램이 시작될 때 자동으로 업데이트를 확인합니다.

1. 업데이트 알림 표시
2. '지금 업데이트' 클릭
3. 다운로드 진행 (백그라운드)
4. 다운로드 완료 후 재시작

### 수동 업데이트
\`\`\`
설정 → 일반 → 업데이트 확인
\`\`\`

### 업데이트 설정
\`\`\`javascript
{
  "autoUpdate": true,        // 자동 업데이트 활성화
  "checkInterval": 3600000,  // 1시간마다 확인
  "downloadInBackground": true,
  "installOnQuit": true      // 종료 시 설치
}
\`\`\`

## 문제 해결

### 설치 실패
1. **관리자 권한으로 실행**
2. **바이러스 백신 일시 중지**
3. **이전 버전 완전 제거**

### 업데이트 실패
\`\`\`bash
# Windows
%APPDATA%/upbit-ai-trading/logs/

# macOS
~/Library/Logs/upbit-ai-trading/

# Linux
~/.config/upbit-ai-trading/logs/
\`\`\`

로그 파일 확인 후 오류 메시지 확인

### 완전 제거

#### Windows
1. 제어판 → 프로그램 제거
2. 남은 파일 삭제:
   \`\`\`
   %APPDATA%/upbit-ai-trading
   %LOCALAPPDATA%/upbit-ai-trading
   \`\`\`

#### macOS
\`\`\`bash
# 앱 제거
rm -rf /Applications/Upbit\ AI\ Trading.app

# 설정 파일 제거
rm -rf ~/Library/Application\ Support/upbit-ai-trading
rm -rf ~/Library/Preferences/com.upbit-ai-trading.plist
\`\`\`

#### Linux
\`\`\`bash
# 프로그램 제거
sudo apt-get remove upbit-ai-trading  # DEB 설치 시

# 설정 파일 제거
rm -rf ~/.config/upbit-ai-trading
\`\`\`

## 백업 및 복원

### 설정 백업
중요한 설정 파일 위치:
- API 키: 암호화되어 저장
- 거래 설정: JSON 형식
- 거래 기록: SQLite DB

### 자동 백업
\`\`\`javascript
{
  "backup": {
    "enabled": true,
    "interval": "daily",
    "retention": 30,  // 30일 보관
    "location": "./backups"
  }
}
\`\`\`

<div class="success">
✅ **팁**: 주요 업데이트 전에는 항상 설정을 백업하세요.
</div>

<div class="warning">
⚠️ **주의**: 베타 버전은 불안정할 수 있으니 실거래에는 안정 버전만 사용하세요.
</div>
    `,
  },
  'getting-started.disclaimer': {
    title: '면책 조항',
    content: `
# 면책 조항

## 투자 위험 고지

### 원금 손실 위험
**암호화폐 투자는 원금 손실 위험이 있습니다.**
- 투자금 전액을 잃을 수 있습니다
- 과거 수익률이 미래 수익을 보장하지 않습니다
- 레버리지 사용 시 손실이 확대될 수 있습니다

### 시장 위험
- 24시간 거래로 인한 급격한 가격 변동
- 유동성 부족으로 인한 거래 실패
- 거래소 시스템 오류 또는 해킹
- 규제 변화에 따른 거래 제한

## 프로그램 한계

### 기술적 한계
1. **네트워크 지연**
   - 시장가 주문 시 슬리피지 발생
   - 실시간 데이터 지연 가능성

2. **시스템 오류**
   - 프로그램 버그 또는 충돌
   - API 연결 끊김
   - 컴퓨터 하드웨어 고장

3. **AI 분석 한계**
   - AI 예측이 항상 정확하지 않음
   - 예상치 못한 시장 상황 대응 어려움
   - 학습 데이터의 편향 가능성

### 책임 한계
**개발자와 운영자는 다음에 대해 책임지지 않습니다:**
- 프로그램 사용으로 인한 금전적 손실
- 거래 실패 또는 오류로 인한 손해
- 제3자 서비스(업비트, Claude) 장애
- 사용자의 부주의로 인한 손실

## 사용자 책임

### 투자 결정
- 모든 투자 결정은 사용자 본인의 책임입니다
- 프로그램은 도구일 뿐, 투자 조언이 아닙니다
- 손실 감당 가능한 금액만 투자하세요

### 보안 관리
- API 키 안전 관리
- 2단계 인증 활성화
- 정기적인 비밀번호 변경
- 의심스러운 활동 모니터링

### 세금 신고
- 암호화폐 거래 수익에 대한 세금 납부 의무
- 거래 기록 보관 책임
- 세무 전문가 상담 권장

## 라이선스 및 저작권

### 오픈소스 라이선스
이 프로그램은 MIT 라이선스로 배포됩니다.
\`\`\`
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
\`\`\`

### 제3자 라이브러리
- Electron: MIT License
- React: MIT License
- TensorFlow.js: Apache 2.0
- 기타 오픈소스 라이브러리

## 데이터 수집 및 개인정보

### 수집하는 정보
- 프로그램 사용 통계 (익명)
- 오류 보고서 (선택적)
- 거래 성과 (로컬 저장)

### 수집하지 않는 정보
- API 키 (로컬 암호화 저장)
- 개인 식별 정보
- 거래 내역 상세

## 업데이트 및 지원

### 지원 범위
- 프로그램 버그 수정
- 보안 패치
- 기능 개선

### 지원하지 않는 사항
- 투자 조언 또는 상담
- 손실 보상
- 개인별 맞춤 설정

## 최종 확인

**이 프로그램을 사용함으로써 귀하는:**
1. ✓ 모든 투자 위험을 이해하고 감수합니다
2. ✓ 프로그램의 한계를 인지합니다
3. ✓ 개발자의 책임 한계를 동의합니다
4. ✓ 본인의 투자 결정에 책임을 집니다

<div class="warning">
⚠️ **경고**: 이 문서를 충분히 읽고 이해한 후 프로그램을 사용하세요. 동의하지 않으면 프로그램을 사용하지 마세요.
</div>

<div class="info">
💡 **조언**: 처음에는 소액으로 시작하고, 충분한 학습과 테스트를 거친 후 투자금을 늘리세요.
</div>
    `,
  },
};