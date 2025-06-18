import React, { useState } from 'react';
import Marquee from 'react-fast-marquee';
import { cn } from '@/lib/utils';
import { MARKET_DETAILS } from '@/constants/marketDetails';
import { MARKETS } from '@/constants/appConstants';

/**
 * Determine market status based on bidding deadline, resolution time, and market state
 */
function getMarketStatus(marketId: string): {
  status: 'active' | 'waiting-resolution' | 'resolved';
  colorClass: string;
  hexColor: string;
  label: string;
} {
  const marketDetails = MARKET_DETAILS[marketId];
  if (!marketDetails) {
    return { 
      status: 'active', 
      colorClass: 'bg-gray-500', 
      hexColor: '#6b7280',
      label: 'Unknown' 
    };
  }

  const now = new Date();
  let biddingDeadline: Date | null = null;
  let resolutionTime: Date | null = null;

  // Parse dates
  try {
    if (marketDetails.biddingDeadline) {
      biddingDeadline = new Date(marketDetails.biddingDeadline);
    }
    if (marketDetails.resolutionTime) {
      resolutionTime = new Date(marketDetails.resolutionTime);
    }
  } catch (e) {
    console.error('Error parsing market dates:', e);
  }

  // Check if bidding is still open
  const biddingOpen = biddingDeadline ? now < biddingDeadline : true;
  
  // Check if resolution time has passed
  const resolutionPassed = resolutionTime ? now >= resolutionTime : false;

  if (biddingOpen) {
    return { 
      status: 'active', 
      colorClass: 'bg-green-500', 
      hexColor: '#10b981',
      label: 'Active' 
    };
  } else if (!resolutionPassed) {
    return { 
      status: 'waiting-resolution', 
      colorClass: 'bg-orange-500', 
      hexColor: '#f97316',
      label: 'Waiting' 
    };
  } else {
    return { 
      status: 'resolved', 
      colorClass: 'bg-blue-500', 
      hexColor: '#3b82f6',
      label: 'Resolved' 
    };
  }
}

/**
 * MarketSelectorClean - A clean market selector without extra UI elements
 * 
 * Features:
 * - Clean marquee-style continuous scrolling
 * - Clickable market items
 * - Auto-pause on hover
 * - Market status indicators
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
            const marketStatus = getMarketStatus(market.marketId);

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
                  <span className="relative z-10 flex items-center gap-1.5">
                    {/* Market Status Indicator */}
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: marketStatus.hexColor }}
                        title={`Status: ${marketStatus.label}`}
                      />
                      {isSelected && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                    
                    <span>{shortTag}</span>
                  </span>
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
      
      {/* Market Status Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/60">
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: '#10b981' }}
          />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: '#f97316' }}
          />
          <span>Waiting</span>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: '#3b82f6' }}
          />
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
};

export default MarketSelectorClean;
