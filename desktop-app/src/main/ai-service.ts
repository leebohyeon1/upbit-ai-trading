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
      return this.generateFallbackAnalysis(technical);
    }

    try {
      const prompt = this.buildAnalysisPrompt(technical, marketData);
      const response = await this.callClaudeAPI(prompt);
      return response || this.generateFallbackAnalysis(technical);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.generateFallbackAnalysis(technical);
    }
  }

  private buildAnalysisPrompt(technical: TechnicalAnalysis, marketData?: any): string {
    const { market, rsi, macd, bollinger, sma, signal, confidence } = technical;
    
    return `당신은 전문 암호화폐 트레이딩 분석가입니다. 다음 기술적 지표를 바탕으로 간결하고 실용적인 분석을 제공해주세요.

**코인**: ${market}
**현재 신호**: ${signal}
**신뢰도**: ${confidence.toFixed(1)}%

**기술적 지표**:
• RSI: ${rsi.toFixed(2)}
• MACD: ${macd.macd.toFixed(4)} (신호: ${macd.signal.toFixed(4)}, 히스토그램: ${macd.histogram.toFixed(4)})
• 볼린저 밴드: 상단 ${bollinger.upper.toFixed(0)}, 중간 ${bollinger.middle.toFixed(0)}, 하단 ${bollinger.lower.toFixed(0)}
• 이동평균: SMA20 ${sma.sma20.toFixed(0)}, SMA50 ${sma.sma50.toFixed(0)}

**요청사항**:
1. 현재 시장 상황을 2-3줄로 요약
2. 주요 지표들의 의미 해석
3. 구체적인 매매 전략 제안
4. 주의사항이나 리스크 요소

응답은 한국어로, 불렛 포인트 형식으로 작성해주세요. 전문 용어는 쉽게 설명해주세요.`;
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

  // 대안 분석 생성 (더 다양한 패턴)
  generateAdvancedFallbackAnalysis(technical: TechnicalAnalysis): string {
    const { market, rsi, macd, bollinger, sma, signal, confidence } = technical;
    const coin = market.replace('KRW-', '');
    
    let analysis = '';
    
    // 시장 상황 분석
    if (sma.sma20 > sma.sma50) {
      analysis += `• ${coin}의 단기 평균선이 장기 평균선 위에 있어 상승 추세를 유지하고 있습니다.\n`;
    } else {
      analysis += `• ${coin}의 단기 평균선이 장기 평균선 아래 있어 하락 추세에 있습니다.\n`;
    }
    
    // MACD 분석
    if (macd.histogram > 0) {
      analysis += `• MACD 히스토그램이 양수로 상승 모멘텀이 강화되고 있습니다.\n`;
    } else {
      analysis += `• MACD 히스토그램이 음수로 하락 모멘텀이 지속되고 있습니다.\n`;
    }
    
    // 구체적인 전략 제안
    switch (signal) {
      case 'BUY':
        analysis += `• 분할 매수를 통해 리스크를 분산하며 포지션을 늘려가는 것을 권장합니다.\n`;
        break;
      case 'SELL':
        analysis += `• 수익 실현 또는 손절매를 고려하여 포지션 정리를 권장합니다.\n`;
        break;
      default:
        analysis += `• 추가적인 신호 확인 후 매매 결정을 내리는 것이 바람직합니다.\n`;
    }
    
    return analysis.trim();
  }
}

export default new AIService();