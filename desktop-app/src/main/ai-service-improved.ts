// 개선된 고급 Fallback 분석 부분만 작성
export function generateImprovedAnalysis(technical: any): string {
  const { market, rsi, macd, bollinger, sma, signal, confidence, volume, priceChange, orderbook, trades, kimchiPremium, fearGreedIndex, newsAnalysis } = technical;
  const coin = market.replace('KRW-', '');
  
  let analysis = '';
  
  // 🎯 핵심 인사이트
  analysis += `💡 **지금 상황을 정리하면**:\n`;
  
  // 가장 강력한 신호 찾기
  const strongSignals = [];
  if (rsi > 70 || rsi < 30) strongSignals.push(`RSI ${rsi.toFixed(1)} - ${rsi > 70 ? '과매수 구간' : '과매도 구간'}`);
  if (kimchiPremium && Math.abs(kimchiPremium) > 3) strongSignals.push(`김프 ${kimchiPremium.toFixed(2)}% - ${kimchiPremium > 0 ? '과열 주의' : '역프 기회'}`);
  if (volume.ratio > 2) strongSignals.push(`거래량 ${(volume.ratio * 100).toFixed(0)}% - 큰 변동성 예상`);
  if (newsAnalysis && Math.abs(newsAnalysis.sentimentScore) > 30) strongSignals.push(`뉴스 감정 ${newsAnalysis.sentimentScore}점 - ${newsAnalysis.sentimentScore > 0 ? '긍정적' : '부정적'} 여론`);
  
  if (strongSignals.length > 0) {
    analysis += `• 이거 봐야 해요: ${strongSignals.join(', ')}\n`;
  }
  
  // 🧠 시장 심리 종합 판단
  analysis += `\n🧠 **지금 사람들 분위기는**:\n`;
  const marketSentiment = (fearGreedIndex || 50) + (newsAnalysis ? newsAnalysis.sentimentScore / 2 : 0);
  
  if (marketSentiment > 70) {
    analysis += `• 지금 다들 너무 흥분해 있어요. "나만 놓치나?"하는 FOMO에 휩쓸리지 마세요.\n`;
    analysis += `• 남들이 욕심낼 때 조심하는 게 현명해요. 지금은 오히려 팔 타이밍을 보세요.\n`;
  } else if (marketSentiment < 30) {
    analysis += `• 모두가 공포에 떨고 있어요. 버핏 할아버지 말처럼 "남들이 무서워할 때 사라"고 하죠?\n`;
    analysis += `• 다들 패닉에 빠져서 팔고 있어요. 이럴 때가 오히려 기회일 수 있어요.\n`;
  } else {
    analysis += `• 지금은 특별히 좋지도 나쁘지도 않아요. 차트를 더 꾼꾼히 봐야 할 때에요.\n`;
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
  analysis += `\n📊 **그래서 어떻게 하라고요?**:\n`;
  const currentPrice = bollinger.middle;
  
  switch (signal) {
    case 'BUY':
      const buyEntry = currentPrice * 0.995;
      const buyStop = currentPrice * 0.97;
      const buyTarget1 = currentPrice * 1.02;
      const buyTarget2 = currentPrice * 1.05;
      
      analysis += `🟢 매수하려면:\n`;
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
      
      analysis += `🔴 매도하려면:\n`;
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
      analysis += `⏸️ 잘 모르겠다면:\n`;
      analysis += `• 애매할 때는 그냥 구경만 하세요. 선물주기 히트 칠 때까지 기다려요.\n`;
      analysis += `• 매수 진입: RSI 30 이하 또는 볼린저 하단 터치 시\n`;
      analysis += `• 매도 진입: RSI 70 이상 또는 볼린저 상단 돌파 시\n`;
      analysis += `• 지금은 "노 포지션이 최고의 포지션"입니다.\n`;
  }
  
  // 🔮 향후 시나리오
  analysis += `\n🔮 **앞으로 어떻게 될 것 같나요?**:\n`;
  
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
  analysis += `\n⚠️ **이건 주의하세요**:\n`;
  
  const risks = [];
  if (orderbook && orderbook.spread > 0.5) risks.push(`스프레드 ${orderbook.spread.toFixed(3)}% - 슬리피지 주의`);
  if (volume.ratio < 0.5) risks.push('거래량 부족 - 유동성 리스크');
  if (Math.abs(priceChange.changeRate24h) > 0.15) risks.push('과도한 일일 변동 - 변동성 리스크');
  
  if (risks.length > 0) {
    analysis += `• 주의사항: ${risks.join(', ')}\n`;
  }
  
  // 🤖 AI의 솔직한 의견
  analysis += `\n🤖 **솔직히 말하면**:\n`;
  
  if (confidence > 70) {
    analysis += `• 이건 꽤 확실한 기회예요 (신뢰도 ${confidence.toFixed(1)}%). 그런데 아무리 확실해도 절대 올인은 금물! 나눠서 사세요.\n`;
  } else if (confidence < 40) {
    analysis += `• 음... 솔직히 애매해요 (신뢰도 ${confidence.toFixed(1)}%). 이럴 땐 그냥 구경만 하는 게 최고예요. 억지로 들어가면 보통 손해 봅니다.\n`;
  } else {
    analysis += `• 반반입니다 (신뢰도 ${confidence.toFixed(1)}%). 꼭 해야겠다면 소액으로만 해보세요. 시장이 방향을 정할 때까지 기다리는 것도 전략이에요.\n`;
  }
  
  // 개인적인 투자 철학 추가
  if (signal === 'BUY' && confidence > 60) {
    analysis += `\n💭 지금 다들 무서워하고 있어요. 이럴 때가 오히려 기회일 수 있죠. 다만 조금씩 나눠서 사세요!\n`;
  } else if (signal === 'SELL' && confidence > 60) {
    analysis += `\n💭 수익 실현하고 후회하는 사람은 못 봤어요. 손절하고 후회하는 사람은 많이 봤죠. 욕심내지 마세요.\n`;
  }
  
  return analysis.trim();
}