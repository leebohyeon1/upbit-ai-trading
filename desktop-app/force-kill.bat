@echo off
echo ========================================
echo Forcefully killing ALL Upbit AI Trading related processes...
echo ========================================

:: Kill all processes with Upbit in name
wmic process where "name like '%%upbit%%'" delete
wmic process where "name like '%%Upbit%%'" delete

:: Kill specific processes
taskkill /F /IM "Upbit AI Trading.exe" 2>nul
taskkill /F /IM "Upbit AI Trading (Dev).exe" 2>nul
taskkill /F /IM "upbit-ai-trading.exe" 2>nul

:: Kill all electron processes
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM electron.exe /T 2>nul

:: Kill node processes that might be running the app
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node.exe"') do (
    taskkill /F /PID %%i 2>nul
)

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Check if any process is still running
tasklist | findstr /i "upbit electron" >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Some processes might still be running!
    echo Trying alternative method...
    
    :: Try PowerShell method
    powershell -Command "Get-Process | Where-Object {$_.ProcessName -match 'upbit|electron'} | Stop-Process -Force"
) else (
    echo.
    echo SUCCESS: All processes terminated!
)

echo.
echo ========================================
echo Process termination complete.
echo You can now install/update the application.
echo ========================================
pause