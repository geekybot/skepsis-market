/**
 * Optimized Market Info Hook with Caching
 * 
 * This hook provides market data with intelligent caching to dramatically
 * reduce blockchain calls and improve performance.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { OptimizedMarketService, OptimizedMarketInfo } from '@/services/optimizedMarketService';
import { getCachedStaticData, getCachedDynamicData, getCachedTimingData } from '@/lib/marketDataCache';

export interface UseOptimizedMarketInfoResult {
  data: OptimizedMarketInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  cacheStats: {
    staticFromCache: boolean;
    dynamicFromCache: boolean;
    timingFromCache: boolean;
    fetchTime: number;
  } | null;
}

/**
 * Hook for getting optimized market info with caching
 */
export function useOptimizedMarketInfo(marketId: string): UseOptimizedMarketInfoResult {
  const suiClient = useSuiClient();
  const [data, setData] = useState<OptimizedMarketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create service instance (memoized to avoid recreation)
  const marketService = useMemo(
    () => new OptimizedMarketService(suiClient),
    [suiClient]
  );

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    if (!marketId) return;

    try {
      setLoading(true);
      setError(null);

      const marketData = await marketService.getMarketInfo(marketId);
      setData(marketData);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [marketId, marketService]);

  // Check if we have any cached data available for immediate display
  const hasCachedData = useMemo(() => {
    if (!marketId) return false;
    
    return !!(
      getCachedStaticData(marketId) ||
      getCachedDynamicData(marketId) ||
      getCachedTimingData(marketId)
    );
  }, [marketId]);

  // If we have cached data, show it immediately while fetching fresh data
  useEffect(() => {
    if (marketId && hasCachedData) {
      // Try to construct partial data from cache for immediate display
      const staticData = getCachedStaticData(marketId);
      const dynamicData = getCachedDynamicData(marketId);
      const timingData = getCachedTimingData(marketId);

      if (staticData) {
        // Show cached data immediately
        setData({
          marketId,
          question: staticData.question,
          resolutionCriteria: staticData.resolutionCriteria,
          shortTag: staticData.shortTag,
          biddingDeadline: timingData?.biddingDeadline,
          resolutionTime: timingData?.resolutionTime,
          biddingDeadlineDisplay: timingData?.biddingDeadlineDisplay,
          resolutionTimeDisplay: timingData?.resolutionTimeDisplay,
          biddingOpen: timingData?.biddingOpen,
          isResolved: timingData?.isResolved,
          marketState: dynamicData?.marketState,
          stateDisplay: getMarketStateString(dynamicData?.marketState || 0),
          resolvedValue: dynamicData?.resolvedValue,
          totalLiquidity: dynamicData?.totalLiquidity,
          cumulativeSharesSold: dynamicData?.cumulativeSharesSold,
          spreadPrices: dynamicData?.spreadPrices,
          outstandingShares: dynamicData?.outstandingShares,
          spreads: [],
          cacheInfo: {
            staticFromCache: true,
            dynamicFromCache: !!dynamicData,
            timingFromCache: !!timingData,
            fetchTime: 0
          }
        });
        setLoading(false);
      }
    }
  }, [marketId, hasCachedData]);

  // Fetch data when marketId changes
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const cacheStats = data?.cacheInfo || null;

  return {
    data,
    loading,
    error,
    refresh: fetchMarketData,
    cacheStats
  };
}

/**
 * Hook for getting multiple markets info with batched caching
 */
export function useOptimizedMultipleMarketsInfo(marketIds: string[]) {
  const suiClient = useSuiClient();
  const [data, setData] = useState<OptimizedMarketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const marketService = useMemo(
    () => new OptimizedMarketService(suiClient),
    [suiClient]
  );

  const fetchMarketsData = useCallback(async () => {
    if (!marketIds.length) return;

    try {
      setLoading(true);
      setError(null);

      const marketsData = await marketService.getMultipleMarketsInfo(marketIds);
      setData(marketsData);
    } catch (err) {
      console.error('Error fetching markets data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch markets data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [marketIds, marketService]);

  useEffect(() => {
    fetchMarketsData();
  }, [fetchMarketsData]);

  return {
    data,
    loading,
    error,
    refresh: fetchMarketsData,
    // Additional stats for multiple markets
    cacheEfficiency: {
      totalMarkets: marketIds.length,
      fromCache: data.filter(m => m.cacheInfo.staticFromCache).length,
      avgFetchTime: data.length > 0 
        ? data.reduce((sum, m) => sum + m.cacheInfo.fetchTime, 0) / data.length 
        : 0
    }
  };
}

/**
 * Hook for getting market data with automatic refresh intervals
 */
export function useOptimizedMarketInfoWithRefresh(
  marketId: string, 
  refreshInterval: number = 30000 // 30 seconds default
) {
  const result = useOptimizedMarketInfo(marketId);
  
  useEffect(() => {
    if (!refreshInterval || refreshInterval < 5000) return; // Minimum 5 seconds

    const interval = setInterval(() => {
      result.refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, result.refresh]);

  return result;
}

/**
 * Hook that provides cache statistics and management
 */
export function useMarketCacheManager() {
  const suiClient = useSuiClient();
  const [stats, setStats] = useState<any>(null);

  const marketService = useMemo(
    () => new OptimizedMarketService(suiClient),
    [suiClient]
  );

  const refreshStats = useCallback(() => {
    const cacheStats = marketService.getCacheStats();
    setStats(cacheStats);
  }, [marketService]);

  const clearCache = useCallback(() => {
    marketService.clearCache();
    refreshStats();
  }, [marketService, refreshStats]);

  useEffect(() => {
    refreshStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    clearCache
  };
}

// Helper function
function getMarketStateString(state: number): string {
  switch (state) {
    case 0: return 'Active';
    case 1: return 'Resolved';
    case 2: return 'Canceled';
    default: return `Unknown (${state})`;
  }
}
