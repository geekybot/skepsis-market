/**
 * Market Info Script
 * 
 * This script displays detailed information about a Skepsis prediction market
 * using direct object queries to the Sui blockchain.
 */
import { SuiClient } from "@mysten/sui/client";
import { CONSTANTS } from "./config/constants";
import { getSuiClient } from "./config/client";

const MARKET_ID = '0x60211d72f879da7cafe5b5af09f39feb3815ed770000fef3878c3b495e1baac7'; // ID of the market we created

/**
 * Main function to fetch and display market information
 */
async function main() {
  console.log("🔍 Skepsis Market Info Tool");
  
  // Connect to Sui network
  const client = getSuiClient();
  console.log("🔄 Connected to Sui network");

  try {
    // Get market info and display it
    await displayMarketInfo(client, MARKET_ID);
    console.log("✨ Script completed");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

/**
 * Displays detailed information about a specific market
 */
async function displayMarketInfo(client: SuiClient, marketId: string) {
  console.log(`\n📊 Market Details for ${marketId}`);

  // Get the market object with its fields
  const marketObject = await client.getObject({
    id: marketId,
    options: { showContent: true, showDisplay: true }
  });

  const fields = getObjectFields(marketObject);
  
  if (!fields) {
    console.error("❌ Failed to get market fields");
    return;
  }

  // Display basic market information
  console.log("\n📝 Basic Information:");
  console.log(`Question: ${convertAsciiArrayToString(fields.question)}`);
  console.log(`Resolution Criteria: ${convertAsciiArrayToString(fields.resolution_criteria)}`);
  console.log(`Number of Steps/Spreads: ${fields.steps}`);
  console.log(`Creation Time: ${new Date(Number(fields.creation_time)).toLocaleString()}`);
  console.log(`Market State: ${getMarketStateString(fields.status?.fields?.status_type || 'Unknown')}`);
  
  // Display timing information
  console.log("\n⏰ Timing Information:");
  console.log(`Bidding Deadline: ${new Date(Number(fields.bidding_deadline)).toLocaleString()}`);
  console.log(`Resolution Time: ${new Date(Number(fields.resolution_time)).toLocaleString()}`);
  console.log(`Resolved Value: ${fields.resolved_value ? fields.resolved_value : "Not resolved yet"}`);

  // Display liquidity information
  console.log("\n💰 Liquidity Information:");
  console.log(`Total Liquidity: ${Number(fields.total_liquidity) / 1_000_000} USDC (${fields.total_liquidity} units with 6 decimals)`);
  
  // Get the AMM object to retrieve more detailed information
  if (fields.amm_id) {
    const ammObject = await client.getObject({
      id: fields.amm_id,
      options: { showContent: true }
    });
    
    const ammFields = getObjectFields(ammObject);
    
    if (ammFields) {
      console.log(`AMM ID: ${fields.amm_id}`);
      console.log(`Pool Balance: ${Number(ammFields.pool_balance) / 1_000_000} USDC (${ammFields.pool_balance} units with 6 decimals)`);
      
      // Display spread information
      if (ammFields.buckets && ammFields.buckets.fields && ammFields.buckets.fields.contents) {
        const buckets = ammFields.buckets.fields.contents;
        console.log(`\n📈 Spread Information (${buckets.length} spreads):`);
        
        for (let i = 0; i < buckets.length; i++) {
          const bucket = buckets[i].fields;
          console.log(`\nSpread ${i}: ${bucket.lower_bound}-${bucket.upper_bound}`);
          console.log(`  Precision: ${bucket.precision || 'Not available'}`);
          console.log(`  Outstanding Shares: ${Number(bucket.outstanding_shares) / 1_000_000} (${bucket.outstanding_shares} units with 6 decimals)`);
          
          // If we have share prices, display them
          if (ammFields.bucket_shares && ammFields.bucket_shares[i]) {
            const sharePrice = ammFields.bucket_shares[i];
            const pricePercentage = (Number(sharePrice) / 1_000_000) * 100;
            console.log(`  Current Price: ${pricePercentage.toFixed(2)}%`);
          }
        }
      } else {
        console.log("\nSpread information not available");
      }
    }
  }
}

/**
 * Convert ASCII array to string
 */
function convertAsciiArrayToString(asciiArray: number[]): string {
  if (!asciiArray || !Array.isArray(asciiArray)) {
    return 'Not available';
  }
  
  try {
    return String.fromCharCode(...asciiArray);
  } catch (error) {
    console.error('Error converting ASCII array to string:', error);
    return 'Error converting text';
  }
}

/**
 * Convert market state to a human-readable string
 */
function getMarketStateString(state: any): string {
  if (typeof state === 'number') {
    switch (state) {
      case 0:
        return "Open";
      case 1:
        return "Resolved";
      case 2:
        return "Canceled";
      default:
        return `Unknown (${state})`;
    }
  }
  return `${state}`;
}

/**
 * Helper function to extract fields from object response
 */
function getObjectFields(response: any): any {
  if (response?.data?.content?.fields) {
    return response.data.content.fields;
  }
  return null;
}

// Run the script
main().catch(console.error);