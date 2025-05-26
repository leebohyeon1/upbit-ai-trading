import crypto from 'crypto';
import axios from 'axios';

export interface UpbitTicker {
  market: string;
  trade_price: number;
  change: string;
  change_rate: number;
  change_price: number;
  high_price: number;
  low_price: number;
  acc_trade_volume_24h: number;
  acc_trade_price_24h: number;
  timestamp: number;
}

export interface CandleData {
  market: string;
  candle_date_time_utc: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
}

class UpbitService {
  private accessKey: string = '';
  private secretKey: string = '';
  private baseURL = 'https://api.upbit.com';

  setApiKeys(accessKey: string, secretKey: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }

  private generateAuthToken(query?: string): string {
    if (!this.accessKey || !this.secretKey) {
      throw new Error('API keys not set');
    }

    const payload: any = {
      access_key: this.accessKey,
      nonce: crypto.randomUUID(),
    };

    if (query) {
      const queryHash = crypto.createHash('sha512').update(query, 'utf-8').digest('hex');
      payload.query_hash = queryHash;
      payload.query_hash_alg = 'SHA512';
    }

    // JWT 생성
    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'HS256' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${header}.${payloadStr}`)
      .digest('base64url');

    return `Bearer ${header}.${payloadStr}.${signature}`;
  }

  // 마켓 정보 조회 (공개 API)
  async getMarkets(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/market/all`);
      return response.data.filter((market: any) => market.market.startsWith('KRW-'));
    } catch (error) {
      console.error('Failed to get markets:', error);
      return [];
    }
  }

  // 현재가 조회 (공개 API)
  async getTickers(markets: string[]): Promise<UpbitTicker[]> {
    try {
      const marketString = markets.join(',');
      const response = await axios.get(`${this.baseURL}/v1/ticker`, {
        params: { markets: marketString }
      });
      
      return response.data.map((ticker: any) => ({
        market: ticker.market,
        trade_price: ticker.trade_price,
        change_rate: ticker.change_rate,
        acc_trade_volume_24h: ticker.acc_trade_volume_24h,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to get tickers:', error);
      return [];
    }
  }

  // 단일 마켓 현재가 조회
  async getTicker(market: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/ticker`, {
        params: { markets: market }
      });
      return response.data[0];
    } catch (error) {
      console.error('Failed to get ticker:', error);
      return null;
    }
  }

  // 캔들 데이터 조회 (공개 API)
  async getCandles(market: string, count: number = 200): Promise<CandleData[]> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/candles/minutes/5`, {
        params: { market, count }
      });
      
      return response.data.map((candle: any) => ({
        market: candle.market,
        candle_date_time_utc: candle.candle_date_time_utc,
        opening_price: candle.opening_price,
        high_price: candle.high_price,
        low_price: candle.low_price,
        trade_price: candle.trade_price,
        candle_acc_trade_volume: candle.candle_acc_trade_volume
      }));
    } catch (error) {
      console.error('Failed to get candles:', error);
      return [];
    }
  }

  // 계좌 조회 (인증 필요)
  async getAccounts(): Promise<any[]> {
    try {
      const authToken = this.generateAuthToken();
      const response = await axios.get(`${this.baseURL}/v1/accounts`, {
        headers: { Authorization: authToken }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }

  // 주문 조회 (인증 필요)
  async getOrders(market?: string): Promise<any[]> {
    try {
      const query = market ? `market=${market}&state=wait` : 'state=wait';
      const authToken = this.generateAuthToken(query);
      
      const response = await axios.get(`${this.baseURL}/v1/orders`, {
        params: market ? { market, state: 'wait' } : { state: 'wait' },
        headers: { Authorization: authToken }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get orders:', error);
      return [];
    }
  }

  // 매수 주문 (인증 필요)
  async buyOrder(market: string, price: string, volume?: string): Promise<any> {
    try {
      const params: any = {
        market,
        side: 'bid',
        ord_type: volume ? 'limit' : 'price',
        price
      };
      
      if (volume) {
        params.volume = volume;
      }

      const query = new URLSearchParams(params).toString();
      const authToken = this.generateAuthToken(query);

      const response = await axios.post(`${this.baseURL}/v1/orders`, params, {
        headers: { Authorization: authToken }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to place buy order:', error);
      throw error;
    }
  }

  // 매도 주문 (인증 필요)
  async sellOrder(market: string, volume: string, price?: string): Promise<any> {
    try {
      const params: any = {
        market,
        side: 'ask',
        ord_type: price ? 'limit' : 'market',
        volume
      };
      
      if (price) {
        params.price = price;
      }

      const query = new URLSearchParams(params).toString();
      const authToken = this.generateAuthToken(query);

      const response = await axios.post(`${this.baseURL}/v1/orders`, params, {
        headers: { Authorization: authToken }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to place sell order:', error);
      throw error;
    }
  }

  // 호가 정보 조회
  async getOrderbook(market: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/orderbook`, {
        params: { markets: market }
      });
      return response.data[0];
    } catch (error) {
      console.error('Failed to get orderbook:', error);
      return null;
    }
  }

  // 체결 내역 조회
  async getTrades(market: string, count: number = 20): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/v1/trades/ticks`, {
        params: { market, count }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get trades:', error);
      return [];
    }
  }

  // 김치 프리미엄 계산
  async getKimchiPremium(market: string): Promise<number> {
    try {
      // 코인 심볼 추출 (KRW-BTC -> BTC)
      const symbol = market.split('-')[1];
      
      // 환율 정보 가져오기
      const exchangeRateResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      const usdToKrw = exchangeRateResponse.data.rates.KRW;
      
      // Binance 가격 가져오기
      const binanceSymbol = symbol === 'BTC' ? 'BTCUSDT' : `${symbol}USDT`;
      const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
        params: { symbol: binanceSymbol }
      });
      const usdPrice = parseFloat(binanceResponse.data.price);
      const krwPriceBinance = usdPrice * usdToKrw;
      
      // Upbit 가격 가져오기
      const upbitResponse = await axios.get(`${this.baseURL}/v1/ticker`, {
        params: { markets: market }
      });
      const krwPriceUpbit = upbitResponse.data[0].trade_price;
      
      // 김프 계산
      const kimchiPremium = ((krwPriceUpbit - krwPriceBinance) / krwPriceBinance) * 100;
      
      return kimchiPremium;
    } catch (error) {
      console.error('Failed to calculate kimchi premium:', error);
      return 0; // 에러 시 0 반환
    }
  }

  // 공포/탐욕 지수 (간단한 계산)
  calculateFearGreedIndex(rsi: number, volumeRatio: number, priceChange24h: number): number {
    // RSI 기반 점수 (0-100)
    let rsiScore = 0;
    if (rsi < 30) rsiScore = 20; // 극도의 공포
    else if (rsi < 40) rsiScore = 35; // 공포
    else if (rsi < 60) rsiScore = 50; // 중립
    else if (rsi < 70) rsiScore = 65; // 탐욕
    else rsiScore = 80; // 극도의 탐욕
    
    // 거래량 기반 점수
    let volumeScore = 50;
    if (volumeRatio > 2) volumeScore = 70; // 높은 관심
    else if (volumeRatio > 1.5) volumeScore = 60;
    else if (volumeRatio < 0.5) volumeScore = 30; // 낮은 관심
    
    // 가격 변화 기반 점수
    let priceScore = 50;
    if (priceChange24h > 0.1) priceScore = 80; // 급등
    else if (priceChange24h > 0.05) priceScore = 65;
    else if (priceChange24h < -0.1) priceScore = 20; // 급락
    else if (priceChange24h < -0.05) priceScore = 35;
    
    // 가중 평균 (RSI 40%, 거래량 30%, 가격변화 30%)
    const fearGreedIndex = (rsiScore * 0.4) + (volumeScore * 0.3) + (priceScore * 0.3);
    
    return Math.round(fearGreedIndex);
  }
}

export default new UpbitService();