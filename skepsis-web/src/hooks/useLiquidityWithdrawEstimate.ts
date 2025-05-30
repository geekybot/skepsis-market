import { useEffect, useState } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SKEPSIS_CONFIG } from '@/constants/appConstants';
import { MARKET_CONSTANTS } from '@/constants/marketConstants';
import { formatCurrency } from '@/lib/format';

/**
 * Hook that calculates how much USDC a user will receive when withdrawing
 * liquidity from a resolved market.
 * 
 * @param suiClient - SUI client
 * @param liquidityShareId - ID of the liquidity share token
 * @param marketId - ID of the market
 * @returns Loading state, error state, calculated amount and formatted amount
 */
export function useLiquidityWithdrawEstimate(
  suiClient: SuiClient | null,
  liquidityShareId: string | null,
  marketId: string
) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [amount, setAmount] = useState<number>(0);
  const [formattedAmount, setFormattedAmount] = useState<string>('0');

  useEffect(() => {
    // Reset states when inputs change
    setLoading(true);
    setError(false);
    setAmount(0);
    setFormattedAmount('0');

    // If we're missing required inputs, don't proceed
    if (!suiClient || !liquidityShareId || !marketId) {
      setLoading(false);
      return;
    }

    // Create local variables with explicit non-null type assertions
    const client = suiClient as SuiClient;
    const shareId = liquidityShareId as string;

    async function calculateWithdrawalEstimate() {
      try {
        const txb = new Transaction();
        
        // Call the withdraw_liquidity function directly - it returns the USDC amount
        txb.moveCall({
          target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::withdraw_liquidity`,
          arguments: [
            txb.object(marketId),
            txb.object(shareId), // Using the non-null local variable
          ],
        });

        // Use devInspectTransactionBlock to simulate the transaction
        const result = await client.devInspectTransactionBlock({
          transactionBlock: txb,
          sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
        });

        // Process the result
        if (result.results && result.results[0] && result.results[0].returnValues) {
          const returnValues = result.results[0].returnValues;
          if (returnValues && returnValues.length >= 1) {
            // Parse quote (u64)
            const quoteBytes = returnValues[0][0];
            let withdrawalAmount = 0;
            for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
              withdrawalAmount += quoteBytes[i] * Math.pow(256, i);
            }

            // Set the amount with 6 decimal places (USDC)
            const amountInUsdc = withdrawalAmount / 1_000_000;
            setAmount(withdrawalAmount);
            setFormattedAmount(formatCurrency(amountInUsdc));
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error calculating withdrawal estimate:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    calculateWithdrawalEstimate();
  }, [suiClient, liquidityShareId, marketId]);

  return {
    loading,
    error,
    amount,
    formattedAmount
  };
}