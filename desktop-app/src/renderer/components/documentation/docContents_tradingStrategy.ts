// 거래 전략 설정 섹션 문서
export const tradingStrategyContents = {
  // 전역 vs 코인별 설정
  'trading-strategy.global-vs-coin': {
    title: '전역 vs 코인별 설정',
    content: `
# 전역 vs 코인별 설정 🎯

## 설정 체계 이해하기

프로그램은 유연한 설정 체계를 제공하여 전체적인 전략과 개별 코인의 특성을 모두 고려할 수 있습니다.

## 전역 설정

### 전역 설정이란?
\`\`\`yaml
정의: 모든 코인에 공통으로 적용되는 기본 설정

범위:
  - 기본 거래 전략
  - 리스크 관리 규칙
  - 공통 지표 설정
  - 일반 매매 조건

장점:
  - 일관된 거래 규칙
  - 간편한 관리
  - 빠른 설정
\`\`\`

### 전역 설정 항목
\`\`\`yaml
거래 설정:
  - 최소 신뢰도: 70%
  - 최대 포지션 수: 5개
  - 기본 투자 비율: 10%

리스크 관리:
  - 손절 기준: -5%
  - 익절 목표: +10%
  - 일일 최대 손실: -10%

기술적 지표:
  - RSI 기간: 14
  - MACD: (12, 26, 9)
  - 볼린저밴드: (20, 2)

시간 설정:
  - 분석 주기: 60초
  - 쿨다운: 300초
  - 거래 시간: 24시간
\`\`\`

## 코인별 설정

### 코인별 설정이 필요한 이유
\`\`\`yaml
코인별 특성:
  BTC:
    - 낮은 변동성
    - 높은 유동성
    - 뉴스 민감도 높음
    
  알트코인:
    - 높은 변동성
    - 낮은 유동성
    - 펌프&덤프 위험

메이저 vs 마이너:
  - 거래량 차이
  - 스프레드 차이
  - 조작 가능성
\`\`\`

### 코인별 커스터마이징
\`\`\`yaml
BTC 전용 설정:
  - 신뢰도 임계값: 65% (낮춤)
  - 투자 비율: 30% (높임)
  - 손절선: -3% (타이트)
  - 기술 지표 신뢰도 상향

ETH 전용 설정:
  - 신뢰도 임계값: 70%
  - 투자 비율: 20%
  - 손절선: -5%
  - DeFi 뉴스 가중치 증가

소형 알트코인:
  - 신뢰도 임계값: 80% (높임)
  - 투자 비율: 5% (낮춤)
  - 손절선: -7% (여유)
  - 거래량 지표 중시
\`\`\`

## 설정 우선순위

### 적용 규칙
\`\`\`python
def get_setting(coin, setting_name):
    # 1. 코인별 설정 확인
    if coin_settings[coin].has(setting_name):
        return coin_settings[coin][setting_name]
    
    # 2. 코인 그룹 설정 확인 (메이저/마이너)
    if group_settings[coin.group].has(setting_name):
        return group_settings[coin.group][setting_name]
    
    # 3. 전역 설정 사용
    return global_settings[setting_name]
\`\`\`

### 설정 상속 체계
\`\`\`
전역 설정 (기본값)
    ↓
그룹 설정 (메이저/마이너)
    ↓
코인별 설정 (최우선)
\`\`\`

## 실전 설정 예시

### Case 1: 보수적 투자자
\`\`\`yaml
전역 설정:
  신뢰도: 80%
  손절: -3%
  익절: +5%
  
BTC 오버라이드:
  신뢰도: 75% (살짝 낮춤)
  투자비율: 40%
  
알트코인 오버라이드:
  신뢰도: 85% (더 엄격)
  투자비율: 5%
  거래 금지 시간: 새벽
\`\`\`

### Case 2: 공격적 트레이더
\`\`\`yaml
전역 설정:
  신뢰도: 60%
  손절: -7%
  익절: +15%
  
변동성 높은 코인:
  레버리지: 2x
  분할 매수: 3회
  트레일링 스톱: 활성화
  
안정적 코인:
  신뢰도: 65%
  포지션 크기: 증가
\`\`\`

## 그룹 설정 활용

### 코인 그룹 분류
\`\`\`yaml
메이저 그룹:
  - 코인: BTC, ETH
  - 특징: 안정적, 높은 유동성
  - 설정: 공격적 가능

중형 그룹:
  - 코인: BNB, XRP, ADA
  - 특징: 중간 변동성
  - 설정: 균형잡힌 접근

소형 그룹:
  - 코인: 시가총액 100위 밖
  - 특징: 고위험 고수익
  - 설정: 매우 보수적

스테이블코인:
  - 코인: USDT, USDC
  - 특징: 가격 안정
  - 설정: 차익거래용
\`\`\`

### 그룹별 전략
\`\`\`python
group_strategies = {
    "major": {
        "strategy": "trend_following",
        "indicators": ["MA", "MACD"],
        "risk_level": "moderate"
    },
    "mid": {
        "strategy": "swing_trading",
        "indicators": ["RSI", "BB"],
        "risk_level": "balanced"
    },
    "small": {
        "strategy": "scalping",
        "indicators": ["Volume", "Momentum"],
        "risk_level": "conservative"
    }
}
\`\`\`

## 설정 관리 팁

### 설정 템플릿
\`\`\`yaml
템플릿 저장:
  1. 현재 설정을 템플릿으로
  2. 이름 지정 (예: "BTC 전용")
  3. 설명 추가
  4. 다른 코인에 적용 가능

제공 템플릿:
  - 안정형 BTC
  - 변동성 알트
  - 스캘핑 전용
  - 장기 투자
\`\`\`

### 설정 이력 관리
\`\`\`yaml
버전 관리:
  - 변경 사항 자동 기록
  - 이전 버전 복원 가능
  - 성과와 연결
  - A/B 테스트 지원

변경 로그:
  2024-01-15: BTC 신뢰도 70→65%
  2024-01-20: ETH 손절 -5→-4%
  2024-01-25: XRP 추가, 기본값 사용
\`\`\`

## 동적 설정 조정

### 시장 상황 반영
\`\`\`python
def adjust_settings_by_market():
    market_volatility = calculate_volatility()
    
    if market_volatility > HIGH_THRESHOLD:
        # 고변동성 시장
        for coin in all_coins:
            coin.confidence_threshold *= 1.1
            coin.stop_loss *= 1.2
            
    elif market_volatility < LOW_THRESHOLD:
        # 저변동성 시장
        for coin in all_coins:
            coin.confidence_threshold *= 0.9
            coin.position_size *= 1.2
\`\`\`

### 성과 기반 조정
\`\`\`yaml
자동 최적화:
  - 최근 N일 성과 분석
  - 손실 코인 설정 보수화
  - 수익 코인 설정 유지
  - 점진적 조정 (±5%)

수동 검토:
  - 주간 성과 리뷰
  - 설정 효과성 평가
  - 필요시 대폭 수정
\`\`\`

## 설정 충돌 해결

### 충돌 상황
\`\`\`yaml
예시:
  전역: 최대 포지션 5개
  BTC: 최대 투자 50%
  ETH: 최대 투자 40%
  
문제: 두 코인만으로도 90%

해결:
  1. 비율 기반 조정
  2. 우선순위 적용
  3. 경고 메시지
\`\`\`

### 검증 시스템
\`\`\`python
def validate_settings():
    errors = []
    warnings = []
    
    # 투자 비율 합계 확인
    total_allocation = sum(coin.max_allocation)
    if total_allocation > 100:
        errors.append("총 할당 비율 초과")
    
    # 논리적 모순 확인
    for coin in coins:
        if coin.stop_loss > coin.take_profit:
            errors.append(f"{coin}: 손절 > 익절")
    
    return errors, warnings
\`\`\`

## 모범 사례

### 시작 시
1. 전역 설정으로 시작
2. 1-2주 운영 후 분석
3. 문제 코인만 개별 조정
4. 점진적 최적화

### 주의사항
- 너무 많은 개별 설정 지양
- 일관성 있는 규칙 유지
- 정기적 리뷰 필수
- 백테스트로 검증

💡 **핵심**: 전역 설정으로 기본 틀을 잡고, 코인별 특성에 따라 미세 조정하세요!
    `,
  },

  // 매수/매도 조건
  'trading-strategy.buy-sell-conditions': {
    title: '매수/매도 조건 설정',
    content: `
# 매수/매도 조건 설정 📊

## 매수 조건 설정

### 기본 매수 신호
\`\`\`yaml
필수 조건 (AND):
  - 종합 신뢰도 ≥ 설정값
  - 보유 포지션 < 최대값
  - 쿨다운 시간 경과
  - API 정상 작동

선택 조건 (OR):
  - RSI < 30 (과매도)
  - MACD 골든크로스
  - 볼린저밴드 하단 터치
  - AI 강력 매수 신호
\`\`\`

### 매수 신호 조합
\`\`\`python
def generate_buy_signal():
    signals = []
    
    # 기술적 지표
    if rsi < 30:
        signals.append(("RSI 과매도", 0.25))
    
    if macd_cross_up:
        signals.append(("MACD 상향", 0.20))
        
    if price < bb_lower:
        signals.append(("BB 하단", 0.15))
    
    # AI 분석
    ai_signal = claude_analysis()
    if ai_signal.recommendation == "STRONG_BUY":
        signals.append(("AI 매수", 0.40))
    
    # 종합 점수
    total_score = sum(score for _, score in signals)
    
    return {
        'score': total_score,
        'signals': signals,
        'action': 'BUY' if total_score >= threshold else 'HOLD'
    }
\`\`\`

### 매수 강도 결정
\`\`\`yaml
신뢰도별 포지션 크기:
  90-100%: 최대 금액 × 100%
  80-90%: 최대 금액 × 75%
  70-80%: 최대 금액 × 50%
  60-70%: 최대 금액 × 25%

분할 매수:
  1차: 신호 발생 시 30%
  2차: -2% 하락 시 30%
  3차: -4% 하락 시 40%
\`\`\`

## 매도 조건 설정

### 익절 조건
\`\`\`yaml
목표 수익률 도달:
  - 1차 목표: +5% (30% 매도)
  - 2차 목표: +10% (40% 매도)
  - 3차 목표: +15% (30% 매도)

기술적 신호:
  - RSI > 70 (과매수)
  - MACD 데드크로스
  - 볼린저밴드 상단 돌파
  - 저항선 도달

시간 기반:
  - 보유 기간 > 설정값
  - 수익률 정체
\`\`\`

### 손절 조건
\`\`\`yaml
고정 손절:
  - 기본: -5%
  - 변동성 높음: -7%
  - 변동성 낮음: -3%

동적 손절:
  - ATR 기반: 진입가 - (2 × ATR)
  - 지지선 기반: 주요 지지선 -1%
  - 시간 손절: N일 후 손실 시

트레일링 스톱:
  - 활성화: 수익 +3% 이상
  - 추적 거리: 고점 대비 -2%
  - 단계별 상향
\`\`\`

## 고급 조건 설정

### 시장 상황 필터
\`\`\`python
def market_condition_filter(signal):
    # 비트코인 동향 확인
    btc_trend = get_btc_trend()
    
    if btc_trend == "STRONG_DOWN" and coin != "BTC":
        # BTC 급락 시 알트코인 매수 금지
        return False
        
    # 거래량 확인
    if volume < average_volume * 0.5:
        # 거래량 부족 시 거래 금지
        return False
        
    # 변동성 확인
    if volatility > extreme_threshold:
        # 극단적 변동성 시 대기
        return False
        
    return True
\`\`\`

### 상관관계 필터
\`\`\`yaml
포트폴리오 상관관계:
  - 이미 보유 코인과 상관계수 > 0.8
  - 동일 섹터 집중도 체크
  - 리스크 분산 확인

크로스 마켓:
  - USDT 프리미엄 확인
  - 김치 프리미엄 활용
  - 타 거래소 가격 차이
\`\`\`

### 뉴스/이벤트 필터
\`\`\`yaml
긍정적 이벤트:
  - 메이저 거래소 상장
  - 대형 파트너십
  - 기술적 업그레이드
  → 매수 신호 강화 (+20%)

부정적 이벤트:
  - 규제 이슈
  - 해킹 사고
  - 기술적 문제
  → 매수 금지, 즉시 매도
\`\`\`

## 조건 우선순위

### 매수 우선순위
\`\`\`yaml
1순위 (즉시 실행):
  - 신뢰도 > 90%
  - 모든 지표 일치
  - AI 강력 추천
  - 긍정적 뉴스

2순위 (검토 후 실행):
  - 신뢰도 70-90%
  - 주요 지표 일치
  - 시장 상황 양호

3순위 (보류):
  - 신뢰도 < 70%
  - 지표 상충
  - 시장 불안정
\`\`\`

### 매도 우선순위
\`\`\`yaml
긴급 매도:
  - 손절선 도달
  - 시스템 위험 감지
  - 블랙스완 이벤트

일반 매도:
  - 목표가 도달
  - 기술적 신호
  - 보유 기간 만료

부분 매도:
  - 단계별 익절
  - 리밸런싱
  - 리스크 관리
\`\`\`

## 조건 최적화

### 백테스트 기반
\`\`\`python
def optimize_conditions():
    best_params = {
        'buy_rsi': 30,
        'sell_rsi': 70,
        'stop_loss': -5,
        'take_profit': 10
    }
    
    for rsi_buy in range(20, 40):
        for rsi_sell in range(60, 80):
            results = backtest(
                buy_rsi=rsi_buy,
                sell_rsi=rsi_sell
            )
            
            if results.sharpe_ratio > best_sharpe:
                best_params['buy_rsi'] = rsi_buy
                best_params['sell_rsi'] = rsi_sell
                
    return best_params
\`\`\`

### 실시간 조정
\`\`\`yaml
성과 모니터링:
  - 매주 조건별 성과 분석
  - 승률 낮은 조건 비활성화
  - 수익률 높은 조건 강화

A/B 테스트:
  - 50% 기존 조건
  - 50% 새로운 조건
  - 2주간 비교
  - 우수 조건 채택
\`\`\`

## 실전 예시

### 보수적 설정
\`\`\`yaml
매수 조건:
  - RSI < 25 (매우 과매도)
  - 신뢰도 > 80%
  - BTC 상승 중
  - 거래량 증가

매도 조건:
  - 고정 익절: +5%
  - 고정 손절: -3%
  - 보유 기간: 최대 7일
\`\`\`

### 공격적 설정
\`\`\`yaml
매수 조건:
  - RSI < 35
  - 신뢰도 > 60%
  - 모멘텀 증가
  - 분할 매수 3회

매도 조건:
  - 트레일링 스톱
  - 목표: +15%
  - 손절: -7%
  - 시간 제한 없음
\`\`\`

## 주의사항

### 과최적화 방지
- 너무 많은 조건 지양
- 단순명료한 규칙
- 시장 변화 대응력

### 감정 배제
- 조건 임의 변경 금지
- 손실 후 보복 거래 금지
- 규칙 일관성 유지

### 정기 검토
- 월 1회 조건 검토
- 시장 환경 변화 반영
- 지속적 개선

💡 **핵심**: 명확한 규칙을 세우고 철저히 지키되, 시장 변화에 따라 유연하게 조정하세요!
    `,
  },

  // 신뢰도 임계값
  'trading-strategy.confidence-threshold': {
    title: '신뢰도 임계값 설정',
    content: `
# 신뢰도 임계값 설정 🎯

## 신뢰도 임계값이란?

신뢰도 임계값은 매매 신호를 실제 거래로 전환하는 기준점입니다. 이 값의 설정이 수익률과 거래 빈도를 결정합니다.

## 임계값 이해하기

### 신뢰도 범위
\`\`\`yaml
0-100% 스케일:
  90-100%: 매우 강한 신호 (희귀)
  80-90%: 강한 신호 (주 1-2회)
  70-80%: 보통 신호 (일 1-2회)
  60-70%: 약한 신호 (빈번)
  50-60%: 노이즈 수준

거래 빈도 예상:
  90% 임계값: 월 2-3회
  80% 임계값: 주 2-3회
  70% 임계값: 일 2-3회
  60% 임계값: 시간당 1-2회
\`\`\`

### 임계값과 수익률 관계
\`\`\`python
# 백테스트 결과 예시
threshold_performance = {
    60: {'trades': 520, 'win_rate': 48%, 'profit': -5%},
    70: {'trades': 156, 'win_rate': 58%, 'profit': +12%},
    80: {'trades': 42,  'win_rate': 71%, 'profit': +18%},
    90: {'trades': 8,   'win_rate': 87%, 'profit': +15%}
}

# 최적점: 80% (수익률과 거래 횟수 균형)
\`\`\`

## 임계값 설정 전략

### 시장별 권장값
\`\`\`yaml
상승장 (Bull Market):
  - 기본 임계값: 65-70%
  - 이유: 기회 포착 중요
  - 리스크: 감수 가능

하락장 (Bear Market):
  - 기본 임계값: 80-85%
  - 이유: 자본 보존 우선
  - 리스크: 최소화

횡보장 (Sideways):
  - 기본 임계값: 75-80%
  - 이유: 가짜 신호 많음
  - 리스크: 중간
\`\`\`

### 코인별 조정
\`\`\`yaml
BTC (메이저):
  - 권장: 70-75%
  - 이유: 안정적 패턴
  - 조정: -5% 가능

ETH (준메이저):
  - 권장: 75%
  - 이유: BTC 연동성
  - 조정: 기본값 유지

소형 알트:
  - 권장: 80-85%
  - 이유: 높은 변동성
  - 조정: +10% 권장

신규 상장:
  - 권장: 90%+
  - 이유: 패턴 부족
  - 조정: 매우 보수적
\`\`\`

## 동적 임계값 시스템

### 자동 조정 로직
\`\`\`python
def dynamic_threshold(base_threshold):
    # 시장 상황 반영
    market_volatility = calculate_volatility()
    
    # 최근 성과 반영
    recent_performance = get_recent_trades()
    
    # 조정 계산
    adjustment = 0
    
    # 변동성 조정
    if market_volatility > HIGH_VOL:
        adjustment += 5  # 더 엄격하게
    elif market_volatility < LOW_VOL:
        adjustment -= 3  # 더 유연하게
    
    # 성과 조정
    if recent_performance.win_rate < 50:
        adjustment += 3  # 기준 높이기
    elif recent_performance.win_rate > 70:
        adjustment -= 2  # 기준 낮추기
    
    # 최종 임계값
    final_threshold = base_threshold + adjustment
    
    # 범위 제한
    return max(60, min(90, final_threshold))
\`\`\`

### 시간대별 조정
\`\`\`yaml
한국 시간 기준:
  09:00-11:00: 
    - 조정: +2%
    - 이유: 아시아 개장
    
  14:00-17:00:
    - 조정: 0%
    - 이유: 안정적
    
  22:00-02:00:
    - 조정: +5%
    - 이유: 미국 변동성
    
  03:00-06:00:
    - 조정: +10%
    - 이유: 유동성 부족
\`\`\`

## 임계값 최적화

### 그리드 서치
\`\`\`python
def optimize_threshold():
    best_threshold = 70
    best_score = 0
    
    for threshold in range(60, 91, 5):
        # 백테스트 실행
        results = backtest(
            confidence_threshold=threshold,
            period='3months'
        )
        
        # 평가 지표
        score = calculate_score(
            profit=results.total_profit,
            drawdown=results.max_drawdown,
            trades=results.num_trades,
            sharpe=results.sharpe_ratio
        )
        
        if score > best_score:
            best_score = score
            best_threshold = threshold
    
    return best_threshold
\`\`\`

### 베이지안 최적화
\`\`\`yaml
초기 추정:
  - 사전 분포: 70-80%
  - 신뢰 구간: 95%

업데이트:
  - 매 거래 후 갱신
  - 성공: 하향 압력
  - 실패: 상향 압력

수렴:
  - 보통 100거래 후
  - 안정적 범위 도달
\`\`\`

## 멀티 임계값 전략

### 계층적 임계값
\`\`\`yaml
레벨 1 (관찰):
  - 임계값: 60%
  - 동작: 워치리스트 추가
  - 알림: 정보성

레벨 2 (준비):
  - 임계값: 70%
  - 동작: 소액 진입 준비
  - 알림: 주의

레벨 3 (실행):
  - 임계값: 80%
  - 동작: 본격 매수
  - 알림: 실행

레벨 4 (확신):
  - 임계값: 90%
  - 동작: 최대 포지션
  - 알림: 긴급
\`\`\`

### 상황별 다중 임계값
\`\`\`python
thresholds = {
    'normal': {
        'buy': 75,
        'sell': 70,
        'stop_loss': 60
    },
    'volatile': {
        'buy': 85,
        'sell': 65,
        'stop_loss': 55
    },
    'trending': {
        'buy': 70,
        'sell': 80,
        'stop_loss': 65
    }
}
\`\`\`

## 실전 적용 예시

### Case 1: 초보자
\`\`\`yaml
시작 설정:
  - 임계값: 80%
  - 고정값 사용
  - 자동 조정 OFF

1개월 후:
  - 거래 분석
  - 너무 적으면 75%로
  - 손실 많으면 85%로

3개월 후:
  - 동적 조정 ON
  - ±5% 범위
\`\`\`

### Case 2: 경험자
\`\`\`yaml
설정:
  - 기본: 70%
  - 동적 조정: ON
  - 범위: 65-85%

특수 규칙:
  - 연속 손실 3회: +10%
  - 연속 수익 5회: -5%
  - 월 수익 10%+: -3%
\`\`\`

## 임계값 모니터링

### 대시보드 표시
\`\`\`yaml
실시간 정보:
  - 현재 임계값: 75%
  - 기본값: 70%
  - 조정 요인: 변동성 +5%
  - 다음 검토: 2시간 후

통계:
  - 평균 임계값: 73%
  - 임계값 분포 그래프
  - 임계값별 성과
\`\`\`

### 알림 설정
\`\`\`yaml
임계값 변경 알림:
  - 5% 이상 변경 시
  - 극단값 도달 시 (60%, 90%)
  - 수동 개입 필요 시

성과 알림:
  - 현재 임계값 성과
  - 최적 임계값 제안
  - A/B 테스트 결과
\`\`\`

## 문제 해결

### 거래 너무 많음
- 임계값 5-10% 상향
- 쿨다운 시간 증가
- 필터 조건 추가

### 거래 너무 적음
- 임계값 5% 하향
- 시간대 확대
- 코인 종류 추가

### 수익률 저조
- 임계값 분석
- 시장별 조정
- 전략 재검토

## 고급 팁

### 심리적 요인
\`\`\`yaml
FOMO 방지:
  - 임계값 임의 하향 금지
  - 규칙 준수
  - 기회는 또 온다

손실 회피:
  - 손실 후 상향 금지
  - 일관성 유지
  - 장기 관점
\`\`\`

### 복합 전략
\`\`\`python
# 시장 체제별 다른 임계값
if market_regime == "STRONG_TREND":
    threshold = 65  # 추세 추종
elif market_regime == "RANGING":
    threshold = 80  # 신중한 접근
else:
    threshold = 75  # 기본값
\`\`\`

💡 **핵심**: 임계값은 필터입니다. 너무 낮으면 노이즈, 너무 높으면 기회 상실. 균형이 중요합니다!
    `,
  },

  // 쿨다운 시간 설정
  'trading-strategy.cooldown': {
    title: '쿨다운 시간 설정',
    content: `
# 쿨다운 시간 설정 ⏱️

## 쿨다운이란?

쿨다운은 거래 후 다음 거래까지의 최소 대기 시간입니다. 과도한 거래를 방지하고 감정적 대응을 차단합니다.

## 쿨다운의 필요성

### 왜 필요한가?
\`\`\`yaml
과매매 방지:
  - 연속 손실 방지
  - 수수료 절감
  - 체력 관리

감정 제어:
  - FOMO 차단
  - 복수 매매 방지
  - 냉정한 판단

시스템 보호:
  - API 제한 준수
  - 서버 부하 감소
  - 안정성 확보
\`\`\`

### 쿨다운 없이 발생하는 문제
\`\`\`python
# 실제 사례
without_cooldown = {
    "trades_per_day": 47,
    "fees_paid": 235000,  # 원
    "win_rate": 34%,      # 매우 낮음
    "emotion_trades": 31,  # 전체의 66%
    "final_profit": -18%
}

with_cooldown = {
    "trades_per_day": 8,
    "fees_paid": 40000,
    "win_rate": 62%,
    "emotion_trades": 1,
    "final_profit": +12%
}
\`\`\`

## 쿨다운 종류

### 1. 기본 쿨다운
\`\`\`yaml
정의: 모든 거래 후 적용

설정값:
  - 권장: 300초 (5분)
  - 최소: 60초
  - 최대: 3600초 (1시간)

적용:
  - 매수 후
  - 매도 후
  - 주문 취소 후
\`\`\`

### 2. 동일 코인 쿨다운
\`\`\`yaml
정의: 같은 코인 재거래 제한

설정값:
  - 권장: 600초 (10분)
  - 손실 후: 1800초 (30분)
  - 이익 후: 300초 (5분)

목적:
  - 추격 매수 방지
  - 재진입 신중
  - 객관성 회복
\`\`\`

### 3. 손실 후 쿨다운
\`\`\`yaml
정의: 손실 거래 후 추가 대기

설정:
  - 소액 손실 (-3%): +10분
  - 중간 손실 (-5%): +30분
  - 대액 손실 (-10%): +60분

누적:
  - 연속 손실 시 배수 적용
  - 2연속: ×1.5
  - 3연속: ×2.0
  - 4연속+: 거래 중단
\`\`\`

### 4. 전략별 쿨다운
\`\`\`python
strategy_cooldowns = {
    "scalping": {
        "base": 60,      # 1분
        "same_coin": 180, # 3분
        "after_loss": 300 # 5분
    },
    "day_trading": {
        "base": 300,      # 5분
        "same_coin": 600, # 10분
        "after_loss": 900 # 15분
    },
    "swing_trading": {
        "base": 3600,     # 1시간
        "same_coin": 7200, # 2시간
        "after_loss": 14400 # 4시간
    }
}
\`\`\`

## 동적 쿨다운 시스템

### 시장 상황 반영
\`\`\`python
def calculate_dynamic_cooldown(base_cooldown):
    # 변동성 체크
    volatility = get_market_volatility()
    
    # 거래량 체크
    volume_ratio = current_volume / average_volume
    
    # 조정 계수
    multiplier = 1.0
    
    if volatility > HIGH_VOLATILITY:
        multiplier *= 1.5  # 고변동성 시 쿨다운 증가
    
    if volume_ratio < 0.5:
        multiplier *= 1.3  # 저거래량 시 쿨다운 증가
    
    if consecutive_losses > 2:
        multiplier *= 2.0  # 연속 손실 시 쿨다운 배증
    
    return int(base_cooldown * multiplier)
\`\`\`

### 성과 기반 조정
\`\`\`yaml
좋은 성과:
  - 최근 5거래 중 4승
  - 쿨다운 10% 감소
  - 최소값 유지

나쁜 성과:
  - 최근 5거래 중 1승
  - 쿨다운 50% 증가
  - 재평가 필요

중립 성과:
  - 기본값 유지
  - 변경 없음
\`\`\`

## 쿨다운 우회 조건

### 긴급 상황
\`\`\`yaml
즉시 거래 허용:
  1. 손절 신호
     - 추가 손실 방지
     - 쿨다운 무시
     
  2. 시스템 위험
     - API 오류
     - 거래소 점검
     
  3. 블랙스완
     - 급락 시장
     - 뉴스 이벤트
\`\`\`

### 특별 기회
\`\`\`python
def check_override_conditions():
    # 극도로 강한 신호
    if confidence > 95:
        return True
        
    # 차익거래 기회
    if arbitrage_opportunity > 2:
        return True
        
    # VIP 뉴스
    if breaking_news_impact > "HIGH":
        return True
        
    return False
\`\`\`

## 쿨다운 최적화

### A/B 테스트
\`\`\`yaml
그룹 A (통제군):
  - 쿨다운: 300초 고정
  - 기간: 1개월
  - 측정: 수익률, 거래수

그룹 B (실험군):
  - 쿨다운: 동적 (180-600초)
  - 기간: 1개월
  - 측정: 동일

결과 분석:
  - 수익률 차이
  - 거래 품질
  - 스트레스 레벨
\`\`\`

### 백테스트 최적화
\`\`\`python
def optimize_cooldown():
    results = {}
    
    for cooldown in range(60, 1801, 60):  # 1분~30분
        backtest_result = run_backtest(
            cooldown_seconds=cooldown,
            period="6months"
        )
        
        results[cooldown] = {
            'profit': backtest_result.total_profit,
            'trades': backtest_result.num_trades,
            'win_rate': backtest_result.win_rate,
            'avg_profit': backtest_result.avg_profit_per_trade
        }
    
    # 최적값 찾기
    best_cooldown = max(results, 
        key=lambda x: results[x]['profit'] * results[x]['win_rate'])
    
    return best_cooldown
\`\`\`

## 실전 적용 예시

### 보수적 트레이더
\`\`\`yaml
설정:
  기본 쿨다운: 600초 (10분)
  동일 코인: 1800초 (30분)
  손실 후: 3600초 (1시간)
  
특징:
  - 하루 10회 이하 거래
  - 충분한 분석 시간
  - 감정 완전 배제
  - 안정적 수익
\`\`\`

### 활발한 트레이더
\`\`\`yaml
설정:
  기본 쿨다운: 180초 (3분)
  동일 코인: 300초 (5분)
  손실 후: 600초 (10분)
  
특징:
  - 하루 20-30회 거래
  - 빠른 기회 포착
  - 적절한 제어
  - 균형잡힌 접근
\`\`\`

### 스캘퍼
\`\`\`yaml
설정:
  기본 쿨다운: 30초
  동일 코인: 60초
  손실 후: 180초
  
주의:
  - 극도로 짧은 쿨다운
  - 전문가만 권장
  - 수수료 주의
  - 번아웃 위험
\`\`\`

## 쿨다운 모니터링

### 대시보드 표시
\`\`\`yaml
현재 상태:
  ┌─────────────────────────┐
  │ 쿨다운 상태            │
  │ BTC: 2:34 남음         │
  │ ETH: 거래 가능         │
  │ XRP: 5:12 남음         │
  │                        │
  │ 글로벌: 1:20 남음      │
  └─────────────────────────┘
\`\`\`

### 통계 분석
\`\`\`python
cooldown_stats = {
    "avg_cooldown": 324,  # 초
    "cooldown_triggers": {
        "normal": 156,
        "loss": 34,
        "consecutive": 12
    },
    "override_count": 3,
    "effectiveness": 87%  # 감정 거래 감소율
}
\`\`\`

## 심리적 효과

### 긍정적 효과
\`\`\`yaml
인내심 향상:
  - 기다림의 가치 학습
  - 충동 억제 훈련
  - 계획적 사고

스트레스 감소:
  - 연속 거래 압박 해소
  - 휴식 시간 확보
  - 장기 관점 유지

수익률 개선:
  - 거래 품질 향상
  - 수수료 절감
  - 실수 감소
\`\`\`

### 부정적 효과 방지
\`\`\`yaml
기회 상실 불안:
  - 대처: "기회는 항상 온다"
  - 통계로 증명
  - 장기 성과 추적

지루함:
  - 대처: 다른 분석 수행
  - 교육 자료 학습
  - 전략 개선
\`\`\`

## 모범 사례

### DO's ✅
- 쿨다운 중 차트 분석
- 거래 일지 작성
- 다음 거래 계획
- 멘탈 관리
- 규칙 준수

### DON'Ts ❌
- 쿨다운 임의 해제
- 다른 계정 사용
- 초조함에 굴복
- 규칙 자주 변경
- 시스템 의심

💡 **핵심**: 쿨다운은 브레이크입니다. 속도를 줄여야 안전하게 목적지에 도착합니다!
    `,
  },

  // 손절/익절 전략
  'trading-strategy.stop-loss-take-profit': {
    title: '손절/익절 전략',
    content: `
# 손절/익절 전략 💰

## 손절(Stop Loss)의 중요성

손절은 자본을 보호하는 가장 중요한 도구입니다. 작은 손실을 받아들여 큰 손실을 방지합니다.

## 손절 전략

### 1. 고정 비율 손절
\`\`\`yaml
기본 설정:
  - 표준: -5%
  - 보수적: -3%
  - 공격적: -7%

코인별 조정:
  - BTC: -3% (변동성 낮음)
  - 메이저 알트: -5%
  - 소형 알트: -7~10%

계산:
  손절가 = 진입가 × (1 - 손절비율)
  예: 100만원 × (1 - 0.05) = 95만원
\`\`\`

### 2. ATR 기반 손절
\`\`\`python
def calculate_atr_stop_loss(entry_price, atr_value, multiplier=2):
    """
    ATR(Average True Range) 기반 동적 손절
    변동성에 따라 자동 조정
    """
    stop_loss = entry_price - (atr_value * multiplier)
    
    # 최대 손실 제한
    max_loss = entry_price * 0.9  # -10% 한계
    
    return max(stop_loss, max_loss)

# 예시
# ATR = 50,000원, 진입가 = 1,000,000원
# 손절가 = 1,000,000 - (50,000 × 2) = 900,000원
\`\`\`

### 3. 지지선 기반 손절
\`\`\`yaml
방법:
  1. 주요 지지선 식별
  2. 지지선 아래 1-2% 설정
  3. 가짜 돌파 방어

예시:
  - 진입가: 1,000,000원
  - 지지선: 950,000원
  - 손절가: 940,000원 (-1%)

장점:
  - 기술적 근거
  - 자연스러운 위치
  - 시장 구조 활용
\`\`\`

### 4. 시간 기반 손절
\`\`\`python
def time_based_stop_loss(position):
    """
    보유 시간에 따른 손절 조정
    """
    holding_days = position.get_holding_days()
    current_pnl = position.get_pnl_percent()
    
    if holding_days > 7 and current_pnl < 0:
        # 1주일 후 손실 중이면 손절 강화
        return True
        
    if holding_days > 14 and current_pnl < 5:
        # 2주 후 5% 미만 수익이면 청산 고려
        return True
        
    return False
\`\`\`

## 익절(Take Profit) 전략

### 1. 고정 목표 익절
\`\`\`yaml
단계별 익절:
  1차: +5% (포지션의 30%)
  2차: +10% (포지션의 40%)
  3차: +15% (포지션의 30%)

일괄 익절:
  - 단기: +3-5%
  - 중기: +10-15%
  - 장기: +20% 이상

심리적 지지선:
  - 라운드 넘버 활용
  - 전고점 근처
  - 피보나치 레벨
\`\`\`

### 2. 리스크/리워드 비율
\`\`\`python
def calculate_take_profit(entry_price, stop_loss, risk_reward_ratio=2):
    """
    리스크 대비 리워드 비율로 익절 계산
    """
    risk = entry_price - stop_loss
    reward = risk * risk_reward_ratio
    take_profit = entry_price + reward
    
    return take_profit

# 예시
# 진입: 100만원, 손절: 95만원 (리스크 5만원)
# R:R = 1:2 → 익절: 110만원 (리워드 10만원)
# R:R = 1:3 → 익절: 115만원 (리워드 15만원)
\`\`\`

### 3. 트레일링 스톱
\`\`\`yaml
기본 설정:
  활성화 조건: +3% 이상 수익
  추적 거리: 최고가 대비 -2%
  
동작 방식:
  1. 수익 3% 도달 → 활성화
  2. 가격 상승 시 → 손절선 상향
  3. 가격 하락 시 → 손절선 고정
  4. 손절선 터치 → 매도 실행

예시:
  진입: 100만원
  103만원 도달 → 트레일링 활성화
  105만원 상승 → 손절선 103만원
  107만원 상승 → 손절선 105만원
  105만원 하락 → 매도 실행
\`\`\`

### 4. 동적 익절
\`\`\`python
def dynamic_take_profit(position, market_condition):
    """
    시장 상황에 따른 익절 조정
    """
    base_target = position.entry_price * 1.1  # 기본 10%
    
    # 시장 상황 반영
    if market_condition == "STRONG_BULL":
        target = base_target * 1.5  # 15%로 상향
    elif market_condition == "WEAK":
        target = base_target * 0.5  # 5%로 하향
    else:
        target = base_target
        
    # RSI 과매수 구간이면 즉시 익절
    if get_rsi() > 80:
        return position.current_price
        
    return target
\`\`\`

## 고급 전략

### 스케일 아웃
\`\`\`yaml
부분 익절 전략:
  장점:
    - 수익 일부 확보
    - 추가 상승 여지
    - 심리적 안정
    
  실행:
    33% @ +5%: 원금 일부 회수
    33% @ +10%: 수익 확보
    34% @ 트레일링: 대박 노림
\`\`\`

### 브레이크이븐 스톱
\`\`\`python
def breakeven_stop(position):
    """
    일정 수익 후 손절선을 진입가로 이동
    """
    if position.pnl_percent >= 3:  # 3% 수익
        # 손절선을 진입가 + 수수료로 이동
        new_stop = position.entry_price * 1.002
        position.update_stop_loss(new_stop)
        print("브레이크이븐 스톱 설정 완료")
\`\`\`

### 볼린저밴드 익절
\`\`\`yaml
상단 밴드 도달:
  - 과매수 신호
  - 부분 익절 시작
  - 트레일링 전환

중심선 복귀:
  - 추세 약화
  - 포지션 축소
  - 재진입 대기
\`\`\`

## 시장별 조정

### 상승장
\`\`\`yaml
손절:
  - 기준 완화 (-7%)
  - 지지선 활용
  - 시간 여유

익절:
  - 목표 상향 (+15%)
  - 트레일링 적극 활용
  - 홀딩 비중 증가
\`\`\`

### 하락장
\`\`\`yaml
손절:
  - 기준 강화 (-3%)
  - 빠른 손절
  - 재진입 신중

익절:
  - 목표 하향 (+5%)
  - 빠른 수익 실현
  - 현금 비중 증가
\`\`\`

### 횡보장
\`\`\`yaml
손절:
  - 타이트하게 (-2%)
  - 박스권 이탈 시

익절:
  - 박스 상단 (-1%)
  - 빠른 회전
  - 스캘핑 전략
\`\`\`

## 심리적 측면

### 손절의 심리
\`\`\`yaml
일반적 실수:
  - 손절 미루기: "곧 돌아올거야"
  - 평단 낮추기: 나쁜 습관
  - 희망 거래: 최악의 전략

올바른 마인드:
  - "손절 = 보험료"
  - "작은 손실 = 큰 기회"
  - "자본 보존 최우선"
\`\`\`

### 익절의 심리
\`\`\`yaml
일반적 실수:
  - 너무 빠른 익절: FOMO
  - 욕심: "더 오를거야"
  - 후회: "더 들고 있을걸"

올바른 마인드:
  - "수익은 수익이다"
  - "완벽한 타이밍은 없다"
  - "일부라도 남기자"
\`\`\`

## 백테스트 검증

### 최적 수준 찾기
\`\`\`python
def backtest_stop_loss_levels():
    results = {}
    
    for stop_loss in range(1, 11):  # -1% ~ -10%
        for take_profit in range(5, 31, 5):  # +5% ~ +30%
            key = f"SL{stop_loss}_TP{take_profit}"
            
            result = run_backtest(
                stop_loss_percent=-stop_loss,
                take_profit_percent=take_profit
            )
            
            results[key] = {
                'total_return': result.total_return,
                'win_rate': result.win_rate,
                'profit_factor': result.profit_factor,
                'max_drawdown': result.max_drawdown
            }
    
    # 샤프 비율 최대화
    best = max(results, key=lambda x: results[x]['profit_factor'])
    return best, results[best]
\`\`\`

## 실전 예시

### 성공 사례
\`\`\`
상황: BTC 1,000만원 매수
설정: 손절 -3%, 익절 +10%, 트레일링

경과:
Day 1: 1,020만원 (+2%)
Day 2: 1,050만원 (+5%) → 1차 익절 30%
Day 3: 1,080만원 (+8%) → 트레일링 활성화
Day 4: 1,120만원 (+12%) → 손절선 1,100만원
Day 5: 1,095만원 → 트레일링 스톱 실행

결과: 평균 +8.5% 수익 실현
\`\`\`

### 실패 방지
\`\`\`
나쁜 예:
- 손절 없이 진입 → -30% 손실
- 욕심에 익절 무시 → 수익 → 손실
- 감정적 조정 → 일관성 상실

교훈:
- 규칙은 반드시 지킨다
- 예외는 없다
- 통계가 증명한다
\`\`\`

## 체크리스트

### 진입 전
- [ ] 손절가 계산 및 설정
- [ ] 익절 목표 설정
- [ ] R:R 비율 확인 (최소 1:1.5)
- [ ] 최대 손실액 확인
- [ ] 시장 상황 반영

### 진행 중
- [ ] 손절선 조정 여부
- [ ] 부분 익절 시점
- [ ] 트레일링 스톱 활성화
- [ ] 시장 변화 모니터링

### 종료 후
- [ ] 결과 기록
- [ ] 전략 효과성 평가
- [ ] 개선점 도출
- [ ] 다음 거래 반영

💡 **핵심**: 손절은 빠르게, 익절은 천천히. 하지만 규칙은 철저히!
    `,
  },

  // 트레일링 스톱 활용
  'trading-strategy.trailing-stop': {
    title: '트레일링 스톱 활용',
    content: `
# 트레일링 스톱 활용 🎯

## 트레일링 스톱이란?

트레일링 스톱은 가격 상승에 따라 손절선을 자동으로 올려주는 동적 손절 시스템입니다. 수익을 보호하면서도 추가 상승 가능성을 열어둡니다.

## 트레일링 스톱의 원리

### 기본 작동 방식
\`\`\`yaml
1. 활성화 조건:
   - 최소 수익률 달성 (예: +3%)
   - 또는 즉시 활성화

2. 추적 방식:
   - 고점 기록 및 갱신
   - 고점 대비 일정 % 하락 시 매도
   - 손절선은 올라가기만 함

3. 실행:
   - 손절선 도달 시 자동 매도
   - 시장가 또는 지정가 주문
\`\`\`

### 시각적 예시
\`\`\`
가격 추이와 트레일링 스톱:

110만원 ←─── 최고점
108만원 ←─── 손절선 (고점 -2%)
        ↗
105만원 ──↗ 가격 상승, 손절선도 상승
103만원 ←─── 이전 손절선
    ↗
100만원 ←─── 진입가
\`\`\`

## 트레일링 스톱 전략

### 1. 고정 비율 트레일링
\`\`\`python
class FixedTrailingStop:
    def __init__(self, trail_percent=2.0):
        self.trail_percent = trail_percent
        self.highest_price = 0
        self.stop_price = 0
    
    def update(self, current_price):
        # 신고점 갱신
        if current_price > self.highest_price:
            self.highest_price = current_price
            # 손절선 상향 조정
            self.stop_price = self.highest_price * (1 - self.trail_percent/100)
        
        # 손절 확인
        if current_price <= self.stop_price:
            return "SELL"
        return "HOLD"
\`\`\`

### 2. ATR 기반 트레일링
\`\`\`python
class ATRTrailingStop:
    def __init__(self, atr_multiplier=2.5):
        self.atr_multiplier = atr_multiplier
        self.highest_price = 0
        
    def update(self, current_price, atr):
        if current_price > self.highest_price:
            self.highest_price = current_price
        
        # ATR 기반 동적 거리
        trail_distance = atr * self.atr_multiplier
        self.stop_price = self.highest_price - trail_distance
        
        if current_price <= self.stop_price:
            return "SELL"
        return "HOLD"
\`\`\`

### 3. 단계별 트레일링
\`\`\`yaml
수익률별 트레일링 거리:
  0-5%: 3% 트레일링
  5-10%: 2% 트레일링
  10-20%: 1.5% 트레일링
  20%+: 1% 트레일링

장점:
  - 초기엔 여유 있게
  - 수익 늘수록 타이트하게
  - 대박 가능성 유지
\`\`\`

### 4. 시간 가중 트레일링
\`\`\`python
def time_weighted_trailing(position):
    holding_hours = position.get_holding_hours()
    base_trail = 3.0  # 기본 3%
    
    # 시간이 지날수록 타이트하게
    if holding_hours < 24:
        trail_percent = base_trail
    elif holding_hours < 72:
        trail_percent = base_trail * 0.8  # 2.4%
    else:
        trail_percent = base_trail * 0.6  # 1.8%
    
    return trail_percent
\`\`\`

## 활성화 전략

### 즉시 활성화
\`\`\`yaml
특징:
  - 진입 즉시 트레일링 시작
  - 손실 가능성 존재
  - 변동성 높은 시장 적합

설정:
  - 초기 손절: -3%
  - 트레일링: 고점 -3%
  - 중첩 가능
\`\`\`

### 수익 후 활성화
\`\`\`yaml
특징:
  - 일정 수익 후 활성화
  - 최소한의 수익 보장
  - 안정적 접근

설정:
  - 활성화: +3% 이상
  - 초기 손절: -5%
  - 트레일링: 고점 -2%
\`\`\`

### 조건부 활성화
\`\`\`python
def conditional_activation(position, market_data):
    # 다중 조건 확인
    profit_ok = position.profit_percent >= 2
    volume_ok = market_data.volume > market_data.avg_volume
    trend_ok = market_data.trend == "UP"
    
    if profit_ok and volume_ok and trend_ok:
        return True
    return False
\`\`\`

## 고급 활용법

### 다중 트레일링
\`\`\`yaml
포지션 분할:
  30%: 타이트 트레일링 (1%)
  40%: 일반 트레일링 (2%)
  30%: 느슨한 트레일링 (3%)

효과:
  - 일부 수익 빠른 확보
  - 일부는 대박 노림
  - 리스크 분산
\`\`\`

### 볼린저밴드 결합
\`\`\`python
def bollinger_trailing_stop(price, bb_upper, bb_middle):
    # 상단 밴드 위: 타이트
    if price > bb_upper:
        return price * 0.98  # 2% 트레일링
    
    # 중간선 위: 보통
    elif price > bb_middle:
        return price * 0.97  # 3% 트레일링
    
    # 중간선 아래: 느슨함
    else:
        return price * 0.95  # 5% 트레일링
\`\`\`

### 모멘텀 기반 조정
\`\`\`python
def momentum_based_trailing(price_data):
    # 모멘텀 계산
    momentum = calculate_momentum(price_data, period=10)
    
    # 강한 모멘텀: 느슨한 트레일링
    if momentum > 5:
        trail_percent = 4.0
    # 보통 모멘텀
    elif momentum > 0:
        trail_percent = 2.5
    # 약한 모멘텀: 타이트
    else:
        trail_percent = 1.5
    
    return trail_percent
\`\`\`

## 시장별 최적화

### 상승 트렌드
\`\`\`yaml
설정:
  - 활성화: 즉시 또는 +1%
  - 거리: 3-5%
  - 조정: 느슨하게

이유:
  - 추세 지속 가능성
  - 조정 후 재상승
  - 장기 수익 극대화
\`\`\`

### 변동성 장세
\`\`\`yaml
설정:
  - 활성화: +3% 이상
  - 거리: 1-2%
  - 조정: 타이트하게

이유:
  - 급반전 위험
  - 수익 보호 우선
  - 재진입 기회 많음
\`\`\`

### 하락 트렌드
\`\`\`yaml
설정:
  - 사용 자제
  - 또는 극도로 타이트 (0.5-1%)
  - 빠른 이익 실현

이유:
  - 반등 지속성 낮음
  - 하락 재개 위험
  - 현금 확보 중요
\`\`\`

## 실전 사례

### 성공 사례
\`\`\`
2024년 3월 BTC 트레이딩:

진입: 8,000만원
Day 1: 8,200만원 (+2.5%) → 트레일링 활성화
Day 3: 8,500만원 (+6.3%) → 손절선 8,330만원
Day 5: 9,000만원 (+12.5%) → 손절선 8,820만원
Day 7: 9,200만원 (+15%) → 손절선 9,016만원
Day 8: 8,900만원 → 트레일링 스톱 실행

결과: +12.7% 수익 확보 (최고점 -3.3%)
\`\`\`

### 주의할 점
\`\`\`
실수 사례:
1. 너무 타이트 → 조기 청산 → 대박 놓침
2. 너무 느슨함 → 수익 대부분 반납
3. 휩소 장세 → 빈번한 손절

해결책:
- 시장 특성 파악
- 적절한 거리 설정
- 부분 청산 활용
\`\`\`

## 트레일링 스톱 모니터링

### 실시간 대시보드
\`\`\`
┌─────────────────────────────────┐
│ 트레일링 스톱 현황              │
├─────────────────────────────────┤
│ BTC                             │
│ 현재가: 9,150만원               │
│ 최고가: 9,200만원               │
│ 손절선: 9,016만원 (-2%)         │
│ 상태: 🟢 활성                   │
│                                 │
│ [그래프: 가격 vs 손절선]        │
└─────────────────────────────────┘
\`\`\`

### 성과 분석
\`\`\`python
trailing_stats = {
    "total_trades": 156,
    "avg_profit": 8.7%,
    "max_profit": 34.2%,
    "premature_exits": 23,  # 너무 일찍 나간 경우
    "optimal_exits": 98,    # 적절한 타이밍
    "late_exits": 35        # 너무 늦게 나간 경우
}
\`\`\`

## 최적화 방법

### 백테스트
\`\`\`python
def optimize_trailing_stop():
    results = {}
    
    for activation in [0, 1, 2, 3]:  # 활성화 %
        for distance in [1, 1.5, 2, 2.5, 3]:  # 트레일링 %
            key = f"Act{activation}_Dist{distance}"
            
            backtest = run_backtest(
                trailing_activation=activation,
                trailing_distance=distance
            )
            
            results[key] = backtest.total_return
    
    best = max(results, key=results.get)
    return best
\`\`\`

### 머신러닝 최적화
\`\`\`python
# 최적 트레일링 거리 예측
features = [
    'volatility',
    'trend_strength',
    'volume_ratio',
    'time_of_day',
    'coin_type'
]

model = train_trailing_model(features, historical_data)
optimal_distance = model.predict(current_market_data)
\`\`\`

## 트레일링 스톱 팁

### DO's ✅
- 시장 상황에 맞게 조정
- 충분한 여유 거리 유지
- 부분 청산과 병행
- 백테스트로 검증
- 일관성 있게 적용

### DON'Ts ❌
- 감정적으로 조정
- 너무 자주 변경
- 극단적 설정
- 모든 상황에 동일 적용
- 수동으로 해제

## 고급 팁

### 심리적 준비
\`\`\`yaml
마인드셋:
  - "완벽한 탈출은 없다"
  - "고점 매도는 불가능"
  - "수익 확보가 우선"
  - "다음 기회는 온다"

실행:
  - 규칙 철저히 준수
  - 결과 담담히 수용
  - 지속적 개선
\`\`\`

### 조합 전략
\`\`\`python
# 트레일링 + 부분 익절
if profit >= 5:
    sell_partial(30%)  # 30% 익절
    activate_trailing()  # 나머지 트레일링

# 트레일링 + 시간 손절
if holding_days > 7 and trailing_not_triggered:
    force_sell()  # 시간 손절
\`\`\`

💡 **핵심**: 트레일링 스톱은 수익을 지키는 방패입니다. 욕심내지 말고 꾸준히 수익을 쌓아가세요!
    `,
  },

  // 스마트 주문 시스템
  'trading-strategy.smart-order': {
    title: '스마트 주문 시스템',
    content: `
# 스마트 주문 시스템 🤖

## 스마트 주문이란?

스마트 주문은 시장 상황을 실시간으로 분석하여 최적의 가격과 타이밍에 주문을 실행하는 지능형 주문 시스템입니다.

## 핵심 기능

### 1. 호가창 분석
\`\`\`python
def analyze_order_book():
    """
    호가창 분석으로 최적 주문가 결정
    """
    order_book = get_order_book()
    
    # 벽 감지 (대량 주문)
    walls = detect_walls(order_book)
    
    # 유동성 분석
    liquidity = calculate_liquidity(order_book)
    
    # 스프레드 분석
    spread = order_book['ask'][0] - order_book['bid'][0]
    spread_percent = (spread / order_book['mid']) * 100
    
    return {
        'walls': walls,
        'liquidity': liquidity,
        'spread_percent': spread_percent,
        'recommendation': determine_order_strategy()
    }
\`\`\`

### 2. 주문 분할 (Iceberg)
\`\`\`yaml
대량 주문 분할:
  총 주문: 10 BTC
  
  분할 전략:
    - 1회 주문: 0.5 BTC
    - 총 20회 분할
    - 간격: 30-60초
    - 가격 조정: 동적
    
  효과:
    - 시장 충격 최소화
    - 슬리피지 감소
    - 체결률 향상
\`\`\`

### 3. 동적 가격 조정
\`\`\`python
class DynamicPricing:
    def __init__(self, base_price, order_type):
        self.base_price = base_price
        self.order_type = order_type
        
    def adjust_price(self, market_data):
        # 시장 추세 반영
        if market_data.trend == "UP" and self.order_type == "BUY":
            # 상승장에서 매수: 약간 높게
            return self.base_price * 1.001
            
        elif market_data.volatility > HIGH:
            # 고변동성: 여유있게
            if self.order_type == "BUY":
                return self.base_price * 0.998
            else:
                return self.base_price * 1.002
                
        # 일반 상황
        return self.base_price
\`\`\`

## 주문 유형별 전략

### 시장가 vs 지정가 자동 선택
\`\`\`python
def choose_order_type(urgency, spread, volatility):
    """
    상황에 따른 주문 유형 자동 선택
    """
    # 긴급도 높음 → 시장가
    if urgency > 8:
        return "MARKET"
    
    # 스프레드 좁음 → 시장가 OK
    if spread < 0.1:
        return "MARKET"
    
    # 변동성 낮음 → 지정가
    if volatility < LOW:
        return "LIMIT"
    
    # 일반적으로 지정가 선호
    return "LIMIT"
\`\`\`

### 스마트 지정가
\`\`\`yaml
매수 전략:
  1. 현재 매도호가 -0.01%
  2. 미체결 시 5초마다 상향
  3. 최대 3번 조정
  4. 최종 미체결 → 시장가

매도 전략:
  1. 현재 매수호가 +0.01%
  2. 미체결 시 5초마다 하향
  3. 긴급 매도 시 즉시 시장가
\`\`\`

### 조건부 주문
\`\`\`python
class ConditionalOrder:
    def __init__(self):
        self.conditions = []
        
    def add_condition(self, condition_type, value):
        self.conditions.append({
            'type': condition_type,
            'value': value,
            'triggered': False
        })
    
    def check_execution(self, market_data):
        for condition in self.conditions:
            if condition['type'] == 'PRICE_ABOVE':
                if market_data.price > condition['value']:
                    return True
                    
            elif condition['type'] == 'RSI_BELOW':
                if market_data.rsi < condition['value']:
                    return True
                    
        return False
\`\`\`

## 슬리피지 최소화

### 슬리피지 예측
\`\`\`python
def estimate_slippage(order_size, order_book):
    """
    주문 크기에 따른 예상 슬리피지 계산
    """
    cumulative_volume = 0
    cumulative_cost = 0
    
    for price, volume in order_book:
        if cumulative_volume + volume >= order_size:
            # 부분 체결
            remaining = order_size - cumulative_volume
            cumulative_cost += price * remaining
            cumulative_volume = order_size
            break
        else:
            # 전체 체결
            cumulative_cost += price * volume
            cumulative_volume += volume
    
    avg_price = cumulative_cost / order_size
    slippage = (avg_price - order_book[0][0]) / order_book[0][0]
    
    return slippage * 100  # 퍼센트
\`\`\`

### 슬리피지 회피 전략
\`\`\`yaml
소액 주문 (< 100만원):
  - 시장가 OK
  - 슬리피지 무시 가능

중액 주문 (100-1000만원):
  - 2-3회 분할
  - 지정가 우선
  - 피크 시간 회피

대액 주문 (> 1000만원):
  - 10회 이상 분할
  - 시간 분산
  - 호가창 모니터링
  - TWAP/VWAP 활용
\`\`\`

## 고급 주문 알고리즘

### TWAP (Time Weighted Average Price)
\`\`\`python
def execute_twap(total_amount, duration_minutes):
    """
    시간 가중 평균가 주문
    """
    intervals = duration_minutes
    amount_per_interval = total_amount / intervals
    
    for i in range(intervals):
        # 매분 균등하게 주문
        place_order(amount_per_interval)
        time.sleep(60)  # 1분 대기
        
    return calculate_average_price()
\`\`\`

### VWAP (Volume Weighted Average Price)
\`\`\`python
def execute_vwap(total_amount, historical_volume):
    """
    거래량 가중 평균가 주문
    """
    # 시간대별 평균 거래량 분석
    volume_profile = analyze_volume_profile(historical_volume)
    
    for hour, volume_percent in volume_profile.items():
        # 거래량 비율에 따라 주문량 조정
        hour_amount = total_amount * volume_percent
        execute_during_hour(hour, hour_amount)
\`\`\`

### 적응형 주문
\`\`\`python
class AdaptiveOrder:
    def __init__(self, total_amount):
        self.total_amount = total_amount
        self.executed = 0
        self.strategy = 'NORMAL'
        
    def adapt_strategy(self, market_feedback):
        # 체결률 낮음 → 공격적
        if market_feedback.fill_rate < 0.5:
            self.strategy = 'AGGRESSIVE'
            
        # 가격 불리하게 움직임 → 보수적
        elif market_feedback.adverse_movement > 1:
            self.strategy = 'CONSERVATIVE'
            
    def next_order(self):
        if self.strategy == 'AGGRESSIVE':
            return self.create_aggressive_order()
        elif self.strategy == 'CONSERVATIVE':
            return self.create_conservative_order()
        else:
            return self.create_normal_order()
\`\`\`

## 실시간 모니터링

### 주문 상태 추적
\`\`\`yaml
주문 생명주기:
  1. 생성 (Created)
  2. 전송 (Submitted)
  3. 접수 (Accepted)
  4. 부분체결 (PartiallyFilled)
  5. 완전체결 (Filled)
  또는
  6. 취소 (Cancelled)
  7. 거부 (Rejected)

모니터링:
  - 체결률
  - 평균 체결가
  - 소요 시간
  - 슬리피지
\`\`\`

### 성과 분석
\`\`\`python
def analyze_order_performance():
    return {
        'fill_rate': 94.5,  # %
        'avg_slippage': 0.12,  # %
        'avg_execution_time': 3.2,  # 초
        'market_impact': 0.05,  # %
        'cost_savings': 125000  # 원
    }
\`\`\`

## 비상 상황 대응

### 주문 실패 처리
\`\`\`python
def handle_order_failure(order, error):
    if error.type == 'INSUFFICIENT_BALANCE':
        # 잔고 부족
        return retry_with_smaller_amount(order.amount * 0.8)
        
    elif error.type == 'PRICE_LIMIT':
        # 가격 제한
        return adjust_price_and_retry(order)
        
    elif error.type == 'MARKET_CLOSED':
        # 시장 마감
        return queue_for_next_open(order)
        
    else:
        # 기타 오류
        log_error(error)
        notify_user(error)
\`\`\`

### 시장 급변 대응
\`\`\`yaml
플래시 크래시:
  - 모든 매수 주문 즉시 취소
  - 안전 확인 후 재개
  - 단계적 재진입

급등장:
  - 추격 매수 자제
  - 분할 매수 간격 확대
  - FOMO 방지 로직
\`\`\`

## 주문 최적화 설정

### 기본 설정
\`\`\`yaml
스마트 주문:
  활성화: ON
  
  분할 주문:
    임계값: 500만원
    분할 수: 5-10회
    간격: 30-120초
    
  가격 조정:
    방식: 동적
    범위: ±0.5%
    재시도: 3회
\`\`\`

### 고급 설정
\`\`\`yaml
알고리즘:
  대량 주문: VWAP
  정기 매수: TWAP
  변동성 높음: 적응형
  
성능:
  병렬 주문: 3개
  최대 대기: 60초
  긴급 모드: 시장가
\`\`\`

## 실전 예시

### Case 1: 대량 매수
\`\`\`
목표: BTC 5개 매수 (약 4억원)

실행:
1. 호가창 분석 → 유동성 충분
2. VWAP 알고리즘 선택
3. 50회 분할 (회당 800만원)
4. 피크 시간 회피
5. 평균 슬리피지 0.08%

결과: 목표가 대비 +0.05% 체결
\`\`\`

### Case 2: 긴급 매도
\`\`\`
상황: 급락 신호, 즉시 청산 필요

실행:
1. 스마트 시장가 주문
2. 3단계 분할
3. 각 단계 최적 호가 선택
4. 10초 내 전량 체결

결과: 단순 시장가 대비 0.3% 개선
\`\`\`

## 성공 팁

### DO's ✅
- 시장 상황 고려
- 적절한 분할
- 인내심 유지
- 지속적 모니터링
- 성과 분석

### DON'Ts ❌
- 무리한 대량 주문
- 시장 추격
- 알고리즘 맹신
- 수동 개입
- 감정적 판단

💡 **핵심**: 스마트 주문은 작은 개선이 모여 큰 차이를 만듭니다. 꾸준히 최적화하세요!
    `,
  },
};