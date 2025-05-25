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
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    print("Shutting down trading bots...")
    
    # 모든 봇 중지
    trading_state.stop_flag = True
    
    # WebSocket 클라이언트 정리
    for websocket in list(trading_state.websocket_clients):
        try:
            await websocket.close()
        except:
            pass
    trading_state.websocket_clients.clear()
    
    # 봇 스레드 종료 대기 (non-blocking)
    import asyncio
    await asyncio.sleep(0.1)  # 약간의 대기 시간
    
    print("Shutdown complete")

app = FastAPI(title="Upbit AI Trading API", lifespan=lifespan)

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
        self.api_keys = {
            'upbit_access_key': None,
            'upbit_secret_key': None,
            'anthropic_api_key': None
        }
        self.websocket_clients = set()  # WebSocket 클라이언트 관리
        self.enable_real_trade = False  # 실제 거래 활성화 상태
        
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

class ApiKeysRequest(BaseModel):
    upbit_access_key: str
    upbit_secret_key: str
    anthropic_api_key: Optional[str] = None
    enable_real_trade: Optional[bool] = False

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
        if trading_state.api_keys['upbit_access_key'] and trading_state.api_keys['upbit_secret_key']:
            # API 키가 설정되어 있으면 환경 변수로 설정
            os.environ['UPBIT_ACCESS_KEY'] = trading_state.api_keys['upbit_access_key']
            os.environ['UPBIT_SECRET_KEY'] = trading_state.api_keys['upbit_secret_key']
            if trading_state.api_keys['anthropic_api_key']:
                os.environ['CLAUDE_API_KEY'] = trading_state.api_keys['anthropic_api_key']
        else:
            # API 키가 없으면 .env 파일에서 로드
            load_dotenv()
        
        # 로거 설정
        logger_instance = Logger()
        
        # API 인스턴스 생성
        upbit_api = UpbitAPI()
        claude_api = None
        if trading_state.ai_enabled:
            claude_api_key = trading_state.api_keys.get('anthropic_api_key') or os.getenv('CLAUDE_API_KEY')
            if claude_api_key:
                claude_api = ClaudeAPI(api_key=claude_api_key)
            else:
                logger_instance.log_error("Claude API 키가 설정되지 않았습니다. AI 분석을 사용할 수 없습니다.")
                claude_api = None
        
        # 분석기 인스턴스 생성
        market_indicators = MarketIndicators(upbit_api)
        technical_indicators = TechnicalIndicators()
        
        # 설정 딕셔너리 생성
        # AI가 활성화되면 CLAUDE_SETTINGS의 use_claude도 True로 설정
        claude_settings = CLAUDE_SETTINGS.copy()
        if trading_state.ai_enabled:
            claude_settings["use_claude"] = True
            
        config = {
            "DECISION_THRESHOLDS": DECISION_THRESHOLDS,
            "INVESTMENT_RATIOS": INVESTMENT_RATIOS,
            "SIGNAL_STRENGTHS": SIGNAL_STRENGTHS,
            "INDICATOR_WEIGHTS": INDICATOR_WEIGHTS,
            "INDICATOR_USAGE": INDICATOR_USAGE,
            "TRADING_SETTINGS": TRADING_SETTINGS,
            "CLAUDE_SETTINGS": claude_settings,
            "HISTORICAL_SETTINGS": HISTORICAL_SETTINGS,
            "NOTIFICATION_SETTINGS": NOTIFICATION_SETTINGS,
            "enable_real_trade": trading_state.enable_real_trade
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
            # 루프 시작 시 종료 조건 재확인
            if trading_state.stop_flag or ticker not in trading_state.active_tickers:
                print(f"[{ticker}] 루프 중지 신호 감지 - stop_flag: {trading_state.stop_flag}, active: {ticker in trading_state.active_tickers}")
                break
            try:
                # 현재 시장 데이터 가져오기
                current_price = upbit_api.get_current_price(ticker)
                orderbook = upbit_api.get_orderbook(ticker)
                
                # 데이터 유효성 검사
                if current_price is None:
                    logger_instance.log_error(f"[{ticker}] 현재가 조회 실패")
                    time.sleep(60)
                    continue
                    
                if orderbook is None:
                    logger_instance.log_error(f"[{ticker}] 오더북 조회 실패")
                    time.sleep(60)
                    continue
                
                market_data = {
                    "ticker": ticker,
                    "current_price": current_price,
                    "orderbook": orderbook
                }
                
                # analyze 메서드 실행
                # SignalAnalyzer.analyze(market_data, ticker) 형태로 호출
                analysis_result = signal_analyzer.analyze(market_data, ticker)
                
                # analysis_result가 None인지 확인
                if analysis_result is None:
                    logger_instance.log_error(f"[{ticker}] 분석 결과가 None입니다.")
                    time.sleep(60)
                    continue
                
                # 분석 결과를 WebSocket으로 전송
                analysis_update = {
                    "ticker": ticker,
                    "decision": analysis_result.get('decision', 'hold'),
                    "confidence": analysis_result.get('confidence', 0),
                    "reason": analysis_result.get('reasoning', analysis_result.get('reason', '분석 중...')),
                    "timestamp": datetime.now().isoformat()
                }
                
                # 모든 WebSocket 클라이언트에 전송
                # 새로운 태스크로 생성하여 비동기 실행
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(broadcast_analysis_update(analysis_update))
                loop.close()
                
                # 거래 실행
                if analysis_result.get('decision') != 'hold':
                    logger_instance.log_app(f"[{ticker}] 거래 신호 감지 - 결정: {analysis_result.get('decision')}, 신뢰도: {analysis_result.get('confidence', 0):.2f}")
                    trade_result = trading_engine.execute_trade(
                        analysis_result=analysis_result,
                        ticker=ticker
                    )
                    if trade_result:
                        logger_instance.log_app(f"[{ticker}] 거래 결과: {trade_result}")
                else:
                    logger_instance.log_app(f"[{ticker}] 홀드 결정 - 신뢰도: {analysis_result.get('confidence', 0):.2f}")
                
                # 대기 (중지 플래그 확인을 위해 짧은 간격으로 나누어 대기)
                for _ in range(60):  # 1초씩 60번 = 1분
                    if trading_state.stop_flag or ticker not in trading_state.active_tickers:
                        break
                    time.sleep(1)
            except Exception as e:
                logger_instance.log_error(f"[{ticker}] 트레이딩 사이클 오류: {e}")
                import traceback
                traceback.print_exc()
                # 오류 발생 시에도 짧은 간격으로 대기
                for _ in range(60):
                    if trading_state.stop_flag or ticker not in trading_state.active_tickers:
                        break
                    time.sleep(1)
                
    except Exception as e:
        import traceback
        print(f"[{ticker}] 트레이딩 봇 실행 오류: {e}")
        print(f"[{ticker}] 상세 오류 정보:")
        traceback.print_exc()
        if logger_instance:
            logger_instance.log_error(f"[{ticker}] 트레이딩 봇 실행 오류: {e}")
            logger_instance.log_error(f"[{ticker}] 트레이스백: {traceback.format_exc()}")
    finally:
        # 종료 시 정리
        print(f"[{ticker}] 트레이딩 봇 종료됨")
        if logger_instance:
            logger_instance.log_app(f"[{ticker}] 트레이딩 봇 종료")
        
        if ticker in trading_state.bot_threads:
            del trading_state.bot_threads[ticker]
        if ticker in trading_state.trading_engines:
            del trading_state.trading_engines[ticker]
        
        # 모든 봇이 종료되면 전체 상태도 업데이트
        if not trading_state.bot_threads:
            trading_state.is_running = False
            print("모든 트레이딩 봇이 종료되어 전체 자동매매 상태를 중지로 변경했습니다.")

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
        
        # 활성 티커 목록을 먼저 비우기 (스레드 루프 종료 신호)
        stopped_tickers = trading_state.active_tickers.copy()
        trading_state.active_tickers = []
        
        # 모든 봇 스레드 종료 대기
        for ticker, thread in list(trading_state.bot_threads.items()):
            thread.join(timeout=2)  # 타임아웃 단축
        
        # 정리
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
            print(f"AI 모드 변경: {request.enabled} - 기존 봇들을 재시작합니다.")
            
            # 현재 실행 중인 티커 저장
            current_tickers = trading_state.active_tickers.copy()
            
            # 1단계: 모든 봇에게 중지 신호 전송
            trading_state.stop_flag = True
            
            # 2단계: active_tickers를 비워서 루프 종료 조건 만족
            trading_state.active_tickers = []
            
            # 3단계: 모든 스레드가 완전히 종료될 때까지 대기 (최대 15초)
            print("기존 트레이딩 봇 종료 대기 중...")
            for ticker, thread in list(trading_state.bot_threads.items()):
                print(f"  - {ticker} 봇 종료 대기...")
                thread.join(timeout=15)  # 더 긴 대기 시간
                if thread.is_alive():
                    print(f"  - 경고: {ticker} 봇이 15초 내에 종료되지 않았습니다.")
                else:
                    print(f"  - {ticker} 봇 정상 종료 완료")
            
            # 4단계: 리소스 정리
            trading_state.bot_threads.clear()
            trading_state.trading_engines.clear()
            
            # 5단계: 잠시 대기 (완전한 정리를 위해)
            await asyncio.sleep(1)
            
            # 6단계: 새로운 설정으로 재시작
            print("새로운 AI 설정으로 트레이딩 봇 재시작...")
            trading_state.stop_flag = False
            trading_state.active_tickers = current_tickers
            
            for ticker in current_tickers:
                print(f"  - {ticker} 봇 시작 중...")
                thread = threading.Thread(
                    target=run_trading_bot_for_ticker,
                    args=(ticker,),
                    name=f"TradingBot-{ticker}"
                )
                thread.daemon = True
                thread.start()
                trading_state.bot_threads[ticker] = thread
            
            print(f"AI 모드 변경 완료: {len(current_tickers)}개 봇이 재시작되었습니다.")
        
        return SuccessResponse(success=True, message=f"AI {'enabled' if request.enabled else 'disabled'}")
    except Exception as e:
        print(f"AI 토글 오류: {e}")
        return SuccessResponse(success=False, message=str(e))

class ToggleRealTradeRequest(BaseModel):
    enabled: bool

@app.post("/toggle-real-trade", response_model=SuccessResponse)
async def toggle_real_trade(request: ToggleRealTradeRequest):
    """실제 거래 기능 토글"""
    try:
        trading_state.enable_real_trade = request.enabled
        
        # 환경 변수로도 설정 (기존 코드와의 호환성)
        os.environ['ENABLE_REAL_TRADE'] = 'true' if request.enabled else 'false'
        
        # 실행 중인 모든 트레이딩 엔진의 enable_trade 속성 업데이트
        for ticker, engine in trading_state.trading_engines.items():
            engine.enable_trade = request.enabled
            engine.logger.log_app(f"실제 거래 활성화: {request.enabled}")
        
        return SuccessResponse(
            success=True, 
            message=f"Real trading {'enabled' if request.enabled else 'disabled'}"
        )
    except Exception as e:
        return SuccessResponse(success=False, message=str(e))

# WebSocket 엔드포인트 (실시간 데이터)
from fastapi import WebSocket
import json

@app.post("/set-api-keys", response_model=SuccessResponse)
async def set_api_keys(request: ApiKeysRequest):
    """API 키 설정"""
    try:
        trading_state.api_keys['upbit_access_key'] = request.upbit_access_key
        trading_state.api_keys['upbit_secret_key'] = request.upbit_secret_key
        trading_state.api_keys['anthropic_api_key'] = request.anthropic_api_key
        trading_state.enable_real_trade = request.enable_real_trade
        
        # 환경 변수로도 설정
        os.environ['UPBIT_ACCESS_KEY'] = request.upbit_access_key
        os.environ['UPBIT_SECRET_KEY'] = request.upbit_secret_key
        os.environ['ENABLE_REAL_TRADE'] = 'true' if request.enable_real_trade else 'false'
        if request.anthropic_api_key:
            os.environ['ANTHROPIC_API_KEY'] = request.anthropic_api_key
        
        return SuccessResponse(success=True, message="API keys set successfully")
    except Exception as e:
        return SuccessResponse(success=False, message=str(e))

# WebSocket 브로드캐스트 함수
async def broadcast_analysis_update(analysis_data):
    """WebSocket 클라이언트들에게 분석 업데이트 전송"""
    message = json.dumps({
        "type": "analysis_update",
        "data": analysis_data
    })
    
    disconnected = set()
    for websocket in trading_state.websocket_clients:
        try:
            await websocket.send_text(message)
        except:
            disconnected.add(websocket)
    
    # 연결이 끊긴 클라이언트 제거
    for websocket in disconnected:
        if websocket in trading_state.websocket_clients:
            trading_state.websocket_clients.remove(websocket)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    trading_state.websocket_clients.add(websocket)
    
    try:
        while True:
            # 실시간 상태 업데이트 전송
            data = {
                "type": "status_update",
                "data": {
                    "is_running": trading_state.is_running,
                    "ai_enabled": trading_state.ai_enabled,
                    "active_tickers": trading_state.active_tickers,
                    "timestamp": datetime.now().isoformat()
                }
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(5)  # 5초마다 상태 업데이트
    except asyncio.CancelledError:
        # 정상적인 종료
        pass
    except Exception as e:
        if not isinstance(e, (ConnectionResetError, ConnectionAbortedError)):
            print(f"WebSocket error: {e}")
    finally:
        # 클라이언트 목록에서 제거
        if websocket in trading_state.websocket_clients:
            trading_state.websocket_clients.remove(websocket)
        # WebSocket이 이미 닫혔는지 확인
        try:
            await websocket.close()
        except:
            pass  # 이미 닫혀있으면 무시

if __name__ == "__main__":
    import uvicorn
    
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            loop="asyncio",
            access_log=False  # 액세스 로그 비활성화로 깔끔한 출력
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")