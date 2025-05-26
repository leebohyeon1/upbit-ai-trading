/**
 * 성능 벤치마크 테스트
 * 앱의 처리 속도와 리소스 사용량을 측정합니다.
 */

const { ipcRenderer } = require('electron');
const { performance } = require('perf_hooks');

// 성능 측정 결과 저장
const performanceMetrics = {
  apiCalls: {},
  analysis: {},
  backtest: {},
  memory: {},
  overall: {}
};

// 유틸리티 함수
async function measureTime(name, func) {
  const start = performance.now();
  try {
    const result = await func();
    const end = performance.now();
    const duration = end - start;
    
    console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
    return { duration, result };
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    console.log(`❌ ${name} 실패 (${duration.toFixed(2)}ms): ${error.message}`);
    return { duration, error };
  }
}

function getMemoryUsage() {
  if (process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    };
  }
  return null;
}

// 테스트 항목들
const performanceTests = {
  // API 응답 시간 측정
  async testAPIResponseTimes() {
    console.log('\n📡 API 응답 시간 측정');
    console.log('-'.repeat(50));
    
    // Upbit 캔들 데이터
    const candleTest = await measureTime('Upbit 캔들 데이터 (200개)', async () => {
      return await ipcRenderer.invoke('get-candles', {
        ticker: 'KRW-BTC',
        count: 200
      });
    });
    performanceMetrics.apiCalls.candles = candleTest.duration;
    
    // 호가 데이터
    const orderbookTest = await measureTime('Upbit 호가 데이터', async () => {
      return await ipcRenderer.invoke('get-orderbook', {
        ticker: 'KRW-BTC'
      });
    });
    performanceMetrics.apiCalls.orderbook = orderbookTest.duration;
    
    // 체결 데이터
    const tradesTest = await measureTime('Upbit 체결 데이터', async () => {
      return await ipcRenderer.invoke('get-trades', {
        ticker: 'KRW-BTC',
        count: 50
      });
    });
    performanceMetrics.apiCalls.trades = tradesTest.duration;
    
    // 뉴스 데이터
    const newsTest = await measureTime('뉴스 수집 (캐시 없음)', async () => {
      return await ipcRenderer.invoke('get-news', {
        ticker: 'KRW-BTC',
        useCache: false
      });
    });
    performanceMetrics.apiCalls.news = newsTest.duration;
    
    // 시장 상관관계 데이터
    const correlationTest = await measureTime('시장 상관관계 데이터', async () => {
      return await ipcRenderer.invoke('get-market-correlation');
    });
    performanceMetrics.apiCalls.correlation = correlationTest.duration;
    
    // AI 분석 (Claude API)
    const aiTest = await measureTime('Claude AI 분석', async () => {
      return await ipcRenderer.invoke('ai-analysis', {
        ticker: 'KRW-BTC',
        indicators: {
          rsi: 50,
          macd: { histogram: 0.5 },
          bb: { position: 0.5 }
        }
      });
    });
    performanceMetrics.apiCalls.ai = aiTest.duration;
  },
  
  // 분석 처리 속도 측정
  async testAnalysisSpeed() {
    console.log('\n🔍 분석 처리 속도 측정');
    console.log('-'.repeat(50));
    
    // 단일 코인 전체 분석
    const singleAnalysis = await measureTime('단일 코인 전체 분석 (BTC)', async () => {
      return await ipcRenderer.invoke('full-analysis', {
        ticker: 'KRW-BTC',
        includeAI: false,
        includeNews: true
      });
    });
    performanceMetrics.analysis.single = singleAnalysis.duration;
    
    // 4개 코인 동시 분석
    const multiAnalysis = await measureTime('4개 코인 동시 분석', async () => {
      const coins = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA'];
      const promises = coins.map(ticker => 
        ipcRenderer.invoke('full-analysis', {
          ticker,
          includeAI: false,
          includeNews: false
        })
      );
      return await Promise.all(promises);
    });
    performanceMetrics.analysis.multi4 = multiAnalysis.duration;
    
    // 기술적 지표 계산만
    const technicalOnly = await measureTime('기술적 지표 계산 (BTC)', async () => {
      return await ipcRenderer.invoke('calculate-technicals', {
        ticker: 'KRW-BTC'
      });
    });
    performanceMetrics.analysis.technical = technicalOnly.duration;
    
    // 신호 강도 계산
    const signalStrength = await measureTime('신호 강도 계산', async () => {
      return await ipcRenderer.invoke('calculate-signal-strength', {
        indicators: {
          rsi: 30,
          macd: { histogram: 1.5 },
          bb: { position: 0.1 },
          volume_ratio: 2.0
        }
      });
    });
    performanceMetrics.analysis.signalStrength = signalStrength.duration;
  },
  
  // 백테스트 성능 측정
  async testBacktestPerformance() {
    console.log('\n📊 백테스트 성능 측정');
    console.log('-'.repeat(50));
    
    // 1개월 백테스트
    const backtest1Month = await measureTime('1개월 백테스트', async () => {
      return await ipcRenderer.invoke('run-backtest', {
        ticker: 'KRW-BTC',
        period: 30,
        initialBalance: 1000000
      });
    });
    performanceMetrics.backtest.month1 = backtest1Month.duration;
    
    // 3개월 백테스트
    const backtest3Months = await measureTime('3개월 백테스트', async () => {
      return await ipcRenderer.invoke('run-backtest', {
        ticker: 'KRW-BTC',
        period: 90,
        initialBalance: 1000000
      });
    });
    performanceMetrics.backtest.month3 = backtest3Months.duration;
    
    // 파라미터 최적화 (간소화)
    const optimization = await measureTime('파라미터 최적화 (10개 조합)', async () => {
      return await ipcRenderer.invoke('optimize-parameters', {
        ticker: 'KRW-BTC',
        period: 30,
        combinations: 10
      });
    });
    performanceMetrics.backtest.optimization = optimization.duration;
  },
  
  // 메모리 사용량 측정
  async testMemoryUsage() {
    console.log('\n💾 메모리 사용량 측정');
    console.log('-'.repeat(50));
    
    // 초기 메모리
    const initialMemory = getMemoryUsage();
    console.log('초기 메모리 사용량:');
    console.log(`  Heap: ${initialMemory.heapUsed}MB / ${initialMemory.heapTotal}MB`);
    console.log(`  RSS: ${initialMemory.rss}MB`);
    performanceMetrics.memory.initial = initialMemory;
    
    // 대량 데이터 로드 후
    console.log('\n대량 데이터 로드 중...');
    await ipcRenderer.invoke('load-bulk-data', {
      coins: ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'DOGE'],
      days: 30
    });
    
    const afterLoadMemory = getMemoryUsage();
    console.log('데이터 로드 후 메모리:');
    console.log(`  Heap: ${afterLoadMemory.heapUsed}MB / ${afterLoadMemory.heapTotal}MB`);
    console.log(`  RSS: ${afterLoadMemory.rss}MB`);
    console.log(`  증가량: ${afterLoadMemory.heapUsed - initialMemory.heapUsed}MB`);
    performanceMetrics.memory.afterLoad = afterLoadMemory;
    
    // 분석 실행 후
    console.log('\n집중 분석 실행 중...');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(ipcRenderer.invoke('full-analysis', {
        ticker: 'KRW-BTC',
        includeAI: false
      }));
    }
    await Promise.all(promises);
    
    const afterAnalysisMemory = getMemoryUsage();
    console.log('분석 후 메모리:');
    console.log(`  Heap: ${afterAnalysisMemory.heapUsed}MB / ${afterAnalysisMemory.heapTotal}MB`);
    console.log(`  RSS: ${afterAnalysisMemory.rss}MB`);
    console.log(`  총 증가량: ${afterAnalysisMemory.heapUsed - initialMemory.heapUsed}MB`);
    performanceMetrics.memory.afterAnalysis = afterAnalysisMemory;
    
    // 가비지 컬렉션 후
    if (global.gc) {
      console.log('\n가비지 컬렉션 실행...');
      global.gc();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterGCMemory = getMemoryUsage();
      console.log('GC 후 메모리:');
      console.log(`  Heap: ${afterGCMemory.heapUsed}MB / ${afterGCMemory.heapTotal}MB`);
      console.log(`  회수된 메모리: ${afterAnalysisMemory.heapUsed - afterGCMemory.heapUsed}MB`);
      performanceMetrics.memory.afterGC = afterGCMemory;
    }
  },
  
  // 동시성 테스트
  async testConcurrency() {
    console.log('\n🔄 동시성 처리 테스트');
    console.log('-'.repeat(50));
    
    // 10개 코인 동시 분석
    const coins = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'DOGE', 'MATIC', 'LINK', 'UNI', 'AVAX'];
    
    const concurrent10 = await measureTime('10개 코인 동시 분석', async () => {
      const promises = coins.map(coin => 
        ipcRenderer.invoke('full-analysis', {
          ticker: `KRW-${coin}`,
          includeAI: false,
          includeNews: false
        })
      );
      return await Promise.all(promises);
    });
    performanceMetrics.overall.concurrent10 = concurrent10.duration;
    
    // 순차 처리와 비교
    const sequential10 = await measureTime('10개 코인 순차 분석', async () => {
      const results = [];
      for (const coin of coins) {
        const result = await ipcRenderer.invoke('full-analysis', {
          ticker: `KRW-${coin}`,
          includeAI: false,
          includeNews: false
        });
        results.push(result);
      }
      return results;
    });
    performanceMetrics.overall.sequential10 = sequential10.duration;
    
    // 속도 향상 계산
    const speedup = (sequential10.duration / concurrent10.duration).toFixed(2);
    console.log(`\n⚡ 동시 처리 속도 향상: ${speedup}x`);
    performanceMetrics.overall.concurrencySpeedup = speedup;
  },
  
  // 캐시 효율성 테스트
  async testCacheEfficiency() {
    console.log('\n💨 캐시 효율성 테스트');
    console.log('-'.repeat(50));
    
    // 캐시 없이 뉴스 조회
    const withoutCache = await measureTime('뉴스 조회 (캐시 없음)', async () => {
      return await ipcRenderer.invoke('get-news', {
        ticker: 'KRW-BTC',
        useCache: false
      });
    });
    
    // 같은 요청 다시 (캐시 사용)
    const withCache = await measureTime('뉴스 조회 (캐시 사용)', async () => {
      return await ipcRenderer.invoke('get-news', {
        ticker: 'KRW-BTC',
        useCache: true
      });
    });
    
    const cacheSpeedup = (withoutCache.duration / withCache.duration).toFixed(1);
    console.log(`\n💾 캐시 속도 향상: ${cacheSpeedup}x`);
    performanceMetrics.overall.cacheSpeedup = cacheSpeedup;
  }
};

// 전체 성능 테스트 실행
async function runPerformanceTests() {
  console.log('='.repeat(60));
  console.log('⚡ 성능 벤치마크 테스트');
  console.log('='.repeat(60));
  console.log('앱의 처리 속도와 리소스 사용량을 측정합니다.\n');
  
  const overallStart = performance.now();
  
  // 각 테스트 실행
  for (const [name, test] of Object.entries(performanceTests)) {
    try {
      await test();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 테스트 간 대기
    } catch (error) {
      console.error(`\n❌ ${name} 실행 중 오류: ${error.message}`);
    }
  }
  
  const overallEnd = performance.now();
  const totalTime = ((overallEnd - overallStart) / 1000).toFixed(1);
  
  // 성능 보고서 생성
  console.log('\n' + '='.repeat(60));
  console.log('📊 성능 테스트 결과 요약');
  console.log('='.repeat(60));
  
  // API 응답 시간
  console.log('\n📡 API 응답 시간:');
  console.log(`  - Upbit 캔들: ${performanceMetrics.apiCalls.candles?.toFixed(0)}ms`);
  console.log(`  - 호가/체결: ${((performanceMetrics.apiCalls.orderbook + performanceMetrics.apiCalls.trades) / 2).toFixed(0)}ms`);
  console.log(`  - 뉴스 수집: ${performanceMetrics.apiCalls.news?.toFixed(0)}ms`);
  console.log(`  - AI 분석: ${performanceMetrics.apiCalls.ai?.toFixed(0)}ms`);
  
  // 분석 속도
  console.log('\n🔍 분석 처리 속도:');
  console.log(`  - 단일 코인: ${performanceMetrics.analysis.single?.toFixed(0)}ms`);
  console.log(`  - 4개 동시: ${performanceMetrics.analysis.multi4?.toFixed(0)}ms`);
  console.log(`  - 기술적 지표만: ${performanceMetrics.analysis.technical?.toFixed(0)}ms`);
  
  // 백테스트 성능
  console.log('\n📊 백테스트 성능:');
  console.log(`  - 1개월: ${(performanceMetrics.backtest.month1 / 1000).toFixed(1)}초`);
  console.log(`  - 3개월: ${(performanceMetrics.backtest.month3 / 1000).toFixed(1)}초`);
  
  // 메모리 사용량
  console.log('\n💾 메모리 사용량:');
  console.log(`  - 초기: ${performanceMetrics.memory.initial?.heapUsed}MB`);
  console.log(`  - 피크: ${performanceMetrics.memory.afterAnalysis?.heapUsed}MB`);
  console.log(`  - 증가량: ${performanceMetrics.memory.afterAnalysis?.heapUsed - performanceMetrics.memory.initial?.heapUsed}MB`);
  
  // 최적화 효과
  console.log('\n⚡ 최적화 효과:');
  console.log(`  - 동시성 향상: ${performanceMetrics.overall.concurrencySpeedup}x`);
  console.log(`  - 캐시 효과: ${performanceMetrics.overall.cacheSpeedup}x`);
  
  // 권장사항
  console.log('\n💡 성능 개선 권장사항:');
  
  if (performanceMetrics.apiCalls.candles > 1000) {
    console.log('1. Upbit API 응답이 느림 - 캔들 수 줄이기 고려');
  }
  
  if (performanceMetrics.memory.afterAnalysis?.heapUsed - performanceMetrics.memory.initial?.heapUsed > 200) {
    console.log('2. 메모리 사용량 과다 - 데이터 정리 주기 단축');
  }
  
  if (performanceMetrics.overall.concurrencySpeedup < 2) {
    console.log('3. 동시성 개선 여지 있음 - Worker threads 활용 검토');
  }
  
  if (performanceMetrics.backtest.month3 > 30000) {
    console.log('4. 백테스트 속도 개선 필요 - 계산 최적화');
  }
  
  // 결과 저장
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'test-results', 'performance-report.json');
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalDuration: totalTime,
    metrics: performanceMetrics,
    recommendations: [
      performanceMetrics.apiCalls.candles > 1000 ? 'Optimize API calls' : null,
      performanceMetrics.memory.afterAnalysis?.heapUsed > 500 ? 'Reduce memory usage' : null,
      performanceMetrics.overall.concurrencySpeedup < 2 ? 'Improve concurrency' : null
    ].filter(Boolean)
  }, null, 2));
  
  console.log(`\n📄 성능 보고서 저장됨: ${reportPath}`);
  console.log(`\n⏱️  전체 테스트 시간: ${totalTime}초`);
  
  process.exit(0);
}

// 메인 실행
if (require.main === module) {
  if (!process.versions.electron) {
    console.error('❌ 이 스크립트는 Electron 환경에서 실행되어야 합니다.');
    process.exit(1);
  }
  
  runPerformanceTests().catch(error => {
    console.error('성능 테스트 중 치명적 오류:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTests };