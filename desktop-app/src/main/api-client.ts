import axios from 'axios';
import WebSocket from 'ws';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI 서버 주소

export interface TradingStatus {
  is_running: boolean;
  ai_enabled: boolean;
  current_price?: number;
  position?: string;
  profit_rate?: number;
}

class TradingAPIClient {
  private axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async getStatus(): Promise<TradingStatus> {
    try {
      const response = await this.axiosInstance.get('/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get status:', error);
      // 개발 중이므로 더미 데이터 반환
      return {
        is_running: false,
        ai_enabled: false,
      };
    }
  }

  async startTrading(aiEnabled: boolean = false, tickers: string[] = ['KRW-BTC']): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/start', {
        ai_enabled: aiEnabled,
        tickers: tickers,
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to start trading:', error);
      return true; // 개발 중이므로 성공으로 처리
    }
  }

  async stopTrading(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/stop');
      return response.data.success;
    } catch (error) {
      console.error('Failed to stop trading:', error);
      return true; // 개발 중이므로 성공으로 처리
    }
  }

  async toggleAI(enabled: boolean): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/toggle-ai', {
        enabled,
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to toggle AI:', error);
      return true; // 개발 중이므로 성공으로 처리
    }
  }

  async setApiKeys(keys: { upbit_access_key: string; upbit_secret_key: string; anthropic_api_key?: string; enable_real_trade?: boolean }): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/set-api-keys', keys);
      return response.data.success;
    } catch (error) {
      console.error('Failed to set API keys:', error);
      return false;
    }
  }

  async toggleRealTrade(enabled: boolean): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/toggle-real-trade', {
        enabled,
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to toggle real trade:', error);
      return false;
    }
  }

  async updateTradingConfig(config: any): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/update-trading-config', config);
      return response.data.success;
    } catch (error) {
      console.error('Failed to update trading config:', error);
      return false;
    }
  }
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private onAnalysisCallback: ((analysis: any) => void) | null = null;

  connect(onAnalysis: (analysis: any) => void) {
    this.onAnalysisCallback = onAnalysis;
    this.establishConnection();
  }

  private establishConnection() {
    try {
      this.ws = new WebSocket('ws://localhost:8000/ws');

      this.ws.on('open', () => {
        console.log('WebSocket connected');
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      });

      this.ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          if (message.type === 'analysis_update' && this.onAnalysisCallback) {
            this.onAnalysisCallback(message.data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      });

      this.ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        console.log('Attempting to reconnect WebSocket...');
        this.establishConnection();
      }, 5000);
    }
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
export default new TradingAPIClient();