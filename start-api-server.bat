@echo off
echo Starting API Server...

REM Install dependencies if needed
pip install -r requirements.txt

REM Start the API server
python api_server.py