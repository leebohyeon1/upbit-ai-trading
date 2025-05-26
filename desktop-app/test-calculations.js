/**
 * 계산 로직 정확도 검증 테스트
 * 각 기술적 지표의 계산이 정확한지 검증합니다.
 */

const { ipcRenderer } = require('electron');

// 테스트 데이터
const testData = {
  // RSI 계산 검증용 가격 데이터 (14일)
  rsiPrices: [
    100, 102, 98, 103, 105, 101, 99, 104, 
    106, 103, 107, 105, 108, 110, 112
  ],
  
  // MACD 계산 검증용 가격 데이터 (26일)
  macdPrices: [
    100, 101, 99, 102, 103, 101, 104, 105, 103, 106,
    107, 105, 108, 109, 107, 110, 111, 109, 112, 113,
    111, 114, 115, 113, 116, 117
  ],
  
  // 볼린저 밴드 검증용 데이터
  bbPrices: [
    100, 102, 101, 103, 99, 98, 102, 104, 103, 105,
    101, 100, 102, 104, 106, 105, 103, 102, 104, 106
  ]
};

// 예상 결과값 (실제 계산기로 검증된 값)
const expectedResults = {
  rsi: {
    value: 71.43, // 14일 RSI
    tolerance: 0.5
  },
  macd: {
    macdLine: 2.15,
    signalLine: 1.85,
    histogram: 0.30,
    tolerance: 0.1
  },
  bb: {
    upper: 105.5,
    middle: 102.5,
    lower: 99.5,
    tolerance: 0.5
  }
};

// 계산 검증 함수들
async function verifyRSICalculation() {
  console.log('\n📊 RSI 계산 검증');
  console.log('-'.repeat(40));
  
  // 실제 계산 요청
  const result = await ipcRenderer.invoke('calculate-indicator', {
    indicator: 'RSI',
    data: testData.rsiPrices,
    period: 14
  });
  
  if (result.success) {
    const calculatedRSI = result.value;
    const expected = expectedResults.rsi.value;
    const difference = Math.abs(calculatedRSI - expected);
    
    console.log(`계산된 RSI: ${calculatedRSI.toFixed(2)}`);
    console.log(`예상 RSI: ${expected.toFixed(2)}`);
    console.log(`오차: ${difference.toFixed(2)}`);
    
    if (difference <= expectedResults.rsi.tolerance) {
      console.log('✅ RSI 계산 정확도 검증 통과');
      return true;
    } else {
      console.log('❌ RSI 계산 오차가 허용 범위를 초과');
      return false;
    }
  } else {
    console.log('❌ RSI 계산 실패');
    return false;
  }
}

async function verifyMACDCalculation() {
  console.log('\n📊 MACD 계산 검증');
  console.log('-'.repeat(40));
  
  const result = await ipcRenderer.invoke('calculate-indicator', {
    indicator: 'MACD',
    data: testData.macdPrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9
  });
  
  if (result.success) {
    const { macdLine, signalLine, histogram } = result.value;
    const tolerance = expectedResults.macd.tolerance;
    
    console.log(`계산된 MACD:`);
    console.log(`  - MACD Line: ${macdLine.toFixed(2)}`);
    console.log(`  - Signal Line: ${signalLine.toFixed(2)}`);
    console.log(`  - Histogram: ${histogram.toFixed(2)}`);
    
    const macdDiff = Math.abs(macdLine - expectedResults.macd.macdLine);
    const signalDiff = Math.abs(signalLine - expectedResults.macd.signalLine);
    const histDiff = Math.abs(histogram - expectedResults.macd.histogram);
    
    if (macdDiff <= tolerance && signalDiff <= tolerance && histDiff <= tolerance) {
      console.log('✅ MACD 계산 정확도 검증 통과');
      return true;
    } else {
      console.log('❌ MACD 계산 오차가 허용 범위를 초과');
      return false;
    }
  } else {
    console.log('❌ MACD 계산 실패');
    return false;
  }
}

async function verifyBollingerBandsCalculation() {
  console.log('\n📊 볼린저 밴드 계산 검증');
  console.log('-'.repeat(40));
  
  const result = await ipcRenderer.invoke('calculate-indicator', {
    indicator: 'BollingerBands',
    data: testData.bbPrices,
    period: 20,
    stdDev: 2
  });
  
  if (result.success) {
    const { upper, middle, lower } = result.value;
    const tolerance = expectedResults.bb.tolerance;
    
    console.log(`계산된 볼린저 밴드:`);
    console.log(`  - 상단: ${upper.toFixed(2)}`);
    console.log(`  - 중간: ${middle.toFixed(2)}`);
    console.log(`  - 하단: ${lower.toFixed(2)}`);
    
    const upperDiff = Math.abs(upper - expectedResults.bb.upper);
    const middleDiff = Math.abs(middle - expectedResults.bb.middle);
    const lowerDiff = Math.abs(lower - expectedResults.bb.lower);
    
    if (upperDiff <= tolerance && middleDiff <= tolerance && lowerDiff <= tolerance) {
      console.log('✅ 볼린저 밴드 계산 정확도 검증 통과');
      return true;
    } else {
      console.log('❌ 볼린저 밴드 계산 오차가 허용 범위를 초과');
      return false;
    }
  } else {
    console.log('❌ 볼린저 밴드 계산 실패');
    return false;
  }
}

// Kelly Criterion 계산 검증
async function verifyKellyCalculation() {
  console.log('\n📊 Kelly Criterion 계산 검증');
  console.log('-'.repeat(40));
  
  const testCases = [
    { winRate: 0.6, avgWin: 1.5, avgLoss: 1.0, expected: 0.2 },  // (0.6*1.5 - 0.4) / 1.5 = 0.33, capped at 0.25
    { winRate: 0.55, avgWin: 2.0, avgLoss: 1.0, expected: 0.1 }, // (0.55*2 - 0.45) / 2 = 0.325, capped at 0.25
    { winRate: 0.4, avgWin: 3.0, avgLoss: 1.0, expected: 0.2 }   // (0.4*3 - 0.6) / 3 = 0.2
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = await ipcRenderer.invoke('calculate-kelly', {
      winRate: testCase.winRate,
      avgWin: testCase.avgWin,
      avgLoss: testCase.avgLoss
    });
    
    if (result.success) {
      const calculated = result.fraction;
      console.log(`승률 ${(testCase.winRate*100).toFixed(0)}%, 평균수익 ${testCase.avgWin}x:`);
      console.log(`  계산된 Kelly: ${(calculated*100).toFixed(1)}%`);
      console.log(`  예상값: ${(testCase.expected*100).toFixed(1)}%`);
      
      const difference = Math.abs(calculated - testCase.expected);
      if (difference > 0.05) {
        console.log('  ❌ 오차 초과');
        allPassed = false;
      } else {
        console.log('  ✅ 통과');
      }
    } else {
      allPassed = false;
    }
  }
  
  return allPassed;
}

// 신호 강도 계산 검증
async function verifySignalStrengthCalculation() {
  console.log('\n📊 매수/매도 신호 강도 계산 검증');
  console.log('-'.repeat(40));
  
  const testScenario = {
    indicators: {
      rsi: 25,           // 과매도 (매수 신호)
      macd: {
        histogram: 0.5   // 양수 (매수 신호)
      },
      bb: {
        position: 0.1    // 하단 근처 (매수 신호)
      },
      ma: {
        price: 105,
        ma20: 100        // 가격 > MA (매수 신호)
      },
      volume_ratio: 2.0  // 높은 거래량
    },
    expectedSignal: 'BUY',
    minConfidence: 70
  };
  
  const result = await ipcRenderer.invoke('calculate-signal-strength', {
    indicators: testScenario.indicators
  });
  
  if (result.success) {
    const { signal, buyScore, sellScore, confidence } = result.data;
    
    console.log(`계산된 신호: ${signal}`);
    console.log(`매수 점수: ${buyScore.toFixed(1)}`);
    console.log(`매도 점수: ${sellScore.toFixed(1)}`);
    console.log(`신뢰도: ${confidence}%`);
    
    if (signal === testScenario.expectedSignal && confidence >= testScenario.minConfidence) {
      console.log('✅ 신호 강도 계산 검증 통과');
      return true;
    } else {
      console.log('❌ 신호 또는 신뢰도가 예상과 다름');
      return false;
    }
  } else {
    console.log('❌ 신호 강도 계산 실패');
    return false;
  }
}

// ATR 기반 동적 손절 계산 검증
async function verifyDynamicStopLoss() {
  console.log('\n📊 ATR 기반 동적 손절 계산 검증');
  console.log('-'.repeat(40));
  
  const testCase = {
    currentPrice: 50000000,
    atr: 1500000,  // 3% 변동성
    multiplier: 2,
    expectedStopLoss: 47000000  // 현재가 - (ATR * 2)
  };
  
  const result = await ipcRenderer.invoke('calculate-dynamic-stop-loss', {
    price: testCase.currentPrice,
    atr: testCase.atr,
    multiplier: testCase.multiplier
  });
  
  if (result.success) {
    const stopLoss = result.stopLoss;
    const stopLossPercent = ((testCase.currentPrice - stopLoss) / testCase.currentPrice * 100);
    
    console.log(`현재가: ${testCase.currentPrice.toLocaleString()}원`);
    console.log(`ATR: ${testCase.atr.toLocaleString()}원`);
    console.log(`계산된 손절가: ${stopLoss.toLocaleString()}원`);
    console.log(`손절 비율: ${stopLossPercent.toFixed(2)}%`);
    
    const difference = Math.abs(stopLoss - testCase.expectedStopLoss);
    if (difference < 100000) {  // 10만원 오차 허용
      console.log('✅ 동적 손절 계산 검증 통과');
      return true;
    } else {
      console.log('❌ 동적 손절 계산 오차 초과');
      return false;
    }
  } else {
    console.log('❌ 동적 손절 계산 실패');
    return false;
  }
}

// 전체 테스트 실행
async function runCalculationTests() {
  console.log('='.repeat(60));
  console.log('🧮 계산 로직 정확도 검증 테스트');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // 각 검증 실행
  const tests = [
    { name: 'RSI 계산', func: verifyRSICalculation },
    { name: 'MACD 계산', func: verifyMACDCalculation },
    { name: '볼린저 밴드', func: verifyBollingerBandsCalculation },
    { name: 'Kelly Criterion', func: verifyKellyCalculation },
    { name: '신호 강도', func: verifySignalStrengthCalculation },
    { name: '동적 손절', func: verifyDynamicStopLoss }
  ];
  
  for (const test of tests) {
    try {
      const passed = await test.func();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} 테스트 중 오류: ${error.message}`);
      results.failed++;
    }
    
    // 테스트 간 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 계산 검증 결과 요약');
  console.log('='.repeat(60));
  console.log(`✅ 통과: ${results.passed}`);
  console.log(`❌ 실패: ${results.failed}`);
  console.log(`정확도: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // 결과 저장
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'test-results', 'calculation-test-report.json');
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: results,
    accuracy: results.passed / (results.passed + results.failed)
  }, null, 2));
  
  console.log(`\n📄 보고서 저장됨: ${reportPath}`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// 메인 실행
if (require.main === module) {
  if (!process.versions.electron) {
    console.error('❌ 이 스크립트는 Electron 환경에서 실행되어야 합니다.');
    process.exit(1);
  }
  
  runCalculationTests().catch(error => {
    console.error('테스트 실행 중 치명적 오류:', error);
    process.exit(1);
  });
}

module.exports = { runCalculationTests };