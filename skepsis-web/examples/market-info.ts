/**
 * Market Info Script - Optimized Version
 * 
 * This script reads information about a Skepsis market by its object ID
 * using only two blockchain calls:
 * 1. One call to retrieve the complete market object
 * 2. One call to get all spread prices
 * 
 * Usage:
 * npm run market-info -- <market_id>
 * 
 * If no market ID is provided, it will use the default market ID from constants.
 */
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { CONSTANTS } from "./config/constants";
import { getSuiClient } from "./config/client";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper function to convert a byte array to a UTF-8 string
 */
function byteArrayToString(byteArray: number[]): string {
  try {
    return String.fromCharCode(...byteArray);
  } catch (e) {
    return `Error converting bytes to string: ${e}`;
  }
}

/**
 * Fetches all relevant market information using only two blockchain calls
 */
async function getMarketInfo(client: SuiClient, marketId: string): Promise<any> {
  try {
    console.log(`\n📊 Fetching information for market ${marketId}`);
    
    // CALL 1: Retrieve the complete market object with a single call
    const marketObject = await client.getObject({
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
    
    console.log(`✅ Market ${marketId} exists`);
    
    // Create our result object
    const result: any = {
      success: true,
      marketId: marketId,
      basic: {},
      timing: {},
      liquidity: {},
      spreads: {
        details: []
      },
      error: null
    };
    
    // Extract and process the market data from the raw object
    if (marketObject.data.content && marketObject.data.content.dataType === 'moveObject') {
      const fields = marketObject.data.content.fields as Record<string, any>;
      
      // Process basic market info
      if ('question' in fields && Array.isArray(fields.question)) {
        result.basic.question = byteArrayToString(fields.question);
      }
      
      if ('resolution_criteria' in fields && Array.isArray(fields.resolution_criteria)) {
        result.basic.resolutionCriteria = byteArrayToString(fields.resolution_criteria);
      }
      
      if ('steps' in fields) {
        result.basic.steps = Number(fields.steps);
      }
      
      if ('creation_time' in fields) {
        const creationTime = Number(fields.creation_time);
        result.basic.creationTime = creationTime;
        result.basic.creationTimeDisplay = new Date(creationTime).toISOString();
      }
      
      if ('market_state' in fields) {
        const state = Number(fields.market_state);
        result.basic.state = state;
        result.basic.stateDisplay = getMarketStateString(state);
      }
      
      // Process timing info
      if ('bidding_deadline' in fields) {
        const biddingDeadline = Number(fields.bidding_deadline);
        result.timing.biddingDeadline = biddingDeadline;
        result.timing.biddingDeadlineDisplay = new Date(biddingDeadline).toISOString();
        result.timing.biddingOpen = Date.now() < biddingDeadline;
      }
      
      if ('resolution_time' in fields) {
        const resolutionTime = Number(fields.resolution_time);
        result.timing.resolutionTime = resolutionTime;
        result.timing.resolutionTimeDisplay = new Date(resolutionTime).toISOString();
      }
      
      if ('resolved_value' in fields) {
        const resolvedValue = Number(fields.resolved_value);
        result.timing.resolvedValue = resolvedValue;
        result.timing.isResolved = resolvedValue > 0;
      }
      
      // Process liquidity info
      if ('total_shares' in fields) {
        const totalShares = Number(fields.total_shares);
        result.liquidity.totalShares = totalShares;
        result.liquidity.totalSharesDisplay = (totalShares / 1_000_000).toFixed(6);
      }
      
      if ('cumulative_shares_sold' in fields) {
        const cumulativeSharesSold = Number(fields.cumulative_shares_sold);
        result.liquidity.cumulativeSharesSold = cumulativeSharesSold;
        result.liquidity.cumulativeSharesSoldDisplay = (cumulativeSharesSold / 1_000_000).toFixed(6);
      }
      
      // Process total liquidity if available - handle different data structures
      if ('total_liquidity' in fields) {
        // The value could be stored directly as a number or in a nested structure
        let totalLiquidity: number;
        
        if (typeof fields.total_liquidity === 'object' && fields.total_liquidity !== null) {
          // It might be stored in a nested structure like { value: "1000000000" }
          if ('value' in fields.total_liquidity) {
            totalLiquidity = Number(fields.total_liquidity.value);
          } else {
            // Try to find a property that might contain the value
            const possibleValueProps = Object.values(fields.total_liquidity);
            totalLiquidity = possibleValueProps.length > 0 ? Number(possibleValueProps[0]) : 0;
          }
        } else {
          // It's directly stored as a primitive value
          totalLiquidity = Number(fields.total_liquidity);
        }
        
        result.liquidity.totalLiquidity = totalLiquidity;
        result.liquidity.totalLiquidityDisplay = (totalLiquidity / 1_000_000).toFixed(6);
      }
      
      // Process spreads info
      if ('spreads' in fields && Array.isArray(fields.spreads)) {
        const spreads = fields.spreads;
        
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
          
          result.spreads.details.push(spreadInfo);
        }
      }
    }
    
    // CALL 2: Get all spread prices in a single call
    console.log(`🔢 Fetching all spread prices in a single call`);
    const spreadPrices = await getAllSpreadPrices(client, marketId);
    
    // Add pricing info to the spreads
    if (spreadPrices.success && spreadPrices.indices && spreadPrices.prices) {
      for (let i = 0; i < spreadPrices.indices.length; i++) {
        const spreadIndex = spreadPrices.indices[i];
        const price = spreadPrices.prices[i];
        
        if (spreadIndex < result.spreads.details.length) {
          const spread = result.spreads.details[spreadIndex];
          
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
    
    // Add metadata from deployment info if available
    try {
      const deploymentInfoPath = path.join(__dirname, '../deployment-info.json');
      if (fs.existsSync(deploymentInfoPath)) {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
        
        // Only include if this is the same market
        if (deploymentInfo.objects && deploymentInfo.objects.market === marketId) {
          result.metadata = {
            deployment_date: deploymentInfo.deployment_date,
            network: deploymentInfo.network,
            packages: deploymentInfo.packages,
            market_params: deploymentInfo.market_params
          };
        }
      }
    } catch (e) {
      console.log("No deployment info available or error reading it");
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      marketId: marketId,
      error: `Error fetching market info: ${error}`
    };
  }
}

/**
 * Get all spread prices in a single call using the get_all_spread_prices function
 */
async function getAllSpreadPrices(client: SuiClient, marketId: string): Promise<any> {
  try {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_all_spread_prices`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        tx.object(marketId)
      ],
    });
    
    const response = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724'
    });
    
    if (!response.results || !response.results[0]) {
      throw new Error('No results returned for spread prices');
    }
    
    const returnValues = response.results[0].returnValues;
    if (!returnValues || returnValues.length < 2) {
      throw new Error('Incomplete return values for spread prices');
    }
    
    // Parse indices (vector<u64>)
    const indicesBytes = returnValues[0][0];
    let indices: number[] = [];
    
    // Vector bytes are formatted as [length, elem1, elem2, ...]
    // Each u64 takes up 8 bytes
    const numIndices = indicesBytes[0]; // First byte is length
    for (let i = 0; i < numIndices; i++) {
      let index = 0;
      for (let j = 0; j < 8; j++) {
        if (1 + i*8 + j < indicesBytes.length) {
          index += indicesBytes[1 + i*8 + j] * Math.pow(256, j);
        }
      }
      indices.push(index);
    }
    
    // Parse prices (vector<u64>)
    const pricesBytes = returnValues[1][0];
    let prices: number[] = [];
    
    // Vector bytes are formatted as [length, elem1, elem2, ...]
    // Each u64 takes up 8 bytes
    const numPrices = pricesBytes[0]; // First byte is length
    for (let i = 0; i < numPrices; i++) {
      let price = 0;
      for (let j = 0; j < 8; j++) {
        if (1 + i*8 + j < pricesBytes.length) {
          price += pricesBytes[1 + i*8 + j] * Math.pow(256, j);
        }
      }
      prices.push(price);
    }
    
    return {
      success: true,
      indices,
      prices
    };
  } catch (error) {
    console.error(`Error getting spread prices: ${error}`);
    return {
      success: false,
      error: `Error getting spread prices: ${error}`
    };
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
  console.log("🔍 Skepsis Market Information Tool (Optimized)");
  console.log("Package ID:", CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY);
  console.log("Module:", CONSTANTS.MODULES.DISTRIBUTION_MARKET);
  console.log("USDC Package ID:", CONSTANTS.PACKAGES.USDC);

  // Get command line arguments - first argument is marketId, default to the one in constants
  const providedMarketId = process.argv[2];
  const marketId = providedMarketId || CONSTANTS.OBJECTS.MARKET;
  console.log("Market ID:", marketId);
  
  // Initialize Sui client
  const client = getSuiClient();
  
  try {
    console.log("Making just 2 blockchain calls to get complete market information...");
    
    // Get market info using the optimized approach (only 2 blockchain calls)
    const marketInfo = await getMarketInfo(client, marketId);
    
    // Write output to file and also log to console
    const outputPath = path.join(__dirname, '../market-info.json');
    fs.writeFileSync(outputPath, JSON.stringify(marketInfo, null, 2));
    console.log(`\n✅ Market info written to ${outputPath}`);
    
    // Log the complete JSON object to console
    console.log("\nComplete Market JSON:");
    console.log("-----------------------");
    console.log(JSON.stringify(marketInfo, null, 2));
    
    // Print a summary
    if (marketInfo.success) {
      console.log("\nMarket Summary:");
      console.log("---------------");
      console.log(`Question: ${marketInfo.basic.question}`);
      console.log(`State: ${marketInfo.basic.stateDisplay}`);
      console.log(`Created: ${new Date(marketInfo.basic.creationTime).toLocaleString()}`);
      console.log(`Resolution: ${new Date(marketInfo.timing.resolutionTime).toLocaleString()}`);
      console.log(`Bidding open: ${marketInfo.timing.biddingOpen ? 'Yes' : 'No'}`);
      console.log(`Resolved: ${marketInfo.timing.isResolved ? `Yes (value: ${marketInfo.timing.resolvedValue})` : 'No'}`);
      console.log(`Total liquidity: ${marketInfo.liquidity.totalSharesDisplay} shares`);
      console.log(`Number of spreads: ${marketInfo.spreads.details.length}`);
    } else {
      console.error(`\n❌ Error: ${marketInfo.error}`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
  }
}

// Execute the script when run directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other scripts
export {
  getMarketInfo
};