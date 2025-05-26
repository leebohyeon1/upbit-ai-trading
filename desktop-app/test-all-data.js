const path = require('path');
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { default: upbitService } = require('./src/main/upbit-service');
const { default: analysisService } = require('./src/main/analysis-service');
const { default: newsService } = require('./src/main/news-service');
const { default: aiService } = require('./src/main/ai-service');

console.log('🔍 전체 데이터 수집 테스트 시작...\n');
console.log('=' .repeat(80));

async function testAllDataCollection() {
  const market = 'KRW-BTC';
  const symbol = 'BTC';
  let allDataCollected = true;
  const errors = [];

  try {
    console.log(`\n📊 ${market} 데이터 수집 중...\n`);

    // 1. 캔들 데이터
    console.log('1️⃣ 캔들 데이터 (차트)');
    try {
      const candles = await upbitService.getCandles(market, 20);
      console.log(`   ✅ 수집 성공: ${candles.length}개 캔들`);
      if (candles.length > 0) {
        console.log(`   - 현재가: ${candles[candles.length - 1].trade_price.toLocaleString()}원`);
        console.log(`   - 시가: ${candles[candles.length - 1].opening_price.toLocaleString()}원`);
        console.log(`   - 고가: ${candles[candles.length - 1].high_price.toLocaleString()}원`);
        console.log(`   - 저가: ${candles[candles.length - 1].low_price.toLocaleString()}원`);
      }
    } catch (error) {
      console.log(`   ❌ 수집 실패: ${error.message}`);
      errors.push('캔들 데이터');
      allDataCollected = false;
    }

    // 2. 현재가 정보 (티커)
    console.log('\n2️⃣ 현재가 정보 (티커)');
    try {
      const ticker = await upbitService.getTicker(market);
      console.log(`   ✅ 수집 성공`);
      console.log(`   - 현재가: ${ticker.trade_price.toLocaleString()}원`);
      console.log(`   - 24시간 변화율: ${(ticker.change_rate * 100).toFixed(2)}%`);
      console.log(`   - 24시간 거래량: ${ticker.acc_trade_volume_24h.toFixed(4)}`);
      console.log(`   - 24시간 거래대금: ${(ticker.acc_trade_price_24h / 100000000).toFixed(2)}억원`);
    } catch (error) {
      console.log(`   ❌ 수집 실패: ${error.message}`);
      errors.push('티커 데이터');
      allDataCollected = false;
    }

    // 3. 호가 데이터
    console.log('\n3️⃣ 호가 데이터 (오더북)');
    try {
      const orderbook = await upbitService.getOrderbook(market);
      console.log(`   ✅ 수집 성공`);
      if (orderbook && orderbook.orderbook_units) {
        const totalBidSize = orderbook.orderbook_units.reduce((sum, unit) => sum + unit.bid_size, 0);
        const totalAskSize = orderbook.orderbook_units.reduce((sum, unit) => sum + unit.ask_size, 0);
        const bidAskRatio = totalBidSize / (totalAskSize || 1);
        const spread = ((orderbook.orderbook_units[0].ask_price - orderbook.orderbook_units[0].bid_price) / orderbook.orderbook_units[0].bid_price) * 100;
        
        console.log(`   - 매수 총량: ${totalBidSize.toFixed(4)} ${symbol}`);
        console.log(`   - 매도 총량: ${totalAskSize.toFixed(4)} ${symbol}`);
        console.log(`   - 매수/매도 비율: ${bidAskRatio.toFixed(2)}`);
        console.log(`   - 스프레드: ${spread.toFixed(3)}%`);
        console.log(`   - 최우선 매수가: ${orderbook.orderbook_units[0].bid_price.toLocaleString()}원`);
        console.log(`   - 최우선 매도가: ${orderbook.orderbook_units[0].ask_price.toLocaleString()}원`);
      }
    } catch (error) {
      console.log(`   ❌ 수집 실패: ${error.message}`);
      errors.push('호가 데이터');
      allDataCollected = false;
    }

    // 4. 체결 데이터
    console.log('\n4️⃣ 체결 데이터 (최근 거래)');
    try {
      const trades = await upbitService.getTrades(market, 50);
      console.log(`   ✅ 수집 성공: ${trades.length}개 체결`);
      if (trades && trades.length > 0) {
        const buyVolume = trades.filter(t => t.ask_bid === 'BID').reduce((sum, t) => sum + t.trade_volume, 0);
        const sellVolume = trades.filter(t => t.ask_bid === 'ASK').reduce((sum, t) => sum + t.trade_volume, 0);
        const buyRatio = buyVolume / (buyVolume + sellVolume || 1);
        
        console.log(`   - 매수 체결량: ${buyVolume.toFixed(4)} ${symbol}`);
        console.log(`   - 매도 체결량: ${sellVolume.toFixed(4)} ${symbol}`);
        console.log(`   - 매수 비율: ${(buyRatio * 100).toFixed(1)}%`);
        console.log(`   - 최근 체결가: ${trades[0].trade_price.toLocaleString()}원`);
      }
    } catch (error) {
      console.log(`   ❌ 수집 실패: ${error.message}`);
      errors.push('체결 데이터');
      allDataCollected = false;
    }

    // 5. 김치 프리미엄
    console.log('\n5️⃣ 김치 프리미엄');
    try {
      const kimchiPremium = await upbitService.getKimchiPremium(market);
      console.log(`   ✅ 수집 성공`);
      console.log(`   - 김프: ${kimchiPremium.toFixed(2)}%`);
      if (kimchiPremium > 3) {
        console.log(`   - ⚠️ 김프가 높습니다 (과열 주의)`);
      } else if (kimchiPremium < 0) {
        console.log(`   - 📉 역프리미엄 상태 (매수 기회)`);
      } else {
        console.log(`   - 정상 범위`);
      }
    } catch (error) {
      console.log(`   ❌ 수집 실패: ${error.message}`);
      errors.push('김치 프리미엄');
      allDataCollected = false;
    }

    // 6. 뉴스 데이터
    console.log('\n6️⃣ 뉴스 데이터');
    try {
      const newsAnalysis = await newsService.getCoinNews(symbol);
      console.log(`   ✅ 수집 성공`);
      console.log(`   - 총 뉴스: ${newsAnalysis.totalNews}개`);
      console.log(`   - 긍정: ${newsAnalysis.positiveCount}개`);
      console.log(`   - 부정: ${newsAnalysis.negativeCount}개`);
      console.log(`   - 중립: ${newsAnalysis.neutralCount}개`);
      console.log(`   - 감정 점수: ${newsAnalysis.sentimentScore}점 (-100 ~ +100)`);
      if (newsAnalysis.topKeywords.length > 0) {
        console.log(`   - 주요 키워드: ${newsAnalysis.topKeywords.slice(0, 5).join(', ')}`);
      }
      if (newsAnalysis.majorEvents.length > 0) {
        console.log(`   - 주요 이벤트: ${newsAnalysis.majorEvents[0].substring(0, 50)}...`);
      }
    } catch (error) {
      console.log(`   ❌ 수집 실패: ${error.message}`);
      errors.push('뉴스 데이터');
      allDataCollected = false;
    }

    // 7. 기술적 분석
    console.log('\n7️⃣ 기술적 분석 (종합)');
    try {
      const candles = await upbitService.getCandles(market, 200);
      const ticker = await upbitService.getTicker(market);
      const orderbook = await upbitService.getOrderbook(market);
      const trades = await upbitService.getTrades(market);
      
      const analysis = await analysisService.analyzeTechnicals(candles, ticker, orderbook, trades);
      console.log(`   ✅ 분석 완료`);
      console.log(`   - RSI: ${analysis.rsi.toFixed(2)}`);
      console.log(`   - MACD: ${analysis.macd.macd.toFixed(4)}`);
      console.log(`   - 볼린저 밴드: 상${analysis.bollinger.upper.toFixed(0)} / 중${analysis.bollinger.middle.toFixed(0)} / 하${analysis.bollinger.lower.toFixed(0)}`);
      console.log(`   - 이동평균: SMA20 ${analysis.sma.sma20.toFixed(0)} / SMA50 ${analysis.sma.sma50.toFixed(0)}`);
      console.log(`   - 거래량 비율: ${(analysis.volume.ratio * 100).toFixed(0)}%`);
      console.log(`   - 공포/탐욕 지수: ${analysis.fearGreedIndex}/100`);
      console.log(`   - 신호: ${analysis.signal}`);
      console.log(`   - 신뢰도: ${analysis.confidence}%`);
      console.log(`   - 매수 점수: ${analysis.scores?.buyScore?.toFixed(1)}%`);
      console.log(`   - 매도 점수: ${analysis.scores?.sellScore?.toFixed(1)}%`);
      
      // 뉴스 분석 포함 여부 확인
      if (analysis.newsAnalysis) {
        console.log(`   - 뉴스 분석: ✅ 포함됨`);
      } else {
        console.log(`   - 뉴스 분석: ❌ 포함 안됨`);
        errors.push('뉴스 분석 통합');
        allDataCollected = false;
      }
    } catch (error) {
      console.log(`   ❌ 분석 실패: ${error.message}`);
      errors.push('기술적 분석');
      allDataCollected = false;
    }

    // 8. AI 분석 (Fallback)
    console.log('\n8️⃣ AI 분석 (Fallback)');
    try {
      const candles = await upbitService.getCandles(market, 200);
      const ticker = await upbitService.getTicker(market);
      const orderbook = await upbitService.getOrderbook(market);
      const trades = await upbitService.getTrades(market);
      
      const technical = await analysisService.analyzeTechnicals(candles, ticker, orderbook, trades);
      const aiAnalysis = aiService.generateAdvancedFallbackAnalysis(technical);
      
      console.log(`   ✅ AI 분석 생성 완료`);
      console.log(`   - 분석 길이: ${aiAnalysis.length}자`);
      
      // 주요 데이터 포함 여부 확인
      const checks = {
        '거래량': aiAnalysis.includes('거래량'),
        '김치 프리미엄': aiAnalysis.includes('김치 프리미엄') || aiAnalysis.includes('김프'),
        '공포/탐욕': aiAnalysis.includes('공포') || aiAnalysis.includes('탐욕'),
        '호가': aiAnalysis.includes('호가') || aiAnalysis.includes('매수세') || aiAnalysis.includes('매도세'),
        '체결': aiAnalysis.includes('체결') || aiAnalysis.includes('매수로'),
        '뉴스': aiAnalysis.includes('뉴스') || aiAnalysis.includes('📰'),
        'MACD': aiAnalysis.includes('MACD'),
        '이동평균': aiAnalysis.includes('평균선'),
        '전략': aiAnalysis.includes('목표가') || aiAnalysis.includes('손절')
      };
      
      console.log(`   - 포함된 분석 요소:`);
      for (const [key, included] of Object.entries(checks)) {
        console.log(`     ${included ? '✅' : '❌'} ${key}`);
        if (!included && key === '뉴스') {
          errors.push('AI 분석 뉴스 포함');
          allDataCollected = false;
        }
      }
    } catch (error) {
      console.log(`   ❌ AI 분석 실패: ${error.message}`);
      errors.push('AI 분석');
      allDataCollected = false;
    }

    // 최종 결과
    console.log('\n' + '=' .repeat(80));
    console.log('\n📋 최종 결과:');
    if (allDataCollected) {
      console.log('✅ 모든 데이터가 정상적으로 수집되었습니다!');
    } else {
      console.log('❌ 일부 데이터 수집에 실패했습니다:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('\n💥 테스트 중 심각한 오류 발생:', error);
  }
}

testAllDataCollection();