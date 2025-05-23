@echo off
echo Starting Upbit AI Trading Application...

REM Check Python dependencies
echo Checking Python dependencies...
pip install -r requirements.txt

REM Navigate to desktop-app directory and start
cd desktop-app
call run.bat