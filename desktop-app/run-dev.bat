@echo off
echo Starting development server...
echo.
echo Note: This is a development version. Your production app can run simultaneously.
echo.
echo Press Ctrl+C to stop the development server.
echo.

REM Kill any existing webpack processes
taskkill /F /IM webpack.exe 2>nul

REM Start webpack in watch mode
start /B cmd /c "webpack --watch"

REM Wait for webpack to build
timeout /t 5 /nobreak >nul

REM Start Electron
electron .