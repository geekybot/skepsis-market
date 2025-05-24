import { useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import MarketService from '@/services/marketService';
import { toast } from 'react-toastify';
import { MARKET_CONSTANTS } from '@/constants/marketConstants';

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
  
  return {
    buyShares,
    sellShares,
    fetchMarketInfo,
    fetchUserPositions,
    getQuote,
    isLoading,
    positions,
    marketInfo,
    priceQuote,
  };
};