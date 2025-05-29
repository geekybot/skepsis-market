// Token configurations for the application

// USDC configuration
export const USDC_CONFIG = {
  // Package and module information
  packageId: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de', // Package ID from provided command
  module: 'faucet', // Module name from provided command
  tokenType: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de::usdc::USDC', // Token type from provided command
  
  // Functions
  faucetFunction: 'airdrop', // Function name from provided command
  
  // Objects
  treasuryCap: '0xa101d25417a108a94b49f68f39adfbcd2e7d882dc039728ff1c0f7d85fca1cca', // Treasury cap object ID from provided command
  
  // Token properties
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin',
  
  // Faucet settings
  faucetAmount: 50_000_000, // 50 USDC with 6 decimals (based on the command description)
  dailyLimit: 500_000_000, // 500 USDC daily limit
};

// Skepsis testnet deployment configuration
export const SKEPSIS_CONFIG = {
  // Packages
  usdc: '0x7c2e2815e1b4d345775fa1494b50625aeabde0a3c49225fa63092367ddb341de',
  
  // Capabilities
  faucet: '0xa101d25417a108a94b49f68f39adfbcd2e7d882dc039728ff1c0f7d85fca1cca',
  dist_upgrade_cap: '0xec4f9b57a1017956eb199b4e754e3f8f2e7d4d2dbf963fa2e9e474cf9e15e8ca',
  dist_admin_cap: '0x4739a65fbd4b174cef360a5c7a7cbdfd28015b86d540de93c80f1c5574d5425f',
  
  // Core contracts
  distribution_market_factory: '0xf8cac7e2af3e186a9821a6df801c2fadbf964403b1ba26757f2571a006d39284',
  user_position_registry: '0x607bb436a792e6302b413b5e9a6edcc4e5f664d576aa4071b6415f1c06d7b971',
  factory: '0xdbe4a824d0f5192874deeb63faa43e6e99cff7fcda7f8187535cc688509b5798',
  liquidity_share: '0xa769385a52146ab77a79a9af118a070476ec393c7e7201ceba840ddb49ffced5',
  
  // Default market ID
  default_market_id: '0xab0a331a405c41c2682b4cd318b22915056fdcf5f8a5f852515ed18d94e3bac9',
};

export const MODULES = {
    DISTRIBUTION_MARKET_FACTORY: 'distribution_market_factory',
    DISTRIBUTION_MARKET: 'distribution_market',
    DISTRIBUTION_AMM: 'distribution_amm',
    FAUCET: 'faucet',
    USDC: 'usdc',
}

// Network configuration
export const NETWORK_CONFIG = {
  isMainnet: false, // Set to true for mainnet deployment
  
  // Explorer URLs
  explorerBaseUrl: 'https://testnet.sui.io',
  mainnetExplorerBaseUrl: 'https://sui.io',
  
  // RPC URLs
  rpcUrl: 'https://fullnode.testnet.sui.io',
  mainnetRpcUrl: 'https://fullnode.mainnet.sui.io',
};

// Transaction utilities
export const getExplorerUrl = (txHash: string): string => {
  const baseUrl = NETWORK_CONFIG.isMainnet ? 
    NETWORK_CONFIG.mainnetExplorerBaseUrl : 
    NETWORK_CONFIG.explorerBaseUrl;
  
  return `${baseUrl}/transaction/${txHash}`;
};