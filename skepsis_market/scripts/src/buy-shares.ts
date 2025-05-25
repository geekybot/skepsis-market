import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Buy Shares Script for Skepsis Market Protocol
 * 
 * This script demonstrates how to buy an exact amount of shares from a specific spread
 * with a maximum input price limit.
 */
async function main() {
  console.log('🛒 Skepsis Market - Buy Shares Tool');

  // Use marketId from constants
  const marketId = CONSTANTS.OBJECTS.MARKET;
  // Get command line arguments: [spreadIndex] [sharesAmount]
  const spreadIndex = process.argv[2] ? Number(process.argv[2]) : 0;
  const sharesAmount = process.argv[3] ? Number(process.argv[3]) : 1_000_000; // Default 1 share (6 decimals)

  console.log(`📊 Target Market: ${marketId}`);
  console.log(`📈 Spread Index: ${spreadIndex}`);
  console.log(`🎫 Shares to buy: ${sharesAmount / 1_000_000} shares`);

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
    // Calculate required USDC for the purchase
    const maxUsdcInput = await getBuyQuote(client, marketId, spreadIndex, sharesAmount);
    console.log(`💵 Required USDC input: ${maxUsdcInput / 1_000_000} USDC`);

    // Check if user has enough USDC before proceeding
    const hasEnoughCoins = await checkUserUsdcBalance(client, senderAddress, maxUsdcInput);
    if (!hasEnoughCoins) {
      console.log('\n⚠️ You may need to get USDC tokens from the faucet first.');
      console.log('Run the USDC faucet script or uncomment the getUsdcFromFaucet() call in this script.');
      return;
    }

    // Verify the market exists and get spread info
    const marketExists = await verifyMarketAndSpread(client, marketId, spreadIndex);
    if (!marketExists) {
      return;
    }

    // Buy shares from the market
    await buySharesFromMarket(client, keypair, marketId, spreadIndex, sharesAmount, maxUsdcInput);
  } catch (error) {
    console.error('❌ Error buying shares:', error);
  }
}

/**
 * Verifies that the market exists and the spread index is valid
 */
async function verifyMarketAndSpread(
  client: SuiClient,
  marketId: string,
  spreadIndex: number
): Promise<boolean> {
  console.log(`\n🔍 Verifying market ${marketId} and spread index ${spreadIndex}...`);
  
  try {
    const marketObject = await client.getObject({
      id: marketId,
      options: { showContent: true }
    });
    
    if (!marketObject.data) {
      console.error('❌ Market not found');
      return false;
    }
    
    // Verify the market isn't expired
    const currentTimestamp = Date.now();
    
    // TODO: extract actual market deadline if needed
    // For now we just verify the object exists
    
    console.log('✅ Market verified');
    return true;
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
 * Buys exact shares from a market with a maximum input limit
 */
async function buySharesFromMarket(
  client: SuiClient, 
  keypair: Ed25519Keypair,
  marketId: string,
  spreadIndex: number,
  sharesAmount: number,
  maxUsdcInput: number
) {
  console.log('\n🛍️ Buying shares from market...');
  
  try {
    const txb = new Transaction();
    
    // Find user's USDC coin to use for purchase
    const { data: coins } = await client.getCoins({
      owner: keypair.getPublicKey().toSuiAddress(),
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`,
    });
    
    if (coins.length === 0) {
      console.error('❌ No USDC coins found for purchase');
      return;
    }
    
    // Find a suitable coin to split from
    const coinToUse = coins.find(coin => Number(coin.balance) >= maxUsdcInput);
    
    if (!coinToUse) {
      console.error(`❌ No single coin with sufficient balance (${maxUsdcInput / 1_000_000} USDC) found`);
      console.log('Available coins:');
      coins.forEach(coin => {
        console.log(`- ${coin.coinObjectId}: ${Number(coin.balance) / 1_000_000} USDC`);
      });
      return;
    }
    
    console.log(`💰 Using coin ${coinToUse.coinObjectId} with balance ${Number(coinToUse.balance) / 1_000_000} USDC`);
    
    // Split the max amount needed for the purchase
    const [paymentCoin] = txb.splitCoins(
      txb.object(coinToUse.coinObjectId),
      [txb.pure.u64(maxUsdcInput)]
    );
    
    const positionRegistry = CONSTANTS.OBJECTS.POSITION_REGISTRY;
    
    // Call the buy_exact_shares_with_max_input function
    const [shareOut, coinReturn] = txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::distribution_market::buy_exact_shares_with_max_input`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(positionRegistry),
        txb.object(marketId),
        txb.pure.u64(spreadIndex),
        txb.pure.u64(sharesAmount),
        paymentCoin,
        txb.object('0x6'),
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
      console.log('\n✅ Successfully bought shares!');
      
      if (result.effects?.created) {
        console.log('\nCreated objects:');
        result.effects.created.forEach((obj: any) => {
          // Check if this is a position NFT
          if (obj.owner.AddressOwner === keypair.getPublicKey().toSuiAddress()) {
            console.log(`- Position ID: ${obj.reference.objectId}`);
          } else {
            console.log(`- ${obj.reference.objectId}`);
          }
        });
      }
      
      if (result.events) {
        console.log('\nEvents:');
        result.events.forEach((event: any) => {
          if (event.type.includes('SharesPurchased')) {
            const parsedEvent = event.parsedJson as any;
            console.log(`- Purchased ${Number(parsedEvent?.shares_amount) / 1_000_000} shares`);
            console.log(`- Paid ${Number(parsedEvent?.payment_amount) / 1_000_000} USDC`);
            if (parsedEvent?.refund_amount) {
              console.log(`- Refunded ${Number(parsedEvent?.refund_amount) / 1_000_000} USDC`);
            }
          } else {
            console.log(`- ${event.type}`);
          }
        });
      }
    } else {
      console.log('\n❌ Failed to buy shares');
      console.log('Error:', result.effects?.status);
    }
    
  } catch (error) {
    console.error('Error buying shares:', error);
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

/**
 * Gets the buy quote for a given market, spread index, and shares amount
 */
async function getBuyQuote(client: SuiClient, marketId: string, spreadIndex: number, sharesAmount: number): Promise<number> {
  // Calls the on-chain get_buy_quote function and returns the required USDC (in 6 decimals)
  const tx = new Transaction();
  tx.moveCall({
    target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::${CONSTANTS.MODULES.DISTRIBUTION_MARKET}::get_buy_quote`,
    typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
    arguments: [
      tx.object(marketId),
      tx.pure.u64(spreadIndex),
      tx.pure.u64(sharesAmount*1_000_000), // Convert shares to 6 decimals
    ],
  });
  console.log('DEBUG: getBuyQuote args', { marketId, spreadIndex, sharesAmount });
  const response = await client.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724',
  });
  console.log('DEBUG: devInspect response', JSON.stringify(response, null, 2));
  if (response.results && response.results[0] && response.results[0].returnValues && response.results[0].returnValues[0]) {
    const quoteBytes = response.results[0].returnValues[0][0];
    let quote = 0;
    for (let i = 0; i < Math.min(quoteBytes.length, 8); i++) {
      quote += quoteBytes[i] * Math.pow(256, i);
    }
    return quote;
  }
  throw new Error('Failed to get buy quote');
}

// Execute the main function
main()
  .then(() => console.log('\n✨ Script completed'))
  .catch((error) => console.error('❌ Script failed:', error));