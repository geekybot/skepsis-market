import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Sell Shares Script for Skepsis Market Protocol
 * 
 * This script demonstrates how to sell shares with a minimum expected output amount.
 */
async function main() {
  console.log('💸 Skepsis Market - Sell Shares Tool');
  
  // Get command line arguments
  const positionId = process.argv[2];
  const sharesToSell = process.argv[3] ? Number(process.argv[3]) * 1_000_000 : 0; // Default: sell all shares in position
  const minOutput = process.argv[4] ? Number(process.argv[4]) * 1_000_000 : 1_000_000; // Default: 1 USDC minimum
  
  if (!positionId) {
    console.error('❌ No position ID provided. Usage: npm run sell-shares [positionId] [amount] [minOutput]');
    console.error('Example: npm run sell-shares 0x123...abc 5 2.5');
    console.error('Note: If no amount is provided, all shares in the position will be sold');
    return;
  }

  console.log(`🎫 Position ID: ${positionId}`);
  if (sharesToSell > 0) {
    console.log(`📉 Shares to sell: ${sharesToSell / 1_000_000} shares`);
  } else {
    console.log(`📉 Shares to sell: ALL shares in position`);
  }
  console.log(`💵 Minimum USDC output: ${minOutput / 1_000_000} USDC`);

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
    // Verify the position exists and belongs to the user
    const positionInfo = await verifyPosition(client, positionId, senderAddress);
    if (!positionInfo) {
      return;
    }
    
    // Sell shares from the position
    await sellSharesFromPosition(client, keypair, positionId, sharesToSell, minOutput, positionInfo);
    
  } catch (error) {
    console.error('❌ Error selling shares:', error);
  }
}

/**
 * Verifies that the position exists and belongs to the user
 * Returns position info if found
 */
async function verifyPosition(
  client: SuiClient,
  positionId: string,
  ownerAddress: string
): Promise<any> {
  console.log(`\n🔍 Verifying position ${positionId}...`);
  
  try {
    const positionObject = await client.getObject({
      id: positionId,
      options: { showContent: true, showOwner: true }
    });
    
    if (!positionObject.data) {
      console.error('❌ Position not found');
      return null;
    }
    
    // Check if this object belongs to the user
    const owner = positionObject.data.owner;
    if (owner && typeof owner === 'object' && 'AddressOwner' in owner) {
      if (owner.AddressOwner !== ownerAddress) {
        console.error(`❌ This position does not belong to you. It belongs to ${owner.AddressOwner}`);
        return null;
      }
    } else {
      console.error('❌ This position is not owned by an address or has unusual ownership structure');
      return null;
    }
    
    // Get position details - in a real app you'd parse the position content to get spread index, market ID, etc.
    const positionInfo = {
      id: positionId,
      // These would normally be extracted from the position object content
      marketId: '', // We'll get this from the transaction event
      spreadIndex: 0, // This would be extracted from position data
      sharesAmount: 0 // This would be extracted from position data
    };
    
    console.log('✅ Position verified');
    return positionInfo;
  } catch (error) {
    console.error('Error verifying position:', error);
    return null;
  }
}

/**
 * Sells shares from a position with a minimum expected output
 */
async function sellSharesFromPosition(
  client: SuiClient, 
  keypair: Ed25519Keypair,
  positionId: string,
  sharesToSell: number,
  minOutput: number,
  positionInfo: any
) {
  console.log('\n💰 Selling shares from position...');
  
  try {
    const txb = new Transaction();
    
    // If sharesToSell is 0, we'll sell all shares in the position
    const sellAllShares = sharesToSell === 0;
    
    // Call the sell_exact_shares_for_min_output function
    const [coinOut] = txb.moveCall({
      target: `${CONSTANTS.PACKAGES.SKEPSIS_MARKET}::distribution_market::sell_exact_shares_for_min_output`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(positionId),
        txb.pure.u64(sellAllShares ? 0 : sharesToSell), // If 0, the contract will sell all shares
        txb.pure.u64(minOutput),
        txb.object(CONSTANTS.OBJECTS.CLOCK),
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
      console.log('\n✅ Successfully sold shares!');
      
      if (result.effects?.created) {
        console.log('\nCreated objects:');
        result.effects.created.forEach((obj: any) => {
          // Look for USDC coin objects
          if (obj.owner.AddressOwner === keypair.getPublicKey().toSuiAddress()) {
            console.log(`- Object created: ${obj.reference.objectId}`);
          }
        });
      }
      
      // Check if the position was deleted (all shares sold)
      if (result.effects?.deleted) {
        const deletedPosition = result.effects.deleted.find((obj: any) => obj.reference.objectId === positionId);
        if (deletedPosition) {
          console.log('\n🔥 Position completely sold and deleted');
        }
      }
      
      // Parse events to get details on the sale
      if (result.events) {
        console.log('\nEvents:');
        result.events.forEach((event: any) => {
          if (event.type.includes('SharesSold')) {
            const parsedEvent = event.parsedJson as any;
            console.log(`- Sold ${Number(parsedEvent?.shares_amount) / 1_000_000} shares`);
            console.log(`- Received ${Number(parsedEvent?.output_amount) / 1_000_000} USDC`);
            
            if (parsedEvent?.market_id) {
              console.log(`- Market: ${parsedEvent.market_id}`);
            }
            
            if (parsedEvent?.spread_index !== undefined) {
              console.log(`- Spread Index: ${parsedEvent.spread_index}`);
            }
          } else {
            console.log(`- ${event.type}`);
          }
        });
      }
      
      // Check user's updated USDC balance
      await checkUserUsdcBalance(client, keypair.getPublicKey().toSuiAddress());
      
    } else {
      console.log('\n❌ Failed to sell shares');
      console.log('Error:', result.effects?.status);
    }
    
  } catch (error) {
    console.error('Error selling shares:', error);
  }
}

/**
 * Checks the USDC balance of an address
 */
async function checkUserUsdcBalance(
  client: SuiClient,
  address: string
): Promise<void> {
  console.log('\n🔍 Checking updated USDC balance...');
  
  try {
    const { data: coins } = await client.getCoins({
      owner: address,
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`
    });
    
    if (coins.length === 0) {
      console.log('⚠️ No USDC coins found in wallet');
      return;
    }
    
    // Calculate total balance across all coins
    const totalBalance = coins.reduce((sum, coin) => sum + Number(coin.balance), 0);
    console.log(`💰 Current USDC balance: ${totalBalance / 1_000_000} USDC`);
    
  } catch (error) {
    console.error('Error checking USDC balance:', error);
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