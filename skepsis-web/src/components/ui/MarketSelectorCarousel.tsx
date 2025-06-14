import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MARKET_DETAILS } from '@/constants/marketDetails';
import { MARKETS } from '@/constants/appConstants';

/**
 * MarketSelectorCarousel - A horizontal scrolling carousel for market selection
 * 
 * Features:
 * - Displays shortTags from MARKET_DETAILS for each market
 * - Horizontal scrolling with navigation arrows
 * - Auto-scroll to selected market
 * - Keyboard navigation (arrow keys)
 * - Loading states and accessibility support
 * - Responsive design for mobile and desktop
 */

interface MarketSelectorCarouselProps {
  selectedMarketId: string;
  onMarketChange: (marketId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export const MarketSelectorCarousel: React.FC<MarketSelectorCarouselProps> = ({
  selectedMarketId,
  onMarketChange,
  className,
  isLoading = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Auto-scroll to selected market when it changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const selectedElement = container.querySelector(`[data-market-id="${selectedMarketId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedMarketId]);

  // Check scroll position on mount and scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollPosition();
      container.addEventListener('scroll', checkScrollPosition);
      
      // Check again after a brief delay to handle dynamic content
      const timeoutId = setTimeout(checkScrollPosition, 100);
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  // Handle touch/swipe navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      scrollRight();
    } else if (isRightSwipe) {
      scrollLeft();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const currentIndex = MARKETS.findIndex(m => m.marketId === selectedMarketId);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : MARKETS.length - 1;
      onMarketChange(MARKETS[prevIndex].marketId);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = MARKETS.findIndex(m => m.marketId === selectedMarketId);
      const nextIndex = currentIndex < MARKETS.length - 1 ? currentIndex + 1 : 0;
      onMarketChange(MARKETS[nextIndex].marketId);
    }
  };

  return (
    <div 
      className={cn("relative flex items-center gap-2", className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700/80 hover:bg-gray-600/80 border border-white/10 flex items-center justify-center transition-all duration-200 z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft size={14} className="text-white sm:w-4 sm:h-4" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide gap-2 sm:gap-3 py-2 flex-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {MARKETS.map((market) => {
          const marketDetails = MARKET_DETAILS[market.marketId];
          const shortTag = marketDetails?.shortTag || market.name;
          const isSelected = market.marketId === selectedMarketId;

          return (
            <button
              key={market.marketId}
              data-market-id={market.marketId}
              onClick={() => onMarketChange(market.marketId)}
              disabled={isLoading}
              className={cn(
                "flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap relative overflow-hidden",
                isLoading && "opacity-50 cursor-not-allowed",
                isSelected
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105 ring-2 ring-blue-400/50"
                  : "bg-gray-700/60 text-white/80 hover:bg-gray-600/70 hover:text-white border border-white/10 hover:border-white/20 hover:shadow-md hover:scale-102"
              )}
            >
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-100" />
              )}
              <span className="relative z-10">{shortTag}</span>
              {isLoading && isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80">
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700/80 hover:bg-gray-600/80 border border-white/10 flex items-center justify-center transition-all duration-200 z-10"
          aria-label="Scroll right"
        >
          <ChevronRight size={14} className="text-white sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
};

export default MarketSelectorCarousel;
