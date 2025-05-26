import { TechnicalAnalysis } from './analysis-service';

interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

class AIService {
  private config: ClaudeConfig = {
    apiKey: '',
    model: 'claude-3-haiku-20240307',
    maxTokens: 500
  };

  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  async generateTradingAnalysis(technical: TechnicalAnalysis, marketData?: any, analysisConfig?: any): Promise<string> {
    if (!this.config.apiKey) {
      // API 키가 없으면 간단한 데이터 나열
      return this.generateSimpleAnalysis(technical, marketData, analysisConfig);
    }

    try {
      const prompt = this.buildAnalysisPrompt(technical, marketData, analysisConfig);
      const response = await this.callClaudeAPI(prompt);
      // API 응답이 없으면 간단한 분석 사용
      return response || this.generateSimpleAnalysis(technical, marketData, analysisConfig);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // API 실패 시에도 간단한 분석 사용
      return this.generateSimpleAnalysis(technical, marketData, analysisConfig);
    }
  }

  private buildAnalysisPrompt(technical: TechnicalAnalysis, marketData?: any, analysisConfig?: any): string {
    const { market, rsi, stochasticRSI, macd, bollinger, sma, atr, obv, adx, signal, confidence, volume, priceChange, orderbook, trades, kimchiPremium, fearGreedIndex, newsAnalysis, scores } = technical;
    const currentPrice = marketData?.currentPrice || 0;
    const coin = market.replace('KRW-', '');
    
    // 확장된 코인별 특성 정의
    const coinCharacteristics: Record<string, string> = {
      'BTC': '매크로 경제 지표와 연동성이 높고, 기관 투자자의 영향을 크게 받음. 미국 주식시장 개장 시간대 변동성 증가',
      'ETH': 'DeFi 생태계 활동과 가스비 변화에 민감하게 반응. 이더리움 2.0 스테이킹 비율이 가격에 영향',
      'XRP': '규제 뉴스와 법적 이슈에 매우 민감함. SEC 소송 관련 뉴스에 극단적 변동성',
      'DOGE': '소셜 미디어와 유명인 발언에 극도로 민감한 밈코인. 일론 머스크 트윗에 즉각 반응',
      'SOL': '네트워크 안정성과 TVL 변화가 가격에 직접적 영향. 네트워크 중단 시 급락 위험',
      'ADA': '개발 진척도와 파트너십 뉴스에 민감하게 반응. 하드포크 일정 전후 변동성 증가',
      'MATIC': 'Layer 2 경쟁과 이더리움 가스비에 민감. zkEVM 개발 진척도가 주요 가격 동력',
      'AVAX': 'DeFi 프로토콜 TVL과 서브넷 채택률이 핵심. 겨울철 "Avalanche Rush" 이벤트 주목',
      'DOT': '파라체인 경매와 스테이킹 비율이 중요. 크로스체인 상호운용성 뉴스에 민감',
      'ATOM': 'IBC 생태계 확장과 에어드롭이 주요 동력. Cosmos 생태계 전체 TVL 추이 중요',
      'LINK': '오라클 수요와 DeFi 성장률에 비례. 새로운 체인 통합 발표 시 상승',
      'UNI': 'DEX 거래량과 수수료 수익이 핵심. Uniswap V4 개발 진척도 주시',
      'ARB': 'Arbitrum 생태계 성장과 L2 경쟁이 핵심. 에어드롭 물량 해제 일정 주의'
    };
    
    const coinContext = coinCharacteristics[coin] || '알트코인으로 비트코인 가격 움직임과 연동성이 높음. BTC 도미넌스 변화에 민감';
    
    let prompt = `당신은 경험 많은 암호화폐 트레이더의 친구이자 멘토입니다. 
지금은 ${new Date().toLocaleString('ko-KR')} (KST)이고, 시장 상황을 함께 분석해보겠습니다.
형식적인 표현보다는 자연스럽게, 마치 대화하듯이 설명해주세요.

**시장 컨텍스트**
• 코인: ${market} (${coinContext})
• 현재가: ${currentPrice.toLocaleString()}원
• 현재 AI 판단: ${signal} (신뢰도 ${confidence.toFixed(1)}%)

**🕐 멀티 타임프레임 분석 요청**
• 5분봉 (현재 데이터 기준): 초단기 스캘핑 관점
• 15분봉 예상: 단기 추세 방향
• 1시간봉 예상: 당일 주요 지지/저항
• 4시간봉 예상: 2-3일 스윙 트레이딩 관점
• 일봉 예상: 중기 추세와 주요 레벨

**📊 고급 기술적 지표**
• RSI(14): ${rsi.toFixed(2)} ${rsi < 30 ? '⚠️ 과매도' : rsi > 70 ? '⚠️ 과매수' : ''}
${stochasticRSI ? `• Stochastic RSI: K=${stochasticRSI.k.toFixed(2)}, D=${stochasticRSI.d.toFixed(2)} ${stochasticRSI.k < 20 ? '🔵 과매도' : stochasticRSI.k > 80 ? '🔴 과매수' : ''}` : ''}
• MACD: ${macd.macd.toFixed(4)} (신호선: ${macd.signal.toFixed(4)}, 히스토그램: ${macd.histogram.toFixed(4)})
• 볼린저 밴드: 상단 ${bollinger.upper.toFixed(0)}, 중간 ${bollinger.middle.toFixed(0)}, 하단 ${bollinger.lower.toFixed(0)}
  - 현재 위치: ${currentPrice > bollinger.upper ? '상단 돌파 ⬆️' : currentPrice < bollinger.lower ? '하단 돌파 ⬇️' : '밴드 내'}
• 이동평균: SMA20 ${sma.sma20.toFixed(0)}, SMA50 ${sma.sma50.toFixed(0)} ${sma.sma20 > sma.sma50 ? '🟢 골든크로스' : '🔴 데드크로스'}
${atr ? `• ATR(14): ${atr.toFixed(0)} (변동성 ${atr / currentPrice > 0.03 ? '높음' : '보통'})` : ''}
${obv ? `• OBV: ${obv.trend} 트렌드 (시그널 대비 ${((obv.value / obv.signal - 1) * 100).toFixed(1)}%)` : ''}
${adx ? `• ADX: ${adx.adx.toFixed(1)} (추세 강도: ${adx.trend}) ${adx.plusDI > adx.minusDI ? '상승 우세' : '하락 우세'}` : ''}

**📈 거래량 및 가격 분석**
• 현재 거래량: ${volume.current.toFixed(2)} (20봉 평균 대비 ${(volume.ratio * 100).toFixed(1)}%)
${volume.ratio > 2.0 ? '  🚨 거래량 폭증! 큰 가격 변동 예상' : volume.ratio > 1.5 ? '  ⚠️ 거래량 증가 중' : volume.ratio < 0.5 ? '  💤 거래량 저조, 가격 정체 가능' : ''}
• 24시간 변화: ${(priceChange.changeRate24h * 100).toFixed(2)}% (${priceChange.change24h.toLocaleString()}원)
• 24시간 레인지: ${priceChange.low24h.toLocaleString()}원 ~ ${priceChange.high24h.toLocaleString()}원
• 현재 위치: 일일 레인지의 ${(((currentPrice - priceChange.low24h) / (priceChange.high24h - priceChange.low24h)) * 100).toFixed(1)}% 지점

**🧠 시장 미시구조 분석**`;

    if (!analysisConfig || analysisConfig.useKimchiPremium !== false) {
      prompt += `\n• 김치 프리미엄: ${kimchiPremium?.toFixed(2) || '0.00'}% `;
      if ((kimchiPremium || 0) < -2) prompt += '💎 역프 절호의 기회!';
      else if ((kimchiPremium || 0) < 0) prompt += '📉 역프리미엄 매수 유리';
      else if ((kimchiPremium || 0) > 5) prompt += '🚨 김프 과열 위험!';
      else if ((kimchiPremium || 0) > 3) prompt += '⚠️ 김프 상승 주의';
      else prompt += '✅ 정상 범위';
    }
    
    prompt += `\n• 공포/탐욕 지수: ${fearGreedIndex || 50}/100 `;
    if ((fearGreedIndex || 50) < 20) prompt += '😱 극도의 공포 (역발상 매수 기회)';
    else if ((fearGreedIndex || 50) < 40) prompt += '😨 공포 우세';
    else if ((fearGreedIndex || 50) > 80) prompt += '🤑 극도의 탐욕 (차익실현 시점)';
    else if ((fearGreedIndex || 50) > 60) prompt += '😊 탐욕 우세';
    else prompt += '😐 중립적 심리';

    // 호가창 깊이 분석 (개선된 버전)
    if (orderbook && (!analysisConfig || analysisConfig.useOrderbook !== false)) {
      prompt += `\n\n**🔍 호가창 깊이 분석 (시장 미시구조)**
• 매수/매도 세력비: ${orderbook.bidAskRatio.toFixed(2)} ${orderbook.bidAskRatio > 1.5 ? '🔥 강한 매수세!' : orderbook.bidAskRatio > 1.2 ? '📈 매수 우세' : orderbook.bidAskRatio < 0.7 ? '💀 강한 매도세!' : orderbook.bidAskRatio < 0.8 ? '📉 매도 우세' : '⚖️ 균형'}
• 스프레드: ${orderbook.spread.toFixed(3)}% ${orderbook.spread > 0.5 ? '(넓음 - 변동성 높음)' : orderbook.spread < 0.1 ? '(좁음 - 안정적)' : '(보통)'}`;
      
      if (orderbook.imbalance) {
        prompt += `\n• 상위 5호가 불균형: ${orderbook.imbalance.toFixed(1)}% `;
        if (orderbook.imbalance > 30) prompt += '🟢 매수벽 형성! (강력한 지지선)';
        else if (orderbook.imbalance > 10) prompt += '↗️ 매수 압력 (상승 가능성)';
        else if (orderbook.imbalance < -30) prompt += '🔴 매도벽 형성! (강력한 저항선)';
        else if (orderbook.imbalance < -10) prompt += '↘️ 매도 압력 (하락 가능성)';
        else prompt += '↔️ 균형 상태 (방향성 모호)';
      }
      
      prompt += `\n• 총 매수 대기: ${orderbook.totalBidSize.toFixed(4)} ${coin}`;
      prompt += `\n• 총 매도 대기: ${orderbook.totalAskSize.toFixed(4)} ${coin}`;
      
      // 호가창 깊이 추가 분석
      const depthRatio = orderbook.totalBidSize / (orderbook.totalBidSize + orderbook.totalAskSize);
      prompt += `\n• 매수 대기 비율: ${(depthRatio * 100).toFixed(1)}% `;
      if (depthRatio > 0.6) prompt += '(매수 물량 압도적)';
      else if (depthRatio < 0.4) prompt += '(매도 물량 압도적)';
      
      // 스프레드 기반 시장 상태 판단
      prompt += `\n• 시장 상태: `;
      if (orderbook.spread < 0.05) prompt += '매우 안정적 (기관/봇 활발)';
      else if (orderbook.spread < 0.1) prompt += '안정적 (정상 거래)';
      else if (orderbook.spread < 0.3) prompt += '약간 불안정 (주의 필요)';
      else prompt += '매우 불안정 (급변동 위험)';
    }

    // 체결 내역 및 고래 감지
    if (trades && (!analysisConfig || analysisConfig.useTrades !== false)) {
      prompt += `\n\n**💰 실시간 체결 분석**
• 매수 체결률: ${(trades.buyRatio * 100).toFixed(1)}% ${trades.buyRatio > 0.7 ? '🔥 공격적 매수!' : trades.buyRatio > 0.6 ? '📈 매수 강세' : trades.buyRatio < 0.3 ? '💀 패닉 매도!' : trades.buyRatio < 0.4 ? '📉 매도 강세' : '⚖️ 균형'}
• 체결 강도: 매수 ${trades.buyVolume.toFixed(4)} vs 매도 ${trades.sellVolume.toFixed(4)}`;
      
      if (trades.whaleDetected) {
        prompt += `\n• 🐋 고래 출현! ${trades.whaleVolume?.toFixed(4) || 0} BTC `;
        prompt += trades.buyVolume > trades.sellVolume ? '대량 매수 포착!' : '대량 매도 포착!';
      }
    }

    if (newsAnalysis && newsAnalysis.totalNews > 0 && (!analysisConfig || analysisConfig.useNews !== false)) {
      prompt += `\n\n**뉴스 분석** (최근 ${newsAnalysis.totalNews}개):
• 감정 점수: ${newsAnalysis.sentimentScore}점 (-100 ~ +100)
• 긍정/부정/중립: ${newsAnalysis.positiveCount}/${newsAnalysis.negativeCount}/${newsAnalysis.neutralCount}
• 주요 키워드: ${newsAnalysis.topKeywords.slice(0, 5).join(', ')}`;
      
      if (newsAnalysis.majorEvents.length > 0) {
        prompt += `\n• 주요 이벤트: ${newsAnalysis.majorEvents[0]}`;
      }
      
      if (newsAnalysis.newsItems.length > 0) {
        prompt += `\n• 최신 헤드라인: "${newsAnalysis.newsItems[0].title}" (${newsAnalysis.newsItems[0].sentiment})`;
      }
    }

    prompt += `\n\n**📊 AI 종합 판단 점수**
• 매수 신호 강도: ${scores?.buyScore?.toFixed(1) || marketData?.buyScore?.toFixed(1) || 'N/A'}% ${(scores?.buyScore || 0) > 50 ? '💪 강함' : (scores?.buyScore || 0) > 30 ? '👍 양호' : '👎 약함'}
• 매도 신호 강도: ${scores?.sellScore?.toFixed(1) || marketData?.sellScore?.toFixed(1) || 'N/A'}% ${(scores?.sellScore || 0) > 50 ? '💪 강함' : (scores?.sellScore || 0) > 30 ? '👍 양호' : '👎 약함'}
• 최종 판단: ${signal} (신뢰도 ${confidence.toFixed(1)}%)
${scores?.activeSignals && scores.activeSignals.length > 0 ? `• 주요 활성 신호: ${scores.activeSignals.slice(0, 3).join(', ')}` : ''}

**📈 과거 가격 추이 컨텍스트**
• 24시간 전: ${priceChange.change24h > 0 ? '+' : ''}${(priceChange.changeRate24h * 100).toFixed(2)}% (${Math.abs(priceChange.change24h).toLocaleString()}원)
• 7일 추정 변화: ${currentPrice > 0 ? `현재가 대비 ${((currentPrice - priceChange.low24h * 1.2) / currentPrice * 100).toFixed(1)}%` : 'N/A'}
• 30일 추정 변화: ${currentPrice > 0 ? `현재가 대비 ${((currentPrice - priceChange.low24h * 1.5) / currentPrice * 100).toFixed(1)}%` : 'N/A'}
• 52주 예상 위치: 하단 ${(priceChange.low24h * 0.7).toLocaleString()}원 ~ 상단 ${(priceChange.high24h * 2.5).toLocaleString()}원

**🎯 종합 분석 요청**

위 데이터를 보고 솔직하고 실용적인 조언을 해주세요. 특히:

1. **📍 지금 시장이 어떤 상황인가요?**
   - 한마디로 정리하면?
   - 지금이 매수/매도/관망 중 어떤 타이밍인지?
   - 가장 중요한 신호는 무엇인지?

2. **🧠 다른 투자자들은 뭘 하고 있나요?**
   - 큰손들의 움직임은?
   - 일반 투자자들의 분위기는?
   - 지금 따라가도 될까요, 역발상이 필요할까요?

3. **💰 그래서 뭘 해야 하나요?** (구체적인 가격과 함께)
   - 진입 전략: 
     * 1차 진입가: ${(currentPrice * 0.995).toFixed(0)}원 근처 (현재가 -0.5%)
     * 2차 진입가: ${(currentPrice * 0.98).toFixed(0)}원 근처 (현재가 -2%)
     * 추가 매수 조건은?
   - 손절 전략: 
     * 손절가: ${(currentPrice * 0.97).toFixed(0)}원 또는 ${(currentPrice * 0.95).toFixed(0)}원
     * 손절 이유와 시나리오를 명확히
   - 목표가: 
     * 1차 목표: ${(currentPrice * 1.02).toFixed(0)}원 ~ ${(currentPrice * 1.03).toFixed(0)}원 (몇% 익절?)
     * 2차 목표: ${(currentPrice * 1.05).toFixed(0)}원 ~ ${(currentPrice * 1.08).toFixed(0)}원 (몇% 익절?)
     * 최종 목표: ${(currentPrice * 1.1).toFixed(0)}원 이상?
   - 포지션 크기: 
     * 현재 리스크를 고려한 적정 비중은?
     * Kelly Criterion 기준 최적 베팅 사이즈는?

4. **⏰ 타이밍은요?**
   - 지금 당장? 아니면 기다려?
   - 뭘 보고 결정해야 할까요?
   - 놓치면 안 되는 순간은?

5. **🚨 조심해야 할 것들**
   - 뭐가 가장 위험한가요?
   - 예상과 다르게 움직이면?
   - 손실은 어디서 막아야 하나요?

6. **🎲 앞으로 어떻게 될까요?**
   - 오를 가능성: 어느 정도? 얼마나?
   - 옆으로 갈 가능성: 어느 구간에서?
   - 떨어질 가능성: 어디까지?

7. **💡 한 줄 요약**
   - 내 돈이라면 어떻게 할 건가요?

답변할 때는 주식에 대해서 정확히 모르는 고객에게 말하듯이 말하세요. 구체적인 숫자와 이유를 꼭 포함해주세요.
`;

    return prompt;
  }

  private async callClaudeAPI(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  // AI 미사용 시 간단한 데이터 나열
  private generateSimpleAnalysis(technical: TechnicalAnalysis, marketData?: any, analysisConfig?: any): string {
    const { market, rsi, stochasticRSI, macd, bollinger, sma, atr, obv, adx, signal, confidence, volume, priceChange, orderbook, trades, kimchiPremium, fearGreedIndex, newsAnalysis, scores } = technical;
    const currentPrice = marketData?.currentPrice || bollinger.middle;
    
    let analysis = '';
    
    // 📊 기술적 지표
    analysis += `📊 **기술적 지표**\n`;
    analysis += `• RSI: ${rsi.toFixed(1)} ${rsi > 70 ? '(과매수)' : rsi < 30 ? '(과매도)' : '(중립)'}\n`;
    if (stochasticRSI) {
      analysis += `• Stochastic RSI: K=${stochasticRSI.k.toFixed(1)}, D=${stochasticRSI.d.toFixed(1)}\n`;
    }
    analysis += `• MACD: ${macd.macd > macd.signal ? '상승' : '하락'} (히스토그램: ${macd.histogram.toFixed(4)})\n`;
    analysis += `• 볼린저밴드: ${currentPrice > bollinger.upper ? '상단 돌파' : currentPrice < bollinger.lower ? '하단 돌파' : '밴드 내'}\n`;
    analysis += `• 이동평균: ${sma.sma20 > sma.sma50 ? '골든크로스' : '데드크로스'}\n`;
    if (atr) analysis += `• ATR: ${atr.toFixed(0)}\n`;
    if (obv) analysis += `• OBV: ${obv.trend}\n`;
    if (adx) analysis += `• ADX: ${adx.adx.toFixed(1)} (${adx.trend})\n`;
    
    analysis += `\n📈 **시장 데이터**\n`;
    analysis += `• 현재가: ${currentPrice.toLocaleString()}원\n`;
    analysis += `• 24시간 변화: ${(priceChange.changeRate24h * 100).toFixed(2)}%\n`;
    analysis += `• 거래량: ${(volume.ratio * 100).toFixed(0)}% (평균 대비)\n`;
    if (kimchiPremium) analysis += `• 김치 프리미엄: ${kimchiPremium.toFixed(2)}%\n`;
    analysis += `• 공포/탐욕 지수: ${fearGreedIndex || 50}/100\n`;
    
    if (orderbook) {
      analysis += `\n📋 **호가 분석**\n`;
      analysis += `• 매수/매도 비율: ${orderbook.bidAskRatio.toFixed(2)}\n`;
      analysis += `• 스프레드: ${orderbook.spread.toFixed(3)}%\n`;
    }
    
    if (trades) {
      analysis += `\n💱 **체결 분석**\n`;
      analysis += `• 매수 체결률: ${(trades.buyRatio * 100).toFixed(1)}%\n`;
      if (trades.whaleDetected) analysis += `• 🐋 고래 출현\n`;
    }
    
    // 활성 신호 개수 계산
    let buySignals = 0;
    let sellSignals = 0;
    let holdSignals = 0;
    
    // RSI 신호
    if (rsi < 30) buySignals++;
    else if (rsi > 70) sellSignals++;
    else holdSignals++;
    
    // MACD 신호
    if (macd.histogram > 0 && macd.macd > macd.signal) buySignals++;
    else if (macd.histogram < 0 && macd.macd < macd.signal) sellSignals++;
    else holdSignals++;
    
    // 볼린저밴드 신호
    if (currentPrice < bollinger.lower) buySignals++;
    else if (currentPrice > bollinger.upper) sellSignals++;
    else holdSignals++;
    
    // 이동평균 신호
    if (sma.sma20 > sma.sma50 && currentPrice > sma.sma20) buySignals++;
    else if (sma.sma20 < sma.sma50 && currentPrice < sma.sma20) sellSignals++;
    else holdSignals++;
    
    // OBV 신호
    if (obv && obv.trend === 'UP') buySignals++;
    else if (obv && obv.trend === 'DOWN') sellSignals++;
    else holdSignals++;
    
    // 김프 신호
    if (kimchiPremium && kimchiPremium < -1) buySignals++;
    else if (kimchiPremium && kimchiPremium > 3) sellSignals++;
    else holdSignals++;
    
    analysis += `\n📊 **신호 요약**\n`;
    analysis += `• 매수 신호: ${buySignals}개\n`;
    analysis += `• 매도 신호: ${sellSignals}개\n`;
    analysis += `• 대기 신호: ${holdSignals}개\n`;
    analysis += `\n🤖 **AI 판단**: ${signal} (신뢰도 ${confidence.toFixed(1)}%)`;
    
    return analysis;
  }
}

export default new AIService();