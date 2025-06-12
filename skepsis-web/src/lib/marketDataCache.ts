/**
 * Market Data Cache
 * 
 * A comprehensive caching solution for market data that reduces blockchain calls
 * and improves application performance. Implements multiple cache layers:
 * 
 * 1. Static Data Cache - Question, resolution criteria, spread labels (never expires)
 * 2. Semi-Static Cache - Bidding deadline, resolution time (expires rarely)  
 * 3. Dynamic Cache - Prices, shares, state (expires frequently)
 * 4. User-Specific Cache - Positions, holdings (expires per user)
 */

import { getMarketDetails, MARKET_SPREAD_LABELS } from '@/constants/marketDetails';

// Cache duration constants (in milliseconds)
export const CACHE_DURATIONS = {
  STATIC: Infinity,           // Never expires - question, resolution criteria
  SEMI_STATIC: 5 * 60 * 1000, // 5 minutes - bidding deadline, resolution time
  DYNAMIC: 30 * 1000,         // 30 seconds - prices, outstanding shares
  USER_SPECIFIC: 10 * 1000,   // 10 seconds - user positions
  ERROR: 5 * 1000,           // 5 seconds - error responses
} as const;

// Cache data types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  cacheType: keyof typeof CACHE_DURATIONS;
}

export interface StaticMarketData {
  question: string;
  resolutionCriteria: string;
  shortTag?: string;
  spreadLabels?: any[];
  biddingDeadline?: string | number;
  resolutionTime?: string | number;
}

export interface DynamicMarketData {
  spreadPrices?: number[];
  outstandingShares?: number[];
  totalLiquidity?: number;
  cumulativeSharesSold?: number;
  marketState?: number;
  resolvedValue?: number;
}

export interface TimingData {
  biddingDeadline?: number;
  resolutionTime?: number;
  biddingDeadlineDisplay?: string;
  resolutionTimeDisplay?: string;
  biddingOpen?: boolean;
  isResolved?: boolean;
}

export interface UserPositionData {
  positions: any[];
  totalValue: number;
  spreadBreakdown: Record<number, number>;
}

// Cache stores
class MarketDataCache {
  private staticCache = new Map<string, CacheEntry<StaticMarketData>>();
  private dynamicCache = new Map<string, CacheEntry<DynamicMarketData>>();
  private timingCache = new Map<string, CacheEntry<TimingData>>();
  private userCache = new Map<string, CacheEntry<UserPositionData>>();
  private errorCache = new Map<string, CacheEntry<Error>>();

  /**
   * Get static market data (question, resolution criteria, etc.)
   * This data never changes and can be cached indefinitely
   */
  getStaticData(marketId: string): StaticMarketData | null {
    const cached = this.staticCache.get(marketId);
    if (cached) {
      return cached.data;
    }

    // Try to get from constants
    const staticDetails = getMarketDetails(marketId);
    if (staticDetails.question !== "Unknown Market") {
      const staticData: StaticMarketData = {
        question: staticDetails.question,
        resolutionCriteria: staticDetails.resolutionCriteria,
        shortTag: staticDetails.shortTag,
        spreadLabels: MARKET_SPREAD_LABELS[marketId],
        biddingDeadline: staticDetails.biddingDeadline,
        resolutionTime: staticDetails.resolutionTime,
      };

      this.setStaticData(marketId, staticData);
      return staticData;
    }

    return null;
  }

  /**
   * Set static market data
   */
  setStaticData(marketId: string, data: StaticMarketData): void {
    const now = Date.now();
    this.staticCache.set(marketId, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATIONS.STATIC,
      cacheType: 'STATIC'
    });
  }

  /**
   * Get dynamic market data (prices, shares, state)
   */
  getDynamicData(marketId: string): DynamicMarketData | null {
    const cached = this.dynamicCache.get(marketId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set dynamic market data
   */
  setDynamicData(marketId: string, data: DynamicMarketData): void {
    const now = Date.now();
    this.dynamicCache.set(marketId, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATIONS.DYNAMIC,
      cacheType: 'DYNAMIC'
    });
  }

  /**
   * Get timing data (bidding deadline, resolution time)
   */
  getTimingData(marketId: string): TimingData | null {
    const cached = this.timingCache.get(marketId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set timing data
   */
  setTimingData(marketId: string, data: TimingData): void {
    const now = Date.now();
    this.timingCache.set(marketId, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATIONS.SEMI_STATIC,
      cacheType: 'SEMI_STATIC'
    });
  }

  /**
   * Get user position data
   */
  getUserData(userMarketKey: string): UserPositionData | null {
    const cached = this.userCache.get(userMarketKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set user position data
   */
  setUserData(userMarketKey: string, data: UserPositionData): void {
    const now = Date.now();
    this.userCache.set(userMarketKey, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATIONS.USER_SPECIFIC,
      cacheType: 'USER_SPECIFIC'
    });
  }

  /**
   * Check if we have a recent error for this market to avoid repeated failed calls
   */
  hasRecentError(marketId: string): boolean {
    const cached = this.errorCache.get(marketId);
    return cached ? Date.now() < cached.expiresAt : false;
  }

  /**
   * Cache an error for this market
   */
  setError(marketId: string, error: Error): void {
    const now = Date.now();
    this.errorCache.set(marketId, {
      data: error,
      timestamp: now,
      expiresAt: now + CACHE_DURATIONS.ERROR,
      cacheType: 'ERROR'
    });
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.staticCache.clear();
    this.dynamicCache.clear();
    this.timingCache.clear();
    this.userCache.clear();
    this.errorCache.clear();
  }

  /**
   * Clear expired entries from all caches
   */
  cleanupExpired(): void {
    const now = Date.now();
    
    [this.staticCache, this.dynamicCache, this.timingCache, this.userCache, this.errorCache].forEach(cache => {
      const keysToDelete: string[] = [];
      cache.forEach((entry, key) => {
        if (now >= entry.expiresAt) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => cache.delete(key));
    });
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    const now = Date.now();
    
    const getCacheStats = (cache: Map<string, CacheEntry>) => {
      const total = cache.size;
      let valid = 0;
      let expired = 0;
      
      cache.forEach((entry) => {
        if (now < entry.expiresAt) {
          valid++;
        } else {
          expired++;
        }
      });
      
      return { total, valid, expired };
    };

    return {
      static: getCacheStats(this.staticCache),
      dynamic: getCacheStats(this.dynamicCache),
      timing: getCacheStats(this.timingCache),
      user: getCacheStats(this.userCache),
      error: getCacheStats(this.errorCache),
    };
  }

  /**
   * Preload static data for all known markets
   */
  preloadStaticData(): void {
    // Get all market IDs from constants
    const allMarketIds = Object.keys(getMarketDetails('') ? {} : {});
    
    // This would be called with actual market IDs in a real implementation
    // For now, we'll let the data be loaded on-demand
  }
}

// Export singleton instance
export const marketDataCache = new MarketDataCache();

// Helper functions for easy access
export const getCachedStaticData = (marketId: string) => marketDataCache.getStaticData(marketId);
export const setCachedStaticData = (marketId: string, data: StaticMarketData) => marketDataCache.setStaticData(marketId, data);

export const getCachedDynamicData = (marketId: string) => marketDataCache.getDynamicData(marketId);
export const setCachedDynamicData = (marketId: string, data: DynamicMarketData) => marketDataCache.setDynamicData(marketId, data);

export const getCachedTimingData = (marketId: string) => marketDataCache.getTimingData(marketId);
export const setCachedTimingData = (marketId: string, data: TimingData) => marketDataCache.setTimingData(marketId, data);

export const getCachedUserData = (userAddress: string, marketId: string) => 
  marketDataCache.getUserData(`${userAddress}:${marketId}`);
export const setCachedUserData = (userAddress: string, marketId: string, data: UserPositionData) => 
  marketDataCache.setUserData(`${userAddress}:${marketId}`, data);

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    marketDataCache.cleanupExpired();
  }, 5 * 60 * 1000);
}
