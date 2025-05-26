const path = require('path');
const { fileURLToPath } = require('url');

// TypeScript 모듈을 직접 실행하기 위해 ts-node 사용
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { default: newsService } = require('./src/main/news-service');
const { default: analysisService } = require('./src/main/analysis-service');
const { default: upbitService } = require('./src/main/upbit-service');

console.log('뉴스 분석 테스트 시작...\n');

async function testNewsAnalysis() {
  try {
    // 1. 뉴스 데이터 가져오기 테스트
    console.log('1. BTC 뉴스 가져오기...');
    const btcNews = await newsService.getCoinNews('BTC');
    console.log('BTC 뉴스 분석 결과:');
    console.log(`- 총 뉴스: ${btcNews.totalNews}개`);
    console.log(`- 긍정: ${btcNews.positiveCount}, 부정: ${btcNews.negativeCount}, 중립: ${btcNews.neutralCount}`);
    console.log(`- 감정 점수: ${btcNews.sentimentScore}`);
    console.log(`- 주요 키워드: ${btcNews.topKeywords.join(', ')}`);
    
    if (btcNews.majorEvents.length > 0) {
      console.log(`- 주요 이벤트: ${btcNews.majorEvents[0]}`);
    }
    
    console.log('\n최근 뉴스 3개:');
    btcNews.newsItems.slice(0, 3).forEach((news, idx) => {
      console.log(`${idx + 1}. ${news.title}`);
      console.log(`   감정: ${news.sentiment}, 출처: ${news.source}`);
    });
    
    // 2. 전체 분석 테스트 (뉴스 포함)
    console.log('\n\n2. 전체 분석 테스트 (뉴스 데이터 포함)...');
    const candles = await upbitService.getCandles('KRW-BTC', 20);
    const ticker = await upbitService.getTicker('KRW-BTC');
    const orderbook = await upbitService.getOrderbook('KRW-BTC');
    const trades = await upbitService.getTrades('KRW-BTC');
    
    const analysis = await analysisService.analyzeTechnicals(candles, ticker, orderbook, trades);
    
    console.log('\n분석 결과:');
    console.log(`- 신호: ${analysis.signal}`);
    console.log(`- 신뢰도: ${analysis.confidence}%`);
    console.log(`- RSI: ${analysis.rsi.toFixed(2)}`);
    console.log(`- 김치 프리미엄: ${analysis.kimchiPremium?.toFixed(2)}%`);
    console.log(`- 공포/탐욕 지수: ${analysis.fearGreedIndex}`);
    
    if (analysis.newsAnalysis) {
      console.log('\n뉴스 분석 포함 여부: ✓');
      console.log(`- 뉴스 감정 점수: ${analysis.newsAnalysis.sentimentScore}`);
      console.log(`- 분석된 뉴스 수: ${analysis.newsAnalysis.totalNews}`);
    } else {
      console.log('\n뉴스 분석 포함 여부: ✗');
    }
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

testNewsAnalysis();