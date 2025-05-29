// 스마트 주문 및 트레일링 스톱 문서
export const smartOrderContents = {
  'trading-strategy.smart-order': {
    title: '스마트 주문',
    content: `
# 스마트 주문 (Smart Order)

## 개요

스마트 주문은 호가창 분석을 통해 시장가와 지정가 주문을 자동으로 선택하는 고급 주문 기능입니다. 시장 상황에 따라 최적의 주문 방식을 선택하여 체결 가능성과 가격 효율성을 극대화합니다.

## 작동 원리

### 호가창 분석
\`\`\`javascript
const orderBookAnalysis = {
  // 매수 호가 분석
  bidAnalysis: {
    totalVolume: "총 매수 잔량",
    priceGap: "호가 간격",
    wallDetection: "매수벽 감지",
    depth: "호가 깊이"
  },
  
  // 매도 호가 분석
  askAnalysis: {
    totalVolume: "총 매도 잔량",
    priceGap: "호가 간격",
    resistanceLevel: "저항선 감지",
    liquidity: "유동성 수준"
  }
};
\`\`\`

### 주문 방식 선택 기준

#### 시장가 주문 선택 조건
\`\`\`
1. 높은 유동성
   - 호가창에 충분한 물량 존재
   - 스프레드가 0.1% 미만
   
2. 급한 체결 필요
   - 강한 매수/매도 신호
   - 손절 상황
   
3. 작은 주문 크기
   - 전체 호가 대비 1% 미만
\`\`\`

#### 지정가 주문 선택 조건
\`\`\`
1. 낮은 유동성
   - 호가창 물량 부족
   - 넓은 스프레드
   
2. 큰 주문 크기
   - 시장 충격 우려
   - 분할 체결 필요
   
3. 가격 민감 상황
   - 정확한 진입가 필요
   - 수익 극대화 목표
\`\`\`

## 구현 코드

### 스마트 주문 결정 로직
\`\`\`typescript
async function determineOrderType(
  market: string,
  side: 'bid' | 'ask',
  volume: number
): Promise<'market' | 'limit'> {
  const orderbook = await getOrderbook(market);
  
  // 스프레드 계산
  const spread = (orderbook.asks[0].price - orderbook.bids[0].price) 
                 / orderbook.bids[0].price;
  
  // 유동성 평가
  const liquidity = calculateLiquidity(orderbook, side, volume);
  
  // 시장 충격 예상
  const marketImpact = estimateMarketImpact(orderbook, volume);
  
  // 종합 판단
  if (spread < 0.001 && liquidity > 0.8 && marketImpact < 0.002) {
    return 'market';  // 시장가 주문
  } else {
    return 'limit';   // 지정가 주문
  }
}
\`\`\`

### 지정가 주문 가격 결정
\`\`\`typescript
function calculateLimitPrice(
  orderbook: Orderbook,
  side: 'bid' | 'ask',
  aggression: number = 0.5  // 0: 보수적, 1: 공격적
): number {
  if (side === 'bid') {
    // 매수 주문
    const bestBid = orderbook.bids[0].price;
    const bestAsk = orderbook.asks[0].price;
    const midPrice = (bestBid + bestAsk) / 2;
    
    // 공격성에 따라 가격 조정
    return bestBid + (midPrice - bestBid) * aggression;
  } else {
    // 매도 주문
    const bestBid = orderbook.bids[0].price;
    const bestAsk = orderbook.asks[0].price;
    const midPrice = (bestBid + bestAsk) / 2;
    
    return bestAsk - (bestAsk - midPrice) * aggression;
  }
}
\`\`\`

## 설정 옵션

### 기본 설정
\`\`\`json
{
  "smartOrder": {
    "enabled": true,
    "spreadThreshold": 0.1,      // 스프레드 임계값 (%)
    "liquidityThreshold": 0.7,   // 유동성 임계값
    "marketImpactLimit": 0.5,    // 시장 충격 한도 (%)
    "aggression": 0.5            // 주문 공격성 (0-1)
  }
}
\`\`\`

### 고급 설정
\`\`\`json
{
  "advancedSmartOrder": {
    "adaptiveSpread": true,      // 동적 스프레드 조정
    "volumeWeighting": true,     // 거래량 가중치 적용
    "timeInForce": "IOC",       // 주문 유효 시간
    "retryAttempts": 3,         // 재시도 횟수
    "priceImprovement": 0.01    // 가격 개선 목표 (%)
  }
}
\`\`\`

## 사용 예시

### 일반 매수 상황
\`\`\`
시장 상황:
- BTC/KRW
- 현재가: 50,000,000원
- 스프레드: 0.05%
- 매수 호가 물량: 충분

스마트 주문 판단:
→ 시장가 주문 선택
→ 즉시 체결
\`\`\`

### 대량 매도 상황
\`\`\`
시장 상황:
- ETH/KRW
- 매도 수량: 100 ETH
- 호가창 총 매수 물량: 80 ETH
- 스프레드: 0.3%

스마트 주문 판단:
→ 지정가 주문 선택
→ 3단계로 분할
→ 각각 다른 가격에 주문
\`\`\`

## 장점

1. **체결률 향상**: 시장 상황에 맞는 주문 방식 선택
2. **슬리피지 감소**: 큰 주문 시 시장 충격 최소화
3. **비용 절감**: 불필요한 스프레드 비용 방지
4. **자동 최적화**: 실시간 시장 분석 기반 결정

## 주의사항

<div class="warning">
⚠️ **주의**: 
- 극단적 변동성 시장에서는 예측이 어려울 수 있습니다
- 호가창 조작에 주의가 필요합니다
- 네트워크 지연으로 인한 정보 차이가 발생할 수 있습니다
</div>

## 모니터링

대시보드에서 스마트 주문 현황을 실시간으로 확인할 수 있습니다:
- 주문 방식 선택 통계
- 체결률 비교
- 평균 슬리피지
- 비용 절감 효과

<div class="info">
💡 **팁**: 거래량이 적은 알트코인의 경우 스마트 주문 기능이 특히 유용합니다.
</div>
    `,
  },
  'trading-strategy.trailing-stop': {
    title: '트레일링 스톱',
    content: `
# 트레일링 스톱 (Trailing Stop)

## 개요

트레일링 스톱은 가격이 유리한 방향으로 움직일 때 손절선을 자동으로 조정하는 동적 리스크 관리 기능입니다. 수익을 보호하면서도 추가 상승 가능성을 열어둡니다.

## 작동 원리

### 기본 개념
\`\`\`
1. 초기 손절선 설정
   예: 매수가 -5%
   
2. 가격 상승 시
   → 손절선도 함께 상승
   → 최고가 기준 -5% 유지
   
3. 가격 하락 시
   → 손절선은 고정
   → 손절선 도달 시 매도
\`\`\`

### 시각적 예시
\`\`\`
매수가: 100만원
초기 손절: 95만원 (-5%)

시나리오:
100만원 → 110만원: 손절선 105만원으로 상승
110만원 → 120만원: 손절선 115만원으로 상승
120만원 → 115만원: 손절선 115만원 유지
115만원 → 114만원: 손절선 도달, 매도 실행
결과: +14% 수익 확보
\`\`\`

## 구현 코드

### 트레일링 스톱 클래스
\`\`\`typescript
class TrailingStop {
  private buyPrice: number;
  private currentPrice: number;
  private highestPrice: number;
  private stopLossPercent: number;
  private activationPercent: number;
  
  constructor(config: TrailingStopConfig) {
    this.buyPrice = config.buyPrice;
    this.stopLossPercent = config.stopLossPercent;
    this.activationPercent = config.activationPercent || 0;
    this.highestPrice = this.buyPrice;
  }
  
  updatePrice(newPrice: number): TrailingStopResult {
    this.currentPrice = newPrice;
    
    // 새로운 최고가 갱신
    if (newPrice > this.highestPrice) {
      this.highestPrice = newPrice;
    }
    
    // 활성화 조건 확인
    const profitPercent = (this.currentPrice - this.buyPrice) / this.buyPrice * 100;
    if (profitPercent < this.activationPercent) {
      // 아직 활성화되지 않음
      return { 
        shouldSell: false, 
        stopPrice: this.buyPrice * (1 - this.stopLossPercent / 100) 
      };
    }
    
    // 트레일링 스톱 가격 계산
    const trailingStopPrice = this.highestPrice * (1 - this.stopLossPercent / 100);
    
    // 매도 신호 확인
    if (this.currentPrice <= trailingStopPrice) {
      return { 
        shouldSell: true, 
        stopPrice: trailingStopPrice,
        profit: profitPercent 
      };
    }
    
    return { 
      shouldSell: false, 
      stopPrice: trailingStopPrice 
    };
  }
}
\`\`\`

### 실시간 모니터링
\`\`\`typescript
async function monitorTrailingStop(position: Position) {
  const trailingStop = new TrailingStop({
    buyPrice: position.avgBuyPrice,
    stopLossPercent: position.trailingStopPercent,
    activationPercent: position.trailingStartPercent
  });
  
  // 가격 업데이트 구독
  subscribeToPrice(position.market, (price) => {
    const result = trailingStop.updatePrice(price);
    
    if (result.shouldSell) {
      // 매도 실행
      executeMarketSell(position.market, position.volume);
      
      // 알림 발송
      sendNotification({
        type: 'TRAILING_STOP_HIT',
        message: \`트레일링 스톱 실행: \${result.profit}% 수익 확보\`,
        position: position
      });
    }
    
    // UI 업데이트
    updateTrailingStopUI({
      currentPrice: price,
      stopPrice: result.stopPrice,
      distance: ((price - result.stopPrice) / price * 100).toFixed(2)
    });
  });
}
\`\`\`

## 설정 옵션

### 기본 설정
\`\`\`json
{
  "trailingStop": {
    "enabled": true,
    "defaultStopPercent": 5,      // 기본 손절 간격 (%)
    "activationPercent": 3,       // 활성화 수익률 (%)
    "updateInterval": 1000        // 업데이트 주기 (ms)
  }
}
\`\`\`

### 고급 전략별 설정
\`\`\`json
{
  "strategies": {
    "conservative": {
      "stopPercent": 3,
      "activationPercent": 2
    },
    "moderate": {
      "stopPercent": 5,
      "activationPercent": 3
    },
    "aggressive": {
      "stopPercent": 10,
      "activationPercent": 5
    }
  }
}
\`\`\`

## 활용 전략

### 1. 단계별 트레일링
\`\`\`
수익률별 손절 간격 조정:
- 0-5%: 5% 간격
- 5-10%: 4% 간격
- 10-20%: 3% 간격
- 20%+: 2% 간격

장점: 수익이 커질수록 더 타이트하게 보호
\`\`\`

### 2. 시간 기반 조정
\`\`\`
보유 기간별 조정:
- 1일 이내: 기본 설정
- 1-3일: 간격 1% 축소
- 3일 이상: 간격 2% 축소

장점: 장기 보유 시 변동성 대응
\`\`\`

### 3. 변동성 연동
\`\`\`typescript
function calculateDynamicStop(atr: number, basePercent: number): number {
  // ATR 기반 동적 조정
  const volatilityMultiplier = atr / 100;
  return basePercent * (1 + volatilityMultiplier);
}
\`\`\`

## 장점과 단점

### 장점
- ✅ 수익 보호: 이익을 확보하면서 추가 상승 기회 유지
- ✅ 감정 배제: 자동화된 매도 결정
- ✅ 리스크 관리: 최대 손실 제한
- ✅ 유연성: 시장 상황에 따른 조정

### 단점
- ❌ 조기 매도: 일시적 조정에도 매도 가능
- ❌ 기회 손실: 재진입 시 더 높은 가격
- ❌ 수수료: 빈번한 거래로 인한 비용

## 실전 예시

### 성공 사례
\`\`\`
BTC 매수: 5,000만원
설정: 5% 트레일링 스톱, 3% 활성화

과정:
1. 5,150만원 도달 → 트레일링 스톱 활성화
2. 5,500만원 상승 → 손절선 5,225만원
3. 5,300만원 조정 → 손절선 유지
4. 5,225만원 터치 → 자동 매도

결과: +4.5% 수익 (225만원)
\`\`\`

### 주의 사례
\`\`\`
ETH 매수: 300만원
설정: 3% 트레일링 스톱, 즉시 활성화

문제:
- 변동성 높은 시장
- 너무 타이트한 설정
- 빈번한 손절 발생

개선:
- 변동성 고려한 5-7% 설정
- 활성화 수익률 설정
\`\`\`

## 모니터링

### 대시보드 표시 정보
- 현재가와 손절선 거리
- 최고가 대비 현재가
- 활성화 상태
- 예상 수익/손실

### 알림 설정
- 트레일링 스톱 활성화
- 손절선 근접 경고 (1% 이내)
- 매도 실행 알림

<div class="tip">
💡 **프로 팁**: 
- 급등 후에는 트레일링 스톱을 타이트하게
- 횡보장에서는 넓게 설정
- 뉴스 이벤트 전후로 조정 고려
</div>

<div class="warning">
⚠️ **주의사항**:
- 갭 하락 시 설정가보다 낮게 체결될 수 있음
- 유동성이 낮은 코인은 신중히 사용
- 네트워크 장애 시 작동하지 않을 수 있음
</div>
    `,
  }
};