import React from "react";
import { useLiveMarketInfo } from "@/hooks/useLiveMarketInfo";
import { cn } from "@/lib/utils";
import { SPREAD_COLORS } from "@/constants/appConstants";

interface MarketSpreadsBarProps {
  marketId: string;
  className?: string;
}

/**
 * A component that visualizes market spreads as horizontal bars
 * where the width of each bar is proportional to its percentage share
 * of the total outstanding shares. The right side is a horizontal mirror image
 * of the left side.
 */
const MarketSpreadsBar: React.FC<MarketSpreadsBarProps> = ({
  marketId,
  className,
}) => {
  const { data, loading, error, refresh } = useLiveMarketInfo(marketId);

  if (loading) {
    return (
      <div className={cn("w-full flex items-center justify-center h-10", className)}>
        <div className="text-white/60 text-sm">Loading spreads...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn("w-full flex items-center justify-center h-10 text-red-400", className)}>
        <div className="text-sm">Error loading market spreads</div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="text-sm text-white/80 mb-1.5">Market Distribution</div>
      <div className="flex justify-between gap-2">
        {/* Left side bar (original) */}
        <div className="w-full flex overflow-hidden rounded-md bg-white/10 h-6">
          {data.spreads.details.map((spread, idx) => (
            <div
              key={`left-${spread.id}`}
              className={cn(
                "h-full transition-all duration-300 flex items-center justify-center",
              )}
              style={{
                width: `${spread.percentage}%`,
                minWidth: spread.percentage > 2 ? "auto" : "0",
                backgroundColor: SPREAD_COLORS[idx % SPREAD_COLORS.length],
              }}
            >
              {spread.percentage > 5 && (
                <span className="text-white text-xs px-1 truncate">
                  {spread.displayRange}
                  {spread.percentage > 10 && (
                    <span className="ml-1 opacity-80">{spread.percentage.toFixed(1)}%</span>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Right side bar (mirrored) */}
        <div className="w-full flex flex-row-reverse overflow-hidden rounded-md bg-white/10 h-6">
          {data.spreads.details.map((spread, idx) => (
            <div
              key={`right-${spread.id}`}
              className={cn(
                "h-full transition-all duration-300 flex items-center justify-center",
              )}
              style={{
                width: `${spread.percentage}%`,
                minWidth: spread.percentage > 2 ? "auto" : "0",
                backgroundColor: SPREAD_COLORS[idx % SPREAD_COLORS.length],
              }}
            >
              {spread.percentage > 5 && (
                <span className="text-white text-xs px-1 truncate text-right">
                  {spread.percentage > 10 && (
                    <span className="mr-1 opacity-80">{spread.percentage.toFixed(1)}%</span>
                  )}
                  {spread.displayRange}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <div className="text-xs text-white/60">Question</div>
          <div className="text-sm text-white">{data.basic.question}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-white/60">Status</div>
          <div className="text-sm text-white">{data.basic.stateDisplay}</div>
        </div>
      </div>
    </div>
  );
};

export default MarketSpreadsBar;