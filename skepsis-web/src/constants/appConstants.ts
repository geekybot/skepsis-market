/**
 * Application Constants for Skepsis Web
 * 
 * This file contains all constants required by the application for:
 * - Blockchain connection information
 * - Package and module identifiers
 * - Default market IDs
 * - Network configuration
 * - UI settings like colors for visualization
 */

// Blockchain package and module identifiers
export const CONSTANTS = {
  PACKAGES: {
    DISTRIBUTION_MARKET_FACTORY: '0xf8cac7e2af3e186a9821a6df801c2fadbf964403b1ba26757f2571a006d39284',
    USDC: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
  },
  MODULES: {
    DISTRIBUTION_MARKET: 'distribution_market',
    USDC: 'usdc',
  },
  OBJECTS: {
    MARKET: '0xab0a331a405c41c2682b4cd318b22915056fdcf5f8a5f852515ed18d94e3bac9',
    POSITION_REGISTRY: '0x607bb436a792e6302b413b5e9a6edcc4e5f664d576aa4071b6415f1c06d7b971',
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
    marketId: '0xab0a331a405c41c2682b4cd318b22915056fdcf5f8a5f852515ed18d94e3bac9',
    name: 'Will Bitcoin price exceed $100,000 by end of 2025?',
    description: 'Will Bitcoin price exceed $100,000 by end of 2025?'
  },
  {
    marketId: '0xfd45b6a75752d9f4ecd73476c78948c883db927b01667adb2eb9d03fc13f6cd8',
    name: 'What will be temperature in Celcius of Bengaluru on 27May, 2025 2 AM?',
    description: 'What will be temperature in Celcius of Bengaluru on 27May, 2025 2 AM?'
  },
  {
    marketId: '0xe15afe91546fe909fcb58b7ba362f6981001fae3eedf5409dcaae8e325ed5b6f',
    name: 'Who will win the champions leauge in 2025?',
    description: 'Who will win the champions leauge in 2025?'
  },
  {
    marketId: '0x8dc3f6b648e749022b84b9533cda9898884c175534e3eac34dba762c9dec09a3',
    name: 'Who will win the champions leauge in 2025, Between Inter and PSG?',
    description: 'Who will win the champions leauge in 2025?'
  },
  
  // If you add more markets, add them here
  // {
  //   marketId: '0x...',
  //   name: 'Another Market',
  //   description: 'Another market description'
  // },
];

// Network configuration for the application
export const NETWORK_CONFIG = {
  current: 'devnet',
  defaultRpcUrl: NETWORKS.devnet.rpcUrl,
};

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

// For utility functions that need access to these constants
export default {
  CONSTANTS,
  NETWORKS,
  DEFAULT_MARKET_ID,
  MARKETS,
  NETWORK_CONFIG,
  TOKENS,
  SPREAD_COLORS
};