// 핵심 개념 섹션 문서
export const coreConceptsContents = {
  // 기술적 지표 이해하기
  'core-concepts.technical-indicators': {
    title: '기술적 지표 이해하기',
    content: `
# 기술적 지표 이해하기 📊

## 기술적 분석이란?

기술적 분석은 과거 가격 움직임과 거래량을 바탕으로 미래 가격을 예측하는 방법입니다.

## 프로그램이 사용하는 주요 지표

### 1. RSI (Relative Strength Index)
**상대강도지수**

\`\`\`yaml
개념: 가격의 상승/하락 강도 측정
범위: 0-100
해석:
  - 70 이상: 과매수 (하락 가능성)
  - 30 이하: 과매도 (상승 가능성)
  - 50 기준: 상승/하락 추세 판단

활용:
  - 다이버전스 포착
  - 추세 전환 신호
  - 진입/청산 타이밍
\`\`\`

### 2. MACD (Moving Average Convergence Divergence)
**이동평균 수렴/확산**

\`\`\`yaml
구성요소:
  - MACD선: 12일 EMA - 26일 EMA
  - 신호선: MACD의 9일 EMA
  - 히스토그램: MACD - 신호선

매매신호:
  - 골든크로스: MACD가 신호선 상향돌파 (매수)
  - 데드크로스: MACD가 신호선 하향돌파 (매도)
  - 히스토그램 방향 전환
\`\`\`

### 3. 볼린저 밴드 (Bollinger Bands)
**변동성 기반 지표**

\`\`\`yaml
구성:
  - 중심선: 20일 이동평균
  - 상단밴드: 중심선 + (2 × 표준편차)
  - 하단밴드: 중심선 - (2 × 표준편차)

해석:
  - 밴드 폭 확대: 변동성 증가
  - 밴드 폭 축소: 변동성 감소
  - 가격이 밴드 접촉: 과매수/과매도

활용:
  - 스퀴즈: 큰 변동 예고
  - 밴드 워킹: 강한 추세
  - 반전 신호: 밴드 이탈 후 회귀
\`\`\`

### 4. 스토캐스틱 (Stochastic)
**모멘텀 오실레이터**

\`\`\`yaml
계산:
  - %K: 현재가의 상대적 위치
  - %D: %K의 3일 이동평균

범위: 0-100
신호:
  - 80 이상: 과매수
  - 20 이하: 과매도
  - 교차: 매매 시점

특징:
  - RSI보다 민감
  - 단기 매매 적합
  - 횡보장에서 유용
\`\`\`

### 5. 이동평균선 (Moving Average)
**추세 추종 지표**

\`\`\`yaml
종류:
  - SMA: 단순이동평균
  - EMA: 지수이동평균
  - WMA: 가중이동평균

주요 기간:
  - 단기: 5, 10, 20일
  - 중기: 50, 60일
  - 장기: 120, 200일

활용:
  - 지지/저항선
  - 추세 방향
  - 골든/데드 크로스
\`\`\`

## 지표 조합 전략

### 추세 + 모멘텀
\`\`\`yaml
조합: 이동평균 + RSI
장점: 추세 확인 후 진입 타이밍
예시:
  - MA 상향 + RSI 30 → 매수
  - MA 하향 + RSI 70 → 매도
\`\`\`

### 변동성 + 추세
\`\`\`yaml
조합: 볼린저밴드 + MACD
장점: 변동성 고려한 추세 매매
예시:
  - 밴드 축소 + MACD 크로스 → 추세 시작
  - 밴드 확대 + MACD 다이버전스 → 추세 종료
\`\`\`

## 시장 상황별 지표 선택

### 상승 추세
- 이동평균선 (지지선 활용)
- MACD (추세 강도)
- ADX (추세 지속성)

### 하락 추세
- 이동평균선 (저항선 활용)
- RSI (반등 지점)
- 볼린저밴드 (하단 지지)

### 횡보장
- RSI, 스토캐스틱 (과매수/과매도)
- 볼린저밴드 (레인지 경계)
- Williams %R (극단값)

## 지표의 한계

### 후행성
- 과거 데이터 기반
- 실시간 반응 지연
- 급변동 대응 어려움

### 가짜 신호
- 노이즈로 인한 오류
- 휘프소 (whipsaw)
- 조작 가능성

### 해결 방법
- 여러 지표 병용
- 시간대 다각화
- AI 필터링 적용

## 프로그램의 지표 활용

### 가중치 시스템
\`\`\`python
총 신뢰도 = Σ(지표_신호 × 가중치) / Σ(가중치)

예시:
RSI(30) × 0.3 + MACD(상승) × 0.3 + BB(하단) × 0.2 = 80%
\`\`\`

### 동적 조정
- 시장 상황 인식
- 지표 신뢰도 변경
- 실시간 최적화

## 실전 팁

### 초보자
1. 2-3개 지표로 시작
2. RSI + 이동평균 추천
3. 기본 설정값 사용

### 중급자
1. 4-5개 지표 조합
2. 시간대별 분석
3. 커스텀 파라미터

### 고급자
1. 전체 지표 활용
2. 상관관계 분석
3. 머신러닝 결합

💡 **핵심**: 지표는 도구일 뿐, 시장 맥락 이해가 중요합니다!
    `,
  },

  // 고급 지표 활용법
  'core-concepts.advanced-indicators': {
    title: '고급 지표 활용법',
    content: `
# 고급 지표 활용법 🎯

## 고급 지표의 특징

일반 지표보다 정교하고 복잡한 계산을 통해 더 정확한 신호를 제공합니다.

## 주요 고급 지표

### 1. Ichimoku Cloud (일목균형표)
**종합적 시장 분석 도구**

\`\`\`yaml
구성요소:
  - 전환선: 9일 고저 평균
  - 기준선: 26일 고저 평균
  - 선행스팬 A: (전환선+기준선)/2, 26일 선행
  - 선행스팬 B: 52일 고저 평균, 26일 선행
  - 후행스팬: 종가, 26일 후행

신호 해석:
  - 구름 위: 상승 추세
  - 구름 아래: 하락 추세
  - 구름 돌파: 추세 전환
  - 전환선/기준선 교차: 단기 신호
\`\`\`

### 2. ADX (Average Directional Index)
**추세 강도 측정**

\`\`\`yaml
범위: 0-100
해석:
  - 0-25: 추세 없음 (횡보)
  - 25-50: 추세 형성
  - 50-75: 강한 추세
  - 75-100: 매우 강한 추세

활용:
  - 추세 강도 확인
  - 진입 시점 판단
  - 추세 지속성 예측
\`\`\`

### 3. Williams %R
**단기 모멘텀 지표**

\`\`\`yaml
계산: (최고가-현재가)/(최고가-최저가) × -100
범위: -100 ~ 0
신호:
  - -80 이하: 과매도
  - -20 이상: 과매수
  - -50 기준: 중립

특징:
  - 스토캐스틱과 유사
  - 더 빠른 반응
  - 단기 트레이딩 적합
\`\`\`

### 4. ATR (Average True Range)
**변동성 지표**

\`\`\`yaml
용도:
  - 변동성 측정
  - 손절선 설정
  - 포지션 크기 결정

활용법:
  - 손절선: 진입가 - (2 × ATR)
  - 목표가: 진입가 + (3 × ATR)
  - 포지션: 위험금액 / ATR
\`\`\`

### 5. OBV (On Balance Volume)
**거래량 기반 지표**

\`\`\`yaml
원리:
  - 상승일: OBV + 거래량
  - 하락일: OBV - 거래량

해석:
  - OBV 상승 + 가격 상승: 상승 지속
  - OBV 하락 + 가격 상승: 상승 의심
  - 다이버전스: 추세 전환 신호
\`\`\`

## 고급 분석 기법

### 다이버전스 분석
\`\`\`yaml
정의: 가격과 지표의 괴리
종류:
  - 일반 다이버전스: 추세 전환
  - 히든 다이버전스: 추세 지속

탐지 방법:
  1. 가격: 고점 상승, RSI: 고점 하락 → 하락 전환
  2. 가격: 저점 하락, RSI: 저점 상승 → 상승 전환
\`\`\`

### 멀티 타임프레임 분석
\`\`\`yaml
원칙:
  - 상위 시간대: 추세 방향
  - 중간 시간대: 진입 신호
  - 하위 시간대: 정확한 타이밍

예시:
  - 일봉: 상승 추세 확인
  - 4시간: RSI 과매도 대기
  - 1시간: MACD 크로스 진입
\`\`\`

### 피보나치 되돌림
\`\`\`yaml
주요 레벨:
  - 23.6%: 약한 조정
  - 38.2%: 일반 조정
  - 50.0%: 중간 지점
  - 61.8%: 깊은 조정
  - 78.6%: 추세 전환 경계

활용:
  - 지지/저항 예측
  - 목표가 설정
  - 손절선 배치
\`\`\`

## 프로그램의 고급 활용

### AI 지표 융합
\`\`\`python
# 전통 지표 + AI 분석
def 고급_신호_생성():
    전통_신호 = 계산_지표_신호()
    AI_신호 = Claude_분석()
    
    if 전통_신호 == AI_신호:
        신뢰도 = 95
    else:
        신뢰도 = 가중_평균(전통_신호, AI_신호)
    
    return 최종_신호, 신뢰도
\`\`\`

### 적응형 파라미터
\`\`\`yaml
시장 변동성에 따른 조정:
  - 고변동성: 
    - RSI 기간 증가 (14 → 21)
    - 밴드 표준편차 증가 (2 → 2.5)
  - 저변동성:
    - RSI 기간 감소 (14 → 9)
    - 밴드 표준편차 감소 (2 → 1.5)
\`\`\`

## 지표 조합 매트릭스

### 최적 조합
\`\`\`
추세 | 모멘텀 | 변동성 | 거래량 | 신뢰도
-----|--------|---------|---------|--------
MA   | RSI    | BB      | OBV     | 85%
ICH  | MACD   | ATR     | -       | 80%
EMA  | Stoch  | KC      | MFI     | 75%
\`\`\`

### 상황별 가중치
\`\`\`yaml
상승장:
  - 추세 지표: 40%
  - 모멘텀: 30%
  - 거래량: 30%

하락장:
  - 모멘텀: 40%
  - 변동성: 35%
  - 추세: 25%

횡보장:
  - 오실레이터: 50%
  - 변동성: 30%
  - 거래량: 20%
\`\`\`

## 커스텀 지표 생성

### 복합 지표 예시
\`\`\`python
def 커스텀_지표(prices, volume):
    # RSI + 거래량 가중
    rsi = calculate_rsi(prices)
    volume_ratio = volume / volume.rolling(20).mean()
    
    # 가중 RSI
    weighted_rsi = rsi * volume_ratio
    
    # 신호 생성
    if weighted_rsi < 30 and volume_ratio > 1.5:
        return "강한 매수"
    elif weighted_rsi > 70 and volume_ratio < 0.5:
        return "강한 매도"
\`\`\`

## 실전 적용 사례

### 사례 1: 복합 다이버전스
\`\`\`
상황: BTC 일봉 차트
- 가격: 신고가 경신
- RSI: 전고점 미달
- OBV: 하락 추세
- MACD: 히스토그램 감소

결론: 상승 추세 약화, 조정 임박
조치: 부분 익절, 손절선 상향
\`\`\`

### 사례 2: 변동성 돌파
\`\`\`
상황: ETH 4시간 차트
- 볼린저밴드: 극도로 수축
- ATR: 역사적 저점
- ADX: 20 미만

결론: 큰 변동 임박
조치: 양방향 주문 준비
\`\`\`

## 주의사항

### 과최적화 위험
- 너무 많은 지표 사용 금지
- 백테스트 과신 금물
- 실시간 검증 필수

### 시장 특성 고려
- 암호화폐 고유 특성
- 24시간 거래
- 높은 변동성

💡 **Pro Tip**: 고급 지표도 결국 도구입니다. 시장 이해가 우선!
    `,
  },

  // 패턴 인식 시스템
  'core-concepts.pattern-recognition': {
    title: '패턴 인식 시스템',
    content: `
# 패턴 인식 시스템 🔍

## 패턴 인식의 중요성

차트 패턴은 시장 참여자들의 심리가 반복적으로 나타나는 형태로, 미래 가격 움직임을 예측하는 데 유용합니다.

## 캔들스틱 패턴

### 반전 패턴

#### 1. 망치형 (Hammer)
\`\`\`yaml
형태:
  - 작은 실체
  - 긴 아래꼬리 (실체의 2배 이상)
  - 위꼬리 거의 없음

의미: 하락 추세 종료, 매수세 진입
위치: 저점에서 출현
신뢰도: 70%
\`\`\`

#### 2. 교수형 (Hanging Man)
\`\`\`yaml
형태: 망치형과 동일
위치: 고점에서 출현
의미: 상승 추세 종료 경고
신뢰도: 65%
\`\`\`

#### 3. 도지 (Doji)
\`\`\`yaml
종류:
  - 일반 도지: 시가 = 종가
  - 잠자리 도지: 긴 아래꼬리
  - 비석 도지: 긴 위꼬리

의미: 시장 균형, 추세 전환 가능
추가 확인: 다음 캔들 방향
\`\`\`

#### 4. 장악형 (Engulfing)
\`\`\`yaml
상승 장악:
  - 이전: 음봉
  - 현재: 큰 양봉 (이전 봉 완전 포함)
  
하락 장악:
  - 이전: 양봉
  - 현재: 큰 음봉 (이전 봉 완전 포함)

신뢰도: 75%
\`\`\`

### 지속 패턴

#### 1. 삼법형 (Three Methods)
\`\`\`yaml
상승 삼법:
  1. 큰 양봉
  2. 3개의 작은 음봉 (첫 양봉 범위 내)
  3. 큰 양봉 (신고가)

의미: 상승 추세 지속
신뢰도: 80%
\`\`\`

#### 2. 갭 패턴 (Gap)
\`\`\`yaml
종류:
  - 돌파 갭: 추세 시작
  - 측정 갭: 추세 중간
  - 소진 갭: 추세 종료

활용: 갭은 채워진다 (Gap Fill)
\`\`\`

## 차트 패턴

### 반전 패턴

#### 1. 헤드앤숄더 (Head and Shoulders)
\`\`\`yaml
구성:
  - 왼쪽 어깨
  - 머리 (최고점)
  - 오른쪽 어깨
  - 넥라인

목표가: 머리 - 넥라인 거리
신뢰도: 85%
소요 기간: 1-3개월
\`\`\`

#### 2. 이중 천정/바닥 (Double Top/Bottom)
\`\`\`yaml
특징:
  - 두 번의 고점/저점
  - 비슷한 가격 수준
  - 중간 조정

돌파 확인: 거래량 증가
목표가: 패턴 높이만큼
\`\`\`

#### 3. 삼중 천정/바닥 (Triple Top/Bottom)
\`\`\`yaml
특징:
  - 세 번의 시도
  - 강력한 저항/지지
  - 이중보다 신뢰도 높음

신뢰도: 90%
\`\`\`

### 지속 패턴

#### 1. 삼각형 패턴 (Triangle)
\`\`\`yaml
상승 삼각형:
  - 평평한 상단
  - 상승하는 하단
  - 상방 돌파 예상

하락 삼각형:
  - 하락하는 상단
  - 평평한 하단
  - 하방 돌파 예상

대칭 삼각형:
  - 수렴하는 추세선
  - 방향성 중립
  - 돌파 대기
\`\`\`

#### 2. 깃발/페넌트 (Flag/Pennant)
\`\`\`yaml
깃발:
  - 강한 추세 후 출현
  - 평행한 조정
  - 추세 방향 지속

페넌트:
  - 삼각형 모양
  - 짧은 조정
  - 빠른 돌파
\`\`\`

#### 3. 웨지 (Wedge)
\`\`\`yaml
상승 웨지:
  - 수렴하는 상승 채널
  - 하락 반전 가능

하락 웨지:
  - 수렴하는 하락 채널
  - 상승 반전 가능
\`\`\`

## AI 패턴 인식

### 딥러닝 기반 인식
\`\`\`python
def AI_패턴_인식(chart_data):
    # CNN으로 이미지 패턴 인식
    pattern_prob = cnn_model.predict(chart_data)
    
    # LSTM으로 시계열 패턴 인식
    sequence_pattern = lstm_model.predict(chart_data)
    
    # 앙상블
    final_pattern = ensemble(pattern_prob, sequence_pattern)
    
    return {
        'pattern': final_pattern,
        'confidence': confidence_score,
        'target': price_target
    }
\`\`\`

### 패턴 신뢰도 평가
\`\`\`yaml
신뢰도 요소:
  1. 패턴 완성도 (형태 일치율)
  2. 거래량 확인
  3. 시간 프레임
  4. 시장 상황
  5. 과거 성공률

종합 신뢰도 = Σ(요소 × 가중치)
\`\`\`

## 프로그램의 패턴 활용

### 실시간 스캐닝
\`\`\`yaml
스캔 주기: 1분
대상: 
  - 모든 등록 코인
  - 다중 시간대 (5분, 15분, 1시간, 4시간, 일봉)
  
알림 조건:
  - 주요 패턴 완성
  - 신뢰도 70% 이상
  - 돌파 임박
\`\`\`

### 자동 매매 연동
\`\`\`python
if 패턴 == "상승_삼각형" and 돌파_확인:
    if 거래량 > 평균_거래량 * 1.5:
        매수_주문(
            금액=계산_포지션_크기(),
            손절가=패턴_저점,
            목표가=패턴_높이 * 1.5
        )
\`\`\`

## 패턴 매매 전략

### 진입 전략
\`\`\`yaml
확인 사항:
  1. 패턴 완성도 90% 이상
  2. 거래량 증가
  3. 보조 지표 일치
  4. 상위 추세 확인

진입 방법:
  - 돌파 시 즉시
  - 되돌림 후 (안전)
  - 분할 진입
\`\`\`

### 리스크 관리
\`\`\`yaml
손절 설정:
  - 패턴 무효화 지점
  - ATR 기반 설정
  - 진입가 -3%

목표가:
  - 1차: 패턴 목표가 50%
  - 2차: 패턴 목표가 100%
  - 3차: 추세 연장
\`\`\`

## 패턴 백테스팅

### 성과 통계
\`\`\`yaml
헤드앤숄더:
  - 성공률: 73%
  - 평균 수익: +12%
  - 평균 기간: 15일

상승 삼각형:
  - 성공률: 68%
  - 평균 수익: +8%
  - 평균 기간: 7일

이중 바닥:
  - 성공률: 71%
  - 평균 수익: +15%
  - 평균 기간: 20일
\`\`\`

## 주의사항

### 함정 패턴
- 가짜 돌파 (False Breakout)
- 조작된 패턴
- 시간대별 상충

### 해결 방법
- 거래량 확인 필수
- 다중 시간대 확인
- 보조 지표 병행

💡 **Remember**: 패턴은 확률이지 확실성이 아닙니다!
    `,
  },

  // AI 분석의 원리
  'core-concepts.ai-analysis': {
    title: 'AI 분석의 원리',
    content: `
# AI 분석의 원리 🤖

## AI가 시장을 보는 방법

AI는 인간이 놓치기 쉬운 복잡한 패턴과 상관관계를 발견하여 더 정확한 예측을 가능하게 합니다.

## Claude AI의 역할

### 1. 시장 상황 종합 분석
\`\`\`yaml
입력 데이터:
  - 가격 움직임 (OHLCV)
  - 기술적 지표 값
  - 거래량 패턴
  - 시장 심리 지표
  - 뉴스 & 소셜 데이터

분석 과정:
  1. 데이터 전처리
  2. 패턴 인식
  3. 상관관계 분석
  4. 시나리오 생성
  5. 확률 계산
\`\`\`

### 2. 자연어 처리 (NLP)
\`\`\`python
def 뉴스_감성_분석(news_text):
    # 감성 점수 계산
    sentiment = analyze_sentiment(news_text)
    
    # 키워드 추출
    keywords = extract_keywords(news_text)
    
    # 영향도 평가
    impact = evaluate_impact(keywords, sentiment)
    
    return {
        'sentiment': sentiment,  # -1 ~ +1
        'keywords': keywords,
        'impact_score': impact,
        'time_horizon': estimate_duration()
    }
\`\`\`

### 3. 예측 모델
\`\`\`yaml
단기 예측 (1-24시간):
  - 기술적 지표 중심
  - 모멘텀 분석
  - 단기 패턴

중기 예측 (1-7일):
  - 추세 분석
  - 시장 심리
  - 이벤트 영향

장기 예측 (1주 이상):
  - 펀더멘털 요소
  - 거시 경제
  - 장기 사이클
\`\`\`

## 머신러닝 모델

### 1. 지도학습 (Supervised Learning)
\`\`\`python
# 가격 예측 모델
class PricePredictionModel:
    def __init__(self):
        self.features = [
            'rsi', 'macd', 'bb_position',
            'volume_ratio', 'price_change',
            'market_cap', 'sentiment_score'
        ]
        
    def train(self, historical_data):
        X = extract_features(historical_data)
        y = extract_labels(historical_data)
        self.model.fit(X, y)
        
    def predict(self, current_data):
        features = extract_features(current_data)
        prediction = self.model.predict(features)
        confidence = self.model.predict_proba(features)
        return prediction, confidence
\`\`\`

### 2. 비지도학습 (Unsupervised Learning)
\`\`\`yaml
클러스터링:
  - 유사 패턴 그룹화
  - 이상 거래 탐지
  - 시장 체제 분류

차원 축소:
  - 주요 특징 추출
  - 노이즈 제거
  - 시각화
\`\`\`

### 3. 강화학습 (Reinforcement Learning)
\`\`\`python
# Q-Learning 거래 에이전트
class TradingAgent:
    def __init__(self):
        self.q_table = {}
        self.learning_rate = 0.1
        self.discount_factor = 0.95
        
    def get_action(self, state):
        if random() < self.epsilon:
            return random_action()  # 탐색
        else:
            return best_action(state)  # 활용
            
    def update(self, state, action, reward, next_state):
        current_q = self.q_table[state][action]
        max_next_q = max(self.q_table[next_state])
        new_q = current_q + self.learning_rate * (
            reward + self.discount_factor * max_next_q - current_q
        )
        self.q_table[state][action] = new_q
\`\`\`

## 딥러닝 아키텍처

### 1. CNN (Convolutional Neural Network)
\`\`\`yaml
용도: 차트 이미지 패턴 인식
구조:
  - 입력층: 차트 이미지
  - 컨볼루션층: 특징 추출
  - 풀링층: 차원 축소
  - 완전연결층: 분류/예측

장점:
  - 시각적 패턴 인식
  - 위치 불변성
  - 계층적 특징 학습
\`\`\`

### 2. LSTM (Long Short-Term Memory)
\`\`\`yaml
용도: 시계열 데이터 예측
특징:
  - 장기 의존성 학습
  - 선택적 기억
  - 시퀀스 패턴 인식

응용:
  - 가격 예측
  - 추세 지속 기간
  - 변동성 예측
\`\`\`

### 3. Transformer
\`\`\`yaml
용도: 복잡한 관계 모델링
장점:
  - 병렬 처리
  - 장거리 의존성
  - 주의 메커니즘

활용:
  - 뉴스 영향 분석
  - 크로스 마켓 상관관계
  - 복합 신호 생성
\`\`\`

## AI 신호 생성 과정

### 1. 데이터 수집
\`\`\`python
data_sources = {
    'price': fetch_ohlcv(),
    'indicators': calculate_indicators(),
    'news': scrape_news(),
    'social': get_social_sentiment(),
    'onchain': fetch_blockchain_data()
}
\`\`\`

### 2. 특징 엔지니어링
\`\`\`python
features = {
    # 가격 특징
    'returns': calculate_returns(periods=[1, 5, 20]),
    'volatility': calculate_volatility(),
    
    # 기술적 특징
    'rsi_divergence': detect_divergence(),
    'pattern_score': pattern_recognition(),
    
    # 시장 특징
    'market_regime': classify_market_state(),
    'correlation': calculate_correlations()
}
\`\`\`

### 3. 앙상블 예측
\`\`\`python
def ensemble_prediction(data):
    # 개별 모델 예측
    ml_pred = ml_model.predict(data)
    dl_pred = dl_model.predict(data)
    claude_pred = claude_ai.analyze(data)
    
    # 가중 평균
    weights = calculate_dynamic_weights()
    final_pred = weighted_average([ml_pred, dl_pred, claude_pred], weights)
    
    # 신뢰도 계산
    confidence = calculate_confidence(predictions, historical_accuracy)
    
    return final_pred, confidence
\`\`\`

## AI의 강점과 한계

### 강점
\`\`\`yaml
패턴 인식:
  - 복잡한 비선형 관계
  - 미묘한 신호 포착
  - 다차원 분석

속도:
  - 실시간 처리
  - 대량 데이터 분석
  - 즉각적 대응

객관성:
  - 감정 배제
  - 일관된 판단
  - 규칙 기반
\`\`\`

### 한계
\`\`\`yaml
블랙스완:
  - 전례 없는 사건
  - 극단적 시장 상황
  - 시스템 오류

데이터 의존성:
  - 과거 패턴 의존
  - 편향 가능성
  - 품질 이슈

해석 가능성:
  - 블랙박스 문제
  - 결정 근거 불명확
  - 신뢰성 검증 어려움
\`\`\`

## 프로그램의 AI 활용

### 하이브리드 접근
\`\`\`yaml
전통적 분석 (40%):
  - 기술적 지표
  - 차트 패턴
  - 지지/저항

AI 분석 (60%):
  - 머신러닝 예측
  - 감성 분석
  - 패턴 인식

인간 검증:
  - 최종 확인
  - 예외 처리
  - 전략 조정
\`\`\`

### 지속적 개선
\`\`\`python
def continuous_learning():
    while True:
        # 실시간 성과 추적
        performance = track_performance()
        
        # 모델 업데이트
        if performance < threshold:
            retrain_models()
            adjust_parameters()
        
        # A/B 테스트
        test_new_strategies()
        
        # 피드백 반영
        incorporate_feedback()
\`\`\`

💡 **핵심**: AI는 도구이지 마법이 아닙니다. 이해하고 활용하세요!
    `,
  },

  // 신뢰도와 가중치
  'core-concepts.confidence-system': {
    title: '신뢰도와 가중치',
    content: `
# 신뢰도와 가중치 시스템 ⚖️

## 신뢰도 시스템의 중요성

모든 매매 신호가 같은 가치를 갖지 않습니다. 신뢰도 시스템은 각 신호의 품질을 평가하여 더 나은 투자 결정을 돕습니다.

## 신뢰도 계산 방법

### 기본 공식
\`\`\`python
총_신뢰도 = Σ(지표_신호 × 지표_가중치 × 상황_보정) / Σ(가중치)

여기서:
- 지표_신호: -100 ~ +100 (매도/매수 강도)
- 지표_가중치: 0 ~ 1 (중요도)
- 상황_보정: 0.5 ~ 1.5 (시장 상황)
\`\`\`

### 구체적 예시
\`\`\`yaml
계산 예시:
  RSI 신호: +80 (과매도, 매수)
  RSI 가중치: 0.3
  
  MACD 신호: +60 (골든크로스)
  MACD 가중치: 0.3
  
  볼린저밴드: +40 (하단 접근)
  볼린저밴드 가중치: 0.2
  
  AI 분석: +90 (강한 매수)
  AI 가중치: 0.2
  
총 신뢰도 = (80×0.3 + 60×0.3 + 40×0.2 + 90×0.2) / 1.0
         = (24 + 18 + 8 + 18) / 1.0
         = 68%
\`\`\`

## 가중치 체계

### 기본 가중치 설정
\`\`\`yaml
추세 추종 전략:
  이동평균: 0.35
  MACD: 0.25
  ADX: 0.20
  RSI: 0.10
  거래량: 0.10

모멘텀 전략:
  RSI: 0.30
  스토캐스틱: 0.25
  MACD: 0.20
  거래량: 0.15
  AI: 0.10

균형 전략:
  모든 지표: 0.20 (균등)
\`\`\`

### 동적 가중치 조정
\`\`\`python
def adjust_weights(market_condition):
    if market_condition == "강한_상승":
        # 추세 지표 가중치 증가
        weights['MA'] *= 1.3
        weights['RSI'] *= 0.7
        
    elif market_condition == "횡보":
        # 오실레이터 가중치 증가
        weights['RSI'] *= 1.4
        weights['Stochastic'] *= 1.3
        weights['MA'] *= 0.6
        
    # 정규화
    total = sum(weights.values())
    for key in weights:
        weights[key] /= total
\`\`\`

## 신뢰도 등급

### 등급 체계
\`\`\`yaml
S급 (90-100%):
  - 모든 지표 일치
  - AI 강력 추천
  - 시장 상황 유리
  - 즉시 실행 권장

A급 (80-90%):
  - 대부분 지표 일치
  - 일부 중립
  - 실행 권장

B급 (70-80%):
  - 주요 지표 긍정
  - 보조 지표 혼재
  - 신중한 진입

C급 (60-70%):
  - 신호 혼재
  - 관망 권장
  - 소액만 고려

D급 (60% 미만):
  - 신호 불일치
  - 거래 보류
\`\`\`

### 실행 기준
\`\`\`python
def should_execute_trade(confidence, user_threshold):
    # 기본 임계값 체크
    if confidence < user_threshold:
        return False
    
    # 추가 안전장치
    if confidence < 70 and market_volatility > high:
        return False
        
    # 연속 손실 시 기준 상향
    if consecutive_losses > 3:
        required_confidence = user_threshold + 10
        return confidence >= required_confidence
        
    return True
\`\`\`

## 시장 상황별 보정

### 변동성 보정
\`\`\`yaml
극도 고변동성 (VIX > 30):
  - 전체 신뢰도 × 0.7
  - 손절 기준 확대
  - 포지션 축소

고변동성 (VIX 20-30):
  - 전체 신뢰도 × 0.85
  - 일반 거래

저변동성 (VIX < 20):
  - 전체 신뢰도 × 1.1
  - 포지션 확대 가능
\`\`\`

### 시간대별 보정
\`\`\`yaml
아시아 시간 (09:00-17:00 KST):
  - 원화 마켓: ×1.1
  - USD 마켓: ×0.9

미국 시간 (22:00-06:00 KST):
  - USD 마켓: ×1.2
  - 원화 마켓: ×0.8

주말:
  - 전체: ×0.7 (유동성 감소)
\`\`\`

## 코인별 특성 반영

### 메이저 코인
\`\`\`yaml
BTC:
  - 기술적 지표 신뢰도 높음
  - 패턴 인식 유효
  - 뉴스 영향 크게 받음
  
  가중치 조정:
    기술 지표: ×1.1
    AI 분석: ×1.0
    거래량: ×0.9
\`\`\`

### 알트코인
\`\`\`yaml
중형 알트 (ETH, BNB 등):
  - BTC 상관관계 고려
  - 독립적 움직임 존재
  
  가중치 조정:
    상관관계: +0.15
    고유 지표: ×0.85

소형 알트:
  - 변동성 극대
  - 조작 가능성
  
  가중치 조정:
    전체 신뢰도: ×0.7
    거래량 지표: ×1.5
\`\`\`

## 학습 기반 최적화

### 성과 추적
\`\`\`python
def track_indicator_performance():
    for indicator in indicators:
        # 신호 정확도 계산
        accuracy = calculate_accuracy(indicator.signals, actual_results)
        
        # 수익 기여도 계산
        profit_contribution = calculate_profit_contribution(indicator)
        
        # 가중치 업데이트
        new_weight = current_weight * (0.7 + 0.3 * accuracy)
        update_weight(indicator, new_weight)
\`\`\`

### A/B 테스트
\`\`\`yaml
테스트 그룹 A:
  - 기존 가중치 사용
  - 성과 측정

테스트 그룹 B:
  - AI 최적화 가중치
  - 성과 측정

결과 분석:
  - 주간 단위 비교
  - 통계적 유의성 검증
  - 우수 전략 채택
\`\`\`

## 실전 활용 예시

### Case 1: 강한 매수 신호
\`\`\`
상황: BTC 일봉 차트
- RSI: 28 (과매도) → +85 신호
- MACD: 골든크로스 → +70 신호
- 볼린저밴드: 하단 이탈 → +90 신호
- AI: "강한 반등 예상" → +95 신호
- 거래량: 평균 대비 150% → +60 신호

계산:
(85×0.25 + 70×0.20 + 90×0.20 + 95×0.25 + 60×0.10) / 1.0
= 82.75%

결정: A급 신호, 매수 실행
\`\`\`

### Case 2: 애매한 신호
\`\`\`
상황: ETH 4시간 차트
- RSI: 55 (중립) → +10 신호
- MACD: 평행 → 0 신호
- 볼린저밴드: 중심선 → +5 신호
- AI: "방향성 불명확" → +20 신호
- 거래량: 감소 → -10 신호

계산:
(10×0.25 + 0×0.20 + 5×0.20 + 20×0.25 + (-10)×0.10) / 1.0
= 7.5%

결정: D급 신호, 거래 보류
\`\`\`

## 신뢰도 시스템 커스터마이징

### 개인 성향 반영
\`\`\`yaml
보수적 투자자:
  - 기본 임계값: 80%
  - 안전 지표 가중치 상향
  - AI 의존도 낮춤

공격적 투자자:
  - 기본 임계값: 60%
  - 모멘텀 지표 가중치 상향
  - 신호 민감도 증가

균형 투자자:
  - 기본 임계값: 70%
  - 균등 가중치
  - 상황별 유연 대응
\`\`\`

### 경험 기반 조정
\`\`\`python
# 개인 거래 이력 분석
def personalize_weights(trading_history):
    success_rate_by_indicator = analyze_success_rate(trading_history)
    
    for indicator, success_rate in success_rate_by_indicator.items():
        if success_rate > 0.7:
            weights[indicator] *= 1.2
        elif success_rate < 0.4:
            weights[indicator] *= 0.8
    
    normalize_weights(weights)
\`\`\`

💡 **Pro Tip**: 신뢰도는 확률이지 확실성이 아닙니다. 리스크 관리와 함께 사용하세요!
    `,
  },

  // 시장 상황 판단
  'core-concepts.market-conditions': {
    title: '시장 상황 판단',
    content: `
# 시장 상황 판단 📈

## 시장 상황의 중요성

같은 전략도 시장 상황에 따라 완전히 다른 결과를 낳습니다. 정확한 시장 상황 판단은 성공적인 거래의 첫걸음입니다.

## 시장 단계 분류

### 1. 상승 추세 (Uptrend)
\`\`\`yaml
특징:
  - 고점과 저점이 계속 상승
  - 이동평균선 정배열
  - 거래량 증가
  - 긍정적 뉴스 증가

지표 신호:
  - MA20 > MA50 > MA200
  - RSI 40-70 유지
  - MACD > 신호선
  - ADX > 25

최적 전략:
  - 추세 추종
  - 저점 매수
  - 홀딩 위주
\`\`\`

### 2. 하락 추세 (Downtrend)
\`\`\`yaml
특징:
  - 고점과 저점이 계속 하락
  - 이동평균선 역배열
  - 패닉 매도
  - 부정적 뉴스 증가

지표 신호:
  - MA20 < MA50 < MA200
  - RSI 30-60 유지
  - MACD < 신호선
  - ADX > 25 (하락)

최적 전략:
  - 숏 포지션
  - 반등 매도
  - 현금 보유
\`\`\`

### 3. 횡보장 (Sideways)
\`\`\`yaml
특징:
  - 일정 범위 내 등락
  - 방향성 부재
  - 거래량 감소
  - 뉴스 영향 제한적

지표 신호:
  - 이동평균선 수평
  - RSI 45-55 왕복
  - ADX < 20
  - 볼린저밴드 수축

최적 전략:
  - 레인지 트레이딩
  - 지지/저항 활용
  - 스캘핑
\`\`\`

### 4. 변동성 장세 (Volatile)
\`\`\`yaml
특징:
  - 급격한 가격 변동
  - 예측 어려움
  - 거래량 급증
  - 감정적 거래 증가

지표 신호:
  - ATR 급증
  - 볼린저밴드 확대
  - VIX 상승
  - 캔들 실체 증가

최적 전략:
  - 포지션 축소
  - 손절 확대
  - 단기 매매
\`\`\`

## 시장 강도 측정

### Bull/Bear 강도
\`\`\`python
def calculate_market_strength():
    # 상승/하락 비율
    advance_decline = count_rising_coins / count_falling_coins
    
    # 신고가/신저가 비율
    new_high_low = new_highs / new_lows
    
    # 거래량 방향성
    volume_direction = buy_volume / sell_volume
    
    # 종합 강도 (0-100)
    strength = weighted_average([
        advance_decline * 30,
        new_high_low * 30,
        volume_direction * 40
    ])
    
    return {
        'strength': strength,
        'trend': 'bullish' if strength > 50 else 'bearish',
        'confidence': abs(strength - 50) / 50
    }
\`\`\`

### 시장 체제 전환 감지
\`\`\`yaml
전환 신호:
  상승 → 하락:
    - 거래량 동반 하락
    - 주요 지지선 붕괴
    - 이평선 데드크로스
    - 투자 심리 악화
    
  하락 → 상승:
    - 매도 소진
    - 거래량 증가
    - 주요 저항선 돌파
    - 긍정적 뉴스 누적
    
  추세 → 횡보:
    - 거래량 감소
    - 변동폭 축소
    - 모멘텀 약화
    - 시장 관심 감소
\`\`\`

## 시장 사이클

### 암호화폐 4년 주기
\`\`\`yaml
1년차 - 바닥 형성:
  - 약세장 지속
  - 관심 최저
  - 축적 단계
  
2년차 - 회복 시작:
  - 서서히 상승
  - 기관 진입
  - 인프라 구축
  
3년차 - 본격 상승:
  - 급격한 상승
  - 대중 관심
  - FOMO 시작
  
4년차 - 정점과 하락:
  - 버블 형성
  - 조정 시작
  - 공포 확산
\`\`\`

### 단기 사이클
\`\`\`yaml
일일 패턴:
  - 아시아 시간: 조용함
  - 유럽 오픈: 변동 시작
  - 미국 오픈: 주요 움직임
  - 새벽: 급변동 가능

주간 패턴:
  - 월요일: 주말 반영
  - 화-목: 활발한 거래
  - 금요일: 포지션 정리
  - 주말: 변동성 증가
\`\`\`

## 시장 심리 지표

### Fear & Greed Index
\`\`\`yaml
구성 요소:
  - 변동성 (25%)
  - 시장 모멘텀 (25%)
  - 소셜 미디어 (15%)
  - 설문조사 (15%)
  - 도미넌스 (10%)
  - 트렌드 (10%)

해석:
  0-24: 극도의 공포 (매수 기회)
  25-49: 공포 (관심 가져볼 때)
  50-74: 탐욕 (주의 필요)
  75-100: 극도의 탐욕 (매도 고려)
\`\`\`

### 센티멘트 분석
\`\`\`python
def analyze_market_sentiment():
    # 소셜 미디어 분석
    social_sentiment = analyze_social_media()
    
    # 뉴스 감성 분석
    news_sentiment = analyze_news()
    
    # 검색 트렌드
    search_trends = get_google_trends()
    
    # 온체인 데이터
    onchain_sentiment = analyze_onchain()
    
    return {
        'overall_sentiment': weighted_average([
            social_sentiment * 0.3,
            news_sentiment * 0.3,
            search_trends * 0.2,
            onchain_sentiment * 0.2
        ]),
        'sentiment_trend': calculate_trend(),
        'extreme_levels': detect_extremes()
    }
\`\`\`

## 프로그램의 시장 판단

### 실시간 모니터링
\`\`\`yaml
모니터링 항목:
  - 주요 지수 움직임
  - 섹터별 성과
  - 거래량 변화
  - 변동성 지표
  - 상관관계 변화

업데이트 주기:
  - 실시간: 가격, 거래량
  - 5분: 기술 지표
  - 1시간: 시장 체제
  - 일일: 장기 트렌드
\`\`\`

### AI 시장 분석
\`\`\`python
def ai_market_analysis():
    # Claude AI 종합 분석
    market_data = gather_all_market_data()
    
    ai_analysis = claude_ai.analyze({
        'prompt': "현재 시장 상황 종합 분석",
        'data': market_data,
        'focus': ['trend', 'sentiment', 'risk', 'opportunity']
    })
    
    return {
        'market_phase': ai_analysis.phase,
        'strength': ai_analysis.strength,
        'risks': ai_analysis.risks,
        'opportunities': ai_analysis.opportunities,
        'recommendation': ai_analysis.strategy
    }
\`\`\`

## 상황별 대응 전략

### 상승장 전략
\`\`\`yaml
초기 상승:
  - 공격적 매수
  - 레버리지 고려
  - 장기 포지션

중기 상승:
  - 추가 매수 신중
  - 부분 익절 시작
  - 트레일링 스톱

말기 상승:
  - 신규 매수 금지
  - 단계적 익절
  - 현금 비중 확대
\`\`\`

### 하락장 전략
\`\`\`yaml
초기 하락:
  - 손절 철저
  - 반등 매도
  - 숏 포지션

중기 하락:
  - 현금 보유
  - 바닥 신호 관찰
  - 분할 매수 준비

말기 하락:
  - 절망 매도 활용
  - 장기 투자 시작
  - 우량 자산 축적
\`\`\`

### 횡보장 전략
\`\`\`yaml
범위 확인:
  - 지지/저항 명확화
  - 박스권 설정
  - 이탈 대비

거래 방법:
  - 지지선 매수
  - 저항선 매도
  - 손절 타이트
  - 작은 수익 실현
\`\`\`

## 리스크 레벨 설정

### 시장 상황별 리스크
\`\`\`yaml
상승 추세:
  - 리스크 레벨: 중간
  - 포지션 크기: 보통
  - 레버리지: 낮음

하락 추세:
  - 리스크 레벨: 높음
  - 포지션 크기: 작음
  - 레버리지: 없음

횡보장:
  - 리스크 레벨: 낮음
  - 포지션 크기: 큼
  - 레버리지: 없음

고변동성:
  - 리스크 레벨: 매우 높음
  - 포지션 크기: 최소
  - 레버리지: 금지
\`\`\`

## 체크리스트

### 일일 시장 점검
- [ ] 비트코인 도미넌스 확인
- [ ] 주요 뉴스 체크
- [ ] 기술적 지표 상태
- [ ] 거래량 추이
- [ ] 투자 심리 지수
- [ ] 상관관계 변화
- [ ] 이상 신호 유무

💡 **Remember**: 시장은 항상 옳습니다. 시장과 싸우지 말고 따라가세요!
    `,
  },
};