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
};