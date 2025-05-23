"""
FastAPI 서버 - 기존 자동매매 로직을 API로 제공
"""
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import threading
from datetime import datetime

# 기존 모듈 임포트 (실제 구현시)
# from src.main import TradingBot
# from src.main_dual import DualTradingBot

app = FastAPI(title="Upbit AI Trading API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*"],  # Electron 앱 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 상태 관리
class TradingState:
    def __init__(self):
        self.is_running = False
        self.ai_enabled = False
        self.bot_thread = None
        self.last_update = datetime.now()
        
trading_state = TradingState()

# 요청/응답 모델
class StartTradingRequest(BaseModel):
    ai_enabled: bool = False

class ToggleAIRequest(BaseModel):
    enabled: bool

class TradingStatusResponse(BaseModel):
    is_running: bool
    ai_enabled: bool
    current_price: Optional[float] = None
    position: Optional[str] = None
    profit_rate: Optional[float] = None

class SuccessResponse(BaseModel):
    success: bool
    message: Optional[str] = None

# API 엔드포인트
@app.get("/")
async def root():
    return {"message": "Upbit AI Trading API Server"}

@app.get("/status", response_model=TradingStatusResponse)
async def get_status():
    """현재 자동매매 상태 조회"""
    return TradingStatusResponse(
        is_running=trading_state.is_running,
        ai_enabled=trading_state.ai_enabled,
        # 실제 구현시 봇에서 데이터 가져오기
        current_price=None,
        position=None,
        profit_rate=None
    )

@app.post("/start", response_model=SuccessResponse)
async def start_trading(request: StartTradingRequest, background_tasks: BackgroundTasks):
    """자동매매 시작"""
    if trading_state.is_running:
        return SuccessResponse(success=False, message="Already running")
    
    try:
        trading_state.is_running = True
        trading_state.ai_enabled = request.ai_enabled
        trading_state.last_update = datetime.now()
        
        # 실제 구현시 봇 시작
        # if request.ai_enabled:
        #     bot = DualTradingBot()
        # else:
        #     bot = TradingBot()
        # 
        # trading_state.bot_thread = threading.Thread(target=bot.run)
        # trading_state.bot_thread.start()
        
        return SuccessResponse(success=True, message="Trading started")
    except Exception as e:
        trading_state.is_running = False
        return SuccessResponse(success=False, message=str(e))

@app.post("/stop", response_model=SuccessResponse)
async def stop_trading():
    """자동매매 중지"""
    if not trading_state.is_running:
        return SuccessResponse(success=False, message="Not running")
    
    try:
        trading_state.is_running = False
        trading_state.last_update = datetime.now()
        
        # 실제 구현시 봇 중지
        # if trading_state.bot_thread:
        #     trading_state.bot_thread.join(timeout=5)
        
        return SuccessResponse(success=True, message="Trading stopped")
    except Exception as e:
        return SuccessResponse(success=False, message=str(e))

@app.post("/toggle-ai", response_model=SuccessResponse)
async def toggle_ai(request: ToggleAIRequest):
    """AI 기능 토글"""
    try:
        trading_state.ai_enabled = request.enabled
        trading_state.last_update = datetime.now()
        
        # 실행 중이면 봇 재시작
        if trading_state.is_running:
            # 실제 구현시 봇 재시작 로직
            pass
        
        return SuccessResponse(success=True, message=f"AI {'enabled' if request.enabled else 'disabled'}")
    except Exception as e:
        return SuccessResponse(success=False, message=str(e))

# WebSocket 엔드포인트 (실시간 데이터)
from fastapi import WebSocket
import json

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # 실시간 데이터 전송
            data = {
                "type": "status_update",
                "data": {
                    "is_running": trading_state.is_running,
                    "ai_enabled": trading_state.ai_enabled,
                    "timestamp": datetime.now().isoformat()
                }
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(1)  # 1초마다 업데이트
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)