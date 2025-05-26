// 백테스트 시스템 테스트
const backtestService = require('./dist-electron/backtest-service').default;
const tradingEngine = require('./dist-electron/trading-engine').default;

async function runBacktestTest() {
  console.log('=== 백테스트 시스템 테스트 ===\n');
  
  // 기본 거래 설정
  const tradingConfig = {
    enableRealTrading: false,
    maxInvestmentPerCoin: 100000,
    stopLossPercent: 5,
    takeProfitPercent: 10,
    rsiOverbought: 70,
    rsiOversold: 30,
    buyingCooldown: 30,
    sellingCooldown: 20,
    minConfidenceForTrade: 60,
    sellRatio: 0.5,
    buyRatio: 0.3,
    dynamicRSI: true,
    dynamicConfidence: true,
    useKellyCriterion: false,
    maxKellyFraction: 0.25
  };
  
  try {
    // 1. BTC 백테스트 실행 (최근 3개월)
    console.log('1. BTC 백테스트 실행 중...');
    const btcResult = await backtestService.runBacktest('KRW-BTC', tradingConfig, 3);
    
    console.log('\n📊 BTC 백테스트 결과:');
    console.log(`기간: ${btcResult.period.start.toLocaleDateString()} ~ ${btcResult.period.end.toLocaleDateString()} (${btcResult.period.days}일)`);
    console.log(`총 거래 횟수: ${btcResult.performance.totalTrades}회`);
    console.log(`승리/패배: ${btcResult.performance.winTrades}/${btcResult.performance.lossTrades}`);
    console.log(`승률: ${btcResult.performance.winRate.toFixed(2)}%`);
    console.log(`총 수익률: ${btcResult.performance.totalReturn.toFixed(2)}%`);
    console.log(`평균 수익률: ${btcResult.performance.averageReturn.toFixed(2)}%`);
    console.log(`최대 수익: ${btcResult.performance.maxProfit.toFixed(2)}%`);
    console.log(`최대 손실: ${btcResult.performance.maxLoss.toFixed(2)}%`);
    console.log(`최대 낙폭: ${btcResult.performance.maxDrawdown.toFixed(2)}%`);
    console.log(`샤프 비율: ${btcResult.performance.sharpeRatio.toFixed(2)}`);
    
    console.log('\n📈 시장 상황별 성과:');
    console.log('상승장:', {
      거래수: btcResult.marketConditions.bullMarket.trades,
      승률: `${btcResult.marketConditions.bullMarket.winRate.toFixed(2)}%`,
      평균수익: `${btcResult.marketConditions.bullMarket.averageReturn.toFixed(2)}%`
    });
    console.log('하락장:', {
      거래수: btcResult.marketConditions.bearMarket.trades,
      승률: `${btcResult.marketConditions.bearMarket.winRate.toFixed(2)}%`,
      평균수익: `${btcResult.marketConditions.bearMarket.averageReturn.toFixed(2)}%`
    });
    console.log('횡보장:', {
      거래수: btcResult.marketConditions.sidewaysMarket.trades,
      승률: `${btcResult.marketConditions.sidewaysMarket.winRate.toFixed(2)}%`,
      평균수익: `${btcResult.marketConditions.sidewaysMarket.averageReturn.toFixed(2)}%`
    });
    
    // 최근 5개 거래 내역
    console.log('\n💰 최근 5개 거래:');
    const recentTrades = btcResult.trades.slice(-5);
    recentTrades.forEach((trade, idx) => {
      console.log(`${idx + 1}. ${trade.type} - ${trade.date.toLocaleString()}`);
      console.log(`   가격: ${trade.price.toLocaleString()}원, 신뢰도: ${trade.confidence.toFixed(1)}%`);
      if (trade.profit !== undefined) {
        console.log(`   수익: ${trade.profitPercent.toFixed(2)}% (${trade.profit.toLocaleString()}원)`);
      }
      console.log(`   신호: ${trade.signal}`);
    });
    
    // 2. 최적 파라미터 탐색 (선택적)
    const searchOptimal = process.argv.includes('--optimize');
    if (searchOptimal) {
      console.log('\n\n2. 최적 파라미터 탐색 중... (시간이 걸립니다)');
      const optimalParams = await backtestService.findOptimalParameters('KRW-BTC', tradingConfig, 3);
      
      console.log('\n🎯 최적 파라미터:');
      console.log(`RSI 과매수: ${optimalParams.rsiOverbought}`);
      console.log(`RSI 과매도: ${optimalParams.rsiOversold}`);
      console.log(`최소 신뢰도: ${optimalParams.minConfidenceForTrade}%`);
      console.log(`매수 비율: ${(optimalParams.buyRatio * 100).toFixed(1)}%`);
      console.log(`매도 비율: ${(optimalParams.sellRatio * 100).toFixed(1)}%`);
      console.log(`최적화 점수: ${optimalParams.score.toFixed(2)}`);
    }
    
    // 3. 다른 코인 백테스트 (ETH)
    if (process.argv.includes('--eth')) {
      console.log('\n\n3. ETH 백테스트 실행 중...');
      const ethResult = await backtestService.runBacktest('KRW-ETH', tradingConfig, 3);
      
      console.log('\n📊 ETH 백테스트 결과:');
      console.log(`총 거래 횟수: ${ethResult.performance.totalTrades}회`);
      console.log(`승률: ${ethResult.performance.winRate.toFixed(2)}%`);
      console.log(`총 수익률: ${ethResult.performance.totalReturn.toFixed(2)}%`);
      console.log(`최대 낙폭: ${ethResult.performance.maxDrawdown.toFixed(2)}%`);
    }
    
  } catch (error) {
    console.error('\n❌ 백테스트 실행 중 오류:', error);
  }
}

// 실행
runBacktestTest().then(() => {
  console.log('\n✅ 백테스트 테스트 완료');
  process.exit(0);
}).catch(error => {
  console.error('백테스트 테스트 실패:', error);
  process.exit(1);
});

// 사용법:
// node test-backtest.js              # 기본 BTC 백테스트
// node test-backtest.js --optimize   # 최적 파라미터 탐색 포함
// node test-backtest.js --eth        # ETH 백테스트 포함
// node test-backtest.js --optimize --eth  # 전체 테스트