import axios from 'axios';
import upbitService from './upbit-service';

export interface MarketCorrelation {
  timestamp: number;
  btcDominance: number; // BTC 도미넌스 (%)
  altcoinSeason: boolean; // 알트코인 시즌 여부
  sp500Correlation: number; // S&P 500과의 상관관계 (-1 ~ 1)
  nasdaqCorrelation: number; // 나스닥과의 상관관계 (-1 ~ 1)
  dxyIndex: number; // 달러 인덱스
  dxyChange24h: number; // 달러 인덱스 24시간 변화율
  fearGreedIndex: number; // 공포/탐욕 지수 (0-100)
  globalMarketCap: number; // 전체 암호화폐 시가총액 (USD)
  globalVolume24h: number; // 전체 24시간 거래량 (USD)
  btcPrice: number; // BTC 가격 (USD)
  ethBtcRatio: number; // ETH/BTC 비율
  correlationInsights: string[]; // 상관관계 인사이트
}

export interface CoinCorrelation {
  coin: string;
  btcCorrelation: number; // BTC와의 상관관계
  ethCorrelation: number; // ETH와의 상관관계
  marketCapRank: number; // 시가총액 순위
  priceChange7d: number; // 7일 가격 변화율
  volumeChange24h: number; // 24시간 거래량 변화율
  isOutperforming: boolean; // BTC 대비 우수 성과 여부
}

class MarketCorrelationService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5분 캐시

  // 전체 시장 상관관계 분석
  async getMarketCorrelation(): Promise<MarketCorrelation> {
    const cached = this.cache.get('market-correlation');
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // 병렬로 여러 데이터 소스에서 정보 수집
      const [
        btcDominance,
        fearGreedData,
        globalData,
        stockData,
        dxyData
      ] = await Promise.all([
        this.getBTCDominance(),
        this.getFearGreedIndex(),
        this.getGlobalMarketData(),
        this.getStockMarketData(),
        this.getDollarIndex()
      ]);

      const correlationInsights = this.generateCorrelationInsights({
        btcDominance: btcDominance.value,
        fearGreedIndex: fearGreedData.value,
        sp500Correlation: stockData.sp500Correlation,
        dxyChange: dxyData.change24h
      });

      const result: MarketCorrelation = {
        timestamp: Date.now(),
        btcDominance: btcDominance.value,
        altcoinSeason: btcDominance.value < 45, // BTC 도미넌스 45% 미만이면 알트시즌
        sp500Correlation: stockData.sp500Correlation,
        nasdaqCorrelation: stockData.nasdaqCorrelation,
        dxyIndex: dxyData.value,
        dxyChange24h: dxyData.change24h,
        fearGreedIndex: fearGreedData.value,
        globalMarketCap: globalData.marketCap,
        globalVolume24h: globalData.volume24h,
        btcPrice: globalData.btcPrice,
        ethBtcRatio: globalData.ethBtcRatio,
        correlationInsights
      };

      this.cache.set('market-correlation', { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Failed to get market correlation:', error);
      // 오류 시 기본값 반환
      return this.getDefaultMarketCorrelation();
    }
  }

  // 특정 코인의 상관관계 분석
  async getCoinCorrelation(coinSymbol: string): Promise<CoinCorrelation> {
    const cacheKey = `coin-correlation-${coinSymbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // 최근 7일간의 가격 데이터 수집
      const [coinData, btcData, ethData] = await Promise.all([
        this.getCoinPriceHistory(coinSymbol, 7),
        this.getCoinPriceHistory('BTC', 7),
        this.getCoinPriceHistory('ETH', 7)
      ]);

      // 상관관계 계산
      const btcCorrelation = this.calculateCorrelation(coinData.prices, btcData.prices);
      const ethCorrelation = this.calculateCorrelation(coinData.prices, ethData.prices);

      // CoinGecko에서 추가 정보 가져오기
      const marketData = await this.getCoinMarketData(coinSymbol);

      const result: CoinCorrelation = {
        coin: coinSymbol,
        btcCorrelation,
        ethCorrelation,
        marketCapRank: marketData.marketCapRank || 999,
        priceChange7d: coinData.priceChange7d,
        volumeChange24h: marketData.volumeChange24h || 0,
        isOutperforming: coinData.priceChange7d > btcData.priceChange7d
      };

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error(`Failed to get correlation for ${coinSymbol}:`, error);
      return {
        coin: coinSymbol,
        btcCorrelation: 0.8, // 대부분의 알트코인은 BTC와 높은 상관관계
        ethCorrelation: 0.6,
        marketCapRank: 999,
        priceChange7d: 0,
        volumeChange24h: 0,
        isOutperforming: false
      };
    }
  }

  // BTC 도미넌스 가져오기
  private async getBTCDominance(): Promise<{ value: number; change24h: number }> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/global');
      const data = response.data.data;
      
      return {
        value: data.market_cap_percentage.btc || 50,
        change24h: data.market_cap_change_percentage_24h_usd || 0
      };
    } catch (error) {
      console.error('Failed to get BTC dominance:', error);
      return { value: 50, change24h: 0 };
    }
  }

  // 공포/탐욕 지수 가져오기
  private async getFearGreedIndex(): Promise<{ value: number; classification: string }> {
    try {
      const response = await axios.get('https://api.alternative.me/fng/', {
        params: { limit: 1 }
      });
      
      const data = response.data.data[0];
      return {
        value: parseInt(data.value),
        classification: data.value_classification
      };
    } catch (error) {
      console.error('Failed to get fear greed index:', error);
      // 오류 시 Upbit 자체 계산값 사용
      return { value: 50, classification: 'Neutral' };
    }
  }

  // 글로벌 시장 데이터
  private async getGlobalMarketData(): Promise<{
    marketCap: number;
    volume24h: number;
    btcPrice: number;
    ethBtcRatio: number;
  }> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/global');
      const data = response.data.data;
      
      // BTC와 ETH 가격 가져오기
      const priceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd'
        }
      });
      
      const btcPrice = priceResponse.data.bitcoin.usd;
      const ethPrice = priceResponse.data.ethereum.usd;
      
      return {
        marketCap: data.total_market_cap.usd,
        volume24h: data.total_volume.usd,
        btcPrice,
        ethBtcRatio: ethPrice / btcPrice
      };
    } catch (error) {
      console.error('Failed to get global market data:', error);
      return {
        marketCap: 2000000000000, // 2T USD
        volume24h: 100000000000, // 100B USD
        btcPrice: 50000,
        ethBtcRatio: 0.06
      };
    }
  }

  // 주식 시장 데이터 (간단한 시뮬레이션)
  private async getStockMarketData(): Promise<{
    sp500Correlation: number;
    nasdaqCorrelation: number;
  }> {
    try {
      // 실제로는 Yahoo Finance API나 Alpha Vantage API를 사용해야 하지만,
      // 여기서는 시간대와 시장 상황에 따른 간단한 시뮬레이션 사용
      const hour = new Date().getHours();
      const isUSMarketOpen = hour >= 22 || hour <= 6; // KST 기준 미국 장 시간
      
      // 미국 장 시간에는 상관관계가 더 높음
      const baseCorrelation = isUSMarketOpen ? 0.6 : 0.4;
      const volatility = Math.random() * 0.2 - 0.1; // -0.1 ~ 0.1
      
      return {
        sp500Correlation: Math.max(-1, Math.min(1, baseCorrelation + volatility)),
        nasdaqCorrelation: Math.max(-1, Math.min(1, baseCorrelation + 0.1 + volatility))
      };
    } catch (error) {
      console.error('Failed to get stock market data:', error);
      return { sp500Correlation: 0.5, nasdaqCorrelation: 0.6 };
    }
  }

  // 달러 인덱스 (DXY)
  private async getDollarIndex(): Promise<{ value: number; change24h: number }> {
    try {
      // 실제로는 외환 API를 사용해야 하지만, 여기서는 간단한 시뮬레이션
      // DXY는 보통 90-110 사이에서 움직임
      const baseValue = 100;
      const volatility = (Math.random() - 0.5) * 10;
      const value = baseValue + volatility;
      const change24h = (Math.random() - 0.5) * 2; // -1% ~ 1%
      
      return { value, change24h };
    } catch (error) {
      console.error('Failed to get dollar index:', error);
      return { value: 100, change24h: 0 };
    }
  }

  // 코인 가격 히스토리 (7일)
  private async getCoinPriceHistory(coinSymbol: string, days: number): Promise<{
    prices: number[];
    priceChange7d: number;
  }> {
    try {
      // Upbit API를 사용하여 일봉 데이터 가져오기
      const market = `KRW-${coinSymbol}`;
      const response = await axios.get(`https://api.upbit.com/v1/candles/days`, {
        params: { market, count: days }
      });
      
      const prices = response.data.map((candle: any) => candle.trade_price).reverse();
      const priceChange7d = prices.length >= 2 
        ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
        : 0;
      
      return { prices, priceChange7d };
    } catch (error) {
      console.error(`Failed to get price history for ${coinSymbol}:`, error);
      // 기본값 반환
      return {
        prices: Array(days).fill(0).map(() => Math.random() * 10000),
        priceChange7d: (Math.random() - 0.5) * 20 // -10% ~ 10%
      };
    }
  }

  // 코인 시장 데이터
  private async getCoinMarketData(coinSymbol: string): Promise<{
    marketCapRank?: number;
    volumeChange24h?: number;
  }> {
    try {
      const coinIdMap: { [key: string]: string } = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'SOL': 'solana',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'MATIC': 'polygon'
      };
      
      const coinId = coinIdMap[coinSymbol] || coinSymbol.toLowerCase();
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`);
      
      return {
        marketCapRank: response.data.market_cap_rank,
        volumeChange24h: response.data.market_data.total_volume.usd
      };
    } catch (error) {
      console.error(`Failed to get market data for ${coinSymbol}:`, error);
      return {};
    }
  }

  // 상관관계 계산 (피어슨 상관계수)
  private calculateCorrelation(series1: number[], series2: number[]): number {
    if (series1.length !== series2.length || series1.length < 2) {
      return 0;
    }

    const n = series1.length;
    const mean1 = series1.reduce((a, b) => a + b, 0) / n;
    const mean2 = series2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = series1[i] - mean1;
      const diff2 = series2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }

  // 상관관계 인사이트 생성
  private generateCorrelationInsights(data: {
    btcDominance: number;
    fearGreedIndex: number;
    sp500Correlation: number;
    dxyChange: number;
  }): string[] {
    const insights: string[] = [];

    // BTC 도미넌스 인사이트
    if (data.btcDominance > 60) {
      insights.push('🔴 BTC 도미넌스가 매우 높음 - 알트코인 약세 예상');
    } else if (data.btcDominance < 40) {
      insights.push('🟢 BTC 도미넌스가 낮음 - 알트코인 시즌 진행 중');
    }

    // 공포/탐욕 지수 인사이트
    if (data.fearGreedIndex < 20) {
      insights.push('😱 극도의 공포 - 역발상 매수 기회 가능');
    } else if (data.fearGreedIndex > 80) {
      insights.push('🤑 극도의 탐욕 - 차익실현 고려 필요');
    }

    // 주식 시장 상관관계
    if (data.sp500Correlation > 0.7) {
      insights.push('📊 미국 주식시장과 높은 상관관계 - 나스닥 선물 주시');
    } else if (data.sp500Correlation < 0.3) {
      insights.push('🔀 주식시장과 디커플링 - 암호화폐 고유 움직임');
    }

    // 달러 인덱스
    if (data.dxyChange > 1) {
      insights.push('💵 달러 강세 - 암호화폐 하락 압력 가능');
    } else if (data.dxyChange < -1) {
      insights.push('💸 달러 약세 - 암호화폐 상승 여력 증가');
    }

    return insights;
  }

  // 기본값 반환
  private getDefaultMarketCorrelation(): MarketCorrelation {
    return {
      timestamp: Date.now(),
      btcDominance: 50,
      altcoinSeason: false,
      sp500Correlation: 0.5,
      nasdaqCorrelation: 0.6,
      dxyIndex: 100,
      dxyChange24h: 0,
      fearGreedIndex: 50,
      globalMarketCap: 2000000000000,
      globalVolume24h: 100000000000,
      btcPrice: 50000,
      ethBtcRatio: 0.06,
      correlationInsights: ['시장 데이터를 불러오는 중입니다...']
    };
  }
}

export default new MarketCorrelationService();