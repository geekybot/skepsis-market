/**
 * LivePriceDisplay - Component for showing live SUI price with trend indicators
 */

import React from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoinPrice } from '@/types/coinPrice';

interface LivePriceDisplayProps {
  price: CoinPrice | null;
  isLoading: boolean;
  error: string | null;
  isStale?: boolean;
  onRefresh?: () => void;
  className?: string;
  compact?: boolean;
  showIcon?: boolean;
}

export const LivePriceDisplay: React.FC<LivePriceDisplayProps> = ({
  price,
  isLoading,
  error,
  isStale = false,
  onRefresh,
  className,
  compact = false,
  showIcon = true,
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 4,
    }).format(price);
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/30 border border-red-700/50",
        className
      )}>
        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
        <span className="text-red-300 text-sm">Price unavailable</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Retry"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    );
  }

  if (isLoading && !price) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50",
        className
      )}>
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-300 text-sm">Loading price...</span>
      </div>
    );
  }

  if (!price) {
    return null;
  }

  const isPositiveChange = price.change24h >= 0;
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md bg-gray-700/50 border border-gray-600/30",
        isStale && "opacity-75",
        className
      )}>
        {showIcon && (
          <div className="flex items-center">
            <span className="text-xs font-medium text-blue-400">SUI</span>
          </div>
        )}
        <span className="text-white font-medium text-sm">
          {formatPrice(price.price)}
        </span>
        <div className={cn(
          "flex items-center gap-1",
          isPositiveChange ? "text-green-400" : "text-red-400"
        )}>
          <TrendIcon size={12} />
          <span className="text-xs">{formatChange(price.change24h)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-gray-800/60 border border-gray-600/30",
      isStale && "opacity-75",
      className
    )}>
      <div className="flex items-center gap-3">
        {showIcon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30">
            <span className="text-blue-400 font-bold text-sm">SUI</span>
          </div>
        )}
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg">
              {formatPrice(price.price)}
            </span>
            {isLoading && (
              <RefreshCw size={14} className="text-gray-400 animate-spin" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1",
              isPositiveChange ? "text-green-400" : "text-red-400"
            )}>
              <TrendIcon size={14} />
              <span className="text-sm font-medium">
                {formatChange(price.change24h)}
              </span>
            </div>
            <span className="text-gray-400 text-xs">24h</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="text-gray-400 text-xs">
          {getTimeAgo(price.lastUpdated)}
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
              isLoading 
                ? "text-gray-500 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
            title="Refresh price"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
        
        {isStale && (
          <div className="text-yellow-400 text-xs flex items-center gap-1">
            <AlertCircle size={10} />
            <span>Stale</span>
          </div>
        )}
      </div>
    </div>
  );
};
