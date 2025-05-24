@echo off
echo Starting Upbit AI Trading System...

REM Start API server in a new window
echo Starting API Server...
start "API Server" cmd /k python api_server.py

REM Wait for API server to start
echo Waiting for API server to initialize...
timeout /t 1 /nobreak > nul

REM Start desktop app
echo Starting Desktop App...
cd desktop-app
call run.bat