import React, { useState } from 'react';
import Marquee from 'react-fast-marquee';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MARKET_DETAILS } from '@/constants/marketDetails';
import { MARKETS } from '@/constants/appConstants';
import { useLiveCoinPrice } from '@/hooks/useLiveCoinPrice';
import { isSUIMarket } from '@/utilities/suiMarketUtils';

/**
 * MarketSelectorMarquee - A continuous scrolling marquee for market selection
 * 
 * Features:
 * - News ticker style continuous scrolling
 * - Pause/Play controls
 * - Clickable market items
 * - Auto-pause on hover
 * - Smooth gradient edges
 * - Responsive design
 */

interface MarketSelectorMarqueeProps {
  selectedMarketId: string;
  onMarketChange: (marketId: string) => void;
  className?: string;
  isLoading?: boolean;
  speed?: number;
  direction?: 'left' | 'right';
}

export const MarketSelectorMarquee: React.FC<MarketSelectorMarqueeProps> = ({
  selectedMarketId,
  onMarketChange,
  className,
  isLoading = false,
  speed = 30,
  direction = 'left'
}) => {
  const [isPlaying, setIsPlaying] = useState(true);

  // Hook for live SUI price (only fetch if we have SUI markets)
  const hasSUIMarkets = MARKETS.some(market => isSUIMarket(market.marketId));
  const { 
    price: suiPrice, 
    isLoading: priceLoading, 
    error: priceError 
  } = useLiveCoinPrice('SUI', {
    enableAutoRefresh: hasSUIMarkets,
    refreshInterval: 30000, // 30 seconds
  });

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Header with label and controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white/90">Markets</h3>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        
        <button
          onClick={togglePlay}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-700/60 hover:bg-gray-600/70 border border-white/10 transition-all duration-200 text-xs text-white/80 hover:text-white"
          aria-label={isPlaying ? 'Pause marquee' : 'Play marquee'}
        >
          {isPlaying ? (
            <>
              <Pause size={12} />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play size={12} />
              <span className="hidden sm:inline">Play</span>
            </>
          )}
        </button>
      </div>

      {/* Marquee Container */}
      <div className="relative bg-gray-800/40 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm">
        <Marquee
          play={isPlaying && !isLoading}
          speed={speed}
          direction={direction}
          pauseOnHover={true}
          pauseOnClick={false}
          gradient={true}
          gradientColor="rgb(31, 41, 55)"
          gradientWidth={40}
          className="py-3"
        >
          {MARKETS.map((market, index) => {
            const marketDetails = MARKET_DETAILS[market.marketId];
            const shortTag = marketDetails?.shortTag || market.name;
            const isSelected = market.marketId === selectedMarketId;
            const isSUI = isSUIMarket(market.marketId);

            // Format live price for SUI markets - ultra compact
            const formatLivePrice = () => {
              if (!suiPrice || priceError) return null;
              
              const isPositive = suiPrice.change24h >= 0;
              
              return (
                <span className={cn(
                  "ml-1 text-xs font-medium",
                  isPositive ? "text-green-300" : "text-red-300"
                )}>
                  ${suiPrice.price.toFixed(2)}
                </span>
              );
            };

            return (
              <div key={`${market.marketId}-${index}`} className="mx-2 sm:mx-3">
                <button
                  onClick={() => onMarketChange(market.marketId)}
                  disabled={isLoading}
                  className={cn(
                    "relative px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap overflow-hidden",
                    isLoading && "opacity-50 cursor-not-allowed",
                    isSelected
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/50 scale-105"
                      : "bg-gray-700/60 text-white/80 hover:bg-gray-600/80 hover:text-white border border-white/10 hover:border-white/20 hover:shadow-md hover:scale-105"
                  )}
                >
                  {/* Background animation for selected item */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-500/80 animate-pulse" />
                  )}
                  
                  <span className="relative z-10 flex items-center gap-1">
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                    <span>{shortTag}</span>
                    {isSUI && formatLivePrice()}
                    {isSelected && isLoading && (
                      <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin ml-1" />
                    )}
                  </span>
                </button>
              </div>
            );
          })}
          
          {/* Separator between loops */}
          <div className="mx-6 text-white/30 text-xs flex items-center">
            <div className="w-1 h-1 bg-white/30 rounded-full mx-2" />
            <div className="w-1 h-1 bg-white/30 rounded-full mx-2" />
            <div className="w-1 h-1 bg-white/30 rounded-full mx-2" />
          </div>
        </Marquee>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Loading markets...
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between mt-2 text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          {isPlaying ? (
            <span className="text-green-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-yellow-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              Paused
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>Speed:</span>
          <span className="text-white/80">{speed}px/s</span>
        </div>
      </div>
    </div>
  );
};

export default MarketSelectorMarquee;
