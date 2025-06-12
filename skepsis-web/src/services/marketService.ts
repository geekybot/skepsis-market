import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SKEPSIS_CONFIG, USDC_CONFIG, MODULES, CONSTANTS } from '@/constants/appConstants';
import { MARKET_CONSTANTS } from '@/constants/marketConstants';
import { bcs } from '@mysten/sui/bcs';

/**
 * Interface for the getAllSpreadPrices function response
 */
export interface SpreadPriceResponse {
  success: boolean;
  indices: number[];
  prices: number[];
  error?: string;
}

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


  byteArrayToString(byteArray: number[]): string {
    try {
      return String.fromCharCode(...byteArray);
    } catch (e) {
      return `Error converting bytes to string: ${e}`;
    }
  }
  getMarketStateString(state: number): string {
    switch (state) {
      case 0:
        return 'Open';
      case 1:
        return 'Resolved';
      case 2:
        return 'Canceled';
      default:
        return `Unknown (${state})`;
    }
  }

  /**
   * Helper function to generate mock spread price data
   * @private
   */
  private generateMockSpreadPrices(marketId: string, spreadCount: number = 10): any {
    // console.log(`ℹ️ Using default price values for market ${marketId}`);
    return {
      success: true,
      indices: Array.from({ length: spreadCount }, (_, i) => i),
      prices: Array(spreadCount).fill(90000) // Default price of 0.09 USDC (with 6 decimal places)
    };
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

      const marketObject = await this.client.getObject({
        id: marketId,
        options: {
          showContent: true,
          showDisplay: true,
          showType: true,
          showOwner: true
        }
      });

      if (!marketObject.data) {
        return {
          success: false,
          marketId: marketId,
          error: `Market ${marketId} not found`
        };
      }
      //console.log(marketObject.data);
      // Create our result object
      const marketResult: any = {
        success: true,
        marketId: marketId,
        basic: {},
        timing: {},
        liquidity: {},
        spreads: {
          count: 0,
          details: []
        },
        error: null
      };
      // Extract and process the market data from the raw object
      if (marketObject.data.content && marketObject.data.content.dataType === 'moveObject') {
        const fields = marketObject.data.content.fields as Record<string, any>;

        // Process basic market info
        if ('question' in fields && Array.isArray(fields.question)) {
          marketResult.basic.question = this.byteArrayToString(fields.question);
        }

        if ('resolution_criteria' in fields && Array.isArray(fields.resolution_criteria)) {
          marketResult.basic.resolutionCriteria = this.byteArrayToString(fields.resolution_criteria);
        }

        if ('steps' in fields) {
          marketResult.basic.steps = Number(fields.steps);
        }

        if ('creation_time' in fields) {
          const creationTime = Number(fields.creation_time);
          marketResult.basic.creationTime = creationTime;
          marketResult.basic.creationTimeDisplay = new Date(creationTime).toISOString();
        }

        if ('market_state' in fields) {
          const state = Number(fields.market_state);
          marketResult.basic.state = state;
          marketResult.basic.stateDisplay = this.getMarketStateString(state);
        }

        // Process timing info
        if ('bidding_deadline' in fields) {
          const biddingDeadline = Number(fields.bidding_deadline);
          marketResult.timing.biddingDeadline = biddingDeadline;
          marketResult.timing.biddingDeadlineDisplay = new Date(biddingDeadline).toISOString();
          marketResult.timing.biddingOpen = Date.now() < biddingDeadline;
        }

        if ('resolution_time' in fields) {
          const resolutionTime = Number(fields.resolution_time);
          marketResult.timing.resolutionTime = resolutionTime;
          marketResult.timing.resolutionTimeDisplay = new Date(resolutionTime).toISOString();
        }

        if ('resolved_value' in fields) {
          const resolvedValue = Number(fields.resolved_value);
          marketResult.timing.resolvedValue = resolvedValue;
          marketResult.timing.isResolved = resolvedValue > 0;
        }

        // Process liquidity info
        if ('total_shares' in fields) {
          const totalShares = Number(fields.total_shares);
          marketResult.liquidity.totalShares = totalShares;
          marketResult.liquidity.totalSharesDisplay = (totalShares / 1_000_000).toFixed(6);
        }

        if ('cumulative_shares_sold' in fields) {
          const cumulativeSharesSold = Number(fields.cumulative_shares_sold);
          marketResult.liquidity.cumulativeSharesSold = cumulativeSharesSold;
          marketResult.liquidity.cumulativeSharesSoldDisplay = (cumulativeSharesSold / 1_000_000).toFixed(6);
        }

        // Process total liquidity if available
        // First check if there's a liquidity_share field (new approach)
        if ('liquidity_share' in fields) {
          // Use liquidity_share field directly - it's in 6 decimal format
          const liquidityShare = Number(fields.liquidity_share);
          marketResult.liquidity.liquidityShare = liquidityShare;
          marketResult.liquidity.totalLiquidity = liquidityShare;
          marketResult.liquidity.totalLiquidityDisplay = (liquidityShare / 1_000_000).toFixed(2); // Display with 2 decimals
        }
        // Fall back to total_liquidity if liquidity_share is not available
        // else if ('total_liquidity' in fields) {
        //   // The value could be stored directly as a number or in a nested structure
        //   let totalLiquidity: number;

        //   if (typeof fields.total_liquidity === 'object' && fields.total_liquidity !== null) {
        //     // It might be stored in a nested structure like { value: "1000000000" }
        //     if ('value' in fields.total_liquidity) {
        //       totalLiquidity = Number(fields.total_liquidity.value);
        //     } else {
        //       // Try to find a property that might contain the value
        //       const possibleValueProps = Object.values(fields.total_liquidity);
        //       totalLiquidity = possibleValueProps.length > 0 ? Number(possibleValueProps[0]) : 0;
        //     }
        //   } else {
        //     // It's directly stored as a primitive value
        //     totalLiquidity = Number(fields.total_liquidity);
        //   }

        //   marketResult.liquidity.totalLiquidity = totalLiquidity;
        //   marketResult.liquidity.totalLiquidityDisplay = (totalLiquidity / 1_000_000).toFixed(2); // Display with 2 decimals
        // }

        // Process spreads info
        if ('spreads' in fields && Array.isArray(fields.spreads)) {
          const spreads = fields.spreads;
          marketResult.spreads.count = spreads.length;

          // Process each spread
          for (let i = 0; i < spreads.length; i++) {
            const spreadData = spreads[i];
            const spreadFields = spreadData.fields || {};

            const spreadInfo: any = {
              spreadIndex: i,
              id: spreadFields.id?.id || null,
              precision: Number(spreadFields.precision || 0),
              lowerBound: Number(spreadFields.lower_bound || 0),
              upperBound: Number(spreadFields.upper_bound || 0),
              outstandingShares: Number(spreadFields.outstanding_shares || 0),
              outstandingSharesDisplay: (Number(spreadFields.outstanding_shares || 0) / 1_000_000).toFixed(6),
              displayRange: `${Number(spreadFields.lower_bound || 0)} - ${Number(spreadFields.upper_bound || 0)}`,
            };

            marketResult.spreads.details.push(spreadInfo);
          }
        }
      }


      // Generate mock spread prices based on the number of spreads in the market
      //console.log(`🔢 Setting default price values for spreads`);
      const spreadCount = marketResult.spreads.count || 10;
      const spreadPrices = this.generateMockSpreadPrices(marketId, spreadCount);

      // Add pricing info to the spreads
      if (spreadPrices.success && spreadPrices.indices && spreadPrices.prices) {
        for (let i = 0; i < spreadPrices.indices.length; i++) {
          const spreadIndex = spreadPrices.indices[i];
          const price = spreadPrices.prices[i];

          if (spreadIndex < marketResult.spreads.details.length) {
            const spread = marketResult.spreads.details[spreadIndex];

            // Set buy price information
            spread.buyPrice = price;
            spread.buyPriceDisplay = (price / 1_000_000).toFixed(6);

            // Set sell price information if there are outstanding shares
            // (simplified approach - in reality, buy/sell prices would differ due to spread)
            if (spread.outstandingShares > 0) {
              const sellPrice = Math.floor(price * 0.995); // Example: 0.5% spread
              spread.sellPrice = sellPrice;
              spread.sellPriceDisplay = (sellPrice / 1_000_000).toFixed(6);
            } else {
              spread.sellPrice = null;
              spread.sellPriceDisplay = "N/A";
            }
          }
        }
      }
      //console.log("Market Result: ", marketResult);
      return marketResult;
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
      //console.log("=======>>>>>>>>>>>>>>");
      //console.log("target: ", `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_buy_quote`);
      //console.log("marketId: ", marketId);
      //console.log("spreadIndex: ", spreadIndex);
      //console.log("sharesAmountWithDecimals: ", sharesAmountWithDecimals);
      //console.log("=======>>>>>>>>>>>>>>");
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
            //console.log('\nBuy Quote Information:');
            //console.log('--------------------');

            try {
              // Parse quote (u64)
              if (returnValues[0]) {
                const quoteBytes = returnValues[0][0];
                let quote = 0;
                for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
                  quote += quoteBytes[i] * Math.pow(256, i);
                }
                //console.log(`Quote: ${quote / 1_000_000} USDC (${quote} units with 6 decimals)`);
                return {
                  price: quote, // Convert to USDC
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
          //console.log('No return values in the response');
        }
      }

      throw new Error('Failed to get price quote');
    } catch (error) {
      console.error('Error getting price quote:', error);
      throw error;
    }
  }

  /**
   * Add liquidity to a market
   * 
   * @param marketId - The ID of the market to add liquidity to
   * @param usdcAmount - The amount of USDC to add as liquidity
   * @param senderAddress - The address of the sender
   * @returns Transaction to be signed and executed
   */
  async addLiquidity(
    marketId: string,
    usdcAmount: number,
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
    const usdcAmountWithDecimals = Math.floor(usdcAmount * (10 ** usdcDecimals));

    // Create transaction
    const tx = new Transaction();

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
        [bcs.U64.serialize(usdcAmountWithDecimals)]
      );

      // Call the add_liquidity function
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::add_liquidity`,
        arguments: [
          tx.object(marketId),                    // Market ID
          splitCoin,                              // USDC payment
        ],
      });
    } else {
      // If we have just one coin
      const [splitCoin] = tx.splitCoins(
        tx.object(usdcCoinIds[0]),
        [bcs.U64.serialize(usdcAmountWithDecimals)]
      );

      // Call the add_liquidity function
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::add_liquidity`,
        arguments: [
          tx.object(marketId),                    // Market ID
          splitCoin,                              // USDC payment
        ],
      });
    }

    // Set sender address
    tx.setSender(senderAddress);

    return tx;
  }

  /**
   * Remove liquidity from a market
   * 
   * @param liquidityShareId - The ID of the liquidity share object
   * @param amount - The amount of liquidity shares to remove (set to null to remove all shares)
   * @param senderAddress - The address of the sender
   * @returns Transaction to be signed and executed
   */
  async removeLiquidity(
    marketId: string,
    liquidityShareId: string,
    senderAddress: string,
  ): Promise<Transaction> {
    // Create transaction
    const tx = new Transaction();

    const usdcDecimals = 6; // USDC has 6 decimals

    
      // Remove specific amount of liquidity
      // const amountWithDecimals = Math.floor(amount * (10 ** usdcDecimals));

      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::withdraw_liquidity`,
        typeArguments: [`${USDC_CONFIG.packageId}::${MODULES.USDC}::USDC`],
        arguments: [
          tx.object(marketId),
          tx.object(liquidityShareId),   
          tx.object('0x6') 
        ],
      });
    

    // Set sender address
    tx.setSender(senderAddress);

    return tx;
  }

  /**
   * Intelligently add liquidity to a market by checking if the user has an existing position
   * 
   * @param marketId - The ID of the market to add liquidity to
   * @param usdcAmount - The amount of USDC to add as liquidity
   * @param minLpTokens - Minimum LP tokens to receive (slippage protection)
   * @param senderAddress - The address of the sender
   * @returns Transaction to be signed and executed
   */
  async addLiquidityIntelligent(
    marketId: string,
    usdcAmount: number,
    minLpTokens: number,
    senderAddress: string
  ): Promise<Transaction> {
    // Calculate amount with decimals
    const usdcDecimals = 6; // USDC has 6 decimals
    const usdcAmountWithDecimals = Math.floor(usdcAmount * (10 ** usdcDecimals));
    const minLpTokensWithDecimals = Math.floor(minLpTokens * (10 ** usdcDecimals));

    // Get available USDC coins for the user
    const { data: usdcCoins } = await this.client.getCoins({
      owner: senderAddress,
      coinType: `${SKEPSIS_CONFIG.usdc}::usdc::USDC`,
    });

    if (usdcCoins.length === 0) {
      throw new Error('No USDC coins found in wallet');
    }

    // Find if the user has an existing liquidity share for this market
    let existingLiquidityShareId = null;

    // Get all objects owned by the user
    const { data: ownedObjects } = await this.client.getOwnedObjects({
      owner: senderAddress,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    
    // Filter for LiquidityShare objects related to this market
    const liquidityShareType = `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::LiquidityShare`;
    
    for (const obj of ownedObjects) {
      const objType = obj.data?.type;
      
      // Check if this is a LiquidityShare object
      if (objType && objType.includes(liquidityShareType)) {
        // Check if it's for the correct market
        if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
          const fields = obj.data.content.fields as Record<string, any>;
          
          // Check if this liquidity share is for our target market
          if (fields.market === marketId) {
            existingLiquidityShareId = obj.data.objectId;
            break;
          }
        }
      }
    }
    //console.log("============>>>>>>>", `Existing LiquidityShare ID for market ${marketId}:`, existingLiquidityShareId);
    
    // Create transaction
    const tx = new Transaction();

    // Process USDC coins
    const usdcCoinIds = usdcCoins.map(coin => coin.coinObjectId);
    let primaryCoin = usdcCoinIds[0];

    if (usdcCoinIds.length > 1) {
      // Merge coins if we have multiple
      const mergeCoins = usdcCoinIds.slice(1);

      tx.mergeCoins(
        tx.object(primaryCoin),
        mergeCoins.map(id => tx.object(id))
      );
    }

    // Split the required amount
    const [splitCoin] = tx.splitCoins(
      tx.object(primaryCoin),
      [bcs.U64.serialize(usdcAmountWithDecimals)]
    );

    // Call the appropriate function based on whether user has an existing position
    if (existingLiquidityShareId) {
      //console.log(`User has existing liquidity share (${existingLiquidityShareId}) for market ${marketId}`);
      
      // Call add_liquidity_to_existing_position
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::add_liquidity_to_existing_position`,
        typeArguments: [`${USDC_CONFIG.packageId}::${MODULES.USDC}::USDC`],
        arguments: [
          tx.object(marketId),                        // Market ID
          tx.object(existingLiquidityShareId),        // Existing LiquidityShare ID
          splitCoin,                                  // USDC payment
          bcs.U64.serialize(minLpTokensWithDecimals), // Minimum LP tokens
          tx.object('0x6'),                           // Clock object
        ],
      });
    } else {
      //console.log(`User doesn't have existing liquidity share for market ${marketId}`);
      
      // Call add_liquidity for new position
      tx.moveCall({
        target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::add_liquidity`,
        typeArguments: [`${USDC_CONFIG.packageId}::${MODULES.USDC}::USDC`],
        arguments: [
          tx.object(marketId),                        // Market ID
          splitCoin,                                  // USDC payment
          bcs.U64.serialize(minLpTokensWithDecimals), // Minimum LP tokens
          tx.object('0x6'),                           // Clock object
        ],
      });
    }

    // Set sender address
    tx.setSender(senderAddress);

    return tx;
  }

  /**
   * Withdraw liquidity from a market
   * 
   * @param marketId - The ID of the market to withdraw liquidity from
   * @param lpTokenId - The ID of the LP token object
   * @param senderAddress - The address of the sender
   * @returns Transaction to be signed and executed
   */
  async withdrawLiquidity(
    marketId: string,
    lpTokenId: string,
    senderAddress: string
  ): Promise<Transaction> {
    // Create transaction
    const tx = new Transaction();

    // Call the withdraw_liquidity function
    tx.moveCall({
      target: `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::${MARKET_CONSTANTS.FUNCTIONS.WITHDRAW_LIQUIDITY}`,
      arguments: [
        tx.object(marketId),   // Market ID
        tx.object(lpTokenId),  // LP token ID
      ],
    });

    // Set sender address
    tx.setSender(senderAddress);

    return tx;
  }

  /**
   * Get information for multiple markets in parallel
   * 
   * @param marketIds - Array of market IDs to retrieve information for
   * @returns Array of market information objects
   */
  async getAllMarketsInfo(marketIds: string[]) {
    try {
      // Process all market info requests in parallel for efficiency
      const marketInfoPromises = marketIds.map(marketId => 
        this.getMarketInfo(marketId)
          .catch(error => {
            console.error(`Error fetching market ${marketId}:`, error);
            return {
              success: false,
              marketId: marketId,
              error: `Failed to load market data: ${error.message || error}`
            };
          })
      );
      
      const marketsInfo = await Promise.all(marketInfoPromises);
      
      return {
        success: true,
        markets: marketsInfo,
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
  }

  /**
   * Get all spread prices for a market in a single call
   * 
   * @param marketId - ID of the market to get prices for
   * @returns An object with indices and corresponding prices
   */
  async getAllSpreadPrices(marketId: string): Promise<SpreadPriceResponse> {
    try {
      //console.log(`📊 [MarketService] Fetching spread prices for market: ${marketId}`);
      
      if (!marketId) {
        throw new Error('Market ID is required');
      }
      
      // Create the transaction with required parameters
      const tx = new Transaction();
      
      // The function only takes the market ID as a parameter and USDC as a type argument
      const targetAddress = `${SKEPSIS_CONFIG.distribution_market_factory}::${MARKET_CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_all_spread_prices`;
      const typeArg = `${USDC_CONFIG.packageId}::${MODULES.USDC}::USDC`;
      
      //console.log(`🔍 [MarketService] Target address: ${targetAddress}`);
      //console.log(`🔍 [MarketService] Type argument: ${typeArg}`);
      //console.log(`🔍 [MarketService] Market ID: ${marketId}`);
      
      tx.moveCall({
        target: targetAddress,
        typeArguments: [typeArg],
        arguments: [
          tx.object(marketId)
        ],
      });
      
      // Use a try-catch for the devInspectTransactionBlock call to handle network issues
      let response;
      try {
        response = await this.client.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: CONSTANTS.NETWORK.DEFAULT_SENDER
        });
      } catch (networkError) {
        // Type-safe error handling
        const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
        console.error(`🔴 [MarketService] Network error fetching spread prices:`, errorMessage);
        throw new Error(`Network error: ${errorMessage}`);
      }
      
      // Validate that we have results
      if (!response.results || !response.results[0]) {
        console.error(`🔴 [MarketService] No results returned from blockchain`);
        throw new Error('No results returned for spread prices');
      }
      
      // Extract and validate return values
      const returnValues = response.results[0].returnValues;
      if (!returnValues || returnValues.length < 2) {
        console.error(`🔴 [MarketService] Incomplete return values:`, returnValues);
        throw new Error('Incomplete return values for spread prices');
      }
      
      //console.log(`🟢 [MarketService] Raw return values received from blockchain`);
      
      // The return type is (vector<u64>, vector<u64>) - first array is indices, second is prices
      
      // Enhanced parsing for indices (vector<u64>) with better error handling
      const indicesValue = returnValues[0];
      let indices: number[] = [];
      //console.log(`🔍 [MarketService] Parsing indices from return values`);
      
      //console.log(returnValues[1]);
      
      if (indicesValue && indicesValue.length > 0 && Array.isArray(indicesValue[0])) {
        try {
          //console.log(`🔍 [MarketService] Parsing indices from byte array`);
          
          // Each u64 is 8 bytes in little-endian format
          const indicesBytes = indicesValue[0];
          
          // Ensure we have valid byte data before proceeding
          if (!indicesBytes || !indicesBytes.length) {
            throw new Error('Empty indices byte array');
          }
          
          // Parse using similar approach as in useMarketPositions
          // First byte represents the vector length
          const numIndices = indicesBytes[0];
          
          //console.log(`🔢 [MarketService] Found ${numIndices} indices to parse (using vector length byte)`);
          
          // Parse each u64 from the byte array 
          for (let i = 0; i < numIndices; i++) {
            let spreadIndex = 0;
            // For each spread index, read 8 bytes starting after the vector length
            for (let j = 0; j < 8; j++) {
              const byteIndex = 1 + (i * 8) + j;
              if (byteIndex < indicesBytes.length) {
                // Use standard little-endian conversion - each byte is multiplied by 256^j
                spreadIndex += Number(indicesBytes[byteIndex]) * Math.pow(256, j);
              }
            }
            
            indices.push(spreadIndex);
          }
          
          //console.log(`✅ [MarketService] Successfully parsed ${indices.length} indices:`, indices);
          
          // Validate indices are in a reasonable range
          const invalidIndices = indices.filter(idx => idx < 0 || idx > 1000);
          if (invalidIndices.length > 0) {
            console.warn(`⚠️ [MarketService] Found ${invalidIndices.length} invalid indices, will use fallback`);
            // Regenerate indices if any are invalid
            indices = Array.from({ length: numIndices }, (_, i) => i);
          }
          
        } catch (error) {
          console.error(`🔴 [MarketService] Error parsing indices:`, error instanceof Error ? error.message : error);
          // Provide fallback indices to avoid breaking the UI
          indices = Array.from({ length: 10 }, (_, i) => i);
          console.warn(`⚠️ [MarketService] Using fallback sequential indices`);
        }
      } else {
        console.error(`🔴 [MarketService] Invalid indices value format:`, indicesValue);
        indices = Array.from({ length: 10 }, (_, i) => i);
        console.warn(`⚠️ [MarketService] Using fallback sequential indices due to invalid format`);
      }
      
      // Enhanced parsing for prices (vector<u64>) with better error handling
      const pricesValue = returnValues[1];
      let prices: number[] = [];
      
      if (pricesValue && pricesValue.length > 0 && Array.isArray(pricesValue[0])) {
        try {
          //console.log(`🔍 [MarketService] Parsing prices from byte array`);
          
          // Each u64 is 8 bytes in little-endian format
          const pricesBytes = pricesValue[0];
          
          // Ensure we have valid byte data
          if (!pricesBytes || !pricesBytes.length) {
            throw new Error('Empty prices byte array');
          }
          
          // Use the same approach as in useMarketPositions and for indices
          // First byte represents the vector length
          const numPrices = pricesBytes[0];
          
          //console.log(`🔢 [MarketService] Found ${numPrices} prices to parse (using vector length byte)`);
          
          // Parse each u64 from the byte array using little-endian format
          for (let i = 0; i < numPrices; i++) {
            let price = 0;
            
            // For each price, read 8 bytes starting after the vector length
            for (let j = 0; j < 8; j++) {
              const byteIndex = 1 + (i * 8) + j;
              if (byteIndex < pricesBytes.length) {
                // Use standard little-endian conversion - each byte is multiplied by 256^j
                price += Number(pricesBytes[byteIndex]) * Math.pow(256, j);
              }
            }
            
            // Add the parsed price to our array
            if (price >= 0 && price <= Number.MAX_SAFE_INTEGER) {
              prices.push(price);
            } else {
              console.warn(`⚠️ [MarketService] Price value ${price} is invalid, using fallback`);
              // Use a default price as fallback
              prices.push(100000); // Default 0.1 USDC with 6 decimals
            }
          }
          
          //console.log(`✅ [MarketService] Successfully parsed ${prices.length} prices`);
          
          // Validate prices are in a reasonable range for USDC (between 0 and 1,000,000,000)
          // This would be 0 to 1,000 USDC with 6 decimals
          const invalidPrices = prices.filter(price => price < 0 || price > 1000000000);
          if (invalidPrices.length > 0) {
            console.warn(`⚠️ [MarketService] Found ${invalidPrices.length} invalid prices, will replace with defaults`);
            // Replace invalid prices with defaults
            prices = prices.map(price => 
              (price < 0 || price > 1000000000) ? 100000 : price
            );
          }
          
          // Validate we have the same number of indices and prices
          if (prices.length !== indices.length) {
            console.warn(`⚠️ [MarketService] Mismatch between indices (${indices.length}) and prices (${prices.length})`);
            
            // Handle the mismatch - ensure arrays are the same length
            if (prices.length > indices.length) {
              // Trim extra prices
              prices = prices.slice(0, indices.length);
              //console.log(`✂️ [MarketService] Trimmed extra prices to match indices length`);
            } else {
              // Add fallback prices for missing entries
              const originalLength = prices.length;
              while (prices.length < indices.length) {
                prices.push(100000); // Default 0.1 USDC with 6 decimals
              }
              //console.log(`➕ [MarketService] Added ${indices.length - originalLength} default prices to match indices`);
            }
          }
        } catch (error) {
          console.error(`🔴 [MarketService] Error parsing prices:`, error instanceof Error ? error.message : error);
          // Provide fallback prices to avoid breaking the UI
          prices = Array(indices.length).fill(100000); // Default 0.1 USDC with 6 decimals
          console.warn(`⚠️ [MarketService] Using fallback prices due to parsing error`);
        }
      } else {
        console.error(`🔴 [MarketService] Invalid prices value format:`, pricesValue);
        prices = Array(indices.length).fill(100000);
        console.warn(`⚠️ [MarketService] Using fallback prices due to invalid format`);
      }
      
      // console.log(`📊 [MarketService] Final spread prices:`, {
      //   indicesCount: indices.length,
      //   pricesCount: prices.length,
      //   sampleIndices: indices.slice(0, 3),
      //   samplePrices: prices.slice(0, 3).map(p => `${p} (${p/1_000_000} USDC)`)
      // });
      
      return {
        success: true,
        indices,
        prices
      };
    } catch (error) {
      console.error(`🔴 [MarketService] Error getting spread prices:`, error);
      
      // Return sequential indices and default prices as fallback
      const fallbackIndices = Array.from({ length: 10 }, (_, i) => i);
      const fallbackPrices = Array(10).fill(100000); // Default 0.1 USDC with 6 decimals
      
      // Extract error message in a type-safe way
      const errorMessage = error instanceof Error ? error.message : String(error);
      //console.log(`⚠️ [MarketService] Using fallback spread prices due to error: ${errorMessage}`);
      
      return {
        success: false,
        indices: fallbackIndices, 
        prices: fallbackPrices,
        error: `Error getting spread prices: ${errorMessage}`
      };
    }
  }
}

// default MarketService;