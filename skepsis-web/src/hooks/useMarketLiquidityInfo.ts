import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { MARKETS } from '@/constants/appConstants';
import { MarketService } from '@/services/marketService';

export interface MarketLiquidityData {
  id: number;
  marketId: string;
  name: string;
  currentLiquidity: number;
  openInterest: number;
  maxPayout: number;
  resolutionTime: string;
  creationTime: number;
  state: number;
  stateDisplay: string;
}

export interface MarketLiquiditySummary {
  marketCount: number;
  volume7d: number;
  fees7d: number;
}

export interface MarketLiquidityResponse {
  markets: MarketLiquidityData[];
  summary: MarketLiquiditySummary;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch market liquidity information
 * @param client - Sui client
 * @param refreshTrigger - Optional trigger to refresh data
 * @returns Market liquidity data and refresh function
 */
export const useMarketLiquidityInfo = (
  client: SuiClient,
  refreshTrigger?: number
) => {
  const [data, setData] = useState<MarketLiquidityResponse>({
    markets: [],
    summary: {
      marketCount: 0,
      volume7d: 0,
      fees7d: 0
    },
    loading: false,
    error: null
  });

  const fetchMarketInfo = async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    const marketService = new MarketService(client);
    
    try {
      // Static market IDs from constants - in a real app you might fetch these dynamically
      const marketIds = MARKETS.map(m => m.marketId);
      const marketsData: MarketLiquidityData[] = [];
      
      // Process each market
      for (let i = 0; i < marketIds.length; i++) {
        const marketId = marketIds[i];
        const basicInfo = MARKETS.find(m => m.marketId === marketId);
        
        try {
          // Get market details from blockchain
          const marketObject = await client.getObject({
            id: marketId,
            options: {
              showContent: true,
              showDisplay: true,
              showType: true,
              showOwner: true
            }
          });
          
          if (!marketObject.data || !marketObject.data.content) {
            console.warn(`Market ${marketId} not found or has no content`);
            continue;
          }
          
          // Process market data
          const fields = marketObject.data.content.dataType === 'moveObject' 
            ? marketObject.data.content.fields as Record<string, any>
            : {};
          
          // Get more details using the full market info service
          const marketInfo = await marketService.getMarketInfo(marketId);
            
          // Get resolution time and bidding deadline as formatted strings
          const resolutionTime = fields.resolution_time 
            ? new Date(Number(fields.resolution_time)).toISOString()
            : undefined;
            
          const biddingDeadline = fields.bidding_end_time
            ? new Date(Number(fields.bidding_end_time)).toISOString()
            : undefined;
            
          // Format the display date for UI
          const resolutionTimeDisplay = fields.resolution_time 
            ? new Date(Number(fields.resolution_time)).toLocaleDateString() + ' ' + 
              new Date(Number(fields.resolution_time)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : 'Unknown';
            
          // Find the spread with the highest outstanding shares for max payout
          let maxOutstandingShares = 0;
          let maxOutstandingSharesSpread = null;
          
          if (marketInfo && marketInfo.spreads && marketInfo.spreads.details) {
            for (const spread of marketInfo.spreads.details) {
              if (spread.outstandingShares > maxOutstandingShares) {
                maxOutstandingShares = spread.outstandingShares;
                maxOutstandingSharesSpread = spread;
              }
            }
          }
          
          // Create market data object
          const market: MarketLiquidityData = {
            id: i + 1,
            marketId: marketId,
            name: basicInfo?.name || 'Unknown Market',
            // Use data from marketInfo when available
            currentLiquidity: marketInfo && marketInfo.liquidity && marketInfo.liquidity.totalLiquidity 
              ? Number(marketInfo.liquidity.totalLiquidity) / 1_000_000
              : Number(fields.pool_balance || fields.total_liquidity || 0) / 1_000_000,
            // Use cumulative shares sold as open interest
            openInterest: marketInfo && marketInfo.liquidity && marketInfo.liquidity.cumulativeSharesSoldDisplay 
              ? parseFloat(marketInfo.liquidity.cumulativeSharesSoldDisplay)
              : 0,
            // Use the shares of the spread with highest outstanding value as max payout
            maxPayout: maxOutstandingSharesSpread 
              ? parseFloat(maxOutstandingSharesSpread.outstandingSharesDisplay || "0") 
              : 0,
            resolutionTime: resolutionTimeDisplay,
            creationTime: Number(fields.creation_time || 0),
            state: Number(fields.market_state || 0),
            stateDisplay: getMarketStateString(
              Number(fields.market_state || 0), 
              resolutionTime,
              biddingDeadline
            )
          };
          
          marketsData.push(market);
        } catch (error) {
          console.error(`Error processing market ${marketId}:`, error);
        }
      }
      
      // Calculate summary statistics
      const summary = calculateSummary(marketsData);
      
      setData({
        markets: marketsData,
        summary,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching market data'
      }));
    }
  };
  
  // Helper function to get market state as readable string
  const getMarketStateString = (state: number, resolutionTime?: string, biddingDeadline?: string): string => {
    // For already resolved or canceled markets, just return the standard label
    switch (state) {
      case 1: return 'Resolved';
      case 2: return 'Canceled';
      case 0: {
        // For state 0, check if bidding deadline or resolution time has passed
        const now = new Date();
        
        // Try to parse resolution time and bidding deadline
        let resolutionDate = null;
        let biddingEndDate = null;
        
        try {
          if (biddingDeadline) {
            biddingEndDate = new Date(biddingDeadline);
            if (isNaN(biddingEndDate.getTime())) biddingEndDate = null;
          }
          
          if (resolutionTime) {
            resolutionDate = new Date(resolutionTime);
            if (isNaN(resolutionDate.getTime())) resolutionDate = null;
          }
        } catch (e) {
          console.error('Error parsing market timing dates:', e);
        }
        
        // Check if resolution time has passed
        if (resolutionDate && now >= resolutionDate) {
          return 'Waiting for Resolution';
        } 
        // Check if bidding deadline has passed but resolution time hasn't
        else if (biddingEndDate && now >= biddingEndDate) {
          return 'Waiting for Resolution';
        } 
        // Default case: Market is still active (bidding period)
        else {
          return 'Open';
        }
      }
      default: 
        return `Unknown (${state})`;
    }
  };
  
  // Helper function to calculate max payout based on market data
  const calculateMaxPayout = (marketInfo: any): number => {
    // If we have market info with spread details, find the spread with highest outstanding shares
    if (marketInfo && marketInfo.spreads && marketInfo.spreads.details && marketInfo.spreads.details.length > 0) {
      let maxOutstandingShares = 0;
      
      for (const spread of marketInfo.spreads.details) {
        if (spread.outstandingShares > maxOutstandingShares) {
          maxOutstandingShares = spread.outstandingShares;
        }
      }
      
      return maxOutstandingShares;
    }
    
    // Fallback to old calculation if market info is not available
    if (marketInfo && marketInfo.liquidity && marketInfo.liquidity.totalLiquidity) {
      return Number(marketInfo.liquidity.totalLiquidity) * 0.8;
    }
    
    return 0; // Default value if no data is available
  };
  
  // Helper function to extract market statistics from the market info
  const extractMarketStatistics = (marketInfo: any) => {
    // Default values
    let openInterest = 0;
    
    // Extract from market info if available
    if (marketInfo && marketInfo.liquidity && marketInfo.liquidity.cumulativeSharesSoldDisplay) {
      openInterest = parseFloat(marketInfo.liquidity.cumulativeSharesSoldDisplay);
    }
    
    return { openInterest };
  };
  
  // Helper function to calculate summary statistics
  const calculateSummary = (markets: MarketLiquidityData[]): MarketLiquiditySummary => {
    // Calculate total trading volume and fees for the past 7 days (dummy calculation for now)
    // In a real implementation, you would calculate this based on trading events
    
    const totalLiquidity = markets.reduce((sum, market) => sum + market.currentLiquidity, 0);
    const totalOpenInterest = markets.reduce((sum, market) => sum + market.openInterest, 0);
    
    // Dummy calculation - volume is typically related to open interest
    const volume7d = totalOpenInterest * 5; // Assume 5x turnover in a week
    
    // Fees are typically a percentage of volume
    const fees7d = volume7d * 0.003; // Assume 0.3% fee
    
    return {
      marketCount: markets.length,
      volume7d,
      fees7d
    };
  };
  
  // Fetch data when component mounts or refresh is triggered
  useEffect(() => {
    fetchMarketInfo();
  }, [refreshTrigger]);
  
  return {
    ...data,
    refresh: fetchMarketInfo
  };
};