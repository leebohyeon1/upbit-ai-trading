import axios from 'axios';
import { EventEmitter } from 'events';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  keywords?: string[];
  impact?: 'high' | 'medium' | 'low';
}

export interface NewsAnalysisResult {
  market: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1 to 1
  impact: 'high' | 'medium' | 'low';
  articles: NewsArticle[];
  keyTopics: string[];
  recommendation: string;
}

class NewsApiService extends EventEmitter {
  private newsApiKey: string = '';
  private cryptoPanicApiKey: string = '';
  private cache: Map<string, { data: NewsArticle[]; timestamp: number }> = new Map();
  private cacheExpiry = 15 * 60 * 1000; // 15분

  setApiKeys(newsApiKey?: string, cryptoPanicApiKey?: string) {
    if (newsApiKey) this.newsApiKey = newsApiKey;
    if (cryptoPanicApiKey) this.cryptoPanicApiKey = cryptoPanicApiKey;
  }

  /**
   * 암호화폐 관련 뉴스 가져오기
   */
  async getCryptoNews(symbol: string, limit: number = 20): Promise<NewsArticle[]> {
    const cacheKey = `news_${symbol}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const articles: NewsArticle[] = [];

    try {
      // CryptoPanic API 사용
      if (this.cryptoPanicApiKey) {
        const cryptoPanicArticles = await this.fetchCryptoPanicNews(symbol, limit);
        articles.push(...cryptoPanicArticles);
      }

      // Google News RSS 사용 (API 키 불필요)
      const googleNewsArticles = await this.fetchGoogleNews(symbol, Math.max(0, limit - articles.length));
      articles.push(...googleNewsArticles);

      // 한국 뉴스 소스 추가
      const koreanNewsArticles = await this.fetchKoreanCryptoNews(symbol, Math.max(0, limit - articles.length));
      articles.push(...koreanNewsArticles);

      // 중복 제거 및 정렬
      const uniqueArticles = this.removeDuplicates(articles)
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, limit);

      this.cache.set(cacheKey, { data: uniqueArticles, timestamp: Date.now() });
      return uniqueArticles;
    } catch (error) {
      console.error('Failed to fetch crypto news:', error);
      return [];
    }
  }

  /**
   * CryptoPanic API로 뉴스 가져오기
   */
  private async fetchCryptoPanicNews(symbol: string, limit: number): Promise<NewsArticle[]> {
    if (!this.cryptoPanicApiKey) return [];

    try {
      const url = `https://cryptopanic.com/api/v1/posts/`;
      const params = {
        auth_token: this.cryptoPanicApiKey,
        currencies: symbol,
        filter: 'hot',
        public: 'true',
        kind: 'news',
        regions: 'en,ko'
      };

      const response = await axios.get(url, { params, timeout: 10000 });
      
      return response.data.results.slice(0, limit).map((item: any) => ({
        id: `cp_${item.id}`,
        title: item.title,
        description: item.metadata?.description || '',
        url: item.url,
        source: item.source.title,
        publishedAt: new Date(item.published_at),
        sentiment: this.mapCryptoPanicSentiment(item.votes),
        keywords: item.currencies?.map((c: any) => c.code) || []
      }));
    } catch (error) {
      console.error('CryptoPanic API error:', error);
      return [];
    }
  }

  /**
   * Google News RSS로 뉴스 가져오기
   */
  private async fetchGoogleNews(symbol: string, limit: number): Promise<NewsArticle[]> {
    try {
      // RSS를 JSON으로 변환해주는 서비스 사용
      const query = `${symbol} cryptocurrency blockchain`;
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status !== 'ok') {
        return [];
      }

      return response.data.items.slice(0, limit).map((item: any) => ({
        id: `gn_${item.guid}`,
        title: item.title,
        description: item.description || '',
        url: item.link,
        source: 'Google News',
        publishedAt: new Date(item.pubDate),
        keywords: [symbol]
      }));
    } catch (error) {
      console.error('Google News fetch error:', error);
      return [];
    }
  }

  /**
   * 한국 암호화폐 뉴스 가져오기
   */
  private async fetchKoreanCryptoNews(symbol: string, limit: number): Promise<NewsArticle[]> {
    try {
      // 블록미디어 RSS
      const query = encodeURIComponent(`${symbol}`);
      const url = `https://api.rss2json.com/v1/api.json?rss_url=https://www.blockmedia.co.kr/feed`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status !== 'ok') {
        return [];
      }

      // 심볼과 관련된 뉴스만 필터링
      const filteredItems = response.data.items.filter((item: any) => 
        item.title.toLowerCase().includes(symbol.toLowerCase()) ||
        item.description.toLowerCase().includes(symbol.toLowerCase())
      );

      return filteredItems.slice(0, limit).map((item: any) => ({
        id: `bm_${item.guid}`,
        title: item.title,
        description: item.description || '',
        url: item.link,
        source: '블록미디어',
        publishedAt: new Date(item.pubDate),
        keywords: [symbol]
      }));
    } catch (error) {
      console.error('Korean news fetch error:', error);
      return [];
    }
  }

  /**
   * 뉴스 감성 분석
   */
  async analyzeNewsSentiment(articles: NewsArticle[]): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    breakdown: { positive: number; negative: number; neutral: number };
  }> {
    if (articles.length === 0) {
      return { sentiment: 'neutral', score: 0, breakdown: { positive: 0, negative: 0, neutral: 0 } };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let totalScore = 0;

    for (const article of articles) {
      const sentiment = await this.analyzeSingleArticle(article);
      article.sentiment = sentiment.sentiment;
      
      switch (sentiment.sentiment) {
        case 'positive':
          positiveCount++;
          totalScore += sentiment.score;
          break;
        case 'negative':
          negativeCount++;
          totalScore -= Math.abs(sentiment.score);
          break;
        default:
          neutralCount++;
      }
    }

    const avgScore = totalScore / articles.length;
    let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (avgScore > 0.1) overallSentiment = 'positive';
    else if (avgScore < -0.1) overallSentiment = 'negative';

    return {
      sentiment: overallSentiment,
      score: avgScore,
      breakdown: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };
  }

  /**
   * 단일 기사 감성 분석 (간단한 키워드 기반)
   */
  private async analyzeSingleArticle(article: NewsArticle): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }> {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    // 긍정적 키워드
    const positiveKeywords = [
      'surge', 'rally', 'bullish', 'gain', 'rise', 'boost', 'adopt', 'partnership',
      'breakthrough', 'milestone', 'success', 'growth', 'upgrade', 'support',
      '상승', '급등', '호재', '성장', '돌파', '신고가', '매수', '강세'
    ];
    
    // 부정적 키워드
    const negativeKeywords = [
      'crash', 'plunge', 'bearish', 'loss', 'drop', 'fall', 'ban', 'hack',
      'scam', 'fraud', 'concern', 'risk', 'decline', 'dump', 'sell-off',
      '하락', '급락', '악재', '폭락', '매도', '약세', '우려', '리스크'
    ];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveKeywords.forEach(keyword => {
      if (text.includes(keyword)) positiveScore++;
    });
    
    negativeKeywords.forEach(keyword => {
      if (text.includes(keyword)) negativeScore++;
    });
    
    const netScore = positiveScore - negativeScore;
    const normalizedScore = Math.max(-1, Math.min(1, netScore / 5)); // -1 to 1로 정규화
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (normalizedScore > 0.2) sentiment = 'positive';
    else if (normalizedScore < -0.2) sentiment = 'negative';
    
    return { sentiment, score: normalizedScore };
  }

  /**
   * 시장별 뉴스 분석 수행
   */
  async analyzeMarketNews(market: string): Promise<NewsAnalysisResult> {
    const symbol = market.split('-')[1]; // KRW-BTC -> BTC
    const articles = await this.getCryptoNews(symbol, 20);
    const sentimentAnalysis = await this.analyzeNewsSentiment(articles);
    
    // 주요 토픽 추출
    const keyTopics = this.extractKeyTopics(articles);
    
    // 영향도 평가
    const impact = this.evaluateImpact(sentimentAnalysis, articles.length);
    
    // 권고사항 생성
    const recommendation = this.generateRecommendation(sentimentAnalysis, impact, keyTopics);
    
    return {
      market,
      sentiment: sentimentAnalysis.sentiment,
      sentimentScore: sentimentAnalysis.score,
      impact,
      articles: articles.slice(0, 10), // 상위 10개만
      keyTopics,
      recommendation
    };
  }

  /**
   * 주요 토픽 추출
   */
  private extractKeyTopics(articles: NewsArticle[]): string[] {
    const topicCounts = new Map<string, number>();
    
    const keywords = [
      'regulation', 'adoption', 'partnership', 'upgrade', 'hack', 'etf',
      'halving', 'defi', 'nft', 'staking', 'mining', 'institutional',
      '규제', '상장', '파트너십', '업그레이드', '해킹', '투자'
    ];
    
    articles.forEach(article => {
      const text = `${article.title} ${article.description}`.toLowerCase();
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
        }
      });
    });
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * 영향도 평가
   */
  private evaluateImpact(
    sentiment: { score: number; breakdown: any },
    articleCount: number
  ): 'high' | 'medium' | 'low' {
    const sentimentStrength = Math.abs(sentiment.score);
    
    if (sentimentStrength > 0.5 && articleCount > 10) return 'high';
    if (sentimentStrength > 0.3 || articleCount > 5) return 'medium';
    return 'low';
  }

  /**
   * 권고사항 생성
   */
  private generateRecommendation(
    sentiment: { sentiment: string; score: number },
    impact: string,
    topics: string[]
  ): string {
    const recommendations = [];
    
    if (sentiment.sentiment === 'positive' && impact === 'high') {
      recommendations.push('긍정적인 뉴스가 많아 단기 상승 가능성이 있습니다.');
    } else if (sentiment.sentiment === 'negative' && impact === 'high') {
      recommendations.push('부정적인 뉴스가 많아 주의가 필요합니다.');
    }
    
    if (topics.includes('regulation') || topics.includes('규제')) {
      recommendations.push('규제 관련 뉴스를 주시하세요.');
    }
    
    if (topics.includes('partnership') || topics.includes('파트너십')) {
      recommendations.push('새로운 파트너십이 긍정적 영향을 줄 수 있습니다.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('뉴스 영향은 제한적입니다. 기술적 분석을 중심으로 판단하세요.');
    }
    
    return recommendations.join(' ');
  }

  /**
   * CryptoPanic 감성 점수 매핑
   */
  private mapCryptoPanicSentiment(votes: any): 'positive' | 'negative' | 'neutral' {
    if (!votes) return 'neutral';
    
    const positive = votes.positive || 0;
    const negative = votes.negative || 0;
    const diff = positive - negative;
    
    if (diff > 2) return 'positive';
    if (diff < -2) return 'negative';
    return 'neutral';
  }

  /**
   * 중복 제거
   */
  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export default new NewsApiService();