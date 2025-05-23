import axios from 'axios';

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

  async startTrading(aiEnabled: boolean = false): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/start', {
        ai_enabled: aiEnabled,
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
}

export default new TradingAPIClient();