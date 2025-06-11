import React, { useState } from 'react';
import { RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarketSelectorCarousel } from './MarketSelectorCarousel';
import { MarketSelectorMarquee } from './MarketSelectorMarquee';

/**
 * MarketSelectorHybrid - A hybrid component that switches between carousel and marquee modes
 * 
 * Features:
 * - Toggle between carousel and marquee styles
 * - Maintains state across mode switches
 * - Visual toggle button with icons
 * - All features from both components
 */

interface MarketSelectorHybridProps {
  selectedMarketId: string;
  onMarketChange: (marketId: string) => void;
  className?: string;
  isLoading?: boolean;
  defaultMode?: 'carousel' | 'marquee';
}

export const MarketSelectorHybrid: React.FC<MarketSelectorHybridProps> = ({
  selectedMarketId,
  onMarketChange,
  className,
  isLoading = false,
  defaultMode = 'carousel'
}) => {
  const [mode, setMode] = useState<'carousel' | 'marquee'>(defaultMode);

  const toggleMode = () => {
    setMode(mode === 'carousel' ? 'marquee' : 'carousel');
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mode Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white/90">Select Market</h3>
          <div className="px-2 py-1 bg-gray-700/40 rounded-md border border-white/10">
            <span className="text-xs text-white/70 capitalize">{mode} Mode</span>
          </div>
        </div>
        
        <button
          onClick={toggleMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/60 hover:bg-gray-600/70 border border-white/10 hover:border-white/20 transition-all duration-200 text-xs text-white/80 hover:text-white group"
          aria-label={`Switch to ${mode === 'carousel' ? 'marquee' : 'carousel'} mode`}
        >
          {mode === 'carousel' ? (
            <>
              <Zap size={14} className="group-hover:rotate-12 transition-transform duration-200" />
              <span className="hidden sm:inline">Marquee</span>
            </>
          ) : (
            <>
              <RotateCcw size={14} className="group-hover:-rotate-12 transition-transform duration-200" />
              <span className="hidden sm:inline">Carousel</span>
            </>
          )}
        </button>
      </div>

      {/* Component Container with smooth transition */}
      <div className="relative">
        <div className={cn(
          "transition-all duration-500 ease-in-out",
          mode === 'carousel' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none absolute inset-0"
        )}>
          {mode === 'carousel' && (
            <MarketSelectorCarousel
              selectedMarketId={selectedMarketId}
              onMarketChange={onMarketChange}
              isLoading={isLoading}
            />
          )}
        </div>

        <div className={cn(
          "transition-all duration-500 ease-in-out",
          mode === 'marquee' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none absolute inset-0"
        )}>
          {mode === 'marquee' && (
            <MarketSelectorMarquee
              selectedMarketId={selectedMarketId}
              onMarketChange={onMarketChange}
              isLoading={isLoading}
              speed={40}
              direction="left"
            />
          )}
        </div>
      </div>

      {/* Mode Description */}
      <div className="text-xs text-white/50 text-center">
        {mode === 'carousel' ? (
          <span>Use arrow keys or swipe to navigate • Click to switch to news ticker style</span>
        ) : (
          <span>Continuous scrolling news ticker • Hover to pause • Click to switch to carousel</span>
        )}
      </div>
    </div>
  );
};

export default MarketSelectorHybrid;
