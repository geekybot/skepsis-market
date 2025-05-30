/**
 * Application Constants for Skepsis Web
 * 
 * This file contains all constants required by the application for:
 * - Blockchain connection information
 * - Package and module identifiers
 * - Default market IDs
 * - Network configuration
 * - UI settings like colors for visualization
 * - Token configurations
 * - Skepsis testnet deployment configuration
 */

// Module names for contract calls
export const MODULES = {
  DISTRIBUTION_MARKET_FACTORY: 'distribution_market_factory',
  DISTRIBUTION_MARKET: 'distribution_market',
  DISTRIBUTION_AMM: 'distribution_amm',
  FAUCET: 'faucet',
  USDC: 'usdc',
};

// Blockchain package and module identifiers
export const CONSTANTS = {
  PACKAGES: {
    DISTRIBUTION_MARKET_FACTORY: '0x7b9871542550d47c1d3caaac29c4a1d2ad9527c53f666d813a28be2c8155758e',
    USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
  },
  OBJECTS: {
    MARKET: '0x1b98cae4835709b14e5f182e98552d381b514bb526cb11d1812dc431f4bdaaa7',
    POSITION_REGISTRY: '0x004881fb1b7202d503986585e209638ab0644a2220017be049d1a342803d3080',
    FAUCET: '0xa101d25417a108a94b49f68f39adfbcd2e7d882dc039728ff1c0f7d85fca1cca',
    DIST_UPGRADE_CAP: '0xec4f9b57a1017956eb199b4e754e3f8f2e7d4d2dbf963fa2e9e474cf9e15e8ca',
    DIST_ADMIN_CAP: '0x4739a65fbd4b174cef360a5c7a7cbdfd28015b86d540de93c80f1c5574d5425f',
    FACTORY: '0xe47ed8ac6c57bcf51eed33ccf180bdecbf5b07004b9117bac7cc40898167717f',
    LIQUIDITY_SHARE: '0xa769385a52146ab77a79a9af118a070476ec393c7e7201ceba840ddb49ffced5',
  },
  NETWORK: {
    DEFAULT_SENDER: '0x7d30376fa94aadc2886fb5c7faf217f172e04bee91361b833b4feaab3ca34724',
  }
};

// Network names and RPC URLs
export const NETWORKS = {
  mainnet: {
    name: 'Sui Mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
  },
  testnet: {
    name: 'Sui Testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
  },
  devnet: {
    name: 'Sui Devnet',
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
  },
  localnet: {
    name: 'Sui Localnet',
    rpcUrl: 'http://localhost:9000',
  }
};

// Default market ID for the application
export const DEFAULT_MARKET_ID = CONSTANTS.OBJECTS.MARKET;

// List of all available markets - this can be expanded as more markets are created
// Each market has a unique ID and name for display
export const MARKETS = [
  {
    marketId: '0x1b98cae4835709b14e5f182e98552d381b514bb526cb11d1812dc431f4bdaaa7',
    name: 'What will be the closing price of Bitcoin (BTC) in USD on May 31, 2025?',
    description: 'What will be the closing price of Bitcoin (BTC) in USD on May 31, 2025?'
  }
  
  // If you add more markets, add them here
  // {
  //   marketId: '0x...',
  //   name: 'Another Market',
  //   description: 'Another market description'
  // },
];



// Token configuration
export const TOKENS = {
  USDC: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
    icon: '/images/coins/usdc-icon.png',
  },
  SUI: {
    name: 'SUI',
    symbol: 'SUI',
    decimals: 9,
    icon: '/images/coins/sui-icon.svg',
  },
};

// Color scheme for spread visualization in the bar chart
// Colors are visually distinguishable and suitable for the UI
export const SPREAD_COLORS = [
  "#4E79A7", // blue
  "#F28E2B", // orange
  "#E15759", // red
  "#76B7B2", // teal
  "#59A14F", // green
  "#EDC949", // yellow
  "#AF7AA1", // purple
  "#FF9DA7", // pink
  "#9C755F", // brown
  "#BAB0AC", // gray

  // Additional colors if needed
  "#1F77B4", // deep blue
  "#FF7F0E", // vivid orange
  "#2CA02B", // bright green
  "#D62728", // strong red
  "#9467BD", // violet
  "#8C564B", // earth brown
  "#E377C2", // light magenta
  "#7F7F7F", // mid gray
  "#BCBD22", // lime green
  "#17BECF"  // cyan
];

// USDC configuration 
// Extends TOKENS.USDC with additional configuration for contracts and faucet
export const USDC_CONFIG = {
  // Reference to base token configuration
  ...TOKENS.USDC,
  
  // Package and module information
  packageId: CONSTANTS.PACKAGES.USDC,
  module: 'faucet',
  tokenType: `${CONSTANTS.PACKAGES.USDC}::${MODULES.USDC}::USDC`,
  
  // Functions
  faucetFunction: 'airdrop',
  
  // Objects
  treasuryCap: CONSTANTS.OBJECTS.FAUCET,
  
  // Faucet settings
  faucetAmount: 50_000_000, // 50 USDC with 6 decimals
  dailyLimit: 500_000_000, // 500 USDC daily limit
};

// Network configuration for the application
export const NETWORK_CONFIG = {
  current: 'devnet',
  defaultRpcUrl: NETWORKS.devnet.rpcUrl,
  isMainnet: false, // Set to true for mainnet deployment
  
  // Explorer URLs
  explorerBaseUrl: 'https://testnet.sui.io',
  mainnetExplorerBaseUrl: 'https://sui.io',
  
  // RPC URLs
  rpcUrl: 'https://fullnode.testnet.sui.io',
  mainnetRpcUrl: 'https://fullnode.mainnet.sui.io',
};

// Skepsis testnet deployment configuration
export const SKEPSIS_CONFIG = {
  // Packages
  usdc: CONSTANTS.PACKAGES.USDC,
  
  // Capabilities
  faucet: CONSTANTS.OBJECTS.FAUCET,
  dist_upgrade_cap: CONSTANTS.OBJECTS.DIST_UPGRADE_CAP,
  dist_admin_cap: CONSTANTS.OBJECTS.DIST_ADMIN_CAP,
  
  // Core contracts
  distribution_market_factory: CONSTANTS.PACKAGES.DISTRIBUTION_MARKET_FACTORY,
  user_position_registry: CONSTANTS.OBJECTS.POSITION_REGISTRY,
  factory: CONSTANTS.OBJECTS.FACTORY,
  liquidity_share: CONSTANTS.OBJECTS.LIQUIDITY_SHARE,
  
  // Default market ID
  default_market_id: CONSTANTS.OBJECTS.MARKET,
};

// Market spread metadata - custom names and descriptions for the spreads
export const MARKET_SPREADS_METADATA = {
  // Bitcoin price prediction market
  'What will be the closing price of Bitcoin (BTC) in USD on May 31, 2025?': {
    spreadLabels: [
      { name: "Bear Market", description: "Below expected price range", rangeDescription: "0-10k" },
      { name: "Conservative", description: "Lower price range", rangeDescription: "10k-25k" },
      { name: "Current Range", description: "Around current price levels", rangeDescription: "25k-50k" },
      { name: "Bullish", description: "Higher growth expected", rangeDescription: "50k-75k" },
      { name: "Super Bullish", description: "Strong growth expected", rangeDescription: "75k-100k" },
      { name: "Moon Shot", description: "Exceptional growth", rangeDescription: "100k+" }
    ]
  },
  // Temperature prediction market
  '0xfd45b6a75752d9f4ecd73476c78948c883db927b01667adb2eb9d03fc13f6cd8': {
    spreadLabels: [
      { name: "Freezing", description: "Below freezing point", rangeDescription: "Below 0°C" },
      { name: "Cold", description: "Cold temperature", rangeDescription: "0-10°C" },
      { name: "Cool", description: "Cool temperature", rangeDescription: "10-20°C" },
      { name: "Mild", description: "Mild temperature", rangeDescription: "20-25°C" },
      { name: "Warm", description: "Warm temperature", rangeDescription: "25-30°C" },
      { name: "Hot", description: "Hot temperature", rangeDescription: "30-35°C" },
      { name: "Very Hot", description: "Very hot temperature", rangeDescription: "Above 35°C" }
    ]
  },
  // Champions League winner market
  '0xe15afe91546fe909fcb58b7ba362f6981001fae3eedf5409dcaae8e325ed5b6f': {
    spreadLabels: [
      { name: "Manchester City", description: "English Premier League", rangeDescription: "Spread 0" },
      { name: "Real Madrid", description: "La Liga", rangeDescription: "Spread 1" },
      { name: "Bayern Munich", description: "Bundesliga", rangeDescription: "Spread 2" },
      { name: "Liverpool", description: "English Premier League", rangeDescription: "Spread 3" },
      { name: "PSG", description: "Ligue 1", rangeDescription: "Spread 4" },
      { name: "Barcelona", description: "La Liga", rangeDescription: "Spread 5" },
      { name: "Other", description: "Other teams", rangeDescription: "Spread 6" }
    ]
  },
  // Champions League Inter vs PSG market
  '0x8dc3f6b648e749022b84b9533cda9898884c175534e3eac34dba762c9dec09a3': {
    spreadLabels: [
      { name: "Inter Milan Win", description: "Serie A team wins", rangeDescription: "Spread 0" },
      { name: "Draw", description: "Match ends in draw", rangeDescription: "Spread 1" },
      { name: "PSG Win", description: "Ligue 1 team wins", rangeDescription: "Spread 2" }
    ]
  }
};

// Transaction utilities
export const getExplorerUrl = (txHash: string): string => {
  const baseUrl = NETWORK_CONFIG.isMainnet ? 
    NETWORK_CONFIG.mainnetExplorerBaseUrl : 
    NETWORK_CONFIG.explorerBaseUrl;
  
  return `${baseUrl}/transaction/${txHash}`;
};

// For utility functions that need access to these constants
export default {
  CONSTANTS,
  NETWORKS,
  DEFAULT_MARKET_ID,
  MARKETS,
  MARKET_SPREADS_METADATA,
  NETWORK_CONFIG,
  TOKENS,
  SPREAD_COLORS,
  USDC_CONFIG,
  SKEPSIS_CONFIG,
  MODULES
};