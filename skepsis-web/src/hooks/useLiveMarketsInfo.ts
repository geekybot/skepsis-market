// filepath: /Users/split/Desktop/projects/skepsis/packages/skepsis-web/src/hooks/useLiveMarketsInfo.ts
import { useEffect, useState, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { CONSTANTS, MODULES } from "@/constants/appConstants";
// Import MarketInfo type directly, not the hook
import { MarketInfo, Spread } from "./useLiveMarketInfo";
import { formatNumberWithCommas } from "@/lib/format";

// Define types for the Move object fields we expect
interface MarketFields {
  question?: { fields?: { bytes?: number[] } };
  resolution_criteria?: { fields?: { bytes?: number[] } };
  creation_time?: string | number;
  bidding_end_time?: string | number;
  resolution_time?: string | number;
  resolved_value?: string | number;
  state?: string | number;
  funding_amount?: string | number;
  market_spreads?: { 
    fields?: { 
      spreads?: { 
        fields?: { 
          contents?: Array<{
            fields?: {
              id?: { id?: string };
              precision?: string | number;
              lower_bound?: string | number;
              upper_bound?: string | number;
              outstanding_shares?: string | number;
            }
          }>
        } 
      } 
    }
  };
  steps?: string | number;
  cumulative_shares_sold?: string | number;
}

/**
 * Hook to fetch multiple markets' live data in parallel
 * @param marketIds Array of market IDs to fetch
 * @returns Object containing loading state, error, data array, and refresh function
 */
export function useLiveMarketsInfo(marketIds: string[]) {
  // Initialize state
  const [marketsData, setMarketsData] = useState<Record<string, MarketInfo | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const suiClient = useSuiClient();

  // Track which markets we've already requested
  const [requestedMarkets, setRequestedMarkets] = useState<Set<string>>(new Set());
  
  // Helper functions that would be in useLiveMarketInfo but need to be here
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

  // This function replaces the API call from marketService
  const getAllSpreadPrices = async (marketId: string) => {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::get_all_spread_prices`,
        typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`],
        arguments: [
          tx.object(marketId)
        ],
      });
      
      const response = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: CONSTANTS.NETWORK.DEFAULT_SENDER
      });
      
      if (!response.results || !response.results[0]) {
        throw new Error('No results returned for spread prices');
      }
      
      const returnValues = response.results[0].returnValues;
      if (!returnValues || returnValues.length < 2) {
        throw new Error('Incomplete return values for spread prices');
      }
      
      // Parse indices (vector<u64>)
      const indicesBytes = returnValues[0][0];
      let indices: number[] = [];
      
      // Vector bytes are formatted as [length, elem1, elem2, ...]
      // Each u64 takes up 8 bytes
      const numIndices = indicesBytes[0]; // First byte is length
      for (let i = 0; i < numIndices; i++) {
        let index = 0;
        for (let j = 0; j < 8; j++) {
          if (1 + i*8 + j < indicesBytes.length) {
            index += indicesBytes[1 + i*8 + j] * Math.pow(256, j);
          }
        }
        indices.push(index);
      }
      
      // Parse prices (vector<u64>)
      const pricesBytes = returnValues[1][0];
      let prices: number[] = [];
      
      const numPrices = pricesBytes[0]; // First byte is length
      for (let i = 0; i < numPrices; i++) {
        let price = 0;
        for (let j = 0; j < 8; j++) {
          if (1 + i*8 + j < pricesBytes.length) {
            price += pricesBytes[1 + i*8 + j] * Math.pow(256, j);
          }
        }
        prices.push(price);
      }
      
      // Create map of index -> price
      const priceMap = new Map<number, number>();
      for (let i = 0; i < indices.length; i++) {
        priceMap.set(indices[i], prices[i]);
      }
      
      return priceMap;
    } catch (error) {
      console.error('Error getting spread prices:', error);
      return new Map<number, number>();
    }
  };
  
  // Instead of using individual hooks, fetch all market data in a single useEffect
  const fetchAllMarkets = useCallback(async () => {
    if (marketIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const errorMessages: string[] = [];
    try {
      // Process each market ID in parallel
      const marketResults = await Promise.all(
        marketIds.filter(Boolean).map(async (marketId) => {
          try {
            const marketData = await fetchMarketInfo(marketId);
            return { marketId, marketData };
          } catch (err) {
            errorMessages.push(`Market ${marketId}: ${err instanceof Error ? err.message : String(err)}`);
            return { marketId, marketData: null };
          }
        })
      );
      setMarketsData(prev => {
        const newMarketsData = { ...prev };
        for (const { marketId, marketData } of marketResults) {
          newMarketsData[marketId] = marketData;
        }
        return newMarketsData;
      });
    } catch (err) {
      errorMessages.push(`General error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setError(errorMessages.length ? errorMessages.join('; ') : null);
    }
  }, [marketIds, suiClient]);
  
  // Helper function to fetch a single market's data
  async function fetchMarketInfo(marketId: string): Promise<MarketInfo> {
    try {
      // Get the market data
      const marketObjResponse = await suiClient.getObject({
        id: marketId,
        options: { showContent: true }
      });
      
      if (!marketObjResponse || !marketObjResponse.data || !marketObjResponse.data.content) {
        throw new Error('Failed to fetch market data');
      }
      
      const marketObj = marketObjResponse.data.content;
      
      // Ensure it's a Move object with fields
      if (marketObj.dataType !== 'moveObject' || !marketObj.fields) {
        throw new Error('Invalid market object format');
      }
      
      // Cast the fields to our expected type
      const marketFields = marketObj.fields as unknown as MarketFields;
      
      // Extract basic information
      const question = marketFields.question?.fields?.bytes ? 
        byteArrayToString(marketFields.question.fields.bytes) : 'Unknown Market';
      
      const resolutionCriteria = marketFields.resolution_criteria?.fields?.bytes ? 
        byteArrayToString(marketFields.resolution_criteria.fields.bytes) : 'No resolution criteria specified';
      
      // Extract timing information
      const creationTime = Number(marketFields.creation_time || 0);
      const biddingDeadline = Number(marketFields.bidding_end_time || 0);
      const resolutionTime = Number(marketFields.resolution_time || 0);
      const resolvedValue = Number(marketFields.resolved_value || 0);
      const state = Number(marketFields.state || 0);
      
      // Format dates
      const creationTimeDisplay = new Date(creationTime * 1000).toLocaleString();
      const biddingDeadlineDisplay = new Date(biddingDeadline * 1000).toLocaleString();
      const resolutionTimeDisplay = new Date(resolutionTime * 1000).toLocaleString();
      
      // Check if bidding is still open
      const now = Math.floor(Date.now() / 1000);
      const biddingOpen = biddingDeadline > now;
      
      // Extract liquidity information
      const totalLiquidity = Number(marketFields.funding_amount || 0);
      const totalLiquidityDisplay = formatNumberWithCommas(totalLiquidity / 1000000);
      
      // Extract spread information
      const spreadDetails = marketFields.market_spreads?.fields?.spreads?.fields?.contents;
      const spreadCount = spreadDetails ? spreadDetails.length : 0;
      
      // Get spread prices
      const spreadPricesMap = await getAllSpreadPrices(marketId);
      
      // Process each spread
      const spreads: Spread[] = [];
      let totalShares = 0;
      
      if (spreadDetails) {
        for (let i = 0; i < spreadDetails.length; i++) {
          const spread = spreadDetails[i];
          if (!spread.fields) continue;
          
          const spreadId = spread.fields.id?.id || '';
          const precision = Number(spread.fields.precision || 0);
          const lowerBound = Number(spread.fields.lower_bound || 0);
          const upperBound = Number(spread.fields.upper_bound || 0);
          const outstandingShares = Number(spread.fields.outstanding_shares || 0);
          totalShares += outstandingShares;
          
          spreads.push({
            spreadIndex: i,
            id: spreadId,
            precision,
            lowerBound,
            upperBound,
            outstandingShares,
            outstandingSharesDisplay: formatNumberWithCommas(outstandingShares),
            displayRange: `${lowerBound / precision} - ${upperBound / precision}`,
            buyPrice: spreadPricesMap.get(i) || undefined,
            buyPriceDisplay: spreadPricesMap.has(i) ? 
              `$${formatNumberWithCommas(spreadPricesMap.get(i)! / 1000000)}` : undefined,
            sellPrice: null, // This would need a different API call
            sellPriceDisplay: undefined,
            percentage: 0 // Will calculate after all shares are summed
          });
        }
      }
      
      // Calculate percentage for each spread based on total shares
      if (totalShares > 0) {
        for (let spread of spreads) {
          spread.percentage = (spread.outstandingShares / totalShares) * 100;
        }
      }
      
      // Assemble the complete market info object
      return {
        success: true,
        marketId,
        basic: {
          question,
          resolutionCriteria,
          steps: Number(marketFields.steps || 0),
          creationTime,
          creationTimeDisplay,
          state,
          stateDisplay: getMarketStateString(state),
        },
        timing: {
          biddingDeadline,
          biddingDeadlineDisplay,
          biddingOpen,
          resolutionTime,
          resolutionTimeDisplay,
          resolvedValue,
          isResolved: state === 1
        },
        liquidity: {
          totalShares,
          totalSharesDisplay: formatNumberWithCommas(totalShares),
          cumulativeSharesSold: Number(marketFields.cumulative_shares_sold || 0),
          cumulativeSharesSoldDisplay: formatNumberWithCommas(Number(marketFields.cumulative_shares_sold || 0)),
          totalLiquidity,
          totalLiquidityDisplay
        },
        spreads: {
          count: spreadCount,
          details: spreads
        },
        error: null
      };
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return {
        success: false,
        marketId,
        basic: {},
        timing: {},
        liquidity: {},
        spreads: { count: 0, details: [] },
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Track which markets we've requested to avoid unnecessary re-fetches
  useEffect(() => {
    const newRequestedMarkets = new Set(requestedMarkets);
    let marketIdsChanged = false;
    
    // Add any new market IDs to our tracking set
    marketIds.forEach(id => {
      if (id && !newRequestedMarkets.has(id)) {
        newRequestedMarkets.add(id);
        marketIdsChanged = true;
      }
    });
    
    if (marketIdsChanged) {
      setRequestedMarkets(newRequestedMarkets);
    }
  }, [marketIds, requestedMarkets]);
  
  // Fetch all market data when the IDs or client changes
  useEffect(() => {
    fetchAllMarkets();
  }, [fetchAllMarkets]);

  // Convert marketsData object to array in the original order
  const marketsDataArray = marketIds.map(id => marketsData[id] || null);

  return { 
    data: marketsDataArray,
    marketsMap: marketsData,  // Also provide the map for easy lookup by ID
    loading, 
    error, 
    refresh: fetchAllMarkets 
  };
}