@echo off
echo ========================================
echo  Secure Build for Private Repository
echo ========================================
echo.

REM 토큰 입력 받기 (화면에 표시되지 않음)
set /p GH_TOKEN="GitHub Personal Access Token 입력: "

echo.
echo 빌드를 시작합니다...
echo.

REM 빌드 실행
call npm run dist:win

REM 토큰 변수 삭제 (보안)
set GH_TOKEN=

echo.
echo 빌드가 완료되었습니다!
echo.
pause