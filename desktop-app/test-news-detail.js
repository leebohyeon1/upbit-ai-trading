const path = require('path');
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

const { default: newsService } = require('./src/main/news-service');

console.log('뉴스 상세 데이터 테스트...\n');

async function showNewsDetail() {
  try {
    // BTC 뉴스 가져오기
    console.log('=== BTC 뉴스 수집 중... ===\n');
    const btcNews = await newsService.getCoinNews('BTC');
    
    console.log('📊 전체 통계:');
    console.log(`- 총 뉴스 수: ${btcNews.totalNews}개`);
    console.log(`- 긍정적: ${btcNews.positiveCount}개`);
    console.log(`- 부정적: ${btcNews.negativeCount}개`);
    console.log(`- 중립적: ${btcNews.neutralCount}개`);
    console.log(`- 감정 점수: ${btcNews.sentimentScore}점 (-100 ~ +100)`);
    console.log('\n');
    
    console.log('🔑 주요 키워드 TOP 10:');
    btcNews.topKeywords.forEach((keyword, idx) => {
      console.log(`${idx + 1}. ${keyword}`);
    });
    console.log('\n');
    
    console.log('🚨 주요 이벤트:');
    if (btcNews.majorEvents.length > 0) {
      btcNews.majorEvents.forEach((event, idx) => {
        console.log(`${idx + 1}. ${event}`);
      });
    } else {
      console.log('(주요 이벤트 없음)');
    }
    console.log('\n');
    
    console.log('📰 수집된 뉴스 상세 (최근 10개):');
    console.log('━'.repeat(80));
    
    btcNews.newsItems.slice(0, 10).forEach((news, idx) => {
      console.log(`\n[뉴스 ${idx + 1}]`);
      console.log(`제목: ${news.title}`);
      console.log(`출처: ${news.source}`);
      console.log(`날짜: ${new Date(news.pubDate).toLocaleString('ko-KR')}`);
      console.log(`감정: ${news.sentiment === 'positive' ? '😊 긍정적' : news.sentiment === 'negative' ? '😟 부정적' : '😐 중립적'}`);
      console.log(`링크: ${news.link}`);
      if (news.summary) {
        console.log(`요약: ${news.summary.substring(0, 150)}...`);
      }
      console.log('─'.repeat(80));
    });
    
    // 다른 코인도 테스트
    console.log('\n\n=== ETH 뉴스 수집 중... ===\n');
    const ethNews = await newsService.getCoinNews('ETH');
    
    console.log('📊 ETH 뉴스 통계:');
    console.log(`- 총 뉴스 수: ${ethNews.totalNews}개`);
    console.log(`- 감정 점수: ${ethNews.sentimentScore}점`);
    console.log(`- 주요 키워드: ${ethNews.topKeywords.slice(0, 5).join(', ')}`);
    
    console.log('\n📰 ETH 최근 뉴스 3개:');
    ethNews.newsItems.slice(0, 3).forEach((news, idx) => {
      console.log(`${idx + 1}. ${news.title} (${news.source})`);
    });
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

showNewsDetail();