import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { CONSTANTS } from '@/constants/appConstants';

/**
 * Hook for getting buy and sell quotes from the prediction market
 */
export function useMarketQuotes(
  suiClient: SuiClient | null,
  marketId: string | null,
  spreadIndex: number | null,
  amount: string,
  isBuying: boolean
) {
  const [quoteAmount, setQuoteAmount] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawQuote, setRawQuote] = useState<number | null>(null);

  /**
   * Gets a buy quote from the blockchain
   * @param client SuiClient instance
   * @param marketId The market ID to query
   * @param spreadIndex The spread index to get a quote for
   * @param sharesAmount Amount of shares to buy
   * @returns Required USDC amount (in 6 decimals)
   */
  const getBuyQuote = async (
    client: SuiClient, 
    marketId: string, 
    spreadIndex: number, 
    sharesAmount: number
  ): Promise<number> => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_buy_quote`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId),
        tx.pure.u64(spreadIndex),
        tx.pure.u64(sharesAmount*1_000_000), // Convert shares to 6 decimals
      ],
    });

    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: CONSTANTS.NETWORK.DEFAULT_SENDER,
    });

    if (response.results && response.results[0] && response.results[0].returnValues && response.results[0].returnValues[0]) {
      const quoteBytes = response.results[0].returnValues[0][0];
      let quote = 0;
      for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
        quote += quoteBytes[i] * Math.pow(256, i);
      }
      return quote;
    }
    
    throw new Error('Failed to get buy quote');
  };

  /**
   * Gets a sell quote from the blockchain
   * @param client SuiClient instance
   * @param marketId The market ID to query
   * @param spreadIndex The spread index to get a quote for
   * @param sharesAmount Amount of shares to sell
   * @returns Expected USDC amount (in 6 decimals)
   */
  const getSellQuote = async (
    client: SuiClient, 
    marketId: string, 
    spreadIndex: number, 
    sharesAmount: number
  ): Promise<number> => {
    const tx = new Transaction();
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_sell_quote`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId),
        tx.pure.u64(spreadIndex),
        tx.pure.u64(sharesAmount*1_000_000), // Convert shares to 6 decimals
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: CONSTANTS.NETWORK.DEFAULT_SENDER,
    });
    
    if (response.results && response.results[0] && response.results[0].returnValues && response.results[0].returnValues[0]) {
      const quoteBytes = response.results[0].returnValues[0][0];
      let quote = 0;
      for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
        quote += quoteBytes[i] * Math.pow(256, i);
      }
      return quote;
    }
    
    throw new Error('Failed to get sell quote');
  };

  /**
   * Updates the quote when dependencies change
   */
  const updateQuote = async () => {
    // Don't attempt to get a quote if the dependencies aren't available
    if (!suiClient || !marketId || spreadIndex === null) {
      setQuoteAmount('0');
      setRawQuote(null);
      return;
    }

    const parsedAmount = parseFloat(amount || '0');
    if (parsedAmount <= 0) {
      setQuoteAmount('0');
      setRawQuote(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let quote: number;
      
      if (isBuying) {
        // Only try to get buy quote if we have a valid spread index
        if (spreadIndex < 0) {
          throw new Error('Invalid spread index for buy quote');
        }
        
        // Get a buy quote
        quote = await getBuyQuote(suiClient, marketId, spreadIndex, parsedAmount);
      } else {
        // For sell quotes, we need a valid spread index too
        if (spreadIndex < 0) {
          throw new Error('Invalid spread index for sell quote');
        }
        
        // Get a sell quote
        quote = await getSellQuote(suiClient, marketId, spreadIndex, parsedAmount);
      }
      
      // Store the raw quote
      setRawQuote(quote);
      
      // Convert from raw units (6 decimals) to display units
      const displayQuote = (quote / 1_000_000).toFixed(4);
      setQuoteAmount(displayQuote);
    } catch (err) {
      console.error(`Error getting ${isBuying ? 'buy' : 'sell'} quote:`, err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      // For sell quotes, use a fallback calculation instead of showing error
      if (!isBuying) {
        const fallbackQuote = parsedAmount * 0.85; // Simple fallback - 85% of amount
        setQuoteAmount(fallbackQuote.toFixed(4));
        setRawQuote(Math.floor(fallbackQuote * 1_000_000)); // Convert to raw units
      } else {
        setQuoteAmount('0');
        setRawQuote(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update the quote when any dependencies change
  useEffect(() => {
    updateQuote();
  }, [suiClient, marketId, spreadIndex, amount, isBuying]);

  return {
    quoteAmount,
    rawQuote,
    isLoading,
    error,
    refreshQuote: updateQuote
  };
}