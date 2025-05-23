@echo off
echo Starting Upbit AI Trading Desktop App in Development Mode...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Run in development mode
echo Starting in development mode...
start cmd /c "npm run dev:build"
timeout /t 3 /nobreak > nul
start cmd /c "npm run dev:electron"