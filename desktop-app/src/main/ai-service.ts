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

  async generateTradingAnalysis(technical: TechnicalAnalysis, marketData?: any): Promise<string> {
    if (!this.config.apiKey) {
      // API 키가 없으면 고급 Fallback 사용
      return this.generateAdvancedFallbackAnalysis(technical);
    }

    try {
      const prompt = this.buildAnalysisPrompt(technical, marketData);
      const response = await this.callClaudeAPI(prompt);
      // API 응답이 없으면 고급 Fallback 사용
      return response || this.generateAdvancedFallbackAnalysis(technical);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // API 실패 시에도 고급 Fallback 사용
      return this.generateAdvancedFallbackAnalysis(technical);
    }
  }

  private buildAnalysisPrompt(technical: TechnicalAnalysis, marketData?: any): string {
    const { market, rsi, macd, bollinger, sma, signal, confidence, volume, priceChange, orderbook, trades, kimchiPremium, fearGreedIndex, newsAnalysis } = technical;
    const currentPrice = marketData?.currentPrice || 0;
    
    let prompt = `당신은 전문 암호화폐 트레이딩 분석가입니다. 다음 기술적 지표와 시장 데이터를 바탕으로 간결하고 실용적인 분석을 제공해주세요.

**코인**: ${market}
**현재가**: ${currentPrice.toLocaleString()}원
**현재 신호**: ${signal}
**신뢰도**: ${confidence.toFixed(1)}%

**기술적 지표**:
• RSI: ${rsi.toFixed(2)}
• MACD: ${macd.macd.toFixed(4)} (신호: ${macd.signal.toFixed(4)}, 히스토그램: ${macd.histogram.toFixed(4)})
• 볼린저 밴드: 상단 ${bollinger.upper.toFixed(0)}, 중간 ${bollinger.middle.toFixed(0)}, 하단 ${bollinger.lower.toFixed(0)}
• 이동평균: SMA20 ${sma.sma20.toFixed(0)}, SMA50 ${sma.sma50.toFixed(0)}

**거래량 분석**:
• 현재 거래량: ${volume.current.toFixed(2)}
• 평균 대비: ${(volume.ratio * 100).toFixed(1)}%
${volume.ratio > 1.5 ? '• ⚠️ 거래량 급증 (평균의 1.5배 이상)' : ''}

**가격 변화 (24시간)**:
• 변화율: ${(priceChange.changeRate24h * 100).toFixed(2)}%
• 변화액: ${priceChange.change24h.toLocaleString()}원
• 고가: ${priceChange.high24h.toLocaleString()}원
• 저가: ${priceChange.low24h.toLocaleString()}원

**시장 심리 지표**:
• 김치 프리미엄: ${kimchiPremium?.toFixed(2) || '0.00'}% ${(kimchiPremium || 0) > 3 ? '(⚠️ 높은 김프)' : (kimchiPremium || 0) < 0 ? '(📉 역프리미엄)' : '(정상 범위)'}
• 공포/탐욕 지수: ${fearGreedIndex || 50}/100 ${(fearGreedIndex || 50) < 30 ? '(극도의 공포)' : (fearGreedIndex || 50) < 50 ? '(공포)' : (fearGreedIndex || 50) > 70 ? '(극도의 탐욕)' : (fearGreedIndex || 50) > 50 ? '(탐욕)' : '(중립)'}`;

    if (orderbook) {
      prompt += `\n\n**호가 분석**:
• 매수/매도 비율: ${orderbook.bidAskRatio.toFixed(2)} ${orderbook.bidAskRatio > 1 ? '(매수세 우세)' : '(매도세 우세)'}
• 스프레드: ${orderbook.spread.toFixed(3)}%`;
    }

    if (trades) {
      prompt += `\n\n**체결 분석**:
• 매수 체결 비율: ${(trades.buyRatio * 100).toFixed(1)}%
• 매수량: ${trades.buyVolume.toFixed(4)}
• 매도량: ${trades.sellVolume.toFixed(4)}`;
    }

    if (newsAnalysis && newsAnalysis.totalNews > 0) {
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

    prompt += `\n\n**종합 분석 점수**:
• 매수 신호 강도: ${marketData?.buyScore?.toFixed(1) || 'N/A'}%
• 매도 신호 강도: ${marketData?.sellScore?.toFixed(1) || 'N/A'}%
• 최종 판단: ${signal} (신뢰도 ${confidence.toFixed(1)}%)

**분석 요청**:
위 데이터를 종합적으로 분석하여, 경험 많은 트레이더의 관점에서 자유롭게 의견을 제시해주세요.

다음 내용을 포함하되, 형식에 얽매이지 말고 중요하다고 생각하는 점을 강조해주세요:

1. **핵심 통찰**: 현재 이 코인에서 가장 주목해야 할 신호는 무엇인가?

2. **시장 심리 해석**: 거래량, 호가, 체결, 뉴스 데이터가 말해주는 시장 참여자들의 심리는?

3. **실전 매매 전략**: 
   - 지금 당장 포지션을 잡는다면 어떤 전략을 쓸 것인가?
   - 구체적인 진입가, 손절가, 목표가
   - 왜 이 가격대를 선택했는지 근거

4. **향후 전망**: 
   - 단기(1-3일), 중기(1-2주) 관점에서의 시나리오
   - 어떤 신호가 나타나면 관점을 바꿀 것인가?

5. **리스크와 기회**:
   - 지금 가장 큰 리스크는 무엇인가?
   - 놓치면 안 되는 기회는 무엇인가?

6. **개인적 의견**: 
   - 만약 AI가 실제로 돈을 투자한다면 어떻게 할 것인가?
   - 왜 그런 결정을 내렸는지 솔직한 이유

**중요**: 교과서적인 분석보다는 실전에서 바로 써먹을 수 있는 인사이트를 중심으로 답변해주세요. 
데이터들이 실제 매매 결정에 어떤 영향을 미치는지 구체적으로 설명해주세요.`;

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

  private generateFallbackAnalysis(technical: TechnicalAnalysis): string {
    const { market, rsi, signal, confidence } = technical;
    
    const analyses = [
      // RSI 기반 다양한 분석
      ...(rsi < 30 ? [
        `• ${market}이 과매도 상태입니다. 단기 반등 기회를 주시하세요.`,
        `• 매도 압력이 강했지만, 이제 바닥권에서 매수 관심이 증가할 수 있습니다.`,
        `• RSI ${rsi.toFixed(1)}은 강한 하락 후 반등 신호를 보이고 있습니다.`
      ] : []),
      
      ...(rsi > 70 ? [
        `• ${market}이 과매수 구간에 진입했습니다. 단기 조정 가능성을 염두에 두세요.`,
        `• 상승 모멘텀이 강하지만, 고점에서 이익 실현 매물이 나올 수 있습니다.`,
        `• RSI ${rsi.toFixed(1)}로 과열 신호. 추가 상승 시 신중한 접근이 필요합니다.`
      ] : []),
      
      ...(rsi >= 30 && rsi <= 70 ? [
        `• ${market}이 안정적인 구간에서 거래되고 있습니다.`,
        `• RSI ${rsi.toFixed(1)}로 중립 상태. 추세 전환점을 주의깊게 관찰하세요.`,
        `• 현재 균형 상태로, 다른 지표와 함께 종합 판단이 필요합니다.`
      ] : [])
    ];

    // 신호 기반 분석
    const signalAnalyses = {
      'BUY': [
        `• 여러 기술 지표가 매수 신호를 보이고 있습니다.`,
        `• 상승 모멘텀이 형성되고 있어 매수 타이밍으로 판단됩니다.`,
        `• 기술적 분석상 상승 전환점에 있을 가능성이 높습니다.`
      ],
      'SELL': [
        `• 기술 지표들이 매도 신호를 나타내고 있습니다.`,
        `• 하락 압력이 증가하고 있어 매도를 고려할 시점입니다.`,
        `• 상승 추세 약화 신호가 감지되어 주의가 필요합니다.`
      ],
      'HOLD': [
        `• 현재 명확한 방향성이 보이지 않아 관망이 적절합니다.`,
        `• 추세 전환 신호를 기다리며 포지션을 유지하는 것을 권장합니다.`,
        `• 시장 상황이 불분명하여 성급한 매매보다는 관망이 유리합니다.`
      ]
    };

    // 랜덤하게 선택하여 자연스러운 분석 제공
    const randomAnalysis = analyses[Math.floor(Math.random() * analyses.length)] || 
                          `• ${market} 분석 중입니다.`;
    
    const randomSignalAnalysis = signalAnalyses[signal][Math.floor(Math.random() * signalAnalyses[signal].length)];
    
    const confidenceText = confidence > 60 ? '높은 신뢰도' : 
                          confidence > 40 ? '중간 신뢰도' : '낮은 신뢰도';
    
    return `${randomAnalysis}\n${randomSignalAnalysis}\n• 현재 분석 신뢰도: ${confidence.toFixed(1)}% (${confidenceText})`;
  }

  // 대안 분석 생성 (더 자유롭고 실전적인 버전)
  generateAdvancedFallbackAnalysis(technical: TechnicalAnalysis): string {
    const { market, rsi, macd, bollinger, sma, signal, confidence, volume, priceChange, orderbook, trades, kimchiPremium, fearGreedIndex, newsAnalysis } = technical;
    const coin = market.replace('KRW-', '');
    
    let analysis = '';
    
    // 🎯 핵심 인사이트
    analysis += `💡 **핵심 인사이트**:\n`;
    
    // 가장 강력한 신호 찾기
    const strongSignals = [];
    if (rsi > 70 || rsi < 30) strongSignals.push(`RSI ${rsi.toFixed(1)} - ${rsi > 70 ? '과매수 구간' : '과매도 구간'}`);
    if (kimchiPremium && Math.abs(kimchiPremium) > 3) strongSignals.push(`김프 ${kimchiPremium.toFixed(2)}% - ${kimchiPremium > 0 ? '과열 주의' : '역프 기회'}`);
    if (volume.ratio > 2) strongSignals.push(`거래량 ${(volume.ratio * 100).toFixed(0)}% - 큰 변동성 예상`);
    if (newsAnalysis && Math.abs(newsAnalysis.sentimentScore) > 30) strongSignals.push(`뉴스 감정 ${newsAnalysis.sentimentScore}점 - ${newsAnalysis.sentimentScore > 0 ? '긍정적' : '부정적'} 여론`);
    
    if (strongSignals.length > 0) {
      analysis += `• 지금 주목해야 할 신호: ${strongSignals.join(', ')}\n`;
    } else {
      analysis += `• 특별한 신호가 없는 조용한 시장입니다. 섣부른 매매는 피하세요.\n`;
    }
    
    // 🧠 시장 심리 종합 판단
    analysis += `\n🧠 **시장 심리 분석**:\n`;
    const marketSentiment = (fearGreedIndex || 50) + (newsAnalysis ? newsAnalysis.sentimentScore / 2 : 0);
    
    if (marketSentiment > 70) {
      analysis += `• 시장이 과도하게 낙관적입니다. FOMO(Fear of Missing Out)에 휩쓸리지 마세요.\n`;
      analysis += `• 대중이 욕심낼 때 두려워하는 것이 현명합니다. 분할 매도를 고려하세요.\n`;
    } else if (marketSentiment < 30) {
      analysis += `• 극도의 공포 상태입니다. 워렌 버핏의 말처럼 "남들이 두려워할 때 탐욕스러워지세요".\n`;
      analysis += `• 패닉 셀링이 일어나는 지금이 오히려 좋은 매수 기회일 수 있습니다.\n`;
    } else {
      analysis += `• 시장 심리는 중립적입니다. 기술적 지표를 더 중요하게 봐야 할 시점입니다.\n`;
    }
    
    // 거래량과 체결 분석으로 실제 수급 파악
    if (orderbook && trades) {
      const realDemand = orderbook.bidAskRatio * trades.buyRatio;
      if (realDemand > 0.8) {
        analysis += `• 실제 매수세가 강합니다. 호가와 체결 모두 매수 우위를 보입니다.\n`;
      } else if (realDemand < 0.3) {
        analysis += `• 매도 압력이 심합니다. 호가와 체결 모두 매도가 압도적입니다.\n`;
      }
    }
    
    // 📊 실전 매매 전략 (구체적이고 실용적으로)
    analysis += `\n📊 **실전 매매 전략**:\n`;
    const currentPrice = bollinger.middle;
    
    switch (signal) {
      case 'BUY':
        const buyEntry = currentPrice * 0.995;
        const buyStop = currentPrice * 0.97;
        const buyTarget1 = currentPrice * 1.02;
        const buyTarget2 = currentPrice * 1.05;
        
        analysis += `🟢 매수 전략:\n`;
        analysis += `• 1차 진입: ${buyEntry.toFixed(0)}원 (현재가 -0.5%)\n`;
        analysis += `• 2차 진입: ${(currentPrice * 0.98).toFixed(0)}원 (추가 하락 시)\n`;
        analysis += `• 손절가: ${buyStop.toFixed(0)}원 (-3%) - 칼같이 지키세요!\n`;
        analysis += `• 1차 목표: ${buyTarget1.toFixed(0)}원 (+2%) - 50% 익절\n`;
        analysis += `• 2차 목표: ${buyTarget2.toFixed(0)}원 (+5%) - 전량 익절\n`;
        
        if (kimchiPremium && kimchiPremium < 0) {
          analysis += `\n💎 특별 기회: 역프리미엄 ${Math.abs(kimchiPremium).toFixed(2)}%는 연 몇 번 없는 기회입니다!\n`;
        }
        
        if (rsi < 30) {
          analysis += `• RSI ${rsi.toFixed(1)}은 극단적 과매도. 기술적 반등이 임박했습니다.\n`;
        }
        break;
        
      case 'SELL':
        const sellEntry = currentPrice * 1.005;
        const sellStop = currentPrice * 1.03;
        const sellTarget = currentPrice * 0.97;
        
        analysis += `🔴 매도 전략:\n`;
        analysis += `• 1차 매도: ${sellEntry.toFixed(0)}원 (현재가 +0.5%)\n`;
        analysis += `• 전량 청산: ${(currentPrice * 1.01).toFixed(0)}원 이상\n`;
        analysis += `• 손절가: ${sellStop.toFixed(0)}원 (+3%) - 추세 전환 시\n`;
        analysis += `• 재진입 고려: ${sellTarget.toFixed(0)}원 (-3%)\n`;
        
        if (kimchiPremium && kimchiPremium > 5) {
          analysis += `\n⚠️ 경고: 김프 ${kimchiPremium.toFixed(2)}%는 위험 신호! 언제든 급락할 수 있습니다.\n`;
        }
        
        if (rsi > 80) {
          analysis += `• RSI ${rsi.toFixed(1)}은 극도의 과매수. 조정이 불가피합니다.\n`;
        }
        break;
        
      default:
        analysis += `⏸️ 관망 전략:\n`;
        analysis += `• 애매한 구간입니다. 욕심내지 말고 기다리세요.\n`;
        analysis += `• 매수 진입: RSI 30 이하 또는 볼린저 하단 터치 시\n`;
        analysis += `• 매도 진입: RSI 70 이상 또는 볼린저 상단 돌파 시\n`;
        analysis += `• 지금은 "노 포지션이 최고의 포지션"입니다.\n`;
    }
    
    // 🔮 향후 시나리오
    analysis += `\n🔮 **향후 전망**:\n`;
    
    // 이동평균선과 MACD로 중장기 트렌드 판단
    if (sma.sma20 > sma.sma50 && macd.histogram > 0) {
      analysis += `• 단기 전망: 상승 추세 지속 (골든크로스 + MACD 양전)\n`;
      analysis += `• 1주 목표: ${(currentPrice * 1.07).toFixed(0)}원 (+7%)\n`;
      analysis += `• 전환 신호: SMA20이 SMA50 아래로 내려가면 추세 전환\n`;
    } else if (sma.sma20 < sma.sma50 && macd.histogram < 0) {
      analysis += `• 단기 전망: 하락 압력 지속 (데드크로스 + MACD 음전)\n`;
      analysis += `• 1주 예상: ${(currentPrice * 0.93).toFixed(0)}원 (-7%)\n`;
      analysis += `• 전환 신호: MACD가 시그널선 위로 올라가면 반등 시작\n`;
    } else {
      analysis += `• 방향성이 불분명합니다. 추세 형성을 기다리세요.\n`;
    }
    
    // 뉴스가 있다면 시장에 미칠 영향 분석
    if (newsAnalysis && newsAnalysis.majorEvents.length > 0) {
      analysis += `• 주요 이벤트 발생! "${newsAnalysis.majorEvents[0].substring(0, 50)}..."\n`;
      analysis += `• 이런 뉴스는 단기 변동성을 크게 높입니다. 주의하세요.\n`;
    }
    
    // ⚠️ 리스크 관리
    analysis += `\n⚠️ **리스크 관리**:\n`;
    
    const risks = [];
    if (orderbook && orderbook.spread > 0.5) risks.push(`스프레드 ${orderbook.spread.toFixed(3)}% - 슬리피지 주의`);
    if (volume.ratio < 0.5) risks.push('거래량 부족 - 유동성 리스크');
    if (Math.abs(priceChange.changeRate24h) > 0.15) risks.push('과도한 일일 변동 - 변동성 리스크');
    
    if (risks.length > 0) {
      analysis += `• 주의사항: ${risks.join(', ')}\n`;
    }
    
    // 🤖 AI의 솔직한 조언
    analysis += `\n🤖 **AI의 솔직한 조언**:\n`;
    
    if (confidence > 70) {
      analysis += `• 신뢰도 ${confidence.toFixed(1)}%로 확신합니다. 계획대로 진행하세요.\n`;
      analysis += `• 단, 절대 올인하지 마세요. 분할 매수/매도가 답입니다.\n`;
    } else if (confidence < 40) {
      analysis += `• 신뢰도 ${confidence.toFixed(1)}%로 낮습니다. 지금은 관망하세요.\n`;
      analysis += `• 억지로 매매하면 십중팔구 손실입니다. 기다림도 전략입니다.\n`;
    } else {
      analysis += `• 신뢰도 ${confidence.toFixed(1)}%로 애매합니다. 소액으로만 테스트하세요.\n`;
      analysis += `• 시장이 방향을 정할 때까지 기다리는 것이 현명합니다.\n`;
    }
    
    // 개인적인 투자 철학 추가
    if (signal === 'BUY' && confidence > 60) {
      analysis += `\n💭 "두려움 속에서 사고, 탐욕 속에서 팔아라" - 지금이 그 두려움의 시기일 수 있습니다.\n`;
    } else if (signal === 'SELL' && confidence > 60) {
      analysis += `\n💭 "수익을 확정하는 것은 절대 잘못된 선택이 아닙니다" - 욕심이 화를 부릅니다.\n`;
    }
    
    // 24시간 변화에 대한 추가 코멘트
    if (Math.abs(priceChange.changeRate24h) > 0.1) {
      analysis += `\n📈 24시간 ${(priceChange.changeRate24h * 100).toFixed(1)}% ${priceChange.changeRate24h > 0 ? '상승' : '하락'} - `;
      analysis += Math.abs(priceChange.changeRate24h) > 0.15 ? '과도한 변동입니다. 진정될 때까지 기다리세요.' : '추세 전환 가능성을 주시하세요.';
    }
    
    return analysis.trim();
  }
}

export default new AIService();