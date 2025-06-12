import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SKEPSIS_CONFIG, MARKETS } from '@/constants/appConstants';
import { MARKET_CONSTANTS } from '@/constants/marketConstants';

export interface LiquidityShare {
  id: string;
  shares: number;
  marketId: string;
  userAddress: string;
  shareAmount: number;
  marketState?: number; // Added to track market state
}

export interface LiquiditySharesData {
  totalLiquidity: number;
  sharesByMarket: {
    [marketId: string]: number;
  };
  allShares: LiquidityShare[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage liquidity shares for a user
 * @param client - Sui client
 * @param refreshTrigger - Optional trigger to refresh data
 * @returns Liquidity shares data and refresh function
 */
export const useLiquidityShares = (
  client: SuiClient,
  refreshTrigger?: number,
  marketStates?: Record<string, number> // Added parameter for market states
) => {
  const account = useCurrentAccount();
  const [data, setData] = useState<LiquiditySharesData>({
    totalLiquidity: 0,
    sharesByMarket: {},
    allShares: [],
    loading: false,
    error: null
  });

  const fetchLiquidityShares = async () => {
    if (!account || !account.address) {
      setData(prev => ({ ...prev, loading: false, error: 'No wallet connected' }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use Sui's efficient server-side filtering to get only LiquidityShare objects
      const liquidityShareType = `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::LiquidityShare`;
      
      // Query directly for LiquidityShare objects using the StructType filter
      const { data: liquidityShares } = await client.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: liquidityShareType
        },
        options: {
          showContent: true,
          showType: true,
        },
      });
      
      // console.log(`🔍 POSITION DEBUG - Server-side filtering applied for type ${liquidityShareType}`);
      // console.log(`🔍 POSITION DEBUG - Found ${liquidityShares.length} liquidity shares with efficient filtering`);

      // Process liquidity shares
      const shares: LiquidityShare[] = [];
      const sharesByMarket: { [marketId: string]: number } = {};
      let totalLiquidity = 0;

      // Initialize sharesByMarket with all available markets (setting default to 0)
      // Log debugging info to help diagnose position display issues
      // console.log(`🔍 POSITION DEBUG - Initializing positions for ${MARKETS.length} markets`);
      
      if (!Array.isArray(MARKETS) || MARKETS.length === 0) {
        // console.error("🚨 CRITICAL ERROR - MARKETS is not an array or is empty");
      }
      
      // Ensure we properly set positions for all markets
      MARKETS.forEach((market, index) => {
        if (typeof market === 'object' && market && 'marketId' in market) {
          sharesByMarket[market.marketId] = 0;
          
          // Log a few entries for debugging
          if (index < 5) {
            // console.log(`🔍 POSITION DEBUG - Setting default position for market ${market.marketId}`);
          }
        } else {
          console.error(`🚨 CRITICAL ERROR - Invalid market structure at index ${index}:`, market);
        }
      });
      
      console.log(`🔍 POSITION DEBUG - Found ${liquidityShares.length} liquidity shares for user ${account.address}`);
      
      for (const shareObj of liquidityShares) {
        if (shareObj.data?.content && shareObj.data.content.dataType === 'moveObject') {
          const fields = shareObj.data.content.fields as Record<string, any>;
          const marketId = fields.market || '';

          // Get the raw shares amount and convert properly
          const sharesRaw = Number(fields.shares || 0);
          const shareAmount = sharesRaw / 1_000_000; // Convert from 6 decimals (LP tokens use 6 decimal places like USDC)
          
          // Only log in development environment to avoid cluttering the console
          if (process.env.NODE_ENV !== 'production') {
            // console.log(`Found liquidity share for market ${marketId}:`, {
            //   shareId: shareObj.data.objectId,
            //   sharesRaw,
            //   shareAmount,
            //   fields
            // });
          }
          
          // Create the liquidity share object with all necessary info
          const share: LiquidityShare = {
            id: shareObj.data.objectId,
            shares: sharesRaw,
            marketId: marketId,
            userAddress: account.address,
            shareAmount: shareAmount, // This is the user's LP tokens amount in USDC equivalent
            marketState: marketStates ? marketStates[marketId] : undefined
          };
          
          // Add to our list of shares
          shares.push(share);
          
          // Update shares by market with the proper amount
          if (marketId) {
            sharesByMarket[marketId] = shareAmount;
          }

          totalLiquidity += share.shareAmount;
          
          //console.log(`Liquidity Share Details:`);
          //console.log(`- Object ID: ${share.id}`);
          //console.log(`- Market ID: ${marketId}`);
          //console.log(`- Market State: ${share.marketState !== undefined ? share.marketState : 'unknown'}`);
          //console.log(`- Share Amount: ${share.shareAmount}`);
          //console.log(`- Raw Shares: ${share.shares}`);
          //console.log(`--------------------------------`);
        }
      }

      // Verify we have mapped all markets correctly
      // console.log(`FILTERING RESULTS - Using server-side filtering:`);
      // console.log(`Total liquidity shares found: ${shares.length}`);
      // console.log(`Expected number of markets: ${MARKETS.length}`);
      
      // Log the sharesByMarket object to verify the mapping
      Object.entries(sharesByMarket).forEach(([marketId, amount]) => {
        const marketName = MARKETS.find(m => m.marketId === marketId)?.name || 'Unknown Market';
        const marketState = marketStates ? marketStates[marketId] : 'unknown';
        if (amount > 0) {
          // console.log(`Market: ${marketName} (ID: ${marketId})`);
          // console.log(`- State: ${marketState}`);
          // console.log(`- User Liquidity: ${amount}`);
          // console.log(`- Can Withdraw: ${marketState !== undefined && marketState !== 0 ? 'YES' : 'NO'}`);
        }
      });

      setData({
        totalLiquidity,
        sharesByMarket,
        allShares: shares,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching liquidity shares:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching liquidity shares'
      }));
    }
  };

  // Fetch data when account changes or refresh is triggered
  useEffect(() => {
    if (account?.address) {
      fetchLiquidityShares();
    } else {
      setData({
        totalLiquidity: 0,
        sharesByMarket: {},
        allShares: [],
        loading: false,
        error: 'No wallet connected'
      });
    }
  }, [account?.address, refreshTrigger, marketStates]);

  return {
    ...data,
    refresh: fetchLiquidityShares
  };
};