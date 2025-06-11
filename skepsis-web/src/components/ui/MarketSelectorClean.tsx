import React, { useState } from 'react';
import Marquee from 'react-fast-marquee';
import { cn } from '@/lib/utils';
import { MARKET_DETAILS } from '@/constants/marketDetails';
import { MARKETS } from '@/constants/appConstants';

/**
 * MarketSelectorClean - A clean market selector without extra UI elements
 * 
 * Features:
 * - Clean marquee-style continuous scrolling
 * - Clickable market items
 * - Auto-pause on hover
 * - No extra controls or labels
 * - Minimal, focused design
 */

interface MarketSelectorCleanProps {
  selectedMarketId: string;
  onMarketChange: (marketId: string) => void;
  className?: string;
  isLoading?: boolean;
  speed?: number;
  direction?: 'left' | 'right';
}

export const MarketSelectorClean: React.FC<MarketSelectorCleanProps> = ({
  selectedMarketId,
  onMarketChange,
  className,
  isLoading = false,
  speed = 40,
  direction = 'left'
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Clean Marquee Container - no extra elements */}
      <div className="relative bg-gray-800/40 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm">
        <Marquee
          play={!isLoading}
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
                  <span className="relative z-10">{shortTag}</span>
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-500/20 animate-pulse" />
                  )}
                  {isLoading && isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </Marquee>
      </div>
    </div>
  );
};

export default MarketSelectorClean;
