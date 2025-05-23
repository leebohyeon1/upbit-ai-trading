@echo off
echo Starting Upbit AI Trading Desktop App...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Build and run the app
echo Building application...
call npm run build

echo Starting application...
call npm run start