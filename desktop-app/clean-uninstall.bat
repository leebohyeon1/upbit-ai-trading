@echo off
echo ========================================
echo Upbit AI Trading - Complete Cleanup Tool
echo ========================================
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script requires Administrator privileges!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/5] Killing all related processes...
:: 모든 관련 프로세스 종료
taskkill /F /IM "Upbit AI Trading.exe" 2>nul
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
wmic process where "name like '%%upbit%%'" delete 2>nul

:: 잠시 대기
timeout /t 2 /nobreak >nul

echo [2/5] Removing installation directory...
:: 기본 설치 경로들 삭제
if exist "%LOCALAPPDATA%\Programs\upbit-ai-trading" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\upbit-ai-trading"
    echo - Removed: %LOCALAPPDATA%\Programs\upbit-ai-trading
)

if exist "%LOCALAPPDATA%\Programs\Upbit AI Trading" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\Upbit AI Trading"
    echo - Removed: %LOCALAPPDATA%\Programs\Upbit AI Trading
)

if exist "%PROGRAMFILES%\Upbit AI Trading" (
    rmdir /s /q "%PROGRAMFILES%\Upbit AI Trading"
    echo - Removed: %PROGRAMFILES%\Upbit AI Trading
)

if exist "%PROGRAMFILES(x86)%\Upbit AI Trading" (
    rmdir /s /q "%PROGRAMFILES(x86)%\Upbit AI Trading"
    echo - Removed: %PROGRAMFILES(x86)%\Upbit AI Trading
)

echo [3/5] Removing app data...
:: AppData 폴더 삭제
if exist "%APPDATA%\upbit-ai-trading" (
    rmdir /s /q "%APPDATA%\upbit-ai-trading"
    echo - Removed: %APPDATA%\upbit-ai-trading
)

if exist "%APPDATA%\Upbit AI Trading" (
    rmdir /s /q "%APPDATA%\Upbit AI Trading"
    echo - Removed: %APPDATA%\Upbit AI Trading
)

echo [4/5] Removing shortcuts...
:: 바로가기 삭제
del /f /q "%DESKTOP%\Upbit AI Trading.lnk" 2>nul
del /f /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Upbit AI Trading.lnk" 2>nul
del /f /q "%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs\Upbit AI Trading.lnk" 2>nul

echo [5/5] Cleaning registry...
:: 레지스트리 정리 (언인스톨 정보)
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{com.leebohyeon.upbit-ai-trading}" /f 2>nul
reg delete "HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{com.leebohyeon.upbit-ai-trading}" /f 2>nul
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\{com.leebohyeon.upbit-ai-trading}" /f 2>nul

:: Electron 관련 레지스트리
reg delete "HKEY_CURRENT_USER\Software\upbit-ai-trading" /f 2>nul
reg delete "HKEY_CURRENT_USER\Software\Upbit AI Trading" /f 2>nul

echo.
echo ========================================
echo Cleanup complete!
echo.
echo You can now install Upbit AI Trading without issues.
echo ========================================
echo.
pause