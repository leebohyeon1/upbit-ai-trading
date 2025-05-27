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
    
    let prompt = `당신은 경험 많은 암호화폐 트레이더입니다. 
지금은 ${new Date().toLocaleString('ko-KR')} (KST)이고, 시장 상황을 함께 분석해보겠습니다.
이유는 형식적인 표현보다는 자연스럽게 설명해주세요. 인사말은 하지마

**시장 컨텍스트**
• 코인: ${market} (${coinContext})
• 현재가: ${currentPrice.toLocaleString()}원
• 현재 AI 판단: ${signal} (신뢰도 ${confidence.toFixed(1)}%)
• 이유: 답변할 때는 주식에 대해서 정확히 모르는 고객에게 말하듯이 말하세요.

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