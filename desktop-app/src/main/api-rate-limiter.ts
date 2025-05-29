import { EventEmitter } from 'events';

interface RateLimitInfo {
  endpoint: string;
  limit: number;
  window: number; // in seconds
  current: number;
  resetTime: number;
}

interface CachedData {
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

export class ApiRateLimiter extends EventEmitter {
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private cache: Map<string, CachedData> = new Map();
  private requestQueue: Map<string, Array<() => Promise<any>>> = new Map();
  private processing: Map<string, boolean> = new Map();

  constructor() {
    super();
    this.initializeRateLimits();
  }

  private initializeRateLimits() {
    // Upbit API rate limits
    this.rateLimits.set('ticker', {
      endpoint: 'ticker',
      limit: 600,
      window: 60, // 600 requests per minute
      current: 0,
      resetTime: Date.now() + 60000
    });

    this.rateLimits.set('orderbook', {
      endpoint: 'orderbook',
      limit: 100,
      window: 60, // 100 requests per minute
      current: 0,
      resetTime: Date.now() + 60000
    });

    this.rateLimits.set('accounts', {
      endpoint: 'accounts',
      limit: 30,
      window: 60, // 30 requests per minute
      current: 0,
      resetTime: Date.now() + 60000
    });

    // Reset counters periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, limit] of this.rateLimits) {
        if (now >= limit.resetTime) {
          limit.current = 0;
          limit.resetTime = now + (limit.window * 1000);
        }
      }
    }, 1000);
  }

  // Check if data is cached and still valid
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Cache data with TTL
  private setCachedData(key: string, data: any, ttl: number = 5000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Check if rate limit allows request
  private canMakeRequest(endpoint: string): boolean {
    const limit = this.rateLimits.get(endpoint);
    if (!limit) return true;

    if (Date.now() >= limit.resetTime) {
      limit.current = 0;
      limit.resetTime = Date.now() + (limit.window * 1000);
    }

    return limit.current < limit.limit;
  }

  // Increment rate limit counter
  private incrementCounter(endpoint: string) {
    const limit = this.rateLimits.get(endpoint);
    if (limit) {
      limit.current++;
    }
  }

  // Execute request with rate limiting and caching
  async executeRequest<T>(
    endpoint: string,
    cacheKey: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000
  ): Promise<T> {
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    // Check rate limit
    if (!this.canMakeRequest(endpoint)) {
      // Add to queue if rate limited
      return new Promise((resolve, reject) => {
        const queue = this.requestQueue.get(endpoint) || [];
        queue.push(async () => {
          try {
            const result = await requestFn();
            this.setCachedData(cacheKey, result, ttl);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        this.requestQueue.set(endpoint, queue);
        
        // Process queue when rate limit resets
        const limit = this.rateLimits.get(endpoint);
        if (limit) {
          const waitTime = Math.max(0, limit.resetTime - Date.now() + 100);
          setTimeout(() => this.processQueue(endpoint), waitTime);
        }
      });
    }

    // Execute request
    try {
      this.incrementCounter(endpoint);
      const result = await requestFn();
      this.setCachedData(cacheKey, result, ttl);
      return result;
    } catch (error: any) {
      // Handle 429 error specifically
      if (error.response?.status === 429) {
        console.error(`Rate limit exceeded for ${endpoint}. Implementing backoff...`);
        const limit = this.rateLimits.get(endpoint);
        if (limit) {
          // Double the reset time on 429
          limit.resetTime = Date.now() + (limit.window * 2000);
          limit.current = limit.limit; // Mark as fully used
        }
      }
      throw error;
    }
  }

  // Process queued requests
  private async processQueue(endpoint: string) {
    if (this.processing.get(endpoint)) return;
    
    this.processing.set(endpoint, true);
    const queue = this.requestQueue.get(endpoint) || [];
    
    while (queue.length > 0 && this.canMakeRequest(endpoint)) {
      const request = queue.shift();
      if (request) {
        this.incrementCounter(endpoint);
        await request();
        // Small delay between queued requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.requestQueue.set(endpoint, queue);
    this.processing.set(endpoint, false);
  }

  // Get current rate limit status
  getRateLimitStatus(): Map<string, RateLimitInfo> {
    return new Map(this.rateLimits);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entries
  clearCachePattern(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const apiRateLimiter = new ApiRateLimiter();