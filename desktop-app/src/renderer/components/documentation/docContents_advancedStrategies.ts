// 고급 거래 전략 섹션 문서
export const advancedStrategiesContents = {
  // 그리드 트레이딩
  'advanced-strategies.grid-trading': {
    title: '그리드 트레이딩',
    content: `
# 그리드 트레이딩 전략 🎯

## 그리드 트레이딩이란?

그리드 트레이딩은 일정한 가격 간격으로 매수와 매도 주문을 배치하여 가격 변동으로부터 수익을 얻는 자동화 전략입니다.

## 기본 원리

### 그리드 구성
\`\`\`yaml
그리드 설정 예시:
  기준가: 1,000,000원
  그리드 수: 10개
  간격: 2%
  
  매수 주문:
    980,000원
    960,000원
    940,000원
    920,000원
    900,000원
    
  매도 주문:
    1,020,000원
    1,040,000원
    1,060,000원
    1,080,000원
    1,100,000원
\`\`\`

### 작동 방식
\`\`\`python
class GridTrading:
    def __init__(self, base_price, grid_count, grid_gap):
        self.base_price = base_price
        self.grid_count = grid_count
        self.grid_gap = grid_gap
        self.orders = []
        
    def create_grid(self):
        # 매수 그리드
        for i in range(1, self.grid_count // 2 + 1):
            buy_price = self.base_price * (1 - self.grid_gap * i)
            self.orders.append({
                'type': 'BUY',
                'price': buy_price,
                'status': 'PENDING'
            })
            
        # 매도 그리드
        for i in range(1, self.grid_count // 2 + 1):
            sell_price = self.base_price * (1 + self.grid_gap * i)
            self.orders.append({
                'type': 'SELL',
                'price': sell_price,
                'status': 'PENDING'
            })
\`\`\`

💡 **핵심**: 그리드 트레이딩은 꾸준한 소액 수익을 추구합니다. 대박은 없지만 안정적입니다!
    `,
  },

  // DCA 전략
  'advanced-strategies.dca-strategy': {
    title: 'DCA (Dollar Cost Averaging) 전략',
    content: `
# DCA (Dollar Cost Averaging) 전략 💵

## DCA란?

DCA(Dollar Cost Averaging)는 일정 금액을 정기적으로 투자하여 평균 매수 가격을 낮추는 전략입니다.

## DCA의 원리

### 기본 개념
\`\`\`yaml
핵심 원칙:
  - 시간 분산 투자
  - 가격 평균화
  - 변동성 완화
  - 심리적 부담 감소

예시:
  매월 100만원씩 BTC 매수
  1월: 5,000만원 → 0.02 BTC
  2월: 4,000만원 → 0.025 BTC
  3월: 4,500만원 → 0.022 BTC
  
  평균 매수가: 4,444만원
\`\`\`

💡 **핵심**: DCA는 시간을 친구로 만드는 전략입니다. 꾸준함이 성공의 열쇠입니다!
    `,
  },

  // 모멘텀 트레이딩
  'advanced-strategies.momentum-trading': {
    title: '모멘텀 트레이딩',
    content: `
# 모멘텀 트레이딩 전략 🚀

## 모멘텀 트레이딩이란?

모멘텀 트레이딩은 가격이 특정 방향으로 움직이는 추세가 지속될 것이라는 가정 하에 추세를 따라가는 전략입니다.

## 모멘텀의 원리

### 물리학적 개념
\`\`\`yaml
모멘텀 = 질량 × 속도

시장에서:
  질량 = 거래량
  속도 = 가격 변화율
  
강한 모멘텀:
  - 높은 거래량
  - 빠른 가격 상승
  - 지속 가능성
\`\`\`

💡 **핵심**: 모멘텀은 친구이자 적입니다. 올라탈 때는 빠르게, 내릴 때는 더 빠르게!
    `,
  },

  // 평균 회귀 전략
  'advanced-strategies.mean-reversion': {
    title: '평균 회귀 전략',
    content: `
# 평균 회귀 전략 🔄

## 평균 회귀란?

평균 회귀(Mean Reversion)는 가격이 장기 평균에서 크게 벗어났을 때 다시 평균으로 돌아올 것이라는 가정에 기반한 전략입니다.

## 이론적 배경

### 통계학적 원리
\`\`\`python
import numpy as np

def calculate_zscore(price, lookback=20):
    """
    Z-Score: 평균으로부터 얼마나 벗어났는지
    """
    mean = np.mean(price[-lookback:])
    std = np.std(price[-lookback:])
    
    zscore = (price[-1] - mean) / std
    
    # 해석
    if zscore > 2:
        return "극도로 과매수"
    elif zscore < -2:
        return "극도로 과매도"
    else:
        return "정상 범위"
\`\`\`

💡 **핵심**: 평균 회귀는 인내심의 게임입니다. 극단을 기다리고, 빠르게 행동하세요!
    `,
  },

  // 전략 조합 가이드
  'advanced-strategies.strategy-combination': {
    title: '전략 조합 가이드',
    content: `
# 전략 조합 가이드 🎨

## 전략 조합의 필요성

단일 전략은 특정 시장 상황에서만 효과적입니다. 여러 전략을 조합하면 다양한 시장 환경에서 안정적인 수익을 추구할 수 있습니다.

## 전략 조합 원칙

### 상호 보완성
\`\`\`yaml
좋은 조합:
  - 트렌드 추종 + 평균 회귀
  - 모멘텀 + 밸류
  - 단기 + 장기
  
이유:
  - 서로 다른 시장에서 작동
  - 리스크 분산
  - 안정적 수익 곡선
  
나쁜 조합:
  - 유사한 전략들
  - 같은 시간대
  - 상관관계 높음
\`\`\`

💡 **핵심**: 전략 조합은 오케스트라와 같습니다. 각자의 역할이 조화를 이룰 때 아름다운 수익이 만들어집니다!
    `,
  },

  // 시장 상관관계 분석
  'advanced-strategies.market-correlation': {
    title: '시장 상관관계 분석',
    content: `
# 시장 상관관계 분석 📊

## 시장 상관관계란?

시장 상관관계는 암호화폐와 전통 금융시장(주식, 외환, 원자재) 간의 상호 영향을 분석하는 기능입니다.

## 주요 지표

### 1. BTC 도미넌스
\`\`\`yaml
의미:
  - 전체 암호화폐 시가총액 중 비트코인 비중
  - 60% 이상: 비트코인 강세, 알트코인 약세
  - 40% 이하: 알트코인 시즌

활용:
  - 높은 도미넌스: BTC 중심 투자
  - 낮은 도미넌스: 알트코인 분산 투자
\`\`\`

### 2. 주식시장 상관관계
\`\`\`yaml
S&P 500 / NASDAQ:
  - 0.7 이상: 높은 상관관계 (위험자산 동조화)
  - 0.3 이하: 디커플링 (독립적 움직임)
  
해석:
  - 미국 주식 상승 → 암호화폐 상승 가능성
  - 주식 하락 → 암호화폐도 하락 위험
\`\`\`

### 3. 달러 인덱스 (DXY)
\`\`\`yaml
역상관관계:
  - DXY 상승 → 암호화폐 하락 압력
  - DXY 하락 → 암호화폐 상승 여력
  
이유:
  - 달러 강세 = 위험자산 회피
  - 달러 약세 = 대체 자산 선호
\`\`\`

### 4. 공포/탐욕 지수
\`\`\`yaml
수치별 전략:
  0-20: 극도의 공포
    → 역발상 매수 기회
    
  20-40: 공포
    → 신중한 진입
    
  40-60: 중립
    → 기술적 분석 위주
    
  60-80: 탐욕
    → 부분 익절 고려
    
  80-100: 극도의 탐욕
    → 차익실현 시점
\`\`\`

## API 설정 방법

### Alpha Vantage (주식 데이터)
1. [Alpha Vantage](https://www.alphavantage.co/support/#api-key) 무료 API 키 발급
2. \`.env\` 파일에 추가:
   \`\`\`env
   ALPHA_VANTAGE_API_KEY=your_api_key_here
   \`\`\`

### Exchange Rate API (외환 데이터)
1. [Exchange Rate API](https://app.exchangerate-api.com/sign-up) 무료 API 키 발급
2. \`.env\` 파일에 추가:
   \`\`\`env
   EXCHANGE_RATE_API_KEY=your_api_key_here
   \`\`\`

## 활용 전략

### 시장 상황별 대응
\`\`\`yaml
Risk-On (위험 선호):
  - 주식시장 상관관계 높음
  - 달러 약세
  - 공포/탐욕 지수 상승
  → 공격적 매수 전략

Risk-Off (위험 회피):
  - 주식시장 하락
  - 달러 강세
  - 공포 지수 상승
  → 방어적 전략, 현금 보유

디커플링:
  - 낮은 상관관계
  - 암호화폐 고유 움직임
  → 기술적 분석 중심
\`\`\`

💡 **핵심**: 시장 상관관계는 나침반과 같습니다. 큰 방향을 제시하지만, 세부 길은 스스로 찾아야 합니다!
    `,
  },

  // 뉴스 분석
  'advanced-strategies.news-analysis': {
    title: '뉴스 분석',
    content: `
# 뉴스 분석 기능 📰

## 뉴스 분석이란?

뉴스 분석은 실시간으로 암호화폐 관련 뉴스를 수집하고 감성 분석을 통해 시장 심리를 파악하는 기능입니다.

## 분석 지표

### 1. 감성 분석
\`\`\`yaml
긍정적 (Positive):
  - 호재 뉴스
  - 긍정적 키워드
  - 매수 신호
  
부정적 (Negative):
  - 악재 뉴스
  - 부정적 키워드
  - 매도 신호
  
중립적 (Neutral):
  - 정보성 뉴스
  - 객관적 보도
  - 관망 신호
\`\`\`

### 2. 키워드 분석
\`\`\`yaml
상승 키워드:
  - "상승", "돌파", "신고가"
  - "채택", "파트너십", "업그레이드"
  - "기관 투자", "대량 매수"
  
하락 키워드:
  - "하락", "붕괴", "폭락"
  - "규제", "금지", "해킹"
  - "매도", "청산", "버블"
\`\`\`

### 3. 영향력 점수
\`\`\`yaml
계산 요소:
  - 뉴스 출처 신뢰도
  - 언급 빈도
  - 소셜 미디어 확산도
  - 과거 영향력
  
점수별 대응:
  80-100: 매우 높음 → 즉각 대응
  60-80: 높음 → 포지션 조정
  40-60: 보통 → 모니터링
  0-40: 낮음 → 참고만
\`\`\`

## 뉴스 소스

### RSS 피드
- CoinDesk, CoinTelegraph
- Bloomberg Crypto
- Reuters Digital Assets
- 국내 주요 언론사

### 소셜 미디어
- Twitter/X (주요 인플루언서)
- Reddit (r/cryptocurrency)
- Telegram 채널

## 활용 방법

### 1. 단기 트레이딩
\`\`\`yaml
뉴스 봇 전략:
  - 빠른 뉴스 감지
  - 즉각적인 매매
  - 단기 차익 실현
  
주의사항:
  - 가짜 뉴스 필터링
  - 과도한 반응 주의
  - 리스크 관리 필수
\`\`\`

### 2. 중장기 투자
\`\`\`yaml
트렌드 파악:
  - 누적 감성 추이
  - 주요 이슈 추적
  - 시장 사이클 판단
  
활용:
  - 진입/청산 타이밍
  - 포트폴리오 조정
  - 리스크 헷징
\`\`\`

### 3. 리스크 관리
\`\`\`yaml
조기 경보:
  - 부정적 뉴스 급증
  - 규제 이슈 감지
  - 시장 공포 확산
  
대응:
  - 포지션 축소
  - 손절 라인 상향
  - 헷징 포지션
\`\`\`

## 설정 가이드

### 뉴스 필터링
- 관심 코인 설정
- 키워드 필터
- 언어 설정 (한/영)
- 중요도 임계값

### 알림 설정
- 영향력 점수 기준
- 감성 변화 알림
- 특정 키워드 알림

💡 **핵심**: 뉴스는 시장의 목소리입니다. 하지만 모든 목소리가 진실은 아닙니다. 현명하게 필터링하세요!
    `,
  },
};