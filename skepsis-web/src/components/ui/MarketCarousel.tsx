import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Coins, TrendingUp, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketDetails } from '@/constants/marketDetails';

// Market interface to match our data structure
interface Market {
  id: string;
  marketId: string;
  title: string;
  description: string;
  bidEndTime?: string;
  createTime: string;
  resolveTime: string;
  liquidity: string | number;
  volume?: string | number;
  state: number;
  stateDisplay: string;
  range?: {
    min: number;
    max: number;
    unit: string;
  };
  spreadCount?: number;
}

interface MarketCarouselProps {
  markets: Market[];
  activeIndex?: number;
  onChangeIndex?: (index: number) => void;
}

const MarketCarousel: React.FC<MarketCarouselProps> = ({ markets, activeIndex: externalIndex, onChangeIndex }) => {
  // Use internal state if no external index is provided
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  
  // Use external index if provided, otherwise use internal state
  const activeIndex = externalIndex !== undefined ? externalIndex : internalActiveIndex;
  
  // Update index function that respects external control if provided
  const updateIndex = useCallback((newIndex: number, newDirection: number) => {
    setDirection(newDirection);
    if (onChangeIndex) {
      onChangeIndex(newIndex);
    } else {
      setInternalActiveIndex(newIndex);
    }
  }, [onChangeIndex]);

  const nextMarket = useCallback(() => {
    const newIndex = (activeIndex + 1) % markets.length;
    updateIndex(newIndex, 1);
  }, [activeIndex, markets.length, updateIndex]);

  const prevMarket = useCallback(() => {
    const newIndex = (activeIndex - 1 + markets.length) % markets.length;
    updateIndex(newIndex, -1);
  }, [activeIndex, markets.length, updateIndex]);

  // Stop auto-advancing when user interacts with the carousel
  const pauseAutoAdvance = () => {
    setAutoAdvance(false);
    // Resume auto-advance after 30 seconds of inactivity
    setTimeout(() => setAutoAdvance(true), 30000);
  };

  useEffect(() => {
    // Reset active index when markets change
    if (!onChangeIndex) {
      setInternalActiveIndex(0);
    }
  }, [markets, onChangeIndex]);

  // Define effect for auto-advancing
  useEffect(() => {
    if (!autoAdvance || markets.length <= 1) return;
    
    const interval = setInterval(() => {
      const newIndex = (activeIndex + 1) % markets.length;
      updateIndex(newIndex, 1);
    }, 8000); // Auto advance every 8 seconds

    return () => clearInterval(interval);
  }, [markets.length, autoAdvance, activeIndex, updateIndex]);

  const formatTime = (timeString: string) => {
    try {
      // For Waiting for Resolution status on the liquidity page (screenshot 2)
      if (timeString === 'Waiting for Resolution') {
        return 'Waiting for Resolution';
      }
      
      const date = new Date(timeString);
      
      // For invalid dates
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Normal formatting for reasonable dates
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  const activeMarket = markets[activeIndex];

  // Skip rendering if no markets are available
  if (markets.length === 0) return null;

  // Format volume and liquidity for display
  const formattedLiquidity = typeof activeMarket.liquidity === 'number' 
    ? `$${activeMarket.liquidity.toLocaleString()} USDC` 
    : activeMarket.liquidity || 'Unknown';
  
  const formattedVolume = activeMarket.volume !== undefined
    ? (typeof activeMarket.volume === 'number' 
      ? `$${activeMarket.volume.toLocaleString()} USDC` 
      : activeMarket.volume) 
    : '$0 USDC';

  // Get market state for badge color
  const getStateBadgeColor = (state: number) => {
    switch (state) {
      case 0: return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"; // Active
      case 1: return "bg-amber-500/20 text-amber-300 border-amber-500/30"; // Resolved
      case 2: return "bg-red-500/20 text-red-300 border-red-500/30"; // Canceled
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30"; // Unknown
    }
  };

  return (
    <div 
      ref={carouselRef} 
      className="relative overflow-hidden"
      style={{ minHeight: '280px' }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ 
            duration: 0.5, 
            ease: 'easeInOut',
            scale: { duration: 0.4 },
            opacity: { duration: 0.3 }
          }}
          className="w-full"
        >
          <div className="p-0.5 sm:p-1">
            <div className="bg-gradient-to-br from-indigo-900/50 to-violet-900/50 rounded-lg p-4 sm:p-6 border border-indigo-700/30 hover:border-indigo-600/50 transition-all">
              <div className="flex flex-col gap-4 sm:gap-6">
                {/* Market Info */}
                <div className="flex-1">
                  {/* Market State Badge */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStateBadgeColor(activeMarket.state)}`}>
                      {activeMarket.stateDisplay}
                    </span>
                    {activeMarket.spreadCount && (
                      <span className="text-indigo-300 text-xs sm:text-sm">
                        {activeMarket.spreadCount} options
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 line-clamp-2">
                    {activeMarket.title}
                  </h3>
                  <p className="text-white/80 mb-4 sm:mb-6 line-clamp-3 text-xs sm:text-sm">
                    {activeMarket.description}
                  </p>
                  
                  {/* Market Timing Information */}
                  <div className="space-y-2 mb-4 sm:mb-6">
                    {activeMarket.bidEndTime && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Calendar size={14} className="text-indigo-300 sm:w-4 sm:h-4" />
                        <span className="text-white/80 text-xs sm:text-sm">
                          Bidding: {activeMarket.bidEndTime}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Calendar size={14} className="text-indigo-300 sm:w-4 sm:h-4" />
                      <span className="text-white/80 text-xs sm:text-sm">
                        Resolves: {activeMarket.resolveTime}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6">
                    <Link 
                      href={`/prediction?market=${activeMarket.marketId}`}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md flex items-center justify-center gap-2 w-full sm:w-fit transition-all text-sm sm:text-base lg:text-lg"
                    >
                      <span>Trade Now</span>
                      <ArrowRight size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    </Link>
                  </div>
                </div>
                
                {/* Market Stats */}
                <div className="bg-indigo-900/30 p-3 sm:p-4 lg:p-5 rounded-lg border border-indigo-800/30 flex flex-row sm:flex-col w-full gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible">
                  <div className="min-w-[120px] sm:min-w-0">
                    <div className="text-indigo-300 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
                      <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>Market Status</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`py-1 px-2 sm:px-3 rounded-full text-xs sm:text-sm ${getStateBadgeColor(activeMarket.state)}`}>
                        {activeMarket.stateDisplay}
                      </div>
                    </div>
                  </div>
                  
                  <div className="min-w-[120px] sm:min-w-0">
                    <div className="text-indigo-300 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
                      <Coins size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>Liquidity</span>
                    </div>
                    <div className="text-white font-medium text-sm sm:text-base lg:text-lg">
                      {formattedLiquidity}
                    </div>
                  </div>
                  
                  <div className="min-w-[120px] sm:min-w-0">
                    <div className="text-indigo-300 text-xs sm:text-sm mb-1 flex items-center gap-1 sm:gap-2">
                      <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>Volume</span>
                    </div>
                    <div className="text-white font-medium text-sm sm:text-base lg:text-lg">
                      {formattedVolume}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add the COLLECTIVE KNOWLEDGE SYNTHESIS footer */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 flex items-center justify-center border-t border-indigo-800/30">
                <div className="flex items-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3">
                    <Image 
                      src="/images/skepsis-transparent.png" 
                      alt="Skepsis Logo" 
                      width={20} 
                      height={20}
                      className="object-contain sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                    />
                  </div>
                  <span className="text-amber-400 text-xs sm:text-sm tracking-wider">COLLECTIVE KNOWLEDGE SYNTHESIS</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Pagination dots for mobile */}
      {markets.length > 1 && (
        <div className="flex justify-center mt-4 gap-2 md:hidden">
          {markets.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const newDirection = index > activeIndex ? 1 : -1;
                setDirection(newDirection);
                updateIndex(index, newDirection);
                pauseAutoAdvance();
              }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === activeIndex
                  ? 'bg-indigo-500'
                  : 'bg-indigo-800/50'
              }`}
              aria-label={`View market ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketCarousel;
