import { useEffect, useState, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { CONSTANTS, MODULES } from "@/constants/appConstants";
import { MarketService } from "@/services/marketService";

function byteArrayToString(byteArray: number[]): string {
  try {
    return String.fromCharCode(...byteArray);
  } catch (e) {
    return `Error converting bytes to string: ${e}`;
  }
}

function getMarketStateString(state: number): string {
  switch (state) {
    case 0: return "Open";
    case 1: return "Resolved";
    case 2: return "Canceled";
    default: return `Unknown (${state})`;
  }
}

export interface Spread {
  spreadIndex: number;
  id: string;
  precision: number;
  lowerBound: number;
  upperBound: number;
  outstandingShares: number;
  outstandingSharesDisplay: string;
  displayRange: string;
  buyPrice?: number;
  buyPriceDisplay?: string;
  sellPrice?: number | null;
  sellPriceDisplay?: string;
  percentage: number; // Calculated percentage based on outstanding shares
}

export interface MarketInfo {
  success: boolean;
  marketId: string;
  basic: {
    question?: string;
    resolutionCriteria?: string;
    steps?: number;
    creationTime?: number;
    creationTimeDisplay?: string;
    state?: number;
    stateDisplay?: string;
  };
  timing: {
    biddingDeadline?: number;
    biddingDeadlineDisplay?: string;
    biddingOpen?: boolean;
    resolutionTime?: number;
    resolutionTimeDisplay?: string;
    resolvedValue?: number;
    isResolved?: boolean;
  };
  liquidity: {
    totalShares?: number;
    totalSharesDisplay?: string;
    cumulativeSharesSold?: number;
    cumulativeSharesSoldDisplay?: string;
    totalLiquidity?: number;
    totalLiquidityDisplay?: string;
  };
  spreads: {
    count: number;
    details: Spread[];
  };
  error: string | null;
  metadata?: any;
}

/**
 * Hook to fetch live market info from the blockchain
 * Returns market data with dynamic spread percentages based on outstanding shares
 */
export function useLiveMarketInfo(marketId: string) {
  const suiClient = useSuiClient();
  const [data, setData] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Update useEffect hook
  useEffect(() => {
    // console.log("🔍 useLiveMarketInfo - marketId changed:", marketId);
    setData(null);
    setLoading(true);
    setError(null);
  }, [marketId]);

  /**
   * Fetches all spread prices in a single call using the get_all_spread_prices function
   */
  const getAllSpreadPrices = useCallback(async (marketId: string) => {
    try {
      const marketService = new MarketService(suiClient);
      return await marketService.getAllSpreadPrices(marketId);
    } catch (error) {
      // console.error(`Error getting spread prices:`, error);
      const fallbackIndices = Array.from({ length: 10 }, (_, i) => i);
      const fallbackPrices = Array(10).fill(100000); // Default 0.1 USDC with 6 decimals
      
      return {
        success: false,
        indices: fallbackIndices,
        prices: fallbackPrices,
        error: `Error getting spread prices: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }, [suiClient]);

  // Update fetchMarketInfo function
  const fetchMarketInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch market object
      const marketObject = await suiClient.getObject({
        id: marketId,
        options: { showContent: true, showDisplay: true, showType: true, showOwner: true }
      });
      
      if (!marketObject.data) throw new Error("Market not found");
      
      // Create our result object
      const result: MarketInfo = {
        success: true,
        marketId,
        basic: {},
        timing: {},
        liquidity: {},
        spreads: { count: 0, details: [] },
        error: null
      };
      
      // Extract and process the market data
      if (marketObject.data.content && marketObject.data.content.dataType === 'moveObject') {
        const fields = marketObject.data.content.fields as Record<string, any>;
        
        // Basic info
        if ('question' in fields && Array.isArray(fields.question)) {
          result.basic.question = byteArrayToString(fields.question);
        }
        
        if ('resolution_criteria' in fields && Array.isArray(fields.resolution_criteria)) {
          result.basic.resolutionCriteria = byteArrayToString(fields.resolution_criteria);
        }
        
        if ('steps' in fields) {
          result.basic.steps = Number(fields.steps);
        }
        
        if ('creation_time' in fields) {
          const creationTime = Number(fields.creation_time);
          result.basic.creationTime = creationTime;
          result.basic.creationTimeDisplay = new Date(creationTime).toISOString();
        }
        
        if ('market_state' in fields) {
          const state = Number(fields.market_state);
          result.basic.state = state;
          result.basic.stateDisplay = getMarketStateString(state);
        }
        
        // Timing info
        if ('bidding_deadline' in fields) {
          // console.log("==============================================");
          // console.log(`Bidding deadline field found: ${fields.bidding_deadline}`);
          
          const biddingDeadline = Number(fields.bidding_deadline);
          result.timing.biddingDeadline = biddingDeadline;
          result.timing.biddingDeadlineDisplay = new Date(biddingDeadline).toISOString();
          result.timing.biddingOpen = Date.now() < biddingDeadline;
        }
        
        if ('resolution_time' in fields) {
          const resolutionTime = Number(fields.resolution_time);
          result.timing.resolutionTime = resolutionTime;
          result.timing.resolutionTimeDisplay = new Date(resolutionTime).toISOString();
        }
        
        if ('resolved_value' in fields) {
          const resolvedValue = Number(fields.resolved_value);
          result.timing.resolvedValue = resolvedValue;
          result.timing.isResolved = resolvedValue > 0;
        }
        
        // Liquidity info
        if ('total_shares' in fields) {
          const totalShares = Number(fields.total_shares);
          result.liquidity.totalShares = totalShares;
          result.liquidity.totalSharesDisplay = (totalShares / 1_000_000).toFixed(6);
        }
        
        if ('cumulative_shares_sold' in fields) {
          const cumulativeSharesSold = Number(fields.cumulative_shares_sold);
          result.liquidity.cumulativeSharesSold = cumulativeSharesSold;
          result.liquidity.cumulativeSharesSoldDisplay = (cumulativeSharesSold / 1_000_000).toFixed(6);
        }
        
        // Process total liquidity if available - handle different data structures
        if ('total_liquidity' in fields) {
          // The value could be stored directly as a number or in a nested structure
          let totalLiquidity: number;
          
          if (typeof fields.total_liquidity === 'object' && fields.total_liquidity !== null) {
            // It might be stored in a nested structure like { value: "1000000000" }
            if ('value' in fields.total_liquidity) {
              totalLiquidity = Number(fields.total_liquidity.value);
            } else {
              // Try to find a property that might contain the value
              const possibleValueProps = Object.values(fields.total_liquidity);
              totalLiquidity = possibleValueProps.length > 0 ? Number(possibleValueProps[0]) : 0;
            }
          } else {
            // It's directly stored as a primitive value
            totalLiquidity = Number(fields.total_liquidity);
          }
          
          result.liquidity.totalLiquidity = totalLiquidity;
          result.liquidity.totalLiquidityDisplay = (totalLiquidity / 1_000_000).toFixed(6);
        }
        
        // Process spreads info
        if ('spreads' in fields && Array.isArray(fields.spreads)) {
          const spreads = fields.spreads;
          result.spreads.count = spreads.length;
          
          // Process each spread
          for (let i = 0; i < spreads.length; i++) {
            const spreadData = spreads[i];
            const spreadFields = spreadData.fields || {};
            
            const spreadInfo: Spread = {
              spreadIndex: i,
              id: spreadFields.id?.id || `spread-${i}`,
              precision: Number(spreadFields.precision || 0),
              lowerBound: Number(spreadFields.lower_bound || 0),
              upperBound: Number(spreadFields.upper_bound || 0),
              outstandingShares: Number(spreadFields.outstanding_shares || 0),
              outstandingSharesDisplay: (Number(spreadFields.outstanding_shares || 0) / 1_000_000).toFixed(6),
              displayRange: `${Number(spreadFields.lower_bound || 0)} - ${Number(spreadFields.upper_bound || 0)}`,
              percentage: 0 // Will calculate later
            };
            
            result.spreads.details.push(spreadInfo);
          }
        }
      }

      // 2. Get all spread prices in a single call
      const spreadPrices = await getAllSpreadPrices(marketId);
      
      // Add pricing info to the spreads
      if (spreadPrices && spreadPrices.indices && spreadPrices.prices) {
        console.log(`📊 [useLiveMarketInfo] Processing ${spreadPrices.indices.length} spread prices`);
        
        // Validate we have both indices and prices with the same length
        if (spreadPrices.indices.length === spreadPrices.prices.length) {
          for (let i = 0; i < spreadPrices.indices.length; i++) {
            const spreadIndex = spreadPrices.indices[i];
            const price = spreadPrices.prices[i];
            
            // Validate spreadIndex and price are valid
            if (typeof spreadIndex === 'number' && spreadIndex >= 0 && 
                typeof price === 'number' && price >= 0 &&
                spreadIndex < result.spreads.details.length) {
                
              const spread = result.spreads.details[spreadIndex];
              
              // Set buy price information
              spread.buyPrice = price;
              spread.buyPriceDisplay = (price / 1_000_000).toFixed(6);
              
              // Set sell price information if there are outstanding shares
              // (simplified approach - in reality, buy/sell prices would differ due to spread)
              if (spread.outstandingShares > 0) {
                const sellPrice = Math.floor(price * 0.995); // Example: 0.5% spread
                spread.sellPrice = sellPrice;
                spread.sellPriceDisplay = (sellPrice / 1_000_000).toFixed(6);
              } else {
                spread.sellPrice = null;
                spread.sellPriceDisplay = "N/A";
              }
            } else {
              console.warn(`⚠️ [useLiveMarketInfo] Invalid spread data at index ${i}: spreadIndex=${spreadIndex}, price=${price}`);
            }
          }
        } else {
          console.error(`❌ [useLiveMarketInfo] Mismatch between indices length (${spreadPrices.indices.length}) and prices length (${spreadPrices.prices.length})`);
        }
      } else {
        console.warn(`⚠️ [useLiveMarketInfo] No valid spread prices received`);
      }

      // Calculate spread percentages based on outstandingShares
      const totalOutstanding = result.spreads.details.reduce(
        (sum, spread) => sum + spread.outstandingShares, 
        0
      );
      
      if (totalOutstanding === 0) {
        // If no outstanding shares, distribute evenly
        const equalPercentage = 100 / (result.spreads.details.length || 1);
        result.spreads.details.forEach(spread => {
          spread.percentage = equalPercentage;
        });
      } else {
        // Calculate percentage based on outstanding shares
        result.spreads.details.forEach(spread => {
          spread.percentage = (spread.outstandingShares / totalOutstanding) * 100;
        });
      }
      
      // Sort spreads by percentage in descending order
      result.spreads.details.sort((a, b) => b.percentage - a.percentage);
      
      setData(result);
    } catch (e: any) {
      setError(e.message || "Unknown error");
      console.error("Error fetching market info:", e);
    } finally {
      setLoading(false);
    }
  }, [marketId, suiClient, getAllSpreadPrices]);

  useEffect(() => {
    console.log("🔍 Fetching market data for marketId:", marketId);
    
    // First set loading state to true
    setLoading(true);
    
    // Add a small delay to ensure UI state is updated before the potentially heavy fetch
    const fetchTimeout = setTimeout(() => {
      fetchMarketInfo().then(() => {
        console.log("✅ Finished fetching data for marketId:", marketId);
      }).catch(err => {
        console.error("❌ Error fetching data for marketId:", marketId, err);
      });
    }, 50);
    
    // React 18 StrictMode might be causing the hook to be called twice during development
    // Adding a cleanup function to the effect to ensure we don't have multiple fetches running
    return () => {
      clearTimeout(fetchTimeout);
      console.log("🧹 Cleaning up fetch for marketId:", marketId);
    };
  }, [marketId]);

  return { 
    data, 
    loading,
    error,
    refresh: fetchMarketInfo
  };
}
