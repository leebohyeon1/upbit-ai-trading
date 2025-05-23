import os
import json
from datetime import datetime

class TradingEngine:
    """
    트레이딩 엔진 클래스
    신호 분석 결과를 바탕으로 실제 매매 결정 및 주문을 수행합니다.
    """
    
    def __init__(self, config, upbit_api, signal_analyzer):
        """
        트레이딩 엔진 초기화
        
        Args:
            config: 트레이딩 설정
            upbit_api: UpbitAPI 인스턴스
            signal_analyzer: SignalAnalyzer 인스턴스
        """
        self.config = config
        self.upbit_api = upbit_api
        self.signal_analyzer = signal_analyzer
        
        # 설정값 추출
        self.trading_settings = config.get("TRADING_SETTINGS", {})
        self.investment_ratios = config.get("INVESTMENT_RATIOS", {})
        self.enable_trade = os.getenv("ENABLE_TRADE", "false").lower() == "true"
        
        # 거래 기록
        self.trade_history = []
        
        # 거래 쿨다운 설정
        self.cooldown_settings = self.trading_settings.get("cooldown", {
            "enabled": True,
            "buy_minutes": 60,
            "sell_minutes": 30,
            "min_confidence_override": 0.85
        })
        
        # 마지막 거래 시간 (쿨다운 계산용)
        self.last_buy_time = None
        self.last_sell_time = None
    
    def get_market_data(self, ticker="KRW-BTC"):
        """
        시장 데이터 조회
        
        Args:
            ticker: 티커 (예: KRW-BTC)
            
        Returns:
            dict: 시장 데이터
        """
        # 기본 데이터 구조 정의
        market_data = {
            "current_price": None,
            "price_change_24h": "N/A"
        }
        
        # 1. 현재가 조회
        current_price = None
        try:
            current_price = self.upbit_api.get_current_price(ticker)
            if current_price is not None:
                print(f"현재가 조회 성공: {current_price}")
                market_data["current_price"] = [
                    {"market": ticker, "trade_price": current_price}
                ]
            else:
                print("현재가 조회 실패: None 반환")
        except Exception as e:
            print(f"현재가 조회 오류: {e}")
            
        # 2. 일봉 데이터 조회 (24시간 가격 변화율 계산용)
        try:
            ohlcv = self.upbit_api.get_ohlcv(ticker, interval="day", count=2)
            if ohlcv is not None and not ohlcv.empty and len(ohlcv) >= 2:
                print(f"일봉 데이터 조회 성공: {len(ohlcv)} 개 데이터")
                
                # 24시간 가격 변화율 계산
                prev_close = ohlcv['close'].iloc[-2]
                if current_price is not None and prev_close > 0:
                    price_change = ((current_price / prev_close) - 1) * 100
                    market_data["price_change_24h"] = f"{price_change:.2f}%"
                    print(f"24시간 가격 변화율: {market_data['price_change_24h']}")
            else:
                print("일봉 데이터 없거나 불충분")
        except Exception as e:
            print(f"일봉 데이터 조회 오류: {e}")
            
        # 3. 현재가가 없으면 데이터 표시 처리
        if market_data["current_price"] is None:
            # 현재가 없을 때는 윈시리스트 추가 - 나중에 재시도할 수 있도록
            market_data["current_price"] = [
                {"market": ticker, "trade_price": None, "error": "현재가 정보 없음"}
            ]
        
        print(f"반환되는 시장 데이터: {market_data}")
        return market_data
    
    def analyze_market(self, ticker="KRW-BTC"):
        """
        시장 분석 수행
        
        Args:
            ticker: 티커 (예: KRW-BTC)
            
        Returns:
            dict: 분석 결과
        """
        try:
            # 시장 데이터 조회
            market_data = self.get_market_data(ticker)
            
            # 신호 분석
            analysis_result = self.signal_analyzer.analyze(market_data, ticker)
            
            # 결과가 None인 경우 기본값 생성
            if analysis_result is None:
                print("분석 결과가 None입니다. 기본값을 생성합니다.")
                analysis_result = {
                    "decision": "hold",
                    "decision_kr": "홀드",
                    "confidence": 0.5,
                    "reasoning": "분석 결과가 없어 기본 홀드 상태로 설정합니다.",
                    "signals": [],
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "signal_counts": {"buy": 0, "sell": 0, "hold": 0},
                    "current_price": market_data.get("current_price"),
                    "price_change_24h": market_data.get("price_change_24h", "N/A")
                }
            
            # 분석 결과 로깅
            self._log_analysis(analysis_result)
            
            return analysis_result
        except Exception as e:
            print(f"분석 중 오류 발생: {e}")
            # 오류 발생 시 기본값 반환
            return {
                "decision": "hold",
                "decision_kr": "홀드",
                "confidence": 0.5,
                "reasoning": f"분석 오류: {str(e)}",
                "signals": [],
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "signal_counts": {"buy": 0, "sell": 0, "hold": 0},
                "current_price": None,
                "price_change_24h": "N/A"
            }
    
    def execute_trade(self, analysis_result, ticker="KRW-BTC"):
        """
        분석 결과에 따라 실제 거래 실행
        
        Args:
            analysis_result: 분석 결과 (dict)
            ticker: 티커 (예: KRW-BTC)
            
        Returns:
            dict: 거래 결과
        """
        
        # 입력 데이터 검증
        if not analysis_result or not isinstance(analysis_result, dict):
            return {"status": "error", "message": "유효하지 않은 분석 결과입니다."}
            
        if not self.enable_trade:
            return {"status": "disabled", "message": "거래 기능이 비활성화되어 있습니다."}
        
        decision = analysis_result.get("decision")
        confidence = analysis_result.get("confidence", 0.5)
        
        # 쿨다운 검사
        if self.cooldown_settings.get("enabled", True):
            cooldown_result = self._check_cooldown(decision, confidence)
            if cooldown_result.get("in_cooldown", False):
                return {
                    "status": "cooldown",
                    "message": cooldown_result.get("message"),
                    "remaining_minutes": cooldown_result.get("remaining_minutes", 0)
                }
        
        # 최소 주문 금액
        min_order_amount = self.trading_settings.get("min_order_amount", 5000)
        
        try:
            # 현재 잔고 조회
            krw_balance = self.upbit_api.get_balance("KRW")
            btc_balance = self.upbit_api.get_balance(ticker)
            
            # 현재가 조회 - 안전하게 처리
            current_price = None
            
            # 1. 분석 결과에서 현재가 추출 시도
            try:
                if analysis_result.get("current_price") and isinstance(analysis_result.get("current_price"), list) and len(analysis_result.get("current_price")) > 0:
                    current_price = analysis_result.get("current_price")[0].get("trade_price")
                    print(f"분석 결과에서 추출한 현재가: {current_price}")
            except Exception as e:
                print(f"분석 결과에서 현재가 추출 오류: {e}")
                
            # 2. current_price가 None이면 직접 API로 조회 시도
            if not current_price:
                try:
                    current_price = self.upbit_api.get_current_price(ticker)
                    print(f"API에서 직접 조회한 현재가: {current_price}")
                except Exception as e:
                    print(f"API에서 현재가 조회 오류: {e}")
            
            # 3. 여전히 None이면 거래 실패
            if not current_price:
                print("현재가 정보를 가져올 수 없어 거래를 중단합니다.")
                return {"status": "error", "message": "현재가 정보를 가져올 수 없습니다."}
            
            # 투자 비율 계산 (신뢰도에 따라 조정)
            min_ratio = self.investment_ratios.get("min_ratio", 0.1)
            max_ratio = self.investment_ratios.get("max_ratio", 0.5)
            
            # 신뢰도에 따른 투자 비율 결정 (선형 보간)
            investment_ratio = min_ratio + (max_ratio - min_ratio) * (confidence - 0.5) * 2
            investment_ratio = max(min_ratio, min(max_ratio, investment_ratio))
            
            # 매매 실행
            trade_result = {"status": "no_action", "message": "조건에 맞는 거래가 없습니다."}
            
            if decision == "buy" and krw_balance > min_order_amount:
                # 매수할 금액 계산
                buy_amount = krw_balance * investment_ratio
                
                # 최소 주문 금액 확인
                if buy_amount < min_order_amount:
                    buy_amount = min_order_amount
                
                # 최대 가용 금액 확인
                buy_amount = min(buy_amount, krw_balance)
                
                # 시장가 매수 주문
                order = self.upbit_api.buy_market_order(ticker, buy_amount)
                
                # 매수 시간 기록 (쿨다운용)
                self.last_buy_time = datetime.now()
                
                # 거래 기록 저장
                trade_info = {
                    "type": "buy",
                    "ticker": ticker,
                    "price": current_price,
                    "amount": buy_amount / current_price,
                    "total": buy_amount,
                    "timestamp": self.last_buy_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence": confidence,
                    "order_id": order.get("uuid")
                }
                
                self.trade_history.append(trade_info)
                self._log_trade(trade_info)
                
                trade_result = {
                    "status": "success",
                    "action": "buy",
                    "amount": buy_amount,
                    "price": current_price,
                    "message": f"{ticker} {buy_amount:.0f}원 매수 완료"
                }
                
            elif decision == "sell" and btc_balance > 0:
                # 전체 보유량의 일부만 매도
                sell_amount = btc_balance * investment_ratio
                
                # 최소 금액 확인 (현재가 기준)
                if sell_amount * current_price < min_order_amount and btc_balance * current_price >= min_order_amount:
                    sell_amount = min_order_amount / current_price
                
                # 시장가 매도 주문
                if sell_amount > 0:
                    order = self.upbit_api.sell_market_order(ticker, sell_amount)
                    
                    # 매도 시간 기록 (쿨다운용)
                    self.last_sell_time = datetime.now()
                    
                    # 거래 기록 저장
                    trade_info = {
                        "type": "sell",
                        "ticker": ticker,
                        "price": current_price,
                        "amount": sell_amount,
                        "total": sell_amount * current_price,
                        "timestamp": self.last_sell_time.strftime("%Y-%m-%d %H:%M:%S"),
                        "confidence": confidence,
                        "order_id": order.get("uuid")
                    }
                    
                    self.trade_history.append(trade_info)
                    self._log_trade(trade_info)
                    
                    trade_result = {
                        "status": "success",
                        "action": "sell",
                        "amount": sell_amount,
                        "price": current_price,
                        "message": f"{ticker} {sell_amount:.8f} BTC 매도 완료"
                    }
            
            return trade_result
        
        except Exception as e:
            error_msg = f"거래 실행 오류: {e}"
            print(error_msg)
            return {"status": "error", "message": error_msg}
    
    def _log_analysis(self, analysis_result):
        """
        분석 결과 로깅
        
        Args:
            analysis_result: 분석 결과 (dict)
        """
        try:
            # None 체크 추가
            if analysis_result is None:
                print("로깅할 분석 결과가 없습니다.")
                return
                
            # 로그 디렉토리 확인
            if not os.path.exists("logs"):
                os.makedirs("logs")
            
            # 로그 파일명 (일자별)
            log_date = datetime.now().strftime("%Y%m%d")
            log_file = f"logs/trading_log_{log_date}.json"
            
            # 기존 로그 파일 읽기
            log_data = []
            if os.path.exists(log_file):
                with open(log_file, "r", encoding="utf-8") as f:
                    try:
                        log_data = json.load(f)
                    except json.JSONDecodeError:
                        log_data = []
            
            # 로그 데이터에 필요한 기본 필드가 있는지 확인
            if "signals" not in analysis_result:
                analysis_result["signals"] = []
            if "signal_counts" not in analysis_result:
                analysis_result["signal_counts"] = {"buy": 0, "sell": 0, "hold": 0}
            
            # 로그 데이터 추가 - 결정 이유는 줄바꿈으로 포매팅
            if 'reasoning' in analysis_result and analysis_result['reasoning'] is not None:
                analysis_result['reasoning_lines'] = analysis_result['reasoning'].split('\n')
            
            log_data.append(analysis_result)
            
            # 로그 파일 쓰기
            with open(log_file, "w", encoding="utf-8") as f:
                json.dump(log_data, f, ensure_ascii=False, indent=2)
                
            # 클라우드 로깅 시도 (Logger 클래스 사용)
            try:
                from utils import Logger
                logger = Logger()
                if hasattr(logger, '_log_to_cloud') and logger.use_cloud:
                    # 로그에 추가 정보 기록
                    cloud_data = analysis_result.copy()
                    # 불필요한 큰 데이터 제거
                    if 'reasoning_lines' in cloud_data:
                        del cloud_data['reasoning_lines']
                    
                    # 메시지 생성
                    decision = analysis_result.get('decision', 'unknown')
                    confidence = analysis_result.get('confidence', 0)
                    message = f"분석 결과: {decision} (신뢰도: {confidence:.2f})"
                    
                    # 클라우드 로깅
                    logger._log_to_cloud('analysis', message, 'info', cloud_data)
            except Exception as e:
                print(f"클라우드 로깅 오류: {e}")
        
        except Exception as e:
            print(f"로그 저장 오류: {e}")
    
    def _log_trade(self, trade_info):
        """
        거래 정보 로깅
        
        Args:
            trade_info: 거래 정보 (dict)
        """
        try:
            # 로그 디렉토리 확인
            if not os.path.exists("logs"):
                os.makedirs("logs")
            
            # 로그 파일명 (일자별)
            log_date = datetime.now().strftime("%Y%m%d")
            log_file = f"logs/trade_history_{log_date}.json"
            
            # 기존 로그 파일 읽기
            trade_log = []
            if os.path.exists(log_file):
                with open(log_file, "r", encoding="utf-8") as f:
                    try:
                        trade_log = json.load(f)
                    except json.JSONDecodeError:
                        trade_log = []
            
            # 로그 데이터 추가
            trade_log.append(trade_info)
            
            # 로그 파일 쓰기
            with open(log_file, "w", encoding="utf-8") as f:
                json.dump(trade_log, f, ensure_ascii=False, indent=2)
                
            # 클라우드 로깅 시도 (Logger 클래스 사용)
            try:
                from utils import Logger
                logger = Logger()
                if hasattr(logger, '_log_to_cloud') and logger.use_cloud:
                    # 메시지 생성
                    trade_type = trade_info.get('type', 'unknown')
                    ticker = trade_info.get('ticker', '')
                    amount = trade_info.get('amount', 0)
                    price = trade_info.get('price', 0)
                    total = trade_info.get('total', 0)
                    
                    message = f"{trade_type.upper()} 거래 실행: {ticker} {total:,.0f}원 ({amount:,.8f} BTC @ {price:,.0f}원)"
                    
                    # 클라우드 로깅
                    logger._log_to_cloud('trade', message, 'info', trade_info)
            except Exception as e:
                print(f"클라우드 로깅 오류: {e}")
        
        except Exception as e:
            print(f"거래 로그 저장 오류: {e}")
    
    def get_trading_stats(self):
        """
        트레이딩 통계 정보 조회
        
        Returns:
            dict: 트레이딩 통계
        """
        try:
            stats = {
                "total_trades": len(self.trade_history),
                "buy_count": 0,
                "sell_count": 0,
                "total_buy_amount": 0,
                "total_sell_amount": 0,
                "avg_buy_price": 0,
                "avg_sell_price": 0,
                "last_trade": None
            }
            
            # 거래 정보 분석
            for trade in self.trade_history:
                if trade["type"] == "buy":
                    stats["buy_count"] += 1
                    stats["total_buy_amount"] += trade["total"]
                elif trade["type"] == "sell":
                    stats["sell_count"] += 1
                    stats["total_sell_amount"] += trade["total"]
            
            # 평균 가격 계산
            if stats["buy_count"] > 0:
                stats["avg_buy_price"] = stats["total_buy_amount"] / stats["buy_count"]
            
            if stats["sell_count"] > 0:
                stats["avg_sell_price"] = stats["total_sell_amount"] / stats["sell_count"]
            
            # 마지막 거래 정보
            if self.trade_history:
                stats["last_trade"] = self.trade_history[-1]
            
            return stats
        
        except Exception as e:
            print(f"트레이딩 통계 계산 오류: {e}")
            return {"error": str(e)}
    
    def _check_cooldown(self, decision, confidence):
        """
        거래 쿨다운 상태 확인
        
        Args:
            decision: 거래 결정 (buy, sell, hold)
            confidence: 신뢰도 (0.0 ~ 1.0)
            
        Returns:
            dict: 쿨다운 확인 결과
                {"in_cooldown": True/False, "message": "쿨다운 메시지", "remaining_minutes": 남은 쿨다운 시간}
        """
        # 쿨다운 설정이 비활성화된 경우
        if not self.cooldown_settings.get("enabled", True):
            return {"in_cooldown": False}
        
        # 높은 신뢰도 신호(긴급 신호)
        min_confidence_override = self.cooldown_settings.get("min_confidence_override", 0.85)
        if confidence >= min_confidence_override:
            return {"in_cooldown": False, "message": f"높은 신뢰도({confidence:.2%}) 신호 - 쿨다운 무시"}
        
        # 현재 시간
        now = datetime.now()
        
        # 매수 쿨다운 확인
        if decision == "buy" and self.last_buy_time is not None:
            buy_cooldown_minutes = self.cooldown_settings.get("buy_minutes", 60)
            elapsed_minutes = (now - self.last_buy_time).total_seconds() / 60
            
            if elapsed_minutes < buy_cooldown_minutes:
                remaining_minutes = buy_cooldown_minutes - elapsed_minutes
                return {
                    "in_cooldown": True,
                    "message": f"매수 쿨다운 중 (\uB0A8은 시간: {remaining_minutes:.1f}분)",
                    "remaining_minutes": remaining_minutes
                }
        
        # 매도 쿨다운 확인
        if decision == "sell" and self.last_sell_time is not None:
            sell_cooldown_minutes = self.cooldown_settings.get("sell_minutes", 30)
            elapsed_minutes = (now - self.last_sell_time).total_seconds() / 60
            
            if elapsed_minutes < sell_cooldown_minutes:
                remaining_minutes = sell_cooldown_minutes - elapsed_minutes
                return {
                    "in_cooldown": True,
                    "message": f"매도 쿨다운 중 (\uB0A8은 시간: {remaining_minutes:.1f}분)",
                    "remaining_minutes": remaining_minutes
                }
        
        # 쿨다운 아님
        return {"in_cooldown": False}
    
    def start_trading_loop(self, ticker="KRW-BTC", interval_minutes=None):
        """
        트레이딩 루프 시작
        
        Args:
            ticker: 티커 (예: KRW-BTC)
            interval_minutes: 트레이딩 간격 (분) (None이면 설정 파일에서 가져옴)
        
        Note:
            이 메서드는 일반적으로 별도의 스레드나 스케줄러에서 실행됩니다.
        """
        import time
        
        # 트레이딩 간격 설정
        if interval_minutes is None:
            interval_minutes = self.trading_settings.get("trading_interval", 60)
        
        interval_seconds = interval_minutes * 60
        
        print(f"트레이딩 루프 시작 (간격: {interval_minutes}분)")
        
        try:
            while True:
                # 현재 시간
                now = datetime.now()
                
                # 트레이딩 시간대 제한 확인
                trading_hours = self.trading_settings.get("trading_hours", {})
                trading_time_enabled = trading_hours.get("enabled", False)
                
                execute_trade = True
                
                if trading_time_enabled:
                    start_hour = trading_hours.get("start_hour", 9)
                    end_hour = trading_hours.get("end_hour", 23)
                    current_hour = now.hour
                    
                    # 설정된 시간대가 아니면 거래 실행 안 함
                    if current_hour < start_hour or current_hour > end_hour:
                        execute_trade = False
                        print(f"트레이딩 시간대 아님 (현재: {current_hour}시, 설정: {start_hour}-{end_hour}시)")
                
                if execute_trade:
                    try:
                        # 시장 분석
                        analysis_result = self.analyze_market(ticker)
                        
                        print(f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] 분석 결과: " + 
                              f"{analysis_result.get('decision')} " + 
                              f"(신뢰도: {analysis_result.get('confidence', 0):.2f})")
                        
                        # 실제 거래 실행
                        if self.enable_trade:
                            trade_result = self.execute_trade(analysis_result, ticker)
                            print(f"거래 결과: {trade_result}")
                            
                            # 쿨다운 관련 로깅
                            if trade_result.get("status") == "cooldown":
                                message = trade_result.get("message", "쿨다운 중")
                                remaining = trade_result.get("remaining_minutes", 0)
                                print(f"쿨다운 상태: {message} (남은 시간: {remaining:.1f}분)")
                            elif trade_result.get("status") == "success":
                                # 성공한 거래일 경우, 다음 쿨다운 정보 추가
                                action = trade_result.get("action")
                                if action == "buy":
                                    cooldown_mins = self.cooldown_settings.get("buy_minutes", 60)
                                    print(f"매수 성공: 다음 매수까지 {cooldown_mins}분 쿨다운")
                                elif action == "sell":
                                    cooldown_mins = self.cooldown_settings.get("sell_minutes", 30)
                                    print(f"매도 성공: 다음 매도까지 {cooldown_mins}분 쿨다운")
                    
                    except Exception as e:
                        print(f"트레이딩 루프 오류: {e}")
                
                # 다음 실행 시간까지 대기
                time.sleep(interval_seconds)
        
        except KeyboardInterrupt:
            print("트레이딩 루프 종료 (키보드 인터럽트)")