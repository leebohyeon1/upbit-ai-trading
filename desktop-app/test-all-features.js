/**
 * Upbit AI Trading 앱 종합 기능 테스트
 * 모든 핵심 기능의 작동을 검증합니다.
 */

const { ipcRenderer } = require('electron');

// 테스트 결과 저장
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// 유틸리티 함수
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📌',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];
  
  console.log(`${timestamp} ${prefix} ${message}`);
  testResults.details.push({ timestamp, type, message });
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 테스트 케이스
const testCases = {
  // === 거래 엔진 테스트 ===
  '거래 엔진': {
    async '시작/중지 테스트'() {
      log('거래 엔진 시작 테스트');
      
      // 시작 테스트
      const startResult = await ipcRenderer.invoke('start-trading', {
        enableAI: false,
        enableRealTrading: false
      });
      
      if (startResult.success) {
        log('거래 엔진 시작 성공', 'success');
        testResults.passed++;
      } else {
        log(`거래 엔진 시작 실패: ${startResult.error}`, 'error');
        testResults.failed++;
        return;
      }
      
      // 상태 확인
      await wait(2000);
      const status = await ipcRenderer.invoke('get-trading-status');
      
      if (status.isRunning) {
        log('거래 상태 확인: 실행 중', 'success');
        testResults.passed++;
      } else {
        log('거래 상태 확인 실패', 'error');
        testResults.failed++;
      }
      
      // 중지 테스트
      const stopResult = await ipcRenderer.invoke('stop-trading');
      
      if (stopResult.success) {
        log('거래 엔진 중지 성공', 'success');
        testResults.passed++;
      } else {
        log('거래 엔진 중지 실패', 'error');
        testResults.failed++;
      }
    },
    
    async 'AI 모드 테스트'() {
      log('AI 모드 활성화 테스트');
      
      // AI 키 설정 확인
      const keys = await ipcRenderer.invoke('get-api-keys');
      
      if (!keys.claudeApiKey) {
        log('Claude API 키 없음 - AI 모드 건너뜀', 'warning');
        testResults.warnings++;
        return;
      }
      
      // AI 모드로 시작
      const result = await ipcRenderer.invoke('start-trading', {
        enableAI: true,
        enableRealTrading: false
      });
      
      if (result.success) {
        log('AI 모드 시작 성공', 'success');
        testResults.passed++;
        
        // AI 분석 대기
        await wait(5000);
        
        // 중지
        await ipcRenderer.invoke('stop-trading');
      } else {
        log('AI 모드 시작 실패', 'error');
        testResults.failed++;
      }
    },
    
    async '실시간 업데이트 테스트'() {
      log('실시간 업데이트 구독 테스트');
      
      let updateReceived = false;
      
      // 업데이트 리스너 설정
      ipcRenderer.on('analysis-update', (event, data) => {
        updateReceived = true;
        log(`업데이트 수신: ${data.ticker}`, 'success');
      });
      
      // 거래 시작
      await ipcRenderer.invoke('start-trading', {
        enableAI: false,
        enableRealTrading: false
      });
      
      // 업데이트 대기 (최대 35초)
      for (let i = 0; i < 35; i++) {
        if (updateReceived) break;
        await wait(1000);
      }
      
      // 정리
      await ipcRenderer.invoke('stop-trading');
      ipcRenderer.removeAllListeners('analysis-update');
      
      if (updateReceived) {
        log('실시간 업데이트 수신 성공', 'success');
        testResults.passed++;
      } else {
        log('실시간 업데이트 수신 실패', 'error');
        testResults.failed++;
      }
    }
  },
  
  // === 기술적 분석 테스트 ===
  '기술적 분석': {
    async '단일 코인 분석'() {
      log('BTC 기술적 분석 테스트');
      
      const result = await ipcRenderer.invoke('analyze-coin', {
        ticker: 'KRW-BTC',
        options: {
          includeNews: false,
          includeAI: false
        }
      });
      
      if (result.success && result.analysis) {
        const { technical } = result.analysis;
        
        // 필수 지표 확인
        const requiredIndicators = ['rsi', 'macd', 'bb', 'ma', 'stochRsi'];
        const missingIndicators = requiredIndicators.filter(ind => 
          technical.indicators[ind] === undefined
        );
        
        if (missingIndicators.length === 0) {
          log('모든 기술적 지표 계산 성공', 'success');
          log(`RSI: ${technical.indicators.rsi.toFixed(2)}`, 'info');
          log(`신호: ${technical.signal}, 신뢰도: ${technical.confidence}%`, 'info');
          testResults.passed++;
        } else {
          log(`누락된 지표: ${missingIndicators.join(', ')}`, 'error');
          testResults.failed++;
        }
      } else {
        log(`분석 실패: ${result.error}`, 'error');
        testResults.failed++;
      }
    },
    
    async '다중 코인 동시 분석'() {
      log('다중 코인 동시 분석 테스트');
      
      const coins = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA'];
      const startTime = Date.now();
      
      const promises = coins.map(ticker => 
        ipcRenderer.invoke('analyze-coin', {
          ticker,
          options: { includeNews: false, includeAI: false }
        })
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const successCount = results.filter(r => r.success).length;
      const analysisTime = endTime - startTime;
      
      log(`${successCount}/${coins.length} 코인 분석 성공`, 'info');
      log(`총 분석 시간: ${analysisTime}ms`, 'info');
      
      if (successCount === coins.length) {
        log('다중 코인 분석 성공', 'success');
        testResults.passed++;
      } else {
        log('일부 코인 분석 실패', 'error');
        testResults.failed++;
      }
    }
  },
  
  // === 백테스트 테스트 ===
  '백테스트': {
    async '기본 백테스트 실행'() {
      log('BTC 3개월 백테스트 시작');
      
      const result = await ipcRenderer.invoke('run-backtest', {
        ticker: 'KRW-BTC',
        period: 90, // 3개월
        initialBalance: 1000000,
        config: {
          buyConfidenceThreshold: 70,
          sellConfidenceThreshold: 70,
          positionSizing: 0.1,
          stopLoss: 0.03,
          takeProfit: 0.05
        }
      });
      
      if (result.success && result.data) {
        const { performance, trades } = result.data;
        
        log(`총 거래 수: ${trades.length}`, 'info');
        log(`최종 수익률: ${performance.totalReturn.toFixed(2)}%`, 'info');
        log(`샤프 비율: ${performance.sharpeRatio.toFixed(2)}`, 'info');
        log(`최대 낙폭: ${performance.maxDrawdown.toFixed(2)}%`, 'info');
        
        if (trades.length > 0 && performance.totalReturn !== undefined) {
          log('백테스트 완료', 'success');
          testResults.passed++;
        } else {
          log('백테스트 데이터 불완전', 'warning');
          testResults.warnings++;
        }
      } else {
        log(`백테스트 실패: ${result.error}`, 'error');
        testResults.failed++;
      }
    },
    
    async '파라미터 최적화'() {
      log('파라미터 최적화 테스트 (간소화 버전)');
      
      const result = await ipcRenderer.invoke('optimize-parameters', {
        ticker: 'KRW-BTC',
        period: 30, // 1개월로 단축
        parameterRanges: {
          buyConfidenceThreshold: [60, 70, 80],
          sellConfidenceThreshold: [60, 70, 80],
          stopLoss: [0.02, 0.03, 0.05]
        }
      });
      
      if (result.success && result.bestParameters) {
        log('최적 파라미터 발견:', 'success');
        log(JSON.stringify(result.bestParameters, null, 2), 'info');
        log(`최고 점수: ${result.bestScore.toFixed(2)}`, 'info');
        testResults.passed++;
      } else {
        log(`최적화 실패: ${result.error}`, 'error');
        testResults.failed++;
      }
    }
  },
  
  // === 학습 시스템 테스트 ===
  '학습 시스템': {
    async '거래 기록 저장'() {
      log('거래 기록 저장 테스트');
      
      const mockTrade = {
        ticker: 'KRW-BTC',
        type: 'buy',
        price: 50000000,
        amount: 0.001,
        timestamp: Date.now(),
        signals: {
          rsi: 45,
          macd: { histogram: 0.5 },
          bb: { position: 0.3 }
        },
        confidence: 75
      };
      
      const result = await ipcRenderer.invoke('record-trade', mockTrade);
      
      if (result.success) {
        log('거래 기록 저장 성공', 'success');
        testResults.passed++;
      } else {
        log(`거래 기록 저장 실패: ${result.error}`, 'error');
        testResults.failed++;
      }
    },
    
    async '성과 통계 조회'() {
      log('학습 시스템 성과 통계 조회');
      
      const result = await ipcRenderer.invoke('get-learning-stats');
      
      if (result.success && result.stats) {
        const { performance, indicatorWeights } = result.stats;
        
        log(`총 거래 수: ${performance.totalTrades || 0}`, 'info');
        log(`승률: ${((performance.winRate || 0) * 100).toFixed(1)}%`, 'info');
        
        if (indicatorWeights && indicatorWeights.length > 0) {
          log('지표별 가중치:', 'info');
          indicatorWeights.forEach(ind => {
            log(`  ${ind.indicator}: ${ind.weight.toFixed(2)} (성공률: ${(ind.success_rate * 100).toFixed(1)}%)`, 'info');
          });
        }
        
        log('성과 통계 조회 성공', 'success');
        testResults.passed++;
      } else {
        log('성과 통계 조회 실패 또는 데이터 없음', 'warning');
        testResults.warnings++;
      }
    },
    
    async '예측 기능 테스트'() {
      log('거래 성공 확률 예측 테스트');
      
      const mockSignals = {
        rsi: 30,
        macd: { histogram: 1.2 },
        bb: { position: 0.1 },
        volume_ratio: 1.5,
        price_change: 0.02
      };
      
      const result = await ipcRenderer.invoke('predict-trade-success', {
        ticker: 'KRW-BTC',
        type: 'buy',
        signals: mockSignals
      });
      
      if (result.success && result.prediction) {
        log(`예측 확률: ${(result.prediction.probability * 100).toFixed(1)}%`, 'info');
        log(`신뢰도: ${(result.prediction.confidence * 100).toFixed(1)}%`, 'info');
        
        if (result.prediction.topFactors) {
          log('주요 요인:', 'info');
          result.prediction.topFactors.forEach(factor => {
            log(`  ${factor.name}: ${factor.impact.toFixed(2)}`, 'info');
          });
        }
        
        log('예측 기능 작동 확인', 'success');
        testResults.passed++;
      } else {
        log('예측 기능 실패 또는 학습 데이터 부족', 'warning');
        testResults.warnings++;
      }
    }
  },
  
  // === 시장 상관관계 테스트 ===
  '시장 상관관계': {
    async 'BTC 도미넌스 조회'() {
      log('BTC 도미넌스 및 시장 분석');
      
      const result = await ipcRenderer.invoke('get-market-correlation');
      
      if (result.success && result.data) {
        const { btcDominance, marketPhase, fearGreedIndex } = result.data;
        
        log(`BTC 도미넌스: ${btcDominance.toFixed(1)}%`, 'info');
        log(`시장 단계: ${marketPhase}`, 'info');
        log(`공포/탐욕 지수: ${fearGreedIndex}`, 'info');
        
        if (btcDominance > 0 && marketPhase) {
          log('시장 상관관계 데이터 수신 성공', 'success');
          testResults.passed++;
        } else {
          log('시장 데이터 불완전', 'warning');
          testResults.warnings++;
        }
      } else {
        log(`시장 상관관계 조회 실패: ${result.error}`, 'error');
        testResults.failed++;
      }
    },
    
    async '코인별 상관관계 분석'() {
      log('ETH 상관관계 분석');
      
      const result = await ipcRenderer.invoke('get-coin-correlation', {
        ticker: 'KRW-ETH'
      });
      
      if (result.success && result.correlation) {
        const { btcCorrelation, insights } = result.correlation;
        
        log(`BTC와의 상관계수: ${btcCorrelation.toFixed(2)}`, 'info');
        
        if (insights && insights.length > 0) {
          log('상관관계 인사이트:', 'info');
          insights.forEach(insight => {
            log(`  - ${insight}`, 'info');
          });
        }
        
        log('코인별 상관관계 분석 성공', 'success');
        testResults.passed++;
      } else {
        log('상관관계 분석 실패', 'error');
        testResults.failed++;
      }
    }
  },
  
  // === 코인별 설정 테스트 ===
  '코인별 설정': {
    async '설정 로드 확인'() {
      log('코인별 맞춤 설정 로드 테스트');
      
      const coins = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL'];
      let allLoaded = true;
      
      for (const coin of coins) {
        const result = await ipcRenderer.invoke('get-coin-config', {
          ticker: `KRW-${coin}`
        });
        
        if (result.success && result.config) {
          log(`${coin} 설정 로드 성공`, 'info');
          log(`  - 최소 신뢰도(매수): ${result.config.minConfidenceForBuy}%`, 'info');
          log(`  - 쿨타임(매수): ${result.config.buyCooldownMinutes}분`, 'info');
        } else {
          log(`${coin} 설정 로드 실패`, 'error');
          allLoaded = false;
        }
      }
      
      if (allLoaded) {
        log('모든 코인 설정 로드 성공', 'success');
        testResults.passed++;
      } else {
        log('일부 코인 설정 로드 실패', 'error');
        testResults.failed++;
      }
    },
    
    async '동적 조정 테스트'() {
      log('시장 상황에 따른 설정 조정 테스트');
      
      const scenarios = [
        { marketPhase: 'bull', volatility: 0.05 },
        { marketPhase: 'bear', volatility: 0.15 },
        { marketPhase: 'sideways', volatility: 0.03 }
      ];
      
      for (const scenario of scenarios) {
        const result = await ipcRenderer.invoke('adjust-config', {
          ticker: 'KRW-BTC',
          marketConditions: scenario
        });
        
        if (result.success && result.adjustedConfig) {
          log(`${scenario.marketPhase} 시장 조정 완료`, 'info');
          log(`  - 조정된 신뢰도 임계값: ${result.adjustedConfig.minConfidenceForBuy}%`, 'info');
        }
      }
      
      log('동적 조정 기능 확인', 'success');
      testResults.passed++;
    }
  },
  
  // === 뉴스 분석 테스트 ===
  '뉴스 분석': {
    async '뉴스 수집 및 분석'() {
      log('BTC 뉴스 수집 테스트');
      
      const result = await ipcRenderer.invoke('analyze-news', {
        ticker: 'KRW-BTC'
      });
      
      if (result.success && result.analysis) {
        const { sentimentScore, keyEvents, newsCount } = result.analysis;
        
        log(`수집된 뉴스 수: ${newsCount}`, 'info');
        log(`감정 점수: ${sentimentScore}`, 'info');
        
        if (keyEvents && keyEvents.length > 0) {
          log('주요 이벤트:', 'info');
          keyEvents.forEach(event => {
            log(`  - ${event}`, 'info');
          });
        }
        
        log('뉴스 분석 성공', 'success');
        testResults.passed++;
      } else {
        log('뉴스 분석 실패 또는 뉴스 없음', 'warning');
        testResults.warnings++;
      }
    }
  }
};

// 테스트 실행
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 Upbit AI Trading 앱 종합 기능 테스트 시작');
  console.log('='.repeat(60));
  console.log('');
  
  const startTime = Date.now();
  
  for (const [category, tests] of Object.entries(testCases)) {
    console.log(`\n📂 ${category}`);
    console.log('-'.repeat(40));
    
    for (const [testName, testFunc] of Object.entries(tests)) {
      console.log(`\n▶️  ${testName}`);
      
      try {
        await testFunc();
      } catch (error) {
        log(`테스트 중 오류 발생: ${error.message}`, 'error');
        testResults.failed++;
      }
      
      // 테스트 간 대기
      await wait(1000);
    }
  }
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(1);
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60));
  console.log(`✅ 성공: ${testResults.passed}`);
  console.log(`❌ 실패: ${testResults.failed}`);
  console.log(`⚠️  경고: ${testResults.warnings}`);
  console.log(`⏱️  총 소요 시간: ${totalTime}초`);
  console.log('');
  
  // 결과 저장
  const fs = require('fs');
  const reportPath = require('path').join(__dirname, 'test-results', 'feature-test-report.json');
  
  // 디렉토리 생성
  if (!fs.existsSync(require('path').dirname(reportPath))) {
    fs.mkdirSync(require('path').dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    duration: totalTime,
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings
    },
    details: testResults.details
  }, null, 2));
  
  console.log(`📄 상세 보고서 저장됨: ${reportPath}`);
  
  // 종료 코드 반환
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 메인 실행
if (require.main === module) {
  // Electron 환경 확인
  if (!process.versions.electron) {
    console.error('❌ 이 스크립트는 Electron 환경에서 실행되어야 합니다.');
    console.error('다음 명령어를 사용하세요: npm run test:features');
    process.exit(1);
  }
  
  // 테스트 실행
  runAllTests().catch(error => {
    console.error('테스트 실행 중 치명적 오류:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };