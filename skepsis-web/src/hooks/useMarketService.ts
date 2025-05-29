import { useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { MarketService } from '@/services/marketService';
import { toast } from 'react-toastify';
import { MARKET_CONSTANTS } from '@/constants/marketConstants';
import { Transaction } from '@mysten/sui/transactions';

export interface MarketPosition {
  id: string;
  marketId: string;
  spreadIndex: number;
  sharesAmount: number;
  value: number;
}

export interface MarketQuote {
  price: number;
  fee: number;
  total: number;
}

/**
 * Hook for interacting with Skepsis prediction markets
 */
export const useMarketService = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState<MarketPosition[]>([]);
  const [marketInfo, setMarketInfo] = useState<any>(null);
  const [priceQuote, setPriceQuote] = useState<MarketQuote | null>(null);
  
  const marketService = new MarketService(client);
  
  /**
   * Buy shares from a specific spread in a market
   * 
   * @param marketId - ID of the market
   * @param spreadIndex - Index of the spread
   * @param sharesAmount - Amount of shares to buy
   * @param maxUsdcInput - Maximum USDC to spend
   */
  const buyShares = async (
    marketId: string,
    spreadIndex: number,
    sharesAmount: number,
    maxUsdcInput: number
  ) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create buy transaction
      const tx = await marketService.buyShares(
        marketId,
        spreadIndex,
        sharesAmount,
        maxUsdcInput,
        account.address
      );
      
      // Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success('Successfully purchased shares!');
            // Refresh positions after buying
            fetchUserPositions(marketId);
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            toast.error(`Failed to buy shares: ${error.message}`);
            setIsLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Error buying shares:', error);
      toast.error(error.message || 'Failed to buy shares');
      setIsLoading(false);
    }
  };
  
  /**
   * Sell shares from a position
   * 
   * @param positionId - ID of the position
   * @param sharesAmount - Amount of shares to sell (null to sell all)
   * @param minOutput - Minimum USDC output expected
   * @param marketId - ID of the market (for refreshing positions after selling)
   */
  const sellShares = async (
    positionId: string,
    sharesAmount: number | null,
    minOutput: number,
    marketId: string
  ) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create sell transaction
      const tx = await marketService.sellShares(
        positionId,
        sharesAmount,
        minOutput,
        account.address
      );
      
      // Sign and execute transaction
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            toast.success('Successfully sold shares!');
            // Refresh positions after selling
            fetchUserPositions(marketId);
            setIsLoading(false);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            toast.error(`Failed to sell shares: ${error.message}`);
            setIsLoading(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Error selling shares:', error);
      toast.error(error.message || 'Failed to sell shares');
      setIsLoading(false);
    }
  };
  
  /**
   * Fetch information about a market
   * 
   * @param marketId - ID of the market
   */
  const fetchMarketInfo = async (marketId: string) => {
    setIsLoading(true);
    
    try {
      const info = await marketService.getMarketInfo(marketId);
      if (info) {
        setMarketInfo(info);
      }
      setIsLoading(false);
      return info;
    } catch (error) {
      console.error('Error fetching market info:', error);
      setIsLoading(false);
      return null;
    }
  };
  
  /**
   * Fetch positions for a user in a specific market
   * 
   * @param marketId - ID of the market
   */
  const fetchUserPositions = async (marketId: string) => {
    if (!account) {
      setPositions([]);
      return [];
    }
    
    setIsLoading(true);
    
    try {
      const userPositions = await marketService.getUserPositions(marketId, account.address);
      // Transform positions to the expected format
      const formattedPositions: MarketPosition[] = userPositions.map((pos: any) => {
        // This is a simplified mapping - in a real application, you'd
        // need to properly extract the data from the position object
        return {
          id: pos.data.objectId,
          marketId,
          spreadIndex: pos.data.content.fields.spreadIndex || 0,
          sharesAmount: Number(pos.data.content.fields.sharesAmount || 0) / (10 ** 6), // Assuming 6 decimals
          value: Number(pos.data.content.fields.value || 0) / (10 ** 6), // Assuming 6 decimals
        };
      });
      
      setPositions(formattedPositions);
      setIsLoading(false);
      return formattedPositions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      setPositions([]);
      setIsLoading(false);
      return [];
    }
  };
  
  /**
   * Get a price quote for buying shares
   * 
   * @param marketId - ID of the market
   * @param spreadIndex - Index of the spread
   * @param sharesAmount - Amount of shares to buy
   */
  const getQuote = async (
    marketId: string,
    spreadIndex: number,
    sharesAmount: number
  ) => {
    try {
      const quote = await marketService.getPriceQuote(marketId, spreadIndex, sharesAmount);
      setPriceQuote(quote);
      return quote;
    } catch (error) {
      console.error('Error getting quote:', error);
      setPriceQuote(null);
      return null;
    }
  };
  
  /**
   * Add liquidity to a market using the intelligent method that chooses the right contract function
   * 
   * @param marketId - ID of the market
   * @param usdcAmount - Amount of USDC to add as liquidity
   * @param minLpTokens - Minimum LP tokens expected (slippage protection)
   */
  const addLiquidityIntelligent = async (
    marketId: string,
    usdcAmount: number,
    minLpTokens: number
  ): Promise<Transaction> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }
    
    // Call the marketService implementation with all required parameters
    return await marketService.addLiquidityIntelligent(
      marketId,
      usdcAmount,
      minLpTokens,
      account.address
    );
  };
  
  /**
   * Remove liquidity from a market
   * 
   * @param marketId - ID of the market
   * @param liquidityShareId - ID of the liquidity share object
   */
  const removeLiquidity = async (
    marketId: string,
    liquidityShareId: string
  ): Promise<Transaction> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }
    
    // Call the marketService implementation with all required parameters
    return await marketService.removeLiquidity(
      marketId,
      liquidityShareId,
      account.address
    );
  };
  
  /**
   * Fetch information for multiple markets at once
   * 
   * @param marketIds - Array of market IDs to fetch information for
   * @returns Array of market information objects
   */
  // Cache to store market info and reduce API calls
  const marketInfoCache: Record<string, {data: any, timestamp: number}> = {};
  
  // Function to delay execution - prevents API rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const getAllMarketsInfo = async (marketIds: string[]) => {
    try {
      const results: any[] = [];
      
      // First, check for cached data that is still valid (less than 30 seconds old)
      const currentTime = Date.now();
      const freshMarketIds: string[] = [];
      const cachedResults: Record<string, any> = {};
      
      // Separate markets that need fresh data from those we can use cached data for
      marketIds.forEach(marketId => {
        const cachedInfo = marketInfoCache[marketId];
        if (cachedInfo && (currentTime - cachedInfo.timestamp) < 30000) { // 30 seconds cache
          cachedResults[marketId] = cachedInfo.data;
        } else {
          freshMarketIds.push(marketId);
        }
      });
      
      // Process market IDs that need fresh data with delays between requests
      for (let i = 0; i < freshMarketIds.length; i++) {
        const marketId = freshMarketIds[i];
        
        try {
          // Add a delay between requests to avoid hitting rate limits
          if (i > 0) await delay(500); // 500ms delay between API calls
          
          const info = await marketService.getMarketInfo(marketId);
          
          // Cache the result
          marketInfoCache[marketId] = {
            data: info,
            timestamp: Date.now()
          };
          
          cachedResults[marketId] = info;
        } catch (error) {
          console.error(`Error fetching info for market ${marketId}:`, error);
          cachedResults[marketId] = { success: false, marketId, error: String(error) };
          
          // Cache error results too but with a shorter expiry (5 seconds)
          marketInfoCache[marketId] = {
            data: { success: false, marketId, error: String(error) },
            timestamp: Date.now() - 25000 // Will expire in 5 seconds
          };
        }
      }
      
      // Build the final results array in the same order as the input marketIds
      marketIds.forEach(marketId => {
        results.push(cachedResults[marketId]);
      });
      
      return {
        success: true,
        markets: results,
        count: marketIds.length,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error getting all markets info:', error);
      return {
        success: false,
        markets: [],
        count: 0,
        error: `Error getting market information: ${error}`,
        timestamp: Date.now()
      };
    }
  };
  
  return {
    buyShares,
    sellShares,
    fetchMarketInfo,
    fetchUserPositions,
    getQuote,
    addLiquidityIntelligent,
    removeLiquidity,
    getAllMarketsInfo,
    isLoading,
    positions,
    marketInfo,
    priceQuote,
  };
};