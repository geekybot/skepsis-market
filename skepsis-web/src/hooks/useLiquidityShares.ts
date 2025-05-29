import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SKEPSIS_CONFIG } from '@/constants/tokens';
import { MARKET_CONSTANTS, MARKETS } from '@/constants/marketConstants';

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
      // Get all objects owned by the user
      const { data: ownedObjects } = await client.getOwnedObjects({
        owner: account.address,
        options: {
          showContent: true,
          showType: true,
        },
      });

      // Filter for LiquidityShare objects
      const liquidityShareType = `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::LiquidityShare`;
      
      const liquidityShares = ownedObjects.filter(obj => {
        const objType = obj.data?.type;
        return objType && objType.includes(liquidityShareType);
      });

      // Process liquidity shares
      const shares: LiquidityShare[] = [];
      const sharesByMarket: { [marketId: string]: number } = {};
      let totalLiquidity = 0;

      // Initialize sharesByMarket with all available markets (setting default to 0)
      MARKETS.forEach(market => {
        sharesByMarket[market.marketId] = 0;
      });

      //console.log(`Found ${liquidityShares.length} liquidity shares for user ${account.address}`);
      //console.log(`Available markets: ${MARKETS.length}`);
      
      for (const shareObj of liquidityShares) {
        if (shareObj.data?.content && shareObj.data.content.dataType === 'moveObject') {
          const fields = shareObj.data.content.fields as Record<string, any>;
          const marketId = fields.market || '';

          // Get the raw shares amount and convert properly
          const sharesRaw = Number(fields.shares || 0);
          const shareAmount = sharesRaw / 1_000_000; // Convert from 6 decimals (LP tokens use 6 decimal places like USDC)
          
          // Only log in development environment to avoid cluttering the console
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Found liquidity share for market ${marketId}:`, {
              shareId: shareObj.data.objectId,
              sharesRaw,
              shareAmount,
              fields
            });
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
      //console.log(`FINAL MAPPING RESULTS:`);
      //console.log(`Total liquidity shares found: ${shares.length}`);
      //console.log(`Expected number of markets: ${MARKETS.length}`);
      
      // Log the sharesByMarket object to verify the mapping
      Object.entries(sharesByMarket).forEach(([marketId, amount]) => {
        const marketName = MARKETS.find(m => m.marketId === marketId)?.name || 'Unknown Market';
        const marketState = marketStates ? marketStates[marketId] : 'unknown';
        //console.log(`Market: ${marketName} (ID: ${marketId})`);
        //console.log(`- State: ${marketState}`);
        //console.log(`- User Liquidity: ${amount}`);
        //console.log(`- Can Withdraw: ${marketState !== undefined && marketState !== 0 ? 'YES' : 'NO'}`);
      });

      setData({
        totalLiquidity,
        sharesByMarket,
        allShares: shares,
        loading: false,
        error: null
      });

    } catch (error) {
      //console.error('Error fetching liquidity shares:', error);
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