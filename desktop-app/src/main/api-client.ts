import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
}

interface TradingStatus {
  running: boolean;
  ai_enabled: boolean;
  real_trade_enabled: boolean;
  active_tickers: string[];
}

export class ApiClient extends EventEmitter {
  private config: ApiConfig;
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(config: ApiConfig = {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000/ws'
  }) {
    super();
    this.config = config;
  }

  // WebSocket 연결
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    console.log('Connecting to WebSocket:', this.config.wsUrl);

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.on('open', () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.emit('connected');
        
        // 재연결 타이머 정리
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      });

      this.ws.on('close', () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('disconnected');
        this.setupReconnect();
      });
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.setupReconnect();
    }
  }

  // 재연결 설정
  private setupReconnect(): void {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 5000);
  }

  // WebSocket 메시지 처리
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'status':
        this.emit('status', message.data);
        break;
      case 'analysis':
        this.emit('analysis', message.data);
        break;
      case 'trade':
        this.emit('trade', message.data);
        break;
      case 'error':
        this.emit('error', new Error(message.message));
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // API 요청 메서드들
  async getStatus(): Promise<TradingStatus> {
    const response = await axios.get(`${this.config.baseUrl}/status`);
    return response.data;
  }

  async startTrading(params: {
    use_ai: boolean;
    tickers: string[];
  }): Promise<any> {
    const response = await axios.post(`${this.config.baseUrl}/start`, params);
    return response.data;
  }

  async stopTrading(): Promise<any> {
    const response = await axios.post(`${this.config.baseUrl}/stop`);
    return response.data;
  }

  async toggleAI(enabled: boolean): Promise<any> {
    const response = await axios.post(`${this.config.baseUrl}/toggle-ai`, { enabled });
    return response.data;
  }

  async toggleRealTrade(enabled: boolean): Promise<any> {
    const response = await axios.post(`${this.config.baseUrl}/toggle-real-trade`, { enabled });
    return response.data;
  }

  async setApiKeys(keys: {
    upbit_access_key?: string;
    upbit_secret_key?: string;
    anthropic_api_key?: string;
  }): Promise<any> {
    const response = await axios.post(`${this.config.baseUrl}/set-api-keys`, keys);
    return response.data;
  }

  async updateTradingConfig(config: any): Promise<any> {
    const response = await axios.post(`${this.config.baseUrl}/update-trading-config`, config);
    return response.data;
  }
}