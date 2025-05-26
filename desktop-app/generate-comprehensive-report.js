/**
 * 종합 테스트 보고서 생성
 * 모든 테스트 결과를 수집하여 마크다운 보고서를 생성합니다.
 */

const fs = require('fs');
const path = require('path');

// 보고서 파일 읽기
function readReport(filename) {
  const filepath = path.join(__dirname, 'test-results', filename);
  if (fs.existsSync(filepath)) {
    try {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (error) {
      console.error(`${filename} 읽기 실패:`, error.message);
      return null;
    }
  }
  return null;
}

// 기능 문서 생성
function generateFeatureDocumentation() {
  const features = {
    core: {
      title: '핵심 기능',
      items: [
        {
          name: '자동 매매 엔진',
          description: '30초 주기로 시장을 분석하고 자동으로 매수/매도 결정',
          calculation: `
- 매수 점수 = Σ(지표별 점수 × 가중치)
- 매도 점수 = Σ(지표별 점수 × 가중치)
- 최종 신호 = 점수가 높은 쪽 (임계값 25% 이상)
- 신뢰도 = (우세점수 / (매수점수 + 매도점수)) × 100
          `,
          files: ['trading-engine.ts']
        },
        {
          name: 'AI 분석 (Claude)',
          description: '시장 상황과 기술적 지표를 종합하여 AI 기반 매매 조언 제공',
          calculation: `
- 입력: 기술적 지표, 시장 심리, 뉴스 감정
- 처리: Claude API를 통한 종합 분석
- 출력: 매매 신호, 신뢰도, 근거 설명
          `,
          files: ['ai-service.ts', 'ai-service-improved.ts']
        },
        {
          name: '기술적 분석',
          description: '다양한 기술적 지표를 계산하고 매매 신호 생성',
          calculation: `
주요 지표:
- RSI: 14일 기준, 30 이하 과매도, 70 이상 과매수
- MACD: 12/26/9 EMA, 히스토그램 기준 신호
- 볼린저 밴드: 20일 MA ± 2σ
- 스토캐스틱 RSI: RSI의 스토캐스틱
- ATR: 14일 평균 실제 범위 (변동성)
          `,
          files: ['analysis-service.ts']
        }
      ]
    },
    advanced: {
      title: '고급 기능',
      items: [
        {
          name: '백테스트 시스템',
          description: '과거 데이터로 전략을 검증하고 최적 파라미터 탐색',
          calculation: `
성과 지표:
- 총 수익률 = ((최종잔고 - 초기잔고) / 초기잔고) × 100
- 샤프 비율 = (평균수익률 - 무위험수익률) / 수익률표준편차
- 최대 낙폭 = max((peak - trough) / peak) × 100
- 승률 = (수익거래 / 전체거래) × 100
          `,
          files: ['backtest-service.ts']
        },
        {
          name: '학습 시스템',
          description: '거래 결과를 학습하여 지표별 가중치 자동 조정',
          calculation: `
가중치 업데이트:
- 성공률 = 해당 지표 조건에서 성공한 거래 / 전체
- 신뢰도 = min(샘플 수 / 20, 1.0)
- 새 가중치 = 기본값 × (1 + (성공률 - 0.5) × 신뢰도)
- Kelly Criterion = (p×b - q) / b (최대 25% 제한)
          `,
          files: ['learning-service.ts']
        },
        {
          name: '시장 상관관계 분석',
          description: 'BTC 도미넌스, 글로벌 지표를 통한 시장 단계 판단',
          calculation: `
시장 단계 판단:
- 알트시즌: BTC 도미넌스 < 45%
- 강세장: 공포/탐욕 지수 > 60
- 약세장: 공포/탐욕 지수 < 40
- 상관계수 = cov(X,Y) / (σX × σY)
          `,
          files: ['market-correlation-service.ts']
        },
        {
          name: '코인별 맞춤 전략',
          description: '각 코인의 특성에 맞는 개별 거래 전략 적용',
          calculation: `
동적 조정:
- 변동성 기반: ATR > 5% → 포지션 50% 축소
- 시장 상황: 약세장 → 신뢰도 임계값 +10%
- 시간대별: 한국 시간 9-18시 거래 제한 (일부 코인)
          `,
          files: ['trading-config.ts']
        }
      ]
    },
    support: {
      title: '보조 기능',
      items: [
        {
          name: '뉴스 분석',
          description: '암호화폐 관련 뉴스 수집 및 감정 분석',
          files: ['news-service.ts']
        },
        {
          name: '실시간 알림',
          description: '중요 거래 신호 및 시장 변화 알림',
          files: ['main.ts']
        },
        {
          name: '포트폴리오 관리',
          description: '보유 자산 추적 및 수익률 계산',
          files: ['upbit-service.ts']
        }
      ]
    }
  };
  
  let doc = '# Upbit AI Trading 앱 기능 문서\n\n';
  doc += '## 📋 목차\n\n';
  
  for (const [key, section] of Object.entries(features)) {
    doc += `- [${section.title}](#${section.title.toLowerCase().replace(/\s/g, '-')})\n`;
    section.items.forEach(item => {
      doc += `  - [${item.name}](#${item.name.toLowerCase().replace(/\s/g, '-')})\n`;
    });
  }
  
  doc += '\n---\n\n';
  
  for (const [key, section] of Object.entries(features)) {
    doc += `## ${section.title}\n\n`;
    
    for (const item of section.items) {
      doc += `### ${item.name}\n\n`;
      doc += `**설명:** ${item.description}\n\n`;
      
      if (item.calculation) {
        doc += '**계산 방식:**\n';
        doc += '```\n' + item.calculation.trim() + '\n```\n\n';
      }
      
      doc += `**관련 파일:** ${item.files.map(f => `\`${f}\``).join(', ')}\n\n`;
    }
  }
  
  return doc;
}

// 종합 보고서 생성
function generateComprehensiveReport() {
  console.log('📝 종합 테스트 보고서 생성 중...\n');
  
  // 각 테스트 보고서 읽기
  const reports = {
    features: readReport('feature-test-report.json'),
    calculations: readReport('calculation-test-report.json'),
    scenarios: readReport('scenario-test-report.json'),
    performance: readReport('performance-report.json')
  };
  
  // 전체 통계 계산
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;
  
  if (reports.features) {
    totalPassed += reports.features.summary.passed;
    totalFailed += reports.features.summary.failed;
    totalWarnings += reports.features.summary.warnings;
  }
  
  if (reports.calculations) {
    totalPassed += reports.calculations.results.passed;
    totalFailed += reports.calculations.results.failed;
  }
  
  if (reports.scenarios) {
    totalPassed += reports.scenarios.results.summary.passed;
    totalFailed += reports.scenarios.results.summary.failed;
    totalWarnings += reports.scenarios.results.summary.warnings;
  }
  
  // 마크다운 보고서 생성
  let report = '# Upbit AI Trading 앱 종합 테스트 보고서\n\n';
  report += `생성 일시: ${new Date().toLocaleString('ko-KR')}\n\n`;
  
  // 요약
  report += '## 📊 테스트 결과 요약\n\n';
  report += '| 항목 | 결과 |\n';
  report += '|------|------|\n';
  report += `| ✅ 통과 | ${totalPassed} |\n`;
  report += `| ❌ 실패 | ${totalFailed} |\n`;
  report += `| ⚠️ 경고 | ${totalWarnings} |\n`;
  report += `| 📈 전체 성공률 | ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}% |\n`;
  report += '\n';
  
  // 기능 테스트 결과
  if (reports.features) {
    report += '## 🧪 기능 테스트 결과\n\n';
    report += `- 실행 시간: ${reports.features.duration}초\n`;
    report += `- 성공: ${reports.features.summary.passed}\n`;
    report += `- 실패: ${reports.features.summary.failed}\n`;
    report += `- 경고: ${reports.features.summary.warnings}\n\n`;
    
    // 주요 실패 항목
    const failures = reports.features.details.filter(d => d.type === 'error');
    if (failures.length > 0) {
      report += '### 실패한 테스트:\n';
      failures.forEach(f => {
        report += `- ${f.message}\n`;
      });
      report += '\n';
    }
  }
  
  // 계산 검증 결과
  if (reports.calculations) {
    report += '## 🧮 계산 로직 검증 결과\n\n';
    report += `- 정확도: ${(reports.calculations.accuracy * 100).toFixed(1)}%\n`;
    report += `- 통과: ${reports.calculations.results.passed}\n`;
    report += `- 실패: ${reports.calculations.results.failed}\n\n`;
  }
  
  // 시나리오 테스트 결과
  if (reports.scenarios) {
    report += '## 🎭 시나리오 테스트 결과\n\n';
    report += `- 통과율: ${reports.scenarios.passRate}\n`;
    report += `- 총 시나리오: ${reports.scenarios.results.summary.total}\n\n`;
    
    report += '### 시나리오별 결과:\n';
    for (const [name, result] of Object.entries(reports.scenarios.results.scenarios)) {
      const status = result.failed.length === 0 ? '✅' : '❌';
      report += `- ${status} ${name}\n`;
    }
    report += '\n';
  }
  
  // 성능 테스트 결과
  if (reports.performance) {
    report += '## ⚡ 성능 테스트 결과\n\n';
    
    const metrics = reports.performance.metrics;
    
    report += '### API 응답 시간:\n';
    report += `- Upbit 캔들: ${metrics.apiCalls.candles?.toFixed(0)}ms\n`;
    report += `- 뉴스 수집: ${metrics.apiCalls.news?.toFixed(0)}ms\n`;
    report += `- AI 분석: ${metrics.apiCalls.ai?.toFixed(0)}ms\n\n`;
    
    report += '### 분석 속도:\n';
    report += `- 단일 코인: ${metrics.analysis.single?.toFixed(0)}ms\n`;
    report += `- 4개 동시: ${metrics.analysis.multi4?.toFixed(0)}ms\n\n`;
    
    report += '### 최적화 효과:\n';
    report += `- 동시성 향상: ${metrics.overall.concurrencySpeedup}x\n`;
    report += `- 캐시 효과: ${metrics.overall.cacheSpeedup}x\n\n`;
  }
  
  // 발견된 문제점
  report += '## 🐛 발견된 주요 이슈\n\n';
  
  const issues = [];
  
  if (totalFailed > 5) {
    issues.push({
      severity: '높음',
      title: '다수의 테스트 실패',
      description: '기본 기능에 문제가 있을 가능성'
    });
  }
  
  if (reports.performance?.metrics.apiCalls.candles > 2000) {
    issues.push({
      severity: '중간',
      title: 'API 응답 속도 저하',
      description: 'Upbit API 호출 최적화 필요'
    });
  }
  
  if (reports.performance?.metrics.memory.afterAnalysis?.heapUsed > 500) {
    issues.push({
      severity: '중간',
      title: '과도한 메모리 사용',
      description: '메모리 누수 가능성 확인 필요'
    });
  }
  
  if (issues.length > 0) {
    issues.forEach(issue => {
      report += `### [${issue.severity}] ${issue.title}\n`;
      report += `${issue.description}\n\n`;
    });
  } else {
    report += '심각한 이슈는 발견되지 않았습니다.\n\n';
  }
  
  // 개선 권장사항
  report += '## 💡 개선 권장사항\n\n';
  
  const recommendations = [
    {
      priority: '높음',
      title: '에러 처리 강화',
      description: 'API 타임아웃 및 네트워크 오류에 대한 재시도 로직 구현'
    },
    {
      priority: '중간',
      title: '성능 최적화',
      description: '백테스트 병렬 처리 및 캐시 전략 개선'
    },
    {
      priority: '낮음',
      title: 'UI/UX 개선',
      description: '실시간 업데이트 지연 문제 해결'
    }
  ];
  
  recommendations.forEach(rec => {
    report += `### [${rec.priority}] ${rec.title}\n`;
    report += `${rec.description}\n\n`;
  });
  
  // 다음 단계
  report += '## 🚀 다음 단계\n\n';
  report += '1. **긴급** - 실패한 테스트 수정\n';
  report += '2. **단기** - 성능 최적화 구현\n';
  report += '3. **중기** - 학습 시스템 고도화\n';
  report += '4. **장기** - 추가 거래 전략 개발\n';
  
  // 파일 저장
  const reportPath = path.join(__dirname, 'COMPREHENSIVE_TEST_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`✅ 종합 보고서 생성 완료: ${reportPath}`);
  
  // 기능 문서 생성
  const featureDoc = generateFeatureDocumentation();
  const featureDocPath = path.join(__dirname, 'FEATURE_DOCUMENTATION.md');
  fs.writeFileSync(featureDocPath, featureDoc);
  console.log(`✅ 기능 문서 생성 완료: ${featureDocPath}`);
  
  // 요약 출력
  console.log('\n📊 테스트 요약:');
  console.log(`   총 통과: ${totalPassed}`);
  console.log(`   총 실패: ${totalFailed}`);
  console.log(`   총 경고: ${totalWarnings}`);
  console.log(`   성공률: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
}

// 메인 실행
if (require.main === module) {
  generateComprehensiveReport();
}

module.exports = { generateComprehensiveReport };