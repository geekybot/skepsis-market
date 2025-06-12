/**
 * Coin Price Service for fetching live cryptocurrency prices
 * 
 * Primary API: CoinGecko (free tier, no API key required)
 * Fallback API: CoinMarketCap (requires API key)
 */

import { CoinPrice, CoinGeckoResponse, CoinMarketCapResponse, PriceServiceError } from '@/types/coinPrice';

class CoinPriceService {
  private cache: Map<string, { data: CoinPrice; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds
  private readonly REQUEST_TIMEOUT = 10 * 1000; // 10 seconds

  /**
   * Fetch SUI price from CoinGecko API
   */
  private async fetchFromCoinGecko(): Promise<CoinPrice> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true',
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CoinGeckoResponse = await response.json();
      
      if (!data.sui || typeof data.sui.usd !== 'number') {
        throw new Error('Invalid response format');
      }

      return {
        symbol: 'SUI',
        price: data.sui.usd,
        change24h: data.sui.usd_24h_change || 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Fetch SUI price from CoinMarketCap API (fallback)
   */
  private async fetchFromCoinMarketCap(): Promise<CoinPrice> {
    const apiKey = process.env.NEXT_PUBLIC_CMC_API_KEY;
    
    if (!apiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SUI',
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'X-CMC_PRO_API_KEY': apiKey,
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CoinMarketCapResponse = await response.json();
      
      if (!data.data?.SUI?.quote?.USD) {
        throw new Error('Invalid response format');
      }

      const usdData = data.data.SUI.quote.USD;

      return {
        symbol: 'SUI',
        price: usdData.price,
        change24h: usdData.percent_change_24h,
        lastUpdated: new Date(usdData.last_updated),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Get cached price if available and fresh
   */
  private getCachedPrice(symbol: string): CoinPrice | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(symbol);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached price
   */
  private setCachedPrice(symbol: string, price: CoinPrice): void {
    this.cache.set(symbol, {
      data: price,
      timestamp: Date.now(),
    });
  }

  /**
   * Fetch live SUI price with fallback strategy
   */
  async getSUIPrice(): Promise<CoinPrice> {
    // Check cache first
    const cached = this.getCachedPrice('SUI');
    if (cached) {
      return cached;
    }

    let lastError: Error | null = null;

    // Try CoinGecko first (primary)
    try {
      const price = await this.fetchFromCoinGecko();
      this.setCachedPrice('SUI', price);
      return price;
    } catch (error) {
      console.warn('CoinGecko API failed:', error);
      lastError = error as Error;
    }

    // Try CoinMarketCap as fallback
    try {
      const price = await this.fetchFromCoinMarketCap();
      this.setCachedPrice('SUI', price);
      return price;
    } catch (error) {
      console.warn('CoinMarketCap API failed:', error);
      lastError = error as Error;
    }

    // Both APIs failed
    throw new Error(`All price APIs failed. Last error: ${lastError?.message}`);
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache status
   */
  getCacheInfo(): { hasCache: boolean; age: number | null } {
    const cached = this.cache.get('SUI');
    if (!cached) {
      return { hasCache: false, age: null };
    }

    return {
      hasCache: true,
      age: Date.now() - cached.timestamp,
    };
  }
}

// Export singleton instance
export const coinPriceService = new CoinPriceService();
