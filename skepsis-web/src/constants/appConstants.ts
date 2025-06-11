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

import { MARKET_DETAILS } from "./marketDetails";

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
    MARKET: '0x88380bd613be8b11c04daab2dbd706e18f9067db5fa5139f3b92030c960bbf7e',
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

// List of all available markets - derived from MARKET_DETAILS in marketDetails.ts
// This keeps a simpler reference and avoids duplication of market data
export const MARKETS = Object.keys(MARKET_DETAILS).map(marketId => ({
  marketId,
  // Extract basic info from MARKET_DETAILS for backwards compatibility
  name: MARKET_DETAILS[marketId].question,
  description: MARKET_DETAILS[marketId].resolutionCriteria
}));



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

// Google Analytics and GTM configuration
export const ANALYTICS_CONFIG = {
  // Google Tag Manager ID from environment variable
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || '',

  // Enable/disable analytics based on environment and if GTM ID exists
  enabled: !!process.env.NEXT_PUBLIC_GTM_ID, // Only enable if GTM ID is provided

  // Additional analytics settings
  options: {
    debug: process.env.NODE_ENV === 'development',
    send_page_view: true,
  },
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
  NETWORK_CONFIG,
  TOKENS,
  SPREAD_COLORS,
  USDC_CONFIG,
  SKEPSIS_CONFIG,
  MODULES,
  ANALYTICS_CONFIG
};