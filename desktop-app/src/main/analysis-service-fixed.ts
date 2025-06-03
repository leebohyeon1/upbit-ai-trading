// analyzeTechnicals 메서드의 기존 분석 부분 수정
// 이 코드는 analysis-service.ts의 line 870 이후를 대체합니다

    // 기존 점수 기반 분석을 위한 변수 초기화
    let normalizedBuyScore = 0;
    let normalizedSellScore = 0;
    
    if (!usePythonStyle) {
      // 기존 점수 기반 분석 로직
      
      // 가중치 설정
      const indicatorWeights = config?.indicatorWeights || {
        rsi: 1.0,
        macd: 1.0,
        bollinger: 1.0,
        stochastic: 0.8,
        volume: 1.0,
        atr: 0.8,
        obv: 0.7,
        adx: 0.8,
        volatility: 1.0,
        trendStrength: 1.0,
        aiAnalysis: 1.2,
        newsImpact: 1.0,
        whaleActivity: 0.8
      };
      
      // 각 신호에 가중치 부여
      const buySignalsWithWeight = [
        // RSI 관련 지표
        { condition: rsi < (config?.rsiOversold || 30), weight: 3.0 },
        { condition: rsi < ((config?.rsiOversold || 30) + 10), weight: 2.0 },
        { condition: stochasticRSI && stochasticRSI.k < 20 && stochasticRSI.d < 20, weight: 3.0 },
        { condition: stochasticRSI && stochasticRSI.k < 30, weight: 2.0 },
        { condition: stochasticRSI && stochasticRSI.k > stochasticRSI.d && stochasticRSI.k < 50, weight: 2.5 },
        
        // 가격 및 볼린저 관련
        { condition: currentPrice < bollinger.lower, weight: 2.5 },
        { condition: currentPrice < bollinger.middle, weight: 1.5 },
        { condition: sma20 > sma50, weight: 2.0 },
        
        // MACD 및 운동량 지표
        { condition: macd.histogram > 0 && macd.macd > macd.signal, weight: 2.5 },
        { condition: macd.histogram > 0 && Math.abs(macd.histogram) > Math.abs(macd.macd) * 0.1, weight: 2.0 },
        
        // 거래량
        { condition: volumeRatio > (config?.volumeThreshold || 2.0), weight: 2.0 },
        { condition: volumeRatio > ((config?.volumeThreshold || 2.0) * 0.75), weight: 1.0 },
        
        // 호가 및 체결 분석
        { condition: orderbookData && orderbookData.bidAskRatio > 1.5, weight: 2.0 },
        { condition: orderbookData && orderbookData.bidAskRatio > 1.2, weight: 1.0 },
        { condition: orderbookData && orderbookData.imbalance && orderbookData.imbalance > 20, weight: 2.5 },
        { condition: tradesData && tradesData.buyRatio > 0.7, weight: 2.0 },
        { condition: tradesData && tradesData.buyRatio > 0.6, weight: 1.0 },
        { condition: tradesData && tradesData.whaleDetected && tradesData.buyVolume > tradesData.sellVolume, weight: 3.5 },
        
        // 가격 변화 및 시장 상황
        { condition: priceChange.changeRate24h < -0.1, weight: 2.5 },
        { condition: priceChange.changeRate24h < -0.05, weight: 1.5 },
        { condition: kimchiPremium < 0, weight: 3.0 },
        { condition: kimchiPremium < 2, weight: 1.5 },
        { condition: fearGreedIndex < 20, weight: 3.0 },
        { condition: fearGreedIndex < 35, weight: 2.0 },
        { condition: orderbookData && orderbookData.spread < 0.1, weight: 1.0 },
        { condition: currentPrice < priceChange.low24h * 1.02, weight: 2.0 },
        
        // 뉴스 및 이벤트
        { condition: newsAnalysis && newsAnalysis.sentimentScore < -50, weight: 3.0 },
        { condition: newsAnalysis && newsAnalysis.sentimentScore < -20, weight: 2.0 },
        { condition: newsAnalysis && newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore > 20, weight: 2.5 }
      ];

      // 매도 신호 조건들 (가중치 포함)
      const sellSignalsWithWeight = [
        // RSI 관련 지표
        { condition: rsi > (config?.rsiOverbought || 70), weight: 3.0 },
        { condition: rsi > ((config?.rsiOverbought || 70) - 10), weight: 2.0 },
        { condition: stochasticRSI && stochasticRSI.k > 80 && stochasticRSI.d > 80, weight: 3.0 },
        { condition: stochasticRSI && stochasticRSI.k > 70, weight: 2.0 },
        { condition: stochasticRSI && stochasticRSI.k < stochasticRSI.d && stochasticRSI.k > 50, weight: 2.5 },
        
        // 가격 및 볼린저 관련
        { condition: currentPrice > bollinger.upper, weight: 2.5 },
        { condition: currentPrice > bollinger.middle, weight: 1.5 },
        { condition: sma20 < sma50, weight: 2.0 },
        
        // MACD 및 운동량 지표
        { condition: macd.histogram < 0 && macd.macd < macd.signal, weight: 2.5 },
        { condition: macd.histogram < 0 && Math.abs(macd.histogram) > Math.abs(macd.macd) * 0.1, weight: 2.0 },
        
        // 거래량
        { condition: volumeRatio > 2.0 && priceChange.changeRate24h > 0, weight: 2.0 },
        
        // 호가 및 체결 분석
        { condition: orderbookData && orderbookData.bidAskRatio < 0.7, weight: 2.0 },
        { condition: orderbookData && orderbookData.bidAskRatio < 0.8, weight: 1.0 },
        { condition: orderbookData && orderbookData.imbalance && orderbookData.imbalance < -20, weight: 2.5 },
        { condition: tradesData && tradesData.buyRatio < 0.3, weight: 2.0 },
        { condition: tradesData && tradesData.buyRatio < 0.4, weight: 1.0 },
        { condition: tradesData && tradesData.whaleDetected && tradesData.sellVolume > tradesData.buyVolume, weight: 3.5 },
        
        // 가격 변화 및 시장 상황
        { condition: priceChange.changeRate24h > 0.15, weight: 2.5 },
        { condition: priceChange.changeRate24h > 0.1, weight: 1.5 },
        { condition: kimchiPremium > 5, weight: 3.0 },
        { condition: kimchiPremium > 3, weight: 1.5 },
        { condition: fearGreedIndex > 85, weight: 3.0 },
        { condition: fearGreedIndex > 75, weight: 2.0 },
        { condition: orderbookData && orderbookData.spread > 0.5, weight: 1.5 },
        { condition: currentPrice > priceChange.high24h * 0.98, weight: 2.0 },
        
        // 뉴스 및 이벤트
        { condition: newsAnalysis && newsAnalysis.sentimentScore > 50, weight: 3.0 },
        { condition: newsAnalysis && newsAnalysis.sentimentScore > 20, weight: 2.0 },
        { condition: newsAnalysis && newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore < -20, weight: 2.5 }
      ];
      
      // 가중치를 적용한 점수 계산
      let buyScore = 0;
      let sellScore = 0;
      const newsWeight = indicatorWeights.newsImpact || 1.0;
      
      // 조건별로 가중치 적용
      buySignalsWithWeight.forEach((signal: any) => {
        if (signal.condition) {
          let weight = signal.weight;
          
          // 뉴스 관련 신호에 가중치 적용
          if (newsAnalysis && (
            signal.condition === (newsAnalysis.sentimentScore < -50) ||
            signal.condition === (newsAnalysis.sentimentScore < -20) ||
            (signal.condition === (newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore > 20))
          )) {
            weight *= newsWeight;
          }
          
          buyScore += weight;
        }
      });
      
      sellSignalsWithWeight.forEach((signal: any) => {
        if (signal.condition) {
          let weight = signal.weight;
          
          // 뉴스 관련 신호에 가중치 적용
          if (newsAnalysis && (
            signal.condition === (newsAnalysis.sentimentScore > 50) ||
            signal.condition === (newsAnalysis.sentimentScore > 20) ||
            (signal.condition === (newsAnalysis.majorEvents.length > 0 && newsAnalysis.sentimentScore < -20))
          )) {
            weight *= newsWeight;
          }
          
          sellScore += weight;
        }
      });
      
      // 최대 가능 점수 (모든 조건이 true일 때)
      const maxBuyScore = buySignalsWithWeight.reduce((sum: number, signal: any) => sum + signal.weight, 0);
      const maxSellScore = sellSignalsWithWeight.reduce((sum: number, signal: any) => sum + signal.weight, 0);
      
      // 정규화된 점수 (0-100) - NaN 방지
      normalizedBuyScore = maxBuyScore > 0 ? (buyScore / maxBuyScore) * 100 : 0;
      normalizedSellScore = maxSellScore > 0 ? (sellScore / maxSellScore) * 100 : 0;
      
      // 디버깅용 로그
      console.log(`[${candles[0].market}] 신호 점수:`, {
        buyScore: buyScore.toFixed(2),
        sellScore: sellScore.toFixed(2),
        maxBuyScore: maxBuyScore.toFixed(2),
        maxSellScore: maxSellScore.toFixed(2),
        normalizedBuyScore: normalizedBuyScore.toFixed(2),
        normalizedSellScore: normalizedSellScore.toFixed(2),
        activeBuySignals: buySignalsWithWeight.filter((s: any) => s.condition).length,
        activeSellSignals: sellSignalsWithWeight.filter((s: any) => s.condition).length
      });
      
      // 신호 강도 레벨 정의
      const getSignalStrength = (score: number): string => {
        if (score >= 50) return 'VERY_STRONG';
        if (score >= 35) return 'STRONG';
        if (score >= 20) return 'MODERATE';
        if (score >= 15) return 'WEAK';
        return 'VERY_WEAK';
      };
      
      // 임계값 설정 근거
      const thresholds = {
        minScore: 15,        // 최소 15% = 최소 5-6개 신호 필요
        dominanceRatio: 1.3, // 30% 우위 = 명확한 방향성
        strongSignal: 35,    // 35% = 강한 신호 (약 12개 조건)
        veryStrong: 50       // 50% = 매우 강한 신호 (약 17개 조건)
      };
      
      // 더 정교한 신호 결정
      const buyStrength = getSignalStrength(normalizedBuyScore);
      const sellStrength = getSignalStrength(normalizedSellScore);
      
      if (normalizedBuyScore > thresholds.minScore && 
          normalizedBuyScore > normalizedSellScore * thresholds.dominanceRatio) {
        signal = 'BUY';
        // 신호 강도에 따른 신뢰도 차등 적용
        const baseConfidence = buyStrength === 'VERY_STRONG' ? 70 :
                             buyStrength === 'STRONG' ? 60 :
                             buyStrength === 'MODERATE' ? 50 : 40;
        confidence = Math.min(baseConfidence + normalizedBuyScore * 0.3, 95);
      } else if (normalizedSellScore > thresholds.minScore && 
                 normalizedSellScore > normalizedBuyScore * thresholds.dominanceRatio) {
        signal = 'SELL';
        const baseConfidence = sellStrength === 'VERY_STRONG' ? 70 :
                             sellStrength === 'STRONG' ? 60 :
                             sellStrength === 'MODERATE' ? 50 : 40;
        confidence = Math.min(baseConfidence + normalizedSellScore * 0.3, 95);
      } else {
        signal = 'HOLD';
        const maxScore = Math.max(normalizedBuyScore, normalizedSellScore);
        const scoreDiff = Math.abs(normalizedBuyScore - normalizedSellScore);
        
        if (maxScore > 10) {
          confidence = 35 + maxScore * 0.3 + scoreDiff * 0.2;
        } else {
          confidence = 20 + maxScore * 0.5;
        }
        
        confidence = Math.min(Math.max(confidence, 20), 60);
      }
      
      // NaN 체크 및 기본값 설정
      if (isNaN(confidence) || !isFinite(confidence)) {
        confidence = signal === 'HOLD' ? 40 : 60;
      }
      
      // 특수 상황 보너스 (추가 신뢰도)
      if (signal === 'BUY') {
        // 극도의 공포 + 역프리미엄 + RSI 과매도 = 황금 매수 기회
        if (fearGreedIndex < 20 && kimchiPremium < 0 && rsi < 30) {
          confidence = Math.min(confidence + 10, 95);
        }
        // 볼린저 하단 돌파 + 거래량 급증 + 매수세 우세
        if (currentPrice < bollinger.lower && volumeRatio > 2 && orderbookData && orderbookData.bidAskRatio > 1.5) {
          confidence = Math.min(confidence + 5, 95);
        }
        // Stochastic RSI 매수 신호만 사용 (OBV와 ADX는 간소화를 위해 제거)
        if (stochasticRSI && stochasticRSI.k < 20) {
          confidence = Math.min(confidence + 5, 95);
        }
        // 고래 매수 감지
        if (tradesData && tradesData.whaleDetected && tradesData.buyVolume > tradesData.sellVolume) {
          confidence = Math.min(confidence + 10, 95);
        }
      } else if (signal === 'SELL') {
        // 극도의 탐욕 + 높은 김프 + RSI 과매수 = 강력한 매도 신호
        if (fearGreedIndex > 85 && kimchiPremium > 5 && rsi > 80) {
          confidence = Math.min(confidence + 10, 95);
        }
        // 볼린저 상단 돌파 + 거래량 급증 + 매도세 우세
        if (currentPrice > bollinger.upper && volumeRatio > 2 && orderbookData && orderbookData.bidAskRatio < 0.7) {
          confidence = Math.min(confidence + 5, 95);
        }
        // Stochastic RSI 매도 신호만 사용 (OBV와 ADX는 간소화를 위해 제거)
        if (stochasticRSI && stochasticRSI.k > 80) {
          confidence = Math.min(confidence + 5, 95);
        }
        // 고래 매도 감지
        if (tradesData && tradesData.whaleDetected && tradesData.sellVolume > tradesData.buyVolume) {
          confidence = Math.min(confidence + 10, 95);
        }
      }
      
      // 과최적화 방지: 활성 신호가 너무 많으면 가중치 감소
      const overfittingPrevention = (score: number, activeSignals: number, totalSignals: number): number => {
        const activationRate = activeSignals / totalSignals;
        
        // 80% 이상 신호가 활성화되면 과최적화 의심
        if (activationRate > 0.8) {
          console.log(`과최적화 경고: ${(activationRate * 100).toFixed(1)}% 신호 활성화`);
          return score * 0.7; // 30% 감소
        }
        // 60% 이상이면 약간 감소
        else if (activationRate > 0.6) {
          return score * 0.9; // 10% 감소
        }
        
        return score;
      };
      
      // 과최적화 방지 적용
      const adjustedBuyScore = overfittingPrevention(
        normalizedBuyScore,
        buySignalsWithWeight.filter((s: any) => s.condition).length,
        buySignalsWithWeight.length
      );
      
      const adjustedSellScore = overfittingPrevention(
        normalizedSellScore,
        sellSignalsWithWeight.filter((s: any) => s.condition).length,
        sellSignalsWithWeight.length
      );
      
      // 조정된 점수로 업데이트
      normalizedBuyScore = adjustedBuyScore;
      normalizedSellScore = adjustedSellScore;
      
      // 활성 신호 목록 생성 (기존 로직 유지)
      const activeSignals: string[] = [];
      
      if (signal === 'BUY') {
        buySignalsWithWeight.forEach((sig: any) => {
          if (sig.condition && sig.weight >= 2.0) {
            if (sig.condition === (rsi < 30)) activeSignals.push('RSI 극도의 과매도');
            else if (sig.condition === (stochasticRSI && stochasticRSI.k < 20 && stochasticRSI.d < 20)) activeSignals.push('Stochastic RSI 과매도');
            else if (sig.condition === (currentPrice < bollinger.lower)) activeSignals.push('볼린저 하단 돌파');
            else if (sig.condition === (kimchiPremium < 0)) activeSignals.push('역프리미엄');
            else if (sig.condition === (fearGreedIndex < 20)) activeSignals.push('극도의 공포');
            else if (sig.condition === (volumeRatio > 2.0)) activeSignals.push('거래량 급증');
            else if (sig.condition === (priceChange.changeRate24h < -0.1)) activeSignals.push('24시간 10% 이상 하락');
            else if (sig.condition === (tradesData && tradesData.whaleDetected && tradesData.buyVolume > tradesData.sellVolume)) activeSignals.push('매수 고래 감지');
          }
        });
      } else if (signal === 'SELL') {
        sellSignalsWithWeight.forEach((sig: any) => {
          if (sig.condition && sig.weight >= 2.0) {
            if (sig.condition === (rsi > 80)) activeSignals.push('RSI 극도의 과매수');
            else if (sig.condition === (stochasticRSI && stochasticRSI.k > 80 && stochasticRSI.d > 80)) activeSignals.push('Stochastic RSI 과매수');
            else if (sig.condition === (currentPrice > bollinger.upper)) activeSignals.push('볼린저 상단 돌파');
            else if (sig.condition === (kimchiPremium > 5)) activeSignals.push('김프 과열');
            else if (sig.condition === (fearGreedIndex > 85)) activeSignals.push('극도의 탐욕');
            else if (sig.condition === (volumeRatio > 2.0 && priceChange.changeRate24h > 0)) activeSignals.push('상승 중 거래량 급증');
            else if (sig.condition === (priceChange.changeRate24h > 0.15)) activeSignals.push('24시간 15% 이상 급등');
            else if (sig.condition === (tradesData && tradesData.whaleDetected && tradesData.sellVolume > tradesData.buyVolume)) activeSignals.push('매도 고래 감지');
          }
        });
      }
      
    } // if (!usePythonStyle) 끝