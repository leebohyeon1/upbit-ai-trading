import axios from 'axios';
import Parser from 'rss-parser';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  summary?: string;
}

export interface NewsAnalysis {
  totalNews: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  sentimentScore: number; // -100 to +100
  topKeywords: string[];
  majorEvents: string[];
  newsItems: NewsItem[];
}

class NewsService {
  private rssParser: Parser;
  private newsCache: Map<string, { data: NewsAnalysis; timestamp: number }> = new Map();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5분 캐시

  constructor() {
    this.rssParser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  // 전체 암호화폐 시장 뉴스 수집
  async getMarketNews(): Promise<NewsAnalysis> {
    // 캐시 확인
    const cached = this.newsCache.get('MARKET_OVERALL');
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const newsItems: NewsItem[] = [];
    
    // 전체 시장 관련 뉴스 수집
    try {
      // 1. 일반 암호화폐 뉴스
      const queries = [
        'cryptocurrency market',
        'crypto market today',
        'bitcoin ethereum news',
        'altcoin market',
        'crypto regulation',
        'DeFi news'
      ];

      for (const query of queries) {
        try {
          const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
          const feed = await this.rssParser.parseURL(url);
          
          for (const item of feed.items.slice(0, 3)) { // 각 쿼리당 3개씩
            newsItems.push({
              title: item.title || '',
              link: item.link || '',
              pubDate: new Date(item.pubDate || Date.now()),
              source: 'Google News',
              sentiment: 'neutral',
              summary: item.contentSnippet
            });
          }
        } catch (error) {
          console.error(`Market news RSS error for query "${query}":`, error);
        }
      }
    } catch (error) {
      console.error('Market news fetch error:', error);
    }

    // Reddit 전체 시장 트렌드
    try {
      const subreddits = ['cryptocurrency', 'CryptoMarkets'];
      for (const subreddit of subreddits) {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const posts = response.data.data.children || [];
        for (const post of posts.slice(0, 5)) {
          const data = post.data;
          newsItems.push({
            title: data.title,
            link: `https://reddit.com${data.permalink}`,
            pubDate: new Date(data.created_utc * 1000),
            source: `Reddit r/${subreddit}`,
            sentiment: 'neutral',
            summary: data.selftext?.substring(0, 200)
          });
        }
      }
    } catch (error) {
      console.error('Reddit market news error:', error);
    }

    // 최신순 정렬
    newsItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    // 감정 분석
    const analysis = this.analyzeNewsSentiment(newsItems);
    
    // 캐시 저장
    this.newsCache.set('MARKET_OVERALL', { data: analysis, timestamp: Date.now() });
    
    return analysis;
  }

  async getCoinNews(coinSymbol: string): Promise<NewsAnalysis> {
    // 캐시 확인
    const cached = this.newsCache.get(coinSymbol);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const newsItems: NewsItem[] = [];
    
    // 여러 소스에서 뉴스 수집
    try {
      // 1. Google News RSS
      const googleNews = await this.fetchGoogleNews(coinSymbol);
      newsItems.push(...googleNews);
    } catch (error) {
      console.error('Google News fetch error:', error);
    }

    try {
      // 2. CoinGecko 뉴스 (API 키 없이 공개 엔드포인트 사용)
      const coinGeckoNews = await this.fetchCoinGeckoNews(coinSymbol);
      newsItems.push(...coinGeckoNews);
    } catch (error) {
      console.error('CoinGecko news fetch error:', error);
    }

    try {
      // 3. Reddit 포스트 (암호화폐 관련 서브레딧)
      const redditPosts = await this.fetchRedditPosts(coinSymbol);
      newsItems.push(...redditPosts);
    } catch (error) {
      console.error('Reddit fetch error:', error);
    }

    // 최신순으로 정렬
    newsItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

    // 감정 분석
    const analysis = this.analyzeNewsSentiment(newsItems);
    
    // 캐시 저장
    this.newsCache.set(coinSymbol, { data: analysis, timestamp: Date.now() });
    
    return analysis;
  }

  private async fetchGoogleNews(coinSymbol: string): Promise<NewsItem[]> {
    const newsItems: NewsItem[] = [];
    const queries = [
      `${coinSymbol} cryptocurrency`,
      `${coinSymbol} bitcoin` + (coinSymbol !== 'BTC' ? '' : ' news'),
      `${coinSymbol} crypto market`
    ];

    for (const query of queries) {
      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        const feed = await this.rssParser.parseURL(url);
        
        for (const item of feed.items.slice(0, 5)) { // 각 쿼리당 최대 5개
          newsItems.push({
            title: item.title || '',
            link: item.link || '',
            pubDate: new Date(item.pubDate || Date.now()),
            source: 'Google News',
            sentiment: 'neutral', // 나중에 분석
            summary: item.contentSnippet
          });
        }
      } catch (error) {
        console.error(`Google News RSS error for query "${query}":`, error);
      }
    }

    return newsItems;
  }

  private async fetchCoinGeckoNews(coinSymbol: string): Promise<NewsItem[]> {
    const newsItems: NewsItem[] = [];
    
    try {
      // CoinGecko의 암호화폐 ID 매핑
      const coinIdMap: { [key: string]: string } = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'SOL': 'solana',
        'DOGE': 'dogecoin',
        'DOT': 'polkadot',
        'MATIC': 'polygon',
        'SHIB': 'shiba-inu',
        'AVAX': 'avalanche-2',
        'ATOM': 'cosmos',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'LTC': 'litecoin',
        'BCH': 'bitcoin-cash'
      };

      const coinId = coinIdMap[coinSymbol] || coinSymbol.toLowerCase();
      
      // CoinGecko trending search
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
        headers: {
          'Accept': 'application/json'
        }
      });

      // 트렌딩 코인 중에 해당 코인이 있는지 확인
      const trendingCoins = response.data.coins || [];
      for (const coin of trendingCoins) {
        if (coin.item.symbol.toUpperCase() === coinSymbol) {
          newsItems.push({
            title: `${coinSymbol} is trending on CoinGecko - Rank #${coin.item.market_cap_rank}`,
            link: `https://www.coingecko.com/en/coins/${coin.item.id}`,
            pubDate: new Date(),
            source: 'CoinGecko',
            sentiment: 'positive',
            summary: `Market Cap Rank: ${coin.item.market_cap_rank}, Price: ${coin.item.data?.price || 'N/A'}`
          });
        }
      }
    } catch (error) {
      console.error('CoinGecko API error:', error);
    }

    return newsItems;
  }

  private async fetchRedditPosts(coinSymbol: string): Promise<NewsItem[]> {
    const newsItems: NewsItem[] = [];
    const subreddits = ['cryptocurrency', 'CryptoMarkets', 'Bitcoin', 'ethereum'];
    
    for (const subreddit of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${coinSymbol}&sort=new&limit=10&restrict_sr=on`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const posts = response.data.data.children || [];
        for (const post of posts.slice(0, 3)) { // 각 서브레딧당 최대 3개
          const data = post.data;
          newsItems.push({
            title: data.title,
            link: `https://reddit.com${data.permalink}`,
            pubDate: new Date(data.created_utc * 1000),
            source: `Reddit r/${subreddit}`,
            sentiment: 'neutral',
            summary: data.selftext?.substring(0, 200)
          });
        }
      } catch (error) {
        console.error(`Reddit fetch error for r/${subreddit}:`, error);
      }
    }

    return newsItems;
  }

  private analyzeNewsSentiment(newsItems: NewsItem[]): NewsAnalysis {
    // 감정 분석을 위한 키워드
    const positiveKeywords = [
      'surge', 'rally', 'bullish', 'gain', 'rise', 'increase', 'growth', 'breakout',
      'upward', 'positive', 'adoption', 'partnership', 'upgrade', 'success', 'record',
      'soar', 'jump', 'spike', 'breakthrough', 'milestone', 'optimistic', 'buy',
      'trending', 'popular', 'demand', 'strong', 'recovery', 'rebound'
    ];

    const negativeKeywords = [
      'crash', 'plunge', 'bearish', 'fall', 'drop', 'decrease', 'decline', 'collapse',
      'downward', 'negative', 'concern', 'risk', 'volatility', 'correction', 'selloff',
      'dump', 'fear', 'uncertainty', 'weak', 'struggle', 'loss', 'warning',
      'fraud', 'hack', 'scam', 'investigation', 'regulatory', 'ban'
    ];

    const majorEventKeywords = [
      'halving', 'fork', 'listing', 'delisting', 'partnership', 'acquisition',
      'regulation', 'ban', 'approval', 'etf', 'upgrade', 'mainnet', 'testnet',
      'hack', 'exploit', 'lawsuit', 'settlement', 'ico', 'ipo', 'merger'
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const keywordCounts: { [key: string]: number } = {};
    const majorEvents: string[] = [];

    // 각 뉴스 항목 분석
    for (const item of newsItems) {
      const text = `${item.title} ${item.summary || ''}`.toLowerCase();
      
      // 긍정/부정 키워드 카운트
      const positiveMatches = positiveKeywords.filter(keyword => text.includes(keyword)).length;
      const negativeMatches = negativeKeywords.filter(keyword => text.includes(keyword)).length;
      
      // 감정 판단
      if (positiveMatches > negativeMatches) {
        item.sentiment = 'positive';
        positiveCount++;
      } else if (negativeMatches > positiveMatches) {
        item.sentiment = 'negative';
        negativeCount++;
      } else {
        item.sentiment = 'neutral';
        neutralCount++;
      }
      
      // 키워드 추출
      const words = text.split(/\W+/).filter(word => word.length > 4);
      for (const word of words) {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
      
      // 주요 이벤트 확인
      for (const eventKeyword of majorEventKeywords) {
        if (text.includes(eventKeyword)) {
          majorEvents.push(`${eventKeyword.toUpperCase()}: ${item.title}`);
          break;
        }
      }
    }

    // 상위 키워드 추출
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // 감정 점수 계산 (-100 to +100)
    const totalNews = newsItems.length || 1;
    const sentimentScore = Math.round(
      ((positiveCount - negativeCount) / totalNews) * 100
    );

    return {
      totalNews: newsItems.length,
      positiveCount,
      negativeCount,
      neutralCount,
      sentimentScore,
      topKeywords,
      majorEvents: majorEvents.slice(0, 5), // 최대 5개
      newsItems: newsItems.slice(0, 20) // 최대 20개 뉴스
    };
  }
}

export default new NewsService();