import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getSuiClient, getKeypairFromEnv } from './config/client';
import { CONSTANTS } from './config/constants';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * Competition Markets Creation Script for Sui Overflow 2025
 * 
 * This script creates 9 prediction markets for the Sui Overflow hackathon competition tracks.
 * Each track has projects competing, and users can predict the winners.
 */

interface CompetitionTrack {
  id: string;
  name: string;
  description: string;
  projectCount: number;
  projects: string[]; // Project names for spread labels
}

// Competition tracks data
const COMPETITION_TRACKS: CompetitionTrack[] = [
  {
    id: 'ai',
    name: 'AI Track',
    description: 'AI-powered applications and tools on Sui',
    projectCount: 5,
    projects: ['OpenGraph', 'RaidenX', 'Sui Agent Kit', 'Suithetic', 'Hyvve']
  },
  {
    id: 'cryptography',
    name: 'Cryptography Track',
    description: 'Cryptographic innovations and privacy solutions',
    projectCount: 7,
    projects: ['Sui Sentinel', 'EpochOne E-sign', 'Passman', 'Shroud', 'Mizt', 'ZeroLeaks', 'Sui Shadow']
  },
  {
    id: 'defi',
    name: 'DeFi Track',
    description: 'Decentralized Finance protocols and applications',
    projectCount: 8,
    projects: ['Deeptrade', 'Kamo Finance', 'Magma Finance', 'MizuPay', 'Surge', 'Native', 'Pismo Protocol', 'DeepMaker']
  },
  {
    id: 'degen',
    name: 'Degen Track',
    description: 'Experimental and high-risk applications',
    projectCount: 5,
    projects: ['Moonbags', 'Kensei', 'GachaponClub', 'MFC.CLUB', 'Objection! AI']
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Culture Track',
    description: 'Gaming, entertainment, and cultural applications',
    projectCount: 7,
    projects: ['SWION', 'Sui Battle AR', 'SUIperCHAT', 'Exclusuive', 'Numeron', 'GiveRep', 'Daemon']
  },
  {
    id: 'explorations',
    name: 'Explorations Track',
    description: 'Experimental and exploratory projects',
    projectCount: 5,
    projects: ['MultiChainWalrus', 'Suibotics', 'Skepsis', 'PactDa', 'PredictPlay']
  },
  {
    id: 'infra',
    name: 'Infra & Tooling Track',
    description: 'Infrastructure and developer tooling',
    projectCount: 7,
    projects: ['Noodles FI', 'Large', 'SuiSQL', 'Historical Dev Inspect', 'Sui Provenance Suite', 'Suipulse', 'MicroSui Framework']
  },
  {
    id: 'payments',
    name: 'Payments & Wallets Track',
    description: 'Payment solutions and wallet applications',
    projectCount: 4,
    projects: ['SeaWallet.ai', 'Coindrip', 'PIVY', 'Sui Multisig']
  },
  {
    id: 'storage',
    name: 'Programmable Storage Track',
    description: 'Storage solutions and data management',
    projectCount: 8,
    projects: ['Chatiwal', 'Archimeters', 'Walpress APP', 'Wal0', 'SuiSign', 'SuiMail', 'sui.direct', 'WalGraph']
  }
];

async function main() {
  console.log('🏆 Sui Overflow 2025 Competition Markets Creation Tool');
  console.log(`Creating ${COMPETITION_TRACKS.length} prediction markets for hackathon tracks`);
  
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
  
  // Check balances first
  await checkSuiBalance(client, senderAddress);
  
  // Create markets one by one
  const createdMarkets: Array<{
    trackId: string;
    trackName: string;
    marketId: string;
    liquidityShareId: string;
  }> = [];
  
  for (let i = 0; i < COMPETITION_TRACKS.length; i++) {
    const track = COMPETITION_TRACKS[i];
    console.log(`\n🎯 Creating market ${i + 1}/${COMPETITION_TRACKS.length}: ${track.name}`);
    
    try {
      const result = await createCompetitionMarket(client, keypair, track);
      if (result) {
        createdMarkets.push(result);
        console.log(`✅ Successfully created market for ${track.name}`);
        
        // Wait a bit between transactions to avoid rate limiting
        if (i < COMPETITION_TRACKS.length - 1) {
          console.log('⏳ Waiting 3 seconds before next market creation...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } else {
        console.error(`❌ Failed to create market for ${track.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating market for ${track.name}:`, error);
    }
  }
  
  // Save results to file
  const outputFile = path.join(__dirname, '..', 'competition-markets.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    created: new Date().toISOString(),
    totalMarkets: createdMarkets.length,
    markets: createdMarkets
  }, null, 2));
  
  console.log(`\n📄 Market details saved to: ${outputFile}`);
  console.log(`\n🎉 Competition market creation completed!`);
  console.log(`Successfully created ${createdMarkets.length}/${COMPETITION_TRACKS.length} markets`);
  
  // Print summary
  console.log('\n📊 Created Markets Summary:');
  createdMarkets.forEach(market => {
    console.log(`- ${market.trackName}: ${market.marketId}`);
  });
}

async function createCompetitionMarket(
  client: SuiClient,
  keypair: Ed25519Keypair,
  track: CompetitionTrack
): Promise<{
  trackId: string;
  trackName: string;
  marketId: string;
  liquidityShareId: string;
} | null> {
  
  // Market parameters for competition
  const trackSuffix = track.name.toLowerCase().endsWith('track') ? '' : ' track';
  const question = `Which project will win the ${track.name}${trackSuffix} in Sui Overflow 2025?`;
  const resolutionCriteria = `Based on the official results announced by the Sui Foundation for the ${track.name}${trackSuffix} of Sui Overflow 2025 hackathon. The market will resolve to the project that receives the first place award in this track category.`;
  
  // Competition timeline (7-day prediction period)
  const now = Date.now();
  const resolutionTimeMs = 1750809600000; // 7 days from now
  const biddingDeadlineMs = 1750204800000; // 1 hour before resolution
  
  const marketParams = {
    question,
    resolutionCriteria,
    steps: track.projectCount, // One spread per competing project 5
    lowerBound: 0, // Spread index 0, 0-1,1-2,2-3,3-4, 4-5
    upperBound: track.projectCount, // Spread index for last project 4
    initialLiquidity: 50000_000_000, // 1000 USDC initial liquidity
    resolutionTimeMs,
    biddingDeadlineMs,
  };
  
  console.log(`  📝 Question: ${question}`);
  console.log(`  🏁 Projects: ${track.projectCount} competing projects`);
  console.log(`  💰 Initial liquidity: ${marketParams.initialLiquidity / 1_000_000} USDC`);
  console.log(`  📅 Resolution: ${new Date(resolutionTimeMs).toLocaleString()}`);
  
  try {
    const txb = new Transaction();
    
    // Find user's USDC coin to use for initial liquidity
    const { data: coins } = await client.getCoins({
      owner: keypair.getPublicKey().toSuiAddress(),
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`,
    });
    
    if (coins.length === 0) {
      console.error('  ❌ No USDC coins found for initial liquidity');
      return null;
    }
    
    // Find a suitable coin to split from
    const coinToUse = coins.find(coin => Number(coin.balance) >= marketParams.initialLiquidity);
    
    if (!coinToUse) {
      console.error(`  ❌ No single coin with sufficient balance (${marketParams.initialLiquidity / 1_000_000} USDC) found`);
      return null;
    }
    
    // Split the exact amount needed for the initial liquidity
    const [initialLiquidityCoin] = txb.splitCoins(
      txb.object(coinToUse.coinObjectId),
      [txb.pure.u64(marketParams.initialLiquidity)]
    );
    
    // Create the market
    txb.moveCall({
      target: `${CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY}::distribution_market_factory::create_market_and_add_liquidity`,
      typeArguments: [`${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`],
      arguments: [
        txb.object(CONSTANTS.OBJECTS.FACTORY),
        txb.pure.string(marketParams.question),
        txb.pure.string(marketParams.resolutionCriteria),
        txb.pure.u64(marketParams.steps),
        txb.pure.u64(marketParams.resolutionTimeMs),
        txb.pure.u64(marketParams.biddingDeadlineMs),
        initialLiquidityCoin,
        txb.object(CONSTANTS.OBJECTS.CLOCK),
        txb.pure.u64(marketParams.lowerBound),
        txb.pure.u64(marketParams.upperBound),
      ],
    });
    
    const result = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: txb,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    if (result.effects?.status?.status === 'success') {
      let marketId = '';
      let liquidityShareId = '';
      
      // Extract market ID and liquidity share ID from events
      if (result.events) {
        result.events.forEach((event: any) => {
          if (event.type.includes('MarketCreated') && event.parsedJson) {
            marketId = event.parsedJson.market_id;
          }
          if (event.type.includes('LiquidityAdded') && event.parsedJson) {
            liquidityShareId = event.parsedJson.liquidity_share_id;
          }
        });
      }
      
      // If we couldn't get IDs from events, try to extract from created objects
      if (!marketId && result.effects?.created) {
        marketId = result.effects.created[0]?.reference.objectId || '';
      }
      
      if (marketId) {
        console.log(`  🎯 Market ID: ${marketId}`);
        if (liquidityShareId) {
          console.log(`  🏦 Liquidity Share ID: ${liquidityShareId}`);
        }
        
        return {
          trackId: track.id,
          trackName: track.name,
          marketId,
          liquidityShareId: liquidityShareId || ''
        };
      }
    }
    
    console.error('  ❌ Market creation failed');
    console.error('  Status:', result.effects?.status);
    return null;
    
  } catch (error) {
    console.error('  ❌ Error creating market:', error);
    return null;
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
    
    const totalBalance = suiCoins.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0));
    console.log(`💰 Current SUI balance: ${Number(totalBalance) / 1_000_000_000} SUI`);
    
    // Check USDC balance as well
    const { data: usdcCoins } = await client.getCoins({
      owner: address,
      coinType: `${CONSTANTS.PACKAGES.USDC}::${CONSTANTS.MODULES.USDC}::USDC`
    });
    
    if (usdcCoins.length > 0) {
      const totalUsdcBalance = usdcCoins.reduce((sum, coin) => sum + Number(coin.balance), 0);
      console.log(`💵 Current USDC balance: ${totalUsdcBalance / 1_000_000} USDC`);
      
      const requiredUsdc = COMPETITION_TRACKS.length * 1000; // 1000 USDC per market
      console.log(`💰 Required USDC for all markets: ${requiredUsdc} USDC`);
      
      if (totalUsdcBalance < requiredUsdc * 1_000_000) {
        console.log('⚠️ Warning: May not have enough USDC for all markets. Consider using faucet first.');
      }
    } else {
      console.log('⚠️ No USDC coins found. You may need to use the faucet first.');
    }
    
  } catch (error) {
    console.error('Error checking balances:', error);
  }
}

// Execute the main function
main()
  .then(() => console.log('\n✨ Script completed'))
  .catch((error) => console.error('❌ Script failed:', error));
