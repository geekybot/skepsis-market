import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface MarketCarouselNavProps {
  marketCount: number;
  onRefresh: () => void;
  isLoading: boolean;
  currentIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const MarketCarouselNav: React.FC<MarketCarouselNavProps> = ({
  marketCount,
  onRefresh,
  isLoading,
  currentIndex = 0,
  onPrevious,
  onNext
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Counter display showing current position */}
      <div className="text-sm text-white/70 mr-2 hidden sm:block">
        <span className="font-medium text-white">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{marketCount}</span>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center">
        <button
          onClick={onPrevious}
          disabled={isLoading || marketCount <= 1}
          className={`p-1.5 rounded-l-md bg-indigo-800/50 hover:bg-indigo-700/60 text-white/90 disabled:opacity-40 disabled:cursor-not-allowed border-r border-indigo-700/60 ${marketCount <= 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="Previous market"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onNext}
          disabled={isLoading || marketCount <= 1}
          className={`p-1.5 rounded-r-md bg-indigo-800/50 hover:bg-indigo-700/60 text-white/90 disabled:opacity-40 disabled:cursor-not-allowed ${marketCount <= 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label="Next market"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-1.5 rounded-md bg-indigo-800/50 hover:bg-indigo-700/60 text-white/90 disabled:opacity-40 disabled:cursor-not-allowed ml-1"
        aria-label="Refresh markets"
      >
        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

export default MarketCarouselNav;
