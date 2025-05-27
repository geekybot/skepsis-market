import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Resolve Market Script for Skepsis Market Protocol
 * 
 * This script demonstrates how to resolve a market by setting the final outcome value
 * using the distribution_market module.
 */
async function main() {
  console.log('📈 Skepsis Market Resolution Tool');
  
  // Get command-line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('❌ Usage: ts-node resolve-market.ts <marketId> <resolvedValue>');
    console.error('  Example: ts-node resolve-market.ts 0x123...abc 37');
    return;
  }
  
  const marketId = args[0];
  const resolvedValue = parseInt(args[1]);
  
  if (isNaN(resolvedValue)) {
    console.error('❌ Resolved value must be a number');
    return;
  }
  
  console.log(`🎯 Market ID: ${marketId}`);
  console.log(`🔢 Resolved Value: ${resolvedValue}`);
  
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
  await checkSuiBalance(client, senderAddress);
  
  try {
    // Resolve the market
    await resolveMarket(client, keypair, marketId, resolvedValue);
  } catch (error) {
    console.error('❌ Error in market resolution:', error);
  }
}

/**
 * Resolves a market by setting its final value
 */
//0xfd45b6a75752d9f4ecd73476c78948c883db927b01667adb2eb9d03fc13f6cd8
async function resolveMarket(
  client: SuiClient, 
  keypair: Ed25519Keypair,
  marketId: string,
  resolvedValue: number
) {
  console.log('\n🎯 Resolving the market...');
  
  try {
    const txb = new Transaction();
    
    // Call the resolve_market function
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::distribution_market::resolve_market`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`], // USDC type
      arguments: [
        txb.object(marketId), // The market object ID
        txb.pure.u64(resolvedValue), // The resolved value
        txb.object(CONSTANTS.OBJECTS.CLOCK), // Sui system clock
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
      console.log('\n✅ Market resolved successfully!');
      console.log(`The market ${marketId} has been resolved with value ${resolvedValue}.`);
      console.log('Users can now claim their winnings and withdraw liquidity.');
      
      if (result.events && result.events.length > 0) {
        console.log('\nEvents:');
        result.events.forEach((event: any) => {
          console.log(`- ${event.type}: ${JSON.stringify(event.parsedJson)}`);
        });
      }
    } else {
      console.log('\n❌ Market resolution failed');
      console.log('Error:', result.effects?.status);
    }
    
  } catch (error) {
    console.error('Error resolving market:', error);
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