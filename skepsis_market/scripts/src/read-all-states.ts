/**
 * Read All States Script
 * 
 * This script demonstrates how to query the Skepsis Market module functions
 * directly, displaying raw data from each function call.
 * 
 * Usage:
 * npm run read-all-states -- <function_number> <market_id> [additional_args]
 * 
 * Function numbers:
 * 1. get_market_info - Basic market information
 * 2. get_market_timing - Market timing information (deadlines, resolution time)
 * 3. get_market_liquidity_info - Market liquidity data
 * 4. get_spreads_count - Number of spreads in the market
 * 5. get_spread_info - Information about a specific spread (requires spread_index parameter)
 * 6. get_liquidity_shares - LP share amount
 * 7. get_liquidity_share_market_id - Returns market ID from shares
 * 8. get_liquidity_share_user - Returns user address from shares
 * 9. get_buy_quote_with_premium - Calculates cost to buy shares (requires spread_index and share_amount parameters)
 * 10. get_user_position - Returns data about a user's position (requires user_address parameter)
 * 11. get_sell_quote_with_premium - Calculates proceeds from selling shares (requires spread_index and share_amount parameters)
 */
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { CONSTANTS } from "./config/constants";
import { getSuiClient } from "./config/client";

// Type definitions for common parameters
type SpreadIndex = number;
type ShareAmount = number;
type UserAddress = string;

/**
 * 1. Query the market information using get_market_info function
 */
async function getMarketInfo(client: SuiClient, marketId: string): Promise<void> {
  try {
    console.log(`\n📊 Querying get_market_info for market ${marketId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_market_info`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nMarket Information:');
          console.log('-------------------');
          
          try {
            // Parse question (vector<u8>)
            if (returnValues[0] && returnValues[0][0]) {
              const questionBytes = returnValues[0][0];
              if (questionBytes[0] === 50 && questionBytes.length >= 51) {
                const question = String.fromCharCode(...questionBytes.slice(1));
                console.log(`Question: ${question}`);
              } else {
                const question = String.fromCharCode(...questionBytes);
                console.log(`Question: ${question}`);
              }
            }
            
            // Parse resolution criteria (vector<u8>)
            if (returnValues[1] && returnValues[1][0]) {
              const criteriaBytes = returnValues[1][0];
              if (criteriaBytes[0] === 74 && criteriaBytes.length >= 75) {
                const resolutionCriteria = String.fromCharCode(...criteriaBytes.slice(1));
                console.log(`Resolution Criteria: ${resolutionCriteria}`);
              } else {
                const resolutionCriteria = String.fromCharCode(...criteriaBytes);
                console.log(`Resolution Criteria: ${resolutionCriteria}`);
              }
            }
            
            // Parse steps (u64)
            if (returnValues[2]) {
              const stepsBytes = returnValues[2][0];
              const steps = stepsBytes[0]; 
              console.log(`Steps: ${steps}`);
            }
            
            // Parse creation time (u64)
            if (returnValues[3]) {
              const timeBytes = returnValues[3][0];
              try {
                // Convert bytes to a number (little-endian u64)
                let timestamp = 0;
                for (let i = 0; i < Math.min(timeBytes.length, 8); i++) {
                  timestamp += timeBytes[i] * Math.pow(256, i);
                }
                console.log(`Creation Time: ${new Date(timestamp).toLocaleString()} (timestamp in ms)`);
              } catch (e) {
                console.log(`Creation Time: Error parsing timestamp: ${e}`);
              }
            }
            
            // Parse market state (u64)
            if (returnValues[4]) {
              const stateBytes = returnValues[4][0];
              const state = stateBytes[0];
              console.log(`Market State: ${getMarketStateString(state)}`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getMarketInfo:', error);
  }
}

/**
 * 2. Query market timing information using get_market_timing function
 */
async function getMarketTiming(client: SuiClient, marketId: string): Promise<void> {
  try {
    console.log(`\n⏰ Querying get_market_timing for market ${marketId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_market_timing`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nMarket Timing Information:');
          console.log('-------------------------');
          
          try {
            // Parse bidding deadline (u64)
            if (returnValues[0]) {
              const deadlineBytes = returnValues[0][0];
              let deadline = 0;
              for (let i = 0; i < Math.min(deadlineBytes.length, 8); i++) {
                deadline += deadlineBytes[i] * Math.pow(256, i);
              }
              console.log(`Bidding Deadline: ${new Date(deadline).toLocaleString()} (timestamp in ms)`);
            }
            
            // Parse resolution time (u64)
            if (returnValues[1]) {
              const resolutionBytes = returnValues[1][0];
              let resolutionTime = 0;
              for (let i = 0; i < Math.min(resolutionBytes.length, 8); i++) {
                resolutionTime += resolutionBytes[i] * Math.pow(256, i);
              }
              console.log(`Resolution Time: ${new Date(resolutionTime).toLocaleString()} (timestamp in ms)`);
            }
            
            // Parse resolved value (u64)
            if (returnValues[2]) {
              const valueBytes = returnValues[2][0];
              let resolvedValue = 0;
              for (let i = 0; i < Math.min(valueBytes.length, 8); i++) {
                resolvedValue += valueBytes[i] * Math.pow(256, i);
              }
              console.log(`Resolved Value: ${resolvedValue > 0 ? resolvedValue : "Not resolved yet"}`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getMarketTiming:', error);
  }
}

/**
 * 3. Query market liquidity information using get_market_liquidity_info function
 */
async function getMarketLiquidityInfo(client: SuiClient, marketId: string): Promise<void> {
  try {
    console.log(`\n💰 Querying get_market_liquidity_info for market ${marketId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_market_liquidity_info`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nMarket Liquidity Information:');
          console.log('---------------------------');
          
          try {
            // Parse total shares (u64)
            if (returnValues[0]) {
              const sharesBytes = returnValues[0][0];
              let totalShares = 0;
              for (let i = 0; i < Math.min(sharesBytes.length, 8); i++) {
                totalShares += sharesBytes[i] * Math.pow(256, i);
              }
              console.log(`Total Shares: ${totalShares / 1_000_000} (${totalShares} units with 6 decimals)`);
            }
            
            // Parse cumulative shares sold (u64)
            if (returnValues[1]) {
              const soldBytes = returnValues[1][0];
              let cumulativeSharesSold = 0;
              for (let i = 0; i < Math.min(soldBytes.length, 8); i++) {
                cumulativeSharesSold += soldBytes[i] * Math.pow(256, i);
              }
              console.log(`Cumulative Shares Sold: ${cumulativeSharesSold / 1_000_000} (${cumulativeSharesSold} units with 6 decimals)`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getMarketLiquidityInfo:', error);
  }
}

/**
 * 4. Query the number of spreads using get_spreads_count function
 */
async function getSpreadsCount(client: SuiClient, marketId: string): Promise<void> {
  try {
    console.log(`\n📏 Querying get_spreads_count for market ${marketId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_spreads_count`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nSpreads Count:');
          console.log('--------------');
          
          try {
            // Parse count (u64)
            if (returnValues[0]) {
              const countBytes = returnValues[0][0];
              let count = 0;
              for (let i = 0; i < Math.min(countBytes.length, 8); i++) {
                count += countBytes[i] * Math.pow(256, i);
              }
              console.log(`Number of Spreads: ${count}`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getSpreadsCount:', error);
  }
}

/**
 * 5. Query information about a specific spread using get_spread_info function
 */
async function getSpreadInfo(client: SuiClient, marketId: string, spreadIndex: SpreadIndex): Promise<void> {
  try {
    console.log(`\n📈 Querying get_spread_info for market ${marketId}, spread index ${spreadIndex}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_spread_info`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId),
        tx.pure.u64(spreadIndex)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nSpread Information:');
          console.log('------------------');
          
          try {
            // Parse precision (u64)
            if (returnValues[0]) {
              const precisionBytes = returnValues[0][0];
              let precision = 0;
              for (let i = 0; i < Math.min(precisionBytes.length, 8); i++) {
                precision += precisionBytes[i] * Math.pow(256, i);
              }
              console.log(`Precision: ${precision}`);
            }
            
            // Parse lower bound (u64)
            if (returnValues[1]) {
              const lowerBytes = returnValues[1][0];
              let lowerBound = 0;
              for (let i = 0; i < Math.min(lowerBytes.length, 8); i++) {
                lowerBound += lowerBytes[i] * Math.pow(256, i);
              }
              console.log(`Lower Bound: ${lowerBound}`);
            }
            
            // Parse upper bound (u64)
            if (returnValues[2]) {
              const upperBytes = returnValues[2][0];
              let upperBound = 0;
              for (let i = 0; i < Math.min(upperBytes.length, 8); i++) {
                upperBound += upperBytes[i] * Math.pow(256, i);
              }
              console.log(`Upper Bound: ${upperBound}`);
            }
            
            // Parse outstanding shares (u64)
            if (returnValues[3]) {
              const sharesBytes = returnValues[3][0];
              let outstandingShares = 0;
              for (let i = 0; i < Math.min(sharesBytes.length, 8); i++) {
                outstandingShares += sharesBytes[i] * Math.pow(256, i);
              }
              console.log(`Outstanding Shares: ${outstandingShares / 1_000_000} (${outstandingShares} units with 6 decimals)`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getSpreadInfo:', error);
  }
}

/**
 * 6. Query the liquidity shares using get_liquidity_shares function
 */
async function getLiquidityShares(client: SuiClient, marketId: string): Promise<void> {
  try {
    const liquidityShare = process.argv[3];
    console.log(`\n🧾 Querying get_liquidity_shares for market ${liquidityShare}`);
    
    const tx = new Transaction();
    
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_liquidity_shares`,
      arguments: [
        tx.object(liquidityShare)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nLiquidity Shares Information:');
          console.log('---------------------------');
          
          try {
            // Parse shares amount (u64)
            if (returnValues[0]) {
              const sharesBytes = returnValues[0][0];
              let liquidityShares = 0;
              for (let i = 0; i < Math.min(sharesBytes.length, 8); i++) {
                liquidityShares += sharesBytes[i] * Math.pow(256, i);
              }
              console.log(`Liquidity Shares: ${liquidityShares / 1_000_000} (${liquidityShares} units with 6 decimals)`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getLiquidityShares:', error);
  }
}

/**
 * 7. Query the market ID from liquidity shares using get_liquidity_share_market_id function
 */
async function getLiquidityShareMarketId(client: SuiClient, sharesId: string): Promise<void> {
  try {
    console.log(`\n🔍 Querying get_liquidity_share_market_id for shares ${sharesId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_liquidity_share_market_id`,
      arguments: [
        tx.object(sharesId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nLiquidity Share Market ID Information:');
          console.log('----------------------------------');
          
          try {
            // Parse market ID (ID)
            if (returnValues[0]) {
              console.log(`Market ID: ${returnValues[0]}`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getLiquidityShareMarketId:', error);
  }
}

/**
 * 8. Query the user address from liquidity shares using get_liquidity_share_user function
 */
async function getLiquidityShareUser(client: SuiClient, sharesId: string): Promise<void> {
  try {
    console.log(`\n👤 Querying get_liquidity_share_user for shares ${sharesId}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_liquidity_share_user`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(sharesId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nLiquidity Share User Information:');
          console.log('-------------------------------');
          
          try {
            // Parse user address (address)
            if (returnValues[0]) {
              console.log(`User Address: ${returnValues[0][0]}`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getLiquidityShareUser:', error);
  }
}

/**
 * 9. Calculate buy quote with premium using get_buy_quote_with_premium function
 */
async function getBuyQuoteWithPremium(client: SuiClient, marketId: string, spreadIndex: SpreadIndex, shareAmount: ShareAmount): Promise<void> {
  try {
    console.log(`\n💵 Querying get_buy_quote_with_premium for market ${marketId}, spread ${spreadIndex}, amount ${shareAmount}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_buy_quote`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId),
        tx.pure.u64(spreadIndex),
        tx.pure.u64(shareAmount * 1_000_000) // Convert to units with 6 decimals
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getBuyQuoteWithPremium:', error);
  }
}

/**
 * 10. Query user position information using get_user_position function
 * Returns data in JSON format for frontend use
 */
async function getUserPosition(client: SuiClient, marketId: string, userAddress: UserAddress): Promise<any> {
  try {
    console.log(`\n👤 Querying get_user_position for market ${marketId}, user ${userAddress}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_user_position`,
      typeArguments: [],
      arguments: [
        tx.object(CONSTANTS.OBJECTS.POSITION_REGISTRY),
        tx.pure.address(userAddress),
        tx.object(marketId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    // Prepare response object
    const result: {
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
    } = {
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
        user: userAddress,
        marketId: marketId
      },
      error: null,
      rawData: null
    };
    
    // For debugging
    console.log("Raw response:", JSON.stringify(response));
    
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
    
    // For debugging
    console.log("Return values:", JSON.stringify(returnValues));
    
    try {
      // Parse has position (bool) - Index 0
      const hasPositionData = returnValues[0] && returnValues[0][0];
      // For boolean values, check if it's 1
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
      
      // Handle array case for byte data
      if (Array.isArray(investedData)) {
        for (let i = 0; i < Math.min(investedData.length, 8); i++) {
          totalInvested += Number(investedData[i]) * Math.pow(256, i);
        }
      }
      
      result.data.totalInvested = totalInvested;
      result.data.totalInvestedDisplay = (totalInvested / 1_000_000).toFixed(6);
      
      // Parse claimed flag (bool) - Index 2
      const claimedData = returnValues[2] && returnValues[2][0];
      // For boolean values, check if it's 1
      const claimed = Array.isArray(claimedData) && claimedData.length > 0 && claimedData[0] === 1;
      result.data.claimed = claimed;
      
      // Parse winnings claimed amount (u64) - Index 3
      let winningsClaimed = 0;
      const winningsData = returnValues[3] && returnValues[3][0];
      
      // Handle array case for byte data
      if (Array.isArray(winningsData)) {
        for (let i = 0; i < Math.min(winningsData.length, 8); i++) {
          winningsClaimed += Number(winningsData[i]) * Math.pow(256, i);
        }
      }
      
      result.data.winningsClaimed = winningsClaimed;
      result.data.winningsClaimedDisplay = (winningsClaimed / 1_000_000).toFixed(6);
      
      // Parse spread indices (vector<u64>) - Index 4
      const spreadIndicesData = returnValues[4] && returnValues[4][0];
      
      // If no spread data, return early
      if (!spreadIndicesData || (Array.isArray(spreadIndicesData) && spreadIndicesData.length === 0)) {
        result.success = true;
        return result;
      }
      
      // Parse number of spreads and prepare array for indices
      const spreadIndices: number[] = [];
      let numSpreads = 0;
      
      // Handle vector structure - first byte indicates the length
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
      
      // Extract share amounts using the same logic as spread indices
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
      data: null,
      error: `Error in getUserPosition: ${error}`,
      rawData: null
    };
  }
}

/**
 * 11. Calculate sell quote with premium using get_sell_quote_with_premium function
 */
async function getSellQuoteWithPremium(client: SuiClient, marketId: string, spreadIndex: SpreadIndex, shareAmount: ShareAmount): Promise<void> {
  try {
    console.log(`\n💰 Querying get_sell_quote_with_premium for market ${marketId}, spread ${spreadIndex}, amount ${shareAmount}`);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_sell_quote`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId),
        tx.pure.u64(spreadIndex),
        tx.pure.u64(shareAmount * 1_000_000) // Convert to units with 6 decimals
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (response.results && response.results[0]) {
      const returnValues = response.results[0].returnValues;
      
      if (returnValues && returnValues.length >= 1) {
        try {
          console.log('\nSell Quote Information:');
          console.log('---------------------');
          
          try {
            // Parse quote (u64)
            if (returnValues[0]) {
              const quoteBytes = returnValues[0][0];
              let quote = 0;
              for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
                quote += quoteBytes[i] * Math.pow(256, i);
              }
              console.log(`Quote: ${quote / 1_000_000} USDC (${quote} units with 6 decimals)`);
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
    } else {
      console.error('No results returned or error in transaction');
    }
  } catch (error) {
    console.error('Error in getSellQuoteWithPremium:', error);
  }
}

/**
 * Converts a market state number to a descriptive string
 */
function getMarketStateString(state: number): string {
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
 * Main function to handle command line arguments and call appropriate functions
 */
async function main(): Promise<void> {
  console.log("🔍 Skepsis Market Module Query Tool");
  console.log("Package ID:", CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY);
  console.log("Module:", CONSTANTS.MODULES.DISTRIBUTION_MARKET);
  console.log("USDC Package ID:", CONSTANTS.PACKAGES.USDC);
  console.log("Market ID:", CONSTANTS.OBJECTS.MARKET);

  // Get command line arguments
  const funcNum = parseInt(process.argv[2] || '1', 10);
  const marketId = CONSTANTS.OBJECTS.MARKET;
  
  // Initialize Sui client
  const client = getSuiClient();
  
  try {
    // First verify the market exists (for functions that need a market ID)
    if ([1, 2, 3, 4, 5, 6, 9, 10, 11].includes(funcNum)) {
      try {
        const marketObject = await client.getObject({
          id: marketId,
          options: { showContent: true }
        });
        
        if (marketObject.data) {
          console.log(`✅ Market ${marketId} exists`);
        } else {
          console.error(`❌ Market ${marketId} not found`);
          return;
        }
      } catch (error) {
        console.error(`❌ Error checking market: ${error}`);
        return;
      }
    }
    
    // Call the appropriate function based on the first argument
    switch (funcNum) {
      case 1:
        await getMarketInfo(client, marketId);
        break;
      case 2:
        await getMarketTiming(client, marketId);
        break;
      case 3:
        await getMarketLiquidityInfo(client, marketId);
        break;
      case 4:
        await getSpreadsCount(client, marketId);
        break;
      case 5:
        const spreadIndex = parseInt(process.argv[3] || '0', 10);
        await getSpreadInfo(client, marketId, spreadIndex);
        break;
      case 6:
        await getLiquidityShares(client, marketId);
        break;
      case 7:
        const sharesId = process.argv[3] || '';
        if (!sharesId) {
          console.error('❌ Shares ID is required for get_liquidity_share_market_id');
          return;
        }
        await getLiquidityShareMarketId(client, sharesId);
        break;
      case 8:
        const sharesIdForUser = process.argv[3] || '';
        if (!sharesIdForUser) {
          console.error('❌ Shares ID is required for get_liquidity_share_user');
          return;
        }
        await getLiquidityShareUser(client, sharesIdForUser);
        break;
      case 9:
        const buySpreadIndex = parseInt(process.argv[4] || '0', 10);
        const buyShareAmount = parseFloat(process.argv[5] || '1');
        await getBuyQuoteWithPremium(client, marketId, buySpreadIndex, buyShareAmount);
        break;
      case 10:
        const userAddress = process.argv[4] || '0x57400cf44ad97dac479671bb58b96d444e87972f09a6e17fa9650a2c60fbc054';
        const userPositionResult = await getUserPosition(client, marketId, userAddress);
        console.log(JSON.stringify(userPositionResult, null, 2));
        break;
      case 11:
        const sellSpreadIndex = parseInt(process.argv[4] || '0', 10);
        const sellShareAmount = parseFloat(process.argv[5] || '1');
        await getSellQuoteWithPremium(client, marketId, sellSpreadIndex, sellShareAmount);
        break;
      default:
        console.log('Invalid function number. Please choose a number between 1 and 11.');
        console.log(`
Usage: npm run read-all-states -- <function_number> <market_id> [additional_args]

Function numbers:
1. get_market_info - Basic market information
2. get_market_timing - Market timing information
3. get_market_liquidity_info - Market liquidity data
4. get_spreads_count - Number of spreads in the market
5. get_spread_info - Information about a specific spread (requires spread_index parameter)
6. get_liquidity_shares - LP share amount
7. get_liquidity_share_market_id - Returns market ID from shares (requires shares_id parameter)
8. get_liquidity_share_user - Returns user address from shares (requires shares_id parameter)
9. get_buy_quote_with_premium - Calculates cost to buy shares (requires spread_index and share_amount parameters)
10. get_user_position - Returns data about a user's position (requires user_address parameter)
11. get_sell_quote_with_premium - Calculates proceeds from selling shares (requires spread_index and share_amount parameters)
        `);
    }
    
    console.log("\n✅ Function executed successfully");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Execute the script
if (require.main === module) {
  main().catch(console.error);
}

export {
  getMarketInfo,
  getMarketTiming,
  getMarketLiquidityInfo,
  getSpreadsCount,
  getSpreadInfo,
  getLiquidityShares,
  getLiquidityShareMarketId,
  getLiquidityShareUser,
  getBuyQuoteWithPremium,
  getUserPosition,
  getSellQuoteWithPremium
};