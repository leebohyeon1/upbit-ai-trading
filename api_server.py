"""
FastAPI 서버 - 기존 자동매매 로직을 API로 제공
"""
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncio
import threading
from datetime import datetime

# 기존 모듈 임포트
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.strategy.decision import TradingEngine
from src.strategy.analyzer import SignalAnalyzer
from src.api.upbit_api import UpbitAPI
from src.api.claude_api import ClaudeAPI
from src.indicators.market import MarketIndicators
from src.indicators.technical import TechnicalIndicators
from src.utils.logger import Logger
from config.trading_config import *
import time
from dotenv import load_dotenv

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
        self.bot_threads = {}  # 코인별 스레드 관리
        self.last_update = datetime.now()
        self.trading_engines = {}  # 코인별 엔진 관리
        self.stop_flag = False
        self.logger = None
        self.active_tickers = []  # 활성 티커 목록
        
trading_state = TradingState()

# 요청/응답 모델
class StartTradingRequest(BaseModel):
    ai_enabled: bool = False
    ticker: Optional[str] = None  # 단일 코인 (deprecated)
    tickers: Optional[List[str]] = None  # 다중 코인 지원

class ToggleAIRequest(BaseModel):
    enabled: bool

class TradingStatusResponse(BaseModel):
    is_running: bool
    ai_enabled: bool
    active_tickers: List[str] = []
    ticker_status: Dict[str, Dict] = {}  # 각 티커별 상태

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
    ticker_status = {}
    for ticker in trading_state.active_tickers:
        ticker_status[ticker] = {
            "is_active": ticker in trading_state.bot_threads,
            "last_update": datetime.now().isoformat()
        }
    
    return TradingStatusResponse(
        is_running=trading_state.is_running,
        ai_enabled=trading_state.ai_enabled,
        active_tickers=trading_state.active_tickers,
        ticker_status=ticker_status
    )

def run_trading_bot_for_ticker(ticker: str):
    """특정 티커에 대한 트레이딩 봇 실행 함수"""
    logger_instance = None
    try:
        # 환경 설정 로드
        load_dotenv()
        
        # 로거 설정
        logger_instance = Logger()
        
        # API 인스턴스 생성
        upbit_api = UpbitAPI()
        claude_api = ClaudeAPI() if trading_state.ai_enabled else None
        
        # 분석기 인스턴스 생성
        market_indicators = MarketIndicators(upbit_api)
        technical_indicators = TechnicalIndicators()
        
        # 설정 딕셔너리 생성
        config = {
            "DECISION_THRESHOLDS": DECISION_THRESHOLDS,
            "INVESTMENT_RATIOS": INVESTMENT_RATIOS,
            "SIGNAL_STRENGTHS": SIGNAL_STRENGTHS,
            "INDICATOR_WEIGHTS": INDICATOR_WEIGHTS,
            "INDICATOR_USAGE": INDICATOR_USAGE,
            "TRADING_SETTINGS": TRADING_SETTINGS,
            "CLAUDE_SETTINGS": CLAUDE_SETTINGS,
            "HISTORICAL_SETTINGS": HISTORICAL_SETTINGS,
            "NOTIFICATION_SETTINGS": NOTIFICATION_SETTINGS
        }
        
        # SignalAnalyzer 생성
        signal_analyzer = SignalAnalyzer(
            config=config,
            technical_indicators=technical_indicators,
            market_indicators=market_indicators,
            claude_api=claude_api
        )
        
        # 트레이딩 엔진 생성
        trading_engine = TradingEngine(
            config=config,
            upbit_api=upbit_api,
            signal_analyzer=signal_analyzer
        )
        
        # 엔진을 전역 상태에 저장
        trading_state.trading_engines[ticker] = trading_engine
        
        # 트레이딩 루프 실행
        logger_instance.log_app(f"자동매매 시작 - 티커: {ticker}, AI: {trading_state.ai_enabled}")
        while not trading_state.stop_flag and ticker in trading_state.active_tickers:
            try:
                # analyze 메서드 실행 (MarketAnalyzer의 analyze 메서드 호출)
                analysis_result = signal_analyzer.analyze(ticker)
                
                # 거래 실행
                if analysis_result['decision'] != 'hold':
                    trading_engine.execute_trade(
                        ticker=ticker,
                        decision=analysis_result['decision'],
                        confidence=analysis_result['confidence'],
                        analysis_result=analysis_result
                    )
                
                # 대기
                time.sleep(60)  # 1분 대기
            except Exception as e:
                logger_instance.log_error(f"[{ticker}] 트레이딩 사이클 오류: {e}")
                time.sleep(60)
                
    except Exception as e:
        print(f"[{ticker}] 트레이딩 봇 실행 오류: {e}")
        if logger_instance:
            logger_instance.log_error(f"[{ticker}] 트레이딩 봇 실행 오류: {e}")
    finally:
        # 종료 시 정리
        if ticker in trading_state.bot_threads:
            del trading_state.bot_threads[ticker]
        if ticker in trading_state.trading_engines:
            del trading_state.trading_engines[ticker]
        
        # 모든 봇이 종료되면 전체 상태도 업데이트
        if not trading_state.bot_threads:
            trading_state.is_running = False

@app.post("/start", response_model=SuccessResponse)
async def start_trading(request: StartTradingRequest, background_tasks: BackgroundTasks):
    """자동매매 시작"""
    if trading_state.is_running:
        return SuccessResponse(success=False, message="Already running")
    
    try:
        # 티커 목록 처리 (하위 호환성 유지)
        tickers = request.tickers
        if not tickers and request.ticker:
            tickers = [request.ticker]
        
        if not tickers:
            return SuccessResponse(success=False, message="No tickers provided")
        
        trading_state.is_running = True
        trading_state.ai_enabled = request.ai_enabled
        trading_state.active_tickers = tickers
        trading_state.stop_flag = False
        trading_state.last_update = datetime.now()
        
        # 각 티커별로 별도 스레드에서 트레이딩 봇 실행
        for ticker in tickers:
            thread = threading.Thread(
                target=run_trading_bot_for_ticker,
                args=(ticker,),
                name=f"TradingBot-{ticker}"
            )
            thread.daemon = True
            thread.start()
            trading_state.bot_threads[ticker] = thread
        
        return SuccessResponse(
            success=True, 
            message=f"Trading started for {len(tickers)} coins: {', '.join(tickers)}"
        )
    except Exception as e:
        trading_state.is_running = False
        trading_state.active_tickers = []
        return SuccessResponse(success=False, message=str(e))

@app.post("/stop", response_model=SuccessResponse)
async def stop_trading():
    """자동매매 중지"""
    if not trading_state.is_running:
        return SuccessResponse(success=False, message="Not running")
    
    try:
        trading_state.stop_flag = True
        trading_state.last_update = datetime.now()
        
        # 모든 봇 스레드 종료 대기
        stopped_tickers = []
        for ticker, thread in list(trading_state.bot_threads.items()):
            thread.join(timeout=5)
            if not thread.is_alive():
                stopped_tickers.append(ticker)
        
        # 활성 티커 목록 초기화
        trading_state.active_tickers = []
        trading_state.bot_threads.clear()
        trading_state.trading_engines.clear()
        trading_state.is_running = False
        trading_state.stop_flag = False
        
        print(f"자동매매 중지 - 중지된 코인: {', '.join(stopped_tickers)}")
        
        return SuccessResponse(
            success=True, 
            message=f"Trading stopped for {len(stopped_tickers)} coins"
        )
    except Exception as e:
        return SuccessResponse(success=False, message=str(e))

@app.post("/toggle-ai", response_model=SuccessResponse)
async def toggle_ai(request: ToggleAIRequest):
    """AI 기능 토글"""
    try:
        trading_state.ai_enabled = request.enabled
        trading_state.last_update = datetime.now()
        
        # 실행 중이면 모든 봇 재시작
        if trading_state.is_running and trading_state.active_tickers:
            # 현재 실행 중인 티커 저장
            current_tickers = trading_state.active_tickers.copy()
            
            # 모든 봇 중지
            trading_state.stop_flag = True
            for ticker, thread in list(trading_state.bot_threads.items()):
                thread.join(timeout=5)
            
            # 정리
            trading_state.bot_threads.clear()
            trading_state.trading_engines.clear()
            
            # 새로운 설정으로 재시작
            trading_state.stop_flag = False
            for ticker in current_tickers:
                thread = threading.Thread(
                    target=run_trading_bot_for_ticker,
                    args=(ticker,),
                    name=f"TradingBot-{ticker}"
                )
                thread.daemon = True
                thread.start()
                trading_state.bot_threads[ticker] = thread
        
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