/**
 * Optimized Market Service with Caching
 * 
 * This service layer implements intelligent caching to minimize blockchain calls
 * and dramatically improve application performance.
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { CONSTANTS, MODULES } from '@/constants/appConstants';
import { 
  marketDataCache, 
  getCachedStaticData, 
  setCachedStaticData,
  getCachedDynamicData, 
  setCachedDynamicData,
  getCachedTimingData,
  setCachedTimingData,
  getCachedUserData,
  setCachedUserData,
  StaticMarketData,
  DynamicMarketData,
  TimingData,
  UserPositionData
} from '@/lib/marketDataCache';
import { cacheMonitor } from '@/lib/cachePerformanceMonitor';

export interface OptimizedMarketInfo {
  marketId: string;
  question: string;
  resolutionCriteria: string;
  shortTag?: string;
  
  // Timing information
  biddingDeadline?: number;
  resolutionTime?: number;
  biddingDeadlineDisplay?: string;
  resolutionTimeDisplay?: string;
  biddingOpen?: boolean;
  isResolved?: boolean;
  
  // Market state
  marketState?: number;
  stateDisplay?: string;
  resolvedValue?: number;
  
  // Liquidity and trading
  totalLiquidity?: number;
  cumulativeSharesSold?: number;
  spreadPrices?: number[];
  outstandingShares?: number[];
  
  // Spread details
  spreads?: Array<{
    spreadIndex: number;
    lowerBound: number;
    upperBound: number;
    outstandingShares: number;
    percentage: number;
    buyPrice?: number;
    sellPrice?: number;
  }>;
  
  // Cache metadata
  cacheInfo: {
    staticFromCache: boolean;
    dynamicFromCache: boolean;
    timingFromCache: boolean;
    fetchTime: number;
  };
}

export class OptimizedMarketService {
  constructor(private client: SuiClient) {}

  /**
   * Get comprehensive market information using intelligent caching
   */
  async getMarketInfo(marketId: string): Promise<OptimizedMarketInfo> {
    const fetchStartTime = Date.now();
    
    // Check if we have recent errors for this market
    if (marketDataCache.hasRecentError(marketId)) {
      cacheMonitor.recordError();
      throw new Error(`Recent error cached for market ${marketId}`);
    }

    try {
      // 1. Get static data from cache or constants
      let staticData = getCachedStaticData(marketId);
      const staticFromCache = !!staticData;
      
      if (!staticData) {
        // This should rarely happen since static data is loaded from constants
        staticData = await this.fetchStaticData(marketId);
        setCachedStaticData(marketId, staticData);
        cacheMonitor.recordCacheMiss(Date.now() - fetchStartTime);
      } else {
        cacheMonitor.recordCacheHit(Date.now() - fetchStartTime);
      }

      // 2. Get timing data from cache or fetch if needed
      let timingData = getCachedTimingData(marketId);
      const timingFromCache = !!timingData;
      
      if (!timingData) {
        timingData = await this.fetchTimingData(marketId);
        setCachedTimingData(marketId, timingData);
      }

      // 3. Get dynamic data from cache or fetch if needed
      let dynamicData = getCachedDynamicData(marketId);
      const dynamicFromCache = !!dynamicData;
      
      if (!dynamicData) {
        dynamicData = await this.fetchDynamicData(marketId);
        setCachedDynamicData(marketId, dynamicData);
      }

      // 4. Process spreads data
      const spreads = await this.processSpreadsData(marketId, dynamicData);

      // 5. Assemble the complete market info
      const result: OptimizedMarketInfo = {
        marketId,
        question: staticData.question,
        resolutionCriteria: staticData.resolutionCriteria,
        shortTag: staticData.shortTag,
        
        // Timing
        biddingDeadline: timingData.biddingDeadline,
        resolutionTime: timingData.resolutionTime,
        biddingDeadlineDisplay: timingData.biddingDeadlineDisplay,
        resolutionTimeDisplay: timingData.resolutionTimeDisplay,
        biddingOpen: timingData.biddingOpen,
        isResolved: timingData.isResolved,
        
        // Market state
        marketState: dynamicData.marketState,
        stateDisplay: this.getMarketStateString(dynamicData.marketState || 0),
        resolvedValue: dynamicData.resolvedValue,
        
        // Liquidity
        totalLiquidity: dynamicData.totalLiquidity,
        cumulativeSharesSold: dynamicData.cumulativeSharesSold,
        spreadPrices: dynamicData.spreadPrices,
        outstandingShares: dynamicData.outstandingShares,
        
        // Spreads
        spreads,
        
        // Cache metadata
        cacheInfo: {
          staticFromCache,
          dynamicFromCache,
          timingFromCache,
          fetchTime: Date.now() - fetchStartTime
        }
      };

      return result;

    } catch (error) {
      // Cache the error to prevent repeated failed calls
      marketDataCache.setError(marketId, error as Error);
      cacheMonitor.recordError();
      throw error;
    }
  }

  /**
   * Get multiple markets info efficiently using parallel fetching with caching
   */
  async getMultipleMarketsInfo(marketIds: string[]): Promise<OptimizedMarketInfo[]> {
    // Group markets by what data they need to fetch
    const needsStaticData: string[] = [];
    const needsTimingData: string[] = [];
    const needsDynamicData: string[] = [];

    // Pre-check what each market needs
    for (const marketId of marketIds) {
      if (!getCachedStaticData(marketId)) {
        needsStaticData.push(marketId);
      }
      if (!getCachedTimingData(marketId)) {
        needsTimingData.push(marketId);
      }
      if (!getCachedDynamicData(marketId)) {
        needsDynamicData.push(marketId);
      }
    }

    // Batch fetch data that's not cached
    const fetchPromises: Promise<any>[] = [];

    if (needsStaticData.length > 0) {
      fetchPromises.push(this.batchFetchStaticData(needsStaticData));
    }
    if (needsTimingData.length > 0) {
      fetchPromises.push(this.batchFetchTimingData(needsTimingData));
    }
    if (needsDynamicData.length > 0) {
      fetchPromises.push(this.batchFetchDynamicData(needsDynamicData));
    }

    // Wait for all batches to complete
    await Promise.all(fetchPromises);

    // Now assemble the results (all data should be cached)
    const results = await Promise.all(
      marketIds.map(marketId => this.getMarketInfo(marketId))
    );

    return results;
  }

  /**
   * Get user positions with caching
   */
  async getUserPositions(marketId: string, userAddress: string): Promise<UserPositionData> {
    const cached = getCachedUserData(userAddress, marketId);
    if (cached) {
      return cached;
    }

    // Fetch fresh user data
    const userData = await this.fetchUserPositions(marketId, userAddress);
    setCachedUserData(userAddress, marketId, userData);
    
    return userData;
  }

  /**
   * Batch fetch static data for multiple markets
   */
  private async batchFetchStaticData(marketIds: string[]): Promise<void> {
    // Static data is mostly loaded from constants, so this is fast
    for (const marketId of marketIds) {
      const staticData = await this.fetchStaticData(marketId);
      setCachedStaticData(marketId, staticData);
    }
  }

  /**
   * Batch fetch timing data for multiple markets
   */
  private async batchFetchTimingData(marketIds: string[]): Promise<void> {
    // We can potentially batch these calls in the future
    const promises = marketIds.map(async (marketId) => {
      const timingData = await this.fetchTimingData(marketId);
      setCachedTimingData(marketId, timingData);
    });
    
    await Promise.all(promises);
  }

  /**
   * Batch fetch dynamic data for multiple markets
   */
  private async batchFetchDynamicData(marketIds: string[]): Promise<void> {
    // Process in smaller batches to avoid overwhelming the RPC
    const batchSize = 5;
    
    for (let i = 0; i < marketIds.length; i += batchSize) {
      const batch = marketIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (marketId) => {
        const dynamicData = await this.fetchDynamicData(marketId);
        setCachedDynamicData(marketId, dynamicData);
      });
      
      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < marketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Fetch static data (question, resolution criteria, etc.)
   */
  private async fetchStaticData(marketId: string): Promise<StaticMarketData> {
    // Try to get from constants first
    const cachedStatic = getCachedStaticData(marketId);
    if (cachedStatic) {
      return cachedStatic;
    }

    // If not in constants, fetch from blockchain (rare case)
    const marketObject = await this.client.getObject({
      id: marketId,
      options: { showContent: true }
    });

    if (!marketObject.data?.content || marketObject.data.content.dataType !== 'moveObject') {
      throw new Error(`Invalid market object for ${marketId}`);
    }

    const fields = marketObject.data.content.fields as any;
    
    return {
      question: this.byteArrayToString(fields.question || []),
      resolutionCriteria: this.byteArrayToString(fields.resolution_criteria || []),
      biddingDeadline: Number(fields.bidding_deadline || 0),
      resolutionTime: Number(fields.resolution_time || 0),
    };
  }

  /**
   * Fetch timing data
   */
  private async fetchTimingData(marketId: string): Promise<TimingData> {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::get_market_timing`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`],
      arguments: [tx.object(marketId)],
    });

    const response = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: CONSTANTS.NETWORK.DEFAULT_SENDER,
    });

    if (!response.results?.[0]?.returnValues) {
      throw new Error('Failed to fetch timing data');
    }

    const returnValues = response.results[0].returnValues;
    
    // Parse timing data
    const biddingDeadline = this.parseU64(returnValues[0]?.[0] || []);
    const resolutionTime = this.parseU64(returnValues[1]?.[0] || []);
    const resolvedValue = this.parseU64(returnValues[2]?.[0] || []);

    const now = Date.now();
    
    return {
      biddingDeadline,
      resolutionTime,
      biddingDeadlineDisplay: new Date(biddingDeadline).toISOString(),
      resolutionTimeDisplay: new Date(resolutionTime).toISOString(),
      biddingOpen: now < biddingDeadline,
      isResolved: resolvedValue > 0,
    };
  }

  /**
   * Fetch dynamic data (prices, shares, state)
   */
  private async fetchDynamicData(marketId: string): Promise<DynamicMarketData> {
    // Fetch market object for basic state
    const marketObject = await this.client.getObject({
      id: marketId,
      options: { showContent: true }
    });

    if (!marketObject.data?.content || marketObject.data.content.dataType !== 'moveObject') {
      throw new Error(`Invalid market object for ${marketId}`);
    }

    const fields = marketObject.data.content.fields as any;
    
    // Get spread prices in a separate call
    const spreadPrices = await this.fetchSpreadPrices(marketId);
    
    // Extract outstanding shares from spreads
    const outstandingShares: number[] = [];
    if (fields.spreads && Array.isArray(fields.spreads)) {
      for (const spread of fields.spreads) {
        outstandingShares.push(Number(spread.fields?.outstanding_shares || 0));
      }
    }

    return {
      spreadPrices,
      outstandingShares,
      totalLiquidity: Number(fields.total_shares || 0),
      cumulativeSharesSold: Number(fields.cumulative_shares_sold || 0),
      marketState: Number(fields.market_state || 0),
      resolvedValue: Number(fields.resolved_value || 0),
    };
  }

  /**
   * Fetch spread prices
   */
  private async fetchSpreadPrices(marketId: string): Promise<number[]> {
    const tx = new Transaction();
    
    const targetAddress = `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::get_all_spread_prices`;
    const typeArg = `${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`;
    
    
    tx.moveCall({
      target: targetAddress,
      typeArguments: [typeArg],
      arguments: [tx.object(marketId)],
    });

    const response = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: CONSTANTS.NETWORK.DEFAULT_SENDER,
    });

    if (!response.results?.[0]?.returnValues) {
      throw new Error('Failed to fetch spread prices');
    }

    const returnValues = response.results[0].returnValues;
    const pricesBytes = returnValues[1]?.[0] || [];
    
    const prices: number[] = [];
    const numPrices = pricesBytes[0] || 0;
    
    for (let i = 0; i < numPrices; i++) {
      let price = 0;
      for (let j = 0; j < 8; j++) {
        if (1 + i * 8 + j < pricesBytes.length) {
          price += pricesBytes[1 + i * 8 + j] * Math.pow(256, j);
        }
      }
      prices.push(price);
    }

    return prices;
  }

  /**
   * Fetch user positions
   */
  private async fetchUserPositions(marketId: string, userAddress: string): Promise<UserPositionData> {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::get_user_position`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`],
      arguments: [tx.object(marketId), tx.pure.address(userAddress)],
    });

    const response = await this.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: CONSTANTS.NETWORK.DEFAULT_SENDER,
    });

    if (!response.results?.[0]?.returnValues) {
      return {
        positions: [],
        totalValue: 0,
        spreadBreakdown: {},
      };
    }

    // Parse user position data
    const returnValues = response.results[0].returnValues;
    // Implementation would parse the returned position data
    
    return {
      positions: [], // Parse actual positions
      totalValue: 0, // Calculate total value
      spreadBreakdown: {}, // Parse spread breakdown
    };
  }

  /**
   * Process spreads data
   */
  private async processSpreadsData(marketId: string, dynamicData: DynamicMarketData) {
    const spreads = [];
    const { spreadPrices = [], outstandingShares = [] } = dynamicData;
    
    const totalShares = outstandingShares.reduce((sum, shares) => sum + shares, 0);
    
    for (let i = 0; i < Math.max(spreadPrices.length, outstandingShares.length); i++) {
      const shares = outstandingShares[i] || 0;
      
      spreads.push({
        spreadIndex: i,
        lowerBound: i * 10,
        upperBound: (i + 1) * 10,
        outstandingShares: shares,
        percentage: totalShares > 0 ? (shares / totalShares) * 100 : 0,
        buyPrice: spreadPrices[i],
        sellPrice: undefined, // Would need separate call
      });
    }
    
    return spreads;
  }

  /**
   * Helper method to convert byte array to string
   */
  private byteArrayToString(byteArray: number[]): string {
    try {
      return String.fromCharCode(...byteArray);
    } catch (e) {
      return '';
    }
  }

  /**
   * Helper method to parse u64 from bytes
   */
  private parseU64(bytes: number[]): number {
    let result = 0;
    for (let i = 0; i < Math.min(bytes.length, 8); i++) {
      result += bytes[i] * Math.pow(256, i);
    }
    return result;
  }

  /**
   * Get market state as string
   */
  private getMarketStateString(state: number): string {
    switch (state) {
      case 0: return 'Active';
      case 1: return 'Resolved';
      case 2: return 'Canceled';
      default: return `Unknown (${state})`;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return marketDataCache.getStats();
  }

  /**
   * Clear all caches
   */
  clearCache() {
    marketDataCache.clearAll();
  }
}
