@echo off
echo Killing Upbit AI Trading processes...

:: Kill Electron processes
taskkill /F /IM "Upbit AI Trading.exe" 2>nul
taskkill /F /IM electron.exe 2>nul

:: Kill Node processes (개발 모드에서 사용)
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Upbit AI Trading*" 2>nul

:: Kill Python processes (백엔드 서버)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *api_server*" 2>nul

echo Done!
echo You can now update or restart the application.
pause