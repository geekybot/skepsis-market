/**
 * Automated deployment and setup script for skepsis_market modules.
 * Order: publish -> initialize_factory -> create_market_and_add_liquidity
 *
 * Usage: ts-node scripts/src/deploy.ts
 */
import { execSync } from 'child_process';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';
dotenv.config();

// Helper to run shell commands and parse JSON output
function runCmd(cmd: string): any {
  try {
    const output = execSync(cmd, { encoding: 'utf-8' });
    return output;
  } catch (e: any) {
    console.error('Command failed:', cmd);
    console.error(e.stdout || e.message);
    process.exit(1);
  }
}

async function main() {
  // 1. Publish the Move module and get admin cap
  console.log('Publishing Move module...');
  const publishOut = runCmd(
    'sui client publish --json --gas-budget 1000000000 /Users/split/Desktop/projects/skepsis/packages/skepsis_market/sources/distribution_market_factory.move'
  );
  console.log(publishOut);
  const publishJson = JSON.parse(publishOut);
  const adminCapObj = publishJson.objectChanges.find((o: any) => o.objectType && o.objectType.includes('AdminCap'));
  if (!adminCapObj) throw new Error('AdminCap not found in publish output');
  const adminCapId = adminCapObj.objectId;
  const published = publishJson.objectChanges.find((o: any) => o.type === 'published');
  const packageId = published?.packageId;
  if (!packageId) throw new Error('PackageId not found in publish output');
  
  // Find the UserPositionRegistry object
  const positionRegistryObj = publishJson.objectChanges.find(
    (o: any) => o.objectType && o.objectType.includes('UserPositionRegistry')
  );
  const positionRegistryId = positionRegistryObj?.objectId;

  console.log('AdminCap:', adminCapId, 'Package:', packageId);
  console.log('UserPositionRegistry:', positionRegistryId || 'Not found');

  console.log('PackageId:', packageId); // Log for user inspection

  // Wait for user approval before proceeding
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));
  let answer = await ask('Proceed with initializing factory? (Y/N): ');
  if (answer.trim().toLowerCase() !== 'y') {
    rl.close();
    process.exit(0);
  }

  // 2. Initialize the factory using Sui client
  const client = getSuiClient();
  const keypair = getKeypairFromEnv();
  if (!keypair) throw new Error('No keypair found. Set SUI_PRIVATE_KEY in your .env file.');
  const senderAddress = keypair.getPublicKey().toSuiAddress();
  console.log(`Using address: ${senderAddress}`);

  console.log('Initializing factory (JS)...');
  const txb1 = new Transaction();
  txb1.setSender(senderAddress);
  txb1.moveCall({
    target: `${packageId}::distribution_market_factory::initialize_factory`,
    typeArguments: ['0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de::usdc::USDC'],
    arguments: [txb1.object(adminCapId)],
  });
  const { bytes: bytes1, signature: sig1 } = await txb1.sign({ signer: keypair, client });
  const result1 = await client.executeTransactionBlock({
    transactionBlock: bytes1,
    signature: sig1,
    options: { showObjectChanges: true },
  });
  const factoryObj = result1.objectChanges?.find((o: any) => o.objectType && o.objectType.includes('Factory'));
  const factoryId = factoryObj?.type === 'created' || factoryObj?.type === 'mutated' ? factoryObj.objectId : undefined;
  if (!factoryId) throw new Error('Factory objectId not found');
  console.log('FactoryId:', factoryId);

  // After initializing factory, print and ask for approval before next step
  console.log('FactoryId:', factoryId); // Log for user inspection
  answer = await ask('Proceed with creating market and adding liquidity? (Y/N): ');
  if (answer.trim().toLowerCase() !== 'y') {
    rl.close();
    process.exit(0);
  }

  // 3. Create market and add liquidity using Sui client (following create-market.ts pattern)
  // Build market parameters
  const marketParams = {
    question: "Will Bitcoin price exceed $100,000 by end of 2025?",
    resolutionCriteria: "Based on the closing price on December 31st, 2025 as reported by CoinGecko",
    steps: 10,
    lowerBound: 0,
    upperBound: 100,
    initialLiquidity: 1000_000_000, // 1000 USDC
    resolutionTimeMs: Date.now() + 30 * 60 * 1000, // 30 minutes from now
    biddingDeadlineMs: Date.now() + 25 * 60 * 1000, // 25 minutes from now
  };
  console.log('\n📊 Market Parameters:');
  console.log(`Question: ${marketParams.question}`);
  console.log(`Resolution Criteria: ${marketParams.resolutionCriteria}`);
  console.log(`Number of buckets/spreads: ${marketParams.steps}`);
  console.log(`Value range: ${marketParams.lowerBound} - ${marketParams.upperBound}`);
  console.log(`Initial liquidity: ${marketParams.initialLiquidity / 1_000_000} USDC`);
  console.log(`Resolution time: ${new Date(marketParams.resolutionTimeMs).toLocaleString()}`);
  console.log(`Bidding deadline: ${new Date(marketParams.biddingDeadlineMs).toLocaleString()}`);

  // Check USDC balance and select coin for initial liquidity
  const { data: coins } = await client.getCoins({
    owner: senderAddress,
    coinType: `${CONSTANTS.PACKAGES.USDC}::usdc::USDC`,
  });
  if (!coins || coins.length === 0) {
    console.error('❌ No USDC coins found for initial liquidity');
    rl.close();
    process.exit(1);
  }
  const coinToUse = coins.find(coin => Number(coin.balance) >= marketParams.initialLiquidity);
  if (!coinToUse) {
    console.error(`❌ No single coin with sufficient balance (${marketParams.initialLiquidity / 1_000_000} USDC) found`);
    coins.forEach(coin => {
      console.log(`- ${coin.coinObjectId}: ${Number(coin.balance) / 1_000_000} USDC`);
    });
    rl.close();
    process.exit(1);
  }
  console.log(`💰 Using coin ${coinToUse.coinObjectId} with balance ${Number(coinToUse.balance) / 1_000_000} USDC`);

  // Split the exact amount needed for the initial liquidity
  const txb2 = new Transaction();
  txb2.setSender(senderAddress); // Ensure sender is set
  const [initialLiquidityCoin] = txb2.splitCoins(
    txb2.object(coinToUse.coinObjectId),
    [txb2.pure.u64(marketParams.initialLiquidity)]
  );

  // Call the create_market_and_add_liquidity function
  txb2.moveCall({
    target: `${packageId}::distribution_market_factory::create_market_and_add_liquidity`,
    typeArguments: [`${CONSTANTS.PACKAGES.USDC}::usdc::USDC`],
    arguments: [
      txb2.object(adminCapId), // AdminCap parameter
      txb2.object(factoryId), // Factory parameter
      txb2.pure.string(marketParams.question),
      txb2.pure.string(marketParams.resolutionCriteria),
      txb2.pure.u64(marketParams.steps),
      txb2.pure.u64(marketParams.resolutionTimeMs),
      txb2.pure.u64(marketParams.biddingDeadlineMs),
      initialLiquidityCoin,
      txb2.object('0x6'), // CLOCK object
      txb2.pure.u64(marketParams.lowerBound),
      txb2.pure.u64(marketParams.upperBound),
    ],
  });
  const { bytes: bytes2, signature: sig2 } = await txb2.sign({ signer: keypair, client });
  const result2 = await client.executeTransactionBlock({
    transactionBlock: bytes2,
    signature: sig2,
    options: { showObjectChanges: true },
  });
  const liquidityShare = result2.objectChanges?.find((o: any) => (o.type === 'created' || o.type === 'mutated') && o.objectType && o.objectType.includes('LiquidityShare'));
  const marketObj = result2.objectChanges?.find((o: any) => (o.type === 'created' || o.type === 'mutated') && o.objectType && o.objectType.includes('Market'));
  
  // Use 'as any' to avoid TypeScript errors or properly type the objects
  const liquidityShareId = liquidityShare ? (liquidityShare as any).objectId : null;
  const marketId = marketObj ? (marketObj as any).objectId : null;
  
  if (liquidityShareId) {
    console.log('LiquidityShare:', liquidityShareId);
  } else {
    console.log('LiquidityShare: not found or missing objectId');
  }
  
  if (marketId) {
    console.log('MarketId:', marketId);
    
    // Create deployment info JSON with all important objects and package IDs
    const fs = require('fs');
    const path = require('path');
    const deploymentInfo = {
      deployment_date: new Date().toISOString(),
      network: process.env.SUI_NETWORK || 'devnet',
      packages: {
        distribution_market_factory: packageId,
        usdc: CONSTANTS.PACKAGES.USDC
      },
      objects: {
        factory: factoryId,
        market: marketId,
        admin_cap: adminCapId,
        liquidity_share: liquidityShareId,
        position_registry: positionRegistryId || null
      },
      market_params: {
        ...marketParams,
        resolution_time: new Date(marketParams.resolutionTimeMs).toISOString(),
        bidding_deadline: new Date(marketParams.biddingDeadlineMs).toISOString(),
        initial_liquidity_usdc: marketParams.initialLiquidity / 1_000_000
      }
    };
    
    // Ensure scripts directory exists
    const outputDir = path.join(__dirname, '../');
    const outputPath = path.join(outputDir, 'deployment-info.json');
    
    // Write the JSON file
    fs.writeFileSync(
      outputPath, 
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\n✅ Deployment info written to ${outputPath}`);
    
    // Also update constants.ts with the new information
    try {
      const constantsPath = path.join(__dirname, 'config', 'constants.ts');
      let constantsContent = fs.readFileSync(constantsPath, 'utf8');
      
      // Create updated constants content
      const updatedConstants = `export const CONSTANTS = {
  PACKAGES: {
    DISTRIBUTION_MARKET_FACTORY: '${packageId}',
    USDC: '${CONSTANTS.PACKAGES.USDC}'
  },
  MODULES: {
    DISTRIBUTION_MARKET_FACTORY: 'distribution_market_factory',
    DISTRIBUTION_MARKET: 'distribution_market',
    DISTRIBUTION_MATH: 'distribution_math',
    USDC: 'usdc'
  },
  OBJECTS: {
    FACTORY: '${factoryId}',
    MARKET: '${marketId}',
    ADMIN_CAP: '${adminCapId}',
    LIQUIDITY_SHARE: '${liquidityShareId || ''}',
    POSITION_REGISTRY: '${positionRegistryId || ''}'
  }
};
`;
      
      // Write updated constants file
      fs.writeFileSync(constantsPath, updatedConstants);
      console.log(`✅ Constants updated in ${constantsPath}`);
    } catch (error) {
      console.error('Failed to update constants.ts:', error);
    }
  } else {
    console.log('MarketId: not found or missing objectId');
  }
  rl.close();
}

main().catch((e) => console.error(e));