/**
 * Hook for fetching and managing live coin prices
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinPrice } from '@/types/coinPrice';
import { coinPriceService } from '@/services/coinPriceService';

interface UseLiveCoinPriceReturn {
  price: CoinPrice | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  isStale: boolean;
}

interface UseLiveCoinPriceOptions {
  refreshInterval?: number; // in milliseconds
  enableAutoRefresh?: boolean;
  onPriceChange?: (newPrice: CoinPrice, oldPrice: CoinPrice | null) => void;
}

export function useLiveCoinPrice(
  symbol: string = 'SUI',
  options: UseLiveCoinPriceOptions = {}
): UseLiveCoinPriceReturn {
  const {
    refreshInterval = 30000, // 30 seconds
    enableAutoRefresh = true,
    onPriceChange,
  } = options;

  const [price, setPrice] = useState<CoinPrice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Check if price data is stale (older than refresh interval)
  const isStale = price ? 
    (Date.now() - price.lastUpdated.getTime()) > refreshInterval : 
    false;

  const fetchPrice = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const newPrice = await coinPriceService.getSUIPrice();
      
      if (!mountedRef.current) return;

      // Call onPriceChange callback if provided
      if (onPriceChange && price) {
        onPriceChange(newPrice, price);
      }

      setPrice(newPrice);
      setLastUpdated(new Date());
      setRetryCount(0); // Reset retry count on successful fetch
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price';
      setError(errorMessage);
      console.error('Failed to fetch SUI price:', err);

      // Retry fetching the price if the maximum retry count has not been reached
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          fetchPrice();
        }, 2000); // Retry after 2 seconds
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [price, onPriceChange, retryCount]);

  const refresh = useCallback(async (): Promise<void> => {
    // Clear cache to force fresh data
    coinPriceService.clearCache();
    await fetchPrice();
  }, [fetchPrice]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!enableAutoRefresh) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      fetchPrice();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrice, refreshInterval, enableAutoRefresh]);

  // Initial fetch
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    price,
    isLoading,
    error,
    lastUpdated,
    refresh,
    isStale,
  };
}
