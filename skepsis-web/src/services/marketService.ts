import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SKEPSIS_CONFIG, USDC_CONFIG } from '@/constants/tokens';
import { MARKET_CONSTANTS } from '@/constants/marketConstants';
import { bcs } from '@mysten/sui/bcs';
import { log } from 'node:console';

/**
 * Service for interacting with Skepsis prediction markets
 */
export class MarketService {
  private client: SuiClient;
  
  constructor(client: SuiClient) {
    this.client = client;
  }

  /**
   * Buy shares from a specific spread in a market
   * 
   * @param marketId - The ID of the market to buy from
   * @param spreadIndex - The index of the spread to buy shares from
   * @param sharesAmount - The amount of shares to buy
   * @param maxUsdcInput - The maximum amount of USDC to spend
   * @param senderAddress - The address of the sender
   * @returns Transaction to be signed and executed
   */
  async buyShares(
    marketId: string, 
    spreadIndex: number,
    sharesAmount: number,
    maxUsdcInput: number,
    senderAddress: string
  ): Promise<Transaction> {
    // Get available USDC coins for the user
    const { data: usdcCoins } = await this.client.getCoins({
      owner: senderAddress,
      coinType: `${SKEPSIS_CONFIG.usdc}::usdc::USDC`,
    });

    if (usdcCoins.length === 0) {
      throw new Error('No USDC coins found in wallet');
    }

    // Calculate amount with decimals
    const usdcDecimals = 6; // USDC has 6 decimals
    const maxUsdcInputWithDecimals = Math.floor(maxUsdcInput * (10 ** usdcDecimals));
    const sharesAmountWithDecimals = Math.floor(sharesAmount * (10 ** usdcDecimals));

    // Create transaction
    const tx = new Transaction();
    
    // Total input USDC amount needed
    let totalUsdcNeeded = maxUsdcInputWithDecimals;
    
    // Find and merge coins if needed
    const usdcCoinIds = usdcCoins.map(coin => coin.coinObjectId);
    
    if (usdcCoinIds.length > 1) {
      // Merge coins if we have multiple
      const primaryCoin = usdcCoinIds[0];
      const mergeCoins = usdcCoinIds.slice(1);
      
      tx.mergeCoins(
        tx.object(primaryCoin),
        mergeCoins.map(id => tx.object(id))
      );

      // Use the primary coin for the transaction
      const [splitCoin] = tx.splitCoins(
        tx.object(primaryCoin), 
        [bcs.U64.serialize(totalUsdcNeeded)]
      );
      
      // Call the buyExactSharesWithMaxInput function
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::${MARKET_CONSTANTS.FUNCTIONS.BUY_EXACT_SHARES_WITH_MAX_INPUT}`,
        arguments: [
          tx.object(marketId),                         // Market ID
          bcs.U64.serialize(spreadIndex),              // Spread Index
          bcs.U64.serialize(sharesAmountWithDecimals), // Shares amount
          splitCoin,                                   // USDC payment
        ],
      });
    } else {
      // If we have just one coin
      const [splitCoin] = tx.splitCoins(
        tx.object(usdcCoinIds[0]), 
        [bcs.U64.serialize(totalUsdcNeeded)]
      );
      
      // Call the buyExactSharesWithMaxInput function
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::${MARKET_CONSTANTS.FUNCTIONS.BUY_EXACT_SHARES_WITH_MAX_INPUT}`,
        arguments: [
          tx.object(marketId),                         // Market ID
          bcs.U64.serialize(spreadIndex),              // Spread Index
          bcs.U64.serialize(sharesAmountWithDecimals), // Shares amount
          splitCoin,                                   // USDC payment
        ],
      });
    }
    
    // Set sender address
    tx.setSender(senderAddress);
    
    return tx;
  }

  /**
   * Sell shares from a position
   * 
   * @param positionId - The ID of the position to sell shares from
   * @param sharesAmount - The amount of shares to sell (set to null to sell all shares)
   * @param minOutput - Minimum USDC output expected
   * @param senderAddress - The address of the sender
   * @returns Transaction to be signed and executed
   */
  async sellShares(
    positionId: string,
    sharesAmount: number | null,
    minOutput: number,
    senderAddress: string
  ): Promise<Transaction> {
    // Create transaction
    const tx = new Transaction();
    
    const usdcDecimals = 6; // USDC has 6 decimals
    const minOutputWithDecimals = Math.floor(minOutput * (10 ** usdcDecimals));
    
    // Call the sellExactSharesForMinOutput function
    if (sharesAmount === null) {
      // Sell all shares in the position
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::${MARKET_CONSTANTS.FUNCTIONS.SELL_EXACT_SHARES_FOR_MIN_OUTPUT}`,
        arguments: [
          tx.object(positionId),                     // Position ID
          bcs.U64.serialize(minOutputWithDecimals),  // Minimum USDC output expected
        ],
      });
    } else {
      // Sell specific amount of shares
      const sharesAmountWithDecimals = Math.floor(sharesAmount * (10 ** usdcDecimals));
      
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::${MARKET_CONSTANTS.FUNCTIONS.SELL_EXACT_SHARES_FOR_MIN_OUTPUT}`,
        arguments: [
          tx.object(positionId),                     // Position ID
          bcs.U64.serialize(sharesAmountWithDecimals), // Shares amount
          bcs.U64.serialize(minOutputWithDecimals),    // Minimum USDC output expected
        ],
      });
    }
    
    // Set sender address
    tx.setSender(senderAddress);
    
    return tx;
  }

  /**
   * Get market information
   * 
   * @param marketId - ID of the market to get information for
   * @returns Market information
   */
  async getMarketInfo(marketId: string) {
    try {
      const txb = new Transaction();
      
      // Call the get_market_info function
      txb.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::${MARKET_CONSTANTS.FUNCTIONS.GET_MARKET_INFO}`,
        arguments: [txb.object(marketId)],
      });
      
      // Use devInspectTransactionBlock to query without executing a transaction
      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: txb,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      
      // Process and return results
      if (result.results && result.results[0]) {
        const returnValues = result.results[0].returnValues;
        // Parse the returned data
        return returnValues; 
      }
      
      throw new Error('Failed to get market info');
    } catch (error) {
      console.error('Error getting market info:', error);
      throw error;
    }
  }

  /**
   * Get user positions for a market
   * 
   * @param marketId - ID of the market 
   * @param userAddress - Address of the user
   * @returns User positions
   */
  async getUserPositions(marketId: string, userAddress: string) {
    try {
      // Get all objects owned by the user that might be positions
      const { data: objects } = await this.client.getOwnedObjects({
        owner: userAddress,
        options: {
          showContent: true,
        },
      });
      
      // Filter for position objects related to the given market
      // This is a simplified approach - in a real implementation, 
      // you'd need to check the object type more carefully
      const positions = objects.filter(obj => {
        if (obj.data?.content) {
          // Check if the object's type includes Position
          const objectType = typeof obj.data.content === 'object' && 
            'dataType' in obj.data.content && 
            obj.data.content.dataType === 'moveObject' &&
            'type' in obj.data.content ?
            obj.data.content.type : '';
          
          return objectType && objectType.includes('Position');
        }
        return false;
      });
      
      return positions;
    } catch (error) {
      console.error('Error getting user positions:', error);
      throw error;
    }
  }

  /**
   * Get price quote for buying shares
   * 
   * @param marketId - ID of the market
   * @param spreadIndex - Index of the spread
   * @param sharesAmount - Amount of shares to buy
   * @returns Price quote information
   */
  async getPriceQuote(marketId: string, spreadIndex: number, sharesAmount: number) {
    try {
      const txb = new Transaction();
      const usdcDecimals = 6; // USDC has 6 decimals
      const sharesAmountWithDecimals = Math.floor(sharesAmount * (10 ** usdcDecimals));
      
      // Get price quote (this is an example - actual function name might differ)
      txb.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_buy_quote`,
        typeArguments: [`${USDC_CONFIG.tokenType}`],
        arguments: [
          txb.object(marketId),
          txb.pure.u64(spreadIndex),
          txb.pure.u64(sharesAmountWithDecimals),
        ],
      });
      console.log("=======>>>>>>>>>>>>>>");
      console.log("target: ", `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_buy_quote`);
        console.log("marketId: ", marketId);
        console.log("spreadIndex: ", spreadIndex);
        console.log("sharesAmountWithDecimals: ", sharesAmountWithDecimals);
      console.log("=======>>>>>>>>>>>>>>");
      // Use devInspectTransactionBlock to query without executing a transaction
      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: txb,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      
      // Process and return results
      if (result.results && result.results[0] && result.results[0].returnValues) {
        const returnValues = result.results[0].returnValues;
        if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nBuy Quote Information:');
          console.log('--------------------');
          
          try {
            // Parse quote (u64)
            if (returnValues[0]) {
              const quoteBytes = returnValues[0][0];
              let quote = 0;
              for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
                quote += quoteBytes[i] * Math.pow(256, i);
              }
              console.log(`Quote: ${quote / 1_000_000} USDC (${quote} units with 6 decimals)`);
              return {
                price: quote , // Convert to USDC
                fee: 0, // Raw value for further processing
                total: quote / 1_000_000, // Total price in USDC
              }
            }
          } catch (e) {
            console.error('Error parsing values:', e);
          }
        } catch (parseError) {
          console.error('Failed to parse return values:', parseError);
        }
      } else {
        console.log('No return values in the response');
      }
      }
      
      throw new Error('Failed to get price quote');
    } catch (error) {
      console.error('Error getting price quote:', error);
      throw error;
    }
  }
}

export default MarketService;