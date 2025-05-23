import { getSuiClient } from './config/client';
import { CONSTANTS } from './config/constants';

/**
 * Examples of reading data from the Skepsis Market protocol
 */
async function main() {
  console.log('🔍 Starting read operations examples');
  
  // Initialize the SUI client
  const client = getSuiClient();
  console.log('🔄 Connected to Sui network');

  try {
    // Example 1: Get all markets created by the factory
    await getAllMarkets();
    
    // Example 2: Get details of a specific market
    await getMarketDetails('0x07b551cd9c6dea576da6ab7bd3f94d341eb1d960ab1127f5a94930e4c2606416');
    
    // Example 3: Get current market pricing data
    await getMarketPricing('0x07b551cd9c6dea576da6ab7bd3f94d341eb1d960ab1127f5a94930e4c2606416');
    
    // Example 4: Get user's market positions
    // Replace with an actual user address to test
    const userAddress = process.env.SUI_ADDRESS || '0x061707b6ca235a45c6aaad61cd323c535ef0cef2cdcf2ed8706de1f819048af5';
    await getUserPositions(userAddress);
    
  } catch (error) {
    console.error('❌ Error in read operations:', error);
  }

  /**
   * Example 1: Get all markets created by the factory
   */
  async function getAllMarkets() {
    console.log('\n📊 Example 1: Fetching all distribution markets');
    
    try {
      // Query for dynamic field objects on the factory
      const { data } = await client.getDynamicFields({
        parentId: CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY
      });
      
      if (data.length === 0) {
        console.log('No markets found');
        return;
      }
      
      console.log(`Found ${data.length} markets`);
      
      // For each market ID, we can get more details
      for (const item of data.slice(0, 3)) { // Limiting to 3 markets for example brevity
        console.log(`- Market ID: ${item.objectId}`);
      }
      
      if (data.length > 3) {
        console.log(`... and ${data.length - 3} more markets`);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  }

  /**
   * Example 2: Get details of a specific market
   */
  async function getMarketDetails(marketId: string) {
    console.log(`\n📈 Example 2: Fetching details for market ${marketId}`);
    
    try {
      const marketObject = await client.getObject({
        id: marketId,
        options: { showContent: true, showDisplay: true }
      });
      
      if (!marketObject.data) {
        console.log(`Market ${marketId} not found`);
        return;
      }
      
      const fields = getObjectFields(marketObject);
      
      if (fields) {
        console.log('Market Details:');
        console.log(`- Question: ${fields.question}`);
        console.log(`- Resolution Criteria: ${fields.resolution_criteria}`);
        console.log(`- Resolution Time: ${new Date(Number(fields.resolution_time)).toLocaleString()}`);
        console.log(`- Bidding Deadline: ${new Date(Number(fields.bidding_deadline)).toLocaleString()}`);
        console.log(`- Lower Bound: ${fields.lower_bound}`);
        console.log(`- Upper Bound: ${fields.upper_bound}`);
        console.log(`- Steps: ${fields.steps}`);
        console.log(`- Status: ${fields.status?.fields?.status_type || 'Unknown'}`);
      } else {
        console.log('Failed to get market fields');
      }
    } catch (error) {
      console.error(`Error fetching market details for ${marketId}:`, error);
    }
  }

  /**
   * Example 3: Get current market pricing data
   */
  async function getMarketPricing(marketId: string) {
    console.log(`\n💰 Example 3: Fetching pricing data for market ${marketId}`);
    
    try {
      // First get the market object to find the AMM object ID
      const marketObject = await client.getObject({
        id: marketId,
        options: { showContent: true }
      });
      
      const marketFields = getObjectFields(marketObject);
      
      if (!marketFields || !marketFields.amm_id) {
        console.log('AMM ID not found in market object');
        return;
      }
      
      const ammId = marketFields.amm_id;
      
      // Get the AMM object to retrieve pricing information
      const ammObject = await client.getObject({
        id: ammId,
        options: { showContent: true }
      });
      
      const ammFields = getObjectFields(ammObject);
      
      if (!ammFields) {
        console.log('Failed to get AMM fields');
        return;
      }
      
      console.log('Current Market Pricing:');
      console.log(`- AMM ID: ${ammId}`);
      console.log(`- Pool Balance: ${ammFields.pool_balance || 'Unknown'}`);
      
      // Get the buckets pricing data (if available)
      if (ammFields.bucket_shares) {
        console.log('- Bucket Pricing Data:');
        for (let i = 0; i < (ammFields.bucket_shares.length || 0); i++) {
          console.log(`  Bucket ${i}: ${ammFields.bucket_shares[i]} shares`);
        }
      }
    } catch (error) {
      console.error(`Error fetching pricing data for market ${marketId}:`, error);
    }
  }

  /**
   * Example 4: Get user's market positions
   */
  async function getUserPositions(userAddress: string) {
    console.log(`\n👤 Example 4: Fetching positions for user ${userAddress}`);
    
    try {
      // Query for owned objects of type "Position"
      const { data } = await client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::distribution_market::Position`
        },
        options: { showContent: true }
      });
      
      if (data.length === 0) {
        console.log('No positions found for this user');
        return;
      }
      
      console.log(`Found ${data.length} positions`);
      
      // For each position, get the details
      for (const item of data) {
        const position = getObjectFields(item);
        
        if (position) {
          console.log(`- Position ID: ${item.data?.objectId}`);
          console.log(`  Market ID: ${position.market_id}`);
          console.log(`  Bucket Index: ${position.bucket_idx}`);
          console.log(`  Shares: ${position.shares}`);
        }
      }
    } catch (error) {
      console.error(`Error fetching positions for user ${userAddress}:`, error);
    }
  }

  // Helper function to extract fields from object response
  function getObjectFields(response: any): any {
    if (response?.data?.content?.fields) {
      return response.data.content.fields;
    }
    return null;
  }
}

// Execute the main function
main()
  .then(() => console.log('✅ Read operations completed'))
  .catch((error) => console.error('❌ Error:', error));