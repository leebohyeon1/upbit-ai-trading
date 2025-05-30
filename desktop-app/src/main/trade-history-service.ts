import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface TradeRecord {
  id: string;
  timestamp: number;
  market: string;
  type: 'BUY' | 'SELL';
  price: number;
  volume: number;
  totalAmount: number;
  fee: number;
  profit?: number;
  profitRate?: number;
  reason?: string;
  indicators?: {
    rsi?: number;
    macd?: number;
    bollingerBands?: any;
    volume?: number;
  };
  aiAnalysis?: {
    confidence: number;
    sentiment: string;
    recommendation: string;
  };
}

export interface DailyPerformance {
  date: string;
  profit: number;
  profitRate: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
}

class TradeHistoryService {
  private dataPath: string;
  private trades: TradeRecord[] = [];
  private dailyPerformance: Map<string, DailyPerformance> = new Map();

  constructor() {
    // 데이터 저장 경로 설정
    this.dataPath = path.join(app.getPath('userData'), 'trading-data');
    this.ensureDataDirectory();
    this.loadTradeHistory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private getTradeFilePath(): string {
    return path.join(this.dataPath, 'trades.json');
  }

  private getPerformanceFilePath(): string {
    return path.join(this.dataPath, 'performance.json');
  }

  private loadTradeHistory(): void {
    try {
      const tradesPath = this.getTradeFilePath();
      if (fs.existsSync(tradesPath)) {
        const data = fs.readFileSync(tradesPath, 'utf8');
        this.trades = JSON.parse(data);
      }

      const performancePath = this.getPerformanceFilePath();
      if (fs.existsSync(performancePath)) {
        const data = fs.readFileSync(performancePath, 'utf8');
        const performanceData = JSON.parse(data);
        this.dailyPerformance = new Map(performanceData);
      }
    } catch (error) {
      console.error('Failed to load trade history:', error);
      this.trades = [];
      this.dailyPerformance = new Map();
    }
  }

  private saveTradeHistory(): void {
    try {
      fs.writeFileSync(
        this.getTradeFilePath(),
        JSON.stringify(this.trades, null, 2)
      );

      fs.writeFileSync(
        this.getPerformanceFilePath(),
        JSON.stringify(Array.from(this.dailyPerformance.entries()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save trade history:', error);
    }
  }

  // 거래 기록 추가
  addTrade(trade: Omit<TradeRecord, 'id'>): TradeRecord {
    const newTrade: TradeRecord = {
      ...trade,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: trade.timestamp || Date.now()
    };

    // 매도 시 수익 계산
    if (trade.type === 'SELL') {
      const buyTrades = this.trades
        .filter(t => t.market === trade.market && t.type === 'BUY')
        .sort((a, b) => a.timestamp - b.timestamp);

      if (buyTrades.length > 0) {
        const avgBuyPrice = buyTrades.reduce((sum, t) => sum + t.price * t.volume, 0) /
                           buyTrades.reduce((sum, t) => sum + t.volume, 0);
        
        newTrade.profit = (trade.price - avgBuyPrice) * trade.volume - trade.fee;
        newTrade.profitRate = ((trade.price - avgBuyPrice) / avgBuyPrice) * 100;
      }
    }

    this.trades.push(newTrade);
    this.updateDailyPerformance(newTrade);
    this.saveTradeHistory();

    return newTrade;
  }

  // 일일 성과 업데이트
  private updateDailyPerformance(trade: TradeRecord): void {
    const date = new Date(trade.timestamp).toISOString().split('T')[0];
    const existing = this.dailyPerformance.get(date) || {
      date,
      profit: 0,
      profitRate: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };

    existing.trades++;
    
    if (trade.type === 'SELL' && trade.profit !== undefined) {
      existing.profit += trade.profit;
      if (trade.profit > 0) {
        existing.wins++;
      } else {
        existing.losses++;
      }
    }

    existing.winRate = existing.trades > 0 ? (existing.wins / existing.trades) * 100 : 0;
    
    this.dailyPerformance.set(date, existing);
  }

  // 거래 내역 조회
  getTrades(options?: {
    market?: string;
    startDate?: number;
    endDate?: number;
    type?: 'BUY' | 'SELL';
    limit?: number;
  }): TradeRecord[] {
    let filtered = [...this.trades];

    if (options?.market) {
      filtered = filtered.filter(t => t.market === options.market);
    }
    if (options?.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }
    if (options?.startDate) {
      filtered = filtered.filter(t => t.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      filtered = filtered.filter(t => t.timestamp <= options.endDate!);
    }

    // 최신순 정렬
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // 거래 통계 조회
  getTradeStatistics(period?: { start: number; end: number }): {
    totalTrades: number;
    totalProfit: number;
    totalProfitRate: number;
    winRate: number;
    avgProfit: number;
    maxProfit: number;
    maxLoss: number;
    profitableDays: number;
    totalDays: number;
  } {
    let trades = this.trades;
    
    if (period) {
      trades = trades.filter(t => 
        t.timestamp >= period.start && t.timestamp <= period.end
      );
    }

    const sellTrades = trades.filter(t => t.type === 'SELL' && t.profit !== undefined);
    
    const totalProfit = sellTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const wins = sellTrades.filter(t => (t.profit || 0) > 0).length;
    const losses = sellTrades.filter(t => (t.profit || 0) < 0).length;
    
    const profits = sellTrades.map(t => t.profit || 0);
    const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
    const maxLoss = profits.length > 0 ? Math.min(...profits) : 0;
    
    // 일별 수익 계산
    const dailyProfits = new Map<string, number>();
    sellTrades.forEach(trade => {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      dailyProfits.set(date, (dailyProfits.get(date) || 0) + (trade.profit || 0));
    });
    
    const profitableDays = Array.from(dailyProfits.values()).filter(p => p > 0).length;
    
    return {
      totalTrades: trades.length,
      totalProfit,
      totalProfitRate: sellTrades.length > 0 
        ? sellTrades.reduce((sum, t) => sum + (t.profitRate || 0), 0) / sellTrades.length 
        : 0,
      winRate: sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 0,
      avgProfit: sellTrades.length > 0 ? totalProfit / sellTrades.length : 0,
      maxProfit,
      maxLoss,
      profitableDays,
      totalDays: dailyProfits.size
    };
  }

  // 일별 성과 조회
  getDailyPerformance(days: number = 30): DailyPerformance[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performances: DailyPerformance[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const perf = this.dailyPerformance.get(dateStr) || {
        date: dateStr,
        profit: 0,
        profitRate: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      };
      performances.push(perf);
    }

    return performances;
  }

  // 수익률 차트 데이터 생성
  getProfitChartData(days: number = 30): {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
    }[];
  } {
    const performances = this.getDailyPerformance(days);
    const labels = performances.map(p => {
      const date = new Date(p.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    // 누적 수익 계산
    let cumulativeProfit = 0;
    const cumulativeProfits = performances.map(p => {
      cumulativeProfit += p.profit;
      return cumulativeProfit;
    });

    // 일별 수익
    const dailyProfits = performances.map(p => p.profit);

    return {
      labels,
      datasets: [
        {
          label: '누적 수익',
          data: cumulativeProfits,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: '일별 수익',
          data: dailyProfits,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  }

  // 거래 내역 초기화
  clearHistory(): void {
    this.trades = [];
    this.dailyPerformance.clear();
    this.saveTradeHistory();
  }

  // 특정 거래 삭제
  deleteTrade(tradeId: string): boolean {
    const index = this.trades.findIndex(t => t.id === tradeId);
    if (index !== -1) {
      this.trades.splice(index, 1);
      this.recalculatePerformance();
      this.saveTradeHistory();
      return true;
    }
    return false;
  }

  // 성과 재계산
  private recalculatePerformance(): void {
    this.dailyPerformance.clear();
    this.trades.forEach(trade => {
      this.updateDailyPerformance(trade);
    });
  }
}

export default new TradeHistoryService();