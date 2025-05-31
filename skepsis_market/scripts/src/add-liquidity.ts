import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Add Liquidity Script for Skepsis Market Protocol
 * 
 * This script demonstrates how to add liquidity to an existing market position.
 * It shows the complete process from checking balances to executing the transaction.
 */
async function main() {
  console.log('💰 Skepsis Market - Add Liquidity Tool');
  
  // Get command line arguments
  const marketId = process.argv[2];
  const liquidityAmount = process.argv[3] ? Number(process.argv[3]) * 1_000_000 : 100_000_000; // Default 100 USDC
  
  if (!marketId) {
    console.error('❌ No market ID provided. Usage: npm run add-liquidity [marketId] [amount]');
    console.error('Example: npm run add-liquidity 0x123...abc 100');
    return;
  }

  console.log(`📊 Target Market: ${marketId}`);
  console.log(`💵 Liquidity to add: ${liquidityAmount / 1_000_000} USDC`);

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
  
  // Check balances
  await checkSuiBalance(client, senderAddress);

  try {
    // Check if user has enough USDC before proceeding
    const hasEnoughCoins = await checkUserUsdcBalance(client, senderAddress, liquidityAmount);
    
    if (!hasEnoughCoins) {
      console.log('\n⚠️ You may need to get USDC tokens from the faucet first.');
      console.log('Run the USDC faucet script or uncomment the getUsdcFromFaucet() call in this script.');
      return;
    }
    
    // Verify the market exists
    const marketExists = await verifyMarket(client, marketId);
    if (!marketExists) {
      console.error(`❌ Market ${marketId} not found or is invalid.`);
      return;
    }
    
    // Add liquidity to the market
    await addLiquidityToMarket(client, keypair, marketId, liquidityAmount);
    
  } catch (error) {
    console.error('❌ Error adding liquidity:', error);
  }
}

/**
 * Verifies that the market exists
 */
async function verifyMarket(
  client: SuiClient,
  marketId: string
): Promise<boolean> {
  console.log(`\n🔍 Verifying market ${marketId}...`);
  
  try {
    const marketObject = await client.getObject({
      id: marketId,
      options: { showContent: true }
    });
    
    if (marketObject.data) {
      console.log('✅ Market verified');
      return true;
    } else {
      console.error('❌ Market not found');
      return false;
    }
  } catch (error) {
    console.error('Error verifying market:', error);
    return false;
  }
}

/**
 * Checks if the user has enough USDC balance
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
 * Adds liquidity to an existing market position
 */
async function addLiquidityToMarket(
  client: SuiClient, 
  keypair: Ed25519Keypair,
  marketId: string,
  liquidityAmount: number
) {
  console.log('\n💧 Adding liquidity to market...');
  
  try {
    const txb = new Transaction();
    
    // Find user's USDC coin to use for liquidity
    const { data: coins } = await client.getCoins({
      owner: keypair.getPublicKey().toSuiAddress(),
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`,
    });
    
    if (coins.length === 0) {
      console.error('❌ No USDC coins found for liquidity');
      return;
    }
    
    // Find a suitable coin to split from
    const coinToUse = coins.find(coin => Number(coin.balance) >= liquidityAmount);
    
    if (!coinToUse) {
      console.error(`❌ No single coin with sufficient balance (${liquidityAmount / 1_000_000} USDC) found`);
      console.log('Available coins:');
      coins.forEach(coin => {
        console.log(`- ${coin.coinObjectId}: ${Number(coin.balance) / 1_000_000} USDC`);
      });
      return;
    }
    
    console.log(`💰 Using coin ${coinToUse.coinObjectId} with balance ${Number(coinToUse.balance) / 1_000_000} USDC`);
    
    // Split the exact amount needed for the liquidity
    const [liquidityCoin] = txb.splitCoins(
      txb.object(coinToUse.coinObjectId),
      [txb.pure.u64(liquidityAmount)]
    );
    
    // Call the add_liquidity_to_existing_position function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::distribution_market::add_liquidity_to_existing_position`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(marketId),
        txb.object('0x87588b0e6dca8c0c9054e5145bf4696bf5e7a7f887a19cac1f0fb697a3f9971d'), 
        liquidityCoin,
        txb.pure.u64(liquidityAmount*0.98), // 2% slippage tolerance
        txb.object('0x6'), // Clock object ID
      ],
    });
    
    // Sign and execute the transaction
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
      console.log('\n✅ Successfully added liquidity to market!');
      
      if (result.effects?.created) {
        console.log('\nCreated objects:');
        result.effects.created.forEach((obj: any) => {
          console.log(`- ${obj.reference.objectId}`);
          
          // Try to identify liquidity share objects by checking events
          if (result.events) {
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
          if (event.type.includes('LiquidityAdded')) {
            console.log(`- Market received ${Number((event.parsedJson as any)?.amount_added) / 1_000_000} USDC liquidity`);
          } else {
            console.log(`- ${event.type}`);
          }
        });
      }
    } else {
      console.log('\n❌ Failed to add liquidity');
      console.log('Error:', result.effects?.status);
    }
    
  } catch (error) {
    console.error('Error adding liquidity:', error);
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
    
  } catch (error) {
    console.error('Error checking SUI balance:', error);
  }
}

// Execute the main function
main()
  .then(() => console.log('\n✨ Script completed'))
  .catch((error) => console.error('❌ Script failed:', error));