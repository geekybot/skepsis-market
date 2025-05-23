import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

/**
 * Examples of writing data to the Skepsis Market protocol
 */
async function main() {
  console.log('✏️ Starting write operations examples');
  
  // Initialize the SUI client
  const client = getSuiClient();
  console.log('🔄 Connected to Sui network');
  
  // Get keypair for signing transactions
  const keypair = getKeypairFromEnv();
  
  if (!keypair) {
    console.error('❌ No keypair available. Please add SUI_PRIVATE_KEY to your .env file.');
    return;
  }
  
  const address = keypair.getPublicKey().toSuiAddress();
  console.log(`👤 Using address: ${address}`);
  
  try {
    // Example 1: Create a new market
    // await createMarket(client, keypair);
    
    // Example 2: Get USDC tokens from faucet
    // await getUsdcFromFaucet(client, keypair);
    
    // Example 3: Place a bet on a market outcome
    // await placeBet(client, keypair, '0x07b551cd9c6dea576da6ab7bd3f94d341eb1d960ab1127f5a94930e4c2606416', 3);
    
    // Example 4: Add liquidity to a market
    // await addLiquidity(client, keypair, '0x07b551cd9c6dea576da6ab7bd3f94d341eb1d960ab1127f5a94930e4c2606416');
    
    // Example 5: Resolve a market (admin only)
    // await resolveMarket(client, keypair, '0x07b551cd9c6dea576da6ab7bd3f94d341eb1d960ab1127f5a94930e4c2606416', 25);
    
    // Example 6: Redeem a winning position
    // await redeemWinningPosition(client, keypair, '0xYOUR_POSITION_OBJECT_ID');
    
    console.log('⚠️ All transaction examples are commented out by default for safety.');
    console.log('⚠️ Uncomment the specific transactions you want to execute in the code.');
    
  } catch (error) {
    console.error('❌ Error in write operations:', error);
  }
}

/**
 * Example 1: Create a new market
 */
async function createMarket(
  client: SuiClient, 
  keypair: Ed25519Keypair
) {
  console.log('\n🌟 Example 1: Creating a new market');
  
  try {
    const txb = new Transaction();
    
    // Get the admin cap object
    const adminCap = CONSTANTS.OBJECTS.ADMIN_CAP;
    
    // Define the market parameters
    const question = "Will Bitcoin price exceed $100,000 by end of 2025?";
    const resolutionCriteria = "Based on the closing price on December 31st, 2025 as reported by CoinGecko";
    const steps = 10; // Number of buckets
    
    // Calculate timestamps for one month from now (resolution) and one week from now (bidding deadline)
    const now = Date.now();
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const resolutionTime = now + oneMonthMs;
    const biddingDeadline = now + oneWeekMs;
    
    // Get a USDC coin for initial liquidity
    // For the example, we expect the user to already have USDC coin
    // In a real implementation, you would use getCoins to find a suitable coin
    const initialLiquidityCoin = txb.splitCoins(
      txb.gas,
      [txb.pure(10000000)], // 10 USDC (assuming 6 decimals)
    );
    
    // Call the create_market_and_add_liquidity function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET_FACTORY}::create_market_and_add_liquidity`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`], // USDC type
      arguments: [
        txb.object(adminCap),
        txb.pure(question),
        txb.pure(resolutionCriteria),
        txb.pure(steps),
        txb.pure(resolutionTime.toString()),
        txb.pure(biddingDeadline.toString()),
        initialLiquidityCoin[0],
        txb.object(CONSTANTS.OBJECTS.CLOCK),
        txb.pure(0), // Lower bound
        txb.pure(100) // Upper bound
      ],
    });
    
    // Sign and execute the transaction
    const { bytes, signature } = await txb.sign({ signer: keypair });
    const result = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    console.log('Transaction submitted:', result);
    console.log('Status:', result.effects?.status?.status);
    
    if (result.effects?.created) {
      console.log('Created objects:');
      result.effects.created.forEach(obj => {
        console.log(`- ${obj.reference.objectId} (${obj.type})`);
      });
    }
    
  } catch (error) {
    console.error('Error creating market:', error);
  }
}

/**
 * Example 2: Get USDC tokens from faucet
 */
async function getUsdcFromFaucet(
  client: SuiClient, 
  keypair: Ed25519Keypair
) {
  console.log('\n💰 Example 2: Getting USDC from faucet');
  
  try {
    const txb = new Transaction();
    const address = keypair.getPublicKey().toSuiAddress();
    
    // Call the airdrop function from the faucet
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.FAUCET}::airdrop`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(CONSTANTS.OBJECTS.FAUCET),
      ],
    });
    
    // Sign and execute the transaction
    const { bytes, signature } = await txb.sign({ signer: keypair });
    const result = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: { showEffects: true },
    });
    
    console.log('Transaction submitted:', result);
    console.log('Status:', result.effects?.status?.status);
    
    if (result.effects?.created) {
      console.log('Received USDC objects:');
      result.effects.created.forEach(obj => {
        console.log(`- ${obj.reference.objectId} (${obj.type})`);
      });
    }
    
  } catch (error) {
    console.error('Error getting USDC from faucet:', error);
  }
}

/**
 * Example 3: Place a bet on a market outcome
 */
async function placeBet(
  client: SuiClient, 
  keypair: Ed25519Keypair,
  marketId: string,
  bucketIdx: number
) {
  console.log(`\n🎲 Example 3: Placing bet on market ${marketId} bucket ${bucketIdx}`);
  
  try {
    const txb = new Transaction();
    
    // Get user's USDC coins
    const { data: coins } = await client.getCoins({
      owner: keypair.getPublicKey().toSuiAddress(),
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`,
    });
    
    if (coins.length === 0) {
      console.log('No USDC coins found. Run getUsdcFromFaucet first.');
      return;
    }
    
    // Use the first coin for the bet
    const coin = coins[0];
    console.log(`Using coin ${coin.coinObjectId} with balance ${coin.balance}`);
    
    // Split an amount for the bet (e.g., 5 USDC)
    const betAmount = 5000000; // 5 USDC (assuming 6 decimals)
    const [betCoin] = txb.splitCoins(txb.object(coin.coinObjectId), [txb.pure(betAmount)]);
    
    // Call the place_bet function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::place_bet`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(marketId), // market ID
        betCoin, // bet amount
        txb.pure(bucketIdx), // bucket index to bet on
        txb.object(CONSTANTS.OBJECTS.CLOCK),
      ],
    });
    
    // Sign and execute the transaction
    const { bytes, signature } = await txb.sign({ signer: keypair });
    const result = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: { showEffects: true },
    });
    
    console.log('Transaction submitted:', result);
    console.log('Status:', result.effects?.status?.status);
    
    if (result.effects?.created) {
      console.log('Created Position objects:');
      result.effects.created
        .filter(obj => obj.type && obj.type.includes('distribution_market::Position'))
        .forEach(obj => {
          console.log(`- ${obj.reference.objectId} (${obj.type})`);
        });
    }
    
  } catch (error) {
    console.error('Error placing bet:', error);
  }
}

/**
 * Example 4: Add liquidity to a market
 */
async function addLiquidity(
  client: SuiClient,
  keypair: Ed25519Keypair,
  marketId: string
) {
  console.log(`\n💧 Example 4: Adding liquidity to market ${marketId}`);
  
  try {
    const txb = new Transaction();
    
    // Get user's USDC coins
    const { data: coins } = await client.getCoins({
      owner: keypair.getPublicKey().toSuiAddress(),
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`,
    });
    
    if (coins.length === 0) {
      console.log('No USDC coins found. Run getUsdcFromFaucet first.');
      return;
    }
    
    // Use the first coin for liquidity
    const coin = coins[0];
    console.log(`Using coin ${coin.coinObjectId} with balance ${coin.balance}`);
    
    // Split an amount for liquidity (e.g., 10 USDC)
    const liquidityAmount = 10000000; // 10 USDC (assuming 6 decimals)
    const [liquidityCoin] = txb.splitCoins(txb.object(coin.coinObjectId), [txb.pure(liquidityAmount)]);
    
    // Call the add_liquidity function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_AMM}::add_liquidity`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(marketId), // market ID
        liquidityCoin, // liquidity amount
        txb.object(CONSTANTS.OBJECTS.CLOCK),
      ],
    });
    
    // Sign and execute the transaction
    const { bytes, signature } = await txb.sign({ signer: keypair });
    const result = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: { showEffects: true },
    });
    
    console.log('Transaction submitted:', result);
    console.log('Status:', result.effects?.status?.status);
    
    if (result.effects?.created) {
      console.log('Created LP objects:');
      result.effects.created
        .filter(obj => obj.type && obj.type.includes('distribution_amm::LPToken'))
        .forEach(obj => {
          console.log(`- ${obj.reference.objectId} (${obj.type})`);
        });
    }
    
  } catch (error) {
    console.error('Error adding liquidity:', error);
  }
}

/**
 * Example 5: Resolve a market (admin only)
 */
async function resolveMarket(
  client: SuiClient,
  keypair: Ed25519Keypair,
  marketId: string,
  resolutionValue: number
) {
  console.log(`\n🎯 Example 5: Resolving market ${marketId} with value ${resolutionValue}`);
  
  try {
    const txb = new Transaction();
    
    // Get the admin cap object
    const adminCap = CONSTANTS.OBJECTS.ADMIN_CAP;
    
    // Call the resolve_market function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::resolve_market`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(marketId), // market ID
        txb.object(adminCap), // admin capability
        txb.pure(resolutionValue), // resolution value
        txb.object(CONSTANTS.OBJECTS.CLOCK),
      ],
    });
    
    // Sign and execute the transaction
    const { bytes, signature } = await txb.sign({ signer: keypair });
    const result = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: { showEffects: true },
    });
    
    console.log('Transaction submitted:', result);
    console.log('Status:', result.effects?.status?.status);
    
  } catch (error) {
    console.error('Error resolving market:', error);
  }
}

/**
 * Example 6: Redeem a winning position
 */
async function redeemWinningPosition(
  client: SuiClient,
  keypair: Ed25519Keypair,
  positionId: string
) {
  console.log(`\n🏆 Example 6: Redeeming winning position ${positionId}`);
  
  try {
    const txb = new Transaction();
    
    // Call the redeem_position function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::redeem_position`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(positionId), // position ID
      ],
    });
    
    // Sign and execute the transaction
    const { bytes, signature } = await txb.sign({ signer: keypair });
    const result = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature,
      options: { showEffects: true },
    });
    
    console.log('Transaction submitted:', result);
    console.log('Status:', result.effects?.status?.status);
    
    if (result.effects?.created) {
      console.log('Received USDC coins:');
      result.effects.created
        .filter(obj => obj.type && obj.type.includes('usdc::USDC'))
        .forEach(obj => {
          console.log(`- ${obj.reference.objectId} (${obj.type})`);
        });
    }
    
  } catch (error) {
    console.error('Error redeeming position:', error);
  }
}

// Execute the main function
main()
  .then(() => console.log('✅ Write operations completed'))
  .catch((error) => console.error('❌ Error:', error));