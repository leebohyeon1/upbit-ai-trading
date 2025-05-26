@echo off
chcp 65001 > nul
echo === Upbit AI Trading 앱 종합 테스트 v2.0 ===
echo.
echo 테스트 시작 시간: %date% %time%
echo.

REM 결과 디렉토리 생성
if not exist test-results mkdir test-results

echo [1/8] 환경 점검...
node -v > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다.
    pause
    exit /b 1
)
echo ✅ Node.js 확인됨

echo.
echo [2/8] 기존 기능 테스트...
echo ⏳ 모든 핵심 기능을 검증합니다...
call npm run test:features
if errorlevel 1 (
    echo ⚠️  일부 기능 테스트 실패
) else (
    echo ✅ 기능 테스트 완료
)

echo.
echo [3/8] 계산 로직 검증...
echo ⏳ 기술적 지표 계산 정확도를 검증합니다...
call npm run test:calculations
if errorlevel 1 (
    echo ⚠️  일부 계산 검증 실패
) else (
    echo ✅ 계산 검증 완료
)

echo.
echo [4/8] 백테스트 시스템...
echo ⏳ 백테스트 기능을 테스트합니다...
node test-backtest.js
if errorlevel 1 (
    echo ⚠️  백테스트 테스트 실패
) else (
    echo ✅ 백테스트 테스트 완료
)

echo.
echo [5/8] 통합 시나리오...
echo ⏳ 실제 거래 시나리오를 시뮬레이션합니다...
call npm run test:scenarios
if errorlevel 1 (
    echo ⚠️  일부 시나리오 실패
) else (
    echo ✅ 시나리오 테스트 완료
)

echo.
echo [6/8] 성능 벤치마크...
echo ⏳ 처리 속도와 메모리 사용량을 측정합니다...
call npm run test:performance
if errorlevel 1 (
    echo ⚠️  성능 테스트 중 오류
) else (
    echo ✅ 성능 테스트 완료
)

echo.
echo [7/8] 데이터 무결성 검증...
echo ⏳ 학습 데이터와 설정 파일을 확인합니다...
node test-data.js
if errorlevel 1 (
    echo ⚠️  데이터 검증 실패
) else (
    echo ✅ 데이터 검증 완료
)

echo.
echo [8/8] 보고서 생성...
echo ⏳ 종합 테스트 보고서를 생성합니다...
node generate-comprehensive-report.js
if errorlevel 1 (
    echo ⚠️  보고서 생성 실패
) else (
    echo ✅ 보고서 생성 완료
)

echo.
echo === 테스트 완료! ===
echo 완료 시간: %date% %time%
echo.
echo 📄 다음 파일을 확인하세요:
echo    - test-results\feature-test-report.json
echo    - test-results\calculation-test-report.json
echo    - test-results\scenario-test-report.json
echo    - test-results\performance-report.json
echo    - COMPREHENSIVE_TEST_REPORT.md
echo.
echo 💡 자세한 내용은 각 보고서 파일을 참조하세요.
echo.
pause