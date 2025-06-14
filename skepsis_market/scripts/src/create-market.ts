import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Create Market Script for Skepsis Market Protocol
 * 
 * This script demonstrates how to create a new market using the distribution_market_factory module.
 * It shows the complete process from setting up parameters to executing the transaction.
 */
async function main() {
  console.log('🚀 Skepsis Market Creation Tool');
  
  // Initialize the SUI client
  const client = getSuiClient();
  console.log('🔄 Connected to Sui network');

  // Get keypair for signing transactions
  const keypair = getKeypairFromEnv();
  
  if (!keypair) {
    console.error('❌ No keypair available. Please add SUI_PRIVATE_KEY to your .env file.');
    return;
  }
  
  const senderAddress = keypair.getPublicKey().toSuiAddress();
  console.log(`👤 Using address: ${senderAddress}`);
  
  // Check SUI balance first
//   await checkSuiBalance(client, senderAddress);

  // Market parameters - you can customize these
  const marketParams = {
    question: "What will be the Price of SUI in USD on 12:10:00 UTC, June 14, 2025?",
    resolutionCriteria: "Based on the price reported by CoinMarketCap on June 14, 2025 at 12:10:00 UTC.",
    steps: 50, // Number of buckets/spreads
    lowerBound: 200, // Minimum value (e.g., 0%)
    upperBound: 700, // Maximum value (e.g., 100%)
    initialLiquidity: 30000_000_000, // 1000 USDC (minimum requirement is 1000 USDC)
    // Calculate timestamps (in milliseconds) for deadlines
    resolutionTimeMs: 1749903120000 + (15 *60 * 60 *1000), // Saturday, 14 June 2025 10:25:00 AM UTC
    biddingDeadlineMs: 1749903000000 + (15 *60 * 60 *1000), // Saturday, 14 June 2025 10:25:00 AM UTC
  };
  
  console.log('\n📊 Market Parameters:');
  console.log(`Question: ${marketParams.question}`);
  console.log(`Resolution Criteria: ${marketParams.resolutionCriteria}`);
  console.log(`Number of buckets/spreads: ${marketParams.steps}`);
  console.log(`Value range: ${marketParams.lowerBound} - ${marketParams.upperBound}`);
  console.log(`Initial liquidity: ${marketParams.initialLiquidity / 1_000_000} USDC`);
  console.log(`Resolution time: ${new Date(marketParams.resolutionTimeMs).toLocaleString()}`);
  console.log(`Bidding deadline: ${new Date(marketParams.biddingDeadlineMs).toLocaleString()}`);
  
  try {
    // Check if user has enough USDC before proceeding
    const hasEnoughCoins = await checkUserUsdcBalance(client, senderAddress, marketParams.initialLiquidity);
    await checkSuiBalance(client, senderAddress);
    if (!hasEnoughCoins) {
      console.log('\n⚠️ You may need to get USDC tokens from the faucet first.');
      console.log('Run the USDC faucet script or uncomment the getUsdcFromFaucet() call in this script.');
      
      // Uncomment to automatically get USDC from faucet
      // await getUsdcFromFaucet(client, keypair);
      return;
    }
    
    // Create the market
    await createMarket(client, keypair, marketParams);
    
  } catch (error) {
    console.error('❌ Error in market creation:', error);
  }
}

/**
 * Checks if the user has enough USDC balance to provide the initial liquidity
 */
async function checkUserUsdcBalance(
  client: SuiClient,
  address: string,
  requiredAmount: number
): Promise<boolean> {
  console.log('\n🔍 Checking USDC balance...');
  
  try {
    const { data: coins } = await client.getCoins({
      owner: address,
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`
    });
    
    if (coins.length === 0) {
      console.log('❌ No USDC coins found in your wallet.');
      return false;
    }
    
    // Calculate total balance across all coins
    const totalBalance = coins.reduce((sum, coin) => sum + Number(coin.balance), 0);
    console.log(`💰 Current USDC balance: ${totalBalance / 1_000_000} USDC`);
    
    return totalBalance >= requiredAmount;
    
  } catch (error) {
    console.error('Error checking USDC balance:', error);
    return false;
  }
}

/**
 * Gets USDC tokens from the faucet if needed
 */
async function getUsdcFromFaucet(
  client: SuiClient,
  keypair: Ed25519Keypair
) {
  console.log('\n💰 Getting USDC from faucet...');
  
  try {
    const txb = new Transaction();
    
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
    
    if (result.effects?.status?.status === 'success') {
      console.log('✅ Successfully received USDC from faucet');
      
      if (result.effects?.created) {
        result.effects.created.forEach(obj => {
          console.log(`- Received USDC coin: ${obj.reference.objectId}`);
        });
      }
    } else {
      console.log('❌ Failed to get USDC from faucet');
      console.log('Status:', result.effects?.status?.status);
    }
    
  } catch (error) {
    console.error('Error getting USDC from faucet:', error);
  }
}

/**
 * Creates a new market with the specified parameters
 */
async function createMarket(
  client: SuiClient, 
  keypair: Ed25519Keypair,
  params: {
    question: string,
    resolutionCriteria: string,
    steps: number,
    lowerBound: number,
    upperBound: number,
    initialLiquidity: number,
    resolutionTimeMs: number,
    biddingDeadlineMs: number,
  }
) {
  console.log('\n🌟 Creating a new market...');
  
  try {
    const txb = new Transaction();
    
    // Get the admin cap object
    // const adminCap = CONSTANTS.OBJECTS.ADMIN_CAP;
    
    // Find user's USDC coin to use for initial liquidity
    const { data: coins } = await client.getCoins({
      owner: keypair.getPublicKey().toSuiAddress(),
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`,
    });
    
    if (coins.length === 0) {
      console.error('❌ No USDC coins found for initial liquidity');
      return;
    }
    
    // Find a suitable coin to split from
    const coinToUse = coins.find(coin => Number(coin.balance) >= params.initialLiquidity);
    
    if (!coinToUse) {
      console.error(`❌ No single coin with sufficient balance (${params.initialLiquidity / 1_000_000} USDC) found`);
      console.log('Available coins:');
      coins.forEach(coin => {
        console.log(`- ${coin.coinObjectId}: ${Number(coin.balance) / 1_000_000} USDC`);
      });
      return;
    }
    
    console.log(`💰 Using coin ${coinToUse.coinObjectId} with balance ${Number(coinToUse.balance) / 1_000_000} USDC`);
    
    // Split the exact amount needed for the initial liquidity
    const [initialLiquidityCoin] = txb.splitCoins(
      txb.object(coinToUse.coinObjectId),
      [txb.pure.u64(params.initialLiquidity)]
    );
    
    // Convert timestamp from milliseconds to Sui timestamp format (milliseconds)
    // Important: Use u64 numbers, not strings for timestamps
    const resolutionTimeMs = params.resolutionTimeMs;
    const biddingDeadlineMs = params.biddingDeadlineMs;
    
    // Call the create_market function directly without the factory
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::distribution_market_factory::create_market_and_add_liquidity`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`], // USDC type
      arguments: [
        // txb.object(adminCap), // AdminCap parameter
        txb.object(CONSTANTS.OBJECTS.FACTORY), // Factory parameter
        txb.pure.string(params.question),
        txb.pure.string(params.resolutionCriteria),
        txb.pure.u64(params.steps),
        txb.pure.u64(resolutionTimeMs),
        txb.pure.u64(biddingDeadlineMs),
        initialLiquidityCoin,
        txb.object(CONSTANTS.OBJECTS.CLOCK),
        txb.pure.u64(params.lowerBound),
        txb.pure.u64(params.upperBound),
      ],
    });
    
    // Use signAndExecuteTransaction which handles both signing and execution
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: txb,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    console.log('Transaction status:', result.effects?.status?.status);
    
    if (result.effects?.status?.status === 'success') {
      console.log('\n✅ Market created successfully!');
      
      if (result.effects?.created) {
        console.log('\nCreated objects:');
        result.effects.created.forEach((obj: any) => {
          console.log(`- ${obj.reference.objectId}`);
          
          // Try to identify market and liquidity share objects by checking objectType in events
          if (result.events) {
            // Look for market creation event
            const marketEvent = result.events.find((e: any) => 
              e.type.includes('MarketCreated') && 
              (e.parsedJson as any)?.market_id === obj.reference.objectId
            );
            
            if (marketEvent) {
              console.log(`\n🎯 New Market ID: ${obj.reference.objectId}`);
              console.log(`Store this ID for future interactions with your market!`);
            }
            
            // Look for liquidity share creation event
            const liquidityEvent = result.events.find((e: any) => 
              e.type.includes('LiquidityAdded') && 
              (e.parsedJson as any)?.liquidity_share_id === obj.reference.objectId
            );
            
            if (liquidityEvent) {
              console.log(`\n🏦 Your Liquidity Share ID: ${obj.reference.objectId}`);
              console.log(`You'll need this ID when withdrawing your liquidity later.`);
            }
          }
        });
      }
      
      if (result.events) {
        console.log('\nEvents:');
        result.events.forEach((event: any) => {
          console.log(`- ${event.type}: ${JSON.stringify(event.parsedJson)}`);
        });
      }
    } else {
      console.log('\n❌ Market creation failed');
      console.log('Error:', result.effects?.status);
    }
    
  } catch (error) {
    console.error('Error creating market:', error);
  }
}

/**
 * Checks the SUI balance of an address
 */
async function checkSuiBalance(
  client: SuiClient,
  address: string
): Promise<void> {
  console.log(`\n🔍 Checking SUI balance for ${address}...`);
  
  try {
    const { data: suiCoins } = await client.getCoins({
      owner: address,
      coinType: '0x2::sui::SUI'
    });
    
    if (suiCoins.length === 0) {
      console.log('⚠️ No SUI coins found in wallet');
      return;
    }
    
    // Calculate total balance across all coins
    const totalBalance = suiCoins.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    console.log(`💰 Current SUI balance: ${Number(totalBalance) / 1_000_000_000} SUI`);
    
    // Show individual coins
    console.log('\nSUI coins:');
    suiCoins.forEach(coin => {
      console.log(`- ${coin.coinObjectId}: ${Number(coin.balance) / 1_000_000_000} SUI`);
    });
    
  } catch (error) {
    console.error('Error checking SUI balance:', error);
  }
}

// Execute the main function
main()
  .then(() => console.log('\n✨ Script completed'))
  .catch((error) => console.error('❌ Script failed:', error));