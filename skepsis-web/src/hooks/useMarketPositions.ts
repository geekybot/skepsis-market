import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { CONSTANTS, MODULES } from '@/constants/appConstants';

// Define the Position interface
export interface Position {
  id: string;
  spreadIndex: number;
  sharesAmount: number;
  value: number;
}

// Interface for the response from getUserPosition
export interface UserPositionResponse {
  success: boolean;
  data: {
    hasPosition: boolean;
    totalInvested: number;
    totalInvestedDisplay: string;
    claimed: boolean;
    winningsClaimed: number;
    winningsClaimedDisplay: string;
    numSpreads: number;
    totalShares: number;
    totalSharesDisplay: string;
    spreads: Array<{
      spreadIndex: number;
      shareAmount: number;
      shareAmountDisplay: string;
      percentage: string;
    }>;
    status: string;
    user: string;
    marketId: string;
  };
  error: string | null;
  rawData: any;
}

/**
 * Hook to fetch and manage user positions in a prediction market
 */
export function useMarketPositions(
  suiClient: SuiClient | null,
  marketId: string | null,
  userAddress: string | null,
  spreadPrices?: {[spreadIndex: number]: number}
) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionData, setPositionData] = useState<UserPositionResponse | null>(null);

  /**
   * Fetches the user's position in a specific market
   */
  const getUserPosition = async (
    client: SuiClient, 
    market: string, 
    user: string
  ): Promise<UserPositionResponse> => {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${MODULES.DISTRIBUTION_MARKET}::get_user_position`,
        typeArguments: [],
        arguments: [
          tx.object(CONSTANTS.OBJECTS.POSITION_REGISTRY),
          tx.pure.address(user),
          tx.object(market)
        ],
      });
      
      const response = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: CONSTANTS.NETWORK.DEFAULT_SENDER
      });
      
      // Prepare response object
      const result: UserPositionResponse = {
        success: false,
        data: {
          hasPosition: false,
          totalInvested: 0,
          totalInvestedDisplay: "0.000000",
          claimed: false,
          winningsClaimed: 0,
          winningsClaimedDisplay: "0.000000",
          numSpreads: 0,
          totalShares: 0,
          totalSharesDisplay: "0.000000",
          spreads: [],
          status: "no_position",
          user: user,
          marketId: market
        },
        error: null,
        rawData: null
      };
      
      if (!response.results || response.results.length === 0 || !response.results[0]) {
        result.error = 'No results returned or error in transaction';
        result.rawData = response;
        return result;
      }
      
      const returnValues = response.results[0].returnValues;
      if (!returnValues || returnValues.length < 6) {
        result.error = 'Not enough return values to parse user position';
        result.rawData = response.results;
        return result;
      }
      
      try {
        // Parse has position (bool) - Index 0
        const hasPositionData = returnValues[0] && returnValues[0][0];
        const hasPosition = Array.isArray(hasPositionData) && hasPositionData.length > 0 && hasPositionData[0] === 1;
        result.data.hasPosition = hasPosition;
        
        // Early return if no position
        if (!hasPosition) {
          result.success = true;
          return result;
        }
        
        // Parse total invested amount (u64) - Index 1
        let totalInvested = 0;
        const investedData = returnValues[1] && returnValues[1][0];
        
        if (Array.isArray(investedData)) {
          for (let i = 0; i < Math.min(investedData.length, 8); i++) {
            totalInvested += Number(investedData[i]) * Math.pow(256, i);
          }
        }
        
        result.data.totalInvested = totalInvested;
        result.data.totalInvestedDisplay = (totalInvested / 1_000_000).toFixed(6);
        
        // Parse claimed flag (bool) - Index 2
        const claimedData = returnValues[2] && returnValues[2][0];
        const claimed = Array.isArray(claimedData) && claimedData.length > 0 && claimedData[0] === 1;
        result.data.claimed = claimed;
        
        // Parse winnings claimed amount (u64) - Index 3
        let winningsClaimed = 0;
        const winningsData = returnValues[3] && returnValues[3][0];
        
        if (Array.isArray(winningsData)) {
          for (let i = 0; i < Math.min(winningsData.length, 8); i++) {
            winningsClaimed += Number(winningsData[i]) * Math.pow(256, i);
          }
        }
        
        result.data.winningsClaimed = winningsClaimed;
        result.data.winningsClaimedDisplay = (winningsClaimed / 1_000_000).toFixed(6);
        
        // Parse spread indices (vector<u64>) - Index 4
        const spreadIndicesData = returnValues[4] && returnValues[4][0];
        
        if (!spreadIndicesData || (Array.isArray(spreadIndicesData) && spreadIndicesData.length === 0)) {
          result.success = true;
          return result;
        }
        
        // Parse number of spreads and prepare array for indices
        const spreadIndices: number[] = [];
        let numSpreads = 0;
        
        if (Array.isArray(spreadIndicesData)) {
          numSpreads = spreadIndicesData[0]; // First byte is the vector length
          
          // Extract each spread index (each u64 takes 8 bytes)
          for (let i = 0; i < numSpreads; i++) {
            let spreadIndex = 0;
            // For each spread, read 8 bytes starting after the vector length
            for (let j = 0; j < 8; j++) {
              const byteIndex = 1 + (i * 8) + j;
              if (byteIndex < spreadIndicesData.length) {
                spreadIndex += Number(spreadIndicesData[byteIndex]) * Math.pow(256, j);
              }
            }
            spreadIndices.push(spreadIndex);
          }
        }
        
        result.data.numSpreads = numSpreads;
        
        // Parse share amounts (vector<u64>) - Index 5
        const shareAmountsData = returnValues[5] && returnValues[5][0];
        const shareAmounts: number[] = [];
        
        if (Array.isArray(shareAmountsData)) {
          // We already know numSpreads from above, so we can skip reading the first byte
          for (let i = 0; i < numSpreads; i++) {
            let shareAmount = 0;
            // For each amount, read 8 bytes starting after the vector length
            for (let j = 0; j < 8; j++) {
              const byteIndex = 1 + (i * 8) + j;
              if (byteIndex < shareAmountsData.length) {
                shareAmount += Number(shareAmountsData[byteIndex]) * Math.pow(256, j);
              }
            }
            shareAmounts.push(shareAmount);
          }
        }
        
        // Calculate total shares
        const totalShares = shareAmounts.reduce((sum, amount) => sum + amount, 0);
        result.data.totalShares = totalShares;
        result.data.totalSharesDisplay = (totalShares / 1_000_000).toFixed(6);
        
        // Add spreads to result
        for (let i = 0; i < spreadIndices.length; i++) {
          const spreadIndex = spreadIndices[i];
          const shareAmount = shareAmounts[i] || 0;
          const percentage = totalShares > 0 ? (shareAmount / totalShares * 100).toFixed(2) : "0.00";
          
          result.data.spreads.push({
            spreadIndex,
            shareAmount,
            shareAmountDisplay: (shareAmount / 1_000_000).toFixed(6),
            percentage
          });
        }
        
        // Set position status
        if (claimed && winningsClaimed > 0) {
          result.data.status = "claimed_with_winnings";
        } else if (claimed && winningsClaimed === 0) {
          result.data.status = "claimed_no_winnings";
        } else if (totalInvested > 0) {
          result.data.status = "active";
        }
        
        result.success = true;
        
      } catch (e) {
        result.error = `Error parsing user position data: ${e}`;
        result.rawData = returnValues;
      }
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        data: {
          hasPosition: false,
          totalInvested: 0,
          totalInvestedDisplay: "0.000000",
          claimed: false,
          winningsClaimed: 0,
          winningsClaimedDisplay: "0.000000",
          numSpreads: 0,
          totalShares: 0,
          totalSharesDisplay: "0.000000",
          spreads: [],
          status: "no_position",
          user: user,
          marketId: market
        },
        error: `Error in getUserPosition: ${error}`,
        rawData: null
      };
    }
  };

  /**
   * Fetches the user's positions from the blockchain
   */
  const fetchPositions = async () => {
    if (!suiClient || !marketId || !userAddress) {
      setPositions([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const positionResult = await getUserPosition(suiClient, marketId, userAddress);
      setPositionData(positionResult);
      
      if (positionResult.success && positionResult.data.hasPosition) {
        // Convert blockchain position data to our Position interface format
        const userPositions: Position[] = positionResult.data.spreads.map((spread) => {
          // Calculate value using spread prices if available, otherwise use a default estimation
          // Both shareAmount and prices are in raw units (6 decimals)
          let value = (Number(spread.shareAmount) * 0.5) / (1_000_000 * 1_000_000); // Default estimation with proper scaling
          
          // If spread prices are provided, use them for more accurate value calculation
          if (spreadPrices && spread.spreadIndex in spreadPrices) {
            const price = spreadPrices[spread.spreadIndex];
            // Both share amount and price are in raw units (6 decimals)
            // Divide by 1_000_000 twice to properly scale both values
            value = (Number(spread.shareAmount) * price) / (1_000_000 * 1_000_000); // Calculate with proper scaling
          }
          
          return {
            id: `${marketId}-${spread.spreadIndex}`, // Using a combination of market and spread index as ID
            spreadIndex: spread.spreadIndex,
            sharesAmount: Number(spread.shareAmount) / 1_000_000, // Convert from raw units (6 decimals)
            value: value // Value calculation using spread prices when available
          };
        });
        
        setPositions(userPositions);
      } else {
        setPositions([]);
        if (positionResult.error) {
          setError(positionResult.error);
        }
      }
    } catch (err) {
      // Silent error handling to avoid console logs
      setError(err instanceof Error ? err.message : "Unknown error");
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch positions when dependencies change
  useEffect(() => {
    fetchPositions();
  }, [suiClient, marketId, userAddress]);

  // Calculate total value of all positions
  const totalPositionsValue = positions.reduce((sum, pos) => sum + pos.value, 0);

  return {
    positions,
    isLoading,
    error,
    positionData,
    totalPositionsValue,
    refreshPositions: fetchPositions
  };
}