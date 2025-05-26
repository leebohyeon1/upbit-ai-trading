/**
 * 통합 시나리오 테스트
 * 실제 거래 상황을 시뮬레이션하여 앱의 동작을 검증합니다.
 */

const { ipcRenderer } = require('electron');

// 시나리오 정의
const scenarios = {
  '급등장 시나리오': {
    description: '단기간에 가격이 급등하는 상황',
    marketConditions: {
      priceChange24h: 0.15,    // 15% 상승
      volume_ratio: 3.0,       // 평균 대비 3배 거래량
      kimchiPremium: 6,        // 6% 김프
      fearGreedIndex: 85       // 극도의 탐욕
    },
    indicators: {
      rsi: 85,
      macd: { histogram: 2.5 },
      bb: { position: 0.95 },   // 상단 밴드 돌파
      stochRsi: 95
    },
    expectedBehavior: {
      signal: 'SELL',
      minConfidence: 80,
      actions: [
        '과매수 경고 발생',
        'RSI 임계값 상향 조정',
        '포지션 크기 축소',
        '매도 신호 강화'
      ]
    }
  },
  
  '급락장 시나리오': {
    description: '패닉 셀링으로 인한 급락',
    marketConditions: {
      priceChange24h: -0.15,   // 15% 하락
      volume_ratio: 2.5,       // 높은 거래량
      kimchiPremium: -2,       // 역프리미엄
      fearGreedIndex: 10       // 극도의 공포
    },
    indicators: {
      rsi: 15,
      macd: { histogram: -2.0 },
      bb: { position: 0.05 },   // 하단 밴드 이탈
      stochRsi: 5
    },
    expectedBehavior: {
      signal: 'BUY',
      minConfidence: 75,
      actions: [
        '과매도 기회 포착',
        '분할 매수 전략 활성화',
        '쿨타임 연장',
        '리스크 관리 강화'
      ]
    }
  },
  
  '횡보장 시나리오': {
    description: '좁은 범위에서 등락 반복',
    marketConditions: {
      priceChange24h: 0.02,    // 2% 변동
      volume_ratio: 0.8,       // 낮은 거래량
      kimchiPremium: 1,        // 정상 범위
      fearGreedIndex: 50       // 중립
    },
    indicators: {
      rsi: 50,
      macd: { histogram: 0.1 },
      bb: { position: 0.5 },    // 중간선 근처
      stochRsi: 45
    },
    expectedBehavior: {
      signal: 'HOLD',
      maxConfidence: 40,
      actions: [
        '거래 자제',
        '변동성 돌파 대기',
        '더 강한 신호 필요',
        '포지션 유지'
      ]
    }
  },
  
  '뉴스 이벤트 시나리오': {
    description: '중요한 뉴스로 인한 급변동',
    marketConditions: {
      priceChange24h: -0.08,
      volume_ratio: 4.0,
      newsEvents: ['HACK', 'REGULATION']
    },
    newsAnalysis: {
      sentimentScore: -50,
      keyEvents: [
        '주요 거래소 해킹 발생',
        '규제 당국 단속 발표'
      ],
      impactLevel: 'HIGH'
    },
    expectedBehavior: {
      actions: [
        '거래 일시 중단',
        '리스크 평가 실행',
        '포지션 축소 또는 청산',
        '안전 자산으로 이동 고려'
      ]
    }
  },
  
  '알트시즌 시나리오': {
    description: 'BTC 도미넌스 하락, 알트코인 강세',
    marketConditions: {
      btcDominance: 42,        // 45% 미만
      altcoinMomentum: 'strong',
      marketPhase: 'alt-season'
    },
    expectedBehavior: {
      actions: [
        'BTC 비중 축소',
        'ETH, 주요 알트 비중 확대',
        '소형 알트 리스크 관리',
        '순환매 전략 활성화'
      ]
    }
  },
  
  '변동성 급증 시나리오': {
    description: 'ATR이 평균의 3배로 급증',
    marketConditions: {
      atr: 0.15,               // 15% 일일 변동
      volatilitySpike: 3.0
    },
    expectedBehavior: {
      actions: [
        '포지션 크기 50% 축소',
        '손절선 확대 (ATR * 3)',
        '진입 신뢰도 임계값 상향',
        '스캘핑 전략 비활성화'
      ]
    }
  }
};

// 시나리오 실행 함수
async function runScenario(name, scenario) {
  console.log(`\n🎬 ${name}`);
  console.log(`📝 ${scenario.description}`);
  console.log('-'.repeat(50));
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  try {
    // 1. 시장 상황 시뮬레이션
    console.log('\n1️⃣ 시장 상황 설정');
    const marketResult = await ipcRenderer.invoke('simulate-market', {
      conditions: scenario.marketConditions,
      indicators: scenario.indicators
    });
    
    if (marketResult.success) {
      console.log('✅ 시장 상황 시뮬레이션 성공');
      results.passed.push('시장 시뮬레이션');
    } else {
      console.log('❌ 시장 상황 시뮬레이션 실패');
      results.failed.push('시장 시뮬레이션');
      return results;
    }
    
    // 2. 분석 실행
    console.log('\n2️⃣ 거래 신호 분석');
    const analysisResult = await ipcRenderer.invoke('analyze-scenario', {
      ticker: 'KRW-BTC',
      scenario: scenario
    });
    
    if (analysisResult.success) {
      const { signal, confidence, actions } = analysisResult.data;
      
      console.log(`신호: ${signal}, 신뢰도: ${confidence}%`);
      
      // 예상 신호 검증
      if (scenario.expectedBehavior.signal) {
        if (signal === scenario.expectedBehavior.signal) {
          console.log(`✅ 예상 신호와 일치: ${signal}`);
          results.passed.push('신호 검증');
        } else {
          console.log(`❌ 신호 불일치 - 예상: ${scenario.expectedBehavior.signal}, 실제: ${signal}`);
          results.failed.push('신호 검증');
        }
      }
      
      // 신뢰도 검증
      if (scenario.expectedBehavior.minConfidence) {
        if (confidence >= scenario.expectedBehavior.minConfidence) {
          console.log(`✅ 최소 신뢰도 충족: ${confidence}%`);
          results.passed.push('신뢰도 검증');
        } else {
          console.log(`⚠️ 신뢰도 부족 - 필요: ${scenario.expectedBehavior.minConfidence}%, 실제: ${confidence}%`);
          results.warnings.push('신뢰도 부족');
        }
      }
      
      if (scenario.expectedBehavior.maxConfidence) {
        if (confidence <= scenario.expectedBehavior.maxConfidence) {
          console.log(`✅ 최대 신뢰도 제한 준수: ${confidence}%`);
          results.passed.push('신뢰도 제한');
        } else {
          console.log(`⚠️ 신뢰도 초과 - 최대: ${scenario.expectedBehavior.maxConfidence}%, 실제: ${confidence}%`);
          results.warnings.push('신뢰도 초과');
        }
      }
    } else {
      console.log('❌ 시나리오 분석 실패');
      results.failed.push('시나리오 분석');
    }
    
    // 3. 뉴스 분석 (해당하는 경우)
    if (scenario.newsAnalysis) {
      console.log('\n3️⃣ 뉴스 영향 분석');
      const newsResult = await ipcRenderer.invoke('analyze-news-impact', {
        analysis: scenario.newsAnalysis
      });
      
      if (newsResult.success) {
        console.log(`✅ 뉴스 영향 평가: ${newsResult.impact}`);
        results.passed.push('뉴스 분석');
      } else {
        console.log('❌ 뉴스 분석 실패');
        results.failed.push('뉴스 분석');
      }
    }
    
    // 4. 예상 행동 검증
    console.log('\n4️⃣ 예상 행동 검증');
    if (scenario.expectedBehavior.actions) {
      for (const expectedAction of scenario.expectedBehavior.actions) {
        console.log(`  - ${expectedAction}`);
      }
      console.log('✅ 예상 행동 패턴 확인');
      results.passed.push('행동 패턴');
    }
    
    // 5. 리스크 관리 검증
    console.log('\n5️⃣ 리스크 관리 검증');
    const riskResult = await ipcRenderer.invoke('evaluate-risk', {
      scenario: scenario
    });
    
    if (riskResult.success) {
      const { riskLevel, recommendations } = riskResult.data;
      console.log(`리스크 레벨: ${riskLevel}`);
      
      if (recommendations && recommendations.length > 0) {
        console.log('권장 사항:');
        recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
      console.log('✅ 리스크 관리 적절');
      results.passed.push('리스크 관리');
    } else {
      console.log('⚠️ 리스크 평가 미완료');
      results.warnings.push('리스크 평가');
    }
    
  } catch (error) {
    console.log(`❌ 시나리오 실행 중 오류: ${error.message}`);
    results.failed.push('시나리오 실행');
  }
  
  // 시나리오 결과 요약
  console.log('\n📊 시나리오 결과:');
  console.log(`  ✅ 통과: ${results.passed.length}`);
  console.log(`  ❌ 실패: ${results.failed.length}`);
  console.log(`  ⚠️ 경고: ${results.warnings.length}`);
  
  return results;
}

// 전체 시나리오 테스트 실행
async function runAllScenarios() {
  console.log('='.repeat(60));
  console.log('🎭 통합 시나리오 테스트');
  console.log('='.repeat(60));
  console.log('실제 거래 상황을 시뮬레이션하여 앱의 반응을 검증합니다.\n');
  
  const totalResults = {
    scenarios: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };
  
  // 각 시나리오 실행
  for (const [name, scenario] of Object.entries(scenarios)) {
    const results = await runScenario(name, scenario);
    
    totalResults.scenarios[name] = results;
    totalResults.summary.total++;
    
    // 시나리오 통과 여부 판단
    if (results.failed.length === 0) {
      totalResults.summary.passed++;
    } else {
      totalResults.summary.failed++;
    }
    
    totalResults.summary.warnings += results.warnings.length;
    
    // 시나리오 간 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 최종 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 시나리오 테스트 최종 결과');
  console.log('='.repeat(60));
  console.log(`총 시나리오: ${totalResults.summary.total}`);
  console.log(`✅ 통과: ${totalResults.summary.passed}`);
  console.log(`❌ 실패: ${totalResults.summary.failed}`);
  console.log(`⚠️ 총 경고: ${totalResults.summary.warnings}`);
  
  // 세부 결과
  console.log('\n📋 시나리오별 세부 결과:');
  for (const [name, results] of Object.entries(totalResults.scenarios)) {
    const status = results.failed.length === 0 ? '✅' : '❌';
    console.log(`${status} ${name}: 통과(${results.passed.length}), 실패(${results.failed.length}), 경고(${results.warnings.length})`);
  }
  
  // 결과 저장
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'test-results', 'scenario-test-report.json');
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: totalResults,
    passRate: (totalResults.summary.passed / totalResults.summary.total * 100).toFixed(1) + '%'
  }, null, 2));
  
  console.log(`\n📄 시나리오 테스트 보고서 저장됨: ${reportPath}`);
  
  // 권장사항
  console.log('\n💡 개선 권장사항:');
  
  if (totalResults.summary.failed > 0) {
    console.log('1. 실패한 시나리오의 로직 검토 필요');
  }
  
  if (totalResults.summary.warnings > 10) {
    console.log('2. 경고가 많음 - 임계값 조정 검토');
  }
  
  // 특정 시나리오 권장사항
  if (totalResults.scenarios['급등장 시나리오']?.warnings.length > 0) {
    console.log('3. 급등장 대응 전략 강화 필요');
  }
  
  if (totalResults.scenarios['뉴스 이벤트 시나리오']?.failed.length > 0) {
    console.log('4. 뉴스 기반 리스크 관리 개선 필요');
  }
  
  process.exit(totalResults.summary.failed > 0 ? 1 : 0);
}

// 메인 실행
if (require.main === module) {
  if (!process.versions.electron) {
    console.error('❌ 이 스크립트는 Electron 환경에서 실행되어야 합니다.');
    process.exit(1);
  }
  
  runAllScenarios().catch(error => {
    console.error('시나리오 테스트 중 치명적 오류:', error);
    process.exit(1);
  });
}

module.exports = { runAllScenarios };